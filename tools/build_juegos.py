#!/usr/bin/env python3
# Genera /juegos/ desde juegos/catalogo.json: UNA sola sección con todas las tarjetas (Juan: son pocos juegos, sin
# grupos). Si un juego es más difícil, se dice en su descripción. Todo el contenido de Verbo es apto para niños.
from section_builder import R,D,tr,page,save
import json,html
catalog=json.loads((R/'juegos/catalogo.json').read_text())
def tarjeta(g):
 img=f'<a href="{g["url"]}" tabindex="-1"><img src="{g["imagen"]}" data-shot-es="{g["imagen"]}" data-shot-en="{g.get("imagen_en",g["imagen"])}" alt="{html.escape(g["nombre"],quote=True)}" loading="lazy"></a>'
 botones=''.join(f'<a class="button" href="{b["url"]}">'+tr(g['id']+'_'+b['id'],b['es'],b['en'],'span')+'</a>' for b in g.get('botones',[]))
 return '<article class="tile">'+img+'<h2><a href="'+g['url']+'">'+html.escape(g['nombre'])+'</a></h2>'+tr(g['id']+'Game',g['descripcion'],g['description_en'])+'<div class="tags">'+botones+'</div></article>'
# Tarjetas lado a lado, de igual altura, botones abajo y sin la inclinación 3D (desalineaba las tarjetas).
estilo='<style>.juegos .grid{grid-template-columns:repeat(auto-fill,minmax(min(100%,380px),1fr));align-items:stretch}.juegos .tile{display:flex;flex-direction:column;transform:none!important}.juegos .tile img{display:block;margin-bottom:6px}.juegos .tile h2{margin:18px 0 8px}.juegos .tile>p{margin:0 0 18px}.juegos .tile .tags{margin-top:auto}.juegos .tags .button{margin-top:6px}</style>'
cuerpo=estilo+tr('gamesTitle','Juegos cristianos','Christian games','h1')+tr('gamesLead','Juegos gratis para toda la familia, en la web y en Android. Descubre historias, conversa sobre las respuestas y aprende a tu ritmo. En la web no necesitas instalar nada.','Free games for the whole family, on the web and Android. Discover stories, discuss answers and learn at your own pace. On the web there is nothing to install.')
cuerpo+='<section class="intro juegos"><div class="grid">'+''.join(map(tarjeta,catalog))+'</div></section>'
# Quitar los textos de los grupos que ya no existen.
for l in D:
 for k in ('games_ninos','games_ninosLead','games_grandes','games_grandesLead'): D[l].get('sections',{}).pop(k,None)
page('juegos','Juegos cristianos gratis','Juegos cristianos gratis para toda la familia, en la web y en Android.',cuerpo)
save()
