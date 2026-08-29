#!/usr/bin/env python3
"""Importa la colección bilingüe de John Bunyan al lector de Librería.

Las fuentes se descargan previamente en /tmp/verbo-bunyan-sources. Este
script no traduce ni moderniza el texto: solo elimina el envoltorio de
Project Gutenberg y divide cada edición en unidades manejables del lector.
"""
from __future__ import annotations

import html
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCES = Path("/tmp/verbo-bunyan-sources")
TODAY = "2026-08-21"
STALE_IDS = {"el-progreso-del-peregrino-bunyan-es"}
EXISTING_BUNYAN_IDS = {"el-progreso-del-peregrino-para-todos-es", "deberes-familiares-es"}

BOOKS = [
    # El PDF español de El progreso del peregrino es exactamente la edición
    # abreviada de Chapel Library que Verbo ya publica como
    # el-progreso-del-peregrino-para-todos-es; no se duplica.
    {
        "id": "gracia-abundante-bunyan-es",
        "title": "Gracia abundante al primero de los pecadores",
        "lang": "es",
        "file": "grace-abounding-es.pdf",
        "source": "https://www.elejandria.com/libro/gracia-abundante-al-primero-de-los-pecadores/john-bunyan/801",
        "license": "Edición electrónica declarada por Elejandría libre de restricciones de derechos de autor en España.",
    },
    ("the-pilgrims-progress-bunyan-en", "The Pilgrim's Progress", "131"),
    ("grace-abounding-bunyan-en", "Grace Abounding to the Chief of Sinners", "654"),
    ("the-holy-war-bunyan-en", "The Holy War", "395"),
    ("life-and-death-of-mr-badman-en", "Life and Death of Mr. Badman", "1986"),
    ("the-jerusalem-sinner-saved-en", "The Jerusalem Sinner Saved", "3270"),
    ("the-heavenly-footman-en", "The Heavenly Footman", "13750"),
    ("the-pharisee-and-the-publican-en", "The Pharisee and the Publican", "3548"),
    ("an-exhortation-to-peace-and-unity-en", "An Exhortation to Peace and Unity", "3614"),
    ("miscellaneous-pieces-bunyan-en", "Miscellaneous Pieces", "3613"),
    ("works-of-john-bunyan-volume-1-en", "Works of John Bunyan — Volume I", "6046"),
    ("works-of-john-bunyan-volume-2-en", "Works of John Bunyan — Volume II", "6047"),
    ("works-of-john-bunyan-volume-3-en", "Works of John Bunyan — Volume III", "6048"),
]

COVER_ICONS = {
    "gracia-abundante-bunyan-es": '<path d="M12 3v18M7 8h10"/><path d="M5 18c2-3 4-4 7-4s5 1 7 4"/>',
    "the-pilgrims-progress-bunyan-en": '<path d="M5 20c4-2 4-6 7-8s4-5 7-9"/><path d="m13 5 6-2-1 6"/><circle cx="7" cy="7" r="2"/>',
    "grace-abounding-bunyan-en": '<path d="M12 3v18M7 8h10"/><path d="M5 18c2-3 4-4 7-4s5 1 7 4"/>',
    "the-holy-war-bunyan-en": '<path d="M12 3l7 3v6c0 5-3 8-7 9-4-1-7-4-7-9V6l7-3Z"/><path d="m9 12 2 2 4-5"/>',
    "life-and-death-of-mr-badman-en": '<path d="M12 3a4 4 0 0 1 4 4v2h2v11H6V9h2V7a4 4 0 0 1 4-4Z"/><path d="M9 14h6"/>',
    "the-jerusalem-sinner-saved-en": '<path d="M4 20h16M6 20V9l6-5 6 5v11"/><path d="M9 13h6M12 10v6"/>',
    "the-heavenly-footman-en": '<path d="M5 19c4-1 5-4 7-7 2-4 4-6 7-7"/><path d="m14 5 5 0-1 5"/><path d="M6 7h5"/>',
    "the-pharisee-and-the-publican-en": '<path d="M7 20v-8M17 20V8"/><path d="M4 20h6M14 20h6"/><path d="M5 7h4M15 5h4"/>',
    "an-exhortation-to-peace-and-unity-en": '<path d="M4 12c2-4 5-5 8-2 3-3 6-2 8 2-2 4-5 5-8 2-3 3-6 2-8-2Z"/><path d="M12 10v4"/>',
    "miscellaneous-pieces-bunyan-en": '<path d="M5 4h10l4 4v12H5Z"/><path d="M15 4v4h4M8 12h8M8 16h6"/>',
}
VOLUME_ICON = '<path d="M5 4h4v16H5zM10 4h4v16h-4zM15 5l3-.5 2 15-3 .5z"/>'


def normalized_books():
    for item in BOOKS:
        if isinstance(item, dict):
            yield item
            continue
        slug, title, ebook = item
        yield {
            "id": slug,
            "title": title,
            "lang": "en",
            "file": f"{ebook}.txt",
            "source": f"https://www.gutenberg.org/ebooks/{ebook}",
            "license": "Project Gutenberg edition; public domain in the USA.",
            "ebook": ebook,
        }


def clean_text(text: str) -> str:
    text = text.replace("\r\n", "\n").replace("\r", "\n").replace("\ufeff", "")
    text = re.sub(r"[ \t]+\n", "\n", text)
    text = re.sub(r"\n{4,}", "\n\n\n", text)
    return text.strip()


def strip_gutenberg(text: str) -> str:
    start = re.search(r"\*\*\* START OF (?:THE|THIS) PROJECT GUTENBERG EBOOK[^\n]*\*\*\*", text, re.I)
    if start:
        text = text[start.end():]
    end = re.search(r"\*\*\* END OF (?:THE|THIS) PROJECT GUTENBERG EBOOK[^\n]*\*\*\*", text, re.I)
    if end:
        text = text[:end.start()]
    return clean_text(text)


def paragraphs(text: str) -> list[str]:
    return [re.sub(r"\s*\n\s*", " ", p).strip() for p in re.split(r"\n\s*\n", text) if p.strip()]


def heading_like(value: str) -> bool:
    line = re.sub(r"\s+", " ", value).strip()
    if not (2 <= len(line) <= 150):
        return False
    if re.match(r"^(chapter|part|book|section|the (?:first|second|third)|preface|introduction|conclusion|contents)\b", line, re.I):
        return True
    letters = [c for c in line if c.isalpha()]
    return len(letters) >= 4 and sum(c.isupper() for c in letters) / len(letters) > .86


def sections_from_text(text: str, fallback: str, max_chars: int = 18000):
    units = paragraphs(text)
    sections = []
    title = fallback
    body = []
    size = 0

    def flush():
        nonlocal body, size
        content = "\n\n".join(body).strip()
        if content:
            sections.append({"n": len(sections) + 1, "title": title[:180], "content": content})
        body, size = [], 0

    for unit in units:
        is_heading = heading_like(unit)
        if is_heading and body and size >= 500:
            flush()
            title = re.sub(r"\s+", " ", unit)
            continue
        if size + len(unit) > max_chars and body:
            flush()
            if not is_heading:
                title = f"{fallback} — {len(sections) + 1}"
        if is_heading and not body:
            title = re.sub(r"\s+", " ", unit)
        else:
            body.append(unit)
            size += len(unit)
    flush()
    return sections


def pdf_text(path: Path) -> str:
    target = path.with_suffix(".txt")
    subprocess.run(["pdftotext", "-layout", str(path), str(target)], check=True)
    return clean_text(target.read_text(encoding="utf-8", errors="replace"))


def page_html(book, count):
    lang = book["lang"]
    title = book["title"]
    slug = book["id"]
    locale = "es_ES" if lang == "es" else "en_US"
    description = (
        f"{title}, por John Bunyan, en el lector de Verbo."
        if lang == "es" else f"{title}, by John Bunyan, in Verbo's library reader."
    )
    config = {
        "id": slug, "title": title, "author": "John Bunyan",
        "dataUrl": f"../../biblia/modules/library/{slug}/sections.json",
        "dataKey": "sections", "textField": "content", "titleField": "title",
        "unitLabel": "Capítulo" if lang == "es" else "Section",
        "estrategiaTraduccion": "native",
    }
    return f'''<!DOCTYPE html>
<html lang="{lang}">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{html.escape(title)} | Librería | Verbo</title>
<meta name="description" content="{html.escape(description)}">
<meta property="og:title" content="{html.escape(title)} | Librería | Verbo">
<meta property="og:description" content="{html.escape(description)}">
<meta property="og:url" content="https://verbobiblia.com/libreria/{slug}/">
<meta property="og:locale" content="{locale}"><meta property="og:type" content="article">
<link rel="canonical" href="https://verbobiblia.com/libreria/{slug}/">
<link rel="manifest" href="../../biblia/manifest.webmanifest">
<link rel="icon" type="image/png" sizes="192x192" href="../../biblia/assets/icons/icon-192.png">
<meta name="theme-color" content="#7f2d35">
<link rel="stylesheet" href="../../biblia/assets/style.css?v=20260811-back-arrow-hitbox">
<link rel="stylesheet" href="../../recursos/assets/recursos.css?v=20260813-compact-catalog-headings">
<link rel="stylesheet" href="../assets/reader.css?v=20-mi-biblioteca">
</head>
<body class="static-page recursos-page">
<header class="static-page__header"><a class="static-page__brand" href="../../">Verbo</a><a class="static-page__back" href="../">Librería</a></header>
<main class="static-page__main"><div class="reader" id="reader-root"></div></main>
<script>window.__LIBRERIA_BOOK__ = {json.dumps(config, ensure_ascii=False, indent=2)};</script>
<script src="../../biblia/assets/i18n.js?v=20260829-assistant-search"></script>
<script src="../../biblia/assets/site-translate.js?v=20260811-translate-abandon"></script>
<script src="../../biblia/assets/site-chrome.js?v=20260729-1"></script>
<script src="../../biblia/assets/tts-player.js?v=1"></script>
<script src="../../biblia/assets/backup.js?v=20260823-no-bump-reapertura"></script>
<script src="../../biblia/assets/sync.js?v=20260823-libreria-marcador"></script>
<script src="../assets/mi-biblioteca.js?v=2-backup-sync"></script>
<script src="../assets/reader.js?v=25-mi-biblioteca"></script>
</body></html>'''


def card_html(book, count):
    lang = book["lang"]
    label = "secciones" if lang == "es" else "sections"
    is_volume = book["id"].startswith("works-of-john-bunyan-volume-")
    icon = VOLUME_ICON if is_volume else COVER_ICONS.get(book["id"], VOLUME_ICON)
    era = "Complete Works · George Offor" if is_volume else "John Bunyan · 1628–1688"
    long_title = ' data-long-title="true"' if len(book["title"]) > 34 else ""
    return f'''      <a class="r-book-row bunyan-book" href="{book['id']}/" data-item data-idioma="{lang}" data-tema="john-bunyan,clasicos-cristianos" data-cover="{book['id']}">
        <div class="book-cover bunyan-cover"><span class="book-cover-lang">{lang.upper()}</span><svg class="book-cover-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4">{icon}</svg><span class="book-cover-era">{era}</span><span class="book-cover-title"{long_title}>{html.escape(book['title'])}</span><span class="book-cover-rule"></span><span class="book-cover-author">John Bunyan</span></div>
        <p class="r-book-title">{html.escape(book['title'])}</p><p class="r-book-meta">{count} {label}</p>
      </a>
'''


def main():
    books = list(normalized_books())
    generated = []
    for book in books:
        source_path = SOURCES / book["file"]
        if not source_path.exists() or source_path.stat().st_size < 1000:
            raise FileNotFoundError(source_path)
        raw = pdf_text(source_path) if source_path.suffix == ".pdf" else strip_gutenberg(source_path.read_text(encoding="utf-8", errors="replace"))
        sections = sections_from_text(raw, book["title"])
        total = sum(len(section["content"]) for section in sections)
        if total < 5000:
            raise RuntimeError(f"Extracción incompleta: {book['id']} ({total} caracteres)")
        payload = {
            "metadata": {
                "title": book["title"], "author": "John Bunyan", "language": book["lang"],
                "source": book["source"], "license": book["license"],
                "collection": "John Bunyan",
            },
            "sections": sections,
        }
        data_dir = ROOT / "biblia/modules/library" / book["id"]
        page_dir = ROOT / "libreria" / book["id"]
        data_dir.mkdir(parents=True, exist_ok=True)
        page_dir.mkdir(parents=True, exist_ok=True)
        (data_dir / "sections.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        (page_dir / "index.html").write_text(page_html(book, len(sections)), encoding="utf-8")
        generated.append((book, len(sections), total))

    catalog_path = ROOT / "libreria/data/libreria.json"
    catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
    ids = {book["id"] for book in books}
    catalog = [item for item in catalog if item.get("id") not in ids | STALE_IDS]
    for item in catalog:
        if item.get("id") in EXISTING_BUNYAN_IDS:
            item["temas"] = list(dict.fromkeys([*item.get("temas", []), "john-bunyan"]))
            item["coleccion"] = "John Bunyan"
    for book, count, _ in generated:
        catalog.insert(0, {
            "id": book["id"], "titulo": book["title"], "seccion": "libreria", "tipo": "libro",
            "idioma": book["lang"], "temas": ["john-bunyan", "clasicos-cristianos"],
            "fecha_agregado": TODAY, "autor": "John Bunyan", "url": f"/libreria/{book['id']}/",
            "fuente": book["source"], "licencia": book["license"], "coleccion": "John Bunyan",
        })
    catalog_path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    index_path = ROOT / "libreria/index.html"
    index = index_path.read_text(encoding="utf-8")
    for slug in ids | STALE_IDS:
        index = re.sub(rf'\s*<a class="r-book-row" href="{re.escape(slug)}/".*?</a>', "", index, flags=re.S)
    cards = "".join(card_html(book, count) for book, count, _ in generated)
    index = index.replace('<div class="r-book-grid" id="libreria-grid">', '<div class="r-book-grid" id="libreria-grid">\n' + cards, 1)
    for slug in EXISTING_BUNYAN_IDS:
        pattern = rf'(<a class="r-book-row" href="{re.escape(slug)}/"[^>]*data-tema=")([^"]*)'
        index = re.sub(pattern, lambda m: m.group(1) + (m.group(2) + ",john-bunyan" if "john-bunyan" not in m.group(2) else m.group(2)), index)
    if '<option value="john-bunyan">' not in index:
        index = index.replace(
            '<option value="gracia" data-i18n="temas.gracia">Gracia</option>',
            '<option value="gracia" data-i18n="temas.gracia">Gracia</option>\n        <option value="john-bunyan">John Bunyan</option>',
            1,
        )
    counts = {lang: sum(item.get("idioma") == lang for item in catalog) for lang in ("es", "en")}
    summary = f'{counts["es"]} en español · {counts["en"]} en inglés'
    index = re.sub(r'<div class="r-section-label"><h2[^>]*>.*?</h2></div>', f'<div class="r-section-label"><h2 data-i18n-live>{summary}</h2></div>', index, count=1)
    index_path.write_text(index, encoding="utf-8")

    report = {
        "collection": "John Bunyan", "date": TODAY, "published": len(generated),
        "spanish": sum(book["lang"] == "es" for book, _, _ in generated),
        "english": sum(book["lang"] == "en" for book, _, _ in generated),
        "books": [{"id": book["id"], "sections": count, "characters": total, "source": book["source"]} for book, count, total in generated],
    }
    report_path = ROOT / "docs/john-bunyan-collection-2026-08-21.json"
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
