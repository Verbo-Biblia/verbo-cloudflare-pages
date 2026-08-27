# Expository Thoughts on the Gospels (J. C. Ryle) — provenance

Wave 2, item 7 (final item). Fetched and imported 2026-08-27.

## Sources, per Gospel

- **Matthew**: CCEL (`ccel.org/ccel/ryle/matthew`) — real, clean,
  human-transcribed text (Rights: Public Domain, stated on the page
  itself). Checked directly, not assumed: this is NOT the "images only"
  situation found for Spurgeon's Treasury of David on this same site
  earlier in this wave.
- **Mark, Luke, John**: no CCEL edition exists for these three; no
  Project Gutenberg edition exists for any of the four (confirmed against
  gutenberg.org's own search). Raw archive.org OCR of the original
  7-volume edition (Rev. J. C. Ryle, *Expository Thoughts on the
  Gospels, For Family and Private Use, With the Text Complete*,
  R. Carter & Brothers / William Hunt, 1856-1879), all confirmed
  `NOT_IN_COPYRIGHT` in archive.org's own scanning metadata:

| Gospel / vol. | archive.org identifier | Chapters |
|---|---|---|
| Mark (whole) | expositorythough02ryle | 1-16 |
| Luke vol. 1 | expositorythoug08rylegoog | 1-10 |
| Luke vol. 2 | expositorythoug05rylegoog | 11-24 |
| John vol. 1 | expositorythough05ryle | 1-6 |
| John vol. 2 | expositorythough06ryle | 7-12 |
| John vol. 3 | expositorythough07ryle | 13-21 |

SHA-256 checksums: `SOURCE-CHECKSUMS.txt` in this directory.

**A gap and how it was filled**: the original R. Carter numbered 7-volume
set's own Luke volumes (identifiers `expositorythough03ryle` /
`expositorythough04ryle`) are dark on archive.org — no files, no OCR
available at all. Google Books scans of the SAME original edition
(Ipswich: William Hunt) substitute for those two volumes only, confirmed
independently `NOT_IN_COPYRIGHT`, and confirmed by direct inspection to
cover the identical, contiguous chapter ranges (1-10, then 11-24) with no
gap or overlap against the rest of the set's numbering.

**Rejected**: a 1986/1987 Banner of Truth reprint of Luke on archive.org
(`expositorythough0000ryle_q5x3`) is access-restricted on archive.org
itself — a modern reprint's own typesetting/edition can carry separate
rights even where the underlying 1858 text is public domain, the same
caution already applied to CCEL's own added material elsewhere in this
wave. Not used.

## Structure

Unlike Spurgeon's Treasury of David (Wave 2, item 6), Ryle's own text is
**not** a compiled multi-author anthology — every word is his own, so
there is no author-attribution split to make; every entry is
`author: "J. C. Ryle"`.

Ryle works by **pericope**, not verse-by-verse (per the brief for this
item). Each section is headed by its own verse range — `Matthew 1:1-17`
(CCEL) or `MARK I. 1-8.` (archive.org OCR) — followed by (OCR editions
only; CCEL's transcription omits the reprinted verse text) the KJV verse
text, then Ryle's own continuous prose. **Each such pericope becomes
exactly one entry** — never split further, never merged across
pericopes, preserving Ryle's own natural units.

The OCR editions also carry a secondary **"Notes." subsection** per
pericope (brief word/phrase glosses, e.g. `[The best robe.] Some try to
prove...` on Luke 15:11-24) — still entirely Ryle's own writing, reprinting
the identical pericope heading a second time prefixed "NOTES."/"NOTBS."
Detected and **folded into the same entry** as its pericope (appended
after the main exposition) rather than creating a second, confusingly
duplicate entry with the identical reference.

## Chapter-boundary detection (a real lesson learned mid-import)

The first design attempt reused this wave's now-standard "count heading
occurrences, never trust the parsed roman-numeral value" technique
(proven on Bengel/Lightfoot/EGT/Treasury of David) — and it actively
**drifted the chapter count wrong** here. Root cause, confirmed by direct
inspection: this source's roman numerals mostly OCR correctly in a clean
ascending sequence (I, IV, V, VI, VII, VIII, IX, X...), so a bare
"+1 whenever the token changes" rule broke in two ways at once — (a) a
single stray misread (`IX` → `XIX`) still counts as "a change" but isn't
really +1, and (b) a genuine multi-chapter gap between consecutive
pericopes (Ryle doesn't necessarily write one for every chapter) needs
more than +1. The fix: **parse the roman numeral's actual value** and
trust it directly, only overriding when implausible (decreasing, or
jumping further than 5 chapters in one step) — in which case the heading
is treated as a corrupted repeat of the current chapter, not a real
transition. "II" (chapter 2) is short enough that OCR frequently fuses it
into a single "n"/"N" glyph; "III" (chapter 3) was OCR'd as "in", "nx",
"m", "ni" across different headings for the very same chapter — both
handled as explicit, confirmed-by-inspection literal alternatives, not a
generic short-word wildcard (which would risk false matches elsewhere in
the running prose).

## OCR quality control

- **Digit-confusable correction** (same technique as this wave's other
  OCR-sourced imports): applied to out-of-range verse numbers.
- **Backwards ranges excluded**: a few pericope headings printed a
  verseStart > verseEnd range (e.g. "67—66") that a single-digit swap
  can't safely disambiguate on its own — excluded rather than published
  with an internally-contradictory reference.
- **CCEL back-matter boundary**: CCEL appends its own per-chapter
  table-of-contents link list and an "Indexes" section (Scripture
  references, thematic index, raw `.html3` links) after Matthew's real
  commentary ends. Without truncating there, the LAST pericope entry
  (Matthew 28:11-20, with no next heading to bound it) would have
  silently absorbed all of that as its own content — the same "last
  entry swallows trailing back matter" failure already caught and fixed
  for Lightfoot's Colossians/Philemon in Wave 1. Truncated at the
  "Indexes" marker before parsing.
- **Unresolvable entries excluded from publication, never guessed**:
  same policy as this wave's other OCR imports. ~10 individual pericope
  headings (out of ~550) had no unambiguous verse-number correction and
  were dropped rather than published with a wrong reference; see
  `ANOMALIES.json`.

## Coverage published

All 4 Gospels, full chapter coverage (Matthew 1-28, Mark 1-16, Luke 1-24,
John 1-21). 542 entries total. Zero duplicate IDs, zero empty content,
zero mojibake, zero malformed references, zero oversized entries — see
VALIDATION.md.

## Attribution

J. C. Ryle (1816-1900). Public domain (1856-1879 publication).
