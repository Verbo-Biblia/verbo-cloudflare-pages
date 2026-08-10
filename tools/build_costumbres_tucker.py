#!/usr/bin/env python3
"""Build modules/costumbres/tucker-roman-world/entries.json from the real text
of T. G. Tucker, "Life in the Roman World of Nero and St. Paul" (1910/1924,
public domain).

Source: Project Gutenberg ebook #12875 (proofread volunteer transcription of
the original edition). This script only extracts and lightly cleans that real
text; it never generates or paraphrases content attributed to Tucker (see
AGENTS.md).

The book is a flat sequence: Introduction, then Chapters I-XXIII (roman
numerals), each opening with a "CHAPTER <roman>" heading immediately followed
by either another heading or (only for Chapter XIII, a known quirk of this
edition) a plain paragraph carrying the chapter title. Unlike Freeman's
verse-indexed handbook, Tucker's chapters have no biblical anchor, so entries
use "navegacion": "tematico" (capituloNumero/capituloTitulo) instead of
libro/capitulo/versiculo — see manifest.json and app.js's renderCostumbresIndex.
"""

from __future__ import annotations

import argparse
import html
import json
import re
import unicodedata
import urllib.request
from pathlib import Path

SOURCE_URL = "https://www.gutenberg.org/cache/epub/12875/pg12875.html"

ROMAN_TO_INT = {
    "I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6, "VII": 7, "VIII": 8,
    "IX": 9, "X": 10, "XI": 11, "XII": 12, "XIII": 13, "XIV": 14, "XV": 15,
    "XVI": 16, "XVII": 17, "XVIII": 18, "XIX": 19, "XX": 20, "XXI": 21,
    "XXII": 22, "XXIII": 23,
}

CHAPTER_RE = re.compile(r'<h[2-6][^>]*>\s*CHAPTER\s+([IVXLCDM]+)\s*</h[2-6]>', re.I)
INTRO_RE = re.compile(r'<h[2-6][^>]*>\s*INTRODUCTION\s*</h[2-6]>', re.I)
INDEX_RE = re.compile(r'<h[2-6][^>]*>\s*INDEX\s*</h[2-6]>', re.I)
# Title immediately after a CHAPTER heading: normally another heading tag,
# but Chapter XIII's title landed in a plain <p> in this edition — accept both.
TITLE_RE = re.compile(r'\s*<(h[2-6]|p)[^>]*>(.*?)</\1>', re.S)
PARA_RE = re.compile(r'<p[^>]*>(.*?)</p>', re.S)


def fetch(url, path):
    if path.exists():
        return path.read_text(encoding="utf-8", errors="replace")
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Verbo costumbres indexer/1.0)"})
    with urllib.request.urlopen(req, timeout=60) as response:
        data = response.read()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    return data.decode("utf-8", errors="replace")


def clean_text(text):
    text = html.unescape(text)
    text = unicodedata.normalize("NFC", text).replace("\xa0", " ").replace("‑", "-")
    text = re.sub(r"[ \t\r\f\v]+", " ", text)
    return text.strip()


def clean_inline_html(fragment):
    """Body paragraphs here only ever contain <i> (Latin terms, book titles)
    and <br> (verse-quotation line breaks) besides plain text — verified by
    inspecting every tag inside the chapter span before writing this. Strip
    attributes off those two and drop anything else defensively.

    This edition also has 126 plate captions inlined as bracketed plain text,
    e.g. "[Illustration: FIG. 1.—THE PONT DU GARD ...]" — there is no image
    file behind them, so they read as dangling noise in running prose; drop
    them rather than leave a bracketed non-sequitur in the middle of a sentence.
    (The actual bracket-stripping runs earlier, on the whole chapter span
    before it is split into paragraphs — see strip_illustrations — because a
    few of these captions are themselves split across two <p> tags.)"""
    text = html.unescape(fragment)
    text = re.sub(r"<br\s*/?>", "<br>", text, flags=re.I)
    text = re.sub(r"<i\b[^>]*>", "<i>", text, flags=re.I)
    text = re.sub(r"</i\s*>", "</i>", text, flags=re.I)
    text = re.sub(r"<(?!/?(?:i|br)\b)[^>]+>", "", text, flags=re.I)
    text = unicodedata.normalize("NFC", text).replace("\xa0", " ")
    text = re.sub(r"[ \t\r\f\v]+", " ", text)
    text = re.sub(r"\s+(<br>\s*)+", " ", text)  # trailing/mid stray <br> runs -> space
    return text.strip()


def strip_illustrations(span):
    """Remove bracketed plate captions from a raw chapter span, before it is
    split into paragraphs. Caption punctuation is inconsistent in this
    edition — "[Illustration: FIG. 1...]", bare "[Illustration]",
    "[Illustration FIG 66...]" (missing colon) — and a few captions are long
    enough to be split by the source across two separate <p> tags (e.g. FIG.
    19 in Chapter VII), so this must run on the whole span, not per-paragraph,
    or the closing "]" living in the next <p> is never found."""
    return re.sub(r"\[Illustration\b\s*:?[^\]]*\]", "", span, flags=re.I)


def extract_span(full_html, start, end, source_url, entry_id, capitulo_numero, capitulo_titulo_raw):
    span = strip_illustrations(full_html[start:end])
    body_paragraphs = []
    for m in PARA_RE.finditer(span):
        cleaned = clean_inline_html(m.group(1))
        cleaned = re.sub(r"^(<br>\s*)+", "", cleaned).strip()
        if cleaned and not re.fullmatch(r"(<br>\s*)*", cleaned):
            body_paragraphs.append(cleaned)
    if not body_paragraphs:
        return None

    titulo = clean_text(re.sub(r"<[^>]+>", "", capitulo_titulo_raw))
    content = "".join(f"<p>{p}</p>" for p in body_paragraphs)
    excerpt_source = clean_text(re.sub(r"<[^>]+>", "", " ".join(body_paragraphs)))
    excerpt = excerpt_source[:280].rstrip() + ("…" if len(excerpt_source) > 280 else "")

    return {
        "id": entry_id,
        "capituloNumero": capitulo_numero,
        "capituloTitulo": titulo,
        "titulo": titulo,
        "excerpt": excerpt,
        "content": content,
        "categoria": "roma_s1",
        "sourceUrl": source_url,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--cache", default="/tmp/costumbres-tucker-source")
    parser.add_argument("--output", default="biblia/modules/costumbres/tucker-roman-world")
    args = parser.parse_args()
    cache_dir = Path(args.cache)
    output = Path(args.output)

    full_html = fetch(SOURCE_URL, cache_dir / "pg12875.html")

    chapter_matches = list(CHAPTER_RE.finditer(full_html))
    if not chapter_matches:
        raise SystemExit("No se encontraron marcadores CHAPTER en el HTML fuente.")
    # "INTRODUCTION" also appears as a heading in the table of contents,
    # earlier in the file — take the last match before Chapter I, which is
    # the section's real heading.
    intro_candidates = [m for m in INTRO_RE.finditer(full_html) if m.start() < chapter_matches[0].start()]
    intro_m = intro_candidates[-1] if intro_candidates else None
    index_m = INDEX_RE.search(full_html, chapter_matches[-1].end())
    if not intro_m or not index_m:
        raise SystemExit("No se encontraron los marcadores esperados (INTRODUCTION/INDEX) en el HTML fuente.")

    entries = []

    # Introduction: from its own heading to the "CHAPTER I" heading.
    intro_entry = extract_span(
        full_html, intro_m.end(), chapter_matches[0].start(),
        SOURCE_URL, "tucker-intro", 0, "Introduction",
    )
    if intro_entry:
        entries.append(intro_entry)

    for i, m in enumerate(chapter_matches):
        roman = m.group(1).upper()
        num = ROMAN_TO_INT.get(roman)
        if num is None:
            print(f"  [aviso] numeral romano no reconocido: {roman!r} — capítulo omitido")
            continue

        title_m = TITLE_RE.match(full_html, m.end())
        if not title_m:
            print(f"  [aviso] no se encontró título tras CHAPTER {roman} — capítulo omitido")
            continue
        content_start = title_m.end()
        content_end = chapter_matches[i + 1].start() if i + 1 < len(chapter_matches) else index_m.start()

        entry = extract_span(
            full_html, content_start, content_end,
            SOURCE_URL, f"tucker-ch{num}", num, title_m.group(2),
        )
        if entry:
            entries.append(entry)
        else:
            print(f"  [aviso] capítulo {roman} sin párrafos de contenido — omitido")

    output.mkdir(parents=True, exist_ok=True)
    (output / "entries.json").write_text(
        json.dumps({"entries": entries}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    manifest_path = output / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest["totalEntries"] = len(entries)
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"\nTotal: {len(entries)} entradas (Introducción + {len(entries) - 1} capítulos esperados de 23).")


if __name__ == "__main__":
    main()
