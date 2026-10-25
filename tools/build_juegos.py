#!/usr/bin/env python3
"""Portal de juegos de Verbo, generado desde una sola fuente: juegos/catalogo.json.

Escribe /juegos/ (destacado, nuevos y cuadrícula con filtros), una página por categoría (/juegos/<categoría>/),
la ficha de cada juego (/juegos/<id>/, con el texto de juegos/<id>/ficha.json) y el bloque de juegos de la portada
(entre las marcas verbo:portal-juegos de /index.html). El juego en sí vive en /juegos/<id>/jugar/.

El texto va en HTML real y en español; el inglés viaja en data-en y lo pone /assets/secciones/secciones.js.
Uso: python3 tools/build_juegos.py   (después corre tools/pie_comun.py). Procedimiento en juegos/LEEME.md.
"""
import datetime,json,re,sys
from html import escape as e
from pathlib import Path
R=Path(__file__).resolve().parents[1]
BASE='https://verbobiblia.com'
HOY=datetime.date.today()
V='20261024-votos'
CATALOGO=json.loads((R/'juegos/catalogo.json').read_text())
JUEGOS=[g for g in CATALOGO['juegos'] if g.get('visible',True)]
CATS=CATALOGO['categorias']
GENEROS=CATALOGO['generos']
IMAGENES=json.loads((R/'imagenes/indice.json').read_text()) if (R/'imagenes/indice.json').exists() else []

def bi(es,en,tag='p',**attrs):
 """Elemento con texto ES visible y su versión EN en data-en (lo cambia secciones.js)."""
 a=''.join(f' {k.rstrip("_").replace("_","-")}="{e(str(v),quote=True)}"' for k,v in attrs.items() if v is not None)
 return f'<{tag} data-es="{e(es,quote=True)}" data-en="{e(en,quote=True)}"{a}>{e(es)}</{tag}>'
def ba(attr,es,en):return f' {attr}="{e(es,quote=True)}" data-es-{attr}="{e(es,quote=True)}" data-en-{attr}="{e(en,quote=True)}"'
def jd(o):return json.dumps(o,ensure_ascii=False).replace('</','<\\/')

def nuevo(g):
 d=datetime.date.fromisoformat(g['publicado']);return 0<=(HOY-d).days<21
def ficha(g):
 p=R/'juegos'/g['id']/'ficha.json'
 return json.loads(p.read_text()) if p.exists() else None
def portada(g,lang='es'):return g.get('portada_en',g['portada']) if lang=='en' else g['portada']

def chips(g,cat=True):
 c=CATS[g['categoria']];out=[]
 if cat:out.append(bi(c['es'],c['en'],'li',class_='v-chip v-chip--cat'))
 if g.get('movil'):out.append(bi('📱 Celular','📱 Phone','li',class_='v-chip'))
 if g.get('duracion_min'):out.append(f'<li class="v-chip">⏱ {g["duracion_min"]} min</li>')
 out.append('<li class="v-chip">'+'/'.join(l.upper() for l in g['idiomas'])+'</li>')
 return '<ul class="v-chips">'+''.join(out)+'</ul>'

def tarjeta(g,primera=False):
 carga=' loading="eager" fetchpriority="high"' if primera else ' loading="lazy"'
 ins=bi('Nuevo','New','span',class_='v-insignia v-insignia--nuevo',hidden=None if nuevo(g) else 'hidden')
 if g.get('destacado'):ins+=bi('Destacado','Featured','span',class_='v-insignia v-insignia--destacado')
 return (f'<article class="v-juego" data-cat="{g["categoria"]}" data-publicado="{g["publicado"]}"><div class="v-juego__portada">{ins}'
  f'<img src="{portada(g)}" data-shot-es="{portada(g)}" data-shot-en="{portada(g,"en")}" width="1280" height="720" alt=""{carga}></div>'
  f'<div class="v-juego__cuerpo"><h3><a href="/juegos/{g["id"]}/">'+bi(g['titulo']['es'],g['titulo']['en'],'span')+'</a></h3>'
  +bi(g['descripcion']['es'],g['descripcion']['en'])+chips(g)+'</div></article>')

def lista(juegos,clase='v-rejilla',filtrable=False,primera=False):
 li=''.join(f'<li data-cat="{g["categoria"]}" data-buscar="{e(" ".join([g["titulo"]["es"],g["titulo"]["en"],*libros(g)]),quote=True)}">'+tarjeta(g,primera and i==0)+'</li>' for i,g in enumerate(juegos))
 return f'<ul class="{clase}"'+(' data-portal-rejilla' if filtrable else '')+f'>{li}</ul>'

def nuevos():return sorted(JUEGOS,key=lambda g:(g['publicado'],g['id']),reverse=True)
def mas_jugados():
 # Orden manual del catálogo. Punto de conexión para estadísticas reales: window.VerboPortal.masJugados (portal.js).
 return sorted((g for g in JUEGOS if g.get('orden_mas_jugados')),key=lambda g:g['orden_mas_jugados'])
def destacado():return next((g for g in JUEGOS if g.get('destacado')),JUEGOS[0])

NAV=[('/juegos/','home.navGames','Juegos','siempre'),('/imagenes/','home.navImages','Imágenes',''),('/preguntas-cristianas/','home.navQuestions','Preguntas cristianas',''),
 ('/historias/','home.navHistories','Historias',''),('/software/','home.navSoftware','Software',''),('/apps/','home.navApps','Apps','')]
def barra(actual='/juegos/'):
 enl=''.join(f'<a href="{u}" class="{c}"'+(' aria-current="page"' if u==actual else '')+f' data-i18n="{k}">{t}</a>' for u,k,t,c in NAV)
 return ('<header class="portal-bar"><a class="portal-bar__marca" href="/">Verbo</a><nav class="portal-nav"'+ba('aria-label','Principal','Main')+'>'+enl+'</nav>'
  '<div id="uiLangSwitcher"'+ba('aria-label','Idioma','Language')+'><button data-lang="es" type="button">ES</button><button data-lang="en" type="button">EN</button></div></header>')

def migas(items):
 """items: [(url|None, es, en)]"""
 li=''.join('<li>'+(f'<a href="{u}">'+bi(es,en,'span')+'</a>' if u else bi(es,en,'span',aria_current='page'))+'</li>' for u,es,en in items)
 return '<nav class="v-migas portal-wrap"'+ba('aria-label','Ruta','Breadcrumb')+f'><ol>{li}</ol></nav>'
def ld_migas(items):
 return {'@context':'https://schema.org','@type':'BreadcrumbList','itemListElement':[{'@type':'ListItem','position':i+1,'name':es,'item':BASE+(u or '')} for i,(u,es,en) in enumerate(items)]}

def pagina(ruta,titulo,desc,cuerpo,schemas,og_img,infantil=False,scripts=''):
 """ruta: 'juegos/x/'; titulo y desc: (es,en). Escribe ruta/index.html."""
 te,tn=titulo;de,dn=desc;url=f'{BASE}/{ruta}'
 meta_inf='<meta name="verbo-publico" content="infantil">' if infantil else ''
 html=(f'<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
  f'<title data-es="{e(te,quote=True)}" data-en="{e(tn,quote=True)}">{e(te)}</title><meta name="description" content="{e(de,quote=True)}">'
  f'<link rel="canonical" href="{url}"><meta name="theme-color" content="#081b30"><meta name="google-adsense-account" content="ca-pub-4810728953852074">{meta_inf}'
  f'<meta property="og:type" content="website"><meta property="og:site_name" content="Verbo"><meta property="og:locale" content="es_419"><meta property="og:locale:alternate" content="en_US">'
  f'<meta property="og:title" content="{e(te,quote=True)}"><meta property="og:description" content="{e(de,quote=True)}"><meta property="og:url" content="{url}">'
  f'<meta property="og:image" content="{BASE}{og_img}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">'
  f'<meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="{BASE}{og_img}">'
  '<link rel="icon" type="image/png" sizes="192x192" href="/biblia/assets/icons/icon-192.png">'
  '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
  '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Nunito:wght@700;900&display=swap" rel="stylesheet">'
  f'<link rel="stylesheet" href="/assets/portal/portal.css?v={V}">'
  +''.join(f'<script type="application/ld+json">{jd(s)}</script>' for s in schemas)+
  f'</head><body class="portal"'+(' data-publico="infantil"' if infantil else '')+'><a class="skip" href="#contenido" data-i18n="home.skip">Ir al contenido</a>'+barra()+
  f'<main id="contenido">{cuerpo}</main>'
  '<script src="/biblia/assets/i18n.js?v=20261021-secciones"></script><script src="/biblia/assets/site-chrome.js?v=20261021-secciones"></script>'
  f'<script src="/assets/secciones/secciones.js?v={V}" defer></script><script src="/assets/portal/portal.js?v={V}" defer></script>{scripts}</body></html>')
 p=R/ruta/'index.html';p.parent.mkdir(parents=True,exist_ok=True);p.write_text(html)
 return ruta

def ld_lista(juegos,nombre):
 return {'@context':'https://schema.org','@type':'CollectionPage','name':nombre,'mainEntity':{'@type':'ItemList','itemListElement':[{'@type':'ListItem','position':i+1,'url':f'{BASE}/juegos/{g["id"]}/','name':g['titulo']['es']} for i,g in enumerate(juegos)]}}

def filtros():
 b=bi('Todos','All','button',type='button',class_='v-filtro',data_filtro='',aria_pressed='true')
 b+=''.join(bi(c['es'],c['en'],'button',type='button',class_='v-filtro',data_filtro=k,data_cat=k,aria_pressed='false') for k,c in CATS.items())
 return ('<form class="v-filtros" data-portal-filtros role="search">'+b+'<label class="v-buscar"><span aria-hidden="true">⌕</span>'+bi('Buscar un juego','Search for a game','span',class_='sr-only')+
  '<input type="search"'+ba('placeholder','Buscar por nombre…','Search by name…')+' autocomplete="off"></label></form>')

def destacado_html(g,nivel='h2'):
 return (f'<article class="v-destacado" data-cat="{g["categoria"]}"><a class="v-destacado__img" href="/juegos/{g["id"]}/" tabindex="-1" aria-hidden="true">'
  f'<img src="{portada(g)}" data-shot-es="{portada(g)}" data-shot-en="{portada(g,"en")}" width="1280" height="720" alt="" fetchpriority="high"></a>'
  '<div class="v-destacado__info">'+bi('Destacado','Featured','span',class_='v-chip v-chip--cat')+bi(g['titulo']['es'],g['titulo']['en'],nivel)+bi(g['descripcion']['es'],g['descripcion']['en'])+
  '<div class="v-botones">'+f'<a class="v-boton v-boton--jugar grande" href="{g["url_juego"]}">▶ '+bi('Jugar','Play','span')+'</a>'+
  f'<a class="v-boton v-boton--sec" href="/juegos/{g["id"]}/">'+bi('Ver el juego','About the game','span')+'</a></div></div></article>')

# ---------- /juegos/ ----------
def portal():
 g=destacado();lead_es='Juegos cristianos gratis para jugar en el navegador, sin instalar nada: aventuras, puzles, preguntas y novelas gráficas basadas en la Biblia y en vidas reales de fe. Hay juegos para los más pequeños, para niños, para jugar en familia y desafíos de estrategia. Todos funcionan en la computadora y casi todos en el celular, en español e inglés.'
 lead_en='Free Christian games to play in your browser, with nothing to install: adventures, puzzles, quizzes and graphic novels based on the Bible and on real lives of faith. There are games for little ones, for kids, for families to play together and strategy challenges. They all run on a computer and nearly all on phones, in English and Spanish.'
 c=('<section class="v-hero"><div class="portal-wrap">'+bi('Juegos cristianos gratis','Free Christian games','h1')+bi(lead_es,lead_en,'p',class_='v-hero__lema')+filtros()+'</div></section>'
  '<div class="portal-wrap"><section class="v-seccion"><div class="v-seccion__cabeza">'+bi('Destacado','Featured','h2')+'</div>'+destacado_html(g,'h3')+'</section>'
  '<section class="v-seccion"><div class="v-seccion__cabeza">'+bi('Nuevos','New','h2')+'</div>'+lista(nuevos()[:4],'v-fila')+'</section>'
  '<section class="v-seccion"><div class="v-seccion__cabeza">'+bi('Todos los juegos','All games','h2',id='todos')+'</div>'+lista(sorted(JUEGOS,key=lambda x:x['titulo']['es']),'v-rejilla v-rejilla--5',True)+
  bi('No hay juegos con ese nombre en esta categoría.','No games with that name in this category.','p',class_='v-vacio',data_portal_vacio='',hidden='hidden')+'</section>'
  '<section class="v-seccion v-texto">'+bi('Por categoría','By category','h2')+categorias_html()+'</section></div>')
 pagina('juegos/',('Juegos cristianos gratis | Verbo','Free Christian games | Verbo'),
  ('Juegos cristianos gratis para jugar en el navegador sin instalar: para pequeños, niños, familia y desafíos. Basados en la Biblia, en español e inglés.','Free Christian games to play in the browser with nothing to install: for little ones, kids, families and challenges. Based on the Bible.'),
  c,[ld_lista(JUEGOS,'Juegos cristianos gratis'),ld_migas([('/','Inicio','Home'),('/juegos/','Juegos','Games')])],g['og_image'])

def categorias_html(con_conteo=True):
 out=[]
 for k,c in CATS.items():
  n=sum(1 for g in JUEGOS if g['categoria']==k)
  cnt=bi(f'{n} juego' if n==1 else f'{n} juegos',f'{n} game' if n==1 else f'{n} games','small') if con_conteo else ''
  out.append(f'<li><a class="v-categoria" data-cat="{k}" href="/juegos/{k}/">'+bi(c['es'],c['en'],'strong')+bi(c['lema']['es'],c['lema']['en'],'span')+cnt+'</a></li>')
 return '<ul class="v-categorias">'+''.join(out)+'</ul>'

# ---------- /juegos/<categoría>/ ----------
def categoria(k):
 c=CATS[k];js=sorted((g for g in JUEGOS if g['categoria']==k),key=lambda g:g['titulo']['es'])
 items=[('/','Inicio','Home'),('/juegos/','Juegos','Games'),(None,c['es'],c['en'])]
 cuerpo=(migas(items)+f'<section class="v-hero" data-cat="{k}"><div class="portal-wrap">'+bi(c['h1']['es'],c['h1']['en'],'h1')+''.join(bi(a,b,'p',class_='v-hero__lema') for a,b in zip(c['texto']['es'],c['texto']['en']))+'</div></section>'
  '<div class="portal-wrap"><section class="v-seccion">'+(lista(js,'v-rejilla v-rejilla--5',primera=True) if js else bi('Pronto habrá juegos en esta categoría.','Games in this category are coming soon.','p',class_='v-vacio'))+'</section>'
  '<section class="v-seccion">'+bi('Otras categorías','Other categories','h2')+categorias_html()+'</section></div>')
 og=(js[0] if js else destacado())['og_image']
 pagina(f'juegos/{k}/',(c['title']['es']+' | Verbo',c['title']['en']+' | Verbo'),(c['desc']['es'],c['desc']['en']),cuerpo,[ld_lista(js,c['h1']['es']),ld_migas(items)],og,infantil=c.get('infantil',False))

# ---------- /juegos/<id>/ ----------
def libros(g):
 p=g.get('pasaje');return [p] if isinstance(p,str) else (p or [])
def imagenes_de(g,n=4):
 ls=libros(g);rows=[x for x in IMAGENES if x['libro'] in ls]
 if len(rows)>n:rows=[rows[round(i*(len(rows)-1)/(n-1))] for i in range(n)]
 return rows[:n]
def miniaturas(rows,clase='v-imagenes v-imagenes--4'):
 return f'<ul class="{clase}">'+''.join(f'<li><a href="{x["url"]}"><picture><source type="image/webp" srcset="{x.get("thumb_webp",x["thumb"])}"><img src="{x["thumb"]}" width="480" height="270" loading="lazy" alt="{e(x["titulo"],quote=True)}" data-es="{e(x["titulo"],quote=True)}" data-en="{e(x["title_en"],quote=True)}"></picture></a></li>' for x in rows)+'</ul>'

def relacionados(g,n=4):
 otros=[x for x in JUEGOS if x['id']!=g['id']]
 otros.sort(key=lambda x:(x['categoria']!=g['categoria'],bool(set(libros(x))&set(libros(g)))==False,x.get('orden_mas_jugados') or 99))
 return otros[:n]

def ficha_pagina(g):
 f=ficha(g);c=CATS[g['categoria']];t=g['titulo']
 items=[('/','Inicio','Home'),('/juegos/','Juegos','Games'),(f'/juegos/{g["categoria"]}/',c['es'],c['en']),(None,t['es'],t['en'])]
 gen=GENEROS[g['genero']];desc=g.get('meta_descripcion') or g['descripcion']
 jugar=f'<a class="v-boton v-boton--jugar grande" href="{g["url_juego"]}">▶ '+bi('Jugar','Play','span')+'</a>'
 if g.get('android'):jugar+=f'<a class="v-boton v-boton--sec" href="{g["android"]}" target="_blank" rel="noopener">'+bi('Descargar para Android','Get it on Android','span')+'<span aria-hidden="true">↗</span></a>'
 cab=(f'<div class="v-ficha__cabeza portal-wrap" data-cat="{g["categoria"]}"><div>'+bi(gen['es'].upper(),gen['en'].upper(),'p',class_='v-sub')+bi(t['es'],t['en'],'h1')+bi(desc['es'],desc['en'],'p',class_='v-hero__lema')+
  chips(g)+'<div class="v-botones" style="margin-top:18px">'+jugar+f'<div class="v-votos" data-votos-juego="{g["id"]}"></div></div></div>'
  f'<a class="v-ficha__portada" href="{g["url_juego"]}" tabindex="-1" aria-hidden="true"><img src="{portada(g)}" data-shot-es="{portada(g)}" data-shot-en="{portada(g,"en")}" width="1280" height="720" alt="" fetchpriority="high"></a></div>')
 cuerpo=migas(items)+cab+'<div class="portal-wrap v-ficha">'
 if f:
  h=f['historia'];cita=f.get('cita')
  hist='<section class="v-seccion v-texto">'+bi(h['titulo']['es'],h['titulo']['en'],'h2')+''.join(bi(a,b) for a,b in zip(h['es'],h['en']))
  if cita:hist+='<blockquote class="v-cita">'+bi(cita['es']['texto'],cita['en']['texto'],'p')+'<footer>'+bi(cita['es']['ref'],cita['en']['ref'],'span')+'</footer></blockquote>'
  hist+='</section>'
  co=f['como'];como='<section class="v-seccion">'+bi('Cómo se juega','How to play','h2')+''.join(bi(a,b) for a,b in zip(co['es'],co['en']))+'<div class="v-controles">'
  for k,(es,en) in (('teclado',('⌨ Con teclado y ratón','⌨ Keyboard and mouse')),('tactil',('👆 En pantalla táctil','👆 Touch screen'))):
   if co.get(k):como+='<section>'+bi(es,en,'h3')+'<ul>'+''.join(bi(a,b,'li') for a,b in zip(co[k]['es'],co[k]['en']))+'</ul></section>'
  como+='</div></section>'
  pre=f['preguntas'];conv='<section class="v-seccion v-texto">'+bi('Para conversar en familia','To talk about as a family','h2')+'<ol class="v-preguntas">'+''.join(bi(a,b,'li') for a,b in zip(pre['es'],pre['en']))+'</ol></section>'
  cuerpo+=hist+como+conv
 imgs=imagenes_de(g)
 if imgs:cuerpo+='<section class="v-seccion"><div class="v-seccion__cabeza">'+bi('Imágenes de esta historia','Images from this story','h2')+'<a href="/imagenes/'+imgs[0]['url'].split('/')[2]+'/">'+bi('Ver más','See more','span')+'</a></div>'+miniaturas(imgs)+'</section>'
 cuerpo+='<section class="v-seccion"><div class="v-seccion__cabeza">'+bi('Más juegos','More games','h2')+'<a href="/juegos/">'+bi('Ver todos','See all','span')+'</a></div>'+lista(relacionados(g))+'</section></div>'
 juego={'@context':'https://schema.org','@type':'VideoGame','name':t['es'],'alternateName':t['en'],'description':g['descripcion']['es'],'genre':gen['es'],'inLanguage':g['idiomas'],
  'gamePlatform':'Web browser','applicationCategory':'Game','operatingSystem':'Web browser','image':BASE+g['og_image'],'url':f'{BASE}/juegos/{g["id"]}/','isAccessibleForFree':True,
  'offers':{'@type':'Offer','price':'0','priceCurrency':'USD'},'publisher':{'@type':'Organization','name':'Verbo','url':BASE+'/'},'datePublished':g['publicado'],
  'playMode':'SinglePlayer','typicalAgeRange':c.get('edades')}
 if not juego['typicalAgeRange']:juego.pop('typicalAgeRange')
 pagina(f'juegos/{g["id"]}/',(f'{t["es"]}: juego cristiano gratis | Verbo',f'{t["en"]}: free Christian game | Verbo'),(desc['es'],desc['en']),cuerpo,[juego,ld_migas(items)],g['og_image'],infantil=g.get('infantil',False),scripts=f'<script src="/juegos/comun/votos.js?v={V}" defer></script>')

# ---------- bloque de la portada ----------
INI,FIN='<!-- verbo:portal-juegos -->','<!-- /verbo:portal-juegos -->'
def portada_bloque():
 g=destacado()
 hero=('<section class="v-hero"><div class="portal-wrap v-hero__grid"><div>'+bi('Juegos cristianos gratis. Juega sin instalar.','Free Christian games. Play instantly.','h1')+
  bi('Aventuras, puzles y preguntas basados en la Biblia, para jugar solo o en familia. También Biblia, preguntas cristianas, historias e imágenes bíblicas gratis.','Adventures, puzzles and quizzes based on the Bible, to play alone or as a family. Plus free Bible resources, Christian questions, stories and Bible images.','p',class_='v-hero__lema')+
  '<div class="v-botones"><a class="v-boton v-boton--sec" href="/juegos/">'+bi('Ver todos los juegos','See all games','span')+' →</a></div></div>'+destacado_html(g)+'</div></section>')
 fotos=[x for x in IMAGENES];sel=[]
 vistos=set()
 for x in fotos:
  if x['libro'] not in vistos and x['tipo']=='escena':sel.append(x);vistos.add(x['libro'])
  if len(sel)==6:break
 imgs=('<section class="v-seccion"><div class="v-seccion__cabeza">'+bi('Imágenes bíblicas gratis para tus presentaciones','Free Bible images for your presentations','h2')+'<a href="/imagenes/">'+bi('Ver el banco','Browse the library','span')+'</a></div>'+
  bi('Escenas, paisajes y fondos en HD, horizontales y verticales, para usar gratis en la iglesia, en clases y en tus videos. Sin registro.','HD scenes, landscapes and backgrounds, landscape and vertical, free to use at church, in classes and in your videos. No sign-up.','p',class_='v-sub')+miniaturas(sel,'v-imagenes')+'</section>')
 return (INI+'<div class="portal v-banda" id="juegos">'+hero+'<div class="portal-wrap">'
  '<section class="v-seccion"><div class="v-seccion__cabeza">'+bi('Nuevos','New','h2')+'<a href="/juegos/">'+bi('Ver todos','See all','span')+'</a></div>'+lista(nuevos()[:4],'v-fila')+'</section>'
  '<section class="v-seccion">'+bi('Por categoría','By category','h2')+categorias_html(False)+'</section>'
  '<section class="v-seccion"><div class="v-seccion__cabeza">'+bi('Más jugados','Most played','h2')+'</div>'+lista(mas_jugados()[:4],'v-fila')+'</section>'+imgs+'</div></div>'+FIN)

def portada_inicio():
 p=R/'index.html';t=p.read_text()
 if INI not in t:raise SystemExit('index.html: falta la marca '+INI)
 t=re.sub(re.escape(INI)+'.*?'+re.escape(FIN),lambda m:portada_bloque(),t,flags=re.S)
 p.write_text(t)

def sitemap(rutas):
 sm=R/'sitemap.xml';t=sm.read_text();have=set(re.findall(r'<loc>(.*?)</loc>',t));add=''
 for r in rutas:
  u=f'{BASE}/{r}'
  if u not in have:add+=f'  <url>\n    <loc>{u}</loc>\n    <lastmod>{HOY.isoformat()}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n'
 if add:sm.write_text(t.replace('</urlset>',add+'</urlset>'))

def validar():
 ids=set()
 for g in JUEGOS:
  for k in ('id','titulo','descripcion','categoria','infantil','genero','duracion_min','movil','idiomas','portada','og_image','url_juego','publicado'):
   if k not in g:raise SystemExit(f'{g.get("id")}: falta {k}')
  if g['id'] in ids:raise SystemExit('id repetido '+g['id'])
  ids.add(g['id'])
  if g['categoria'] not in CATS:raise SystemExit(f'{g["id"]}: categoría desconocida')
  if g['genero'] not in GENEROS:raise SystemExit(f'{g["id"]}: género desconocido')
  for k in ('portada','og_image'):
   if not (R/g[k].lstrip('/')).is_file():raise SystemExit(f'{g["id"]}: no existe {g[k]}')
  if not (R/g['url_juego'].lstrip('/')/'index.html').is_file():raise SystemExit(f'{g["id"]}: no existe {g["url_juego"]}')
  if not ficha(g):print('Aviso: sin ficha.json,',g['id'])

if __name__=='__main__':
 validar()
 portal();rutas=['juegos/']
 for k in CATS:categoria(k);rutas.append(f'juegos/{k}/')
 for g in JUEGOS:ficha_pagina(g);rutas.append(f'juegos/{g["id"]}/')
 portada_inicio();sitemap(rutas)
 print(f'Juegos: {len(JUEGOS)} juegos, {len(CATS)} categorías, portada actualizada.')
