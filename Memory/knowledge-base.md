# Lkit — База знаний проекта

Дата составления: 2026-06-14

---

## 1. Что такое Lkit

**Lkit** — локальный каталог дизайн-инструментов и ресурсов, созданный для команды или персонального использования. Это статический сайт на чистом HTML/CSS/JS с тёмной темой, рубрикатором, поиском и фильтрами по подкатегориям.

**Назначение:** собрать все полезные ресурсы по UX/UI-дизайну, ИИ-инструментам, продвижению и обучению в одном месте с быстрой навигацией.

**Технологический стек:**
- Frontend: HTML + CSS + Vanilla JS (без фреймворка)
- Шрифты: Manrope + IBM Plex Mono (Google Fonts)
- Данные: статический JS-файл `site/catalog-data.js` (генерируется скриптом)
- Источник данных: `output/resources_table_final.json`
- Сборка/автоматизация: Node.js ESM скрипты (`*.mjs`)
- Зависимость: Playwright (для browser automation)

---

## 2. Репозиторий и инфраструктура

| Параметр | Значение |
|---|---|
| GitHub | `git@github.com:lorrrem-zlnkh/lkit.git` |
| Рабочая папка (Mac) | `/Users/denis_zelenykh/Documents/Работа/Проекты Lorrrem/Lkit` |
| Бывшая папка (в старых чатах) | `/Users/denis_zelenykh/Documents/Работа/Сайт с ресурсами` |
| Ветка main | основной каталог с разделом Викли |
| Ветка no-weekly-section | каталог без раздела Викли (текущая рабочая) |
| Ветка gh-pages | публикация в GitHub Pages (содержимое `site/`) |
| GitHub Pages URL | `https://lorrrem-zlnkh.github.io/lkit/` |

**Настройка GitHub Pages:**
- Source: Deploy from a branch
- Branch: `gh-pages`, Folder: `/ (root)`

---

## 3. Структура файлов проекта

```
Lkit/
├── site/                         ← статический сайт
│   ├── index.html                ← единственная HTML-страница
│   ├── styles.css                ← стили (тёмная тема, Manrope)
│   ├── app.js                    ← вся логика: рубрикатор, поиск, фильтры, карточки
│   ├── catalog-data.js           ← генерируется, содержит window.CATALOG_DATA
│   └── screenshots/              ← локальные скриншоты сайтов (копируются при экспорте)
│
├── output/                       ← артефакты обработки данных
│   ├── resources_table_final.json       ← ГЛАВНЫЙ источник данных (389 записей)
│   ├── resources_table_final.csv
│   ├── resources_table_final.md
│   ├── resources_table_enriched.*       ← промежуточная таблица с описаниями
│   ├── resources_table_clean.*          ← очищенная от мёртвых ссылок
│   ├── resources_not_working.*          ← битые ресурсы
│   ├── resources_not_working_classified.* ← классифицированные битые ресурсы
│   ├── resources_dead_only.*            ← только мёртвые
│   ├── resources_live_unresolved.*      ← живые, но нераспределённые
│   ├── resources_table_top_categories.* ← топ категорий
│   ├── framer_catalog_import.*          ← подготовленные данные для Framer
│   ├── framer_catalog_pending*.json     ← очередь для импорта во Framer
│   ├── framer_import_success.ndjson     ← успешные импорты в Framer
│   ├── framer_import_errors.ndjson      ← ошибки импорта в Framer
│   ├── screenshot_success.ndjson        ← успешные скриншоты
│   ├── screenshot_errors.ndjson         ← ошибки скриншотов
│   ├── preview_upload_success.ndjson    ← загруженные превью во Framer
│   ├── preview_upload_errors.ndjson     ← ошибки загрузки превью
│   ├── resource_enrichment_success.ndjson
│   ├── resource_enrichment_failures.ndjson
│   ├── filled_from_bing.json            ← данные, дополненные из Bing
│   ├── weekly_cases.json                ← кейсы для раздела Викли
│   ├── imported_items_for_previews.json
│   ├── items_with_screenshots*.json     ← очереди скриншотов
│   ├── cms_scroll_chunks.json
│   └── test_preview_*.json              ← тесты превью (runway, vidnoz, recraft, etc.)
│
├── scripts/                      ← скрипты обработки данных
│   ├── export_catalog_site_data.mjs     ← ОСНОВНОЙ: JSON → site/catalog-data.js
│   ├── build_final_resources_table.mjs  ← сборка итоговой таблицы
│   ├── enrich_resources_table.mjs       ← обогащение описаниями
│   ├── clean_catalog_data.mjs           ← очистка описаний и emoji
│   ├── classify_failed_resources.mjs    ← классификация битых ресурсов
│   ├── fill_missing_from_bing.mjs       ← дополнение из Bing
│   ├── translate_descriptions_ru.mjs    ← перевод описаний на русский
│   └── add_promotion_resources.mjs      ← добавление ресурсов продвижения
│
├── skills/                       ← навыки для Claude Code
│   ├── obsidian-framer-browser-sync/    ← Playwright-автоматизация Framer через браузер
│   │   ├── SKILL.md
│   │   ├── agents/openai.yaml
│   │   ├── references/catalog-selectors.example.json
│   │   └── scripts/
│   │       ├── capture_framer_session.mjs   ← сохранить сессию браузера
│   │       ├── fill_framer_catalog.mjs      ← заполнить Framer CMS
│   │       ├── import_framer_catalog_from_json.mjs
│   │       ├── capture_catalog_screenshots.mjs  ← снять скриншоты
│   │       ├── upload_framer_preview_images.mjs ← загрузить превью во Framer
│   │       ├── label_catalog_screenshots.mjs
│   │       └── launch_edge_remote_debug.mjs
│   └── obsidian-framer-import/          ← конвертер Obsidian → CSV/JSON для Framer
│       ├── SKILL.md
│       ├── agents/openai.yaml
│       └── scripts/
│           ├── obsidian_to_framer.py
│           └── obsidian_catalog_to_framer.py
│
├── Memory/                       ← история чатов и база знаний
│   ├── knowledge-base.md         ← этот файл
│   ├── chat.md                   ← обзор основного чата (история проекта)
│   ├── chat-2026-06-13.md        ← чат от 2026-06-13 (emoji, GitHub, ветка без Викли)
│   └── chat-2026-06-13_15-02-10.md ← мини-чат (отступы, weekly приписка)
│
├── .auth/
│   └── framer-storage.json       ← сохранённая сессия Framer (Playwright)
├── package.json
└── README.md
```

---

## 4. Схема данных (resources_table_final.json)

Каждая запись содержит поля:

| Поле | Описание |
|---|---|
| `Resource` | Название инструмента/ресурса |
| `Rubric` | Рубрика (одна из 5 главных категорий) |
| `Subrubric` | Подрубрика |
| `Link` | URL ресурса |
| `Slug` | URL-slug для идентификации |
| `Description` | Краткое описание на русском языке |
| `AccessStatus` | Статус доступности |
| `Screenshot` | Путь к скриншоту (локальный или URL) |
| `ScreenshotSource` | `local` или `remote` |
| `InfoSource` | Источник описания |
| `Emoji` | Уникальный эмодзи Apple для карточки |

**Статусы доступа (`AccessStatus`):**
- `ok` — ресурс доступен
- `требует логин` — нужна авторизация
- `нужна новая публичная ссылка` — ссылка устарела
- `страница блокирует automation` — защита от ботов

---

## 5. Каталог: рубрики и количество записей

**Всего записей: 389**

### Рубрики (Rubric)

| Рубрика | Кол-во |
|---|---|
| Инструменты | 121 |
| ИИ | 92 |
| Контент и обучение | 91 |
| Ресурсы | 79 |
| Продвижение | 6 |

### Все подрубрики (Subrubric) по убыванию

| Подрубрика | Кол-во |
|---|---|
| Иконки | 39 |
| Изображения и графика | 37 |
| Шрифты и типографика | 31 |
| Медиа и блоги | 28 |
| Figma-плагины | 24 |
| Вдохновение и референсы | 23 |
| Промпты и библиотеки | 20 |
| Цвет и палитры | 15 |
| Продуктивность и организация | 14 |
| Медиа-инструменты | 13 |
| Редакторы и прототипирование | 12 |
| Видео и анимация | 11 |
| Текст и ассистенты | 11 |
| Исследования и аналитика | 10 |
| Фильмы и видео | 10 |
| Иллюстрации и стоки | 10 |
| Поиск и OSINT | 9 |
| Доступность | 6 |
| 3D и spatial | 6 |
| Аудио и голос | 6 |
| Текст и контент | 6 |
| Курсы и школы | 6 |
| UI-киты и библиотеки | 6 |
| Браузерные расширения | 5 |
| Подкасты | 5 |
| Конструкторы сайтов | 4 |
| SMM и соцсети | 4 |
| Мокапы и сцены | 4 |
| Утилиты | 3 |
| AR и spatial | 3 |
| UX и прототипирование | 3 |
| Книги и подборки | 2 |
| Чат-боты и automation | 1 |
| Покупка и аналитика площадок | 1 |
| Наружная реклама и кейсы | 1 |

---

## 6. Сайт: архитектура и UI

**Макет:** `site/index.html`

- Двухколоночный layout: `sidebar` (слева) + `content` (справа)
- `sidebar` содержит лого Lkit и вертикальный рубрикатор (`#rubric-nav`)
- `content` содержит:
  - topbar с глобальным поиском (`#search-input`) и вкладками подкатегорий (`#subcategory-tabs`)
  - сетку карточек (`#catalog-grid`)

**Карточки:**
- Шаблон: `<template id="card-template">`
- Элементы: обложка (`card-cover`), эмодзи-бейдж (`emoji-badge`), заголовок (`card-title`), мета (`card-meta`), описание (`card-description`)
- Клик по карточке открывает ссылку в новой вкладке

**Стили:**
- Тёмная тема
- Шрифты: Manrope + IBM Plex Mono
- Font stack emoji: включает `"Apple Color Emoji"` для корректного отображения
- Отступ карточки: `padding: 16px`

**Логика (`site/app.js`):**
- Рубрикатор строится динамически из `window.CATALOG_DATA`
- Поиск — глобальный по названию и описанию
- Табы подкатегорий — фильтр внутри выбранной рубрики
- Начальная рубрика при загрузке: **Инструменты**

---

## 7. npm скрипты

```json
{
  "framer:capture-session": "node skills/obsidian-framer-browser-sync/scripts/capture_framer_session.mjs",
  "framer:fill-catalog": "node skills/obsidian-framer-browser-sync/scripts/fill_framer_catalog.mjs",
  "catalog:build-data": "node scripts/export_catalog_site_data.mjs"
}
```

**Основная команда сборки данных:**
```bash
npm run catalog:build-data
```
Читает `output/resources_table_final.json` → генерирует `site/catalog-data.js` → копирует локальные скриншоты в `site/screenshots/`

---

## 8. Пайплайн обработки данных

Исторический порядок обработки данных каталога:

```
Obsidian vault
    ↓ obsidian-framer-import skill (Python)
framer_import.json / .csv
    ↓ browser automation (Playwright + Edge/CDP)
Framer CMS (онлайн)
    ↓ export_catalog_site_data.mjs
    ↓ build_final_resources_table.mjs
    ↓ enrich_resources_table.mjs (описания, OpenAI API)
    ↓ fill_missing_from_bing.mjs (Bing Search API)
    ↓ translate_descriptions_ru.mjs
    ↓ classify_failed_resources.mjs
    ↓ clean_catalog_data.mjs (очистка + emoji)
output/resources_table_final.json (389 записей)
    ↓ npm run catalog:build-data
site/catalog-data.js → сайт
```

---

## 9. Навыки (Skills)

### obsidian-framer-import
Конвертирует Obsidian-заметки в CSV/JSON для импорта в Framer CMS.

```bash
python3 skills/obsidian-framer-import/scripts/obsidian_to_framer.py \
  --notes-dir "/path/to/obsidian-export" \
  --output-dir "/path/to/output" \
  --format both
```

Входные данные: Obsidian-заметки с YAML frontmatter (title, slug, description, category, tags, published, cover_image).

### obsidian-framer-browser-sync
Playwright-автоматизация для заполнения Framer CMS через браузер.

Сессия сохраняется в `.auth/framer-storage.json`. Поддерживает CDP-подключение к уже открытому браузеру (`--cdp-url http://127.0.0.1:9222`).

Правило: всегда начинать с одной записи в headed-режиме, затем батч.

**Контракт данных для sync-скрипта:**
- title, slug, description, category, tags, cover_image, published, body

---

## 10. Ветки и их назначение

| Ветка | Содержимое |
|---|---|
| `main` | Полный проект с разделом Викли (weekly collector, навык `шерсти`) |
| `no-weekly-section` | Каталог без Викли — удалены: weekly-data.js, collect_weekly_cases.mjs, build_weekly_cases.mjs, export_weekly_site_data.mjs, GitHub Actions workflow, docs/weekly-automation.md, навык shersti |
| `gh-pages` | Статическая публикация (только содержимое `site/`) для GitHub Pages |

**Текущая ветка:** `no-weekly-section`

---

## 11. Раздел Викли (в ветке main)

Раздел Викли — лента еженедельных дизайн-кейсов с Dribbble и Behance.

**Источники:**
- Dribbble (20 материалов)
- Behance (20 материалов, с прямыми `gallery` URL, `og:image`, author, likes/views из `ld+json`)

**Структура карточки Викли:**
- обложка, заголовок, автор, категория, источник

**Фильтры Викли:** UX/UI, Брендинг

**Файл данных:** `output/weekly_cases.json` → `site/weekly-data.js`

**Сборка:** `scripts/collect_weekly_cases.mjs` (pipeline: browser/CDP + Playwright, OpenAI API для отбора, fallback-режим)

**Навык `шерсти`** (удалён из текущей ветки):
- `skills/shersti/SKILL.md`
- Запуск: слово `шерсти` → сбор Dribbble + Behance → пересборка `weekly_cases.json` → пересборка сайта
- Режимы: `шерсти dribbble`, `шерсти behance`, `шерсти all`

---

## 12. История ключевых изменений каталога

### Переименования
- `Usability Hub` → `Lyssna`

### Перемещения
- `Framer` → Инструменты → Конструкторы сайтов
- `Times Square Billboard` → Продвижение
- Раздел `Доступность` (отдельная рубрика) → Контент и обучение → Доступность

### Созданные подрубрики
- `Контент и обучение → Шрифты и типографика` — статьи и книги по шрифтам

### Удалённые рубрики
- `Ресурсы → Дизайн-системы` — полностью удалена со всеми карточками

### Удалённые карточки
Балабоба, spark.meta.com, Sora, Visper, Kling AI Video to Audio, Carbon Design System, Magenest, Ooobj, Social icons, Tonicons, Designdpace, Примеры автомобильных интерфейсов, Premast

---

## 13. Технические особенности и важные детали

- **Emoji:** каждая карточка имеет уникальный emoji Apple (`item.Emoji`). Всего 389 уникальных emoji. Font stack в CSS включает `"Apple Color Emoji"`.
- **Скриншоты:** при `ScreenshotSource === 'local'` файл копируется из абсолютного пути в `site/screenshots/` при запуске `npm run catalog:build-data`.
- **Описания:** все 389 описаний на русском языке, без универсальных шаблонов вроде «плагин или ресурс для Figma».
- **Поиск:** работает по всему каталогу глобально, не ограничен текущей рубрикой.
- **Публикация в Pages:** из-за отсутствия `gh` CLI и HTTPS-токена GitHub Pages нужно включить вручную в настройках репозитория.
- **Безопасность:** в ходе работ OpenAI API key передавался в открытом виде в чате — такой ключ следует отозвать и выпустить новый.

---

## 14. Запуск сайта локально

```bash
# Из корня проекта
npx serve . -l 8000
# Открыть: http://127.0.0.1:8000/site/index.html
```

Или через Python:
```bash
python3 -m http.server 8000
# Открыть: http://127.0.0.1:8000/site/
```

---

## 15. Ключевые команды

```bash
# Пересобрать данные сайта из JSON
npm run catalog:build-data

# Захватить сессию Framer (открывает браузер)
npm run framer:capture-session -- --project-url "https://framer.com/projects/..."

# Заполнить Framer CMS данными
npm run framer:fill-catalog -- \
  --project-url "https://framer.com/projects/..." \
  --data "/path/to/data.json" \
  --selectors "/path/to/selectors.json"

# Установить зависимости
npm install
```
