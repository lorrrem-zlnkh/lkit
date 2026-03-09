#!/usr/bin/env python3

from __future__ import annotations

import argparse
import csv
import json
import re
from pathlib import Path


LINK_RE = re.compile(r"\[([^\]]+)\]\((https?://[^)\s]+)\)")
ITEM_PREFIX_RE = re.compile(r"^\s*(?:\d+[.)]?|[-*])\s*")
EMOJI_PREFIX_RE = re.compile(r"^[^\wА-Яа-яЁё]+")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Convert Obsidian category notes into Framer CMS catalog items."
    )
    parser.add_argument("--vault-dir", required=True, help="Path to the Obsidian vault folder.")
    parser.add_argument("--output-dir", required=True, help="Directory for generated exports.")
    parser.add_argument(
        "--format",
        choices=("csv", "json", "both"),
        default="both",
        help="Output format.",
    )
    return parser.parse_args()


def slugify(value: str) -> str:
    value = value.lower().replace("ё", "е")
    value = re.sub(r"[^a-z0-9а-я]+", "-", value, flags=re.IGNORECASE)
    return value.strip("-")


def clean_category_name(path: Path) -> str:
    name = path.stem
    name = EMOJI_PREFIX_RE.sub("", name).strip()
    return re.sub(r"\s+", " ", name)


def clean_title(value: str) -> str:
    value = value.strip()
    value = re.sub(r"^\*\*|\*\*$", "", value)
    value = re.sub(r"^[0-9]+\s*[«\"]?", "", value).strip()
    value = re.sub(r"[«»\"]", "", value)
    value = re.sub(r"\s+", " ", value)
    return value.strip(" .-")


def extract_leading_title(line: str, fallback: str) -> str:
    left = line.split("—", 1)[0]
    left = ITEM_PREFIX_RE.sub("", left)
    left = re.sub(r"\[([^\]]+)\]\((https?://[^)\s]+)\)", r"\1", left)
    left = clean_title(left)
    return left or fallback


def first_link_per_line(line: str) -> tuple[str, str] | None:
    match = LINK_RE.search(line)
    if not match:
        return None
    return match.group(1).strip(), match.group(2).strip()


def parse_note(path: Path) -> list[dict[str, object]]:
    category = clean_category_name(path)
    lines = path.read_text(encoding="utf-8").splitlines()
    items: list[dict[str, object]] = []
    seen_links: set[str] = set()

    for index, raw_line in enumerate(lines, start=1):
        line = raw_line.strip()
        if not line or line.startswith("---"):
            continue
        link = first_link_per_line(line)
        if not link:
            continue

        fallback_title, url = link
        if "t.me/lorrrem" in url:
            continue
        if url in seen_links:
            continue
        seen_links.add(url)

        title = extract_leading_title(line, fallback_title)
        items.append(
            {
                "Title": title,
                "Slug": slugify(title),
                "Featured": "No",
                "Category": category,
                "Product Image": "",
                "Link": url,
                "source_note": str(path),
                "source_line": index,
            }
        )

    return items


def collect_items(vault_dir: Path) -> list[dict[str, object]]:
    items: list[dict[str, object]] = []
    for path in sorted(vault_dir.rglob("*.md")):
        items.extend(parse_note(path))
    return items


def dedupe_records(records: list[dict[str, object]]) -> list[dict[str, object]]:
    deduped: list[dict[str, object]] = []
    seen: set[tuple[str, str]] = set()
    for record in records:
        key = (str(record["Title"]).lower(), str(record["Link"]).lower())
        if key in seen:
            continue
        seen.add(key)
        deduped.append(record)
    return deduped


def write_csv(records: list[dict[str, object]], output_path: Path) -> None:
    fieldnames = [
        "Title",
        "Slug",
        "Featured",
        "Category",
        "Product Image",
        "Link",
        "source_note",
        "source_line",
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
    vault_dir = Path(args.vault_dir).expanduser().resolve()
    output_dir = Path(args.output_dir).expanduser().resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    if not vault_dir.exists():
        raise SystemExit(f"Vault directory does not exist: {vault_dir}")

    records = dedupe_records(collect_items(vault_dir))
    if not records:
        raise SystemExit(f"No catalog items found in: {vault_dir}")

    if args.format in {"csv", "both"}:
        write_csv(records, output_dir / "framer_catalog_import.csv")
    if args.format in {"json", "both"}:
        write_json(records, output_dir / "framer_catalog_import.json")

    print(f"Processed {len(records)} catalog items into {output_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
