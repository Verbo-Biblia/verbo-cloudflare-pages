#!/usr/bin/env python3
"""Ilustra preguntas, historias y artículos con una imagen del banco cuando citan el mismo pasaje.

Para cada página de texto busca las citas con versículos (Libro cap:v-w) y, si una imagen del banco ilustra
versículos que se cruzan, inserta antes de </article> una figura enlazada a la página de esa imagen. Es idempotente:
la figura va entre <!-- verbo:ilustracion --> y su cierre, y se reemplaza en cada ejecución. No cambia rutas.
Correr después de regenerar el banco o el contenido: python3 tools/ilustraciones.py
"""
import json,re,sys
from html import escape as e
from pathlib import Path
R=Path(__file__).resolve().parents[1];sys.path.insert(0,str(R/'tools'))
import referencias_contenido as rc
INI,FIN='<!-- verbo:ilustracion -->','<!-- /verbo:ilustracion -->'
ESTILO=('margin:2.2em 0;padding:0;border-radius:12px;overflow:hidden;border:1px solid rgba(127,127,127,.25)')

def figura(x):
 return (f'{INI}<figure class="verbo-ilustracion" style="{ESTILO}"><a href="{x["url"]}" style="display:block">'
  f'<picture><source type="image/webp" srcset="{x["medium_webp"]}"><img src="{x["medium"]}" width="640" height="360" loading="lazy" '
  f'alt="{e(x["descripcion"],quote=True)}" style="display:block;width:100%;height:auto;aspect-ratio:16/9;object-fit:cover"></picture></a>'
  f'<figcaption style="padding:10px 14px;font-size:.88em;line-height:1.45">{e(x["titulo"])} ({e(x["cita"])}). '
  f'<a href="{x["url"]}">Imagen bíblica gratis en HD del banco de Verbo</a>.</figcaption></figure>{FIN}')

def mejor_imagen(html,imagenes):
 citas=rc.CITA.findall(rc._texto(html))
 mejores=[]
 for libro,cap,a,b in citas:
  libro='Salmos' if libro=='Salmo' else libro;a=int(a);b=int(b or a)
  for x in imagenes:
   if x['libro']!=libro or int(x['capitulo'])!=int(cap):continue
   va,_,vb=str(x['versiculos']).partition('-');va=int(va);vb=int(vb or va)
   if va<=b and vb>=a:mejores.append((x['tipo']!='escena',vb-va,x['id'],x))
 return min(mejores,key=lambda t:t[:3])[3] if mejores else None

def main():
 imagenes=json.loads((R/'imagenes/indice.json').read_text())
 puestas=quitadas=0
 for pg in rc.paginas():
  p=pg['ruta'];t=pg['html']
  limpio=re.sub(re.escape(INI)+'.*?'+re.escape(FIN),'',t,flags=re.S)
  x=mejor_imagen(limpio,imagenes)
  nuevo=limpio.replace('</article>',figura(x)+'</article>',1) if x and '</article>' in limpio else limpio
  if nuevo!=t:
   p.write_text(nuevo,encoding='utf-8')
   if x:puestas+=1
   else:quitadas+=1
 print(f'Ilustraciones: {puestas} páginas actualizadas, {quitadas} sin imagen.')

if __name__=='__main__':main()
