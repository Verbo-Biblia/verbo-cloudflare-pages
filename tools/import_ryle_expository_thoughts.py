#!/usr/bin/env python3
"""Import J. C. Ryle's "Expository Thoughts on the Gospels" (Matthew, Mark,
Luke, John) into Verbo's commentary schema. Wave 2, item 7.

Source, per Gospel:
  - Matthew: CCEL (ccel.org/ccel/r/ryle/matthew) -- real, clean, human-
    transcribed text (Rights: Public Domain, stated on the page itself),
    NOT the images-only situation found for Spurgeon's Treasury of David
    on this same site -- checked directly, not assumed from that
    precedent either way.
  - Mark, Luke, John: no CCEL edition exists for these three; no Project
    Gutenberg edition exists for any of the four (confirmed against
    gutenberg.org's own search). Raw archive.org OCR of the original
    7-volume edition (Rev. J. C. Ryle, "Expository Thoughts on the
    Gospels, For Family and Private Use, With the Text Complete",
    R. Carter & Brothers / William Hunt, 1856-1879), all confirmed
    NOT_IN_COPYRIGHT in archive.org's own scanning metadata:
      Mark:            expositorythough02ryle       (whole Gospel)
      Luke vol. 1 (1-10):  expositorythoug08rylegoog  (Ipswich: Wm. Hunt)
      Luke vol. 2 (11-24): expositorythoug05rylegoog  (Ipswich: Wm. Hunt)
      John vol. 1 (1-6):   expositorythough05ryle     (R. Carter & Bros.)
      John vol. 2 (7-12):  expositorythough06ryle     (R. Carter & Bros.)
      John vol. 3 (13-21): expositorythough07ryle     (R. Carter & Bros.)
    The original R. Carter numbered set's own Luke volumes (identifiers
    expositorythough03ryle / 04ryle) are dark on archive.org (no files,
    no OCR) -- the Google Books (Ipswich: Wm. Hunt) scans of the SAME
    original edition substitute for those two volumes only, confirmed
    NOT_IN_COPYRIGHT independently and confirmed by direct inspection to
    cover the identical, contiguous chapter ranges (1-10, then 11-24)
    with no gap or overlap against Mark/John's numbering.
  - Rejected: a 1986/1987 Banner of Truth reprint of Luke on archive.org
    (identifier expositorythough0000ryle_q5x3) is access-restricted on
    archive.org itself -- a modern reprint's own typesetting/edition can
    carry separate rights even where the underlying 1858 text is public
    domain, the same caution already applied to CCEL's own added
    material elsewhere in this wave; not used.

STRUCTURE: unlike Spurgeon's Treasury of David (Wave 2, item 6), Ryle's
own text is NOT a compiled multi-author anthology -- every word is his
own, so there is no author-attribution split to make. Ryle works by
PERICOPE, not verse-by-verse (explicit in the brief for this item): each
section is headed by its own verse range, e.g. "Matthew 1:1-17" (CCEL) or
"MARK I. 1-8." (archive.org OCR), followed by (in the OCR editions only;
CCEL's transcription omits the reprinted verse text) the KJV verse text,
then Ryle's own continuous prose on that whole passage. Each such
pericope becomes exactly one entry -- never split further, never merged
across pericopes -- preserving Ryle's own natural units instead of
forcing verse-level granularity that isn't there in the source.

OCR quality control for Mark/Luke/John reuses the same evidence-based
techniques proven on Bengel/Lightfoot/EGT/Treasury of David this wave:
chapter transitions detected by tracking when the heading's own roman
numeral token changes (not by parsing its value, which OCR corrupts
unreliably) with a verse-number-decrease fallback; out-of-range verse
numbers corrected via single-digit-confusable swaps where unambiguous,
excluded from publication (never guessed) otherwise.
"""
import json
import os
import re
import html as htmlmod
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRATCH_DIR = os.environ.get(
    "RYLE_SCRATCH_DIR",
    "/tmp/claude-1000/-home-juan-Verbo-verbo-cloudflare-pages/6362101d-cc87-4107-9e81-751a13069d06/scratchpad/ryle",
)
OUT_DIR = os.path.join(ROOT, "biblia/modules/commentaries/ryle-expository-thoughts")
REVIEW_DIR = os.path.join(ROOT, "review/commentaries/ryle-expository-thoughts")
KJV_DIR = os.path.join(ROOT, "biblia/modules/bibles/kjv-strong/books")

ANOMALIES = []


def log_anomaly(kind, where, detail):
    ANOMALIES.append({"kind": kind, "where": where, "detail": detail})


GOSPELS = [
    {"id": "MAT", "name": "Matthew", "kind": "ccel", "files": [
        {"file": "matthew_ccel.txt", "start_chapter": 1}]},
    {"id": "MRK", "name": "Mark", "kind": "ocr", "files": [
        {"file": "mark.txt", "start_chapter": 1}]},
    {"id": "LUK", "name": "Luke", "kind": "ocr", "files": [
        {"file": "luke1.txt", "start_chapter": 1},
        {"file": "luke2.txt", "start_chapter": 11}]},
    {"id": "JHN", "name": "John", "kind": "ocr", "files": [
        {"file": "john1.txt", "start_chapter": 1},
        {"file": "john2.txt", "start_chapter": 7},
        {"file": "john3.txt", "start_chapter": 13}]},
]

CCEL_HEADING_RE = re.compile(r'\b(Matthew|Mark|Luke|John)\s+(\d{1,3}):(\d{1,3})-(\d{1,3})\b')
# The book-name token itself is not always OCR'd as its correct spelling --
# confirmed variants collected by direct inspection of each source file
# (a generic "any caps word" match was deliberately avoided as too prone to
# false positives elsewhere in the running text; these are the exact
# corruptions actually observed).
_BOOK_NAME_ALTS = "MATTHEW|MARK|MAEK|MAKE|MAKK|MASK|LUKE|LUKB|LTJKE|LTTKB|LTTKE|LXTKE|UJKE|JOHN"
# "II" (chapter 2) is short enough that OCR frequently fuses it into a
# single "n"/"N" glyph rather than reading it as two Is -- confirmed by
# direct inspection (e.g. "LUKB n. 1-7", correctly the start of Luke 2).
# "III" (chapter 3) is worse: confirmed OCR'd as "in", "nx", "m", "ni",
# "HI" across different pericope headings for the very same chapter,
# with no single dominant corruption -- these exact tokens are allowed
# as an explicit alternative (mapped to 3 in roman_to_int() below) rather
# than a fully generic short-word wildcard, which would risk matching
# ordinary prose that happens to precede a "word. NN-NN" sequence.
# Roman letters are matched case-insensitively too (roman_to_int() below
# safely rejects anything that isn't actually a valid roman numeral once
# uppercased, so this doesn't open the door to arbitrary words).
OCR_HEADING_RE = re.compile(
    rf'\b({_BOOK_NAME_ALTS})\s+([IVXLCNivxlcn]+|in|nx|ni|hi|m)\.\s*(\d{{1,3}})\s*[-—–]\s*(\d{{1,3}})\b'
)
RUNNING_HEADER_RE = re.compile(
    r'^\s*\d{0,4}\s*EXPOSITORY\s+THOUGHTS\.?(\s+ON\s+THE\s+GOSPELS\.?)?\s*\d{0,4}\s*$'
    r'|^\s*\d{0,4}\s*(?:MATTHEW|MARK|LUKE|JOHN)\s*,?\s*CHAP\.?\s*[IVXLC]+\.?\s*\d{0,4}\s*$',
    re.M | re.I,
)
MAX_SECTION_CHARS = 18_000


def load_verse_counts():
    counts = {}
    for g in GOSPELS:
        path = os.path.join(KJV_DIR, f"{g['id']}.json")
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        counts[g["id"]] = {int(ch): max(int(v) for v in verses.keys())
                            for ch, verses in data["chapters"].items()}
    return counts


def last_chapter(counts, book_id):
    return max(counts[book_id].keys())


def strip_page_furniture(text):
    return RUNNING_HEADER_RE.sub('', text)


def clean_entry_body(text):
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n{2,}', '\n\n', text)
    text = text.strip()
    paras = [p.strip() for p in re.split(r'\n\s*\n', text) if p.strip() and len(p.strip()) > 2]
    return "".join(f"<p>{htmlmod.escape(p)}</p>" for p in paras)


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


def roman_to_int(s):
    if s.upper() == 'N':
        return 2
    if s.lower() in ('in', 'nx', 'ni', 'hi', 'm'):
        return 3
    vals = {'I': 1, 'V': 5, 'X': 10, 'L': 50, 'C': 100}
    total, prev = 0, 0
    for ch in reversed(s.upper()):
        v = vals.get(ch)
        if v is None:
            return None
        if v < prev:
            total -= v
        else:
            total += v
            prev = v
    return total if total > 0 else None


DIGIT_CONFUSABLES = {
    '3': set('89'), '8': set('30569'), '0': set('89'), '1': set('7'),
    '7': set('12'), '5': set('68'), '6': set('5'), '2': set('7'),
    '9': set('083'),
}


def fix_verse_number(v, real_max, where):
    if v <= real_max:
        return v, True
    digits = str(v)
    candidates = set()
    for i, d in enumerate(digits):
        for alt in DIGIT_CONFUSABLES.get(d, ''):
            cand = int(digits[:i] + alt + digits[i + 1:])
            if 0 < cand <= real_max:
                candidates.add(cand)
    if len(candidates) == 1:
        new_v = candidates.pop()
        log_anomaly("auto-corrected-ocr-digit", where,
                    f"verse {v} -> {new_v} (only candidate fitting real max of {real_max})")
        return new_v, True
    log_anomaly("verse-out-of-range-unresolved-excluded", where,
                f"verse {v} exceeds real max of {real_max}; candidates={sorted(candidates) or 'none'}, "
                f"no unambiguous correction -- EXCLUDED from publication")
    return v, False


def parse_ccel_matthew(text, counts):
    # CCEL appends its own back matter after the real commentary ends: a
    # per-chapter table-of-contents link list, then an "Indexes" section
    # (Scripture references, thematic index, the file:///...html3 link
    # list itself). Without truncating here, the LAST pericope entry
    # (Matthew 28:11-20, with no next heading to bound it) would silently
    # absorb all of that as its own content -- the same "last entry
    # swallows trailing back matter" failure already caught and fixed for
    # Lightfoot's Colossians/Philemon in Wave 1.
    indexes_marker = re.search(r'\n\s*Indexes\s*\n', text)
    if indexes_marker:
        text = text[:indexes_marker.start()]
    else:
        log_anomaly("ccel-back-matter-boundary-not-found", "MAT",
                    "'Indexes' marker not found -- back matter may leak into the last entry")

    matches = list(CCEL_HEADING_RE.finditer(text))
    entries = []
    for i, m in enumerate(matches):
        ch, vs, ve = int(m.group(2)), int(m.group(3)), int(m.group(4))
        seg_start = m.end()
        seg_end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        content = clean_entry_body(text[seg_start:seg_end])
        if len(content) < 30:
            continue
        entries.append({"chapter": ch, "verseStart": vs, "verseEnd": ve, "content": content})
    return entries


def parse_ocr_gospel(book_id, files, counts):
    entries = []
    for finfo in files:
        path = os.path.join(SCRATCH_DIR, finfo["file"])
        with open(path, encoding="utf-8", errors="replace") as f:
            raw = f.read()
        matches = list(OCR_HEADING_RE.finditer(raw))
        if not matches:
            log_anomaly("no-entries-found", f"{book_id} {finfo['file']}", "0 pericope headings found")
            continue

        real_last = last_chapter(counts, book_id)
        current_chapter = finfo["start_chapter"]
        last_entry_key = None  # (chapter, vs_raw, ve_raw) of the last real pericope entry appended
        for i, m in enumerate(matches):
            roman = m.group(2)
            vs_raw, ve_raw = int(m.group(3)), int(m.group(4))

            # Each pericope is followed by its OWN secondary "Notes."
            # subsection (brief word/phrase glosses, still entirely Ryle's
            # own writing) which reprints the identical "BOOK CH. V-V."
            # heading a second time, prefixed "NOTES." (OCR'd variously as
            # "NOTBS."/"N0TE8." etc). Confirmed by direct inspection (Luke
            # 15:11-24). Detected here and merged into the SAME entry as
            # the pericope it belongs to -- not a second, duplicate entry,
            # and not a reason to advance current_chapter.
            preceding = raw[max(0, m.start() - 25):m.start()]
            if re.search(r'N[O0][TI][EB8]S\.?\s*$', preceding, re.I):
                if entries and last_entry_key == (current_chapter, vs_raw, ve_raw):
                    seg_start = m.end()
                    seg_end = matches[i + 1].start() if i + 1 < len(matches) else len(raw)
                    notes_content = clean_entry_body(strip_page_furniture(raw[seg_start:seg_end]))
                    if len(notes_content) >= 30:
                        entries[-1]["content"] += notes_content
                else:
                    log_anomaly("notes-subsection-orphaned", f"{book_id} {current_chapter}:{vs_raw}-{ve_raw}",
                                "a 'Notes.' subsection heading was found but didn't match the immediately "
                                "preceding pericope entry -- dropped rather than merged into the wrong one")
                continue

            # Unlike Bengel/Lightfoot/EGT (where the printed roman numeral
            # itself was too unreliable to trust and occurrence-counting won
            # out), THIS source's roman numerals mostly OCR correctly in a
            # clean ascending sequence (I, IV, V, VI, VII, VIII, IX, X...);
            # blind "+1 per detected change" drifted badly here because a
            # single stray misread (e.g. "IX" -> "XIX") still counts as "a
            # change" but isn't really +1 -- and worse, a genuine multi-
            # chapter gap between consecutive pericopes (Ryle doesn't
            # necessarily write one for every chapter) needs more than +1
            # too. So the parsed VALUE is trusted directly, and only
            # overridden when implausible (decreasing, or jumping further
            # than a book plausibly spans in one step) -- in which case the
            # heading is treated as a corrupted repeat of the current
            # chapter, not a real transition.
            parsed = roman_to_int(roman)
            if parsed is not None and current_chapter <= parsed <= real_last and parsed - current_chapter <= 5:
                current_chapter = parsed
            elif parsed is not None and parsed != current_chapter:
                log_anomaly("implausible-chapter-heading", f"{book_id} near {current_chapter}",
                            f"heading roman '{roman}' parsed as {parsed}, not plausible from chapter "
                            f"{current_chapter} (real last chapter {real_last}) -- kept as chapter {current_chapter}")

            seg_start = m.end()
            seg_end = matches[i + 1].start() if i + 1 < len(matches) else len(raw)
            segment = strip_page_furniture(raw[seg_start:seg_end])
            content = clean_entry_body(segment)
            if len(content) < 30:
                continue

            real_max = counts.get(book_id, {}).get(current_chapter)
            where = f"{book_id} {current_chapter}:{vs_raw}-{ve_raw}"
            if real_max:
                vs, vs_ok = fix_verse_number(vs_raw, real_max, where)
                ve, ve_ok = (vs, True) if ve_raw == vs_raw else fix_verse_number(ve_raw, real_max, where)
                if not (vs_ok and ve_ok):
                    continue
                if ve < vs:
                    # A digit-swap can independently "fix" each end of the
                    # range into range while still leaving a backwards
                    # verseStart > verseEnd pair (e.g. printed "67-66", a
                    # simple transposition OCR never disambiguates on its
                    # own) -- not safe to publish as a reference either way.
                    log_anomaly("verse-range-backwards-excluded", where,
                                f"corrected range {vs}-{ve} is still backwards -- EXCLUDED from publication")
                    continue
            else:
                vs, ve = vs_raw, ve_raw
                log_anomaly("chapter-out-of-range", where, f"chapter {current_chapter} has no real max recorded")

            entries.append({"chapter": current_chapter, "verseStart": vs, "verseEnd": ve, "content": content})
            last_entry_key = (current_chapter, vs_raw, ve_raw)

    return entries


def build_entries(book_id, name, raw_entries):
    out = []
    seen = defaultdict(int)
    raw_entries.sort(key=lambda e: (e["chapter"], e["verseStart"]))
    for e in raw_entries:
        vlabel = f"{e['verseStart']}" if e["verseStart"] == e["verseEnd"] else f"{e['verseStart']}-{e['verseEnd']}"
        title = f"{name} {e['chapter']}:{vlabel}"
        slug = f"{e['chapter']}-{e['verseStart']}-{e['verseEnd']}"
        for part, chunk in enumerate(split_html_by_size(e["content"]), 1):
            this_slug = slug if part == 1 else f"{slug}-p{part}"
            this_title = title if part == 1 else f"{title} (Part {part})"
            seen[this_slug] += 1
            if seen[this_slug] > 1:
                this_slug += f"-dup{seen[this_slug]}"
            out.append({
                "id": f"ryle-{book_id.lower()}-{this_slug}",
                "title": this_title,
                "author": "J. C. Ryle",
                "reference": {
                    "book": book_id, "chapterStart": e["chapter"], "verseStart": e["verseStart"],
                    "chapterEnd": e["chapter"], "verseEnd": e["verseEnd"],
                },
                "content": chunk,
            })
    return out


def main():
    counts = load_verse_counts()
    os.makedirs(REVIEW_DIR, exist_ok=True)
    os.makedirs(os.path.join(OUT_DIR, "books"), exist_ok=True)

    for g in GOSPELS:
        book_id, name = g["id"], g["name"]
        if g["kind"] == "ccel":
            path = os.path.join(SCRATCH_DIR, g["files"][0]["file"])
            with open(path, encoding="utf-8", errors="replace") as f:
                raw = f.read()
            raw_entries = parse_ccel_matthew(raw, counts)
        else:
            raw_entries = parse_ocr_gospel(book_id, g["files"], counts)

        entries = build_entries(book_id, name, raw_entries)
        if not entries:
            print(f"{book_id}: 0 entries, SKIPPED")
            continue

        real_last = last_chapter(counts, book_id)
        covered = sorted(set(e["reference"]["chapterStart"] for e in entries))
        missing = sorted(set(range(1, real_last + 1)) - set(covered))
        print(f"{book_id} ({name}): {len(entries)} entries, chapters {covered[0]}-{covered[-1]}"
              + (f", MISSING: {missing}" if missing else ", full coverage"))

        book_dir = os.path.join(OUT_DIR, "books")
        with open(os.path.join(book_dir, f"{book_id}.json"), "w", encoding="utf-8") as f:
            json.dump({"book": book_id, "entries": entries}, f, ensure_ascii=False)
        index_entries = [{"id": e["id"], "reference": e["reference"]} for e in entries]
        with open(os.path.join(book_dir, f"{book_id}.index.json"), "w", encoding="utf-8") as f:
            json.dump({"entries": index_entries}, f, ensure_ascii=False)

    print(f"\nAnomalies: {len(ANOMALIES)}")
    with open(os.path.join(REVIEW_DIR, "ANOMALIES.json"), "w", encoding="utf-8") as f:
        json.dump(ANOMALIES, f, ensure_ascii=False, indent=2)
    from collections import Counter
    kinds = Counter(a["kind"] for a in ANOMALIES)
    for k, v in kinds.most_common():
        print(f"  {k}: {v}")


if __name__ == "__main__":
    main()
