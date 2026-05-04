#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const targetPath = path.resolve("output/weekly_cases.json");

// This script keeps the Weekly container valid and intentionally conservative.
// Add only direct case URLs and real image URLs to output/weekly_cases.json.

const current = JSON.parse(await fs.readFile(targetPath, "utf8"));

if (!Array.isArray(current)) {
  throw new Error("weekly_cases.json must contain an array");
}

const sanitized = current
  .filter((item) => item?.Rubric === "Викли")
  .filter((item) => item?.Subrubric === "UX/UI" || item?.Subrubric === "Брендинг")
  .filter((item) => typeof item?.Link === "string" && item.Link.startsWith("http"))
  .filter((item) => !item.Screenshot || typeof item.Screenshot === "string");

await fs.writeFile(targetPath, `${JSON.stringify(sanitized.slice(0, 20), null, 2)}\n`, "utf8");
console.log(`weekly-cases:${Math.min(sanitized.length, 20)}`);
