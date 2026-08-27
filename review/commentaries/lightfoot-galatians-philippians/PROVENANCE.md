# J. B. Lightfoot — Galatians and Philippians — provenance

Wave 2, items 3-4. Fetched and imported 2026-08-27. Extends Wave 1's
`lightfoot-colossians-philemon` module (kept as one "J. B. Lightfoot"
module with partial NT coverage, per Juan's explicit instruction, rather
than a separate module per book).

## Edition

| Book | Title | Publisher | Year | archive.org identifier |
|---|---|---|---|---|
| Galatians | *Saint Paul's Epistle to the Galatians: a revised text with introduction, notes and dissertations* | London: Macmillan | 1887 | `cu31924029294125` |
| Philippians | *Saint Paul's Epistle to the Philippians; a revised text* | London: Macmillan | 1888 | `cu31924029294398` |

Both digitized from **Cornell University Library** copies via archive.org
(same library and same "no known copyright restrictions in the United
States on the use of the text" declaration already used for Bengel).
Lightfoot's Galatians was first published 1865 and Philippians 1868;
these are later, unrevised (Lightfoot died 1889 without further
revising either after the mid-1880s) reprints of the same fixed text —
content-equivalent to earlier printings, chosen for scan quality, not
textual novelty.

SHA-256 checksums: `SOURCE-CHECKSUMS.txt` in this directory.

## Why raw OCR, not a clean edition like Wave 1's Colossians/Philemon

Wave 1's Colossians/Philemon came from Project Gutenberg #50857, a
**human-proofread** (Distributed Proofreaders) transcription — hence its
clean Greek Unicode throughout. **No Gutenberg edition exists for either
Galatians or Philippians** — confirmed directly against gutenberg.org's
own search (`gutenberg.org/ebooks/search/?query=Lightfoot+Galatians` and
`...+Philippians` both return "No records found"), not inferred from a
general web search. The one structured HTML alternative considered
(biblehub.com, StudyLight.org) was not checked further for these two
specific books once the Bengel investigation had already established
that biblehub's "verse Bengel" module carries an unclear third-party-
rights pattern (see `review/commentaries/bengel-gnomon/PROVENANCE.md`) —
the same caution reasonably extends here rather than re-litigating it
per book. Raw, machine-only OCR from archive.org is therefore the source,
same situation and same quality-control techniques as Bengel's Gnomon.

## Method

Importer: `tools/import_lightfoot_galatians_philippians.py`, adapting
the techniques proven on Bengel:

- **Verified Greek, not blind correction**: Lightfoot's own quoted Greek
  lemmas are frequently OCR-garbled into Latin look-alike characters
  (e.g. Philippians 2:6's ὃς ἐν μορφῇ θεοῦ ὑπάρχων came out as "os év
  poppy Ceod ὑπάρχων" in places). As with Bengel, no fuzzy-match
  "correction" is attempted; instead each verse's REAL, verified Greek
  text is looked up by reference from Verbo's own vetted Greek NT
  (`biblia/modules/original-languages`) and shown as a reference line
  ahead of Lightfoot's own (unaltered) historical text.
- **Chapter tracking uses a stronger anchor than Bengel had**: neither
  book has "CHAPTER N." headings at all (confirmed: zero occurrences of
  the literal word "CHAPTER" in either raw OCR file). Chapter tracking
  instead relies primarily on a periodic page-margin reference unique to
  this source's typesetting — recto/verso running headers of the exact
  form "II. 6]" / "[II. 7" (chapter + the verse range printed on that
  page), appearing roughly every 1-3 pages — which is authoritative
  and self-correcting whenever found, with a verse-number-decrease
  fallback (as used for Bengel) only between anchors.
- **Entries close with "]", not ")"** — Lightfoot's own convention
  differs from Bengel's Fausset-translated edition.
- **Oversized entries are chunked** (max ~18,000 chars, "— Part N"
  suffix), reusing the exact convention Wave 1's own Lightfoot importer
  established for its introduction sections — applied here to EVERY
  entry type (introductions, the closing "Additional Notes and
  Dissertations", and individual verse entries), since Lightfoot
  sometimes attaches a lengthy excursus to a single verse (e.g.
  Galatians 4:30's note on Hagar and Ishmael ran to ~68,000 characters
  unchunked before this fix).
- **Trailing dissertations preserved, not discarded or misattributed**:
  a confirmed bug during development had the LAST verse entry of each
  book silently absorbing everything to end-of-file — including a
  genuine "Detached Note" on Clement of Rome (~500KB, legitimately
  Lightfoot's own scholarly excursus following Philippians 4:22-23) AND
  unrelated Macmillan back-cover advertising for other books. Fixed by
  bounding real content at the "INDEX" marker and capturing the
  in-between material as its own labeled "Additional Notes and
  Dissertations" entry (chunked like everything else) instead.
- **Manually confirmed OCR digit fix**: Philippians "verse 70" (no
  chapter has 70 verses) relabeled to verse 21 — confirmed by the
  entry's own content, "ἀποθανεῖν κέρδος" = "to die is gain",
  unmistakably Philippians 1:21.

## Coverage

**Galatians**: 123 entries, chapters 1-6 (all), first entry 1:2, last
entry 6:18 (Galatians' real last verse). **Philippians**: 111 entries,
chapters 1-4 (all), first entry 1:2, last entry 4:22. Zero unresolved
reference anomalies — full detail: `ANOMALIES.json` in this directory
(11 `chapter-corrected-by-anchor`, all self-correcting drift caught by
the periodic page-margin anchors; 1 manually-confirmed digit fix; 1
verse with no matching verified-Greek data available).

## Attribution

J. B. Lightfoot (1828-1889). Public domain (1887/1888 publication,
Cornell University Library scans, "no known copyright restrictions").
