#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

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

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, "\"\"")}"` : text;
}

function mdEscape(value) {
  return String(value ?? "").replace(/\|/g, "\\|");
}

function extractHost(value) {
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function classifyFailure(row) {
  const link = String(row.Link || "");
  const slug = String(row.Slug || "");
  const error = String(row.Error || "");
  const host = extractHost(link);
  const lowerError = error.toLowerCase();
  const lowerLink = link.toLowerCase();
  const isAppLike =
    host.startsWith("app.") ||
    lowerLink.includes("/login") ||
    lowerLink.includes("/signin") ||
    lowerLink.includes("/auth") ||
    lowerLink.includes("/editor") ||
    lowerLink.includes("/home") ||
    lowerLink.includes("/projects") ||
    /chat\.openai|chatgpt\.com|claude\.ai|perplexity\.ai|ideogram\.ai\/login|app\.leonardo\.ai/.test(
      lowerLink
    );
  const isFigmaPlugin =
    host === "www.figma.com" && lowerLink.includes("/community/plugin/");

  if (isFigmaPlugin && lowerError.includes("http 403")) {
    return {
      failureReason: "страница плагина Figma недоступна для автоматического обхода",
      failureGroup: "403 / ограничение доступа",
    };
  }

  if (isAppLike) {
    return {
      failureReason: "требует авторизацию или ведёт на приватный app/deep-link",
      failureGroup: "требует авторизацию",
    };
  }

  if (lowerError.includes("http 404") || lowerError.includes("err_name_not_resolved")) {
    return {
      failureReason: "битая ссылка, несуществующая страница или домен не найден",
      failureGroup: "битая ссылка или домен",
    };
  }

  if (lowerError.includes("http 403") || lowerError.includes("http 429")) {
    return {
      failureReason: "доступ запрещён, сайт блокирует автоматизацию или ограничивает трафик",
      failureGroup: "403 / ограничение доступа",
    };
  }

  if (
    lowerError.includes("interrupted by another navigation") ||
    lowerError.includes("chrome-error://chromewebdata") ||
    lowerError.includes("execution context was destroyed")
  ) {
    return {
      failureReason: "нестабильный редирект, deep-link или страница ломает автоматическую навигацию",
      failureGroup: "редирект / нестабильная навигация",
    };
  }

  if (
    lowerError.includes("timeout") ||
    lowerError.includes("err_socket_not_connected") ||
    lowerError.includes("err_http2_protocol_error") ||
    lowerError.includes("err_aborted")
  ) {
    return {
      failureReason: "страница не успела открыться, слишком тяжёлая или нестабильно отвечает",
      failureGroup: "таймаут / нестабильная загрузка",
    };
  }

  return {
    failureReason: "не удалось автоматически открыть страницу",
    failureGroup: "прочее",
  };
}

function toMarkdown(rows) {
  const lines = [
    "| Ресурс | Категория | Причина | Группа | Ссылка | Slug |",
    "| --- | --- | --- | --- | --- | --- |",
  ];

  for (const row of rows) {
    lines.push(
      `| ${mdEscape(row.Title || row.Resource)} | ${mdEscape(row.Category)} | ${mdEscape(
        row.FailureReason
      )} | ${mdEscape(row.FailureGroup)} | ${mdEscape(row.Link)} | ${mdEscape(row.Slug)} |`
    );
  }

  return lines.join("\n");
}

function toMainMarkdown(rows) {
  const lines = [
    "| # | Ресурс | Категория | Описание | Статус | Причина | Ссылка | Скриншот |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |",
  ];

  rows.forEach((row, index) => {
    const screenshot = row.ScreenshotPath ? `[png](${row.ScreenshotPath})` : "";
    lines.push(
      `| ${index + 1} | ${mdEscape(row.Title)} | ${mdEscape(row.Category)} | ${mdEscape(
        row.Description
      )} | ${mdEscape(row.Status)} | ${mdEscape(row.FailureGroup)} | ${mdEscape(row.Link)} | ${screenshot} |`
    );
  });

  return lines.join("\n");
}

const args = parseArgs(process.argv);
const inputPath = path.resolve(args.input || "output/resources_table_enriched.json");
const outputBase = path.resolve(args.output || "output/resources_not_working_classified");

const rows = JSON.parse(await fs.readFile(inputPath, "utf8"));
const failures = rows.filter((row) => row.Status === "не работает");

const enrichedRows = rows.map((row) => {
  if (row.Status !== "не работает") {
    return {
      ...row,
      FailureReason: "",
      FailureGroup: "",
    };
  }

  const classification = classifyFailure(row);
  return {
    ...row,
    FailureReason: classification.failureReason,
    FailureGroup: classification.failureGroup,
  };
});

const classifiedFailures = enrichedRows.filter((row) => row.Status === "не работает");

const summary = classifiedFailures.reduce((acc, row) => {
  acc[row.FailureGroup] = (acc[row.FailureGroup] || 0) + 1;
  return acc;
}, {});

await fs.writeFile(inputPath, JSON.stringify(enrichedRows, null, 2), "utf8");

const enrichedHeader = [
  "Title",
  "Category",
  "Link",
  "Slug",
  "Description",
  "Status",
  "FailureGroup",
  "FailureReason",
  "FinalURL",
  "ScreenshotPath",
  "LegacyCategory",
  "LegacySubcategory",
];
const enrichedCsv = [
  enrichedHeader.join(","),
  ...enrichedRows.map((row) => enrichedHeader.map((key) => csvEscape(row[key])).join(",")),
].join("\n");
await fs.writeFile(path.resolve("output/resources_table_enriched.csv"), enrichedCsv, "utf8");
await fs.writeFile(path.resolve("output/resources_table_enriched.md"), toMainMarkdown(enrichedRows), "utf8");

const failureHeader = ["Title", "Category", "FailureGroup", "FailureReason", "Link", "Slug"];
const failureCsv = [
  failureHeader.join(","),
  ...classifiedFailures.map((row) => failureHeader.map((key) => csvEscape(row[key])).join(",")),
].join("\n");

await fs.writeFile(`${outputBase}.json`, JSON.stringify(classifiedFailures, null, 2), "utf8");
await fs.writeFile(`${outputBase}.csv`, failureCsv, "utf8");
await fs.writeFile(`${outputBase}.md`, toMarkdown(classifiedFailures), "utf8");
await fs.writeFile(
  `${outputBase}_summary.json`,
  JSON.stringify(
    {
      totalFailures: failures.length,
      byGroup: Object.fromEntries(Object.entries(summary).sort((a, b) => b[1] - a[1])),
    },
    null,
    2
  ),
  "utf8"
);

console.log(JSON.stringify({ totalFailures: failures.length, byGroup: summary }, null, 2));
