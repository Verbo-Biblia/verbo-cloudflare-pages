#!/usr/bin/env python3
"""«Úsala en una clase»: en cada imagen del banco, las lecciones de Escuela Dominical que enseñan su pasaje.

Las lecciones se emparejan por su «Pasaje bíblico» (o, si no lo tienen, por las citas de su texto) con los
versículos de la imagen. build_imagenes.py incluye la sección al generar el banco; este script la pone o actualiza
en las páginas ya publicadas sin regenerar el banco (idempotente, entre <!-- verbo:lecciones --> y su cierre):
    python3 tools/lecciones_banco.py
"""
import json, re, sys
from html import escape as e, unescape
from pathlib import Path

R = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(R / 'tools'))
import referencias_contenido as rc

INI, FIN = '<!-- verbo:lecciones -->', '<!-- /verbo:lecciones -->'
GRUPOS = (('4-7-anos', '4 a 7 años', 'Ages 4-7'), ('8-10-anos', '8 a 10 años', 'Ages 8-10'), ('12-14-anos', '12 a 14 años', 'Ages 12-14'))
_LECCIONES = None


def lecciones():
    global _LECCIONES
    if _LECCIONES is None:
        _LECCIONES = []
        for orden, (grupo, es, en) in enumerate(GRUPOS):
            for p in sorted((R / 'recursos/escuela-dominical' / grupo).glob('*/index.html')):
                html = p.read_text(encoding='utf-8')
                h1 = re.search(r'<h1\b[^>]*>(.*?)</h1>', html, re.S)
                pas = re.search(r'<h2>Pasaje bíblico</h2>(.*?)(?=<h2>|</section>)', html, re.S)
                texto = rc._texto(pas.group(1) if pas else html)
                refs = [('Salmos' if l == 'Salmo' else l, int(c), int(a), int(b or a)) for l, c, a, b in rc.CITA.findall(texto)]
                if refs:
                    _LECCIONES.append({'url': '/' + str(p.parent.relative_to(R)) + '/', 'orden': (orden, p.parent.name),
                                       'titulo': unescape(re.sub(r'<[^>]+>', '', h1.group(1))).strip() if h1 else p.parent.name,
                                       'es': es, 'en': en, 'refs': refs})
    return _LECCIONES


def para(x):
    a, _, b = str(x['versiculos']).partition('-')
    a, b = int(a), int(b or a)
    hits = [l for l in lecciones() if any(lb == x['libro'] and c == int(x['capitulo']) and va <= b and vb >= a for lb, c, va, vb in l['refs'])]
    return sorted(hits, key=lambda l: l['orden'])[:3]


def seccion(x):
    ls = para(x)
    if not ls:
        return ''
    items = ''.join(f'<li><a href="{l["url"]}"><small><span data-es="{e(l["es"])}" data-en="{e(l["en"])}">{e(l["es"])}</span></small> {e(l["titulo"])}</a></li>' for l in ls)
    return (f'{INI}<section class="cross cross--read cross--leccion"><div>'
            '<p class="eyebrow" data-es="ÚSALA EN UNA CLASE" data-en="USE IT IN A CLASS">ÚSALA EN UNA CLASE</p>'
            '<h2 data-es="Lecciones de Escuela Dominical con este pasaje" data-en="Sunday school lessons on this passage">'
            f'Lecciones de Escuela Dominical con este pasaje</h2><ul>{items}</ul></div></section>{FIN}')


def main():
    puestas = 0
    for x in json.loads((R / 'imagenes/indice.json').read_text()):
        p = R / x['url'].strip('/') / 'index.html'
        if not p.is_file():
            continue
        t = p.read_text(encoding='utf-8')
        limpio = re.sub(re.escape(INI) + '.*?' + re.escape(FIN), '', t, flags=re.S)
        s = seccion(x)
        if s:
            ancla = '<nav class="image-navigation"' if '<nav class="image-navigation"' in limpio else '<section class="related"'
            if ancla not in limpio:
                print('sin lugar para la sección:', p); continue
            limpio = limpio.replace(ancla, s + ancla, 1)
            puestas += 1
        if limpio != t:
            p.write_text(limpio, encoding='utf-8')
    print(f'Imágenes con lecciones enlazadas: {puestas}')


if __name__ == '__main__':
    main()
