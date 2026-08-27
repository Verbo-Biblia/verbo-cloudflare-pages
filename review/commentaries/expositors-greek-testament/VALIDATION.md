# The Expositor's Greek Testament — validation

Wave 2, item 5. Validated 2026-08-27. Scope: **Volume 1 only** (Matthew,
Mark, Luke, John) — see PENDING.md.

## Automated checks (2676 entries)

| Check | Result |
|---|---|
| JSON parses (manifest, coverage, books, indexes) | ✅ all valid |
| Duplicate entry IDs | ✅ 0 |
| Empty/near-empty content | ✅ 0 |
| Malformed reference (chapterEnd < chapterStart) | ✅ 0 |
| Replacement character (U+FFFD) | ✅ 0 |
| Mojibake | ✅ 0 |
| Leaked running-header text ("KATA...", "EYATTEAION") in verse entries | ✅ 0 |
| Unresolved reference anomalies | ✅ 2 (excluded from publication, not shipped wrong — John 1:52, John 17:209) |
| Entry size bound (max ~18,000 chars) | ✅ enforced |
| Chapter coverage | ✅ Matthew 1-28, Mark 1-16, Luke 1-24, John 1-21 — all complete |
| Book-boundary correctness | ✅ Matthew 1:1-28:20, Luke 1:4-24:53, John 1:1-21:25 — real endpoints; Mark 1:1-16:17 (Bruce's own last comment, not necessarily 16:20) |

## A real bug caught and fixed mid-validation

John's chapter 2 was **entirely missing** on first pass (chapters jumped
1→3) — traced to a single OCR digit corruption (John 1:37 read as "Ver.
27") that a too-loose "verse decreased ⇒ new chapter" heuristic
misinterpreted as a real chapter boundary, silently derailing all of
John's subsequent chapter tracking. Fixed by requiring the "new" verse
number to be plausibly an actual early-chapter verse (≤10), not just
numerically smaller than the last one seen. This dropped total anomalies
from 450 to 150 and fully restored John's chapter 2 (the wedding at Cana,
confirmed present and correctly attributed after the fix).

## Content spot checks

- **Matthew 1:1**: Bruce's discussion of what "the book of the
  genealogy" heading covers (whole Gospel vs. first chapter vs. 1:1-17)
  present and readable.
- **John 2:1**: the Cana narrative's opening note (dating "the third
  day") confirmed present and correctly attributed to chapter 2 after
  the chapter-tracking fix above.

## Registry / catalog wiring

New manifest `expositors-greek-testament`, registered in
`biblia/modules/registry.json`. `tools/build_registry_catalog.py`
re-run. `CACHE_VERSION` bumped in `biblia/service-worker.js`.

## Live browser testing

Tested locally (`python3 -m http.server 8794`, service worker force-updated
to `v70-expositors-greek-testament`) at
`http://localhost:8794/biblia/index.html?book=JHN&chapter=2`:

- John 2:1's commentary badge shows the correct, incremented count
  (confirms EGT is now indexed and counted alongside the other modules).
- Selected "EGT" in the commentary dropdown — entry loads as "John 2:1",
  authored by **"Rev. Marcus Dods, D.D."**, never Nicoll — confirms the
  collective-work attribution requirement is correctly wired end to end,
  not just correct in the JSON.
- EN→ES on-demand translation triggered automatically ("Traduciendo...")
  through the same shared pipeline used by every other English
  commentary — no parallel translation path was built.
- Expanded "Original en inglés": Bruce/Dods' English prose renders
  correctly, and — as intended — **no verified-Greek-reference line**
  precedes it (unlike Bengel/Lightfoot). The commentator's own quoted
  Greek appears exactly as this edition's 1897 OCR rendered it.
- Console: no errors observed during this session.

## Known limitation, by design

`manifest.json`'s `notes` field documents the partial (Volume 1 only)
coverage and the deliberate absence of verified-Greek-reference
annotation (unlike Bengel/Lightfoot) explicitly, so both are visible to
anyone inspecting the module later.
