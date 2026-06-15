#!/usr/bin/env node
// Фактчекинг словаря через Claude API (claude-opus-4-8).
// Каждый термин проверяется на достоверность: реально ли слово существует в
// IT-сленге/индустрии и верно ли определение. Результат — JSON-отчёт с вердиктом
// keep|remove и причиной по каждому id. Файл словаря НЕ меняется — только отчёт.
//
// Запуск:  ANTHROPIC_API_KEY=... node scripts/factcheck_claude.mjs
import fs from "node:fs/promises";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-opus-4-8";
const BATCH_SIZE = 12;        // терминов в одном запросе
const CONCURRENCY = 5;        // параллельных запросов
const DICT_PATH = path.resolve("site/dictionary-data.js");
const OUT_PATH = path.resolve("output/factcheck-claude.json");

if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
  console.error("Нужен ANTHROPIC_API_KEY (или ANTHROPIC_AUTH_TOKEN) в окружении.");
  process.exit(1);
}
const client = new Anthropic();

// --- загрузка словаря (window.DICTIONARY_DATA = [...]) ---
const raw = await fs.readFile(DICT_PATH, "utf8");
const dict = JSON.parse(raw.replace(/^window\.DICTIONARY_DATA\s*=\s*/, "").replace(/;\s*$/, ""));
console.log(`Загружено терминов: ${dict.length}`);

const SYSTEM = `Ты — дотошный фактчекер русскоязычного словаря IT-сленга и жаргона.
Для каждой статьи реши: оставить (keep) или удалить (remove).

Удаляй (remove) ТОЛЬКО при явной фактической ложности, по одному из критериев:
1. Термин выдуман — такого слова реально нет в русском IT-сленге/индустрии (или приведено искажённое написание несуществующего слова).
2. Определение фактически неверно — описывает не то понятие, даёт неправильное значение или содержит грубую техническую ошибку, меняющую смысл.
3. Указанная английская этимология неверна настолько, что вводит в заблуждение о происхождении/значении (мелкие опечатки в этимологии вроде «makros» вместо «macros» — НЕ повод).

Будь КОНСЕРВАТИВЕН: это неформальный сленг. Разговорность, региональность, устарелость, стилистическая корявость или не идеальное, но по сути верное определение — НЕ повод для удаления. Удаляй только явную ложь.
Отвечай строго по схеме: по каждому id — verdict (keep|remove), confidence (0..1) и краткая причина на русском (для keep — пустая строка или короткая пометка).`;

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    results: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string" },
          verdict: { type: "string", enum: ["keep", "remove"] },
          confidence: { type: "number" },
          reason: { type: "string" },
        },
        required: ["id", "verdict", "confidence", "reason"],
      },
    },
  },
  required: ["results"],
};

function chunk(arr, n) {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

async function checkBatch(batch, idx) {
  const payload = batch.map((e) => ({ id: e.id, term: e.term, definition: e.definition }));
  const userText =
    "Проверь следующие статьи словаря. Верни вердикт по каждому id.\n\n" +
    JSON.stringify(payload, null, 2);

  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    thinking: { type: "adaptive" },
    output_config: { effort: "high", format: { type: "json_schema", schema } },
    system: SYSTEM,
    messages: [{ role: "user", content: userText }],
  });

  const textBlock = resp.content.find((b) => b.type === "text");
  if (!textBlock) throw new Error(`Батч ${idx}: нет текстового блока в ответе`);
  const parsed = JSON.parse(textBlock.text);
  process.stdout.write(`  батч ${idx + 1}: ${parsed.results.length} вердиктов\n`);
  return parsed.results;
}

const batches = chunk(dict, BATCH_SIZE);
console.log(`Батчей: ${batches.length} по ~${BATCH_SIZE}, конкурентность ${CONCURRENCY}\n`);

const all = [];
let cursor = 0;
async function worker() {
  while (cursor < batches.length) {
    const i = cursor++;
    try {
      const res = await checkBatch(batches[i], i);
      all.push(...res);
    } catch (e) {
      console.error(`  батч ${i + 1} ОШИБКА: ${e.message}`);
      all.push(...batches[i].map((e2) => ({ id: e2.id, verdict: "keep", confidence: 0, reason: "ОШИБКА запроса — оставлено по умолчанию" })));
    }
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

// --- сводка ---
const byId = new Map(dict.map((e) => [e.id, e]));
const removals = all
  .filter((r) => r.verdict === "remove")
  .map((r) => ({ ...r, term: byId.get(r.id)?.term ?? "(?)" }))
  .sort((a, b) => b.confidence - a.confidence);

await fs.mkdir(path.dirname(OUT_PATH), { recursive: true });
await fs.writeFile(OUT_PATH, JSON.stringify({ model: MODEL, total: dict.length, checked: all.length, removals, all }, null, 2), "utf8");

console.log(`\nПроверено: ${all.length}/${dict.length}`);
console.log(`Кандидатов на удаление: ${removals.length}`);
for (const r of removals) {
  console.log(`  − [${r.confidence.toFixed(2)}] ${r.term} {${r.id}} — ${r.reason}`);
}
console.log(`\nОтчёт: ${OUT_PATH}`);
