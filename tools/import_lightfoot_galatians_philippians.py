#!/usr/bin/env python3
"""Import J. B. Lightfoot's commentaries on Galatians and Philippians,
extending the existing "lightfoot-colossians-philemon" module (Wave 1) to
cover more of the NT under one "J. B. Lightfoot" module, per Juan's
instruction to keep this as one module with partial NT coverage rather
than separate modules per book.

Source: no Project Gutenberg edition exists for either book (confirmed:
gutenberg.org's own search returns "No records found" for both) -- unlike
Wave 1's Colossians/Philemon, which had a human-proofread Distributed
Proofreaders edition (PG #50857). Both books here are raw, machine-only
OCR from archive.org (Cornell University Library scans, "no known
copyright restrictions in the United States"), same situation as Bengel's
Gnomon -- and the same quality-control techniques developed for that
importer are reused here: verified Greek text attached by reference
rather than trying to fix Bengel/Lightfoot's own OCR'd Greek, evidence-
based auto-correction only when unambiguous, everything else logged and
left for manual review rather than guessed.

Structural differences from Bengel handled here:
  - Lemma/gloss is closed with "]" not ")" (Lightfoot's own convention:
    "παρεισάκτους] 'traitorous spies']" reads as Greek-word-bracket-gloss).
  - No "CHAPTER N." headings at all -- chapter tracking relies on the
    verse-number-decrease heuristic (as a fallback for Bengel too), but
    is corrected against a strong periodic anchor unique to this source:
    running page-headers of the exact form "II. 6]" / "[II. 7" (recto/
    verso page-margin references showing the chapter:verse range printed
    on that page) appear roughly every 1-3 pages and give reliable
    chapter+verse checkpoints, not just chapter counts.
  - Far fewer NUMBERED verse-entries than verses -- Lightfoot's own notes
    continue as unnumbered "<word>] <note>" sub-entries under whichever
    numbered verse most recently introduced them; these are correctly
    kept as part of that verse's single content block, not split further
    ("no atomices" -- an unnumbered sub-note is not a separate citable
    unit on its own).
"""
import json
import os
import re
import sys
import html as htmlmod
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRATCH_DIR = os.environ.get(
    "LIGHTFOOT_SCRATCH_DIR",
    "/tmp/claude-1000/-home-juan-Verbo-verbo-cloudflare-pages/6362101d-cc87-4107-9e81-751a13069d06/scratchpad/lightfoot",
)
OUT_DIR = os.path.join(ROOT, "biblia/modules/commentaries/lightfoot-colossians-philemon")
REVIEW_DIR = os.path.join(ROOT, "review/commentaries/lightfoot-galatians-philippians")
KJV_DIR = os.path.join(ROOT, "biblia/modules/bibles/kjv-strong/books")
GREEK_DIR = os.path.join(ROOT, "biblia/modules/original-languages/data/greek")

ANOMALIES = []


def log_anomaly(kind, where, detail):
    ANOMALIES.append({"kind": kind, "where": where, "detail": detail})


# Manually confirmed OCR digit corruptions (book, OCR'd verse) -> real verse,
# each verified against the entry's own content before being added here --
# never guessed. PHP "70": the entry's Greek is unmistakably "ἀποθανεῖν
# κέρδος" = "to die is gain", Philippians 1:21, not a verse 70 that doesn't
# exist (Philippians 1 only has 30 verses).
KNOWN_OCR_VERSE_FIXES = {
    ("PHP", 70): 21,
}

BOOKS = [
    {
        "id": "GAL", "name": "Galatians", "file": "galatians_cu31924029294125.txt",
        "identifier": "cu31924029294125", "year": 1887,
        "title_re": r"EPISTLE\s+TO\s+THE\s+GALATIANS",
        "translator": None,
    },
    {
        "id": "PHP", "name": "Philippians", "file": "philippians_cu31924029294398.txt",
        "identifier": "cu31924029294398", "year": 1888,
        "title_re": r"EPISTLE\s+TO\s+THE\s+PHILIPPIANS",
        "translator": None,
    },
]


def load_verse_counts():
    counts = {}
    for book in BOOKS:
        path = os.path.join(KJV_DIR, f"{book['id']}.json")
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        chapters = data["chapters"]
        counts[book["id"]] = {
            int(ch): max(int(v) for v in verses.keys())
            for ch, verses in chapters.items()
        }
    return counts


def last_chapter(counts, book_id):
    return max(counts[book_id].keys())


ROMAN_VALUES = {'I': 1, 'V': 5, 'X': 10, 'L': 50, 'C': 100, 'M': 1000}


def parse_roman_strict(token):
    cleaned = re.sub(r'[^IVXLCM]', '', token.upper())
    if not cleaned:
        return None
    total, prev = 0, 0
    for ch in reversed(cleaned):
        val = ROMAN_VALUES.get(ch, 0)
        if val < prev:
            total -= val
        else:
            total += val
            prev = val
    return total if 1 <= total <= 50 else None


# Page-margin chapter:verse anchors: "II. 6]" (recto) or "[II. 7" (verso).
# Loose on the roman numeral / verse digits (OCR noise), strict on the
# bracket to avoid matching real lemma-closing brackets in body text --
# these anchors always stand alone on their own line.
ANCHOR_RE = re.compile(
    r'^\s*\[?\s*([IVXLC]{1,6})\.\s*([\d,\s\-]{1,15}?)\]?\s*$', re.M,
)
RUNNING_HEADER_RE = re.compile(
    r'^\s*\d{0,4}\s*EPISTLE\s+TO\s+THE\s+(?:GALATIANS|PHILIPPIANS)\.?\s*\d{0,4}\s*$',
    re.M | re.I,
)
# Second-pass cleanup for headers that survived stripping because they were
# fused onto the same physical OCR line as an anchor or body text, with no
# newline of their own (e.g. "IIT. 8-1o0] EPISTLE TO THE GALATIANS. 137").
# Deliberately CASE-SENSITIVE (all-caps only) and requires short
# punctuation/digit noise on both sides, not full words -- Lightfoot's own
# prose does reference "the Epistle to the Galatians" in running sentences
# sometimes, in normal sentence case, which must NOT be stripped.
LEAKED_HEADER_RE = re.compile(
    r'[\d.,\s]{0,6}EPISTLE TO THE (?:GALATIANS|P.ILIPPIANS)[.,]?[\d.,\s]{0,6}'
)
GREEK_RANGE_UNUSED = 'Ͱ-Ͽἀ-῿'
ENTRY_START_RE = re.compile(r'(?<=\n\n)(\d{1,3})[.,]\s+([^\n\]]{1,200}?\])')


def strip_page_furniture(text):
    return RUNNING_HEADER_RE.sub('', text)


def lookup_verified_greek(book_id, chapter, verse, greek_cache):
    key = (book_id, chapter)
    if key not in greek_cache:
        path = os.path.join(GREEK_DIR, book_id, f"{chapter}.json")
        if os.path.exists(path):
            with open(path, encoding="utf-8") as f:
                greek_cache[key] = json.load(f).get("verses", {})
        else:
            greek_cache[key] = {}
    verse_data = greek_cache[key].get(str(verse))
    return verse_data.get("text") if verse_data else None


MAX_SECTION_CHARS = 18_000


def split_html_by_size(content, limit=MAX_SECTION_CHARS):
    """Split a string of concatenated <p>...</p> blocks into chunks no
    larger than `limit`, always breaking at a paragraph boundary (never
    mid-tag). Same convention Wave 1's Lightfoot importer used for its own
    oversized sections."""
    if len(content) <= limit:
        return [content]
    fragments = re.findall(r"<p[^>]*>.*?</p>", content, flags=re.S)
    if "".join(fragments) != content:
        return [content]  # shouldn't happen; fail safe rather than corrupt HTML
    chunks, current = [], ""
    for frag in fragments:
        if current and len(current) + len(frag) > limit:
            chunks.append(current)
            current = ""
        current += frag
    if current:
        chunks.append(current)
    return chunks


def clean_entry_body(text):
    text = LEAKED_HEADER_RE.sub(' ', text)
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n{2,}', '\n\n', text)
    text = text.strip()
    paras = [p.strip() for p in re.split(r'\n\s*\n', text) if p.strip()]
    return "".join(f"<p>{htmlmod.escape(p)}</p>" for p in paras)


def parse_book(book_cfg, counts, greek_cache):
    book_id = book_cfg["id"]
    path = os.path.join(SCRATCH_DIR, book_cfg["file"])
    with open(path, encoding="utf-8", errors="replace") as f:
        raw = f.read()

    # find the real start of the verse-by-verse commentary: first numbered
    # entry match AFTER the book's own title appears for the second time
    # (first occurrence is the half-title/series-list page)
    title_matches = list(re.finditer(book_cfg["title_re"], raw, re.I))
    if len(title_matches) < 2:
        log_anomaly("title-not-found-twice", book_id, f"only {len(title_matches)} matches")
        content_search_start = 0
    else:
        content_search_start = title_matches[1].start()

    body_full = raw[content_search_start:]
    body_stripped = strip_page_furniture(body_full)
    body_stripped = re.sub(r'\n[ \t]*\n+', '\n\n', body_stripped)

    matches = list(ENTRY_START_RE.finditer(body_stripped))
    if not matches:
        log_anomaly("no-entries-found", book_id, "regex found 0 verse entries")
        return []

    # Real content ends at "INDEX" -- everything after is back matter
    # (publisher catalog ads, etc), not Lightfoot's own work. Without this
    # bound, the LAST verse entry would otherwise swallow everything to
    # EOF (confirmed bug: Philippians 4:22 was absorbing ~500KB including
    # a genuine "Detached Note" on Clement of Rome AND unrelated publisher
    # advertising -- see PROVENANCE.md).
    index_match = re.search(r'\bINDEX\b', body_stripped)
    book_content_end = index_match.start() if index_match else len(body_stripped)

    # intro text before the first numbered entry
    entries = []
    intro_text = body_stripped[:matches[0].start()]
    intro_clean = clean_entry_body(intro_text)
    if len(intro_clean) > 200:
        intro_chunks = split_html_by_size(intro_clean)
        for part, chunk in enumerate(intro_chunks, 1):
            slug = "introduction" if len(intro_chunks) == 1 else f"introduction-{part}"
            entries.append({
                "chapterStart": 0, "verseStart": 0, "chapterEnd": 0, "verseEnd": 0,
                "content": chunk, "slug": slug,
            })

    current_chapter = 1
    last_verse_seen = 0
    verified_greek_shown = set()

    for i, m in enumerate(matches):
        verse_num = int(m.group(1))
        if (book_id, verse_num) in KNOWN_OCR_VERSE_FIXES:
            fixed_vs = KNOWN_OCR_VERSE_FIXES[(book_id, verse_num)]
            log_anomaly("auto-corrected-known-ocr-verse", f"{book_id} verse {verse_num}",
                        f"relabeled to {fixed_vs} -- manually confirmed by content (see PROVENANCE.md)")
            verse_num = fixed_vs
        seg_start = m.end()
        if i + 1 < len(matches):
            seg_end = matches[i + 1].start()
        else:
            # last entry: cap it to a normal entry-sized window (ending at
            # a real paragraph break) instead of running to book_content_end
            LAST_ENTRY_MAX_CHARS = 2500
            window_end = min(seg_start + LAST_ENTRY_MAX_CHARS, book_content_end)
            last_break = body_stripped.rfind('\n\n', seg_start, window_end)
            seg_end = last_break if last_break > seg_start else window_end
        segment = body_stripped[seg_start:seg_end]

        # check for a page-margin chapter:verse anchor between this entry
        # and the previous one -- authoritative when found, corrects any
        # drift immediately (evidence: the anchor itself)
        between_start = matches[i - 1].end() if i > 0 else 0
        between_text = body_stripped[between_start:m.start()]
        anchor_matches = list(ANCHOR_RE.finditer(between_text))
        anchor_used = False
        for am in anchor_matches:
            parsed_ch = parse_roman_strict(am.group(1))
            if parsed_ch and 1 <= parsed_ch <= last_chapter(counts, book_id):
                if parsed_ch != current_chapter:
                    log_anomaly(
                        "chapter-corrected-by-anchor", f"{book_id} ch{current_chapter}->ch{parsed_ch}",
                        f"page-margin anchor {am.group(0)!r} at verse {verse_num}",
                    )
                current_chapter = parsed_ch
                anchor_used = True

        if not anchor_used and last_verse_seen and verse_num < last_verse_seen:
            if current_chapter < last_chapter(counts, book_id):
                current_chapter += 1
            # else: stay put, will surface as a range anomaly below if wrong

        max_verse = counts.get(book_id, {}).get(current_chapter)
        if not (max_verse and verse_num <= max_verse):
            log_anomaly("verse-out-of-range", f"{book_id} {current_chapter}:{verse_num}",
                        f"real max is {max_verse}")

        content = clean_entry_body(m.group(2) + " " + segment)
        if not content or len(content) < 15:
            continue

        vkey = (book_id, current_chapter, verse_num)
        if vkey not in verified_greek_shown:
            verified_greek_shown.add(vkey)
            vg = lookup_verified_greek(book_id, current_chapter, verse_num, greek_cache)
            if vg:
                content = f'<p class="lightfoot-greek-ref"><em>{htmlmod.escape(vg)}</em></p>' + content
            else:
                log_anomaly("greek-verse-not-found", f"{book_id} {current_chapter}:{verse_num}", "no verified text")

        # a numbered verse-entry can itself run very long when Lightfoot
        # attaches a lengthy excursus before the next numbered verse (e.g.
        # Galatians 4:30's note on Hagar and Ishmael) -- same size-based
        # chunking as introductions/dissertations, not just those.
        verse_chunks = split_html_by_size(content)
        for part, chunk in enumerate(verse_chunks, 1):
            slug = f"{current_chapter}-{verse_num}" if len(verse_chunks) == 1 else f"{current_chapter}-{verse_num}-p{part}"
            entries.append({
                "chapterStart": current_chapter, "verseStart": verse_num,
                "chapterEnd": current_chapter, "verseEnd": verse_num,
                "content": chunk, "slug": slug,
            })
        last_verse_seen = verse_num
        last_seg_end = seg_end

    # Genuine Lightfoot material (detached notes, dissertations) that
    # follows the last verse comment, up to book_content_end -- preserved
    # as its own entry rather than glued onto the last verse or discarded.
    # "no fuerces todas las secciones a un versículo individual".
    if matches:
        remainder = body_stripped[last_seg_end:book_content_end]
        remainder_clean = clean_entry_body(remainder)
        if len(remainder_clean) > 200:
            remainder_chunks = split_html_by_size(remainder_clean)
            for part, chunk in enumerate(remainder_chunks, 1):
                slug = "notes-dissertations" if len(remainder_chunks) == 1 else f"notes-dissertations-{part}"
                entries.append({
                    "chapterStart": 0, "verseStart": 0, "chapterEnd": 0, "verseEnd": 0,
                    "content": chunk, "slug": slug,
                })

    return entries


def main():
    counts = load_verse_counts()
    greek_cache = {}
    os.makedirs(REVIEW_DIR, exist_ok=True)

    for book_cfg in BOOKS:
        entries = parse_book(book_cfg, counts, greek_cache)
        book_id = book_cfg["id"]
        entries.sort(key=lambda e: (e["chapterStart"], e["verseStart"]))
        out = []
        seen = defaultdict(int)
        for e in entries:
            ch, vs = e["chapterStart"], e["verseStart"]
            base_slug = e["slug"]
            seen[base_slug] += 1
            slug = base_slug if seen[base_slug] == 1 else f"{base_slug}-{seen[base_slug]}"
            if base_slug.startswith("introduction"):
                part = base_slug.split("-")[-1] if "-" in base_slug else None
                title = f"Introduction to {book_cfg['name']}" + (f" — Part {part}" if part else "")
            elif base_slug.startswith("notes-dissertations"):
                part = base_slug.rsplit("-", 1)[-1] if base_slug != "notes-dissertations" else None
                part = part if part and part.isdigit() else None
                title = f"Additional Notes and Dissertations ({book_cfg['name']})" + (f" — Part {part}" if part else "")
            else:
                pm = re.search(r'-p(\d+)$', base_slug)
                title = f"{book_cfg['name']} {ch}:{vs}" + (f" — Part {pm.group(1)}" if pm else "")
            out.append({
                "id": f"lightfoot-{book_id.lower()}-{slug}",
                "title": title,
                "author": "J. B. Lightfoot (1828–1889)",
                "reference": {
                    "book": book_id, "chapterStart": ch, "verseStart": vs,
                    "chapterEnd": e["chapterEnd"], "verseEnd": e["verseEnd"],
                },
                "content": e["content"],
            })
        print(f"{book_id}: {len(out)} entries")
        out_path = os.path.join(REVIEW_DIR, f"{book_id}_draft.json")
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump({"book": book_id, "entries": out}, f, ensure_ascii=False, indent=None)

    print(f"Anomalies: {len(ANOMALIES)}")
    with open(os.path.join(REVIEW_DIR, "ANOMALIES.json"), "w", encoding="utf-8") as f:
        json.dump(ANOMALIES, f, ensure_ascii=False, indent=2)
    from collections import Counter
    kinds = Counter(a["kind"] for a in ANOMALIES)
    for k, v in kinds.most_common():
        print(f"  {k}: {v}")


if __name__ == "__main__":
    main()
