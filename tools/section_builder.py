from pathlib import Path
import json,html,sys
from PIL import Image
R=Path.cwd(); sys.path.insert(0,str(R/'tools'))
D={l:json.loads((R/f'biblia/assets/i18n/{l}.json').read_text()) for l in ('es','en')}
def tr(key,es,en,tag='p'):
 for l,v in [('es',es),('en',en)]: D[l].setdefault('sections',{})[key]=v
 return f'<{tag} data-i18n="sections.{key}">{html.escape(es)}</{tag}>'
def page(route,title,desc,body,schema=None):
 p=R/route/'index.html'; p.parent.mkdir(parents=True,exist_ok=True)
 p.write_text(f'''<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{html.escape(title)} | Verbo</title><meta name="description" content="{html.escape(desc,quote=True)}"><link rel="canonical" href="https://verbobiblia.com/{route}/"><link rel="stylesheet" href="/assets/depth/depth.css"><link rel="stylesheet" href="/assets/secciones/secciones.css"><script type="application/ld+json">{json.dumps(schema or {'@context':'https://schema.org','@type':'CollectionPage','name':title},ensure_ascii=False).replace('</','<\\/')}</script></head><body><a class="skip" href="#contenido" data-i18n="home.skip">Ir al contenido</a><header class="section-bar"><a href="/" class="static-page__brand">Verbo</a><div id="uiLangSwitcher"><button data-lang="es" type="button">ES</button><button data-lang="en" type="button">EN</button></div></header><main id="contenido">{body}</main><script src="/biblia/assets/i18n.js?v=20261021-secciones"></script><script src="/biblia/assets/site-chrome.js?v=20261021-pie"></script><script src="/assets/secciones/secciones.js" defer></script><script src="/assets/depth/depth.js" defer data-tilt=".tile" data-enter=".tile,.intro" data-sky="0.5"></script></body></html>''')
def save():
 for l in D: (R/f'biblia/assets/i18n/{l}.json').write_text(json.dumps(D[l],ensure_ascii=False,indent=2)+'\n')
def shot(src,dst):
 p=R/dst;p.parent.mkdir(parents=True,exist_ok=True)
 with Image.open(src) as im: im.thumbnail((700,1100));im.convert('RGB').save(p,'WEBP',quality=78)
