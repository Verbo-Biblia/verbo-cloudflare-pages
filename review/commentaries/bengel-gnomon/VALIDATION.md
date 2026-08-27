# Bengel's Gnomon — validation

Wave 2, item 2. Validated 2026-08-27. Scope: **published books only**
(Matthew, Mark, Romans, 1 Corinthians, 2 Corinthians) — see PENDING.md
for Luke/John/Acts/the rest, held back.

## Automated checks (2295 published entries)

| Check | Result |
|---|---|
| JSON parses (manifest, coverage, every `books/*.json` + `.index.json`) | ✅ all valid |
| Duplicate entry IDs | ✅ 0 |
| Empty/near-empty content | ✅ 0 |
| Malformed reference (chapterEnd < chapterStart) | ✅ 0 |
| Replacement character (U+FFFD) | ✅ 0 |
| Mojibake (`Ã¢â‚¬`, `â€™`, `â€œ`) | ✅ 0 |
| Unresolved reference anomalies (`verse-out-of-range-unresolved`) within published books | ✅ 0 |
| Book-boundary correctness | ✅ Matthew ends 28:20, Mark 16:20, Romans 16:27, 1 Corinthians 16:23, 2 Corinthians 13:14 — all real KJV last verses |

966 `auto-corrected-premature-chapter-bump` and 23
`auto-corrected-ocr-digit` corrections were applied across all 5 volumes
during parsing (most in the unpublished Luke/John/Acts/etc. portions) —
every one logged with its specific before/after and reasoning in
`ANOMALIES.json`; none silent. Zero of these auto-corrections landed on
an ambiguous case (multiple candidates fitting) — those are exactly what
went to the `verse-out-of-range-unresolved` bucket and kept the affected
books out of `PUBLISHED_BOOKS`, per PENDING.md.

## Content spot checks

- **Matthew 1:1**: verified Greek reference correctly shows "Βίβλος
  γενέσεως Ἰησοῦ Χριστοῦ υἱοῦ Δαυὶδ υἱοῦ Ἀβραάμ." even though Bengel's own
  OCR'd text is severely garbled ("BijBXos Vivisitiis") -- both shown,
  neither silently dropped or "fixed" into the other.
- **Romans 8:28** ("all things work together for good"): verified Greek
  matches; Bengel's commentary text present and readable despite minor
  OCR noise (e.g. an apostrophe rendered as an HTML entity) that doesn't
  affect meaning.
- **Luke 1:34** (only reachable via the unpublished portion, checked
  during development): confirmed the single-digit OCR correction
  (1:84 → 1:34) against content -- "πῶς, how)" opens Bengel's note on
  Mary's "How can this be?", unambiguously verse 34, not a real verse 84
  (Luke 1 only has 80 verses).

## Registry / catalog wiring

- `bengel-gnomon/manifest.json` added, `biblia/modules/registry.json`'s
  plain `commentaries` array updated to include it.
- `tools/build_registry_catalog.py` re-run to regenerate the embedded
  `registry.json → catalog.commentaries` blob the app actually reads
  (same step Theology of Work needed — see
  [[project_wave2_cache_version_bug]] in memory).
- `CACHE_VERSION` bumped in `biblia/service-worker.js` so this reaches
  users with an already-cached session, not just fresh visitors — the
  same Wave-1 regression class already fixed once this Wave.

## Live browser testing

Static site served locally, driven with real Chrome automation against
`biblia/index.html`.

1. **Selector**: opened the commentary panel on Romans 8, opened the
   `<select>` — "Bengel" appears once the fresh catalog/cache landed
   (confirmed the same Wave-1-class caching gap applies here too until
   `CACHE_VERSION` is bumped and activated — see above).
2. **Content rendering, Romans 8:28**: selected Bengel, confirmed title
   "Romans 8:28", author "Johann Albrecht Bengel", and — critically — the
   verified Greek reference line rendered first in italics ("Οἴδαμεν δὲ
   ὅτι τοῖς ἀγαπῶσιν τὸν θεὸν πάντα συνεργεῖ..."), followed by Bengel's
   own historical (OCR-imperfect in spots, e.g. "O'idafiiv 8i") text,
   exactly as designed -- both shown, neither silently dropped nor
   "corrected" into the other.
3. **Translation (EN→ES)**: switching the UI to Spanish correctly
   detected `language: "en"` and triggered the existing on-demand
   translation pipeline (same code path every other EN commentary
   uses -- no Bengel-specific translation code was written). Console
   showed repeated "`/translate no respondió tras 3 intentos`" — the app's
   own graceful fallback message, falling back to showing the original
   text. Same CORS/localhost-origin limitation already documented for
   Theology of Work; not a defect in this import.
4. **Console**: no JS errors or exceptions beyond the expected
   translation-endpoint timeout above.
5. **Mobile**: not independently re-verified for this module -- same
   reasoning as Theology of Work applies (no new UI/CSS/markup was added
   by this import; the commentary panel is 100% shared code with every
   other already-shipped commentary).

## Known limitation, by design

The `bengel-gnomon` module currently only lists 5 books
(MAT/MRK/ROM/1CO/2CO) in its manifest — this is deliberate partial
coverage, not a bug. `manifest.json`'s `notes` field states this
explicitly so it's visible to anyone inspecting the module later, and
PENDING.md has the exact reopening plan.
