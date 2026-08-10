#!/usr/bin/env python3
"""Añade asociaciones Strong ausentes con evidencia abierta y posición conservadora.

RV1960+ solo propone una posición. La adición requiere destino vacío, código
ausente en el versículo, una ocurrencia única en STEPBible y un par palabra–código
inequívoco observado repetidamente como ``verified-open``.
"""
from __future__ import annotations

import argparse
import json
from collections import Counter
from pathlib import Path

import build_rv_verbo_strong as builder
from audit_rv1960_strong_locations import DEFAULT_REFERENCE, load_reference, segment_codes
from promote_strong_evidence import DEFAULT_MODULE, book_payloads, dump, norm
from relocate_strong_open_evidence import unique_open_pairs


def add_missing(module: Path, reference_path: Path, minimum: int,
                apply: bool, sample_limit: int) -> dict:
    payloads = book_payloads(module)
    lexicon = unique_open_pairs(payloads, minimum)
    reference = load_reference(reference_path)
    step = builder.parse_step()
    stats = Counter()
    samples = []

    for book, payload in payloads:
        if book["number"] < 40:
            continue
        changed = False
        for chapter, verses in payload["chapters"].items():
            for verse, record in verses.items():
                key = (book["id"], chapter, verse)
                entries = reference.get(key)
                if not entries:
                    continue
                segments = record.get("segments", [])
                mapping = builder.lcs_mapping(
                    [word for word, _ in entries],
                    [builder.norm(segment.get("text", "")) for segment in segments],
                )
                step_groups = step.get(key, [])
                step_counts = Counter(group["code"] for group in step_groups)
                verse_codes = {
                    code for segment in segments for code in segment_codes(segment)
                }
                claimed_targets = set()
                verse_changed = False
                for source_index, (_, reference_codes) in enumerate(entries):
                    target_index = mapping.get(source_index)
                    if target_index is None or target_index in claimed_targets:
                        continue
                    target = segments[target_index]
                    if segment_codes(target):
                        continue
                    target_token = norm(target.get("text", ""))
                    for code in reference_codes:
                        stats["positionalCandidates"] += 1
                        if code in verse_codes:
                            stats["excludedCodeAlreadyPresent"] += 1
                            continue
                        if lexicon.get(target_token) != code:
                            stats["excludedWithoutUniqueOpenPair"] += 1
                            continue
                        if step_counts[code] != 1:
                            stats["excludedNonUniqueStepOccurrence"] += 1
                            continue
                        group = next(group for group in step_groups if group["code"] == code)
                        stats["addedAssociations"] += 1
                        claimed_targets.add(target_index)
                        verse_codes.add(code)
                        if len(samples) < sample_limit:
                            samples.append({
                                "reference": f'{book["id"]} {chapter}:{verse}',
                                "word": target.get("text", ""),
                                "strong": code,
                                "stepGloss": group.get("gloss", ""),
                                "minimumRequiredVerifiedOpenObservations": minimum,
                            })
                        if apply:
                            target["strong"] = code
                            if group.get("morph"):
                                target["morph"] = group["morph"]
                            target["strongMeta"] = {
                                "status": "cross-verified-open",
                                "method": "rv1960-position+unique-open-pair+step-occurrence",
                                "confidence": 0.99,
                            }
                            changed = True
                            verse_changed = True
                        break
                if apply and verse_changed:
                    record["strongs"] = sorted(
                        verse_codes, key=lambda code: (code[0], int(code[1:])),
                    )
        if changed:
            dump(module / book["file"], payload)
            stats["changedBooks"] += 1

    return {
        "module": str(module),
        "applied": apply,
        "scope": "Nuevo Testamento",
        "referenceUse": "RV1960+ solo como guía posicional; no se copia texto",
        "minimumVerifiedOpenObservations": minimum,
        "uniqueOpenPairs": len(lexicon),
        "stats": dict(stats),
        "samples": samples,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--module", type=Path, default=DEFAULT_MODULE)
    parser.add_argument("--reference", type=Path, default=DEFAULT_REFERENCE)
    parser.add_argument("--minimum-occurrences", type=int, default=3)
    parser.add_argument("--in-place", action="store_true")
    parser.add_argument("--report", type=Path)
    parser.add_argument("--sample-limit", type=int, default=200)
    args = parser.parse_args()
    if args.minimum_occurrences < 2:
        parser.error("--minimum-occurrences debe ser al menos 2")
    result = add_missing(args.module, args.reference, args.minimum_occurrences,
                         args.in_place, max(0, args.sample_limit))
    if args.report:
        dump(args.report, result, pretty=True)
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
