#!/usr/bin/env python3
"""Genera preguntas cristianas y su sitemap desde contenido local; sin red."""
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'preguntas-cristianas'
BASE = 'https://verbobiblia.com'
DATE = '2026-10-07'
NAME = 'El cristiano hoy · Preguntas y respuestas'

def esc(value):
    return html.escape(str(value), quote=True)

def schema(value):
    return json.dumps(value, ensure_ascii=False).replace('<', '\\u003c')

def shell(title, description, path, body, graphs, index=False, image_path='/historias/assets/images/estudio-biblico.webp', image_alt='Una Biblia abierta sobre una mesa de estudio'):
    return f'''<!DOCTYPE html>
<html lang="es"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)} | Verbo</title><meta name="description" content="{esc(description)}">
<link rel="canonical" href="{BASE}{path}">
<meta property="og:title" content="{esc(title)} | Verbo"><meta property="og:description" content="{esc(description)}">
<meta property="og:url" content="{BASE}{path}"><meta property="og:type" content="{'website' if index else 'article'}"><meta property="og:locale" content="es_ES">
<meta property="og:image" content="{BASE}{image_path}"><meta property="og:image:alt" content="{esc(image_alt)}">
<meta name="twitter:card" content="summary_large_image"><meta name="theme-color" content="#0a2037">
<link rel="icon" href="/biblia/assets/icons/icon-192.png">
<link rel="stylesheet" href="/preguntas-cristianas/assets/questions.css?v=20261007-paleta-portada">
<script type="application/ld+json">{schema({'@context':'https://schema.org','@graph':graphs})}</script>
</head><body>
<a class="skip-link" href="#contenido">Ir al contenido</a>
<header class="q-header"><a class="q-brand" href="/">Verbo<span>biblioteca bíblica digital</span></a><nav aria-label="Navegación principal"><a href="/">Inicio</a><a href="/preguntas-cristianas/" aria-current="{'page' if index else 'true'}">Preguntas de hoy</a><a href="/libreria/">Librería</a><a href="/verbo-desktop/">Desktop</a></nav></header>
{body}
<footer class="q-footer"><p>Verbo · La Palabra para la vida de hoy.</p><nav aria-label="Más de Verbo"><a href="/preguntas-cristianas/">Todas las preguntas</a><a href="/recursos/devocionales/">Devocionales</a><a href="/acerca/">Acerca de Verbo</a></nav></footer>
{'<script src="/preguntas-cristianas/assets/questions.js?v=20261007" defer></script>' if index else ''}
</body></html>
'''

def card(a, number):
    return f'''<a class="q-card" href="/preguntas-cristianas/{esc(a['slug'])}/" data-question data-topic="{esc(a['topic'])}" data-search="{esc(a['title']+' '+a['description']+' '+a['topic'])}"><span class="q-card-top"><span>{esc(a['topic'])}</span><span class="q-number">{number:02}</span></span><h2>{esc(a['title'])}</h2><p>{esc(a['description'])}</p><span class="q-read">Leer la respuesta <span aria-hidden="true">↗</span></span></a>'''

def breadcrumbs(a=None):
    items=[{'@type':'ListItem','position':1,'name':'Verbo','item':BASE+'/'},{'@type':'ListItem','position':2,'name':NAME,'item':BASE+'/preguntas-cristianas/'}]
    if a: items.append({'@type':'ListItem','position':3,'name':a['title'],'item':BASE+'/preguntas-cristianas/'+a['slug']+'/'})
    return {'@type':'BreadcrumbList','itemListElement':items}

def build():
    articles=json.loads((OUT/'data/articles.json').read_text())
    assert len(articles)==10 and len({a['slug'] for a in articles})==10
    for a in articles:
        assert re.fullmatch(r'[a-z0-9-]+',a['slug'])
        for source in a['sources']:
            assert (ROOT/'recursos/articulos-y-reflexiones'/source/'index.html').exists()
        path='/preguntas-cristianas/'+a['slug']+'/'
        toc=''.join(f'<a href="#parte-{i}">{esc(s[0])}</a>' for i,s in enumerate(a['sections'],1))
        sections=''.join(f'<section aria-labelledby="parte-{i}"><h2 id="parte-{i}">{esc(s[0])}</h2>'+''.join('<p>'+esc(p)+'</p>' for p in s[1])+'</section>' for i,s in enumerate(a['sections'],1))
        readings=''.join(f'<li><a href="/recursos/articulos-y-reflexiones/{esc(s)}/">{esc(re.search(r"<h1[^>]*>(.*?)</h1>",(ROOT/"recursos/articulos-y-reflexiones"/s/"index.html").read_text(),re.S)[1])}</a></li>' for s in a['sources'])
        extra=''
        if a['slug']=='ansiedad-falta-de-fe-cristiano':
            extra='<p>Orientación complementaria sobre cuándo buscar ayuda: <a href="https://www.nimh.nih.gov/health/publications/espanol/trastorno-de-ansiedad-generalizada-cuando-no-se-pueden-controlar-las-preocupaciones-new">Instituto Nacional de la Salud Mental</a>.</p>'
        related=[r for r in articles if r['slug']!=a['slug'] and r['topic']==a['topic']]
        related += [r for r in articles if r['slug']!=a['slug'] and r not in related]
        rel=''.join(f'<a href="/preguntas-cristianas/{esc(r["slug"])}/">{esc(r["title"])} <span aria-hidden="true">→</span></a>' for r in related[:2])
        words=len(' '.join([a['answer']]+[p for s in a['sections'] for p in s[1]]).split())
        image_path='/historias/assets/images/estudio-biblico.webp'
        image_alt='Una Biblia abierta sobre una mesa de estudio'
        illustration=''
        if a['slug']=='musica-cristiana-inteligencia-artificial':
            image_path='/preguntas-cristianas/assets/images/musica-ia-biblia.webp'
            image_alt='Biblia abierta, auriculares y una computadora con una onda musical sobre una mesa iluminada'
            illustration=f'<figure class="q-illustration"><img src="{image_path}" alt="{image_alt}" width="1200" height="800" loading="lazy" decoding="async"><figcaption>La tecnología como herramienta; la Palabra como criterio. Ilustración creada con IA para Verbo.</figcaption></figure>'
        body=f'''<main id="contenido" class="q-article-shell"><nav class="q-breadcrumb" aria-label="Ruta"><a href="/">Inicio</a><span aria-hidden="true">/</span><a href="/preguntas-cristianas/">El cristiano hoy</a></nav>
<article><header class="q-article-heading"><span class="q-kicker">{esc(a['topic'])}</span><h1>{esc(a['title'])}</h1><p class="q-lede">{esc(a['description'])}</p><p class="q-meta">Redacción de Verbo · <time datetime="{DATE}">7 de octubre de 2026</time> · {max(2,round(words/180))} min de lectura</p></header>
<div class="q-answer"><span class="q-kicker">La respuesta breve</span><p>{esc(a['answer'])}</p></div>
{illustration}<div class="q-reading-layout"><aside><nav class="q-toc" aria-label="En este artículo"><strong>En esta respuesta</strong>{toc}<a href="#para-profundizar">Para profundizar</a></nav></aside><div class="q-reading">{sections}
<section class="q-sources" id="para-profundizar"><h2>Para profundizar</h2><p>Lee los pasajes completos: {esc('; '.join(a['passages']))}. Esta respuesta ofrece la lectura pastoral de Verbo; las diferencias entre interpretaciones deben examinarse en su contexto.</p>{('<ul>'+readings+'</ul>') if readings else '<p>Base editorial: estudios pastorales sobre el Espíritu Santo y Hechos 1:4–5, consultados para la referencia doctrinal de Verbo.</p>'}{extra}<p class="q-meta">Artículo preparado para esta sección a partir de la enseñanza bíblica y los escritos pastorales que orientan Verbo.</p></section>
</div></div></article><section class="q-related"><h2>Sigue leyendo</h2>{rel}</section><a class="q-button q-button-outline" href="/preguntas-cristianas/">Ver las diez preguntas →</a></main>'''
        article={'@type':'Article','headline':a['title'],'description':a['description'],'datePublished':DATE,'dateModified':DATE,'inLanguage':'es','author':{'@type':'Organization','name':'Verbo','url':BASE+'/'},'publisher':{'@type':'Organization','name':'Verbo','url':BASE+'/'},'mainEntityOfPage':BASE+path,'image':BASE+image_path,'wordCount':words}
        target=OUT/a['slug']; target.mkdir(parents=True,exist_ok=True)
        (target/'index.html').write_text(shell(a['title'],a['description'],path,body,[article,breadcrumbs(a)],image_path=image_path,image_alt=image_alt))
    topics=list(dict.fromkeys(a['topic'] for a in articles))
    filters=''.join(f'<button type="button" data-filter="{esc(t)}" aria-pressed="false">{esc(t)}</button>' for t in topics)
    body=f'''<main id="contenido" class="q-collection"><section class="q-intro"><div><span class="q-kicker">Preguntas y respuestas del cristiano hoy</span><h1>La vida pregunta.<br><em>Volvamos a la Palabra.</em></h1><p class="q-lede">Diez preguntas que atraviesan la fe y la vida de hoy. Respuestas bíblicas para pensar con calma, discernir y seguir a Cristo.</p><a class="q-button" href="#preguntas">Encuentra tu pregunta <span aria-hidden="true">↓</span></a></div><div class="q-intro-note"><span class="q-big-number">10</span><p>preguntas para empezar<br>una conversación necesaria.</p><span class="q-note-rule"></span><p>Gracia. Verdad.<br>Una fe que se vive.</p></div></section>
<section id="preguntas" aria-labelledby="preguntas-title"><div class="q-list-heading"><h2 id="preguntas-title">¿Qué te estás preguntando?</h2><p id="q-count" role="status" aria-live="polite">10 respuestas para leer</p></div><div class="q-controls" id="q-controls" hidden><label for="q-search">Buscar una pregunta</label><input id="q-search" type="search" placeholder="Prueba: oración, IA, salvación…" autocomplete="off"><div class="q-filters" role="group" aria-label="Filtrar por tema"><button type="button" data-filter="all" aria-pressed="true">Todas</button>{filters}</div></div><div class="q-grid">{''.join(card(a,i) for i,a in enumerate(articles,1))}</div><p class="q-empty" id="q-empty" hidden>No encontramos esa pregunta. Prueba otra palabra o elige “Todas”.</p></section>
<section class="q-next"><span class="q-kicker">Continúa el camino</span><h2>Una respuesta puede abrir una lectura más profunda.</h2><p>Encuentra reflexiones, devocionales y obras de la fe cristiana para seguir estudiando.</p><div><a class="q-button q-button-outline" href="/recursos/devocionales/">Leer devocionales →</a><a class="q-button q-button-outline" href="/libreria/">Explorar la librería →</a></div></section></main>'''
    collection={'@type':'CollectionPage','name':NAME,'description':'Preguntas y respuestas bíblicas sobre salvación, oración, IA, matrimonio, Espíritu Santo y fin de los tiempos.','url':BASE+'/preguntas-cristianas/','inLanguage':'es','mainEntity':{'@type':'ItemList','numberOfItems':10,'itemListElement':[{'@type':'ListItem','position':i,'url':BASE+'/preguntas-cristianas/'+a['slug']+'/','name':a['title']} for i,a in enumerate(articles,1)]}}
    (OUT/'index.html').write_text(shell(NAME,collection['description'],'/preguntas-cristianas/',body,[collection,breadcrumbs()],True))
    sitemap=ROOT/'sitemap.xml'; text=sitemap.read_text()
    text=re.sub(r'\s*<url>\s*<loc>https://verbobiblia\.com/preguntas-cristianas/.*?</url>','',text,flags=re.S)
    urls=['/preguntas-cristianas/']+['/preguntas-cristianas/'+a['slug']+'/' for a in articles]
    entries='\n'.join(f'  <url><loc>{BASE}{url}</loc><lastmod>{DATE}</lastmod></url>' for url in urls)
    sitemap.write_text(text.replace('</urlset>',entries+'\n</urlset>'))
    print(f'Generados {len(articles)} artículos, índice y {len(urls)} rutas de sitemap.')

if __name__=='__main__':
    build()
