#!/usr/bin/env python3
"""Validate the integrity of Verbo Atlas registries, places, and journeys."""

from __future__ import annotations

import json
import math
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
ATLAS = ROOT / "biblia/assets/atlas"
DATA = ATLAS / "data"
REGISTRY = DATA / "maps-registry.json"
MEDIA = DATA / "place-media.json"
BOOKS = {
    "Genesis", "Exodus", "Numbers", "Joshua", "Judges", "1 Kings", "2 Kings",
    "2 Samuel", "Isaiah", "Matthew", "Mark", "Luke", "John", "Acts", "Romans",
    "Colossians", "Revelation",
}
REF_RE = re.compile(r"^(?P<book>(?:[12] )?[A-Za-z]+)(?:\s|–)(?:\d|[A-Za-z])")


def load(path: Path):
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def fail(errors: list[str], path: Path, message: str) -> None:
    errors.append(f"{path.relative_to(ROOT)}: {message}")


def validate_places_file(path: Path, errors: list[str], media_pools: dict) -> tuple[int, int, int]:
    data = load(path)
    places = data.get("places")
    journeys = data.get("journeys")
    if not isinstance(places, dict) or not isinstance(journeys, dict):
        fail(errors, path, "must contain object-valued places and journeys")
        return 0, 0, 0

    ref_count = 0
    for place_id, place in places.items():
        pos = place.get("mapPosition")
        geo = place.get("coords")
        has_map_pos = isinstance(pos, list) and len(pos) == 2 and all(isinstance(n, (int, float)) and math.isfinite(n) for n in pos)
        has_geo = (isinstance(geo, list) and len(geo) == 2
                   and all(isinstance(n, (int, float)) and math.isfinite(n) for n in geo)
                   and -180 <= geo[0] <= 180 and -90 <= geo[1] <= 90)
        if not has_map_pos and not has_geo:
            fail(errors, path, f"place {place_id!r} has neither a valid mapPosition nor [longitude, latitude] coords")
        elif has_map_pos and not all(0 <= n <= 10000 for n in pos):
            fail(errors, path, f"place {place_id!r} has an implausible mapPosition {pos}")
        name = place.get("name", {})
        if not all(isinstance(name.get(lang), str) and name[lang].strip() for lang in ("es", "en")):
            fail(errors, path, f"place {place_id!r} lacks a bilingual name")
        media_key = place.get("mediaKey")
        if not isinstance(media_key, str) or media_key not in media_pools:
            fail(errors, path, f"place {place_id!r} references missing media pool {media_key!r}")
        ref_count += validate_refs(path, f"place {place_id}", place.get("scriptureRefs", []), errors)

    for journey_id, journey in journeys.items():
        mode = journey.get("mode", "route")
        if mode not in {"route", "sites", "territory"}:
            fail(errors, path, f"journey {journey_id!r} has invalid mode {mode!r}")
        label = journey.get("label", {})
        if not all(isinstance(label.get(lang), str) and label[lang].strip() for lang in ("es", "en")):
            fail(errors, path, f"journey {journey_id!r} lacks a bilingual label")
        segments = journey.get("segments")
        if segments is None:
            segments = [{"stops": journey.get("stops", [])}]
        if not isinstance(segments, list) or not segments:
            fail(errors, path, f"journey {journey_id!r} has no usable stops/segments")
            continue
        for index, segment in enumerate(segments):
            stops = segment.get("stops", []) if isinstance(segment, dict) else []
            if mode != "territory" and not stops:
                fail(errors, path, f"journey {journey_id!r} segment {index} is empty")
            if mode == "route" and len(stops) < 2:
                fail(errors, path, f"route {journey_id!r} segment {index} has fewer than two stops")
            for stop in stops:
                if stop not in places:
                    fail(errors, path, f"journey {journey_id!r} references missing place {stop!r}")
            for left, right in zip(stops, stops[1:]):
                if left == right:
                    fail(errors, path, f"journey {journey_id!r} repeats {left!r} adjacently")
        ref_count += validate_refs(path, f"journey {journey_id}", journey.get("scriptureRefs", []), errors)
    return len(places), len(journeys), ref_count


def validate_refs(path: Path, owner: str, refs, errors: list[str]) -> int:
    if not isinstance(refs, list):
        fail(errors, path, f"{owner} scriptureRefs must be an array")
        return 0
    for ref in refs:
        if not isinstance(ref, str):
            fail(errors, path, f"{owner} has a non-string scripture reference")
            continue
        match = REF_RE.match(ref)
        if not match or match.group("book") not in BOOKS:
            fail(errors, path, f"{owner} has unsupported/non-English scripture reference {ref!r}")
    return len(refs)


def main() -> int:
    errors: list[str] = []
    registry = load(REGISTRY)
    media = load(MEDIA)
    media_pools = media.get("pools", {})
    allowed_licenses = set(media.get("policy", {}).get("allowedLicenses", []))
    media_files: dict[str, list[str]] = {}
    for pool_id, pool in media_pools.items():
        items = pool.get("items", [])
        if not 2 <= len(items) <= 10:
            fail(errors, MEDIA, f"media pool {pool_id!r} has {len(items)} items (expected 2–10)")
        for item in items:
            filename = item.get("file")
            source_page = item.get("sourcePage", "")
            if item.get("license") not in allowed_licenses:
                fail(errors, MEDIA, f"media pool {pool_id!r} uses disallowed license {item.get('license')!r}")
            if not isinstance(source_page, str) or not source_page.startswith("https://commons.wikimedia.org/wiki/File:"):
                fail(errors, MEDIA, f"media pool {pool_id!r} has an invalid Commons source page")
            if isinstance(filename, str):
                media_files.setdefault(filename, []).append(pool_id)
    registered: set[Path] = set()
    for entry in registry.get("maps", []):
        places_path = (ATLAS / entry.get("places", "")).resolve()
        master_path = (ATLAS / entry.get("masterSvg", "")).resolve()
        if not places_path.is_file():
            fail(errors, REGISTRY, f"map {entry.get('id')!r} has missing places file")
        else:
            registered.add(places_path)
        if not master_path.is_file():
            fail(errors, REGISTRY, f"map {entry.get('id')!r} has missing master SVG")

    files = sorted(DATA.glob("places-*.json"))
    totals = [0, 0, 0]
    for path in files:
        counts = validate_places_file(path, errors, media_pools)
        totals = [a + b for a, b in zip(totals, counts)]

    if errors:
        print("Atlas audit FAILED", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1
    unregistered = [str(path.relative_to(ROOT)) for path in files if path.resolve() not in registered]
    print(f"Atlas audit OK: {len(registry['maps'])} registered maps, {len(files)} place files, "
          f"{totals[0]} places, {totals[1]} uses/journeys, {totals[2]} Scripture references.")
    duplicates = {name: pools for name, pools in media_files.items() if len(pools) > 1}
    print(f"Media audit OK: {len(media_pools)} pools, {sum(len(p['items']) for p in media_pools.values())} entries, "
          f"{len(duplicates)} intentionally shared filenames (reviewed by pool/scope).")
    if unregistered:
        print("Unregistered legacy data: " + ", ".join(unregistered))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
