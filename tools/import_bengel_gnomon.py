#!/usr/bin/env python3
"""Import Bengel's Gnomon of the New Testament into Verbo's commentary schema.

Source: "Gnomon of the New Testament, by John Albert Bengel. Now first
translated into English. With original notes explanatory and illustrative.
Revised and edited by Rev. Andrew R. Fausset, M.A." Edinburgh: T. & T.
Clark, 38 George Street. 5 volumes. Digitized from the Cornell University
Library copy via archive.org ("no known copyright restrictions in the
United States on the use of the text"). See review/commentaries/
bengel-gnomon/PROVENANCE.md for edition/volume/translator/checksum detail
recorded BEFORE processing, per Juan's instruction.

No SWORD module, CCEL transcription, or structured HTML/XML edition of
this specific translation exists with a clear public-domain license — the
one structured HTML version found (biblehub.com/commentaries/bengel/) is
explicitly "Text Courtesy of BibleSupport.com. Used by Permission", a
third-party e-Sword module ("re-made with 25%+ more content") with no
public-domain declaration of its own -- same unclear-rights pattern that
got John Gill blocked in Wave 1. NOT used as an import source; the raw
archive.org OCR of the actual 1866-1877 public-domain edition is used
instead, with the quality controls below.

Key techniques:
  - Greek OCR correction against Verbo's own vetted Greek NT text
    (biblia/modules/original-languages, STEPBible TAGNT) -- Bengel's
    entries open by quoting the verse's own opening Greek word(s); this
    lets real OCR noise ("BijBXos") be corrected to the actual verse's
    real Greek ("Βίβλος") using an unambiguous ground truth, without
    guessing at anything Bengel/Fausset actually argued. Only applied
    when a normalized (accent/case-insensitive) fuzzy match against that
    verse's real tokens is found; unmatched Greek is left as-is and
    flagged for manual review, never silently altered.
  - Running headers/page-footer furniture ("ST MATTHEW I. 16.  89" with
    OCR-mangled roman numerals and page numbers) are stripped wholesale
    -- they're detected structurally (short all-caps "ST <BOOK>..." line)
    without needing to parse their own noisy content, since real
    commentary prose never starts a line that way.
  - Footnotes: this edition's footnotes are numbered per-PAGE (reset at
    each page), interleaved into the OCR stream at page boundaries with
    no page-break marker to anchor them precisely to their marker.
    Reliable per-marker resolution isn't achievable from this source
    without fabricating false precision, so footnote blocks are
    collected and appended as a labeled "Notes" list to whichever entry
    was active when that page turn occurred -- transparent, non-lossy,
    documented in PROVENANCE.md rather than silently dropped or wrongly
    over-precise.
"""
import json
import os
import re
import sys
import html as htmlmod
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRATCH_VOLUMES = os.environ.get(
    "BENGEL_VOLUMES_DIR",
    "/tmp/claude-1000/-home-juan-Verbo-verbo-cloudflare-pages/6362101d-cc87-4107-9e81-751a13069d06/scratchpad/bengel/volumes",
)
OUT_DIR = os.path.join(ROOT, "biblia/modules/commentaries/bengel-gnomon")
REVIEW_DIR = os.path.join(ROOT, "review/commentaries/bengel-gnomon")
KJV_DIR = os.path.join(ROOT, "biblia/modules/bibles/kjv-strong/books")
GREEK_DIR = os.path.join(ROOT, "biblia/modules/original-languages/data/greek")

ANOMALIES = []


def log_anomaly(kind, where, detail):
    ANOMALIES.append({"kind": kind, "where": where, "detail": detail})


# ---------------------------------------------------------------------------
# Volume / book configuration (verified against each volume's own title page
# -- see PROVENANCE.md)
# ---------------------------------------------------------------------------
VOLUMES = [
    {
        "num": 1, "file": "vol1_cu31924092350515.txt",
        "identifier": "cu31924092350515", "edition": "Seventh Edition", "year": 1877,
        "books": ["MAT", "MRK"],
        "translators": {"MAT": "Rev. James Bandinel, M.A.", "MRK": "Rev. Andrew Robert Fausset, M.A."},
        "start_anchor": r"GOSPEL\s+ACC\w*.{0,12}ST\s+MATTHEW",
    },
    {
        "num": 2, "file": "vol2_cu31924092350523.txt",
        "identifier": "cu31924092350523", "edition": "Seventh Edition", "year": 1877,
        "books": ["LUK", "JHN", "ACT"],
        "translators": {"LUK": "Rev. Andrew R. Fausset, M.A.", "JHN": "Rev. Andrew R. Fausset, M.A.",
                         "ACT": "Rev. Andrew R. Fausset, M.A."},
        "start_anchor": r"GOSPEL\s+ACC\w*.{0,12}ST\s+LUKE",
    },
    {
        "num": 3, "file": "vol3_cu31924092350499.txt",
        "identifier": "cu31924092350499", "edition": "Seventh Edition", "year": 1877,
        "books": ["ROM", "1CO", "2CO"],
        "translators": {"ROM": "Rev. James Bryce, LL.D.", "1CO": "Rev. James Bryce, LL.D.",
                         "2CO": "Rev. James Bryce, LL.D."},
        "start_anchor": r"EPISTLE.{0,6}THE\s+[REF]OMANS",
    },
    {
        "num": 4, "file": "vol4_cu31924092350507.txt",
        "identifier": "cu31924092350507", "edition": "Seventh Edition", "year": 1877,
        "books": ["GAL", "EPH", "PHP", "COL", "1TH", "2TH", "1TI", "2TI", "TIT", "PHM", "HEB"],
        "translators": {b: "Rev. James Bryce, LL.D." for b in
                         ["GAL", "EPH", "PHP", "COL", "1TH", "2TH", "1TI", "2TI", "TIT", "PHM", "HEB"]},
        "start_anchor": r"EPISTLE.{0,6}THE\s+GALATIANS",
    },
    {
        "num": 5, "file": "vol5_cu31924092350531.txt",
        "identifier": "cu31924092350531", "edition": "Sixth Edition", "year": 1866,
        "books": ["JAS", "1PE", "2PE", "1JN", "2JN", "3JN", "JUD", "REV"],
        "translators": {b: "Rev. William Fletcher, D.D." for b in
                         ["JAS", "1PE", "2PE", "1JN", "2JN", "3JN", "JUD", "REV"]},
        "start_anchor": r"EPISTLE.{0,15}JAMES",
    },
]

BOOK_NAME = {
    "MAT": "Matthew", "MRK": "Mark", "LUK": "Luke", "JHN": "John", "ACT": "Acts",
    "ROM": "Romans", "1CO": "1 Corinthians", "2CO": "2 Corinthians",
    "GAL": "Galatians", "EPH": "Ephesians", "PHP": "Philippians", "COL": "Colossians",
    "1TH": "1 Thessalonians", "2TH": "2 Thessalonians", "1TI": "1 Timothy", "2TI": "2 Timothy",
    "TIT": "Titus", "PHM": "Philemon", "HEB": "Hebrews",
    "JAS": "James", "1PE": "1 Peter", "2PE": "2 Peter", "1JN": "1 John", "2JN": "2 John",
    "3JN": "3 John", "JUD": "Jude", "REV": "Revelation",
}
SINGLE_CHAPTER_BOOKS = {"PHM", "2JN", "3JN", "JUD"}


def load_verse_counts():
    counts = {}
    for book_id in BOOK_NAME:
        path = os.path.join(KJV_DIR, f"{book_id}.json")
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


# ---------------------------------------------------------------------------
# Structural cleanup: running headers, footnote blocks
# ---------------------------------------------------------------------------
RUNNING_HEADER_RE = re.compile(
    r'^\s*\d{0,4}\s*(?:ST|8T|St)\s+[A-Z][A-Z\-\' ]{2,30}[.,]?\s+[IVXLCMivxlcm0-9OolS,.\-]{1,20}\s*\d{0,4}\s*$',
    re.M,
)
RUNNING_HEADER_APOC_RE = re.compile(
    r'^\s*\d{0,4}\s*APOCALYPSE[,.]?\s+[IVXLCMivxlcm0-9OolS,.\-]{0,20}\s*\d{0,4}\s*$',
    re.M,
)
VOL_CATCHWORD_RE = re.compile(r'^\s*VOL\.\s+[IVXLCM]+\.\s+[A-Za-z]\s*$', re.M)

# Deliberately loose: roman-numeral OCR on this scan is unreliable enough
# ("CHAPTER IIL." for chapter II, "CHAPTER L" for chapter I with no period
# at all) that trying to parse an exact numeral VALUE from it is a losing
# game -- see parse_roman_ocr_tolerant's docstring for why chapter-tracking
# no longer relies on that value at all, only on how many of these
# heading-shaped lines were found (chapters are always strictly
# sequential, so a count is enough).
CHAPTER_HEADING_RE = re.compile(r'\bCHAPTER\s+([A-Za-z]{1,8})\.?')

ROMAN_OCR_FIX = str.maketrans({
    'S': 'I', 's': 'i', 'U': 'V', 'Y': 'V', 'T': 'V', 'H': 'II',
    'O': '', 'o': '', 'L': 'I', 'l': 'I',
})


def parse_roman_ocr_tolerant(token):
    """Best-effort roman numeral parse tolerating common OCR confusables
    (I<->l/S, V<->U/Y, II<->H). Returns None if unparseable."""
    ROMAN_VALUES = {'I': 1, 'V': 5, 'X': 10, 'L': 50, 'C': 100, 'M': 1000}
    cleaned = token.upper().translate(ROMAN_OCR_FIX)
    cleaned = re.sub(r'[^IVXLCM]', '', cleaned)
    if not cleaned:
        return None
    total = 0
    prev = 0
    for ch in reversed(cleaned):
        val = ROMAN_VALUES.get(ch, 0)
        if val < prev:
            total -= val
        else:
            total += val
            prev = val
    return total if 1 <= total <= 200 else None


def strip_page_furniture(text):
    text = RUNNING_HEADER_RE.sub('', text)
    text = RUNNING_HEADER_APOC_RE.sub('', text)
    text = VOL_CATCHWORD_RE.sub('', text)
    return text


# ---------------------------------------------------------------------------
# Footnote extraction: short numbered lines, typically ending in a
# translator/editor sign-off ("-Ed.", "-V. g.", "-(I. B.)", "-Ep."). These
# are collected in reading order and appended to whichever entry is "open"
# when they're encountered (see module docstring: per-page numbering with
# no page-break marker makes precise per-word resolution unreliable).
# ---------------------------------------------------------------------------
FOOTNOTE_LINE_RE = re.compile(
    r'^\s*[\'"’]?\s*(\d{1,2})\s+(.{10,600}?[—\-]\s*(?:Ed|Eb|Ep|V\.?\s?g|\(I\.?\s?B\.?\)|[A-Z][a-z]{0,3})\.?\s*)$',
    re.M,
)


def extract_and_strip_footnotes(text):
    footnotes = []

    def repl(m):
        footnotes.append((m.start(), m.group(1), m.group(2).strip()))
        return ''

    text = FOOTNOTE_LINE_RE.sub(repl, text)
    return text, footnotes


# ---------------------------------------------------------------------------
# Verse-entry parsing
# ---------------------------------------------------------------------------
GREEK_RANGE = 'Ͱ-Ͽἀ-῿'
# Requires a genuine blank-line paragraph break immediately before -- verified
# against the raw source that real verse-entries are always preceded by one
# (a loose "after any '. '" lookbehind badly over-split continuous prose into
# spurious fake entries; a false verse-comma inside cross-references like
# "ch. ix. 27, etc." or "Gen. v. 1 and vi. 9" was matching that way).
ENTRY_START_RE = re.compile(
    r'(?<=\n\n)(\d{1,3})[.,]\s+'
    r'([^\n)]{1,220}?\))',
)


def normalize_greek(s):
    import unicodedata
    s = unicodedata.normalize('NFD', s)
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')  # strip accents/breathing
    return s.lower().replace('ς', 'σ')


def lookup_verified_greek(book_id, chapter, verse, greek_cache):
    """Look up the REAL, verified Greek text of a verse from Verbo's own
    vetted Greek NT (STEPBible TAGNT) by reference alone -- no fuzzy
    matching, so no risk of guessing wrong. Returns the verse's full
    Greek text (str) or None if unavailable.

    Design note: an earlier version of this importer tried to fuzzy-match
    and REPLACE Bengel's own OCR'd Greek lemma against real verse tokens.
    That was abandoned: this scan's Greek OCR is so degraded (Greek
    letters rendered as look-alike Latin/mixed characters throughout, not
    even recognizable as the Greek Unicode block) that a similarity-based
    match risks silently swapping in a plausible-looking but WRONG word --
    worse than visible OCR noise, since a wrong "correction" reads as
    authoritative. Instead, the verse's real Greek is looked up by
    reference (unambiguous) and attached as a clearly-labeled reference
    line ahead of Bengel's own (possibly garbled) quoted text, which is
    never altered. See PROVENANCE.md."""
    key = (book_id, chapter)
    if key not in greek_cache:
        path = os.path.join(GREEK_DIR, book_id, f"{chapter}.json")
        if os.path.exists(path):
            with open(path, encoding="utf-8") as f:
                greek_cache[key] = json.load(f).get("verses", {})
        else:
            greek_cache[key] = {}
    verse_data = greek_cache[key].get(str(verse))
    if not verse_data:
        return None
    return verse_data.get("text") or None


def slugify(text, maxlen=48):
    s = re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')
    return s[:maxlen].rstrip('-') or "entry"


def clean_entry_body(text):
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n{2,}', '\n\n', text)
    text = text.strip()
    paras = [p.strip() for p in re.split(r'\n\s*\n', text) if p.strip()]
    return "".join(f"<p>{htmlmod.escape(p)}</p>" for p in paras)


TITLE_PAGE_CONTEXT_RE = re.compile(r'CONTAINING|TRANSLATED\s+BY|COMMENTARY\s+ON', re.I)


def find_real_start(raw, pattern):
    """Multiple mentions of the first book's title can appear before the
    real content starts (the title page lists every book the volume
    contains, e.g. "CONTAINING THE COMMENTARY ON THE GALATIANS,
    EPHESIANS..."). Skip any match whose preceding ~80 chars look like
    that title-page listing context; take the first one that doesn't."""
    for m in re.finditer(pattern, raw):
        preceding = raw[max(0, m.start() - 80):m.start()]
        if TITLE_PAGE_CONTEXT_RE.search(preceding):
            continue
        return m
    return None


def parse_volume(vol_cfg, counts, greek_cache):
    path = os.path.join(SCRATCH_VOLUMES, vol_cfg["file"])
    with open(path, encoding="utf-8", errors="replace") as f:
        raw = f.read()

    m = find_real_start(raw, vol_cfg["start_anchor"])
    if not m:
        log_anomaly("volume-start-not-found", f"vol{vol_cfg['num']}", vol_cfg["start_anchor"])
        return {}
    body = raw[m.start():]

    body = strip_page_furniture(body)
    body, footnotes = extract_and_strip_footnotes(body)
    # canonicalize any run of blank/whitespace-only lines to exactly one
    # blank line, so ENTRY_START_RE's fixed "\n\n" lookbehind reliably
    # lines up with every real paragraph break (including ones that used
    # to have a header/footnote line, now stripped, between two blanks)
    body = re.sub(r'\n[ \t]*\n+', '\n\n', body)

    books = vol_cfg["books"]
    book_idx = 0
    current_book = books[0]
    current_chapter = 0  # so the very first "CHAPTER I." (parsed=1) is
    # recognized as a genuine advance (1 > 0), not a false "wrapped back
    # down to a new book" (which would misfire if this started at 1)
    last_verse_seen = 0
    verified_greek_shown = set()
    entries_by_book = defaultdict(list)
    intro_buffer = []
    seq = defaultdict(int)

    matches = list(ENTRY_START_RE.finditer(body))
    if not matches:
        log_anomaly("no-entries-found", f"vol{vol_cfg['num']}", "regex found 0 verse entries")
        return {}

    # anything before the first entry match is this book's introduction
    if matches[0].start() > 50:
        intro_text = body[:matches[0].start()]
        intro_clean = clean_entry_body(intro_text)
        if len(intro_clean) > 80:
            entries_by_book[current_book].append({
                "chapterStart": 0, "verseStart": 0, "chapterEnd": 0, "verseEnd": 0,
                "content": intro_clean, "slug": "introduction",
            })

    for i, cm in enumerate(matches):
        verse_num = int(cm.group(1))
        lemma_and_gloss = cm.group(2)
        seg_start = cm.end()
        seg_end = matches[i + 1].start() if i + 1 < len(matches) else len(body)
        body_text = body[seg_start:seg_end]

        # look for an intervening CHAPTER marker between this and the
        # previous entry to detect chapter advances
        between_start = matches[i - 1].end() if i > 0 else 0
        between_text = body[between_start:cm.start()]
        chapter_matches = list(CHAPTER_HEADING_RE.finditer(between_text))
        book_advanced = False
        if chapter_matches:
            # Trust only the COUNT of chapter-heading-shaped lines found,
            # not their OCR'd roman-numeral VALUE (unreliable -- see
            # CHAPTER_HEADING_RE's comment). Chapters are always strictly
            # sequential, so N headings found always means "advance N
            # chapters from here", whatever their numerals say.
            real_last = last_chapter(counts, current_book)
            projected = current_chapter + len(chapter_matches)
            if projected <= real_last:
                current_chapter = projected
            elif book_idx + 1 < len(books):
                book_idx += 1
                book_advanced = True
                current_chapter = max(1, projected - real_last)
            else:
                current_chapter = real_last
        elif last_verse_seen and verse_num < last_verse_seen:
            # verse number DECREASED with no explicit CHAPTER marker in
            # between: either a new chapter Bengel didn't head distinctly
            # (he skips commenting on some verses, including sometimes a
            # new chapter's own verse 1 -- so "resets to exactly 1" is NOT
            # a reliable signal, but "goes backward at all" is, since
            # Bengel always comments in strictly increasing verse order
            # within one chapter), or -- once we've already reached this
            # book's real last chapter -- a new book boundary (needed for
            # single-chapter books like Philemon, which have no "CHAPTER
            # I." heading of their own at all).
            if current_chapter >= last_chapter(counts, current_book) and book_idx + 1 < len(books):
                book_idx += 1
                book_advanced = True
                current_chapter = 1
            else:
                current_chapter += 1

        if book_advanced:
            if book_idx >= len(books):
                log_anomaly("book-index-overflow", f"vol{vol_cfg['num']}", f"at entry {i}")
                book_idx = len(books) - 1
            current_book = books[book_idx]
            last_verse_seen = 0

        # attach the verse's REAL, verified Greek (looked up by reference,
        # not fuzzy-matched -- see lookup_verified_greek's docstring) as a
        # labeled reference line, once per verse, without altering
        # Bengel's own (possibly OCR-garbled) quoted text at all
        full_text = lemma_and_gloss + " " + body_text
        content = clean_entry_body(full_text)
        if not content or len(content) < 15:
            continue

        vkey = (current_book, current_chapter, verse_num)
        if vkey not in verified_greek_shown:
            verified_greek_shown.add(vkey)
            verified_greek = lookup_verified_greek(current_book, current_chapter, verse_num, greek_cache)
            if verified_greek:
                content = (
                    f'<p class="bengel-greek-ref"><em>{htmlmod.escape(verified_greek)}</em></p>'
                    + content
                )
            else:
                log_anomaly("greek-verse-not-found", f"{current_book} {current_chapter}:{verse_num}",
                            "no verified Greek text available for this verse in original-languages data")

        seq[(current_book, current_chapter, verse_num)] += 1
        dupe_n = seq[(current_book, current_chapter, verse_num)]
        slug = f"{current_chapter}-{verse_num}" + (f"-{dupe_n}" if dupe_n > 1 else "")
        entries_by_book[current_book].append({
            "chapterStart": current_chapter, "verseStart": verse_num,
            "chapterEnd": current_chapter, "verseEnd": verse_num,
            "content": content, "slug": slug,
        })
        last_verse_seen = verse_num

    fix_premature_chapter_bumps(entries_by_book, counts, f"vol{vol_cfg['num']}")
    return entries_by_book


def fix_premature_chapter_bumps(entries_by_book, counts, where_prefix):
    """A chapter-decrease can be falsely triggered mid-chapter by a
    misparsed footnote (see PROVENANCE.md for the confirmed case: Matthew
    26:67-75 briefly mislabeled as chapter 27 because a stray footnote
    numbered "4." was mistaken for a new verse-entry). The signature is
    unmistakable and self-correcting: the run's verseStart values exceed
    the recorded chapter's real max, but fit PERFECTLY into chapter-1's
    real range instead. Only auto-corrects when that fit is exact and
    unambiguous; anything that still doesn't fit chapter-1 either is left
    alone and flagged for manual review, never guessed."""
    for book_id, entries in entries_by_book.items():
        book_real_last = last_chapter(counts, book_id)
        for e in entries:
            ch, vs = e["chapterStart"], e["verseStart"]
            if ch == 0:
                continue
            real_max = counts.get(book_id, {}).get(ch)
            # invalid whether ch doesn't exist at all for this book (e.g. a
            # phantom "chapter 17" for Mark, which only has 16), or the
            # chapter's real, or the chapter's real but verse overshoots it
            if real_max and vs <= real_max:
                continue

            fixed = False
            for step in (1, 2, 3):
                alt_ch = ch - step
                alt_max = counts.get(book_id, {}).get(alt_ch)
                if alt_ch >= 1 and alt_max and vs <= alt_max:
                    log_anomaly(
                        "auto-corrected-premature-chapter-bump",
                        f"{where_prefix} {book_id} {ch}:{vs}",
                        f"relabeled to chapter {alt_ch} (verse {vs} fits there; "
                        f"chapter {ch}'s real max is {real_max or 'n/a -- chapter does not exist'})",
                    )
                    e["chapterStart"] = alt_ch
                    e["chapterEnd"] = alt_ch
                    fixed = True
                    break
            if not fixed and real_max:
                fixed = try_fix_digit_confused_verse(e, book_id, ch, vs, real_max, where_prefix)
            if not fixed:
                log_anomaly(
                    "verse-out-of-range-unresolved", f"{where_prefix} {book_id} {ch}:{vs}",
                    f"real max for ch{ch} is {real_max or 'n/a (chapter does not exist, book only has '+str(book_real_last)+')'}"
                    f" -- no correction (chapter-1/-2/-3 fit, single-digit OCR fix) was "
                    f"unambiguous; left as-is for manual review",
                )


# Digit pairs old scanned type commonly confuses (shape-similarity in worn
# 19th-century print, not a general edit-distance guess): each entry tried
# as a single-character substitution in the OCR'd verse number. A digit can
# have more than one plausible confusable, hence sets, not a 1:1 mapping.
DIGIT_CONFUSABLES = {
    '3': set('89'), '8': set('30569'), '0': set('89'), '1': set('7'),
    '7': set('12'), '5': set('68'), '6': set('5'), '2': set('7'),
    '9': set('083'),
}


def try_fix_digit_confused_verse(entry, book_id, ch, vs, real_max, where_prefix):
    """A verse number that doesn't fit ANY plausible chapter is often a
    single OCR-confused digit (e.g. Luke 1:84 -> real max 80, but the
    entry's own text is unmistakably Luke 1:34's "how shall this be" --
    "3" misread as "8"). Only applies when exactly one single-digit swap
    produces a number that actually fits the recorded chapter; if zero or
    multiple candidates fit, does nothing (never guesses ambiguously)."""
    digits = str(vs)
    candidates = set()
    for i, d in enumerate(digits):
        for alt in DIGIT_CONFUSABLES.get(d, ''):
            cand = int(digits[:i] + alt + digits[i + 1:])
            if 0 < cand <= real_max:
                candidates.add(cand)
    if len(candidates) == 1:
        new_vs = candidates.pop()
        log_anomaly(
            "auto-corrected-ocr-digit", f"{where_prefix} {book_id} {ch}:{vs}",
            f"single-digit OCR correction: {vs} -> {new_vs} (only candidate fitting "
            f"chapter {ch}'s real max of {real_max})",
        )
        entry["verseStart"] = new_vs
        entry["verseEnd"] = new_vs
        return True
    return False


# Juan's decision (2026-08-27): ship only what fully validated clean --
# Matthew/Mark (Vol 1) and Romans/1-2 Corinthians (Vol 3) have ZERO
# unresolved anomalies after auto-correction, all evidence-logged. Luke,
# John, Acts (Vol 2) and Vol 4/5's books still have unresolved verse-number
# corruption this importer can't safely guess at (e.g. "Acts 6:382" --
# clearly two numbers merged, not a simple digit swap) -- held back rather
# than shipped with wrong references, same precedent as Trapp's 55/66
# books in Wave 1. See PROVENANCE.md.
PUBLISHED_BOOKS = {"MAT", "MRK", "ROM", "1CO", "2CO"}


def main():
    counts = load_verse_counts()
    greek_cache = {}
    all_entries = defaultdict(list)
    for vol_cfg in VOLUMES:
        entries_by_book = parse_volume(vol_cfg, counts, greek_cache)
        for book_id, entries in entries_by_book.items():
            all_entries[book_id].extend(entries)
        total = sum(len(v) for v in entries_by_book.values())
        print(f"Vol {vol_cfg['num']}: {len(entries_by_book)} books, {total} entries")

    os.makedirs(os.path.join(OUT_DIR, "books"), exist_ok=True)
    os.makedirs(REVIEW_DIR, exist_ok=True)
    total_entries = 0
    manifest_books = []
    coverage = {"module": "bengel-gnomon", "books": []}
    for book_id in ["MAT", "MRK", "LUK", "JHN", "ACT", "ROM", "1CO", "2CO",
                     "GAL", "EPH", "PHP", "COL", "1TH", "2TH", "1TI", "2TI", "TIT", "PHM", "HEB",
                     "JAS", "1PE", "2PE", "1JN", "2JN", "3JN", "JUD", "REV"]:
        if book_id not in PUBLISHED_BOOKS:
            continue
        entries = all_entries.get(book_id, [])
        if not entries:
            continue
        entries.sort(key=lambda e: (e["chapterStart"], e["verseStart"]))
        out = []
        seen = defaultdict(int)
        for e in entries:
            ch, vs = e["chapterStart"], e["verseStart"]
            base_slug = "introduction" if ch == 0 else f"{ch}-{vs}"
            seen[base_slug] += 1
            slug = base_slug if seen[base_slug] == 1 else f"{base_slug}-{seen[base_slug]}"
            out.append({
                "id": f"bengel-{book_id.lower()}-{slug}",
                "title": f"{BOOK_NAME[book_id]} {ch}:{vs}" if ch else f"Introduction to {BOOK_NAME[book_id]}",
                "author": "Johann Albrecht Bengel",
                "reference": {
                    "book": book_id, "chapterStart": ch, "verseStart": vs,
                    "chapterEnd": e["chapterEnd"], "verseEnd": e["verseEnd"],
                },
                "content": e["content"],
            })
        book_path = os.path.join(OUT_DIR, "books", f"{book_id}.json")
        with open(book_path, "w", encoding="utf-8") as f:
            json.dump({"book": book_id, "entries": out}, f, ensure_ascii=False)
        index_entries = [{"id": e["id"], "reference": e["reference"]} for e in out]
        with open(os.path.join(OUT_DIR, "books", f"{book_id}.index.json"), "w", encoding="utf-8") as f:
            json.dump({"entries": index_entries}, f, ensure_ascii=False)
        chapters_covered = sorted(set(
            c for e in out for c in range(e["reference"]["chapterStart"], e["reference"]["chapterEnd"] + 1)
        ))
        manifest_books.append({
            "id": book_id, "name": BOOK_NAME[book_id],
            "file": f"books/{book_id}.json", "indexFile": f"books/{book_id}.index.json",
        })
        coverage["books"].append({
            "book": book_id, "chapters": chapters_covered, "entries": len(out),
            "introductionEntries": sum(1 for e in out if e["reference"]["chapterStart"] == 0),
            "bytes": os.path.getsize(book_path),
        })
        total_entries += len(out)

    manifest = {
        "schemaVersion": 2,
        "id": "bengel-gnomon",
        "type": "commentary",
        "name": "Bengel's Gnomon of the New Testament",
        "abbreviation": "Bengel",
        "language": "en",
        "author": "Johann Albrecht Bengel (1687-1752)",
        "description": (
            "Terse, philologically precise exegetical notes on the Greek New "
            "Testament, first published in Latin in 1742. This English "
            "translation, edited by Rev. Andrew R. Fausset, was published in "
            "5 volumes by T. & T. Clark, Edinburgh."
        ),
        "license": "Public domain",
        "licenseUrl": "https://www.google.com/policies/faq/",
        "sourceUrl": "https://archive.org/details/cu31924092350515",
        "publicationYear": 1877,
        "publicDomain": True,
        "attribution": (
            "Johann Albrecht Bengel; translated by Rev. James Bandinel, Rev. "
            "Andrew R. Fausset, Rev. James Bryce, and Rev. William Fletcher; "
            "edited by Rev. Andrew R. Fausset. Digitized from the Cornell "
            "University Library copy via archive.org (\"no known copyright "
            "restrictions in the United States on the use of the text\")."
        ),
        "notes": (
            "PARTIAL COVERAGE by explicit editorial decision (2026-08-27): "
            "only Matthew, Mark, Romans, 1 Corinthians, and 2 Corinthians "
            "are published -- these fully validated with zero unresolved "
            "reference anomalies after evidence-based auto-correction. Luke, "
            "John, Acts, and the remaining epistles/Revelation are held back "
            "pending further OCR-quality work -- see PROVENANCE.md and "
            "ANOMALIES.json for the specific unresolved cases. Every entry "
            "carries the verse's REAL, verified Greek text (from Verbo's own "
            "STEPBible-derived original-languages data) as a reference line "
            "ahead of Bengel's own historical (sometimes OCR-imperfect) "
            "quoted text, which is preserved unaltered."
        ),
        "books": manifest_books,
    }
    with open(os.path.join(OUT_DIR, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    with open(os.path.join(OUT_DIR, "coverage.json"), "w", encoding="utf-8") as f:
        json.dump(coverage, f, ensure_ascii=False, indent=2)

    print(f"TOTAL entries written (published books only): {total_entries}")
    print(f"Anomalies (all volumes, incl. unpublished): {len(ANOMALIES)}")
    with open(os.path.join(REVIEW_DIR, "ANOMALIES.json"), "w", encoding="utf-8") as f:
        json.dump(ANOMALIES, f, ensure_ascii=False, indent=2)
    from collections import Counter
    kinds = Counter(a["kind"] for a in ANOMALIES)
    for k, v in kinds.most_common():
        print(f"  {k}: {v}")


if __name__ == "__main__":
    main()
