#!/usr/bin/env python3
"""Importa la edición histórica completa de El peregrino (primera parte).

Las tres páginas fuente deben descargarse previamente en /tmp. El script
extrae el cuerpo de la edición española de 1935, lo divide en preliminares y
20 capítulos, y actualiza el lector y el catálogo de Librería.
"""
from __future__ import annotations

import html
import json
import re
from html.parser import HTMLParser
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
SOURCE_URL = "http://www.iglesiareformada.com/Bunyan_Peregrino.html"
SOURCE_FILES = [
    Path("/tmp/verbo-peregrino-1-8.html"),
    Path("/tmp/verbo-peregrino-9-15.html"),
    Path("/tmp/verbo-peregrino-16-20.html"),
]
BOOK_ID = "el-peregrino-bunyan-es"
TITLE = "El peregrino"
LICENSE = (
    "Edición histórica española de 1935 en dominio público. Las versiones "
    "métricas son de Carlos Araujo Carretero (1856–1925)."
)


class TextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.parts: list[str] = []
        self.skip = 0

    def handle_starttag(self, tag: str, attrs) -> None:
        if tag in {"script", "style", "noscript"}:
            self.skip += 1
        elif not self.skip and tag in {"br", "div", "p", "h1", "h2", "h3"}:
            self.parts.append("\n")

    def handle_endtag(self, tag: str) -> None:
        if tag in {"script", "style", "noscript"} and self.skip:
            self.skip -= 1
        elif not self.skip and tag in {"div", "p", "h1", "h2", "h3"}:
            self.parts.append("\n")

    def handle_data(self, data: str) -> None:
        if not self.skip:
            self.parts.append(data)


def page_text(path: Path) -> str:
    parser = TextExtractor()
    parser.feed(path.read_text(encoding="latin-1"))
    text = html.unescape("".join(parser.parts)).replace("\r", "")
    lines = [re.sub(r"\s+", " ", line).strip() for line in text.splitlines()]
    return "\n".join(line for line in lines if line)


def extract_sections() -> list[dict[str, object]]:
    blocks = [page_text(path) for path in SOURCE_FILES]
    blocks[0] = blocks[0][blocks[0].index("JUAN BUNYAN\nEL\nPEREGRINO") :]
    for index, marker in enumerate(("CAPITULO IX", "CAPITULO XVI"), start=1):
        blocks[index] = blocks[index][blocks[index].index(marker) :]

    text = "\n".join(blocks)
    text = re.sub(r"(?m)^\*\*\*$\n?", "", text)
    text = text.replace("Murió en 1658,", "Murió en 1688,")
    text = re.sub(r"\nEl oro está con mineral impuro\s*$", "", text)
    headings = list(re.finditer(r"(?m)^CAPITULO (?:PRIMERO|[IVXL]+)$", text))
    if len(headings) != 20:
        raise RuntimeError(f"Se esperaban 20 capítulos y se hallaron {len(headings)}")

    preliminaries = text[: headings[0].start()].strip()
    sections: list[dict[str, object]] = []
    for number, match in enumerate(headings, start=1):
        end = headings[number].start() if number < len(headings) else len(text)
        content = text[match.end() : end].strip()
        if number == 1:
            content = preliminaries + "\n\n" + content
        sections.append({"n": number, "title": f"Capítulo {number}", "content": content})

    total_chars = sum(len(section["content"]) for section in sections)
    if total_chars < 250_000 or any(len(section["content"]) < 1_000 for section in sections[1:]):
        raise RuntimeError("La extracción parece incompleta")
    return sections


def reader_page() -> str:
    template = (ROOT / "libreria/el-progreso-del-peregrino-para-todos-es/index.html").read_text(encoding="utf-8")
    template = template.replace("El progreso del peregrino para todos", TITLE)
    template = template.replace("el-progreso-del-peregrino-para-todos-es", BOOK_ID)
    template = template.replace(
        "../../biblia/modules/chapel-library/el-peregrino-bunyan-es/sections.json",
        "../../biblia/modules/library/el-peregrino-bunyan-es/sections.json",
    )
    return template


def main() -> None:
    sections = extract_sections()
    data_dir = ROOT / "biblia/modules/library" / BOOK_ID
    data_dir.mkdir(parents=True, exist_ok=True)
    payload = {
        "metadata": {
            "title": TITLE,
            "subtitle": "Viaje de Cristiano a la Ciudad Celestial bajo el símil de un sueño",
            "author": "John Bunyan",
            "language": "es",
            "edition": "Edición española histórica, Madrid, 1935",
            "verseTranslator": "Carlos Araujo Carretero",
            "source": SOURCE_URL,
            "sourceNote": "Se omitió una última línea incompleta de la transcripción electrónica.",
            "license": LICENSE,
            "scope": "Primera parte íntegra",
        },
        "sections": sections,
    }
    (data_dir / "sections.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    page_dir = ROOT / "libreria" / BOOK_ID
    page_dir.mkdir(parents=True, exist_ok=True)
    (page_dir / "index.html").write_text(reader_page(), encoding="utf-8")

    catalog_path = ROOT / "libreria/data/libreria.json"
    catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
    catalog = [item for item in catalog if item.get("id") != BOOK_ID]
    catalog.insert(0, {
        "id": BOOK_ID,
        "titulo": TITLE,
        "seccion": "libreria",
        "tipo": "libro",
        "idioma": "es",
        "temas": ["john-bunyan", "clasicos-cristianos", "vida-cristiana"],
        "fecha_agregado": "2026-08-23",
        "autor": "John Bunyan",
        "url": f"/libreria/{BOOK_ID}/",
        "fuente": SOURCE_URL,
        "licencia": LICENSE,
    })
    catalog_path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    index_path = ROOT / "libreria/index.html"
    index = index_path.read_text(encoding="utf-8")
    if f'href="{BOOK_ID}/"' not in index:
        card = f'''      <a class="r-book-row bunyan-book" href="{BOOK_ID}/" data-item data-idioma="es" data-tema="john-bunyan,clasicos-cristianos,vida-cristiana" data-cover="{BOOK_ID}">
        <div class="book-cover bunyan-cover"><span class="book-cover-lang">ES</span><svg class="book-cover-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M5 20c4-2 4-6 7-8s4-5 7-9"/><path d="m13 5 6-2-1 6"/><circle cx="7" cy="7" r="2"/></svg><span class="book-cover-era">John Bunyan · Primera parte íntegra</span><span class="book-cover-title">El peregrino</span><span class="book-cover-rule"></span><span class="book-cover-author">John Bunyan</span></div>
        <p class="r-book-title">El peregrino</p><p class="r-book-meta">20 capítulos · primera parte íntegra</p>
      </a>
'''
        marker = '      <a class="r-book-row'
        index = index.replace(marker, card + marker, 1)
    index = index.replace("67 en español · 50 en inglés", "68 en español · 50 en inglés")
    index_path.write_text(index, encoding="utf-8")

    print(json.dumps({"id": BOOK_ID, "sections": len(sections), "characters": sum(len(x["content"]) for x in sections)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
