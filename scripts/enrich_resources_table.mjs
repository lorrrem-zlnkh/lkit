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

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, "\"\"")}"` : text;
}

function mdEscape(value) {
  return String(value ?? "").replace(/\|/g, "\\|");
}

function truncate(value, max = 180) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trim()}…`;
}

function normalizeUrl(value) {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(path.resolve(filePath), "utf8"));
}

async function writeJson(filePath, data) {
  await fs.writeFile(path.resolve(filePath), JSON.stringify(data, null, 2), "utf8");
}

async function writeCsv(filePath, rows) {
  const header = [
    "Title",
    "Category",
    "Link",
    "Slug",
    "Description",
    "Status",
    "FinalURL",
    "ScreenshotPath",
    "LegacyCategory",
    "LegacySubcategory",
  ];
  const lines = [
    header.join(","),
    ...rows.map((row) =>
      header
        .map((key) => csvEscape(row[key]))
        .join(",")
    ),
  ];
  await fs.writeFile(path.resolve(filePath), lines.join("\n"), "utf8");
}

async function writeMarkdown(filePath, rows) {
  const lines = [
    "| # | Ресурс | Категория | Описание | Статус | Ссылка | Скриншот |",
    "| --- | --- | --- | --- | --- | --- | --- |",
  ];
  rows.forEach((row, index) => {
    const screenshot = row.ScreenshotPath ? `[png](${row.ScreenshotPath})` : "";
    lines.push(
      `| ${index + 1} | ${mdEscape(row.Title)} | ${mdEscape(row.Category)} | ${mdEscape(
        row.Description
      )} | ${mdEscape(row.Status)} | ${mdEscape(row.Link)} | ${screenshot} |`
    );
  });
  await fs.writeFile(path.resolve(filePath), lines.join("\n"), "utf8");
}

async function appendNdjson(filePath, record) {
  await fs.appendFile(path.resolve(filePath), `${JSON.stringify(record)}\n`, "utf8");
}

const args = parseArgs(process.argv);
const inputPath = args.input || "output/resources_table_top_categories.json";
const outputBase = args.output || "output/resources_table_enriched";
const screenshotDir = args["screenshot-dir"] || "output/screenshots_resources";
const limit = Number.parseInt(args.limit || "0", 10);
const navigationTimeout = Number.parseInt(args.timeout || "12000", 10);
const settleMs = Number.parseInt(args["settle-ms"] || "800", 10);
const concurrency = Number.parseInt(args.concurrency || "4", 10);

const items = await readJson(inputPath);
const rows = limit > 0 ? items.slice(0, limit) : items;

await fs.mkdir(path.resolve(screenshotDir), { recursive: true });
await fs.mkdir(path.resolve("output"), { recursive: true });

const successLog = path.resolve("output/resource_enrichment_success.ndjson");
const failLog = path.resolve("output/resource_enrichment_failures.ndjson");
await fs.writeFile(successLog, "", "utf8");
await fs.writeFile(failLog, "", "utf8");

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1024 },
  ignoreHTTPSErrors: true,
});
const enriched = new Array(rows.length);
let cursor = 0;

async function processItem(page, item) {
  const url = normalizeUrl(item.Link);
  const screenshotPath = path.resolve(screenshotDir, `${item.Slug}.png`);

  try {
    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: navigationTimeout });
    await page.waitForTimeout(settleMs);

    const pageData = await page.evaluate(() => {
      const metaDescription =
        document.querySelector('meta[name="description"]')?.getAttribute("content") ||
        document.querySelector('meta[property="og:description"]')?.getAttribute("content") ||
        "";
      const h1 = document.querySelector("h1")?.textContent || "";
      const h2 = document.querySelector("h2")?.textContent || "";
      const paragraph =
        [...document.querySelectorAll("p")]
          .map((node) => node.textContent || "")
          .map((text) => text.replace(/\s+/g, " ").trim())
          .find((text) => text.length > 40) || "";
      return {
        title: document.title || "",
        metaDescription,
        h1,
        h2,
        paragraph,
      };
    });

    const description = truncate(
      pageData.metaDescription || pageData.paragraph || pageData.h1 || pageData.h2 || pageData.title
    );

    const statusCode = response?.status() ?? 0;
    const ok = statusCode === 0 || (statusCode >= 200 && statusCode < 400);
    if (!ok) {
      throw new Error(`HTTP ${statusCode}`);
    }

    await page.screenshot({ path: screenshotPath, fullPage: false });

    return {
      ...item,
      Description: description,
      Status: "ok",
      FinalURL: page.url(),
      ScreenshotPath: screenshotPath,
    };
  } catch (error) {
    return {
      ...item,
      Description: "",
      Status: "не работает",
      FinalURL: "",
      ScreenshotPath: "",
      Error: String(error),
    };
  }
}

async function worker() {
  const page = await context.newPage();
  page.setDefaultNavigationTimeout(navigationTimeout);

  while (true) {
    const current = cursor;
    cursor += 1;
    if (current >= rows.length) {
      break;
    }

    const item = rows[current];
    const record = await processItem(page, item);
    enriched[current] = record;

    if (record.Status === "ok") {
      await appendNdjson(successLog, record);
      console.log(`ok:${item.Slug}`);
    } else {
      await appendNdjson(failLog, record);
      console.log(`fail:${item.Slug}`);
    }
  }

  await page.close();
}

await Promise.all(Array.from({ length: Math.max(1, concurrency) }, () => worker()));

await browser.close();

await writeJson(`${outputBase}.json`, enriched.filter(Boolean));
await writeCsv(`${outputBase}.csv`, enriched.filter(Boolean));
await writeMarkdown(`${outputBase}.md`, enriched.filter(Boolean));

console.log(`processed:${enriched.filter(Boolean).length}`);
