#!/usr/bin/env python3
from section_builder import R,tr,page,save
import json
catalog=json.loads((R/'juegos/catalogo.json').read_text())
cards=[]
for g in catalog:
 cards.append('<article class="tile"><h2><a href="'+g['url']+'">'+g['nombre']+'</a></h2>'+tr(g['id']+'Game',g['descripcion'],g['description_en'])+'</article>')
page('juegos','Juegos cristianos gratis','Juegos bíblicos gratis para toda la familia, en la web y Android.',tr('gamesTitle','Juegos cristianos','Christian games','h1')+tr('gamesLead','Juegos gratis para toda la familia, en la web y en Android. Descubre historias, conversa sobre las respuestas y aprende a tu ritmo. En el juego web no necesitas instalar nada.','Free games for the whole family, on the web and Android. Discover stories, discuss answers and learn at your own pace. The web game requires no installation.')+'<div class="grid">'+''.join(cards)+'</div>')
save()
