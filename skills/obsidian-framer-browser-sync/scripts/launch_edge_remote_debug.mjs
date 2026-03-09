#!/usr/bin/env node

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const edgePath = "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge";
const profileDir = path.join(os.homedir(), ".codex", "edge-framer-profile");
const port = process.argv[2] || "9222";

await fs.mkdir(profileDir, { recursive: true });

const child = spawn(
  edgePath,
  [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profileDir}`,
    "https://framer.com"
  ],
  {
    detached: true,
    stdio: "ignore",
  }
);

child.unref();

console.log(`Launched Microsoft Edge with remote debugging on port ${port}`);
console.log(`Profile dir: ${profileDir}`);
