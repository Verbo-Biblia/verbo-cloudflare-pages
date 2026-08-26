#!/usr/bin/env python3
"""Import Chrysostom's Homilies on the Gospel of Matthew (NPNF1-10, CCEL).

Two outputs from one parse, per Juan's correction: Chrysostom is a Church
Father, so this belongs to the "Padres Apostólicos" architecture, not the
plain commentary list — but it still syncs into the per-verse system like
every other patristic work already does (Ignacio, Policarpo, etc.):

  - biblia/modules/patristic/chrysostom-mateo-<n>/   full homily text,
    "sections" schema, split into several volumes (one CCEL volume is
    ~2.5MB raw; the existing patristic corpus tops out around 10KB, so a
    single sections.json here would be a real mobile-load regression).
  - biblia/modules/commentaries/chrysostom-mateo/    the SAME homilies
    sliced onto Verbo's book/chapter/verse commentary schema, registered
    only under registry.json's patristicByVerse (never under
    "commentaries" — that list is for the Reformation/Protestant-era
    commentary shelf), one entry per homily (never split further: "una
    homilía = una entrada" per the brief).

Reference resolution
---------------------
Each <div2 type="Homily"> in CCEL's ThML/XML carries TWO independent
structured citations, which sometimes disagree (see PROVENANCE.md):

  1. A <scripCom type="Sermon" parsed="..."> as the div2's first child —
     CCEL's own "what this sermon covers" annotation. Its `parsed` value
     can be compound (semicolon-separated) when the citation is
     discontinuous (e.g. "16,18" instead of a real 16-17-18 range).
  2. A <scripRef parsed="..."> inside the citation paragraph that follows
     the "Homily N." heading — the parsed printed heading itself (e.g.
     "Matt. XXV. 1-30").

The printed heading (2) is what a reader actually sees atop the homily, so
it is used as the primary source; (1) is the fallback for the rare homily
that has no separate citation paragraph (Homily LXXI in this volume).

When a homily's own citation is a single point (no explicit end), the
range is closed using the transition to the next homily's own start:
same chapter -> end at (next start - 1); next homily starts a later
chapter -> end at the last verse of the current chapter (from the local
KJV text, not invented). If the next homily's start is not after the
current one (Chrysostom revisits Matt. 10:7-9 in Homily XXXVII, after
already reaching ch. 11 in Homily XXXVI) the range is left as a single
verse and flagged in coverage.json/PROVENANCE.md rather than guessed.
"""

from __future__ import annotations

import argparse
import hashlib
import html as html_std
import json
import re
import urllib.request
from pathlib import Path

from lxml import etree

ROOT = Path(__file__).resolve().parent.parent
XML_URL = "https://ccel.org/ccel/schaff/npnf110.xml"
SOURCE_SHA256 = "e110c98b1f444147bf7baf79e46e56ae6c6a1f0b2983e6fc52f2356fac7f858f"
SOURCE_BYTES = 3_956_654

PATRISTIC_ROOT = ROOT / "biblia/modules/patristic"
COMMENTARY_ROOT = ROOT / "biblia/modules/commentaries" / "chrysostom-mateo"
KJV_BOOK = ROOT / "biblia/modules/bibles/kjv-strong/books/MAT.json"

AUTHOR = "Juan Crisóstomo (c. 349–407)"
TRANSLATOR = "Sir George Prevost, revisado por M. B. Riddle, NPNF1-10 (1888)"
VOLUME_CHUNKS = 6  # ~14-15 homilías por volumen (~350-450KB), ver PROVENANCE.md


def fetch_source(cache: Path) -> Path:
    cache.mkdir(parents=True, exist_ok=True)
    target = cache / "npnf110.xml"
    if not target.exists():
        request = urllib.request.Request(XML_URL, headers={"User-Agent": "Verbo-Chrysostom-import/1.0"})
        with urllib.request.urlopen(request) as response:
            target.write_bytes(response.read())
    raw = target.read_bytes()
    digest = hashlib.sha256(raw).hexdigest()
    if digest != SOURCE_SHA256 or len(raw) != SOURCE_BYTES:
        raise SystemExit(f"Fuente CCEL inesperada: bytes={len(raw)}, sha256={digest}")
    return target


def last_verse_of_chapter(chapter: int) -> int:
    chapters = json.loads(KJV_BOOK.read_text(encoding="utf-8"))["chapters"]
    return max(int(v) for v in chapters[str(chapter)])


def text_excluding_notes(p: etree._Element) -> str:
    """A paragraph's own text, skipping any nested <note> subtree at any
    depth — some headings/citations carry an inline editorial aside right
    after the number ("Homily XX.[Or Homily XXI. in the Latin
    versions...]") or wrapped inside a <span> alongside the <scripRef>
    (Homily LXXV), which would otherwise break an exact-text match against
    the real heading/citation."""
    parts = [p.text or ""]
    for child in p:
        if child.tag != "note":
            parts.append(text_excluding_notes(child))
        parts.append(child.tail or "")
    return "".join(parts)


def find_heading_index(paragraphs: list[etree._Element]) -> int | None:
    """Index of the "Homily N." heading paragraph. Homily I's div2 uniquely
    carries the whole volume's title page (name, author, book title) before
    its own heading; every other homily's heading is paragraph 0."""
    for i, p in enumerate(paragraphs):
        if re.match(r"^\s*Homily\s+[IVXLCDM]+\.?\s*$", text_excluding_notes(p)):
            return i
    return None


def parse_own_reference(div2: etree._Element) -> tuple[int, int, int, int] | None:
    """Returns (chapterStart, verseStart, chapterEnd, verseEnd) as declared by
    the homily's own citation, or None for a homily with no citation at all
    (the general introductory Homily I)."""
    paragraphs = div2.findall("p")
    heading_idx = find_heading_index(paragraphs)
    citation_p = paragraphs[heading_idx + 1] if heading_idx is not None and heading_idx + 1 < len(paragraphs) else None
    scrip_ref = citation_p.find(".//scripRef") if citation_p is not None else None
    if scrip_ref is not None and citation_p is not None:
        # Only trust this paragraph as "just the citation" if it has no
        # other substantial text alongside the scripRef (guards against a
        # body paragraph that happens to embed a cross-reference).
        stripped = text_excluding_notes(citation_p).strip()
        ref_text = "".join(scrip_ref.itertext()).strip()
        if len(stripped) <= len(ref_text) + 3:
            # parsed = "|Matt|C1|V1|C2|V2" -> 6 fields once split on "|"
            parts = scrip_ref.get("parsed", "").split("|")
            if len(parts) >= 6:
                c1, v1, c2, v2 = int(parts[2]), int(parts[3]), int(parts[4]), int(parts[5])
                if c2 and v2:
                    return (c1, v1, c2, v2)
                return (c1, v1, 0, 0)

    scrip_com = div2.find("scripCom")
    if scrip_com is not None:
        parsed = scrip_com.get("parsed", "")
        points: list[tuple[int, int]] = []
        ends: list[tuple[int, int]] = []
        for chunk in parsed.split(";"):
            fields = chunk.split("|")
            if len(fields) < 6:
                continue
            c1, v1, c2, v2 = int(fields[2]), int(fields[3]), int(fields[4]), int(fields[5])
            points.append((c1, v1))
            ends.append((c2, v2) if c2 and v2 else (c1, v1))
        if points:
            start = min(points)
            end = max(ends)
            return (start[0], start[1], end[0], end[1])

    return None


def resolve_references(homilies: list[dict]) -> None:
    own = [parse_own_reference(h["div2"]) for h in homilies]
    for i, ref in enumerate(own):
        if ref is None:
            homilies[i]["reference"] = (0, 0, 0, 0)
            homilies[i]["introduction"] = True
            homilies[i]["openEnded"] = False
            continue
        c1, v1, c2, v2 = ref
        homilies[i]["introduction"] = False
        if c2 and v2:
            homilies[i]["reference"] = (c1, v1, c2, v2)
            homilies[i]["openEnded"] = False
            continue
        # Open-ended: close it using the transition to the next homily with
        # its own explicit start (skip past Homily I, which has none).
        next_start = None
        for j in range(i + 1, len(homilies)):
            nref = own[j]
            if nref is not None:
                next_start = (nref[0], nref[1])
                break
        if next_start is not None and next_start > (c1, v1):
            nc, nv = next_start
            if nc == c1:
                end_v = nv - 1
                if end_v >= v1:
                    homilies[i]["reference"] = (c1, v1, c1, end_v)
                    homilies[i]["openEnded"] = False
                    continue
            else:
                homilies[i]["reference"] = (c1, v1, c1, last_verse_of_chapter(c1))
                homilies[i]["openEnded"] = False
                continue
        # No safe transition (regression, e.g. Homily XXXVI before
        # Homily XXXVII revisits Matt. 10) or this is the final homily
        # without an explicit end: do not invent a range.
        homilies[i]["reference"] = (c1, v1, c1, v1)
        homilies[i]["openEnded"] = True


class Cleaner:
    def __init__(self):
        pass

    def inline(self, node: etree._Element) -> str:
        parts: list[str] = []
        if node.text:
            parts.append(html_std.escape(node.text))
        for child in node:
            tag = child.tag.lower() if isinstance(child.tag, str) else ""
            if tag == "scripref":
                parts.append(html_std.escape("".join(child.itertext())))
            elif tag == "i":
                parts.append(f"<em>{self.inline(child)}</em>")
            elif tag in {"b", "hi"}:
                parts.append(f"<strong>{self.inline(child)}</strong>")
            elif tag == "sup":
                # <sup> isn't in Verbo's allowed commentary tag set
                # (tools/validate_commentary_module.py ALLOWED_TAGS); keep
                # the text plainly instead of dropping it.
                parts.append(self.inline(child))
            elif tag == "span":
                parts.append(self.inline(child))
            elif tag == "a":
                parts.append(self.inline(child))
            elif tag in {"br"}:
                parts.append(" ")
            elif tag in {"pb", "note"}:
                # Dropped inline (notes are collected separately by
                # notes()); a bare space keeps the surrounding words from
                # running together, e.g. "For<note/>we" -> "For we".
                parts.append(" ")
            else:
                parts.append(self.inline(child))
            if child.tail:
                parts.append(html_std.escape(child.tail))
        value = "".join(parts)
        value = re.sub(r"\s+", " ", value)
        value = re.sub(r"\s+([,.;:?!’”])", r"\1", value)
        return value.strip()

    def plain(self, node: etree._Element) -> str:
        """Derived from inline(): same note/pb exclusion, same whitespace
        handling, just stripped of the HTML tags inline() adds — for the
        plain-text patristic reader (its nl2p() escapes whatever it gets,
        so no markup must survive here)."""
        html_value = self.inline(node)
        text = re.sub(r"<[^>]+>", "", html_value)
        return html_std.unescape(text)

    def notes(self, node: etree._Element) -> list[str]:
        result = []
        for note in node.findall(".//note"):
            content = " ".join(self.plain(p) for p in note.findall("p") if self.plain(p))
            if content:
                result.append(content)
        return result

    def paragraph_html(self, p: etree._Element) -> str:
        value = self.inline(p)
        return f"<p>{value}</p>" if value else ""

    def paragraph_plain(self, p: etree._Element) -> str:
        return self.plain(p)


def is_epigraph(p: etree._Element, cleaner: Cleaner) -> bool:
    text = cleaner.plain(p)
    if not text.startswith("“"):
        return False
    italic_chars = sum(len("".join(i.itertext())) for i in p.findall(".//i"))
    return italic_chars >= max(1, len(text) - 40)


def is_heading_or_citation(p: etree._Element) -> bool:
    text = text_excluding_notes(p).strip()
    if re.match(r"^Homily\s+[IVXLCDM]+\.?$", text):
        return True
    scrip_ref = p.find(".//scripRef")
    if scrip_ref is not None:
        ref_text = "".join(scrip_ref.itertext()).strip()
        if len(text) <= len(ref_text) + 3:
            return True
    return False


def body_paragraphs(div2: etree._Element, cleaner: Cleaner) -> list[etree._Element]:
    paragraphs = div2.findall("p")
    heading_idx = find_heading_index(paragraphs)
    # Everything before the "Homily N." heading is front matter (Homily I's
    # div2 carries the whole volume's title page ahead of its own heading);
    # a homily with no heading at all (none in this volume) starts at 0.
    idx = heading_idx if heading_idx is not None else 0
    # Skip heading + citation paragraph(s).
    while idx < len(paragraphs) and is_heading_or_citation(paragraphs[idx]):
        idx += 1
    # Skip contiguous epigraph (quoted Scripture) paragraphs.
    while idx < len(paragraphs) and is_epigraph(paragraphs[idx], cleaner):
        idx += 1
    return paragraphs[idx:]


def build_homily_content(div2: etree._Element, cleaner: Cleaner) -> tuple[str, str]:
    """Returns (html_content, plain_content) for the body, footnotes appended
    at the end of both."""
    paragraphs = body_paragraphs(div2, cleaner)
    html_parts = [cleaner.paragraph_html(p) for p in paragraphs]
    html_parts = [p for p in html_parts if p]
    plain_parts = [cleaner.paragraph_plain(p) for p in paragraphs]
    plain_parts = [p for p in plain_parts if p]

    all_notes: list[str] = []
    for p in paragraphs:
        all_notes.extend(cleaner.notes(p))
    if all_notes:
        html_parts.append("<p><strong>Notas del editor (NPNF1-10):</strong></p>")
        html_parts.extend(f"<p>{html_std.escape(n)}</p>" for n in all_notes)
        plain_parts.append("Notas del editor (NPNF1-10):")
        plain_parts.extend(all_notes)

    return "".join(html_parts), "\n\n".join(plain_parts)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--cache", type=Path, default=Path("/tmp/verbo-chrysostom-npnf110"))
    args = parser.parse_args()

    source = fetch_source(args.cache)
    xml_parser = etree.XMLParser(recover=True, resolve_entities=False, no_network=True, load_dtd=False)
    tree = etree.parse(str(source), xml_parser)
    root = tree.getroot()
    div2s = root.findall('.//div2[@type="Homily"]')
    if len(div2s) != 86:
        raise SystemExit(f"Se esperaban 86 homilías, se encontraron {len(div2s)}")

    homilies = [{"div2": d, "n": d.get("n")} for d in div2s]
    resolve_references(homilies)

    cleaner = Cleaner()
    open_ended_flags = []
    for i, h in enumerate(homilies):
        html_content, plain_content = build_homily_content(h["div2"], cleaner)
        h["html"] = html_content
        h["plain"] = plain_content
        c1, v1, c2, v2 = h["reference"]
        if h["introduction"]:
            title = f"Homilía {h['n']}"
        elif c1 == c2 and v1 == v2:
            title = f"Homilía {h['n']} — Mateo {c1}:{v1}"
        else:
            title = f"Homilía {h['n']} — Mateo {c1}:{v1}–{c2}:{v2}"
        h["title"] = title
        if h.get("openEnded"):
            open_ended_flags.append({"n": h["n"], "title": title, "reference": h["reference"]})

    # ---- Commentary (per-verse, patristicByVerse) ----
    entries = []
    for i, h in enumerate(homilies, start=1):
        c1, v1, c2, v2 = h["reference"]
        entries.append({
            "id": f"chrysostom-mat-hom-{h['n'].lower()}",
            "title": h["title"],
            "author": AUTHOR,
            "reference": {"book": "MAT", "chapterStart": c1, "verseStart": v1, "chapterEnd": c2, "verseEnd": v2},
            "content": h["html"] if h["html"] else "<p>(Sin contenido expositivo separable del epígrafe.)</p>",
        })

    COMMENTARY_ROOT.mkdir(parents=True, exist_ok=True)
    books_dir = COMMENTARY_ROOT / "books"
    books_dir.mkdir(exist_ok=True)
    (books_dir / "MAT.json").write_text(
        json.dumps({"book": "MAT", "entries": entries}, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    commentary_manifest = {
        "schemaVersion": 2,
        "id": "chrysostom-mateo",
        "type": "commentary",
        "name": "Juan Crisóstomo — Homilías sobre Mateo",
        "abbreviation": "Crisóstomo",
        "language": "en",
        "author": AUTHOR,
        "translator": TRANSLATOR,
        "description": "Las 86 homilías de Crisóstomo sobre el Evangelio de Mateo, ancladas verso a verso. Una homilía = una entrada; el rango de cada una se toma del encabezado impreso original y, cuando este no da un final explícito, de la transición a la siguiente homilía.",
        "license": "Dominio público — Nicene and Post-Nicene Fathers, Series I, Vol. X (1888)",
        "licenseUrl": "https://ccel.org/ccel/schaff/npnf110",
        "sourceUrl": "https://ccel.org/ccel/schaff/npnf110.xml",
        "sourceEdition": "Christian Literature Publishing Co., New York, 1886/1888; CCEL ThML/XML, versión 3.0",
        "publicationYear": 1888,
        "publicDomain": True,
        "attribution": "Traducción inglesa: Sir George Prevost, revisada por M. B. Riddle. Nicene and Post-Nicene Fathers, ed. Philip Schaff. Digitalización: Christian Classics Ethereal Library (CCEL).",
        "notes": f"Epígrafes de texto bíblico citado (bloques íntegramente en cursiva que preceden a cada homilía) excluidos por redundantes con la Biblia de Verbo; citas integradas en la exposición se conservan. Notas editoriales de NPNF1-10 (críticas textuales, variantes griegas) conservadas al final de cada entrada. {len(open_ended_flags)} homilías (ver PROVENANCE.md) no tienen un final de rango explícito en el encabezado original ni una transición segura a la siguiente homilía; se registran como un solo versículo en vez de inventar un cierre.",
        "books": [{"id": "MAT", "name": "Mateo", "number": 40, "file": "books/MAT.json", "indexFile": "books/MAT.index.json"}],
    }
    (COMMENTARY_ROOT / "manifest.json").write_text(
        json.dumps(commentary_manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    # Índice liviano (id+reference, sin content) para que buildChapterData()
    # calcule el badge por versículo sin bajar los 2,5MB completos — mismo
    # patrón que tools/build_commentary_index.py usa para "commentaries",
    # extendido aquí a mano porque ese script solo recorre
    # registry.commentaries y este módulo vive en patristicByVerse (ver
    # PROVENANCE.md). Requiere el cambio en loadLinkedEntries()
    # (assets/module-loader.js) que acepta {lightweight:true}.
    index_entries = [{"id": e["id"], "reference": e["reference"]} for e in entries]
    (books_dir / "MAT.index.json").write_text(
        json.dumps({"entries": index_entries}, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    coverage = {
        "module": "chrysostom-mateo",
        "books": [{
            "book": "MAT",
            "chapters": sorted({e["reference"]["chapterStart"] for e in entries if e["reference"]["chapterStart"] > 0}),
            "entries": len(entries),
            "introductionEntries": sum(e["reference"]["chapterStart"] == 0 for e in entries),
            "openEndedEntries": len(open_ended_flags),
            "bytes": (books_dir / "MAT.json").stat().st_size,
        }],
        "openEndedHomilies": open_ended_flags,
    }
    (COMMENTARY_ROOT / "coverage.json").write_text(
        json.dumps(coverage, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    # ---- Patristic (full-text reader), split into VOLUME_CHUNKS volumes ----
    chunk_size = -(-len(homilies) // VOLUME_CHUNKS)  # ceil
    chunks = [homilies[i:i + chunk_size] for i in range(0, len(homilies), chunk_size)]
    shelf_entries = []
    for vol_idx, chunk in enumerate(chunks, start=1):
        first_ref, last_ref = chunk[0]["reference"], chunk[-1]["reference"]
        vol_id = f"chrysostom-mateo-{vol_idx}"
        vol_dir = PATRISTIC_ROOT / vol_id
        vol_dir.mkdir(parents=True, exist_ok=True)
        sections = []
        for local_n, h in enumerate(chunk, start=1):
            sections.append({
                "n": local_n,
                "title": h["title"],
                "book_num": 1,
                "section_label": f"Homilía {h['n']}",
                "content": h["plain"] if h["plain"] else "(Sin contenido expositivo separable del epígrafe.)",
            })
        (vol_dir / "sections.json").write_text(
            json.dumps({"sections": sections}, ensure_ascii=False) + "\n", encoding="utf-8"
        )
        range_label = f"Homilías {chunk[0]['n']}–{chunk[-1]['n']}"
        manifest = {
            "schemaVersion": 2,
            "id": vol_id,
            "type": "patristic",
            "name": f"Juan Crisóstomo — Homilías sobre Mateo, vol. {vol_idx} ({range_label})",
            "abbreviation": f"Crisóstomo Mateo {vol_idx}",
            "language": "en",
            "author": AUTHOR,
            "translator": TRANSLATOR,
            "year": 388,
            "description": f"{range_label} de las 86 homilías de Crisóstomo sobre Mateo (predicadas c. 390 d.C. en Antioquía). Dividido en {VOLUME_CHUNKS} volúmenes por tamaño: el volumen NPNF1-10 completo son ~2,5 MB de texto, muy por encima de cualquier otra obra patrística ya cargada en Verbo.",
            "license": "Dominio público — Nicene and Post-Nicene Fathers, Series I, Vol. X (1888)",
            "sourceUrl": "https://ccel.org/ccel/schaff/npnf110.xml",
            "sourceFormat": "ThML/XML (CCEL), convertido con tools/import_chrysostom_matthew.py",
            "sectionsFile": "sections.json",
            "totalSections": len(sections),
        }
        (vol_dir / "manifest.json").write_text(
            json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
        shelf_entries.append({
            "id": vol_id,
            "titulo": f"Juan Crisóstomo — Homilías sobre Mateo, vol. {vol_idx} ({range_label})",
            "periodo": "c. 390 d.C.",
            "resumenBreve": f"{range_label}: predicadas por Crisóstomo en Antioquía, exponiendo el Evangelio de Mateo versículo a versículo.",
            "cover": "assets/patristic/covers/chrysostom-mateo.svg",
        })
        print(f"  {vol_id}: {len(sections)} secciones, {(vol_dir / 'sections.json').stat().st_size} bytes")

    (Path("/tmp/chrysostom-shelf-entries.json")).write_text(json.dumps(shelf_entries, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"\nchrysostom-mateo (commentary): {len(entries)} entries, {(books_dir / 'MAT.json').stat().st_size} bytes")
    print(f"open-ended (no safe range close): {len(open_ended_flags)}")
    for f in open_ended_flags:
        print("  ", f)


if __name__ == "__main__":
    main()
