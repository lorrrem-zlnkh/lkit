#!/usr/bin/env node
// Парсер терминов для Lkit — самостоятельный инструмент (не связан с каталогом/дайджестом).
//
// Поток: fetch источника → распарсить пары «термин + исходное определение»
//       → отфильтровать те, что уже есть в словаре (дедуп по нормализованному термину)
//       → LLM переписывает определение своими словами в нашем стиле
//       → добавить запись {id, term, definition, letter, source, addedAt} в СУЩЕСТВУЮЩИЙ словарь
//         (append + дедуп, без перезаписи имеющихся статей).
//
// Запуск:
//   node scripts/parser/parse_terms.mjs --dry-run --no-llm        # только парсинг+дедуп, без записи
//   node scripts/parser/parse_terms.mjs --dry-run --limit 5       # с LLM, но без записи (нужен ключ)
//   ANTHROPIC_API_KEY=... node scripts/parser/parse_terms.mjs     # полный прогон с записью в словарь
//   node scripts/parser/parse_terms.mjs --source "Жаргон"         # только источники, чьё имя содержит строку
//
// Флаги: --dry-run (не писать в файл), --no-llm (не переписывать, взять сырое определение),
//        --limit N (не более N новых терминов за прогон), --source <substr> (фильтр источников).
import fs from "node:fs/promises";
import path from "node:path";
import * as cheerio from "cheerio";
import { SOURCES, FILTERS } from "./sources.config.mjs";
import { getLLM } from "./llm.mjs";

const DICT_PATH = path.resolve("site/dictionary-data.js");
const UA = "LkitTermParser/1.0 (https://github.com/lorrrem-zlnkh/lkit; dictionary tooling)";

// --- аргументы ---
const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const getOpt = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
const DRY_RUN = has("--dry-run");
const NO_LLM = has("--no-llm");
const LIMIT = getOpt("--limit") ? parseInt(getOpt("--limit"), 10) : Infinity;
const SRC_FILTER = getOpt("--source");

// --- словарь: загрузка ---
const raw = await fs.readFile(DICT_PATH, "utf8");
const dict = JSON.parse(raw.replace(/^window\.DICTIONARY_DATA\s*=\s*/, "").replace(/;\s*$/, ""));

// нормализация термина для дедупа: нижний регистр, ё→е, без «(…)»-хвоста и кавычек
function normTerm(t) {
  return String(t)
    .toLowerCase()
    .replace(/ё/g, "е")
    .split("(")[0]
    .replace(/[«»"'`]/g, "")
    .replace(/[^a-zа-я0-9 +#/.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const existingNorm = new Set(dict.map((e) => normTerm(e.term)));
const usedIds = new Set(dict.map((e) => e.id));

// id из первого слова (как в build_dictionary.mjs), с дедупом по всему словарю
function makeId(term) {
  const clean = term.replace(/\s*\(.*/, "").trim();
  const firstWord = clean.split(/[\s-]/)[0];
  return firstWord.toLowerCase().replace(/[^а-яёa-z0-9]/g, "") || "term";
}
function uniqueId(term) {
  const base = makeId(term);
  if (!usedIds.has(base)) { usedIds.add(base); return base; }
  let i = 2;
  while (usedIds.has(base + i)) i++;
  usedIds.add(base + i);
  return base + i;
}

// буква-рубрика: первая буква термина (кириллица/латиница), иначе «#»
function letterOf(term) {
  const c = (term.trim()[0] || "").toUpperCase();
  if (/[А-ЯЁ]/.test(c)) return c;
  if (/[A-Z]/.test(c)) return c;
  return "#";
}

// --- источники: загрузка HTML (с ретраями и бэкоффом на 429) ---
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchText(url, headers, { tries = 4 } = {}) {
  let delay = 1500;
  for (let attempt = 1; attempt <= tries; attempt++) {
    const res = await fetch(url, { headers });
    const body = await res.text();
    if (res.status === 429 || /too many requests/i.test(body)) {
      if (attempt === tries) throw new Error("rate limit (429) — попробуй позже");
      await sleep(delay); delay *= 2; continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return body;
  }
}

async function fetchWikipedia(page, lang) {
  const url = `https://${lang}.wikipedia.org/w/api.php?action=parse&format=json&formatversion=2&prop=text&redirects=1&page=${encodeURIComponent(page)}`;
  const body = await fetchText(url, { "User-Agent": UA, "Accept": "application/json" });
  const json = JSON.parse(body);
  if (json.error) throw new Error(`wiki ${page}: ${json.error.code}`);
  return json.parse.text;
}
async function fetchUrl(url) {
  return fetchText(url, { "User-Agent": UA });
}
async function fetchJson(url) {
  return JSON.parse(await fetchText(url, { "User-Agent": UA, "Accept": "application/json" }));
}

// Викисловарь: слова из категории (только основное пространство имён).
async function wiktionaryMembers(category, lang) {
  const members = [];
  let cont = "";
  do {
    const url = `https://${lang}.wiktionary.org/w/api.php?action=query&list=categorymembers&cmtitle=${encodeURIComponent("Категория:" + category)}&cmnamespace=0&cmlimit=200&format=json${cont}`;
    const j = await fetchJson(url);
    for (const m of j.query.categorymembers) members.push(m.title);
    cont = j.continue ? `&cmcontinue=${encodeURIComponent(j.continue.cmcontinue)}` : "";
    if (cont) await sleep(700);
  } while (cont);
  return members;
}

// Викисловарь: берём из секции «Значение» только IT-помеченные значения
// (комп., информ., прогр., интернет, …). Если таких нет — вернём "" (слово пропустим).
const IT_LABEL = /(^|[\s(])(комп\.|информ\.|прогр\.|программир|интернет|сетев|вычислит|айти)/i;
async function wiktionaryDef(title, lang) {
  const url = `https://${lang}.wiktionary.org/w/api.php?action=parse&format=json&formatversion=2&prop=text&page=${encodeURIComponent(title)}`;
  const j = JSON.parse(await fetchText(url, { "User-Agent": UA }));
  if (j.error) return "";
  const $ = cheerio.load(j.parse.text);
  $("sup.reference, .mw-editsection").remove();
  const h = $('[id="Значение"]').first();
  if (!h.length) return "";
  const cont = h.closest(".mw-heading");
  const ol = (cont.length ? cont : h).nextAll("ol").first();
  if (!ol.length) return "";
  const itSenses = [];
  ol.children("li").each((_, li) => {
    let t = cleanText($(li).text());
    t = t.split("◆")[0].split("Данное толкование")[0].trim(); // отрезаем примеры и служебные пометки
    if (t && IT_LABEL.test(t)) itSenses.push(t.replace(/^(комп\.|информ\.|прогр\.|жарг\.|неол\.|техн\.|[,\s.])+/i, "").trim());
  });
  return itSenses.slice(0, 2).join(". ");
}

// --- извлечение пар «термин + определение» ---
function cleanText(s) {
  return String(s).replace(/\[\d+\]/g, "").replace(/\[править[^\]]*\]/gi, "").replace(/\s+/g, " ").trim();
}

function extractPairs(html, strategy, selector) {
  const $ = cheerio.load(html);
  // выкидываем служебное
  $("sup.reference, .mw-editsection, style, .navbox, table.navbox, .reflist, .mw-empty-elt").remove();
  const root = selector ? $(selector) : $.root();
  const pairs = [];

  if (strategy === "dl") {
    $(root).find("dt").each((_, dt) => {
      const term = cleanText($(dt).text());
      let parts = [];
      let dd = $(dt).next();
      while (dd.length && dd[0].tagName === "dd") {
        parts.push(cleanText(dd.text()));
        dd = dd.next();
      }
      const def = parts.join(" ").trim();
      if (term && def) pairs.push({ term, def });
    });
  } else if (strategy === "list-dash") {
    // пункты списка вида «Термин — определение» (тире —, –, -, :)
    $(root).find("li").each((_, li) => {
      const text = cleanText($(li).text());
      const m = text.match(/^(.{2,60}?)\s*[—–:-]\s+(.{20,})$/);
      if (m) pairs.push({ term: m[1].trim(), def: m[2].trim() });
    });
  } else if (strategy === "table") {
    $(root).find("tr").each((_, tr) => {
      const cells = $(tr).find("td");
      if (cells.length >= 2) {
        const term = cleanText($(cells[0]).text());
        const def = cleanText($(cells[1]).text());
        if (term && def) pairs.push({ term, def });
      }
    });
  }
  return pairs;
}

function termLooksOk(term) {
  if (term.length < FILTERS.minTermLen || term.length > FILTERS.maxTermLen) return false;
  if (!/[a-zа-яё]/i.test(term)) return false;          // в термине должна быть хотя бы одна буква
  if (term.split(/\s+/).length > FILTERS.maxTermWords) return false; // не словосочетание-заголовок
  if (/[.;,]$/.test(term)) return false;               // не должен оканчиваться на пунктуацию (обрывок/ссылка)
  if (/[-‑]$/.test(term)) return false;                // фрагмент-приставка вроде «Интернет-»
  if (/[«»"]/.test(term)) return false;                // кавычки — обычно фраза-заголовок, а не термин
  if (/\/\/|\d{4}|с\.\s*\d/i.test(term)) return false; // признаки библиографической ссылки
  return true;
}
function passesFilters({ term, def }) {
  return termLooksOk(term) && def.length >= FILTERS.minDefLen;
}

// --- основной поток ---
const llm = NO_LLM ? null : getLLM();
if (!NO_LLM && !llm) {
  console.error("LLM-провайдер не найден (нет ANTHROPIC_API_KEY / OPENAI_API_KEY). Запусти с --no-llm или задай ключ.");
  process.exit(1);
}

console.log(`Словарь: ${dict.length} статей. LLM: ${llm ? llm.name : "выключен (--no-llm)"}.${DRY_RUN ? " РЕЖИМ DRY-RUN (без записи)." : ""}`);

const sources = SOURCES.filter((s) => !SRC_FILTER || s.name.toLowerCase().includes(SRC_FILTER.toLowerCase()));
const seenThisRun = new Set();      // дедуп внутри прогона (термин может повторяться в разных источниках)
const newEntries = [];
let scanned = 0, dupSkipped = 0, filtered = 0;

// общий шаг: фильтр → дедуп → LLM-переписывание → добавление записи
async function tryAdd(term, rawDef, srcName) {
  scanned++;
  if (!passesFilters({ term, def: rawDef })) { filtered++; return; }
  const key = normTerm(term);
  if (!key) { filtered++; return; }
  if (existingNorm.has(key) || seenThisRun.has(key)) { dupSkipped++; return; }
  seenThisRun.add(key);

  let definition = rawDef;
  if (llm) {
    try {
      definition = await llm.rewrite(term, rawDef);
      if (!definition) { console.error(`    ! пустой ответ LLM для «${term}» — пропуск`); return; }
    } catch (e) {
      console.error(`    ! LLM ошибка на «${term}»: ${e.message} — пропуск`);
      return;
    }
  }

  const displayTerm = term.charAt(0).toUpperCase() + term.slice(1); // термины в словаре с заглавной
  const entry = {
    id: uniqueId(displayTerm),
    term: displayTerm,
    definition,
    letter: letterOf(displayTerm),
    source: srcName,
    addedAt: new Date().toISOString().slice(0, 10),
  };
  newEntries.push(entry);
  console.log(`    + ${entry.term}  {${entry.id}, ${entry.letter}}`);
  if (DRY_RUN || llm) console.log(`      → ${definition.slice(0, 160)}${definition.length > 160 ? "…" : ""}`);
}

for (const src of sources) {
  if (newEntries.length >= LIMIT) break;

  // --- Викисловарь: категория → слова → IT-значение из секции «Значение» ---
  if (src.type === "wiktionary-category") {
    let members;
    try { members = await wiktionaryMembers(src.category, src.lang); }
    catch (e) { console.error(`  ✗ ${src.name}: ${e.message}`); continue; }
    console.log(`\n— ${src.name}: ${members.length} слов в категории`);
    for (const term of members) {
      if (newEntries.length >= LIMIT) break;
      // дешёвые проверки и дедуп ДО запроса определения (экономим запросы)
      if (!termLooksOk(term)) { filtered++; continue; }
      const key = normTerm(term);
      if (!key || existingNorm.has(key) || seenThisRun.has(key)) { dupSkipped++; continue; }
      let rawDef = "";
      try { rawDef = await wiktionaryDef(term, src.lang); } catch {}
      await sleep(600);
      if (!rawDef) { filtered++; continue; } // нет IT-значения — не наш термин
      await tryAdd(term, rawDef, src.name);
    }
    continue;
  }

  // --- Wikipedia / произвольный URL: HTML → пары по стратегии ---
  let html;
  try {
    html = src.type === "wikipedia" ? await fetchWikipedia(src.page, src.lang) : await fetchUrl(src.url);
  } catch (e) {
    console.error(`  ✗ ${src.name}: ${e.message}`);
    continue;
  }
  const pairs = extractPairs(html, src.parse, src.selector);
  console.log(`\n— ${src.name}: извлечено ${pairs.length} пар`);
  await sleep(1200); // вежливая пауза между источниками
  for (const pair of pairs) {
    if (newEntries.length >= LIMIT) break;
    await tryAdd(pair.term, pair.def, src.name);
  }
}

console.log(`\nИтог: просмотрено ${scanned}, отфильтровано ${filtered}, уже в словаре/повтор ${dupSkipped}, НОВЫХ ${newEntries.length}.`);

if (!newEntries.length) { console.log("Нечего добавлять."); process.exit(0); }

if (DRY_RUN) {
  console.log("\nDRY-RUN: словарь не изменён. Убери --dry-run, чтобы записать.");
  process.exit(0);
}

const merged = [...dict, ...newEntries];
await fs.writeFile(DICT_PATH, `window.DICTIONARY_DATA = ${JSON.stringify(merged, null, 2)};\n`, "utf8");
console.log(`Записано: ${dict.length} → ${merged.length} (+${newEntries.length}) в ${DICT_PATH}`);
