#!/usr/bin/env node
// Удаляет карточки откровенно мёртвых сервисов (подтверждено авторитетным DNS:
// нет A-записи / NXDOMAIN / SERVFAIL / домен на продаже / инструмент удалён).
import fs from "node:fs/promises";
import path from "node:path";

const dataPath = path.resolve("site/catalog-data.js");
const raw = await fs.readFile(dataPath, "utf8");
const data = JSON.parse(raw.replace(/^window\.CATALOG_DATA\s*=\s*/, "").replace(/;\s*$/, ""));

const deadSlugs = new Set([
  "items-design",         // нет A-записи
  "visualelectric-com",   // нет A-записи
  "ui-garage",            // SERVFAIL (битая NS-делегация)
  "pixcap-com",           // NXDOMAIN на всех хостах
  "unfakepng",            // домен выставлен на продажу
  "studiored-com",        // страница конвертера удалена (404)
]);

const before = data.length;
const removed = [];
const kept = data.filter((d) => {
  if (deadSlugs.has(d.Slug)) {
    removed.push({ Resource: d.Resource, Slug: d.Slug, Screenshot: d.Screenshot });
    return false;
  }
  return true;
});

const foundSlugs = new Set(removed.map((r) => r.Slug));
const notFound = [...deadSlugs].filter((s) => !foundSlugs.has(s));
if (notFound.length) {
  console.error("НЕ НАЙДЕНЫ слаги:", notFound);
  process.exit(1);
}

const out = `window.CATALOG_DATA = ${JSON.stringify(kept, null, 2)};\n`;
await fs.writeFile(dataPath, out, "utf8");

// Удаляем локальные скриншоты удалённых карточек, если они лежат в site/screenshots
for (const r of removed) {
  if (r.Screenshot && r.Screenshot.startsWith("./screenshots/")) {
    const p = path.resolve("site", r.Screenshot.replace("./", ""));
    try {
      await fs.unlink(p);
      r.shot = "удалён скриншот";
    } catch {
      r.shot = "скриншота нет";
    }
  } else {
    r.shot = "внешний скриншот";
  }
}

console.log(`Было: ${before} → стало: ${kept.length} (удалено ${removed.length})`);
for (const r of removed) console.log(`  − ${r.Resource} {${r.Slug}} — ${r.shot}`);
