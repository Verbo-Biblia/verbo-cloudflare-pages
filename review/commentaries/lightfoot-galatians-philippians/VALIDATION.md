# J. B. Lightfoot — Galatians and Philippians — validation

Wave 2, items 3-4. Validated 2026-08-27.

## Automated checks (234 entries: 123 Galatians + 111 Philippians)

| Check | Result |
|---|---|
| JSON parses (manifest, coverage, books, indexes) | ✅ all valid |
| Duplicate entry IDs | ✅ 0 |
| Empty/near-empty content | ✅ 0 |
| Malformed reference (chapterEnd < chapterStart) | ✅ 0 |
| Replacement character (U+FFFD) | ✅ 0 |
| Mojibake | ✅ 0 |
| Leaked running-header text ("EPISTLE TO THE...") | ✅ 0 |
| Unresolved reference anomalies | ✅ 0 |
| Entry size bound (max ~18,000 chars) | ✅ enforced, max observed 17,999 |
| Book-boundary correctness | ✅ Galatians ends 6:18, Philippians ends 4:22 — both plausible real endpoints (Philippians 4:23 is a one-line benediction Lightfoot doesn't separately annotate, same pattern seen elsewhere in this corpus) |

## Content spot checks

- **Philippians 2:6** (the kenosis passage, "being in the form of God"):
  verified Greek "ὃς ἐν μορφῇ θεοῦ ὑπάρχων οὐχ ἁρπαγμὸν ἡγήσατο τὸ εἶναι
  ἴσα θεῷ" correctly shown; Lightfoot's own commentary on μορφή vs φύσις
  present and readable despite OCR noise.
- **Galatians 6:18** and **Philippians 4:22**: confirmed these are the
  real last commented verses via direct entry inspection, not an
  accidental truncation.
- **Philippians 1:21** ("to die is gain"): confirmed the corrected entry
  (was OCR'd as verse "70") reads correctly and matches its real content.

## Registry / catalog wiring

No new manifest ID was created — Galatians and Philippians were added as
two more books inside the existing `lightfoot-colossians-philemon`
module (already registered since Wave 1). `tools/build_registry_catalog.py`
re-run to refresh the embedded catalog with the updated manifest (now
listing 4 books instead of 2). `CACHE_VERSION` bumped in
`biblia/service-worker.js` so the updated book list and content reach
already-visiting users, not just fresh ones.

## Live browser testing

Static site served locally, driven with real Chrome automation against
`biblia/index.html`.

1. **Selector**: opened the commentary panel on Galatians 2, selected
   "Lightfoot" -- module now shows entries for GAL 2:5, 2:7, 2:16,
   2:20... in sequence, confirming the merged 4-book module (GAL, PHP,
   COL, PHM) works as one selection.
2. **Content rendering, Galatians 2:3** (Titus not compelled to be
   circumcised): expanded "Original en inglés" and confirmed the
   verified Greek reference line rendered first ("ἀλλ᾽ οὐδὲ Τίτος ὁ σὺν
   ἐμοί, Ἕλλην ὤν, ἠναγκάσθη περιτμηθῆναι·"), followed by Lightfoot's own
   (OCR-imperfect in spots) historical commentary -- exactly as
   designed.
3. **Translation (EN→ES)**: triggered correctly (same shared code path,
   no Lightfoot-specific translation code); same CORS/localhost-origin
   timeout already documented for Theology of Work and Bengel, handled
   gracefully by the app's own fallback.
4. **Console**: no errors beyond the expected translation-endpoint
   timeout.
5. **Mobile**: not independently re-verified -- same reasoning as the
   other Wave 2 items (no new UI/CSS/markup added; shared commentary
   panel code with every other already-shipped commentary).

## Known limitation, by design

`manifest.json`'s `notes` field explicitly documents the mixed sourcing
(Colossians/Philemon from a human-proofread Gutenberg edition;
Galatians/Philippians from raw OCR with verified-Greek-reference
annotations) so this is visible to anyone inspecting the module later,
not just buried in this review directory.
