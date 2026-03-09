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

async function loadJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function ensureCms(page, projectUrl) {
  if (!page.url().startsWith(projectUrl)) {
    await page.goto(projectUrl, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2500);
  }

  await page.keyboard.press("Escape").catch(() => {});
  await page.waitForTimeout(200);

  const cmsButton = page.getByRole("button", { name: "CMS" });
  if (await cmsButton.isVisible().catch(() => false)) {
    await cmsButton.click().catch(() => {});
    await page.waitForTimeout(800);
  }
}

async function openNewItem(page) {
  await page.getByRole("button", { name: "New Item" }).click();
  await page.waitForTimeout(1500);
}

async function fillBaseFields(page, item) {
  const fields = page.locator("input.c79v3nf");
  await fields.nth(0).fill(item.Title);
  await fields.nth(1).fill(item.Slug);
  await page.locator("select.phdad7q").selectOption({ label: item.Category });
  await page.waitForTimeout(300);
}

async function fillLink(page, url) {
  await page.evaluate(() => {
    const target = [...document.querySelectorAll("*[role=button]")]
      .map((n) => ({ n, r: n.getBoundingClientRect(), t: (n.textContent || "").trim() }))
      .find((x) => x.t.includes("Add…") && x.r.y > 680 && x.r.y < 740);
    if (target) target.n.click();
  });
  await page.waitForTimeout(700);

  const linkInput = page.locator("input.ic8izch");
  await linkInput.fill(url);
  await page.waitForTimeout(300);
  await linkInput.press("Enter");
  await page.waitForTimeout(300);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);
}

async function saveAndPublish(page) {
  await page.getByRole("button", { name: "Save Draft" }).click();
  await page.waitForTimeout(1800);

  const publishButtons = page.getByRole("button", { name: "Publish" });
  const count = await publishButtons.count();
  for (let i = 0; i < count; i += 1) {
    if (await publishButtons.nth(i).isEnabled()) {
      await publishButtons.nth(i).click();
      await page.waitForTimeout(2200);
      return true;
    }
  }
  return false;
}

async function itemExistsOnScreen(page, slug) {
  const body = await page.locator("body").innerText();
  return body.includes(`\n${slug}\n`) || body.startsWith(`${slug}\n`);
}

async function appendLog(logPath, record) {
  await fs.appendFile(logPath, `${JSON.stringify(record)}\n`, "utf8");
}

const args = parseArgs(process.argv);
const projectUrl = args["project-url"];
const cdpUrl = args["cdp-url"];
const dataPath = args["data"];
const limit = Number.parseInt(args["limit"] || "20", 10);

if (!projectUrl || !cdpUrl || !dataPath) {
  console.error(
    "Usage: import_framer_catalog_from_json.mjs --project-url URL --cdp-url http://127.0.0.1:9222 --data file.json [--limit 20]"
  );
  process.exit(1);
}

const items = await loadJson(path.resolve(dataPath));
const browser = await chromium.connectOverCDP(cdpUrl);
const page = browser.contexts()[0].pages()[0];

page.on("dialog", async (dialog) => {
  try {
    await dialog.dismiss();
  } catch {
    // Framer may auto-resolve transient dialogs while Playwright is handling them.
  }
});

const outputDir = path.resolve("output");
await fs.mkdir(outputDir, { recursive: true });
const successLog = path.join(outputDir, "framer_import_success.ndjson");
const errorLog = path.join(outputDir, "framer_import_errors.ndjson");

let processed = 0;

await ensureCms(page, projectUrl);

for (const item of items.slice(0, limit)) {
  try {
    await ensureCms(page, projectUrl);
    if (await itemExistsOnScreen(page, item.Slug)) {
      await appendLog(successLog, { slug: item.Slug, status: "already_visible" });
      continue;
    }

    await openNewItem(page);
    await fillBaseFields(page, item);
    await fillLink(page, item.Link);
    const published = await saveAndPublish(page);

    await appendLog(successLog, {
      slug: item.Slug,
      title: item.Title,
      category: item.Category,
      published,
    });
    processed += 1;
    console.log(`imported:${item.Slug}:${published ? "published" : "draft"}`);
  } catch (error) {
    await appendLog(errorLog, {
      slug: item.Slug,
      title: item.Title,
      error: String(error),
    });
    console.log(`error:${item.Slug}`);
  }
}

console.log(`processed:${processed}`);
