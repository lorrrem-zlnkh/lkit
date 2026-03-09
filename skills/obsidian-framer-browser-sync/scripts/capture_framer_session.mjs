#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
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

const args = parseArgs(process.argv);
const projectUrl = args["project-url"];
const browserPath = args["browser-path"];
const cdpUrl = args["cdp-url"];
if (!projectUrl) {
  console.error("Missing required --project-url");
  process.exit(1);
}

const authDir = path.resolve(".auth");
const storagePath = path.join(authDir, "framer-storage.json");

await fs.mkdir(authDir, { recursive: true });

const browser = cdpUrl
  ? await chromium.connectOverCDP(cdpUrl)
  : await chromium.launch({
      headless: false,
      executablePath: browserPath || undefined,
    });

const context = browser.contexts()[0] || (await browser.newContext());
const page = context.pages()[0] || (await context.newPage());

await page.goto(projectUrl, { waitUntil: "domcontentloaded" });

const rl = readline.createInterface({ input, output });
await rl.question(
  `Log into Framer in the opened browser, reach the project, then press Enter to save the session to ${storagePath}.`
);
await rl.close();

await context.storageState({ path: storagePath });
await browser.close();

console.log(`Saved session state to ${storagePath}`);
