#!/usr/bin/env python3
"""Agrega meta tags og:title/og:description/og:url/og:locale/og:type a las
páginas estáticas bilingües del sitio, copiando el texto que cada archivo ya
tiene en <title> y <meta name="description"> — no traduce ni redacta nada
nuevo. También corrige <link rel="canonical"> en las páginas EN de
recursos/articles-and-reflections-en/ que hoy apuntan a la URL en español.

Alcance (ver Paso 0 / investigación previa — nunca hay og: tags en el repo):
  - recursos/articulos-y-reflexiones/**/index.html
  - recursos/articles-and-reflections-en/**/index.html (excepto el stub de
    redirección recursos/articles-and-reflections-en/index.html, detectado
    por tener <meta http-equiv="refresh">: no es contenido real, su
    canonical apunta a ES a propósito)
  - libreria/*/index.html (un solo nivel; libreria/index.html queda fuera,
    igual que en el alcance pedido)

Idempotente: si un archivo ya tiene og:title, se salta sin tocarlo.
"""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://verbobiblia.com"

TITLE_RE = re.compile(r"<title[^>]*>(.*?)</title>", re.DOTALL)
DESC_RE = re.compile(r'<meta\s+name="description"[^>]*\bcontent="([^"]*)"[^>]*>')
LANG_RE = re.compile(r'<html\s+lang="([^"]+)"')
CANON_RE = re.compile(r'(<link\s+rel="canonical"\s+href=")([^"]+)("\s*>)')
OG_PRESENT_RE = re.compile(r'property="og:title"')
REDIRECT_STUB_RE = re.compile(r'http-equiv="refresh"', re.IGNORECASE)

LOCALE_BY_LANG = {"es": "es_ES", "en": "en_US"}


def attr_escape(text):
    return text.replace('"', "&quot;")


def own_url(path: Path) -> str:
    rel_dir = path.parent.relative_to(ROOT).as_posix()
    return f"{SITE}/{rel_dir}/"


def collect_targets():
    targets = []

    for f in sorted((ROOT / "recursos" / "articulos-y-reflexiones").glob("**/index.html")):
        targets.append(f)

    for f in sorted((ROOT / "recursos" / "articles-and-reflections-en").glob("**/index.html")):
        text = f.read_text(encoding="utf-8")
        if REDIRECT_STUB_RE.search(text):
            print(f"SKIP (stub de redirección, no es contenido real): {f.relative_to(ROOT)}")
            continue
        targets.append(f)

    for f in sorted((ROOT / "libreria").glob("*/index.html")):
        targets.append(f)

    return targets


def process(path: Path, stats: dict):
    text = path.read_text(encoding="utf-8")

    if OG_PRESENT_RE.search(text):
        stats["already_done"].append(path)
        return

    title_m = TITLE_RE.search(text)
    desc_m = DESC_RE.search(text)
    lang_m = LANG_RE.search(text)

    if not title_m or not lang_m:
        stats["missing_basics"].append(path)
        return
    if not desc_m:
        stats["missing_description"].append(path)
        return

    title = title_m.group(1).strip()
    description = desc_m.group(1)
    lang = lang_m.group(1)
    locale = LOCALE_BY_LANG.get(lang)
    if not locale:
        stats["unknown_lang"].append(path)
        return

    url = own_url(path)

    # Corrige el canonical de las páginas EN de recursos que hoy apunta a ES.
    canon_m = CANON_RE.search(text)
    if canon_m and "articles-and-reflections-en" in str(path) and canon_m.group(2) != url:
        text = text[: canon_m.start()] + canon_m.group(1) + url + canon_m.group(3) + text[canon_m.end():]
        stats["canonical_fixed"].append(path)

    og_block = (
        f'<meta property="og:title" content="{attr_escape(title)}">\n'
        f'<meta property="og:description" content="{attr_escape(description)}">\n'
        f'<meta property="og:url" content="{url}">\n'
        f'<meta property="og:locale" content="{locale}">\n'
        f'<meta property="og:type" content="article">'
    )

    desc_m2 = DESC_RE.search(text)
    insert_at = desc_m2.end()
    text = text[:insert_at] + "\n" + og_block + text[insert_at:]

    path.write_text(text, encoding="utf-8")
    stats["touched"].append(path)


def main():
    stats = {
        "touched": [],
        "already_done": [],
        "missing_description": [],
        "missing_basics": [],
        "unknown_lang": [],
        "canonical_fixed": [],
    }

    for f in collect_targets():
        process(f, stats)

    print()
    print(f"Archivos modificados:      {len(stats['touched'])}")
    print(f"Ya tenían og: (sin tocar): {len(stats['already_done'])}")
    print(f"Canonical EN corregido:    {len(stats['canonical_fixed'])}")
    if stats["missing_description"]:
        print(f"\nSin <meta name=\"description\"> (NO tocados, revisar aparte):")
        for f in stats["missing_description"]:
            print(f"  - {f.relative_to(ROOT)}")
    if stats["missing_basics"]:
        print(f"\nSin <title> o <html lang> (NO tocados, revisar aparte):")
        for f in stats["missing_basics"]:
            print(f"  - {f.relative_to(ROOT)}")
    if stats["unknown_lang"]:
        print(f"\nlang= desconocido (NO tocados):")
        for f in stats["unknown_lang"]:
            print(f"  - {f.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
