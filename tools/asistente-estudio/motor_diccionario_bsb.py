#!/usr/bin/env python3
"""
Fase 4 — Motor de Diccionario (BSB <-> Easton/Smith por stemming).

Dado un pasaje bíblico, toma su texto en inglés (BSB) y determina qué
entradas de Easton/Smith aplican por comparación de raíz (stemming), sin
número Strong y sin lista maestra editorial: si el diccionario tiene la
entrada, se muestra; si no, no se muestra. Ningún filtro de "stopwords"
se aplica a propósito (ver informe: excluir palabras a mano sería en sí
mismo curación editorial, que el diseño de este paso prohíbe).

Usa el algoritmo estándar de Porter (Porter, M. "An algorithm for suffix
stripping." Program 14.3, 1980), vendorizado desde NLTK (Apache 2.0) en
tools/asistente-estudio/_vendor/porter_stemmer/ — no una implementación
propia.

PROTOTIPO aislado: solo lee biblia/modules/, no se integra a la app.

Uso:
    python3 motor_diccionario_bsb.py            # corre la prueba piloto (5 pasajes)
    python3 motor_diccionario_bsb.py --json      # ídem, imprime solo el JSON crudo
"""

import json
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
BSB_BOOKS_DIR = REPO_ROOT / "biblia" / "modules" / "bibles" / "bsb" / "books"
DICCIONARIOS_DIR = REPO_ROOT / "biblia" / "modules" / "diccionarios"

sys.path.insert(0, str(Path(__file__).resolve().parent / "_vendor"))
from porter_stemmer import PorterStemmer  # noqa: E402

_stemmer = PorterStemmer()

WORD_RE = re.compile(r"[A-Za-z]+")


def tokenize(text):
    """Extrae runs de letras. Sin filtro de stopwords (ver docstring del módulo)."""
    return WORD_RE.findall(text)


def stem(word):
    return _stemmer.stem(word.lower())


def stem_set(text):
    return {stem(w) for w in tokenize(text)}


# ---------------------------------------------------------------------------
# BSB
# ---------------------------------------------------------------------------

def load_bsb_book(book):
    path = BSB_BOOKS_DIR / f"{book}.json"
    with open(path, encoding="utf-8") as f:
        return json.load(f)["chapters"]


def get_passage_text(book, chapterStart, verseStart, chapterEnd, verseEnd):
    chapters = load_bsb_book(book)
    partes = []
    for ch in range(chapterStart, chapterEnd + 1):
        verses = chapters[str(ch)]
        v_ids = sorted(int(v) for v in verses.keys())
        for v in v_ids:
            if ch == chapterStart and v < verseStart:
                continue
            if ch == chapterEnd and v > verseEnd:
                continue
            partes.append(verses[str(v)])
    return " ".join(partes)


# ---------------------------------------------------------------------------
# Diccionarios (Easton / Smith)
# ---------------------------------------------------------------------------

def load_dict_entries(nombre_carpeta):
    path = DICCIONARIOS_DIR / nombre_carpeta / "entries.json"
    with open(path, encoding="utf-8") as f:
        return json.load(f)["entries"]


def build_headword_index(entries):
    """
    Para cada entrada, precomputa el conjunto de stems de las palabras de su
    headword ('titulo'). Headwords compuestos (ej. 'Atonement, Day of') se
    tratan como AND: todas sus palabras (stemmed) deben aparecer en el texto
    para que la entrada matchee — ver informe, punto 4.
    """
    index = []
    for e in entries:
        palabras = tokenize(e["titulo"])
        if not palabras:
            continue
        stems = tuple(stem(w) for w in palabras)
        index.append({"id": e["id"], "titulo": e["titulo"], "stems": stems})
    return index


def match_dictionary(passage_stems, headword_index):
    resultados = []
    for entry in headword_index:
        if all(s in passage_stems for s in entry["stems"]):
            resultados.append({"id": entry["id"], "headword": entry["titulo"]})
    return resultados


# ---------------------------------------------------------------------------
# API principal
# ---------------------------------------------------------------------------

def consultar_pasaje(book, chapterStart, verseStart, chapterEnd, verseEnd, easton_index, smith_index):
    texto = get_passage_text(book, chapterStart, verseStart, chapterEnd, verseEnd)
    stems = stem_set(texto)

    easton_hits = match_dictionary(stems, easton_index)
    smith_hits = match_dictionary(stems, smith_index)

    by_headword = {}
    for h in easton_hits:
        by_headword.setdefault(h["headword"], {"headword": h["headword"], "fuentes": []})
        by_headword[h["headword"]]["fuentes"].append({"diccionario": "easton", "id": h["id"]})
    for h in smith_hits:
        by_headword.setdefault(h["headword"], {"headword": h["headword"], "fuentes": []})
        by_headword[h["headword"]]["fuentes"].append({"diccionario": "smith", "id": h["id"]})

    entradas = sorted(by_headword.values(), key=lambda x: x["headword"].lower())

    return {
        "pasaje": {
            "book": book, "chapterStart": chapterStart, "verseStart": verseStart,
            "chapterEnd": chapterEnd, "verseEnd": verseEnd,
        },
        "textoBSB": texto,
        "totalEntradas": len(entradas),
        "entradas": entradas,
    }


# ---------------------------------------------------------------------------
# Prueba piloto
# ---------------------------------------------------------------------------

PRUEBA_PILOTO = [
    ("ROM", 5, 1, 5, 11),
    ("HEB", 7, 1, 7, 10),
    ("GEN", 1, 1, 1, 5),
    ("DAN", 9, 1, 9, 27),
    ("PSA", 23, 1, 23, 6),
]


def main():
    easton_entries = load_dict_entries("easton-bible-dictionary")
    smith_entries = load_dict_entries("smith-bible-dictionary")
    easton_index = build_headword_index(easton_entries)
    smith_index = build_headword_index(smith_entries)

    salida = []
    for (book, cs, vs, ce, ve) in PRUEBA_PILOTO:
        salida.append(consultar_pasaje(book, cs, vs, ce, ve, easton_index, smith_index))

    if "--json" in sys.argv:
        print(json.dumps(salida, ensure_ascii=False, indent=2))
    else:
        for r in salida:
            print("=" * 70)
            print(r["pasaje"])
            print(f"({r['totalEntradas']} entradas)")
            for e in r["entradas"]:
                fuentes = "+".join(sorted({f["diccionario"] for f in e["fuentes"]}))
                print(f"  - {e['headword']}  [{fuentes}]")


if __name__ == "__main__":
    main()
