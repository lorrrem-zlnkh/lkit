#!/usr/bin/env node
// Точечный ручной добор терминов в словарь Lkit.
// Список — в manual_terms.mjs ([термин, сырое определение]).
// Поток: дедуп (как в парсере, включая э→е) → LLM переписывает в наш стиль →
//        append {id, term, definition, letter, source, addedAt}. Имеющееся не трогает.
// Запуск: ANTHROPIC_API_KEY=... npm run dict:add   [--dry-run]
import fs from "node:fs/promises";
import path from "node:path";
import { getLLM } from "./llm.mjs";
import { TERMS } from "./manual_terms.mjs";

const DRY = process.argv.includes("--dry-run");
const DICT = path.resolve("site/dictionary-data.js");
const raw = await fs.readFile(DICT, "utf8");
const dict = JSON.parse(raw.replace(/^window\.DICTIONARY_DATA\s*=\s*/, "").replace(/;\s*$/, ""));

const norm = (t) => String(t).toLowerCase().replace(/ё/g, "е").replace(/э/g, "е")
  .split("(")[0].replace(/[«»"'`]/g, "").replace(/[^a-zа-я0-9 +#/.-]/g, " ").replace(/\s+/g, " ").trim();
const ids = new Set(dict.map((e) => e.id));
const uid = (t) => {
  const base = (t.replace(/\s*\(.*/, "").trim().split(/[\s-]/)[0].toLowerCase().replace(/[^а-яёa-z0-9]/g, "")) || "term";
  if (!ids.has(base)) { ids.add(base); return base; }
  let i = 2; while (ids.has(base + i)) i++; ids.add(base + i); return base + i;
};
const letterOf = (t) => { const c = (t.trim()[0] || "").toUpperCase(); return /[А-ЯЁA-Z]/.test(c) ? c : "#"; };
const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
const existing = new Set(dict.map((e) => norm(e.term)));

const llm = getLLM();
if (!llm) { console.error("Нужен ANTHROPIC_API_KEY (или OPENAI_API_KEY)."); process.exit(1); }
console.log(`Словарь: ${dict.length}. LLM: ${llm.name}.${DRY ? " DRY-RUN (без записи)." : ""}`);

const today = new Date().toISOString().slice(0, 10);
const added = [];
const seen = new Set();
for (const [term, rawDef] of TERMS) {
  const key = norm(term);
  if (existing.has(key) || seen.has(key)) { console.log(`= уже есть: ${term}`); continue; }
  seen.add(key);
  let def;
  try { def = await llm.rewrite(term, rawDef); } catch (e) { console.error(`! ${term}: ${e.message}`); continue; }
  if (!def) { console.error(`! пустой ответ LLM: ${term}`); continue; }
  const entry = { id: uid(cap(term)), term: cap(term), definition: def, letter: letterOf(cap(term)), source: "Ручное добавление", addedAt: today };
  added.push(entry); dict.push(entry);
  console.log(`+ ${entry.term}  {${entry.id}, ${entry.letter}}\n   → ${def.slice(0, 150)}${def.length > 150 ? "…" : ""}`);
}

console.log(`\nДобавлено: ${added.length}. Итого: ${dict.length}.`);
if (llm.usage?.calls) console.log(`Кэш LLM: read=${llm.usage.cacheRead} create=${llm.usage.cacheCreate} input=${llm.usage.input}`);
if (DRY) { console.log("DRY-RUN: файл не изменён."); process.exit(0); }
if (added.length) await fs.writeFile(DICT, `window.DICTIONARY_DATA = ${JSON.stringify(dict, null, 2)};\n`, "utf8");
console.log(added.length ? `Записано в ${DICT}` : "Нечего записывать.");
