#!/usr/bin/env python3
"""Portada de /recursos/ (Escuela Dominical) con contenido a los lados.

En escritorio, tres columnas: juegos a la izquierda, los grupos de edad al centro (con miniaturas de sus lecciones) e
historias de siervos de Cristo y preguntas cristianas a la derecha; en el teléfono los lados pasan abajo.
Todo sale de los datos del sitio (juegos/catalogo.json, historias/ y preguntas-cristianas/data/articles.json y las
lecciones), entre <!-- verbo:recursos-* --> y su cierre. Idempotente. Correr después de cambiar esos datos:
    python3 tools/recursos_portada.py
"""
import json, re
from html import escape as e
from pathlib import Path

R = Path(__file__).resolve().parents[1]
P = R / 'recursos/index.html'
CSS = '<link rel="stylesheet" href="../recursos/assets/recursos-portada.css?v=20261029">'
GRUPOS = [('4-7-anos', 'I.'), ('8-10-anos', 'II.'), ('12-14-anos', 'III.')]
# Las que más clics traen desde Google (Search Console, 28 días al 2026-10-29).
DESTACADAS = ['8-10-anos/leccion-12-la-lampara-que-alumbra', '8-10-anos/leccion-27-no-juzgar-a-los-demas',
              '4-7-anos/leccion-27-jonas-y-el-gran-pez', '4-7-anos/leccion-01-dios-creo-la-luz',
              '4-7-anos/leccion-44-la-gran-comision-version-infantil', '8-10-anos/leccion-24-el-padre-nuestro',
              # de reserva, por si alguna de las anteriores no tiene imagen del banco
              '4-7-anos/leccion-23-david-y-goliat', '8-10-anos/leccion-17-el-buen-samaritano']
EDAD = {'4-7-anos': '4 a 7 años', '8-10-anos': '8 a 10 años', '12-14-anos': '12 a 14 años'}


def bloque(nombre, html):
    return f'<!-- verbo:recursos-{nombre} -->{html}<!-- /verbo:recursos-{nombre} -->'


def poner(t, nombre, html, ancla_antes=None):
    m = re.search(rf'<!-- verbo:recursos-{nombre} -->.*?<!-- /verbo:recursos-{nombre} -->', t, re.S)
    if m:
        return t[:m.start()] + bloque(nombre, html) + t[m.end():]
    i = t.index(ancla_antes)
    return t[:i] + bloque(nombre, html) + '\n' + t[i:]


def miniaturas(grupo, n=3):
    out = []
    for p in sorted((R / 'recursos/escuela-dominical' / grupo).glob('*/index.html')):
        m = re.search(r'class="lec-imagen".*?<img src="([^"]+)-media\.jpg"', p.read_text(encoding='utf-8'), re.S)
        if m and m.group(1) not in out:
            out.append(m.group(1))
    paso = max(1, len(out) // n)
    return out[::paso][:n]


def centro():
    tarjetas = ''
    for ruta in DESTACADAS:
        p = R / 'recursos/escuela-dominical' / ruta / 'index.html'
        if not p.exists():
            continue
        h = p.read_text(encoding='utf-8')
        titulo = re.sub(r'<[^>]+>', '', re.search(r'<h1\b[^>]*>(.*?)</h1>', h, re.S).group(1)).strip()
        img = re.search(r'class="lec-imagen".*?<img src="([^"]+)-media\.jpg"', h, re.S)
        if not img or tarjetas.count('class="rp-leccion"') >= 6:
            continue
        pas = re.search(r'<h2>Pasaje bíblico</h2>\s*<p>(.*?)</p>', h, re.S)
        ref = re.match(r'[^.;]+?\d+:\d+(?:-\d+)?', re.sub(r'<[^>]+>', '', pas.group(1))) if pas else None
        tarjetas += (f'<a class="rp-leccion" href="escuela-dominical/{ruta}/">'
                     + (f'<img src="{img.group(1)}-media.jpg" width="640" height="360" loading="lazy" alt="">' if img else '')
                     + f'<span><small data-i18n-live>{EDAD[ruta.split("/")[0]]}</small><strong data-i18n-live>{e(titulo)}</strong>'
                     + (f'<em>{e(ref.group(0))}</em>' if ref else '') + '</span></a>')
    pasos = [('🖨', 'Imprímela', 'Cada lección trae un botón para imprimirla limpia, lista para la clase.'),
             ('🖼', 'Proyecta la imagen', 'La ilustración del pasaje se descarga gratis en HD para proyectarla.'),
             ('🎮', 'Juega la historia', 'Cuando hay un juego de Verbo sobre el pasaje, aparece al final.'),
             ('📖', 'Memoriza el versículo', 'Cada lección tiene su versículo de la Biblia Verbo para memorizar.')]
    usos = ''.join(f'<li><span aria-hidden="true">{i}</span><strong data-i18n-live>{t}</strong><small data-i18n-live>{d}</small></li>' for i, t, d in pasos)
    return (f'<section class="rp-centro" aria-labelledby="rp-destacadas"><div class="r-section-label"><h2 id="rp-destacadas" data-i18n-live>'
            f'Las lecciones más consultadas</h2></div><div class="rp-lecciones">{tarjetas}</div>'
            f'<div class="r-section-label"><h2 data-i18n-live>Cómo usar estas lecciones</h2></div><ul class="rp-usos">{usos}</ul></section>')


def juegos():
    js = [g for g in json.loads((R / 'juegos/catalogo.json').read_text())['juegos'] if g.get('visible', True)]
    js.sort(key=lambda g: (not g.get('destacado'), not g.get('infantil'), g.get('orden_mas_jugados', 99)))
    tarjetas = ''.join(
        f'<a class="rp-juego" href="/juegos/{g["id"]}/"><img src="{g["portada"]}" width="640" height="360" loading="lazy" alt="">'
        f'<span data-i18n-live>{e(g["titulo"]["es"])}</span><small data-i18n-live>{e(g["descripcion"]["es"])}</small></a>'
        for g in js[:4])
    return (f'<aside class="rp-lado rp-lado--izq" aria-labelledby="rp-juegos"><p class="rp-eyebrow" data-i18n-live>Para jugar en familia</p>'
            f'<h2 id="rp-juegos" data-i18n-live>Juega y aprende</h2>{tarjetas}'
            f'<a class="rp-mas" href="/juegos/" data-i18n-live>Ver los {len(js)} juegos →</a></aside>')


def derecha():
    hs = json.loads((R / 'historias/data/articles.json').read_text())
    hs = [h for h in hs if (R / 'historias' / h['slug'] / 'index.html').exists()]
    hs.sort(key=lambda h: h.get('century', 0))
    elegidas = hs[::max(1, len(hs) // 5)][:5]
    historias = ''.join(
        f'<li><a href="/historias/{h["slug"]}/"><strong>{e(h["name"])}</strong>'
        f'<small data-i18n-live>{e(h.get("years", ""))} · {e(h.get("topic", ""))}</small></a></li>' for h in elegidas)
    qs = [q for q in json.loads((R / 'preguntas-cristianas/data/articles.json').read_text())
          if (R / 'preguntas-cristianas' / q['slug'] / 'index.html').exists()][:5]
    preguntas = ''.join(f'<li><a href="/preguntas-cristianas/{q["slug"]}/" data-i18n-live>{e(q["title"])}</a></li>' for q in qs)
    return (f'<aside class="rp-lado rp-lado--der">'
            f'<section aria-labelledby="rp-historias"><p class="rp-eyebrow" data-i18n-live>Héroes de la fe</p>'
            f'<h2 id="rp-historias" data-i18n-live>Historias de siervos de Cristo</h2><ul class="rp-lista rp-lista--historias">{historias}</ul>'
            f'<a class="rp-mas" href="/historias/" data-i18n-live>Ver las {len(hs)} historias →</a></section>'
            f'<section aria-labelledby="rp-preguntas"><p class="rp-eyebrow" data-i18n-live>Respuestas con la Biblia</p>'
            f'<h2 id="rp-preguntas" data-i18n-live>Preguntas cristianas</h2><ul class="rp-lista">{preguntas}</ul>'
            f'<a class="rp-mas" href="/preguntas-cristianas/" data-i18n-live>Ver todas las preguntas →</a></section></aside>')


def main():
    t = P.read_text(encoding='utf-8')
    # Las tarjetas de grupo llevan una tira de miniaturas de sus lecciones.
    for grupo, _ in GRUPOS:
        tira = ''.join(f'<img src="{m}-mini.jpg" width="160" height="90" loading="lazy" alt="">' for m in miniaturas(grupo))
        html = f'<span class="rp-tira" aria-hidden="true">{tira}</span>'
        a = f'<a class="r-card" href="escuela-dominical/{grupo}/">'
        m = re.search(re.escape(a) + r'\s*(<!-- verbo:recursos-tira-' + grupo + r' -->.*?<!-- /verbo:recursos-tira-' + grupo + r' -->)?', t, re.S)
        t = t[:m.start()] + a + bloque('tira-' + grupo, html) + t[m.end():]
    t = re.sub(r'<div class="rp-tres">\n?', '', t)
    t = re.sub(r'\n?</div><!--/rp-tres-->', '', t)
    t = re.sub(r'<!-- verbo:recursos-izq -->.*?<!-- /verbo:recursos-izq -->\n?', '', t, flags=re.S)
    t = re.sub(r'<!-- verbo:recursos-der -->.*?<!-- /verbo:recursos-der -->\n?', '', t, flags=re.S)
    t = re.sub(r'<!-- verbo:recursos-centro -->.*?<!-- /verbo:recursos-centro -->\n    ', '', t, flags=re.S)
    k = t.index('<p data-i18n-live>Iremos añadiendo')
    t = t[:k] + bloque('centro', centro()) + '\n    ' + t[k:]
    i, j = t.index('<main class="static-page__main recursos-index">'), t.index('</main>') + len('</main>')
    t = (t[:i] + '<div class="rp-tres">\n' + t[i:j] + '\n' + bloque('izq', juegos()) + '\n' + bloque('der', derecha())
         + '\n</div><!--/rp-tres-->' + t[j:])
    if 'recursos-portada.css' not in t:
        t = re.sub(r'(<link rel="stylesheet" href="[^"]*recursos/assets/recursos\.css[^"]*">)', r'\1\n' + CSS, t, count=1)
    P.write_text(t, encoding='utf-8')
    print('Portada de Recursos actualizada')


if __name__ == '__main__':
    main()
