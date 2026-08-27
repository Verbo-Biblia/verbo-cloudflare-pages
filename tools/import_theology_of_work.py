#!/usr/bin/env python3
"""Import the Theology of Work Bible Commentary (CC BY-NC 4.0) into Verbo's
commentary schema.

Source: https://www.theologyofwork.org/ (Bible Commentary section).
License applies ONLY to material carrying "Produced by TOW Project" /
"Produced by Individual TOW Project member" / "Produced by The High Calling"
(see https://www.theologyofwork.org/about/cc-license/). Every page fetched
for this import was checked for that attribution string (see
review/commentaries/theology-of-work/PROVENANCE.md) before being included.

Each Bible-book page on theologyofwork.org is a single TOW Project article
broken into <div class="short-wrap"> sections, each with an <h2>/<h3> heading
that names the book(s) and chapter:verse range(s) it discusses. TOW does not
comment verse-by-verse -- sections are editorial units, sometimes spanning
many chapters, occasionally spanning more than one Bible book at once (e.g.
Samuel/Kings/Chronicles, the Minor Prophets). This importer:

  1. Parses every <short-wrap> section's heading for Bible-book + chapter:verse
     citations (handles "Romans 1:1-17", "Genesis 1:26, 27; 5:1", bare chapter
     ranges "Job 4-23", cross-book ranges "1 Kings 11:41 - 2 Kings 25:26", and
     multi-book headings "Hosea 1:1-9, Micah 2:1-5").
  2. Emits ONE entry per (book, range) pair a section covers -- content is
     shared verbatim across books when a section genuinely discusses several
     books at once (documented in PROVENANCE.md, not a bug).
  3. Headings that name only a book with no chapter/verse (thematic overviews,
     introductions, conclusions, bibliographies) go to chapterStart=0 (Verbo's
     existing "editorial" convention, already used by the Lightfoot import).
  4. Footnote markers (<span class="footnote">[N]</span>) are resolved against
     the page's own endnote list and appended as a "Notes" block under each
     entry that actually cites them -- nothing is silently dropped.
  5. Strips TOW site chrome (nav, "Back to Table of Contents", related-article
     grids, cookie banners) -- these live outside the <hr>..next-short-wrap
     window this importer reads, verified per page in PROVENANCE.md.

Does NOT reproduce NRSV/NIV full-chapter text: TOW's own quotations are brief
(1-4 verses) and integral to the exposition, so they are kept as the source
author's argument requires (same policy already applied to Lightfoot/Trapp).
Any blockquote longer than BLOCKQUOTE_REVIEW_CHARS is flagged in the anomaly
report for manual review rather than silently included.
"""
import json
import os
import re
import sys
import glob
import html as htmlmod
import hashlib
from collections import defaultdict, OrderedDict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRATCH_PAGES = os.environ.get(
    "TOW_PAGES_DIR",
    "/tmp/claude-1000/-home-juan-Verbo-verbo-cloudflare-pages/6362101d-cc87-4107-9e81-751a13069d06/scratchpad/tow-pages",
)
OUT_DIR = os.path.join(ROOT, "biblia/modules/commentaries/theology-of-work")
REVIEW_DIR = os.path.join(ROOT, "review/commentaries/theology-of-work")
KJV_DIR = os.path.join(ROOT, "biblia/modules/bibles/kjv-strong/books")

BLOCKQUOTE_REVIEW_CHARS = 600

# ---------------------------------------------------------------------------
# Canonical book order + id/name table (matches existing Verbo commentaries)
# ---------------------------------------------------------------------------
BOOKS = [
    ("GEN", "Genesis"), ("EXO", "Exodus"), ("LEV", "Leviticus"), ("NUM", "Numbers"),
    ("DEU", "Deuteronomy"), ("JOS", "Joshua"), ("JDG", "Judges"), ("RUT", "Ruth"),
    ("1SA", "1 Samuel"), ("2SA", "2 Samuel"), ("1KI", "1 Kings"), ("2KI", "2 Kings"),
    ("1CH", "1 Chronicles"), ("2CH", "2 Chronicles"), ("EZR", "Ezra"), ("NEH", "Nehemiah"),
    ("EST", "Esther"), ("JOB", "Job"), ("PSA", "Psalms"), ("PRO", "Proverbs"),
    ("ECC", "Ecclesiastes"), ("SNG", "Song of Solomon"), ("ISA", "Isaiah"), ("JER", "Jeremiah"),
    ("LAM", "Lamentations"), ("EZK", "Ezekiel"), ("DAN", "Daniel"), ("HOS", "Hosea"),
    ("JOL", "Joel"), ("AMO", "Amos"), ("OBA", "Obadiah"), ("JON", "Jonah"), ("MIC", "Micah"),
    ("NAM", "Nahum"), ("HAB", "Habakkuk"), ("ZEP", "Zephaniah"), ("HAG", "Haggai"),
    ("ZEC", "Zechariah"), ("MAL", "Malachi"), ("MAT", "Matthew"), ("MRK", "Mark"),
    ("LUK", "Luke"), ("JHN", "John"), ("ACT", "Acts"), ("ROM", "Romans"),
    ("1CO", "1 Corinthians"), ("2CO", "2 Corinthians"), ("GAL", "Galatians"),
    ("EPH", "Ephesians"), ("PHP", "Philippians"), ("COL", "Colossians"),
    ("1TH", "1 Thessalonians"), ("2TH", "2 Thessalonians"), ("1TI", "1 Timothy"),
    ("2TI", "2 Timothy"), ("TIT", "Titus"), ("PHM", "Philemon"), ("HEB", "Hebrews"),
    ("JAS", "James"), ("1PE", "1 Peter"), ("2PE", "2 Peter"), ("1JN", "1 John"),
    ("2JN", "2 John"), ("3JN", "3 John"), ("JUD", "Jude"), ("REV", "Revelation"),
]
BOOK_ORDER = {b: i for i, (b, _) in enumerate(BOOKS)}
BOOK_NAME = dict(BOOKS)

# Surface forms seen on theologyofwork.org (+ standard abbreviations) mapped
# to canonical id. Longest-first is enforced when building the regex.
ALIASES = {
    "Genesis": "GEN", "Gen": "GEN", "Gen.": "GEN",
    "Exodus": "EXO", "Exod": "EXO", "Exod.": "EXO",
    "Leviticus": "LEV", "Lev": "LEV", "Lev.": "LEV",
    "Numbers": "NUM", "Num": "NUM", "Num.": "NUM",
    "Deuteronomy": "DEU", "Deut": "DEU", "Deut.": "DEU",
    "Joshua": "JOS", "Josh": "JOS", "Josh.": "JOS",
    "Judges": "JDG", "Judg": "JDG", "Judg.": "JDG",
    "Ruth": "RUT",
    "1 Samuel": "1SA", "1 Sam": "1SA", "1 Sam.": "1SA", "I Samuel": "1SA",
    "2 Samuel": "2SA", "2 Sam": "2SA", "2 Sam.": "2SA", "II Samuel": "2SA",
    "1 Kings": "1KI", "1 Kgs": "1KI", "1 Kgs.": "1KI", "I Kings": "1KI",
    "2 Kings": "2KI", "2 Kgs": "2KI", "2 Kgs.": "2KI", "II Kings": "2KI",
    "1 Chronicles": "1CH", "1 Chron": "1CH", "1 Chron.": "1CH", "I Chronicles": "1CH",
    "2 Chronicles": "2CH", "2 Chron": "2CH", "2 Chron.": "2CH", "II Chronicles": "2CH",
    "Ezra": "EZR",
    "Nehemiah": "NEH", "Neh": "NEH", "Neh.": "NEH",
    "Esther": "EST",
    "Job": "JOB",
    "Psalms": "PSA", "Psalm": "PSA", "Ps": "PSA", "Ps.": "PSA", "Pss": "PSA", "Pss.": "PSA",
    "Proverbs": "PRO", "Prov": "PRO", "Prov.": "PRO",
    "Ecclesiastes": "ECC", "Eccl": "ECC", "Eccl.": "ECC",
    "Song of Songs": "SNG", "Song of Solomon": "SNG", "Song": "SNG", "Song.": "SNG",
    "Isaiah": "ISA", "Isa": "ISA", "Isa.": "ISA",
    "Jeremiah": "JER", "Jer": "JER", "Jer.": "JER",
    "Lamentations": "LAM", "Lam": "LAM", "Lam.": "LAM",
    "Ezekiel": "EZK", "Ezek": "EZK", "Ezek.": "EZK",
    "Daniel": "DAN", "Dan": "DAN", "Dan.": "DAN",
    "Hosea": "HOS", "Hos": "HOS", "Hos.": "HOS",
    "Joel": "JOL",
    "Amos": "AMO",
    "Obadiah": "OBA", "Obad": "OBA", "Obad.": "OBA",
    "Jonah": "JON",
    "Micah": "MIC", "Mic": "MIC", "Mic.": "MIC",
    "Nahum": "NAM", "Nah": "NAM", "Nah.": "NAM",
    "Habakkuk": "HAB", "Hab": "HAB", "Hab.": "HAB",
    "Zephaniah": "ZEP", "Zeph": "ZEP", "Zeph.": "ZEP",
    "Haggai": "HAG", "Hag": "HAG", "Hag.": "HAG",
    "Zechariah": "ZEC", "Zech": "ZEC", "Zech.": "ZEC",
    "Malachi": "MAL", "Mal": "MAL", "Mal.": "MAL",
    "Matthew": "MAT", "Matt": "MAT", "Matt.": "MAT",
    "Mark": "MRK",
    "Luke": "LUK",
    "John": "JHN",
    "Acts": "ACT",
    "Romans": "ROM", "Rom": "ROM", "Rom.": "ROM",
    "1 Corinthians": "1CO", "1 Cor": "1CO", "1 Cor.": "1CO", "I Corinthians": "1CO",
    "2 Corinthians": "2CO", "2 Cor": "2CO", "2 Cor.": "2CO", "II Corinthians": "2CO",
    "Galatians": "GAL", "Gal": "GAL", "Gal.": "GAL",
    "Ephesians": "EPH", "Eph": "EPH", "Eph.": "EPH",
    "Philippians": "PHP", "Phil": "PHP", "Phil.": "PHP",
    "Colossians": "COL", "Col": "COL", "Col.": "COL",
    "1 Thessalonians": "1TH", "1 Thess": "1TH", "1 Thess.": "1TH", "I Thessalonians": "1TH",
    "2 Thessalonians": "2TH", "2 Thess": "2TH", "2 Thess.": "2TH", "II Thessalonians": "2TH",
    "1 Timothy": "1TI", "1 Tim": "1TI", "1 Tim.": "1TI", "I Timothy": "1TI",
    "2 Timothy": "2TI", "2 Tim": "2TI", "2 Tim.": "2TI", "II Timothy": "2TI",
    "Titus": "TIT",
    "Philemon": "PHM", "Phlm": "PHM", "Phlm.": "PHM",
    "Hebrews": "HEB", "Heb": "HEB", "Heb.": "HEB",
    "James": "JAS", "Jas": "JAS", "Jas.": "JAS",
    "1 Peter": "1PE", "1 Pet": "1PE", "1 Pet.": "1PE", "I Peter": "1PE",
    "2 Peter": "2PE", "2 Pet": "2PE", "2 Pet.": "2PE", "II Peter": "2PE",
    "1 John": "1JN", "I John": "1JN",
    "2 John": "2JN", "II John": "2JN",
    "3 John": "3JN", "III John": "3JN",
    "Jude": "JUD",
    "Revelation": "REV", "Rev": "REV", "Rev.": "REV",
}

# Pages that mix multiple books need their group split at the section level
# (handled generically -- each heading names its own book(s)).
PAGES = [
    ("GEN1", "old-testament/genesis-1-11-and-work/"),
    ("GEN2", "old-testament/genesis-12-50-and-work/"),
    ("EXO", "old-testament/exodus-and-work/"),
    ("LEV", "old-testament/leviticus-and-work/"),
    ("NUM", "old-testament/numbers-and-work/"),
    ("DEU", "old-testament/deuteronomy-and-work/"),
    ("JOSJDG", "old-testament/joshua-judges-and-work/"),
    ("RUT", "old-testament/ruth-and-work/"),
    ("SKC", "old-testament/samuel-kings-chronicles-and-work/"),
    ("EZR", "old-testament/ezra-nehemiah-esther/"),
    ("NEH", "old-testament/ezra-nehemiah-esther/nehemiah/"),
    ("EST", "old-testament/ezra-nehemiah-esther/esther/"),
    ("JOB", "old-testament/job/"),
    ("PSA", "old-testament/psalms-and-work/"),
    ("PRO", "old-testament/proverbs/"),
    ("ECC", "old-testament/ecclesiastes/"),
    ("SNG", "old-testament/song-of-songs/"),
    ("ISA", "old-testament/isaiah/"),
    ("JERLAM", "old-testament/jeremiah-lamentations/"),
    ("EZK", "old-testament/ezekiel/"),
    ("DAN", "old-testament/daniel/"),
    ("TWELVE1", "old-testament/the-twelve-prophets/faith-and-work-before-the-exilehosea-amos-obadiah-joel-micah/"),
    ("TWELVE2", "old-testament/the-twelve-prophets/jonah-and-gods-blessing-for-all-nations/"),
    ("TWELVE3", "old-testament/the-twelve-prophets/faith-and-work-during-the-exilenahum-habakkuk-zephaniah/"),
    ("TWELVE4", "old-testament/the-twelve-prophets/faithful-work-after-the-exilehaggai-zechariah-malachi/"),
    ("MAT", "new-testament/matthew/"),
    ("MRK", "new-testament/mark/"),
    ("LUK", "new-testament/luke/"),
    ("JHN", "new-testament/john/"),
    ("ACT", "new-testament/acts/"),
    ("ROM", "new-testament/romans-and-work/"),
    ("1CO", "new-testament/1-corinthians/"),
    ("2CO", "new-testament/2-corinthians/"),
    ("GAL", "new-testament/galatians-ephesians-philippians/galatians-and-work/"),
    ("EPH", "new-testament/galatians-ephesians-philippians/ephesians-and-work/"),
    ("PHP", "new-testament/galatians-ephesians-philippians/philippians-and-work/"),
    ("COL", "new-testament/colossians-philemon/colossians-and-work/"),
    ("PHM", "new-testament/colossians-philemon/philemon/"),
    ("THESS", "new-testament/thessalonians/"),
    ("1TI", "new-testament/pastoral-epistles/1-timothy-working-for-order-in-gods-household/"),
    ("2TI", "new-testament/pastoral-epistles/2-timothy-encouragement-for-a-faithful-worker/"),
    ("TIT", "new-testament/pastoral-epistles/titus-working-for-good-deeds/"),
    ("HEB", "new-testament/hebrews/"),
    ("JAS", "new-testament/general-epistles/james-faith-works/"),
    ("1PE", "new-testament/general-epistles/1-peter-serving-the-world-as-resident-alien-priests/"),
    ("2PE", "new-testament/general-epistles/2-peter-work-and-new-creation/"),
    ("1JN", "new-testament/general-epistles/1-john-walking-in-the-light/"),
    ("2JN", "new-testament/general-epistles/2-john-and-work/"),
    ("3JN", "new-testament/general-epistles/3-john-and-work/"),
    ("JUD", "new-testament/general-epistles/jude/"),
    ("REV", "new-testament/revelation/"),
]

ANOMALIES = []


def log_anomaly(kind, where, detail):
    ANOMALIES.append({"kind": kind, "where": where, "detail": detail})


# ---------------------------------------------------------------------------
# KJV chapter/verse-count table (for filling in bare "whole chapter" refs)
# ---------------------------------------------------------------------------
# Verbo's commentary book ids mostly match the kjv-strong bible module's own
# file names, EXCEPT Nahum: the commentary convention used across the whole
# registry.json (matched here so this module's ids line up with every other
# commentary, per the codebase's own established practice) is "NAM", while
# the kjv-strong bible module happens to file it as "NAH.json" on disk.
KJV_FILE_OVERRIDE = {"NAM": "NAH"}


def load_verse_counts():
    counts = {}
    for book_id, _ in BOOKS:
        disk_id = KJV_FILE_OVERRIDE.get(book_id, book_id)
        path = os.path.join(KJV_DIR, f"{disk_id}.json")
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        chapters = data["chapters"]
        counts[book_id] = {
            int(ch): max(int(v) for v in verses.keys())
            for ch, verses in chapters.items()
        }
    return counts


def last_chapter(counts, book_id):
    return max(counts[book_id].keys())


def last_verse(counts, book_id, chapter):
    chs = counts[book_id]
    if chapter in chs:
        return chs[chapter]
    return chs[max(chs.keys())]


# ---------------------------------------------------------------------------
# Reference parsing
# ---------------------------------------------------------------------------
def build_alias_regex():
    names = sorted(ALIASES.keys(), key=len, reverse=True)
    escaped = [re.escape(n) for n in names]
    return re.compile(r'\b(' + '|'.join(escaped) + r')\b')


ALIAS_RE = build_alias_regex()

# A "point" token: chapter[:verse](-[chapter:]verse)?
POINT_RE = re.compile(
    r'(\d{1,3})(?::(\d{1,3}))?(?:\s*[-–—]\s*(?:(\d{1,3}):)?(\d{1,3}))?'
)

# Books with exactly one chapter: a bare number in their heading references
# ("2 John 1-11", "Obadiah 21") is always a VERSE, never a chapter number.
SINGLE_CHAPTER_BOOKS = {"OBA", "PHM", "2JN", "3JN", "JUD"}


def split_into_book_segments(text):
    """Return list of (book_id, segment_text) covering the whole heading,
    split at each recognized book-name occurrence. Text before the first
    book name (if any) is discarded (usually just descriptive title words).
    """
    matches = list(ALIAS_RE.finditer(text))
    segments = []
    for i, m in enumerate(matches):
        book_id = ALIASES[m.group(1)]
        seg_start = m.end()
        seg_end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        segments.append((book_id, text[seg_start:seg_end]))
    return segments


def parse_segment_span(book_id, seg_text, counts):
    """Extract (chapterStart, verseStart, chapterEnd, verseEnd) from the text
    following one book-name mention, or None if no numeric reference at all
    (pure thematic mention of the book with no chapter)."""
    # Only look at the leading punctuation-connected numeric run, so we don't
    # accidentally swallow numbers that belong to the NEXT unrelated title
    # text (defensive: stop at first sentence-like break after some digits
    # have already been seen, if any).
    seg_text = seg_text.strip()
    if not seg_text or not seg_text[0] in ':,;. 0123456789-–—([':
        # book mentioned with no adjoining reference at all (e.g. "(Proverbs)"
        # closes immediately, or plain "Job" with trailing text) -- still try,
        # POINT_RE below will simply fail to match if nothing numeric follows
        pass
    points = []  # (chapter:int, verse:int|None)
    single_chapter = book_id in SINGLE_CHAPTER_BOOKS
    last_explicit_chapter = None
    pos = 0
    while pos < len(seg_text):
        m = POINT_RE.search(seg_text, pos)
        if not m:
            break
        # stop scanning once we hit a run of letters that looks like a new
        # clause unrelated to references (heuristic: a ')' or a second book
        # name would already have ended the segment upstream)
        c1, v1, c2, v2 = m.groups()
        c1 = int(c1)
        if v1 is not None:
            # explicit "chapter:verse" -- anchors what chapter bare numbers
            # after it (until the next explicit chapter:verse) belong to.
            last_explicit_chapter = c1
            points.append((c1, int(v1)))
            if c2 is not None:
                last_explicit_chapter = int(c2)
                points.append((int(c2), int(v2)))
            elif v2 is not None:
                points.append((c1, int(v2)))
        elif single_chapter:
            # this book has only one chapter -- bare numbers are verses.
            points.append((1, c1))
            if v2 is not None and c2 is None:
                points.append((1, int(v2)))
        elif last_explicit_chapter is not None:
            # continuation of the most recent explicit chapter (e.g. the
            # "18-20" in "1 Timothy 1:1-11, 18-20" means verses 18-20 of
            # chapter 1, not chapters 18-20).
            points.append((last_explicit_chapter, c1))
            if c2 is not None:
                last_explicit_chapter = int(c2)
                points.append((int(c2), int(v2)))
            elif v2 is not None:
                points.append((last_explicit_chapter, int(v2)))
        else:
            # no chapter context established yet -- a genuine bare chapter
            # (range), e.g. "Job 4-23" or "Ezekiel 1-17".
            points.append((c1, None))
            if c2 is not None:
                points.append((int(c2), None))
            elif v2 is not None:
                points.append((int(v2), None))
        pos = m.end()
        # only keep scanning through a short run of separators (",", ";",
        # whitespace) -- once we hit 2+ consecutive letters that aren't part
        # of "ff." we've left the reference list
        rest = seg_text[pos:pos + 6]
        if not re.match(r'^[,;\sA-Za-z.]*[\d]', rest) and not re.match(r'^\s*(ff\.)?\s*[,;)]', rest):
            break
    if not points:
        return None
    # normalize bare-chapter points to full-chapter spans at use time
    def as_start(pt):
        c, v = pt
        return (c, v if v is not None else 1)

    def as_end(pt):
        c, v = pt
        return (c, v if v is not None else last_verse(counts, book_id, c))

    starts = [as_start(p) for p in points]
    ends = [as_end(p) for p in points]
    cs, vs = min(starts)
    ce, ve = max(ends)
    return (cs, vs, ce, ve)


CROSS_BOOK_RE = re.compile(
    r'\b(' + '|'.join(re.escape(n) for n in sorted(ALIASES, key=len, reverse=True)) + r')'
    r'\s+(\d{1,3})(?::(\d{1,3}))?\s*[-–—]\s*'
    r'\b(' + '|'.join(re.escape(n) for n in sorted(ALIASES, key=len, reverse=True)) + r')'
    r'\s+(\d{1,3})(?::(\d{1,3}))?'
)


# "1 & 2 Thessalonians" / "1 and 2 Peter" -> spell out both books so the
# alias regex (which only ever matches one fully-written name at a time)
# catches both instead of just the second.
COMBINED_NUM_RE = re.compile(r'\b1 (?:&|and) 2 ([A-Z][a-zA-Z]+)\b')


def expand_combined_book_refs(text):
    return COMBINED_NUM_RE.sub(lambda m: f'1 {m.group(1)} and 2 {m.group(1)}', text)


def in_parens(text, pos):
    """True if character offset `pos` in `text` falls inside a (...) span."""
    depth = 0
    for i, ch in enumerate(text):
        if i == pos:
            return depth > 0
        if ch == '(':
            depth += 1
        elif ch == ')':
            depth = max(0, depth - 1)
    return False


CONJOINED_RE = re.compile(r'\s*(?:and|&|,)\s*(?:and\s+)?')


def conjoined_with_a_book(text, match_end):
    """True if a book match is immediately followed by "and <OtherBook>" /
    "& <OtherBook>" -- a strong signal this is a deliberate multi-book
    mention ("Ezra and Nehemiah Together"), not a person/word collision."""
    m = CONJOINED_RE.match(text, match_end)
    if not m:
        return False
    return bool(ALIAS_RE.match(text, m.end()))


def parse_heading_references(heading_text, counts, where):
    """Returns list of (book_id, chapterStart, verseStart, chapterEnd, verseEnd)
    or [] if the heading names no book at all."""
    text = expand_combined_book_refs(heading_text)

    results = []
    result_positions = []  # matching-index positions of each result's book match, for parens check
    consumed_spans = []

    for m in CROSS_BOOK_RE.finditer(text):
        b1, c1, v1, b2, c2, v2 = m.groups()
        if b1 not in ALIASES or b2 not in ALIASES:
            continue
        id1, id2 = ALIASES[b1], ALIASES[b2]
        if id1 == id2 or BOOK_ORDER[id2] != BOOK_ORDER[id1] + 1:
            # only trust this as a genuine cross-book range when it's two
            # *adjacent* canonical books -- otherwise treat as coincidence
            continue
        c1 = int(c1)
        v1 = int(v1) if v1 else 1
        c2 = int(c2)
        v2 = int(v2) if v2 else last_verse(counts, id2, c2)
        results.append((id1, c1, v1, last_chapter(counts, id1), last_verse(counts, id1, last_chapter(counts, id1))))
        results.append((id2, 1, 1, c2, v2))
        consumed_spans.append((m.start(), m.end()))
        log_anomaly("cross-book-range", where, f"{m.group(0)!r} -> {id1} {c1}:{v1}-end, {id2} 1:1-{c2}:{v2}")

    # mask out consumed spans so segment splitting doesn't re-read them
    if consumed_spans:
        chars = list(text)
        for s, e in consumed_spans:
            for i in range(s, e):
                chars[i] = ' '
        text = ''.join(chars)

    for m in ALIAS_RE.finditer(text):
        book_id = ALIASES[m.group(1)]
        seg_start = m.end()
        # segment text runs to the next book-name occurrence or end of string
        nxt = ALIAS_RE.search(text, seg_start)
        seg_end = nxt.start() if nxt else len(text)
        seg_text = text[seg_start:seg_end]
        span = parse_segment_span(book_id, seg_text, counts)
        if span is None:
            results.append((book_id, 0, 0, 0, 0))
            result_positions.append((m.start(), m.end()))
        else:
            cs, vs, ce, ve = span
            if ce < cs or (ce == cs and ve < vs):
                log_anomaly("bad-range-order", where, f"{book_id} {cs}:{vs}-{ce}:{ve} in {heading_text!r}")
                continue
            if ce > last_chapter(counts, book_id):
                log_anomaly("chapter-out-of-range", where, f"{book_id} ch{ce} in {heading_text!r}")
                continue
            results.append((book_id, cs, vs, ce, ve))
            result_positions.append((m.start(), m.end()))

    filtered = []
    for r, (mpos, mend) in zip(results, result_positions):
        book_id, cs, vs, ce, ve = r
        if (cs, vs, ce, ve) == (0, 0, 0, 0) and not in_parens(text, mpos) \
                and not conjoined_with_a_book(text, mend):
            other_book_has_numbers = any(
                r2[0] != book_id and r2[1:] != (0, 0, 0, 0) for r2 in results
            )
            if other_book_has_numbers:
                log_anomaly(
                    "suppressed-bare-mention", where,
                    f"{book_id!r} bare mention outside parens in {heading_text!r}, "
                    f"another book already has a numbered reference -- likely a "
                    f"person/word name collision, not a citation",
                )
                continue
        filtered.append(r)

    # drop a bare (0,0,0,0) entry for a book when a numbered range for that
    # SAME book is also present from this same heading (the bare mention was
    # just descriptive title text, e.g. "The Judges (Judges 3-16)")
    numbered_books = {r[0] for r in filtered if r[1:] != (0, 0, 0, 0)}
    final = [
        r for r in filtered
        if not (r[1:] == (0, 0, 0, 0) and r[0] in numbered_books)
    ]

    # de-duplicate exact repeats (can happen if cross-book regex AND segment
    # split both matched, rare)
    dedup = []
    seen = set()
    for r in final:
        if r in seen:
            continue
        seen.add(r)
        dedup.append(r)
    return dedup


# ---------------------------------------------------------------------------
# HTML section extraction
# ---------------------------------------------------------------------------
SECTION_RE = re.compile(
    r'<div class="short-wrap[^"]*" id="([^"]*)">\s*'
    r'<h[23]><a href="[^"]*">([^<]*)</a></h[23]>.*?<hr>(.*?)'
    r'(?=<div class="short-wrap|<div class="allfootnoteinfo|$)',
    re.S,
)
FOOTNOTE_SPAN_RE = re.compile(r'<span class="footnote">\[(\d+)\]</span>')
FOOTNOTEINFO_RE = re.compile(r'<div class="footnoteinfo">\s*(.*?)\s*</div>', re.S)
NAV_HEADING_RE = re.compile(r'^(Continue to|Go to)\b', re.I)
TAG_STRIP_RE = re.compile(r'</?(?:div|span)(?:\s[^>]*)?>')
A_TAG_RE = re.compile(r'<a\b[^>]*>(.*?)</a>', re.S)
ALLOWED_TAG_RE = re.compile(
    r'</?(?!p\b|blockquote\b|em\b|strong\b|ul\b|ol\b|li\b|sup\b|sub\b|i\b|b\b|br\s*/?)[a-zA-Z][^>]*>'
)
WS_RE = re.compile(r'[ \t]+')
BLANK_P_RE = re.compile(r'<p>\s*</p>')


def extract_page_title_produced_by(html_text):
    """Confirms + returns the 'Produced by ...' attribution string that gates
    CC BY-NC 4.0 eligibility for this page, or None if absent (page must then
    be excluded per Juan's licensing rule)."""
    m = re.search(r'Bible Commentary\s*/\s*Produced by ([^<]+)', html_text)
    if m:
        return htmlmod.unescape(m.group(1).strip())
    m = re.search(r'Produced by (TOW Project|Individual TOW Project member|The High Calling)', html_text)
    return htmlmod.unescape(m.group(1).strip()) if m else None


def extract_footnotes(html_text):
    idx = html_text.find('allfootnoteinfo')
    if idx == -1:
        return []
    tail = html_text[idx:]
    notes = []
    for m in FOOTNOTEINFO_RE.finditer(tail):
        notes.append(clean_html_fragment(m.group(1)))
    return notes


# A blockquote is treated as a standalone Bible-text excerpt (and stripped,
# per Juan's "don't embed whole translated Bible blocks -- Verbo already has
# the user's own chosen translation" rule) when its text ends in a
# parenthetical "(Book chapter:verse...)" citation -- TOW's own convention
# for setting apart a quoted passage from its surrounding argument. Brief
# quotes woven directly into a sentence (not a separate <blockquote>) are
# left alone, matching the precedent already set for Lightfoot/Trapp.
SCRIPTURE_CITE_RE = re.compile(
    r'\(([1-3]?\s?[A-Z][a-zA-Z.]{2,18}\.?\s\d{1,3}:\d{1,3}(?:[-–]\d{1,3})?)(?:,[^()]*)?\)'
)
BLOCKQUOTE_BLOCK_RE = re.compile(r'<blockquote>(.*?)</blockquote>', re.S)

# Manually verified (see review/commentaries/theology-of-work/PROVENANCE.md):
# these specific sections quote a Bible passage in a <blockquote> WITHOUT any
# parenthetical chapter:verse citation attached (the section heading already
# names the passage, so TOW didn't repeat it inline) -- the generic
# citation-pattern detector below can't catch these, so they're forced.
# Every other long blockquote in the corpus was individually read and
# confirmed to be TOW's own prose or a secondary-source quote, not Scripture.
FORCE_STRIP_UNCITED_SCRIPTURE = {
    "people-fall-into-sin-in-work-genesis-31-24": "Génesis 3:1-24",
    "gods-justice-the-solution-to-our-false-judgments-romans-321-26": "Romanos 3:21-26",
    "faith-faithfulness-the-entry-to-gods-justice-romans-327-31": "Romanos 3:27-31",
    "god-worked-in-creation-making-humans-workers-in-his-image-colossians-1114": "Génesis 1:26-28",
}


def strip_scripture_blockquotes(frag, where):
    forced_cite = next(
        (v for k, v in FORCE_STRIP_UNCITED_SCRIPTURE.items() if k in where), None
    )

    def repl(m):
        inner = m.group(1)
        text = re.sub(r'<[^>]+>', ' ', inner)
        text = htmlmod.unescape(text)
        text = re.sub(r'\s+', ' ', text).strip()
        cites = SCRIPTURE_CITE_RE.findall(text)
        if not cites and forced_cite:
            cites = [forced_cite]
        if not cites:
            return m.group(0)
        log_anomaly("stripped-scripture-blockquote", where,
                    f"{len(text)} chars, cites={cites!r}")
        cite_list = "; ".join(dict.fromkeys(cites))  # de-dupe, keep order
        return f'<p><em>[Cita bíblica: {cite_list} — consulta tu Biblia activa]</em></p>'
    return BLOCKQUOTE_BLOCK_RE.sub(repl, frag)


def clean_html_fragment(frag, footnotes=None, used_notes=None, where="?"):
    frag = strip_scripture_blockquotes(frag, where)
    frag = A_TAG_RE.sub(lambda m: m.group(1), frag)  # unwrap links, keep text
    if footnotes is not None:
        def repl_fn(m):
            n = int(m.group(1))
            if used_notes is not None:
                used_notes.append(n)
            return f'<sup>[{n}]</sup>'
        frag = FOOTNOTE_SPAN_RE.sub(repl_fn, frag)
    else:
        frag = FOOTNOTE_SPAN_RE.sub(lambda m: f'<sup>[{m.group(1)}]</sup>', frag)
    frag = TAG_STRIP_RE.sub('', frag)
    frag = ALLOWED_TAG_RE.sub('', frag)
    frag = BLANK_P_RE.sub('', frag)
    frag = htmlmod.unescape(frag)
    frag = frag.replace('­', '')  # soft hyphen: print-justification
    # artifact from the source book's line-wrapping, not real content
    frag = WS_RE.sub(' ', frag)
    frag = re.sub(r'\n{3,}', '\n\n', frag)
    return frag.strip()


def check_anomalous_text(content, where):
    if '�' in content:
        log_anomaly("replacement-char", where, "U+FFFD found in content")
    for bad in ('Ã¢â‚¬', 'Â', 'â€™', 'â€œ'):
        if bad in content:
            log_anomaly("mojibake", where, f"{bad!r} found in content")
    for marker in ('Back to Table of Contents', 'cookieconsent', 'googletagmanager',
                   'gtm.start', 'Please click here to read our commentary'):
        if marker in content:
            log_anomaly("leaked-site-chrome", where, f"{marker!r} found in content")
    for m in re.finditer(r'<blockquote>(.*?)</blockquote>', content, re.S):
        text = re.sub(r'<[^>]+>', '', m.group(1))
        if len(text) > BLOCKQUOTE_REVIEW_CHARS:
            log_anomaly("long-blockquote", where, f"{len(text)} chars -- review for over-quoting")


def extract_sections(html_text, page_key):
    bm = html_text.find('body-main')
    if bm == -1:
        log_anomaly("no-body-main", page_key, "page has no body-main container")
        return None, []
    end = html_text.find('allfootnoteinfo', bm)
    if end == -1:
        end = len(html_text)
    body = html_text[bm:end]

    produced_by = extract_page_title_produced_by(html_text)

    footnotes = extract_footnotes(html_text)

    first_div = body.find('<div class="short-wrap')
    sections = []
    if first_div == -1:
        # a handful of the shortest books (Philemon, 1 John, Jude) are one
        # continuous flowing essay with no <short-wrap> sub-sections at all
        # -- use the page's own <h1> title (which always names the book) as
        # the single entry's heading, filed at chapter 0.
        h1 = re.search(r'<h1>([^<]*)</h1>', html_text)
        title = htmlmod.unescape(h1.group(1)).replace('­', '').strip() if h1 else page_key
        content_start = body.find('>', body.find('body-main')) + 1
        sections.append({
            "id": "whole-book",
            "heading": title,
            "content_raw": body[content_start:],
        })
        return {"produced_by": produced_by, "footnotes": footnotes}, sections

    if first_div > 0:
        intro_frag = body[body.find('>', body.find('body-main')) + 1:first_div]
        intro_clean = clean_html_fragment(intro_frag)
        if len(intro_clean) > 80:
            sections.append({
                "id": "introduction",
                "heading": "Introduction",
                "content_raw": intro_frag,
            })

    for m in SECTION_RE.finditer(body):
        sec_id, heading_raw, content_raw = m.groups()
        heading = htmlmod.unescape(heading_raw).replace('­', '').strip()
        if NAV_HEADING_RE.match(heading):
            continue
        sections.append({"id": sec_id, "heading": heading, "content_raw": content_raw})

    return {"produced_by": produced_by, "footnotes": footnotes}, sections


# ---------------------------------------------------------------------------
# Entry construction + file writing
# ---------------------------------------------------------------------------
def slugify(text, maxlen=48):
    s = re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')
    return s[:maxlen].rstrip('-') or "section"


def build_entries_for_page(page_key, html_text, counts):
    meta, sections = extract_sections(html_text, page_key)
    if meta is None:
        return []
    if meta["produced_by"] not in ("TOW Project", "Individual TOW Project member", "The High Calling"):
        log_anomaly("license-gate-failed", page_key,
                    f"page attribution was {meta['produced_by']!r}, excluding entire page")
        return []

    footnotes = meta["footnotes"]
    entries = []
    for sec in sections:
        used_notes = []
        content = clean_html_fragment(sec["content_raw"], footnotes=footnotes, used_notes=used_notes,
                                       where=f"{page_key}/{sec['id']}")
        if not content or len(content) < 20:
            continue
        check_anomalous_text(content, f"{page_key}/{sec['id']}")

        notes_used_unique = sorted(set(n for n in used_notes if 1 <= n <= len(footnotes)))
        if notes_used_unique:
            notes_html = "".join(
                f'<li>[{n}] {footnotes[n - 1]}</li>' for n in notes_used_unique
            )
            content += f'<p><strong>Notes</strong></p><ul>{notes_html}</ul>'

        refs = parse_heading_references(sec["heading"], counts, f"{page_key}/{sec['id']}")
        if not refs:
            continue
        for book_id, cs, vs, ce, ve in refs:
            entries.append({
                "book": book_id,
                "title": sec["heading"],
                "reference": {
                    "book": book_id, "chapterStart": cs, "verseStart": vs,
                    "chapterEnd": ce, "verseEnd": ve,
                },
                "content": content,
                "slug": sec["id"] or slugify(sec["heading"]),
            })
    return entries


GROUP_WIDE_HEADINGS = {
    # headings with no book-specific name at all, on pages covering several
    # books -- these apply to every book in that page's group (see SKC's 3
    # NO-BOOK-DETECTED headings: "Introduction to Samuel, Kings and
    # Chronicles" etc.)
    "SKC": ["1SA", "2SA", "1KI", "2KI", "1CH", "2CH"],
}


def build_all_entries(counts):
    per_book = defaultdict(list)
    seq_counter = defaultdict(int)
    for page_key, url_path in PAGES:
        path = os.path.join(SCRATCH_PAGES, f"{page_key}.html")
        with open(path, encoding="utf-8", errors="replace") as f:
            html_text = f.read()
        entries = build_entries_for_page(page_key, html_text, counts)

        # group-wide fallback for headings TOW gave no book-specific name to
        if page_key in GROUP_WIDE_HEADINGS:
            meta, sections = extract_sections(html_text, page_key)
            if meta and meta["produced_by"] in ("TOW Project", "Individual TOW Project member", "The High Calling"):
                for sec in sections:
                    if parse_heading_references(sec["heading"], counts, page_key):
                        continue  # already handled above
                    content = clean_html_fragment(sec["content_raw"], footnotes=meta["footnotes"])
                    if not content or len(content) < 20:
                        continue
                    for book_id in GROUP_WIDE_HEADINGS[page_key]:
                        entries.append({
                            "book": book_id,
                            "title": sec["heading"],
                            "reference": {
                                "book": book_id, "chapterStart": 0, "verseStart": 0,
                                "chapterEnd": 0, "verseEnd": 0,
                            },
                            "content": content,
                            "slug": sec["id"] or slugify(sec["heading"]),
                        })

        for e in entries:
            book_id = e["book"]
            seq_counter[book_id] += 1
            n = seq_counter[book_id]
            slug = e["slug"]
            eid = f"tow-{book_id.lower()}-{slug}" if slug != "section" else f"tow-{book_id.lower()}-{n}"
            e["id"] = eid
            per_book[book_id].append(e)
    return per_book


def dedupe_ids(per_book):
    for book_id, entries in per_book.items():
        seen = {}
        for e in entries:
            base = e["id"]
            seen[base] = seen.get(base, 0) + 1
            if seen[base] > 1:
                e["id"] = f"{base}-{seen[base]}"


def write_module(per_book, counts):
    os.makedirs(os.path.join(OUT_DIR, "books"), exist_ok=True)
    os.makedirs(REVIEW_DIR, exist_ok=True)

    manifest_books = []
    coverage = {"module": "theology-of-work", "books": []}

    for book_id, _ in BOOKS:
        entries = per_book.get(book_id, [])
        if not entries:
            continue
        entries.sort(key=lambda e: (
            e["reference"]["chapterStart"], e["reference"]["verseStart"],
            e["reference"]["chapterEnd"], e["reference"]["verseEnd"],
        ))
        out_entries = []
        for e in entries:
            out_entries.append({
                "id": e["id"],
                "title": e["title"],
                "author": "Theology of Work Project",
                "reference": e["reference"],
                "content": e["content"],
            })
        book_path = os.path.join(OUT_DIR, "books", f"{book_id}.json")
        with open(book_path, "w", encoding="utf-8") as f:
            json.dump({"book": book_id, "entries": out_entries}, f, ensure_ascii=False, indent=None)

        index_entries = [{"id": e["id"], "reference": e["reference"]} for e in out_entries]
        index_path = os.path.join(OUT_DIR, "books", f"{book_id}.index.json")
        with open(index_path, "w", encoding="utf-8") as f:
            json.dump({"entries": index_entries}, f, ensure_ascii=False)

        chapters_covered = sorted(set(
            c for e in out_entries
            for c in range(e["reference"]["chapterStart"], e["reference"]["chapterEnd"] + 1)
        ))
        bytes_size = os.path.getsize(book_path)
        manifest_books.append({
            "id": book_id, "name": BOOK_NAME[book_id],
            "file": f"books/{book_id}.json", "indexFile": f"books/{book_id}.index.json",
        })
        intro_count = sum(1 for e in out_entries if e["reference"]["chapterStart"] == 0)
        coverage["books"].append({
            "book": book_id, "chapters": chapters_covered, "entries": len(out_entries),
            "introductionEntries": intro_count, "bytes": bytes_size,
        })

    manifest = {
        "schemaVersion": 2,
        "id": "theology-of-work",
        "type": "commentary",
        "name": "Theology of Work Bible Commentary",
        "abbreviation": "TOW",
        "language": "en",
        "author": "Theology of Work Project",
        "description": (
            "Contemporary Bible commentary connecting Scripture to the "
            "theology of everyday work, produced by the Theology of Work "
            "Project (theologyofwork.org)."
        ),
        "license": "CC BY-NC 4.0",
        "licenseUrl": "https://www.theologyofwork.org/about/cc-license/",
        "licenseNote": (
            "License applies only to material carrying \"Produced by TOW "
            "Project\", \"Produced by Individual TOW Project member\", or "
            "\"Produced by The High Calling\" -- every page imported here "
            "was checked for that attribution before inclusion; see "
            "PROVENANCE.md."
        ),
        "sourceUrl": "https://www.theologyofwork.org/resources/the-theology-of-work-bible-commentary/",
        "publicationYear": 2014,
        "publicDomain": False,
        "attribution": "Theology of Work Project (theologyofwork.org), CC BY-NC 4.0.",
        "nonCommercial": True,
        "notes": (
            "TOW comments by editorial section, not verse-by-verse -- entries "
            "map to the range TOW's own heading discusses. Sections that "
            "discuss more than one Bible book at once (Minor Prophets, "
            "Samuel-Kings-Chronicles) appear once per book with the same "
            "content, each under that book's own chapter/verse range -- see "
            "PROVENANCE.md. Thematic sections with no chapter/verse (topic "
            "overviews, introductions, conclusions) are filed at chapter 0."
        ),
        "books": manifest_books,
    }

    with open(os.path.join(OUT_DIR, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    with open(os.path.join(OUT_DIR, "coverage.json"), "w", encoding="utf-8") as f:
        json.dump(coverage, f, ensure_ascii=False, indent=2)

    return manifest, coverage


def main():
    counts = load_verse_counts()
    per_book = build_all_entries(counts)
    dedupe_ids(per_book)
    manifest, coverage = write_module(per_book, counts)

    print(f"Books with entries: {len(manifest['books'])}")
    total_entries = sum(b["entries"] for b in coverage["books"])
    print(f"Total entries: {total_entries}")
    print(f"Anomalies: {len(ANOMALIES)}")
    with open(os.path.join(REVIEW_DIR, "ANOMALIES.json"), "w", encoding="utf-8") as f:
        json.dump(ANOMALIES, f, ensure_ascii=False, indent=2)
    missing = [b for b, _ in BOOKS if b not in per_book]
    if missing:
        print(f"Books with NO entries at all: {missing}")


if __name__ == "__main__":
    main()
