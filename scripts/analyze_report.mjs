#!/usr/bin/env node
// Анализ output/link_report.json: раскладывает карточки по корзинам для Фазы 1.
import fs from "node:fs/promises";
import path from "node:path";

const report = JSON.parse(await fs.readFile(path.resolve("output/link_report.json"), "utf8"));

const norm = (s) =>
  (s || "")
    .toLowerCase()
    .replace(/https?:\/\//g, "")
    .replace(/[^a-zа-я0-9]/gi, "");

// 1. Реально битые: 404/410/500/DNS. 403/401/429/timeout = анти-бот, считаем живыми.
const REAL_BAD = new Set([404, 410, 500, 502, 503]);
const broken = report.filter(
  (r) => REAL_BAD.has(r.status) || (r.status === 0 && r.error && r.error !== "timeout")
);
const antibot = report.filter(
  (r) => [401, 403, 429].includes(r.status) || (r.status === 0 && r.error === "timeout")
);

// 2. Совпадение названия карточки с title/og:title страницы.
function nameMatches(r) {
  const res = norm(r.Resource);
  const pageNames = [r.title, r.ogTitle].filter(Boolean).map(norm);
  if (!pageNames.length) return null; // нет данных
  return pageNames.some((p) => p.includes(res) || res.includes(p) || res.slice(0, 8) === p.slice(0, 8));
}

const opened = report.filter((r) => r.status >= 200 && r.status < 400);
const mismatches = opened.filter((r) => nameMatches(r) === false && (r.title || r.ogTitle));

// 3. Кандидаты на переписывание описания: открылись, есть meta-описание/title.
const haveMeta = opened.filter((r) => r.description || r.ogDescription);

console.log(`Открылись: ${opened.length} | анти-бот(живые): ${antibot.length} | реально битые: ${broken.length}`);
console.log(`С meta-описанием: ${haveMeta.length} | название≠title: ${mismatches.length}`);

console.log(`\n===== РЕАЛЬНО БИТЫЕ (${broken.length}) — нужна проверка/новая ссылка =====`);
for (const r of broken) {
  console.log(`[${r.status || "ERR " + r.error}] ${r.Resource}\n   ${r.Link}`);
}

console.log(`\n===== НАЗВАНИЕ ≠ TITLE (${mismatches.length}) =====`);
for (const r of mismatches) {
  console.log(`• "${r.Resource}"  ↔  page: "${(r.title || r.ogTitle).slice(0, 80)}"\n   ${r.finalUrl}`);
}

await fs.writeFile(
  path.resolve("output/worklist.json"),
  JSON.stringify({ broken, antibot, mismatches, haveMeta }, null, 2),
  "utf8"
);
console.log(`\n→ output/worklist.json записан`);
