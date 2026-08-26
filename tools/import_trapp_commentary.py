#!/usr/bin/env python3
"""Import John Trapp's commentary from the 6 CC0 EEBO-TCP TEI volumes that
cover 55 of the 66 canonical books.

Per Juan's explicit instruction (2026-08-26): publish what is CC0-verified
rather than waiting for the missing 11 books (Joshua-2 Chronicles, John,
Acts — no CC0 TEI/XML was located for these, see WAVE1-RESUME-STATE.md).
The module name and manifest metadata say plainly that this is 55 of 66
books; it is never presented as "Complete Commentary" even though Trapp's
own printed title was.

Trapp's TCP encoding differs from Poole's (see import_matthew_poole.py):
the commentary text itself lives directly in <p> elements (not in nested
<note> children of a base-text paragraph). Each paragraph that starts a
new verse is prefixed with plain text "Verse N." (long-s "Verſe" in the
TCP transcription, sometimes abbreviated "Ver.", sometimes a Roman
numeral instead of Arabic for the verse number); a paragraph with no such
prefix continues annotating whatever verse the previous prefixed
paragraph declared.

Printed chapter numbers (in each chapter <div>'s <head>, and duplicated
less reliably in its @n attribute) are not always sequential in the TCP
transcription — see resolve_chapter_number() below for the two verified,
documented exceptions (Exodus, Psalms).
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
MODULE_ID = "trapp-commentary"
OUTPUT = ROOT / "biblia/modules/commentaries" / MODULE_ID
KJV_DIR = ROOT / "biblia/modules/bibles/kjv-strong/books"
NS = {"tei": "http://www.tei-c.org/ns/1.0"}
AUTHOR = "John Trapp (1601–1669)"

SOURCES = {
    "A94797": {
        "url": "https://raw.githubusercontent.com/textcreationpartnership/A94797/master/A94797.xml",
        "sha256": "a1b0ef079a728f6ff40b8bc3d80bf5a413dca2cd6e08433eee4a62be293b05d5",
        "edition": "London, 1649/1650 (A Clavis to the Bible: a new comment upon the Pentateuch)",
        "books": ["GEN", "EXO", "LEV", "NUM", "DEU"],
    },
    "A63066": {
        "url": "https://raw.githubusercontent.com/textcreationpartnership/A63066/master/A63066.xml",
        "sha256": "8899d8ef3b1af3be79b96feba3a19857f2c485854e98ab5e5789f22d0e991d4f",
        "edition": "London, 1657 (Ezra, Nehemiah, Esther, Job and Psalms)",
        "books": ["EZR", "NEH", "EST", "JOB", "PSA"],
    },
    "A63069": {
        "url": "https://raw.githubusercontent.com/textcreationpartnership/A63069/master/A63069.xml",
        "sha256": "0622c547e10058daae32da35e8cedef3e9cd5cc5e8eecf8c65315b8973248744",
        "edition": "London, 1660 (Proverbs-Daniel, third volume of annotations)",
        "books": ["PRO", "ECC", "SNG", "ISA", "JER", "LAM", "EZK", "DAN"],
    },
    "A63068": {
        "url": "https://raw.githubusercontent.com/textcreationpartnership/A63068/master/A63068.xml",
        "sha256": "1433f8113cb45b34400e1effacb259cdc15ff4789993ddff9348699457cab69b",
        "edition": "London, 1654 (the XII minor prophets)",
        "books": ["HOS", "JOL", "AMO", "OBA", "JON", "MIC", "NAM", "HAB", "ZEP", "HAG", "ZEC", "MAL"],
    },
    "A63067": {
        "url": "https://raw.githubusercontent.com/textcreationpartnership/A63067/master/A63067.xml",
        "sha256": "63d2f9a9e54439cce653aa8e3bac1bc5a6f622ef0d4fd74321dd8d02d7957c1f",
        "edition": "London, 1647 (this TCP file's title promises John and Acts too, but the XML itself ends at Luke 24:53 — see PROVENANCE.md)",
        "books": ["MAT", "MRK", "LUK"],
    },
    "A63065": {
        "url": "https://raw.githubusercontent.com/textcreationpartnership/A63065/master/A63065.xml",
        "sha256": "440b7caa1fc282bccd576ad0559dd29ac2fe6d788dcce7d9fbbf00756834dcf0",
        "edition": "London, 1647 (all the Epistles and Revelation)",
        "books": ["ROM", "1CO", "2CO", "GAL", "EPH", "PHP", "COL", "1TH", "2TH", "1TI", "2TI", "TIT", "PHM",
                   "HEB", "JAS", "1PE", "2PE", "1JN", "2JN", "3JN", "JUD", "REV"],
    },
}

BOOK_NAMES = {
    "GEN": "Genesis", "EXO": "Exodus", "LEV": "Leviticus", "NUM": "Numbers", "DEU": "Deuteronomy",
    "EZR": "Ezra", "NEH": "Nehemiah", "EST": "Esther", "JOB": "Job", "PSA": "Psalms",
    "PRO": "Proverbs", "ECC": "Ecclesiastes", "SNG": "Song of Solomon", "ISA": "Isaiah", "JER": "Jeremiah",
    "LAM": "Lamentations", "EZK": "Ezekiel", "DAN": "Daniel",
    "HOS": "Hosea", "JOL": "Joel", "AMO": "Amos", "OBA": "Obadiah", "JON": "Jonah", "MIC": "Micah",
    "NAM": "Nahum", "HAB": "Habakkuk", "ZEP": "Zephaniah", "HAG": "Haggai", "ZEC": "Zechariah", "MAL": "Malachi",
    "MAT": "Matthew", "MRK": "Mark", "LUK": "Luke",
    "ROM": "Romans", "1CO": "1 Corinthians", "2CO": "2 Corinthians", "GAL": "Galatians", "EPH": "Ephesians",
    "PHP": "Philippians", "COL": "Colossians", "1TH": "1 Thessalonians", "2TH": "2 Thessalonians",
    "1TI": "1 Timothy", "2TI": "2 Timothy", "TIT": "Titus", "PHM": "Philemon", "HEB": "Hebrews",
    "JAS": "James", "1PE": "1 Peter", "2PE": "2 Peter", "1JN": "1 John", "2JN": "2 John", "3JN": "3 John",
    "JUD": "Jude", "REV": "Revelation",
}
BOOK_NUMBERS = {b: i + 1 for i, b in enumerate([
    "GEN", "EXO", "LEV", "NUM", "DEU", "JOS", "JDG", "RUT", "1SA", "2SA", "1KI", "2KI", "1CH", "2CH",
    "EZR", "NEH", "EST", "JOB", "PSA", "PRO", "ECC", "SNG", "ISA", "JER", "LAM", "EZK", "DAN", "HOS",
    "JOL", "AMO", "OBA", "JON", "MIC", "NAM", "HAB", "ZEP", "HAG", "ZEC", "MAL", "MAT", "MRK", "LUK",
    "JHN", "ACT", "ROM", "1CO", "2CO", "GAL", "EPH", "PHP", "COL", "1TH", "2TH", "1TI", "2TI", "TIT",
    "PHM", "HEB", "JAS", "1PE", "2PE", "1JN", "2JN", "3JN", "JUD", "REV",
])}

ROMAN = {"I": 1, "V": 5, "X": 10, "L": 50, "C": 100, "D": 500, "M": 1000}


def roman_to_int(token: str) -> int | None:
    token = token.upper()
    if not token or any(ch not in ROMAN for ch in token):
        return None
    total = previous = 0
    for char in reversed(token):
        current = ROMAN[char]
        total += -current if current < previous else current
        previous = max(previous, current)
    return total


def numeral_to_int(token: str) -> int | None:
    if token.isdigit():
        return int(token)
    return roman_to_int(token)


def head_chapter_number(head_text: str) -> int | None:
    # (?![A-Za-z]) rejects a capture that's actually the start of an
    # ordinary word rather than a numeral — see VERSE_PREFIX below for the
    # concrete case this guards against ("Verſ. Martial. 15." parsing as
    # verse "M" = 1000).
    match = re.search(r"\bCHAP\.?\s+([IVXLCDM\d]+)(?![A-Za-z])", head_text, re.IGNORECASE)
    if not match:
        return None
    return numeral_to_int(match.group(1))


BUNDLE_HEAD = re.compile(r"\bAND\s+CHAP\b|,\s*[IVXLCDM]+\s*(?:,|&c)|&c\.?\s*$", re.IGNORECASE)


def resolve_chapter_numbers(chapter_divs: list[etree._Element], book_id: str, anomalies: list[str]) -> list[int]:
    """Chapter numbers printed in each div's <head> ("CHAP. N.") are
    reliable almost everywhere, but not perfectly:

    - A single mistyped Roman numeral happens (Genesis: one div reads
      "CHAP. XXV." where every neighbour confirms it can only be XV — the
      run is otherwise perfectly sequential 1..24, 26..50 around it).
    - Some divs deliberately bundle several real chapters under one
      printed head ("CHAP. XXXVI, XXXVII, &c." in Exodus; "CHAP. XXXVI.
      and CHAP. XXXVII." in Isaiah), with no separate content for the
      chapters folded in — confirmed by hand for both: each such div's
      only paragraph is a one-line redirect ("For these two Chapters, see
      2 King. 18, and 19..."), not real per-verse commentary that would
      be lost by tagging it all under the first bundled number.

    Both are real, but distinguishable: an isolated head that disagrees
    with strict "one more than the previous chapter" and was NOT preceded
    by a bundle-announcing head is untrustworthy (the Genesis case) and
    the strictly-sequential expectation is used instead, flagged in
    coverage.json. A forward jump that WAS preceded by a bundle-announcing
    head is trusted as printed (the Exodus/Isaiah case), because that is
    exactly what the previous div's own head told the reader to expect.
    """
    resolved: list[int] = []
    last = 0
    previous_was_bundle = False
    for index, chapter_div in enumerate(chapter_divs):
        head_text = clean_text("".join(chapter_div.xpath("./tei:head//text()", namespaces=NS)))
        declared = head_chapter_number(head_text)
        if declared is None:
            n_attr = chapter_div.get("n")
            declared = int(n_attr) if n_attr and n_attr.isdigit() else None
        is_bundle = bool(BUNDLE_HEAD.search(head_text))

        if declared == last + 1:
            value = declared
        elif declared is not None and declared > last + 1 and previous_was_bundle:
            value = declared
        elif declared is not None and declared > last + 1 and index == 0:
            value = declared  # first division of the book: nothing to compare against yet
        else:
            value = last + 1
            if declared is not None and declared != value:
                anomalies.append(
                    f"{book_id}: encabezado dice capítulo {declared} pero la secuencia esperaba {value} "
                    f"(sin bundle previo que lo explique) -- se usó {value}: '{head_text[:60]}'"
                )
        resolved.append(value)
        last = value
        previous_was_bundle = is_bundle
    return resolved


VERSE_PREFIX = re.compile(
    # (?i:...) scopes case-insensitivity to just "Verse"/"Ver."/"Verſe" —
    # the numeral itself stays case-sensitive (always uppercase in this
    # print), so a lowercase roman-looking word can't be mistaken for one.
    r"^\s*(?i:Ver(?:[ſs]e?)?)\.?\s*([IVXLCDM\d]+)(?![A-Za-z])(?:\s*[,–—-]\s*([IVXLCDM\d]+)(?![A-Za-z]))?\.?\s*"
)
# Same, but tolerating one inline "(...)" parenthetical between "Verſe" and
# the numeral — used only to strip the prefix from already-rendered HTML,
# where a margin note that TCP placed ahead of the numeral in the XML
# stream (e.g. "Verſ. <note>Martial.</note> 15." — the citation is
# anchored mid-reference, not a stray editorial aside) survives as
# "(Martial.)" via inline_html()'s own note handling.
VERSE_PREFIX_HTML = re.compile(
    r"^\s*(?i:Ver(?:[ſs]e?)?)\.?\s*(?:\([^)]{1,80}\)\s*)?([IVXLCDM\d]+)(?![A-Za-z])(?:\s*[,–—-]\s*([IVXLCDM\d]+)(?![A-Za-z]))?\.?\s*"
)


def clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def text_excluding_notes(node: etree._Element) -> str:
    """Plain text of a paragraph, skipping <note> subtrees — used only to
    detect the "Verse N." marker itself. A margin note can sit between
    "Verſ." and its numeral in document order (see VERSE_PREFIX_HTML
    above); scanning past it here is what lets the correct verse number
    still be found instead of merging into the previous verse's entry."""
    parts = [node.text or ""]
    for child in node:
        if child.tag != f"{{{NS['tei']}}}note":
            parts.append(text_excluding_notes(child))
        parts.append(child.tail or "")
    return "".join(parts)


def inline_html(node: etree._Element) -> str:
    parts: list[str] = []
    if node.text:
        parts.append(html.escape(node.text))
    for child in node:
        name = etree.QName(child).localname
        if name == "hi":
            parts.append(f"<em>{inline_html(child)}</em>")
        elif name == "note":
            # Marginal citation/gloss (place="margin" almost always, a few
            # "bottom" page-foot notes) — kept inline, in parentheses, at
            # the point Trapp anchored it, not moved to an end-of-entry
            # block: these are short cross-references, not long footnotes,
            # and only make sense next to the word they gloss.
            inner = inline_html(child)
            if inner:
                parts.append(f" ({inner})")
        elif name == "q":
            parts.append(f"<em>{inline_html(child)}</em>")
        elif name == "list":
            items = "".join(f"<li>{inline_html(item)}</li>" for item in child.xpath("./tei:item", namespaces=NS))
            parts.append(f"<ul>{items}</ul>")
        elif name == "gap":
            parts.append("[ilegible]")
        elif name in {"g", "pb", "milestone", "seg"}:
            # <seg rend="decorInit"> is just the decorative drop-cap first
            # letter of a paragraph — its text is already part of the
            # first word, but "seg" itself carries no markup we keep.
            parts.append(inline_html(child))
        else:
            parts.append(inline_html(child))
        if child.tail:
            parts.append(html.escape(child.tail))
    value = "".join(parts)
    value = re.sub(r"\s+", " ", value)
    value = re.sub(r"\s+([,.;:?!])", r"\1", value)
    return value.strip()


def paragraph_html(p: etree._Element, strip_prefix: bool) -> str:
    value = inline_html(p)
    if strip_prefix:
        value = VERSE_PREFIX_HTML.sub("", value, count=1)
    return f"<p>{value}</p>" if value.strip() else ""


_KJV_CACHE: dict[str, dict] = {}
# Verbo's own Bible modules disagree on Nahum's id: English Bibles (kjv,
# asv, bsb) use NAH; Spanish Bibles and the commentary book lists (Poole,
# and this one, matching that precedent) use NAM. Only affects this
# cross-check against the English KJV text for range validation.
_KJV_ID_ALIASES = {"NAM": "NAH"}


def last_verse_of_chapter(book_id: str, chapter: int) -> int | None:
    kjv_id = _KJV_ID_ALIASES.get(book_id, book_id)
    if kjv_id not in _KJV_CACHE:
        path = KJV_DIR / f"{kjv_id}.json"
        _KJV_CACHE[kjv_id] = json.loads(path.read_text(encoding="utf-8"))["chapters"] if path.exists() else {}
    chapters = _KJV_CACHE[kjv_id]
    key = str(chapter)
    if key not in chapters:
        return None
    return max(int(v) for v in chapters[key])


def build_book(book_div: etree._Element, book_id: str, source_id: str, anomalies: list[str]) -> dict:
    name = BOOK_NAMES[book_id]
    chapters = book_div.xpath("./tei:div[@type='chapter']", namespaces=NS)
    is_psalms = book_id == "PSA"
    if is_psalms:
        chapters = book_div.xpath("./tei:div[@type='Psalm']", namespaces=NS)
    if not chapters:
        chapters = [book_div]  # e.g. Obadiah: single chapter, no nested div

    if is_psalms:
        # Position is fully reliable here (Psalms are strictly sequential,
        # never merged/reordered); the printed @n/head labels are not —
        # this file's very first Psalm div is already mislabeled "2"
        # (Psalm 1 has no separate div at all in this TCP transcription,
        # see PROVENANCE.md) and there is one further duplicate label
        # (twice "CXLVI") later on. Pure position + a fixed +2 offset
        # reproduces the verified, correct sequence end to end (confirmed
        # against the last div, correctly labeled "PSAL. CL." = 150,
        # landing exactly on position 149 under this offset).
        chapter_numbers = [i + 2 for i in range(len(chapters))]
    else:
        chapter_numbers = resolve_chapter_numbers(chapters, book_id, anomalies)

    entries: list[dict] = []
    for chapter_index, chapter_div in enumerate(chapters):
        head_text = clean_text("".join(chapter_div.xpath("./tei:head//text()", namespaces=NS)))
        chapter = chapter_numbers[chapter_index]

        start_verse = 1
        head_verse_match = re.search(r"Ver(?:[ſs]e?)?\.?\s*([IVXLCDM\d]+)", head_text, re.IGNORECASE)
        if head_verse_match:
            parsed = numeral_to_int(head_verse_match.group(1))
            if parsed:
                start_verse = parsed

        verse_html: dict[tuple[int, int], list[str]] = {}
        current_start, current_end = start_verse, start_verse
        first_paragraph = True
        for p in chapter_div.xpath("./tei:p", namespaces=NS):
            plain = clean_text(text_excluding_notes(p))
            match = VERSE_PREFIX.match(plain)
            if match:
                v1 = numeral_to_int(match.group(1))
                v2 = numeral_to_int(match.group(2)) if match.group(2) else None
                if v1 is not None:
                    current_start = v1
                    current_end = v2 if v2 is not None else v1
            # else: no "Verse N." prefix -> paragraph continues annotating
            # whatever (current_start, current_end) the last prefixed
            # paragraph declared (or the chapter head's own starting verse,
            # for the very first paragraph).
            first_paragraph = False
            content = paragraph_html(p, strip_prefix=bool(match))
            if not content:
                continue
            key = (current_start, current_end)
            verse_html.setdefault(key, []).append(content)

        for (v1, v2), htmls in verse_html.items():
            last_verse = last_verse_of_chapter(book_id, chapter)
            if last_verse and (v1 > last_verse or v2 > last_verse):
                anomalies.append(f"{book_id} {chapter}:{v1}-{v2}: fuera de rango (máx {last_verse}) en '{head_text[:40]}'")
                continue
            label = str(v1) if v1 == v2 else f"{v1}-{v2}"
            entries.append({
                "id": f"trapp-{book_id.lower()}-{chapter}-{v1}-{v2}",
                "title": f"{name} {chapter}:{label}",
                "author": AUTHOR,
                "reference": {"book": book_id, "chapterStart": chapter, "verseStart": v1, "chapterEnd": chapter, "verseEnd": v2},
                "content": "".join(htmls),
            })
    return {"book": book_id, "entries": entries}


VERSE_N_LIST = re.compile(r"\d+")


def build_gospel_book(book_div: etree._Element, book_id: str, anomalies: list[str]) -> dict:
    """A63067 (Matthew/Mark/Luke) uses a completely different, more
    granular TCP encoding than the other 5 volumes: each verse is its own
    <div type="verse" n="N">, holding a general <p> and/or nested
    <div type="phrase"> children — one per headword Trapp comments on
    within that verse, each with its own <head> lemma and <p> exposition.
    No "Verse N." text-prefix scanning is needed or possible here; @n is
    the verse number directly (occasionally a comma list like "9,10" for
    a div that covers several verses in one exposition — same "do not
    atomize below what the source itself groups" principle as elsewhere).
    """
    name = BOOK_NAMES[book_id]
    chapters = book_div.xpath("./tei:div[@type='chapter']", namespaces=NS)
    chapter_numbers = resolve_chapter_numbers(chapters, book_id, anomalies)

    # A few chapters carry two separate <div type="verse"> for the same
    # printed verse number (e.g. Matthew 9:14 gets two distinct verse-divs,
    # each with its own phrases) — merged by (chapter, v1, v2) instead of
    # colliding on id, same principle as Poole's split-note merge.
    merged: dict[tuple[int, int, int], dict] = {}
    for chapter_index, chapter_div in enumerate(chapters):
        chapter = chapter_numbers[chapter_index]
        for verse_div in chapter_div.xpath("./tei:div[@type='verse']", namespaces=NS):
            numbers = [int(n) for n in VERSE_N_LIST.findall(verse_div.get("n") or "")]
            if not numbers:
                continue
            v1, v2 = min(numbers), max(numbers)

            parts = [paragraph_html(p, strip_prefix=False) for p in verse_div.xpath("./tei:p", namespaces=NS)]
            for phrase in verse_div.xpath("./tei:div[@type='phrase']", namespaces=NS):
                lemma = inline_html(phrase.find("tei:head", NS)) if phrase.find("tei:head", NS) is not None else ""
                for p in phrase.xpath("./tei:p", namespaces=NS):
                    body = paragraph_html(p, strip_prefix=False)
                    if body and lemma:
                        parts.append(body.replace("<p>", f"<p><strong>{lemma}</strong> ", 1))
                    elif body:
                        parts.append(body)
            content = "".join(part for part in parts if part)
            if not content:
                continue

            last_verse = last_verse_of_chapter(book_id, chapter)
            if last_verse and (v1 > last_verse or v2 > last_verse):
                anomalies.append(f"{book_id} {chapter}:{v1}-{v2}: fuera de rango (máx {last_verse})")
                continue
            key = (chapter, v1, v2)
            if key in merged:
                merged[key]["content"] += content
            else:
                label = str(v1) if v1 == v2 else f"{v1}-{v2}"
                merged[key] = {
                    "id": f"trapp-{book_id.lower()}-{chapter}-{v1}-{v2}",
                    "title": f"{name} {chapter}:{label}",
                    "author": AUTHOR,
                    "reference": {"book": book_id, "chapterStart": chapter, "verseStart": v1, "chapterEnd": chapter, "verseEnd": v2},
                    "content": content,
                }
    return {"book": book_id, "entries": list(merged.values())}


def fetch_source(cache: Path, source_id: str) -> Path:
    cache.mkdir(parents=True, exist_ok=True)
    target = cache / f"{source_id}.xml"
    if not target.exists():
        request = urllib.request.Request(SOURCES[source_id]["url"], headers={"User-Agent": "Verbo-Trapp-import/1.0"})
        with urllib.request.urlopen(request) as response:
            target.write_bytes(response.read())
    digest = hashlib.sha256(target.read_bytes()).hexdigest()
    if digest != SOURCES[source_id]["sha256"]:
        raise SystemExit(f"Checksum incorrecto para {source_id}: {digest}")
    return target


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--cache", type=Path, default=Path("/tmp/verbo-trapp-tcp"))
    parser.add_argument("--output", type=Path, default=OUTPUT)
    args = parser.parse_args()

    args.output.mkdir(parents=True, exist_ok=True)
    books_dir = args.output / "books"
    books_dir.mkdir(exist_ok=True)

    manifest_books = []
    coverage = []
    anomalies: list[str] = []
    total_entries = 0
    total_bytes = 0

    for source_id, source in SOURCES.items():
        path = fetch_source(args.cache, source_id)
        tree = etree.parse(str(path))
        book_divs = tree.xpath("//tei:div[@type='commentary']", namespaces=NS)
        expected = source["books"]
        if source_id == "A63068":
            # This volume also bundles "The Righteous Man's Recompence", a
            # treatise on Malachi 3:16-18 — not scripture-by-scripture
            # commentary, excluded; keep only the first 12 (the prophets).
            book_divs = book_divs[:12]
        if len(book_divs) != len(expected):
            raise SystemExit(f"{source_id}: se esperaban {len(expected)} libros, se encontraron {len(book_divs)}")
        for book_id, book_div in zip(expected, book_divs):
            if source_id == "A63067":
                data = build_gospel_book(book_div, book_id, anomalies)
            else:
                data = build_book(book_div, book_id, source_id, anomalies)
            target = books_dir / f"{book_id}.json"
            target.write_text(json.dumps(data, ensure_ascii=False) + "\n", encoding="utf-8")
            manifest_books.append({
                "id": book_id, "name": BOOK_NAMES[book_id], "number": BOOK_NUMBERS[book_id],
                "file": f"books/{book_id}.json",
            })
            chapters_covered = sorted({e["reference"]["chapterStart"] for e in data["entries"]})
            coverage.append({
                "book": book_id, "chapters": chapters_covered, "entries": len(data["entries"]),
                "bytes": target.stat().st_size, "sourceId": source_id,
            })
            total_entries += len(data["entries"])
            total_bytes += target.stat().st_size

    manifest_books.sort(key=lambda b: b["number"])
    coverage.sort(key=lambda c: BOOK_NUMBERS[c["book"]])

    manifest = {
        "schemaVersion": 2,
        "id": MODULE_ID,
        "type": "commentary",
        "name": "John Trapp — Commentary (55 of 66 books)",
        "abbreviation": "Trapp",
        "language": "en",
        "author": AUTHOR,
        "description": "Trapp's verse-by-verse commentary, covering the 55 of 66 canonical books for which a CC0 EEBO-TCP transcription was located. Missing: Joshua, Judges, Ruth, 1-2 Samuel, 1-2 Kings, 1-2 Chronicles, John, Acts — see PROVENANCE.md. Never presented as complete, unlike Trapp's own printed title.",
        "license": "CC0 1.0 (EEBO-TCP keyboarded and encoded editions; page images excluded)",
        "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/",
        "sourceUrl": "https://textcreationpartnership.org/",
        "sourceEdition": "; ".join(f"{sid}: {s['edition']}" for sid, s in SOURCES.items()),
        "publicationYear": "1647–1660",
        "publicDomain": True,
        "attribution": "Text Creation Partnership (Universities of Michigan and Oxford); TCP identifiers A94797, A63065-A63069.",
        "notes": "Continuous printed Bible text is excluded. Marginal citations/glosses are kept inline in parentheses at their point of occurrence, not moved to a footnote block. TCP transcription gaps are marked [ilegible]. Chapter numbers in a handful of divisions were corrected against their own printed head/content when the TCP @n attribute or head disagreed with the surrounding sequence — see PROVENANCE.md for the exact, verified cases (Exodus, Psalms).",
        "books": manifest_books,
    }
    (args.output / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (args.output / "coverage.json").write_text(
        json.dumps({"module": MODULE_ID, "books": coverage, "anomalies": anomalies}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"{MODULE_ID}: {total_entries} entries, {total_bytes} bytes, {len(coverage)} books")
    if anomalies:
        print(f"\n{len(anomalies)} anomalías detectadas (ver coverage.json -> anomalies):")
        for a in anomalies[:30]:
            print("  ", a)


if __name__ == "__main__":
    main()
