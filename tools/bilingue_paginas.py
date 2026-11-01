#!/usr/bin/env python3
"""Páginas de Recursos escritas en los dos idiomas (Juan, 31-10-2026: sin traducción en vivo).

Las lecciones de Escuela Dominical (4-7 y 8-10 años) y los Artículos y reflexiones tenían
<article data-i18n-strategy="auto">: se traducían en vivo con la API. Ahora:

  python3 tools/bilingue_paginas.py extraer <carpeta salida>   # bloques en español → <salida>/<ruta>.json
  python3 tools/bilingue_paginas.py aplicar                    # data/en-paginas/<ruta>.json → páginas bilingües

El inglés vive en data/en-paginas/<ruta de la página>.json: {"ruta": ..., "bloques": [{"es": ..., "en": ...}]}.
Cada bloque es el interior de un <p>, <h1-3>, <li> o <figcaption> del artículo (fuera de lo que genera
lecciones_escuela.py entre <!-- lec:gen --> … <!-- /lec:gen -->, que ya es bilingüe en ese generador).
Al aplicar, cada bloque queda como par: <p data-idioma="es">…</p><p data-idioma="en" lang="en">…</p>
y el artículo pasa a data-i18n-strategy="bilingue".
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EN_DIR = ROOT / 'data/en-paginas'
BLOQUE = re.compile(r'<(p|h1|h2|h3|li|figcaption)(\s[^>]*)?>(.*?)</\1>', re.S)
GEN = re.compile(r'<!-- lec:gen -->.*?<!-- /lec:gen -->', re.S)


# Páginas fijas escritas a mano (legales): su <main> entero, marcado con data-bilingue al aplicar.
FIJAS = ['privacidad', 'licencias']  # (las políticas de La Senda y Efatá ya traen sus dos mitades: se marcan aparte)


def paginas():
    for f in sorted(ROOT.glob('recursos/**/index.html')):
        t = f.read_text(encoding='utf-8')
        if re.search(r'<article\b[^>]*data-i18n-strategy="auto"', t):
            yield f, t
    for r in FIJAS:
        f = ROOT / r / 'index.html'
        t = f.read_text(encoding='utf-8')
        if re.search(r'<main\b(?![^>]*data-bilingue)[^>]*>', t):
            yield f, t


def articulo(t):
    m = re.search(r'(<article\b[^>]*data-i18n-strategy="auto"[^>]*>)(.*?)(</article>)', t, re.S)
    return m or re.search(r'(<main\b(?![^>]*data-bilingue)[^>]*>)(.*?)(</main>)', t, re.S)


def bloques(cuerpo):
    """(inicio, fin, tag, attrs, interior) de cada bloque traducible, saltando lo generado."""
    huecos = [(m.start(), m.end()) for m in GEN.finditer(cuerpo)]
    out = []
    for m in BLOQUE.finditer(cuerpo):
        if any(a <= m.start() < b for a, b in huecos):
            continue
        dentro = m.group(3)
        if not re.search(r'[A-Za-zÁÉÍÓÚáéíóúÑñ]{2}', re.sub(r'<[^>]+>', '', dentro)):
            continue
        if re.search(r'<(p|li|h[1-6]|ul|ol|div|section)\b', dentro):  # contenedor: se traducen sus hijos
            continue
        if 'data-i18n=' in (m.group(2) or '') or re.search(r'data-i18n="', dentro):  # ya lo traduce el diccionario de interfaz
            continue
        out.append((m.start(), m.end(), m.group(1), m.group(2) or '', dentro))
    return out


def ruta(f): return str(f.parent.relative_to(ROOT))


def extraer(salida):
    salida = Path(salida)
    n = 0
    for f, t in paginas():
        m = articulo(t)
        bl = [{'es': b[4].strip()} for b in bloques(m.group(2))]
        destino = salida / (ruta(f) + '.json')
        destino.parent.mkdir(parents=True, exist_ok=True)
        destino.write_text(json.dumps({'ruta': ruta(f), 'bloques': bl}, ensure_ascii=False, indent=1), encoding='utf-8')
        n += 1
    print(f'{n} páginas extraídas en {salida}')


def aplicar():
    hechas, faltan = 0, []
    for f, t in paginas():
        datos = EN_DIR / (ruta(f) + '.json')
        if not datos.exists():
            faltan.append(ruta(f)); continue
        en = json.loads(datos.read_text(encoding='utf-8'))['bloques']
        m = articulo(t)
        cuerpo = m.group(2)
        bl = bloques(cuerpo)
        assert len(bl) == len(en), (ruta(f), len(bl), len(en))
        partes, i = [], 0
        for (a, b, tag, attrs, dentro), e in zip(bl, en):
            assert dentro.strip() == e['es'].strip(), (ruta(f), dentro[:60])
            partes.append(cuerpo[i:a])
            attrs_en = re.sub(r'\s(id)="[^"]*"', '', attrs)
            # Documentos que nacieron en inglés (cartas de Rutherford): el bloque original es inglés y trae "es_trad".
            es_html = e.get('es_trad') or dentro
            partes.append(f'<{tag}{attrs} data-idioma="es">{es_html}</{tag}><{tag}{attrs_en} data-idioma="en" lang="en">{e["en"]}</{tag}>')
            i = b
        partes.append(cuerpo[i:])
        apertura = m.group(1).replace('data-i18n-strategy="auto"', 'data-i18n-strategy="bilingue"')
        if apertura.startswith('<main'):
            apertura = apertura.replace('<main', '<main data-bilingue', 1)
        t = t[:m.start()] + apertura + ''.join(partes) + m.group(3) + t[m.end():]
        f.write_text(t, encoding='utf-8')
        hechas += 1
    print(f'Bilingües: {hechas} páginas.' + (f' Sin inglés todavía: {len(faltan)}' if faltan else ''))


if __name__ == '__main__':
    if sys.argv[1] == 'extraer': extraer(sys.argv[2])
    else: aplicar()
