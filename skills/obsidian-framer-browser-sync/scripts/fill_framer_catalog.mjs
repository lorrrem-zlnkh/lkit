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

function normalizeToString(value) {
  if (value === null || value === undefined) {
    return "";
  }
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  return String(value);
}

async function loadJson(filePath) {
  const content = await fs.readFile(filePath, "utf8");
  return JSON.parse(content);
}

async function resolveLocator(page, descriptor) {
  switch (descriptor.type) {
    case "role":
      return page.getByRole(descriptor.role, { name: descriptor.name });
    case "label":
      return page.getByLabel(descriptor.value, { exact: false });
    case "text":
      return page.getByText(descriptor.value, { exact: false });
    case "css":
      return page.locator(descriptor.value);
    default:
      throw new Error(`Unsupported selector type: ${descriptor.type}`);
  }
}

async function fillField(page, fieldSelector, value) {
  const locator = await resolveLocator(page, fieldSelector);
  await locator.click({ timeout: 10000 });
  await locator.fill(normalizeToString(value));
}

async function clickIfPresent(page, selector) {
  if (!selector) {
    return;
  }
  const locator = await resolveLocator(page, selector);
  await locator.click({ timeout: 10000 });
}

const args = parseArgs(process.argv);
const projectUrl = args["project-url"];
const dataPath = args["data"];
const selectorsPath = args["selectors"];
const limit = Number.parseInt(args["limit"] || "1", 10);
const browserPath = args["browser-path"];
const cdpUrl = args["cdp-url"];

if (!projectUrl || !dataPath || !selectorsPath) {
  console.error("Usage: fill_framer_catalog.mjs --project-url URL --data file.json --selectors selectors.json [--limit 1]");
  process.exit(1);
}

const data = await loadJson(path.resolve(dataPath));
const selectors = await loadJson(path.resolve(selectorsPath));

if (!Array.isArray(data) || data.length === 0) {
  console.error("Data file must contain a non-empty JSON array.");
  process.exit(1);
}

const browser = cdpUrl
  ? await chromium.connectOverCDP(cdpUrl)
  : await chromium.launch({
      headless: false,
      executablePath: browserPath || undefined,
    });

const context = cdpUrl
  ? browser.contexts()[0]
  : await browser.newContext({ storageState: path.resolve(".auth", "framer-storage.json") });

if (!context) {
  throw new Error("No browser context available through CDP.");
}

const page = context.pages()[0] || (await context.newPage());

await page.goto(projectUrl, { waitUntil: "domcontentloaded" });

if (selectors.openCollection) {
  await clickIfPresent(page, selectors.openCollection);
}

for (const item of data.slice(0, limit)) {
  await clickIfPresent(page, selectors.newItemButton);

  for (const [fieldName, selector] of Object.entries(selectors.fields || {})) {
    if (!(fieldName in item)) {
      continue;
    }
    await fillField(page, selector, item[fieldName]);
  }

  await clickIfPresent(page, selectors.saveButton);

  if (String(item.published).toLowerCase() === "true") {
    await clickIfPresent(page, selectors.publishButton);
  }
}

await context.close();
await browser.close();

console.log(`Processed ${Math.min(limit, data.length)} item(s).`);
