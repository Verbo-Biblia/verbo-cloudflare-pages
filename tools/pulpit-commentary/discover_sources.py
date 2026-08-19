#!/usr/bin/env python3
"""Descubre las fichas y facsímiles públicos de The Pulpit Commentary.

La salida es un inventario de adquisición, no una autorización automática para
publicar: cada ficha debe declarar dominio público y cada PDF debe superar las
auditorías de OCR y estructura antes de incorporarse al módulo.
"""

from __future__ import annotations

import argparse
import html
import json
import re
from pathlib import Path
from urllib.parse import urljoin
from urllib.request import Request, urlopen


MASTER_URL = "https://biblicalstudies.gospelstudies.org.uk/commentaries_pulpit-commentary.php"

BOOKS = [
    ("GEN", "Genesis"), ("EXO", "Exodus"), ("LEV", "Leviticus"),
    ("NUM", "Numbers"), ("DEU", "Deuteronomy"), ("JOS", "Joshua"),
    ("JDG", "Judges"), ("RUT", "Ruth"), ("1SA", "1 Samuel"),
    ("2SA", "2 Samuel"), ("1KI", "1 Kings"), ("2KI", "2 Kings"),
    ("1CH", "1 Chronicles"), ("2CH", "2 Chronicles"), ("EZR", "Ezra"),
    ("NEH", "Nehemiah"), ("EST", "Esther"), ("JOB", "Job"),
    ("PSA", "Psalms"), ("PRO", "Proverbs"), ("ECC", "Ecclesiastes"),
    ("SNG", "Song of Songs"), ("ISA", "Isaiah"), ("JER", "Jeremiah"),
    ("LAM", "Lamentations"), ("EZK", "Ezekiel"), ("DAN", "Daniel"),
    ("HOS", "Hosea"), ("JOL", "Joel"), ("AMO", "Amos"),
    ("OBA", "Obadiah"), ("JON", "Jonah"), ("MIC", "Micah"),
    ("NAM", "Nahum"), ("HAB", "Habakkuk"), ("ZEP", "Zephaniah"),
    ("HAG", "Haggai"), ("ZEC", "Zechariah"), ("MAL", "Malachi"),
    ("MAT", "Matthew"), ("MRK", "Mark"), ("LUK", "Luke"),
    ("JHN", "John"), ("ACT", "Acts"), ("ROM", "Romans"),
    ("1CO", "1 Corinthians"), ("2CO", "2 Corinthians"),
    ("GAL", "Galatians"), ("EPH", "Ephesians"), ("PHP", "Philippians"),
    ("COL", "Colossians"), ("1TH", "1 Thessalonians"),
    ("2TH", "2 Thessalonians"), ("1TI", "1 Timothy"),
    ("2TI", "2 Timothy"), ("TIT", "Titus"), ("PHM", "Philemon"),
    ("HEB", "Hebrews"), ("JAS", "James"), ("1PE", "1 Peter"),
    ("2PE", "2 Peter"), ("1JN", "1 John"), ("2JN", "2 John"),
    ("3JN", "3 John"), ("JUD", "Jude"), ("REV", "Revelation"),
]

NAME_ALIASES = {
    "Song of Songs": ("Song of Songs", "Song of Solomon"),
    "Revelation": ("Revelation", "The Revelation"),
}


def fetch(url: str) -> str:
    request = Request(url, headers={"User-Agent": "Verbo source audit/1.0"})
    with urlopen(request, timeout=60) as response:
        return response.read().decode("utf-8", errors="replace")


def plain(fragment: str) -> str:
    fragment = re.sub(r"<[^>]+>", " ", fragment)
    return re.sub(r"\s+", " ", html.unescape(fragment)).strip()


def field(page: str, label: str) -> str:
    match = re.search(
        rf"{re.escape(label)}:\s*</[^>]+>(?:\s*<[^>]+>)*\s*([^<]+)",
        page,
        re.IGNORECASE,
    )
    return plain(match.group(1)) if match else ""


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()

    master = fetch(MASTER_URL)
    links = []
    for href, label in re.findall(r'<a\s+href="([^"]+)"[^>]*>(.*?)</a>', master, re.I | re.S):
        if not href.startswith("book_") or not href.endswith(".html"):
            continue
        links.append((urljoin(MASTER_URL, href), plain(label)))

    records = []
    missing = []
    for book_id, name in BOOKS:
        print(f"Revisando {name}...", flush=True)
        aliases = NAME_ALIASES.get(name, (name,))
        candidates = [item for item in links if any(item[1].startswith(alias + "—") for alias in aliases)]
        if not candidates:
            missing.append(name)
            continue
        page_url, label = candidates[0]
        page = fetch(page_url)
        pdfs = [
            urljoin(page_url, html.unescape(href))
            for href in re.findall(r'href="([^"]+\.pdf)"', page, re.I)
        ]
        author = label.split("—", 1)[1].strip() if "—" in label else field(page, "Author")
        copyright_holder = field(page, "Copyright Holder")
        if not copyright_holder.lower().startswith("public"):
            raise SystemExit(f"{name}: licencia inesperada: {copyright_holder!r}")
        if not pdfs:
            raise SystemExit(f"{name}: la ficha no contiene un facsímil PDF")
        records.append(
            {
                "id": book_id,
                "name": name,
                "author": author,
                "title": field(page, "Title"),
                "publicationYear": field(page, "Publication Year"),
                "publisher": field(page, "Publisher"),
                "bibliographicUrl": page_url,
                "facsimileUrls": list(dict.fromkeys(pdfs)),
                "license": "Public Domain",
                "licenseSourceValue": copyright_holder,
                "status": "source-catalogued",
            }
        )

    if missing:
        raise SystemExit("faltan fichas para: " + ", ".join(missing))
    if len(records) != 66:
        raise SystemExit(f"se esperaban 66 libros y se obtuvieron {len(records)}")

    payload = {
        "schemaVersion": 1,
        "collection": "The Pulpit Commentary",
        "editors": "H. D. M. Spence and Joseph S. Exell",
        "masterBibliography": MASTER_URL,
        "license": "Public Domain",
        "electronicEditionPolicy": (
            "Verbo derives its text only from the listed public-domain facsimiles; "
            "commercial electronic editions are excluded."
        ),
        "books": records,
    }
    args.output.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Inventario creado: {len(records)} libros, {sum(len(x['facsimileUrls']) for x in records)} PDF")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
