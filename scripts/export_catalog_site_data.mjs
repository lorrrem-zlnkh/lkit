#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const sourcePath = path.resolve("output/resources_table_final.json");
const weeklySourcePath = path.resolve("output/weekly_cases.json");
const targetPath = path.resolve("site/catalog-data.js");
const weeklyTargetPath = path.resolve("site/weekly-data.js");
const targetScreenshotDir = path.resolve("site/screenshots");

const rows = JSON.parse(await fs.readFile(sourcePath, "utf8"));
let weeklyRows = [];
try {
  weeklyRows = JSON.parse(await fs.readFile(weeklySourcePath, "utf8"));
} catch {
  weeklyRows = [];
}
await fs.mkdir(targetScreenshotDir, { recursive: true });

const normalizedWeeklyRows = weeklyRows.map((row) => ({
  ...row,
  Description: String(row.Description || "")
    .replace(/\s*·\s*weekly case\b/gi, "")
    .replace(/\bweekly case\b/gi, "")
    .replace(/\s*·\s*$/g, "")
    .trim(),
}));

const siteRows = await Promise.all(
  rows.map(async (row) => {
    if (row.ScreenshotSource !== "local" || !row.Screenshot) {
      return row;
    }

    const sourceScreenshot = row.Screenshot;
    const fileName = path.basename(sourceScreenshot);
    const destinationScreenshot = path.join(targetScreenshotDir, fileName);
    await fs.copyFile(sourceScreenshot, destinationScreenshot);

    return {
      ...row,
      Screenshot: `./screenshots/${fileName}`,
    };
  })
);

const payload = `window.CATALOG_DATA = ${JSON.stringify(siteRows, null, 2)};\n`;
const weeklyPayload = `window.WEEKLY_DATA = ${JSON.stringify(normalizedWeeklyRows, null, 2)};\n`;

await fs.mkdir(path.dirname(targetPath), { recursive: true });
await fs.writeFile(targetPath, payload, "utf8");
await fs.writeFile(weeklyTargetPath, weeklyPayload, "utf8");

console.log(`exported:${siteRows.length + normalizedWeeklyRows.length}`);
