# Theology of Work Bible Commentary — validation

Wave 2, item 1. Validated 2026-08-27.

## Automated checks (all 635 entries, all 66 books)

| Check | Result |
|---|---|
| JSON parses (`manifest.json`, `coverage.json`, every `books/*.json` + `.index.json`) | ✅ all valid |
| Duplicate entry IDs within a book | ✅ 0 |
| Empty/near-empty `content` | ✅ 0 |
| Malformed reference (`chapterEnd < chapterStart`, or same-chapter `verseEnd < verseStart`) | ✅ 0 |
| Replacement character (U+FFFD) | ✅ 0 |
| Mojibake (`Ã¢â‚¬`, `â€™`, `â€œ`, `Â `) | ✅ 0 |
| Leaked site chrome ("Back to Table of Contents", cookie/GTM scripts, "click here to read") | ✅ 0 |
| Soft hyphens (U+00AD, print-justification artifact) | ✅ 0 (716 found and stripped) |
| Embedded copyrighted Bible text (`<blockquote>` Scripture) | ✅ 109 replaced with reference markers, 4 more force-stripped after manual read, 3 confirmed non-Scripture and kept — see PROVENANCE.md |
| Book coverage | ✅ 66 of 66 |

Reference-parser correctness was validated *before* any content was
written: `parse_heading_references()` was run against all 606 real
section headings extracted from the 51 fetched pages, with every result
printed and read, not just the ones an automated check happened to flag.
See PROVENANCE.md for the specific edge cases this caught and fixed
(person/word-name collisions with book names, chapter-vs-verse
continuation logic, cross-book ranges, single-chapter books).

## Registry / catalog wiring

- `theology-of-work/manifest.json` added, `biblia/modules/registry.json`'s
  plain `commentaries` array updated to include it.
- `tools/build_registry_catalog.py` re-run to regenerate the *embedded*
  `registry.json → catalog.commentaries` blob that the app actually reads
  (see "Critical Wave 1 regression found and fixed" below) — now 16
  commentaries, TOW included.

## Critical Wave 1 regression found and fixed (Paso 0)

While testing TOW's selector in a real browser, **none of Wave 1's four
new commentaries (Poole, Trapp, Lightfoot, Luther) appeared either** —
only the 11 commentaries that existed before Wave 1. Root cause: this
codebase's service worker (`biblia/service-worker.js`) caches
`modules/*.json` cache-first with no `?v=` busting (a gap the file's own
comments already document, dated 2026-08-03) — the app shell updates
fine (network-first), but a returning visitor's already-cached
`registry.json` never gets re-fetched until `CACHE_VERSION` is bumped.
**Wave 1's five commits that added new commentaries never bumped it**, so
any user who had visited `/biblia/` before Wave 1 shipped would still be
looking at the pre-Wave-1 commentary list today, silently, with no error.

Fixed by bumping `CACHE_VERSION` (`verbo-biblia-v66-notas-popup-unify` →
`verbo-biblia-v67-wave2-commentaries`) — confirmed in a real browser
session that this clears the stale cache entry and the fresh
`registry.json` (all 15 Wave-1-and-earlier commentaries, then all 16 with
TOW added) loads correctly afterward. This is a genuinely separate fix
from the TOW import itself, committed separately (see commit list in the
final Wave 2 report) precisely because it repairs Wave 1, not Wave 2.

**Consequence for future waves**: every commentary added in Wave 2
(items 2-7) needs this same `CACHE_VERSION` bump to actually reach
already-visiting users — bumping it once now, before Wave 2 continues,
covers TOW; whichever commit finishes the *last* Wave 2 item should bump
it again (or this one bump can be left as the single point of truth if
Wave 2 finishes in one sitting — judgment call for whoever ships last).

## Live browser testing

Static site served locally (`python3 -m http.server`), driven with real
Chrome automation (not a mock) against `biblia/index.html`.

1. **Selector**: opened the commentary panel on Romans 1, opened the
   `<select>` — TOW appears as "● TOW" (● = has content for the active
   verse), full name "Theology of Work Bible Commentary" and author
   "Theology of Work Project" shown once selected.
2. **Per-verse availability**: Romans 1:1's commentary-count badge went
   from 8 (stale cache) to 11 (fresh, includes Poole/Trapp/TOW) after the
   cache fix. Selecting TOW rendered "Introduction to Romans" (the
   chapter-0 entry) correctly.
3. **Multi-book entries**: navigated to Hosea 1, selected TOW — rendered
   "God Demands Change (Hosea 1:1-9, Micah 2:1-5)" under **Hosea**, with
   the shared content correctly attributed. Confirms the multi-book
   section-sharing design (see PROVENANCE.md) works in the real UI, not
   just in the JSON.
4. **Scripture-blockquote stripping, live**: scrolled through the same
   Hosea entry and confirmed "[Cita bíblica: Micah 2:1–2 — consulta tu
   Biblia activa]" renders exactly where the original NRSV blockquote
   would have been.
5. **Translation (EN→ES)**: switching the UI to Spanish correctly
   detected TOW's `language: "en"` and triggered the existing on-demand
   translation pipeline (same code path Poole/Trapp/Lightfoot/Luther
   already use — no TOW-specific translation code was written). The
   request reached the real production Worker
   (`verbo-api-bible...workers.dev/translate`, confirmed via network
   inspection, OPTIONS preflight succeeded). The POST didn't visibly
   complete from this local test origin within the session — plausibly a
   CORS/domain restriction on that real, Anthropic-billed endpoint, not
   something worth repeatedly retrying against a paid API just to satisfy
   a local test. Wiring is confirmed correct; full network round-trip
   wasn't force-verified from localhost.
6. **Console**: no errors or warnings at any point across the session.
7. **Mobile**: the commentary panel is rendered by the same shared
   UI/CSS every other commentary already uses in production — this
   import added no new markup, script, or stylesheet, so there is no
   mechanism for TOW specifically to behave differently on mobile than
   Matthew Henry or any other already-shipped commentary. The browser
   automation tool's `resize_window` call did not actually change the
   rendered viewport in this environment (`window.innerWidth` stayed
   1440 after a requested 390×844 resize), so a literal mobile
   screenshot wasn't obtained — noted honestly rather than claimed.

## Not yet independently re-reviewed

Per the standing note in `project_wave1_review_pending` (memory), Wave 1
imports haven't had an independent second-pass content-fidelity review.
TOW's own content fidelity was spot-checked (Romans intro/conclusion,
the Hosea/Micah cross-book entry) against the live theologyofwork.org
pages during PROVENANCE.md's research, but not re-verified by a second,
independent pass — flagging this consistently with how Wave 1 items were
flagged, not silently omitting it.
