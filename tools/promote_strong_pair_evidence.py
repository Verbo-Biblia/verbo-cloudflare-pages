#!/usr/bin/env python3
"""Promueve pares palabra–Strong repetidos en evidencia abierta.

A diferencia del léxico palabra→código dominante, esta verificación permite que
una palabra española traduzca distintos lemas. Solo exige que el par exacto ya
aparezca varias veces como ``verified-open`` y que la asociación candidata esté
presente en STEPBible para el mismo versículo (invariante del módulo provisional).
No equivale a revisión humana.
"""
from __future__ import annotations

import argparse
import json
from collections import Counter
from pathlib import Path

import build_rv_verbo_strong as builder
from promote_strong_evidence import DEFAULT_MODULE, book_payloads, codes, dump, norm


def build_pairs(payloads: list[tuple[dict, dict]]) -> Counter:
    pairs = Counter()
    for _, payload in payloads:
        for verses in payload["chapters"].values():
            for record in verses.values():
                for segment in record.get("segments", []):
                    if (segment.get("strongMeta") or {}).get("status") != "verified-open":
                        continue
                    token = norm(segment.get("text", ""))
                    segment_codes = codes(segment)
                    if token and len(segment_codes) == 1:
                        pairs[(token, segment_codes[0])] += 1
    return pairs


def classify(payloads: list[tuple[dict, dict]], pairs: Counter,
             step: dict, minimum: int, apply: bool,
             sample_limit: int, minimum_token_length: int,
             exclude_stopwords: bool) -> tuple[Counter, list[dict]]:
    stats = Counter()
    samples: list[dict] = []
    for book, payload in payloads:
        changed = False
        for chapter, verses in payload["chapters"].items():
            for verse, record in verses.items():
                verse_step_codes = Counter(
                    group["code"] for group in step.get((book["id"], chapter, verse), [])
                )
                for segment in record.get("segments", []):
                    segment_codes = codes(segment)
                    status = (segment.get("strongMeta") or {}).get("status", "missing")
                    if status != "provisional-reference" or len(segment_codes) != 1:
                        continue
                    token = norm(segment.get("text", ""))
                    if (len(token) < minimum_token_length or
                            (exclude_stopwords and token in builder.STOPWORDS)):
                        stats["excludedShortOrStopword"] += 1
                        continue
                    if not verse_step_codes[segment_codes[0]]:
                        stats["excludedNotStep"] += 1
                        continue
                    observations = pairs[(token, segment_codes[0])]
                    if observations < minimum:
                        stats["remainingProvisional"] += 1
                        continue
                    stats["promotedAssociations"] += 1
                    stats[f"evidenceAtLeast:{minimum}"] += 1
                    if len(samples) < sample_limit:
                        samples.append({
                            "reference": f'{book["id"]} {chapter}:{verse}',
                            "word": segment.get("text", ""),
                            "strong": segment_codes[0],
                            "verifiedOpenObservations": observations,
                        })
                    if apply:
                        segment["strongMeta"] = {
                            "status": "cross-verified-open",
                            "method": "repeated-open-word-code-pair",
                            "confidence": 0.99 if minimum >= 5 else 0.98,
                        }
                        changed = True
        if changed:
            stats["changedBooks"] += 1
    return stats, samples


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--module", type=Path, default=DEFAULT_MODULE)
    parser.add_argument("--minimum-occurrences", type=int, default=3)
    parser.add_argument("--in-place", action="store_true")
    parser.add_argument("--report", type=Path)
    parser.add_argument("--sample-limit", type=int, default=200)
    parser.add_argument("--minimum-token-length", type=int, default=1)
    parser.add_argument("--exclude-stopwords", action="store_true")
    args = parser.parse_args()
    if args.minimum_occurrences < 2:
        parser.error("--minimum-occurrences debe ser al menos 2")
    if args.minimum_token_length < 1:
        parser.error("--minimum-token-length debe ser positivo")
    payloads = book_payloads(args.module)
    pairs = build_pairs(payloads)
    step = builder.parse_step()
    stats, samples = classify(payloads, pairs, step, args.minimum_occurrences,
                              args.in_place, max(0, args.sample_limit),
                              args.minimum_token_length, args.exclude_stopwords)
    if args.in_place:
        for book, payload in payloads:
            dump(args.module / book["file"], payload)
    report = {
        "module": str(args.module),
        "applied": args.in_place,
        "minimumOccurrences": args.minimum_occurrences,
        "minimumTokenLength": args.minimum_token_length,
        "excludeStopwords": args.exclude_stopwords,
        "observedPairs": len(pairs),
        "method": "par palabra-código observado repetidamente como verified-open",
        "stats": dict(stats),
        "samples": samples,
    }
    if args.report:
        dump(args.report, report, pretty=True)
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
