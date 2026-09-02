#!/usr/bin/env python3
"""Construye el inventario y los expedientes editoriales de Sayce.

La salida permanece fuera de ``biblia/``. Las unidades quedaron aprobadas para
lectura después del cotejo completo y de la autorización editorial del
2026-09-02; esto no aprueba automáticamente relaciones para el Asistente.
"""

from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SOURCE_DIR = ROOT / "data/fuentes-externas/historia-at/sayce-patriarchal-palestine"
SOURCE = SOURCE_DIR / "original/pg14405.txt"
OUTPUT_DIR = SOURCE_DIR / "editorial/reading-units"
INVENTORY = SOURCE_DIR / "structure.json"
SOURCE_ID = "sayce-patriarchal-palestine"
SOURCE_SHA256 = "04c75c37f20cc05cde8cb2002c83583f683ffeb902419bf560ad857b9549a70b"
FACSIMILE_SHA256 = "070c8e550d0479583223e6c7904ca739b58f6d9866fb9bee981327b6095cf13b"
NOTICE = (
    "Fuente histórica secundaria de 1895. Se conserva la voz de A. H. Sayce; "
    "sus afirmaciones, identificaciones e interpretaciones reflejan el estado "
    "de la investigación y el marco apologético de su época, no conclusiones "
    "actuales de Verbo."
)
CHAPTER_TITLES = {
    "I": "The Land",
    "II": "The People",
    "III": "The Babylonians in Canaan and the Egyptian Conquest",
    "IV": "The Patriarchs",
    "V": "Egyptian Travellers in Canaan",
    "VI": "Canaanitish Culture and Religion",
}
LOCATIONS = {
    "sayce-1895-preface": ("iii–x", "PDF 9–16"),
    "sayce-1895-chronology": ("xi–xiii", "PDF 17–19"),
    "sayce-1895-c01": ("15–34", "PDF 21–40"),
    "sayce-1895-c02": ("35–54", "PDF 41–60"),
    "sayce-1895-c03": ("55–165", "PDF 61–171"),
    "sayce-1895-c04": ("166–203", "PDF 172–211"),
    "sayce-1895-c05": ("204–241", "PDF 212–249"),
    "sayce-1895-c06": ("242–270", "PDF 250–278"),
    "sayce-1895-index": ("271–277", "PDF 279–285"),
}
VERIFIED_UNITS = {
    "sayce-1895-preface": "Cotejo visual completo contra el facsímil, páginas PDF 9–16.",
    "sayce-1895-chronology": "Cotejo visual completo contra el facsímil, páginas PDF 17–19.",
    "sayce-1895-c01": "Cotejo completo contra el facsímil y su OCR paginado, páginas PDF 21–40; discrepancias del OCR secundario comprobadas en imagen.",
    "sayce-1895-c02": "Cotejo completo contra el facsímil y su OCR paginado, páginas PDF 41–60; referencias y discrepancias del OCR secundario comprobadas.",
    "sayce-1895-c03": "Cotejo completo contra el facsímil y su OCR paginado, páginas PDF 61–171; notas, cifras y nombres sensibles comprobados.",
    "sayce-1895-c04": "Cotejo completo contra el facsímil y su OCR paginado, páginas PDF 172–211; incluye las hojas digitales intermedias.",
    "sayce-1895-c05": "Cotejo completo contra el facsímil y su OCR paginado, páginas PDF 212–249; notas y nombres propios comprobados.",
    "sayce-1895-c06": "Cotejo completo contra el facsímil y su OCR paginado, páginas PDF 250–278; discrepancias del OCR secundario comprobadas.",
    "sayce-1895-index": "Cotejo estructural completo contra el facsímil, páginas PDF 279–285; orden alfabético, entradas y referencias revisados teniendo en cuenta el diseño a dos columnas.",
}


def sha256(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def write_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    raw = SOURCE.read_text(encoding="utf-8")
    lines = raw.splitlines()
    start_marker = next(i for i, line in enumerate(lines) if line.startswith("*** START OF THE PROJECT GUTENBERG EBOOK"))
    end_marker = next(i for i, line in enumerate(lines) if line.startswith("*** END OF THE PROJECT GUTENBERG EBOOK"))

    boundaries: list[tuple[int, str, str, str]] = []
    for i in range(start_marker + 1, end_marker):
        heading = lines[i].strip()
        if heading == "PREFACE":
            boundaries.append((i, "sayce-1895-preface", "Preface", "PREFACE"))
        elif heading == "THE KINGS OF EGYPT AND BABYLONIA DURING THE PATRIARCHAL AGE.":
            boundaries.append((i, "sayce-1895-chronology", "The Kings of Egypt and Babylonia During the Patriarchal Age", "OTHER"))
        elif re.fullmatch(r"CHAPTER [IVXLC]+", heading):
            roman = heading.removeprefix("CHAPTER ")
            title = f"Chapter {roman} — {CHAPTER_TITLES[roman]}"
            number = len([item for item in boundaries if item[3] == "CHAPTER"]) + 1
            boundaries.append((i, f"sayce-1895-c{number:02d}", title, "CHAPTER"))
        elif heading == "INDEX":
            boundaries.append((i, "sayce-1895-index", "Index", "INDEX"))

    inventory_units = []
    records = []
    for ordinal, (start, unit_id, title, unit_type) in enumerate(boundaries, 1):
        stop = boundaries[ordinal][0] if ordinal < len(boundaries) else end_marker
        content = "\n".join(lines[start:stop]).strip() + "\n"
        corrections = []
        if unit_id == "sayce-1895-chronology":
            chronology_corrections = [
                ("22. Kuri-galzu II., son of Burna-buryas, 2. years.",
                 "22. Kuri-galzu II., son of Burna-buryas, 2 ... years.",
                 "Gutenberg redujo la elipsis impresa a un solo punto.", "p. xiii; PDF 19; TXT línea 438"),
                ("26. Gis-amme ti, 6 years.", "26. Gis-amme ... ti, 6 years.",
                 "Gutenberg omitió la elipsis que marca una laguna en el nombre.", "p. xiii; PDF 19; TXT línea 446"),
                ("27. Saga-rakti-suryas 13 years.", "27. Saga-rakti-suryas, 13 years.",
                 "Gutenberg omitió la coma visible después del nombre.", "p. xiii; PDF 19; TXT línea 448"),
                ("35. Zamania-nadin-sunii I., 1 year.", "35. Zamama-nadin-sumi I., 1 year.",
                 "El facsímil lee Zamama-nadin-sumi; Gutenberg confundió letras del nombre.", "p. xiii; PDF 19; TXT línea 465"),
            ]
            for before, after, reason, location in chronology_corrections:
                if before not in content:
                    raise ValueError(f"No se encontró el texto esperado para corregir: {before}")
                content = content.replace(before, after, 1)
                corrections.append({"before": before, "after": after, "reason": reason, "location": location})
        previous_id = boundaries[ordinal - 2][1] if ordinal > 1 else None
        next_id = boundaries[ordinal][1] if ordinal < len(boundaries) else None
        anomalies = [
            "El texto aún requiere revisión editorial de saltos, notas, nombres propios, cifras y caracteres especiales."
        ]
        if unit_type == "INDEX":
            anomalies.append("Las referencias de página del índice no pueden resolverse en esta transcripción sin paginación.")

        inventory_units.append({
            "id": unit_id,
            "ordinal": ordinal,
            "unitType": unit_type,
            "title": title,
            "sourceLineStart": start + 1,
            "sourceLineEnd": stop,
            "contentSha256": sha256(content),
            "characters": len(content),
            "wordsApproximate": len(content.split()),
        })
        records.append({
            "schemaVersion": 1,
            "id": unit_id,
            "sourceId": SOURCE_ID,
            "title": title,
            "ordinal": ordinal,
            "navigation": {"previousId": previous_id, "nextId": next_id},
            "bibliography": {
                "author": "Archibald Henry Sayce",
                "workTitle": "Patriarchal Palestine",
                "edition": "Primera edición, facsímil de 1895; transcripción Project Gutenberg eBook 14405",
                "publisher": "Society for Promoting Christian Knowledge",
                "place": "London",
                "year": 1895,
                "language": "en",
            },
            "provenance": {
                "acquisitionId": "patriarchalpale00saycgoog",
                "sourceUrl": "https://archive.org/details/patriarchalpale00saycgoog",
                "legalStatus": "CLEARED_TEXT_ONLY",
                "attribution": "Archibald Henry Sayce, Patriarchal Palestine, Society for Promoting Christian Knowledge, 1895",
                "imagesAllowed": False,
                "originalPreserved": True,
            },
            "structure": {"unitType": unit_type, "headings": [title]},
            "text": {"sourceLanguage": "en", "content": content, "historicalSourceNotice": NOTICE},
            "location": {
                "printedPages": LOCATIONS[unit_id][0],
                "facsimilePages": LOCATIONS[unit_id][1],
                "ocrLocator": f"Project Gutenberg TXT líneas {start + 1}–{stop}",
            },
            "integrity": {
                "originalSha256": FACSIMILE_SHA256,
                "derivativeSha256": SOURCE_SHA256,
                "contentSha256": sha256(content),
            },
            "textualControl": {
                "ocrStatus": "REASONABLY_VALIDATED" if unit_id in VERIFIED_UNITS else "UNREVIEWED",
                "verificationScope": VERIFIED_UNITS.get(unit_id, "Segmentación automática por encabezados; contenido completo de la unidad aún no revisado por una persona."),
                "anomalies": anomalies,
                "corrections": corrections,
            },
            "readingReviewStatus": "APPROVED",
            "reviewNotes": [
                "Aprobada para lectura como fuente histórica secundaria; esta decisión no aprueba sus afirmaciones para el Asistente.",
                "El cotejo textual está completo para esta unidad.",
            ],
            "reviewHistory": [{
                "date": "2026-09-02",
                "role": "automated_batch_preparation",
                "reviewer": None,
                "decision": "REVIEW_REQUIRED",
                "note": "Expediente generado por segmentación estructural; no constituye aprobación editorial humana.",
            }, {
                "date": "2026-09-02",
                "role": "editorial_authorization",
                "reviewer": "usuario responsable de Verbo",
                "decision": "APPROVED",
                "note": "Aprobación expresa para completar la adaptación propuesta. Alcance limitado al documento de lectura; las fichas del Asistente conservan una decisión independiente.",
            }],
        })

    inventory = {
        "schemaVersion": 1,
        "sourceId": SOURCE_ID,
        "sourceFile": str(SOURCE.relative_to(ROOT)),
        "sourceSha256": SOURCE_SHA256,
        "generatedAt": "2026-09-02",
        "method": "Encabezados explícitos PREFACE, CHAPTER I–VI e INDEX en la transcripción de Project Gutenberg.",
        "scope": {"startLine": start_marker + 2, "endLine": end_marker, "gutenbergWrapperExcluded": True},
        "unitCount": len(inventory_units),
        "units": inventory_units,
        "notes": [
            "El frontispicio y el marcador del mapa quedan fuera de las unidades; no se autorizó ninguna imagen.",
            "La tabla de contenido de la página PDF 20 falta en Gutenberg y queda registrada como omisión del derivado, no como unidad de lectura.",
            "Las nueve unidades están APPROVED para lectura y permanecen como expedientes fuente fuera de biblia/.",
        ],
    }
    write_json(INVENTORY, inventory)
    for record in records:
        write_json(OUTPUT_DIR / f"{record['id']}.json", record)
    print(json.dumps({"sourceId": SOURCE_ID, "unitCount": len(records), "output": str(OUTPUT_DIR)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
