#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const weeklySourcePath = path.resolve("output/weekly_cases.json");
const weeklyTargetPath = path.resolve("site/weekly-data.js");

const weeklyRows = JSON.parse(await fs.readFile(weeklySourcePath, "utf8"));

if (!Array.isArray(weeklyRows)) {
  throw new Error("weekly_cases.json must contain an array");
}

const normalizedWeeklyRows = weeklyRows.map((row) => ({
  ...row,
  Description: String(row.Description || "")
    .replace(/\s*·\s*weekly case\b/gi, "")
    .replace(/\bweekly case\b/gi, "")
    .replace(/\s*·\s*$/g, "")
    .trim(),
}));

const weeklyPayload = `window.WEEKLY_DATA = ${JSON.stringify(normalizedWeeklyRows, null, 2)};\n`;

await fs.mkdir(path.dirname(weeklyTargetPath), { recursive: true });
await fs.writeFile(weeklyTargetPath, weeklyPayload, "utf8");

console.log(`weekly-exported:${normalizedWeeklyRows.length}`);
