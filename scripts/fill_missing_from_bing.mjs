#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const key = argv[i];
    const value = argv[i + 1];
    if (key.startsWith("--")) {
      args[key.slice(2)] = value;
      i += 1;
    }
  }
  return args;
}

function extractHost(value) {
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function truncate(value, max = 180) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trim()}…`;
}

function cleanTitle(value) {
  const raw = String(value ?? "").trim();
  if (!raw.includes("|")) return raw;

  const parts = raw
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => !/^https?:\/\//i.test(part))
    .filter((part) => !/^[\d.]+$/.test(part))
    .filter((part) => !part.includes("/"));

  return parts.join(" — ") || raw.replace(/\|+/g, " ").replace(/\s+/g, " ").trim();
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, "\"\"")}"` : text;
}

function mdEscape(value) {
  return String(value ?? "").replace(/\|/g, "\\|");
}

function buildQuery(row) {
  const host = extractHost(row.Link);
  const title = String(row.Title || row.Resource || "").replace(/[|]+/g, " ").trim();
  return [title, host].filter(Boolean).join(" ");
}

function fallbackDescription(row) {
  const title = cleanTitle(row.Title || row.Resource || "");
  const sub = String(row.LegacySubcategory || "");
  const cat = String(row.Category || "");

  if (row.FailureGroup === "требует авторизацию") {
    return `${title} — сервис, который ведёт на авторизованную или приватную часть продукта.`;
  }
  if (sub.includes("Figma")) {
    return `${title} — плагин или ресурс для Figma и дизайн-процесса.`;
  }
  if (cat === "ИИ") {
    return `${title} — AI-сервис для генерации контента, автоматизации или работы с медиа.`;
  }
  if (cat === "Ресурсы") {
    return `${title} — ресурс с ассетами, типографикой, иконками или UI-материалами.`;
  }
  if (cat === "Инструменты") {
    return `${title} — цифровой инструмент для дизайна, прототипирования, исследований или продуктивности.`;
  }
  if (cat === "Контент и обучение") {
    return `${title} — обучающий материал, медиа-ресурс или подборка по дизайну и продукту.`;
  }
  if (cat === "Доступность") {
    return `${title} — материал о цифровой доступности, инклюзивном дизайне и практике доступных интерфейсов.`;
  }
  return `${title} — цифровой сервис или ресурс из каталога.`;
}

function selectBestResult(results, host) {
  if (!results.length) return null;
  const cleanHost = host.replace(/^www\./, "");
  return results.find(
    (item) =>
      extractHost(item.url).includes(cleanHost) ||
      item.displayUrl.toLowerCase().replace(/^www\./, "").includes(cleanHost)
  );
}

async function writeOutputs(rows, outputBase) {
  await fs.writeFile(path.resolve("output/resources_table_enriched.json"), JSON.stringify(rows, null, 2), "utf8");

  const csvHeader = [
    "Title",
    "Category",
    "Link",
    "Slug",
    "Description",
    "Status",
    "FailureGroup",
    "FailureReason",
    "FinalURL",
    "ScreenshotPath",
    "InfoSource",
    "SearchResultURL",
    "LegacyCategory",
    "LegacySubcategory",
  ];
  const csv = [
    csvHeader.join(","),
    ...rows.map((row) => csvHeader.map((key) => csvEscape(row[key])).join(",")),
  ].join("\n");
  await fs.writeFile(path.resolve("output/resources_table_enriched.csv"), csv, "utf8");

  const md = [
    "| # | Ресурс | Категория | Описание | Статус | Источник | Ссылка |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    ...rows.map(
      (row, index) =>
        `| ${index + 1} | ${mdEscape(row.Title)} | ${mdEscape(row.Category)} | ${mdEscape(
          row.Description
        )} | ${mdEscape(row.Status)} | ${mdEscape(row.InfoSource)} | ${mdEscape(row.Link)} |`
    ),
  ].join("\n");
  await fs.writeFile(path.resolve("output/resources_table_enriched.md"), md, "utf8");

  const touched = rows.filter((row) => row.InfoSource === "bing");
  await fs.writeFile(path.resolve(`${outputBase}.json`), JSON.stringify(touched, null, 2), "utf8");
}

const args = parseArgs(process.argv);
const inputPath = path.resolve(args.input || "output/resources_table_enriched.json");
const outputBase = args.output || "output/filled_from_bing";
const concurrency = Number.parseInt(args.concurrency || "3", 10);
const limit = Number.parseInt(args.limit || "0", 10);

const rows = JSON.parse(await fs.readFile(inputPath, "utf8"));
const targets = rows
  .filter((row) => row.Status === "не работает" && row.FailureGroup !== "битая ссылка или домен" && !row.Description)
  .slice(0, limit > 0 ? limit : undefined);

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1200 },
  ignoreHTTPSErrors: true,
});

let cursor = 0;

async function worker() {
  const page = await context.newPage();

  while (true) {
    const current = cursor;
    cursor += 1;
    if (current >= targets.length) break;

    const row = targets[current];
    const query = buildQuery(row);
    const host = extractHost(row.Link);
    let description = "";
    let searchResultUrl = "";

    try {
      await page.goto(`https://www.bing.com/search?q=${encodeURIComponent(query)}`, {
        waitUntil: "domcontentloaded",
        timeout: 20000,
      });
      await page.waitForTimeout(1200);

      const results = await page.evaluate(() =>
        [...document.querySelectorAll("li.b_algo")]
          .slice(0, 5)
          .map((item) => ({
            title: item.querySelector("h2")?.textContent?.replace(/\s+/g, " ").trim() || "",
            snippet:
              item.querySelector(".b_caption p")?.textContent?.replace(/\s+/g, " ").trim() || "",
            url: item.querySelector("h2 a")?.href || "",
            displayUrl:
              item.querySelector(".b_attribution cite")?.textContent?.replace(/\s+/g, " ").trim() || "",
          }))
      );

      const chosen = selectBestResult(results, host);
      if (chosen?.snippet) {
        description = truncate(chosen.snippet);
        searchResultUrl = chosen.url;
      }
    } catch {
      // Fall through to templated fallback.
    }

    const targetRow = rows.find((item) => item.Slug === row.Slug);
    if (!targetRow) continue;

    targetRow.Description = description || fallbackDescription(row);
    targetRow.InfoSource = description ? "bing" : "template";
    targetRow.SearchResultURL = searchResultUrl;

    console.log(`${description ? "bing" : "template"}:${row.Slug}`);
  }

  await page.close();
}

await Promise.all(Array.from({ length: Math.max(1, concurrency) }, () => worker()));
await browser.close();
await writeOutputs(rows, outputBase);

console.log(`processed:${targets.length}`);
