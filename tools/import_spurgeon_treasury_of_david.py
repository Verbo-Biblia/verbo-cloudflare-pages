#!/usr/bin/env python3
"""Import C. H. Spurgeon's "The Treasury of David" (Psalms) into Verbo's
commentary schema. Wave 2, item 6.

Source: archive.org OCR of the 7-volume Passmore & Alabaster / Marshall
Brothers edition (public domain, Spurgeon d. 1892). CCEL's own edition of
this work is "Images Only" (pure page scans, zero transcription -- worse
than OCR, not usable). No Project Gutenberg edition exists. archive.spurgeon.org
has a clean modern HTML transcription but states no license and actively
markets a commercial print edition (Pilgrim Publications) -- the same
"unclear rights on a modern re-presentation" concern that excluded
biblehub/BibleSupport pages elsewhere in Wave 2, so raw archive.org OCR is
used instead, consistent with that precedent.

Each volume's own title page states its exact Psalm range (confirmed by
direct inspection, NOT assumed from secondary sources -- e.g. Vol. III's
own preface reads "PSALM LIII. TO. LXXVIII."). The 7 volumes checked here
are contiguous and non-overlapping, covering Psalms 1-150 exactly:
  Vol 1: treasuryofdavid0001chsp        Psalms   1-26
  Vol 2: treasuryofdavid0002chsp_b5y8   Psalms  27-52
  Vol 3: treasuryofdavid0003chsp_d0q9   Psalms  53-78
  Vol 4: treasuryofdavidv0004unse       Psalms  79-103
  Vol 5: treasuryofdavid0005chsp        Psalms 104-118
  Vol 6: treasuryofdavidv0006unse       Psalms 119-124
  Vol 7: treasuryofdavid0007chsp_g3q6   Psalms 125-150
(Other archive.org identifiers for the "same" volume numbers turned out to
belong to a DIFFERENT, later "six volume" Marshall Brothers reorganization
with different Psalm boundaries -- e.g. a "Vol. IV" scanned as
treasuryofdavid04spuruoft covers Psalms 88-110, which would leave a gap
against this set's Vol. 3 ending at 78. Mixing editions was caught and
avoided by checking each candidate's own printed title-page range before
committing to it.)

STRUCTURE, and how it maps to Verbo's schema -- this is the crux of the
"never blur Spurgeon's own words with his quotations of others" requirement:
each Psalm in this work has (up to) three structurally distinct sections,
imported as three separately-attributed kinds of entry:
  1. "EXPOSITION" -- Spurgeon's own continuous verse-by-verse exposition,
     including his own "TITLE." (on the Psalm's Hebrew superscription) and
     "DIVISION." framing notes. Author: "C. H. Spurgeon". Imported as ONE
     whole-Psalm-range entry (chapterStart=chapterEnd=Psalm,
     verseStart=1..verseEnd=<last verse>) rather than split per verse --
     the source has no reliable per-verse boundary marker inside this
     continuous prose (Bible verse numbers are reprinted inline, but
     without any consistent structural anchor safe enough to auto-split
     on without risking silent mis-segmentation).
  2. "EXPLANATORY NOTES AND QUAINT SAYINGS" (renamed "EXPLANATORY NOTES."
     from Vol. 5 onward, same role) -- a compilation of OTHER authors'
     comments, each individually headed "Verse N.--", "Verse N (clause).--"
     or "Whole Psalm.--"/"Title.--", and each ending in the source's own
     "--Author, Year" attribution, preserved verbatim, never altered.
     Author: "Various authors, compiled by C. H. Spurgeon" -- never
     Spurgeon alone. Imported per verse (grouping same-verse sub-notes
     together), matching this section's own explicit verse markers.
  3. "HINTS TO THE VILLAGE PREACHER" -- Spurgeon's own homiletical outline
     points, same "Verse N.--" convention, imported per verse. Author:
     "C. H. Spurgeon" -- this section is overwhelmingly his own outline
     material by design, though it occasionally embeds a borrowed one-line
     sermon suggestion (itself already visibly "--Author"-attributed in
     the preserved text, exactly as printed).
A trailing "WORKS ON/UPON THE ... PSALM." bibliography list (further-
reading titles, not commentary prose) is detected and excluded from the
Hints span.

PSALM-BOUNDARY DETECTION: neither the "EXPLANATORY NOTES..." nor "HINTS TO
THE VILLAGE PREACHER" heading alone has a 100%-reliable occurrence count in
every volume (a rare OCR misread drops 1-2 occurrences in some volumes).
Standalone "PSALM <roman-numeral>." headings exist too, but the numeral
itself is frequently OCR-garbled (e.g. "PSALM LAXIV." for LXXIV) and the
same heading text ALSO reprints as a page running-header throughout that
Psalm's own content, making raw occurrence-counting unreliable on its own
(the lesson already learned on Bengel/Lightfoot/EGT this wave -- count
occurrences, never trust the parsed value -- doesn't fully save this
because of the running-header over-counting problem here).
The fix: treat the two section headers as a single reconciled state
machine expecting a strict NOTES, HINTS, NOTES, HINTS, ... alternation. A
lone miss of either marker doesn't stall the count -- the reconciler
tolerates it (logging an anomaly) and keeps the reconstructed Psalm count
exactly matching each volume's own confirmed total in all 7 volumes
(verified empirically before writing this importer).
"""
import json
import os
import re
import html as htmlmod
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRATCH_DIR = os.environ.get(
    "TOD_SCRATCH_DIR",
    "/tmp/claude-1000/-home-juan-Verbo-verbo-cloudflare-pages/6362101d-cc87-4107-9e81-751a13069d06/scratchpad/tod",
)
OUT_DIR = os.path.join(ROOT, "biblia/modules/commentaries/spurgeon-treasury-of-david")
REVIEW_DIR = os.path.join(ROOT, "review/commentaries/spurgeon-treasury-of-david")
KJV_DIR = os.path.join(ROOT, "biblia/modules/bibles/kjv-strong/books")

ANOMALIES = []


def log_anomaly(kind, where, detail):
    ANOMALIES.append({"kind": kind, "where": where, "detail": detail})


VOLUMES = [
    {"n": 1, "file": "v1.txt", "identifier": "treasuryofdavid0001chsp", "start_psalm": 1, "end_psalm": 26},
    {"n": 2, "file": "v2.txt", "identifier": "treasuryofdavid0002chsp_b5y8", "start_psalm": 27, "end_psalm": 52},
    {"n": 3, "file": "v3.txt", "identifier": "treasuryofdavid0003chsp_d0q9", "start_psalm": 53, "end_psalm": 78},
    {"n": 4, "file": "v4.txt", "identifier": "treasuryofdavidv0004unse", "start_psalm": 79, "end_psalm": 103},
    {"n": 5, "file": "v5.txt", "identifier": "treasuryofdavid0005chsp", "start_psalm": 104, "end_psalm": 118},
    {"n": 6, "file": "v6.txt", "identifier": "treasuryofdavidv0006unse", "start_psalm": 119, "end_psalm": 124},
    {"n": 7, "file": "v7.txt", "identifier": "treasuryofdavid0007chsp_g3q6", "start_psalm": 125, "end_psalm": 150},
]

NOTES_RE = re.compile(r'EXPLANATORY NOTES(?: AND QUAINT SAYINGS)?\s*[.,]')
HINTS_RE = re.compile(r'HINTS (?:TO|OF) THE VILLAGE PREACHER\.?')
WORKS_RE = re.compile(r'\bWORKS (?:ON|UPON)\b', re.I)
TITLE_DIV_EXPO_RE = re.compile(r'\b(?:TITLE|Title|DIVISION|Division|EXPOSITION)\.')

SUBMARK_RE = re.compile(
    r'(?:^|\n)\s*'
    r'(?:Verse\s+(?P<verse>\d{1,3}(?:\s*[,\-]\s*\d{1,3})*)(?:\s*\([^)]{1,40}\))?\.\s*[—\-]'
    r'|(?P<whole>Whole Psalm)\.\s*[—\-]'
    r'|(?P<title>Title|TITLE)\.\s*[—\-]'
    r'|(?P<division>Division|DIVISION)\.\s*[—\-])',
    re.M,
)

RUNNING_HEADER_RE = re.compile(
    r'^\s*\d{0,4}\s*EXPOSITIONS?\s+OF\s+THE\s+PSALMS?[.,]?\s*\d{0,4}\s*$',
    re.M | re.I,
)
STANDALONE_PSALM_HEADING_RE = re.compile(r'^\s*PSALM\s+(?:THE\s+)?[A-Z]+\.?\s*\d{0,4}\s*$', re.M)

MAX_SECTION_CHARS = 18_000


def load_verse_counts():
    path = os.path.join(KJV_DIR, "PSA.json")
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    return {int(ch): max(int(v) for v in verses.keys()) for ch, verses in data["chapters"].items()}


def strip_page_furniture(text):
    text = RUNNING_HEADER_RE.sub('', text)
    text = STANDALONE_PSALM_HEADING_RE.sub('', text)
    return text


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


def reconcile_sections(text, vol_label):
    """Walk NOTES/HINTS marker occurrences as a strict alternating state
    machine (NOTES, HINTS, NOTES, HINTS, ...), tolerating an occasional
    missed marker (logged, not silently ignored) without losing the count.
    Returns (pairs, contaminated_exposition_indices): pairs is a list of
    (notes_span_or_None, hints_span_or_None), one per Psalm, in document
    order. contaminated_exposition_indices flags Psalm indices whose
    EXPOSITION span cannot be trusted as a result of a missed marker --
    a missed "notes" marker means the real Explanatory-Notes content (other
    authors' quotations) has no detected start, so it would otherwise get
    silently absorbed into that Psalm's own "Exposition" span; a missed
    "hints" marker means the FOLLOWING Psalm's Exposition span would start
    too early, swallowing the previous Psalm's real Hints (and possibly
    Notes) content. Either way this contaminates the Exposition entry with
    quoted material -- exactly the "blur Spurgeon's own words with his
    quotations" failure this importer exists to avoid -- so parse_volume
    drops just that Exposition entry (not the whole Psalm) for flagged
    indices, per Psalm 25's actual pattern confirmed by direct inspection
    of the raw OCR (a page where the "EXPLANATORY NOTES..." header itself
    did not survive OCR at all, not merely in a garbled-but-matchable form)."""
    events = [(m.start(), m.end(), 'notes') for m in NOTES_RE.finditer(text)]
    events += [(m.start(), m.end(), 'hints') for m in HINTS_RE.finditer(text)]
    events.sort()

    pairs = []
    contaminated = set()
    expecting = 'notes'
    cur_notes = None
    for pos, end, typ in events:
        if typ == expecting:
            if typ == 'notes':
                cur_notes = (pos, end)
                expecting = 'hints'
            else:
                pairs.append((cur_notes, (pos, end)))
                cur_notes = None
                expecting = 'notes'
        else:
            log_anomaly("section-marker-missed", vol_label,
                        f"expected {expecting} but saw {typ} at char {pos} -- reconciled by treating "
                        f"the missing section as empty for that Psalm; that Psalm's Exposition entry "
                        f"is dropped rather than risk it absorbing quoted material (see PENDING.md)")
            if typ == 'hints' and expecting == 'notes':
                contaminated.add(len(pairs))
                pairs.append((None, (pos, end)))
                expecting = 'notes'
            elif typ == 'notes' and expecting == 'hints':
                pairs.append((cur_notes, None))
                contaminated.add(len(pairs))
                cur_notes = (pos, end)
                expecting = 'hints'
    if cur_notes is not None:
        pairs.append((cur_notes, None))
    return pairs, contaminated


def find_real_start(span_text):
    """The Exposition span's raw text starts with the tail of the PREVIOUS
    Psalm's "WORKS ON/UPON..." bibliography list plus page-furniture noise.
    The real content starts at this Psalm's own TITLE./DIVISION./EXPOSITION.
    marker -- find the first one and slice from there. The label itself is
    structural typesetting, not prose (consistent with how "Verse N.--"
    labels are excluded from their own segments elsewhere in this
    importer), so the match is dropped, not kept, at m.end()."""
    m = TITLE_DIV_EXPO_RE.search(span_text)
    rest = span_text[m.end():] if m else span_text
    # Unlike TITLE./DIVISION. (always followed by their own "--" and prose,
    # so already excised whole by the match above), a bare "EXPOSITION."
    # is pure page furniture with nothing attached -- if TITLE. or
    # DIVISION. was the first match, "EXPOSITION." still appears later,
    # standalone, and is stripped here too.
    return re.sub(r'\n\s*EXPOSITION\.\s*\n', '\n', rest)


def split_by_submarkers(span_text, psalm_num, counts):
    """Split a Notes or Hints span into per-verse groups using the
    "Verse N.--" / "Whole Psalm.--" / "Title.--" / "Division.--" convention.
    Returns list of (verse_start, verse_end, content_text, excluded) tuples,
    verse 0 meaning a whole-Psalm-range note (Whole Psalm./Title./Division.).
    excluded=True means the verse number could not be resolved unambiguously
    -- matching the Bengel/EGT precedent, such entries are held out of
    publication entirely rather than shipped with a reference known to be
    wrong (content is preserved in ANOMALIES.json's detail for manual review,
    never silently discarded from the record)."""
    matches = list(SUBMARK_RE.finditer(span_text))
    if not matches:
        return []
    real_max = counts.get(psalm_num, 999)
    groups = defaultdict(list)
    order = []
    excluded_keys = set()
    last_valid = 0
    for i, m in enumerate(matches):
        seg_start = m.end()
        seg_end = matches[i + 1].start() if i + 1 < len(matches) else len(span_text)
        segment = span_text[seg_start:seg_end].strip()
        if not segment:
            continue
        verse_group = m.group("verse")
        if verse_group:
            nums = [int(x) for x in re.findall(r'\d{1,3}', verse_group)]
            vs, vs_ok = fix_verse_number(nums[0], psalm_num, real_max, last_valid)
            if nums[-1] == nums[0]:
                ve, ve_ok = vs, vs_ok
            else:
                ve, ve_ok = fix_verse_number(nums[-1], psalm_num, real_max, vs)
            last_valid = ve
            if not (vs_ok and ve_ok):
                excluded_keys.add((vs, ve))
        else:
            vs = ve = 0
        key = (vs, ve)
        if key not in groups:
            order.append(key)
        groups[key].append(segment)
    return [(vs, ve, "\n\n".join(groups[(vs, ve)]), (vs, ve) in excluded_keys) for (vs, ve) in order]


DIGIT_CONFUSABLES = {
    '3': set('89'), '8': set('30569'), '0': set('89'), '1': set('7'),
    '7': set('12'), '5': set('68'), '6': set('5'), '2': set('7'),
    '9': set('083'),
}


def fix_verse_number(vs, psalm_num, real_max, last_valid=0):
    """Evidence-based correction, same spirit as Bengel/EGT: a bare
    single-digit-confusable swap is tried first; if that alone is
    ambiguous (multiple candidates fit the Psalm's real verse count), the
    sub-notes' own document order breaks the tie -- Explanatory Notes and
    Hints are printed in non-decreasing verse order, so among otherwise
    equally-valid candidates the one that continues the sequence forward
    from the last confirmed verse (>= last_valid) is preferred. Only when
    even that leaves more than one candidate, or none, is it left
    unresolved and flagged."""
    if vs == 0 or vs <= real_max:
        return vs, True
    digits = str(vs)
    candidates = set()
    for i, d in enumerate(digits):
        for alt in DIGIT_CONFUSABLES.get(d, ''):
            cand = int(digits[:i] + alt + digits[i + 1:])
            if 0 < cand <= real_max:
                candidates.add(cand)
    # A second, distinct OCR artifact confirmed by direct inspection: "Verse
    # 13." repeatedly comes out as "Verse 138." (and similar) -- a stray
    # trailing digit glued onto an otherwise-correct number, not a
    # single-digit substitution (dropping the last digit of "138" gives 13,
    # which both fits the Psalm's real verse count AND matches the quoted
    # content in every sampled case, e.g. Psalm 41:13 "Amen, and Amen" --
    # its real closing doxology verse). Only applied when it doesn't
    # conflict with a substitution candidate already found.
    if len(digits) > 1:
        trailing_drop = int(digits[:-1])
        if 0 < trailing_drop <= real_max:
            candidates.add(trailing_drop)
    if len(candidates) == 1:
        new_vs = candidates.pop()
        log_anomaly("auto-corrected-ocr-digit", f"Psalm {psalm_num}",
                    f"verse {vs} -> {new_vs} (only candidate fitting Psalm {psalm_num}'s real max of {real_max})")
        return new_vs, True
    if len(candidates) > 1:
        forward = sorted(c for c in candidates if c >= last_valid)
        if len(forward) == 1:
            new_vs = forward[0]
            log_anomaly("auto-corrected-ocr-digit-sequence", f"Psalm {psalm_num}",
                        f"verse {vs} -> {new_vs} (candidates {sorted(candidates)} fit Psalm {psalm_num}'s max of "
                        f"{real_max}; only {new_vs} continues the notes' own non-decreasing verse order from "
                        f"the last confirmed verse {last_valid})")
            return new_vs, True
    log_anomaly("verse-out-of-range-unresolved-excluded", f"Psalm {psalm_num}",
                f"verse {vs} exceeds Psalm {psalm_num}'s real max of {real_max}; candidates={sorted(candidates) or 'none'}, "
                f"no unambiguous correction -- EXCLUDED from publication rather than shipped with a wrong reference")
    return vs, False


def parse_volume(vol, counts):
    path = os.path.join(SCRATCH_DIR, vol["file"])
    with open(path, encoding="utf-8", errors="replace") as f:
        raw = f.read()

    pairs, contaminated = reconcile_sections(raw, f"Vol {vol['n']}")
    expected = vol["end_psalm"] - vol["start_psalm"] + 1
    if len(pairs) != expected:
        log_anomaly("volume-psalm-count-mismatch", f"Vol {vol['n']}",
                    f"reconciled {len(pairs)} Psalm section-pairs, expected {expected} "
                    f"(Psalms {vol['start_psalm']}-{vol['end_psalm']}) -- volume held back, see PENDING.md")
        return {}

    entries_by_psalm = {}
    prev_hints_end = 0
    for i, (notes_span, hints_span) in enumerate(pairs):
        psalm_num = vol["start_psalm"] + i
        expo_start = prev_hints_end
        expo_end = notes_span[0] if notes_span else (hints_span[0] if hints_span else len(raw))
        expo_raw = raw[expo_start:expo_end]
        expo_raw = find_real_start(expo_raw)
        expo_clean = clean_entry_body(strip_page_furniture(expo_raw))

        notes_text = raw[notes_span[1]:hints_span[0]] if (notes_span and hints_span) else \
                     (raw[notes_span[1]:expo_end + 20000] if notes_span else "")
        notes_text = strip_page_furniture(notes_text)

        if hints_span:
            next_notes_start = pairs[i + 1][0][0] if i + 1 < len(pairs) and pairs[i + 1][0] else \
                                (pairs[i + 1][1][0] if i + 1 < len(pairs) and pairs[i + 1][1] else len(raw))
            hints_text = raw[hints_span[1]:next_notes_start]
            works_m = WORKS_RE.search(hints_text)
            if works_m:
                hints_text = hints_text[:works_m.start()]
            hints_text = strip_page_furniture(hints_text)
        else:
            hints_text = ""

        prev_hints_end = hints_span[1] if hints_span else (notes_span[1] if notes_span else expo_end)

        entries = []
        if i in contaminated:
            log_anomaly("exposition-dropped-contaminated", f"Psalm {psalm_num}",
                        "Exposition entry excluded: a missed section marker means this span cannot be "
                        "trusted not to contain quoted material from another author (see PENDING.md)")
        elif len(expo_clean) > 30:
            for part, chunk in enumerate(split_html_by_size(expo_clean), 1):
                entries.append({
                    "kind": "exposition", "verseStart": 1, "verseEnd": counts.get(psalm_num, 1),
                    "content": chunk, "part": part,
                })
        else:
            log_anomaly("empty-exposition", f"Psalm {psalm_num}", "exposition span produced under 30 chars")

        for vs, ve, text, excluded in split_by_submarkers(notes_text, psalm_num, counts):
            if excluded:
                continue
            content = clean_entry_body(text)
            if len(content) < 15:
                continue
            real_ve = ve if ve else counts.get(psalm_num, 1)
            real_vs = vs if vs else 1
            for part, chunk in enumerate(split_html_by_size(content), 1):
                entries.append({
                    "kind": "notes", "verseStart": real_vs, "verseEnd": real_ve,
                    "content": chunk, "part": part, "whole": vs == 0,
                })

        for vs, ve, text, excluded in split_by_submarkers(hints_text, psalm_num, counts):
            if excluded:
                continue
            content = clean_entry_body(text)
            if len(content) < 15:
                continue
            real_ve = ve if ve else counts.get(psalm_num, 1)
            real_vs = vs if vs else 1
            for part, chunk in enumerate(split_html_by_size(content), 1):
                entries.append({
                    "kind": "hints", "verseStart": real_vs, "verseEnd": real_ve,
                    "content": chunk, "part": part, "whole": vs == 0,
                })

        entries_by_psalm[psalm_num] = entries

    return entries_by_psalm


TITLES = {"exposition": "Exposition", "notes": "Explanatory Notes and Quaint Sayings",
          "hints": "Hints to the Village Preacher"}
AUTHORS = {"exposition": "C. H. Spurgeon", "notes": "Various authors, compiled by C. H. Spurgeon",
           "hints": "C. H. Spurgeon"}


def build_psalm_entries(psalm_num, raw_entries):
    """Build the final entry dicts for ONE Psalm. Kept per-Psalm (not one
    flat whole-book list) because this module ships chapterSplit=true --
    at ~15MB combined, this is far larger than any other single-book
    commentary file in Verbo (the next largest, JFB's PSA.json, is 628KB),
    and Juan's own machine has only 4GB RAM, making one giant PSA.json a
    real cost for every reader on every Psalm view, not just an
    abstraction concern."""
    out = []
    seen = defaultdict(int)
    for e in raw_entries:
        kind = e["kind"]
        if kind == "exposition":
            title = f"Psalm {psalm_num}"
            slug = f"{psalm_num}-exposition"
        elif e.get("whole"):
            title = f"Psalm {psalm_num} — {TITLES[kind]}"
            slug = f"{psalm_num}-{kind}-whole"
        else:
            vs, ve = e["verseStart"], e["verseEnd"]
            vlabel = f"{vs}" if vs == ve else f"{vs}-{ve}"
            title = f"Psalm {psalm_num}:{vlabel} — {TITLES[kind]}"
            slug = f"{psalm_num}-{kind}-{vlabel}"
        if e["part"] > 1:
            slug += f"-p{e['part']}"
            title += f" (Part {e['part']})"
        seen[slug] += 1
        if seen[slug] > 1:
            slug += f"-dup{seen[slug]}"
        out.append({
            "id": f"tod-psa-{slug}",
            "title": title,
            "author": AUTHORS[kind],
            "reference": {
                "book": "PSA", "chapterStart": psalm_num, "verseStart": e["verseStart"],
                "chapterEnd": psalm_num, "verseEnd": e["verseEnd"],
            },
            "content": e["content"],
        })
    return out


def main():
    counts = load_verse_counts()
    os.makedirs(REVIEW_DIR, exist_ok=True)
    books_out_dir = os.path.join(OUT_DIR, "books", "PSA")
    os.makedirs(books_out_dir, exist_ok=True)

    published_psalms = {}
    for vol in VOLUMES:
        path = os.path.join(SCRATCH_DIR, vol["file"])
        if not os.path.exists(path):
            print(f"SKIP Vol {vol['n']}: {path} not found")
            continue
        vol_entries = parse_volume(vol, counts)
        if not vol_entries:
            print(f"Vol {vol['n']}: HELD BACK (reconciliation mismatch, see ANOMALIES.json)")
            continue
        n_entries = sum(len(v) for v in vol_entries.values())
        print(f"Vol {vol['n']} (Psalms {vol['start_psalm']}-{vol['end_psalm']}): "
              f"{len(vol_entries)} psalms, {n_entries} entries")
        published_psalms.update(vol_entries)

    total_entries = 0
    coverage_chapters = []
    for psalm_num in sorted(published_psalms):
        entries = build_psalm_entries(psalm_num, published_psalms[psalm_num])
        if not entries:
            continue
        total_entries += len(entries)
        coverage_chapters.append(psalm_num)
        chapter_out = {"entries": entries}
        with open(os.path.join(books_out_dir, f"{psalm_num}.json"), "w", encoding="utf-8") as f:
            json.dump(chapter_out, f, ensure_ascii=False)

    coverage = {"module": "spurgeon-treasury-of-david",
                "books": [{"book": "PSA", "chapters": coverage_chapters}]}
    with open(os.path.join(OUT_DIR, "coverage.json"), "w", encoding="utf-8") as f:
        json.dump(coverage, f, ensure_ascii=False, indent=2)

    print(f"\nTotal: {len(published_psalms)} psalms, {total_entries} entries -> {books_out_dir}/<psalm>.json")

    print(f"Anomalies: {len(ANOMALIES)}")
    with open(os.path.join(REVIEW_DIR, "ANOMALIES.json"), "w", encoding="utf-8") as f:
        json.dump(ANOMALIES, f, ensure_ascii=False, indent=2)
    from collections import Counter
    kinds = Counter(a["kind"] for a in ANOMALIES)
    for k, v in kinds.most_common():
        print(f"  {k}: {v}")


if __name__ == "__main__":
    main()
