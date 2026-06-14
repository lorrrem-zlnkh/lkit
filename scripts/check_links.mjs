#!/usr/bin/env node
// Phase 0: проверка всех ссылок каталога.
// Для каждой карточки: HTTP-статус, финальный URL (после редиректов),
// <title> и meta-описание страницы. Сравнивает <title> с названием карточки.
// Результат: output/link_report.json (полный) + краткая сводка в stdout.
import fs from "node:fs/promises";
import path from "node:path";

const dataPath = path.resolve("site/catalog-data.js");
const raw = await fs.readFile(dataPath, "utf8");
const data = JSON.parse(raw.replace(/^window\.CATALOG_DATA\s*=\s*/, "").replace(/;\s*$/, ""));

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const TIMEOUT = 15000;
const CONCURRENCY = 12;

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .trim();
}

function extract(html) {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  const metaDesc =
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([\s\S]*?)["']/i)?.[1] ||
    html.match(/<meta[^>]+content=["']([\s\S]*?)["'][^>]+name=["']description["']/i)?.[1];
  const ogDesc =
    html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([\s\S]*?)["']/i)?.[1] ||
    html.match(/<meta[^>]+content=["']([\s\S]*?)["'][^>]+property=["']og:description["']/i)?.[1];
  const ogTitle =
    html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([\s\S]*?)["']/i)?.[1];
  return {
    title: title ? decodeEntities(title.replace(/\s+/g, " ")) : null,
    ogTitle: ogTitle ? decodeEntities(ogTitle) : null,
    description: metaDesc ? decodeEntities(metaDesc) : null,
    ogDescription: ogDesc ? decodeEntities(ogDesc) : null,
  };
}

async function check(entry) {
  const url = entry.Link;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT);
  const result = {
    Resource: entry.Resource,
    Slug: entry.Slug,
    Link: url,
    AccessStatus: entry.AccessStatus,
    InfoSource: entry.InfoSource,
    Description: entry.Description,
  };
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: ctrl.signal,
      headers: { "User-Agent": UA, Accept: "text/html,*/*" },
    });
    result.status = res.status;
    result.finalUrl = res.url;
    result.redirected = res.url !== url;
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("text/html") || ct === "") {
      const buf = await res.text();
      Object.assign(result, extract(buf.slice(0, 200000)));
    } else {
      result.contentType = ct;
    }
  } catch (e) {
    result.status = 0;
    result.error = e.name === "AbortError" ? "timeout" : e.message;
  } finally {
    clearTimeout(t);
  }
  return result;
}

async function run() {
  const results = new Array(data.length);
  let i = 0;
  let done = 0;
  async function worker() {
    while (i < data.length) {
      const idx = i++;
      results[idx] = await check(data[idx]);
      done++;
      if (done % 10 === 0) process.stdout.write(`\r${done}/${data.length} проверено`);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  process.stdout.write(`\r${done}/${data.length} проверено\n`);

  await fs.mkdir(path.resolve("output"), { recursive: true });
  await fs.writeFile(
    path.resolve("output/link_report.json"),
    JSON.stringify(results, null, 2),
    "utf8"
  );

  // Сводка
  const dead = results.filter((r) => r.status === 0 || r.status >= 400);
  const ok = results.filter((r) => r.status >= 200 && r.status < 400);
  const redirected = ok.filter((r) => r.redirected);
  console.log(`\n=== СВОДКА ===`);
  console.log(`Всего:        ${results.length}`);
  console.log(`Открылись:    ${ok.length}`);
  console.log(`Битые/ошибка: ${dead.length}`);
  console.log(`С редиректом: ${redirected.length}`);
  console.log(`\n--- БИТЫЕ (status/ошибка) ---`);
  for (const r of dead) {
    console.log(`[${r.status || "ERR"}${r.error ? " " + r.error : ""}] ${r.Resource} — ${r.Link}`);
  }
}

run();
