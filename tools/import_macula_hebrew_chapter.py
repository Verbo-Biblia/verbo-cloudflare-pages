#!/usr/bin/env python3
"""Normaliza un capítulo lowfat de MACULA Hebrew para Lenguajes originales."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from collections import defaultdict
from pathlib import Path
from xml.etree import ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE = ROOT / "data/fuentes-externas/macula/hebrew/WLC/lowfat/19-Psa-008-lowfat.xml"
DEFAULT_BASE = ROOT / "biblia/modules/original-languages/data/hebrew/PSA/8.json"
DEFAULT_OUTPUT = ROOT / "biblia/modules/original-languages/linguistic/macula-hebrew/PSA/8.json"
XML_ID = "{http://www.w3.org/XML/1998/namespace}id"
REF_RE = re.compile(r"^([1-3]?[A-Z]+) (\d+):(\d+)!([0-9]+)$")


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def clean_attributes(element: ET.Element) -> dict[str, str]:
    return {
        key: value
        for key, value in element.attrib.items()
        if value != "" and key != XML_ID
    }


def syntax_tree(element: ET.Element, prefix: str, counter: list[int]) -> dict:
    counter[0] += 1
    node_id = f"{prefix}.n{counter[0]}"
    children = []
    for child in element:
        if child.tag == "wg":
            children.append({"node": syntax_tree(child, prefix, counter)})
        elif child.tag == "w":
            children.append({"morph": child.attrib.get(XML_ID)})
    return {"id": node_id, **clean_attributes(element), "children": children}


def base_token_map(base_path: Path) -> dict[tuple[int, int], str]:
    base = json.loads(base_path.read_text(encoding="utf-8"))
    mapping = {}
    for verse_number, verse in base["verses"].items():
        english_verse = int(verse_number) + 1
        for token in verse["tokens"]:
            mapping[(english_verse, int(token["position"]))] = token["id"]
    return mapping


def build(source_path: Path, base_path: Path) -> dict:
    root = ET.parse(source_path).getroot()
    book, chapter = root.attrib["id"].split()
    token_ids = base_token_map(base_path)
    by_token: dict[str, list[dict]] = defaultdict(list)
    sentences = []

    for sentence_index, sentence in enumerate(root.findall("sentence"), 1):
        verse = int(sentence.attrib["id"].rsplit(":", 1)[1])
        roots = []
        counter = [0]
        for element in sentence:
            if element.tag == "wg":
                roots.append(syntax_tree(element, f"{book}.{chapter}.{verse}.s{sentence_index}", counter))
        sentences.append({"id": sentence.attrib["id"], "roots": roots})

        for word in sentence.iter("w"):
            source_ref = word.attrib.get("ref", "")
            match = REF_RE.match(source_ref)
            if not match:
                raise ValueError(f"Referencia MACULA no reconocida: {source_ref!r}")
            word_verse, position = int(match.group(3)), int(match.group(4))
            token_id = token_ids.get((word_verse, position))
            if not token_id:
                raise ValueError(f"No existe token base para {source_ref}")
            by_token[token_id].append({"id": word.attrib.get(XML_ID), **clean_attributes(word)})

    missing = sorted(set(token_ids.values()) - set(by_token))
    extra = sorted(set(by_token) - set(token_ids.values()))
    if missing or extra:
        raise ValueError(f"Mapeo incompleto: faltantes={missing}, extra={extra}")

    tokens = {}
    for token_id, morphs in by_token.items():
        tokens[token_id] = {
            "morphs": morphs,
            "semantics": {
                "sdbh": sorted({m["sdbh"] for m in morphs if m.get("sdbh")}),
                "lexicalDomains": sorted({m["lexdomain"] for m in morphs if m.get("lexdomain")}),
                "coreDomains": sorted({m["coredomain"] for m in morphs if m.get("coredomain")}),
                "contextualDomains": sorted({m["contextualdomain"] for m in morphs if m.get("contextualdomain")}),
                "frames": sorted({m["frame"] for m in morphs if m.get("frame")}),
                "participants": sorted({value for m in morphs for key in ("participantref", "subjref") if (value := m.get(key))}),
            },
        }

    return {
        "schemaVersion": 1,
        "book": book,
        "chapter": int(chapter),
        "layer": "macula-hebrew",
        "provenance": {
            "bibliographyId": "macula-hebrew",
            "sourceId": "macula-hebrew",
            "repository": "https://github.com/Clear-Bible/macula-hebrew",
            "commit": "47db250bd55d0d8577f2a94fba114ef16c35b23c",
            "license": "CC BY 4.0",
            "sourceFile": "WLC/lowfat/19-Psa-008-lowfat.xml",
            "sha256": sha256(source_path),
            "transformation": "tools/import_macula_hebrew_chapter.py",
        },
        "tokens": tokens,
        "syntax": {"sentences": sentences},
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--base", type=Path, default=DEFAULT_BASE)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    result = build(args.source, args.base)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
