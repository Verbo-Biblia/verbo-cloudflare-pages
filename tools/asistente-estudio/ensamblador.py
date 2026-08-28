#!/usr/bin/env python3
"""Fase 5 — ensamblador offline del Asistente de Estudio.

Une Diccionario, Historia y Costumbres para un rango bíblico. Solo lee fuentes
locales y produce JSON estático. No usa Strong, embeddings ni red.
"""

import argparse
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO_ROOT = HERE.parents[1]
DATA_DIR = HERE / "data"

sys.path.insert(0, str(HERE))
import cruce_historia_eusebio as historia_eusebio  # noqa: E402
import motor_diccionario_bsb_caminoC as diccionario_c  # noqa: E402

FREEMAN_PATH = REPO_ROOT / "biblia/modules/costumbres/freeman-manners-customs/entries.json"
TUCKER_PATH = REPO_ROOT / "biblia/modules/costumbres/tucker-roman-world/entries.json"


def load_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def ranges_overlap(a_ch1, a_v1, a_ch2, a_v2, b_ch1, b_v1, b_ch2, b_v2):
    """Solapamiento inclusivo de rangos, incluso entre capítulos."""
    return ((a_ch1, a_v1) <= (b_ch2, b_v2)
            and (b_ch1, b_v1) <= (a_ch2, a_v2))


def years_overlap(a_start, a_end, b_start, b_end):
    if None in (a_start, a_end, b_start, b_end):
        return False
    return a_start <= b_end and b_start <= a_end


def passage_object(spec):
    book, cs, vs, ce, ve = spec
    return {
        "book": book,
        "chapterStart": cs,
        "verseStart": vs,
        "chapterEnd": ce,
        "verseEnd": ve,
    }


class Assembler:
    def __init__(self):
        self.dictionary_entries = (
            diccionario_c.load_entries("easton-bible-dictionary", "easton")
            + diccionario_c.load_entries("smith-bible-dictionary", "smith")
        )
        self.books, typology, self.eusebio_entries = historia_eusebio.load_all()
        self.typology_index = historia_eusebio.build_typology_index(typology)
        self.eusebio_relevance = historia_eusebio.load_relevancia()
        self.council_mapping = load_json(DATA_DIR / "concilios-mapeo-nt.json")["mapeo"]
        themes = load_json(DATA_DIR / "concilios-temas.json")["temas"]
        self.council_themes = {theme["id"]: theme for theme in themes}
        self.freeman_entries = load_json(FREEMAN_PATH)["entries"]
        self.tucker_entries = {
            entry["capituloNumero"]: entry for entry in load_json(TUCKER_PATH)["entries"]
        }
        self.tucker_mapping = load_json(DATA_DIR / "costumbres-amplia-gentil.json")
        self.early_christian = load_json(
            DATA_DIR / "costumbres-amplia-cristiano-subapostolico.json"
        )

    def dictionary(self, spec):
        result = diccionario_c.query_passage(spec, self.dictionary_entries)
        output = []
        for entry in result["entradasDiccionario"]:
            for source in entry["fuentes"]:
                output.append({
                    "termino": entry["headword"],
                    "fuente": {
                        "modulo": "Easton" if source["diccionario"] == "easton" else "Smith",
                        "headword": entry["headword"],
                    },
                })
        return output

    def _history_context(self, spec, history_result):
        book = spec[0]
        book_data = self.books.get(book) or {}
        source_text = book_data.get("fuenteReferencia")
        if not source_text:
            return []

        output = []
        seen = set()
        for window in history_result["ventanas"]:
            if window.get("anioInicio") is None or window.get("anioFin") is None:
                continue
            key = (window.get("tipo"), window["anioInicio"], window["anioFin"], source_text)
            if key in seen:
                continue
            seen.add(key)
            output.append({
                "tipo": "circunstancia" if window.get("tipo") == "narrativa" else "contexto-libro",
                "texto": source_text,
                "fuente": {
                    "modulo": (
                        "book-classification-nt" if book in load_json(
                            DATA_DIR / "book-classification-nt.json"
                        ) else "book-classification-ot"
                    ),
                    "libroSeccion": f"{book}:{window['origen']}",
                },
            })
        return output

    def _history_eusebio(self, history_result):
        return [
            {
                "tipo": "evento",
                "texto": entry["titulo"],
                "fuente": {
                    "modulo": "eusebio-historia-eclesiastica",
                    "libroSeccion": entry["libroSeccion"],
                },
            }
            for entry in history_result["resultados"]
        ]

    def _history_councils(self, spec):
        book, cs, vs, ce, ve = spec
        output = []
        for mapping in self.council_mapping:
            theme = self.council_themes.get(mapping["temaId"])
            if not theme or mapping.get("sinAnclaje"):
                continue
            for anchor in mapping.get("pasajesNT", []):
                if anchor["book"] != book:
                    continue
                if not ranges_overlap(
                    cs, vs, ce, ve,
                    anchor["chapterStart"], anchor["verseStart"],
                    anchor["chapterEnd"], anchor["verseEnd"],
                ):
                    continue
                output.append({
                    "tipo": "recepcion-doctrinal",
                    "texto": anchor["razon"],
                    "fuente": {
                        "modulo": "concilios-temas",
                        "libroSeccion": (
                            f"{theme['nombre']} — {', '.join(theme['concilios'])}"
                        ),
                    },
                })
        return output

    def history(self, spec):
        history_result = historia_eusebio.consultar_pasaje(
            *spec,
            self.books,
            self.typology_index,
            self.eusebio_entries,
            self.eusebio_relevance,
        )
        return (
            self._history_context(spec, history_result)
            + self._history_eusebio(history_result)
            + self._history_councils(spec)
        ), history_result["ventanas"]

    def _freeman(self, spec):
        book, cs, vs, ce, ve = spec
        output = []
        for entry in self.freeman_entries:
            if entry["libro"] != book:
                continue
            if not ranges_overlap(
                cs, vs, ce, ve,
                entry["capitulo"], entry["versiculoInicio"],
                entry["capitulo"], entry["versiculoFin"],
            ):
                continue
            output.append({
                "texto": entry["excerpt"],
                "fuente": {
                    "modulo": "freeman-manners-customs",
                    "entradaId": entry["id"],
                },
            })
        return output

    def _tucker(self, windows):
        metadata = self.tucker_mapping["_metadata"]
        if not any(years_overlap(
            window.get("anioInicio"), window.get("anioFin"),
            metadata["anioInicio"], metadata["anioFin"],
        ) for window in windows):
            return []

        output = []
        for chapter in self.tucker_mapping["capitulos"]:
            if chapter["relevancia"] != "alta":
                continue
            source = self.tucker_entries.get(chapter["capituloNumero"])
            if source is None:
                continue
            output.append({
                "texto": source["excerpt"],
                "fuente": {
                    "modulo": "tucker-roman-world",
                    "entradaId": source["id"],
                },
            })
        return output

    def _early_christian_customs(self, windows):
        periods = self.early_christian["_metadata"]["periodos"]
        active_periods = {
            period for period, data in periods.items()
            if any(years_overlap(
                window.get("anioInicio"), window.get("anioFin"),
                data["anioInicio"], data["anioFin"],
            ) for window in windows)
        }
        output = []
        for fragment in self.early_christian["fragmentos"]:
            if fragment["periodo"] not in active_periods:
                continue
            output.append({
                "texto": fragment["resumen"],
                "fuente": {
                    "modulo": fragment["fuente"],
                    "entradaId": f"{fragment['fuente']}:{fragment['seccion']}",
                },
            })
        return output

    def customs(self, spec, windows):
        return self._freeman(spec) + self._tucker(windows) + self._early_christian_customs(windows)

    def assemble(self, spec):
        history, windows = self.history(spec)
        return {
            "pasaje": passage_object(spec),
            "diccionario": self.dictionary(spec),
            "historia": history,
            "costumbres": self.customs(spec, windows),
        }


def validate_spec(spec):
    book, cs, vs, ce, ve = spec
    if not book or min(cs, vs, ce, ve) < 1:
        raise ValueError("El libro no puede estar vacío y capítulos/versículos deben ser positivos.")
    if (cs, vs) > (ce, ve):
        raise ValueError("El inicio del pasaje debe ser anterior o igual al final.")


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("book")
    parser.add_argument("chapterStart", type=int)
    parser.add_argument("verseStart", type=int)
    parser.add_argument("chapterEnd", type=int)
    parser.add_argument("verseEnd", type=int)
    parser.add_argument("--output", type=Path)
    return parser.parse_args()


def main():
    args = parse_args()
    spec = (args.book.upper(), args.chapterStart, args.verseStart, args.chapterEnd, args.verseEnd)
    validate_spec(spec)
    result = Assembler().assemble(spec)
    serialized = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
    if args.output:
        args.output.write_text(serialized, encoding="utf-8")
    else:
        print(serialized, end="")


if __name__ == "__main__":
    main()
