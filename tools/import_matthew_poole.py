#!/usr/bin/env python3
"""Build Matthew Poole's Annotations from the two CC0 EEBO-TCP TEI files.

The source prints the KJV text with annotations embedded as TEI ``note``
elements.  Verbo already supplies Bible text, so this importer publishes the
notes and book arguments only.  It never reconstructs or republishes the
continuous Bible text.
"""

from __future__ import annotations

import argparse
import hashlib
import html
import json
import re
import urllib.request
from pathlib import Path

from lxml import etree

ROOT = Path(__file__).resolve().parent.parent
MODULE_ID = "matthew-poole-annotations"
OUTPUT = ROOT / "biblia/modules/commentaries" / MODULE_ID
NS = {"tei": "http://www.tei-c.org/ns/1.0"}

SOURCES = {
    "A55363": {
        "url": "https://raw.githubusercontent.com/textcreationpartnership/A55363/master/A55363.xml",
        "sha256": "fc494999def0b470be3e1d826d1bb310fe2e627da7d9946067485ddc92fbe6b5",
        "edition": "London, John Richardson for Thomas Parkhurst et al., 1683, vol. I",
    },
    "A55368": {
        "url": "https://raw.githubusercontent.com/textcreationpartnership/A55368/master/A55368.xml",
        "sha256": "88e15a73286b932440edfa76936b374ba63360ffea2d62d0d3ba514c5cf9a6e6",
        "edition": "London, Thomas Parkhurst et al., 1685, vol. II",
    },
}

BOOKS = [
    ("GEN", "Genesis"), ("EXO", "Exodus"), ("LEV", "Leviticus"),
    ("NUM", "Numbers"), ("DEU", "Deuteronomy"), ("JOS", "Joshua"),
    ("JDG", "Judges"), ("RUT", "Ruth"), ("1SA", "1 Samuel"),
    ("2SA", "2 Samuel"), ("1KI", "1 Kings"), ("2KI", "2 Kings"),
    ("1CH", "1 Chronicles"), ("2CH", "2 Chronicles"), ("EZR", "Ezra"),
    ("NEH", "Nehemiah"), ("EST", "Esther"), ("JOB", "Job"),
    ("PSA", "Psalms"), ("PRO", "Proverbs"), ("ECC", "Ecclesiastes"),
    ("SNG", "Song of Solomon"), ("ISA", "Isaiah"), ("JER", "Jeremiah"),
    ("LAM", "Lamentations"), ("EZK", "Ezekiel"), ("DAN", "Daniel"),
    ("HOS", "Hosea"), ("JOL", "Joel"), ("AMO", "Amos"),
    ("OBA", "Obadiah"), ("JON", "Jonah"), ("MIC", "Micah"),
    ("NAM", "Nahum"), ("HAB", "Habakkuk"), ("ZEP", "Zephaniah"),
    ("HAG", "Haggai"), ("ZEC", "Zechariah"), ("MAL", "Malachi"),
    ("MAT", "Matthew"), ("MRK", "Mark"), ("LUK", "Luke"),
    ("JHN", "John"), ("ACT", "Acts"), ("ROM", "Romans"),
    ("1CO", "1 Corinthians"), ("2CO", "2 Corinthians"),
    ("GAL", "Galatians"), ("EPH", "Ephesians"), ("PHP", "Philippians"),
    ("COL", "Colossians"), ("1TH", "1 Thessalonians"),
    ("2TH", "2 Thessalonians"), ("1TI", "1 Timothy"),
    ("2TI", "2 Timothy"), ("TIT", "Titus"), ("PHM", "Philemon"),
    ("HEB", "Hebrews"), ("JAS", "James"), ("1PE", "1 Peter"),
    ("2PE", "2 Peter"), ("1JN", "1 John"), ("2JN", "2 John"),
    ("3JN", "3 John"), ("JUD", "Jude"), ("REV", "Revelation"),
]

ROMAN = {"I": 1, "V": 5, "X": 10, "L": 50, "C": 100, "D": 500, "M": 1000}


def roman_number(value: str) -> int | None:
    # Match a standalone numeral (e.g. the ``II`` in ``CHAP. II.``), rather
    # than collecting the C from the word CHAP as part of the number.
    tokens = re.findall(r"\b[IVXLCDM]+\b", value.upper())
    if not tokens:
        return None
    token = tokens[0]
    total = previous = 0
    for char in reversed(token):
        current = ROMAN[char]
        total += -current if current < previous else current
        previous = max(previous, current)
    return total


def clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def inline_html(node: etree._Element) -> str:
    parts: list[str] = []
    if node.text:
        parts.append(html.escape(node.text))
    for child in node:
        name = etree.QName(child).localname
        if name == "hi":
            inner = inline_html(child)
            rend = child.get("rend", "").lower()
            tag = "strong" if "bold" in rend else "em"
            parts.append(f"<{tag}>{inner}</{tag}>")
        elif name == "q":
            parts.append(f"<blockquote>{inline_html(child)}</blockquote>")
        elif name == "list":
            items = "".join(f"<li>{inline_html(item)}</li>" for item in child.xpath("./tei:item", namespaces=NS))
            parts.append(f"<ul>{items}</ul>")
        elif name == "gap":
            parts.append("[illegible]")
        elif name in {"g", "pb", "milestone"}:
            pass
        else:
            parts.append(inline_html(child))
        if child.tail:
            parts.append(html.escape(child.tail))
    value = "".join(parts)
    value = re.sub(r"\s+", " ", value)
    value = re.sub(r"\s+([,.;:?!])", r"\1", value)
    return value.strip()


def paragraph_html(node: etree._Element) -> str:
    value = inline_html(node)
    return f"<p>{value}</p>" if value else ""


def note_html(note: etree._Element) -> str:
    value = inline_html(note)
    label = clean_text(note.get("n", ""))
    if label and label not in {"*", "†", "‡", "‖"}:
        value = f"<strong>{html.escape(label)}</strong> {value}"
    return f"<p>{value}</p>" if value else ""


def fetch_source(cache: Path, source_id: str) -> Path:
    cache.mkdir(parents=True, exist_ok=True)
    target = cache / f"{source_id}.xml"
    if not target.exists():
        request = urllib.request.Request(SOURCES[source_id]["url"], headers={"User-Agent": "Verbo-Poole-import/1.0"})
        with urllib.request.urlopen(request) as response:
            target.write_bytes(response.read())
    digest = hashlib.sha256(target.read_bytes()).hexdigest()
    if digest != SOURCES[source_id]["sha256"]:
        raise SystemExit(f"Checksum incorrecto para {source_id}: {digest}")
    return target


def chapter_number(chapter: etree._Element) -> int:
    head = clean_text("".join(chapter.xpath("./tei:head//text()", namespaces=NS)))
    printed = roman_number(head)
    encoded = int(chapter.get("n", "0"))
    return printed or encoded


def build_book(book: etree._Element, book_id: str, name: str, source_id: str) -> dict:
    default_author = "Matthew Poole (1624–1679)" if source_id == "A55363" else "Continuation of Matthew Poole by various divines"
    entries: list[dict] = []
    argument = book.find("tei:argument", NS)
    if argument is not None:
        content = "".join(paragraph_html(p) for p in argument.xpath("./tei:p", namespaces=NS))
        if content:
            entries.append({
                "id": f"poole-{book_id.lower()}-introduction",
                "title": f"Introduction to {name}", "author": default_author,
                "reference": {"book": book_id, "chapterStart": 0, "verseStart": 0, "chapterEnd": 0, "verseEnd": 0},
                "content": content,
            })

    chapters = book.xpath("./tei:div[@type='chapter' or @type='Psalm']", namespaces=NS)
    if not chapters:  # Philemon, 2 John and 3 John are unwrapped single chapters.
        chapters = [book]
    for chapter_index, chapter in enumerate(chapters, 1):
        # The 45th Psalm is mislabeled LXV / n=65 in TCP. All 150 Psalm
        # divisions remain in canonical order, so their ordinal is definitive.
        number = chapter_index if book_id == "PSA" else (1 if chapter is book else chapter_number(chapter))
        # Poole died after completing Isaiah 58. The remaining annotations in
        # the first printed volume belong to the continuators, even though TCP
        # encodes the whole physical volume in A55363.
        author = (
            "Continuation of Matthew Poole by various divines"
            if book_id == "ISA" and number >= 59
            else default_author
        )
        for paragraph in chapter.xpath("./tei:p[@n]", namespaces=NS):
            raw_verse = paragraph.get("n", "")
            match = re.match(r"\d+", raw_verse)
            if not match:
                continue
            verse = int(match.group())
            # TCP lost the chapter XI wrapper in Leviticus and appended its
            # surviving verses (25–47) to chapter X. Their printed verse text
            # and content identify them unambiguously as Leviticus 11.
            entry_chapter = 11 if book_id == "LEV" and number == 10 and verse >= 25 else number
            # Nested notes belong to the surrounding note and are serialized
            # with it; selecting them again would duplicate their text.
            notes = paragraph.xpath(".//tei:note[not(ancestor::tei:note)]", namespaces=NS)
            content = "".join(note_html(note) for note in notes)
            if not content:
                continue
            entries.append({
                "id": f"poole-{book_id.lower()}-{entry_chapter}-{verse}",
                "title": f"{name} {entry_chapter}:{verse}", "author": author,
                "reference": {"book": book_id, "chapterStart": entry_chapter, "verseStart": verse, "chapterEnd": entry_chapter, "verseEnd": verse},
                "content": content,
            })
    # A handful of TCP paragraphs split a printed verse into two blocks. Keep
    # their notes in source order while preserving Verbo's unique entry IDs.
    merged: dict[str, dict] = {}
    for entry in entries:
        previous = merged.get(entry["id"])
        if previous is None:
            merged[entry["id"]] = entry
        else:
            previous["content"] += entry["content"]
    return {"book": book_id, "entries": list(merged.values())}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--cache", type=Path, default=Path("/tmp/verbo-poole-eebo-tcp"))
    parser.add_argument("--output", type=Path, default=OUTPUT)
    args = parser.parse_args()
    paths = [fetch_source(args.cache, source_id) for source_id in SOURCES]
    roots = [etree.parse(str(path)) for path in paths]
    source_books = roots[0].xpath("//tei:div[@type='book']", namespaces=NS) + roots[1].xpath("//tei:div[@type='biblical_commentary']", namespaces=NS)
    if len(source_books) != 66:
        raise SystemExit(f"Se esperaban 66 libros; se encontraron {len(source_books)}")

    args.output.mkdir(parents=True, exist_ok=True)
    books_dir = args.output / "books"
    books_dir.mkdir(exist_ok=True)
    manifest_books = []
    coverage = []
    for index, ((book_id, name), source_book) in enumerate(zip(BOOKS, source_books), 1):
        source_id = "A55363" if index <= 23 else "A55368"
        data = build_book(source_book, book_id, name, source_id)
        target = books_dir / f"{book_id}.json"
        target.write_text(json.dumps(data, ensure_ascii=False) + "\n", encoding="utf-8")
        manifest_books.append({"id": book_id, "name": name, "file": f"books/{book_id}.json"})
        chapters = {entry["reference"]["chapterStart"] for entry in data["entries"] if entry["reference"]["chapterStart"] > 0}
        coverage.append({"book": book_id, "chapters": len(chapters), "entries": len(data["entries"]), "bytes": target.stat().st_size})

    manifest = {
        "schemaVersion": 2, "id": MODULE_ID, "type": "commentary",
        "name": "Matthew Poole — Annotations upon the Holy Bible",
        "abbreviation": "Poole", "language": "en",
        "author": "Matthew Poole (through Isaiah 58); continuation by various divines",
        "description": "The 1683–1685 Annotations, transcribed and encoded by EEBO-TCP. Volume II is explicitly a continuation of Poole's work by various divines.",
        "license": "CC0 1.0 (EEBO-TCP keyboarded and encoded editions; page images excluded)",
        "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/",
        "sourceUrl": "https://name.umdl.umich.edu/A55363.0001.001; https://name.umdl.umich.edu/A55368.0001.001",
        "sourceEdition": "London, 1683 vol. I (TCP A55363); London, 1685 vol. II (TCP A55368)",
        "publicationYear": "1683–1685", "publicDomain": True,
        "attribution": "Text Creation Partnership, University of Michigan and University of Oxford; TCP A55363 and A55368.",
        "notes": "Continuous printed Bible text is excluded. Notes and book arguments are retained. TCP gaps are represented as [illegible].",
        "books": manifest_books,
    }
    (args.output / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (args.output / "coverage.json").write_text(json.dumps({"module": MODULE_ID, "books": coverage}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{MODULE_ID}: {sum(x['entries'] for x in coverage)} entries, {sum(x['bytes'] for x in coverage)} bytes")


if __name__ == "__main__":
    main()
