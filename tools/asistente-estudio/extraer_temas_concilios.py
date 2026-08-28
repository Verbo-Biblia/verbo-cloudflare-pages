#!/usr/bin/env python3
"""
Fase 2 — Extracción de temas doctrinales de los Concilios Ecuménicos (PROPUESTA).

Clasifica las 342 entradas de npnf214-concilios-ecumenicos en temas
doctrinales, a partir de una revisión de título/tipo/concilio/excerpt de
cada entrada (metodología descrita en el informe). Genera
tools/asistente-estudio/data/concilios-temas.json.

Solo lee biblia/modules/church-history/npnf214-concilios-ecumenicos/.
No escribe ahí ni en registry.json.
"""

import json
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
SRC_PATH = REPO_ROOT / "biblia" / "modules" / "church-history" / "npnf214-concilios-ecumenicos" / "entries.json"
OUT_PATH = Path(__file__).resolve().parent / "data" / "concilios-temas.json"

TEMAS = [
    {
        "id": "naturaleza-de-cristo-divinidad-arrianismo",
        "nombre": "Naturaleza de Cristo: plena divinidad (controversia arriana)",
        "concilios": ["Nicea I (325)"],
        "ids": [
            "npnf214-nicea-i-002", "npnf214-nicea-i-003", "npnf214-nicea-i-004", "npnf214-nicea-i-038",
        ],
        "notaOverlap": "npnf214-nicea-i-038 (Carta Sinodal) también cubre el cisma melitiano y la Pascua — contenido mixto.",
    },
    {
        "id": "trinidad-divinidad-espiritu-santo",
        "nombre": "La Trinidad: divinidad del Espíritu Santo (controversia macedonia/pneumatómaca) y la cuestión del Filioque",
        "concilios": ["Constantinopla I (381)"],
        "ids": [
            "npnf214-constantinopla-i-042", "npnf214-constantinopla-i-043",
            "npnf214-constantinopla-i-048", "npnf214-constantinopla-i-057",
        ],
        "notaOverlap": "npnf214-constantinopla-i-048 (herejías condenadas en el Canon I) también nombra el arrianismo y el apolinarismo — solapa con el tema de la divinidad de Cristo y con la naturaleza de Cristo en general.",
    },
    {
        "id": "naturaleza-de-cristo-unidad-persona-nestorianismo",
        "nombre": "Naturaleza de Cristo: unidad de la persona y Theotokos (controversia nestoriana, incl. los Tres Capítulos)",
        "concilios": ["Éfeso (431)", "Calcedonia (451, carta de reunificación)", "Constantinopla II (553)"],
        "ids": [
            "npnf214-efeso-060", "npnf214-efeso-061", "npnf214-efeso-062", "npnf214-efeso-063",
            "npnf214-efeso-064", "npnf214-efeso-065", "npnf214-efeso-066", "npnf214-efeso-067",
            "npnf214-efeso-068", "npnf214-efeso-069", "npnf214-efeso-070", "npnf214-efeso-071",
            "npnf214-efeso-072", "npnf214-efeso-073", "npnf214-efeso-074", "npnf214-efeso-076",
            "npnf214-efeso-077", "npnf214-efeso-078", "npnf214-efeso-079", "npnf214-efeso-080",
            "npnf214-efeso-081", "npnf214-efeso-082", "npnf214-efeso-083", "npnf214-efeso-084",
            "npnf214-efeso-087", "npnf214-efeso-089", "npnf214-efeso-090", "npnf214-efeso-092",
            "npnf214-efeso-098",
            "npnf214-calcedonia-105",
            "npnf214-constantinopla-ii-152", "npnf214-constantinopla-ii-153", "npnf214-constantinopla-ii-154",
            "npnf214-constantinopla-ii-155", "npnf214-constantinopla-ii-156", "npnf214-constantinopla-ii-157",
            "npnf214-constantinopla-ii-158", "npnf214-constantinopla-ii-159", "npnf214-constantinopla-ii-160",
            "npnf214-constantinopla-ii-161", "npnf214-constantinopla-ii-162", "npnf214-constantinopla-ii-163",
            "npnf214-constantinopla-ii-164", "npnf214-constantinopla-ii-165", "npnf214-constantinopla-ii-166",
            "npnf214-constantinopla-ii-167", "npnf214-constantinopla-ii-168",
            "npnf214-constantinopla-ii-194", "npnf214-constantinopla-ii-195",
        ],
        "notaOverlap": "npnf214-efeso-090 (Canon IV) condena en el mismo canon a Nestorio Y a Celestio (pelagiano) — solapa con el tema de pelagianismo. npnf214-calcedonia-105 es la Fórmula de Reunión, citada en Calcedonia pero perteneciente a la disputa nestoriana de Éfeso.",
    },
    {
        "id": "naturaleza-de-cristo-dos-naturalezas-calcedonia",
        "nombre": "Naturaleza de Cristo: dos naturalezas en una persona (controversia eutiquiana/monofisita)",
        "concilios": ["Calcedonia (451)"],
        "ids": [
            "npnf214-calcedonia-103", "npnf214-calcedonia-104", "npnf214-calcedonia-106",
            "npnf214-calcedonia-107", "npnf214-calcedonia-108", "npnf214-calcedonia-109",
            "npnf214-calcedonia-110", "npnf214-calcedonia-111", "npnf214-calcedonia-112",
            "npnf214-calcedonia-113", "npnf214-calcedonia-114",
        ],
        "notaOverlap": None,
    },
    {
        "id": "naturaleza-de-cristo-dos-voluntades-monotelismo",
        "nombre": "Naturaleza de Cristo: dos voluntades (controversia monotelita)",
        "concilios": ["Constantinopla III (680-681)"],
        "ids": [
            "npnf214-constantinopla-iii-198", "npnf214-constantinopla-iii-199", "npnf214-constantinopla-iii-200",
            "npnf214-constantinopla-iii-201", "npnf214-constantinopla-iii-202", "npnf214-constantinopla-iii-203",
            "npnf214-constantinopla-iii-204", "npnf214-constantinopla-iii-205", "npnf214-constantinopla-iii-206",
            "npnf214-constantinopla-iii-207", "npnf214-constantinopla-iii-208", "npnf214-constantinopla-iii-209",
        ],
        "notaOverlap": None,
    },
    {
        "id": "condena-del-origenismo",
        "nombre": "Condena del origenismo (preexistencia del alma, apocatástasis/restauración universal)",
        "concilios": ["Constantinopla II (553)"],
        "ids": (
            ["npnf214-constantinopla-ii-169"]
            + [f"npnf214-constantinopla-ii-{n}" for n in range(170, 185)]
            + [f"npnf214-constantinopla-ii-{n}" for n in range(185, 194)]
        ),
        "notaOverlap": "Distinto del tema nestoriano/Tres Capítulos aunque ambos vienen del mismo concilio (Constantinopla II) — son dos controversias separadas resueltas en el mismo sínodo.",
    },
    {
        "id": "veneracion-de-imagenes-iconoclasia",
        "nombre": "Veneración de imágenes/iconos (controversia iconoclasta)",
        "concilios": ["Nicea II (787)", "Concilio de Frankfort (794, rechazo occidental)"],
        "ids": [
            "npnf214-nicea-ii-216", "npnf214-nicea-ii-217", "npnf214-nicea-ii-218", "npnf214-nicea-ii-219",
            "npnf214-nicea-ii-220", "npnf214-nicea-ii-221", "npnf214-nicea-ii-222", "npnf214-nicea-ii-223",
            "npnf214-nicea-ii-224", "npnf214-nicea-ii-248", "npnf214-nicea-ii-250", "npnf214-nicea-ii-251",
            "npnf214-nicea-ii-252", "npnf214-nicea-ii-253", "npnf214-nicea-ii-254", "npnf214-nicea-ii-255",
        ],
        "notaOverlap": None,
    },
    {
        "id": "pelagianismo-pecado-original-gracia",
        "nombre": "Pelagianismo: pecado original, gracia y libre albedrío",
        "concilios": ["Éfeso (431)"],
        "ids": ["npnf214-efeso-090", "npnf214-efeso-091"],
        "notaOverlap": "npnf214-efeso-090 (Canon IV) es compartido con el tema nestoriano (ver arriba) — el mismo canon condena ambas herejías juntas.",
    },
    {
        "id": "mesalianismo-gracia-oracion",
        "nombre": "Mesalianismo: gracia, oración y perfección espiritual",
        "concilios": ["Éfeso (431)"],
        "ids": ["npnf214-efeso-099", "npnf214-efeso-100"],
        "notaOverlap": None,
    },
    {
        "id": "validez-bautismo-y-recepcion-de-herejes",
        "nombre": "Validez del bautismo y recepción de herejes en la Iglesia (disputa del rebautismo)",
        "concilios": ["Cánones Apostólicos (300)", "Nicea I (325)", "Constantinopla I (381)", "Cartago bajo Cipriano (256)"],
        "ids": [
            "npnf214-nicea-i-032",
            "npnf214-constantinopla-i-054", "npnf214-constantinopla-i-055",
            "npnf214-canones-apostolicos-303", "npnf214-canones-apostolicos-304",
            "npnf214-cartago-bajo-cipriano-212",
        ],
        "notaOverlap": None,
    },
    {
        "id": "autoridad-de-las-escrituras-canon-biblico",
        "nombre": "Autoridad de las Escrituras: canon bíblico y libros apócrifos/falsos",
        "concilios": ["Cánones Apostólicos (300)", "Nicea II (787)"],
        "ids": [
            "npnf214-canones-apostolicos-317", "npnf214-canones-apostolicos-342",
            "npnf214-nicea-ii-233",
        ],
        "notaOverlap": None,
    },
    {
        "id": "inmutabilidad-del-credo-niceno",
        "nombre": "Autoridad e inmutabilidad del Credo de Nicea (prohibición de componer nuevos credos)",
        "concilios": ["Éfeso (431)"],
        "ids": ["npnf214-efeso-094", "npnf214-efeso-095"],
        "notaOverlap": "Temáticamente distinto pero procesalmente parte del mismo bloque de sesiones que el tema nestoriano de Éfeso.",
    },
]


def main():
    data = json.loads(SRC_PATH.read_text(encoding="utf-8"))
    all_entries = {e["id"]: e for e in data["entries"]}
    all_ids = set(all_entries.keys())

    used_ids = set()
    salida_temas = []
    for tema in TEMAS:
        for i in tema["ids"]:
            if i not in all_ids:
                raise SystemExit(f"ID inexistente en entries.json: {i} (tema {tema['id']})")
        used_ids.update(tema["ids"])
        salida_temas.append({
            "id": tema["id"],
            "nombre": tema["nombre"],
            "concilios": tema["concilios"],
            "cantidadEntradas": len(tema["ids"]),
            "entradaIds": tema["ids"],
            "notaOverlap": tema.get("notaOverlap"),
        })

    salida_temas.sort(key=lambda t: -t["cantidadEntradas"])

    sin_tema = sorted(all_ids - used_ids)
    ejemplos_sin_tema = []
    for i in sin_tema[:8]:
        e = all_entries[i]
        ejemplos_sin_tema.append({"id": i, "concilio": e["concilio"], "tipo": e["tipo"], "titulo": e["title"]})

    resultado = {
        "_metadata": {
            "descripcion": "PROPUESTA de agrupación por tema doctrinal de las 342 entradas de npnf214-concilios-ecumenicos (Fase 2). Basado en revisión de título/tipo/concilio/excerpt, no en lectura completa de las 342 entradas — ver metodología en el informe. No es una decisión final.",
            "totalEntradasFuente": len(all_ids),
            "totalConTemaDoctrinal": len(used_ids),
            "totalSinTemaDoctrinal": len(sin_tema),
        },
        "temas": salida_temas,
        "sinTemaDoctrinal": {
            "cantidad": len(sin_tema),
            "ejemplos": ejemplos_sin_tema,
            "ids": sin_tema,
        },
    }

    OUT_PATH.write_text(json.dumps(resultado, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Escrito: {OUT_PATH}")
    print(f"Total entradas fuente: {len(all_ids)}")
    print(f"Con tema doctrinal: {len(used_ids)}  ({len(salida_temas)} temas)")
    print(f"Sin tema doctrinal: {len(sin_tema)}")
    print()
    for t in salida_temas:
        print(f"  {t['cantidadEntradas']:3d}  {t['nombre']}")


if __name__ == "__main__":
    main()
