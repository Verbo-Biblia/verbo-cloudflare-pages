#!/usr/bin/env python3
"""Genera preguntas cristianas y su sitemap desde contenido local; sin red."""
import html
from datetime import date
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'preguntas-cristianas'
BASE = 'https://verbobiblia.com'
DATE = '2026-10-07'
NAME = 'Preguntas cristianas'

def esc(value):
    return html.escape(str(value), quote=True)

# Bilingüe (Juan, 31-10-2026: sin traducción en vivo). El inglés de cada pregunta está en data/en/<slug>.json.
EN = {}
def b(es, en): return f'<span data-idioma="es">{esc(es)}</span><span data-idioma="en" lang="en">{esc(en)}</span>'
def bh(es, en): return f'<span data-idioma="es">{es}</span><span data-idioma="en" lang="en">{en}</span>'
def bloque(tag, es, en, attrs=''):
    return f'<{tag}{attrs} data-idioma="es">{es}</{tag}><{tag}{attrs} data-idioma="en" lang="en">{en}</{tag}>'
MESES_EN = ('January','February','March','April','May','June','July','August','September','October','November','December')
TEMAS_EN = {'Biblia y estudio':'Bible and study','Dolor y esperanza':'Grief and hope','Esperanza y fin de los tiempos':'Hope and the end times',
    'Espíritu y discernimiento':'The Spirit and discernment','Fe y tecnología':'Faith and technology','Iglesia y comunidad':'Church and community',
    'Matrimonio y relaciones':'Marriage and relationships','Oración y vida diaria':'Prayer and daily life','Salvación y gracia':'Salvation and grace',
    'Trabajo y vida diaria':'Work and daily life','Vida cotidiana':'Everyday life','Vida cristiana':'Christian life'}

def schema(value):
    return json.dumps(value, ensure_ascii=False).replace('<', '\\u003c')

def shell(title, description, path, body, graphs, index=False, image_path='/historias/assets/images/estudio-biblico.webp', image_alt='Una Biblia abierta sobre una mesa de estudio'):
    return f'''<!DOCTYPE html>
<html lang="es"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)} | Verbo</title><meta name="description" content="{esc(description)}">
<link rel="canonical" href="{BASE}{path}">
<meta property="og:title" content="{esc(title)} | Verbo"><meta property="og:description" content="{esc(description)}">
<meta property="og:url" content="{BASE}{path}"><meta property="og:type" content="{'website' if index else 'article'}"><meta property="og:locale" content="es_419"><meta property="og:locale:alternate" content="en_US">
<meta property="og:image" content="{BASE}{image_path}"><meta property="og:image:alt" content="{esc(image_alt)}">
<meta name="twitter:card" content="summary_large_image"><meta name="theme-color" content="#0a2037">
<link rel="icon" href="/biblia/assets/icons/icon-192.png">
<link rel="stylesheet" href="/preguntas-cristianas/assets/questions.css?v=20261007-paleta-portada"><link rel="stylesheet" href="/assets/depth/depth.css?v=20261015-3d">{'<link rel="stylesheet" href="/preguntas-cristianas/assets/q-space.css?v=20261031-bilingue">' if index else ''}
<script type="application/ld+json">{schema({'@context':'https://schema.org','@graph':graphs})}</script>
</head><body>
<a class="skip-link" href="#contenido">{b('Ir al contenido','Skip to content')}</a>
<header class="q-header"><a class="q-brand" href="/">Verbo<span>{b('biblioteca bíblica digital','digital Bible library')}</span></a><nav aria-label="Navegación principal"><a href="/">{b('Inicio','Home')}</a><a href="/preguntas-cristianas/" aria-current="{'page' if index else 'true'}">{b('Preguntas cristianas','Christian questions')}</a><a href="/libreria/">{b('Librería','Library')}</a><a href="/software/">Software</a></nav></header>
{body}
<footer class="q-footer"><p>Verbo · {b('La Palabra para la vida de hoy.','The Word for life today.')}</p><nav aria-label="Más de Verbo"><a href="/preguntas-cristianas/">{b('Todas las preguntas','All questions')}</a><a href="/recursos/devocionales/">{b('Devocionales','Devotionals')}</a><a href="/acerca/">{b('Acerca de Verbo','About Verbo')}</a></nav></footer>
{'<script src="/preguntas-cristianas/assets/questions.js?v=20261031-bilingue" defer></script>' if index else ''}
{'<script src="/assets/depth/depth.js?v=20261015-3d3" defer data-enter=".q-list-heading,.q-controls,.q-card" data-through=".q-intro" data-tilt=".q-card" data-sky="0.7"></script><script src="/preguntas-cristianas/assets/q-space.js?v=20261031-bilingue" defer></script>' if index else '<script src="/assets/depth/depth.js?v=20261015-3d3" defer data-progress data-enter=".q-related,.q-sources" data-sky="0.35"></script>'}
</body></html>
'''

def card(a, number):
    e=EN[a['slug']]
    return f'''<a class="q-card" href="/preguntas-cristianas/{esc(a['slug'])}/" data-question data-topic="{esc(a['topic'])}" data-search="{esc(' '.join([a['title'],a['description'],a['topic'],e['title'],e['description'],e['topic']]))}"><span class="q-card-top"><span>{b(a['topic'],e['topic'])}</span><span class="q-number">{number:02}</span></span><h2>{b(a['title'],e['title'])}</h2>{bloque('p',esc(a['description']),esc(e['description']))}<span class="q-read">{b('Leer la respuesta','Read the answer')}</span></a>'''

def breadcrumbs(a=None):
    items=[{'@type':'ListItem','position':1,'name':'Verbo','item':BASE+'/'},{'@type':'ListItem','position':2,'name':NAME,'item':BASE+'/preguntas-cristianas/'}]
    if a: items.append({'@type':'ListItem','position':3,'name':a['title'],'item':BASE+'/preguntas-cristianas/'+a['slug']+'/'})
    return {'@type':'BreadcrumbList','itemListElement':items}

def build():
    articles=json.loads((OUT/'data/articles.json').read_text())
    for a in articles:
        e=EN[a['slug']]=json.loads((OUT/'data/en'/(a['slug']+'.json')).read_text())
        assert len(e['sections'])==len(a['sections']) and all(len(x[1])==len(y[1]) for x,y in zip(e['sections'],a['sections'])), a['slug']
    assert articles and len({a['slug'] for a in articles})==len(articles)
    for a in articles:
        article_date = a.get('date', DATE)
        parsed_date = date.fromisoformat(article_date)
        months = ('enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre')
        date_label = f'{parsed_date.day} de {months[parsed_date.month - 1]} de {parsed_date.year}'
        assert re.fullmatch(r'[a-z0-9-]+',a['slug'])
        for source in a['sources']:
            assert (ROOT/'recursos/articulos-y-reflexiones'/source/'index.html').exists()
        path='/preguntas-cristianas/'+a['slug']+'/'
        e=EN[a['slug']]
        date_en=f'{MESES_EN[parsed_date.month-1]} {parsed_date.day}, {parsed_date.year}'
        toc=''.join(f'<a href="#parte-{i}">{b(s[0],e["sections"][i-1][0])}</a>' for i,s in enumerate(a['sections'],1))
        sections=''.join(f'<section aria-labelledby="parte-{i}"><h2 id="parte-{i}">{b(s[0],e["sections"][i-1][0])}</h2>'+''.join(bloque('p',esc(p),esc(pe)) for p,pe in zip(s[1],e['sections'][i-1][1]))+'</section>' for i,s in enumerate(a['sections'],1))
        readings=''.join(f'<li><a href="/recursos/articulos-y-reflexiones/{esc(s)}/">{re.sub(r"<[^>]+>","",re.search(r"<h1[^>]*>(.*?)</h1>",(ROOT/"recursos/articulos-y-reflexiones"/s/"index.html").read_text(),re.S)[1])}</a></li>' for s in a['sources'])
        if a.get('base_note'):
            base_note = b(a['base_note'], 'Original reflection by Verbo based on the Bible passages listed.')
            editorial_note = b('Artículo preparado para esta sección a partir de los pasajes bíblicos indicados.', 'Article prepared for this section from the Bible passages listed.')
        else:
            base_note = b('Base editorial: estudios pastorales sobre el Espíritu Santo y Hechos 1:4–5, consultados para la referencia doctrinal de Verbo.', "Editorial basis: pastoral studies on the Holy Spirit and Acts 1:4–5, consulted for Verbo's doctrinal reference.")
            editorial_note = b('Artículo preparado para esta sección a partir de la enseñanza bíblica y los escritos pastorales que orientan Verbo.', 'Article prepared for this section from the biblical teaching and pastoral writings that guide Verbo.')
        extra=''
        if a['slug']=='ansiedad-falta-de-fe-cristiano':
            extra=bloque('p','Orientación complementaria sobre cuándo buscar ayuda: <a href="https://www.nimh.nih.gov/health/publications/espanol/trastorno-de-ansiedad-generalizada-cuando-no-se-pueden-controlar-las-preocupaciones-new">Instituto Nacional de la Salud Mental</a>.','Further guidance on when to seek help: <a href="https://www.nimh.nih.gov/health/publications/generalized-anxiety-disorder-gad">National Institute of Mental Health</a>.')
        related=[r for r in articles if r['slug']!=a['slug'] and r['topic']==a['topic']]
        related += [r for r in articles if r['slug']!=a['slug'] and r not in related]
        rel=''.join(f'<a href="/preguntas-cristianas/{esc(r["slug"])}/">{b(r["title"],EN[r["slug"]]["title"])} <span aria-hidden="true">→</span></a>' for r in related[:2])
        minutos=max(2,round(len(' '.join([a['answer']]+[p for s in a['sections'] for p in s[1]]).split())/180))
        words=len(' '.join([a['answer']]+[p for s in a['sections'] for p in s[1]]).split())
        image_path='/historias/assets/images/estudio-biblico.webp'
        image_alt='Una Biblia abierta sobre una mesa de estudio'
        illustration=''
        if a['slug']=='musica-cristiana-inteligencia-artificial':
            image_path='/preguntas-cristianas/assets/images/musica-ia-biblia.webp'
            image_alt='Biblia abierta, auriculares y una computadora con una onda musical sobre una mesa iluminada'
            illustration=f'<figure class="q-illustration"><img src="{image_path}" alt="{image_alt}" width="1200" height="800" loading="lazy" decoding="async"><figcaption>{b('La tecnología como herramienta; la Palabra como criterio. Ilustración creada con IA para Verbo.','Technology as a tool; the Word as the standard. Illustration made with AI for Verbo.')}</figcaption></figure>'
        body=f'''<main id="contenido" class="q-article-shell"><nav class="q-breadcrumb" aria-label="Ruta"><a href="/">{b('Inicio','Home')}</a><span aria-hidden="true">/</span><a href="/preguntas-cristianas/">{b('Preguntas cristianas','Christian questions')}</a></nav>
<article><header class="q-article-heading"><span class="q-kicker">{b(a['topic'],e['topic'])}</span><h1>{b(a['title'],e['title'])}</h1>{bloque('p',esc(a['description']),esc(e['description']),' class="q-lede"')}<p class="q-meta">{bh(f'Redacción de Verbo · <time datetime="{article_date}">{date_label}</time> · {minutos} min de lectura', f'Written by Verbo · <time datetime="{article_date}">{date_en}</time> · {minutos} min read')}</p></header>
<div class="q-answer"><span class="q-kicker">{b('La respuesta breve','The short answer')}</span>{bloque('p',esc(a['answer']),esc(e['answer']))}</div>
{illustration}<div class="q-reading-layout"><aside><nav class="q-toc" aria-label="En este artículo"><strong>{b('En esta respuesta','In this answer')}</strong>{toc}<a href="#para-profundizar">{b('Para profundizar','To go deeper')}</a></nav></aside><div class="q-reading">{sections}
<section class="q-sources" id="para-profundizar"><h2>{b('Para profundizar','To go deeper')}</h2>{bloque('p',esc('Lee los pasajes completos: '+'; '.join(a['passages'])+'. Esta respuesta ofrece la lectura pastoral de Verbo; las diferencias entre interpretaciones deben examinarse en su contexto.'),esc('Read the full passages: '+'; '.join(e['passages'])+". This answer offers Verbo's pastoral reading; differences between interpretations should be weighed in their context."))}{('<ul>'+readings+'</ul>') if readings else '<p>'+base_note+'</p>'}{extra}<p class="q-meta">{editorial_note}</p></section>
</div></div></article><section class="q-related"><h2>{b('Sigue leyendo','Keep reading')}</h2>{rel}</section><a class="q-button q-button-outline" href="/preguntas-cristianas/">{b('Ver todas las preguntas →','See all questions →')}</a></main>'''
        article={'@type':'Article','headline':a['title'],'description':a['description'],'datePublished':article_date,'dateModified':article_date,'inLanguage':'es','author':{'@type':'Organization','name':'Verbo','url':BASE+'/'},'publisher':{'@type':'Organization','name':'Verbo','url':BASE+'/'},'mainEntityOfPage':BASE+path,'image':BASE+image_path,'wordCount':words}
        target=OUT/a['slug']; target.mkdir(parents=True,exist_ok=True)
        (target/'index.html').write_text(shell(a['title'],a['description'],path,body,[article,breadcrumbs(a)],image_path=image_path,image_alt=image_alt))
    # Las publicaciones recientes encabezan la colección; empates conservan el orden editorial.
    sorted_articles=sorted(articles,key=lambda a:a.get('date',DATE),reverse=True)
    topics=list(dict.fromkeys(a['topic'] for a in sorted_articles))
    filters=''.join(f'<button type="button" data-filter="{esc(t)}" aria-pressed="false">{b(t,TEMAS_EN[t])}</button>' for t in topics)
    body=f'''<main id="contenido" class="q-collection"><section class="q-intro"><div><span class="q-kicker">{b('Preguntas y respuestas del cristiano hoy',"Questions and answers for today's Christian")}</span><h1>{bh('La vida pregunta.<br><em>Volvamos a la Palabra.</em>','Life asks.<br><em>Let us return to the Word.</em>')}</h1>{bloque('p','Preguntas que atraviesan la fe y la vida de hoy. Respuestas bíblicas para pensar con calma, discernir y seguir a Cristo.','Questions that run through faith and life today. Biblical answers to think calmly, discern and follow Christ.',' class="q-lede"')}<a class="q-button" href="#preguntas">{b('Encuentra tu pregunta','Find your question')} <span aria-hidden="true">↓</span></a></div><div class="q-intro-note"><span class="q-big-number">{len(articles)}</span>{bloque('p','preguntas para empezar<br>una conversación necesaria.','questions to begin<br>a much-needed conversation.')}<span class="q-note-rule"></span>{bloque('p','Gracia. Verdad.<br>Una fe que se vive.','Grace. Truth.<br>A faith that is lived.')}</div></section>
<section id="preguntas" aria-labelledby="preguntas-title"><div class="q-list-heading"><h2 id="preguntas-title">{b('¿Qué te estás preguntando?','What are you asking?')}</h2><p id="q-count" role="status" aria-live="polite">{b(f'{len(articles)} respuestas para leer',f'{len(articles)} answers to read')}</p></div><div class="q-controls" id="q-controls" hidden><label for="q-search">{b('Buscar una pregunta','Search for a question')}</label><input id="q-search" type="search" placeholder="Prueba: oración, IA, salvación… / Try: prayer, AI, salvation…" autocomplete="off"><div class="q-filters" role="group" aria-label="Filtrar por tema"><button type="button" data-filter="all" aria-pressed="true">{b('Todas','All')}</button>{filters}</div></div><div class="q-grid">{''.join(card(a,i) for i,a in enumerate(sorted_articles,1))}</div><p class="q-empty" id="q-empty" hidden>{b('No encontramos esa pregunta. Prueba otra palabra o elige “Todas”.','We could not find that question. Try another word or choose “All”.')}</p></section>
<section class="q-next"><span class="q-kicker">{b('Continúa el camino','Keep going')}</span><h2>{b('Una respuesta puede abrir una lectura más profunda.','One answer can open a deeper reading.')}</h2>{bloque('p','Encuentra reflexiones, devocionales y obras de la fe cristiana para seguir estudiando.','Find reflections, devotionals and works of the Christian faith to keep studying.')}<div><a class="q-button q-button-outline" href="/recursos/devocionales/">{b('Leer devocionales →','Read devotionals →')}</a><a class="q-button q-button-outline" href="/libreria/">{b('Explorar la librería →','Explore the library →')}</a></div></section></main>'''
    collection={'@type':'CollectionPage','name':NAME,'description':'Preguntas y respuestas bíblicas sobre salvación, oración, IA, matrimonio, Espíritu Santo y fin de los tiempos.','url':BASE+'/preguntas-cristianas/','inLanguage':'es','mainEntity':{'@type':'ItemList','numberOfItems':len(articles),'itemListElement':[{'@type':'ListItem','position':i,'url':BASE+'/preguntas-cristianas/'+a['slug']+'/','name':a['title']} for i,a in enumerate(sorted_articles,1)]}}
    (OUT/'index.html').write_text(shell(NAME,collection['description'],'/preguntas-cristianas/',body,[collection,breadcrumbs()],True))
    sitemap=ROOT/'sitemap.xml'; text=sitemap.read_text()
    text=re.sub(r'\s*<url>\s*<loc>https://verbobiblia\.com/preguntas-cristianas/.*?</url>','',text,flags=re.S)
    urls=['/preguntas-cristianas/']+['/preguntas-cristianas/'+a['slug']+'/' for a in articles]
    modified_dates = {'/preguntas-cristianas/': max(a.get('date', DATE) for a in articles), **{'/preguntas-cristianas/'+a['slug']+'/': a.get('date', DATE) for a in articles}}
    entries='\n'.join(f'  <url><loc>{BASE}{url}</loc><lastmod>{modified_dates[url]}</lastmod></url>' for url in urls)
    sitemap.write_text(text.replace('</urlset>',entries+'\n</urlset>'))
    print(f'Generados {len(articles)} artículos, índice y {len(urls)} rutas de sitemap.')

if __name__=='__main__':
    build()

    # Restaurar el pie común tras generar páginas públicas.
    from pie_comun import apply as apply_common_footer
    apply_common_footer()
