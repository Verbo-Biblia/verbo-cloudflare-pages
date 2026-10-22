#!/usr/bin/env python3
# Genera /juegos/ desde juegos/catalogo.json: UNA sola sección con todas las tarjetas (Juan: son pocos juegos, sin
# grupos). Si un juego es más difícil, se dice en su descripción. Todo el contenido de Verbo es apto para niños.
from section_builder import R,D,tr,page,save
import json,html
catalog=json.loads((R/'juegos/catalogo.json').read_text())
def tarjeta(g):
 # El nombre también se traduce (nombre_en en el catálogo; si falta, el mismo nombre).
 nombre_en=g.get('nombre_en',g['nombre'])
 for l,v in (('es',g['nombre']),('en',nombre_en)): D[l].setdefault('sections',{})[g['id']+'Name']=v
 img=f'<a href="{g["url"]}" tabindex="-1"><img src="{g["imagen"]}" data-shot-es="{g["imagen"]}" data-shot-en="{g.get("imagen_en",g["imagen"])}" alt="{html.escape(g["nombre"],quote=True)}" data-i18n-attr="alt:sections.{g["id"]}Name" loading="lazy"></a>'
 botones=''.join(f'<a class="button" href="{b["url"]}">'+tr(g['id']+'_'+b['id'],b['es'],b['en'],'span')+'</a>' for b in g.get('botones',[]))
 return '<article class="tile">'+img+'<h2><a href="'+g['url']+'">'+tr(g['id']+'Name',g['nombre'],nombre_en,'span')+'</a></h2>'+tr(g['id']+'Game',g['descripcion'],g['description_en'])+'<div class="tags">'+botones+'</div></article>'
# Tarjetas lado a lado, de igual altura, botones abajo y sin la inclinación 3D (desalineaba las tarjetas).
estilo='<style>.juegos .grid{grid-template-columns:repeat(auto-fill,minmax(min(100%,380px),1fr));align-items:stretch}.juegos .tile{display:flex;flex-direction:column;transform:none!important}.juegos .tile img{display:block;margin-bottom:6px}.juegos .tile h2{margin:18px 0 8px}.juegos .tile>p{margin:0 0 18px}.juegos .tile .tags{margin-top:auto}.juegos .tags .button{margin-top:6px}</style>'
cuerpo=estilo+tr('gamesTitle','Juegos cristianos','Christian games','h1')+tr('gamesLead','Juegos gratis para toda la familia, en la web y en Android. Descubre historias, conversa sobre las respuestas y aprende a tu ritmo. En la web no necesitas instalar nada.','Free games for the whole family, on the web and Android. Discover stories, discuss answers and learn at your own pace. On the web there is nothing to install.')
cuerpo+='<section class="intro juegos"><div class="grid">'+''.join(map(tarjeta,catalog))+'</div></section>'
# Quitar los textos de los grupos que ya no existen.
for l in D:
 for k in ('games_ninos','games_ninosLead','games_grandes','games_grandesLead'): D[l].get('sections',{}).pop(k,None)
page('juegos','Juegos cristianos gratis','Juegos cristianos gratis para toda la familia, en la web y en Android.',cuerpo)
# El título de la pestaña también cambia de idioma (i18n.js traduce cualquier elemento con data-i18n, incluido <title>).
for l,v in (('es','Juegos cristianos gratis | Verbo'),('en','Free Christian games | Verbo')): D[l].setdefault('sections',{})['gamesDocTitle']=v
f=R/'juegos/index.html'; f.write_text(f.read_text().replace('<title>','<title data-i18n="sections.gamesDocTitle">',1))
save()
