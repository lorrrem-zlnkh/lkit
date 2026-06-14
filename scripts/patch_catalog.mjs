#!/usr/bin/env node
// Применяет точечные правки к catalog-data.js по Slug.
// Источник правок — ручная сверка названий карточек с реальными страницами
// (WebFetch) и отчётом output/link_report.json.
import fs from "node:fs/promises";
import path from "node:path";

const dataPath = path.resolve("site/catalog-data.js");
const raw = await fs.readFile(dataPath, "utf8");
const data = JSON.parse(raw.replace(/^window\.CATALOG_DATA\s*=\s*/, "").replace(/;\s*$/, ""));

// slug -> { Link?, Description?, AccessStatus? }
const patches = {
  // === Ребренды / уехавшие на другой продукт (подтверждено 301/308) ===
  "creatopy-com": {
    Link: "https://www.thebrief.ai/",
    AccessStatus: "ok",
    Description:
      "The Brief AI (ранее Creatopy) — платформа для генерации рекламных креативов: статичных, анимированных и UGC-видео в сотнях вариаций для маркетинговых кампаний.",
  },
  "podcastle": {
    Link: "https://async.com/",
    AccessStatus: "ok",
    Description:
      "Async (ранее Podcastle) — ИИ-студия для создания и редактирования видео и аудио: монтаж через чат с ИИ, озвучка, дубляж, субтитры и работа с голосом.",
  },
  "weavy-ai": {
    Link: "https://weave.figma.com/",
    AccessStatus: "ok",
    Description:
      "Figma Weave (ранее Weavy) — нодовый ИИ-редактор, объединяющий разные AI-модели и профессиональные инструменты в единый креативный workflow.",
  },
  "texturelab": {
    Link: "https://www.scenario.com/features/textures/",
    AccessStatus: "ok",
    Description:
      "Генератор бесшовных текстур и материалов для 3D и игр; теперь часть платформы Scenario (раздел Textures).",
  },
  "screenlane": {
    Link: "https://pageflows.com/",
    AccessStatus: "ok",
    Description:
      "Page Flows (бывш. Screenlane) — библиотека UI/UX-вдохновения: 100 000+ записанных пользовательских сценариев, экранов и интерфейсных паттернов из топовых приложений.",
  },
  "ui-movement": {
    Link: "https://pageflows.com/",
    AccessStatus: "ok",
    Description:
      "Page Flows (бывш. UI Movement) — библиотека UI/UX-вдохновения: записанные пользовательские сценарии (user flows), экраны и анимации интерфейсов из топовых приложений.",
  },

  // === Починка URL (рабочий корень вместо битой глубокой ссылки) ===
  "pixverse-ai": {
    Link: "https://pixverse.ai/",
    AccessStatus: "ok",
    Description:
      "PixVerse — платформа для генерации ИИ-видео из текста и изображений с эффектами, шаблонами и social-first сценариями.",
  },
  "7-ai-mitup-ru-prompts-универсальный-материал-коллекция-универсальных-промтов-для-создания-контента-и-автоматизации-рутины": {
    Link: "https://ai.mitup.ru/",
    AccessStatus: "ok",
    Description:
      "Mitup AI — агрегатор нейросетей (GPT, Gemini, DeepSeek, YandexGPT) в одном интерфейсе с готовыми промптами и примерами для генерации контента.",
  },

  // === Описание описывает не тот продукт (ссылка верная) ===
  "base44": {
    AccessStatus: "ok",
    Description:
      "Base44 — no-code конструктор приложений на ИИ: от идеи до работающего приложения за минуты, без кода и настройки.",
  },
  "фокус": {
    Link: "https://fokus.am/",
    AccessStatus: "ok",
    Description:
      "«Фокус» — конструктор презентаций от Студии Артемия Лебедева: готовые шаблоны, простой редактор и ИИ для быстрой сборки слайдов.",
  },
  "monday-hero": {
    AccessStatus: "ok",
    Description:
      "Monday Hero — инструмент для конвертации макетов из Figma, Adobe XD и Sketch в код интерфейса.",
  },
  "parrotxt": {
    AccessStatus: "ok",
    Description: "Parrotxt — простой веб-инструмент для генерации текста.",
  },
  "moda": {
    AccessStatus: "ok",
    Description:
      "Moda — ИИ-инструмент для создания редактируемых презентаций, слайдов, постов для соцсетей, PDF и диаграмм на управляемом холсте.",
  },
  "moody": {
    AccessStatus: "ok",
    Description:
      "Moody — телесуфлёр (teleprompter) для Mac: показывает сценарий рядом с камерой незаметно для зрителя и следует за вашим голосом.",
  },

  // === Мёртвые ресурсы / ссылка ведёт не туда (нужна замена) ===
  "unfakepng": {
    AccessStatus: "нужна новая публичная ссылка",
    Description:
      "Инструмент для очистки PNG от артефактов в прозрачных областях и на вырезанных объектах. Домен больше не работает (выставлен на продажу) — нужна новая ссылка или замена.",
  },
  "studiored-com": {
    AccessStatus: "нужна новая публичная ссылка",
    Description:
      "Конвертер RGB/HEX → Pantone от StudioRed. Страница конвертера больше недоступна (404), на домене теперь студия промышленного дизайна — нужна замена.",
  },
  "запуск-завтра": {
    AccessStatus: "нужна новая публичная ссылка",
    Description:
      "«Запуск завтра» — подкаст о том, как устроены технологии и цифровой мир. Текущая ссылка ведёт на отдельный эпизод в Яндекс Музыке — стоит заменить на страницу подкаста.",
  },
};

let applied = 0;
const missing = [];
for (const [slug, patch] of Object.entries(patches)) {
  const entry = data.find((d) => d.Slug === slug);
  if (!entry) {
    missing.push(slug);
    continue;
  }
  Object.assign(entry, patch);
  applied++;
}

if (missing.length) {
  console.error("НЕ НАЙДЕНЫ слаги:", missing);
  process.exit(1);
}

const out = `window.CATALOG_DATA = ${JSON.stringify(data, null, 2)};\n`;
await fs.writeFile(dataPath, out, "utf8");
console.log(`Применено правок: ${applied} из ${Object.keys(patches).length}`);
