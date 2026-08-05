#!/usr/bin/env python3
"""Build the Spanish NPNF1-05 (Augustine, Anti-Pelagian Writings) dataset from CCEL.

Same reproducible pattern as build_npnf2_continuators.py and
build_npnf214_councils.py: acquisition, cleaning, segmentation and
translation stay separate and auditable. The volume bundles 13 distinct
treatises; some are split into "Book I/II/III/IV" and two of them
(On the Grace of Christ/On Original Sin, On the Predestination of the
Saints/On the Gift of Perseverance) are nested two-in-one in CCEL's own
table of contents.
"""

from __future__ import annotations

import argparse
import concurrent.futures
import hashlib
import html
import json
import re
import time
import threading
import unicodedata
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

VOLUME = "npnf105"
TOC_URL = "https://www.ccel.org/ccel/schaff/npnf105.toc.html"
XML_URL = "https://ccel.org/ccel/schaff/npnf105.xml"
BASE = "https://ccel.org/ccel/schaff/npnf105/"

# Each work maps to one or more "libro roots" inside the volume. A libro
# root is the dotted CCEL id whose direct leaf children are the real
# chapters. Two CCEL top-level ids (xv, xxi) each bundle two independent
# treatises; those are declared as two separate works below, matching how
# Juan's brief already lists them as 13 distinct items.
WORKS = [
    {
        "slug": "merits-perdon-bautismo", "obra": "Sobre los méritos y el perdón de los pecados, y el bautismo de los niños",
        "anios": (411, 412), "libros": ["x.iii", "x.iv", "x.v"],
    },
    {
        "slug": "espiritu-letra", "obra": "Sobre el espíritu y la letra",
        "anios": (412, 412), "libros": ["xi"],
    },
    {
        "slug": "naturaleza-gracia", "obra": "Sobre la naturaleza y la gracia",
        "anios": (415, 415), "libros": ["xii"],
    },
    {
        "slug": "perfeccion-justicia", "obra": "Sobre la perfección de la justicia del hombre",
        "anios": (415, 416), "libros": ["xiii"],
    },
    {
        "slug": "procedimientos-pelagio", "obra": "Sobre los procedimientos de Pelagio",
        "anios": (417, 417), "libros": ["xiv"],
    },
    {
        "slug": "gracia-cristo-pecado-original", "obra": "Sobre la gracia de Cristo, y sobre el pecado original",
        "anios": (418, 418), "libros": ["xv.iii", "xv.iv"],
    },
    {
        "slug": "matrimonio-concupiscencia", "obra": "Sobre el matrimonio y la concupiscencia",
        "anios": (419, 421), "libros": ["xvi.v", "xvi.vi"],
    },
    {
        "slug": "alma-origen", "obra": "Sobre el alma y su origen",
        "anios": (419, 420), "libros": ["xvii.iv", "xvii.v", "xvii.vi", "xvii.vii"],
    },
    {
        "slug": "contra-dos-cartas-pelagianos", "obra": "Tratado contra dos cartas de los pelagianos",
        "anios": (420, 420), "libros": ["xviii.iii", "xviii.iv", "xviii.v", "xviii.vi"],
    },
    {
        "slug": "gracia-libre-albedrio", "obra": "Sobre la gracia y el libre albedrío",
        "anios": (426, 427), "libros": ["xix.iii", "xix.iv"],
    },
    {
        "slug": "reprension-gracia", "obra": "Sobre la reprensión y la gracia",
        "anios": (426, 427), "libros": ["xx"],
    },
    {
        "slug": "predestinacion-santos", "obra": "Sobre la predestinación de los santos",
        "anios": (428, 429), "libros": ["xxi.ii"],
    },
    {
        "slug": "don-perseverancia", "obra": "Sobre el don de la perseverancia",
        "anios": (428, 429), "libros": ["xxi.iii"],
    },
]

FRONT_MATTER_TITLES = {"Title Page.", "Title Page"}

PEOPLE = {
    "Pelagio": [r"\bPelagius\b"],
    "Celestio": [r"\bC(?:oe|œ)lestius\b"],
    "Juliano de Eclana": [r"\bJulian\b"],
    "Marcelino": [r"\bMarcellinus\b"],
    "Conde Valerio": [r"\bValerius\b"],
    "Valentino": [r"\bValentinus\b"],
    "Papa Zósimo": [r"\bZosimus\b"],
    "Papa Inocencio": [r"\bInnocent\b"],
    "Ambrosio de Milán": [r"\bAmbrose\b"],
    "Jerónimo": [r"\bJerome\b"],
    "Bonifacio": [r"\bBoniface\b"],
    "Orígenes": [r"\bOrigen\b"],
    "Hilario de Poitiers": [r"\bHilary\b"],
    "Lactancio": [r"\bLactantius\b"],
    "Juan Crisóstomo": [r"\bJohn(?: of Constantinople)?\b.{0,20}\bChrysostom\b", r"\bChrysostom\b"],
    "Vincencio Víctor": [r"\bVincentius Victor\b", r"\bVictor\b"],
    "Cipriano de Cartago": [r"\bCyprian\b"],
    "Abraham": [r"\bAbraham\b"],
}
CACHE_LOCK = threading.Lock()


def clean_text(text):
    text = html.unescape(unicodedata.normalize("NFC", text)).replace("­", "").replace("\xa0", " ")
    text = re.sub(r"[ \t\r\f\v]+", " ", text)
    text = re.sub(r" *\n *", "\n", text)
    return re.sub(r"\s+([,.;:!?])", r"\1", text).strip()


def fetch(url, path):
    if path.exists(): return path.read_text(encoding="utf-8", errors="replace")
    req = urllib.request.Request(url, headers={"User-Agent": "Verbo church-history indexer/1.0"})
    with urllib.request.urlopen(req, timeout=90) as response: data = response.read()
    path.parent.mkdir(parents=True, exist_ok=True); path.write_bytes(data)
    return data.decode("utf-8", errors="replace")


def roman_to_int(value):
    values = {"I": 1, "V": 5, "X": 10, "L": 50, "C": 100, "D": 500, "M": 1000}; total = previous = 0
    for char in reversed(value.upper()):
        number = values[char]; total += -number if number < previous else number; previous = max(previous, number)
    return total


def text_without_notes(element):
    parts = [element.text or ""]
    for child in element:
        if child.tag != "note": parts.append(text_without_notes(child))
        parts.append(child.tail or "")
    return "".join(parts)


def xml_chapters(xml_text):
    root = ET.fromstring(xml_text); parents = {child: parent for parent in root.iter() for child in parent}
    chapters = {}
    for division in (element for element in root.iter() if element.tag.startswith("div")):
        chapter_id = division.get("id", "")
        if not chapter_id or not division.get("title"): continue
        paragraphs = []
        for paragraph in division.iter("p"):
            ancestor = parents.get(paragraph); inside_note = False
            while ancestor is not None and ancestor is not division:
                if ancestor.tag == "note": inside_note = True; break
                ancestor = parents.get(ancestor)
            if inside_note or paragraph.get("class") == "endnote": continue
            value = re.sub(r"\s+", " ", clean_text(text_without_notes(paragraph))).strip()
            if value: paragraphs.append(value)
        title = clean_text(division.get("title", ""))
        for index, paragraph in enumerate(paragraphs):
            if re.match(r"^(?:Chapter\s+[IVXLCDM]+|Book\s+[IVXLCDM]+|Prologue\b)", paragraph, re.I):
                paragraphs = paragraphs[index + 1:]; break
        chapters[chapter_id] = (title, paragraphs)
    return chapters


def protect_references(text):
    pattern = re.compile(r"\b(?:Gen|Exod|Lev|Num|Deut|Josh|Judg|Ruth|Sam|Kings|Chron|Ezra|Neh|Esth|Job|Ps|Prov|Eccl|Song|Isa|Jer|Ezek|Dan|Hos|Joel|Amos|Obad|Jonah|Mic|Nah|Hab|Zeph|Hag|Zech|Mal|Matt|Mark|Luke|John|Acts|Rom|Cor|Gal|Eph|Phil|Col|Thess|Tim|Tit|Philem|Heb|Jam|Pet|Jude|Rev)\.?\s+[ivxlcdm\d]+(?:[.:,]\s*[ivxlcdm\d]+(?:[-–][ivxlcdm\d]+)?)?", re.I)
    refs = []
    def replace(match): refs.append(match.group(0)); return f"__BIBREF_{len(refs)-1}__"
    return pattern.sub(replace, text), refs


def translate(text, cache):
    key = hashlib.sha256(text.encode()).hexdigest()
    with CACHE_LOCK:
        if key in cache: return cache[key]
    protected, refs = protect_references(text); chunks = []
    while len(protected) > 4200:
        cut = max(protected.rfind("\n", 0, 4200), protected.rfind(". ", 0, 4200) + 1)
        if cut < 1000: cut = 4200
        chunks.append(protected[:cut]); protected = protected[cut:].lstrip()
    chunks.append(protected); translated = []
    for chunk in chunks:
        query = urllib.parse.urlencode({"client": "gtx", "sl": "en", "tl": "es", "dt": "t", "q": chunk})
        req = urllib.request.Request("https://translate.googleapis.com/translate_a/single?" + query, headers={"User-Agent": "Mozilla/5.0"})
        for attempt in range(6):
            try:
                with urllib.request.urlopen(req, timeout=90) as response: payload = json.load(response)
                translated.append("".join(piece[0] for piece in payload[0] if piece[0])); break
            except Exception:
                if attempt == 5: raise
                time.sleep(2 ** attempt)
        time.sleep(.08)
    result = "".join(translated)
    for index, ref in enumerate(refs): result = result.replace(f"__BIBREF_{index}__", ref)
    result = clean_text(result)
    with CACHE_LOCK: cache[key] = result
    return result


def extract_people(source):
    return [name for name, patterns in PEOPLE.items() if any(re.search(pattern, source, re.I) for pattern in patterns)]


def leaves_under(root_id, xml_chapters_map):
    prefix = root_id + "."
    items = []
    for chapter_id, (title, paragraphs) in xml_chapters_map.items():
        if not chapter_id.startswith(prefix): continue
        rest = chapter_id[len(prefix):]
        if not re.fullmatch(r"[ivxlcdm]+", rest, re.I): continue
        items.append((roman_to_int(rest), chapter_id, title, paragraphs))
    items.sort(key=lambda item: item[0])
    return items


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--cache", default="/tmp/npnf105-augustine-source")
    parser.add_argument("--xml-dir", help="Optional directory containing npnf105.xml")
    parser.add_argument("--workers", type=int, default=6)
    parser.add_argument("--output", default="biblia/modules/church-history/npnf105-agustin-antipelagianos")
    parser.add_argument("--skip-translate", action="store_true", help="Write raw English entries only, no translation pass")
    args = parser.parse_args(); cache_dir = Path(args.cache); output = Path(args.output)
    translation_path = cache_dir / "translations.json"
    translations = json.loads(translation_path.read_text()) if translation_path.exists() else {}

    local_xml = Path(args.xml_dir) / f"{VOLUME}.xml" if args.xml_dir else cache_dir / f"{VOLUME}.xml"
    xml_text = local_xml.read_text(encoding="utf-8", errors="replace") if local_xml.exists() else fetch(XML_URL, local_xml)
    chapters_map = xml_chapters(xml_text)

    raw_entries = []; seen = set()
    for work in WORKS:
        for libro_index, libro_root in enumerate(work["libros"], 1):
            items = leaves_under(libro_root, chapters_map)
            print(f"{work['obra']} - libro {libro_index} ({libro_root}): {len(items)} candidatos", flush=True)
            capitulo = 0
            for _, chapter_id, title, paragraphs in items:
                if title in FRONT_MATTER_TITLES: continue
                source = "\n\n".join(paragraphs).strip()
                if len(source) < 40: continue
                fingerprint = hashlib.sha256(clean_text(source).encode()).hexdigest()
                if fingerprint in seen: continue
                seen.add(fingerprint)
                capitulo += 1
                year_start, year_end = work["anios"]
                entry_id = f"npnf105-{work['slug']}-l{libro_index}-c{capitulo}"
                raw_entries.append({
                    "id": entry_id, "sourceTitle": title, "source": source,
                    "autor": "Agustín de Hipona", "obra": work["obra"], "libro": libro_index, "capitulo": capitulo,
                    "personas": extract_people(title + "\n" + source), "eventos": [],
                    "periodo": f"{year_start}–{year_end}" if year_start != year_end else str(year_start),
                    "epoca": "era_patristica", "anioInicio": year_start, "anioFin": year_end,
                    "sourceUrl": f"{BASE}{VOLUME}.{chapter_id}.html",
                    "sourceFingerprint": fingerprint,
                })

    def translate_entry(raw):
        entry = {key: value for key, value in raw.items() if key != "source"}
        if args.skip_translate:
            entry["title"] = f"{raw['autor']}, {raw['obra']}, Libro {raw['libro']}, Capítulo {raw['capitulo']} — {raw['sourceTitle']}"
            entry["excerpt"] = re.sub(r"\s+", " ", raw["source"])[:280].rstrip() + ("…" if len(raw["source"]) > 280 else "")
            entry["content"] = "".join(f"<p>{html.escape(p)}</p>" for p in raw["source"].split("\n\n") if p.strip())
            return entry
        title_es = translate(raw["sourceTitle"], translations); body_es = translate(raw["source"], translations)
        entry["title"] = f"{raw['autor']}, {raw['obra']}, Libro {raw['libro']}, Capítulo {raw['capitulo']} — {title_es}"
        entry["excerpt"] = re.sub(r"\s+", " ", body_es)[:280].rstrip() + ("…" if len(body_es) > 280 else "")
        entry["content"] = "".join(f"<p>{html.escape(p)}</p>" for p in body_es.split("\n\n") if p.strip())
        return entry

    entries = []
    translation_path.parent.mkdir(parents=True, exist_ok=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=max(1, args.workers)) as executor:
        for index, entry in enumerate(executor.map(translate_entry, raw_entries), 1):
            entries.append(entry)
            if not args.skip_translate and (index % 10 == 0 or index == len(raw_entries)):
                with CACHE_LOCK: translation_path.write_text(json.dumps(translations, ensure_ascii=False), encoding="utf-8")
            if index % 25 == 0 or index == len(raw_entries):
                print(f"[{index:04d}/{len(raw_entries)}] {entry['obra']} l{entry['libro']}c{entry['capitulo']}", flush=True)

    output.mkdir(parents=True, exist_ok=True)
    (output / "entries.json").write_text(json.dumps({"entries": entries}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    manifest = {
        "schemaVersion": 2, "id": "npnf105-agustin-antipelagianos", "type": "churchHistory",
        "name": "Agustín de Hipona — Escritos Antipelagianos (NPNF1-05)",
        "abbreviation": "NPNF1-05", "language": "es",
        "author": "Agustín de Hipona",
        "editor": "Philip Schaff", "translator": "Traducción automática editorial de Verbo desde el texto inglés de NPNF1-05",
        "year": 1887, "coverage": {"start": 411, "end": 429},
        "description": "Los trece escritos antipelagianos completos de Agustín de Hipona sobre el pecado original, la gracia y la predestinación, segmentados por obra, libro y capítulo.",
        "license": "Dominio público. Traducción propia desde la edición inglesa NPNF1-05.",
        "sourceUrl": "https://www.ccel.org/ccel/schaff/npnf105.html",
        "entriesFile": "entries.json", "totalEntries": len(entries),
    }
    (output / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Total: {len(entries)} entradas", flush=True)


if __name__ == "__main__": main()
