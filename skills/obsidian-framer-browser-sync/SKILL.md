---
name: obsidian-framer-browser-sync
description: Automate filling Framer CMS or catalog content from Obsidian exports through an authenticated browser session. Use when the user wants browser automation for a live Framer project, needs Playwright-based login state capture, or wants to push prepared Obsidian content into Framer through the UI.
---

# Obsidian -> Framer Browser Sync

Use this skill when the user explicitly wants browser automation against a live Framer project.

## Scope

This skill is for:

- saving an authenticated Framer browser session
- reading prepared Obsidian export data from JSON
- opening a Framer project or CMS collection
- creating or updating catalog items through the UI

This skill is not a guarantee that Framer selectors will stay stable. Treat the selectors file as part of the integration.

## Required inputs

- a Framer project URL
- an authenticated session saved with `scripts/capture_framer_session.mjs`
- content data in `JSON`
- a selectors config for the target collection UI

## Default workflow

1. Prepare content with the `obsidian-framer-import` skill or provide equivalent JSON.
2. Save login state:

```bash
npm install
node skills/obsidian-framer-browser-sync/scripts/capture_framer_session.mjs \
  --project-url "https://framer.com/projects/your-project"
```

The script opens a browser. The user logs into Framer manually once and confirms in the terminal. The session is saved to `.auth/framer-storage.json`.

If the user already has a browser running with remote debugging enabled, connect to it instead:

```bash
node skills/obsidian-framer-browser-sync/scripts/capture_framer_session.mjs \
  --project-url "https://framer.com/projects/your-project" \
  --cdp-url "http://127.0.0.1:9222"
```

3. Copy and adapt the selectors template:

`references/catalog-selectors.example.json`

4. Run the sync:

```bash
node skills/obsidian-framer-browser-sync/scripts/fill_framer_catalog.mjs \
  --project-url "https://framer.com/projects/your-project" \
  --data "/path/to/framer_import.json" \
  --selectors "/path/to/catalog-selectors.json"
```

Or use the already opened browser:

```bash
node skills/obsidian-framer-browser-sync/scripts/fill_framer_catalog.mjs \
  --project-url "https://framer.com/projects/your-project" \
  --data "/path/to/framer_import.json" \
  --selectors "/path/to/catalog-selectors.json" \
  --cdp-url "http://127.0.0.1:9222"
```

## Operating rules

- Start with one record in headed mode, not a bulk run.
- Confirm the collection field labels before large imports.
- If the UI diverges from config, stop and update selectors instead of hardcoding fragile fallbacks everywhere.
- Prefer accessible selectors by label, role, and text. Use raw CSS only when necessary.

## Data contract

The sync script expects a JSON array of objects. These keys are supported by default:

- `title`
- `slug`
- `description`
- `category`
- `tags`
- `cover_image`
- `published`
- `body`

Extra keys can be mapped through the selectors config.

## When to stop and ask

Stop if any of these are unclear:

- whether the target is a CMS collection or manual page cards
- which collection should receive the content
- whether existing items should be updated or only new ones created

If direct execution is blocked by missing dependencies or browser access, continue by preparing the config and data files first.
