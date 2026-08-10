#!/usr/bin/env python3
"""Fusiona adiciones Strong conservadoras desde un módulo candidato.

Solo añade un segmento cuando está vacío en el módulo destino y ninguno de los
códigos candidatos existe ya en otro segmento del versículo. El candidato debe
haber sido construido sobre el mismo texto de Biblia Verbo y filtrado contra
STEPBible. No mueve ni reemplaza asociaciones existentes.
"""
from __future__ import annotations

import argparse
import json
from collections import Counter
from pathlib import Path

import build_rv_verbo_strong as builder


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_MODULE = ROOT / "biblia/modules/bibles/rv-verbo-strong-provisional"


def codes(segment: dict) -> list[str]:
    return list(segment.get("strongs") or
                ([segment["strong"]] if segment.get("strong") else []))


def merge(module: Path, candidate: Path, apply: bool) -> Counter:
    manifest = builder.load(module / "manifest.json")
    candidate_manifest = builder.load(candidate / "manifest.json")
    candidate_books = {book["id"]: book for book in candidate_manifest["books"]}
    stats = Counter()

    for book in manifest["books"]:
        current_path = module / book["file"]
        current = builder.load(current_path)
        candidate_book = candidate_books.get(book["id"])
        if not candidate_book:
            raise ValueError(f'Falta {book["id"]} en el módulo candidato')
        proposed = builder.load(candidate / candidate_book["file"])
        changed = False
        for chapter, verses in current["chapters"].items():
            for verse, record in verses.items():
                verse_changed = False
                other = proposed["chapters"][chapter][verse]
                if record["text"] != other["text"]:
                    raise ValueError(f'{book["id"]} {chapter}:{verse}: texto distinto')
                current_segments = record.get("segments", [])
                proposed_segments = other.get("segments", [])
                if [part.get("text") for part in current_segments] != [
                        part.get("text") for part in proposed_segments]:
                    raise ValueError(f'{book["id"]} {chapter}:{verse}: segmentos distintos')
                verse_codes = {code for part in current_segments for code in codes(part)}
                for index, candidate_segment in enumerate(proposed_segments):
                    candidate_codes = codes(candidate_segment)
                    if not candidate_codes:
                        continue
                    stats["candidateAssociations"] += len(candidate_codes)
                    target = current_segments[index]
                    if codes(target):
                        stats["excludedOccupiedTarget"] += len(candidate_codes)
                        continue
                    if any(code in verse_codes for code in candidate_codes):
                        stats["excludedCodeElsewhere"] += len(candidate_codes)
                        continue
                    stats["acceptedAssociations"] += len(candidate_codes)
                    stats["acceptedSegments"] += 1
                    verse_codes.update(candidate_codes)
                    if not apply:
                        continue
                    target["strong"] = candidate_codes[0]
                    if len(candidate_codes) > 1:
                        target["strongs"] = candidate_codes
                    candidate_morphs = list(candidate_segment.get("morphs") or
                                            ([candidate_segment["morph"]]
                                             if candidate_segment.get("morph") else []))
                    if candidate_morphs:
                        target["morph"] = candidate_morphs[0]
                        if len(candidate_morphs) > 1:
                            target["morphs"] = candidate_morphs
                    target["strongMeta"] = {
                        "status": "provisional-reference",
                        "method": "rv1960-reference-position+step-verse",
                        "confidence": 0.85,
                    }
                    changed = True
                    verse_changed = True
                if verse_changed:
                    record["strongs"] = sorted(
                        {code for part in current_segments for code in codes(part)},
                        key=lambda code: (code[0], int(code[1:])),
                    )
        if changed:
            stats["changedBooks"] += 1
            if apply:
                builder.dump(current_path, current)
    return stats


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--module", type=Path, default=DEFAULT_MODULE)
    parser.add_argument("--candidate", type=Path, required=True)
    parser.add_argument("--in-place", action="store_true")
    parser.add_argument("--report", type=Path)
    args = parser.parse_args()
    stats = merge(args.module, args.candidate, args.in_place)
    report = {
        "module": str(args.module),
        "candidate": str(args.candidate),
        "applied": args.in_place,
        "rule": "destino vacío, código ausente del versículo, mismo texto y segmentos",
        "stats": dict(stats),
    }
    if args.report:
        builder.dump(args.report, report, pretty=True)
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
