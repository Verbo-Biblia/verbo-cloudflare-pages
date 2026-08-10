#!/usr/bin/env python3
"""Promueve asociaciones NT confirmadas por glosa española exacta de STEPBible.

La asociación debe conservar el orden de ocurrencias del código en el versículo,
tener un solo código en el segmento y coincidir literalmente —normalización de
acentos y puntuación aparte— con una palabra de la glosa abierta. No corrige ni
mueve códigos y no usa referencias bíblicas externas como evidencia final.
"""
from __future__ import annotations

import argparse
import json
from collections import Counter, defaultdict, deque
from pathlib import Path

import build_rv_verbo_strong as builder
from promote_strong_evidence import DEFAULT_MODULE, dump


def codes(segment: dict) -> list[str]:
    return list(segment.get("strongs") or
                ([segment["strong"]] if segment.get("strong") else []))


def promote(module: Path, apply: bool, sample_limit: int) -> tuple[Counter, list[dict]]:
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
                    if not segment_codes:
                        continue
                    matched_groups = [groups[code].popleft() if groups[code] else {}
                                      for code in segment_codes]
                    status = (segment.get("strongMeta") or {}).get("status", "missing")
                    stats[f"input:{status}"] += len(segment_codes)
                    if status != "provisional-reference":
                        continue
                    token = builder.norm(segment.get("text", ""))
                    morphs = list(segment.get("morphs") or
                                  ([segment["morph"]] if segment.get("morph") else []))
                    morphology_matches = all(
                        index >= len(morphs) or not morphs[index] or
                        not group.get("morph") or morphs[index] == group["morph"]
                        for index, group in enumerate(matched_groups)
                    )
                    glosses = [group.get("gloss", "") for group in matched_groups]
                    if len(segment_codes) == 1:
                        lexical_match = token in builder.gloss_words(glosses[0])
                        method = "step-spanish-gloss-exact"
                    else:
                        joined_gloss = "".join(
                            word for gloss in glosses for word in builder.gloss_words(gloss)
                        )
                        lexical_match = token == joined_gloss
                        method = "step-spanish-gloss-composition-exact"
                    if token and lexical_match and morphology_matches:
                        stats["promotedAssociations"] += len(segment_codes)
                        stats["promotedSegments"] += 1
                        stats[f"promotedCodeCount:{len(segment_codes)}"] += len(segment_codes)
                        if len(samples) < sample_limit:
                            samples.append({
                                "reference": f'{book["id"]} {chapter}:{verse}',
                                "word": segment.get("text", ""),
                                "strongs": segment_codes,
                                "stepGlosses": glosses,
                                "morphologies": [group.get("morph", "")
                                                 for group in matched_groups],
                            })
                        if apply:
                            segment["strongMeta"] = {
                                "status": "verified-open",
                                "method": method,
                                "confidence": 1.0,
                            }
                            changed = True
                    else:
                        stats["remainingProvisional"] += len(segment_codes)
        if changed:
            stats["changedBooks"] += 1
            dump(path, payload)
    return stats, samples


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--module", type=Path, default=DEFAULT_MODULE)
    parser.add_argument("--in-place", action="store_true")
    parser.add_argument("--report", type=Path)
    parser.add_argument("--sample-limit", type=int, default=100)
    args = parser.parse_args()
    stats, samples = promote(args.module, args.in_place, max(0, args.sample_limit))
    report = {
        "module": str(args.module),
        "applied": args.in_place,
        "scope": "Nuevo Testamento",
        "method": "palabra normalizada presente literalmente en glosa española STEPBible, misma ocurrencia y morfología compatible",
        "stats": dict(stats),
        "samples": samples,
    }
    if args.report:
        dump(args.report, report, pretty=True)
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
