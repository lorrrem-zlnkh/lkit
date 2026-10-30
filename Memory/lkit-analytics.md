---
tags: [lkit, analytics, architecture, documentation]
created: 2026-06-16
updated: 2026-10-01
---

# Lkit — Аналитика проекта

> Живой документ. Отражает состояние проекта по состоянию на **16 июня 2026**.

---

> **Обновлено:** 30 октября 2026

**README репозитория — копия этого документа:** её делает хук `post-commit` командой `cp Memory/lkit-analytics.md README.md`. Значит правка аналитики меняет и README — отдельно его писать не нужно и нельзя.

## 📈 Что изменилось с 16 июня 2026

Документ стоял на 16 июня, в коде с тех пор 21 коммит. Правки шли почти целиком в данные, а не в устройство: `site/catalog-data.js` (11 раз) и `site/dictionary-data.js` (9).

**Объём на 1 октября:** 394 инструмента в каталоге, **807 терминов** в словаре — и номер растёт в каждом сообщении коммита («Add Оверхед to dictionary (807)»), то есть счёт ведётся прямо в истории.

**Содержательная линия — источники.** 16 сентября к 37 терминам добавлены сноски с источником происхождения, а сами сноски стали кликабельными ссылками «Источник»; отдельным коммитом у «Дженерика» в определении проставлена ссылка на NN/g. То есть словарь перешёл от «определение своими словами» к «определение со ссылкой, которую можно проверить».

**Из свежего в словаре:** Спайк, Слоп, Бэклэш, Клауза, Вендор-локин, Оверхед — термины, которых год назад в русском IT-языке просто не было.

## 🧭 Что такое Lkit

**Lkit** — персональный каталог дизайн-инструментов и ресурсов для команды Lorrrem. Статический сайт с тёмной темой, где собраны инструменты по UX/UI-дизайну, ИИ, продвижению, обучению — с поиском, фильтрами и подкатегориями.

Второй ключевой раздел — **IT-словарь**: 659 русскоязычных IT-терминов и сленга с развёрнутыми живыми определениями, поиском, буквенной навигацией и шаринговыми ссылками на каждый термин.

**Аудитория:** команда Lorrrem, дизайнеры, разработчики.

---

## 🏗 Архитектура

### Тип приложения

Полностью статический сайт — **HTML + CSS + Vanilla JS**, без фреймворков и бандлеров. Работает без сервера: открывается прямо из файловой системы или с любого файлового хостинга.

### Единственная страница

```
site/index.html   ← SPA-like, всё управление через JS
```

Вся навигация (рубрики, поиск, словарь, фильтры) работает через манипуляцию DOM без перезагрузки страницы. URL-якоря (`#dict-{id}`) используются для шаринга терминов.

### Слои данных

```
window.CATALOG_DATA    ← 383 карточки инструментов  (site/catalog-data.js, 4981 строк)
window.DICTIONARY_DATA ← 659 IT-терминов            (site/dictionary-data.js, 4346 строк)
```

Оба файла — статические JS-переменные, генерируются локальными скриптами и коммитятся в репо.

### Раскладка интерфейса

```
.app-layout  (CSS Grid: 280px sidebar + fluid content)
├── .sidebar
│   ├── .sidebar-brand  (логотип Lkit)
│   └── .rubric-nav     (кнопки рубрик + IT-словарь)
└── .main
    ├── .content-topbar
    │   ├── .control-search     (единый input для каталога и словаря)
    │   └── .subcategory-tabs   (подрубрики / буквы алфавита в словаре)
    ├── .catalog-grid  (hidden в режиме словаря)
    └── .dict-view     (hidden в режиме каталога)
```

---

## 📁 Структура проекта

```
Lkit/
├── site/                      ← исходники сайта (деплоятся на хостинг)
│   ├── index.html             ← разметка, шрифты, скрипты
│   ├── styles.css             ← 735 строк, тёмная тема, CSS Variables
│   ├── app.js                 ← 749 строк, вся логика каталога и словаря
│   ├── catalog-data.js        ← window.CATALOG_DATA (383 карточки)
│   ├── dictionary-data.js     ← window.DICTIONARY_DATA (659 терминов)
│   ├── ui-kit.html            ← дизайн-система проекта (ветка UI-kit)
│   └── screenshots/           ← локальные скриншоты ресурсов (~130 PNG)
│
├── scripts/                   ← инструменты работы со словарём
│   ├── build_dictionary.mjs   ← парсит output/dictionary_raw.txt → dictionary-data.js
│   ├── expand_dictionary.mjs  ← расширяет определения через OpenAI API (батч, 469 терминов за раз)
│   ├── factcheck_claude.mjs   ← факт-чек через Claude: удаляет ложные термины
│   ├── apply_factcheck_fixes.mjs ← применяет патчи от факт-чека
│   ├── analyze_report.mjs     ← анализ отчёта факт-чека
│   ├── assign_emoji.mjs       ← назначение эмодзи карточкам каталога
│   ├── check_links.mjs        ← проверка живости ссылок в каталоге
│   ├── delete_dead.mjs        ← удаление мёртвых ссылок
│   ├── patch_catalog.mjs      ← точечные правки catalog-data.js
│   └── parser/                ← инструмент автопарсинга новых терминов
│       ├── parse_terms.mjs    ← основной парсер (Wiktionary → LLM → словарь)
│       ├── add_terms.mjs      ← ручной добор терминов через LLM
│       ├── llm.mjs            ← LLM-модуль (Claude приоритет, fallback OpenAI)
│       ├── sources.config.mjs ← конфиг источников парсера (19 категорий Викисловаря)
│       └── manual_terms.mjs   ← список терминов для ручного добора
│
├── Memory/                    ← база знаний проекта
│   ├── knowledge-base.md      ← старая база знаний (2026-06-14)
│   └── lkit-analytics.md      ← этот документ
│
├── .github/workflows/
│   └── deploy-ftp.yml         ← CI/CD: авто-деплой на lkit.lorrrem.ru при пуше в main
│
├── CLAUDE.md                  ← правила работы для всех Claude-сессий
├── package.json               ← npm-скрипты для словаря
└── .gitignore                 ← output/ в gitignore
```

---

## ✨ Функциональность

### Каталог инструментов

| Параметр | Значение |
|---|---|
| Всего карточек | 383 |
| Рубрики | Инструменты (121), ИИ (92), Контент и обучение (91), Ресурсы (79), Продвижение (6) |
| Подрубрики | 35 штук |

**Поиск:** многоуровневая система скоринга с intent-detection. Поиск понимает:
- Точные совпадения токенов → +10 очков
- Частичные совпадения → +6
- Совпадение в сыром тексте → +3
- Буст по intent-группам (иконки, ИИ, шрифты, цвет, видео, аудио и др.) → +8–12

**Нормализация:** `ё → е`, удаление спецсимволов, стемминг русских окончаний.

**Навигация:**
- Боковое меню рубрик (sticky sidebar)
- Горизонтальные таблетки подрубрик
- Переключение между рубриками сбрасывает поиск и подрубрику

**Карточки:** emoji-бейдж (автовыбор по теме или из данных), заголовок, описание, ссылка `target="_blank"`.

**Адаптив:**
- Desktop: 280px sidebar + fluid grid
- Tablet: burger-меню в хедере + dropdown
- Mobile: нижний лист навигации (bottom sheet)

### IT-словарь

| Параметр | Значение |
|---|---|
| Всего терминов | 659 |
| Буквы | А–Я + латинские (C, O) |
| Источники | Викисловарь (19 категорий), Ручное добавление, OpenAI-расширение |

**Возможности:**
- Поиск по названию и определению
- Буквенная навигация (вкладки с каунтером)
- Кнопка ⎘ при наведении — копирует прямую ссылку `#dict-{id}`
- Открытие по URL с якорем: автопереключение в режим словаря + скролл + подсветка термина
- Определения: 2–3 предложения в живом разговорном стиле

---

## 🔄 Пайплайн данных

### Каталог

```
Ручная база данных (ранее Obsidian/Notion)
→ catalog-data.js (window.CATALOG_DATA)   ← редактируется вручную через patch_catalog.mjs
→ site/ (деплой)
```

### Словарь

```
Источники:
  Викисловарь API (19 категорий) ──┐
  output/dictionary_raw.txt       ──┤→ parse_terms.mjs / build_dictionary.mjs
  manual_terms.mjs                ──┘
          ↓
  LLM (Claude Opus 4.8 / GPT-4o-mini)
  переписывает определения в разговорный стиль
  с few-shot промптом (12 примеров)
          ↓
  site/dictionary-data.js (window.DICTIONARY_DATA)
          ↓
  factcheck_claude.mjs  ← факт-чек: удаление ложных терминов
          ↓
  Деплой
```

**Дедупликация:** нормализация `ё→е`, `э→е`, удаление скобочных частей, нижний регистр. Термины-дубликаты по нормализованному ключу пропускаются.

---

## 🤖 LLM-интеграции

### Claude (Anthropic)

- **Модель:** `claude-opus-4-8` (по умолчанию, переопределяется `LLM_MODEL`)
- **Использование:** переписывание определений словаря, факт-чек терминов
- **Промпт-кэширование:** системный блок с few-shot примерами помечен `cache_control: ephemeral` → кэшируется, экономит ~90% токенов при батчевой обработке
- **SDK:** `@anthropic-ai/sdk ^0.104.1`
- **Ключ:** `ANTHROPIC_API_KEY` (env, не хранится в репо)

### OpenAI

- **Модель:** `gpt-4o-mini` (по умолчанию)
- **Использование:** fallback если нет Anthropic ключа; первичное расширение 469 определений (исторически)
- **Ключ:** `OPENAI_API_KEY` (env; ключи, переданные в чате, нужно отозвать)

**Приоритет:** Claude > OpenAI. Если нет ни одного ключа — режим `--no-llm`.

---

## ☁️ Деплой и инфраструктура

### Продакшн: lkit.lorrrem.ru

```yaml
Триггер: push в main, изменения в site/** или workflow
Экшн:   SamKirkland/FTP-Deploy-Action@v4.3.5
Протокол: FTPS (TLS)
Секреты: FTP_SERVER, FTP_USERNAME, FTP_PASSWORD, FTP_PORT
Что деплоится: site/index.html, styles.css, app.js, catalog-data.js, dictionary-data.js
Что пропускается: site/screenshots/ (слишком тяжело)
```

Деплой автоматический при каждом пуше в `main` с изменениями в `site/`.

### Тест: gh-pages (GitHub Pages)

```
URL: https://lorrrem-zlnkh.github.io/lkit/
Ветка: gh-pages (root)
Тип: Legacy (без Jekyll)
Деплой: вручную — копируем site/* в корень gh-pages
```

**Важно:** `gh-pages` = тестовая среда. Не переименовывать (ограничение GitHub Pages).

### Аналитика

- **Яндекс.Метрика** — счётчик `109847531` встроен в `index.html`

---

## 🔀 Git-стратегия

### Ветки

| Ветка | Назначение |
|---|---|
| `main` | Стабильная версия, авто-деплой на `lkit.lorrrem.ru` |
| `gh-pages` | Тестовая среда (GitHub Pages), файлы в корне |
| `feature/dictionary` | Изменения словаря |
| `feature/catalog` | Изменения каталога |
| `UI-kit` | Дизайн-система проекта (`site/ui-kit.html`) |

### Workflow

```
1. Изменения → коммит в feature-ветке
2. Деплой на gh-pages (тест)
3. Тестирование
4. Merge в main → авто-деплой на продакшн
```

**Правило:** никогда не мёрджить в `main` без прохождения теста на `gh-pages`.

### Auto-push hook

`.git/hooks/post-commit` автоматически пушит текущую ветку на origin после каждого коммита.

### Проверка перед коммитом

```bash
git log --oneline -10   # что было в других чатах
git status              # что в индексе
cat package.json        # мог измениться в соседнем чате
```

---

## 📦 Зависимости

```json
{
  "@anthropic-ai/sdk": "^0.104.1",
  "cheerio": "^1.2.0"
}
```

| Пакет | Зачем |
|---|---|
| `@anthropic-ai/sdk` | Claude API для LLM-переписывания определений |
| `cheerio` | HTML-парсинг страниц Викисловаря/Википедии |

**Node.js:** ESM (`"type": "module"`), все скрипты `.mjs`.

---

## 🎨 Дизайн-система

### CSS Variables (тёмная тема)

```css
--bg: #0b0d10          /* фон страницы */
--bg-soft: #12161b
--panel: #101419
--card: #171d25        /* фон карточки */
--card-hover: #1c2430
--text: #f3f5f7
--muted: #8e9aa8       /* вторичный текст */
--accent: #7dd3fc      /* голубой акцент */
--accent-soft: rgba(125, 211, 252, 0.12)
--line: rgba(255,255,255,0.08)   /* разделители */
--radius-xl: 28px
--radius-lg: 22px
--radius-md: 18px
```

### Шрифты

- **Manrope** (400, 500, 700, 800) — основной текст
- **IBM Plex Mono** (400, 500) — счётчики, метки, кнопки

### Брейкпоинты

- `> 1100px` — desktop (sidebar + grid)
- `≤ 1100px` — tablet (burger + dropdown)
- `≤ 720px` — mobile (bottom sheet)

---

## 📊 npm-скрипты

| Скрипт | Команда | Что делает |
|---|---|---|
| `dict:build` | `node scripts/build_dictionary.mjs` | Парсит `output/dictionary_raw.txt` → `dictionary-data.js` |
| `dict:expand` | `node scripts/expand_dictionary.mjs` | Расширяет определения через OpenAI API |
| `dict:parse` | `node scripts/parser/parse_terms.mjs` | Парсит новые термины из Викисловаря через LLM |
| `dict:add` | `node scripts/parser/add_terms.mjs` | Ручной добор терминов из `manual_terms.mjs` |

---

## 🗂 Источники словаря

### Викисловарь (19 категорий)

- Компьютер, Программирование, Программное обеспечение
- Интернет, Сетевой жаргон, Компьютерные программы
- Компьютерные сети, Компьютерные игры, Криптография
- Шифрование, Языки программирования, Операционные системы
- Алгоритмы, Нейронные сети, Данные, Файлы
- Информационная безопасность, Кодирование, Носители

### Стратегии парсинга

- `wiktionary-category` — список слов из категории → IT-значение из секции «Значение»
- `dl` — списки `<dt>/<dd>` из Wikipedia-глоссариев
- `table` — таблицы (первый столбец — термин, второй — определение)
- `list-dash` — пункты списков вида `Термин — описание`

### Фильтрация сырых пар

```js
maxTermLen: 45      // слишком длинное — заголовок, не термин
minTermLen: 2
maxTermWords: 4     // >4 слов — обычно заголовок раздела
minDefLen: 25       // слишком короткое определение пропускается
```

---

## 🛡 Безопасность

- **API-ключи** никогда не хранятся в репо — только через env
- **OpenAI ключ**, переданный в чате, был скомпрометирован → нужно отозвать и перевыпустить
- **FTP-данные** только в GitHub Secrets
- Репозиторий **публичный** (требование для бесплатного GitHub Pages)

---

## 📈 История развития (по коммитам)

| Этап | Что сделано |
|---|---|
| Initial | Базовый каталог, экспорт данных |
| +IT-словарь | 469 терминов, поиск, буквенная навигация, share-ссылки |
| +LLM расширение | GPT-4o-mini расширил все определения до 2–3 предложений |
| +Парсер | Автопополнение из Викисловаря через Claude, дедуп, few-shot |
| +Факт-чек | Claude проверил 605 терминов: удалены ложные, исправлены этимологии |
| +Ручной добор | Инструмент manual_terms + 28 кураторских терминов |
| +659 терминов | Категории ИБ, ML/PL/OS, ещё 2 батча |
| +Мобайл | Burger-меню, bottom sheet, tablet layout |
| +FTP деплой | GitHub Actions → lkit.lorrrem.ru (FTPS) |
| +Метрика | Яндекс.Метрика 109847531 |
| Чистка | Удалены: skills автоматизации, Playwright, чат-логи, старые скрипты |
| +UI Kit | Дизайн-система: токены, типографика, компоненты, состояния — `site/ui-kit.html` |

---

## 🎨 UI Kit

Живая дизайн-система проекта — все компоненты, токены и состояния в одном месте.

**Файл:** `site/ui-kit.html` · **Ветка:** `UI-kit`
**URL (gh-pages):** https://lorrrem-zlnkh.github.io/lkit/ui-kit.html

### Содержание

| # | Секция | Что внутри |
|---|---|---|
| 01 | Цвета / CSS Tokens | Все переменные со свотчами и hex-значениями |
| 02 | Типографика | Вся иерархия от H1 до копирайта (Manrope + IBM Plex Mono) |
| 03 | Радиусы и тени | Все значения border-radius + box-shadow |
| 04 | Рубрики / Sidebar nav | default / hover / active / dict-active |
| 05 | Подкатегории / Subtab | default / hover / active + буквенная навигация словаря |
| 06 | Поиск | Пустое и заполненное состояние |
| 07 | Карточки каталога | С emoji / в hover / без meta / с обложкой / empty state |
| 08 | Emoji badge | emoji-badge 52×52, rubric-icon 34×34 |
| 09 | IT-словарь | Термины: default / hover / share-hover / copied / highlight |
| 10 | Мобильная навигация | Topbar, burger (закрыт/открыт), bottom sheet, tablet dropdown |
| 11 | Sidebar полный | Десктопный сайдбар целиком |
| 12 | Фоны страницы | Каталог vs Словарь режим |

---

## 🔮 Что планируется

- Пополнение словаря (парсер запускается по мере находки новых источников)
- Улучшение каталога: новые карточки, актуализация описаний
- Возможно: поиск по каталогу + словарю одновременно

---

## Стек и зависимости

<!-- auto:stack -->
**package.json** — lkit
- `@anthropic-ai/sdk` ^0.104.1
- `cheerio` ^1.2.0
<!-- /auto:stack -->

<!-- auto:stamp -->
Снято 30 октября 2026 · ветка `ard-integration` · последний коммит `9cf707e` от 27.10.2026 21:09
<!-- /auto:stamp -->

## Объём кода

<!-- auto:size -->
| Язык | Файлов | Строк |
|---|---|---|
| JSON | 5 | 14630 |
| JavaScript | 18 | 13050 |
| Markdown | 5 | 5191 |
| CSS | 1 | 779 |
| HTML | 1 | 98 |
<!-- /auto:size -->

## Дерево репозитория

<!-- auto:tree -->
```
Memory/
  knowledge-base.md
  lkit-analytics.md
  lkit-ard-components.md
output/
  output/ — 26 файлов
scripts/
  parser/
    add_terms.mjs
    llm.mjs
    manual_terms.mjs
    parse_terms.mjs
    sources.config.mjs
  add_terms.mjs
  analyze_report.mjs
  apply_factcheck_fixes.mjs
  assign_emoji.mjs
  build_dictionary.mjs
  check_links.mjs
  delete_dead.mjs
  expand_dictionary.mjs
  factcheck_claude.mjs
  patch_catalog.mjs
site/
  screenshots/
    screenshots/ — 180 файлов
  app.js
  catalog-data.js
  dictionary-data.js
  index.html
  styles.css
CLAUDE.md
lkit favocon.png
LKIT lorrrem zelenykh.png
package-lock.json
package.json
README.md
```
<!-- /auto:tree -->

## Файлы и их роли

<!-- auto:files -->
| Файл | Строк | Зачем |
|---|---|---|
| `scripts/add_terms.mjs` | 68 | Добавляет термины в site/dictionary-data.js с алфавитной вставкой в группу буквы. |
| `scripts/analyze_report.mjs` | 55 | Анализ output/link_report.json: раскладывает карточки по корзинам для Фазы 1. |
| `scripts/apply_factcheck_fixes.mjs` | 54 | Применяет исправления, подтверждённые интернет-фактчекингом (источники в ответе). |
| `scripts/assign_emoji.mjs` | 196 | const FILE = "site/catalog-data.js"; |
| `scripts/build_dictionary.mjs` | 40 | const raw = await fs.readFile(path.resolve("output/dictionary_raw.txt"), "utf8"); |
| `scripts/check_links.mjs` | 124 | Phase 0: проверка всех ссылок каталога. |
| `scripts/delete_dead.mjs` | 56 | Удаляет карточки откровенно мёртвых сервисов (подтверждено авторитетным DNS: |
| `scripts/expand_dictionary.mjs` | 52 | const API_KEY = process.env.OPENAI_API_KEY; |
| `scripts/factcheck_claude.mjs` | 124 | Фактчекинг словаря через Claude API (claude-opus-4-8). |
| `scripts/parser/add_terms.mjs` | 52 | Точечный ручной добор терминов в словарь Lkit. |
| `scripts/parser/llm.mjs` | 110 | LLM-модуль парсера: переписывает определение «своими словами» в стиле словаря. |
| `scripts/parser/manual_terms.mjs` | 191 | Список для точечного ручного добора терминов (scripts/parser/add_terms.mjs). |
| `scripts/parser/parse_terms.mjs` | 311 | Парсер терминов для Lkit — самостоятельный инструмент (не связан с каталогом/дайджестом). |
| `scripts/parser/sources.config.mjs` | 81 | Конфиг источников для парсера терминов (scripts/parser/parse_terms.mjs). |
| `scripts/patch_catalog.mjs` | 135 | Применяет точечные правки к catalog-data.js по Slug. |
| `site/app.js` | 779 | const data = window.CATALOG_DATA || []; |
| `site/catalog-data.js` | 5124 | window.CATALOG_DATA = [ |
| `site/dictionary-data.js` | 5498 | window.DICTIONARY_DATA = [ |
| `site/index.html` | 98 | <!doctype html> |
| `site/styles.css` | 779 | /* ══════════════════════════════════════════════════════════════════════════════ |
<!-- /auto:files -->

## Скрипты

<!-- auto:scripts -->
| Скрипт | Зачем |
|---|---|
| `scripts/add_terms.mjs` | Добавляет термины в site/dictionary-data.js с алфавитной вставкой в группу буквы. |
| `scripts/analyze_report.mjs` | Анализ output/link_report.json: раскладывает карточки по корзинам для Фазы 1. |
| `scripts/apply_factcheck_fixes.mjs` | Применяет исправления, подтверждённые интернет-фактчекингом (источники в ответе). |
| `scripts/assign_emoji.mjs` | const FILE = "site/catalog-data.js"; |
| `scripts/build_dictionary.mjs` | const raw = await fs.readFile(path.resolve("output/dictionary_raw.txt"), "utf8"); |
| `scripts/check_links.mjs` | Phase 0: проверка всех ссылок каталога. |
| `scripts/delete_dead.mjs` | Удаляет карточки откровенно мёртвых сервисов (подтверждено авторитетным DNS: |
| `scripts/expand_dictionary.mjs` | const API_KEY = process.env.OPENAI_API_KEY; |
| `scripts/factcheck_claude.mjs` | Фактчекинг словаря через Claude API (claude-opus-4-8). |
| `scripts/patch_catalog.mjs` | Применяет точечные правки к catalog-data.js по Slug. |
<!-- /auto:scripts -->

## История коммитов

<!-- auto:history -->
Коммитов всего: 77 · первый: 09.03.2026

- 27.10.2026 · `9cf707e` · Add ZDP to catalog (ИИ / Промпты и библиотеки)
- 01.10.2026 · `7d48db3` · Аналитика: отмечено, что README — её копия
- 01.10.2026 · `90d3fa6` · Аналитика: догнала код, машинный слой и синхронизация с Obsidian (L-6)
- 18.09.2026 · `b296c6e` · Add Оверхед to dictionary (807)
- 16.09.2026 · `e01a2f0` · Add Вендор-локин to dictionary (806)
- 16.09.2026 · `c8739d3` · Add Клауза to dictionary (805)
- 16.09.2026 · `f204802` · Render source footnotes as clickable «Источник» links
- 16.09.2026 · `288912c` · Add sourced origin footnotes to 37 terms
- 16.09.2026 · `af9dc18` · Дженерик: cite the NN/g source in the definition
- 16.09.2026 · `08e95d7` · Add Дженерик (generic visual style, NN/g) to dictionary (804)
- 16.09.2026 · `b40dae0` · Add Спайк, Слоп, Бэклэш to dictionary (803)
- 13.07.2026 · `6c9bee6` · Add Ludo.ai to catalog (392→393)
- 13.07.2026 · `024ca82` · Add Project Genie to catalog (391→392)
- 08.07.2026 · `5522236` · Add MA-g (Museum of Avant-garde) to promotion (390→391)
- 03.07.2026 · `cfe6b1a` · Add Art Innovation Gallery to promotion (389→390)
- 25.06.2026 · `33b285b` · Add Дизайн-дайджест button to sidebar under blog link
- 25.06.2026 · `b2ca8ca` · Add Tagio to promotion (388→389)
- 25.06.2026 · `0fa12b3` · Add BidFox to promotion (387→388)
- 25.06.2026 · `0e445ed` · Add Telega.in and TeleTarget to promotion (385→387)
- 24.06.2026 · `7ed15a1` · Update Lorrrem channel link to invite URL
<!-- /auto:history -->

## README репозитория

<!-- auto:readme -->
*Файл `README.md`, как есть:*

---
tags: [lkit, analytics, architecture, documentation]
created: 2026-06-16
updated: 2026-10-01
---

### Lkit — Аналитика проекта

> Живой документ. Отражает состояние проекта по состоянию на **16 июня 2026**.

---

> **Обновлено:** 27 октября 2026

**README репозитория — копия этого документа:** её делает хук `post-commit` командой `cp Memory/lkit-analytics.md README.md`. Значит правка аналитики меняет и README — отдельно его писать не нужно и нельзя.

#### 📈 Что изменилось с 16 июня 2026

Документ стоял на 16 июня, в коде с тех пор 21 коммит. Правки шли почти целиком в данные, а не в устройство: `site/catalog-data.js` (11 раз) и `site/dictionary-data.js` (9).

**Объём на 1 октября:** 394 инструмента в каталоге, **807 терминов** в словаре — и номер растёт в каждом сообщении коммита («Add Оверхед to dictionary (807)»), то есть счёт ведётся прямо в истории.

**Содержательная линия — источники.** 16 сентября к 37 терминам добавлены сноски с источником происхождения, а сами сноски стали кликабельными ссылками «Источник»; отдельным коммитом у «Дженерика» в определении проставлена ссылка на NN/g. То есть словарь перешёл от «определение своими словами» к «определение со ссылкой, которую можно проверить».

**Из свежего в словаре:** Спайк, Слоп, Бэклэш, Клауза, Вендор-локин, Оверхед — термины, которых год назад в русском IT-языке просто не было.

#### 🧭 Что такое Lkit

**Lkit** — персональный каталог дизайн-инструментов и ресурсов для команды Lorrrem. Статический сайт с тёмной темой, где собраны инструменты по UX/UI-дизайну, ИИ, продвижению, обучению — с поиском, фильтрами и подкатегориями.

Второй ключевой раздел — **IT-словарь**: 659 русскоязычных IT-терминов и сленга с развёрнутыми живыми определениями, поиском, буквенной навигацией и шаринговыми ссылками на каждый термин.

**Аудитория:** команда Lorrrem, дизайнеры, разработчики.

---

#### 🏗 Архитектура

##### Тип приложения

Полностью статический сайт — **HTML + CSS + Vanilla JS**, без фреймворков и бандлеров. Работает без сервера: открывается прямо из файловой системы или с любого файлового хостинга.

##### Единственная страница

```
site/index.html   ← SPA-like, всё управление через JS
```

Вся навигация (рубрики, поиск, словарь, фильтры) работает через манипуляцию DOM без перезагрузки страницы. URL-якоря (`#dict-{id}`) используются для шаринга терминов.

##### Слои данных

```
window.CATALOG_DATA    ← 383 карточки инструментов  (site/catalog-data.js, 4981 строк)
window.DICTIONARY_DATA ← 659 IT-терминов            (site/dictionary-data.js, 4346 строк)
```

Оба файла — статические JS-переменные, генерируются локальными скриптами и коммитятся в репо.

##### Раскладка интерфейса

```
.app-layout  (CSS Grid: 280px sidebar + fluid content)
├── .sidebar
│   ├── .sidebar-brand  (логотип Lkit)
│   └── .rubric-nav     (кнопки рубрик + IT-словарь)
└── .main
    ├── .content-topbar
    │   ├── .control-search     (единый input для каталога и словаря)
    │   └── .subcategory-tabs   (подрубрики / буквы алфавита в словаре)
    ├── .catalog-grid  (hidden в режиме словаря)
    └── .dict-view     (hidden в режиме каталога)
```

---

#### 📁 Структура проекта

```
Lkit/
├── site/                      ← исходники сайта (деплоятся на хостинг)
│   ├── index.html             ← разметка, шрифты, скрипты
│   ├── styles.css             ← 735 строк, тёмная тема, CSS Variables
│   ├── app.js                 ← 749 строк, вся логика каталога и словаря
│   ├── catalog-data.js        ← window.CATALOG_DATA (383 карточки)
│   ├── dictionary-data.js     ← window.DICTIONARY_DATA (659 терминов)
│   ├── ui-kit.html            ← дизайн-система проекта (ветка UI-kit)
│   └── screenshots/           ← локальные скриншоты ресурсов (~130 PNG)
│
├── scripts/                   ← инструменты работы со словарём
│   ├── build_dictionary.mjs   ← парсит output/dictionary_raw.txt → dictionary-data.js
│   ├── expand_dictionary.mjs  ← расширяет определения через OpenAI API (батч, 469 терминов за раз)
│   ├── factcheck_claude.mjs   ← факт-чек через Claude: удаляет ложные термины
│   ├── apply_factcheck_fixes.mjs ← применяет патчи от факт-чека
│   ├── analyze_report.mjs     ← анализ отчёта факт-чека
│   ├── assign_emoji.mjs       ← назначение эмодзи карточкам каталога
│   ├── check_links.mjs        ← проверка живости ссылок в каталоге
│   ├── delete_dead.mjs        ← удаление мёртвых ссылок
│   ├── patch_catalog.mjs      ← точечные правки catalog-data.js
│   └── parser/                ← инструмент автопарсинга новых терминов
│       ├── parse_terms.mjs    ← основной парсер (Wiktionary → LLM → словарь)
│       ├── add_terms.mjs      ← ручной добор терминов через LLM
│       ├── llm.mjs            ← LLM-модуль (Claude приоритет, fallback OpenAI)
│       ├── sources.config.mjs ← конфиг источников парсера (19 категорий Викисловаря)
│       └── manual_terms.mjs   ← список терминов для ручного добора
│
├── Memory/                    ← база знаний проекта
│   ├── knowledge-base.md      ← старая база знаний (2026-06-14)
│   └── lkit-analytics.md      ← этот документ
│
├── .github/workflows/
│   └── deploy-ftp.yml         ← CI/CD: авто-деплой на lkit.lorrrem.ru при пуше в main
│
├── CLAUDE.md                  ← правила работы для всех Claude-сессий
├── package.json               ← npm-скрипты для словаря
└── .gitignore                 ← output/ в gitignore
```

---

#### ✨ Функциональность

##### Каталог инструментов

| Параметр | Значение |
|---|---|
| Всего карточек | 383 |
| Рубрики | Инструменты (121), ИИ (92), Контент и обучение (91), Ресурсы (79), Продвижение (6) |
| Подрубрики | 35 штук |

**Поиск:** многоуровневая система скоринга с intent-detection. Поиск понимает:
- Точные совпадения токенов → +10 очков
- Частичные совпадения → +6
- Совпадение в сыром тексте → +3
- Буст по intent-группам (иконки, ИИ, шрифты, цвет, видео, аудио и др.) → +8–12

**Нормализация:** `ё → е`, удаление спецсимволов, стемминг русских окончаний.

**Навигация:**
- Боковое меню рубрик (sticky sidebar)
- Горизонтальные таблетки подрубрик
- Переключение между рубриками сбрасывает поиск и подрубрику

**Карточки:** emoji-бейдж (автовыбор по теме или из данных), заголовок, описание, ссылка `target="_blank"`.

**Адаптив:**
- Desktop: 280px sidebar + fluid grid
- Tablet: burger-меню в хедере + dropdown
- Mobile: нижний лист навигации (bottom sheet)

##### IT-словарь

| Параметр | Значение |
|---|---|
| Всего терминов | 659 |
| Буквы | А–Я + латинские (C, O) |
| Источники | Викисловарь (19 категорий), Ручное добавление, OpenAI-расширение |

**Возможности:**
- Поиск по названию и определению
- Буквенная навигация (вкладки с каунтером)
- Кнопка ⎘ при наведении — копирует прямую ссылку `#dict-{id}`
- Открытие по URL с якорем: автопереключение в режим словаря + скролл + подсветка термина
- Определения: 2–3 предложения в живом разговорном стиле

---

#### 🔄 Пайплайн данных

##### Каталог

```
Ручная база данных (ранее Obsidian/Notion)
→ catalog-data.js (window.CATALOG_DATA)   ← редактируется вручную через patch_catalog.mjs
→ site/ (деплой)
```

##### Словарь

```
Источники:
  Викисловарь API (19 категорий) ──┐
  output/dictionary_raw.txt       ──┤→ parse_terms.mjs / build_dictionary.mjs
  manual_terms.mjs                ──┘
          ↓
  LLM (Claude Opus 4.8 / GPT-4o-mini)
  переписывает определения в разговорный стиль
  с few-shot промптом (12 примеров)
          ↓
  site/dictionary-data.js (window.DICTIONARY_DATA)
          ↓
  factcheck_claude.mjs  ← факт-чек: удаление ложных терминов
          ↓
  Деплой
```

**Дедупликация:** нормализация `ё→е`, `э→е`, удаление скобочных частей, нижний регистр. Термины-дубликаты по нормализованному ключу пропускаются.

---

#### 🤖 LLM-интеграции

##### Claude (Anthropic)

- **Модель:** `claude-opus-4-8` (по умолчанию, переопределяется `LLM_MODEL`)
- **Использование:** переписывание определений словаря, факт-чек терминов
- **Промпт-кэширование:** системный блок с few-shot примерами помечен `cache_control: ephemeral` → кэшируется, экономит ~90% токенов при батчевой обработке
- **SDK:** `@anthropic-ai/sdk ^0.104.1`
- **Ключ:** `ANTHROPIC_API_KEY` (env, не хранится в репо)

##### OpenAI

- **Модель:** `gpt-4o-mini` (по умолчанию)
- **Использование:** fallback если нет Anthropic ключа; первичное расширение 469 определений (исторически)
- **Ключ:** `OPENAI_API_KEY` (env; ключи, переданные в чате, нужно отозвать)

**Приоритет:** Claude > OpenAI. Если нет ни одного ключа — режим `--no-llm`.

---

#### ☁️ Деплой и инфраструктура

##### Продакшн: lkit.lorrrem.ru

```yaml
Триггер: push в main, изменения в site/** или workflow
Экшн:   SamKirkland/FTP-Deploy-Action@v4.3.5
Протокол: FTPS (TLS)
Секреты: FTP_SERVER, FTP_USERNAME, FTP_PASSWORD, FTP_PORT
Что деплоится: site/index.html, styles.css, app.js, catalog-data.js, dictionary-data.js
Что пропускается: site/screenshots/ (слишком тяжело)
```

Деплой автоматический при каждом пуше в `main` с изменениями в `site/`.

##### Тест: gh-pages (GitHub Pages)

```
URL: https://lorrrem-zlnkh.github.io/lkit/
Ветка: gh-pages (root)
Тип: Legacy (без Jekyll)
Деплой: вручную — копируем site/* в корень gh-pages
```

**Важно:** `gh-pages` = тестовая среда. Не переименовывать (ограничение GitHub Pages).

##### Аналитика

- **Яндекс.Метрика** — счётчик `109847531` встроен в `index.html`

---

#### 🔀 Git-стратегия

##### Ветки

| Ветка | Назначение |
|---|---|
| `main` | Стабильная версия, авто-деплой на `lkit.lorrrem.ru` |
| `gh-pages` | Тестовая среда (GitHub Pages), файлы в корне |
| `feature/dictionary` | Изменения словаря |
| `feature/catalog` | Изменения каталога |
| `UI-kit` | Дизайн-система проекта (`site/ui-kit.html`) |

##### Workflow

```
1. Изменения → коммит в feature-ветке
2. Деплой на gh-pages (тест)
3. Тестирование
4. Merge в main → авто-деплой на продакшн
```

**Правило:** никогда не мёрджить в `main` без прохождения теста на `gh-pages`.

##### Auto-push hook

`.git/hooks/post-commit` автоматически пушит текущую ветку на origin после каждого коммита.

##### Проверка перед коммитом

```bash
git log --oneline -10   # что было в других чатах
git status              # что в индексе
cat package.json        # мог измениться в соседнем чате
```

---

#### 📦 Зависимости

```json
{
  "@anthropic-ai/sdk": "^0.104.1",
  "cheerio": "^1.2.0"
}
```

| Пакет | Зачем |
|---|---|
| `@anthropic-ai/sdk` | Claude API для LLM-переписывания определений |
| `cheerio` | HTML-парсинг страниц Викисловаря/Википедии |

**Node.js:** ESM (`"type": "module"`), все скрипты `.mjs`.

---

#### 🎨 Дизайн-система

##### CSS Variables (тёмная тема)

```css
--bg: #0b0d10          /* фон страницы */
--bg-soft: #12161b
--panel: #101419
--card: #171d25        /* фон карточки */
--card-hover: #1c2430
--text: #f3f5f7
--muted: #8e9aa8       /* вторичный текст */
--accent: #7dd3fc      /* голубой акцент */
--accent-soft: rgba(125, 211, 252, 0.12)
--line: rgba(255,255,255,0.08)   /* разделители */
--radius-xl: 28px
--radius-lg: 22px
--radius-md: 18px
```

##### Шрифты

- **Manrope** (400, 500, 700, 800) — основной текст
- **IBM Plex Mono** (400, 500) — счётчики, метки, кнопки

##### Брейкпоинты

- `> 1100px` — desktop (sidebar + grid)
- `≤ 1100px` — tablet (burger + dropdown)
- `≤ 720px` — mobile (bottom sheet)

---

#### 📊 npm-скрипты

| Скрипт | Команда | Что делает |
|---|---|---|
| `dict:build` | `node scripts/build_dictionary.mjs` | Парсит `output/dictionary_raw.txt` → `dictionary-data.js` |
| `dict:expand` | `node scripts/expand_dictionary.mjs` | Расширяет определения через OpenAI API |
| `dict:parse` | `node scripts/parser/parse_terms.mjs` | Парсит новые термины из Викисловаря через LLM |
| `dict:add` | `node scripts/parser/add_terms.mjs` | Ручной добор терминов из `manual_terms.mjs` |

---

#### 🗂 Источники словаря

##### Викисловарь (19 категорий)

- Компьютер, Программирование, Программное обеспечение
- Интернет, Сетевой жаргон, Компьютерные программы
- Компьютерные сети, Компьютерные игры, Криптография
- Шифрование, Языки программирования, Операционные системы
- Алгоритмы, Нейронные сети, Данные, Файлы
- Информационная безопасность, Кодирование, Носители

##### Стратегии парсинга

- `wiktionary-category` — список слов из категории → IT-значение из секции «Значение»
- `dl` — списки `<dt>/<dd>` из Wikipedia-глоссариев
- `table` — таблицы (первый столбец — термин, второй — определение)
- `list-dash` — пункты списков вида `Термин — описание`

##### Фильтрация сырых пар

```js
maxTermLen: 45      // слишком длинное — заголовок, не термин
minTermLen: 2
maxTermWords: 4     // >4 слов — обычно заголовок раздела
minDefLen: 25       // слишком короткое определение пропускается
```

---

#### 🛡 Безопасность

- **API-ключи** никогда не хранятся в репо — только через env
- **OpenAI ключ**, переданный в чате, был скомпрометирован → нужно отозвать и перевыпустить
- **FTP-данные** только в GitHub Secrets
- Репозиторий **публичный** (требование для бесплатного GitHub Pages)

---

#### 📈 История развития (по коммитам)

| Этап | Что сделано |
|---|---|
| Initial | Базовый каталог, экспорт данных |
| +IT-словарь | 469 терминов, поиск, буквенная навигация, share-ссылки |
| +LLM расширение | GPT-4o-mini расширил все определения до 2–3 предложений |
| +Парсер | Автопополнение из Викисловаря через Claude, дедуп, few-shot |
| +Факт-чек | Claude проверил 605 терминов: удалены ложные, исправлены этимологии |
| +Ручной добор | Инструмент manual_terms + 28 кураторских терминов |
| +659 терминов | Категории ИБ, ML/PL/OS, ещё 2 батча |
| +Мобайл | Burger-меню, bottom sheet, tablet layout |
| +FTP деплой | GitHub Actions → lkit.lorrrem.ru (FTPS) |
| +Метрика | Яндекс.Метрика 109847531 |
| Чистка | Удалены: skills автоматизации, Playwright, чат-логи, старые скрипты |
| +UI Kit | Дизайн-система: токены, типографика, компоненты, состояния — `site/ui-kit.html` |

---

#### 🎨 UI Kit

Живая дизайн-система проекта — все компоненты, токены и состояния в одном месте.

**Файл:** `site/ui-kit.html` · **Ветка:** `UI-kit`
**URL (gh-pages):** https://lorrrem-zlnkh.github.io/lkit/ui-kit.html

##### Содержание

| # | Секция | Что внутри |
|---|---|---|
| 01 | Цвета / CSS Tokens | Все переменные со свотчами и hex-значениями |
| 02 | Типографика | Вся иерархия от H1 до копирайта (Manrope + IBM Plex Mono) |
| 03 | Радиусы и тени | Все значения border-radius + box-shadow |
| 04 | Рубрики / Sidebar nav | default / hover / active / dict-active |
| 05 | Подкатегории / Subtab | default / hover / active + буквенная навигация словаря |
| 06 | Поиск | Пустое и заполненное состояние |
| 07 | Карточки каталога | С emoji / в hover / без meta / с обложкой / empty state |
| 08 | Emoji badge | emoji-badge 52×52, rubric-icon 34×34 |
| 09 | IT-словарь | Термины: default / hover / share-hover / copied / highlight |
| 10 | Мобильная навигация | Topbar, burger (закрыт/открыт), bottom sheet, tablet dropdown |
| 11 | Sidebar полный | Десктопный сайдбар целиком |
| 12 | Фоны страницы | Каталог vs Словарь режим |

---

#### 🔮 Что планируется

- Пополнение словаря (парсер запускается по мере находки новых источников)
- Улучшение каталога: новые карточки, актуализация описаний
- Возможно: поиск по каталогу + словарю одновременно

---

#### Стек и зависимости

<!-- auto:stack -->
**package.json** — lkit
- `@anthropic-ai/sdk` ^0.104.1
- `cheerio` ^1.2.0
<!-- /auto:stack -->

<!-- auto:stamp -->
Снято 27 октября 2026 · ветка `main` · последний коммит `7d48db3` от 01.10.2026 17:55
<!-- /auto:stamp -->

#### Объём кода

<!-- auto:size -->
| Язык | Файлов | Строк |
|---|---|---|
| JSON | 5 | 14630 |
| JavaScript | 18 | 13050 |
| Markdown | 4 | 4203 |
| CSS | 1 | 742 |
| HTML | 1 | 96 |
<!-- /auto:size -->

#### Дерево репозитория

<!-- auto:tree -->
```
Memory/
  knowledge-base.md
  lkit-analytics.md
output/
  output/ — 26 файлов
scripts/
  parser/
    add_terms.mjs
    llm.mjs
    manual_terms.mjs
    parse_terms.mjs
    sources.config.mjs
  add_terms.mjs
  analyze_report.mjs
  apply_factcheck_fixes.mjs
  assign_emoji.mjs
  build_dictionary.mjs
  check_links.mjs
  delete_dead.mjs
  expand_dictionary.mjs
  factcheck_claude.mjs
  patch_catalog.mjs
site/
  screenshots/
    screenshots/ — 180 файлов
  app.js
  catalog-data.js
  dictionary-data.js
  index.html
  styles.css
CLAUDE.md
lkit favocon.png
LKIT lorrrem zelenykh.png
package-lock.json
package.json
README.md
```
<!-- /auto:tree -->

#### Файлы и их роли

<!-- auto:files -->
| Файл | Строк | Зачем |
|---|---|---|
| `scripts/add_terms.mjs` | 68 | Добавляет термины в site/dictionary-data.js с алфавитной вставкой в группу буквы. |
| `scripts/analyze_report.mjs` | 55 | Анализ output/link_report.json: раскладывает карточки по корзинам для Фазы 1. |
| `scripts/apply_factcheck_fixes.mjs` | 54 | Применяет исправления, подтверждённые интернет-фактчекингом (источники в ответе). |
| `scripts/assign_emoji.mjs` | 196 | const FILE = "site/catalog-data.js"; |
| `scripts/build_dictionary.mjs` | 40 | const raw = await fs.readFile(path.resolve("output/dictionary_raw.txt"), "utf8"); |
| `scripts/check_links.mjs` | 124 | Phase 0: проверка всех ссылок каталога. |
| `scripts/delete_dead.mjs` | 56 | Удаляет карточки откровенно мёртвых сервисов (подтверждено авторитетным DNS: |
| `scripts/expand_dictionary.mjs` | 52 | const API_KEY = process.env.OPENAI_API_KEY; |
| `scripts/factcheck_claude.mjs` | 124 | Фактчекинг словаря через Claude API (claude-opus-4-8). |
| `scripts/parser/add_terms.mjs` | 52 | Точечный ручной добор терминов в словарь Lkit. |
| `scripts/parser/llm.mjs` | 110 | LLM-модуль парсера: переписывает определение «своими словами» в стиле словаря. |
| `scripts/parser/manual_terms.mjs` | 191 | Список для точечного ручного добора терминов (scripts/parser/add_terms.mjs). |
| `scripts/parser/parse_terms.mjs` | 311 | Парсер терминов для Lkit — самостоятельный инструмент (не связан с каталогом/дайджестом). |
| `scripts/parser/sources.config.mjs` | 81 | Конфиг источников для парсера терминов (scripts/parser/parse_terms.mjs). |
| `scripts/patch_catalog.mjs` | 135 | Применяет точечные правки к catalog-data.js по Slug. |
| `site/app.js` | 779 | const data = window.CATALOG_DATA || []; |
| `site/catalog-data.js` | 5124 | window.CATALOG_DATA = [ |
| `site/dictionary-data.js` | 5498 | window.DICTIONARY_DATA = [ |
| `site/index.html` | 96 | <!doctype html> |
| `site/styles.css` | 742 | :root { |
<!-- /auto:files -->

#### Скрипты

<!-- auto:scripts -->
| Скрипт | Зачем |
|---|---|
| `scripts/add_terms.mjs` | Добавляет термины в site/dictionary-data.js с алфавитной вставкой в группу буквы. |
| `scripts/analyze_report.mjs` | Анализ output/link_report.json: раскладывает карточки по корзинам для Фазы 1. |
| `scripts/apply_factcheck_fixes.mjs` | Применяет исправления, подтверждённые интернет-фактчекингом (источники в ответе). |
| `scripts/assign_emoji.mjs` | const FILE = "site/catalog-data.js"; |
| `scripts/build_dictionary.mjs` | const raw = await fs.readFile(path.resolve("output/dictionary_raw.txt"), "utf8"); |
| `scripts/check_links.mjs` | Phase 0: проверка всех ссылок каталога. |
| `scripts/delete_dead.mjs` | Удаляет карточки откровенно мёртвых сервисов (подтверждено авторитетным DNS: |
| `scripts/expand_dictionary.mjs` | const API_KEY = process.env.OPENAI_API_KEY; |
| `scripts/factcheck_claude.mjs` | Фактчекинг словаря через Claude API (claude-opus-4-8). |
| `scripts/patch_catalog.mjs` | Применяет точечные правки к catalog-data.js по Slug. |
<!-- /auto:scripts -->

#### История коммитов

<!-- auto:history -->
Коммитов всего: 76 · первый: 09.03.2026

- 01.10.2026 · `7d48db3` · Аналитика: отмечено, что README — её копия
- 01.10.2026 · `90d3fa6` · Аналитика: догнала код, машинный слой и синхронизация с Obsidian (L-6)
- 18.09.2026 · `b296c6e` · Add Оверхед to dictionary (807)
- 16.09.2026 · `e01a2f0` · Add Вендор-локин to dictionary (806)
- 16.09.2026 · `c8739d3` · Add Клауза to dictionary (805)
- 16.09.2026 · `f204802` · Render source footnotes as clickable «Источник» links
- 16.09.2026 · `288912c` · Add sourced origin footnotes to 37 terms
- 16.09.2026 · `af9dc18` · Дженерик: cite the NN/g source in the definition
- 16.09.2026 · `08e95d7` · Add Дженерик (generic visual style, NN/g) to dictionary (804)
- 16.09.2026 · `b40dae0` · Add Спайк, Слоп, Бэклэш to dictionary (803)
- 13.07.2026 · `6c9bee6` · Add Ludo.ai to catalog (392→393)
- 13.07.2026 · `024ca82` · Add Project Genie to catalog (391→392)
- 08.07.2026 · `5522236` · Add MA-g (Museum of Avant-garde) to promotion (390→391)
- 03.07.2026 · `cfe6b1a` · Add Art Innovation Gallery to promotion (389→390)
- 25.06.2026 · `33b285b` · Add Дизайн-дайджест button to sidebar under blog link
- 25.06.2026 · `b2ca8ca` · Add Tagio to promotion (388→389)
- 25.06.2026 · `0fa12b3` · Add BidFox to promotion (387→388)
- 25.06.2026 · `0e445ed` · Add Telega.in and TeleTarget to promotion (385→387)
- 24.06.2026 · `7ed15a1` · Update Lorrrem channel link to invite URL
- 21.06.2026 · `61d0a16` · Move Yandex Промптхаб to education, refresh description
<!-- /auto:history -->

#### README репозитория

<!-- auto:readme -->
*Файл `README.md`, как есть:*

---
tags: [lkit, analytics, architecture, documentation]
created: 2026-06-16
updated: 2026-10-01
---

##### Lkit — Аналитика проекта

> Живой документ. Отражает состояние проекта по состоянию на **16 июня 2026**.

---

> **Обновлено:** 1 октября 2026

**README репозитория — копия этого документа:** её делает хук `post-commit` командой `cp Memory/lkit-analytics.md README.md`. Значит правка аналитики меняет и README — отдельно его писать не нужно и нельзя.

###### 📈 Что изменилось с 16 июня 2026

Документ стоял на 16 июня, в коде с тех пор 21 коммит. Правки шли почти целиком в данные, а не в устройство: `site/catalog-data.js` (11 раз) и `site/dictionary-data.js` (9).

**Объём на 1 октября:** 394 инструмента в каталоге, **807 терминов** в словаре — и номер растёт в каждом сообщении коммита («Add Оверхед to dictionary (807)»), то есть счёт ведётся прямо в истории.

**Содержательная линия — источники.** 16 сентября к 37 терминам добавлены сноски с источником происхождения, а сами сноски стали кликабельными ссылками «Источник»; отдельным коммитом у «Дженерика» в определении проставлена ссылка на NN/g. То есть словарь перешёл от «определение своими словами» к «определение со ссылкой, которую можно проверить».

**Из свежего в словаре:** Спайк, Слоп, Бэклэш, Клауза, Вендор-локин, Оверхед — термины, которых год назад в русском IT-языке просто не было.

###### 🧭 Что такое Lkit

**Lkit** — персональный каталог дизайн-инструментов и ресурсов для команды Lorrrem. Статический сайт с тёмной темой, где собраны инструменты по UX/UI-дизайну, ИИ, продвижению, обучению — с поиском, фильтрами и подкатегориями.

Второй ключевой раздел — **IT-словарь**: 659 русскоязычных IT-терминов и сленга с развёрнутыми живыми определениями, поиском, буквенной навигацией и шаринговыми ссылками на каждый термин.

**Аудитория:** команда Lorrrem, дизайнеры, разработчики.

---

###### 🏗 Архитектура

####### Тип приложения

Полностью статический сайт — **HTML + CSS + Vanilla JS**, без фреймворков и бандлеров. Работает без сервера: открывается прямо из файловой системы или с любого файлового хостинга.

####### Единственная страница

```
site/index.html   ← SPA-like, всё управление через JS
```

Вся навигация (рубрики, поиск, словарь, фильтры) работает через манипуляцию DOM без перезагрузки страницы. URL-якоря (`#dict-{id}`) используются для шаринга терминов.

####### Слои данных

```
window.CATALOG_DATA    ← 383 карточки инструментов  (site/catalog-data.js, 4981 строк)
window.DICTIONARY_DATA ← 659 IT-терминов            (site/dictionary-data.js, 4346 строк)
```

Оба файла — статические JS-переменные, генерируются локальными скриптами и коммитятся в репо.

####### Раскладка интерфейса

```
.app-layout  (CSS Grid: 280px sidebar + fluid content)
├── .sidebar
│   ├── .sidebar-brand  (логотип Lkit)
│   └── .rubric-nav     (кнопки рубрик + IT-словарь)
└── .main
    ├── .content-topbar
    │   ├── .control-search     (единый input для каталога и словаря)
    │   └── .subcategory-tabs   (подрубрики / буквы алфавита в словаре)
    ├── .catalog-grid  (hidden в режиме словаря)
    └── .dict-view     (hidden в режиме каталога)
```

---

###### 📁 Структура проекта

```
Lkit/
├── site/                      ← исходники сайта (деплоятся на хостинг)
│   ├── index.html             ← разметка, шрифты, скрипты
│   ├── styles.css             ← 735 строк, тёмная тема, CSS Variables
│   ├── app.js                 ← 749 строк, вся логика каталога и словаря
│   ├── catalog-data.js        ← window.CATALOG_DATA (383 карточки)
│   ├── dictionary-data.js     ← window.DICTIONARY_DATA (659 терминов)
│   ├── ui-kit.html            ← дизайн-система проекта (ветка UI-kit)
│   └── screenshots/           ← локальные скриншоты ресурсов (~130 PNG)
│
├── scripts/                   ← инструменты работы со словарём
│   ├── build_dictionary.mjs   ← парсит output/dictionary_raw.txt → dictionary-data.js
│   ├── expand_dictionary.mjs  ← расширяет определения через OpenAI API (батч, 469 терминов за раз)
│   ├── factcheck_claude.mjs   ← факт-чек через Claude: удаляет ложные термины
│   ├── apply_factcheck_fixes.mjs ← применяет патчи от факт-чека
│   ├── analyze_report.mjs     ← анализ отчёта факт-чека
│   ├── assign_emoji.mjs       ← назначение эмодзи карточкам каталога
│   ├── check_links.mjs        ← проверка живости ссылок в каталоге
│   ├── delete_dead.mjs        ← удаление мёртвых ссылок
│   ├── patch_catalog.mjs      ← точечные правки catalog-data.js
│   └── parser/                ← инструмент автопарсинга новых терминов
│       ├── parse_terms.mjs    ← основной парсер (Wiktionary → LLM → словарь)
│       ├── add_terms.mjs      ← ручной добор терминов через LLM
│       ├── llm.mjs            ← LLM-модуль (Claude приоритет, fallback OpenAI)
│       ├── sources.config.mjs ← конфиг источников парсера (19 категорий Викисловаря)
│       └── manual_terms.mjs   ← список терминов для ручного добора
│
├── Memory/                    ← база знаний проекта
│   ├── knowledge-base.md      ← старая база знаний (2026-06-14)
│   └── lkit-analytics.md      ← этот документ
│
├── .github/workflows/
│   └── deploy-ftp.yml         ← CI/CD: авто-деплой на lkit.lorrrem.ru при пуше в main
│
├── CLAUDE.md                  ← правила работы для всех Claude-сессий
├── package.json               ← npm-скрипты для словаря
└── .gitignore                 ← output/ в gitignore
```

---

###### ✨ Функциональность

####### Каталог инструментов

| Параметр | Значение |
|---|---|
| Всего карточек | 383 |
| Рубрики | Инструменты (121), ИИ (92), Контент и обучение (91), Ресурсы (79), Продвижение (6) |
| Подрубрики | 35 штук |

**Поиск:** многоуровневая система скоринга с intent-detection. Поиск понимает:
- Точные совпадения токенов → +10 очков
- Частичные совпадения → +6
- Совпадение в сыром тексте → +3
- Буст по intent-группам (иконки, ИИ, шрифты, цвет, видео, аудио и др.) → +8–12

**Нормализация:** `ё → е`, удаление спецсимволов, стемминг русских окончаний.

**Навигация:**
- Боковое меню рубрик (sticky sidebar)
- Горизонтальные таблетки подрубрик
- Переключение между рубриками сбрасывает поиск и подрубрику

**Карточки:** emoji-бейдж (автовыбор по теме или из данных), заголовок, описание, ссылка `target="_blank"`.

**Адаптив:**
- Desktop: 280px sidebar + fluid grid
- Tablet: burger-меню в хедере + dropdown
- Mobile: нижний лист навигации (bottom sheet)

####### IT-словарь

| Параметр | Значение |
|---|---|
| Всего терминов | 659 |
| Буквы | А–Я + латинские (C, O) |
| Источники | Викисловарь (19 категорий), Ручное добавление, OpenAI-расширение |

**Возможности:**
- Поиск по названию и определению
- Буквенная навигация (вкладки с каунтером)
- Кнопка ⎘ при наведении — копирует прямую ссылку `#dict-{id}`
- Открытие по URL с якорем: автопереключение в режим словаря + скролл + подсветка термина
- Определения: 2–3 предложения в живом разговорном стиле

---

###### 🔄 Пайплайн данных

####### Каталог

```
Ручная база данных (ранее Obsidian/Notion)
→ catalog-data.js (window.CATALOG_DATA)   ← редактируется вручную через patch_catalog.mjs
→ site/ (деплой)
```

####### Словарь

```
Источники:
  Викисловарь API (19 категорий) ──┐
  output/dictionary_raw.txt       ──┤→ parse_terms.mjs / build_dictionary.mjs
  manual_terms.mjs                ──┘
          ↓
  LLM (Claude Opus 4.8 / GPT-4o-mini)
  переписывает определения в разговорный стиль
  с few-shot промптом (12 примеров)
          ↓
  site/dictionary-data.js (window.DICTIONARY_DATA)
          ↓
  factcheck_claude.mjs  ← факт-чек: удаление ложных терминов
          ↓
  Деплой
```

**Дедупликация:** нормализация `ё→е`, `э→е`, удаление скобочных частей, нижний регистр. Термины-дубликаты по нормализованному ключу пропускаются.

---

###### 🤖 LLM-интеграции

####### Claude (Anthropic)

- **Модель:** `claude-opus-4-8` (по умолчанию, переопределяется `LLM_MODEL`)
- **Использование:** переписывание определений словаря, факт-чек терминов
- **Промпт-кэширование:** системный блок с few-shot примерами помечен `cache_control: ephemeral` → кэшируется, экономит ~90% токенов при батчевой обработке
- **SDK:** `@anthropic-ai/sdk ^0.104.1`
- **Ключ:** `ANTHROPIC_API_KEY` (env, не хранится в репо)

####### OpenAI

- **Модель:** `gpt-4o-mini` (по умолчанию)
- **Использование:** fallback если нет Anthropic ключа; первичное расширение 469 определений (исторически)
- **Ключ:** `OPENAI_API_KEY` (env; ключи, переданные в чате, нужно отозвать)

**Приоритет:** Claude > OpenAI. Если нет ни одного ключа — режим `--no-llm`.

---

###### ☁️ Деплой и инфраструктура

####### Продакшн: lkit.lorrrem.ru

```yaml
Триггер: push в main, изменения в site/** или workflow
Экшн:   SamKirkland/FTP-Deploy-Action@v4.3.5
Протокол: FTPS (TLS)
Секреты: FTP_SERVER, FTP_USERNAME, FTP_PASSWORD, FTP_PORT
Что деплоится: site/index.html, styles.css, app.js, catalog-data.js, dictionary-data.js
Что пропускается: site/screenshots/ (слишком тяжело)
```

Деплой автоматический при каждом пуше в `main` с изменениями в `site/`.

####### Тест: gh-pages (GitHub Pages)

```
URL: https://lorrrem-zlnkh.github.io/lkit/
Ветка: gh-pages (root)
Тип: Legacy (без Jekyll)
Деплой: вручную — копируем site/* в корень gh-pages
```

**Важно:** `gh-pages` = тестовая среда. Не переименовывать (ограничение GitHub Pages).

####### Аналитика

- **Яндекс.Метрика** — счётчик `109847531` встроен в `index.html`

---

###### 🔀 Git-стратегия

####### Ветки

| Ветка | Назначение |
|---|---|
| `main` | Стабильная версия, авто-деплой на `lkit.lorrrem.ru` |
| `gh-pages` | Тестовая среда (GitHub Pages), файлы в корне |
| `feature/dictionary` | Изменения словаря |
| `feature/catalog` | Изменения каталога |
| `UI-kit` | Дизайн-система проекта (`site/ui-kit.html`) |

####### Workflow

```
1. Изменения → коммит в feature-ветке
2. Деплой на gh-pages (тест)
3. Тестирование
4. Merge в main → авто-деплой на продакшн
```

**Правило:** никогда не мёрджить в `main` без прохождения теста на `gh-pages`.

####### Auto-push hook

`.git/hooks/post-commit` автоматически пушит текущую ветку на origin после каждого коммита.

####### Проверка перед коммитом

```bash
git log --oneline -10   # что было в других чатах
git status              # что в индексе
cat package.json        # мог измениться в соседнем чате
```

---

###### 📦 Зависимости

```json
{
  "@anthropic-ai/sdk": "^0.104.1",
  "cheerio": "^1.2.0"
}
```

| Пакет | Зачем |
|---|---|
| `@anthropic-ai/sdk` | Claude API для LLM-переписывания определений |
| `cheerio` | HTML-парсинг страниц Викисловаря/Википедии |

**Node.js:** ESM (`"type": "module"`), все скрипты `.mjs`.

---

###### 🎨 Дизайн-система

####### CSS Variables (тёмная тема)

```css
--bg: #0b0d10          /* фон страницы */
--bg-soft: #12161b
--panel: #101419
--card: #171d25        /* фон карточки */
--card-hover: #1c2430
--text: #f3f5f7
--muted: #8e9aa8       /* вторичный текст */
--accent: #7dd3fc      /* голубой акцент */
--accent-soft: rgba(125, 211, 252, 0.12)
--line: rgba(255,255,255,0.08)   /* разделители */
--radius-xl: 28px
--radius-lg: 22px
--radius-md: 18px
```

####### Шрифты

- **Manrope** (400, 500, 700, 800) — основной текст
- **IBM Plex Mono** (400, 500) — счётчики, метки, кнопки

####### Брейкпоинты

- `> 1100px` — desktop (sidebar + grid)
- `≤ 1100px` — tablet (burger + dropdown)
- `≤ 720px` — mobile (bottom sheet)

---

###### 📊 npm-скрипты

| Скрипт | Команда | Что делает |
|---|---|---|
| `dict:build` | `node scripts/build_dictionary.mjs` | Парсит `output/dictionary_raw.txt` → `dictionary-data.js` |
| `dict:expand` | `node scripts/expand_dictionary.mjs` | Расширяет определения через OpenAI API |
| `dict:parse` | `node scripts/parser/parse_terms.mjs` | Парсит новые термины из Викисловаря через LLM |
| `dict:add` | `node scripts/parser/add_terms.mjs` | Ручной добор терминов из `manual_terms.mjs` |

---

###### 🗂 Источники словаря

####### Викисловарь (19 категорий)

- Компьютер, Программирование, Программное обеспечение
- Интернет, Сетевой жаргон, Компьютерные программы
- Компьютерные сети, Компьютерные игры, Криптография
- Шифрование, Языки программирования, Операционные системы
- Алгоритмы, Нейронные сети, Данные, Файлы
- Информационная безопасность, Кодирование, Носители

####### Стратегии парсинга

- `wiktionary-category` — список слов из категории → IT-значение из секции «Значение»
- `dl` — списки `<dt>/<dd>` из Wikipedia-глоссариев
- `table` — таблицы (первый столбец — термин, второй — определение)
- `list-dash` — пункты списков вида `Термин — описание`

####### Фильтрация сырых пар

```js
maxTermLen: 45      // слишком длинное — заголовок, не термин
minTermLen: 2
maxTermWords: 4     // >4 слов — обычно заголовок раздела
minDefLen: 25       // слишком короткое определение пропускается
```

---

###### 🛡 Безопасность

- **API-ключи** никогда не хранятся в репо — только через env
- **OpenAI ключ**, переданный в чате, был скомпрометирован → нужно отозвать и перевыпустить
- **FTP-данные** только в GitHub Secrets
- Репозиторий **публичный** (требование для бесплатного GitHub Pages)

---

###### 📈 История развития (по коммитам)

| Этап | Что сделано |
|---|---|
| Initial | Базовый каталог, экспорт данных |
| +IT-словарь | 469 терминов, поиск, буквенная навигация, share-ссылки |
| +LLM расширение | GPT-4o-mini расширил все определения до 2–3 предложений |
| +Парсер | Автопополнение из Викисловаря через Claude, дедуп, few-shot |
| +Факт-чек | Claude проверил 605 терминов: удалены ложные, исправлены этимологии |
| +Ручной добор | Инструмент manual_terms + 28 кураторских терминов |
| +659 терминов | Категории ИБ, ML/PL/OS, ещё 2 батча |
| +Мобайл | Burger-меню, bottom sheet, tablet layout |
| +FTP деплой | GitHub Actions → lkit.lorrrem.ru (FTPS) |
| +Метрика | Яндекс.Метрика 109847531 |
| Чистка | Удалены: skills автоматизации, Playwright, чат-логи, старые скрипты |
| +UI Kit | Дизайн-система: токены, типографика, компоненты, состояния — `site/ui-kit.html` |

---

###### 🎨 UI Kit

Живая дизайн-система проекта — все компоненты, токены и состояния в одном месте.

**Файл:** `site/ui-kit.html` · **Ветка:** `UI-kit`
**URL (gh-pages):** https://lorrrem-zlnkh.github.io/lkit/ui-kit.html

####### Содержание

| # | Секция | Что внутри |
|---|---|---|
| 01 | Цвета / CSS Tokens | Все переменные со свотчами и hex-значениями |
| 02 | Типографика | Вся иерархия от H1 до копирайта (Manrope + IBM Plex Mono) |
| 03 | Радиусы и тени | Все значения border-radius + box-shadow |
| 04 | Рубрики / Sidebar nav | default / hover / active / dict-active |
| 05 | Подкатегории / Subtab | default / hover / active + буквенная навигация словаря |
| 06 | Поиск | Пустое и заполненное состояние |
| 07 | Карточки каталога | С emoji / в hover / без meta / с обложкой / empty state |
| 08 | Emoji badge | emoji-badge 52×52, rubric-icon 34×34 |
| 09 | IT-словарь | Термины: default / hover / share-hover / copied / highlight |
| 10 | Мобильная навигация | Topbar, burger (закрыт/открыт), bottom sheet, tablet dropdown |
| 11 | Sidebar полный | Десктопный сайдбар целиком |
| 12 | Фоны страницы | Каталог vs Словарь режим |

---

###### 🔮 Что планируется

- Пополнение словаря (парсер запускается по мере находки новых источников)
- Улучшение каталога: новые карточки, актуализация описаний
- Возможно: поиск по каталогу + словарю одновременно

---

###### Стек и зависимости

<!-- auto:stack -->
**package.json** — lkit
- `@anthropic-ai/sdk` ^0.104.1
- `cheerio` ^1.2.0
<!-- /auto:stack -->

<!-- auto:stamp -->
Снято 1 октября 2026 · ветка `main` · последний коммит `90d3fa6` от 01.10.2026 17:54
<!-- /auto:stamp -->

###### Объём кода

<!-- auto:size -->
| Язык | Файлов | Строк |
|---|---|---|
| JSON | 5 | 14630 |
| JavaScript | 18 | 13037 |
| Markdown | 4 | 3027 |
| CSS | 1 | 742 |
| HTML | 1 | 96 |
<!-- /auto:size -->

###### Дерево репозитория

<!-- auto:tree -->
```
Memory/
  knowledge-base.md
  lkit-analytics.md
output/
  output/ — 26 файлов
scripts/
  parser/
    add_terms.mjs
    llm.mjs
    manual_terms.mjs
    parse_terms.mjs
    sources.config.mjs
  add_terms.mjs
  analyze_report.mjs
  apply_factcheck_fixes.mjs
  assign_emoji.mjs
  build_dictionary.mjs
  check_links.mjs
  delete_dead.mjs
  expand_dictionary.mjs
  factcheck_claude.mjs
  patch_catalog.mjs
site/
  screenshots/
    screenshots/ — 180 файлов
  app.js
  catalog-data.js
  dictionary-data.js
  index.html
  styles.css
CLAUDE.md
lkit favocon.png
LKIT lorrrem zelenykh.png
package-lock.json
package.json
README.md
```
<!-- /auto:tree -->

###### Файлы и их роли

<!-- auto:files -->
| Файл | Строк | Зачем |
|---|---|---|
| `scripts/add_terms.mjs` | 68 | Добавляет термины в site/dictionary-data.js с алфавитной вставкой в группу буквы. |
| `scripts/analyze_report.mjs` | 55 | Анализ output/link_report.json: раскладывает карточки по корзинам для Фазы 1. |
| `scripts/apply_factcheck_fixes.mjs` | 54 | Применяет исправления, подтверждённые интернет-фактчекингом (источники в ответе). |
| `scripts/assign_emoji.mjs` | 196 | const FILE = "site/catalog-data.js"; |
| `scripts/build_dictionary.mjs` | 40 | const raw = await fs.readFile(path.resolve("output/dictionary_raw.txt"), "utf8"); |
| `scripts/check_links.mjs` | 124 | Phase 0: проверка всех ссылок каталога. |
| `scripts/delete_dead.mjs` | 56 | Удаляет карточки откровенно мёртвых сервисов (подтверждено авторитетным DNS: |
| `scripts/expand_dictionary.mjs` | 52 | const API_KEY = process.env.OPENAI_API_KEY; |
| `scripts/factcheck_claude.mjs` | 124 | Фактчекинг словаря через Claude API (claude-opus-4-8). |
| `scripts/parser/add_terms.mjs` | 52 | Точечный ручной добор терминов в словарь Lkit. |
| `scripts/parser/llm.mjs` | 110 | LLM-модуль парсера: переписывает определение «своими словами» в стиле словаря. |
| `scripts/parser/manual_terms.mjs` | 191 | Список для точечного ручного добора терминов (scripts/parser/add_terms.mjs). |
| `scripts/parser/parse_terms.mjs` | 311 | Парсер терминов для Lkit — самостоятельный инструмент (не связан с каталогом/дайджестом). |
| `scripts/parser/sources.config.mjs` | 81 | Конфиг источников для парсера терминов (scripts/parser/parse_terms.mjs). |
| `scripts/patch_catalog.mjs` | 135 | Применяет точечные правки к catalog-data.js по Slug. |
| `site/app.js` | 779 | const data = window.CATALOG_DATA || []; |
| `site/catalog-data.js` | 5111 | window.CATALOG_DATA = [ |
| `site/dictionary-data.js` | 5498 | window.DICTIONARY_DATA = [ |
| `site/index.html` | 96 | <!doctype html> |
| `site/styles.css` | 742 | :root { |
<!-- /auto:files -->

###### Скрипты

<!-- auto:scripts -->
| Скрипт | Зачем |
|---|---|
| `scripts/add_terms.mjs` | Добавляет термины в site/dictionary-data.js с алфавитной вставкой в группу буквы. |
| `scripts/analyze_report.mjs` | Анализ output/link_report.json: раскладывает карточки по корзинам для Фазы 1. |
| `scripts/apply_factcheck_fixes.mjs` | Применяет исправления, подтверждённые интернет-фактчекингом (источники в ответе). |
| `scripts/assign_emoji.mjs` | const FILE = "site/catalog-data.js"; |
| `scripts/build_dictionary.mjs` | const raw = await fs.readFile(path.resolve("output/dictionary_raw.txt"), "utf8"); |
| `scripts/check_links.mjs` | Phase 0: проверка всех ссылок каталога. |
| `scripts/delete_dead.mjs` | Удаляет карточки откровенно мёртвых сервисов (подтверждено авторитетным DNS: |
| `scripts/expand_dictionary.mjs` | const API_KEY = process.env.OPENAI_API_KEY; |
| `scripts/factcheck_claude.mjs` | Фактчекинг словаря через Claude API (claude-opus-4-8). |
| `scripts/patch_catalog.mjs` | Применяет точечные правки к catalog-data.js по Slug. |
<!-- /auto:scripts -->

###### История коммитов

<!-- auto:history -->
Коммитов всего: 75 · первый: 09.03.2026

- 01.10.2026 · `90d3fa6` · Аналитика: догнала код, машинный слой и синхронизация с Obsidian (L-6)
- 18.09.2026 · `b296c6e` · Add Оверхед to dictionary (807)
- 16.09.2026 · `e01a2f0` · Add Вендор-локин to dictionary (806)
- 16.09.2026 · `c8739d3` · Add Клауза to dictionary (805)
- 16.09.2026 · `f204802` · Render source footnotes as clickable «Источник» links
- 16.09.2026 · `288912c` · Add sourced origin footnotes to 37 terms
- 16.09.2026 · `af9dc18` · Дженерик: cite the NN/g source in the definition
- 16.09.2026 · `08e95d7` · Add Дженерик (generic visual style, NN/g) to dictionary (804)
- 16.09.2026 · `b40dae0` · Add Спайк, Слоп, Бэклэш to dictionary (803)
- 13.07.2026 · `6c9bee6` · Add Ludo.ai to catalog (392→393)
- 13.07.2026 · `024ca82` · Add Project Genie to catalog (391→392)
- 08.07.2026 · `5522236` · Add MA-g (Museum of Avant-garde) to promotion (390→391)
- 03.07.2026 · `cfe6b1a` · Add Art Innovation Gallery to promotion (389→390)
- 25.06.2026 · `33b285b` · Add Дизайн-дайджест button to sidebar under blog link
- 25.06.2026 · `b2ca8ca` · Add Tagio to promotion (388→389)
- 25.06.2026 · `0fa12b3` · Add BidFox to promotion (387→388)
- 25.06.2026 · `0e445ed` · Add Telega.in and TeleTarget to promotion (385→387)
- 24.06.2026 · `7ed15a1` · Update Lorrrem channel link to invite URL
- 21.06.2026 · `61d0a16` · Move Yandex Промптхаб to education, refresh description
- 21.06.2026 · `81e245a` · Add shadcn/ui to UI-kits & libraries (384→385)
<!-- /auto:history -->

###### README репозитория

<!-- auto:readme -->
*Файл `README.md`, как есть:*

---
tags: [lkit, analytics, architecture, documentation]
created: 2026-06-16
updated: 2026-10-01
---

####### Lkit — Аналитика проекта

> Живой документ. Отражает состояние проекта по состоянию на **16 июня 2026**.

---

> **Обновлено:** 1 октября 2026

######## 📈 Что изменилось с 16 июня 2026

Документ стоял на 16 июня, в коде с тех пор 21 коммит. Правки шли почти целиком в данные, а не в устройство: `site/catalog-data.js` (11 раз) и `site/dictionary-data.js` (9).

**Объём на 1 октября:** 394 инструмента в каталоге, **807 терминов** в словаре — и номер растёт в каждом сообщении коммита («Add Оверхед to dictionary (807)»), то есть счёт ведётся прямо в истории.

**Содержательная линия — источники.** 16 сентября к 37 терминам добавлены сноски с источником происхождения, а сами сноски стали кликабельными ссылками «Источник»; отдельным коммитом у «Дженерика» в определении проставлена ссылка на NN/g. То есть словарь перешёл от «определение своими словами» к «определение со ссылкой, которую можно проверить».

**Из свежего в словаре:** Спайк, Слоп, Бэклэш, Клауза, Вендор-локин, Оверхед — термины, которых год назад в русском IT-языке просто не было.

######## 🧭 Что такое Lkit

**Lkit** — персональный каталог дизайн-инструментов и ресурсов для команды Lorrrem. Статический сайт с тёмной темой, где собраны инструменты по UX/UI-дизайну, ИИ, продвижению, обучению — с поиском, фильтрами и подкатегориями.

Второй ключевой раздел — **IT-словарь**: 659 русскоязычных IT-терминов и сленга с развёрнутыми живыми определениями, поиском, буквенной навигацией и шаринговыми ссылками на каждый термин.

**Аудитория:** команда Lorrrem, дизайнеры, разработчики.

---

######## 🏗 Архитектура

######### Тип приложения

Полностью статический сайт — **HTML + CSS + Vanilla JS**, без фреймворков и бандлеров. Работает без сервера: открывается прямо из файловой системы или с любого файлового хостинга.

######### Единственная страница

```
site/index.html   ← SPA-like, всё управление через JS
```

Вся навигация (рубрики, поиск, словарь, фильтры) работает через манипуляцию DOM без перезагрузки страницы. URL-якоря (`#dict-{id}`) используются для шаринга терминов.

######### Слои данных

```
window.CATALOG_DATA    ← 383 карточки инструментов  (site/catalog-data.js, 4981 строк)
window.DICTIONARY_DATA ← 659 IT-терминов            (site/dictionary-data.js, 4346 строк)
```

Оба файла — статические JS-переменные, генерируются локальными скриптами и коммитятся в репо.

######### Раскладка интерфейса

```
.app-layout  (CSS Grid: 280px sidebar + fluid content)
├── .sidebar
│   ├── .sidebar-brand  (логотип Lkit)
│   └── .rubric-nav     (кнопки рубрик + IT-словарь)
└── .main
    ├── .content-topbar
    │   ├── .control-search     (единый input для каталога и словаря)
    │   └── .subcategory-tabs   (подрубрики / буквы алфавита в словаре)
    ├── .catalog-grid  (hidden в режиме словаря)
    └── .dict-view     (hidden в режиме каталога)
```

---

######## 📁 Структура проекта

```
Lkit/
├── site/                      ← исходники сайта (деплоятся на хостинг)
│   ├── index.html             ← разметка, шрифты, скрипты
│   ├── styles.css             ← 735 строк, тёмная тема, CSS Variables
│   ├── app.js                 ← 749 строк, вся логика каталога и словаря
│   ├── catalog-data.js        ← window.CATALOG_DATA (383 карточки)
│   ├── dictionary-data.js     ← window.DICTIONARY_DATA (659 терминов)
│   ├── ui-kit.html            ← дизайн-система проекта (ветка UI-kit)
│   └── screenshots/           ← локальные скриншоты ресурсов (~130 PNG)
│
├── scripts/                   ← инструменты работы со словарём
│   ├── build_dictionary.mjs   ← парсит output/dictionary_raw.txt → dictionary-data.js
│   ├── expand_dictionary.mjs  ← расширяет определения через OpenAI API (батч, 469 терминов за раз)
│   ├── factcheck_claude.mjs   ← факт-чек через Claude: удаляет ложные термины
│   ├── apply_factcheck_fixes.mjs ← применяет патчи от факт-чека
│   ├── analyze_report.mjs     ← анализ отчёта факт-чека
│   ├── assign_emoji.mjs       ← назначение эмодзи карточкам каталога
│   ├── check_links.mjs        ← проверка живости ссылок в каталоге
│   ├── delete_dead.mjs        ← удаление мёртвых ссылок
│   ├── patch_catalog.mjs      ← точечные правки catalog-data.js
│   └── parser/                ← инструмент автопарсинга новых терминов
│       ├── parse_terms.mjs    ← основной парсер (Wiktionary → LLM → словарь)
│       ├── add_terms.mjs      ← ручной добор терминов через LLM
│       ├── llm.mjs            ← LLM-модуль (Claude приоритет, fallback OpenAI)
│       ├── sources.config.mjs ← конфиг источников парсера (19 категорий Викисловаря)
│       └── manual_terms.mjs   ← список терминов для ручного добора
│
├── Memory/                    ← база знаний проекта
│   ├── knowledge-base.md      ← старая база знаний (2026-06-14)
│   └── lkit-analytics.md      ← этот документ
│
├── .github/workflows/
│   └── deploy-ftp.yml         ← CI/CD: авто-деплой на lkit.lorrrem.ru при пуше в main
│
├── CLAUDE.md                  ← правила работы для всех Claude-сессий
├── package.json               ← npm-скрипты для словаря
└── .gitignore                 ← output/ в gitignore
```

---

######## ✨ Функциональность

######### Каталог инструментов

| Параметр | Значение |
|---|---|
| Всего карточек | 383 |
| Рубрики | Инструменты (121), ИИ (92), Контент и обучение (91), Ресурсы (79), Продвижение (6) |
| Подрубрики | 35 штук |

**Поиск:** многоуровневая система скоринга с intent-detection. Поиск понимает:
- Точные совпадения токенов → +10 очков
- Частичные совпадения → +6
- Совпадение в сыром тексте → +3
- Буст по intent-группам (иконки, ИИ, шрифты, цвет, видео, аудио и др.) → +8–12

**Нормализация:** `ё → е`, удаление спецсимволов, стемминг русских окончаний.

**Навигация:**
- Боковое меню рубрик (sticky sidebar)
- Горизонтальные таблетки подрубрик
- Переключение между рубриками сбрасывает поиск и подрубрику

**Карточки:** emoji-бейдж (автовыбор по теме или из данных), заголовок, описание, ссылка `target="_blank"`.

**Адаптив:**
- Desktop: 280px sidebar + fluid grid
- Tablet: burger-меню в хедере + dropdown
- Mobile: нижний лист навигации (bottom sheet)

######### IT-словарь

| Параметр | Значение |
|---|---|
| Всего терминов | 659 |
| Буквы | А–Я + латинские (C, O) |
| Источники | Викисловарь (19 категорий), Ручное добавление, OpenAI-расширение |

**Возможности:**
- Поиск по названию и определению
- Буквенная навигация (вкладки с каунтером)
- Кнопка ⎘ при наведении — копирует прямую ссылку `#dict-{id}`
- Открытие по URL с якорем: автопереключение в режим словаря + скролл + подсветка термина
- Определения: 2–3 предложения в живом разговорном стиле

---

######## 🔄 Пайплайн данных

######### Каталог

```
Ручная база данных (ранее Obsidian/Notion)
→ catalog-data.js (window.CATALOG_DATA)   ← редактируется вручную через patch_catalog.mjs
→ site/ (деплой)
```

######### Словарь

```
Источники:
  Викисловарь API (19 категорий) ──┐
  output/dictionary_raw.txt       ──┤→ parse_terms.mjs / build_dictionary.mjs
  manual_terms.mjs                ──┘
          ↓
  LLM (Claude Opus 4.8 / GPT-4o-mini)
  переписывает определения в разговорный стиль
  с few-shot промптом (12 примеров)
          ↓
  site/dictionary-data.js (window.DICTIONARY_DATA)
          ↓
  factcheck_claude.mjs  ← факт-чек: удаление ложных терминов
          ↓
  Деплой
```

**Дедупликация:** нормализация `ё→е`, `э→е`, удаление скобочных частей, нижний регистр. Термины-дубликаты по нормализованному ключу пропускаются.

---

######## 🤖 LLM-интеграции

######### Claude (Anthropic)

- **Модель:** `claude-opus-4-8` (по умолчанию, переопределяется `LLM_MODEL`)
- **Использование:** переписывание определений словаря, факт-чек терминов
- **Промпт-кэширование:** системный блок с few-shot примерами помечен `cache_control: ephemeral` → кэшируется, экономит ~90% токенов при батчевой обработке
- **SDK:** `@anthropic-ai/sdk ^0.104.1`
- **Ключ:** `ANTHROPIC_API_KEY` (env, не хранится в репо)

######### OpenAI

- **Модель:** `gpt-4o-mini` (по умолчанию)
- **Использование:** fallback если нет Anthropic ключа; первичное расширение 469 определений (исторически)
- **Ключ:** `OPENAI_API_KEY` (env; ключи, переданные в чате, нужно отозвать)

**Приоритет:** Claude > OpenAI. Если нет ни одного ключа — режим `--no-llm`.

---

######## ☁️ Деплой и инфраструктура

######### Продакшн: lkit.lorrrem.ru

```yaml
Триггер: push в main, изменения в site/** или workflow
Экшн:   SamKirkland/FTP-Deploy-Action@v4.3.5
Протокол: FTPS (TLS)
Секреты: FTP_SERVER, FTP_USERNAME, FTP_PASSWORD, FTP_PORT
Что деплоится: site/index.html, styles.css, app.js, catalog-data.js, dictionary-data.js
Что пропускается: site/screenshots/ (слишком тяжело)
```

Деплой автоматический при каждом пуше в `main` с изменениями в `site/`.

######### Тест: gh-pages (GitHub Pages)

```
URL: https://lorrrem-zlnkh.github.io/lkit/
Ветка: gh-pages (root)
Тип: Legacy (без Jekyll)
Деплой: вручную — копируем site/* в корень gh-pages
```

**Важно:** `gh-pages` = тестовая среда. Не переименовывать (ограничение GitHub Pages).

######### Аналитика

- **Яндекс.Метрика** — счётчик `109847531` встроен в `index.html`

---

######## 🔀 Git-стратегия

######### Ветки

| Ветка | Назначение |
|---|---|
| `main` | Стабильная версия, авто-деплой на `lkit.lorrrem.ru` |
| `gh-pages` | Тестовая среда (GitHub Pages), файлы в корне |
| `feature/dictionary` | Изменения словаря |
| `feature/catalog` | Изменения каталога |
| `UI-kit` | Дизайн-система проекта (`site/ui-kit.html`) |

######### Workflow

```
1. Изменения → коммит в feature-ветке
2. Деплой на gh-pages (тест)
3. Тестирование
4. Merge в main → авто-деплой на продакшн
```

**Правило:** никогда не мёрджить в `main` без прохождения теста на `gh-pages`.

######### Auto-push hook

`.git/hooks/post-commit` автоматически пушит текущую ветку на origin после каждого коммита.

######### Проверка перед коммитом

```bash
git log --oneline -10   # что было в других чатах
git status              # что в индексе
cat package.json        # мог измениться в соседнем чате
```

---

######## 📦 Зависимости

```json
{
  "@anthropic-ai/sdk": "^0.104.1",
  "cheerio": "^1.2.0"
}
```

| Пакет | Зачем |
|---|---|
| `@anthropic-ai/sdk` | Claude API для LLM-переписывания определений |
| `cheerio` | HTML-парсинг страниц Викисловаря/Википедии |

**Node.js:** ESM (`"type": "module"`), все скрипты `.mjs`.

---

######## 🎨 Дизайн-система

######### CSS Variables (тёмная тема)

```css
--bg: #0b0d10          /* фон страницы */
--bg-soft: #12161b
--panel: #101419
--card: #171d25        /* фон карточки */
--card-hover: #1c2430
--text: #f3f5f7
--muted: #8e9aa8       /* вторичный текст */
--accent: #7dd3fc      /* голубой акцент */
--accent-soft: rgba(125, 211, 252, 0.12)
--line: rgba(255,255,255,0.08)   /* разделители */
--radius-xl: 28px
--radius-lg: 22px
--radius-md: 18px
```

######### Шрифты

- **Manrope** (400, 500, 700, 800) — основной текст
- **IBM Plex Mono** (400, 500) — счётчики, метки, кнопки

######### Брейкпоинты

- `> 1100px` — desktop (sidebar + grid)
- `≤ 1100px` — tablet (burger + dropdown)
- `≤ 720px` — mobile (bottom sheet)

---

######## 📊 npm-скрипты

| Скрипт | Команда | Что делает |
|---|---|---|
| `dict:build` | `node scripts/build_dictionary.mjs` | Парсит `output/dictionary_raw.txt` → `dictionary-data.js` |
| `dict:expand` | `node scripts/expand_dictionary.mjs` | Расширяет определения через OpenAI API |
| `dict:parse` | `node scripts/parser/parse_terms.mjs` | Парсит новые термины из Викисловаря через LLM |
| `dict:add` | `node scripts/parser/add_terms.mjs` | Ручной добор терминов из `manual_terms.mjs` |

---

######## 🗂 Источники словаря

######### Викисловарь (19 категорий)

- Компьютер, Программирование, Программное обеспечение
- Интернет, Сетевой жаргон, Компьютерные программы
- Компьютерные сети, Компьютерные игры, Криптография
- Шифрование, Языки программирования, Операционные системы
- Алгоритмы, Нейронные сети, Данные, Файлы
- Информационная безопасность, Кодирование, Носители

######### Стратегии парсинга

- `wiktionary-category` — список слов из категории → IT-значение из секции «Значение»
- `dl` — списки `<dt>/<dd>` из Wikipedia-глоссариев
- `table` — таблицы (первый столбец — термин, второй — определение)
- `list-dash` — пункты списков вида `Термин — описание`

######### Фильтрация сырых пар

```js
maxTermLen: 45      // слишком длинное — заголовок, не термин
minTermLen: 2
maxTermWords: 4     // >4 слов — обычно заголовок раздела
minDefLen: 25       // слишком короткое определение пропускается
```

---

######## 🛡 Безопасность

- **API-ключи** никогда не хранятся в репо — только через env
- **OpenAI ключ**, переданный в чате, был скомпрометирован → нужно отозвать и перевыпустить
- **FTP-данные** только в GitHub Secrets
- Репозиторий **публичный** (требование для бесплатного GitHub Pages)

---

######## 📈 История развития (по коммитам)

| Этап | Что сделано |
|---|---|
| Initial | Базовый каталог, экспорт данных |
| +IT-словарь | 469 терминов, поиск, буквенная навигация, share-ссылки |
| +LLM расширение | GPT-4o-mini расширил все определения до 2–3 предложений |
| +Парсер | Автопополнение из Викисловаря через Claude, дедуп, few-shot |
| +Факт-чек | Claude проверил 605 терминов: удалены ложные, исправлены этимологии |
| +Ручной добор | Инструмент manual_terms + 28 кураторских терминов |
| +659 терминов | Категории ИБ, ML/PL/OS, ещё 2 батча |
| +Мобайл | Burger-меню, bottom sheet, tablet layout |
| +FTP деплой | GitHub Actions → lkit.lorrrem.ru (FTPS) |
| +Метрика | Яндекс.Метрика 109847531 |
| Чистка | Удалены: skills автоматизации, Playwright, чат-логи, старые скрипты |
| +UI Kit | Дизайн-система: токены, типографика, компоненты, состояния — `site/ui-kit.html` |

---

######## 🎨 UI Kit

Живая дизайн-система проекта — все компоненты, токены и состояния в одном месте.

**Файл:** `site/ui-kit.html` · **Ветка:** `UI-kit`
**URL (gh-pages):** https://lorrrem-zlnkh.github.io/lkit/ui-kit.html

######### Содержание

| # | Секция | Что внутри |
|---|---|---|
| 01 | Цвета / CSS Tokens | Все переменные со свотчами и hex-значениями |
| 02 | Типографика | Вся иерархия от H1 до копирайта (Manrope + IBM Plex Mono) |
| 03 | Радиусы и тени | Все значения border-radius + box-shadow |
| 04 | Рубрики / Sidebar nav | default / hover / active / dict-active |
| 05 | Подкатегории / Subtab | default / hover / active + буквенная навигация словаря |
| 06 | Поиск | Пустое и заполненное состояние |
| 07 | Карточки каталога | С emoji / в hover / без meta / с обложкой / empty state |
| 08 | Emoji badge | emoji-badge 52×52, rubric-icon 34×34 |
| 09 | IT-словарь | Термины: default / hover / share-hover / copied / highlight |
| 10 | Мобильная навигация | Topbar, burger (закрыт/открыт), bottom sheet, tablet dropdown |
| 11 | Sidebar полный | Десктопный сайдбар целиком |
| 12 | Фоны страницы | Каталог vs Словарь режим |

---

######## 🔮 Что планируется

- Пополнение словаря (парсер запускается по мере находки новых источников)
- Улучшение каталога: новые карточки, актуализация описаний
- Возможно: поиск по каталогу + словарю одновременно

---

######## Стек и зависимости

<!-- auto:stack -->
**package.json** — lkit
- `@anthropic-ai/sdk` ^0.104.1
- `cheerio` ^1.2.0
<!-- /auto:stack -->

<!-- auto:stamp -->
Снято 1 октября 2026 · ветка `main` · последний коммит `b296c6e` от 18.09.2026 12:01
<!-- /auto:stamp -->

######## Объём кода

<!-- auto:size -->
| Язык | Файлов | Строк |
|---|---|---|
| JSON | 5 | 14630 |
| JavaScript | 18 | 13037 |
| Markdown | 4 | 1292 |
| CSS | 1 | 742 |
| HTML | 1 | 96 |
<!-- /auto:size -->

######## Дерево репозитория

<!-- auto:tree -->
```
Memory/
  knowledge-base.md
  lkit-analytics.md
output/
  output/ — 26 файлов
scripts/
  parser/
    add_terms.mjs
    llm.mjs
    manual_terms.mjs
    parse_terms.mjs
    sources.config.mjs
  add_terms.mjs
  analyze_report.mjs
  apply_factcheck_fixes.mjs
  assign_emoji.mjs
  build_dictionary.mjs
  check_links.mjs
  delete_dead.mjs
  expand_dictionary.mjs
  factcheck_claude.mjs
  patch_catalog.mjs
site/
  screenshots/
    screenshots/ — 180 файлов
  app.js
  catalog-data.js
  dictionary-data.js
  index.html
  styles.css
CLAUDE.md
lkit favocon.png
LKIT lorrrem zelenykh.png
package-lock.json
package.json
README.md
```
<!-- /auto:tree -->

######## Файлы и их роли

<!-- auto:files -->
| Файл | Строк | Зачем |
|---|---|---|
| `scripts/add_terms.mjs` | 68 | Добавляет термины в site/dictionary-data.js с алфавитной вставкой в группу буквы. |
| `scripts/analyze_report.mjs` | 55 | Анализ output/link_report.json: раскладывает карточки по корзинам для Фазы 1. |
| `scripts/apply_factcheck_fixes.mjs` | 54 | Применяет исправления, подтверждённые интернет-фактчекингом (источники в ответе). |
| `scripts/assign_emoji.mjs` | 196 | const FILE = "site/catalog-data.js"; |
| `scripts/build_dictionary.mjs` | 40 | const raw = await fs.readFile(path.resolve("output/dictionary_raw.txt"), "utf8"); |
| `scripts/check_links.mjs` | 124 | Phase 0: проверка всех ссылок каталога. |
| `scripts/delete_dead.mjs` | 56 | Удаляет карточки откровенно мёртвых сервисов (подтверждено авторитетным DNS: |
| `scripts/expand_dictionary.mjs` | 52 | const API_KEY = process.env.OPENAI_API_KEY; |
| `scripts/factcheck_claude.mjs` | 124 | Фактчекинг словаря через Claude API (claude-opus-4-8). |
| `scripts/parser/add_terms.mjs` | 52 | Точечный ручной добор терминов в словарь Lkit. |
| `scripts/parser/llm.mjs` | 110 | LLM-модуль парсера: переписывает определение «своими словами» в стиле словаря. |
| `scripts/parser/manual_terms.mjs` | 191 | Список для точечного ручного добора терминов (scripts/parser/add_terms.mjs). |
| `scripts/parser/parse_terms.mjs` | 311 | Парсер терминов для Lkit — самостоятельный инструмент (не связан с каталогом/дайджестом). |
| `scripts/parser/sources.config.mjs` | 81 | Конфиг источников для парсера терминов (scripts/parser/parse_terms.mjs). |
| `scripts/patch_catalog.mjs` | 135 | Применяет точечные правки к catalog-data.js по Slug. |
| `site/app.js` | 779 | const data = window.CATALOG_DATA || []; |
| `site/catalog-data.js` | 5111 | window.CATALOG_DATA = [ |
| `site/dictionary-data.js` | 5498 | window.DICTIONARY_DATA = [ |
| `site/index.html` | 96 | <!doctype html> |
| `site/styles.css` | 742 | :root { |
<!-- /auto:files -->

######## Скрипты

<!-- auto:scripts -->
| Скрипт | Зачем |
|---|---|
| `scripts/add_terms.mjs` | Добавляет термины в site/dictionary-data.js с алфавитной вставкой в группу буквы. |
| `scripts/analyze_report.mjs` | Анализ output/link_report.json: раскладывает карточки по корзинам для Фазы 1. |
| `scripts/apply_factcheck_fixes.mjs` | Применяет исправления, подтверждённые интернет-фактчекингом (источники в ответе). |
| `scripts/assign_emoji.mjs` | const FILE = "site/catalog-data.js"; |
| `scripts/build_dictionary.mjs` | const raw = await fs.readFile(path.resolve("output/dictionary_raw.txt"), "utf8"); |
| `scripts/check_links.mjs` | Phase 0: проверка всех ссылок каталога. |
| `scripts/delete_dead.mjs` | Удаляет карточки откровенно мёртвых сервисов (подтверждено авторитетным DNS: |
| `scripts/expand_dictionary.mjs` | const API_KEY = process.env.OPENAI_API_KEY; |
| `scripts/factcheck_claude.mjs` | Фактчекинг словаря через Claude API (claude-opus-4-8). |
| `scripts/patch_catalog.mjs` | Применяет точечные правки к catalog-data.js по Slug. |
<!-- /auto:scripts -->

######## История коммитов

<!-- auto:history -->
Коммитов всего: 74 · первый: 09.03.2026

- 18.09.2026 · `b296c6e` · Add Оверхед to dictionary (807)
- 16.09.2026 · `e01a2f0` · Add Вендор-локин to dictionary (806)
- 16.09.2026 · `c8739d3` · Add Клауза to dictionary (805)
- 16.09.2026 · `f204802` · Render source footnotes as clickable «Источник» links
- 16.09.2026 · `288912c` · Add sourced origin footnotes to 37 terms
- 16.09.2026 · `af9dc18` · Дженерик: cite the NN/g source in the definition
- 16.09.2026 · `08e95d7` · Add Дженерик (generic visual style, NN/g) to dictionary (804)
- 16.09.2026 · `b40dae0` · Add Спайк, Слоп, Бэклэш to dictionary (803)
- 13.07.2026 · `6c9bee6` · Add Ludo.ai to catalog (392→393)
- 13.07.2026 · `024ca82` · Add Project Genie to catalog (391→392)
- 08.07.2026 · `5522236` · Add MA-g (Museum of Avant-garde) to promotion (390→391)
- 03.07.2026 · `cfe6b1a` · Add Art Innovation Gallery to promotion (389→390)
- 25.06.2026 · `33b285b` · Add Дизайн-дайджест button to sidebar under blog link
- 25.06.2026 · `b2ca8ca` · Add Tagio to promotion (388→389)
- 25.06.2026 · `0fa12b3` · Add BidFox to promotion (387→388)
- 25.06.2026 · `0e445ed` · Add Telega.in and TeleTarget to promotion (385→387)
- 24.06.2026 · `7ed15a1` · Update Lorrrem channel link to invite URL
- 21.06.2026 · `61d0a16` · Move Yandex Промптхаб to education, refresh description
- 21.06.2026 · `81e245a` · Add shadcn/ui to UI-kits & libraries (384→385)
- 21.06.2026 · `f1fc50f` · Add Magnific AI Icon Generator card (383→384)
<!-- /auto:history -->

######## README репозитория

<!-- auto:readme -->
*Файл `README.md`, как есть:*

---
tags: [lkit, analytics, architecture, documentation]
created: 2026-06-16
---

######### Lkit — Аналитика проекта

> Живой документ. Отражает состояние проекта по состоянию на **16 июня 2026**.

---

########## 🧭 Что такое Lkit

**Lkit** — персональный каталог дизайн-инструментов и ресурсов для команды Lorrrem. Статический сайт с тёмной темой, где собраны инструменты по UX/UI-дизайну, ИИ, продвижению, обучению — с поиском, фильтрами и подкатегориями.

Второй ключевой раздел — **IT-словарь**: 659 русскоязычных IT-терминов и сленга с развёрнутыми живыми определениями, поиском, буквенной навигацией и шаринговыми ссылками на каждый термин.

**Аудитория:** команда Lorrrem, дизайнеры, разработчики.

---

########## 🏗 Архитектура

########### Тип приложения

Полностью статический сайт — **HTML + CSS + Vanilla JS**, без фреймворков и бандлеров. Работает без сервера: открывается прямо из файловой системы или с любого файлового хостинга.

########### Единственная страница

```
site/index.html   ← SPA-like, всё управление через JS
```

Вся навигация (рубрики, поиск, словарь, фильтры) работает через манипуляцию DOM без перезагрузки страницы. URL-якоря (`#dict-{id}`) используются для шаринга терминов.

########### Слои данных

```
window.CATALOG_DATA    ← 383 карточки инструментов  (site/catalog-data.js, 4981 строк)
window.DICTIONARY_DATA ← 659 IT-терминов            (site/dictionary-data.js, 4346 строк)
```

Оба файла — статические JS-переменные, генерируются локальными скриптами и коммитятся в репо.

########### Раскладка интерфейса

```
.app-layout  (CSS Grid: 280px sidebar + fluid content)
├── .sidebar
│   ├── .sidebar-brand  (логотип Lkit)
│   └── .rubric-nav     (кнопки рубрик + IT-словарь)
└── .main
    ├── .content-topbar
    │   ├── .control-search     (единый input для каталога и словаря)
    │   └── .subcategory-tabs   (подрубрики / буквы алфавита в словаре)
    ├── .catalog-grid  (hidden в режиме словаря)
    └── .dict-view     (hidden в режиме каталога)
```

---

########## 📁 Структура проекта

```
Lkit/
├── site/                      ← исходники сайта (деплоятся на хостинг)
│   ├── index.html             ← разметка, шрифты, скрипты
│   ├── styles.css             ← 735 строк, тёмная тема, CSS Variables
│   ├── app.js                 ← 749 строк, вся логика каталога и словаря
│   ├── catalog-data.js        ← window.CATALOG_DATA (383 карточки)
│   ├── dictionary-data.js     ← window.DICTIONARY_DATA (659 терминов)
│   ├── ui-kit.html            ← дизайн-система проекта (ветка UI-kit)
│   └── screenshots/           ← локальные скриншоты ресурсов (~130 PNG)
│
├── scripts/                   ← инструменты работы со словарём
│   ├── build_dictionary.mjs   ← парсит output/dictionary_raw.txt → dictionary-data.js
│   ├── expand_dictionary.mjs  ← расширяет определения через OpenAI API (батч, 469 терминов за раз)
│   ├── factcheck_claude.mjs   ← факт-чек через Claude: удаляет ложные термины
│   ├── apply_factcheck_fixes.mjs ← применяет патчи от факт-чека
│   ├── analyze_report.mjs     ← анализ отчёта факт-чека
│   ├── assign_emoji.mjs       ← назначение эмодзи карточкам каталога
│   ├── check_links.mjs        ← проверка живости ссылок в каталоге
│   ├── delete_dead.mjs        ← удаление мёртвых ссылок
│   ├── patch_catalog.mjs      ← точечные правки catalog-data.js
│   └── parser/                ← инструмент автопарсинга новых терминов
│       ├── parse_terms.mjs    ← основной парсер (Wiktionary → LLM → словарь)
│       ├── add_terms.mjs      ← ручной добор терминов через LLM
│       ├── llm.mjs            ← LLM-модуль (Claude приоритет, fallback OpenAI)
│       ├── sources.config.mjs ← конфиг источников парсера (19 категорий Викисловаря)
│       └── manual_terms.mjs   ← список терминов для ручного добора
│
├── Memory/                    ← база знаний проекта
│   ├── knowledge-base.md      ← старая база знаний (2026-06-14)
│   └── lkit-analytics.md      ← этот документ
│
├── .github/workflows/
│   └── deploy-ftp.yml         ← CI/CD: авто-деплой на lkit.lorrrem.ru при пуше в main
│
├── CLAUDE.md                  ← правила работы для всех Claude-сессий
├── package.json               ← npm-скрипты для словаря
└── .gitignore                 ← output/ в gitignore
```

---

########## ✨ Функциональность

########### Каталог инструментов

| Параметр | Значение |
|---|---|
| Всего карточек | 383 |
| Рубрики | Инструменты (121), ИИ (92), Контент и обучение (91), Ресурсы (79), Продвижение (6) |
| Подрубрики | 35 штук |

**Поиск:** многоуровневая система скоринга с intent-detection. Поиск понимает:
- Точные совпадения токенов → +10 очков
- Частичные совпадения → +6
- Совпадение в сыром тексте → +3
- Буст по intent-группам (иконки, ИИ, шрифты, цвет, видео, аудио и др.) → +8–12

**Нормализация:** `ё → е`, удаление спецсимволов, стемминг русских окончаний.

**Навигация:**
- Боковое меню рубрик (sticky sidebar)
- Горизонтальные таблетки подрубрик
- Переключение между рубриками сбрасывает поиск и подрубрику

**Карточки:** emoji-бейдж (автовыбор по теме или из данных), заголовок, описание, ссылка `target="_blank"`.

**Адаптив:**
- Desktop: 280px sidebar + fluid grid
- Tablet: burger-меню в хедере + dropdown
- Mobile: нижний лист навигации (bottom sheet)

########### IT-словарь

| Параметр | Значение |
|---|---|
| Всего терминов | 659 |
| Буквы | А–Я + латинские (C, O) |
| Источники | Викисловарь (19 категорий), Ручное добавление, OpenAI-расширение |

**Возможности:**
- Поиск по названию и определению
- Буквенная навигация (вкладки с каунтером)
- Кнопка ⎘ при наведении — копирует прямую ссылку `#dict-{id}`
- Открытие по URL с якорем: автопереключение в режим словаря + скролл + подсветка термина
- Определения: 2–3 предложения в живом разговорном стиле

---

########## 🔄 Пайплайн данных

########### Каталог

```
Ручная база данных (ранее Obsidian/Notion)
→ catalog-data.js (window.CATALOG_DATA)   ← редактируется вручную через patch_catalog.mjs
→ site/ (деплой)
```

########### Словарь

```
Источники:
  Викисловарь API (19 категорий) ──┐
  output/dictionary_raw.txt       ──┤→ parse_terms.mjs / build_dictionary.mjs
  manual_terms.mjs                ──┘
          ↓
  LLM (Claude Opus 4.8 / GPT-4o-mini)
  переписывает определения в разговорный стиль
  с few-shot промптом (12 примеров)
          ↓
  site/dictionary-data.js (window.DICTIONARY_DATA)
          ↓
  factcheck_claude.mjs  ← факт-чек: удаление ложных терминов
          ↓
  Деплой
```

**Дедупликация:** нормализация `ё→е`, `э→е`, удаление скобочных частей, нижний регистр. Термины-дубликаты по нормализованному ключу пропускаются.

---

########## 🤖 LLM-интеграции

########### Claude (Anthropic)

- **Модель:** `claude-opus-4-8` (по умолчанию, переопределяется `LLM_MODEL`)
- **Использование:** переписывание определений словаря, факт-чек терминов
- **Промпт-кэширование:** системный блок с few-shot примерами помечен `cache_control: ephemeral` → кэшируется, экономит ~90% токенов при батчевой обработке
- **SDK:** `@anthropic-ai/sdk ^0.104.1`
- **Ключ:** `ANTHROPIC_API_KEY` (env, не хранится в репо)

########### OpenAI

- **Модель:** `gpt-4o-mini` (по умолчанию)
- **Использование:** fallback если нет Anthropic ключа; первичное расширение 469 определений (исторически)
- **Ключ:** `OPENAI_API_KEY` (env; ключи, переданные в чате, нужно отозвать)

**Приоритет:** Claude > OpenAI. Если нет ни одного ключа — режим `--no-llm`.

---

########## ☁️ Деплой и инфраструктура

########### Продакшн: lkit.lorrrem.ru

```yaml
Триггер: push в main, изменения в site/** или workflow
Экшн:   SamKirkland/FTP-Deploy-Action@v4.3.5
Протокол: FTPS (TLS)
Секреты: FTP_SERVER, FTP_USERNAME, FTP_PASSWORD, FTP_PORT
Что деплоится: site/index.html, styles.css, app.js, catalog-data.js, dictionary-data.js
Что пропускается: site/screenshots/ (слишком тяжело)
```

Деплой автоматический при каждом пуше в `main` с изменениями в `site/`.

########### Тест: gh-pages (GitHub Pages)

```
URL: https://lorrrem-zlnkh.github.io/lkit/
Ветка: gh-pages (root)
Тип: Legacy (без Jekyll)
Деплой: вручную — копируем site/* в корень gh-pages
```

**Важно:** `gh-pages` = тестовая среда. Не переименовывать (ограничение GitHub Pages).

########### Аналитика

- **Яндекс.Метрика** — счётчик `109847531` встроен в `index.html`

---

########## 🔀 Git-стратегия

########### Ветки

| Ветка | Назначение |
|---|---|
| `main` | Стабильная версия, авто-деплой на `lkit.lorrrem.ru` |
| `gh-pages` | Тестовая среда (GitHub Pages), файлы в корне |
| `feature/dictionary` | Изменения словаря |
| `feature/catalog` | Изменения каталога |
| `UI-kit` | Дизайн-система проекта (`site/ui-kit.html`) |

########### Workflow

```
1. Изменения → коммит в feature-ветке
2. Деплой на gh-pages (тест)
3. Тестирование
4. Merge в main → авто-деплой на продакшн
```

**Правило:** никогда не мёрджить в `main` без прохождения теста на `gh-pages`.

########### Auto-push hook

`.git/hooks/post-commit` автоматически пушит текущую ветку на origin после каждого коммита.

########### Проверка перед коммитом

```bash
git log --oneline -10   # что было в других чатах
git status              # что в индексе
cat package.json        # мог измениться в соседнем чате
```

---

########## 📦 Зависимости

```json
{
  "@anthropic-ai/sdk": "^0.104.1",
  "cheerio": "^1.2.0"
}
```

| Пакет | Зачем |
|---|---|
| `@anthropic-ai/sdk` | Claude API для LLM-переписывания определений |
| `cheerio` | HTML-парсинг страниц Викисловаря/Википедии |

**Node.js:** ESM (`"type": "module"`), все скрипты `.mjs`.

---

########## 🎨 Дизайн-система

########### CSS Variables (тёмная тема)

```css
--bg: #0b0d10          /* фон страницы */
--bg-soft: #12161b
--panel: #101419
--card: #171d25        /* фон карточки */
--card-hover: #1c2430
--text: #f3f5f7
--muted: #8e9aa8       /* вторичный текст */
--accent: #7dd3fc      /* голубой акцент */
--accent-soft: rgba(125, 211, 252, 0.12)
--line: rgba(255,255,255,0.08)   /* разделители */
--radius-xl: 28px
--radius-lg: 22px
--radius-md: 18px
```

########### Шрифты

- **Manrope** (400, 500, 700, 800) — основной текст
- **IBM Plex Mono** (400, 500) — счётчики, метки, кнопки

########### Брейкпоинты

- `> 1100px` — desktop (sidebar + grid)
- `≤ 1100px` — tablet (burger + dropdown)
- `≤ 720px` — mobile (bottom sheet)

---

########## 📊 npm-скрипты

| Скрипт | Команда | Что делает |
|---|---|---|
| `dict:build` | `node scripts/build_dictionary.mjs` | Парсит `output/dictionary_raw.txt` → `dictionary-data.js` |
| `dict:expand` | `node scripts/expand_dictionary.mjs` | Расширяет определения через OpenAI API |
| `dict:parse` | `node scripts/parser/parse_terms.mjs` | Парсит новые термины из Викисловаря через LLM |
| `dict:add` | `node scripts/parser/add_terms.mjs` | Ручной добор терминов из `manual_terms.mjs` |

---

########## 🗂 Источники словаря

########### Викисловарь (19 категорий)

- Компьютер, Программирование, Программное обеспечение
- Интернет, Сетевой жаргон, Компьютерные программы
- Компьютерные сети, Компьютерные игры, Криптография
- Шифрование, Языки программирования, Операционные системы
- Алгоритмы, Нейронные сети, Данные, Файлы
- Информационная безопасность, Кодирование, Носители

########### Стратегии парсинга

- `wiktionary-category` — список слов из категории → IT-значение из секции «Значение»
- `dl` — списки `<dt>/<dd>` из Wikipedia-глоссариев
- `table` — таблицы (первый столбец — термин, второй — определение)
- `list-dash` — пункты списков вида `Термин — описание`

########### Фильтрация сырых пар

```js
maxTermLen: 45      // слишком длинное — заголовок, не термин
minTermLen: 2
maxTermWords: 4     // >4 слов — обычно заголовок раздела
minDefLen: 25       // слишком короткое определение пропускается
```

---

########## 🛡 Безопасность

- **API-ключи** никогда не хранятся в репо — только через env
- **OpenAI ключ**, переданный в чате, был скомпрометирован → нужно отозвать и перевыпустить
- **FTP-данные** только в GitHub Secrets
- Репозиторий **публичный** (требование для бесплатного GitHub Pages)

---

########## 📈 История развития (по коммитам)

| Этап | Что сделано |
|---|---|
| Initial | Базовый каталог, экспорт данных |
| +IT-словарь | 469 терминов, поиск, буквенная навигация, share-ссылки |
| +LLM расширение | GPT-4o-mini расширил все определения до 2–3 предложений |
| +Парсер | Автопополнение из Викисловаря через Claude, дедуп, few-shot |
| +Факт-чек | Claude проверил 605 терминов: удалены ложные, исправлены этимологии |
| +Ручной добор | Инструмент manual_terms + 28 кураторских терминов |
| +659 терминов | Категории ИБ, ML/PL/OS, ещё 2 батча |
| +Мобайл | Burger-меню, bottom sheet, tablet layout |
| +FTP деплой | GitHub Actions → lkit.lorrrem.ru (FTPS) |
| +Метрика | Яндекс.Метрика 109847531 |
| Чистка | Удалены: skills автоматизации, Playwright, чат-логи, старые скрипты |
| +UI Kit | Дизайн-система: токены, типографика, компоненты, состояния — `site/ui-kit.html` |

---

########## 🎨 UI Kit

Живая дизайн-система проекта — все компоненты, токены и состояния в одном месте.

**Файл:** `site/ui-kit.html` · **Ветка:** `UI-kit`
**URL (gh-pages):** https://lorrrem-zlnkh.github.io/lkit/ui-kit.html

########### Содержание

| # | Секция | Что внутри |
|---|---|---|
| 01 | Цвета / CSS Tokens | Все переменные со свотчами и hex-значениями |
| 02 | Типографика | Вся иерархия от H1 до копирайта (Manrope + IBM Plex Mono) |
| 03 | Радиусы и тени | Все значения border-radius + box-shadow |
| 04 | Рубрики / Sidebar nav | default / hover / active / dict-active |
| 05 | Подкатегории / Subtab | default / hover / active + буквенная навигация словаря |
| 06 | Поиск | Пустое и заполненное состояние |
| 07 | Карточки каталога | С emoji / в hover / без meta / с обложкой / empty state |
| 08 | Emoji badge | emoji-badge 52×52, rubric-icon 34×34 |
| 09 | IT-словарь | Термины: default / hover / share-hover / copied / highlight |
| 10 | Мобильная навигация | Topbar, burger (закрыт/открыт), bottom sheet, tablet dropdown |
| 11 | Sidebar полный | Десктопный сайдбар целиком |
| 12 | Фоны страницы | Каталог vs Словарь режим |

---

########## 🔮 Что планируется

- Пополнение словаря (парсер запускается по мере находки новых источников)
- Улучшение каталога: новые карточки, актуализация описаний
- Возможно: поиск по каталогу + словарю одновременно
<!-- /auto:readme -->
<!-- /auto:readme -->
<!-- /auto:readme -->
<!-- /auto:readme -->
<!-- /auto:readme -->
<!-- /auto:readme -->
<!-- /auto:readme -->
<!-- /auto:readme -->
<!-- /auto:readme -->
<!-- /auto:readme -->
<!-- /auto:readme -->
<!-- /auto:readme -->
<!-- /auto:readme -->
<!-- /auto:readme -->
<!-- /auto:readme -->
<!-- /auto:readme -->
<!-- /auto:readme -->
<!-- /auto:readme -->
