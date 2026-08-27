# The Expositor's Greek Testament — provenance

Wave 2, item 5. Fetched and imported 2026-08-27. **Published coverage:
Volume 1 only — Matthew, Mark, Luke, John.** See PENDING.md for Volumes
2-5 (the rest of the NT, ~18 more contributors).

## Edition

*The Expositor's Greek Testament*, edited by Rev. W. Robertson Nicoll,
M.A., LL.D. Volume I: *The Synoptic Gospels* by Rev. Alexander Balmain
Bruce, D.D. (Professor of Apologetics, Free Church College, Glasgow),
and *The Gospel of St. John* by Rev. Marcus Dods, D.D. (Professor of
Exegetical Theology, New College, Edinburgh).

**Publisher**: New York, George H. Doran Company, 1897.
**archive.org identifier**: `expositorsgreekt01nicouoft` (University of
Toronto Library scan; front matter carries a further donation bookplate
from the University of St. Michael's College, Toronto).

SHA-256 checksum: `SOURCE-CHECKSUMS.txt` in this directory.

## Sources considered and rejected

- **Project Gutenberg**: confirmed no edition exists (`gutenberg.org`'s
  own search returns "No records found" for "Expositor's Greek
  Testament").
- **biblehub.com/commentaries/egt/**: its own footer carries the
  identical *"Text Courtesy of BibleSupport.com. Used by Permission"*
  third-party-rights pattern already found for Bengel's Gnomon (see that
  module's PROVENANCE.md) and rejected there for the same reason — not a
  plain public-domain reproduction, and not used as a source here
  either.
- **CrossWire SWORD**: no module exists (confirmed against the live
  module list at crosswire.org/sword/modules).

Raw, machine-only archive.org OCR is therefore the source — same
situation, and the same quality-control approach, as Bengel and
Lightfoot's Galatians/Philippians.

## IMPORTANT: no verified-Greek-reference annotation (unlike Bengel/Lightfoot)

Both the Bengel and Lightfoot Wave 2 imports attach the verse's REAL,
verified Greek text (from Verbo's own STEPBible-derived data) as a
reference line ahead of the historical commentator's own (possibly
OCR-imperfect) quoted Greek. **This importer deliberately does NOT do
that**, per Juan's explicit instruction: EGT is a work of textual
criticism, discussing variant Greek readings by design — a commentator
here may be quoting a manuscript reading that genuinely differs from the
"standard" critical text as the actual point of their argument. Showing
a "corrected"/"standard" text alongside would risk visually
misrepresenting that argument as an OCR error. Greek here is preserved
exactly as this 1897 scan's OCR rendered it — imperfections included —
with anomalies flagged (never silently altered) and unresolvable
reference corruption excluded from publication rather than guessed at
(see "Quality control" below).

## Structure

- Each Gospel/epistle in EGT is credited to a specific scholar; Nicoll is
  general editor only. `manifest.json`'s `attribution` field and each
  entry's own `author` field name the real contributing scholar (Bruce
  for Matthew/Mark/Luke, Dods for John) — never Nicoll.
- **Book boundaries**: found via each book's own GREEK running header
  (e.g. "KATA MAPKON", repeated on nearly every page throughout that
  book), not the English "GOSPEL ACCORDING TO..." title — the English
  title turned out to appear identically both in the single, shared,
  ~150K-character general introduction (which discusses all four
  Gospels' authorship/date/synoptic-relationship together, "CHAPTER I"
  through "CHAPTER VI") AND at each book's real commentary start, making
  it unreliable to disambiguate. The Greek running header is unique per
  book and OCR'd cleanly and consistently: "KATA ΜΑΤΘΑΙΟΝ" family for
  Matthew, "KATA MAPKON" for Mark, "KATA AOYKAN" for Luke (Lambda OCR'd
  as "A"), "KATA IΩANNHN" for John (Omega OCR'd as "Q").
- **The shared general introduction is filed under Matthew** (its span
  starts at position 0 of the volume) rather than being awkwardly split
  four ways or duplicated — it is genuinely one continuous essay
  discussing all four Gospels together, not four separate per-book
  introductions.
- **Entries**: `Ver. N. <lemma and philological notes>`. Entry-start
  detection is deliberately case-sensitive on "Ver." — confirmed by
  direct inspection that this scan reliably distinguishes capitalized
  "Ver. N." (830 occurrences, always a genuine new entry) from lowercase
  "ver. N." (294 occurrences, always an inline cross-reference citation
  within another entry's own prose, e.g. "the reference is demanded by
  the fact that ver. 1 forms the supplement"). No blank-line-before
  requirement was used (unlike Bengel/Lightfoot) — this edition's dense
  marginal-note layout means many genuine entries have no full blank
  line before them in the raw OCR text.
- **The volume's own continuous printed Greek NT text** (set apart from
  the verse-by-verse analytical notes) is excluded, matching the
  convention already used for Lightfoot's Colossians/Philemon — Verbo
  already provides Greek NT text elsewhere.
- Chapter tracking counts "CHAPTER N" heading occurrences (not their
  often-garbled roman-numeral value) between entries, same technique
  proven on Lightfoot's Galatians/Philippians.

## OCR quality control

- A verse-number-decrease is only treated as a genuine new-chapter
  signal when the new number is plausibly an actual early verse (≤10) —
  a bare "any decrease" check misfired on OCR digit corruption within
  the SAME chapter (confirmed case: John 1:37 OCR'd as "Ver. 27" — 37→27
  reads as a "decrease" from the prior entry's 36, which without this
  guard wrongly looked like a new chapter starting at verse 27; this
  single fix corrected 21 chapters' worth of downstream mislabeling in
  John alone, whose coverage had been silently missing chapter 2 before
  it).
- **Evidence-based auto-correction** (same as Bengel/Lightfoot): a
  verse number exceeding its recorded chapter's real maximum is
  corrected when it fits EXACTLY into chapter minus 1/2/3, or via a
  single confused-digit swap (print-era confusable pairs: 3/8, 0/8,
  1/7, 5/6, 2/7, 0/9) — every correction logged with its exact reasoning
  in `ANOMALIES.json`.
- **Unresolvable entries are excluded from publication, not guessed at
  or shipped with a wrong reference**: 2 entries (John 1:52, John
  17:209 — the latter obviously digit-corrupted beyond a single-swap
  fix) had no unambiguous correction and were dropped rather than
  published with an invented reference.
- Running-header leakage ("108 KATA MATOAION Vv.", "26-ag. EYATTEAION
  145") is stripped in two passes: a line-anchored structural strip
  before entry parsing, and a second permissive pass (case-sensitive on
  "KATA"/"EYATTEAION", neither an English word) applied only to verse
  entries — confirmed zero remaining leaks in the published set.
  Deliberately NOT applied to introduction/dissertation entries, where
  "THE GOSPEL ACCORDING TO MATTHEW" is a genuine section title within
  Bruce's own essay, not page furniture.

## Coverage published

**Matthew** (773 entries, chapters 1-28 complete), **Mark** (485
entries, chapters 1-16 complete), **Luke** (775 entries, chapters 1-24
complete), **John** (643 entries, chapters 1-21 complete). 2676 entries
total. Zero duplicate IDs, zero empty content, zero mojibake, zero
malformed references. **Volumes 2-5 (Acts through Revelation) are held
back** — see PENDING.md.

## Attribution

General editor: Rev. W. Robertson Nicoll, M.A., LL.D. Volume 1
contributors: Rev. Alexander Balmain Bruce, D.D.; Rev. Marcus Dods, D.D.
Public domain (1897 publication).
