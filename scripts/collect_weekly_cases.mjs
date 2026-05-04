#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const OUTPUT_PATH = path.resolve("output/weekly_cases.json");
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5";
const WEEKLY_LIMIT = Number(process.env.WEEKLY_LIMIT || 40);
const WEEKLY_QUOTA_PER_CATEGORY = Number(process.env.WEEKLY_QUOTA_PER_CATEGORY || 20);
const CASE_LIMIT_PER_SOURCE = Number(process.env.WEEKLY_CASE_LIMIT_PER_SOURCE || 30);
const USE_CDP = process.env.WEEKLY_USE_CDP === "1";
const CDP_URL = process.env.WEEKLY_CDP_URL || "http://127.0.0.1:9222";
const DEBUG = process.env.WEEKLY_DEBUG === "1";
const FORCE_FALLBACK = process.env.WEEKLY_FORCE_FALLBACK === "1";
const SOURCE_FILTER = (process.env.WEEKLY_SOURCES || "all").toLowerCase();

const DRIBBBLE_SOURCES = [
  {
    source: "Dribbble",
    rubric: "UX/UI",
    url: "https://dribbble.com/shots/popular/web-design",
  },
  {
    source: "Dribbble",
    rubric: "Брендинг",
    url: "https://dribbble.com/shots/popular/branding",
  },
];

const BEHANCE_SOURCES = [
  {
    source: "Behance",
    rubric: "UX/UI",
    url: "https://www.behance.net/galleries/ui-ux?locale=en_US",
  },
  {
    source: "Behance",
    rubric: "Брендинг",
    url: "https://www.behance.net/search/projects/branding?locale=en_US",
  },
];

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^a-z0-9а-я\s-]+/giu, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function normalizeLink(link) {
  try {
    const url = new URL(link);
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return link;
  }
}

function dedupeByLink(items) {
  const seen = new Set();
  return items.filter((item) => {
    const normalizedLink = normalizeLink(item.link);
    if (!normalizedLink || seen.has(normalizedLink)) return false;
    item.link = normalizedLink;
    seen.add(normalizedLink);
    return true;
  });
}

async function collectDribbbleLinks(page, source) {
  await page.goto(source.url, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(7000);

  const links = await page.evaluate(() => {
    const hrefs = Array.from(document.querySelectorAll('a[href*="/shots/"]'))
      .map((a) => a.href)
      .filter((href) => /\/shots\/\d+/i.test(href));
    return [...new Set(hrefs)];
  });

  const uniqueLinks = [...new Set(links.map((link) => normalizeLink(link)))];
  const selected = uniqueLinks.slice(0, CASE_LIMIT_PER_SOURCE).map((link) => ({
    source: source.source,
    rubric: source.rubric,
    link,
  }));

  if (DEBUG) {
    console.log(`source_links:${source.source}:${source.rubric}:${selected.length}`);
    selected.forEach((item) => console.log(`case_link:${item.link}`));
  }

  return selected;
}

async function collectDribbbleCase(page, candidate) {
  await page.goto(candidate.link, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(3000);

  const result = await page.evaluate((ctx) => {
    const title =
      document.querySelector('meta[property="og:title"]')?.getAttribute("content") ||
      document.querySelector("title")?.textContent ||
      "";
    const image =
      document.querySelector('meta[property="og:image"]')?.getAttribute("content") ||
      document.querySelector('meta[name="twitter:image"]')?.getAttribute("content") ||
      "";
    const description =
      document.querySelector('meta[property="og:description"]')?.getAttribute("content") ||
      "";
    const bodyText = document.body?.innerText || "";
    const likesMatch = bodyText.match(/([\d.,]+)\s+likes/i);
    const viewsMatch = bodyText.match(/([\d.,]+)\s+views/i);

    return {
      source: ctx.source,
      rubric: ctx.rubric,
      link: ctx.link,
      title: title.replace(/\s+/g, " ").trim(),
      image: image.trim(),
      description: description.replace(/\s+/g, " ").trim(),
      likes: likesMatch?.[1] || "",
      views: viewsMatch?.[1] || "",
    };
  }, candidate);

  if (DEBUG) {
    console.log(
      `case_data:${candidate.rubric}:${JSON.stringify({
        source: candidate.source,
        title: result.title,
        hasImage: Boolean(result.image),
        likes: result.likes,
        views: result.views,
      })}`
    );
  }

  return result;
}

async function collectBehanceLinks(page, source) {
  await page.goto(source.url, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(8000);

  const links = await page.evaluate(() => {
    const hrefs = Array.from(document.querySelectorAll('a[href*="/gallery/"]'))
      .map((a) => a.href)
      .filter((href) => /behance\.net\/gallery\/\d+/i.test(href));
    return [...new Set(hrefs)];
  });

  const uniqueLinks = [...new Set(links.map((link) => normalizeLink(link)))];
  const selected = uniqueLinks.slice(0, CASE_LIMIT_PER_SOURCE).map((link) => ({
    source: source.source,
    rubric: source.rubric,
    link,
  }));

  if (DEBUG) {
    console.log(`source_links:${source.source}:${source.rubric}:${selected.length}`);
    selected.forEach((item) => console.log(`case_link:${item.link}`));
  }

  return selected;
}

async function collectBehanceCase(page, candidate) {
  await page.goto(candidate.link, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(5000);

  const result = await page.evaluate((ctx) => {
    const parseLdJson = () => {
      const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
      for (const script of scripts) {
        try {
          const json = JSON.parse(script.textContent || "{}");
          if (json && json["@type"] === "VisualArtwork") {
            return json;
          }
        } catch {}
      }
      return null;
    };

    const ld = parseLdJson();
    const creator = Array.isArray(ld?.creator) ? ld.creator[0] : ld?.creator || null;
    const likeStat = Array.isArray(ld?.interactionStatistic)
      ? ld.interactionStatistic.find((item) => String(item?.interactionType || "").includes("LikeAction"))
      : null;
    const viewStat = Array.isArray(ld?.interactionStatistic)
      ? ld.interactionStatistic.find((item) => String(item?.interactionType || "").includes("WatchAction"))
      : null;

    const title =
      document.querySelector('meta[property="og:title"]')?.getAttribute("content") ||
      ld?.name ||
      document.querySelector("title")?.textContent ||
      "";
    const image =
      document.querySelector('meta[property="og:image"]')?.getAttribute("content") ||
      document.querySelector('meta[name="twitter:image"]')?.getAttribute("content") ||
      ld?.image ||
      "";
    const description =
      document.querySelector('meta[property="og:description"]')?.getAttribute("content") ||
      ld?.description ||
      "";

    return {
      source: ctx.source,
      rubric: ctx.rubric,
      link: ctx.link,
      title: title.replace(/\s+/g, " ").trim(),
      image: image.trim(),
      description: description.replace(/\s+/g, " ").trim(),
      likes: likeStat?.userInteractionCount ? String(likeStat.userInteractionCount) : "",
      views: viewStat?.userInteractionCount ? String(viewStat.userInteractionCount) : "",
      author: creator?.name ? String(creator.name).replace(/\s+/g, " ").trim() : "",
      authorUrl: creator?.url || "",
    };
  }, candidate);

  if (DEBUG) {
    console.log(
      `case_data:${candidate.source}:${candidate.rubric}:${JSON.stringify({
        title: result.title,
        hasImage: Boolean(result.image),
        likes: result.likes,
        views: result.views,
        author: result.author,
      })}`
    );
  }

  return result;
}

async function collectCandidates() {
  const browser = USE_CDP
    ? await chromium.connectOverCDP(CDP_URL)
    : await chromium.launch({ headless: true });

  try {
    const context = browser.contexts?.()[0] || (await browser.newContext());
    const listPage = await context.newPage();
    const candidates = [];

    if (SOURCE_FILTER === "all" || SOURCE_FILTER === "dribbble") {
      for (const source of DRIBBBLE_SOURCES) {
        try {
          const links = await collectDribbbleLinks(listPage, source);
          for (const linkCandidate of links) {
            const page = await context.newPage();
            try {
              const item = await collectDribbbleCase(page, linkCandidate);
              if (item.title && item.image && item.link) {
                candidates.push(item);
              }
            } catch (error) {
              console.error(`case_failed:${linkCandidate.link}:${error.message}`);
            } finally {
              await page.close();
            }
          }
        } catch (error) {
          console.error(`source_failed:${source.url}:${error.message}`);
        }
      }
    }

    if (SOURCE_FILTER === "all" || SOURCE_FILTER === "behance") {
      for (const source of BEHANCE_SOURCES) {
        try {
          const links = await collectBehanceLinks(listPage, source);
          for (const linkCandidate of links) {
            const page = await context.newPage();
            try {
              const item = await collectBehanceCase(page, linkCandidate);
              if (item.title && item.image && item.link) {
                candidates.push(item);
              }
            } catch (error) {
              console.error(`case_failed:${linkCandidate.link}:${error.message}`);
            } finally {
              await page.close();
            }
          }
        } catch (error) {
          console.error(`source_failed:${source.url}:${error.message}`);
        }
      }
    }

    await listPage.close();
    const deduped = dedupeByLink(candidates);
    if (DEBUG) {
      console.log(`candidates_total:${deduped.length}`);
    }
    return deduped;
  } finally {
    await browser.close();
  }
}

async function rankWithOpenAI(candidates) {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required");
  }

  const schema = {
    name: "weekly_cases",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["cases"],
      properties: {
        cases: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["title", "link", "image", "subrubric", "description"],
            properties: {
              title: { type: "string" },
              link: { type: "string" },
              image: { type: "string" },
              subrubric: { type: "string", enum: ["UX/UI", "Брендинг"] },
              description: { type: "string" },
            },
          },
        },
      },
    },
  };

  const prompt = [
    "Ты собираешь еженедельную подборку сильных дизайн-кейсов.",
    `Выбери не больше ${WEEKLY_LIMIT} кейсов из списка кандидатов.`,
    `Соблюдай квоту: ${WEEKLY_QUOTA_PER_CATEGORY} кейсов UX/UI и ${WEEKLY_QUOTA_PER_CATEGORY} кейсов Брендинг.`,
    "Не выдумывай ничего и используй только переданные поля.",
    "Оставляй только сильные прямые кейсы с хорошей обложкой.",
    "Сохраняй исходную категорию кандидата: UX/UI или Брендинг.",
    "В description пиши коротко на русском в формате: '<Source> · <likes> likes · <views> views'.",
  ].join(" ");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: prompt }],
        },
        {
          role: "user",
          content: [{ type: "input_text", text: JSON.stringify(candidates, null, 2) }],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          ...schema,
        },
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${text}`);
  }

  const json = await response.json();
  const outputText = json.output_text || json.output?.[0]?.content?.[0]?.text || "{}";
  return JSON.parse(outputText).cases || [];
}

function buildFallbackCases(candidates) {
  return candidates.slice(0, WEEKLY_LIMIT).map((candidate) => ({
    title: candidate.title,
    link: candidate.link,
    image: candidate.image,
    source: candidate.source,
    subrubric: candidate.rubric,
    author: candidate.author || "",
    description: candidate.source,
  }));
}

function normalizeWeeklyDescription(description) {
  return String(description || "")
    .replace(/\s*·\s*weekly case\b/gi, "")
    .replace(/\bweekly case\b/gi, "")
    .replace(/\s*·\s*$/g, "")
    .trim();
}

function hydrateSelectedItems(selected, candidates) {
  const candidateByLink = new Map(
    candidates.map((candidate) => [normalizeLink(candidate.link), candidate])
  );

  return selected.map((item) => {
    const matched = candidateByLink.get(normalizeLink(item.link));
    const source =
      item.source ||
      matched?.source ||
      (String(item.description || "").startsWith("Behance")
        ? "Behance"
        : String(item.description || "").startsWith("Dribbble")
          ? "Dribbble"
          : "");

    return {
      ...item,
      link: normalizeLink(item.link),
      source,
      author: item.author || matched?.author || "",
    };
  });
}

function buildCandidateFallback(candidates) {
  return candidates.map((candidate) => ({
    title: candidate.title,
    link: candidate.link,
    image: candidate.image,
    source: candidate.source,
    subrubric: candidate.rubric,
    author: candidate.author || "",
    description: `${candidate.source}${candidate.likes ? ` · ${candidate.likes} likes` : ""}${candidate.views ? ` · ${candidate.views} views` : ""}`.trim(),
  }));
}

function enforceQuotas(selected, candidates) {
  const hydrated = hydrateSelectedItems(selected, candidates);
  const fallback = buildCandidateFallback(candidates);
  const candidatePool = [...hydrated, ...fallback];

  const output = [];
  const globalSeen = new Set();
  const categories = ["UX/UI", "Брендинг"];
  const sources = ["Dribbble", "Behance"];

  const takeItems = (filterFn, limit) => {
    const picked = [];
    for (const item of candidatePool) {
      const normalizedLink = normalizeLink(item.link);
      if (picked.length >= limit) break;
      if (globalSeen.has(normalizedLink)) continue;
      if (!filterFn(item)) continue;
      picked.push(item);
      globalSeen.add(normalizedLink);
    }
    return picked;
  };

  if (SOURCE_FILTER === "all") {
    const perBucketQuota = Math.max(1, Math.floor(WEEKLY_QUOTA_PER_CATEGORY / sources.length));
    for (const category of categories) {
      for (const source of sources) {
        output.push(
          ...takeItems(
            (item) => item.subrubric === category && item.source === source,
            perBucketQuota
          )
        );
      }
    }
  }

  for (const category of categories) {
    const currentCount = output.filter((item) => item.subrubric === category).length;
    const remaining = Math.max(0, WEEKLY_QUOTA_PER_CATEGORY - currentCount);
    if (remaining > 0) {
      output.push(...takeItems((item) => item.subrubric === category, remaining));
    }
  }

  return output.slice(0, WEEKLY_QUOTA_PER_CATEGORY * 2);
}

async function main() {
  const candidates = await collectCandidates();
  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });

  if (!candidates.length) {
    await fs.writeFile(OUTPUT_PATH, "[]\n", "utf8");
    console.log("weekly-cases:0");
    return;
  }

  let selected = [];
  if (!FORCE_FALLBACK) {
    try {
      selected = await rankWithOpenAI(candidates);
    } catch (error) {
      console.error(`ranking_failed:${error.message}`);
    }
  }
  if (!selected.length) {
    selected = buildFallbackCases(candidates);
  }
  selected = enforceQuotas(selected, candidates);
  if (DEBUG) {
    console.log(`selected_total:${selected.length}`);
  }
  const rows = selected.slice(0, WEEKLY_LIMIT).map((item) => ({
    Resource: item.title,
    Rubric: "Викли",
    Subrubric: item.subrubric,
    Link: item.link,
    Slug: `weekly-${slugify(item.title)}`,
    Author: item.author || "",
    Description: normalizeWeeklyDescription(item.description),
    AccessStatus: "ok",
    Screenshot: item.image,
    ScreenshotSource: "remote",
    InfoSource: "weekly-openai",
  }));

  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(rows, null, 2)}\n`, "utf8");
  console.log(`weekly-cases:${rows.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
