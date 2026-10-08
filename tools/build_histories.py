#!/usr/bin/env python3
"""Renderiza Historias desde contenido editorial revisado y versionado; uso offline."""
import html
import json
from pathlib import Path
from urllib.parse import urlencode

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'historias'
DATE = '2026-10-06'
BASE = 'https://verbobiblia.com'
NAME = 'Historias de siervos de Cristo'
DESCRIPTION = 'Historias reales de cristianos de los últimos cinco siglos: Billy Graham, Corrie ten Boom, los Elliot y más, con contexto, bibliografía y fuentes.'

def esc(v): return html.escape(str(v), quote=True)
def ld(value): return json.dumps(value, ensure_ascii=False).replace('<','\\u003c')

ART = {
    'estudio-biblico': 'Una Biblia abierta sobre un escritorio junto a una ventana',
    'palabra-impresa': 'Una prensa de imprenta antigua, libros y hojas sobre una mesa',
    'puertas-abiertas': 'Una puerta abierta hacia una mesa preparada para recibir al prójimo',
    'caminos-de-servicio': 'Un bolso de viaje, un mapa y una brújula junto a una ventana',
}

def artwork(a):
    slug=a['slug']
    if slug in {'william-tyndale','casiodoro-de-reina','john-bunyan'}:return 'palabra-impresa'
    if slug in {'corrie-ten-boom','william-wilberforce','george-muller','amy-carmichael','dietrich-bonhoeffer','pandita-ramabai','charles-spurgeon'}:return 'puertas-abiertas'
    if slug in {'jim-elliot','elisabeth-elliot','william-carey','hudson-taylor','samuel-morris'}:return 'caminos-de-servicio'
    return 'estudio-biblico'

def art_url(key):return '/historias/assets/images/'+key+'.webp'

def shell(title, description, path, body, schemas, script=False, art='estudio-biblico'):
    return f'''<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{esc(title)} | Verbo</title>
<meta name="description" content="{esc(description)}">
<link rel="canonical" href="{BASE}{path}">
<meta property="og:title" content="{esc(title)} | Verbo">
<meta property="og:description" content="{esc(description)}">
<meta property="og:url" content="{BASE}{path}">
<meta property="og:type" content="{'website' if path == '/historias/' else 'article'}">
<meta property="og:locale" content="es_ES">
<meta property="og:image" content="{BASE}{art_url(art)}">
<meta property="og:image:alt" content="Ilustración temática: {esc(ART[art])}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="{BASE}{art_url(art)}">
<meta name="theme-color" content="#0a2037">
<link rel="icon" href="/biblia/assets/icons/icon-192.png">
<link rel="stylesheet" href="/historias/assets/historias.css?v=20261007-paleta-portada">
<script type="application/ld+json">{ld({'@context':'https://schema.org','@graph':schemas})}</script>
</head>
<body>
<a class="skip-link" href="#contenido">Ir al contenido</a>
<header class="site-header"><a class="brand" href="/">Verbo<span>biblioteca bíblica digital</span></a><nav aria-label="Navegación principal"><a href="/">Inicio</a><a href="/verbo-desktop/">Desktop</a><a href="/recursos/">Recursos</a><a href="/historias/" aria-current="{'page' if path == '/historias/' else 'true'}">Historias</a></nav></header>
{body}
<footer class="site-footer"><p>Verbo · Para estudiar, servir y recordar.</p><nav aria-label="Información"><a href="/historias/">Todas las historias</a><a href="/acerca/">Acerca de Verbo</a><a href="/licencias/">Fuentes y licencias</a></nav></footer>
{'<script src="/historias/assets/historias.js?v=20261006-historias" defer></script>' if script else ''}
</body>
</html>
'''

def breadcrumb(name=None,url=None):
    entries=[{'@type':'ListItem','position':1,'name':'Verbo','item':BASE+'/'} ,{'@type':'ListItem','position':2,'name':NAME,'item':BASE+'/historias/'}]
    if name:entries.append({'@type':'ListItem','position':3,'name':name,'item':url})
    return {'@type':'BreadcrumbList','itemListElement':entries}

def card(a):
    art=artwork(a)
    searchable=' '.join([a['name'],a['title'],a['description'],a['place'],a['topic']])
    return f'''<a class="story-card" href="/historias/{esc(a['slug'])}/" data-story data-century="{a['century']}" data-search="{esc(searchable)}"><div class="story-cover"><img class="story-cover-image" src="{art_url(art)}" alt="" width="1200" height="800" loading="lazy" decoding="async"><span class="cover-century">SIGLO {roman(a['century'])}</span><span class="cover-name">{esc(a['name'])}</span><span class="cover-years">{esc(a['years'])}</span></div><div class="story-card-body"><span class="kicker">{esc(a['topic'])}</span><h3>{esc(a['title'])}</h3><p>{esc(a['description'])}</p><span class="read-link">Leer historia <span aria-hidden="true">↗</span></span></div></a>'''

def roman(c):return {16:'XVI',17:'XVII',18:'XVIII',19:'XIX',20:'XX'}[c]

def build():
    articles=json.loads((OUT/'data/articles.json').read_text())
    assert len(articles)==len({a['slug'] for a in articles})
    org={'@type':'Organization','name':'Verbo','url':BASE+'/'}
    for a in articles:
        path='/historias/'+a['slug']+'/'
        source_html=''.join(f'<li id="fuente-{i}"><a href="{esc(src["url"])}">{esc(src["label"])}</a><span class="source-kind">{esc(src["kind"])}</span></li>' for i,src in enumerate(a['sources'],1))
        chapters=[]
        for i,section in enumerate(a['sections'],1):
            paragraphs=''
            for p in section['paragraphs']:
                assert all(1<=r<=len(a['sources']) for r in p['refs'])
                citations=' '.join(f'<a class="citation" href="#fuente-{r}" aria-label="Fuente {r}">[{r}]</a>' for r in p['refs'])
                paragraphs+=f'<p>{esc(p["text"])} {citations}</p>\n'
            chapters.append(f'<section aria-labelledby="parte-{i}"><h2 id="parte-{i}">{esc(section["heading"])}</h2>{paragraphs}</section>')
        passage=a['passage']
        bible='/biblia/?'+urlencode(dict(version='rv-verbo',book=passage[1],chapter=passage[2],verse=passage[3]))
        reflection=''.join(f'<p>{esc(p)}</p>' for p in a['reflection'])
        related=[r for r in articles if r['slug']!=a['slug'] and r['topic']==a['topic']]
        related+=[r for r in articles if r['slug']!=a['slug'] and r not in related and r['century']==a['century']]
        rel=''.join(f'<a href="/historias/{esc(r["slug"])}/">{esc(r["name"])} <span aria-hidden="true">→</span></a>' for r in related[:2])
        words=len(' '.join([p['text'] for s in a['sections'] for p in s['paragraphs']]+a['reflection']).split())
        toc=''.join(f'<a href="#parte-{i}">{esc(s["heading"])}</a>' for i,s in enumerate(a['sections'],1))
        body=f'''<main id="contenido" class="article-shell">
<nav class="breadcrumbs" aria-label="Ruta de navegación"><a href="/">Inicio</a><span aria-hidden="true">/</span><a href="/historias/">Historias</a><span aria-hidden="true">/</span><span>{esc(a['name'])}</span></nav>
<article>
<header class="article-heading"><span class="kicker">{esc(a['topic'])} · Siglo {roman(a['century'])}</span><h1>{esc(a['title'])}</h1><p class="lede">{esc(a['description'])}</p><p class="article-details">{esc(a['name'])} · {esc(a['years'])} · {esc(a['place'])}</p><p class="article-byline">Por Verbo · Revisión documental: <time datetime="{DATE}">6 de octubre de 2026</time> · {max(2,round(words/180))} min de lectura</p></header>
<figure class="article-illustration"><img src="{art_url(artwork(a))}" alt="Ilustración temática: {esc(ART[artwork(a)])}" width="1200" height="800" decoding="async"><figcaption>Ilustración temática generada con IA para Verbo. No representa a {esc(a["name"])} ni una escena histórica documentada.</figcaption></figure>
<nav class="article-toc" aria-label="En esta historia"><strong>En esta historia</strong>{toc}<a href="#reflexion">Para reflexionar a la luz de la Biblia</a><a href="#fuentes">Bibliografía y fuentes</a></nav>
<div class="article-reading">{''.join(chapters)}
<section class="reflection" aria-labelledby="reflexion"><span class="kicker">REFLEXIÓN DE VERBO</span><h2 id="reflexion">Para reflexionar a la luz de la Biblia</h2><a class="passage-link" href="{esc(bible)}">Leer {esc(passage[0])} en la Biblia →</a>{reflection}</section>
<section class="source-section" aria-labelledby="fuentes"><h2 id="fuentes">Bibliografía y fuentes consultadas</h2><p>Las referencias numeradas señalan las fuentes del relato histórico. La reflexión bíblica es una lectura editorial de Verbo.</p><ol class="sources">{source_html}</ol><p class="source-date">Consulta documental: 6 de octubre de 2026.</p><details class="source-note"><summary>Sobre las fuentes y la redacción</summary><p>{esc(a['review_note'])}</p><p>Texto original de Verbo basado en las fuentes indicadas. Las obras citadas conservan los derechos de sus respectivos autores y titulares. Este artículo no reproduce sus fotografías, cartas ni capítulos.</p></details></section>
</div>
</article>
<aside class="related" aria-labelledby="related-title"><span class="kicker">SIGUE LEYENDO</span><h2 id="related-title">Otras vidas, otras formas de servir.</h2><div>{rel}</div><a class="all-stories" href="/historias/">Volver a todas las historias →</a></aside>
</main>'''
        schema={'@type':'Article','@id':BASE+path+'#article','headline':a['title'],'description':a['description'],'inLanguage':'es','url':BASE+path,'mainEntityOfPage':BASE+path,'datePublished':DATE,'dateModified':DATE,'author':org,'publisher':org,'articleSection':NAME,'about':{'@type':'Person','name':a['name']},'wordCount':words,'image':BASE+art_url(artwork(a)),'citation':[src['url'] for src in a['sources']]}
        target=OUT/a['slug'];target.mkdir(exist_ok=True)
        (target/'index.html').write_text(shell(a['title'],a['description'],path,body,[schema,breadcrumb(a['name'],BASE+path)],art=artwork(a)))
    sorted_articles=sorted(articles,key=lambda a:(a['century'],a['slug']))
    centuries=''.join(f'<option value="{c}">Siglo {roman(c)}</option>' for c in range(16,21))
    body=f'''<main id="contenido" class="collection-shell">
<section class="collection-hero"><div><span class="kicker">VERBO · CRÓNICAS DEL CRISTIANISMO MODERNO</span><h1>Historias de<br><em>siervos de Cristo.</em></h1><p class="lede">Vidas reales. Fe puesta en práctica. Cinco siglos de personas que anunciaron el evangelio, abrieron sus hogares y sirvieron al prójimo.</p><p class="intro-detail">Desde la traducción de la Biblia hasta la misión y el cuidado de los vulnerables: relatos con contexto histórico, reflexión bíblica y fuentes para seguir leyendo.</p><a class="button" href="#historias">Explorar las 18 historias <span aria-hidden="true">↓</span></a></div><aside class="timeline" aria-label="Un recorrido por cinco siglos"><span class="timeline-label">FE QUE DEJÓ HUELLAS</span><ol><li><span>1526</span><a href="william-tyndale/">Tyndale y la Biblia en inglés</a></li><li><span>1678</span><a href="john-bunyan/">Bunyan y el peregrino</a></li><li><span>1807</span><a href="william-wilberforce/">La lucha contra la trata</a></li><li><span>1944</span><a href="corrie-ten-boom/">La casa de los ten Boom</a></li><li><span>1958</span><a href="elisabeth-elliot/">Elisabeth Elliot en Ecuador</a></li></ol><p>La historia de la iglesia también se cuenta en el servicio cotidiano.</p></aside></section>
<figure class="collection-illustration"><img src="{art_url('estudio-biblico')}" alt="Ilustración temática: {esc(ART['estudio-biblico'])}" width="1200" height="800" loading="lazy" decoding="async"><figcaption>Ilustraciones temáticas creadas con IA para Verbo; no son fotografías ni reproducciones de escenas históricas.</figcaption></figure>
<div class="collection-principle"><span>18 relatos</span><span>Siglos XVI–XX</span><span>Bibliografía en cada artículo</span></div>
<section class="featured-reading" aria-labelledby="featured-title"><div><span class="kicker">POR DÓNDE EMPEZAR</span><h2 id="featured-title">Cuatro vidas que invitan a mirar más de cerca.</h2></div><nav aria-label="Historias destacadas"><a href="billy-graham/"><span>01</span>Billy Graham <small>El anuncio de Jesucristo</small></a><a href="corrie-ten-boom/"><span>02</span>Corrie ten Boom <small>Un hogar frente a la persecución</small></a><a href="jim-elliot/"><span>03</span>Jim Elliot <small>Misión y memoria en Ecuador</small></a><a href="elisabeth-elliot/"><span>04</span>Elisabeth Elliot <small>El servicio después de la pérdida</small></a></nav></section>
<section id="historias" aria-labelledby="collection-title"><div class="collection-heading"><div><span class="kicker">LA COLECCIÓN</span><h2 id="collection-title">Historias para leer con calma.</h2></div><p>Elige una vida, un siglo o un tema.</p></div><div class="story-filters"><label>Buscar una historia<input id="story-search" type="search" placeholder="Nombre, país o tema…" autocomplete="off"></label><label>Recorrer por siglo<select id="story-century"><option value="all">Todos los siglos</option>{centuries}</select></label><button id="story-reset" type="button">Ver todas</button></div><p id="story-count" class="story-count" role="status" aria-live="polite">18 historias disponibles</p><div class="story-grid">{''.join(card(a) for a in sorted_articles)}</div><p id="story-empty" class="story-empty" hidden>No encontramos historias con esa búsqueda. Prueba otro nombre o siglo.</p></section>
<section class="editorial-method" aria-labelledby="method-title"><span class="kicker">NUESTRA FORMA DE CONTAR</span><h2 id="method-title">Recordar con gratitud. Leer con discernimiento.</h2><p>Estos relatos nacen del deseo de reconocer el servicio cristiano y aprender de vidas concretas. Cada persona pertenece a su tiempo: hay fidelidad, sufrimiento, decisiones valiosas y límites que deben nombrarse. Jesucristo es el centro de nuestra fe y las Escrituras orientan la reflexión.</p><details><summary>Cómo usamos las fuentes</summary><p>Consultamos archivos, museos, instituciones y estudios históricos. Las referencias acompañan los hechos y la bibliografía ofrece enlaces directos. Distinguimos documentos, memorias personales e interpretaciones. Cuando las fuentes no permiten asegurar un detalle, lo omitimos o explicamos su alcance.</p><p>La expresión «siervos de Cristo» describe la perspectiva cristiana de esta colección; no implica aprobar todas las enseñanzas o decisiones de cada protagonista. Los artículos son redacción original de Verbo. Las fuentes conservan sus derechos y no se reproducen sus fotografías, cartas ni capítulos.</p></details></section>
</main>'''
    itemlist={'@type':'ItemList','numberOfItems':len(articles),'itemListElement':[{'@type':'ListItem','position':i,'name':a['title'],'url':BASE+'/historias/'+a['slug']+'/'} for i,a in enumerate(sorted_articles,1)]}
    collection={'@type':'CollectionPage','@id':BASE+'/historias/#collection','name':NAME,'description':DESCRIPTION,'url':BASE+'/historias/','inLanguage':'es','publisher':org,'mainEntity':itemlist}
    (OUT/'index.html').write_text(shell(NAME,DESCRIPTION,'/historias/',body,[collection,breadcrumb()],True))
    sitemap=ROOT/'sitemap.xml';text=sitemap.read_text()
    import re
    text=re.sub(r'<url>\s*<loc>https://verbobiblia.com/historias/[^<]*</loc>.*?</url>','',text,flags=re.S)
    entries=''.join(f'  <url>\n    <loc>{BASE}{p}</loc>\n    <lastmod>{DATE}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>{priority}</priority>\n  </url>\n' for p,priority in [('/historias/','0.8')]+[('/historias/'+a['slug']+'/','0.6') for a in articles])
    text=text.replace('</urlset>',entries+'</urlset>')
    text='\n'.join(line.rstrip() for line in text.splitlines() if line.strip())+'\n'
    sitemap.write_text(text)
    print(f'Generadas {len(articles)} historias, índice y entradas de sitemap.')

if __name__=='__main__':build()
