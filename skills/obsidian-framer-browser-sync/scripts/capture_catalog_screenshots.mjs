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

function normalizeUrl(value) {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

async function loadJson(filePath) {
  return JSON.parse(await fs.readFile(path.resolve(filePath), "utf8"));
}

async function appendLog(logPath, record) {
  await fs.appendFile(logPath, `${JSON.stringify(record)}\n`, "utf8");
}

const args = parseArgs(process.argv);
const dataPath = args.data;
const outputDir = path.resolve(args["output-dir"] || "output/screenshots");
const limit = Number.parseInt(args.limit || "50", 10);

if (!dataPath) {
  console.error("Usage: capture_catalog_screenshots.mjs --data items.json [--output-dir output/screenshots] [--limit 50]");
  process.exit(1);
}

await fs.mkdir(outputDir, { recursive: true });

const items = await loadJson(dataPath);
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1024 },
  deviceScaleFactor: 1,
});
const page = await context.newPage();
const successLog = path.resolve("output/screenshot_success.ndjson");
const errorLog = path.resolve("output/screenshot_errors.ndjson");

let processed = 0;

for (const item of items.slice(0, limit)) {
  const url = normalizeUrl(item.Link);
  const targetPath = path.join(outputDir, `${item.Slug}.png`);
  try {
    if (!url) {
      throw new Error("Missing Link");
    }

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: targetPath, fullPage: false });
    await appendLog(successLog, { slug: item.Slug, url, path: targetPath });
    processed += 1;
    console.log(`captured:${item.Slug}`);
  } catch (error) {
    await appendLog(errorLog, { slug: item.Slug, url, error: String(error) });
    console.log(`error:${item.Slug}`);
  }
}

await browser.close();
console.log(`processed:${processed}`);
