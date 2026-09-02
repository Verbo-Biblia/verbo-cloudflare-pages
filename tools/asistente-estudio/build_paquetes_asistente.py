#!/usr/bin/env python3
"""Genera paquetes estáticos por capítulo para el Asistente de Estudio.

Cada versículo se consulta como rango unitario mediante el ensamblador aprobado.
Los recursos completos se deduplican dentro del capítulo y los versículos solo
guardan IDs deterministas. No usa red, Strong, IA ni búsqueda semántica.
"""

import argparse
import hashlib
import json
import shutil
import time
from pathlib import Path

from ensamblador import Assembler
from motor_diccionario_bsb_caminoC import (
    find_evidence,
    morphological_forms,
    normalized,
    tokens,
)

HERE = Path(__file__).resolve().parent
REPO_ROOT = HERE.parents[1]
BSB_DIR = REPO_ROOT / "biblia/modules/bibles/bsb"
DEFAULT_OUTPUT = REPO_ROOT / "biblia/modules/study-assistant/chapters"
CATEGORIES = ("diccionario", "historia", "costumbres")
SOURCE_LANGUAGES = {
    "Easton": "en",
    "Smith": "en",
    "eusebio-historia-eclesiastica": "en",
    "sayce-patriarchal-palestine": "es",
    "freeman-manners-customs": "en",
    "tucker-roman-world": "en",
    "book-classification-nt": "es",
    "book-classification-ot": "es",
    "concilios-temas": "es",
    "npnf214-concilios-ecumenicos": "es",
    "bernabe": "es",
    "clemente-1": "es",
    "didache": "es",
    "hermas-pastor": "es",
    "mathietes-diogneto": "es",
    "policarpo-filipenses": "es",
}
PILOTS = (
    ("ROM", 5, 1, 11),
    ("MAT", 2, 1, 12),
    ("PSA", 23, 1, 6),
)
REGRESSION_SAMPLE = (
    ("GEN", 1, 1, 5),       # prosa y términos de creación
    ("EXO", 20, 1, 17),     # prosa legal y frases compuestas
    ("PSA", 119, 1, 16),    # poesía, capítulo largo
    ("ISA", 53, 1, 12),     # poesía/profecía
    ("MAT", 1, 1, 17),      # genealogía y nombres propios
    ("JHN", 1, 1, 14),      # términos doctrinales y frases
    ("ROM", 3, 21, 31),     # prosa doctrinal
    ("HEB", 7, 1, 10),      # tipología y nombres propios
    ("PHM", 1, 1, 7),       # capítulo corto
)


class DictionaryVerseIndex:
    """Preselecciona headwords posibles sin cambiar la regla de Camino C.

    El índice usa las mismas formas morfológicas del motor para localizar qué
    entradas podrían coincidir. La inclusión definitiva sigue dependiendo de
    find_evidence(), exactamente igual que query_passage().
    """

    def __init__(self, entries):
        self.entries = entries
        self.by_form = {}
        for entry_index, entry in enumerate(entries):
            for variant in entry["titleVariants"]:
                if len(variant) == 1 and len(normalized(variant[0])) <= 2:
                    continue
                for form in morphological_forms(variant[0]):
                    self.by_form.setdefault(form, set()).add(entry_index)

    def query(self, verse_text):
        verse_tokens = tokens(verse_text)
        candidates = set()
        for token in verse_tokens:
            for form in morphological_forms(token):
                candidates.update(self.by_form.get(form, ()))

        grouped = {}
        for entry_index in sorted(candidates):
            entry = self.entries[entry_index]
            if not find_evidence(entry["titleVariants"], verse_tokens):
                continue
            grouped.setdefault(entry["headword"], []).append(entry)

        output = []
        for headword in sorted(grouped, key=str.lower):
            for entry in grouped[headword]:
                dictionary = entry["diccionario"]
                output.append({
                    "termino": headword,
                    "fuente": {
                        "modulo": "Easton" if dictionary == "easton" else "Smith",
                        "headword": headword,
                        "entryId": entry["id"],
                    },
                })
        return output


def canonical_json(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def resource_id(category, resource):
    digest = hashlib.sha256(
        f"{category}\0{canonical_json(resource)}".encode("utf-8")
    ).hexdigest()[:16]
    return f"{category[0]}-{digest}"


def intern_resource(resources, category, resource):
    identifier = resource_id(category, resource)
    existing = resources[category].get(identifier)
    if existing is not None and existing != resource:
        raise RuntimeError(f"Colisión de ID determinista: {identifier}")
    resources[category][identifier] = resource
    return identifier


def translation_identity(category, resource):
    source = resource["fuente"]
    module = source["modulo"]
    if category == "diccionario":
        canonical_id = source["entryId"]
        text = resource["termino"]
    else:
        canonical_id = source.get("recursoId") or source.get("entradaId") or source.get("libroSeccion")
        text = resource["texto"]
    if not canonical_id or module not in SOURCE_LANGUAGES:
        raise ValueError(f"Identidad de traducción incompleta: {category} / {source}")
    resource_id = str(canonical_id)
    return {
        "resourceId": resource_id,
        "sourceLanguage": SOURCE_LANGUAGES[module],
        "sourceHash": hashlib.sha256(text.encode("utf-8")).hexdigest(),
    }


def with_translation_identity(category, resource):
    enriched = dict(resource)
    enriched["traduccion"] = translation_identity(category, resource)
    return enriched


def load_books():
    manifest = json.loads((BSB_DIR / "manifest.json").read_text(encoding="utf-8"))
    result = []
    for book in manifest["books"]:
        source = json.loads((BSB_DIR / book["file"]).read_text(encoding="utf-8"))
        chapters = {}
        for chapter, verse_texts in source["chapters"].items():
            chapters[int(chapter)] = (
                sorted(int(verse) for verse in verse_texts),
                verse_texts,
            )
        result.append((book["id"], chapters))
    return result


def build_chapter(assembler, dictionary_index, book, chapter, verse_numbers, verse_texts):
    resources = {category: {} for category in CATEGORIES}
    verses = {}
    for verse in verse_numbers:
        spec = (book, chapter, verse, chapter, verse)
        history, windows = assembler.history(spec)
        assembled = {
            "diccionario": dictionary_index.query(verse_texts[str(verse)]),
            "historia": history,
            "costumbres": assembler.customs(spec, windows),
        }
        references = {}
        for category in CATEGORIES:
            identifiers = []
            for resource in assembled[category]:
                resource = with_translation_identity(category, resource)
                identifier = intern_resource(resources, category, resource)
                if identifier not in identifiers:
                    identifiers.append(identifier)
            references[category] = identifiers
        verses[str(verse)] = references

    return {
        "schemaVersion": 2,
        "book": book,
        "chapter": chapter,
        "resources": {
            category: dict(sorted(resources[category].items()))
            for category in CATEGORIES
        },
        "verses": verses,
    }


def package_union(package, verse_start, verse_end):
    result = {category: [] for category in CATEGORIES}
    seen = {category: set() for category in CATEGORIES}
    for verse in range(verse_start, verse_end + 1):
        references = package["verses"].get(str(verse), {})
        for category in CATEGORIES:
            for identifier in references.get(category, []):
                if identifier in seen[category]:
                    continue
                seen[category].add(identifier)
                result[category].append(package["resources"][category][identifier])
    return result


def normalized_resources(resources):
    def canonical_resource(item):
        value = dict(item)
        value.pop("traduccion", None)
        return canonical_json(value)

    return {
        category: sorted({canonical_resource(item) for item in resources[category]})
        for category in CATEGORIES
    }


def dictionary_identity(resources):
    return sorted({
        (item["fuente"]["modulo"], item["fuente"]["headword"], item["termino"])
        for item in resources["diccionario"]
    })


def verify_cases(assembler, dictionary_index, books, cases):
    chapter_index = {
        (book, chapter): (verses, verse_texts)
        for book, chapters in books
        for chapter, (verses, verse_texts) in chapters.items()
    }
    report = []
    direct_seconds = 0.0
    indexed_seconds = 0.0
    for book, chapter, verse_start, verse_end in cases:
        key = (book, chapter)
        _, verse_texts = chapter_index[key]
        selected_verses = list(range(verse_start, verse_end + 1))

        started = time.perf_counter()
        direct = assembler.assemble(
            (book, chapter, verse_start, chapter, verse_end)
        )
        direct_seconds += time.perf_counter() - started

        started = time.perf_counter()
        package = build_chapter(
            assembler, dictionary_index, book, chapter, selected_verses, verse_texts
        )
        union = package_union(package, verse_start, verse_end)
        indexed_seconds += time.perf_counter() - started

        direct_resources = {category: direct[category] for category in CATEGORIES}
        equivalent = normalized_resources(direct_resources) == normalized_resources(union)
        dictionary_exact = dictionary_identity(direct_resources) == dictionary_identity(union)
        report.append({
            "pasaje": f"{book} {chapter}:{verse_start}-{verse_end}",
            "equivalente": equivalent and dictionary_exact,
            "identidadDiccionarioExacta": dictionary_exact,
            "directo": {
                category: len(normalized_resources(direct_resources)[category])
                for category in CATEGORIES
            },
            "union": {category: len(union[category]) for category in CATEGORIES},
            "duplicadosDirectos": {
                category: (
                    len(direct_resources[category])
                    - len(normalized_resources(direct_resources)[category])
                )
                for category in CATEGORIES
            },
        })
    timing = {
        "directoSegundos": round(direct_seconds, 3),
        "indexadoSegundos": round(indexed_seconds, 3),
        "factorMejora": round(direct_seconds / indexed_seconds, 2) if indexed_seconds else None,
    }
    return all(item["equivalente"] for item in report), report, timing


def write_package(output_dir, package):
    path = output_dir / package["book"] / f"{package['chapter']}.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    serialized = json.dumps(package, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
    # Validación antes y después de escribir: evita publicar un archivo truncado
    # o una estructura que Python no pueda volver a interpretar.
    json.loads(serialized)
    path.write_text(serialized, encoding="utf-8")
    json.loads(path.read_text(encoding="utf-8"))
    return path


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--pilots-only", action="store_true")
    parser.add_argument("--keep-output", action="store_true")
    return parser.parse_args()


def main():
    args = parse_args()
    started = time.perf_counter()
    books = load_books()
    assembler = Assembler()
    dictionary_index = DictionaryVerseIndex(assembler.dictionary_entries)
    equivalent, pilot_report, pilot_timing = verify_cases(
        assembler, dictionary_index, books, PILOTS
    )
    print(json.dumps({
        "pilotos": pilot_report,
        "tiemposPilotos": pilot_timing,
    }, ensure_ascii=False, indent=2), flush=True)
    if not equivalent:
        raise SystemExit("Equivalencia fallida: se detiene antes del build completo.")

    regression_ok, regression_report, regression_timing = verify_cases(
        assembler, dictionary_index, books, REGRESSION_SAMPLE
    )
    print(json.dumps({
        "regresion": regression_report,
        "tiemposRegresion": regression_timing,
    }, ensure_ascii=False, indent=2), flush=True)
    if not regression_ok:
        raise SystemExit("Regresión fallida: se detiene antes del build completo.")

    if args.pilots_only:
        if args.keep_output:
            chapter_index = {
                (book, chapter): (verses, verse_texts)
                for book, chapters in books
                for chapter, (verses, verse_texts) in chapters.items()
            }
            for book, chapter, _, _ in PILOTS:
                verses, verse_texts = chapter_index[(book, chapter)]
                package = build_chapter(
                    assembler, dictionary_index, book, chapter, verses, verse_texts
                )
                write_package(args.output_dir, package)
        return

    output_dir = args.output_dir.resolve()
    unsafe_outputs = {
        Path("/").resolve(),
        Path.home().resolve(),
        REPO_ROOT.resolve(),
        (REPO_ROOT / "biblia").resolve(),
        (REPO_ROOT / "biblia/modules").resolve(),
    }
    if output_dir in unsafe_outputs:
        raise SystemExit(f"Directorio de salida demasiado amplio: {output_dir}")
    if output_dir.exists():
        shutil.rmtree(output_dir)
    files = []
    completed = 0
    total_chapters = sum(len(chapters) for _, chapters in books)
    for book, chapters in books:
        for chapter, (verses, verse_texts) in sorted(chapters.items()):
            package = build_chapter(
                assembler, dictionary_index, book, chapter, verses, verse_texts
            )
            files.append(write_package(output_dir, package))
            completed += 1
            if completed == 1 or completed % 50 == 0 or completed == total_chapters:
                elapsed = time.perf_counter() - started
                print(
                    f"Progreso: {completed}/{total_chapters} capítulos "
                    f"({book} {chapter}) — {elapsed:.1f}s",
                    flush=True,
                )

    sizes = [path.stat().st_size for path in files]
    largest = max(files, key=lambda path: path.stat().st_size)
    summary = {
        "libros": len(books),
        "capitulos": len(files),
        "archivos": len(files),
        "bytesTotal": sum(sizes),
        "bytesPromedio": round(sum(sizes) / len(sizes)),
        "archivoMayor": str(largest.relative_to(output_dir)),
        "bytesArchivoMayor": largest.stat().st_size,
        "segundos": round(time.perf_counter() - started, 3),
    }
    print(json.dumps({"build": summary}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
