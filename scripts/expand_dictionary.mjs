#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const API_KEY = process.env.OPENAI_API_KEY;
if (!API_KEY) { console.error("Set OPENAI_API_KEY"); process.exit(1); }

const dataPath = path.resolve("site/dictionary-data.js");
const raw = await fs.readFile(dataPath, "utf8");
const entries = JSON.parse(raw.replace("window.DICTIONARY_DATA = ", "").replace(/;\s*$/, ""));

async function expand(term, definition) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_tokens: 200,
      messages: [{
        role: "system",
        content: `Ты пишешь определения для русскоязычного IT-словаря с айтишным сленгом.
Расширь определение термина: сделай его более подробным и понятным (2–3 предложения).
Сохрани разговорный стиль, если термин — сленг. Пиши по-русски. Без лишних вступлений, сразу текст определения.`
      }, {
        role: "user",
        content: `Термин: ${term}\nТекущее определение: ${definition}`
      }]
    })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  return json.choices[0].message.content.trim();
}

const expanded = [];
let done = 0;

for (const entry of entries) {
  try {
    const newDef = await expand(entry.term, entry.definition);
    expanded.push({ ...entry, definition: newDef });
  } catch (e) {
    console.error(`Error on "${entry.term}":`, e.message);
    expanded.push(entry);
  }
  done++;
  if (done % 10 === 0) process.stdout.write(`\r${done}/${entries.length}`);
}

const output = `window.DICTIONARY_DATA = ${JSON.stringify(expanded, null, 2)};\n`;
await fs.writeFile(dataPath, output, "utf8");
console.log(`\nDone: ${expanded.length} entries`);
