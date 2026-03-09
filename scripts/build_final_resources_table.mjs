#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, "\"\"")}"` : text;
}

function mdEscape(value) {
  return String(value ?? "").replace(/\|/g, "\\|");
}

function screenshotServiceUrl(link) {
  try {
    const url = new URL(link);
    return `https://s.wordpress.com/mshots/v1/${encodeURIComponent(url.toString())}?w=1200`;
  } catch {
    return "";
  }
}

function mapStatus(row) {
  if (row.Status === "ok") {
    return "ok";
  }

  if (row.FailureGroup === "требует авторизацию") {
    return "требует логин";
  }

  if (row.FailureGroup === "403 / ограничение доступа") {
    return "страница блокирует automation";
  }

  if (!row.FailureGroup) {
    return "нужна новая публичная ссылка";
  }

  return "нужна новая публичная ссылка";
}

const inputPath = path.resolve("output/resources_table_enriched.json");
const screenshotDir = path.resolve("output/screenshots_resources");
const rows = JSON.parse(await fs.readFile(inputPath, "utf8"));

let screenshotFiles = [];
try {
  screenshotFiles = await fs.readdir(screenshotDir);
} catch {
  screenshotFiles = [];
}

const localScreenshots = new Map(
  screenshotFiles
    .filter((name) => name.endsWith(".png"))
    .map((name) => [name.replace(/\.png$/i, ""), path.join(screenshotDir, name)])
);

const finalRows = rows
  .filter((row) => row.FailureGroup !== "реально мёртвый ресурс")
  .map((row) => {
    const localScreenshot = row.ScreenshotPath || localScreenshots.get(row.Slug) || "";
    const screenshot = localScreenshot || screenshotServiceUrl(row.Link);
    const screenshotSource = localScreenshot ? "local" : screenshot ? "web" : "";

    return {
      Resource: row.Title,
      Rubric: row.Category,
      Subrubric: row.LegacySubcategory || "",
      Link: row.Link,
      Slug: row.Slug,
      Description: row.Description || "",
      AccessStatus: mapStatus(row),
      Screenshot: screenshot,
      ScreenshotSource: screenshotSource,
      InfoSource: row.InfoSource || (row.Status === "ok" ? "site" : ""),
    };
  });

const jsonPath = path.resolve("output/resources_table_final.json");
const csvPath = path.resolve("output/resources_table_final.csv");
const mdPath = path.resolve("output/resources_table_final.md");

await fs.writeFile(jsonPath, JSON.stringify(finalRows, null, 2), "utf8");

const header = [
  "Resource",
  "Rubric",
  "Subrubric",
  "Link",
  "Slug",
  "Description",
  "AccessStatus",
  "Screenshot",
  "ScreenshotSource",
  "InfoSource",
];

await fs.writeFile(
  csvPath,
  [header.join(","), ...finalRows.map((row) => header.map((key) => csvEscape(row[key])).join(","))].join("\n"),
  "utf8"
);

const mdLines = [
  "| # | Ресурс | Рубрика | Подрубрика | Описание | Статус | Скриншот | Ссылка |",
  "| --- | --- | --- | --- | --- | --- | --- | --- |",
];

finalRows.forEach((row, index) => {
  const screenshot = row.Screenshot ? `[screenshot](${row.Screenshot})` : "";
  mdLines.push(
    `| ${index + 1} | ${mdEscape(row.Resource)} | ${mdEscape(row.Rubric)} | ${mdEscape(
      row.Subrubric
    )} | ${mdEscape(row.Description)} | ${mdEscape(row.AccessStatus)} | ${screenshot} | ${mdEscape(row.Link)} |`
  );
});

await fs.writeFile(mdPath, mdLines.join("\n"), "utf8");

const summary = finalRows.reduce(
  (acc, row) => {
    acc.byStatus[row.AccessStatus] = (acc.byStatus[row.AccessStatus] || 0) + 1;
    acc.withScreenshot += row.Screenshot ? 1 : 0;
    if (row.ScreenshotSource === "local") acc.localScreenshots += 1;
    if (row.ScreenshotSource === "web") acc.webScreenshots += 1;
    return acc;
  },
  { total: finalRows.length, withScreenshot: 0, localScreenshots: 0, webScreenshots: 0, byStatus: {} }
);

await fs.writeFile(path.resolve("output/resources_table_final_summary.json"), JSON.stringify(summary, null, 2), "utf8");

console.log(JSON.stringify(summary, null, 2));
