#!/usr/bin/env python3

from __future__ import annotations

import argparse
import csv
import json
import re
from pathlib import Path


FRONTMATTER_RE = re.compile(r"\A---\n(.*?)\n---\n?", re.DOTALL)
HEADING_RE = re.compile(r"^#\s+(.+)$", re.MULTILINE)
LIST_ITEM_RE = re.compile(r"^-\s*(.+?)\s*$")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Convert Obsidian markdown notes into Framer-ready CSV or JSON."
    )
    parser.add_argument("--notes-dir", required=True, help="Directory with markdown notes.")
    parser.add_argument(
        "--output-dir",
        required=True,
        help="Directory where framer_import.csv/json will be written.",
    )
    parser.add_argument(
        "--format",
        choices=("csv", "json", "both"),
        default="both",
        help="Output format.",
    )
    return parser.parse_args()


def parse_frontmatter(text: str) -> tuple[dict[str, object], str]:
    match = FRONTMATTER_RE.match(text)
    if not match:
        return {}, text

    raw = match.group(1)
    body = text[match.end() :]
    data: dict[str, object] = {}
    current_key: str | None = None

    for raw_line in raw.splitlines():
        line = raw_line.rstrip()
        if not line.strip():
            continue

        if line.startswith("  - ") or line.startswith("    - "):
            if current_key is not None:
                existing = data.setdefault(current_key, [])
                if isinstance(existing, list):
                    existing.append(line.split("-", 1)[1].strip())
            continue

        if ":" not in line:
            continue

        key, value = line.split(":", 1)
        key = key.strip()
        value = value.strip()
        current_key = key

        if not value:
            data[key] = []
            continue

        lowered = value.lower()
        if lowered in {"true", "false"}:
            data[key] = lowered == "true"
        elif value.startswith("[") and value.endswith("]"):
            items = [item.strip().strip("\"'") for item in value[1:-1].split(",") if item.strip()]
            data[key] = items
        else:
            data[key] = value.strip("\"'")

    return data, body


def infer_title(body: str, path: Path) -> str:
    match = HEADING_RE.search(body)
    if match:
        return clean_inline_text(match.group(1))
    return path.stem.replace("-", " ").replace("_", " ").strip().title()


def clean_inline_text(value: str) -> str:
    value = re.sub(r"[*_`~\[\]()>#]", "", value)
    return re.sub(r"\s+", " ", value).strip()


def infer_description(body: str) -> str:
    paragraphs = []
    for chunk in body.split("\n\n"):
        line = chunk.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("![[") or line.startswith("[["):
            continue
        paragraphs.append(clean_inline_text(line))
    return paragraphs[0] if paragraphs else ""


def slugify(value: str) -> str:
    value = value.lower()
    value = re.sub(r"[^a-z0-9а-яё]+", "-", value, flags=re.IGNORECASE)
    return value.strip("-")


def normalize_tags(value: object) -> str:
    if isinstance(value, list):
        return ", ".join(str(item).strip() for item in value if str(item).strip())
    if isinstance(value, str):
        if value.startswith("#"):
            return value[1:]
        return value
    return ""


def markdown_body(body: str) -> str:
    lines = []
    for raw_line in body.splitlines():
        line = raw_line.rstrip()
        if line.startswith("![["):
            continue
        if line.startswith("[[") and line.endswith("]]"):
            continue
        lines.append(line)
    return "\n".join(lines).strip()


def note_to_record(path: Path) -> dict[str, object]:
    text = path.read_text(encoding="utf-8")
    frontmatter, body = parse_frontmatter(text)

    title = str(frontmatter.get("title") or infer_title(body, path))
    description = str(frontmatter.get("description") or infer_description(body))
    slug = str(frontmatter.get("slug") or slugify(title))
    category = str(frontmatter.get("category") or "")
    tags = normalize_tags(frontmatter.get("tags", ""))
    cover_image = str(frontmatter.get("cover_image") or frontmatter.get("image") or "")
    published = frontmatter.get("published", True)

    return {
        "title": title,
        "slug": slug,
        "description": description,
        "category": category,
        "tags": tags,
        "cover_image": cover_image,
        "published": str(bool(published)).lower(),
        "body": markdown_body(body),
        "source_path": str(path),
    }


def collect_notes(notes_dir: Path) -> list[dict[str, object]]:
    records = []
    for path in sorted(notes_dir.rglob("*.md")):
        records.append(note_to_record(path))
    return records


def write_csv(records: list[dict[str, object]], output_path: Path) -> None:
    fieldnames = [
        "title",
        "slug",
        "description",
        "category",
        "tags",
        "cover_image",
        "published",
        "body",
        "source_path",
    ]
    with output_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(records)


def write_json(records: list[dict[str, object]], output_path: Path) -> None:
    output_path.write_text(
        json.dumps(records, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def main() -> int:
    args = parse_args()
    notes_dir = Path(args.notes_dir).expanduser().resolve()
    output_dir = Path(args.output_dir).expanduser().resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    if not notes_dir.exists():
        raise SystemExit(f"Notes directory does not exist: {notes_dir}")

    records = collect_notes(notes_dir)
    if not records:
        raise SystemExit(f"No markdown files found in: {notes_dir}")

    if args.format in {"csv", "both"}:
        write_csv(records, output_dir / "framer_import.csv")
    if args.format in {"json", "both"}:
        write_json(records, output_dir / "framer_import.json")

    print(f"Processed {len(records)} notes into {output_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
