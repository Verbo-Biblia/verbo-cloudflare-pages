#!/usr/bin/env python3
"""
Fase 4 (comparación) — Camino A: mejor stemmer/lematizador + regla morfológica.

Paso 1 (probado y descartado, ver informe): Snowball/Porter2 (nltk) da
EXACTAMENTE los mismos stems problemáticos que Porter clásico para
justified/justification y Areli/are — no resuelve nada, así que este
script se queda con Porter clásico (ya vendorizado) como base.

Paso 2 (implementado): una regla morfológica GENERAL, no una lista de
palabras — cualquier palabra que termine en "-ication" también se
stemea en su forma alternativa "-y" (p.ej. "justification" -> "justify"
-> stem), porque en inglés esa es la familia derivacional regular de los
verbos en "-ify" (justify/sanctify/glorify/purify/qualify/identify...).
Es equivalencia de FORMA reutilizable para cualquier término, no una
lista curada por relevancia doctrinal.

Paso 3 (evaluado, no implementado): colisiones tipo Areli->are por
POS-tagging. No hay ninguna librería de POS-tagging para inglés ya
instalada en el entorno; agregarla (nltk con su modelo
'averaged_perceptron_tagger', que requiere descargar datos aparte del
propio paquete) sería una dependencia nueva no trivial, distinta en
naturaleza del stemmer (que es puro algoritmo, sin datos externos). Se
reporta como limitación de este camino, no se implementa aquí — ver
informe.
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
    return WORD_RE.findall(text)


def stem_variants(word):
    """Devuelve un set de 1 o 2 stems: el de Porter, y (si aplica la regla
    -ication -> -y) el stem de la forma alternativa en '-ify'."""
    w = word.lower()
    variants = {_stemmer.stem(w)}
    if w.endswith("ication") and len(w) > 7:
        variants.add(_stemmer.stem(w[:-7] + "y"))
    return variants


def passage_variant_set(text):
    """Unión de todas las variantes de stem de todas las palabras del pasaje."""
    out = set()
    for w in tokenize(text):
        out |= stem_variants(w)
    return out


def load_bsb_book(book):
    with open(BSB_BOOKS_DIR / f"{book}.json", encoding="utf-8") as f:
        return json.load(f)["chapters"]


def get_passage_text(book, chapterStart, verseStart, chapterEnd, verseEnd):
    chapters = load_bsb_book(book)
    partes = []
    for ch in range(chapterStart, chapterEnd + 1):
        verses = chapters[str(ch)]
        for v in sorted(int(x) for x in verses.keys()):
            if ch == chapterStart and v < verseStart:
                continue
            if ch == chapterEnd and v > verseEnd:
                continue
            partes.append(verses[str(v)])
    return " ".join(partes)


def load_dict_entries(nombre_carpeta):
    with open(DICCIONARIOS_DIR / nombre_carpeta / "entries.json", encoding="utf-8") as f:
        return json.load(f)["entries"]


def build_headword_index(entries):
    index = []
    for e in entries:
        palabras = tokenize(e["titulo"])
        if not palabras:
            continue
        variant_sets = [stem_variants(w) for w in palabras]
        index.append({"id": e["id"], "titulo": e["titulo"], "variant_sets": variant_sets})
    return index


def match_dictionary(passage_variants, headword_index):
    resultados = []
    for entry in headword_index:
        # AND entre palabras del headword; cada palabra matchea si CUALQUIERA
        # de sus variantes de stem está en el conjunto de variantes del pasaje.
        if all(vs & passage_variants for vs in entry["variant_sets"]):
            resultados.append({"id": entry["id"], "titulo": entry["titulo"]})
    return resultados


def consultar_pasaje(book, chapterStart, verseStart, chapterEnd, verseEnd, easton_index, smith_index):
    texto = get_passage_text(book, chapterStart, verseStart, chapterEnd, verseEnd)
    variants = passage_variant_set(texto)

    easton_hits = match_dictionary(variants, easton_index)
    smith_hits = match_dictionary(variants, smith_index)

    by_headword = {}
    for h in easton_hits:
        by_headword.setdefault(h["titulo"], {"headword": h["titulo"], "fuentes": []})
        by_headword[h["titulo"]]["fuentes"].append({"diccionario": "easton", "id": h["id"]})
    for h in smith_hits:
        by_headword.setdefault(h["titulo"], {"headword": h["titulo"], "fuentes": []})
        by_headword[h["titulo"]]["fuentes"].append({"diccionario": "smith", "id": h["id"]})

    entradas = sorted(by_headword.values(), key=lambda x: x["headword"].lower())
    return {
        "pasaje": {"book": book, "chapterStart": chapterStart, "verseStart": verseStart,
                   "chapterEnd": chapterEnd, "verseEnd": verseEnd},
        "totalEntradas": len(entradas),
        "entradas": entradas,
    }


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
            print(r["pasaje"], f"({r['totalEntradas']} entradas)")
            for e in r["entradas"]:
                fuentes = "+".join(sorted({f["diccionario"] for f in e["fuentes"]}))
                print(f"  - {e['headword']}  [{fuentes}]")


if __name__ == "__main__":
    main()
