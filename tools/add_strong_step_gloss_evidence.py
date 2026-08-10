#!/usr/bin/env python3
"""Añade Strong ausentes cuando la glosa STEPBible coincide literalmente.

La posición RV1960+ es solo un candidato. Se exige destino vacío, palabra de al
menos cuatro letras no funcional, código ausente, ocurrencia STEPBible única y
presencia literal de la palabra normalizada en la glosa española abierta.
"""
from __future__ import annotations

import argparse
import json
from collections import Counter
from pathlib import Path

import build_rv_verbo_strong as builder
from audit_rv1960_strong_locations import DEFAULT_REFERENCE, load_reference, segment_codes
from promote_strong_evidence import DEFAULT_MODULE, book_payloads, dump, norm
from promote_strong_step_gloss_similarity import best_match


def add_missing(module: Path, reference_path: Path, apply: bool,
                sample_limit: int, minimum_similarity: float) -> dict:
    payloads = book_payloads(module)
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
                groups_by_code = {
                    group["code"]: group for group in step_groups
                    if step_counts[group["code"]] == 1
                }
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
                    token = norm(target.get("text", ""))
                    if len(token) < 4 or token in builder.STOPWORDS:
                        stats["excludedShortOrStopword"] += len(reference_codes)
                        continue
                    for code in reference_codes:
                        stats["positionalCandidates"] += 1
                        if code in verse_codes:
                            stats["excludedCodeAlreadyPresent"] += 1
                            continue
                        group = groups_by_code.get(code)
                        if not group:
                            stats["excludedNonUniqueStepOccurrence"] += 1
                            continue
                        score, gloss_word = best_match(token, group.get("gloss", ""))
                        if (minimum_similarity == 1.0 and
                                token in builder.gloss_words(group.get("gloss", ""))):
                            score, gloss_word = 1.0, token
                        if score < minimum_similarity:
                            stats["excludedWithoutExactStepGloss"] += 1
                            continue
                        stats["addedAssociations"] += 1
                        claimed_targets.add(target_index)
                        verse_codes.add(code)
                        if len(samples) < sample_limit:
                            samples.append({
                                "reference": f'{book["id"]} {chapter}:{verse}',
                                "word": target.get("text", ""),
                                "strong": code,
                                "stepGloss": group.get("gloss", ""),
                                "matchedGlossWord": gloss_word,
                                "similarity": round(score, 4),
                                "morphology": group.get("morph", ""),
                            })
                        if apply:
                            target["strong"] = code
                            if group.get("morph"):
                                target["morph"] = group["morph"]
                            target["strongMeta"] = {
                                "status": "verified-open",
                                "method": ("rv1960-position+step-spanish-gloss-exact"
                                           if score == 1.0 else
                                           "rv1960-position+step-spanish-gloss-inflection"),
                                "confidence": round(score, 4),
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
        "minimumSimilarity": minimum_similarity,
        "method": "destino vacío+código ausente+ocurrencia STEPBible única+glosa española",
        "stats": dict(stats),
        "samples": samples,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--module", type=Path, default=DEFAULT_MODULE)
    parser.add_argument("--reference", type=Path, default=DEFAULT_REFERENCE)
    parser.add_argument("--in-place", action="store_true")
    parser.add_argument("--report", type=Path)
    parser.add_argument("--sample-limit", type=int, default=200)
    parser.add_argument("--minimum-similarity", type=float, default=1.0)
    args = parser.parse_args()
    if not 0.9 <= args.minimum_similarity <= 1.0:
        parser.error("--minimum-similarity debe estar entre 0.9 y 1.0")
    result = add_missing(args.module, args.reference, args.in_place,
                         max(0, args.sample_limit), args.minimum_similarity)
    if args.report:
        dump(args.report, result, pretty=True)
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
