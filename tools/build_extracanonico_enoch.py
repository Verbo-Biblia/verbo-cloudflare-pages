#!/usr/bin/env python3
"""Build the English 1 Enoch dataset (R.H. Charles, 1917 translation) from Wikisource.

Source: en.wikisource.org/wiki/The_Book_of_Enoch_(Charles) — 108 chapter
subpages, community-transcribed from Charles' public-domain translation, no
OCR noise and no page-scan footnote interleaving (unlike the archive.org scan
of the 1913 Oxford edition). Charles' reconstruction brackets (⌈⌈...⌉⌉ /
⌈...⌉ for text supplied or emended by the editor) are kept inline in the
verse text, exactly as printed — this book prints them in the body itself,
they are not a separate footnote apparatus to strip out.

Output: biblia/modules/extracanonico/1-enoc/{manifest.json,entries.json},
schemaVersion 2, same "entries" shape as modules/costumbres (one entry per
chapter, sourceLang 'en' so the site's existing on-demand /translate
pipeline handles Spanish). Entry 0 carries the fixed editorial note (Fase 5).
"""

from __future__ import annotations

import html
import json
import re
import time
import urllib.parse
import urllib.request

API = "https://en.wikisource.org/w/api.php"
OUT_DIR = "biblia/modules/extracanonico/1-enoc"
NUM_CHAPTERS = 108


def fetch_wikitext(title: str) -> str:
    url = f"https://en.wikisource.org/w/index.php?title={urllib.parse.quote(title)}&action=raw"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Verbo build script; contact juanjosevenegas78@gmail.com)"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8")


def clean_wikitext(text: str) -> tuple[str, str]:
    """Return (section_heading, body_html) for one chapter page."""
    # Drop the {{header ... }} template block.
    text = re.sub(r"\{\{header.*?\n\}\}\n?", "", text, flags=re.S)
    # Capture the CHAPTER heading line (e.g. "CHAPTER I.") to use as title suffix.
    m = re.search(r"^CHAPTER\s+[IVXLCM]+\.?\s*$", text, flags=re.M)
    heading = m.group(0).rstrip(".") if m else ""
    if m:
        text = text[m.end():]
    # Strip section/subsection wiki-headings (=== ... ===), keep as nothing —
    # they duplicate the table-of-contents structure already in Charles'
    # section titles per chapter, not needed for the reading body.
    text = re.sub(r"^={2,4}\s*.*?\s*={2,4}\s*$", "", text, flags=re.M)
    # [[../]]-style links -> drop
    text = re.sub(r"\[\[[^\]]*\]\]", "", text)
    # {{smaller|...}} and similar simple templates -> keep inner text
    text = re.sub(r"\{\{smaller\|(.*?)\}\}", r"\1", text, flags=re.S)
    text = re.sub(r"\{\{sc\|(.*?)\}\}", lambda mm: mm.group(1).upper(), text, flags=re.S)
    # Remove any other leftover {{...}} templates (rare, e.g. nop)
    text = re.sub(r"\{\{.*?\}\}", "", text, flags=re.S)
    # Wiki italics/bold '' '''
    text = text.replace("'''", "").replace("''", "")
    text = html.unescape(text)
    text = text.strip()
    # Collapse 3+ blank lines to a paragraph break, wrap paragraphs in <p>.
    paras = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    body = "".join(f"<p>{re.sub(r'\\s+', ' ', p)}</p>" for p in paras)
    return heading, body


EDITORIAL_NOTE_ENOCH_HTML = """
<p><strong>Nota editorial de Verbo.</strong> El Libro de 1 Enoc (o Enoc Etiópico) es una obra judía apocalíptica compuesta en varias etapas entre los siglos III y I a.C., atribuida pseudoepigráficamente al patriarca antediluviano Enoc (Génesis 5:21-24). No forma parte del canon hebreo ni del canon protestante del Antiguo Testamento; la Iglesia Ortodoxa Etíope es la única tradición cristiana que lo considera Escritura canónica hasta hoy.</p>
<p>Su importancia para el estudio del Nuevo Testamento es directa: <strong>Judas 14-15 cita explícitamente 1 Enoc 1:9</strong> como profecía de Enoc sobre la venida del Señor en juicio ("He aquí, vino el Señor con sus santas decenas de millares..."). Esta es la única cita directa y con fórmula de introducción profética de un texto extracanónico en todo el Nuevo Testamento.</p>
<p><strong>Citar no es canonizar.</strong> El uso que Judas hace de Enoc no implica que el Nuevo Testamento reconozca a ese libro como Escritura inspirada, de la misma manera que Pablo cita a los poetas paganos Arato (Hechos 17:28) y Epiménides (Tito 1:12) sin canonizar sus obras. Un autor bíblico puede usar una fuente conocida por su audiencia para comunicar una verdad, sin con ello situar la fuente entera al nivel de la revelación. La iglesia antigua debatió precisamente este punto: Tertuliano defendió la autoridad de Enoc apelando a su uso en Judas (<em>De cultu feminarum</em> I.3), mientras que Jerónimo y Agustín reconocían la antigüedad del libro pero rechazaban su canonicidad — Agustín, en particular, dudaba de la cadena de transmisión del texto desde el propio Enoc antediluviano (<em>De Civitate Dei</em> XV.23; XVIII.38) y notó que no estaba en el canon judío.</p>
<p>1 Enoc conserva, con todo, un valor histórico y exegético considerable: documenta el desarrollo de la angelología, la demonología, la escatología y la doctrina del Mesías/Hijo del Hombre en el judaísmo del período intertestamentario — el trasfondo conceptual inmediato de buena parte del lenguaje apocalíptico del Nuevo Testamento.</p>
<p>Traducción: R.H. Charles (1917), texto en inglés de dominio público. Los corchetes angulares <strong>⌈ ⌉</strong> marcan palabras suplidas o enmendadas por Charles sobre el texto etiópico/griego; <strong>⌈⌈ ⌉⌉</strong> marca palabras presentes en un testigo textual (griego) pero ausentes en otro (etiópico). Se conservan tal como aparecen en la edición impresa.</p>
""".strip()


def main() -> None:
    entries = [{
        "id": "00-nota-editorial",
        "titulo": "Nota editorial",
        "capituloNumero": 0,
        "content": EDITORIAL_NOTE_ENOCH_HTML,
    }]
    for n in range(1, NUM_CHAPTERS + 1):
        title = f"The Book of Enoch (Charles)/Chapter {n:02d}"
        for attempt in range(3):
            try:
                wikitext = fetch_wikitext(title)
                break
            except Exception as exc:  # noqa: BLE001
                print(f"  retry {title}: {exc}")
                time.sleep(2)
        else:
            raise SystemExit(f"failed to fetch {title}")
        heading, body = clean_wikitext(wikitext)
        entries.append({
            "id": f"enoc-{n}",
            "titulo": f"Capítulo {n}",
            "capituloNumero": n,
            "content": body,
        })
        print(f"  chapter {n}/{NUM_CHAPTERS} — {len(body)} chars")
        time.sleep(0.2)

    with open(f"{OUT_DIR}/entries.json", "w", encoding="utf-8") as f:
        json.dump({"entries": entries}, f, ensure_ascii=False, indent=None)

    manifest = {
        "schemaVersion": 2,
        "id": "1-enoc",
        "type": "extracanonico",
        "name": "1 Enoc (Libro Etiópico de Enoc)",
        "abbreviation": "1 Enoc",
        "language": "en",
        "author": "Anónimo (pseudoepígrafo atribuido a Enoc)",
        "translator": "R.H. Charles (1917)",
        "year": -200,
        "coverage": {"start": -300, "end": -100},
        "description": "Texto apocalíptico judío intertestamentario, citado explícitamente en Judas 14-15. Traducción inglesa de dominio público de R.H. Charles (1917), vía Wikisource.",
        "license": "Dominio público (traducción de 1917, sin aviso de copyright renovado).",
        "sourceUrl": "https://en.wikisource.org/wiki/The_Book_of_Enoch_(Charles)",
        "entriesFile": "entries.json",
        "totalEntries": len(entries),
        "navegacion": "capitular",
    }
    with open(f"{OUT_DIR}/manifest.json", "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    print(f"Wrote {len(entries)} entries to {OUT_DIR}")


if __name__ == "__main__":
    main()
