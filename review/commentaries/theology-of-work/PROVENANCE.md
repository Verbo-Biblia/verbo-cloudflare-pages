# Theology of Work Bible Commentary — provenance

Wave 2, item 1. Fetched and imported 2026-08-27.

## Source

**Theology of Work Bible Commentary**, Theology of Work Project (theologyofwork.org).
Index page used to enumerate the corpus:
<https://www.theologyofwork.org/resources/theology-of-work-bible-commentary-free-online/>.

51 book/book-group pages were downloaded (raw HTML via `curl`, not the
AI-summarizing WebFetch tool, to avoid any paraphrase risk to the source
text) into a local scratch directory and parsed programmatically. SHA-256
checksums of every fetched page are in `SOURCE-CHECKSUMS.txt` in this
directory. Importer: `tools/import_theology_of_work.py`.

## License

**CC BY-NC 4.0**, per <https://www.theologyofwork.org/about/cc-license/>.

Per Juan's explicit instruction, the license does **not** apply to
everything embedded on a theologyofwork.org page — only to material
carrying one of these three attributions:

- "Produced by TOW Project"
- "Produced by Individual TOW Project member"
- "Produced by The High Calling"

**Every one of the 51 fetched pages was individually checked** for the
`Bible Commentary / Produced by TOW Project` attribution string
(`extract_page_title_produced_by()` in the importer) before any of its
content was used. All 51 pages carried "Produced by TOW Project" — none
needed to be excluded on this basis, and none carried NRSV/NIV Bible-text
license notices or third-party attributions instead.

Embedded copyrighted Bible translations (TOW quotes mostly NRSV) are
**not** reproduced in bulk: see "Scripture blockquote policy" below.
Images, footer navigation, cookie-consent banners, and related-article
grids from the site were never captured (see "HTML extraction" below).

Verbo's own manifest.json marks this module `"license": "CC BY-NC 4.0"`,
`"publicDomain": false`, `"nonCommercial": true`, with a `licenseNote`
field spelling out the attribution-scope rule above, so this module can
never be silently treated as public domain by later tooling.

## Structure and the book/chapter/verse mapping

TOW does not comment verse-by-verse. Each page is broken into
`<div class="short-wrap">` sections with an `<h2>`/`<h3>` heading that
names the book(s) and chapter:verse range(s) the section discusses
(sometimes a bare chapter range, sometimes a scattered list like
"Genesis 1:26, 27; 5:1", sometimes no chapter at all for a purely
thematic section). The importer's reference parser
(`parse_heading_references()`) was built and validated against all 606
real section headings extracted from the corpus before any content was
written — see the worked test cases below.

Specific rules applied, each with a concrete example actually found in
the corpus:

- **Cross-chapter ranges** ("Ecclesiastes 6:10-8:17") are parsed as
  chapter 6 verse 10 through chapter 8 verse 17, not literally.
- **Bare chapter ranges** with no colon ("Job 4-23") are filled in to the
  full chapter span using this repo's own `kjv-strong` bible module verse
  counts (`load_verse_counts()`), never guessed.
- **Comma/semicolon-continued citations** ("1 Timothy 1:1-11, 18-20;
  3:14-16") correctly treat the bare "18-20" as verses of chapter 1 (not
  chapters 18-20), and "3:14-16" as a new explicit chapter.
- **Single-chapter books** (Obadiah, Philemon, 2 John, 3 John, Jude): a
  bare number ("2 John 1-11") is a verse range, never mistaken for a
  chapter range, since these books only have one chapter.
- **Multi-book sections** (e.g. the Minor Prophets essays: "God Demands
  Change (Hosea 1:1-9, Micah 2:1-5)", or Samuel-Kings-Chronicles' "The
  Golden Age of the Monarchy: 2 Samuel 1-24, 1 Kings 1-11, 1 Chronicles
  13, 21-25") produce **one entry per book named**, sharing the identical
  content, each filed under that book's own real chapter/verse range.
  This is TOW's own genuine editorial structure (several minor prophets
  or Samuel/Kings/Chronicles really are discussed together in one essay),
  not a Verbo bug — confirmed by reading the source pages directly.
- **Cross-book ranges** ("1 Kings 11:41 - 2 Kings 25:26") are split at the
  book boundary: 1 Kings gets 11:41 through its own last verse, 2 Kings
  gets 1:1 through 25:26. Only accepted between two *canonically adjacent*
  books, to avoid false positives.
- **Person/word name collisions with book names** were found and
  corrected: "Obadiah Saves a Hundred People... (1 Kings 18)" is about
  *Obadiah the servant of King Ahab* (1 Kings 18), not the book of
  Obadiah — the bare "Obadiah" mention is suppressed because it's outside
  parentheses and another book already carries the section's real
  numbered reference. Same fix applies to "God Judges Exploitation...
  (Isaiah 3ff.)" ("Judges" used as a verb, not the book of Judges). A
  legitimate case that looks similar but must NOT be suppressed --
  "Ezra and Nehemiah Together (Nehemiah 8:1-13:31)" -- is preserved
  because "Ezra" is directly conjoined ("... and Nehemiah") with another
  real book name, the signal used to tell a deliberate joint mention from
  an incidental word/name collision.
- **Combined citations** ("1 & 2 Thessalonians") are expanded to both
  full book names before parsing.
- **Thematic sections with no chapter/verse at all** ("Introduction to
  Matthew", "The Wise Worker is Trustworthy (Proverbs)", "Ezra and Work")
  are filed at `chapterStart/verseStart/chapterEnd/verseEnd = 0` — Verbo's
  existing "editorial" convention, already used by the Lightfoot import.
  On the three pages that group several books under one shared
  intro/conclusion with no book-specific heading at all ("Introduction to
  Samuel, Kings and Chronicles"), the content is filed at chapter 0 under
  *every* book in that group (`GROUP_WIDE_HEADINGS` in the importer).
- **Pagination stubs** ("Continue to Genesis 12-50", "Go to Genesis
  1-11" — one-sentence "click here to read the next page" links with no
  real commentary) are dropped entirely, not imported as content.
- **Philemon, 1 John, and Jude** have no `<short-wrap>` sub-sections at
  all on theologyofwork.org — each is one continuous essay. These are
  filed as a single chapter-0 entry using the page's own `<h1>` title.

## HTML extraction and cleaning

Content is read only from between a section's `<hr>` and the next section
(or the page's hidden footnote-definition block), which excludes the
site's navigation, "Back to Table of Contents" links, and the
related-article grids that live outside that window — confirmed absent
from every entry by an automated post-import scan for characteristic
strings (`cookieconsent`, `googletagmanager`, "Back to Table of
Contents", "Please click here to read our commentary" -- 0 hits across
all 635 entries).

- Links (`<a>`) are unwrapped to plain text (internal TOW cross-links
  would be dead outside their site).
- Only `p, blockquote, em, strong, ul, ol, li, sup, sub, i, b, br` tags
  are kept; everything else (`div`, `span`, inline styles) is stripped.
- HTML entities are decoded to real Unicode.
- **Soft hyphens (U+00AD)**, a print-justification artifact from TOW's
  own typeset PDF/book source bleeding into their HTML (716 occurrences
  found, e.g. "gra­cious" for "gracious"), are stripped — confirmed 0
  remaining after the fix.
- **Footnotes are resolved, not dropped.** TOW pages carry a hidden
  ordered list of endnotes at the bottom (`allfootnoteinfo`). Each
  in-text `[N]` marker is converted to a `<sup>[N]</sup>` reference, and
  the *actual* cited text for every footnote a given entry actually uses
  is appended to that entry's own content as a "Notes" list — nothing is
  silently lost, and notes stay attached to the passage that cites them
  rather than dumped in one undifferentiated per-book blob. 180 of 635
  entries carry resolved footnotes.

## Scripture blockquote policy (copyright)

Per Juan's explicit rule ("no importes bloques completos de biblias
protegidas... el comentario debe funcionar con la Biblia que el usuario
ya tenga seleccionada"), TOW's own `<blockquote>` elements — which is
where TOW sets apart an extended, verbatim (mostly NRSV) Scripture
quotation from its surrounding argument, as opposed to a short phrase
woven directly into a sentence — are **not reproduced**. 109 of 156
blockquotes in the corpus were detected as Scripture (by a `(Book
chapter:verse)`-style citation appearing anywhere in the quoted text,
handling both single citations and TOW's occasional chains of several
citations in one blockquote) and replaced with a short reference marker,
e.g.:

> *[Cita bíblica: Leviticus 19:9–10 — consulta tu Biblia activa]*

Four further blockquotes quote Scripture **without** an inline citation
(the section heading already names the passage, so TOW didn't repeat it)
— these were individually read and manually confirmed before being added
to a small forced-strip list in the importer (`FORCE_STRIP_UNCITED_
SCRIPTURE`): Genesis 3 (the Fall dialogue), Romans 3:21-26, Romans
3:27-31, and Genesis 1:26-28 (quoted inside the Colossians entry).

The remaining 3 long blockquotes (611-1059 chars) were individually read
and confirmed to be **not** Scripture — TOW's own reflective prose (a
pull-quote on Judah's reconciliation with Joseph, a paragraph on what the
Bible fundamentally is) and a first-person business-ethics case study
(predatory lending) — and were left intact, since they're the author's
own material, not a third party's copyrighted Bible translation.

Brief quotes woven directly into ordinary prose sentences (not set apart
as a `<blockquote>`), e.g. "'It is the power of God for salvation to
everyone who has faith' (Rom. 1:16)", are left untouched — these are the
"brief quotes essential to the argument" Juan said may be kept, and match
the precedent already set for Lightfoot/Trapp in Wave 1.

## Anomaly report

Full machine-readable list: `ANOMALIES.json` in this directory. Summary
by kind:

| Kind | Count | Disposition |
|---|---:|---|
| `stripped-scripture-blockquote` | 109 | Replaced with a reference marker (see above) |
| `cross-book-range` | 4 | Split at book boundary, logged for review (see above) |
| `suppressed-bare-mention` | 4 | Person/word-name collision, correctly dropped (see above) |
| `long-blockquote` | 3 | Manually verified non-Scripture, kept as-is |

Zero occurrences of: replacement characters (U+FFFD), mojibake, leaked
site chrome, empty content, malformed reference ranges (chapterEnd <
chapterStart, etc.), or duplicate entry IDs — each checked by an
automated sweep across all 635 entries after import.

## Coverage

66 of 66 books, 635 entries, ~2.17 MB total across per-book JSON files
(largest is Genesis at 160 KB — no `chapterSplit` needed; compare
Lightfoot's 1.29 MB single-book Colossians file already in production).
Per-book `.index.json` files (id + reference only, no content or title)
keep the "how many entries does chapter N have" badge check lightweight,
matching the existing convention.

## Attribution

**Theology of Work Project** (theologyofwork.org), CC BY-NC 4.0. Source
and license recorded in `manifest.json`'s `sourceUrl`, `licenseUrl`, and
`licenseNote` fields.
