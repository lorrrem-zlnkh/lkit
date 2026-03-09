---
name: obsidian-framer-import
description: Prepare and map Obsidian markdown content for Framer website and Framer CMS import. Use when the user wants to turn an Obsidian vault into structured website content, generate CSV or JSON for Framer import, map notes to pages or CMS collections, or define a repeatable Obsidian-to-Framer workflow.
---

# Obsidian -> Framer Import

Use this skill when the task is content migration, not generic website coding.

## What this skill can do

- Convert Obsidian notes into `CSV` or `JSON` for Framer CMS import
- Map notes to site pages, sections, or CMS collections
- Normalize titles, slugs, descriptions, tags, and body content
- Prepare an import package that a user can upload into Framer

## What this skill cannot do by itself

- It does not create Framer authentication
- It does not guarantee browser control over a live Framer session
- It cannot push content directly into Framer unless the environment also has working Framer automation or API access

State these limits briefly when relevant. A skill is workflow guidance plus bundled tools, not account access.

## Default workflow

1. Find the Obsidian vault or export folder.
2. Inspect a few notes to infer the real content model:
   - standalone pages
   - blog or resources collection
   - landing-page sections
3. Decide the target schema for Framer import.
4. Run `scripts/obsidian_to_framer.py` to produce `CSV`, `JSON`, or both.
5. Review output for:
   - missing titles
   - broken slugs
   - empty descriptions
   - markdown that should become shorter marketing copy
6. If the user has a live Framer project, provide the final mapping:
   - source note
   - target page or collection
   - target field names

## Input assumptions

The script works best when notes use YAML frontmatter like:

```yaml
---
title: Example page
slug: example-page
description: Short summary
category: Guides
tags:
  - obsidian
  - framer
published: true
cover_image: https://example.com/image.jpg
---
```

If frontmatter is absent, infer:

- `title` from first `# Heading` or filename
- `slug` from title
- `description` from the first non-heading paragraph

## Script usage

Use the bundled script:

```bash
python3 scripts/obsidian_to_framer.py \
  --notes-dir "/path/to/obsidian-export" \
  --output-dir "/path/to/output" \
  --format both
```

Outputs:

- `framer_import.csv`
- `framer_import.json`

## Adapting to a real Framer site

Before running a large import, confirm the site model:

- Are notes becoming `pages` or `CMS items`?
- Which fields exist in Framer now?
- Should markdown body stay long-form, or be rewritten into shorter section copy?

If the user wants a direct Framer fill workflow, only promise it when one of these is available:

- Framer API access and a documented endpoint
- Browser automation with an authenticated session
- A Framer import surface that accepts generated files

Without one of those, use this skill to prepare the import package and content map, then hand off the final upload step to the user.
