# Expository Thoughts on the Gospels (J. C. Ryle) — validation

Wave 2, item 7 (final item). Validated 2026-08-27.

## Automated checks (542 entries)

| Check | Result |
|---|---|
| JSON parses (manifest, all 4 book files + index files) | ✅ all valid |
| Duplicate entry IDs | ✅ 0 |
| Empty/near-empty content | ✅ 0 |
| Malformed reference (chapterEnd < chapterStart or verseEnd < verseStart) | ✅ 0 |
| Replacement character (U+FFFD) | ✅ 0 |
| Entry size bound (max ~18,000 chars) | ✅ 0 oversized (the one initial violation, Matthew 28:11-20 absorbing CCEL back matter, was root-caused and fixed — see PROVENANCE.md) |
| Chapter coverage | ✅ Matthew 1-28, Mark 1-16, Luke 1-24, John 1-21 — all complete |
| Author attribution | ✅ 542/542 entries "J. C. Ryle" (no compiled-quotation split needed — every word is Ryle's own) |

## Two real bugs caught and fixed mid-validation

1. **Chapter-drift from blindly reusing the "count heading occurrences"
   technique.** This wave's proven Bengel/Lightfoot/EGT/Treasury-of-David
   pattern actively made Luke/John chapter numbers wrong here, because
   this source's roman numerals mostly OCR correctly (unlike those
   sources) — a bare "+1 per detected change" both over-counted a single
   stray misread (`IX`→`XIX`) and under-counted genuine multi-chapter
   gaps between pericopes. Fixed by trusting the parsed roman-numeral
   value directly, with an implausibility guard as the fallback instead
   of the primary signal. See PROVENANCE.md for the full account.
2. **A hidden duplicate-entry source**: each OCR pericope has its own
   "Notes." subsection reprinting the identical heading a second time,
   which without special handling created a confusing second entry with
   the exact same reference (caught via a duplicate-ID check on
   `Luke 15:11-24`). Fixed by detecting the "NOTES."/"NOTBS." prefix and
   merging that content into the same entry instead.

## Content spot checks

- **Matthew 1:1-17**: CCEL text renders correctly, Ryle's own opening
  reflection on "These verses begin the New Testament..." present.
- **Luke 15:11-24** (the Prodigal Son, part 1): main exposition plus its
  merged "Notes." glosses (`[The best robe.]`, `[A ring.]`) confirmed
  present together in one entry, not split into a confusing duplicate.
- **Matthew 28:11-20** (the Great Commission, last pericope in Matthew):
  confirmed to end at Ryle's own real conclusion ("...Let us believe that
  no one shall ever work faithfully for Christ...") rather than
  continuing into CCEL's reference-index back matter.

## Registry / catalog wiring

New manifest `ryle-expository-thoughts`, registered in
`biblia/modules/registry.json`. `tools/build_registry_catalog.py` re-run
(59 modules total, up from 58). `CACHE_VERSION` bumped to
`v72-ryle-expository-thoughts` in `biblia/service-worker.js`.

## Live browser testing

Tested locally (`python3 -m http.server 8796`, service worker force-
updated to `v72-ryle-expository-thoughts`) at
`http://localhost:8796/biblia/index.html?book=LUK&chapter=15`:

- Selected "Ryle" in the commentary dropdown — "Luke 15:1-10" and
  "Luke 15:11-24" entries loaded, both attributed "J. C. Ryle".
- EN→ES on-demand translation triggered automatically through the same
  shared pipeline used by every other English commentary.
- Expanded "Original en inglés": full English prose (KJV verse text plus
  Ryle's own commentary, including the merged Notes glosses) renders
  correctly.
- Console: no errors observed during this session.

## Wave 2 status after this item

This was the last of the 7 planned Wave 2 items. Full-scope items:
Theology of Work, Lightfoot Galatians/Philippians, Ryle. Partial-scope
(documented, held-back remainder): Bengel's Gnomon, Expositor's Greek
Testament, Spurgeon's Treasury of David — see each module's own
PENDING.md.
