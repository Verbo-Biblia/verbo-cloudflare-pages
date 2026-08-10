#!/usr/bin/env python3
"""Reubica códigos Strong solo cuando RV1960+ coincide con evidencia abierta única.

RV1960+ propone únicamente la posición. La decisión exige además que el par
palabra-código sea inequívoco en asociaciones ``verified-open``, que STEPBible
contenga una sola ocurrencia del código en el versículo y que el código esté en
un único segmento provisional distinto. Solo se aceptan destinos vacíos.
"""
from __future__ import annotations

import argparse
import json
from collections import Counter, defaultdict
from pathlib import Path

import build_rv_verbo_strong as builder
from audit_rv1960_strong_locations import (
    DEFAULT_REFERENCE, load_reference, segment_codes,
)
from promote_strong_evidence import DEFAULT_MODULE, book_payloads, dump, norm


def unique_open_pairs(payloads: list[tuple[dict, dict]], minimum: int) -> dict[str, str]:
    observations = defaultdict(Counter)
    for _, payload in payloads:
        for verses in payload["chapters"].values():
            for record in verses.values():
                for segment in record.get("segments", []):
                    if (segment.get("strongMeta") or {}).get("status") != "verified-open":
                        continue
                    codes = segment_codes(segment)
                    token = norm(segment.get("text", ""))
                    if len(token) >= 4 and len(codes) == 1:
                        observations[token][codes[0]] += 1
    return {
        token: counts.most_common(1)[0][0]
        for token, counts in observations.items()
        if len(counts) == 1 and counts.most_common(1)[0][1] >= minimum
    }


def relocate(module: Path, reference_path: Path, minimum: int,
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
                step_counts = Counter(group["code"] for group in step.get(key, []))
                claimed_targets = set()
                for source_index, (_, reference_codes) in enumerate(entries):
                    target_index = mapping.get(source_index)
                    if target_index is None or target_index in claimed_targets:
                        continue
                    target = segments[target_index]
                    target_token = norm(target.get("text", ""))
                    if segment_codes(target):
                        continue
                    for code in reference_codes:
                        stats["positionalCandidates"] += 1
                        if lexicon.get(target_token) != code:
                            stats["excludedWithoutUniqueOpenPair"] += 1
                            continue
                        if step_counts[code] != 1:
                            stats["excludedNonUniqueStepOccurrence"] += 1
                            continue
                        owners = [
                            (index, segment) for index, segment in enumerate(segments)
                            if code in segment_codes(segment)
                        ]
                        if len(owners) != 1:
                            stats["excludedOwnerCount"] += 1
                            continue
                        owner_index, owner = owners[0]
                        owner_codes = segment_codes(owner)
                        owner_status = (owner.get("strongMeta") or {}).get("status")
                        if (owner_index == target_index or len(owner_codes) != 1 or
                                owner_status != "provisional-reference"):
                            stats["excludedUnsafeOwner"] += 1
                            continue
                        owner_token = norm(owner.get("text", ""))
                        if lexicon.get(owner_token) == code:
                            stats["excludedOwnerAlsoSupported"] += 1
                            continue
                        stats["relocatedAssociations"] += 1
                        claimed_targets.add(target_index)
                        if len(samples) < sample_limit:
                            samples.append({
                                "reference": f'{book["id"]} {chapter}:{verse}',
                                "strong": code,
                                "fromWord": owner.get("text", ""),
                                "toWord": target.get("text", ""),
                                "minimumRequiredVerifiedOpenObservations": minimum,
                            })
                        if apply:
                            morphology = owner.get("morph")
                            for field in ("strong", "strongs", "strongMeta", "morph", "morphs"):
                                owner.pop(field, None)
                            target["strong"] = code
                            if morphology:
                                target["morph"] = morphology
                            target["strongMeta"] = {
                                "status": "cross-verified-open",
                                "method": "rv1960-position+unique-open-pair+step-occurrence",
                                "confidence": 0.99,
                            }
                            changed = True
                        break
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
    result = relocate(args.module, args.reference, args.minimum_occurrences,
                      args.in_place, max(0, args.sample_limit))
    if args.report:
        dump(args.report, result, pretty=True)
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
