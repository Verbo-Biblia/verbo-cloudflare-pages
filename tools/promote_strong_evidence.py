#!/usr/bin/env python3
"""Promueve asociaciones provisionales respaldadas por evidencia abierta cruzada.

La regla es deliberadamente estricta: una palabra normalizada debe aparecer al
menos N veces como ``verified-open`` y siempre con un único código Strong. Una
asociación provisional solo se promueve si todos sus códigos coinciden con esa
relación inequívoca. No equivale a revisión editorial humana.
"""
from __future__ import annotations

import argparse
import json
import shutil
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_MODULE = ROOT / "biblia/modules/bibles/rv-verbo-strong-provisional"


def load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def dump(path: Path, payload: dict, pretty: bool = False) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    separators = None if pretty else (",", ":")
    path.write_text(json.dumps(payload, ensure_ascii=False,
                               indent=2 if pretty else None,
                               separators=separators) + "\n", encoding="utf-8")


def norm(value: str) -> str:
    decomposed = unicodedata.normalize("NFD", value.casefold())
    return "".join(character for character in decomposed
                   if unicodedata.category(character) != "Mn" and character.isalpha())


def codes(segment: dict) -> list[str]:
    return list(segment.get("strongs") or
                ([segment["strong"]] if segment.get("strong") else []))


def book_payloads(module: Path) -> list[tuple[dict, dict]]:
    manifest = load(module / "manifest.json")
    return [(book, load(module / book["file"])) for book in manifest["books"]]


def build_lexicon(payloads: list[tuple[dict, dict]], minimum: int,
                  minimum_precision: float) -> tuple[dict[str, str], dict]:
    observations: dict[str, Counter] = defaultdict(Counter)
    for _, payload in payloads:
        for verses in payload["chapters"].values():
            for record in verses.values():
                for segment in record.get("segments", []):
                    if (segment.get("strongMeta") or {}).get("status") != "verified-open":
                        continue
                    token = norm(segment.get("text", ""))
                    segment_codes = codes(segment)
                    if len(token) < 3 or len(segment_codes) != 1:
                        continue
                    observations[token][segment_codes[0]] += 1
    lexicon = {}
    for token, counts in observations.items():
        total = sum(counts.values())
        code, occurrences = counts.most_common(1)[0]
        if occurrences >= minimum and occurrences / total >= minimum_precision:
            lexicon[token] = code
    stats = {
        "observedTokens": len(observations),
        "unambiguousTokens": len(lexicon),
        "minimumOccurrences": minimum,
        "minimumPrecision": minimum_precision,
        "seedOccurrences": sum(observations[token][code] for token, code in lexicon.items()),
    }
    return lexicon, stats


def classify(payloads: list[tuple[dict, dict]], lexicon: dict[str, str], apply: bool,
             minimum_precision: float) -> Counter:
    stats = Counter()
    for _, payload in payloads:
        for verses in payload["chapters"].values():
            for record in verses.values():
                for segment in record.get("segments", []):
                    segment_codes = codes(segment)
                    if not segment_codes:
                        continue
                    status = (segment.get("strongMeta") or {}).get("status", "missing")
                    stats[f"input:{status}"] += len(segment_codes)
                    if status != "provisional-reference":
                        continue
                    token = norm(segment.get("text", ""))
                    if len(segment_codes) == 1 and lexicon.get(token) == segment_codes[0]:
                        stats["promotedAssociations"] += 1
                        stats["promotedSegments"] += 1
                        if apply:
                            segment["strongMeta"] = {
                                "status": "cross-verified-open",
                                "method": ("unique-open-word-code-crosscheck"
                                           if minimum_precision == 1.0 else
                                           "dominant-open-word-code-crosscheck"),
                                "confidence": (0.99 if minimum_precision == 1.0 else
                                               round(minimum_precision, 4)),
                            }
                    else:
                        stats["remainingProvisional"] += len(segment_codes)
    return stats


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--module", type=Path, default=DEFAULT_MODULE)
    parser.add_argument("--output-module", type=Path)
    parser.add_argument("--in-place", action="store_true",
                        help="Actualiza el módulo de entrada después de clasificar")
    parser.add_argument("--minimum-occurrences", type=int, default=3)
    parser.add_argument("--minimum-precision", type=float, default=1.0,
                        help="Proporción mínima del código dominante para una palabra")
    parser.add_argument("--report", type=Path)
    args = parser.parse_args()
    if args.minimum_occurrences < 2:
        parser.error("--minimum-occurrences debe ser al menos 2")
    if not 0.5 < args.minimum_precision <= 1.0:
        parser.error("--minimum-precision debe ser mayor que 0.5 y menor o igual a 1")
    payloads = book_payloads(args.module)
    lexicon, lexicon_stats = build_lexicon(
        payloads, args.minimum_occurrences, args.minimum_precision
    )
    if args.in_place and args.output_module:
        parser.error("--in-place y --output-module son excluyentes")
    apply_changes = bool(args.output_module) or args.in_place
    stats = classify(payloads, lexicon, apply=apply_changes,
                     minimum_precision=args.minimum_precision)
    report = {"sourceModule": str(args.module), "lexicon": lexicon_stats,
              "classification": dict(stats)}
    if args.output_module:
        if args.output_module.resolve() == args.module.resolve():
            parser.error("--output-module debe ser distinto de --module")
        if args.output_module.exists():
            shutil.rmtree(args.output_module)
        args.output_module.mkdir(parents=True)
        manifest = load(args.module / "manifest.json")
        manifest["id"] = args.output_module.name
        manifest["status"] = "review-candidate"
        manifest["crossVerification"] = {
            "method": ("unique-open-word-code-crosscheck"
                       if args.minimum_precision == 1.0 else
                       "dominant-open-word-code-crosscheck"),
            "minimumOccurrences": args.minimum_occurrences,
            "minimumPrecision": args.minimum_precision,
        }
        dump(args.output_module / "manifest.json", manifest, pretty=True)
        for book, payload in payloads:
            dump(args.output_module / book["file"], payload)
        for name in ("README.md", "alignment-report.json"):
            source = args.module / name
            if source.exists():
                shutil.copy2(source, args.output_module / name)
    elif args.in_place:
        manifest = load(args.module / "manifest.json")
        manifest["crossVerification"] = {
            "method": ("unique-open-word-code-crosscheck"
                       if args.minimum_precision == 1.0 else
                       "dominant-open-word-code-crosscheck"),
            "minimumOccurrences": args.minimum_occurrences,
            "minimumPrecision": args.minimum_precision,
            "promotedAssociations": stats["promotedAssociations"],
        }
        dump(args.module / "manifest.json", manifest, pretty=True)
        for book, payload in payloads:
            dump(args.module / book["file"], payload)
    if args.report:
        dump(args.report, report, pretty=True)
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
