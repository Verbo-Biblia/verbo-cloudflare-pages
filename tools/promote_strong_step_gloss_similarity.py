#!/usr/bin/env python3
"""Clasifica variantes flexivas NT cercanas a glosas españolas STEPBible.

La regla es más estricta que una semejanza genérica: segmento de código único,
palabras de al menos cinco letras, prefijo común de cuatro letras, similitud alta,
misma ocurrencia del código en orden y morfología compatible. No usa RV1960+ como
evidencia final.
"""
from __future__ import annotations

import argparse
import json
from collections import Counter, defaultdict, deque
from difflib import SequenceMatcher
from pathlib import Path

import build_rv_verbo_strong as builder
from promote_strong_evidence import DEFAULT_MODULE, dump


def codes(segment: dict) -> list[str]:
    return list(segment.get("strongs") or
                ([segment["strong"]] if segment.get("strong") else []))


def best_match(token: str, gloss: str) -> tuple[float, str]:
    candidates = [word for word in builder.gloss_words(gloss)
                  if len(word) >= 5 and token[:4] == word[:4]]
    if not candidates:
        return 0.0, ""
    ranked = [(SequenceMatcher(None, token, word, autojunk=False).ratio(), word)
              for word in candidates]
    return max(ranked)


def classify(module: Path, apply: bool, threshold: float,
             sample_limit: int) -> tuple[Counter, list[dict]]:
    manifest = builder.load(module / "manifest.json")
    step = builder.parse_step()
    stats = Counter()
    samples: list[dict] = []
    for book in manifest["books"]:
        if int(book["number"]) < 40:
            continue
        path = module / book["file"]
        payload = builder.load(path)
        changed = False
        for chapter, verses in payload["chapters"].items():
            for verse, record in verses.items():
                groups: dict[str, deque] = defaultdict(deque)
                for group in step.get((book["id"], chapter, verse), []):
                    groups[group["code"]].append(group)
                for segment in record.get("segments", []):
                    segment_codes = codes(segment)
                    matched = [groups[code].popleft() if groups[code] else {}
                               for code in segment_codes]
                    status = (segment.get("strongMeta") or {}).get("status", "missing")
                    if status != "provisional-reference" or len(segment_codes) != 1:
                        continue
                    token = builder.norm(segment.get("text", ""))
                    if len(token) < 5 or token in builder.STOPWORDS:
                        stats["excludedShortOrStopword"] += 1
                        continue
                    group = matched[0]
                    score, gloss_word = best_match(token, group.get("gloss", ""))
                    morphs = list(segment.get("morphs") or
                                  ([segment["morph"]] if segment.get("morph") else []))
                    morphology_matches = (not morphs or not group.get("morph") or
                                          morphs[0] == group["morph"])
                    if score >= threshold and token != gloss_word and morphology_matches:
                        stats["promotedAssociations"] += 1
                        if len(samples) < sample_limit:
                            samples.append({
                                "reference": f'{book["id"]} {chapter}:{verse}',
                                "word": segment.get("text", ""),
                                "strong": segment_codes[0],
                                "stepGloss": group.get("gloss", ""),
                                "matchedGlossWord": gloss_word,
                                "similarity": round(score, 4),
                                "morphology": group.get("morph", ""),
                            })
                        if apply:
                            segment["strongMeta"] = {
                                "status": "verified-open",
                                "method": "step-spanish-gloss-inflection",
                                "confidence": round(score, 4),
                            }
                            changed = True
                    else:
                        stats["remainingProvisional"] += 1
        if changed:
            stats["changedBooks"] += 1
            dump(path, payload)
    return stats, samples


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--module", type=Path, default=DEFAULT_MODULE)
    parser.add_argument("--minimum-similarity", type=float, default=0.9)
    parser.add_argument("--in-place", action="store_true")
    parser.add_argument("--report", type=Path)
    parser.add_argument("--sample-limit", type=int, default=200)
    args = parser.parse_args()
    if not 0.85 <= args.minimum_similarity <= 1.0:
        parser.error("--minimum-similarity debe estar entre 0.85 y 1.0")
    stats, samples = classify(args.module, args.in_place,
                              args.minimum_similarity, max(0, args.sample_limit))
    report = {
        "module": str(args.module),
        "applied": args.in_place,
        "scope": "Nuevo Testamento",
        "minimumSimilarity": args.minimum_similarity,
        "method": "variante flexiva con prefijo común, misma ocurrencia Strong y morfología compatible",
        "stats": dict(stats),
        "samples": samples,
    }
    if args.report:
        dump(args.report, report, pretty=True)
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
