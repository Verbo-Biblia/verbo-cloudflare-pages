#!/usr/bin/env python3
"""Import Lightfoot's Colossians and Philemon from Gutenberg #50857.

The source edition separates the continuous Greek epistle text (``p.c032``)
from Lightfoot's summaries and notes (``p.c033``/``p.c034``). Verbo already
provides Bible text, so the Greek base blocks are excluded while every
expository paragraph, introduction, dissertation, and referenced footnote is
retained.
"""

from __future__ import annotations

import argparse
import hashlib
import html as html_std
import json
import re
import urllib.request
from copy import deepcopy
from pathlib import Path

from lxml import etree, html

ROOT = Path(__file__).resolve().parent.parent
MODULE_ID = "lightfoot-colossians-philemon"
OUTPUT = ROOT / "biblia/modules/commentaries" / MODULE_ID
SOURCE_URL = "https://www.gutenberg.org/cache/epub/50857/pg50857-images.html"
SOURCE_SHA256 = "27b4b4c4dbf1f74131abb4e480963ae43739ebb570a3c7b7928ae503c5c27b09"
SOURCE_BYTES = 1_934_414
MAX_SECTION_CHARS = 18_000

VERSE_PREFIX = re.compile(
    r"^\s*(\d+)(?:\s*(?:[–—-]|,|and)\s*(\d+))?[.\]]\s*",
    re.IGNORECASE,
)


def fetch_source(cache: Path) -> Path:
    cache.mkdir(parents=True, exist_ok=True)
    target = cache / "pg50857-images.html"
    if not target.exists():
        request = urllib.request.Request(SOURCE_URL, headers={"User-Agent": "Verbo-Lightfoot-import/1.0"})
        with urllib.request.urlopen(request) as response:
            target.write_bytes(response.read())
    raw = target.read_bytes()
    digest = hashlib.sha256(raw).hexdigest()
    if digest != SOURCE_SHA256 or len(raw) != SOURCE_BYTES:
        raise SystemExit(f"Fuente Gutenberg inesperada: bytes={len(raw)}, sha256={digest}")
    return target


def text_value(node: etree._Element) -> str:
    return " ".join(node.text_content().split())


def heading_value(node: etree._Element) -> str:
    return text_value(node).strip().rstrip(".")


class Cleaner:
    def __init__(self, footnotes: dict[str, etree._Element]):
        self.footnotes = footnotes

    def inline(self, node: etree._Element, refs: list[str]) -> str:
        parts: list[str] = []
        if node.text:
            parts.append(html_std.escape(node.text))
        for child in node:
            tag = child.tag.lower() if isinstance(child.tag, str) else ""
            classes = set((child.get("class") or "").split())
            value = ""
            if "pageno" in classes or "hidev" in classes:
                value = ""
            elif tag == "a" and (child.get("href") or "").startswith("#f"):
                ref = (child.get("href") or "")[1:]
                if ref in self.footnotes and ref not in refs:
                    refs.append(ref)
                label = re.sub(r"[^0-9]", "", child.text_content()) or ref.removeprefix("f")
                value = f"<strong>[{label}]</strong>"
            elif tag == "a":
                label = text_value(child)
                value = "" if label in {"←", "→"} else html_std.escape(label)
            elif tag in {"em", "i", "cite"}:
                value = f"<em>{self.inline(child, refs)}</em>"
            elif tag in {"strong", "b"}:
                value = f"<strong>{self.inline(child, refs)}</strong>"
            elif tag == "br":
                value = " "
            elif tag in {"img", "hr", "script", "style"}:
                value = ""
            else:
                value = self.inline(child, refs)
            parts.append(value)
            if child.tail:
                parts.append(html_std.escape(child.tail))
        value = "".join(parts)
        value = re.sub(r"\s+", " ", value)
        value = re.sub(r"\s+([,.;:?!])", r"\1", value)
        return value.strip()

    def block(self, node: etree._Element, refs: list[str]) -> str:
        tag = node.tag.lower() if isinstance(node.tag, str) else ""
        classes = set((node.get("class") or "").split())
        if "pbb" in classes or tag in {"hr", "script", "style"}:
            return ""
        if "pageno" in classes:
            return ""
        if tag in {"p", "div"} and ("sidenote" in classes or "sni" in classes):
            value = self.inline(node, refs)
            return f"<p><strong>{value}</strong></p>" if value else ""
        if tag in {"p", "blockquote"}:
            value = self.inline(node, refs)
            return f"<{tag}>{value}</{tag}>" if value else ""
        if tag in {"h1", "h2", "h3", "h4", "h5", "h6"}:
            value = self.inline(node, refs)
            return f"<p><strong>{value}</strong></p>" if value else ""
        if tag in {"ul", "ol"}:
            items = "".join(self.block(child, refs) for child in node if child.tag.lower() == "li")
            return f"<{tag}>{items}</{tag}>" if items else ""
        if tag == "li":
            value = self.inline(node, refs)
            return f"<li>{value}</li>" if value else ""
        if tag == "table":
            rows = []
            for row in node.xpath(".//tr"):
                cells = [text_value(cell) for cell in row.xpath("./th|./td") if text_value(cell)]
                if cells:
                    rows.append(f"<li>{html_std.escape(' — '.join(cells))}</li>")
            return f"<ul>{''.join(rows)}</ul>" if rows else ""
        result = []
        if node.text and node.text.strip():
            result.append(f"<p>{html_std.escape(' '.join(node.text.split()))}</p>")
        for child in node:
            result.append(self.block(child, refs))
        return "".join(result)

    def footnote_html(self, refs: list[str]) -> str:
        result = []
        for ref in refs:
            source = deepcopy(self.footnotes[ref])
            for label in source.xpath(".//*[contains(concat(' ', normalize-space(@class), ' '), ' label ')]"):
                label.getparent().remove(label)
            nested_refs: list[str] = []
            content = "".join(self.block(child, nested_refs) for child in source)
            if not content:
                value = self.inline(source, nested_refs)
                content = f"<p>{value}</p>" if value else ""
            result.append(f"<p><strong>Footnote {ref.removeprefix('f')}.</strong></p>{content}")
        return "".join(result)

    def nodes(self, nodes: list[etree._Element]) -> str:
        refs: list[str] = []
        content = "".join(self.block(node, refs) for node in nodes)
        return content + self.footnote_html(refs)


def direct_children(document: html.HtmlElement) -> list[etree._Element]:
    body = document.find("body")
    if body is None:
        raise SystemExit("La fuente no contiene body")
    # Gutenberg mixes body-level paragraphs with decorative wrapper divs and
    # verse/motto blocks made only from nested divs. Walk the hierarchy once:
    # selecting descendants with one XPath would duplicate lists and sidenotes
    # already contained in a selected paragraph or wrapper.
    result: list[etree._Element] = []
    block_tags = {"h2", "h3", "p", "table", "ul", "ol", "blockquote"}

    def walk(node: etree._Element) -> None:
        tag = node.tag.lower() if isinstance(node.tag, str) else ""
        classes = set((node.get("class") or "").split())
        if tag in block_tags or (tag == "div" and classes.intersection({"sidenote", "sni"})):
            result.append(node)
            return

        element_children = [child for child in node if isinstance(child.tag, str)]
        has_block_child = any(
            child.tag.lower() in block_tags or child.tag.lower() == "div"
            for child in element_children
        )
        if tag == "div" and text_value(node) and not has_block_child:
            # Gutenberg's centred poetry/motto lines are semantic leaf divs.
            result.append(node)
            return
        for child in element_children:
            walk(child)

    for child in body:
        if isinstance(child.tag, str):
            walk(child)
    return result


def find_heading(children: list[etree._Element], tag: str, exact: str | None = None, contains: str | None = None) -> int:
    for index, node in enumerate(children):
        if node.tag.lower() != tag:
            continue
        value = text_value(node)
        if exact is not None and value == exact:
            return index
        if contains is not None and contains in value:
            return index
    raise SystemExit(f"No se encontró encabezado: {tag} {exact or contains}")


def split_html(content: str, limit: int = MAX_SECTION_CHARS) -> list[str]:
    if len(content) <= limit:
        return [content]
    fragments = re.findall(r"<(?:p|blockquote|ul|ol)>.*?</(?:p|blockquote|ul|ol)>", content, flags=re.DOTALL)
    if "".join(fragments) != content:
        raise SystemExit("No se pudo segmentar una sección sin romper su HTML")
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


def introduction_entries(
    children: list[etree._Element], cleaner: Cleaner, book: str, start: int, end: int, prefix: str
) -> list[dict]:
    sections: list[tuple[str, list[etree._Element]]] = []
    title = "Introduction"
    nodes: list[etree._Element] = []
    for node in children[start:end]:
        if node.tag.lower() in {"h2", "h3"}:
            if nodes:
                sections.append((title, nodes))
            title = heading_value(node)
            nodes = []
        else:
            nodes.append(node)
    if nodes:
        sections.append((title, nodes))

    entries = []
    sequence = 0
    for title, nodes in sections:
        content = cleaner.nodes(nodes)
        if not content:
            continue
        chunks = split_html(content)
        for part, chunk in enumerate(chunks, 1):
            sequence += 1
            part_title = title if len(chunks) == 1 else f"{title} — Part {part}"
            entries.append({
                "id": f"lightfoot-{book.lower()}-{prefix}-{sequence}",
                "title": part_title,
                "author": "J. B. Lightfoot (1828–1889)",
                "reference": {"book": book, "chapterStart": 0, "verseStart": 0, "chapterEnd": 0, "verseEnd": 0},
                "content": chunk,
            })
    return entries


def verse_entries(
    children: list[etree._Element], cleaner: Cleaner, book: str, start: int, end: int
) -> list[dict]:
    grouped: list[dict] = []
    current: dict | None = None
    page_chapter = 1
    pending_verse: int | None = None
    roman = {"I": 1, "II": 2, "III": 3, "IV": 4}
    for paragraph in children[start:end]:
        if paragraph.tag.lower() != "p":
            continue
        classes = set((paragraph.get("class") or "").split())
        if "c032" in classes:
            anchor_ids = paragraph.xpath(".//*[@id]/@id")
            if book == "COL":
                anchors = [re.fullmatch(r"(I|II|III|IV)_(\d+)", value) for value in anchor_ids]
                anchors = [match for match in anchors if match]
                if anchors:
                    page_chapter = roman[anchors[0].group(1)]
                    pending_verse = int(anchors[0].group(2))
            else:
                anchors = [re.fullmatch(r"ph_(\d+)", value) for value in anchor_ids]
                anchors = [match for match in anchors if match]
                if anchors:
                    pending_verse = int(anchors[0].group(1))
            continue
        if not classes.intersection({"c033", "c034"}):
            continue

        plain = text_value(paragraph)
        match = VERSE_PREFIX.match(plain)
        if match:
            start_verse = int(match.group(1))
            end_verse = int(match.group(2) or start_verse)
            current = {"chapter": page_chapter, "start": start_verse, "end": end_verse, "nodes": [paragraph]}
            grouped.append(current)
        elif pending_verse is not None and (current is None or current["chapter"] != page_chapter):
            current = {"chapter": page_chapter, "start": pending_verse, "end": pending_verse, "nodes": [paragraph]}
            grouped.append(current)
        elif current is not None:
            current["nodes"].append(paragraph)
        else:
            raise SystemExit(f"Párrafo exegético sin referencia inicial en {book}: {plain[:100]}")
        pending_verse = None

    entries = []
    per_reference: dict[tuple[int, int, int], int] = {}
    for group in grouped:
        key = (group["chapter"], group["start"], group["end"])
        per_reference[key] = per_reference.get(key, 0) + 1
        suffix = per_reference[key]
        content = cleaner.nodes(group["nodes"])
        if not content:
            continue
        reference_label = str(group["start"]) if group["start"] == group["end"] else f"{group['start']}–{group['end']}"
        chunks = split_html(content)
        for part, chunk in enumerate(chunks, 1):
            title = f"{'Colossians' if book == 'COL' else 'Philemon'} {group['chapter']}:{reference_label}"
            if len(chunks) > 1:
                title += f" — Part {part}"
            entries.append({
                "id": f"lightfoot-{book.lower()}-{group['chapter']}-{group['start']}-{group['end']}-{suffix}-{part}",
                "title": title,
                "author": "J. B. Lightfoot (1828–1889)",
                "reference": {
                    "book": book, "chapterStart": group["chapter"], "verseStart": group["start"],
                    "chapterEnd": group["chapter"], "verseEnd": group["end"],
                },
                "content": chunk,
            })
    return entries


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--cache", type=Path, default=Path("/tmp/verbo-lightfoot-gutenberg"))
    parser.add_argument("--output", type=Path, default=OUTPUT)
    args = parser.parse_args()

    source = fetch_source(args.cache)
    document = html.parse(str(source)).getroot()
    children = direct_children(document)
    footnotes = {node.get("id"): node for node in document.xpath('//div[contains(concat(" ", normalize-space(@class), " "), " footnote ")]')}
    cleaner = Cleaner(footnotes)

    col_intro_start = find_heading(children, "h2", contains="THE CHURCHES OF THE LYCUS")
    col_text = find_heading(children, "h2", exact="ΠΡΟΣ ΚΟΛΑΣΣΑΕΙΣ.")
    col_appendix = find_heading(children, "h3", contains="Various Readings")
    phm_intro = find_heading(children, "h2", exact="EPISTLE TO PHILEMON.")
    phm_text = find_heading(children, "h2", exact="ΠΡΟΣ ΦΙΛΗΜΟΝΑ.")
    additions = find_heading(children, "h2", contains="ADDITIONS AND CORRECTIONS")
    index = find_heading(children, "h2", exact="INDEX.")

    col_entries = introduction_entries(children, cleaner, "COL", col_intro_start, col_text, "intro")
    col_notes = verse_entries(children, cleaner, "COL", col_text + 1, col_appendix)
    col_entries.extend(col_notes)
    col_entries.extend(introduction_entries(children, cleaner, "COL", col_appendix, phm_intro, "appendix"))
    col_entries.extend(introduction_entries(children, cleaner, "COL", additions, index, "corrections"))

    phm_entries = introduction_entries(children, cleaner, "PHM", phm_intro, phm_text, "intro")
    phm_entries.extend(verse_entries(children, cleaner, "PHM", phm_text + 1, additions))

    expected = {"COL": (1, 1, 4, 18), "PHM": (1, 1, 1, 25)}
    for book, entries in (("COL", col_entries), ("PHM", phm_entries)):
        verse_refs = [e["reference"] for e in entries if e["reference"]["chapterStart"] > 0]
        first = min((r["chapterStart"], r["verseStart"]) for r in verse_refs)
        last = max((r["chapterEnd"], r["verseEnd"]) for r in verse_refs)
        if (*first, *last) != expected[book]:
            raise SystemExit(f"Cobertura extrema inesperada en {book}: {first}–{last}")

    args.output.mkdir(parents=True, exist_ok=True)
    books_dir = args.output / "books"
    books_dir.mkdir(exist_ok=True)
    coverage = []
    manifest_books = []
    for book, name, entries in (("COL", "Colossians", col_entries), ("PHM", "Philemon", phm_entries)):
        target = books_dir / f"{book}.json"
        target.write_text(json.dumps({"book": book, "entries": entries}, ensure_ascii=False) + "\n", encoding="utf-8")
        manifest_books.append({"id": book, "name": name, "file": f"books/{book}.json"})
        coverage.append({
            "book": book,
            "chapters": sorted({e["reference"]["chapterStart"] for e in entries if e["reference"]["chapterStart"] > 0}),
            "entries": len(entries),
            "introductionEntries": sum(e["reference"]["chapterStart"] == 0 for e in entries),
            "bytes": target.stat().st_size,
        })

    manifest = {
        "schemaVersion": 2,
        "id": MODULE_ID,
        "type": "commentary",
        "name": "J. B. Lightfoot — Colossians and Philemon",
        "abbreviation": "Lightfoot",
        "language": "en",
        "author": "J. B. Lightfoot (1828–1889)",
        "description": "Lightfoot's 1875 revised Greek text commentary, with introductions, notes, and dissertations on Colossians and Philemon.",
        "license": "Public domain edition; Project Gutenberg eBook #50857",
        "licenseUrl": "https://www.gutenberg.org/policy/license.html",
        "sourceUrl": "https://www.gutenberg.org/ebooks/50857",
        "sourceEdition": "London: Macmillan and Co., 1875; Project Gutenberg #50857, updated 2024-10-22",
        "publicationYear": 1875,
        "publicDomain": True,
        "attribution": "J. B. Lightfoot; digitized by Project Gutenberg Distributed Proofreaders.",
        "notes": "Continuous Greek epistle text, Project Gutenberg navigation, index, page furniture, and license boilerplate are excluded. Exposition, introductions, dissertations, corrections, Greek quotations, and referenced footnotes are retained.",
        "books": manifest_books,
    }
    (args.output / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (args.output / "coverage.json").write_text(json.dumps({"module": MODULE_ID, "books": coverage}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{MODULE_ID}: {sum(x['entries'] for x in coverage)} entries, {sum(x['bytes'] for x in coverage)} bytes")


if __name__ == "__main__":
    main()
