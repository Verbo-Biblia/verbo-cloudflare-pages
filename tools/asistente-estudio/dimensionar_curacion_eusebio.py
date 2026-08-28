#!/usr/bin/env python3
"""
Fase 1 (continuación) — Parte B: dimensionar el universo real de curación.

Para cada uno de los 27 libros del NT, calcula TODAS las ventanas de época
posibles que el motor de cruce podría producir (según sus secciones/posturas
si las tiene, o su ventana de libro si no) más las ventanas de las
referencias tipológicas ancladas en ese libro. Cruza cada ventana contra las
264 entradas de Eusebio y arma la UNIÓN de entradas únicas que se activan en
algún punto del NT (no la suma libro por libro).

No toca biblia/ ni registry.json. Solo lee.
"""

import json
from pathlib import Path

from cruce_historia_eusebio import (
    DATA_DIR, EUSEBIO_PATH, load_json, build_typology_index,
)

NT_BOOKS = [
    "MAT", "MRK", "LUK", "JHN", "ACT", "ROM", "1CO", "2CO", "GAL", "EPH",
    "PHP", "COL", "1TH", "2TH", "1TI", "2TI", "TIT", "PHM", "HEB", "JAS",
    "1PE", "2PE", "1JN", "2JN", "3JN", "JUD", "REV",
]


def ventanas_del_libro(book, libro_data):
    """Todas las ventanas posibles para un libro (secciones y/o posturas), sin
    depender de un pasaje concreto — es el universo completo del libro."""
    ventanas = []

    secciones = libro_data.get("secciones")
    posturas = libro_data.get("posturas")

    if posturas:
        for postura in posturas:
            nombre = postura["nombre"]
            sub_secciones = postura.get("secciones")
            if sub_secciones:
                for sub in sub_secciones:
                    ventanas.append({
                        "origen": f"postura:{nombre}:{sub['rango']}",
                        "anioInicio": sub.get("anioInicio"),
                        "anioFin": sub.get("anioFin"),
                    })
            else:
                ventanas.append({
                    "origen": f"postura:{nombre}",
                    "anioInicio": postura.get("anioInicio"),
                    "anioFin": postura.get("anioFin"),
                })
    elif secciones:
        for sec in secciones:
            ventanas.append({
                "origen": f"seccion:{sec['rango']}",
                "anioInicio": sec.get("anioInicio"),
                "anioFin": sec.get("anioFin"),
            })
    else:
        ventanas.append({
            "origen": "libro",
            "anioInicio": libro_data.get("anioInicio"),
            "anioFin": libro_data.get("anioFin"),
        })

    return ventanas


def main():
    nt = load_json(DATA_DIR / "book-classification-nt.json")
    typo_data = load_json(DATA_DIR / "nt-typological-references.json")
    eusebio_entries = load_json(EUSEBIO_PATH)["entries"]
    typo_index = build_typology_index(typo_data)

    union_ids = {}  # eusebioId -> entrada (dedup)
    por_libro = {}  # book -> set(eusebioId) para diagnóstico

    for book in NT_BOOKS:
        libro_data = nt[book]
        ventanas = list(ventanas_del_libro(book, libro_data))
        # + ventanas de tipología ancladas en este libro
        for m in typo_index.get(book, []):
            e = m["entrada"]
            ventanas.append({
                "origen": f"tipologia:{e['pasajeNT']}",
                "anioInicio": e.get("anioInicio"),
                "anioFin": e.get("anioFin"),
            })

        matched_here = set()
        for v in ventanas:
            a1, a2 = v.get("anioInicio"), v.get("anioFin")
            if a1 is None or a2 is None:
                continue
            for entry in eusebio_entries:
                if a1 <= entry["anioFin"] and entry["anioInicio"] <= a2:
                    union_ids[entry["id"]] = entry
                    matched_here.add(entry["id"])
        por_libro[book] = matched_here

    print(f"Entradas de Eusebio (total en el módulo): {len(eusebio_entries)}")
    print(f"Entradas ÚNICAS activadas por el NT completo (unión): {len(union_ids)}")
    print()
    print("Desglose por libro (cuántas entradas activa cada uno, con solapamiento entre libros):")
    for book in NT_BOOKS:
        print(f"  {book}: {len(por_libro[book])}")

    # Guardar la unión para la Parte C
    out_path = Path(__file__).resolve().parent / "data" / "_eusebio_union_nt.json"
    ids_ordenados = sorted(union_ids.keys(), key=lambda k: (union_ids[k]["anioInicio"], union_ids[k]["anioFin"], k))
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump([union_ids[i] for i in ids_ordenados], f, ensure_ascii=False, indent=2)
    print()
    print(f"Guardado: {out_path}")


if __name__ == "__main__":
    main()
