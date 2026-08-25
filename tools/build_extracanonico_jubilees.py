#!/usr/bin/env python3
"""Build the English Book of Jubilees dataset (R.H. Charles, 1913 translation) from CCEL.

Source: ccel.org/ccel/c/charles/otpseudepig/files/jubilee/{1..50}.htm — one
clean HTML page per chapter (Joshua Williams scan, Northwest Nazarene
College, 1995), each chapter body wrapped in a single <ol> with one <li> per
verse (unclosed <li> tags — parsed by splitting on the tag, not by an HTML
parser expecting well-formed markup). No footnotes are present in this scan
("[Notes and dates added by Mr. Charles will not be given due to length and
difficulty in scanning and editing]" — index.htm), so there is no critical
apparatus to separate out for this work.

Output: biblia/modules/extracanonico/jubileos/{manifest.json,entries.json}.
"""

from __future__ import annotations

import html
import json
import re
import time
import urllib.request

BASE = "https://ccel.org/ccel/c/charles/otpseudepig/files/jubilee"
OUT_DIR = "biblia/modules/extracanonico/jubileos"
NUM_CHAPTERS = 50


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Verbo build script; contact juanjosevenegas78@gmail.com)"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("iso-8859-1")


def strip_tags(s: str) -> str:
    s = re.sub(r"<[^>]+>", "", s)
    s = html.unescape(s)
    return re.sub(r"\s+", " ", s).strip()


def parse_chapter(raw: str, n: int) -> str:
    # Chapter argument (summary) in the first <blockquote><em>...</em></blockquote>
    # (case varies: <EM> in some pages, <em> in others).
    arg_m = re.search(r"<blockquote>\s*<em>(.*?)</em>\s*</blockquote>", raw, flags=re.S | re.I)
    argument = strip_tags(arg_m.group(1)) if arg_m else ""

    # Verse body: everything between "[Chapter N]" and the trailing chapter-nav
    # <hr>. Markup is inconsistent across pages (<h5> vs plain <p>, <ol>/<li>
    # vs <OL>/<LI>), so anchor only on the "[Chapter" marker and the final <HR>.
    start_m = re.search(r"\[Chapter\s+\d+[^\]]*\]", raw, flags=re.I)
    start = start_m.end() if start_m else 0
    hr_positions = [m.start() for m in re.finditer(r"<hr>", raw, flags=re.I) if m.start() > start]
    end = hr_positions[0] if hr_positions else len(raw)
    verses_raw = raw[start:end]
    parts = [p for p in re.split(r"<li>", verses_raw, flags=re.I) if p.strip()]
    verses = [strip_tags(p) for p in parts]
    verses = [v for v in verses if v]

    html_parts = []
    if argument:
        html_parts.append(f"<p><em>{argument}</em></p>")
    for i, v in enumerate(verses, start=1):
        html_parts.append(f"<p>{i}. {v}</p>")
    return "".join(html_parts)


EDITORIAL_NOTE_JUBILEES_HTML = """
<p><strong>Nota editorial de Verbo.</strong> El Libro de los Jubileos (también llamado "Pequeño Génesis") es una obra judía del siglo II a.C. que reescribe Génesis y el comienzo de Éxodo organizando la historia en ciclos de "jubileos" (períodos de 49 años). No forma parte del canon hebreo ni del protestante; al igual que 1 Enoc, es Escritura canónica solo para la Iglesia Ortodoxa Etíope.</p>
<p>Su valor es de trasfondo intertestamentario: documenta el desarrollo del calendario solar sectario (más tarde asociado a Qumrán), la angelología y demonología del período, y una fuerte insistencia legalista en la observancia de la ley mosaica proyectada retroactivamente sobre los patriarcas. No es citado directamente en el Nuevo Testamento, pero su influencia en el ambiente judío del siglo I es ampliamente reconocida por los estudiosos.</p>
""".strip()


def main() -> None:
    entries = [{
        "id": "00-nota-editorial",
        "titulo": "Nota editorial",
        "capituloNumero": 0,
        "content": EDITORIAL_NOTE_JUBILEES_HTML,
    }]
    for n in range(1, NUM_CHAPTERS + 1):
        url = f"{BASE}/{n}.htm"
        for attempt in range(3):
            try:
                raw = fetch(url)
                break
            except Exception as exc:  # noqa: BLE001
                print(f"  retry {url}: {exc}")
                time.sleep(2)
        else:
            raise SystemExit(f"failed to fetch {url}")
        body = parse_chapter(raw, n)
        entries.append({
            "id": f"jubileos-{n}",
            "titulo": f"Capítulo {n}",
            "capituloNumero": n,
            "content": body,
        })
        print(f"  chapter {n}/{NUM_CHAPTERS} — {len(body)} chars")
        time.sleep(0.3)

    with open(f"{OUT_DIR}/entries.json", "w", encoding="utf-8") as f:
        json.dump({"entries": entries}, f, ensure_ascii=False, indent=None)

    manifest = {
        "schemaVersion": 2,
        "id": "jubileos",
        "type": "extracanonico",
        "name": "El Libro de los Jubileos",
        "abbreviation": "Jubileos",
        "language": "en",
        "author": "Anónimo",
        "translator": "R.H. Charles (1913)",
        "year": -150,
        "coverage": {"start": -200, "end": -100},
        "description": "Reescritura judía de Génesis y comienzo de Éxodo organizada en ciclos de jubileos. Trasfondo intertestamentario mayor. Traducción inglesa de dominio público de R.H. Charles (1913), vía CCEL.",
        "license": "Dominio público (edición original de 1913, sin aviso de copyright renovado).",
        "sourceUrl": "https://ccel.org/ccel/c/charles/otpseudepig/files/jubilee/index.htm",
        "entriesFile": "entries.json",
        "totalEntries": len(entries),
        "navegacion": "capitular",
    }
    with open(f"{OUT_DIR}/manifest.json", "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    print(f"Wrote {len(entries)} entries to {OUT_DIR}")


if __name__ == "__main__":
    main()
