const data = window.CATALOG_DATA || [];
const dictData = window.DICTIONARY_DATA || [];

const ALL_LABEL = "Все";
const DEFAULT_RUBRIC = "Инструменты";
const DICT_MODE = "__dict__";
const BLOG_URL = "https://t.me/lorrrem";

const searchInput = document.querySelector("#search-input");
const grid = document.querySelector("#catalog-grid");
const dictView = document.querySelector("#dict-view");
const template = document.querySelector("#card-template");
const rubricNav = document.querySelector("#rubric-nav");
const subcategoryTabs = document.querySelector("#subcategory-tabs");

const collator = new Intl.Collator("ru");
let activeRubric = DEFAULT_RUBRIC;
let activeSubrubric = "";
const rubricOrder = [
  "Инструменты",
  "ИИ",
  "Ресурсы",
  "Продвижение",
  "Контент и обучение",
];

const SEARCH_GROUPS = {
  icon: ["icon", "icons", "икон", "иконки", "иконка", "svg", "glyph", "symbol", "symbols", "пиктограмм"],
  ai: ["ai", "ии", "ml", "llm", "gpt", "claude", "midjourney", "runway", "нейро", "нейросет", "генерац"],
  svg: ["svg", "vector", "vectors", "vectorize", "вектор", "векторн", "икон"],
  image: ["image", "images", "graphic", "graphics", "illustration", "изображ", "график", "иллюстр"],
  figma: ["figma", "plugin", "plugins", "плагин", "плагины"],
  font: ["font", "fonts", "type", "typography", "шрифт", "типограф"],
  color: ["color", "palette", "gradient", "цвет", "палит", "градиент"],
  video: ["video", "motion", "animate", "animation", "видео", "анимац", "motion"],
  audio: ["audio", "voice", "music", "sound", "подкаст", "голос", "музык", "аудио"],
  text: ["text", "copy", "writing", "writer", "текст", "письмо", "копирайт", "контент"],
  accessibility: ["accessibility", "a11y", "wcag", "доступ", "доступност"],
  marketing: ["marketing", "promo", "smm", "seo", "ads", "реклама", "продвиж", "маркетинг"],
};

const INTENT_CONFIG = {
  icon: {
    queryTerms: ["икон", "icon", "icons", "glyph", "favicon", "пиктограмм"],
    strongTerms: ["икон", "icon", "icons", "glyph", "glyphs", "favicon", "favicons", "ui icon", "app icon", "svg icon", "пиктограмм"],
    exactSubrubrics: ["иконки"],
    negativeTerms: ["иллюстр", "illustration", "сток", "stock", "asset", "assets", "graphic", "graphics"],
    boost: 12,
  },
  ai: {
    queryTerms: ["ai", "ии", "нейро", "нейросет", "gpt", "llm", "genai"],
    strongTerms: ["ai", "ии", "нейро", "нейросет", "gpt", "chatgpt", "claude", "midjourney", "runway", "llm"],
    exactRubrics: ["ии"],
    boost: 8,
  },
  svg: {
    queryTerms: ["svg", "vector", "вектор", "vectorize"],
    strongTerms: ["svg", "vector", "вектор", "vectorize", "vectorizer", "eps", "pdf"],
    boost: 8,
  },
  figma: {
    queryTerms: ["figma", "плагин", "плагины", "plugin", "plugins"],
    strongTerms: ["figma", "плагин", "плагины", "plugin", "plugins"],
    exactSubrubrics: ["figma-плагины"],
    boost: 10,
  },
  font: {
    queryTerms: ["шрифт", "шрифты", "font", "fonts", "типограф", "typography", "typeface"],
    strongTerms: ["шрифт", "font", "fonts", "типограф", "typography", "typeface", "lettering"],
    exactSubrubrics: ["шрифты и типографика"],
    negativeTerms: ["икон", "icon", "video", "видео"],
    boost: 10,
  },
  color: {
    queryTerms: ["цвет", "палит", "palette", "gradient", "градиент", "color", "colors"],
    strongTerms: ["цвет", "палит", "palette", "gradient", "градиент", "color", "colors"],
    exactSubrubrics: ["цвет и палитры"],
    boost: 10,
  },
  video: {
    queryTerms: ["видео", "video", "motion", "animation", "анимац"],
    strongTerms: ["видео", "video", "motion", "animation", "анимац", "editing", "editor", "clip"],
    exactSubrubrics: ["видео и анимация", "медиа-инструменты", "фильмы и видео"],
    negativeTerms: ["аудио", "podcast", "подкаст"],
    boost: 10,
  },
  audio: {
    queryTerms: ["аудио", "audio", "voice", "music", "sound", "голос", "музык", "podcast", "подкаст"],
    strongTerms: ["аудио", "audio", "voice", "music", "sound", "голос", "музык", "podcast", "подкаст", "speech"],
    exactSubrubrics: ["аудио и голос", "подкасты"],
    negativeTerms: ["видео", "animation", "анимац"],
    boost: 10,
  },
  text: {
    queryTerms: ["текст", "text", "writing", "writer", "copy", "копирайт", "контент", "prompt", "промпт"],
    strongTerms: ["текст", "text", "writing", "writer", "copy", "контент", "prompt", "промпт", "ассист", "assistant"],
    exactSubrubrics: ["текст и ассистенты", "текст и контент", "промпты и библиотеки"],
    boost: 8,
  },
  accessibility: {
    queryTerms: ["accessibility", "a11y", "wcag", "доступ", "доступност"],
    strongTerms: ["accessibility", "a11y", "wcag", "доступ", "доступност", "screen reader", "контраст"],
    exactRubrics: ["доступность"],
    boost: 12,
  },
  marketing: {
    queryTerms: ["marketing", "promo", "smm", "seo", "ads", "реклама", "продвиж", "маркетинг"],
    strongTerms: ["marketing", "promo", "smm", "seo", "ads", "реклама", "продвиж", "маркетинг", "billboard"],
    exactRubrics: ["продвижение"],
    boost: 10,
  },
  image: {
    queryTerms: ["image", "images", "graphic", "graphics", "illustration", "изображ", "график", "иллюстр", "mockup", "мокап"],
    strongTerms: ["image", "images", "graphic", "graphics", "illustration", "изображ", "график", "иллюстр", "mockup", "мокап", "render"],
    exactSubrubrics: ["изображения и графика", "иллюстрации и стоки", "мокапы и сцены"],
    negativeTerms: ["икон", "icon", "font", "шрифт"],
    boost: 8,
  },
};

function normalizeText(value) {
  return (value || "")
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^\p{L}\p{N}\s-]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stemToken(token) {
  return token
    .replace(/(иями|ями|ами|ией|ией|ого|ему|ому|ыми|ими|ать|ять|ить|еть|ции|ция|ции|ов|ев|ом|ем|ой|ый|ий|ая|ое|ые|ам|ям|ах|ях|ия|ий|ие|ые|ое|ть|ти|ы|и|а|я|о|е|у|ю)$/u, "")
    .trim();
}

function tokenize(value) {
  return normalizeText(value)
    .split(/[\s/-]+/u)
    .map(stemToken)
    .filter((token) => token.length > 1);
}

function expandToken(token) {
  const expanded = new Set([token]);

  Object.values(SEARCH_GROUPS).forEach((variants) => {
    const stems = variants.map(stemToken);
    if (stems.some((variant) => token.includes(variant) || variant.includes(token))) {
      stems.forEach((variant) => expanded.add(variant));
    }
  });

  return [...expanded];
}

function buildSearchIndex(item) {
  const fields = [item.Resource, item.Rubric, item.Subrubric, item.Description];
  const tokenSet = new Set();
  const raw = normalizeText(fields.join(" "));
  const titleRaw = normalizeText(item.Resource || "");
  const rubricRaw = normalizeText(item.Rubric || "");
  const subrubricRaw = normalizeText(item.Subrubric || "");
  const descriptionRaw = normalizeText(item.Description || "");
  const intents = Object.fromEntries(
    Object.entries(INTENT_CONFIG).map(([intent, config]) => {
      const strongSignal =
        (config.exactRubrics || []).some((value) => rubricRaw === normalizeText(value)) ||
        (config.exactSubrubrics || []).some((value) => subrubricRaw === normalizeText(value)) ||
        (config.strongTerms || []).some((term) => {
          const stemmed = stemToken(term);
          return (
            titleRaw.includes(stemmed) ||
            rubricRaw.includes(stemmed) ||
            subrubricRaw.includes(stemmed) ||
            descriptionRaw.includes(stemmed)
          );
        });
      const negativeSignal = (config.negativeTerms || []).some((term) => raw.includes(stemToken(term)));
      return [intent, { strongSignal, negativeSignal }];
    })
  );

  fields.forEach((field) => {
    tokenize(field).forEach((token) => tokenSet.add(token));
  });

  return {
    raw,
    tokens: [...tokenSet],
    intents,
  };
}

const indexedData = data.map((item) => ({
  ...item,
  __search: buildSearchIndex(item),
}));

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort(collator.compare);
}

function buildOptions(select, values) {
  const currentValue = select.value;
  const firstOption = select.querySelector("option")?.cloneNode(true);
  select.innerHTML = "";

  if (firstOption) {
    select.append(firstOption);
  }

  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.append(option);
  });

  if (values.includes(currentValue)) {
    select.value = currentValue;
  }
}

function emojiForItem(item) {
  if (item.Emoji) return item.Emoji;

  const sub = (item.Subrubric || "").toLowerCase();
  const rubric = (item.Rubric || "").toLowerCase();
  const title = (item.Resource || "").toLowerCase();
  const text = `${rubric} ${sub} ${title}`.toLowerCase();

  if (text.includes("figma")) return "🎛️";
  if (text.includes("икон")) return "🧩";
  if (text.includes("иллюстр") || text.includes("сток")) return "🖼️";
  if (text.includes("шрифт") || text.includes("типограф")) return "🔤";
  if (text.includes("цвет") || text.includes("палит")) return "🎨";
  if (text.includes("мокап")) return "📦";
  if (text.includes("ui-кит") || text.includes("дизайн-систем")) return "🧱";
  if (text.includes("видео") || text.includes("анимац")) return "🎬";
  if (text.includes("аудио") || text.includes("голос") || text.includes("музык") || text.includes("podcast")) return "🎧";
  if (text.includes("текст") || text.includes("ассист")) return "📝";
  if (text.includes("чат") || text.includes("telegram")) return "💬";
  if (text.includes("3d") || text.includes("spatial")) return "🧊";
  if (text.includes("аналит") || text.includes("исслед")) return "📊";
  if (text.includes("поиск") || text.includes("osint")) return "🕵️";
  if (text.includes("продуктив") || text.includes("организац")) return "🗂️";
  if (text.includes("браузер")) return "🧭";
  if (text.includes("обуч") || text.includes("книги") || text.includes("курсы")) return "📚";
  if (text.includes("подкаст")) return "🎙️";
  if (text.includes("блог") || text.includes("медиа")) return "📰";
  if (text.includes("доступ")) return "♿";
  if (text.includes("продвиж")) return "📣";
  if (text.includes("instagram") || text.includes("insta")) return "📸";
  if (text.includes("сайт") || text.includes("конструктор") || text.includes("webflow") || text.includes("framer")) return "🌐";
  if (text.includes("ai") || text.includes("ии") || text.includes("midjourney") || text.includes("runway") || text.includes("chatgpt") || text.includes("claude")) return "✨";
  if (title.includes("notion")) return "📓";
  if (title.includes("github")) return "💻";
  if (title.includes("google")) return "🔍";
  if (title.includes("yandex")) return "🟡";
  return "✦";
}

function renderRubrics() {
  const counts = data.reduce((acc, item) => {
    acc[item.Rubric] = (acc[item.Rubric] || 0) + 1;
    return acc;
  }, {});
  const allRubrics = uniqueSorted(data.map((item) => item.Rubric));
  const sortedRubrics = [
    ...rubricOrder.filter((rubric) => allRubrics.includes(rubric)),
    ...allRubrics.filter((rubric) => !rubricOrder.includes(rubric)),
  ];

  rubricNav.innerHTML = "";

  sortedRubrics.forEach((rubric) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "rubric-button";
    button.dataset.active = rubric === activeRubric ? "true" : "false";
    button.innerHTML = `<span>${rubric}</span><strong>${counts[rubric]}</strong>`;
    button.addEventListener("click", () => {
      searchInput.value = "";
      switchToCatalogMode(rubric);
    });
    rubricNav.append(button);
  });

  const dictButton = document.createElement("button");
  dictButton.type = "button";
  dictButton.className = "rubric-button rubric-button--dict";
  dictButton.dataset.active = activeRubric === DICT_MODE ? "true" : "false";
  dictButton.innerHTML = `<span>IT-словарь</span><strong>${dictData.length}</strong>`;
  dictButton.addEventListener("click", () => {
    searchInput.value = "";
    switchToDictMode();
  });
  rubricNav.append(dictButton);

  const blogButton = document.createElement("a");
  blogButton.className = "rubric-button rubric-button--blog";
  blogButton.href = BLOG_URL;
  blogButton.target = "_blank";
  blogButton.rel = "noreferrer";
  blogButton.innerHTML = `<span>Блог о дизайне привычных вещей</span><span class="rubric-button-icon">📰</span>`;
  rubricNav.append(blogButton);
}

function isSearchMode() {
  return Boolean(searchInput.value.trim());
}

function getRubricItems() {
  return indexedData.filter((item) => item.Rubric === activeRubric);
}

function getQueryIntent(queryTokens) {
  return Object.fromEntries(
    Object.entries(INTENT_CONFIG).map(([intent, config]) => [
      intent,
      queryTokens.some((token) =>
        (config.queryTerms || []).some((term) => {
          const stemmed = stemToken(term);
          return token.includes(stemmed) || stemmed.includes(token);
        })
      ),
    ])
  );
}

function scoreItems(items, query) {
  const queryTokens = tokenize(query);
  const queryIntent = getQueryIntent(queryTokens);

  return items
    .map((item) => {
      if (!queryTokens.length) {
        return { item, score: 0, matchCount: 0 };
      }

      const haystack = item.__search.raw;
      const itemTokens = item.__search.tokens;
      const itemIntents = item.__search.intents;
      let score = 0;
      let matchCount = 0;

      queryTokens.forEach((queryToken) => {
        const variants = expandToken(queryToken);
        const exactWord = variants.some((variant) => itemTokens.includes(variant));
        const partialWord = variants.some((variant) =>
          itemTokens.some((token) => token.includes(variant) || variant.includes(token))
        );
        const rawMatch = variants.some((variant) => haystack.includes(variant));

        if (exactWord) {
          score += 10;
          matchCount += 1;
        } else if (partialWord) {
          score += 6;
          matchCount += 1;
        } else if (rawMatch) {
          score += 3;
          matchCount += 1;
        }
      });

      if (haystack.includes(normalizeText(query))) {
        score += 8;
      }

      Object.entries(queryIntent).forEach(([intent, isActive]) => {
        if (!isActive) return;
        const config = INTENT_CONFIG[intent];
        const signals = itemIntents[intent];
        if (!signals) return;

        if (signals.strongSignal) {
          score += config.boost || 8;
        }

        if (signals.negativeSignal) {
          score -= config.boost || 8;
        }
      });

      return { item, score, matchCount };
    })
    .filter(({ item, score, matchCount }) => {
      if (!queryTokens.length) return true;
      if (!score) return false;
      if (matchCount < queryTokens.length) return false;
      for (const [intent, isActive] of Object.entries(queryIntent)) {
        if (isActive && !item.__search.intents[intent]?.strongSignal) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return collator.compare(a.item.Resource, b.item.Resource);
    });
}

function getBaseItems() {
  if (isSearchMode()) {
    return indexedData;
  }

  return getRubricItems();
}

function renderSubrubricTabs() {
  const searchMode = isSearchMode();
  const items = scoreItems(getBaseItems(), searchInput.value.trim()).map(({ item }) => item);
  const key = searchMode ? "Rubric" : "Subrubric";
  const counts = items.reduce((acc, item) => {
    acc[item[key]] = (acc[item[key]] || 0) + 1;
    return acc;
  }, {});
  let values = uniqueSorted(items.map((item) => item[key]));

  subcategoryTabs.innerHTML = "";

  const allButton = document.createElement("button");
  allButton.type = "button";
  allButton.className = "subtab-button";
  allButton.dataset.active = activeSubrubric === "" ? "true" : "false";
  allButton.innerHTML = `<span>${ALL_LABEL}</span><strong>${items.length}</strong>`;
  allButton.addEventListener("click", () => {
    activeSubrubric = "";
    renderSubrubricTabs();
    render();
  });
  subcategoryTabs.append(allButton);

  values.forEach((value) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "subtab-button";
    button.dataset.active = value === activeSubrubric ? "true" : "false";
    button.innerHTML = `<span>${value}</span><strong>${counts[value] || 0}</strong>`;
    button.addEventListener("click", () => {
      activeSubrubric = value;
      renderSubrubricTabs();
      render();
    });
    subcategoryTabs.append(button);
  });
}

function filterItems() {
  const query = searchInput.value.trim();
  const searchMode = isSearchMode();
  const key = searchMode ? "Rubric" : "Subrubric";
  return scoreItems(getBaseItems(), query)
    .map(({ item }) => item)
    .filter((item) => !activeSubrubric || item[key] === activeSubrubric);
}

function createCard(item) {
  const node = template.content.firstElementChild.cloneNode(true);
  node.href = item.Link;
  const cover = node.querySelector(".card-cover");
  const emoji = node.querySelector(".emoji-badge");
  const meta = node.querySelector(".card-meta");

  cover.hidden = true;
  emoji.hidden = false;
  emoji.textContent = emojiForItem(item);

  node.querySelector(".card-title").textContent = item.Resource;
  meta.hidden = true;
  node.querySelector(".card-description").textContent = item.Description || "Описание пока не заполнено.";
  return node;
}

function renderGrid(items) {
  grid.innerHTML = "";

  if (!items.length) {
    grid.innerHTML = `<div class="empty-state">Ничего не нашлось в разделе. Попробуй другой запрос или категорию.</div>`;
    return;
  }

  const fragment = document.createDocumentFragment();
  items.forEach((item) => fragment.append(createCard(item)));
  grid.append(fragment);
}

function render() {
  renderGrid(filterItems());
}

searchInput.addEventListener("input", () => {
  if (isDictMode()) {
    activeDictLetter = "";
    renderDictLetterTabs();
    renderDict();
  } else {
    activeSubrubric = "";
    renderSubrubricTabs();
    render();
  }
});

// ── Dictionary ────────────────────────────────────────────────────────────────

let activeDictLetter = "";

function isDictMode() {
  return activeRubric === DICT_MODE;
}

function getDictLetters() {
  const letters = [...new Set(dictData.map((e) => e.letter))];
  return letters.sort(collator.compare);
}

function filterDict(query) {
  if (!query) return dictData;
  const q = normalizeText(query);
  return dictData.filter(
    (e) => normalizeText(e.term).includes(q) || normalizeText(e.definition).includes(q)
  );
}

function copyDictLink(id) {
  const url = `${location.origin}${location.pathname}#dict-${id}`;
  navigator.clipboard.writeText(url).catch(() => {});
}

function renderDict() {
  const query = searchInput.value.trim();
  let items = filterDict(query);

  if (activeDictLetter && !query) {
    items = items.filter((e) => e.letter === activeDictLetter);
  }

  dictView.innerHTML = "";

  if (!items.length) {
    dictView.innerHTML = `<div class="empty-state">Ничего не найдено. Попробуй другой запрос.</div>`;
    return;
  }

  const groups = new Map();
  items.forEach((e) => {
    const key = query ? "Результаты" : e.letter;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(e);
  });

  const fragment = document.createDocumentFragment();
  groups.forEach((entries, letter) => {
    const group = document.createElement("div");
    group.className = "dict-letter-group";

    const heading = document.createElement("h2");
    heading.className = "dict-letter-heading";
    heading.textContent = letter;
    group.append(heading);

    entries.forEach((entry) => {
      const row = document.createElement("div");
      row.className = "dict-term";
      row.id = `dict-${entry.id}`;

      const termEl = document.createElement("div");
      termEl.className = "dict-term-header";

      const title = document.createElement("span");
      title.className = "dict-term-title";
      title.textContent = entry.term;

      const shareBtn = document.createElement("button");
      shareBtn.type = "button";
      shareBtn.className = "dict-share-btn";
      shareBtn.title = "Скопировать ссылку";
      shareBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`;
      shareBtn.addEventListener("click", () => {
        copyDictLink(entry.id);
        shareBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;
        setTimeout(() => { shareBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`; }, 1500);
      });

      termEl.append(title, shareBtn);

      const def = document.createElement("p");
      def.className = "dict-term-def";
      const defText = entry.definition;
      def.textContent = defText.charAt(0).toUpperCase() + defText.slice(1);

      row.append(termEl, def);
      group.append(row);
    });

    fragment.append(group);
  });

  dictView.append(fragment);
}

function renderDictLetterTabs() {
  subcategoryTabs.innerHTML = "";
  const query = searchInput.value.trim();
  if (query) return;

  const letters = getDictLetters();
  const allBtn = document.createElement("button");
  allBtn.type = "button";
  allBtn.className = "subtab-button";
  allBtn.dataset.active = activeDictLetter === "" ? "true" : "false";
  allBtn.innerHTML = `<span>Все</span><strong>${dictData.length}</strong>`;
  allBtn.addEventListener("click", () => {
    activeDictLetter = "";
    renderDictLetterTabs();
    renderDict();
  });
  subcategoryTabs.append(allBtn);

  letters.forEach((letter) => {
    const count = dictData.filter((e) => e.letter === letter).length;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "subtab-button";
    btn.dataset.active = letter === activeDictLetter ? "true" : "false";
    btn.innerHTML = `<span>${letter}</span><strong>${count}</strong>`;
    btn.addEventListener("click", () => {
      activeDictLetter = letter;
      renderDictLetterTabs();
      renderDict();
    });
    subcategoryTabs.append(btn);
  });
}

function switchToDictMode() {
  activeRubric = DICT_MODE;
  activeSubrubric = "";
  activeDictLetter = "";
  grid.hidden = true;
  dictView.hidden = false;
  document.body.classList.add("dict-active");
  searchInput.placeholder = "Поиск по словарю";
  renderRubrics();
  renderDictLetterTabs();
  renderDict();
}

function switchToCatalogMode(rubric) {
  activeRubric = rubric || DEFAULT_RUBRIC;
  activeSubrubric = "";
  grid.hidden = false;
  dictView.hidden = true;
  document.body.classList.remove("dict-active");
  searchInput.placeholder = "Поиск";
  renderRubrics();
  renderSubrubricTabs();
  render();
}

function highlightDictTerm(id) {
  const el = document.getElementById(`dict-${id}`);
  if (!el) return;

  document
    .querySelectorAll(".dict-term--highlight")
    .forEach((node) => node.classList.remove("dict-term--highlight"));

  el.scrollIntoView({ behavior: "smooth", block: "center" });
  // restart the animation if the same term is targeted again
  void el.offsetWidth;
  el.classList.add("dict-term--highlight");
}

function openDictHash(hash) {
  if (!hash.startsWith("#dict-")) return;
  let id = hash.slice(6);
  try {
    id = decodeURIComponent(id);
  } catch (e) {
    /* keep raw id if it isn't valid percent-encoding */
  }
  if (!isDictMode()) {
    switchToDictMode();
  } else if (activeDictLetter || searchInput.value.trim()) {
    // make sure the targeted term is rendered before highlighting
    activeDictLetter = "";
    searchInput.value = "";
    renderDictLetterTabs();
    renderDict();
  }
  setTimeout(() => highlightDictTerm(id), 100);
}

function initDictFromHash() {
  openDictHash(location.hash);
}

window.addEventListener("hashchange", () => openDictHash(location.hash));

// ── Mobile menu (burger + bottom sheet) ────────────────────────────────────────

function setupMobileMenu() {
  const burger = document.querySelector("#menu-burger");
  const sidebar = document.querySelector("#sidebar");
  const backdrop = document.querySelector("#menu-backdrop");
  if (!burger || !sidebar || !backdrop) return;

  const setOpen = (open) => {
    sidebar.classList.toggle("is-open", open);
    backdrop.classList.toggle("is-open", open);
    document.body.classList.toggle("menu-open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
  };

  burger.addEventListener("click", () =>
    setOpen(burger.getAttribute("aria-expanded") !== "true")
  );
  backdrop.addEventListener("click", () => setOpen(false));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });
  // Close the sheet once a section is chosen
  sidebar.addEventListener("click", (e) => {
    if (e.target.closest(".rubric-button")) setOpen(false);
  });
}

// ── Init ──────────────────────────────────────────────────────────────────────

setupMobileMenu();
renderRubrics();
renderSubrubricTabs();
render();
initDictFromHash();
