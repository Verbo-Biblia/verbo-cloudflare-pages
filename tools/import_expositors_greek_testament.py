#!/usr/bin/env python3
"""Import The Expositor's Greek Testament (ed. W. Robertson Nicoll) into
Verbo's commentary schema. Wave 2, item 5.

Source: no Project Gutenberg edition exists (confirmed: gutenberg.org's
own search returns "No records found"). biblehub.com's EGT page carries
the identical "Text Courtesy of BibleSupport.com. Used by Permission."
third-party-rights pattern already found for Bengel and rejected there --
not used here either. No CrossWire SWORD module exists (confirmed
against the live module list). Raw archive.org OCR of the 1897 George H.
Doran Company (New York) edition, University of Toronto Library scan --
same public-domain footing and quality-control approach already proven
on Bengel and Lightfoot.

IMPORTANT difference from Bengel/Lightfoot: EGT is a work of textual
criticism, discussing variant Greek readings by design -- per Juan's
explicit instruction, this importer does NOT attach a "verified real
Greek" reference line the way Bengel/Lightfoot's importers do, since
showing "the standard text" next to EGT's own deliberately-quoted
variant reading could visually misrepresent EGT's actual argument as an
error. Only OCR-cleanup (page furniture, footnote-strip) is applied;
Greek is otherwise preserved exactly as scanned, imperfections and all,
with anomalies flagged, never silently altered.

EGT is a collective work -- each Gospel/epistle has its own credited
scholar, with Nicoll as general editor only. Volume 1 (this importer's
current scope): "The Synoptic Gospels" by Rev. Alexander Balmain Bruce,
D.D., and "The Gospel of St. John" by Rev. Marcus Dods, D.D. Volumes
2-5 (Acts through Revelation, ~18 more contributors) are NOT covered by
this importer yet -- see PENDING.md.

The volume's own continuous printed Greek NT text (set apart from the
verse-by-verse notes, matching the same convention Wave 1's Lightfoot
importer already excluded for Colossians/Philemon) is excluded --
Verbo already has Greek NT text elsewhere. Only the "Ver. N. <lemma>
<commentary>" analytical entries are imported.
"""
import json
import os
import re
import html as htmlmod
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRATCH_DIR = os.environ.get(
    "EGT_SCRATCH_DIR",
    "/tmp/claude-1000/-home-juan-Verbo-verbo-cloudflare-pages/6362101d-cc87-4107-9e81-751a13069d06/scratchpad/egt",
)
OUT_DIR = os.path.join(ROOT, "biblia/modules/commentaries/expositors-greek-testament")
REVIEW_DIR = os.path.join(ROOT, "review/commentaries/expositors-greek-testament")
KJV_DIR = os.path.join(ROOT, "biblia/modules/bibles/kjv-strong/books")

ANOMALIES = []


def log_anomaly(kind, where, detail):
    ANOMALIES.append({"kind": kind, "where": where, "detail": detail})


VOLUME1_FILE = "vol1.txt"
VOLUME1_IDENTIFIER = "expositorsgreekt01nicouoft"

# Book boundaries are found via each book's own GREEK running header
# (e.g. "KATA MAPKON", repeated on nearly every page throughout that
# book's commentary) rather than the English "GOSPEL ACCORDING TO..."
# title -- the English title turned out to appear identically both in
# the (single, shared, ~150K-char) general introduction discussing all
# four Gospels together AND at each book's real commentary start, making
# it unreliable to disambiguate. The Greek running header is unique per
# book and OCR'd cleanly and consistently here (confirmed: "KATA
# MATOAION"/"MAT@AION" family for Matthew, "KATA MAPKON" for Mark, "KATA
# AOYKAN" for Luke -- Lambda OCR'd as "A" -- "KATA IQOANNHN" for John --
# Omega OCR'd as "Q").
BOOKS = [
    {"id": "MAT", "name": "Matthew", "header_re": r"KATA\s*\S{0,2}\s*MAT[O@\S]AION",
     "author": "Rev. Alexander Balmain Bruce, D.D."},
    {"id": "MRK", "name": "Mark", "header_re": r"KATA\s*\S{0,2}\s*MAPKON",
     "author": "Rev. Alexander Balmain Bruce, D.D."},
    {"id": "LUK", "name": "Luke", "header_re": r"KATA\s*\S{0,2}\s*AOYKAN",
     "author": "Rev. Alexander Balmain Bruce, D.D."},
    {"id": "JHN", "name": "John", "header_re": r"KATA\s*\S{0,2}\s*I[QO]OANNHN",
     "author": "Rev. Marcus Dods, D.D."},
]
# canonical order in the New Testament -- NOT the volume's own presentation
# order (this volume's introduction essay discusses Mark first for
# source-critical reasons, but "in our detailed comments, we follow the
# order in which they are arranged in the New Testament" -- the book's
# own words). Real commentary order: Matthew, Mark, Luke, John.


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


CHAPTER_HEADING_RE = re.compile(r'\bCHAPTER\s+([A-Za-z]{1,8})\.?')
# Case-sensitive on purpose: this scan reliably preserves the distinction
# between capitalized "Ver. N." (a genuine new entry) and lowercase
# "ver. N." (an inline cross-reference citation within another entry's own
# prose, e.g. "the reference is demanded by the fact that ver. 1 forms the
# supplement") -- confirmed by direct inspection: 830 of the former, 294
# of the latter, and lowercase never opens a real entry in any sample
# checked. No blank-line-before requirement (unlike Bengel/Lightfoot):
# this edition's dense marginal-note layout means many genuine entries do
# NOT have a full blank line before them in the raw OCR text.
VERSE_ENTRY_RE = re.compile(r'\bVer\.\s*(\d{1,3})\.')
RUNNING_HEADER_RE = re.compile(
    r'^\s*\d{0,4}\s*(?:KATA\s+\S+(?:\s+[IVXLC0-9OolS.,\-]{1,10})?'
    r'|EYATTEAION|TO KATA \S+|AVION EYATTE\S*ION\.?'
    r'|[A-Z][A-Z. ]{0,20}GOSPEL[A-Z. ]{0,20})\s*\d{0,4}\s*$',
    re.M,
)
MAX_SECTION_CHARS = 18_000


def strip_page_furniture(text):
    return RUNNING_HEADER_RE.sub('', text)


def split_html_by_size(content, limit=MAX_SECTION_CHARS):
    if len(content) <= limit:
        return [content]
    fragments = re.findall(r"<p[^>]*>.*?</p>", content, flags=re.S)
    if "".join(fragments) != content:
        return [content]
    chunks, current = [], ""
    for frag in fragments:
        if current and len(current) + len(frag) > limit:
            chunks.append(current)
            current = ""
        current += frag
    if current:
        chunks.append(current)
    return chunks


# Second-pass cleanup for running headers ("108 KATA MATOAION Vv.", "26-ag.
# EYATTEAION 145") that survive the line-anchored strip because they got
# fused onto the same physical OCR line as real content, with a lot of
# trailing-junk variance (page numbers, badly OCR'd roman numerals). Only
# applied to VERSE entries, never introduction/dissertation entries --
# "THE GOSPEL ACCORDING TO MATTHEW" is a genuine section title inside the
# introduction essay and must not be stripped there. "KATA" and
# "EYATTEAION" are safe anchors: neither is an English word, so they never
# appear in Bruce/Dods' own prose.
LEAKED_HEADER_RE = re.compile(
    r'[\d.,\s]{0,6}(?:KATA\s+\S+(?:\s+[IVXLCivxlc0-9OolS.,\-]{1,10})?|EYATTEAION)[\d.,\s]{0,6}'
)


def strip_leaked_running_headers(content):
    return LEAKED_HEADER_RE.sub(' ', content)


def clean_entry_body(text):
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n{2,}', '\n\n', text)
    text = text.strip()
    paras = [p.strip() for p in re.split(r'\n\s*\n', text) if p.strip()]
    return "".join(f"<p>{htmlmod.escape(p)}</p>" for p in paras)


def parse_volume1(counts):
    path = os.path.join(SCRATCH_DIR, VOLUME1_FILE)
    with open(path, encoding="utf-8", errors="replace") as f:
        raw = f.read()

    # Each book's FIRST occurrence of its own Greek running header marks
    # where its continuous Greek text + commentary begins. Matthew's own
    # span additionally absorbs the ENTIRE shared general introduction
    # (all four Gospels' background/authorship/date discussion is one
    # single ~150K-char undifferentiated essay at the very front of the
    # volume, not four separate per-book intros -- see PROVENANCE.md) by
    # starting its span at position 0 instead of its own header's first
    # occurrence.
    starts = {}
    for book in BOOKS:
        m = re.search(book["header_re"], raw)
        if not m:
            log_anomaly("book-start-not-found", book["id"], book["header_re"])
            continue
        starts[book["id"]] = m.start()
    if "MAT" in starts:
        starts["MAT"] = 0

    ordered_ids = [b["id"] for b in BOOKS if b["id"] in starts]
    ordered_ids.sort(key=lambda bid: starts[bid])
    bounds = {}
    for i, bid in enumerate(ordered_ids):
        end = starts[ordered_ids[i + 1]] if i + 1 < len(ordered_ids) else len(raw)
        bounds[bid] = (starts[bid], end)

    all_entries = defaultdict(list)
    for book in BOOKS:
        book_id = book["id"]
        if book_id not in bounds:
            continue
        start, end = bounds[book_id]
        body = raw[start:end]
        body = strip_page_furniture(body)
        body = re.sub(r'\n[ \t]*\n+', '\n\n', body)

        matches = list(VERSE_ENTRY_RE.finditer(body))
        if not matches:
            log_anomaly("no-entries-found", book_id, "regex found 0 verse entries")
            continue

        intro_text = body[:matches[0].start()]
        intro_clean = clean_entry_body(intro_text)
        entries = []
        if len(intro_clean) > 200:
            for part, chunk in enumerate(split_html_by_size(intro_clean), 1):
                entries.append({
                    "chapterStart": 0, "verseStart": 0, "chapterEnd": 0, "verseEnd": 0,
                    "content": chunk,
                    "slug": "introduction" if part == 1 and len(intro_clean) <= MAX_SECTION_CHARS else f"introduction-{part}",
                })

        current_chapter = 0
        last_verse_seen = 0
        for i, m in enumerate(matches):
            verse_num = int(m.group(1))
            seg_start = m.end()
            seg_end = matches[i + 1].start() if i + 1 < len(matches) else len(body)
            segment = body[seg_start:seg_end]

            if i == 0:
                # the first real verse-entry is always somewhere in chapter
                # 1 by definition -- don't scan the (possibly very long,
                # for MAT, ~150K chars of shared general introduction)
                # intro span for "CHAPTER" headings, which would wrongly
                # count that intro's own unrelated chapter divisions
                # ("CHAPTER I. CONCERNING THE THREE GOSPELS" ... "CHAPTER
                # VI. LITERATURE") as real chapter advances.
                current_chapter = 1
            else:
                between_start = matches[i - 1].end()
                between_text = body[between_start:m.start()]
                chapter_matches = list(CHAPTER_HEADING_RE.finditer(between_text))
                if chapter_matches:
                    real_last = last_chapter(counts, book_id)
                    projected = current_chapter + len(chapter_matches)
                    current_chapter = min(projected, real_last) if projected > real_last else projected
                elif last_verse_seen and verse_num < last_verse_seen and verse_num <= 10:
                    # Require the "new" verse to be plausibly an actual
                    # chapter-1 verse (low number), not just numerically
                    # smaller than the last one seen. A bare "decreased at
                    # all" check misfires on OCR digit corruption within
                    # the SAME chapter (confirmed case: John 1:37 OCR'd as
                    # "Ver. 27" -- 37 -> 27 reads as a "decrease" from the
                    # prior entry's 36, which wrongly looked like a new
                    # chapter starting at a very early verse).
                    if current_chapter < last_chapter(counts, book_id):
                        current_chapter += 1

            content = strip_leaked_running_headers(clean_entry_body(segment))
            if not content or len(content) < 15:
                continue

            for part, chunk in enumerate(split_html_by_size(content), 1):
                slug = f"{current_chapter}-{verse_num}" if part == 1 and len(content) <= MAX_SECTION_CHARS else f"{current_chapter}-{verse_num}-p{part}"
                entries.append({
                    "chapterStart": current_chapter, "verseStart": verse_num,
                    "chapterEnd": current_chapter, "verseEnd": verse_num,
                    "content": chunk, "slug": slug,
                })
            last_verse_seen = verse_num

        all_entries[book_id] = entries
        print(f"{book_id}: {len(entries)} entries")

    fix_premature_chapter_bumps(all_entries, counts, "vol1")
    return all_entries


def fix_premature_chapter_bumps(entries_by_book, counts, where_prefix):
    """Same evidence-based auto-correction proven on Bengel: a missed
    chapter-heading detection lets verse numbers drift past the recorded
    chapter's real max. Only corrects when the verse fits EXACTLY into
    chapter-1/-2/-3 (or a single confused OCR digit); anything else is
    left alone and flagged for manual review, never guessed."""
    for book_id, entries in entries_by_book.items():
        book_real_last = last_chapter(counts, book_id)
        for e in entries:
            ch, vs = e["chapterStart"], e["verseStart"]
            if ch == 0:
                continue
            real_max = counts.get(book_id, {}).get(ch)
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
                    f"real max for ch{ch} is {real_max or 'n/a (book only has ' + str(book_real_last) + ' chapters)'}"
                    f" -- no correction was unambiguous; EXCLUDED from publication rather than "
                    f"shipped with a wrong reference (see PENDING.md)",
                )
                e["_exclude"] = True


DIGIT_CONFUSABLES = {
    '3': set('89'), '8': set('30569'), '0': set('89'), '1': set('7'),
    '7': set('12'), '5': set('68'), '6': set('5'), '2': set('7'),
    '9': set('083'),
}


def try_fix_digit_confused_verse(entry, book_id, ch, vs, real_max, where_prefix):
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


def main():
    counts = load_verse_counts()
    os.makedirs(REVIEW_DIR, exist_ok=True)
    all_entries = parse_volume1(counts)

    for book_cfg in BOOKS:
        book_id = book_cfg["id"]
        entries = [e for e in all_entries.get(book_id, []) if not e.get("_exclude")]
        if not entries:
            continue
        entries.sort(key=lambda e: (e["chapterStart"], e["verseStart"]))
        out = []
        seen = defaultdict(int)
        for e in entries:
            ch, vs = e["chapterStart"], e["verseStart"]
            base_slug = e["slug"]
            seen[base_slug] += 1
            slug = base_slug if seen[base_slug] == 1 else f"{base_slug}-{seen[base_slug]}"
            if base_slug.startswith("introduction"):
                title = f"Introduction to {book_cfg['name']}"
            else:
                title = f"{book_cfg['name']} {ch}:{vs}"
            out.append({
                "id": f"egt-{book_id.lower()}-{slug}",
                "title": title,
                "author": book_cfg["author"],
                "reference": {
                    "book": book_id, "chapterStart": ch, "verseStart": vs,
                    "chapterEnd": e["chapterEnd"], "verseEnd": e["verseEnd"],
                },
                "content": e["content"],
            })
        out_path = os.path.join(REVIEW_DIR, f"{book_id}_draft.json")
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump({"book": book_id, "entries": out}, f, ensure_ascii=False)

    print(f"Anomalies: {len(ANOMALIES)}")
    with open(os.path.join(REVIEW_DIR, "ANOMALIES.json"), "w", encoding="utf-8") as f:
        json.dump(ANOMALIES, f, ensure_ascii=False, indent=2)
    from collections import Counter
    kinds = Counter(a["kind"] for a in ANOMALIES)
    for k, v in kinds.most_common():
        print(f"  {k}: {v}")


if __name__ == "__main__":
    main()
