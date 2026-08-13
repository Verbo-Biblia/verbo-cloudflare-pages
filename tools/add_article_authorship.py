#!/usr/bin/env python3
"""Añade o valida la autoría estructurada de las piezas propias de Verbo.

Es deliberadamente idempotente: no modifica el cuerpo editorial y solo actúa
sobre las páginas que todavía no tienen ``data-author``.
"""
from pathlib import Path
import re


ROOT = Path(__file__).resolve().parent.parent
AUTHOR = "Juan José Venegas"
COLLECTIONS = (
    (ROOT / "recursos" / "articulos-y-reflexiones", "Autor"),
    (ROOT / "recursos" / "articles-and-reflections-en", "Author"),
)


def update_page(path: Path, label: str) -> bool:
    html = path.read_text(encoding="utf-8")
    original = html
    html = re.sub(r"recursos\.css\?v=[^\"']+", "recursos.css?v=20260813-compact-catalog-headings", html)
    if "data-author=" in html:
        if html != original:
            path.write_text(html, encoding="utf-8")
            return True
        return False
    article_marker = "<article "
    if article_marker not in html:
        raise RuntimeError(f"Falta <article> en {path.relative_to(ROOT)}")
    html = html.replace(article_marker, f'<article data-author="{AUTHOR}" ', 1)
    nav_marker = '      <hr>\n      <p class="lesson-nav">'
    if nav_marker not in html:
        raise RuntimeError(f"Falta pie de navegación esperado en {path.relative_to(ROOT)}")
    footer = (
        '      <footer class="article-attribution">\n'
        f'        <p><span data-i18n="articleMeta.author">{label}</span>: '
        f'<strong>{AUTHOR}</strong></p>\n'
        '      </footer>\n\n'
    )
    html = html.replace(nav_marker, footer + nav_marker, 1)
    path.write_text(html, encoding="utf-8")
    return True


def main() -> None:
    changed = 0
    seen = 0
    for base, label in COLLECTIONS:
        for path in sorted(base.glob("*/index.html")):
            seen += 1
            changed += update_page(path, label)
    print(f"Autoría propia: {seen} páginas verificadas; {changed} actualizadas.")


if __name__ == "__main__":
    main()
