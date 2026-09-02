#!/usr/bin/env python3
"""Extrae citas bíblicas explícitas de Sayce a una cola no publicable."""

from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SOURCE_DIR = ROOT / "data/fuentes-externas/historia-at/sayce-patriarchal-palestine"
SOURCE = SOURCE_DIR / "original/pg14405.txt"
STRUCTURE = SOURCE_DIR / "structure.json"
OUTPUT = SOURCE_DIR / "editorial/bible-relation-candidates.json"

BOOKS = {
    "Gen": "GEN", "Genesis": "GEN", "Exod": "EXO", "Exodus": "EXO", "Lev": "LEV", "Num": "NUM",
    "Deut": "DEU", "Josh": "JOS", "Joshua": "JOS", "Judg": "JDG", "Judges": "JDG", "Ruth": "RUT",
    "1 Sam": "1SA", "2 Sam": "2SA", "1 Kings": "1KI", "2 Kings": "2KI",
    "1 Chron": "1CH", "2 Chron": "2CH", "Ezra": "EZR", "Neh": "NEH",
    "Esth": "EST", "Job": "JOB", "Ps": "PSA", "Prov": "PRO",
    "Eccl": "ECC", "Is": "ISA", "Isa": "ISA", "Jer": "JER", "Ezek": "EZK",
    "Dan": "DAN", "Hos": "HOS", "Joel": "JOL", "Amos": "AMO",
    "Obad": "OBA", "Jonah": "JON", "Mic": "MIC", "Nah": "NAM",
    "Hab": "HAB", "Zeph": "ZEP", "Hag": "HAG", "Zech": "ZEC", "Mal": "MAL",
}
BOOK_PATTERN = "|".join(sorted((re.escape(book) for book in BOOKS), key=len, reverse=True))
REFERENCE = re.compile(
    rf"(?<![A-Za-z])(?P<outer_open>\()?(?P<book>{BOOK_PATTERN})\.?(?:\s*\(\s*|\s+)(?P<chapter>[ivxlcdm]+)\.\s*"
    rf"(?P<verses>\d+(?:\s*[-–]\s*\d+)?(?:\s*,\s*\d+(?:\s*[-–]\s*\d+)?(?!\s+(?:Sam|Kings|Chron)\b))*)\s*\)?",
    re.IGNORECASE,
)


def roman_to_int(value: str) -> int:
    numbers = {"i": 1, "v": 5, "x": 10, "l": 50, "c": 100, "d": 500, "m": 1000}
    total = previous = 0
    for char in reversed(value.lower()):
        current = numbers[char]
        total += -current if current < previous else current
        previous = max(previous, current)
    return total


def canonical_book(raw: str) -> tuple[str, str]:
    normalized = re.sub(r"\s+", " ", raw).strip()
    for label, osis in BOOKS.items():
        if normalized.lower() == label.lower():
            return label, osis
    raise ValueError(raw)


def main() -> None:
    raw = SOURCE.read_text(encoding="utf-8")
    lines = raw.splitlines()
    structure = json.loads(STRUCTURE.read_text(encoding="utf-8"))
    units = [unit for unit in structure["units"] if unit["unitType"] != "INDEX"]
    searchable_end = next(unit["sourceLineStart"] for unit in structure["units"] if unit["unitType"] == "INDEX") - 1

    # Los saltos de línea tipográficos no deben impedir reconocer una cita.
    chunks = []
    offsets = []
    for line_number, line in enumerate(lines[:searchable_end], 1):
        if chunks:
            chunks.append(" ")
            offsets.append(line_number)
        chunks.extend(line)
        offsets.extend([line_number] * len(line))
    flattened = "".join(chunks)

    candidates = []
    for match in REFERENCE.finditer(flattened):
        line_number = offsets[match.start()]
        unit = next((item for item in units if item["sourceLineStart"] <= line_number <= item["sourceLineEnd"]), None)
        if not unit:
            continue
        label, osis = canonical_book(match.group("book"))
        chapter = roman_to_int(match.group("chapter"))
        verse_specs = [part.strip() for part in match.group("verses").split(",")]
        anchors = []
        for verse_spec in verse_specs:
            limits = [int(value) for value in re.split(r"\s*[-–]\s*", verse_spec)]
            anchors.append({
                "book": osis,
                "chapter": chapter,
                "verseStart": limits[0],
                "verseEnd": limits[-1],
            })
        before = flattened[max(0, match.start() - 150):match.start()]
        after = flattened[match.end():match.end() + 150]
        context = re.sub(r"\s+", " ", before + match.group(0) + after).strip()
        identity = hashlib.sha256(f"{unit['id']}|{context}".encode()).hexdigest()[:12]
        candidates.append({
            "id": f"sayce-rel-{identity}",
            "sourceId": "sayce-patriarchal-palestine",
            "unitId": unit["id"],
            "sourceLocator": f"Gutenberg TXT línea {line_number}",
            "rawReference": re.sub(r"\s+", " ", match.group(0)).strip(),
            "bookLabel": label,
            "anchors": anchors,
            "contextSnippet": context,
            "anchorStatus": "EXPLICIT_CITATION",
            "relationAssessment": "UNREVIEWED",
            "possibleRelationTypes": [],
            "reviewNotes": [
                "La cita explícita solo justifica revisar el candidato; no demuestra pertinencia para el Asistente.",
                "Clasificar la relación y la afirmación de Sayce antes de cualquier contraste moderno o proyección.",
            ],
        })

    ids = [candidate["id"] for candidate in candidates]
    if len(ids) != len(set(ids)):
        raise ValueError("IDs duplicados en la cola de candidatos")
    bible_dir = ROOT / "biblia/modules/bibles/rv-verbo/books"
    bible_cache = {}
    for candidate in candidates:
        for anchor in candidate["anchors"]:
            chapters = bible_cache.setdefault(
                anchor["book"],
                json.loads((bible_dir / f"{anchor['book']}.json").read_text(encoding="utf-8"))["chapters"],
            )
            chapter = chapters.get(str(anchor["chapter"]))
            if chapter is None or any(str(verse) not in chapter for verse in range(anchor["verseStart"], anchor["verseEnd"] + 1)):
                raise ValueError(f"Anclaje inválido en {candidate['id']}: {anchor}")

    result = {
        "schemaVersion": 1,
        "sourceId": "sayce-patriarchal-palestine",
        "generatedAt": "2026-09-02",
        "integrationStatus": "STAGING_ONLY",
        "publicationAllowed": False,
        "anchorValidation": {"referenceBible": "rv-verbo", "allAnchorsValid": True},
        "method": "Citas explícitas con libro abreviado, capítulo romano y versículo arábigo; se excluye el índice.",
        "limitations": [
            "No detecta alusiones ni referencias sin libro explícito.",
            "No asigna pertinencia, tipo de relación, evidencia ni estado de aprobación.",
            "Las listas con un segundo capítulo abreviado requieren revisión manual.",
        ],
        "candidateCount": len(candidates),
        "candidates": candidates,
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(OUTPUT), "candidateCount": len(candidates)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
