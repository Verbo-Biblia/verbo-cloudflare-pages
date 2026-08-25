#!/usr/bin/env python3
"""Import Bob Utley's digitized English Bible commentary into Verbo.

The importer reads the publisher's volume indexes, downloads chapter HTML,
removes site navigation and embedded Bible-text boxes, and creates one Verbo
entry per verse/range heading.  Source HTML is cached outside the repository.
"""

from __future__ import annotations

import argparse
import html as html_std
import json
import re
import time
import urllib.parse
import urllib.request
from collections import defaultdict
from pathlib import Path

from lxml import html


ROOT = Path(__file__).resolve().parent.parent
MODULE_ID = "utley-free-bible-commentary"
BASE = "https://www.freebiblecommentary.org"
NT_VOLUMES = ["VOL01", "VOL02", "VOL03A", "VOL03B", "VOL04", "VOL05", "VOL06",
              "VOL07", "VOL08", "VOL09", "VOL10", "VOL11", "VOL12"]
OT_VOLUMES = [
    "VOL01AOT", "VOL01BOT", "VOL02OT", "VOL02BOT", "VOL02COT", "VOL03OT",
    "VOL04OT", "VOL04BOT", "VOL05AOT", "VOL05BOT", "VOL06AOT", "VOL06BOT",
    "VOL07OT", "VOL07BOT", "VOL08OT", "VOL09AOT", "VOL09BOT", "VOL09COT",
    "VOL09DOT", "VOL10OT", "VOL10BOT", "VOL11AOT", "VOL11BOT", "VOL12OT",
    "VOL13AOT", "VOL13BOT", "VOL14OT",
]
BOOKS = {
    "Genesis": ("GEN", "Genesis"), "Exodus": ("EXO", "Exodus"),
    "Leviticus": ("LEV", "Leviticus"), "Numbers": ("NUM", "Numbers"),
    "Deuteronomy": ("DEU", "Deuteronomy"), "Joshua": ("JOS", "Joshua"),
    "Judges": ("JDG", "Judges"), "Ruth": ("RUT", "Ruth"),
    "1 Samuel": ("1SA", "1 Samuel"), "2 Samuel": ("2SA", "2 Samuel"),
    "1 Kings": ("1KI", "1 Kings"), "2 Kings": ("2KI", "2 Kings"),
    "1 Chronicles": ("1CH", "1 Chronicles"), "2 Chronicles": ("2CH", "2 Chronicles"),
    "Ezra": ("EZR", "Ezra"), "Nehemiah": ("NEH", "Nehemiah"),
    "Esther": ("EST", "Esther"), "Job": ("JOB", "Job"),
    "Psalms": ("PSA", "Psalms"), "Proverbs": ("PRO", "Proverbs"),
    "Ecclesiastes": ("ECC", "Ecclesiastes"), "Song of Songs": ("SNG", "Song of Songs"),
    "Isaiah": ("ISA", "Isaiah"), "Jeremiah": ("JER", "Jeremiah"),
    "Lamentations": ("LAM", "Lamentations"), "Ezekiel": ("EZK", "Ezekiel"),
    "Daniel": ("DAN", "Daniel"), "Hosea": ("HOS", "Hosea"),
    "Joel": ("JOL", "Joel"), "Amos": ("AMO", "Amos"),
    "Obadiah": ("OBA", "Obadiah"), "Jonah": ("JON", "Jonah"),
    "Micah": ("MIC", "Micah"), "Nahum": ("NAM", "Nahum"),
    "Habakkuk": ("HAB", "Habakkuk"), "Zephaniah": ("ZEP", "Zephaniah"),
    "Haggai": ("HAG", "Haggai"), "Zechariah": ("ZEC", "Zechariah"),
    "Malachi": ("MAL", "Malachi"),
    "Matthew": ("MAT", "Matthew"), "Mark": ("MRK", "Mark"),
    "Luke": ("LUK", "Luke"), "John": ("JHN", "John"),
    "Acts": ("ACT", "Acts"), "Romans": ("ROM", "Romans"),
    "1 Corinthians": ("1CO", "1 Corinthians"),
    "2 Corinthians": ("2CO", "2 Corinthians"),
    "Galatians": ("GAL", "Galatians"), "Ephesians": ("EPH", "Ephesians"),
    "Philippians": ("PHP", "Philippians"), "Colossians": ("COL", "Colossians"),
    "1 Thessalonians": ("1TH", "1 Thessalonians"),
    "2 Thessalonians": ("2TH", "2 Thessalonians"),
    "1 Timothy": ("1TI", "1 Timothy"), "2 Timothy": ("2TI", "2 Timothy"),
    "Titus": ("TIT", "Titus"), "Philemon": ("PHM", "Philemon"),
    "Hebrews": ("HEB", "Hebrews"), "James": ("JAS", "James"),
    "1 Peter": ("1PE", "1 Peter"), "2 Peter": ("2PE", "2 Peter"),
    "1 John": ("1JN", "1 John"), "2 John": ("2JN", "2 John"),
    "3 John": ("3JN", "3 John"), "Jude": ("JUD", "Jude"),
    "Revelation": ("REV", "Revelation"),
}
ORDER = list(BOOKS)
REF_RE = re.compile(r"^(\d+):(\d+)(?:\s*[-–]\s*(?:(\d+):)?(\d+))?")
ALIASES = {"Psalm": "Psalms", "the Psalms": "Psalms"}


def fetch(url: str, cache: Path) -> bytes:
    cache.mkdir(parents=True, exist_ok=True)
    target = cache / re.sub(r"[^A-Za-z0-9_.-]+", "_", urllib.parse.urlparse(url).path.strip("/"))
    if target.exists():
        return target.read_bytes()
    request = urllib.request.Request(url, headers={"User-Agent": "Verbo-commentary-import/1.0"})
    last_error = None
    for attempt in range(4):
        try:
            with urllib.request.urlopen(request, timeout=120) as response:
                data = response.read()
            break
        except (OSError, TimeoutError) as error:
            last_error = error
            if attempt == 3:
                raise
            time.sleep(2 ** attempt)
    target.write_bytes(data)
    print(f"downloaded {url}")
    return data


def normalize_label(label: str):
    label = " ".join(label.split())
    single_chapter = {"Philemon", "2 John", "3 John", "Jude", "Obadiah"}
    label = label.removeprefix("The Book of ")
    if label in single_chapter:
        return label, 1, 1
    if label.startswith("Introduction to "):
        name = label.removeprefix("Introduction to ")
        name = re.sub(r"\s+\d.*$", "", name)
        name = ALIASES.get(name, name)
        return (name, 0, 0) if name in BOOKS else None
    for candidate in sorted(set(BOOKS) | set(ALIASES), key=len, reverse=True):
        if label == candidate:
            name = ALIASES.get(candidate, candidate)
            return (name, 1, 1) if name in single_chapter else None
        if not label.startswith(candidate + " "):
            continue
        tail = label[len(candidate):].strip()
        match = re.match(r"(\d+)(?::\d+)?(?:\s*[-–&]\s*(\d+)(?::(\d+))?)?", tail)
        if match:
            name = ALIASES.get(candidate, candidate)
            start = int(match.group(1))
            # In "Proverbs 1:1-33", 33 is a verse; in "Genesis 1:1-2:3",
            # the second colon proves that 2 is an ending chapter.
            end = int(match.group(2)) if match.group(3) else start
            return name, start, end
    return None


def source_pages(cache: Path):
    seen = set()
    volumes = [("old_testament_studies", volume) for volume in OT_VOLUMES]
    volumes += [("new_testament_studies", volume) for volume in NT_VOLUMES]
    for section, volume in volumes:
        index_url = f"{BASE}/{section}/{volume}/{volume}.html"
        doc = html.fromstring(fetch(index_url, cache), base_url=index_url)
        for anchor in doc.xpath("//a[@href]"):
            href = anchor.get("href")
            if not urllib.parse.urlparse(href).path.lower().endswith((".html", ".htm")):
                continue
            parsed = normalize_label(anchor.text_content())
            if not parsed:
                continue
            book, chapter_start, chapter_end = parsed
            url = urllib.parse.urljoin(index_url, href)
            key = (book, chapter_start, chapter_end, url)
            if key not in seen:
                seen.add(key)
                yield key


def clean_element(element, page_url: str):
    if "BibleTextBox" in (element.get("class") or "").split():
        return ""
    serialized = html.tostring(element, encoding="unicode")
    if not serialized.strip():
        return ""
    try:
        clone = html.fromstring(serialized)
    except Exception:
        # Some legacy pages contain empty processing instructions/comments.
        return ""
    for bad in clone.xpath('.//*[self::script or self::style or contains(concat(" ", normalize-space(@class), " "), " BibleTextBox ")]'):
        bad.drop_tree()
    for node in clone.xpath(".//*[@href]"):
        node.set("href", urllib.parse.urljoin(page_url, node.get("href")))
    for node in clone.xpath(".//*[@src]"):
        node.set("src", urllib.parse.urljoin(page_url, node.get("src")))
    for node in clone.xpath(".//*"):
        for attr in list(node.attrib):
            if attr.lower().startswith("on") or attr in {"style", "id"}:
                del node.attrib[attr]
    return html.tostring(clone, encoding="unicode", method="html")


def ref_from_heading(element):
    bold = element.xpath("./b[1]") if element.tag == "p" else []
    if not bold:
        return None
    text = " ".join(bold[0].text_content().split())
    match = REF_RE.match(text)
    if not match:
        return None
    ch1, v1 = int(match.group(1)), int(match.group(2))
    ch2, v2 = int(match.group(3) or ch1), int(match.group(4) or v1)
    return ch1, v1, ch2, v2, text[:160]


def parse_page(data: bytes, page_url: str, book_id: str, chapter_start: int, chapter_end: int):
    doc = html.fromstring(data, base_url=page_url)
    body = doc.xpath("//body")
    if not body:
        return []
    children = list(body[0])
    anchors = [(i, ref_from_heading(node)) for i, node in enumerate(children)]
    anchors = [(i, ref) for i, ref in anchors if ref]
    entries = []
    if not anchors:
        content_nodes = [n for n in children if "CenterContents" not in (n.get("class") or "")]
        content = "".join(clean_element(n, page_url) for n in content_nodes)
        if content.strip():
            entries.append((chapter_start or 1, 1, chapter_end or chapter_start or 1, 999, "Introduction", content))
        return entries
    # Preserve contextual material before WORD AND PHRASE STUDY as a chapter entry.
    first = anchors[0][0]
    preamble = [n for n in children[:first] if "CenterContents" not in (n.get("class") or "")]
    preamble_html = "".join(clean_element(n, page_url) for n in preamble)
    if preamble_html.strip():
        entries.append((chapter_start, 1, chapter_end, 999, "Contextual Insights", preamble_html))
    for pos, (index, ref) in enumerate(anchors):
        end = anchors[pos + 1][0] if pos + 1 < len(anchors) else len(children)
        content = "".join(clean_element(n, page_url) for n in children[index:end]
                          if "CenterContents" not in (n.get("class") or ""))
        entries.append((*ref[:4], ref[4], content))
    return entries


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cache", type=Path, default=Path("/tmp/freebiblecommentary-cache"))
    parser.add_argument("--output", type=Path,
                        default=ROOT / "biblia/modules/commentaries" / MODULE_ID)
    args = parser.parse_args()
    bible_root = ROOT / "biblia/modules/bibles/rv-verbo"
    bible_manifest = json.loads((bible_root / "manifest.json").read_text(encoding="utf-8"))
    bounds = {}
    for bible_book in bible_manifest["books"]:
        bible_data = json.loads((bible_root / bible_book["file"]).read_text(encoding="utf-8"))
        bounds[bible_book["id"]] = {
            int(chapter): max(map(int, verses))
            for chapter, verses in bible_data["chapters"].items()
        }
    by_book = defaultdict(list)
    sources = []
    for book, chapter_start, chapter_end, url in source_pages(args.cache):
        book_id, _ = BOOKS[book]
        data = fetch(url, args.cache)
        for ch1, v1, ch2, v2, heading, content in parse_page(
                data, url, book_id, chapter_start, chapter_end):
            ch1 = max(1, ch1)
            if ch1 not in bounds[book_id]:
                print(f"skipped out-of-book heading {book} {heading} from {url}")
                continue
            if ch2 not in bounds[book_id] or ch2 < ch1:
                ch2 = ch1
            v1 = min(max(1, v1), bounds[book_id][ch1])
            v2 = min(max(v1 if ch1 == ch2 else 1, v2), bounds[book_id][ch2])
            entry_id = f"utley-{book_id.lower()}-{ch1}-{v1}-{ch2}-{v2}-{len(by_book[book_id]) + 1}"
            by_book[book_id].append({
                "id": entry_id,
                "title": f"{book} {heading}",
                "author": "Dr. Bob Utley",
                "source": url,
                "reference": {"book": book_id, "chapterStart": ch1, "verseStart": v1,
                              "chapterEnd": ch2, "verseEnd": v2},
                "content": content,
            })
        sources.append(url)
    args.output.mkdir(parents=True, exist_ok=True)
    books_dir = args.output / "books"
    books_dir.mkdir(exist_ok=True)
    manifest_books = []
    for book in ORDER:
        book_id, display = BOOKS[book]
        entries = by_book.get(book_id, [])
        if not entries:
            raise SystemExit(f"No entries generated for {book}")
        entries.sort(key=lambda e: (e["reference"]["chapterStart"], e["reference"]["verseStart"], e["id"]))
        (books_dir / f"{book_id}.json").write_text(
            json.dumps({"entries": entries}, ensure_ascii=False, separators=(",", ":")) + "\n",
            encoding="utf-8")
        manifest_books.append({"id": book_id, "name": display, "file": f"books/{book_id}.json"})
    manifest = {
        "schemaVersion": 2, "id": MODULE_ID, "type": "commentary",
        "name": "Utley Commentary", "abbreviation": "Utley",
        "language": "en", "author": "Dr. Bob Utley",
        "description": "Verse-by-verse Bible study-guide commentary, digitized by Bible Lessons International and adapted for Verbo from the publisher's English HTML edition.",
        "source": f"{BASE}/",
        "license": "Copyright Bible Lessons International. Free copying and distribution permitted only at no cost, with credit to Dr. Bob Utley and a reference to freebiblecommentary.org.",
        "copyrightNotice": "Copyright © Bible Lessons International. All rights reserved. Any copies or distribution of any part of this material must be made available at no cost. Such copies or distribution must give credit to Dr. Bob Utley and include a reference to www.freebiblecommentary.org.",
        "books": manifest_books,
    }
    (args.output / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Generated {sum(map(len, by_book.values()))} entries across {len(by_book)} books")


if __name__ == "__main__":
    main()
