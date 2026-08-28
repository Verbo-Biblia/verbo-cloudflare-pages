#!/usr/bin/env python3
"""
Fase 1 — Motor de cruce Historia (época del libro <-> Eusebio, Historia Eclesiástica).

Dado un pasaje bíblico (libro, capítulo/versículo inicio-fin), determina qué
entradas de eusebio-historia-eclesiastica (264 entradas con anioInicio/anioFin)
aplican, cruzando contra los datos generados en tools/asistente-estudio/data/:

  - nt-typological-references.json  (prioridad 1: tipología)
  - book-classification-nt.json     (secciones / posturas / libro)
  - book-classification-ot.json     (secciones / posturas / libro)

Es un PROTOTIPO aislado para revisión de Juan — no se integra a biblia/ ni a
registry.json. No requiere dependencias externas (solo stdlib).

Uso:
    python3 cruce_historia_eusebio.py            # corre la prueba piloto (5 pasajes)
    python3 cruce_historia_eusebio.py --json      # ídem, imprime solo el JSON crudo
"""

import json
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = Path(__file__).resolve().parent / "data"
EUSEBIO_PATH = REPO_ROOT / "biblia" / "modules" / "church-history" / "eusebio-historia-eclesiastica" / "entries.json"

VERSE_INF = 999  # sentinel para "hasta el final del capítulo / cita de capítulo completo"

# ---------------------------------------------------------------------------
# Carga de datos
# ---------------------------------------------------------------------------

def load_json(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def load_all():
    nt = load_json(DATA_DIR / "book-classification-nt.json")
    ot = load_json(DATA_DIR / "book-classification-ot.json")
    typo = load_json(DATA_DIR / "nt-typological-references.json")
    eusebio = load_json(EUSEBIO_PATH)["entries"]
    books = {**nt, **ot}
    return books, typo, eusebio


def load_relevancia():
    """eusebioId -> 'alta' | 'baja', según la curación de Fase 1 (Parte C).
    Cualquier entrada de Eusebio que NO aparezca aquí se trata como 'baja'
    por defecto — nunca se muestra sin curación explícita."""
    data = load_json(DATA_DIR / "eusebio-relevancia-nt.json")
    return {e["eusebioId"]: e["relevancia"] for e in data["entradas"]}


# ---------------------------------------------------------------------------
# Parser de citas bíblicas usadas en nt-typological-references.json
# ---------------------------------------------------------------------------

BOOK_ABBR = {
    "Heb": "HEB", "Jud": "JUD", "Ro": "ROM", "1 Co": "1CO", "2 Co": "2CO",
    "Gá": "GAL", "1 Ti": "1TI", "2 Ti": "2TI", "Mt": "MAT", "Lc": "LUK",
    "Jn": "JHN", "Hch": "ACT", "Ap": "REV",
}
# probar los de dos palabras primero para no cortar "1 Co" en "1"
BOOK_ABBR_SORTED = sorted(BOOK_ABBR.items(), key=lambda kv: -len(kv[0]))

SINGLE_CHAPTER_BOOKS = {"JUD", "PHM", "2JN", "3JN", "OBA"}


def _parse_verse_group(chapter, group):
    """'6' -> (6,6) ; '1-10' -> (1,10) ; '11a' -> (11,11) (sufijo de letra se ignora)."""
    group = group.strip()
    group = re.sub(r"[a-z]+$", "", group)  # quita sufijos tipo 'a'/'b'/'c'
    if "-" in group:
        a, b = group.split("-", 1)
        return (chapter, int(a), int(b))
    return (chapter, int(group), int(group))


def parse_referencia(pasaje_nt):
    """
    Convierte un string como 'Heb 5:6, 10; 6:20; 7:1-10' o 'Mt 12:39-41; Lc 11:29-32'
    en una lista de tuplas (libro, capInicio, versInicio, capFin, versFin).
    """
    texto = re.sub(r"\([^)]*\)", "", pasaje_nt).strip()  # quita paréntesis explicativos
    segmentos = [s.strip() for s in texto.split(";") if s.strip()]

    resultado = []
    libro_actual = None

    for seg in segmentos:
        # detectar prefijo de libro
        libro_detectado = None
        resto = seg
        for abbr, code in BOOK_ABBR_SORTED:
            if seg.startswith(abbr + " "):
                libro_detectado = code
                resto = seg[len(abbr):].strip()
                break
        if libro_detectado:
            libro_actual = libro_detectado
        resto = resto.strip()

        if ":" in resto:
            cap_str, versos_str = resto.split(":", 1)
            capitulo = int(cap_str.strip())
            for grupo in versos_str.split(","):
                grupo = grupo.strip()
                if not grupo:
                    continue
                cap, v1, v2 = _parse_verse_group(capitulo, grupo)
                resultado.append((libro_actual, cap, v1, cap, v2))
        else:
            # sin ':' -> capítulo completo (libros normales) o solo versículo
            # (libros de un capítulo, ej. Judas)
            if libro_actual in SINGLE_CHAPTER_BOOKS:
                for grupo in resto.split(","):
                    grupo = grupo.strip()
                    if not grupo:
                        continue
                    cap, v1, v2 = _parse_verse_group(1, grupo)
                    resultado.append((libro_actual, cap, v1, cap, v2))
            else:
                capitulo = int(re.sub(r"[^\d]", "", resto))
                resultado.append((libro_actual, capitulo, 1, capitulo, VERSE_INF))

    return resultado


def rangos_solapan(a_ch1, a_v1, a_ch2, a_v2, b_ch1, b_v1, b_ch2, b_v2):
    """Solapamiento de dos rangos (capítulo, versículo) usando orden lexicográfico."""
    a_start, a_end = (a_ch1, a_v1), (a_ch2, a_v2)
    b_start, b_end = (b_ch1, b_v1), (b_ch2, b_v2)
    return a_start <= b_end and b_start <= a_end


# ---------------------------------------------------------------------------
# Parser de rangos de capítulos usados en 'secciones' (ej. "Gn 1-11", "Zac 9-14 (...)")
# ---------------------------------------------------------------------------

def parse_rango_capitulos(rango_str):
    m = re.search(r"(\d+)\s*-\s*(\d+)", rango_str)
    if m:
        return int(m.group(1)), int(m.group(2))
    m = re.search(r"(\d+)", rango_str)
    if m:
        n = int(m.group(1))
        return n, n
    return None


# ---------------------------------------------------------------------------
# Índice de referencias tipológicas: book -> lista de (rango parseado, entrada)
# ---------------------------------------------------------------------------

def build_typology_index(typo_data):
    index = {}
    for libro_clave, entradas in typo_data.items():
        if libro_clave == "_metadata":
            continue
        for entrada in entradas:
            for (libro, ch1, v1, ch2, v2) in parse_referencia(entrada["pasajeNT"]):
                if libro is None:
                    continue
                index.setdefault(libro, []).append({
                    "rango": (ch1, v1, ch2, v2),
                    "entrada": entrada,
                })
    return index


# ---------------------------------------------------------------------------
# Resolución de "ventanas" de época para un pasaje, según prioridad
# ---------------------------------------------------------------------------

def _ventana_from_dict(d, origen, tipo=None):
    return {
        "origen": origen,
        "tipo": tipo if tipo is not None else d.get("tipo"),
        "anioInicio": d.get("anioInicio"),
        "anioFin": d.get("anioFin"),
    }


def resolve_ventanas(book, chapterStart, verseStart, chapterEnd, verseEnd, books, typo_index):
    """
    Devuelve (origenEpoca_resumen, lista_de_ventanas).
    Sigue el orden de prioridad: tipología > secciones > posturas > libro.
    """
    # 1. Tipología
    matches = typo_index.get(book, [])
    ventanas_tipologia = []
    for m in matches:
        ch1, v1, ch2, v2 = m["rango"]
        if rangos_solapan(chapterStart, verseStart, chapterEnd, verseEnd, ch1, v1, ch2, v2):
            entrada = m["entrada"]
            ventanas_tipologia.append({
                "origen": f"tipologia:{entrada['pasajeNT']}",
                "tipo": None,
                "anioInicio": entrada.get("anioInicio"),
                "anioFin": entrada.get("anioFin"),
                "referenciaAT": entrada.get("referenciaAT"),
            })
    if ventanas_tipologia:
        return "tipologia", ventanas_tipologia

    libro_data = books.get(book)
    if libro_data is None:
        return "desconocido", []

    # 2. Secciones (nivel de libro)
    secciones = libro_data.get("secciones")
    if secciones:
        ventanas = []
        for sec in secciones:
            rango = parse_rango_capitulos(sec["rango"])
            if rango is None:
                continue
            ch1, ch2 = rango
            if rangos_solapan(chapterStart, verseStart, chapterEnd, verseEnd, ch1, 1, ch2, VERSE_INF):
                ventanas.append(_ventana_from_dict(sec, f"seccion:{sec['rango']}"))
        if ventanas:
            return "seccion", ventanas
        # el libro tiene secciones pero el pasaje no cayó en ninguna (no debería pasar
        # si las secciones cubren el libro completo) -> seguir a libro como respaldo

    # 3. Posturas (nivel de libro)
    posturas = libro_data.get("posturas")
    if posturas:
        ventanas = []
        for postura in posturas:
            nombre = postura["nombre"]
            sub_secciones = postura.get("secciones")
            if sub_secciones:
                for sub in sub_secciones:
                    rango = parse_rango_capitulos(sub["rango"])
                    if rango is None:
                        continue
                    ch1, ch2 = rango
                    if rangos_solapan(chapterStart, verseStart, chapterEnd, verseEnd, ch1, 1, ch2, VERSE_INF):
                        ventanas.append(_ventana_from_dict(
                            sub, f"postura:{nombre}:{sub['rango']}", tipo=postura.get("tipo")
                        ))
            else:
                # la postura aplica al libro completo, sin distinción de capítulo
                ventanas.append(_ventana_from_dict(postura, f"postura:{nombre}"))
        if ventanas:
            return "postura", ventanas

    # 4. Época del libro (caso simple)
    return "libro", [_ventana_from_dict(libro_data, "libro")]


# ---------------------------------------------------------------------------
# Cruce final contra Eusebio
# ---------------------------------------------------------------------------

ROMANOS = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"]


def eusebio_libro_seccion(entry_id):
    m = re.match(r"eusebio-he-l(\d+)-c(\d+)$", entry_id)
    if m:
        libro, cap = int(m.group(1)), int(m.group(2))
        return f"{ROMANOS[libro]}.{cap}"
    m = re.match(r"eusebio-mdp-c(\d+)$", entry_id)
    if m:
        return f"MdP.{m.group(1)}"
    return entry_id


def cruzar_con_eusebio(ventanas, eusebio_entries, relevancia_map):
    """
    relevancia_map: eusebioId -> 'alta'/'baja' (ver load_relevancia()).
    Solo se devuelven entradas curadas como 'alta'. Una entrada que solapa en
    años pero no tiene curación explícita (o está en 'baja') se descarta —
    la curación de Fase 1 Parte C es la única fuente de verdad para lo que
    se muestra, nunca el solo solapamiento de años.
    """
    resultados = {}  # eusebioId -> resultado (para deduplicar si varias ventanas matchean lo mismo)
    for ventana in ventanas:
        a1, a2 = ventana.get("anioInicio"), ventana.get("anioFin")
        if a1 is None or a2 is None:
            continue  # ventana sin época (tipo 'ninguna' o Gn 1-11) -> no aporta nada, por diseño
        for e in eusebio_entries:
            if a1 <= e["anioFin"] and e["anioInicio"] <= a2:
                if relevancia_map.get(e["id"], "baja") != "alta":
                    continue  # filtro de curación: sin 'alta' explícito, no se muestra
                key = e["id"]
                if key not in resultados:
                    resultados[key] = {
                        "eusebioId": e["id"],
                        "titulo": e["title"],
                        "libroSeccion": eusebio_libro_seccion(e["id"]),
                        "anioInicio": e["anioInicio"],
                        "anioFin": e["anioFin"],
                        "ventanaOrigen": [],
                    }
                resultados[key]["ventanaOrigen"].append(ventana["origen"])
    # orden natural: por anioInicio de la entrada de Eusebio
    return sorted(resultados.values(), key=lambda r: (r["anioInicio"], r["anioFin"]))


# ---------------------------------------------------------------------------
# API principal
# ---------------------------------------------------------------------------

def consultar_pasaje(book, chapterStart, verseStart, chapterEnd, verseEnd, books, typo_index, eusebio_entries, relevancia_map):
    origen, ventanas = resolve_ventanas(book, chapterStart, verseStart, chapterEnd, verseEnd, books, typo_index)
    resultados = cruzar_con_eusebio(ventanas, eusebio_entries, relevancia_map)
    return {
        "pasaje": {
            "book": book,
            "chapterStart": chapterStart,
            "verseStart": verseStart,
            "chapterEnd": chapterEnd,
            "verseEnd": verseEnd,
        },
        "origenEpoca": origen,
        "ventanas": ventanas,
        "resultados": resultados,
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
    books, typo_data, eusebio_entries = load_all()
    typo_index = build_typology_index(typo_data)
    relevancia_map = load_relevancia()

    salida = []
    for (book, cs, vs, ce, ve) in PRUEBA_PILOTO:
        resultado = consultar_pasaje(book, cs, vs, ce, ve, books, typo_index, eusebio_entries, relevancia_map)
        salida.append(resultado)

    if "--json" in sys.argv:
        print(json.dumps(salida, ensure_ascii=False, indent=2))
    else:
        for r in salida:
            print("=" * 70)
            print(json.dumps(r, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
