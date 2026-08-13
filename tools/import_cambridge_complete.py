#!/usr/bin/env python3
"""Import Cambridge Bible for Schools and Colleges into Verbo.

The source pages expose the public-domain Cambridge text chapter by chapter.
Downloads are cached outside the published tree; only normalized Verbo JSON is
written to ``biblia/modules/commentaries/cambridge``.
"""

from __future__ import annotations

import argparse
import html
import json
import re
import time
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MODULE = ROOT / "biblia/modules/commentaries/cambridge"
BIBLES = ROOT / "biblia/modules/bibles/rv-verbo/books"
BASE_URL = "https://biblehub.com/commentaries/cambridge/{slug}/{chapter}.htm"
SOURCE_NAME = "Cambridge Bible for Schools and Colleges"
SOURCE_URL = "https://biblehub.com/commentaries/cambridge/"
DEUTERONOMY_OCR_URL = (
    "https://archive.org/download/BookOfDeuteronomyG.A.Smith1918/"
    "Book%20of%20Deuteronomy%20-%20G.A.%20Smith%20%281918%29_djvu.txt"
)

BOOKS = [
    ("GEN", "Genesis", "genesis"), ("EXO", "Exodus", "exodus"),
    ("LEV", "Leviticus", "leviticus"), ("NUM", "Numbers", "numbers"),
    ("DEU", "Deuteronomy", "deuteronomy"), ("JOS", "Joshua", "joshua"),
    ("JDG", "Judges", "judges"), ("RUT", "Ruth", "ruth"),
    ("1SA", "1 Samuel", "1_samuel"), ("2SA", "2 Samuel", "2_samuel"),
    ("1KI", "1 Kings", "1_kings"), ("2KI", "2 Kings", "2_kings"),
    ("1CH", "1 Chronicles", "1_chronicles"), ("2CH", "2 Chronicles", "2_chronicles"),
    ("EZR", "Ezra", "ezra"), ("NEH", "Nehemiah", "nehemiah"),
    ("EST", "Esther", "esther"), ("JOB", "Job", "job"),
    ("PSA", "Psalms", "psalms"), ("PRO", "Proverbs", "proverbs"),
    ("ECC", "Ecclesiastes", "ecclesiastes"), ("SNG", "Song of Solomon", "songs"),
    ("ISA", "Isaiah", "isaiah"), ("JER", "Jeremiah", "jeremiah"),
    ("LAM", "Lamentations", "lamentations"), ("EZK", "Ezekiel", "ezekiel"),
    ("DAN", "Daniel", "daniel"), ("HOS", "Hosea", "hosea"),
    ("JOL", "Joel", "joel"), ("AMO", "Amos", "amos"),
    ("OBA", "Obadiah", "obadiah"), ("JON", "Jonah", "jonah"),
    ("MIC", "Micah", "micah"), ("NAM", "Nahum", "nahum"),
    ("HAB", "Habakkuk", "habakkuk"), ("ZEP", "Zephaniah", "zephaniah"),
    ("HAG", "Haggai", "haggai"), ("ZEC", "Zechariah", "zechariah"),
    ("MAL", "Malachi", "malachi"), ("MAT", "Matthew", "matthew"),
    ("MRK", "Mark", "mark"), ("LUK", "Luke", "luke"),
    ("JHN", "John", "john"), ("ACT", "Acts", "acts"),
    ("ROM", "Romans", "romans"), ("1CO", "1 Corinthians", "1_corinthians"),
    ("2CO", "2 Corinthians", "2_corinthians"), ("GAL", "Galatians", "galatians"),
    ("EPH", "Ephesians", "ephesians"), ("PHP", "Philippians", "philippians"),
    ("COL", "Colossians", "colossians"), ("1TH", "1 Thessalonians", "1_thessalonians"),
    ("2TH", "2 Thessalonians", "2_thessalonians"), ("1TI", "1 Timothy", "1_timothy"),
    ("2TI", "2 Timothy", "2_timothy"), ("TIT", "Titus", "titus"),
    ("PHM", "Philemon", "philemon"), ("HEB", "Hebrews", "hebrews"),
    ("JAS", "James", "james"), ("1PE", "1 Peter", "1_peter"),
    ("2PE", "2 Peter", "2_peter"), ("1JN", "1 John", "1_john"),
    ("2JN", "2 John", "2_john"), ("3JN", "3 John", "3_john"),
    ("JUD", "Jude", "jude"), ("REV", "Revelation", "revelation"),
]


def clean_fragment(fragment: str) -> str:
    fragment = re.sub(r'<div class="verse">.*?</div>', '', fragment, flags=re.S | re.I)
    fragment = re.sub(r'<A name="\d+"></a>', '', fragment, flags=re.I)
    fragment = re.sub(r'<span class="p">\s*<br\s*/?>\s*<br\s*/?>\s*</span>', '</p><p>', fragment, flags=re.I)
    fragment = re.sub(r'<span class="bld">(.*?)</span>', r'<strong>\1</strong>', fragment, flags=re.S | re.I)
    fragment = re.sub(r'<span class="ital">(.*?)</span>', r'<em>\1</em>', fragment, flags=re.S | re.I)
    fragment = re.sub(r'<span class="greekheb">(.*?)</span>', r'<span lang="und">\1</span>', fragment, flags=re.S | re.I)
    fragment = fragment.replace('<div class="chap">', '')
    fragment = re.sub(r'</?a\b[^>]*>', '', fragment, flags=re.I)
    fragment = re.sub(r'<span\b[^>]*>(.*?)</span>', r'\1', fragment, flags=re.S | re.I)
    fragment = re.sub(r'</?div\b[^>]*>', '', fragment, flags=re.I)
    fragment = re.sub(r'<(script|style|iframe)\b.*?</\1>', '', fragment, flags=re.S | re.I)
    # Final allow-list: Cambridge only needs paragraphs, emphasis and spans
    # that preserve original-language text. Everything else is source noise.
    fragment = re.sub(r'</?(?!(?:p|strong|em|span)\b)[a-z][^>]*>', '', fragment, flags=re.I)
    fragment = re.sub(r'\s+', ' ', fragment).strip()
    paragraphs = [
        part.strip()
        for part in re.split(r'</?p\s*>', fragment, flags=re.I)
        if part.strip()
    ]
    return html.unescape(''.join(f'<p>{part}</p>' for part in paragraphs))


def fetch(url: str, path: Path, delay: float) -> str:
    if path.exists():
        return path.read_text(encoding='utf-8-sig')
    path.parent.mkdir(parents=True, exist_ok=True)
    request = urllib.request.Request(url, headers={'User-Agent': 'Verbo content importer (verbobiblia.com)'})
    with urllib.request.urlopen(request, timeout=45) as response:
        data = response.read().decode('utf-8-sig')
    path.write_text(data, encoding='utf-8')
    time.sleep(delay)
    return data


def deuteronomy_23_supplement(cache_dir: Path, delay: float) -> dict:
    """Recover the chapter omitted by the aggregate chapter source."""
    raw = fetch(DEUTERONOMY_OCR_URL, cache_dir / 'supplements' / 'deuteronomy-smith-1918.txt', delay)
    start_marker = '1 (2). I he Mutilated shall not Enter the Congregation.'
    end_marker = 'DEUTERONOMY XXIV. 1-3'
    start = raw.find(start_marker)
    end = raw.find(end_marker, start + len(start_marker))
    if start < 0 or end < 0:
        raise ValueError('Could not locate Deuteronomy 23 in the supplemental OCR')
    block = raw[start:end].replace('\f', '\n')
    kept = []
    for line in block.splitlines():
        line = re.sub(r'\s+', ' ', line).strip()
        if not line:
            kept.append('')
            continue
        if re.match(r'^(?:DEUTERONOMY XXIII|Google|UNIVERSITY OF|G\(|\d{1,3})$', line, re.I):
            continue
        kept.append(line)
    paragraphs = []
    current = []
    for line in kept:
        if not line:
            if current:
                paragraphs.append(' '.join(current))
                current = []
        elif current and current[-1].endswith('-'):
            current[-1] = current[-1][:-1] + line
        else:
            current.append(line)
    if current:
        paragraphs.append(' '.join(current))
    content = ''.join(f'<p>{html.escape(p)}</p>' for p in paragraphs if p)
    return {
        'id': 'cambridge-deu-23-1-25',
        'title': 'Deuteronomy 23:1-25',
        'author': 'George Adam Smith (1856–1942)',
        'sourceReference': 'The Book of Deuteronomy (1918), pp. 268–280',
        'reference': {'book': 'DEU', 'chapterStart': 23, 'verseStart': 1, 'chapterEnd': 23, 'verseEnd': 25},
        'content': content,
    }


VERSE_MAP = {
    ('1SA', 23, 29): (24, 1),
    ('2SA', 20, 26): (20, 25),
    ('2CH', 33, 25): (33, 24),
    ('ACT', 19, 41): (19, 40),
    ('2CO', 13, 14): (13, 13),
}


def canonical_reference(book_id: str, chapter: int, verse: int) -> tuple[int, int]:
    if book_id == '1SA' and chapter == 24:
        # Biblia Verbo follows the modern placement of KJV 23:29 at 24:1.
        # KJV 24:21-22 are combined in Verbo 24:22.
        return (24, verse + 1) if verse <= 20 else (24, 22)
    return VERSE_MAP.get((book_id, chapter, verse), (chapter, verse))


def parse_page(page: str, book_id: str, name: str, slug: str, chapter: int) -> list[dict]:
    body_match = re.search(r'<div class="padleft"><div class="vheading">.*?</div>(.*?)<div id="botbox">', page, flags=re.S | re.I)
    if not body_match:
        raise ValueError(f'Cambridge body missing: {name} {chapter}')
    body = body_match.group(1)
    markers = list(re.finditer(rf'<div class="versenum"><a href="/{re.escape(slug)}/{chapter}-(\d+)\.htm">[^<]+</a></div>', body, flags=re.I))
    if not markers:
        raise ValueError(f'No verse markers: {name} {chapter}')
    introduction = clean_fragment(body[:markers[0].start()])
    entries = []
    for pos, marker in enumerate(markers):
        verse = int(marker.group(1))
        end = markers[pos + 1].start() if pos + 1 < len(markers) else len(body)
        content = clean_fragment(body[marker.end():end])
        if pos == 0 and introduction:
            content = introduction + content
        if not content:
            continue
        target_chapter, target_verse = canonical_reference(book_id, chapter, verse)
        reference_label = f'{target_chapter}:{target_verse}'
        entries.append({
            'id': f'cambridge-{book_id.lower()}-{chapter}-{verse}',
            'title': f'{name} {reference_label}',
            'author': 'Cambridge Bible for Schools and Colleges',
            'sourceReference': f'{name} {chapter}:{verse}',
            'reference': {'book': book_id, 'chapterStart': target_chapter, 'verseStart': target_verse, 'chapterEnd': target_chapter, 'verseEnd': target_verse},
            'content': content,
        })
    return entries


def extend_section_ranges(entries: list[dict], chapters: dict[str, dict], name: str) -> None:
    """Extend a note through verses before the next actual Cambridge note."""
    for pos, entry in enumerate(entries):
        ref = entry['reference']
        following = entries[pos + 1]['reference'] if pos + 1 < len(entries) else None
        if following and following['chapterStart'] == ref['chapterStart'] and following['verseStart'] > ref['verseStart']:
            ref['verseEnd'] = following['verseStart'] - 1
        else:
            ref['verseEnd'] = len(chapters[str(ref['chapterStart'])])
        if ref['verseEnd'] > ref['verseStart']:
            entry['title'] = f"{name} {ref['chapterStart']}:{ref['verseStart']}-{ref['verseEnd']}"


def bible_chapters(book_id: str) -> dict[str, dict]:
    data = json.loads((BIBLES / f'{book_id}.json').read_text(encoding='utf-8'))
    return data['chapters']


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--cache-dir', type=Path, default=Path('/tmp/verbo-cambridge-source'))
    parser.add_argument('--delay', type=float, default=0.15)
    parser.add_argument('--books', nargs='*', help='Optional canonical IDs')
    args = parser.parse_args()
    selected = {x.upper() for x in args.books} if args.books else None
    manifest_books = []
    for book_id, name, slug in BOOKS:
        if selected and book_id not in selected:
            continue
        entries = []
        chapters = bible_chapters(book_id)
        for chapter in range(1, len(chapters) + 1):
            url = BASE_URL.format(slug=slug, chapter=chapter)
            page = fetch(url, args.cache_dir / slug / f'{chapter}.html', args.delay)
            entries.extend(parse_page(page, book_id, name, slug, chapter))
        if book_id == 'DEU' and not any(e['reference']['chapterStart'] == 23 for e in entries):
            entries.append(deuteronomy_23_supplement(args.cache_dir, args.delay))
            entries.sort(key=lambda e: (e['reference']['chapterStart'], e['reference']['verseStart'], e['id']))
        extend_section_ranges(entries, chapters, name)
        output = MODULE / 'books' / f'{book_id}.json'
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(json.dumps({'entries': entries}, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
        manifest_books.append({'id': book_id, 'name': name, 'file': f'books/{book_id}.json'})
        print(f'{book_id}: {len(entries)} entries')
    if selected:
        return
    manifest = {
        'schemaVersion': 2, 'id': 'cambridge', 'type': 'commentary',
        'name': SOURCE_NAME, 'abbreviation': 'Cambridge', 'language': 'en',
        'author': 'Various Cambridge scholars',
        'description': 'Public-domain commentary series published by Cambridge University Press (1878–1918), normalized for Verbo from chapter-level source pages.',
        'source': SOURCE_URL,
        'supplementalSources': [{
            'work': 'The Book of Deuteronomy', 'author': 'George Adam Smith',
            'edition': 'Cambridge University Press, 1918', 'source': DEUTERONOMY_OCR_URL,
            'license': 'Public Domain Mark 1.0', 'coverage': 'Deuteronomy 23',
        }],
        'license': 'Public Domain', 'books': manifest_books,
    }
    (MODULE / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
