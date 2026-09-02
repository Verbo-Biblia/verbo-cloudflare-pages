#!/usr/bin/env python3
"""Proyecta los expedientes aprobados de Sayce al módulo estático de Historia."""

from __future__ import annotations

import html
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SOURCE_DIR = ROOT / "data/fuentes-externas/historia-at/sayce-patriarchal-palestine/editorial/reading-units"
OUTPUT_DIR = ROOT / "biblia/modules/church-history/sayce-patriarchal-palestine"


def paragraphs(text: str) -> str:
    blocks = re.split(r"\n\s*\n", text.strip())
    return "".join(f"<p>{html.escape(re.sub(r'\s+', ' ', block).strip())}</p>" for block in blocks if block.strip())


def excerpt(text: str, limit: int = 260) -> str:
    clean = re.sub(r"\s+", " ", text).strip()
    if len(clean) <= limit:
        return clean
    return clean[: limit - 1].rsplit(" ", 1)[0] + "…"


def write_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    records = [json.loads(path.read_text(encoding="utf-8")) for path in sorted(SOURCE_DIR.glob("*.json"))]
    records.sort(key=lambda record: record["ordinal"])
    if len(records) != 9 or any(record["readingReviewStatus"] != "APPROVED" for record in records):
        raise RuntimeError("La proyección exige exactamente nueve unidades APPROVED")

    entries = []
    for record in records:
        source_text = record["text"]["content"]
        notice = html.escape(record["text"]["historicalSourceNotice"])
        location = html.escape(f"Páginas impresas {record['location']['printedPages']}; {record['location']['facsimilePages']}")
        entries.append({
            "id": record["id"],
            "title": record["title"],
            "personas": ["Archibald Henry Sayce"],
            "eventos": [],
            "periodo": "Palestina patriarcal según una obra de 1895",
            "epoca": "antiguo_testamento",
            "tipo": "fuente_historica_secundaria",
            "temas": ["biblia_canon"],
            "excerpt": excerpt(source_text),
            "content": (
                f'<aside class="note-card__translation-note"><strong>Aviso editorial:</strong> {notice}</aside>'
                f'<p class="note-card__translation-note">{location}. Texto original en inglés.</p>'
                + paragraphs(source_text)
            ),
            "sourceLocation": record["location"],
            "contentSha256": record["integrity"]["contentSha256"],
        })

    manifest = {
        "schemaVersion": 2,
        "id": "sayce-patriarchal-palestine",
        "type": "churchHistory",
        "name": "Archibald Henry Sayce — Patriarchal Palestine",
        "abbreviation": "Sayce, Patriarchal Palestine",
        "language": "en",
        "author": "Archibald Henry Sayce (1845–1933)",
        "year": 1895,
        "description": "Primera edición completa, segmentada en nueve unidades y cotejada con el facsímil. Fuente histórica secundaria: conserva el marco apologético y el estado de la arqueología de 1895; no representa conclusiones actuales de Verbo.",
        "license": "Dominio público; texto reutilizable con atribución. Imágenes no incluidas.",
        "sourceUrl": "https://archive.org/details/patriarchalpale00saycgoog",
        "entriesFile": "entries.json",
        "totalEntries": len(entries),
        "editorialStatus": "APPROVED_FOR_HISTORICAL_READING",
    }
    write_json(OUTPUT_DIR / "manifest.json", manifest)
    write_json(OUTPUT_DIR / "entries.json", {"entries": entries})
    print(json.dumps({"module": manifest["id"], "entries": len(entries)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
