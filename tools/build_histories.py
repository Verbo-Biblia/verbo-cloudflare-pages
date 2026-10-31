#!/usr/bin/env python3
"""Renderiza Historias desde contenido editorial revisado y versionado; uso offline."""
import html
from datetime import date
import json
import re
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
    if a.get('art') in ART: return a['art']
    slug=a['slug']
    if slug in {'william-tyndale','casiodoro-de-reina','john-bunyan'}:return 'palabra-impresa'
    if slug in {'corrie-ten-boom','william-wilberforce','george-muller','amy-carmichael','dietrich-bonhoeffer','pandita-ramabai','charles-spurgeon'}:return 'puertas-abiertas'
    if slug in {'jim-elliot','elisabeth-elliot','william-carey','hudson-taylor','samuel-morris'}:return 'caminos-de-servicio'
    return 'estudio-biblico'

def art_url(key):return '/historias/assets/images/'+key+'.webp'

# Historias que ya son novela gráfica: se leen en el lector de «Héroes de la fe» (/juegos/heroes-de-la-fe/jugar/?libro=…).
# La portada (/historias/assets/libros/<slug>.webp) la compone herramientas/portadas.py de ese juego. Las demás
# historias quedan como texto hasta tener su libro (pedido de Juan, 31 de octubre de 2026).
NOVELAS = {
    'george-muller': {'libro': 'muller', 'lema': 'El padre de los huérfanos', 'capitulos': 28,
        'resumen': 'Su vida completa, de la cárcel de Wolfenbüttel a las cinco casas de Ashley Down, contada como un cómic que se lee página a página. Habla con sus propias palabras, tomadas de su autobiografía; los hechos vienen de las fuentes.'},
}
def portada_libro(slug):return '/historias/assets/libros/'+slug+'.webp'
def leer_libro(slug):return '/juegos/heroes-de-la-fe/jugar/?libro='+NOVELAS[slug]['libro']+'&volver=/historias/'+slug+'/'
def libro_html(a):
    n=NOVELAS[a['slug']];leer=leer_libro(a['slug']);titulo=a['name']+': '+n['lema']
    return f'''<section class="libro" aria-labelledby="libro-titulo"><a class="libro-portada" href="{esc(leer)}"><img src="{portada_libro(a['slug'])}" alt="Portada de la historia interactiva «{esc(titulo)}»" width="800" height="1200" decoding="async"></a><div class="libro-texto"><span class="kicker">HISTORIA INTERACTIVA · {n['capitulos']} CAPÍTULOS</span><h2 id="libro-titulo">{esc(titulo)}</h2><p>{esc(n['resumen'])}</p><a class="button libro-leer" href="{esc(leer)}">Leer la historia interactiva <span aria-hidden="true">▶</span></a><p class="libro-nota">En el teléfono se lee a pantalla completa y con el teléfono de lado.</p></div></section>'''

def shell(title, description, path, body, schemas, script=False, art='estudio-biblico', imagen=None, imagen_alt=None):
    og=BASE+(imagen or art_url(art));og_alt=imagen_alt or 'Ilustración temática: '+ART[art]
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
<meta property="og:locale" content="es_419"><meta property="og:locale:alternate" content="en_US">
<meta property="og:image" content="{og}">
<meta property="og:image:alt" content="{esc(og_alt)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="{og}">
<meta name="theme-color" content="#0a2037">
<link rel="icon" href="/biblia/assets/icons/icon-192.png">
<link rel="stylesheet" href="/historias/assets/historias.css?v=20261031-estanteria">
<link rel="stylesheet" href="/assets/depth/depth.css?v=20261015-3d">
<script type="application/ld+json">{ld({'@context':'https://schema.org','@graph':schemas})}</script>
</head>
<body>
<a class="skip-link" href="#contenido">Ir al contenido</a>
<header class="site-header"><a class="brand" href="/">Verbo<span>biblioteca bíblica digital</span></a><nav aria-label="Navegación principal"><a href="/">Inicio</a><a href="/software/">Software</a><a href="/recursos/">Recursos</a><a href="/historias/" aria-current="{'page' if path == '/historias/' else 'true'}">Historias</a></nav></header>
{body}
<footer class="site-footer"><p>Verbo · Para estudiar, servir y recordar.</p><nav aria-label="Información"><a href="/historias/">Todas las historias</a><a href="/acerca/">Acerca de Verbo</a><a href="/licencias/">Fuentes y licencias</a></nav></footer>
{'<script src="/historias/assets/historias.js?v=20261006-historias" defer></script>' if script else ''}
{'<script src="/assets/depth/depth.js?v=20261015-3d3" defer data-enter=".estante,.proximas,.libro-tarjeta" data-tilt=".libro-tarjeta" data-sky="0.6"></script>' if path == '/historias/' else '<script src="/assets/depth/depth.js?v=20261015-3d3" defer data-progress data-enter=".article-illustration,.reflection,.related,.sources" data-sky="0.35"></script>'}
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
    libro=a['slug'] in NOVELAS
    imagen=portada_libro(a['slug']) if libro else art_url(art)
    marca='<span class="cover-libro">HISTORIA INTERACTIVA</span>' if libro else '<span class="cover-pronto">Pronto: historia interactiva</span>'
    return f'''<a class="story-card{' story-card-libro' if libro else ''}" href="/historias/{esc(a['slug'])}/" data-story data-century="{a['century']}" data-search="{esc(searchable)}"><div class="story-cover"><img class="story-cover-image" src="{imagen}" alt="" width="1200" height="800" loading="lazy" decoding="async"><span class="cover-century">SIGLO {roman(a['century'])}</span>{marca}<span class="cover-name">{esc(a['name'])}</span><span class="cover-years">{esc(a['years'])}</span></div><div class="story-card-body"><span class="kicker">{esc(a['topic'])}</span><h3>{esc(a['title'])}</h3><p>{esc(a['description'])}</p><span class="read-link">{'Leer la historia interactiva' if libro else 'Leer historia'}</span></div></a>'''

def roman(c):return {16:'XVI',17:'XVII',18:'XVIII',19:'XIX',20:'XX'}[c]

def build():
    articles=json.loads((OUT/'data/articles.json').read_text())
    assert len(articles)==len({a['slug'] for a in articles})
    org={'@type':'Organization','name':'Verbo','url':BASE+'/'}
    for a in articles:
        article_date = a.get('date', DATE)
        parsed_date = date.fromisoformat(article_date)
        months = ('enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre')
        date_label = f'{parsed_date.day} de {months[parsed_date.month - 1]} de {parsed_date.year}'
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
<header class="article-heading"><span class="kicker">{esc(a['topic'])} · Siglo {roman(a['century'])}</span><h1>{esc(a['title'])}</h1><p class="lede">{esc(a['description'])}</p><p class="article-details">{esc(a['name'])} · {esc(a['years'])} · {esc(a['place'])}</p><p class="article-byline">Por Verbo · Revisión documental: <time datetime="{article_date}">{date_label}</time> · {max(2,round(words/180))} min de lectura</p></header>
{libro_html(a) if a['slug'] in NOVELAS else f'<figure class="article-illustration"><img src="{art_url(artwork(a))}" alt="Ilustración temática: {esc(ART[artwork(a)])}" width="1200" height="800" decoding="async"><figcaption>Ilustración temática generada con IA para Verbo. No representa a {esc(a["name"])} ni una escena histórica documentada.</figcaption></figure>'}
<nav class="article-toc" aria-label="En esta historia"><strong>En esta historia</strong>{toc}<a href="#reflexion">Para reflexionar a la luz de la Biblia</a><a href="#fuentes">Bibliografía y fuentes</a></nav>
<div class="article-reading">{''.join(chapters)}
<section class="reflection" aria-labelledby="reflexion"><span class="kicker">REFLEXIÓN DE VERBO</span><h2 id="reflexion">Para reflexionar a la luz de la Biblia</h2><a class="passage-link" href="{esc(bible)}">Leer {esc(passage[0])} en la Biblia →</a>{reflection}</section>
<section class="source-section" aria-labelledby="fuentes"><h2 id="fuentes">Bibliografía y fuentes consultadas</h2><p>Las referencias numeradas señalan las fuentes del relato histórico. La reflexión bíblica es una lectura editorial de Verbo.</p><ol class="sources">{source_html}</ol><p class="source-date">Consulta documental: {date_label}.</p><details class="source-note"><summary>Sobre las fuentes y la redacción</summary><p>{esc(a['review_note'])}</p><p>Texto original de Verbo basado en las fuentes indicadas. Las obras citadas conservan los derechos de sus respectivos autores y titulares. Este artículo no reproduce sus fotografías, cartas ni capítulos.</p></details></section>
</div>
</article>
<aside class="related" aria-labelledby="related-title"><span class="kicker">SIGUE LEYENDO</span><h2 id="related-title">Otras vidas, otras formas de servir.</h2><div>{rel}</div><a class="all-stories" href="/historias/">Volver a todas las historias →</a></aside>
</main>'''
        schema={'@type':'Article','@id':BASE+path+'#article','headline':a['title'],'description':a['description'],'inLanguage':'es','url':BASE+path,'mainEntityOfPage':BASE+path,'datePublished':article_date,'dateModified':article_date,'author':org,'publisher':org,'articleSection':NAME,'about':{'@type':'Person','name':a['name']},'wordCount':words,'image':BASE+art_url(artwork(a)),'citation':[src['url'] for src in a['sources']]}
        target=OUT/a['slug'];target.mkdir(exist_ok=True)
        if a['slug'] in NOVELAS:schema['image']=BASE+portada_libro(a['slug'])
        (target/'index.html').write_text(shell(a['title'],a['description'],path,body,[schema,breadcrumb(a['name'],BASE+path)],art=artwork(a),
            imagen=portada_libro(a['slug']) if a['slug'] in NOVELAS else None,
            imagen_alt=('Portada de la historia interactiva «'+a['name']+': '+NOVELAS[a['slug']]['lema']+'»') if a['slug'] in NOVELAS else None))
    # Orden de publicación; el filtro por siglo conserva el recorrido histórico.
    sorted_articles=sorted(articles,key=lambda a:a.get('date',DATE),reverse=True)
    centuries=''.join(f'<option value="{c}">Siglo {roman(c)}</option>' for c in range(16,21))
    libros=''.join(f'<a class="libro-tarjeta" href="/historias/{esc(a["slug"])}/"><img src="{portada_libro(a["slug"])}" alt="Portada de «{esc(a["name"])}: {esc(NOVELAS[a["slug"]]["lema"])}»" width="800" height="1200" loading="lazy" decoding="async"><span>{esc(a["name"])}</span><small>{esc(NOVELAS[a["slug"]]["lema"])} · {NOVELAS[a["slug"]]["capitulos"]} capítulos</small></a>' for a in articles if a['slug'] in NOVELAS)
    estante=f'<section class="estante" aria-labelledby="estante-titulo"><div class="collection-heading"><div><span class="kicker">HISTORIAS INTERACTIVAS</span><h2 id="estante-titulo">Vidas reales para leer como un cómic.</h2></div><p>Un libro completo por cada vida, con sus propias palabras y los hechos de las fuentes. Las demás historias irán llegando en este formato.</p></div><div class="estante-libros">{libros}</div></section>' if libros else ''
    # Juan (31-10-2026): la sección entera es la estantería; no hay otro formato de historias. Las vidas que aún no
    # son historia interactiva aparecen como «Próximamente» (sin enlace); sus páginas de texto siguen en su dirección
    # hasta tener su libro, para no perder lo que los buscadores ya conocen.
    pronto=''.join(f'<li class="pronto-libro" data-century="{a["century"]}"><span class="pronto-siglo">Siglo {roman(a["century"])}</span><strong>{esc(a["name"])}</strong><small>{esc(a["years"])} · {esc(a["topic"])}</small></li>' for a in sorted([a for a in articles if a['slug'] not in NOVELAS],key=lambda a:(a['century'],re.sub(r'\D','',a['years'])[:4])))
    body=f'''<main id="contenido" class="collection-shell estanteria">
<section class="estante" aria-labelledby="estante-titulo"><span class="kicker">VERBO · HISTORIAS INTERACTIVAS</span><h1 id="estante-titulo">Vidas reales para leer como un cómic.</h1><p class="lede">Mujeres y hombres que confiaron en Dios, contados de principio a fin en viñetas, con sus propias palabras y los hechos de las fuentes. Se leen en la computadora o en el teléfono, de lado y a pantalla completa.</p><div class="estante-libros">{libros}</div></section>
<section class="proximas" aria-labelledby="proximas-titulo"><span class="kicker">PRÓXIMAMENTE</span><h2 id="proximas-titulo">Las siguientes vidas de la colección.</h2><p>Cada una llegará como historia interactiva.</p><ol class="pronto-lista">{pronto}</ol></section>
<section class="editorial-method" aria-labelledby="method-title"><span class="kicker">NUESTRA FORMA DE CONTAR</span><h2 id="method-title">Recordar con gratitud. Contar solo lo que consta.</h2><p>Cada historia parte de fuentes identificadas: autobiografías, cartas, archivos y biografías serias. Las palabras de los protagonistas son citas de esas fuentes, y lo que no se puede comprobar no se cuenta. Jesucristo es el centro de nuestra fe y las Escrituras orientan la lectura.</p><details><summary>Cómo usamos las fuentes</summary><p>Al final de cada historia están sus fuentes. Distinguimos documentos, memorias personales e interpretaciones; cuando las fuentes no coinciden en un dato, usamos la versión del testimonio directo o lo decimos con «cerca de». Los personajes sin nombre representan a personas reales cuyos nombres no constan. La expresión «siervos de Cristo» describe la perspectiva cristiana de esta colección; no implica aprobar todas las enseñanzas o decisiones de cada protagonista.</p></details></section>
</main>'''
    itemlist={'@type':'ItemList','numberOfItems':len(articles),'itemListElement':[{'@type':'ListItem','position':i,'name':a['title'],'url':BASE+'/historias/'+a['slug']+'/'} for i,a in enumerate(sorted_articles,1)]}
    collection={'@type':'CollectionPage','@id':BASE+'/historias/#collection','name':NAME,'description':DESCRIPTION,'url':BASE+'/historias/','inLanguage':'es','publisher':org,'mainEntity':itemlist}
    (OUT/'index.html').write_text(shell(NAME,DESCRIPTION,'/historias/',body,[collection,breadcrumb()]))
    sitemap=ROOT/'sitemap.xml';text=sitemap.read_text()
    text=re.sub(r'<url>\s*<loc>https://verbobiblia.com/historias/[^<]*</loc>.*?</url>','',text,flags=re.S)
    modified_dates = {'/historias/': max(a.get('date', DATE) for a in articles), **{'/historias/'+a['slug']+'/': a.get('date', DATE) for a in articles}}
    entries=''.join(f'  <url>\n    <loc>{BASE}{p}</loc>\n    <lastmod>{modified_dates[p]}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>{priority}</priority>\n  </url>\n' for p,priority in [('/historias/','0.8')]+[('/historias/'+a['slug']+'/','0.6') for a in articles])
    text=text.replace('</urlset>',entries+'</urlset>')
    text='\n'.join(line.rstrip() for line in text.splitlines() if line.strip())+'\n'
    sitemap.write_text(text)
    print(f'Generadas {len(articles)} historias, índice y entradas de sitemap.')

if __name__=='__main__':
    build()

    # Restaurar el pie común tras generar páginas públicas.
    from pie_comun import apply as apply_common_footer
    apply_common_footer()
