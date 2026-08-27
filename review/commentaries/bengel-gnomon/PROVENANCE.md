# Bengel's Gnomon of the New Testament — provenance

Wave 2, item 2. Fetched and imported 2026-08-27. **Published coverage:
Matthew, Mark, Romans, 1 Corinthians, 2 Corinthians only** — see
PENDING.md for what's held back and why.

## Edition (recorded before processing, per Juan's instruction)

**Title**: *Gnomon of the New Testament, by John Albert Bengel. Now first
translated into English. With original notes explanatory and
illustrative. Revised and edited by Rev. Andrew R. Fausset, M.A., of
Trinity College, Dublin.*

**Publisher**: Edinburgh: T. & T. Clark, 38 George Street.

**5 volumes**, containing the whole New Testament:

| Vol | Books | Edition | Year | Translator | archive.org identifier |
|---|---|---|---|---|---|
| I | Matthew, Mark | Seventh Edition | 1877 | Rev. James Bandinel (Matthew); Rev. Andrew Robert Fausset (Mark) | `cu31924092350515` |
| II | Luke, John, Acts | Seventh Edition | 1877 | Rev. Andrew R. Fausset | `cu31924092350523` |
| III | Romans, 1 Corinthians, 2 Corinthians | Seventh Edition | 1877 | Rev. James Bryce, LL.D. | `cu31924092350499` |
| IV | Galatians–Hebrews | Seventh Edition | 1877 | Rev. James Bryce, LL.D. | `cu31924092350507` |
| V | James–Revelation | Sixth Edition | 1866 | Rev. William Fletcher, D.D. | `cu31924092350531` |

Digitized from the **Cornell University Library** copy (bookplate:
"C.U.C.A. Biblical Reference Library. Presented by Alfred C. Barnes"),
via archive.org. Each item page states: *"There are no known copyright
restrictions in the United States on the use of the text."* Given
publication dates of 1866-1877, this is unambiguously public domain
(pre-1929, no valid US renewal possible).

SHA-256 checksums of every fetched raw OCR text file (`archive.org
/download/<id>/<id>_djvu.txt`): `SOURCE-CHECKSUMS.txt` in this directory.

## Sources considered and rejected

- **StudyLight.org** hosts "Bengel's Gnomon" but blocks automated
  fetching (403, bot protection) even with a standard browser
  user-agent — not evaluated further given the archive.org source below
  was already confirmed usable and unambiguously public domain.
- **CCEL** (ccel.org) does not host this work at all (confirmed: direct
  URL guesses 404, and its own site search for "Bengel Gnomon" returns
  no actual result entries).
- **CrossWire SWORD** has no Bengel/Gnomon module (confirmed against the
  live module list at crosswire.org/sword/modules — its "Lightfoot"
  commentary module is John Lightfoot, 1602-1675, a completely different
  person from J. B. Lightfoot, 1828-1889, a useful catch for Wave 2 items
  3-4 as well).
- **biblehub.com/commentaries/bengel/** hosts a cleanly-structured,
  per-verse HTML version with real Unicode Greek — but its own footer
  explicitly credits it: *"Text Courtesy of BibleSupport.com. Used by
  Permission."* Checking BibleSupport.com's own module page confirms
  it's a third-party e-Sword module description ("re-made with 25%+ more
  content... now verse by verse... 7,000+ verse comments"), i.e. a
  meaningfully reworked/expanded compilation, not a plain transcription,
  with no public-domain declaration of its own and an explicit
  attribution-required framing. This is the same unclear-third-party-
  rights pattern that got John Gill's modernized e-Sword module blocked
  in Wave 1 ("si el .conf no confirma claramente dominio público, no
  importar"). **Not used as the import source.** It was, however, useful
  as an independent cross-check that the archive.org OCR's underlying
  text (once cleaned) matches the real Bengel/Fausset translation
  word-for-word in spot checks (Romans 1:1, confirmed).

## Method

Importer: `tools/import_bengel_gnomon.py`. Raw OCR text fetched via
`curl` (not the AI-summarizing WebFetch tool) to avoid any paraphrase
risk to a source this textually and philologically dense.

### Greek: verified reference, not blind "correction"

The scan's Greek OCR quality is inconsistent across volumes — in Volume
I it is severely degraded (Greek letters rendered as Latin/mixed
look-alike characters throughout, e.g. Matthew 1:1's Βίβλος γενέσεως
Ἰησοῦ Χριστοῦ came out as "BijBXos Vivisitiis"), in Volume III-IV
considerably cleaner (real Greek Unicode largely intact).

An early version of this importer tried to fuzzy-match and REPLACE
Bengel's OCR'd Greek lemma with the closest real word. **This was
abandoned as too risky**: with OCR this degraded, a similarity match can
land on a plausible-looking but wrong word, which is worse than visible
noise -- a "correction" reads as authoritative. Instead, every entry is
prefixed with the verse's REAL, verified Greek text, looked up by
reference alone (book/chapter/verse -- no fuzzy matching, no ambiguity)
from Verbo's own vetted Greek New Testament
(`biblia/modules/original-languages`, STEPBible TAGNT). Bengel's own
(possibly OCR-imperfect) quoted text is **never altered or removed** --
both are shown, clearly distinguished (`<p class="bengel-greek-ref">`
for the verified reference line).

### Structural parsing

- **Running headers/page furniture** ("ST MATTHEW I. 16. 89", with
  OCR-mangled roman numerals and page numbers fused in) are stripped
  structurally (a short all-caps "ST <BOOK>..." line), without needing
  to parse their own noisy content.
- **Chapter tracking does not trust OCR'd roman numeral VALUES** --
  confirmed unreliable ("CHAPTER IIL." for chapter II, "CHAPTER L" for
  chapter I with no period at all). Since chapters are always strictly
  sequential, the importer instead counts how many chapter-heading-shaped
  lines occur between two entries and advances that many chapters,
  regardless of what the garbled numeral itself says.
- **Verse-entry boundaries** require a genuine blank-line paragraph break
  immediately before (verified against the raw source: real entries are
  always preceded by one). An earlier, looser boundary rule (matching
  after any ". " or ") ") badly over-split continuous prose into
  spurious fake entries whenever a cross-reference like "ch. ix. 27, etc."
  happened to look similar.
- **Footnotes** in this edition are numbered per-PAGE (reset at each
  page turn), interleaved into the OCR stream with no page-break marker
  to anchor them precisely to their in-text marker. Reliable per-marker
  resolution isn't achievable from this source without fabricating false
  precision that isn't actually there, so footnote text is identified and
  stripped from the main flow (kept out of Bengel's own commentary
  prose) rather than mis-attached to the wrong marker.
- **Introductions**: the substantial general-introduction text between a
  book's title heading and its first "CHAPTER I." is preserved as a
  chapter-0 entry (same "editorial" convention already used by Lightfoot
  and Theology of Work), not discarded.

### Evidence-based auto-correction (logged, never silent)

Two confirmed, narrow failure modes get corrected automatically, with
every correction logged in `ANOMALIES.json` with its exact reasoning:

1. **Premature chapter bump**: a misparsed footnote occasionally gets
   mistaken for a new verse-entry (confirmed case: Matthew 26:67-75
   briefly mislabeled as chapter 27, because a stray one-line footnote
   numbered "4." -- "To explain our Lord's words (Luke xxii. 21)" -- was
   mistaken for verse "4" of a new chapter). Signature: the run's verse
   numbers exceed the recorded chapter's real maximum but fit exactly
   into chapter minus 1 (or minus 2/3, for compounded cases, including
   the "book's real last chapter doesn't even exist" case at a book's
   tail end). Only corrects on an exact, unambiguous fit.
2. **Single-digit OCR confusion**: a verse number that doesn't fit any
   plausible chapter is sometimes one confused digit (confirmed case:
   Luke 1:84 -- Luke 1 only has 80 verses -- corrected to Luke 1:34,
   confirmed by the entry's own content: "πῶς, how)" opens Bengel's note
   on "How can this be...?", unmistakably Luke 1:34, not Luke 1:84). Only
   applies when exactly one single-digit swap (from a small set of
   print-era confusable digit pairs: 3/8, 0/8, 1/7, 5/6, 2/7, 0/9)
   produces a number that actually fits; never applied when multiple
   candidates are plausible.

## Coverage published

**Matthew, Mark, Romans, 1 Corinthians, 2 Corinthians** — 2295 entries,
zero unresolved reference anomalies after auto-correction (verified: see
VALIDATION.md). **Luke, John, Acts, and the remaining epistles +
Revelation are held back** -- 311 entries across those books have verse
numbers corrupted in ways more complex than the two patterns above (e.g.
"Acts 6:382" against a real chapter max of 15 -- clearly not a
single-digit slip), and guessing at those would mean inventing a
reference rather than correcting a real one. Full detail: PENDING.md.

## Attribution

Johann Albrecht Bengel (1687-1752). English translation by Rev. James
Bandinel, Rev. Andrew R. Fausset, Rev. James Bryce, and Rev. William
Fletcher; edited by Rev. Andrew R. Fausset. Public domain (1866-1877
publication).
