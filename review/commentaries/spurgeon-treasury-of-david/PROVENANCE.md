# The Treasury of David (C. H. Spurgeon) — provenance

Wave 2, item 6. Fetched and imported 2026-08-27.

## Edition

*The Treasury of David*, C. H. Spurgeon (1834-1892). 7 volumes, Passmore &
Alabaster (vols. 1-3, 5, 7) / Marshall Brothers (vols. 4, 6), published
1869-1885. archive.org OCR, public domain.

Each volume's *own* title page states its exact Psalm range — confirmed by
direct inspection, not assumed from any secondary source (e.g. Vol. III's
own preface literally reads "PSALM LIII. TO. LXXVIII."). The 7 identifiers
used here are contiguous and non-overlapping, covering Psalms 1-150 exactly:

| Vol | archive.org identifier | Psalms |
|---|---|---|
| 1 | treasuryofdavid0001chsp | 1-26 |
| 2 | treasuryofdavid0002chsp_b5y8 | 27-52 |
| 3 | treasuryofdavid0003chsp_d0q9 | 53-78 |
| 4 | treasuryofdavidv0004unse | 79-103 |
| 5 | treasuryofdavid0005chsp | 104-118 |
| 6 | treasuryofdavidv0006unse | 119-124 |
| 7 | treasuryofdavid0007chsp_g3q6 | 125-150 |

SHA-256 checksums: `SOURCE-CHECKSUMS.txt` in this directory.

**A real trap avoided**: other archive.org identifiers for the "same"
volume numbers turned out to belong to a *different*, later "six volume"
Marshall Brothers reorganization with different Psalm boundaries — e.g. a
"Vol. IV" scanned as `treasuryofdavid04spuruoft` actually covers Psalms
88-110, which would leave a silent 9-Psalm gap (79-87) against this set's
Volume 3 ending at 78. Caught by checking each candidate's own printed
title-page range (not just its catalog "volume" label) before committing
to it, and confirmed by the math: 26+26+26+25+15+6+26 = 150 psalms exactly,
with no gaps or overlaps.

## Sources considered and rejected

- **CCEL** (`ccel.org/ccel/spurgeon/treasury1`...`treasury7`): this specific
  work's CCEL edition is **"Images Only"** — the `.txt` cache file itself
  states this and contains nothing but a sequence of "Image of page N"
  placeholders. Pure page scans, zero transcription — worse than OCR, not
  usable at all. (Verbo's existing CCEL pipeline for Church History /NPNF
  content works because THOSE CCEL editions carry real transcribed text;
  this one does not, and was checked directly rather than assumed.)
- **Project Gutenberg**: confirmed no edition exists (`gutenberg.org`'s own
  search returns "No records found" for "treasury of david spurgeon").
- **archive.spurgeon.org/treasury/**: a clean, modern, per-Psalm HTML
  transcription exists (`ps001.php` ... `ps150.php`), administered by
  Midwestern Baptist Theological Seminary. States **no license** anywhere
  on the site, and actively directs readers to buy the complete print set
  from Pilgrim Publications — the same "unclear rights on a modern
  re-presentation of a public-domain text" concern that excluded
  biblehub.com/BibleSupport.com pages elsewhere in this wave (Bengel,
  EGT). Not used, for the same reason.
- **CrossWire SWORD**: not checked separately this time (would need a
  further module-list lookup); raw archive.org OCR was already the
  established, precedent-consistent choice given the above.

Raw, machine-only archive.org OCR is therefore the source, same situation
as Bengel, Lightfoot's Galatians/Philippians, and EGT.

## Structure, and how it maps to Verbo's schema

This is the crux of "never blur Spurgeon's own words with his quotations
of others." Each Psalm has up to three structurally distinct sections,
each imported as separately-attributed entries:

1. **Exposition** — Spurgeon's own continuous verse-by-verse commentary,
   including his own "TITLE." (on the Psalm's Hebrew superscription) and
   "DIVISION." framing notes. `author: "C. H. Spurgeon"`. Imported as
   **one whole-Psalm-range entry** (not split per verse) — the source has
   no reliable per-verse boundary marker inside this continuous prose
   (Bible verse numbers are reprinted inline, but with no anchor safe
   enough to auto-split on without risking a silent mis-segmentation, the
   same caution already applied to EGT's continuous Greek-text spans).
2. **Explanatory Notes and Quaint Sayings** (renamed "Explanatory Notes."
   from Vol. 5 onward, same role) — a compilation of OTHER authors'
   comments, each individually headed "Verse N.—", "Verse N (clause).—"
   or "Whole Psalm.—"/"Title.—", each ending in the source's own
   "—Author, Year" attribution, **preserved verbatim, never altered**.
   `author: "Various authors, compiled by C. H. Spurgeon"` — never
   Spurgeon alone. Imported per verse, matching the section's own
   explicit markers.
3. **Hints to the Village Preacher** — Spurgeon's own homiletical outline
   points, same "Verse N.—" convention, imported per verse.
   `author: "C. H. Spurgeon"` — this section is overwhelmingly his own
   outline material by design, though it occasionally embeds a borrowed
   one-line sermon suggestion (itself already visibly "—Author"-attributed
   in the preserved text, exactly as printed, e.g. "—J. Morison" on
   Psalm 1).

A trailing "WORKS ON/UPON THE ... PSALM." bibliography list (further-
reading titles, not commentary prose) is detected and excluded from the
Hints span.

## Psalm-boundary detection

Neither the "Explanatory Notes..." nor "Hints to the Village Preacher"
heading alone has a 100%-reliable occurrence count in every volume (a rare
OCR misread drops 1-2 occurrences in some volumes). Standalone
"PSALM <roman-numeral>." headings exist too, but the numeral itself is
frequently OCR-garbled (e.g. "PSALM LAXIV." for LXXIV) AND the same
heading text also reprints as a page running-header throughout that
Psalm's own content, making raw occurrence-counting unreliable on its own
— the "count occurrences, never trust the parsed value" lesson from
Bengel/Lightfoot/EGT doesn't fully carry over here because of that
running-header over-counting problem.

The fix: the two section headers are treated as a single reconciled state
machine expecting a strict NOTES, HINTS, NOTES, HINTS, ... alternation. A
lone miss of either marker doesn't stall the Psalm count — the reconciler
tolerates it (logging a `section-marker-missed` anomaly) and still
reconstructs each volume's Psalm count **exactly** matching its own
confirmed total, verified empirically for all 7 volumes before any content
was shipped.

## OCR quality control

- **Digit-confusable correction** (same technique as Bengel/Lightfoot/EGT,
  `3↔8/9`, `0↔8/9`, `1↔7`, `7↔1/2`, `5↔6/8`, `6↔5`, `2↔7`, `9↔0/8/3`):
  applied to out-of-range verse numbers.
- **A second, distinct OCR artifact found and corrected**: "Verse 13.—"
  repeatedly comes out as "Verse 138.—" (and similarly for other verses) —
  a stray trailing digit glued onto an otherwise-correct number, not a
  single-digit substitution. Confirmed by direct inspection across many
  instances: dropping the trailing digit both fits the Psalm's real verse
  count AND matches the quoted content in every sampled case (e.g. Psalm
  41:13 "Amen, and Amen" — its real closing doxology verse; Psalm 19:13
  "the great transgression" — real KJV text at that reference).
- **Sequence-order tie-break**: when a bare digit-swap leaves more than one
  numerically valid candidate, the Notes/Hints sections' own non-decreasing
  verse order breaks the tie — among otherwise-equal candidates, the one
  that continues forward from the last confirmed verse in that Psalm's
  notes is preferred.
- **Unresolvable entries are excluded from publication, not guessed at**:
  same policy as Bengel/EGT. 20 individual verse-notes (of ~4,030) had no
  unambiguous correction and were dropped rather than published with a
  wrong reference.
- **Contaminated Exposition entries are also excluded**: when a section
  marker is missed (6 cases), that Psalm's Exposition span cannot be
  trusted not to have silently absorbed real Explanatory-Notes quoted
  material — confirmed by direct inspection of one case (Psalm 57), whose
  "exposition" span turned out to end with a quoted, attributed Franz
  Delitzsch extract, not Spurgeon's own words. Rather than risk shipping
  a quotation mislabeled as Spurgeon's, the Exposition entry for that
  Psalm is dropped (the Psalm's Notes/Hints entries, when present and
  unaffected, are still published).

## Known limitation: Psalm 119

Psalm 119 (176 verses, the longest Psalm) is printed with a completely
different internal structure from every other Psalm in this work: instead
of one "Explanatory Notes and Quaint Sayings" section for the whole Psalm,
it is broken into 22 subsections matching its Hebrew acrostic stanzas,
each headed "NOTES ON VERSES N to M." — a heading convention this importer
does not yet parse. Its opening "Whole Psalm" framing essay and its Hints
section (explicitly credited in the source to a guest contributor, "C. A.
DAVIS, OF BRADFORD," not Spurgeon) are included; its per-octet Exposition
and Explanatory Notes are not. See PENDING.md.

## Coverage published

150 of 150 Psalms have at least one entry. ~4,010 entries total (Exposition
+ Explanatory Notes + Hints combined). Zero duplicate IDs, zero empty
content, zero mojibake, zero malformed references — see VALIDATION.md.

## Attribution

C. H. Spurgeon (1834-1892). Explanatory-Notes quotations are individually
credited within the text to their real authors (never Spurgeon), exactly
as printed in the source. Public domain (1869-1885 publication).
