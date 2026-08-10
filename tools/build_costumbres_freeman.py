#!/usr/bin/env python3
"""Build modules/costumbres/freeman-manners-customs/entries.json from the real text
of James M. Freeman, "Handbook of Bible Manners and Customs" (1874, public domain).

Source: bibletruthpublishers.com hosts a clean manual transcription of the book
(verified against the archive.org OCR scan of the same edition — both end at the
same final entry, #893 "Many Crowns", Revelation 19:12). This script only extracts
and lightly cleans the real 1874 text; it never generates or paraphrases content
attributed to Freeman (see AGENTS.md).

Two-step fetch:
  1. The index page lists all 894 articles (0=Preface, 1..893=real entries) with a
     numeric slug prefix that is a reliable position (0..893, no gaps, verified).
  2. Each article page has a reference paragraph shaped like:
       <a class="verse-rollover-link">Genesis 4:20-21<span>...hidden tooltip...</span></a>. Adah bare Jabal...
     The visible label (before the first nested tag) is the clean reference; the
     hidden tooltip payload is discarded; the real quoted verse text is everything
     after the closing </a> in that same paragraph.
"""

from __future__ import annotations

import argparse
import concurrent.futures
import html
import json
import re
import unicodedata
import urllib.parse
import urllib.request
from pathlib import Path

INDEX_URL = "https://bibletruthpublishers.com/manners-and-customs-of-the-bible/lrc23558-23559"
BASE = "https://bibletruthpublishers.com"

# Flat map from normalized (lowercase, arabic-numeral-prefixed) English book name
# to Verbo's 3-letter book code. Built explicitly rather than by prefix-matching
# to avoid ambiguity between e.g. "John" (Gospel, JHN) and "1/2/3 John" (epistles).
BOOK_NAME_MAP = {
    "genesis": "GEN", "exodus": "EXO", "leviticus": "LEV", "numbers": "NUM",
    "deuteronomy": "DEU", "joshua": "JOS", "judges": "JDG", "ruth": "RUT",
    "1 samuel": "1SA", "2 samuel": "2SA", "1 kings": "1KI", "2 kings": "2KI",
    "1 chronicles": "1CH", "2 chronicles": "2CH", "ezra": "EZR", "nehemiah": "NEH",
    "esther": "EST", "job": "JOB", "psalm": "PSA", "psalms": "PSA",
    "proverbs": "PRO", "ecclesiastes": "ECC", "song of solomon": "SNG",
    "song of songs": "SNG", "canticles": "SNG", "isaiah": "ISA", "jeremiah": "JER",
    "lamentations": "LAM", "ezekiel": "EZK", "daniel": "DAN", "hosea": "HOS",
    "joel": "JOL", "amos": "AMO", "obadiah": "OBA", "jonah": "JON", "micah": "MIC",
    "nahum": "NAM", "habakkuk": "HAB", "zephaniah": "ZEP", "haggai": "HAG",
    "zechariah": "ZEC", "malachi": "MAL", "matthew": "MAT", "mark": "MRK",
    "luke": "LUK", "john": "JHN", "acts": "ACT", "romans": "ROM",
    "1 corinthians": "1CO", "2 corinthians": "2CO", "galatians": "GAL",
    "ephesians": "EPH", "philippians": "PHP", "colossians": "COL",
    "1 thessalonians": "1TH", "2 thessalonians": "2TH", "1 timothy": "1TI",
    "2 timothy": "2TI", "titus": "TIT", "philemon": "PHM", "hebrews": "HEB",
    "james": "JAS", "1 peter": "1PE", "2 peter": "2PE", "1 john": "1JN",
    "2 john": "2JN", "3 john": "3JN", "jude": "JUD", "revelation": "REV",
}

CANONICAL_ORDER = [
    "GEN","EXO","LEV","NUM","DEU","JOS","JDG","RUT","1SA","2SA","1KI","2KI","1CH","2CH",
    "EZR","NEH","EST","JOB","PSA","PRO","ECC","SNG","ISA","JER","LAM","EZK","DAN","HOS",
    "JOL","AMO","OBA","JON","MIC","NAM","HAB","ZEP","HAG","ZEC","MAL","MAT","MRK","LUK",
    "JHN","ACT","ROM","1CO","2CO","GAL","EPH","PHP","COL","1TH","2TH","1TI","2TI","TIT",
    "PHM","HEB","JAS","1PE","2PE","1JN","2JN","3JN","JUD","REV",
]


def fetch(url, path):
    if path.exists():
        return path.read_text(encoding="utf-8", errors="replace")
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Verbo costumbres indexer/1.0)"})
    with urllib.request.urlopen(req, timeout=60) as response:
        data = response.read()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    return data.decode("utf-8", errors="replace")


def clean_text(text):
    text = html.unescape(text)
    text = unicodedata.normalize("NFC", text).replace("\xa0", " ").replace("‑", "-")
    text = re.sub(r"[ \t\r\f\v]+", " ", text)
    return text.strip()


def parse_index(index_html):
    hrefs = re.findall(r'href="(/\d+-[^"]*james-m-freeman[^"]*)"', index_html)
    seen, ordered = set(), []
    for href in hrefs:
        if href not in seen:
            seen.add(href)
            ordered.append(href)
    return ordered


ORDINAL_PREFIXES = {
    "1st": "1", "first": "1", "i": "1", "1": "1",
    "2nd": "2", "second": "2", "ii": "2", "2": "2",
    "3rd": "3", "third": "3", "iii": "3", "3": "3",
}


def book_to_code(name):
    name = clean_text(name).lower()
    name = BOOK_NAME_ALIASES.get(name, name)
    m = re.match(r"^(1st|2nd|3rd|first|second|third|iii|ii|i|[123])\s+(.*)$", name)
    if m and ORDINAL_PREFIXES.get(m.group(1)):
        base = BOOK_NAME_ALIASES.get(m.group(2), m.group(2))
        name = f"{ORDINAL_PREFIXES[m.group(1)]} {base}"
    return BOOK_NAME_MAP.get(name.strip())


def strip_verse_links(fragment):
    """Body paragraphs are full of inline cross-reference links shaped just like
    the main verse header (visible label + hidden hover-tooltip payload nested
    inside). Collapse each one down to its clean visible label (e.g. "Isaiah 9:6")
    before stripping the rest of the markup, or the tooltip's full quoted verse
    text leaks into the prose as duplicated, garbled text."""
    def repl(match):
        return clean_text(match.group(1)).rstrip(",")
    return re.sub(r'<a class="verse-rollover-link"[^>]*>([^<]*)<.*?</a>', repl, fragment, flags=re.S)


def strip_footnote_refs(fragment):
    """Footnote markers are <a class="footnote-ref ..."> tags wrapping just the
    footnote number (e.g. "brazen<a class="footnote-ref fn1" ...>1</a> mirrors").
    We have no footnotes apparatus, so drop the whole marker rather than leave
    its digit glued onto the surrounding word."""
    return re.sub(r'<a class="footnote-ref[^"]*"[^>]*>.*?</a>', "", fragment, flags=re.S)


def strip_and_clean(fragment):
    return re.sub(r"<[^>]+>", "", strip_footnote_refs(strip_verse_links(fragment)))


SINGLE_CHAPTER_BOOKS = {"obadiah", "philemon", "2 john", "3 john", "jude"}
# Known transcription typos on the source site (lookup-only — the displayed
# title/content text is left exactly as published, this only affects which
# book code we file the entry under).
BOOK_NAME_ALIASES = {"lamintations": "lamentations"}

# A verse list is one or more digits, optionally chained with ",": or "-" plus
# more digits (e.g. "20-21", "2, 3"). Bounding it with this explicit grammar
# (rather than a loose char class) means it naturally stops at the first
# non-numeric character, so the trailing ". " separator some entries use and
# the plain " " (no period) separator others use are both handled correctly.
VERSE_LIST = r"\d+(?:\s*[,\-]\s*\d+)*"
# "Deuteronomy 27: 2, 3. Thou shalt..." / "Exodus 40:7 Thou shalt..." — book
# name (optionally with a leading ordinal and/or a trailing stray period),
# chapter, colon, verse list, optional period, rest of the paragraph (the
# quoted verse — some entries punctuate the boundary with a period, others
# just a space).
REF_WITH_CHAPTER = re.compile(
    rf"^([1-3]?\s?[A-Za-z][A-Za-z .]*?)\.?\s+(\d+)\s*:\s*({VERSE_LIST})\.?\s*(.*)$", re.S
)
# Single-chapter books cited as "Jude 12. These are spots..." — no colon at all.
REF_NO_CHAPTER = re.compile(
    rf"^([1-3]?\s?[A-Za-z][A-Za-z .]*?)\.?\s+({VERSE_LIST})\.?\s*(.*)$", re.S
)


def parse_reference_paragraph(fragment):
    """Returns (book_name, chapter, verse_text, quote_text) or None if unparseable.

    Not every entry's opening paragraph wraps its reference in a
    verse-rollover-link (many are plain text, e.g. "Deuteronomy 27: 2, 3. ...").
    Collapsing any link down to its clean label first (see strip_verse_links)
    lets a single plain-text regex handle both cases uniformly."""
    text = clean_text(strip_and_clean(fragment))
    m = REF_WITH_CHAPTER.match(text)
    if m:
        book_name, chapter, verses, quote_text = m.group(1).strip(), int(m.group(2)), m.group(3).strip(), m.group(4).strip()
        return book_name, chapter, verses, quote_text
    m = REF_NO_CHAPTER.match(text)
    if m:
        book_name, verses, quote_text = m.group(1).strip(), m.group(2).strip(), m.group(3).strip()
        if book_name.lower() not in SINGLE_CHAPTER_BOOKS:
            print(f"  [aviso] referencia sin capítulo para libro inesperado: {book_name!r} ({text[:60]!r})")
        return book_name, 1, verses, quote_text
    return None


def parse_entry(entry_html, position, source_url):
    title_m = re.search(r'id="[^"]*lblTitle"[^>]*>(.*?)</span>', entry_html, re.S)
    if not title_m:
        return None
    raw_title = clean_text(title_m.group(1))
    num_m = re.match(r"^(\d+)\.\s*(.*)$", raw_title)
    entry_num = int(num_m.group(1)) if num_m else position
    titulo = num_m.group(2).strip() if num_m else raw_title
    titulo = re.sub(r"\s*-\s*", " — ", titulo)

    paras = [m.group(1) for m in re.finditer(r'class="pgf"[^>]*>(.*?)</div>', entry_html, re.S)]
    if not paras:
        return None

    ref = parse_reference_paragraph(paras[0])
    if not ref:
        return None
    book_name, chapter, verses_raw, quote_text = ref
    libro = book_to_code(book_name)
    if not libro:
        return None

    verse_nums = [int(v) for v in re.findall(r"\d+", verses_raw)]
    if not verse_nums:
        return None
    v_inicio, v_fin = min(verse_nums), max(verse_nums)

    body_paragraphs = []
    for raw in paras[1:]:
        text = clean_text(strip_and_clean(raw))
        text = re.sub(r"^[.\s]+", "", text).strip()
        if text:
            body_paragraphs.append(text)

    # quote=False: this is inserted as HTML body text, not an attribute value —
    # escaping straight quote characters would just re-mangle the apostrophes
    # and quotation marks already normalized by clean_text/html.unescape above.
    quote_html = f'<blockquote class="costumbres-scripture">{html.escape(book_name, quote=False)} {chapter}:{verses_raw} — {html.escape(quote_text, quote=False)}</blockquote>' if quote_text else ""
    body_html = "".join(f"<p>{html.escape(p, quote=False)}</p>" for p in body_paragraphs)
    content = quote_html + body_html
    excerpt_source = " ".join(body_paragraphs) or quote_text
    excerpt = excerpt_source[:280].rstrip() + ("…" if len(excerpt_source) > 280 else "")

    return {
        "id": f"freeman-{entry_num}",
        "libro": libro,
        "capitulo": chapter,
        "versiculoInicio": v_inicio,
        "versiculoFin": v_fin,
        "titulo": titulo,
        "excerpt": excerpt,
        "content": content,
        "categoria": "israel_antiguo",
        "sourceUrl": source_url,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--cache", default="/tmp/costumbres-freeman-source")
    parser.add_argument("--workers", type=int, default=6)
    parser.add_argument("--output", default="biblia/modules/costumbres/freeman-manners-customs")
    parser.add_argument("--limit", type=int, default=None, help="Only process the first N entries (debugging)")
    args = parser.parse_args()
    cache_dir = Path(args.cache)
    output = Path(args.output)

    index_html = fetch(INDEX_URL, cache_dir / "index.html")
    hrefs = parse_index(index_html)
    print(f"Índice: {len(hrefs)} artículos listados (incluye #0 Preface)", flush=True)
    # position 0 == Preface, not a verse-anchored entry — skip it.
    targets = [(i, hrefs[i]) for i in range(1, len(hrefs))]
    if args.limit:
        targets = targets[: args.limit]

    def process(item):
        position, href = item
        url = BASE + href
        cache_path = cache_dir / "pages" / f"{position:04d}.html"
        page_html = fetch(url, cache_path)
        return parse_entry(page_html, position, url)

    entries = []
    skipped = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=max(1, args.workers)) as executor:
        for index, (item, result) in enumerate(zip(targets, executor.map(process, targets)), 1):
            if result:
                entries.append(result)
            else:
                skipped.append(item[1])
            if index % 50 == 0 or index == len(targets):
                print(f"[{index:04d}/{len(targets)}] {len(entries)} ok, {len(skipped)} omitidas", flush=True)

    entries.sort(key=lambda e: int(e["id"].split("-")[1]))

    if skipped:
        print(f"\nOmitidas ({len(skipped)}):")
        for href in skipped:
            print(f"  {href}")

    output.mkdir(parents=True, exist_ok=True)
    (output / "entries.json").write_text(
        json.dumps({"entries": entries}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    manifest_path = output / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest["totalEntries"] = len(entries)
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    per_book = {}
    for e in entries:
        per_book[e["libro"]] = per_book.get(e["libro"], 0) + 1
    print("\nEntradas por libro:")
    for code in CANONICAL_ORDER:
        if code in per_book:
            print(f"  {code}: {per_book[code]}")
    unknown = set(per_book) - set(CANONICAL_ORDER)
    if unknown:
        print(f"  ATENCIÓN — códigos de libro no reconocidos: {unknown}")

    print(f"\nTotal: {len(entries)} entradas, {len(skipped)} omitidas de {len(targets)}", flush=True)


if __name__ == "__main__":
    main()
