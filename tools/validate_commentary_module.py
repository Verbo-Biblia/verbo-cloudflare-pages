#!/usr/bin/env python3
"""Validate one Verbo commentary module without changing application data."""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

from lxml import etree, html


ROOT = Path(__file__).resolve().parents[1]
COMMENTARIES = ROOT / "biblia/modules/commentaries"
BIBLE_BOOKS = ROOT / "biblia/modules/bibles/asv-1901/books"
ALLOWED_TAGS = {"p", "strong", "em", "blockquote", "ul", "ol", "li"}
FORBIDDEN_SOURCE = re.compile(
    r"<\s*(?:script|style)\b|START OF THE PROJECT GUTENBERG|END OF THE PROJECT GUTENBERG",
    re.IGNORECASE,
)


def load(path: Path) -> object:
    return json.loads(path.read_text(encoding="utf-8"))


def bible_limits(book: str) -> dict[int, int]:
    # Verbo's Spanish-facing module convention uses NAM; ASV uses NAH.
    canonical_book = "NAH" if book == "NAM" else book
    path = BIBLE_BOOKS / f"{canonical_book}.json"
    if not path.exists():
        return {}
    chapters = load(path).get("chapters", {})
    return {int(chapter): max(map(int, verses)) for chapter, verses in chapters.items()}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("module_id")
    args = parser.parse_args()
    root = COMMENTARIES / args.module_id
    manifest = load(root / "manifest.json")
    errors: list[str] = []
    ids: set[str] = set()
    stats: dict[str, dict[str, object]] = defaultdict(
        lambda: {"chapters": set(), "entries": 0, "ranges": 0, "intro": 0}
    )

    for item in manifest.get("books", []):
        book = item["id"] if isinstance(item, dict) else item
        limits = bible_limits(book)
        if not limits:
            errors.append(f"{book}: identificador de libro desconocido")
            continue
        if manifest.get("chapterSplit"):
            paths = sorted((root / "books" / book).glob("*.json"))
        else:
            file_name = item.get("file", f"books/{book}.json") if isinstance(item, dict) else f"books/{book}.json"
            paths = [root / file_name]
        for path in paths:
            if path.name.endswith(".index.json"):
                continue
            payload = load(path)
            for entry in payload.get("entries", []):
                entry_id = entry.get("id")
                stats[book]["entries"] += 1
                if not isinstance(entry_id, str) or not entry_id:
                    errors.append(f"{path}: entrada sin id")
                    entry_id = "<sin-id>"
                elif entry_id in ids:
                    errors.append(f"id duplicado: {entry_id}")
                ids.add(entry_id)
                content = entry.get("content")
                if not isinstance(content, str) or not content.strip():
                    errors.append(f"{entry_id}: contenido vacío")
                    continue
                if FORBIDDEN_SOURCE.search(content):
                    errors.append(f"{entry_id}: basura o elemento activo de la fuente")
                try:
                    fragment = html.fragment_fromstring(f"<div>{content}</div>")
                except (etree.ParserError, ValueError) as exc:
                    errors.append(f"{entry_id}: HTML inválido: {exc}")
                    continue
                for node in fragment.iterdescendants():
                    if not isinstance(node.tag, str):
                        continue
                    if node.tag not in ALLOWED_TAGS:
                        errors.append(f"{entry_id}: etiqueta no permitida <{node.tag}>")
                    if node.attrib:
                        errors.append(f"{entry_id}: atributos HTML no permitidos en <{node.tag}>")

                ref = entry.get("reference", {})
                try:
                    cs, vs = int(ref["chapterStart"]), int(ref["verseStart"])
                    ce, ve = int(ref["chapterEnd"]), int(ref["verseEnd"])
                except (KeyError, TypeError, ValueError):
                    errors.append(f"{entry_id}: referencia incompleta")
                    continue
                if ref.get("book") != book:
                    errors.append(f"{entry_id}: libro {ref.get('book')!r}, esperado {book}")
                if (cs, vs, ce, ve) == (0, 0, 0, 0):
                    stats[book]["intro"] += 1
                    continue
                if cs not in limits or ce not in limits or cs < 1 or ce < cs or vs < 1 or ve < 1:
                    errors.append(f"{entry_id}: rango inválido {cs}:{vs}–{ce}:{ve}")
                    continue
                if vs > limits[cs] or ve > limits[ce] or (cs == ce and ve < vs):
                    errors.append(f"{entry_id}: versículo fuera de rango {cs}:{vs}–{ce}:{ve}")
                stats[book]["chapters"].update(range(cs, ce + 1))
                stats[book]["ranges"] += 1

    print(f"module={args.module_id} entries={len(ids)} errors={len(errors)}")
    for book, values in stats.items():
        chapters = ",".join(map(str, sorted(values["chapters"])))
        print(
            f"{book}: chapters={chapters or '-'} entries={values['entries']} "
            f"mapped={values['ranges']} introductions={values['intro']}"
        )
    for error in errors:
        print(f"ERROR: {error}", file=sys.stderr)
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
