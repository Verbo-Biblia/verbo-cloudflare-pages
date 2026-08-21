#!/usr/bin/env python3
"""Prepara un libro del staging del Pulpit para el módulo no registrado.

La salida conserva el contenido inglés, normaliza campos e identificadores y
fuerza ``editorialStatus: ocr-unreviewed``. La aprobación editorial y la
incorporación del libro al manifest son operaciones manuales posteriores.
"""

import argparse
import html
import json
from collections import Counter, defaultdict
from pathlib import Path


SECTION_CODES = {"exposition": "exp", "homiletics": "hom"}


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--staging", required=True, type=Path)
    parser.add_argument("--book", required=True)
    parser.add_argument("--author", required=True)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--corrections", type=Path)
    return parser.parse_args()


def replacement_html(item):
    return "".join(f"<p>{html.escape(paragraph, quote=False)}</p>" for paragraph in item["paragraphs"])


def normalized_id(book_id, entry, seen):
    reference = entry["reference"]
    section = SECTION_CODES[entry["section"]]
    chapter = reference["chapterStart"]
    start = reference["verseStart"]
    end = reference.get("verseEnd", start)
    base = f"pulpit-{book_id.lower()}-{section}-{chapter}-{start}"
    if end != start:
        base += f"-{end}"
    seen[base] += 1
    return base if seen[base] == 1 else f"{base}-occ-{seen[base]}"


def main():
    args = parse_args()
    book_id = args.book.upper()
    staging = json.loads(args.staging.read_text(encoding="utf-8"))
    if staging.get("book") != book_id:
        raise SystemExit(f"El staging es {staging.get('book')}, no {book_id}")

    replacements = defaultdict(list)
    if args.corrections:
        corrections = json.loads(args.corrections.read_text(encoding="utf-8"))
        if corrections.get("book") != book_id:
            raise SystemExit(f"Las correcciones son de {corrections.get('book')}, no de {book_id}")
        normalized_headers = defaultdict(list)
        for item in corrections.get("referenceHeaderCorrections", []):
            normalized_headers[(
                int(item["chapter"]),
                item["ocr"],
                item.get("section"),
            )].append(item["corrected"])
        used_header_corrections = Counter()
        for item in corrections.get("entryTextReplacements", []):
            chapter = int(item["chapter"])
            section = item.get("section", "exposition")
            scoped_header_key = (chapter, item["sourceHeader"], section)
            unscoped_header_key = (chapter, item["sourceHeader"], None)
            header_key = (
                scoped_header_key
                if scoped_header_key in normalized_headers
                else unscoped_header_key
            )
            correction_number = used_header_corrections[header_key]
            available_headers = normalized_headers.get(header_key, [])
            source_header = (
                available_headers[correction_number]
                if correction_number < len(available_headers)
                else item["sourceHeader"]
            )
            if source_header != item["sourceHeader"]:
                used_header_corrections[header_key] += 1
            key = (
                chapter,
                source_header,
                section,
            )
            replacements[key].append(item)

    seen = Counter()
    entries = []
    used_replacements = Counter()
    group_replacements = {}
    for source_entry in staging["entries"]:
        section = source_entry.get("section")
        if section not in SECTION_CODES:
            raise SystemExit(f"Sección no admitida: {section!r}")
        reference = source_entry["reference"]
        key = (int(reference["chapterStart"]), source_entry["sourceHeader"], section)
        content = source_entry["content"]
        # Los reemplazos versionados son la fuente más reciente cuando el
        # staging temporal quedó rezagado. La sección forma parte de la clave
        # para no confundir exposiciones y homilías con el mismo encabezado.
        replacement = None
        source_group = source_entry.get("sourceGroupId", source_entry["id"])
        if source_group in group_replacements:
            replacement = group_replacements[source_group]
        elif used_replacements[key] < len(replacements.get(key, [])):
            replacement = replacements[key][used_replacements[key]]
            used_replacements[key] += 1
            group_replacements[source_group] = replacement
        if replacement is not None:
            content = replacement_html(replacement)
        entry = {
            "id": normalized_id(book_id, source_entry, seen),
            "title": source_entry["title"],
            "author": replacement.get("author", args.author) if replacement else args.author,
            "section": section,
            "sourceHeader": source_entry["sourceHeader"],
            "editorialStatus": "ocr-unreviewed",
            "reference": reference,
            "content": content,
        }
        if replacement and replacement.get("editorialNote"):
            entry["editorialNote"] = replacement["editorialNote"]
        entries.append(entry)

    unused = {
        key: len(items) - used_replacements[key]
        for key, items in replacements.items()
        if len(items) != used_replacements[key]
    }
    if unused:
        raise SystemExit(f"Reemplazos no aplicados: {sorted(unused)}")
    if len({entry["id"] for entry in entries}) != len(entries):
        raise SystemExit("La normalización produjo identificadores duplicados")

    args.output.mkdir(parents=True, exist_ok=True)
    book_path = args.output / f"{book_id}.json"
    index_path = args.output / f"{book_id}.index.json"
    book_path.write_text(json.dumps({"entries": entries}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    index = {"entries": [{"id": entry["id"], "reference": entry["reference"]} for entry in entries]}
    index_path.write_text(json.dumps(index, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{book_id}: {len(entries)} entradas preparadas; 0 aprobadas; manifest sin modificar")


if __name__ == "__main__":
    main()
