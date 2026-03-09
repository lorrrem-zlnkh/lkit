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

function siteLabel(url, slug) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return slug;
  }
}

const args = parseArgs(process.argv);
const logPath = path.resolve(args.log || "output/screenshot_success.ndjson");
const outputDir = path.resolve(args["output-dir"] || "output/screenshots_labeled");

await fs.mkdir(outputDir, { recursive: true });

const records = (await fs.readFile(logPath, "utf8"))
  .trim()
  .split("\n")
  .filter(Boolean)
  .map((line) => JSON.parse(line));

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1024 } });

for (const record of records) {
  const inputPath = path.resolve(record.path);
  const outputPath = path.join(outputDir, `${record.slug}.png`);
  const label = siteLabel(record.url, record.slug);
  const fileUrl = `file://${inputPath}`;

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          html, body {
            margin: 0;
            width: 1440px;
            height: 1024px;
            overflow: hidden;
            background: #101114;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          }
          .frame {
            position: relative;
            width: 1440px;
            height: 1024px;
            background: #101114;
          }
          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
          }
          .label {
            position: absolute;
            left: 32px;
            right: 32px;
            bottom: 32px;
            padding: 18px 24px;
            border-radius: 18px;
            background: rgba(8, 10, 14, 0.72);
            color: #ffffff;
            font-size: 34px;
            font-weight: 700;
            letter-spacing: 0.01em;
            backdrop-filter: blur(10px);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.28);
          }
        </style>
      </head>
      <body>
        <div class="frame">
          <img src="${fileUrl}" />
          <div class="label">${label}</div>
        </div>
      </body>
    </html>
  `;

  await page.setContent(html, { waitUntil: "load" });
  await page.screenshot({ path: outputPath, type: "png" });
  console.log(`labeled:${record.slug}`);
}

await browser.close();
