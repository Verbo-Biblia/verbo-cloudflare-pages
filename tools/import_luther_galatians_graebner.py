#!/usr/bin/env python3
"""Import Graebner's abridged English Luther Galatians from Gutenberg #1549."""

from __future__ import annotations

import argparse
import hashlib
import html as html_std
import json
import re
import urllib.request
from pathlib import Path

from lxml import etree, html


ROOT = Path(__file__).resolve().parents[1]
MODULE_ID = "luther-galatians-graebner"
OUTPUT = ROOT / "biblia/modules/commentaries" / MODULE_ID
SOURCE_URL = "https://www.gutenberg.org/cache/epub/1549/pg1549-images.html"
SOURCE_SHA256 = "49d6b0fe3e3b1bcf79edef1371b80cd3c2d3d24cf5f2503272b950a2e7ba73e7"
SOURCE_BYTES = 565_453
MAX_ENTRY_CHARS = 18_000
VERSE_MARKER = re.compile(r"\bVERSES?\s+(\d+(?:\s*(?:,|and)\s*\d+)*)", re.IGNORECASE)


def fetch_source(cache: Path) -> Path:
    cache.mkdir(parents=True, exist_ok=True)
    target = cache / "pg1549-images.html"
    if not target.exists():
        request = urllib.request.Request(SOURCE_URL, headers={"User-Agent": "Verbo-Luther-import/1.0"})
        with urllib.request.urlopen(request) as response:
            target.write_bytes(response.read())
    raw = target.read_bytes()
    digest = hashlib.sha256(raw).hexdigest()
    if len(raw) != SOURCE_BYTES or digest != SOURCE_SHA256:
        raise SystemExit(f"Fuente Gutenberg inesperada: bytes={len(raw)}, sha256={digest}")
    return target


def text_value(node: etree._Element) -> str:
    return " ".join(node.text_content().split())


def inline(node: etree._Element) -> str:
    parts: list[str] = []
    if node.text:
        parts.append(html_std.escape(node.text))
    for child in node:
        tag = child.tag.lower() if isinstance(child.tag, str) else ""
        classes = set((child.get("class") or "").split())
        if "pageno" in classes or tag in {"script", "style", "img", "hr"}:
            value = ""
        elif tag in {"em", "i", "cite"}:
            value = f"<em>{inline(child)}</em>"
        elif tag in {"strong", "b"}:
            value = f"<strong>{inline(child)}</strong>"
        elif tag == "br":
            value = " "
        elif tag == "a":
            value = html_std.escape(text_value(child))
        else:
            value = inline(child)
        parts.append(value)
        if child.tail:
            parts.append(html_std.escape(child.tail))
    value = re.sub(r"\s+", " ", "".join(parts))
    value = re.sub(r"\s+([,.;:?!])", r"\1", value)
    return value.strip()


def block(node: etree._Element, *, editorial_heading: bool = False) -> str:
    tag = node.tag.lower() if isinstance(node.tag, str) else ""
    classes = set((node.get("class") or "").split())
    if "pageno" in classes or tag in {"script", "style", "img", "hr"}:
        return ""
    if tag in {"p", "div", "h2", "h3"}:
        value = inline(node)
        if not value:
            return ""
        if editorial_heading or tag in {"h2", "h3"}:
            return f"<p><strong>{value}</strong></p>"
        return f"<p>{value}</p>"
    if tag == "blockquote":
        value = inline(node)
        return f"<blockquote>{value}</blockquote>" if value else ""
    if tag in {"ul", "ol"}:
        items = "".join(block(child) for child in node if child.tag.lower() == "li")
        return f"<{tag}>{items}</{tag}>" if items else ""
    if tag == "li":
        value = inline(node)
        return f"<li>{value}</li>" if value else ""
    return "".join(block(child) for child in node if isinstance(child.tag, str))


def verse_range(label: str) -> tuple[int, int] | None:
    if not re.match(r"^VERSES?\b", label, re.IGNORECASE):
        return None
    numbers: list[int] = []
    for match in VERSE_MARKER.findall(label):
        numbers.extend(int(value) for value in re.findall(r"\d+", match))
    return (min(numbers), max(numbers)) if numbers else None


def split_html(content: str, limit: int = MAX_ENTRY_CHARS) -> list[str]:
    if len(content) <= limit:
        return [content]
    fragments = re.findall(r"<(?:p|blockquote|ul|ol)>.*?</(?:p|blockquote|ul|ol)>", content, re.DOTALL)
    if "".join(fragments) != content:
        raise SystemExit("No se pudo segmentar contenido sin romper el HTML")
    chunks: list[str] = []
    current = ""
    for fragment in fragments:
        if current and len(current) + len(fragment) > limit:
            chunks.append(current)
            current = ""
        current += fragment
    if current:
        chunks.append(current)
    return chunks


def heading_index(nodes: list[etree._Element], title: str) -> int:
    for index, node in enumerate(nodes):
        if node.tag.lower() == "h2" and text_value(node) == title:
            return index
        if node.xpath(".//h2[normalize-space(.)=$title]", title=title):
            return index
    raise SystemExit(f"No se encontró encabezado {title!r}")


def introduction_entries(nodes: list[etree._Element], start: int, end: int) -> list[dict]:
    sections: list[tuple[str, list[etree._Element]]] = []
    title = "Preface"
    current: list[etree._Element] = []
    for node in nodes[start:end]:
        if node.tag.lower() == "h2":
            if current:
                sections.append((title, current))
            raw_title = text_value(node)
            title = {
                "PREFACE": "Preface",
                "FROM LUTHER'S INTRODUCTION, 1538": "From Luther's Introduction, 1538",
            }.get(raw_title, raw_title)
            current = []
        else:
            current.append(node)
    if current:
        sections.append((title, current))

    entries: list[dict] = []
    sequence = 0
    for title, section_nodes in sections:
        content = "".join(block(node) for node in section_nodes)
        if not content:
            continue
        chunks = split_html(content)
        for part, chunk in enumerate(chunks, 1):
            sequence += 1
            entries.append({
                "id": f"luther-gal-intro-{sequence}",
                "title": title if len(chunks) == 1 else f"{title} — Part {part}",
                "author": "Martin Luther; abridged English translation by Theodore Graebner",
                "reference": {"book": "GAL", "chapterStart": 0, "verseStart": 0, "chapterEnd": 0, "verseEnd": 0},
                "content": chunk,
            })
    return entries


def chapter_entries(nodes: list[etree._Element], chapter: int, start: int, end: int) -> list[dict]:
    groups: list[dict] = []
    current: dict | None = None
    prologue: list[etree._Element] = []
    for node in nodes[start:end]:
        label = text_value(node)
        ref = verse_range(label) if node.tag.lower() == "p" and "pre" in (node.get("class") or "").split() else None
        if ref:
            current = {"start": ref[0], "end": ref[1], "nodes": prologue}
            prologue = []
            groups.append(current)
            # The `pre` block is a separable base-text heading; retain its
            # reference through metadata/title, not the quoted Bible text.
            continue
        if current is None:
            prologue.append(node)
            continue
        is_editorial_heading = (
            node.tag.lower() == "p"
            and "pre" in (node.get("class") or "").split()
            and len(label) <= 100
            and not label.startswith(('"', '“', "'"))
        )
        current["nodes"].append((node, is_editorial_heading))

    if prologue and groups:
        groups[0]["nodes"] = prologue + groups[0]["nodes"]
    elif prologue:
        raise SystemExit(f"GAL {chapter}: contenido sin encabezado bíblico")

    entries: list[dict] = []
    per_reference: dict[tuple[int, int], int] = {}
    for group in groups:
        rendered = []
        for item in group["nodes"]:
            if isinstance(item, tuple):
                rendered.append(block(item[0], editorial_heading=item[1]))
            else:
                rendered.append(block(item))
        content = "".join(rendered)
        if not content:
            raise SystemExit(f"GAL {chapter}:{group['start']}–{group['end']}: entrada vacía")
        key = (group["start"], group["end"])
        per_reference[key] = per_reference.get(key, 0) + 1
        occurrence = per_reference[key]
        label = str(group["start"]) if group["start"] == group["end"] else f"{group['start']}–{group['end']}"
        chunks = split_html(content)
        for part, chunk in enumerate(chunks, 1):
            title = f"Galatians {chapter}:{label}"
            if len(chunks) > 1:
                title += f" — Part {part}"
            entries.append({
                "id": f"luther-gal-{chapter}-{group['start']}-{group['end']}-{occurrence}-{part}",
                "title": title,
                "author": "Martin Luther; abridged English translation by Theodore Graebner",
                "reference": {
                    "book": "GAL", "chapterStart": chapter, "verseStart": group["start"],
                    "chapterEnd": chapter, "verseEnd": group["end"],
                },
                "content": chunk,
            })
    return entries


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--cache", type=Path, default=Path("/tmp/verbo-luther-gutenberg"))
    parser.add_argument("--output", type=Path, default=OUTPUT)
    args = parser.parse_args()

    source = fetch_source(args.cache)
    document = html.parse(str(source)).getroot()
    body = document.find("body")
    if body is None:
        raise SystemExit("La fuente no contiene body")
    nodes = [node for node in body if isinstance(node.tag, str)]
    preface = heading_index(nodes, "PREFACE")
    chapter_positions = {chapter: heading_index(nodes, f"CHAPTER {chapter}") for chapter in range(1, 7)}
    license_position = heading_index(nodes, "THE FULL PROJECT GUTENBERG™ LICENSE")

    entries = introduction_entries(nodes, preface, chapter_positions[1])
    for chapter in range(1, 7):
        end = chapter_positions.get(chapter + 1, license_position)
        entries.extend(chapter_entries(nodes, chapter, chapter_positions[chapter] + 1, end))

    book_source = json.loads((ROOT / "biblia/modules/bibles/asv-1901/books/GAL.json").read_text(encoding="utf-8"))
    expected = {(int(chapter), int(verse)) for chapter, verses in book_source["chapters"].items() for verse in verses}
    covered: set[tuple[int, int]] = set()
    for entry in entries:
        ref = entry["reference"]
        if ref["chapterStart"]:
            covered.update((ref["chapterStart"], verse) for verse in range(ref["verseStart"], ref["verseEnd"] + 1))
    if covered != expected:
        raise SystemExit(f"Cobertura inválida: faltan={sorted(expected-covered)}, sobran={sorted(covered-expected)}")

    books_dir = args.output / "books"
    books_dir.mkdir(parents=True, exist_ok=True)
    book_path = books_dir / "GAL.json"
    book_path.write_text(json.dumps({"book": "GAL", "entries": entries}, ensure_ascii=False) + "\n", encoding="utf-8")
    manifest = {
        "schemaVersion": 2,
        "id": MODULE_ID,
        "type": "commentary",
        "name": "Martin Luther — Commentary on Galatians (Graebner Abridged)",
        "abbreviation": "Luther (Galatians)",
        "language": "en",
        "author": "Martin Luther (1483–1546)",
        "description": "Luther's Galatians commentary in Theodore Graebner's explicitly abridged English translation.",
        "license": "Public domain edition; Project Gutenberg eBook #1549",
        "licenseUrl": "https://www.gutenberg.org/policy/license.html",
        "sourceUrl": "https://www.gutenberg.org/ebooks/1549",
        "sourceEdition": "A new abridged translation by Theodore Graebner; Zondervan edition (1939; later printings); Project Gutenberg #1549, updated 2024-02-17",
        "translator": "Theodore Graebner (1876–1950), abridged English translation",
        "publicationYear": 1939,
        "publicDomain": True,
        "attribution": "Martin Luther; abridged English translation by Theodore Graebner; digitized by Project Gutenberg/Project Wittenberg.",
        "notes": "This is the abridged Graebner translation, not the complete commentary. Separable KJV-style base-text headings, Gutenberg navigation, and license boilerplate are excluded; quotations integral to the exposition are retained.",
        "books": [{"id": "GAL", "name": "Galatians", "file": "books/GAL.json"}],
    }
    args.output.mkdir(parents=True, exist_ok=True)
    (args.output / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    chapters = {
        str(chapter): sum(1 for entry in entries if entry["reference"]["chapterStart"] == chapter)
        for chapter in range(1, 7)
    }
    coverage = {
        "module": MODULE_ID,
        "books": [{
            "book": "GAL", "chapters": list(range(1, 7)), "entries": len(entries),
            "introductionEntries": sum(entry["reference"]["chapterStart"] == 0 for entry in entries),
            "chapterEntries": chapters, "canonicalVersesCovered": len(covered), "bytes": book_path.stat().st_size,
        }],
    }
    (args.output / "coverage.json").write_text(json.dumps(coverage, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{MODULE_ID}: {len(entries)} entries, {book_path.stat().st_size} bytes, {len(covered)} verses covered")


if __name__ == "__main__":
    main()
