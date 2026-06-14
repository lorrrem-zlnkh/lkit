#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const raw = await fs.readFile(path.resolve("output/dictionary_raw.txt"), "utf8");
const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);

const entries = [];
let currentLetter = "А";
const usedIds = new Set();

function makeId(term) {
  const clean = term.replace(/\s*\(.*/, "").trim();
  const firstWord = clean.split(/[\s-]/)[0];
  const base = firstWord.toLowerCase().replace(/[^а-яёa-z0-9]/g, "");
  return base || "term";
}

function uniqueId(term) {
  const base = makeId(term);
  if (!usedIds.has(base)) { usedIds.add(base); return base; }
  let i = 2;
  while (usedIds.has(base + i)) i++;
  usedIds.add(base + i);
  return base + i;
}

for (const line of lines) {
  if (/^[А-ЯЁA-Z]$/.test(line)) { currentLetter = line; continue; }
  const sepIdx = line.indexOf(" — ");
  if (sepIdx === -1) continue;
  const term = line.substring(0, sepIdx).trim();
  const definition = line.substring(sepIdx + 3).trim();
  if (!term || !definition || term.length > 150) continue;
  entries.push({ id: uniqueId(term), term, definition, letter: currentLetter });
}

const output = `window.DICTIONARY_DATA = ${JSON.stringify(entries, null, 2)};\n`;
await fs.writeFile(path.resolve("site/dictionary-data.js"), output, "utf8");
console.log(`Generated ${entries.length} dictionary entries`);
