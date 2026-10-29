#!/usr/bin/env python3
"""Da forma a las lecciones de Escuela Dominical (recursos/escuela-dominical/<grupo>/<lección>/index.html).

- Agrupa las secciones del cuerpo: ficha de preparación (pasaje, versículo, objetivo, materiales), pasos de la
  clase numerados y la oración; agrega «Imprimir lección». El aspecto está en recursos/assets/leccion.css.
- Pone la imagen del banco que ilustra el pasaje (enlazada a su página) y, al final, los juegos de Verbo que
  cuentan esa misma historia.
Es idempotente: lo que genera va marcado (data-lec, <!--/lec-->, <!-- lec:gen -->) y se rehace en cada ejecución.
No cambia URL, títulos ni metadatos. Correr después de editar lecciones o de publicar imágenes o juegos nuevos:
    python3 tools/lecciones_escuela.py
"""
import json, re, sys
from html import escape as e
from pathlib import Path

R = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(R / 'tools'))
import referencias_contenido as rc
from ilustraciones import mejor_imagen

BASE = R / 'recursos/escuela-dominical'
GRUPOS_ES = ('4-7-anos', '8-10-anos', '12-14-anos')
GRUPOS = GRUPOS_ES + ('12-14-years',)
CSS = '<link rel="stylesheet" href="../../../../recursos/assets/leccion.css?v=20261029">'
LUGAR = '<!-- verbo:ilustracion-lugar -->'
GEN = re.compile(r'<!-- lec:gen -->.*?<!-- /lec:gen -->\n?', re.S)

FICHA = {'pasaje bíblico': 'pasaje', 'versículo para memorizar': 'versiculo', 'versículo base': 'versiculo',
         'objetivo': 'objetivo', 'materiales': 'materiales', 'objective': 'objetivo'}
ORACION = {'oración', 'oración final', 'prayer'}
HISTORIA = {'historia bíblica para niños', 'historia bíblica'}

# Juegos que cuentan la historia del pasaje: (juego, libro, cap. inicial, vers. inicial, cap. final, vers. final).
JUEGOS_PASAJES = [
    ('rumbo-al-arca', 'Génesis', 6, 1, 9, 17),
    ('tierra-prometida', 'Josué', 1, 1, 24, 33),
    ('retorno-al-reino', 'Josué', 1, 1, 24, 33),
    ('panes-y-peces', 'Juan', 6, 1, 6, 14), ('panes-y-peces', 'Mateo', 14, 13, 14, 21),
    ('panes-y-peces', 'Marcos', 6, 30, 6, 44), ('panes-y-peces', 'Lucas', 9, 10, 9, 17),
    ('el-mensajero', 'Hechos', 12, 1, 13, 52),
    ('nehemias', 'Nehemías', 1, 1, 7, 73),
    ('efata', 'Marcos', 7, 31, 7, 37),
]
JUEGOS = {g['id']: g for g in json.loads((R / 'juegos/catalogo.json').read_text())['juegos'] if g.get('visible', True)}


def desarmar(cuerpo):
    """Quita lo generado y deja el cuerpo tal como lo escribió el editor."""
    cuerpo = GEN.sub('', cuerpo)
    cuerpo = re.sub(r'<(?:div|section) data-lec[^>]*>\n?', '', cuerpo)
    return re.sub(r'</(?:div|section)><!--/lec-->\n?', '', cuerpo)


def secciones(cuerpo):
    """[(título h2 o None, html)] partiendo en cada <h2>."""
    partes = re.split(r'(?=\s*<h2>)', cuerpo)
    out = []
    for p in partes:
        if not p.strip():
            continue
        m = re.match(r'\s*<h2>(.*?)</h2>', p, re.S)
        out.append((re.sub(r'<[^>]+>', '', m.group(1)).strip() if m else None, p.strip('\n')))
    return out


def citas(html):
    return [('Salmos' if l == 'Salmo' else l, int(c), int(a), int(b or a)) for l, c, a, b in rc.CITA.findall(rc._texto(html))]


def juegos_para(refs):
    vistos, out = set(), []
    for jid, libro, c1, v1, c2, v2 in JUEGOS_PASAJES:
        if jid in vistos or jid not in JUEGOS:
            continue
        for l, c, a, b in refs:
            if l == libro and (c, b) >= (c1, v1) and (c, a) <= (c2, v2):
                vistos.add(jid); out.append(JUEGOS[jid]); break
    return out


def figura(x):
    return (f'<!-- lec:gen --><figure class="lec-imagen"><a href="{x["url"]}"><picture>'
            f'<source type="image/webp" srcset="{x["medium_webp"]}"><img src="{x["medium"]}" width="640" height="360" '
            f'loading="lazy" alt="{e(x["descripcion"], quote=True)}"></picture></a><figcaption>{e(x["titulo"])} '
            f'({e(x["cita"])}). <a href="{x["url"]}">Descarga esta imagen bíblica gratis en HD</a> para proyectarla '
            f'o imprimirla en tu clase.</figcaption></figure><!-- /lec:gen -->\n')


def bloque_juegos(js):
    if not js:
        return ''
    tarjetas = ''.join(
        f'<a class="lec-juego" href="/juegos/{g["id"]}/"><img src="{g["portada"]}" width="640" height="360" loading="lazy" alt="">'
        f'<span>{e(g["titulo"]["es"])}</span><small>{e(g["descripcion"]["es"])}</small></a>' for g in js)
    return (f'<!-- lec:gen --><section class="lec-juegos"><h2>Juega esta historia</h2>'
            f'<div class="lec-juegos__lista">{tarjetas}</div></section><!-- /lec:gen -->\n')


def armar(cuerpo, espanol, imagenes):
    cuerpo = desarmar(cuerpo)
    tenia_lugar = LUGAR in cuerpo
    secs = secciones(cuerpo.replace(LUGAR + '\n', '').replace(LUGAR, ''))
    pasaje = next((h for t, h in secs if t and FICHA.get(t.lower()) == 'pasaje'), '')
    refs = citas(pasaje) or citas(cuerpo)
    x = mejor_imagen(pasaje or cuerpo, imagenes) if espanol else None
    if x is None and espanol and pasaje:
        x = mejor_imagen(cuerpo, imagenes)
    ficha, pasos, cierre, previo = [], [], [], []
    for t, h in secs:
        clave = (t or '').lower()
        if t is None:
            previo.append(h)
        elif clave in FICHA:
            ficha.append(f'<section data-lec class="lec-card lec-{FICHA[clave]}">\n{h}\n</section><!--/lec-->')
        elif clave in ORACION:
            cierre.append(f'<section data-lec class="lec-oracion">\n{h}\n</section><!--/lec-->')
        else:
            clase = 'lec-paso lec-historia' if clave in HISTORIA else 'lec-paso'
            if x and clave in HISTORIA:
                h = re.sub(r'</h2>\n?', lambda m: m.group(0) + figura(x), h, count=1)
            pasos.append(f'<section data-lec class="{clase}">\n{h}\n</section><!--/lec-->')
    puesta = x is not None and any('lec-imagen' in p for p in pasos)
    out = ['<!-- lec:gen --><p class="lec-acciones"><button type="button" onclick="window.print()">'
           + ('🖨 Imprimir lección' if espanol else '🖨 Print lesson') + '</button></p><!-- /lec:gen -->']
    out += previo
    if ficha:
        out.append('<div data-lec class="lec-ficha">\n' + '\n'.join(ficha) + '\n</div><!--/lec-->')
    if x and not puesta:
        out.append(figura(x).rstrip('\n'))
    if tenia_lugar and not puesta:
        out.append(LUGAR)
    out.append('<div data-lec class="lec-pasos">\n' + '\n'.join(pasos) + '\n</div><!--/lec-->')
    out += cierre
    if espanol:
        out.append(bloque_juegos(juegos_para(refs)).rstrip('\n'))
    nuevo = '\n'.join(o for o in out if o)
    # El lugar de la imagen se conserva (dentro de la historia) para que el editor sepa dónde va.
    if tenia_lugar and puesta:
        nuevo = nuevo.replace('<section data-lec class="lec-paso lec-historia">\n', '<section data-lec class="lec-paso lec-historia">\n' + LUGAR + '\n', 1)
    return nuevo, x, len(juegos_para(refs)) if espanol else 0


def main(rutas=None):
    imagenes = json.loads((R / 'imagenes/indice.json').read_text())
    n = con_img = con_juego = 0
    for grupo in GRUPOS:
        for p in sorted((BASE / grupo).glob('*/index.html')):
            if rutas and str(p) not in rutas:
                continue
            html = p.read_text(encoding='utf-8')
            m = re.search(r'(</h1>)(.*?)(\n\s*<hr>\s*<p class="lesson-nav")', html, re.S)
            if not m:
                print('sin estructura de lección:', p); continue
            cuerpo, x, nj = armar(m.group(2), grupo in GRUPOS_ES, imagenes)
            nuevo = html[:m.end(1)] + '\n' + cuerpo + html[m.start(3):]
            nuevo = re.sub(r'<article(?![^>]*class="leccion")', '<article class="leccion"', nuevo, count=1)
            if 'recursos/assets/leccion.css' not in nuevo:
                nuevo = re.sub(r'(<link rel="stylesheet" href="[^"]*recursos/assets/recursos\.css[^"]*">)', r'\1\n' + CSS, nuevo, count=1)
            else:
                nuevo = re.sub(r'<link rel="stylesheet" href="[^"]*recursos/assets/leccion\.css[^"]*">', CSS, nuevo)
            if nuevo != html:
                p.write_text(nuevo, encoding='utf-8')
            n += 1; con_img += bool(x); con_juego += bool(nj)
    print(f'Lecciones: {n} · con imagen del banco: {con_img} · con juegos: {con_juego}')


def armar_indice(grupo, region):
    """Índice del grupo como tarjetas (número, título, pasaje y miniatura de su imagen), por unidades."""
    region = re.sub(r'<div data-lec[^>]*>.*?</div><!--/lec-->\n?', lambda m: _a_lista(m.group(0)), region, flags=re.S)
    partes = re.split(r'(<h2>.*?</h2>)', region, flags=re.S)
    out = []
    for parte in partes:
        if parte.startswith('<h2>'):
            out.append('      ' + parte); continue
        slugs = re.findall(r'href="([0-9a-z-]+)/"', parte)
        if not slugs:
            if parte.strip(): out.append(parte.strip('\n'))
            continue
        out.append('<div data-lec class="lec-indice">' + ''.join(_tarjeta(grupo, s) for s in slugs) + '</div><!--/lec-->')
    return '\n' + '\n'.join(out)


def _a_lista(bloque):
    return '<ul>' + ''.join(f'<li><a href="{s}/"></a></li>' for s in re.findall(r'href="([0-9a-z-]+)/"', bloque)) + '</ul>'


def _tarjeta(grupo, slug):
    html = (BASE / grupo / slug / 'index.html').read_text(encoding='utf-8')
    titulo = re.sub(r'<[^>]+>', '', re.search(r'<h1\b[^>]*>(.*?)</h1>', html, re.S).group(1)).strip()
    num = re.search(r'(?:Lección|Lesson) (\d+)', re.search(r'<p class="lesson-badge">(.*?)</p>', html).group(1))
    num = num.group(1) if num else ''
    pas = re.search(r'<h2>Pasaje bíblico</h2>\s*<p>(.*?)</p>', html, re.S)
    ref = rc.CITA.search(re.sub(r'<[^>]+>', '', pas.group(1))) if pas else None
    img = re.search(r'class="lec-imagen".*?<img src="([^"]+)-media\.jpg"', html, re.S)
    ingles = grupo.endswith('years')
    foto = (f'<img src="{img.group(1)}-mini.jpg" width="480" height="270" loading="lazy" alt="">' if img
            else f'<span class="lec-indice__num" aria-hidden="true">{num}</span>')
    return (f'<a class="lec-tarjeta" href="{slug}/">{foto}<span class="lec-tarjeta__texto">'
            f'<small>{"Lesson" if ingles else "Lección"} {num}</small><strong>{e(titulo)}</strong>'
            + (f'<em>{e(ref.group(0))}</em>' if ref else '') + '</span></a>')


def main_indices():
    for grupo in GRUPOS:
        p = BASE / grupo / 'index.html'
        html = p.read_text(encoding='utf-8')
        m = re.search(r'(</h1>)(.*?)(\n\s*<hr>\s*<p class="lesson-nav")', html, re.S)
        nuevo = html[:m.end(1)] + armar_indice(grupo, m.group(2)) + html[m.start(3):]
        nuevo = re.sub(r'<article(?![^>]*class="leccion)', '<article class="leccion leccion-indice"', nuevo, count=1)
        if 'recursos/assets/leccion.css' not in nuevo:
            nuevo = re.sub(r'(<link rel="stylesheet" href="[^"]*recursos/assets/recursos\.css[^"]*">)', r'\1\n' + CSS, nuevo, count=1)
        else:
            nuevo = re.sub(r'<link rel="stylesheet" href="[^"]*recursos/assets/leccion\.css[^"]*">', CSS, nuevo)
        if nuevo != html:
            p.write_text(nuevo, encoding='utf-8')
    print('Índices de grupo actualizados:', len(GRUPOS))


if __name__ == '__main__':
    rutas = set(str(Path(a).resolve()) for a in sys.argv[1:])
    main(rutas or None)
    if not rutas:
        main_indices()
