# Lkit — правила работы

## Ветки

- `main` — стабильная версия, деплой на продакшн-сервер
- `gh-pages` — тестовая среда (GitHub Pages, не переименовывать)
- `feature/dictionary` — изменения словаря
- `feature/catalog` — изменения каталога

## Обязательный порядок работы

1. **Перед коммитом** — проверить контекст соседних чатов:
   ```bash
   git log --oneline -10   # что было закоммичено в других сессиях
   git status              # что в индексе
   cat package.json        # мог измениться в соседнем чате
   ```
2. Внести изменения в код
3. Сделать коммит
4. Залить на `gh-pages` (тест) — скопировать `site/` в корень ветки
5. Провести тестирование
6. Если всё ок — смёрджить в `main`

**Никогда не заливать сразу в main без прохождения теста на gh-pages.**

## Деплой на gh-pages

```bash
git checkout gh-pages
git show main:site/app.js > app.js
git show main:site/styles.css > styles.css
git show main:site/index.html > index.html
git show main:site/dictionary-data.js > dictionary-data.js
git add .
git commit -m "Deploy: ..."
git checkout main
```

## Документация

`Memory/lkit-analytics.md` — главный аналитический документ проекта (архитектура, фичи, интеграции, деплой). После значимых изменений обновлять его и синхронизировать с `README.md`:

```bash
cp Memory/lkit-analytics.md README.md
cp Memory/lkit-analytics.md "/Users/denis_zelenykh/Library/Mobile Documents/iCloud~md~obsidian/Documents/Zelenykh/👾 Lorrrem/Проекты Lorrrem/Lkit/lkit-analytics.md"
git add Memory/lkit-analytics.md README.md
git commit -m "Docs: update project analytics"
```

## Структура проекта

- `site/` — исходники сайта (HTML, CSS, JS, данные)
- `scripts/` — утилиты для словаря (build, expand, parse, add)
- `Memory/` — база знаний проекта
- `output/` — временные файлы (в .gitignore)
