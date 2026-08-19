#!/usr/bin/env python3
"""Audita un libro Pulpit de staging y produce una cola editorial.

No corrige automáticamente el OCR. Comprueba la sincronización bíblica y
señala indicios de encabezados perdidos, ruido de página y texto degradado que
deben cotejarse con el facsímil antes de cambiar el estado editorial.
"""

from __future__ import annotations

import argparse
import html
import json
import re
from collections import Counter, defaultdict
from pathlib import Path


LOST_HEADER_RE = re.compile(
    r"\b(?:V(?:er(?:s)?|crs?|era|ers?|en))\.?\s+\d+"
    r"(?:\s*[-–—,]\s*\d+)*\s*[.—]",
    re.I,
)
PAGE_NOISE_RE = re.compile(
    r"(?:\b(?:CH|OH|CII)\.?\s*[IVXLCDM0-9., ]{1,12}[\])}.]|"
    r"\b(?:THE|TIIE|NM)\s+(?:BOOK|DOOK)\s+OF\s+GENESIS\b)",
    re.I,
)
OCR_GLYPH_RE = re.compile(r"[~•�]|\b\w*[A-Za-z][0-9][A-Za-z]\w*\b")


def plain_text(value: str) -> str:
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", value))).strip()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--staging", required=True, type=Path)
    parser.add_argument("--bible", required=True, type=Path)
    parser.add_argument("--report", required=True, type=Path)
    args = parser.parse_args()

    payload = json.loads(args.staging.read_text(encoding="utf-8"))
    bible = json.loads(args.bible.read_text(encoding="utf-8"))["chapters"]
    book = payload["book"]
    entries = payload.get("entries", [])
    fatal: list[str] = []
    review: list[dict[str, object]] = []
    ids: set[str] = set()
    groups: dict[str, list[tuple[int, int, int]]] = defaultdict(list)
    chapters = Counter()

    for entry in entries:
        entry_id = entry.get("id")
        if not entry_id or entry_id in ids:
            fatal.append(f"id ausente o duplicado: {entry_id!r}")
        ids.add(entry_id)
        ref = entry.get("reference", {})
        if ref.get("book") != book:
            fatal.append(f"{entry_id}: libro de referencia incorrecto")
            continue
        chapter = ref.get("chapterStart")
        end_chapter = ref.get("chapterEnd")
        start = ref.get("verseStart")
        end = ref.get("verseEnd")
        if chapter != end_chapter or str(chapter) not in bible:
            fatal.append(f"{entry_id}: capítulo inválido {chapter}-{end_chapter}")
            continue
        maximum = len(bible[str(chapter)])
        if not all(isinstance(v, int) for v in (start, end)) or not (1 <= start <= end <= maximum):
            fatal.append(f"{entry_id}: rango inválido {chapter}:{start}-{end} (máx. {maximum})")
            continue
        chapters[chapter] += 1
        groups[entry.get("sourceGroupId", entry_id)].append((chapter, start, end))

        text = plain_text(entry.get("content", ""))
        reasons = []
        if match := LOST_HEADER_RE.search(text):
            reasons.append(f"posible encabezado de versículo absorbido: {match.group(0)}")
        if match := PAGE_NOISE_RE.search(text):
            reasons.append(f"posible cabecera o pie de página: {match.group(0)}")
        if match := OCR_GLYPH_RE.search(text):
            reasons.append(f"glifo OCR sospechoso: {match.group(0)}")
        if len(text) > 10000:
            reasons.append(f"entrada excepcionalmente larga: {len(text)} caracteres")
        if reasons:
            review.append({"id": entry_id, "reference": ref, "reasons": reasons})

    missing_chapters = sorted(set(map(int, bible)) - set(chapters))
    if missing_chapters:
        fatal.append(f"capítulos sin ninguna entrada: {missing_chapters}")
    for group_id, ranges in groups.items():
        ordered = sorted(ranges)
        for previous, current in zip(ordered, ordered[1:]):
            if previous[0] == current[0] and current[1] <= previous[2]:
                fatal.append(f"{group_id}: intervalos superpuestos {previous} y {current}")

    report = {
        "schemaVersion": 1,
        "book": book,
        "sourceSha256": payload.get("sourceSha256"),
        "editorialStatus": payload.get("editorialStatus"),
        "entries": len(entries),
        "sourceGroups": len(groups),
        "chaptersRepresented": len(chapters),
        "fatalErrors": fatal,
        "reviewQueue": review,
        "publishable": not fatal and not review and payload.get("editorialStatus") == "reviewed",
    }
    args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(
        f"{book}: {len(entries)} entradas, {len(groups)} grupos, "
        f"{len(fatal)} errores estructurales, {len(review)} entradas por revisar"
    )
    return 1 if fatal else 0


if __name__ == "__main__":
    raise SystemExit(main())
