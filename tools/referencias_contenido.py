"""Índice de citas bíblicas en el contenido de Verbo (preguntas, historias, artículos y devocionales).

Sirve para enlazar el banco de imágenes con el texto: «Lee más» en cada imagen y las ilustraciones del banco en
las páginas que citan el mismo pasaje. Solo lee el HTML publicado; no cambia nada.
"""
import re
from html import unescape
from pathlib import Path

R = Path(__file__).resolve().parents[1]
LIBROS = ('Génesis|Éxodo|Levítico|Números|Deuteronomio|Josué|Jueces|Rut|1 Samuel|2 Samuel|1 Reyes|2 Reyes|1 Crónicas|'
    '2 Crónicas|Esdras|Nehemías|Ester|Job|Salmos|Salmo|Proverbios|Eclesiastés|Cantares|Isaías|Jeremías|Lamentaciones|'
    'Ezequiel|Daniel|Oseas|Joel|Amós|Abdías|Jonás|Miqueas|Nahúm|Habacuc|Sofonías|Hageo|Zacarías|Malaquías|Mateo|Marcos|'
    'Lucas|Juan|Hechos|Romanos|1 Corintios|2 Corintios|Gálatas|Efesios|Filipenses|Colosenses|1 Tesalonicenses|'
    '2 Tesalonicenses|1 Timoteo|2 Timoteo|Tito|Filemón|Hebreos|Santiago|1 Pedro|2 Pedro|1 Juan|2 Juan|3 Juan|Judas|'
    'Apocalipsis').split('|')
CITA = re.compile(r'(?<![\wÁÉÍÓÚáéíóúñ])(' + '|'.join(sorted(map(re.escape, LIBROS), key=len, reverse=True)) + r')\s+(\d{1,3}):(\d{1,3})(?:\s*[-–]\s*(\d{1,3}))?')
# Secciones de texto con su etiqueta visible. Las historias y preguntas tienen página propia por carpeta.
SECCIONES = (
    ('preguntas-cristianas', 'Pregunta cristiana', 'Christian question'),
    ('historias', 'Historia', 'Story'),
    ('recursos/articulos-y-reflexiones', 'Artículo y reflexión', 'Article'),
)

def _texto(html):
    main = re.search(r'<main\b.*?</main>', html, re.S)
    t = main.group(0) if main else html
    t = re.sub(r'<!-- verbo:ilustracion -->.*?<!-- /verbo:ilustracion -->', ' ', t, flags=re.S)
    t = re.sub(r'<(script|style|nav|footer|aside)\b.*?</\1>', ' ', t, flags=re.S)
    return unescape(re.sub(r'<[^>]+>', ' ', t))

def paginas():
    for carpeta, es, en in SECCIONES:
        for p in sorted((R / carpeta).glob('*/index.html')):
            html = p.read_text(encoding='utf-8', errors='ignore')
            if re.search(r'<meta\b[^>]*(noindex|http-equiv=["\']refresh)', html, re.I):
                continue
            h1 = re.search(r'<h1\b[^>]*>(.*?)</h1>', html, re.S)
            titulo = unescape(re.sub(r'<[^>]+>', '', h1.group(1))).strip() if h1 else p.parent.name
            yield {'url': '/' + str(p.parent.relative_to(R)) + '/', 'titulo': titulo, 'tipo': (es, en), 'ruta': p, 'html': html}

def indice():
    """{(libro, capítulo): [(a, b, página), …]}: cada cita con versículos (Libro cap:a-b) en el contenido."""
    idx = {}
    for pg in paginas():
        vistos = set()
        for libro, cap, a, b in CITA.findall(_texto(pg['html'])):
            libro = 'Salmos' if libro == 'Salmo' else libro
            k = (libro, int(cap), int(a), int(b or a))
            if k in vistos:
                continue
            vistos.add(k)
            idx.setdefault(k[:2], []).append((k[2], k[3], pg))
    return idx

def paginas_para(idx, libro, capitulo, versiculos):
    """Páginas que citan versículos que se cruzan con los de la imagen, la más específica primero."""
    a, _, b = str(versiculos).partition('-')
    a, b = int(a), int(b or a)
    hits = [(vb - va, pg) for va, vb, pg in idx.get((libro, int(capitulo)), []) if va <= b and vb >= a]
    vistas, out = set(), []
    for _, pg in sorted(hits, key=lambda h: (h[0], h[1]['url'])):
        if pg['url'] not in vistas:
            vistas.add(pg['url']); out.append(pg)
    return out
