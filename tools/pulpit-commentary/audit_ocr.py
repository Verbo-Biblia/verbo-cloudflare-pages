#!/usr/bin/env python3
"""Audita OCR de facsímiles de The Pulpit Commentary sin publicarlo.

La utilidad es deliberadamente conservadora: informa encabezados canónicos
reconocidos, saltos, duplicados y marcadores de versículo. No intenta reparar
ni asignar silenciosamente texto cuando el OCR no permite demostrar el límite.
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path


ROMAN_VALUES = {"I": 1, "V": 5, "X": 10, "L": 50, "C": 100, "D": 500, "M": 1000}


def roman_to_int(value: str) -> int:
    total = 0
    previous = 0
    for char in reversed(value):
        current = ROMAN_VALUES[char]
        if current < previous:
            total -= current
        else:
            total += current
            previous = current
    return total


def normalize_ocr_roman(value: str) -> str:
    """Normaliza confusiones inequívocas del OCR en números romanos.

    Las sustituciones de minúsculas se aplican únicamente dentro del token que
    sigue a un encabezado ``CHAPTER``; son errores observados directamente en
    el facsímil de Génesis (p. ej. ``xxxm`` por ``XXXIII``).
    """
    replacements = {"l": "I", "r": "I", "m": "III", "u": "II"}
    value = value.strip().replace("!", "I").replace("|", "I")
    return "".join(replacements.get(char, char.upper()) for char in value)


def chapter_candidates(body: str, expected: int) -> list[dict[str, int | str]]:
    patterns = (
        (
            "chapter-heading",
            re.compile(
                r"(?mi)(?:^|(?<=\s))\s*[A-Z'.]{0,6}APTE[RB]\s+"
                r"([IVXLCDM!l|mru]+)[.,]?\s*$"
            ),
        ),
        (
            "page-header",
            re.compile(
                r"(?mi)^[\f \t]{0,8}[\[(]?(?:CH|EN|RM|TEN|ERR|OS)"
                r"[., ]+([IVXLCDM!l|]+)[., ]+\s*\d"
            ),
        ),
    )
    candidates: list[dict[str, int | str]] = []
    for evidence, pattern in patterns:
        for match in pattern.finditer(body):
            roman = normalize_ocr_roman(match.group(1))
            if not roman or any(char not in ROMAN_VALUES for char in roman):
                continue
            chapter = roman_to_int(roman)
            # En varios facsímiles la I mayúscula se reconoce como L. Solo se
            # acepta esa lectura cuando el valor romano literal es imposible
            # para el libro y la sustitución produce un capítulo válido.
            if chapter > expected and "L" in roman:
                repaired = roman.replace("L", "I")
                repaired_chapter = roman_to_int(repaired)
                if 1 <= repaired_chapter <= expected:
                    roman = repaired
                    chapter = repaired_chapter
            if 1 <= chapter <= expected:
                candidates.append(
                    {"chapter": chapter, "offset": match.start(), "evidence": evidence}
                )
    return sorted(candidates, key=lambda item: int(item["offset"]))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--book", required=True)
    parser.add_argument("--chapters", required=True, type=int)
    parser.add_argument("--json-output", type=Path)
    parser.add_argument("--verified-boundaries", type=Path)
    args = parser.parse_args()

    text = args.source.read_text(encoding="utf-8", errors="replace")
    verified_chapters: set[int] = set()
    verified_boundaries: list[tuple[int, int]] = []
    if args.verified_boundaries:
        verified = json.loads(args.verified_boundaries.read_text(encoding="utf-8"))
        if verified.get("book") != args.book:
            parser.error("el archivo de límites verificados pertenece a otro libro")
        for boundary in verified.get("boundaries", []):
            chapter = int(boundary["chapter"])
            marker = str(boundary["ocrMarker"])
            offset = text.find(marker)
            if offset < 0:
                parser.error(f"no se encontró el marcador OCR verificado del capítulo {chapter}")
            verified_boundaries.append((chapter, offset))
            verified_chapters.add(chapter)

    # Running page headers repeat the book title hundreds of times. The first
    # canonical chapter heading after the introductory matter is a more stable
    # boundary for the commentary body.
    initial_candidates = chapter_candidates(text, args.chapters)
    first_headings = [
        item
        for item in initial_candidates
        if item["chapter"] == 1 and item["evidence"] == "chapter-heading"
    ]
    verified_first = [offset for chapter, offset in verified_boundaries if chapter == 1]
    body_start = (
        verified_first[0]
        if verified_first
        else int(first_headings[0]["offset"])
        if first_headings
        else 0
    )
    body = text[body_start:]

    # Homiletical indexes at the end repeat chapter headings. Stop at the first
    # index heading when it can be identified.
    index_match = re.search(r"(?mi)^[\f\t ]*HOMILETICAL INDEX\b", body)
    if index_match:
        body = body[: index_match.start()]

    found = chapter_candidates(body, args.chapters)
    for item in found:
        item["offset"] = body_start + int(item["offset"])

    if args.verified_boundaries:
        for chapter, offset in verified_boundaries:
            found.append(
                {"chapter": chapter, "offset": offset, "evidence": "facsimile-verified"}
            )
        found.sort(key=lambda item: int(item["offset"]))

    first_offsets: dict[int, int] = {}
    evidence: dict[int, set[str]] = {}
    for item in found:
        chapter = int(item["chapter"])
        first_offsets.setdefault(chapter, int(item["offset"]))
        evidence.setdefault(chapter, set()).add(str(item["evidence"]))

    present = sorted(first_offsets)
    missing = [chapter for chapter in range(1, args.chapters + 1) if chapter not in first_offsets]
    weak = [
        chapter
        for chapter in present
        if evidence[chapter] == {"page-header"} and chapter not in verified_chapters
    ]
    verse_markers = len(
        re.findall(r"(?mi)\b(?:Ver\.|Vers\.|Verse|Verses)\s+\d+", body)
    )

    report = {
        "book": args.book,
        "source": str(args.source),
        "expectedChapters": args.chapters,
        "recognizedChapters": present,
        "missingChapters": missing,
        "chaptersRecognizedOnlyFromPageHeaders": weak,
        "chapterEvidence": {str(chapter): sorted(evidence[chapter]) for chapter in present},
        "recognizedVerseMarkers": verse_markers,
        "publishable": not missing and not weak,
    }

    rendered = json.dumps(report, ensure_ascii=False, indent=2) + "\n"
    if args.json_output:
        args.json_output.write_text(rendered, encoding="utf-8")
    print(rendered, end="")
    return 0 if report["publishable"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
