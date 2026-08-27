# The Treasury of David — validation

Wave 2, item 6. Validated 2026-08-27.

## Automated checks (4,010 entries)

| Check | Result |
|---|---|
| JSON parses (manifest, coverage, all 150 chapter files) | ✅ all valid |
| Duplicate entry IDs | ✅ 0 |
| Empty/near-empty content | ✅ 0 |
| Malformed reference (chapterEnd < chapterStart or verseEnd < verseStart) | ✅ 0 |
| Replacement character (U+FFFD) | ✅ 0 |
| Entry size bound (max ~18,000 chars, chunked with "Part N") | ✅ enforced |
| Psalm coverage | ✅ all 150 Psalms have at least one entry |
| Author attribution split | ✅ 1,979 entries "C. H. Spurgeon" (Exposition + Hints), 2,031 entries "Various authors, compiled by C. H. Spurgeon" (Explanatory Notes) |

## A real bug caught and fixed mid-validation

A missed section-header marker (OCR dropped "EXPLANATORY NOTES..." on one
page entirely, not merely garbled it) meant that Psalm 57's computed
"Exposition" span silently absorbed the tail of its real Explanatory Notes
content — confirmed by direct inspection: the span ended with a quoted,
attributed Franz Delitzsch extract, not Spurgeon's own prose. This is
exactly the "blur Spurgeon's own words with his quotations of others"
failure mode the whole three-way section split exists to prevent. Fixed by
tracking which Psalm indices a missed marker makes untrustworthy and
dropping just their Exposition entry (5 further Psalms similarly affected:
99, 110, 111, 113, plus Psalm 119 for an unrelated, documented reason —
see PENDING.md) rather than risk shipping a misattributed quotation.

## Content spot checks

- **Psalm 23** ("The LORD is my shepherd"): Exposition entry renders
  Spurgeon's own commentary correctly, attributed "C. H. Spurgeon"; a
  separate "Explanatory Notes and Quaint Sayings" entry, attributed
  "Various authors, compiled by C. H. Spurgeon", confirmed distinct in
  the live UI (see Live browser testing below).
- **Psalm 1**: Title/Division framing notes (Spurgeon's own) correctly
  folded into the Exposition entry; Explanatory Notes entries for verse 1
  show multiple authors' extracts (Thomas Watson, Sir Richard Baker, John
  Fry, John Trapp, Adam Clarke, Martin Luther, Thomas Adams), each ending
  in its own "—Author, Year" attribution preserved verbatim.
- **Psalm 41:13 / 19:13 / etc.**: the "N8"→"N" OCR-artifact correction
  (see PROVENANCE.md) verified against actual KJV verse content in every
  sampled case (e.g. Psalm 41:13's real closing doxology "Amen, and
  Amen").

## Registry / catalog wiring

New manifest `spurgeon-treasury-of-david`, registered in
`biblia/modules/registry.json`. `tools/build_registry_catalog.py` re-run
(58 modules total, up from 57). `CACHE_VERSION` bumped to
`v71-spurgeon-treasury-of-david` in `biblia/service-worker.js`.

## chapterSplit (new for this module)

At ~15MB combined (the next-largest single-book commentary file in Verbo,
JFB's PSA.json, is 628KB), one flat `books/PSA.json` would be a real cost
for every reader on every Psalm view. This module ships
`"chapterSplit": true` and per-Psalm files at
`books/PSA/<psalm-number>.json` instead — confirmed via the Network panel
during live testing that opening Psalm 23's commentary fetches only
`23.json`, not the whole book.

## Live browser testing

Tested locally (`python3 -m http.server 8795`, service worker force-
updated to `v71-spurgeon-treasury-of-david`) at
`http://localhost:8795/biblia/index.html?book=PSA&chapter=23`:

- Selected "ToD" in the commentary dropdown — three entries loaded for
  Psalm 23: "Psalm 23" (author "C. H. Spurgeon"), "Psalm 23 —
  Explanatory Notes and Quaint Sayings" (author "Various authors,
  compiled by C. H. Spurgeon"), "Psalm 23:1 — Explanatory Notes and
  Quaint Sayings" — confirming the author-field split renders correctly
  end to end, not just correct in the JSON.
- EN→ES on-demand translation triggered automatically ("Traduciendo...")
  through the same shared pipeline used by every other English
  commentary — no parallel translation path was built.
- Expanded "Original en inglés" on the Exposition entry: Spurgeon's full
  English prose (KJV text plus commentary) renders correctly.
- `performance.getEntriesByType('resource')` confirmed only
  `manifest.json` and `23.json` were fetched for this module — the
  chapterSplit per-Psalm file, not the whole book.
- Console: no errors observed during this session.

## Known limitations, by design

`manifest.json`'s `notes` field documents Psalm 119's unique unparsed
acrostic-stanza structure, the 6 Psalms with a dropped Exposition entry,
and the 20 excluded individual notes — all cross-referenced to
`ANOMALIES.json` and `PENDING.md`.
