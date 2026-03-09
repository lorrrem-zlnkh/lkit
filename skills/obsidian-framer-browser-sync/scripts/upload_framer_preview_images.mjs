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
  return JSON.parse(await fs.readFile(path.resolve(filePath), "utf8"));
}

async function appendLog(logPath, record) {
  await fs.appendFile(logPath, `${JSON.stringify(record)}\n`, "utf8");
}

async function ensureCms(page, projectUrl) {
  const projectBase = new URL(projectUrl).origin + new URL(projectUrl).pathname;
  if (!page.url().startsWith(projectBase)) {
    await page.goto(projectUrl, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2500);
  }

  await page.keyboard.press("Escape").catch(() => {});
  await page.waitForTimeout(200);

  const cmsButton = page.getByRole("button", { name: "CMS" });
  if (await cmsButton.isVisible().catch(() => false)) {
    await cmsButton.click().catch(() => {});
    await page.waitForTimeout(1000);
  }
}

function tableScroller(page) {
  return page.locator("div.shr89u9.s1i74306.wc7ts7t.s13qpy0w").first();
}

async function openItem(page, item) {
  await page.keyboard.press("Escape").catch(() => {});
  await page.waitForTimeout(200);

  const scroller = tableScroller(page);
  await scroller.evaluate((el) => {
    el.scrollTop = 0;
  });
  await page.waitForTimeout(300);

  for (let attempt = 0; attempt < 30; attempt += 1) {
    for (const label of [item.Title, item.Slug]) {
      const clicked = await page.evaluate((targetLabel) => {
        const candidates = [...document.querySelectorAll("[title]")]
          .filter((el) => el.getAttribute("title") === targetLabel)
          .filter((el) => {
            const rect = el.getBoundingClientRect();
            return rect.top >= 0 && rect.bottom <= window.innerHeight;
          });

        if (!candidates.length) return false;
        candidates[0].click();
        return true;
      }, label);

      if (clicked) {
        await page.waitForTimeout(1500);
        return true;
      }
    }

    await scroller.evaluate((el, top) => {
      el.scrollTop = top;
    }, (attempt + 1) * 900);
    await page.waitForTimeout(350);
  }

  return false;
}

async function uploadImage(page, imagePath) {
  const opened = await page.evaluate(() => {
    const candidate = [...document.querySelectorAll("*[role=button]")]
      .map((node) => ({
        node,
        text: (node.textContent || "").trim(),
        rect: node.getBoundingClientRect(),
      }))
      .find(
        (entry) =>
          (entry.text === "Add…" || entry.text === "Image") &&
          entry.rect.x > 800 &&
          entry.rect.y > 520 &&
          entry.rect.y < 640
      );

    if (!candidate) return false;
    candidate.node.click();
    return true;
  });

  if (!opened) {
    throw new Error("Could not open Product Image picker");
  }
  await page.waitForTimeout(600);

  const chooserPromise = page.waitForEvent("filechooser", { timeout: 10000 });

  const chooseImageButton = page.getByRole("button", { name: "Choose Image…" });
  if ((await chooseImageButton.count()) > 0 && (await chooseImageButton.first().isVisible().catch(() => false))) {
    await chooseImageButton.first().click();
  } else {
    const uploadAction = await page.evaluate(() => {
      const candidate = [...document.querySelectorAll("*[role=button]")]
        .map((node) => ({
          node,
          text: (node.textContent || "").trim(),
          rect: node.getBoundingClientRect(),
        }))
        .find((entry) => entry.text === "Upload" && entry.rect.y > 520);

      if (!candidate) return false;
      candidate.node.click();
      return true;
    });

    if (!uploadAction) {
      throw new Error("Could not find image upload action in Product Image picker");
    }
  }

  const chooser = await chooserPromise;
  await chooser.setFiles(imagePath);
  await page.waitForTimeout(3500);
  await page.keyboard.press("Escape").catch(() => {});
  await page.waitForTimeout(500);
}

async function publish(page) {
  await page.keyboard.press("Escape").catch(() => {});
  await page.waitForTimeout(250);
  await page.keyboard.press("Escape").catch(() => {});
  await page.waitForTimeout(350);

  const clicked = await page.evaluate(() => {
    const candidate = [...document.querySelectorAll("*[role=button], button")]
      .map((node) => ({
        node,
        label:
          node.getAttribute("aria-label") ||
          node.getAttribute("title") ||
          (node.textContent || "").trim(),
      }))
      .find((entry) => entry.label === "Publish");

    if (!candidate) return false;
    candidate.node.click();
    return true;
  });

  if (!clicked) {
    return false;
  }

  await page.waitForTimeout(2500);
  return true;
}

const args = parseArgs(process.argv);
const projectUrl = args["project-url"];
const cdpUrl = args["cdp-url"];
const dataPath = args.data;
const screenshotsDir = path.resolve(args["screenshots-dir"] || "output/screenshots");
const limit = Number.parseInt(args.limit || "50", 10);

if (!projectUrl || !cdpUrl || !dataPath) {
  console.error(
    "Usage: upload_framer_preview_images.mjs --project-url URL --cdp-url http://127.0.0.1:9222 --data items.json [--screenshots-dir output/screenshots] [--limit 50]"
  );
  process.exit(1);
}

const items = await loadJson(dataPath);
const browser = await chromium.connectOverCDP(cdpUrl);
const page = browser.contexts()[0].pages()[0];

page.on("dialog", async (dialog) => {
  try {
    await dialog.dismiss();
  } catch {}
});

const successLog = path.resolve("output/preview_upload_success.ndjson");
const errorLog = path.resolve("output/preview_upload_errors.ndjson");

let processed = 0;

for (const item of items.slice(0, limit)) {
  const imagePath = path.join(screenshotsDir, `${item.Slug}.png`);
  try {
    await fs.access(imagePath);
    await ensureCms(page, projectUrl);

    const opened = await openItem(page, item);
    if (!opened) {
      throw new Error(`Item not found in CMS table: ${item.Slug}`);
    }

    await uploadImage(page, imagePath);
    const published = await publish(page);

    await appendLog(successLog, { slug: item.Slug, imagePath, published });
    processed += 1;
    console.log(`uploaded:${item.Slug}:${published ? "published" : "draft"}`);
  } catch (error) {
    await appendLog(errorLog, { slug: item.Slug, imagePath, error: String(error) });
    console.log(`error:${item.Slug}`);
  }
}

console.log(`processed:${processed}`);
