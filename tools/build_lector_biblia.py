#!/usr/bin/env python3
"""Lector de la Biblia Verbo de solo texto: /biblia/, /biblia/<libro>/ y /biblia/<libro>/<capítulo>/.
Sin comentarios ni herramientas (decisión de Juan, 2026-10-28). Texto: biblia/modules/bibles/rv-verbo.
Enlaces: /biblia/juan/3/#v16. Ejecutar desde la raíz del sitio: python3 tools/build_lector_biblia.py"""
import json,re,unicodedata,shutil
from html import escape as e
from section_builder import R,page
BIB=R/'biblia/modules/bibles/rv-verbo'
CSS='<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,600;1,400&family=IM+Fell+English+SC&display=swap"><link rel="stylesheet" href="/biblia/lector/lector.css?v=20261028h">'
JS='<script src="/biblia/lector/lector.js?v=20261028h" defer></script>'
TSK=R/'biblia/modules/crossrefs/tsk'
HERR='<p class="herramientas"><a href="/biblia/buscar/">Buscar por tema o idea</a></p>'
def slug(s):return re.sub(r'[^a-z0-9]+','-',unicodedata.normalize('NFD',s).encode('ascii','ignore').decode().lower()).strip('-')
def main():
 libros=json.loads((BIB/'manifest.json').read_text())['books']
 datos={b['id']:json.loads((BIB/b['file']).read_text())['chapters'] for b in libros}
 slugs={b['id']:slug(b['name']) for b in libros}
 refs={b['id']:json.loads((TSK/'books'/(b['id']+'.json')).read_text()) if (TSK/'books'/(b['id']+'.json')).exists() else {} for b in libros}
 def enlaces(bid,c,v):
  # la fuente trae algunas referencias a capítulos o versículos que no existen (p. ej. «1 P 13:17»): se descartan
  rs=[r for r in refs[bid].get(c,{}).get(v,[]) if r['book'] in slugs and str(r['verseStart']) in datos[r['book']].get(str(r['chapter']),{})]
  if not rs:return ''
  a=lambda r:f'<a href="/biblia/{slugs[r["book"]]}/{r["chapter"]}/#v{r["verseStart"]}">{e(r["label"])}</a>'
  html_=''.join(a(r) for r in rs[:5])
  if len(rs)>5:html_+=f'<span class="mas" hidden>'+''.join(a(r) for r in rs[5:])+f'</span><button class="vermas" type="button">+{len(rs)-5} más</button>'
  return f'<div class="refs">{html_}</div>'
 # borra solo carpetas generadas antes por este script (nunca modules/, assets/ ni lector/)
 for b in libros:
  d=R/'biblia'/slug(b['name'])
  if d.is_dir():shutil.rmtree(d)
 orden=[(b,c) for b in libros for c in sorted(datos[b['id']],key=int)]
 (R/'biblia/lector/libros.json').write_text(json.dumps([{'n':b['name'],'s':slugs[b['id']],'t':'AT' if i<39 else 'NT','c':len(datos[b['id']])} for i,b in enumerate(libros)],ensure_ascii=False))
 def selector(s='',c='',busqueda=True):
  return (f'<form class="selector" data-libro="{s}" data-cap="{c}" aria-label="Ir a un pasaje">'
   '<label><span>Testamento</span><select name="t"><option value="AT">Antiguo</option><option value="NT">Nuevo</option></select></label>'
   '<label><span>Libro</span><select name="l"></select></label><label><span>Capítulo</span><select name="c"></select></label>'
   '<button type="submit">Ir</button></form>'+(''
   '<form class="busqueda" action="/biblia/buscar/" role="search"><input type="search" name="q" aria-label="Buscar en la Biblia" placeholder="Buscar en la Biblia por tema o idea…"><button type="submit">Buscar</button></form>' if busqueda else ''))
 for i,(b,c) in enumerate(orden):
  s=slug(b['name']);caps=sorted(datos[b['id']],key=int);vs=datos[b['id']][c]
  texto=''.join(f'<div class="vs" id="v{v}"><p>'+(f'<span class="capitular" aria-hidden="true">{c}</span>' if v=='1' else f'<sup>{v}</sup>')+f'{e(vs[v])}</p>'+enlaces(b['id'],c,v)+'</div>' for v in sorted(vs,key=int))
  nav='<nav class="caps" aria-label="Capítulos">'+''.join(f'<a href="/biblia/{s}/{x}/"'+(' aria-current="page"' if x==c else '')+f'>{x}</a>' for x in caps)+'</nav>'
  ant=orden[i-1] if i else None;sig=orden[i+1] if i+1<len(orden) else None
  pasos='<div class="pasos">'+(f'<a href="/biblia/{slug(ant[0]["name"])}/{ant[1]}/">← {e(ant[0]["name"])} {ant[1]}</a>' if ant else '<span></span>')+(f'<a href="/biblia/{slug(sig[0]["name"])}/{sig[1]}/">{e(sig[0]["name"])} {sig[1]} →</a>' if sig else '<span></span>')+'</div>'
  body=f'{CSS}<article class="lector">{selector(s,c)}<p class="ruta"><a href="/biblia/">Biblia Verbo</a> › <a href="/biblia/{s}/">{e(b["name"])}</a></p><h1>{e(b["name"])}</h1><span class="ornamento" aria-hidden="true"></span><p class="ruta">Capítulo {c}</p>{nav}<hr class="filete"><div class="texto" lang="es">{texto}</div><hr class="filete">{pasos}<p class="herramientas"><a href="/biblia/buscar/">Buscar en la Biblia por tema o idea</a></p></article>{JS}'
  primero=vs[sorted(vs,key=int)[0]]
  page(f'biblia/{s}/{c}',f'{b["name"]} {c} · Biblia Verbo',f'{b["name"]} {c} en la Biblia Verbo: {primero[:120]}',body,{'@context':'https://schema.org','@type':'Chapter','name':f'{b["name"]} {c}','isPartOf':{'@type':'Book','name':'Biblia Verbo'}})
 for b in libros:
  s=slug(b['name']);caps=sorted(datos[b['id']],key=int)
  body=f'{CSS}<article class="lector">{selector(s)}<p class="ruta"><a href="/biblia/">Biblia Verbo</a></p><h1>{e(b["name"])}</h1><span class="ornamento" aria-hidden="true"></span><nav class="caps" aria-label="Capítulos">'+''.join(f'<a href="/biblia/{s}/{x}/">{x}</a>' for x in caps)+f'</nav></article>{JS}'
  page(f'biblia/{s}',f'{b["name"]} · Biblia Verbo',f'Lee {b["name"]} en la Biblia Verbo, por capítulos.',body)
 def lista(bs):return '<nav class="libros">'+''.join(f'<a href="/biblia/{slug(b["name"])}/">{e(b["name"])}</a>' for b in bs)+'</nav>'
 body=(f'{CSS}<article class="lector">{selector()}<div class="portada"><p class="sobre">LA SANTA BIBLIA</p><h1>Biblia Verbo</h1><span class="ornamento" aria-hidden="true"></span><p>Antiguo y Nuevo Testamento en español latinoamericano, cotejados con el hebreo, el arameo y el griego, con referencias cruzadas.</p>{HERR}</div><hr class="filete">'
  f'<h2>Antiguo Testamento</h2>{lista(libros[:39])}<h2>Nuevo Testamento</h2>{lista(libros[39:])}'
  f'<p class="nota">Edición revisada en 2026, cotejada con el hebreo, el arameo y el griego. Base histórica de dominio público (Reina-Valera 1909).</p></article>{JS}')
 page('biblia','Biblia Verbo','Lee la Biblia Verbo en español latinoamericano: los 66 libros, por capítulos, solo el texto.',body,{'@context':'https://schema.org','@type':'Book','name':'Biblia Verbo','inLanguage':'es'})
 body=(f'{CSS}<article class="lector">{selector(busqueda=False)}<p class="ruta"><a href="/biblia/">Biblia Verbo</a></p><h1>Buscar en la Biblia</h1><span class="ornamento" aria-hidden="true"></span>'
  '<p>Escribe una idea, una pregunta o un tema con tus palabras y el buscador encuentra los versículos más cercanos por su sentido, aunque no usen las mismas palabras.</p>'
  '<form id="buscador" role="search"><input type="search" name="q" aria-label="Buscar" placeholder="Por ejemplo: no tener miedo al futuro" required><button type="submit">Buscar</button></form>'
  '<p id="estado" role="status" aria-live="polite"></p><h2 class="res-titulo" hidden>Pasajes</h2><ol id="pasajes"></ol><h2 class="res-titulo" hidden>Versículos</h2><ol id="resultados"></ol>'
  f'<script type="application/json" id="slugs">{json.dumps(slugs)}</script></article>{JS}')
 page('biblia/buscar','Buscar en la Biblia Verbo','Busca en la Biblia Verbo por tema, idea o pregunta: encuentra versículos por su sentido.',body,{'@context':'https://schema.org','@type':'SearchAction','name':'Buscar en la Biblia Verbo'})
 print(len(orden),'capítulos,',len(libros),'libros + buscador')
if __name__=='__main__':main()
