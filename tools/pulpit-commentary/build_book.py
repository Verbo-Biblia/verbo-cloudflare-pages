#!/usr/bin/env python3
"""Convierte un OCR auditado de Pulpit Commentary a JSON de revisión.

La salida de este programa es *staging*. No registra el comentario ni lo hace
visible en Verbo. Antes de publicar se requiere corregir el cuerpo OCR y marcar
cada entrada como revisada contra el facsímil.
"""

from __future__ import annotations

import argparse
import hashlib
import html
import importlib.util
import json
import re
from collections import Counter, defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
AUDITOR_PATH = Path(__file__).with_name("audit_ocr.py")


def load_auditor():
    spec = importlib.util.spec_from_file_location("pulpit_audit_ocr", AUDITOR_PATH)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader
    spec.loader.exec_module(module)
    return module


def compact(text: str) -> str:
    text = text.replace("\u00ad", "").replace("\r", "")
    text = re.sub(r"(?<=\w)-\n(?=[a-z])", "", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def paragraphs(text: str) -> str:
    cleaned = []
    for block in re.split(r"\n\s*\n", compact(text)):
        lines = []
        for line in block.splitlines():
            line = line.strip()
            if not line:
                continue
            if re.fullmatch(r"\d+", line):
                continue
            if re.fullmatch(r"THE (?:BOOK|DOOK) OF [A-Z' .]+", line, re.I):
                continue
            if re.match(r"^[\[(]?(?:CH|EN|RM|ERR|OS)[., ].*\d", line, re.I):
                continue
            lines.append(line)
        value = " ".join(lines).strip()
        if value:
            cleaned.append(f"<p>{html.escape(value, quote=False)}</p>")
    return "".join(cleaned)


def verified_paragraphs(values: list[str]) -> str:
    """Convierte párrafos ya cotejados sin volver a aplicar limpieza OCR."""
    return "".join(
        f"<p>{html.escape(value.strip(), quote=False)}</p>"
        for value in values
        if value.strip()
    )


HEADER_RE = re.compile(
    r"(?m)^\s*((?:Ver(?:s|e|a)?|Ven|Verse(?:s)?)\s*[.,]?\s*"
    r"\d+(?:\s*(?:[-–—]+|,)\s*\d+)*\s*(?:[.—]|-(?![-–—\d])))"
)
SECTION_RE = re.compile(
    r"(?mi)^\s*(EXPOSITION|HOMILETICS|HOMILIES BY VARIOUS AUTHORS)\s*\.?\s*$"
)


def parse_intervals(header: str) -> list[tuple[int, int]]:
    number_part = re.search(r"\d+(?:\s*(?:[-–—]+|,)\s*\d+)*", header)
    if not number_part:
        raise ValueError(f"encabezado sin números: {header!r}")
    intervals = []
    for part in re.split(r"\s*,\s*", number_part.group(0)):
        numbers = [int(value) for value in re.findall(r"\d+", part)]
        if not numbers:
            continue
        intervals.append((min(numbers), max(numbers)))
    if not intervals:
        raise ValueError(f"encabezado sin intervalos: {header!r}")
    return intervals


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--book", required=True)
    parser.add_argument("--chapters", required=True, type=int)
    parser.add_argument("--verified-boundaries", required=True, type=Path)
    parser.add_argument("--corrections", required=True, type=Path)
    parser.add_argument("--bible", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()

    auditor = load_auditor()
    text = args.source.read_text(encoding="utf-8", errors="replace")
    verified_payload = json.loads(args.verified_boundaries.read_text(encoding="utf-8"))
    verified = {
        int(item["chapter"]): text.find(item["ocrMarker"])
        for item in verified_payload["boundaries"]
    }
    missing_markers = [chapter for chapter, offset in verified.items() if offset < 0]
    if missing_markers:
        raise SystemExit(f"marcadores verificados ausentes: {missing_markers}")
    initial_candidates = auditor.chapter_candidates(text, args.chapters)
    first_headings = [
        item
        for item in initial_candidates
        if item["chapter"] == 1 and item["evidence"] == "chapter-heading"
    ]
    if 1 in verified:
        body_start = verified[1]
    elif first_headings:
        body_start = int(first_headings[0]["offset"])
    else:
        raise SystemExit("no se encontró el inicio del comentario")
    body = text[body_start:]
    index = re.search(r"(?mi)^[\f\t ]*HOMILETICAL INDEX\b", body)
    if index:
        body = body[: index.start()]

    candidates = auditor.chapter_candidates(body, args.chapters)
    offsets: dict[int, int] = {}
    for chapter in range(1, args.chapters + 1):
        headings = [
            item for item in candidates
            if int(item["chapter"]) == chapter and item["evidence"] == "chapter-heading"
        ]
        if chapter in verified:
            offsets[chapter] = verified[chapter]
        elif headings:
            offsets[chapter] = body_start + int(headings[0]["offset"])
        else:
            raise SystemExit(f"capítulo {chapter}: límite no demostrado")
    if any(offsets[ch] >= offsets[ch + 1] for ch in range(1, args.chapters)):
        raise SystemExit("los límites de capítulos no son estrictamente crecientes")

    correction_payload = json.loads(args.corrections.read_text(encoding="utf-8"))
    corrections: dict[tuple[int, str], list[str]] = defaultdict(list)
    for item in correction_payload["referenceHeaderCorrections"]:
        corrections[(int(item["chapter"]), item["ocr"])].append(item["corrected"])
    used_corrections: Counter[tuple[int, str]] = Counter()
    text_corrections: dict[int, list[dict[str, object]]] = defaultdict(list)
    for item in correction_payload.get("bodyTextCorrections", []):
        text_corrections[int(item["chapter"])].append(item)
    entry_replacements: dict[tuple[int, str], list[dict[str, object]]] = defaultdict(list)
    for item in correction_payload.get("entryTextReplacements", []):
        entry_replacements[(int(item["chapter"]), str(item["sourceHeader"]))].append(item)
    used_entry_replacements: Counter[tuple[int, str]] = Counter()
    bible = json.loads(args.bible.read_text(encoding="utf-8"))["chapters"]
    entries = []
    errors = []

    for chapter in range(1, args.chapters + 1):
        segment = text[offsets[chapter]: offsets.get(chapter + 1, body_start + len(body))]
        for item in text_corrections.get(chapter, []):
            ocr = str(item["ocr"])
            corrected = str(item["corrected"])
            occurrence = int(item.get("occurrence", 1))
            if occurrence < 1:
                errors.append(
                    f"corrección textual inválida: {chapter} {ocr!r}: occurrence debe ser >= 1"
                )
                continue
            matches = list(re.finditer(re.escape(ocr), segment))
            if len(matches) < occurrence:
                errors.append(
                    f"corrección textual no utilizada: {chapter} {ocr!r} "
                    f"(ocurrencia {occurrence})"
                )
                continue
            match = matches[occurrence - 1]
            segment = segment[:match.start()] + corrected + segment[match.end():]
        events = [(match.start(), "section", match) for match in SECTION_RE.finditer(segment)]
        events += [(match.start(), "entry", match) for match in HEADER_RE.finditer(segment)]
        events.sort(key=lambda item: item[0])
        section = "exposition"
        entry_events = []
        for event_index, (_, kind, match) in enumerate(events):
            if kind == "section":
                label = match.group(1).upper()
                section = "exposition" if label == "EXPOSITION" else "homiletics"
            else:
                next_event_start = (
                    events[event_index + 1][0]
                    if event_index + 1 < len(events)
                    else len(segment)
                )
                entry_events.append((match, section, next_event_start))

        for number, (match, entry_section, content_end) in enumerate(entry_events, 1):
            raw_header = compact(match.group(1))
            correction_key = (chapter, raw_header)
            correction_number = used_corrections[correction_key]
            available = corrections.get(correction_key, [])
            corrected_header = (
                available[correction_number]
                if correction_number < len(available)
                else raw_header
            )
            if corrected_header != raw_header:
                used_corrections[correction_key] += 1
            intervals = parse_intervals(corrected_header)
            max_verse = len(bible[str(chapter)])
            content_start = match.end()
            content = paragraphs(segment[content_start:content_end])
            replacement_key = (chapter, raw_header)
            replacement_number = used_entry_replacements[replacement_key]
            available_replacements = entry_replacements.get(replacement_key, [])
            replacement = (
                available_replacements[replacement_number]
                if replacement_number < len(available_replacements)
                else None
            )
            if replacement is not None:
                content = verified_paragraphs(replacement["paragraphs"])
                used_entry_replacements[replacement_key] += 1
            if not content:
                errors.append(f"{args.book} {chapter}: {raw_header!r}: contenido vacío")
                continue
            source_group = f"pulpit-{args.book.lower()}-{chapter}-{number}"
            for interval_number, (verse_start, verse_end) in enumerate(intervals, 1):
                if verse_start < 1 or verse_end > max_verse:
                    errors.append(
                        f"{args.book} {chapter}: {raw_header!r} -> "
                        f"{verse_start}-{verse_end}, máximo {max_verse}"
                    )
                    continue
                entries.append(
                    {
                        "id": f"{source_group}-{interval_number}-{verse_start}-{verse_end}",
                        "title": f"{args.book} {chapter}:{verse_start}"
                        + (f"–{verse_end}" if verse_end != verse_start else ""),
                        "author": "The Pulpit Commentary",
                        "section": entry_section,
                        "sourceHeader": raw_header,
                        "sourceGroupId": source_group,
                        "reference": {
                            "book": args.book,
                            "chapterStart": chapter,
                            "verseStart": verse_start,
                            "chapterEnd": chapter,
                            "verseEnd": verse_end,
                        },
                        "content": content,
                        "editorialStatus": "reviewed" if replacement is not None else "ocr-unreviewed",
                    }
                )

    for (chapter, header), values in sorted(corrections.items()):
        remaining = len(values) - used_corrections[(chapter, header)]
        errors.extend(
            f"corrección no utilizada: {chapter} {header} (ocurrencia pendiente)"
            for _ in range(remaining)
        )
    for (chapter, header), values in sorted(entry_replacements.items()):
        remaining = len(values) - used_entry_replacements[(chapter, header)]
        errors.extend(
            f"reemplazo de entrada no utilizado: {chapter} {header}"
            for _ in range(remaining)
        )
    if errors:
        raise SystemExit("\n".join(errors))

    payload = {
        "schemaVersion": 1,
        "book": args.book,
        "source": str(args.source),
        "sourceSha256": hashlib.sha256(args.source.read_bytes()).hexdigest(),
        "editorialStatus": "ocr-unreviewed",
        "entries": entries,
    }
    args.output.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{args.book}: {len(entries)} entradas sincronizadas generadas para revisión")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
