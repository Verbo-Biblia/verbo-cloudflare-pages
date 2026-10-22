#!/usr/bin/env python3
"""Aplica el pie público después de cada build: python3 tools/pie_comun.py.

El sitemap define las páginas públicas; se incluyen sus índices antecesores.
No recorre archivos editoriales, lectores privados ni directorios de la app.
"""
from pathlib import Path
import re
import xml.etree.ElementTree as ET
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
VERSION = '20261021-pie'
START, END = '<!-- verbo:pie -->', '<!-- /verbo:pie -->'
LINKS = {
    'secciones': [('inicio', '/', 'Inicio'), ('recursos', '/recursos/', 'Recursos'),
        ('libreria', '/libreria/', 'Librería'), ('historias', '/historias/', 'Historias'),
        ('preguntas', '/preguntas-cristianas/', 'Preguntas cristianas'), ('software', '/software/', 'Software')],
    'confianza': [('acerca', '/acerca/', 'Conoce Verbo'), ('mision', '/mision/', 'Misión'),
        ('fundador', '/sobre-el-fundador/', 'Sobre el fundador'), ('privacidad', '/privacidad/', 'Política de privacidad'),
        ('licencias', '/licencias/', 'Licencias'), ('contacto', '/contacto/', 'Contacto')],
    'redes': [('youtube', 'https://youtube.com/@verbobiblia', 'YouTube'),
        ('facebook', 'https://www.facebook.com/share/193dcJJ87v/', 'Facebook')],
}

def public_pages():
    pages = set()
    for node in ET.parse(ROOT / 'sitemap.xml').iter():
        if node.tag.rsplit('}', 1)[-1] != 'loc':
            continue
        url = urlsplit(node.text or '')
        if url.hostname != 'verbobiblia.com':
            continue
        route = unquote(url.path).lstrip('/')
        if route.split('/')[0] in {'biblia', 'proyector', 'review', 'docs', 'studio'}:
            continue
        path = ROOT / route
        if path.is_dir():
            path /= 'index.html'
        elif not path.suffix:
            path = path.with_suffix('.html')
        if not path.is_relative_to(ROOT) or not path.is_file() or path.suffix != '.html':
            raise ValueError(f'Página pública no encontrada: {route}')
        pages.add(path)
        for parent in path.relative_to(ROOT).parents:
            index = ROOT / parent / 'index.html'
            if index.is_file():
                pages.add(index)
    # Los índices de redirección y las páginas no indexables no son destinos públicos.
    pages = {p for p in pages if not re.search(
        r"<meta\b[^>]*(?:noindex|http-equiv=[\"']refresh)", p.read_text(encoding="utf-8"), re.I)}
    # Previews deliberately stay out of the sitemap, but still need the common footer.
    for section in ('apps', 'juegos', 'imagenes'):
        pages.update((ROOT / section).rglob('index.html'))
    return sorted(pages)

def footer(home=False):
    parts = [START, '<footer class="verbo-pie" aria-label="Verbo">',
        '  <div class="verbo-pie__interior">',
        '    <div class="verbo-pie__marca"><a href="/" data-i18n="pie.marca">Verbo</a><p data-i18n="pie.frase">Una biblioteca abierta. Una fe que se vive.</p></div>']
    titles = {'secciones': 'Secciones', 'confianza': 'Confianza', 'redes': 'Redes'}
    for group, links in LINKS.items():
        parts += [f'    <nav class="verbo-pie__grupo" aria-labelledby="pie-{group}">',
            f'      <h2 id="pie-{group}" data-i18n="pie.{group}">{titles[group]}</h2>']
        for key, url, label in links:
            parts.append(f'      <a href="{url}" data-i18n="pie.{key}">{label}</a>')
        if home and group == 'confianza':
            parts.append('      <a href="/ajustes/" data-i18n="pie.configuracion">Configuración</a>')
        parts.append('    </nav>')
    return '\n'.join(parts + ['  </div>', '</footer>', END])

def apply():
    changed = 0
    pages = public_pages()
    for path in pages:
        original = text = path.read_text(encoding='utf-8')
        asset_version = '20261021-secciones' if path.relative_to(ROOT).parts[0] in {'apps', 'juegos', 'imagenes'} else VERSION
        if START in text:
            text = re.sub(r'\n?' + re.escape(START) + r'.*?' + re.escape(END) + r'\n?', '\n', text, flags=re.S)
        elif path == ROOT / 'index.html':
            text = re.sub(r'<footer\b[^>]*>.*?</footer>', '', text, count=1, flags=re.S)
        css = f'<link rel="stylesheet" href="/assets/pie/pie.css?v={VERSION}">'
        text = re.sub(r'<link\b[^>]*href=["\'][^"\']*/assets/pie/pie\.css[^"\']*["\'][^>]*>\n?', '', text)
        text = text.replace('</head>', css + '\n</head>')
        # Versionar también los diccionarios: i18n.js hereda su query al fetch.
        for asset in ('i18n', 'site-chrome'):
            pattern = rf'(<script\b[^>]*src=["\'][^"\']*biblia/assets/{asset}\.js)(?:\?[^"\']*)?'
            if re.search(pattern, text):
                text = re.sub(pattern, rf'\g<1>?v={asset_version}', text)
            else:
                text = text.replace('</body>', f'<script src="/biblia/assets/{asset}.js?v={asset_version}"></script>\n</body>')
        text = re.sub(r'\s*</body>', '\n' + footer(path == ROOT / 'index.html') + '\n</body>', text)
        if text != original:
            path.write_text(text, encoding='utf-8')
            changed += 1
    print(f'Pie común: {len(pages)} páginas públicas; {changed} actualizadas.')
    return len(pages)

if __name__ == '__main__':
    apply()
