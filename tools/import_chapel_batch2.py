#!/usr/bin/env python3
"""Import a second reviewed Chapel Library batch (August 2026): 10 Spanish +
10 English titles not already published, chosen from the official 2026
Literature Catalog (chapellibrary.org/pdf/books/lcat.pdf) and individually
verified to carry Chapel Library's reproduction-permission notice ("Permission
is expressly granted..." / "Se otorga permiso expreso...") somewhere in their
own publisher PDF before being included — titles whose PDF had no such notice
(e.g. old bare-text renders with no letterhead) were dropped, not guessed at.

Sources must already exist in /tmp (see EPUBS/PDFS below). EPUB supplies the
reading text; the publisher's PDF supplies the reproduction-notice page,
which is kept verbatim (condition of Chapel Library's permission). "ukor" has
no EPUB on Chapel Library's site — its PDF is plain extractable text (unlike
"byaf", dropped earlier because its PDF body pages are scanned images with no
extractable text), so its own PDF supplies both notice and reading text.
"""
from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

from import_library_batch import card_html, epub_sections, page_html, slugify

ROOT = Path(__file__).resolve().parent.parent
EPUBS = Path("/tmp/verbo-chapel-batch2/epub")
PDFS = Path("/tmp/verbo-chapel-batch2/pdf")
TODAY = "2026-08-23"

BOOKS = [
    # Español — Chapel Library
    ("airas", "¿Soy realmente un cristiano?", "Thomas Boston", "es",
     ["chapel-library", "seguridad-en-cristo", "vida-cristiana"]),
    ("fwass", "El libre albedrío: un esclavo", "Charles H. Spurgeon", "es",
     ["chapel-library", "teologia", "gracia"]),
    ("jonls", "Solo Jesús", "Horatius Bonar", "es",
     ["chapel-library", "vida-cristiana", "teologia"]),
    ("lafos", "Perdido y hallado", "Arthur W. Pink", "es",
     ["chapel-library", "evangelismo", "vida-cristiana"]),
    ("cojes", "Un gabinete de joyas", "Thomas Brooks", "es",
     ["chapel-library", "consuelo", "vida-cristiana"]),
    ("ossus", "Nuestro sustituto sufriente", "Charles H. Spurgeon", "es",
     ["chapel-library", "consuelo", "vida-cristiana"]),
    ("braas", "Un mal historial y un mal corazón", "Albert N. Martin", "es",
     ["chapel-library", "vida-cristiana", "santificacion"]),
    ("htsps", "Teniendo el Espíritu", "J. C. Ryle", "es",
     ["chapel-library", "vida-cristiana", "santificacion"]),
    ("gpros", "La providencia de Dios", "Charles H. Spurgeon", "es",
     ["chapel-library", "teologia", "vida-cristiana"]),
    ("jbgrs", "Justificación por gracia", "Charles H. Spurgeon", "es",
     ["chapel-library", "teologia", "doctrina"]),
    # English — Chapel Library
    ("cfch", "Comfort for Christians", "Arthur W. Pink", "en",
     ["chapel-library", "consuelo", "vida-cristiana"]),
    ("doc2", "A Defense of Calvinism", "Charles H. Spurgeon", "en",
     ["chapel-library", "teologia", "doctrina"]),
    ("gwoh", "God's Way of Holiness", "Horatius Bonar", "en",
     ["chapel-library", "santificacion", "vida-cristiana"]),
    ("jonl", "Jesus Only", "Horatius Bonar", "en",
     ["chapel-library", "vida-cristiana", "teologia"]),
    ("fwdc", "For Whom Did Christ Die?", "Charles H. Spurgeon", "en",
     ["chapel-library", "teologia", "doctrina"]),
    ("ctdo", "Christ: The Destroyer of Death", "Charles H. Spurgeon", "en",
     ["chapel-library", "vida-cristiana", "teologia"]),
    ("ukor", "Useless Kinds of Religion", "J. C. Ryle", "en",
     ["chapel-library", "vida-cristiana"]),
    ("poja", "The Prayer of Jabez", "Charles H. Spurgeon", "en",
     ["chapel-library", "oracion", "vida-cristiana"]),
    ("elec", "Election", "Charles H. Spurgeon", "en",
     ["chapel-library", "teologia", "doctrina"]),
    ("tobu", "Turn or Burn", "Charles H. Spurgeon", "en",
     ["chapel-library", "evangelismo", "vida-cristiana"]),
]

NO_EPUB = {"ukor"}


def pdf_text(code: str) -> str:
    source = PDFS / f"{code}.pdf"
    target = source.with_name(f"{source.stem}-plain.txt")
    subprocess.run(["pdftotext", str(source), str(target)], check=True)
    return target.read_text(encoding="utf-8", errors="replace")


def clean_pdf_text(raw: str) -> str:
    raw = raw.replace("\u00ad", "").replace("\uf0b7", "•")
    raw = re.sub(r"(?<=\w)-\n(?=[a-z])", "", raw)
    raw = re.sub(r"(?m)^\s*\d+\s*$", "", raw)
    raw = re.sub(r"[ \t]+\n", "\n", raw)
    raw = re.sub(r"\n{3,}", "\n\n", raw)
    return raw.strip()


NOTICE_MARKERS = ("expressly granted", "otorga permiso expreso", "concede expresamente permiso")

# Some Chapel Library Spanish EPUBs wrap the cover-page title in <h1> instead
# of "Contenido"/"Índice" (which sections_from_blocks() already knows to drop
# entirely — see FRONT_MATTER_TITLES in import_library_batch.py), so the TOC
# + author bio + repeated copyright block that follows lands INSIDE the first
# real section instead of its own discardable one — sometimes glued onto the
# start of chapter 1's own text, not even in a section by itself. Cut any
# leading paragraphs (front matter always comes first) up through the last
# one that still looks like front matter, rather than dropping a whole
# section, since real content can follow in the same block.
FRONT_MATTER_PARA_MARKERS = (
    "recursos de chapel library", "copyright", "expressly granted",
    "otorga permiso", "concede expresamente permiso", "chapel library",
    "pensacola", "wright street", "mountzion.org", "chapellibrary.org",
    "distribuidor internacional", "ejemplares adicionales",
    "international distributor", "additional copies",
)
FRONT_MATTER_PARA_EXACT = {
    "contenido", "contenidos", "índice", "indice",
    "tabla de contenido", "tabla de contenidos", "contents", "table of contents",
}


def strip_leading_front_matter(sections: list[dict], title: str) -> list[dict]:
    if not sections:
        return sections
    paras = sections[0]["content"].split("\n\n")
    cut = 0
    for i, para in enumerate(paras):
        low = para.strip().lower()
        if (
            low in FRONT_MATTER_PARA_EXACT
            or low == title.strip().lower()
            or any(marker in low for marker in FRONT_MATTER_PARA_MARKERS)
        ):
            cut = i + 1
    if not cut:
        return sections
    remainder = "\n\n".join(paras[cut:]).strip()
    if len(remainder) >= 80:
        sections[0]["content"] = remainder
        return sections
    return sections[1:]


def _has_notice(page: str) -> bool:
    # The marker phrase itself can be line-wrapped mid-phrase in the raw
    # extraction (e.g. "Se otorga\npermiso expreso...") — collapse
    # whitespace before searching so that doesn't hide a real match.
    flat = re.sub(r"\s+", " ", page.lower())
    return any(marker in flat for marker in NOTICE_MARKERS)


def notice_page(code: str) -> str:
    pages = pdf_text(code).split("\f")
    for page in pages:
        if _has_notice(page):
            return clean_pdf_text(page)
    raise RuntimeError(f"The reproduction notice was not found in {code}")


def pdf_body_sections(code: str, title: str) -> list[dict]:
    """For "ukor" only: no EPUB exists, so the reading text also comes from
    the PDF. Its notice lives on the same physical page as body text (unlike
    the booklet-format PDFs, which dedicate a whole page to it), so the
    notice page itself is skipped here — notice_page() already captured it
    as its own section — and only the remaining pages become body sections."""
    pages = pdf_text(code).split("\f")
    sections = []
    for page in pages:
        if _has_notice(page):
            continue
        content = clean_pdf_text(page)
        if len(content) < 80:
            continue
        sections.append({"n": 0, "title": title, "content": content})
    return sections


def main() -> None:
    imported = []
    topics_by_slug = {}
    for code, title, author, lang, topics in BOOKS:
        if code in NO_EPUB:
            sections = pdf_body_sections(code, title)
            source_format = "pdf"
        else:
            source_path = EPUBS / f"{code}.epub"
            sections = epub_sections(source_path, title)
            sections = strip_leading_front_matter(sections, title)
            source_format = "epub"
        sections.insert(0, {
            "n": 1,
            "title": "Publication and reproduction notice",
            "content": notice_page(code),
        })
        for number, section in enumerate(sections, 1):
            section["n"] = number
        if sum(len(section["content"]) for section in sections) < 2_000:
            raise RuntimeError(f"Incomplete extraction for {code}")

        slug = slugify(f"{title}-{lang}")
        source = f"https://www.chapellibrary.org/api/books/download?code={code}&format={source_format}"
        license_text = (
            "Chapel Library expressly permits reproduction by any means when no "
            "charge beyond nominal duplication cost is made and the copyright "
            "notice and its complete page are included."
        )
        payload = {
            "metadata": {
                "title": title,
                "author": author,
                "language": lang,
                "source": source,
                "license": license_text,
            },
            "sections": sections,
        }
        data_dir = ROOT / "biblia/modules/chapel-library" / slug
        data_dir.mkdir(parents=True, exist_ok=True)
        (data_dir / "sections.json").write_text(
            json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        book = (slug, title, author, lang, source, license_text, len(sections))
        imported.append(book)
        topics_by_slug[slug] = topics
        page_dir = ROOT / "libreria" / slug
        page_dir.mkdir(parents=True, exist_ok=True)
        (page_dir / "index.html").write_text(
            page_html(book, f"../../biblia/modules/chapel-library/{slug}/sections.json"),
            encoding="utf-8",
        )

    catalog_path = ROOT / "libreria/data/libreria.json"
    catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
    new_ids = {book[0] for book in imported}
    catalog = [item for item in catalog if item.get("id") not in new_ids]
    for slug, title, author, lang, source, license_text, _ in imported:
        catalog.append({
            "id": slug,
            "titulo": title,
            "seccion": "libreria",
            "tipo": "libro",
            "idioma": lang,
            "temas": topics_by_slug[slug],
            "fecha_agregado": TODAY,
            "autor": author,
            "url": f"/libreria/{slug}/",
            "fuente": source,
            "licencia": license_text,
        })
    catalog_path.write_text(
        json.dumps(catalog, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    index_path = ROOT / "libreria/index.html"
    index = index_path.read_text(encoding="utf-8")
    # libreria/index.html's grid closes into a "CONTENT-FILTERS" sidebar
    # block (added after the original recursos-page marker "</div>\n  </main>"
    # was written for the first two Chapel Library batches) — insert new
    # cards right before that closing </div>, not before <main>.
    marker = '\n    </div>\n        <p class="r-filter-empty"'
    if marker not in index:
        raise RuntimeError("libreria/index.html card-insertion marker not found — page structure changed")
    # Re-running this script (e.g. after a template-cleanup fix) must not
    # duplicate cards already inserted by a previous run — drop any existing
    # row for these slugs before inserting the freshly generated one.
    for slug, *_ in imported:
        index = re.sub(
            rf'\n\s*<a class="r-book-row" href="{re.escape(slug)}/".*?</a>\n',
            "\n",
            index,
            flags=re.S,
        )
    cards = []
    for book in imported:
        card = card_html(book).replace(
            'data-tema="chapel-library,vida-cristiana"',
            f'data-tema="{",".join(topics_by_slug[book[0]])}"',
        )
        cards.append(card)
    index = index.replace(marker, "".join(cards) + marker, 1)
    counts = {
        lang: sum(item.get("idioma") == lang for item in catalog)
        for lang in ("es", "en")
    }
    index = re.sub(
        r'<div class="r-section-label"><h2[^>]*>[^<]+</h2></div>',
        f'<div class="r-section-label"><h2 data-i18n-live>'
        f'{counts["es"]} en español · {counts["en"]} en inglés</h2></div>',
        index,
        count=1,
    )
    index_path.write_text(index, encoding="utf-8")

    report = {
        "date": TODAY,
        "published": len(imported),
        "books": [{"id": book[0], "sections": book[6]} for book in imported],
    }
    (ROOT / "docs/chapel-batch2-2026-08-23.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
