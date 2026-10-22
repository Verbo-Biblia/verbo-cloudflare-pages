#!/usr/bin/env python3
# Genera /juegos/ desde juegos/catalogo.json, en dos grupos: «Para niños» y «Para no tan niños».
from section_builder import R,tr,page,save
import json,html
catalog=json.loads((R/'juegos/catalogo.json').read_text())
GRUPOS=[('ninos','Para niños','For kids','Aventuras sencillas y alegres para aprender de la fe jugando.','Simple, joyful adventures to learn about faith through play.'),
        ('grandes','Para no tan niños','For older kids and grown-ups','Retos para repasar lo que sabes de la Biblia y conversar en familia.','Challenges to review what you know about the Bible and talk as a family.')]
def tarjeta(g):
 img=f'<a href="{g["url"]}" tabindex="-1"><img src="{g["imagen"]}" data-shot-es="{g["imagen"]}" data-shot-en="{g.get("imagen_en",g["imagen"])}" alt="{html.escape(g["nombre"],quote=True)}" loading="lazy"></a>'
 botones=''.join(f'<a class="button" href="{b["url"]}">'+tr(g['id']+'_'+b['id'],b['es'],b['en'],'span')+'</a>' for b in g.get('botones',[]))
 return '<article class="tile">'+img+'<h2><a href="'+g['url']+'">'+html.escape(g['nombre'])+'</a></h2>'+tr(g['id']+'Game',g['descripcion'],g['description_en'])+'<div class="tags">'+botones+'</div></article>'
# Los grupos van lado a lado en pantallas anchas y uno debajo del otro en el celular; tarjetas de igual altura,
# botones abajo y sin la inclinación 3D (desalineaba las dos tarjetas).
cuerpo='<style>.juegos-grupos{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,380px),1fr));gap:32px;align-items:stretch}.juegos-grupo{padding-bottom:0;display:flex;flex-direction:column}.juegos-grupo .grid{grid-template-columns:1fr;flex:1}.juegos-grupo .tile{display:flex;flex-direction:column;transform:none!important}.juegos-grupo .tile .tags{margin-top:auto}.juegos-grupo>h2{margin:0 0 8px}.juegos-grupo>p{margin:0 0 22px}.juegos-grupo .tile h2{margin:18px 0 8px}.juegos-grupo .tile>p{margin:0 0 18px}.juegos-grupo .tile img{display:block;margin-bottom:6px}.juegos-grupo .tags .button{margin-top:6px}</style>'+tr('gamesTitle','Juegos cristianos','Christian games','h1')+tr('gamesLead','Juegos gratis para toda la familia, en la web y en Android. Descubre historias, conversa sobre las respuestas y aprende a tu ritmo. En la web no necesitas instalar nada.','Free games for the whole family, on the web and Android. Discover stories, discuss answers and learn at your own pace. On the web there is nothing to install.')
cuerpo+='<div class="juegos-grupos">'
for clave,es,en,lead_es,lead_en in GRUPOS:
 juegos=[g for g in catalog if g['grupo']==clave]
 if juegos: cuerpo+=f'<section class="intro juegos-grupo" id="{clave}">'+tr('games_'+clave,es,en,'h2')+tr('games_'+clave+'Lead',lead_es,lead_en)+'<div class="grid">'+''.join(map(tarjeta,juegos))+'</div></section>'
cuerpo+='</div>'
page('juegos','Juegos cristianos gratis','Juegos cristianos gratis para niños y para no tan niños, en la web y en Android.',cuerpo)
save()
