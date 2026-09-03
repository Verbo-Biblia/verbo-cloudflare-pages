#!/usr/bin/env python3
"""Construye los expedientes y el módulo de lectura completo de Maclear (1894).

La transcripción de Project Gutenberg es la edición fuente autorizada. Los
mapas e ilustraciones quedan excluidos y ninguna cita bíblica se proyecta por
sí sola al Asistente de estudio.
"""

from __future__ import annotations

import hashlib
import html
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SOURCE_ID = "maclear-class-book-ot-history"
SOURCE_DIR = ROOT / "data/fuentes-externas/historia-at" / SOURCE_ID
SOURCE = SOURCE_DIR / "original/pg63528.txt"
EDITORIAL_DIR = SOURCE_DIR / "editorial/reading-units"
MODULE_DIR = ROOT / "biblia/modules/church-history" / SOURCE_ID
SOURCE_SHA256 = "063508045ac981ceb4d49192408aa9e845d28b64b1cf37b5ebb633829bc240a4"
NOTICE = (
    "Fuente histórica secundaria publicada en 1894. Se conserva la voz de "
    "George Frederick Maclear; sus cronologías, armonizaciones, etimologías "
    "y conclusiones reflejan la erudición y el marco confesional de su época, "
    "no conclusiones actuales de Verbo."
)


def dump(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def digest(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def clean_title(value: str) -> str:
    return re.sub(r"\s+", " ", value.strip().strip("_")).rstrip(".")


def next_title(lines: list[str], start: int) -> str:
    for line in lines[start + 1:start + 8]:
        title = clean_title(line)
        if title:
            return title
    raise ValueError(f"Falta título después de la línea {start + 1}")


def paragraphs(text: str) -> str:
    blocks = re.split(r"\n\s*\n", text.strip())
    return "".join(
        f"<p>{html.escape(re.sub(r'\s+', ' ', block).strip())}</p>"
        for block in blocks if block.strip()
    )


def excerpt(text: str, limit: int = 260) -> str:
    value = re.sub(r"\s+", " ", text).strip()
    return value if len(value) <= limit else value[:limit - 1].rsplit(" ", 1)[0] + "…"


def main() -> None:
    source_bytes = SOURCE.read_bytes()
    if hashlib.sha256(source_bytes).hexdigest() != SOURCE_SHA256:
        raise RuntimeError("La transcripción fuente de Maclear cambió")
    raw = source_bytes.decode("utf-8")
    lines = raw.splitlines()
    start = next(i for i, line in enumerate(lines) if line.startswith("*** START OF THE PROJECT GUTENBERG EBOOK"))
    end = next(i for i, line in enumerate(lines) if line.startswith("*** END OF THE PROJECT GUTENBERG EBOOK"))
    notice_line = next(i for i in range(start, end) if lines[i].strip() == "NOTICE.")
    first_book = next(i for i in range(notice_line, end) if lines[i].strip() == "BOOK I." and i > 280)
    appendix = next(i for i in range(first_book, end) if lines[i].strip() == "APPENDIX.")
    index = next(i for i in range(appendix, end) if lines[i].strip() == "INDEX.")

    boundaries: list[dict] = [{"line": notice_line, "id": "maclear-1894-notice", "title": "Notice", "type": "NOTICE", "book": None}]
    current_book = 0
    chapter_in_book = 0
    current_book_line = first_book
    for i in range(first_book, appendix):
        value = lines[i].strip()
        if re.fullmatch(r"BOOK [IVXLCDM]+\.", value):
            current_book += 1
            chapter_in_book = 0
            current_book_line = i
        elif re.fullmatch(r"CHAPTER [IVXLCDM]+\.", value):
            chapter_in_book += 1
            boundaries.append({
                "line": current_book_line if chapter_in_book == 1 else i,
                "id": f"maclear-1894-b{current_book:02d}-c{chapter_in_book:02d}",
                "title": f"Book {current_book}, Chapter {chapter_in_book} — {next_title(lines, i)}",
                "type": "CHAPTER",
                "book": current_book,
            })
    boundaries.extend([
        {"line": appendix, "id": "maclear-1894-appendix", "title": "Appendix and Chronological Tables", "type": "APPENDIX", "book": None},
        {"line": index, "id": "maclear-1894-index", "title": "Index and Editorial Notes", "type": "INDEX", "book": None},
    ])
    chapter_count = sum(item["type"] == "CHAPTER" for item in boundaries)
    if current_book != 11 or chapter_count != 71 or len(boundaries) != 74:
        raise RuntimeError(f"Estructura inesperada: {current_book} libros, {chapter_count} capítulos, {len(boundaries)} unidades")

    records, entries, inventory = [], [], []
    for ordinal, item in enumerate(boundaries, 1):
        stop = boundaries[ordinal]["line"] if ordinal < len(boundaries) else end
        content = "\n".join(lines[item["line"]:stop]).strip() + "\n"
        previous_id = boundaries[ordinal - 2]["id"] if ordinal > 1 else None
        next_id = boundaries[ordinal]["id"] if ordinal < len(boundaries) else None
        record = {
            "schemaVersion": 1,
            "id": item["id"], "sourceId": SOURCE_ID, "title": item["title"], "ordinal": ordinal,
            "navigation": {"previousId": previous_id, "nextId": next_id},
            "bibliography": {
                "author": "George Frederick Maclear", "workTitle": "A Class-Book of Old Testament History",
                "edition": "Macmillan, 1894; Project Gutenberg eBook 63528", "publisher": "Macmillan and Co.",
                "place": "London and New York", "year": 1894, "language": "en",
            },
            "provenance": {
                "acquisitionId": "pg63528", "sourceUrl": "https://www.gutenberg.org/ebooks/63528", "legalStatus": "CLEARED_TEXT_ONLY",
                "attribution": "George Frederick Maclear, A Class-Book of Old Testament History, Macmillan, 1894",
                "imagesAllowed": False, "originalPreserved": True,
            },
            "structure": {"unitType": item["type"], "headings": [item["title"]]},
            "text": {"sourceLanguage": "en", "content": content, "historicalSourceNotice": NOTICE},
            "location": {
                "printedPages": "No disponibles como localizador estable en la transcripción",
                "facsimilePages": "Facsímil no incluido en el expediente",
                "ocrLocator": f"Project Gutenberg TXT líneas {item['line'] + 1}–{stop}",
            },
            "integrity": {"originalSha256": SOURCE_SHA256, "derivativeSha256": SOURCE_SHA256, "contentSha256": digest(content)},
            "textualControl": {
                "ocrStatus": "REASONABLY_VALIDATED",
                "verificationScope": "Integridad SHA-256, límites estructurales, secuencia y contenido no vacío verificados contra la transcripción autorizada.",
                "anomalies": ["Las intervenciones y notas de los transcriptores de Gutenberg se conservan; no equivalen a cotejo con facsímil."],
                "corrections": [],
            },
            "readingReviewStatus": "APPROVED",
            "reviewNotes": [
                "Aprobada para lectura íntegra como fuente histórica secundaria; no aprueba sus afirmaciones para el Asistente.",
                "Mapas e ilustraciones excluidos del alcance autorizado.",
            ],
            "reviewHistory": [{
                "date": "2026-09-02", "role": "editorial_authorization", "reviewer": "usuario responsable de Verbo",
                "decision": "APPROVED", "note": "Aprobación expresa de la adaptación propuesta para lectura completa y evaluación independiente del Asistente.",
            }],
        }
        records.append(record)
        inventory.append({
            "id": item["id"], "ordinal": ordinal, "unitType": item["type"], "bookNumber": item["book"],
            "title": item["title"], "sourceLineStart": item["line"] + 1, "sourceLineEnd": stop,
            "characters": len(content), "wordsApproximate": len(content.split()), "contentSha256": digest(content),
        })
        entries.append({
            "id": item["id"], "title": item["title"], "personas": ["George Frederick Maclear"], "eventos": [],
            "periodo": "Historia del Antiguo Testamento según una obra de 1894", "epoca": "antiguo_testamento",
            "tipo": "fuente_historica_secundaria", "temas": ["biblia_canon"], "excerpt": excerpt(content),
            "content": (
                f'<aside class="note-card__translation-note"><strong>Aviso editorial:</strong> {html.escape(NOTICE)}</aside>'
                '<p class="note-card__translation-note">Texto original en inglés; ubicación según líneas de la transcripción autorizada.</p>'
                + paragraphs(content)
            ),
            "sourceLocation": record["location"], "contentSha256": digest(content),
        })

    dump(SOURCE_DIR / "structure.json", {
        "schemaVersion": 1, "sourceId": SOURCE_ID, "sourceFile": str(SOURCE.relative_to(ROOT)),
        "sourceSha256": SOURCE_SHA256, "generatedAt": "2026-09-02",
        "method": "Aviso, 11 encabezados BOOK, 71 encabezados CHAPTER, APPENDIX e INDEX de la transcripción Gutenberg.",
        "scope": {"gutenbergWrapperExcluded": True, "mapsExcluded": True, "illustrationsExcluded": True},
        "unitCount": len(inventory), "chapterCount": chapter_count, "units": inventory,
    })
    for record in records:
        dump(EDITORIAL_DIR / f"{record['id']}.json", record)
    dump(MODULE_DIR / "manifest.json", {
        "schemaVersion": 2, "id": SOURCE_ID, "type": "churchHistory",
        "name": "George Frederick Maclear — A Class-Book of Old Testament History",
        "abbreviation": "Maclear, Old Testament History", "language": "en",
        "author": "George Frederick Maclear (1833–1902)", "year": 1894,
        "description": "Texto completo autorizado de la edición de 1894, segmentado en 74 unidades. Fuente histórica secundaria; sus cronologías y conclusiones no representan automáticamente la postura de Verbo.",
        "license": "Dominio público; transcripción de Project Gutenberg. Mapas e ilustraciones no incluidos.",
        "sourceUrl": "https://www.gutenberg.org/ebooks/63528", "entriesFile": "entries.json",
        "totalEntries": len(entries), "editorialStatus": "APPROVED_FOR_HISTORICAL_READING",
    })
    dump(MODULE_DIR / "entries.json", {"entries": entries})
    print(json.dumps({"sourceId": SOURCE_ID, "books": current_book, "chapters": chapter_count, "units": len(entries)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
