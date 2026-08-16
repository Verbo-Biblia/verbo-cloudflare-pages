#!/usr/bin/env python3
"""Genera una copia liviana y autocontenida de la KJV (sin datos Strong's)
para Proyector, a partir de biblia/modules/bibles/kjv-strong/.

Proyector no usa module-loader.js ni resuelve la indirección "dataManifest"
que el módulo "kjv" del sitio principal usa para compartir los datos de
kjv-strong/ sin duplicarlos. Este script sí duplica físicamente los datos,
pero quitando el campo "segments" de cada versículo (que Proyector nunca
lee — ver textoVersiculo() en control.js), dejando cada verso como
{"text": "..."}, mismo formato liviano que rvg-2004/rv-verbo. Esto reduce
~27MB a ~4-4.5MB.

Uso: python3 tools/build_proyector_kjv_light.py
Vuelve a correrse solo si kjv-strong/ cambia en el sitio principal (no
debería, es texto de dominio público ya estable).
"""
import json
from pathlib import Path

SOURCE = Path(__file__).resolve().parent.parent / "biblia" / "modules" / "bibles" / "kjv-strong"
DEST = Path("/home/juan/Verbo/Proyector/modulos-biblia/kjv-plano")


def strip_segments(chapters):
    out = {}
    for chapter_num, verses in chapters.items():
        out[chapter_num] = {
            verse_num: {"text": verse["text"]}
            for verse_num, verse in verses.items()
        }
    return out


def main():
    manifest = json.loads((SOURCE / "manifest.json").read_text(encoding="utf-8"))
    DEST.mkdir(parents=True, exist_ok=True)
    (DEST / "books").mkdir(exist_ok=True)

    total_before = 0
    total_after = 0
    for book in manifest["books"]:
        src_path = SOURCE / book["file"]
        total_before += src_path.stat().st_size
        book_data = json.loads(src_path.read_text(encoding="utf-8"))
        book_data["chapters"] = strip_segments(book_data["chapters"])
        dest_path = DEST / book["file"]
        dest_path.write_text(
            json.dumps(book_data, ensure_ascii=False, separators=(",", ":")),
            encoding="utf-8",
        )
        total_after += dest_path.stat().st_size

    light_manifest = {
        **manifest,
        "id": "kjv-plano",
        "name": "King James Version (1769)",
        "abbreviation": "King James",
        "description": "King James Version sin etiquetas Strong (copia liviana para Proyector).",
        "hasStrongs": False,
    }
    light_manifest.pop("dataManifest", None)
    (DEST / "manifest.json").write_text(
        json.dumps(light_manifest, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print(f"Libros procesados: {len(manifest['books'])}")
    print(f"Tamaño books/ origen (con segments): {total_before / 1_000_000:.1f} MB")
    print(f"Tamaño books/ destino (sin segments): {total_after / 1_000_000:.1f} MB")
    print(f"Salida: {DEST}")


if __name__ == "__main__":
    main()
