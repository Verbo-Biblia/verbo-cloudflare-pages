#!/usr/bin/env python3
"""Alinea MACULA Greek/N1904 con los tokens TAGNT publicados por Verbo."""

from __future__ import annotations

import csv
import hashlib
import json
import re
import unicodedata
from collections import defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "data/fuentes-externas/macula/greek/Nestle1904/tsv/macula-greek-Nestle1904.tsv"
MODULE = ROOT / "biblia/modules/original-languages"
OUTPUT = MODULE / "linguistic/macula-greek"
REPORT = OUTPUT / "import-report.json"
REF_RE = re.compile(r"^([1-3]?[A-Z]+) (\d+):(\d+)!([0-9]+)$")


def normalized(value: str) -> str:
    return "".join(
        char for char in unicodedata.normalize("NFD", (value or "").casefold())
        if unicodedata.category(char)[0] not in {"M", "P", "Z"}
    )


def strong_value(value: str) -> str:
    return (value or "").removeprefix("G").lstrip("0") or "0"


def evidence(base: dict, macula: dict) -> list[str]:
    result = []
    if normalized(base.get("surface")) == normalized(macula.get("text")):
        result.append("surface")
    if strong_value(macula.get("strong")) in {strong_value(value) for value in base.get("strong", [])}:
        result.append("strong")
    if normalized(macula.get("lemma")) in {normalized(value) for value in base.get("lemmas", [base.get("lemma", "")])}:
        result.append("lemma")
    return result


def pair_score(base: dict, macula: dict) -> int:
    matched = evidence(base, macula)
    return (8 if "surface" in matched else 0) + (5 if "strong" in matched else 0) + (3 if "lemma" in matched else 0) - 4


def align(base: list[dict], macula: list[dict]) -> list[tuple[int, int]]:
    """Alineación global estable; solo devuelve pares con evidencia léxica."""
    rows, cols, gap = len(base), len(macula), -3
    scores = [[0] * (cols + 1) for _ in range(rows + 1)]
    moves = [[""] * (cols + 1) for _ in range(rows + 1)]
    for i in range(1, rows + 1):
        scores[i][0], moves[i][0] = i * gap, "up"
    for j in range(1, cols + 1):
        scores[0][j], moves[0][j] = j * gap, "left"
    for i in range(1, rows + 1):
        for j in range(1, cols + 1):
            options = (
                (scores[i - 1][j - 1] + pair_score(base[i - 1], macula[j - 1]), "diag"),
                (scores[i - 1][j] + gap, "up"),
                (scores[i][j - 1] + gap, "left"),
            )
            scores[i][j], moves[i][j] = max(options, key=lambda item: (item[0], item[1] == "diag"))
    pairs = []
    i, j = rows, cols
    while i or j:
        move = moves[i][j]
        if move == "diag":
            if evidence(base[i - 1], macula[j - 1]):
                pairs.append((i - 1, j - 1))
            i, j = i - 1, j - 1
        elif move == "up":
            i -= 1
        else:
            j -= 1
    return list(reversed(pairs))


def compact_row(row: dict) -> dict:
    fields = ("xml:id", "ref", "role", "class", "type", "gloss", "text", "lemma", "normalized", "strong", "morph", "person", "number", "gender", "case", "tense", "voice", "mood", "degree", "domain", "ln", "frame", "subjref", "referent")
    return {key: row[key] for key in fields if row.get(key)}


def main() -> None:
    by_verse: dict[tuple[str, int, int], list[dict]] = defaultdict(list)
    with SOURCE.open(encoding="utf-8-sig", newline="") as stream:
        for row in csv.DictReader(stream, delimiter="\t"):
            match = REF_RE.match(row["ref"])
            if not match:
                raise ValueError(f"Referencia MACULA inválida: {row['ref']}")
            by_verse[(match.group(1), int(match.group(2)), int(match.group(3)))].append(row)

    manifest = json.loads((MODULE / "manifest.json").read_text(encoding="utf-8"))
    totals = defaultdict(int)
    chapters = {}
    covered_verses = set()
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for book_id, book in manifest["books"].items():
        if book["language"] != "el":
            continue
        chapters[book_id] = {}
        for chapter_number, relative_path in book["chapters"].items():
            base_chapter = json.loads((MODULE / relative_path).read_text(encoding="utf-8"))
            token_map = {}
            unresolved_base, unresolved_source = [], []
            for verse_number, verse in base_chapter["verses"].items():
                covered_verses.add((book_id, int(chapter_number), int(verse_number)))
                source_rows = by_verse.get((book_id, int(chapter_number), int(verse_number)), [])
                pairs = align(verse["tokens"], source_rows)
                used_base, used_source = set(), set()
                for base_index, source_index in pairs:
                    base_token, source_row = verse["tokens"][base_index], source_rows[source_index]
                    matched = evidence(base_token, source_row)
                    if not matched:
                        continue
                    token_map[base_token["id"]] = {"match": matched, "sourceToken": compact_row(source_row)}
                    used_base.add(base_index)
                    used_source.add(source_index)
                unresolved_base.extend(token["id"] for index, token in enumerate(verse["tokens"]) if index not in used_base)
                unresolved_source.extend(row["ref"] for index, row in enumerate(source_rows) if index not in used_source)
            payload = {
                "schemaVersion": 1,
                "book": book_id,
                "chapter": int(chapter_number),
                "layer": "macula-greek",
                "provenance": {
                    "bibliographyId": "macula-greek",
                    "sourceId": "macula-greek",
                    "repository": "https://github.com/Clear-Bible/macula-greek",
                    "commit": "8423afe47b9e8f24b7772e808af45c7159a6fe7e",
                    "license": "CC BY 4.0",
                    "edition": "Nestle 1904",
                    "sourceFile": "Nestle1904/tsv/macula-greek-Nestle1904.tsv",
                    "sha256": hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
                    "transformation": "tools/import_macula_greek.py",
                },
                "tokens": token_map,
                "unresolved": {"baseTokenIds": unresolved_base, "sourceRefs": unresolved_source},
            }
            output_path = OUTPUT / book_id / f"{chapter_number}.json"
            output_path.parent.mkdir(parents=True, exist_ok=True)
            output_path.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
            chapters[book_id][str(chapter_number)] = f"macula-greek/{book_id}/{chapter_number}.json"
            totals["baseTokens"] += sum(len(verse["tokens"]) for verse in base_chapter["verses"].values())
            totals["sourceTokens"] += sum(len(by_verse.get((book_id, int(chapter_number), int(verse)), [])) for verse in base_chapter["verses"])
            totals["mappedTokens"] += len(token_map)
            totals["unresolvedBase"] += len(unresolved_base)
            totals["unresolvedSource"] += len(unresolved_source)
    totals["sourceFileTokens"] = sum(len(rows) for rows in by_verse.values())
    totals["sourceOnlyVerseTokens"] = sum(len(rows) for key, rows in by_verse.items() if key not in covered_verses)
    report = {
        "provenance": {
            "bibliographyId": "macula-greek",
            "sourceId": "macula-greek",
            "repository": "https://github.com/Clear-Bible/macula-greek",
            "commit": "8423afe47b9e8f24b7772e808af45c7159a6fe7e",
            "license": "CC BY 4.0",
        },
        "sourceSha256": hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
        "totals": dict(totals),
        "chapters": chapters,
    }
    REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
