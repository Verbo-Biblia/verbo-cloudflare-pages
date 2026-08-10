#!/usr/bin/env python3
"""Compara ubicaciones Strong de RV1960+ con Biblia Verbo sin copiar su texto.

La referencia solo propone posiciones. Todo código se filtra primero contra las
ocurrencias del mismo versículo en STEPBible; el informe no cambia estados ni
equivale a revisión editorial.
"""
from __future__ import annotations

import argparse
import json
import re
import sqlite3
from collections import Counter
from pathlib import Path

import build_rv_verbo_strong as builder


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_MODULE = ROOT / "biblia/modules/bibles/rv-verbo-strong-provisional"
DEFAULT_REFERENCE = ROOT.parent / "Archivos Verbo/RV1960+.bbl.mybible"
STRONG_TOKEN = re.compile(r"^[GH]0*([1-9]\d{0,4})$", re.I)


def segment_codes(segment: dict) -> list[str]:
    return list(segment.get("strongs") or
                ([segment["strong"]] if segment.get("strong") else []))


def parse_reference_verse(scripture: str) -> list[tuple[str, list[str]]]:
    """Extrae palabras y códigos; ignora las etiquetas morfológicas adyacentes."""
    entries: list[list] = []
    for token in scripture.split():
        match = STRONG_TOKEN.fullmatch(token)
        if match and entries:
            code = f"{token[0].upper()}{int(match.group(1))}"
            if code not in entries[-1][1]:
                entries[-1][1].append(code)
            continue
        # Las etiquetas morfológicas nunca contienen minúsculas y suelen llevar
        # guiones o ser abreviaturas de una a cuatro letras (C, T, DNSM, etc.).
        if entries and token == token.upper() and not any(char.isdigit() for char in token):
            continue
        entries.append([builder.norm(token), []])
    return [(word, codes) for word, codes in entries if word]


def load_reference(path: Path) -> dict[tuple[str, str, str], list[tuple[str, list[str]]]]:
    connection = sqlite3.connect(f"file:{path}?mode=ro", uri=True)
    try:
        rows = connection.execute("SELECT Book, Chapter, Verse, Scripture FROM Bible")
        return {
            (builder.BOOK_NUMBERS[int(book)], str(int(chapter)), str(int(verse))):
                parse_reference_verse(scripture)
            for book, chapter, verse, scripture in rows
            if int(book) in builder.BOOK_NUMBERS
        }
    finally:
        connection.close()


def audit(module: Path, reference_path: Path, sample_limit: int,
          scope: str = "all") -> dict:
    manifest = builder.load(module / "manifest.json")
    step = builder.parse_step()
    reference = load_reference(reference_path)
    totals = Counter()
    books: dict[str, dict] = {}
    samples: list[dict] = []

    for book in manifest["books"]:
        is_nt = book["number"] >= 40
        if (scope == "nt" and not is_nt) or (scope == "ot" and is_nt):
            continue
        payload = builder.load(module / book["file"])
        stats = Counter()
        for chapter, verses in payload["chapters"].items():
            for verse, record in verses.items():
                key = (book["id"], chapter, verse)
                entries = reference.get(key)
                if not entries:
                    stats["versesWithoutReference"] += 1
                    continue
                stats["versesCompared"] += 1
                target_words = [builder.norm(part.get("text", ""))
                                for part in record.get("segments", [])]
                mapping = builder.lcs_mapping([word for word, _ in entries], target_words)
                allowed = Counter(group["code"] for group in step.get(key, []))
                used = Counter()
                for source_index, (_, codes) in enumerate(entries):
                    for code in codes:
                        stats["referenceAssociations"] += 1
                        if used[code] >= allowed[code]:
                            stats["excludedNotStep"] += 1
                            continue
                        used[code] += 1
                        stats["stepSupported"] += 1
                        if source_index not in mapping:
                            stats["unmappedPosition"] += 1
                            continue
                        target_index = mapping[source_index]
                        stats["mappedPosition"] += 1
                        target = record["segments"][target_index]
                        current = segment_codes(target)
                        if code in current:
                            stats["agreesAtPosition"] += 1
                            status = (target.get("strongMeta") or {}).get("status", "missing")
                            stats[f"agreementStatus:{status}"] += 1
                            continue
                        elsewhere = any(code in segment_codes(part)
                                       for index, part in enumerate(record["segments"])
                                       if index != target_index)
                        category = "currentElsewhere" if elsewhere else "missingCurrent"
                        stats[category] += 1
                        if len(samples) < sample_limit:
                            samples.append({
                                "reference": f'{book["id"]} {chapter}:{verse}',
                                "word": target.get("text", ""),
                                "suggestedStrong": code,
                                "currentAtWord": current,
                                "category": category,
                            })
        books[book["id"]] = dict(stats)
        totals.update(stats)

    return {
        "module": manifest.get("id"),
        "reference": {
            "file": reference_path.name,
            "use": "solo referencia posicional; no se copia texto ni se promueven estados",
        },
        "openVerification": "cada candidato fue filtrado por ocurrencia en STEPBible",
        "scope": scope,
        "totals": dict(totals),
        "books": books,
        "conflictSamples": samples,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--module", type=Path, default=DEFAULT_MODULE)
    parser.add_argument("--reference", type=Path, default=DEFAULT_REFERENCE)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--sample-limit", type=int, default=200)
    parser.add_argument("--scope", choices=("all", "ot", "nt"), default="all")
    args = parser.parse_args()
    if not args.reference.is_file():
        parser.error("--reference no existe")
    report = audit(args.module, args.reference, max(0, args.sample_limit), args.scope)
    rendered = json.dumps(report, ensure_ascii=False, indent=2) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(rendered, encoding="utf-8")
    print(rendered, end="")


if __name__ == "__main__":
    main()
