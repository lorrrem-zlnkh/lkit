# Weekly Automation

Автоматизация находится в `.github/workflows/weekly-content.yml`.

Она запускается каждую субботу в 10:00 по Москве, а также вручную через `workflow_dispatch` в GitHub Actions. Runner GitHub Actions устанавливает Node.js и Playwright, собирает weekly-кейсы из Dribbble и Behance, отправляет кандидатов в OpenAI API для отбора, обновляет `site/weekly-data.js`, коммитит файл и пушит его в `main`.

Чтобы это работало без вашего ПК:

1. Репозиторий должен быть опубликован на GitHub.
2. В GitHub нужно добавить secret `OPENAI_API_KEY`: `Settings -> Secrets and variables -> Actions -> New repository secret`.
3. Хостинг должен деплоить сайт из репозитория после push в `main`.
4. Если сайт лежит как статический проект, корнем публикации должен быть каталог `site`.
5. Если нужен другой OpenAI-модель, добавьте repository variable `OPENAI_MODEL`. По умолчанию используется `gpt-5`.

Workflow не использует локальный Chrome/CDP и не зависит от файлов на вашем компьютере. Он запускает Playwright Chromium прямо на GitHub Actions runner.
