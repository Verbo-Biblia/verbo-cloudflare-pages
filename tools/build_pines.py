#!/usr/bin/env python3
"""Pines verticales para Pinterest (1000×1500, 2:3) del banco de imágenes y de los juegos.

Cada pin es una portada: la escena arriba, sin perder calidad, y una franja inferior con el título y
«verbobiblia.com». No es el archivo de descarga: la imagen limpia, horizontal y sin marca se descarga en la web.
Escribe imagenes/pines/*.jpg (no indexables: ver _headers) y docs/pinterest/pines.csv y pines-en.csv con el
formato de carga masiva de Pinterest. Uso: python3 tools/build_pines.py
"""
import csv,json,re
from pathlib import Path
from PIL import Image,ImageDraw,ImageFilter,ImageFont,ImageOps
R=Path(__file__).resolve().parents[1]
BASE='https://verbobiblia.com'
OUT=R/'imagenes/pines';OUT.mkdir(parents=True,exist_ok=True)
F=R/'tools/fuentes'
W,H,BANDA=1000,1500,330
NOCHE,CREMA,ORO,GRIS=(8,27,48),(246,239,224),(226,181,92),(169,182,198)

def fuente(nombre,tam,var):
 f=ImageFont.truetype(str(F/nombre),tam)
 try:f.set_variation_by_name(var)
 except Exception:pass
 return f

def partir(d,texto,f,ancho):
 out,linea=[],''
 for p in texto.split():
  prueba=(linea+' '+p).strip()
  if d.textlength(prueba,font=f)>ancho and linea:out.append(linea);linea=p
  else:linea=prueba
 return out+([linea] if linea else [])

def pin(origen,destino,titulo,sub,marca='verbobiblia.com',completa=False,extra=''):
 lienzo=Image.new('RGB',(W,H),NOCHE)
 with Image.open(origen) as im:
  im=ImageOps.exif_transpose(im).convert('RGB')
  fondo=ImageOps.fit(im,(W,H-BANDA),Image.LANCZOS,centering=(.5,.45))
  if completa:
   # Portadas de juegos: completas (con su logo) sobre la misma imagen desenfocada.
   fondo=Image.blend(fondo.filter(ImageFilter.GaussianBlur(28)),Image.new('RGB',fondo.size,NOCHE),.35)
   frente=ImageOps.contain(im,(W,H-BANDA),Image.LANCZOS)
   fondo.paste(frente,((W-frente.width)//2,(H-BANDA-frente.height)//2))
  lienzo.paste(fondo,(0,0))
 d=ImageDraw.Draw(lienzo)
 d.rectangle([0,H-BANDA,W,H-BANDA+6],fill=ORO)
 x=56;ancho=W-2*x
 for tam in range(64,38,-2):
  ft=fuente('Alegreya.ttf',tam,'Bold');ls=partir(d,titulo,ft,ancho)
  if len(ls)<=3:break
 y=H-BANDA+40
 for l in ls:d.text((x,y),l,font=ft,fill=CREMA);y+=int(tam*1.12)
 fs=fuente('Nunito.ttf',30,'Bold');d.text((x,y+10),sub,font=fs,fill=GRIS)
 if extra:
  fe=fuente('Nunito.ttf',28,'Regular');yy=y+56
  for l in partir(d,extra,fe,ancho)[:2]:d.text((x,yy),l,font=fe,fill=CREMA);yy+=38
 fm=fuente('Nunito.ttf',32,'ExtraBold');d.text((W-x,H-44),marca,font=fm,fill=ORO,anchor='rs')
 lienzo.save(destino,'JPEG',quality=92,optimize=True,progressive=True)

def tablero(x,lang):
 t=set(x['tags'])
 if t&{'nacimiento','pesebre','Belén','pastores','sabios de Oriente','anunciación','Emanuel'} and x['testamento']=='NT':return ('Navidad','Christmas')[lang=='en']
 c=int(x['capitulo'])
 if (x['libro'],)==('Mateo',) and c>=26 or x['libro']=='Marcos' and c>=14 or x['libro']=='Lucas' and c>=22 or x['libro']=='Juan' and c>=18:return ('Semana Santa','Holy Week and Easter')[lang=='en']
 for es,en,tags in (('Moisés','Moses',{'Moisés'}),('Pedro','Peter',{'Pedro'}),('Pablo','Paul',{'Pablo','Saulo'}),('Abraham','Abraham',{'Abraham','Abram'}),('Juan el Bautista','John the Baptist',{'Juan el Bautista'})):
  if t&tags:return (es,en)[lang=='en']
 if x['tipo'] in ('fondo','simbolo','símbolo'):return ('Fondos para versículos','Bible verse backgrounds')[lang=='en']
 if x['tipo']=='lugar':return ('Paisajes bíblicos','Bible landscapes')[lang=='en']
 if 'parábola' in t:return ('Parábolas de Jesús','Parables of Jesus')[lang=='en']
 if 'Jesús' in t:return ('La vida de Jesús','The life of Jesus')[lang=='en']
 return ('Imágenes bíblicas','Bible images')[lang=='en']

def main():
 libros=json.loads((R/'imagenes/indice.json').read_text())
 cat=json.loads((R/'juegos/catalogo.json').read_text())['juegos']
 filas={'es':[],'en':[]}
 for x in libros:
  dest=OUT/(x['id']+'.jpg')
  if not dest.exists() or dest.stat().st_mtime<(R/x['original'].lstrip('/')).stat().st_mtime:
   pin(R/x['original'].lstrip('/'),dest,x['titulo'],x['cita'])
  media=f'{BASE}/imagenes/pines/{x["id"]}.jpg';link=BASE+x['url']
  filas['es'].append([x['titulo'],media,tablero(x,'es'),'',f"{x['descripcion']} ({x['cita']}). Descárgala gratis en HD, horizontal y vertical, sin marca, en verbobiblia.com",link,'',', '.join(x['tags'][:6])])
  cita_en=x['cita'].replace(x['libro'],{'Mateo':'Matthew','Marcos':'Mark','Lucas':'Luke','Juan':'John','Hechos':'Acts','Génesis':'Genesis','Éxodo':'Exodus'}.get(x['libro'],x['libro']))
  filas['en'].append([x['title_en'],media,tablero(x,'en'),'',f"{x['description_en']} ({cita_en}). Download it free in HD, landscape and vertical, with no watermark, at verbobiblia.com",link,'',', '.join(x['tags_en'][:6])])
 for g in cat:
  dest=OUT/f'juego-{g["id"]}.jpg'
  pin(R/g['portada'].lstrip('/'),dest,g['titulo']['es'],'Juego cristiano gratis · sin instalar',completa=True,extra=g['descripcion']['es'])
  dest_en=OUT/f'juego-{g["id"]}-en.jpg'
  pin(R/g.get('portada_en',g['portada']).lstrip('/'),dest_en,g['titulo']['en'],'Free Christian game · no install',completa=True,extra=g['descripcion']['en'])
  filas['es'].append([g['titulo']['es']+': juego cristiano gratis',f'{BASE}/imagenes/pines/juego-{g["id"]}.jpg','Juegos cristianos','',g['descripcion']['es']+' Juega gratis en el navegador, sin instalar, en verbobiblia.com',f'{BASE}/juegos/{g["id"]}/','','juegos cristianos, juegos bíblicos'])
  filas['en'].append([g['titulo']['en']+': free Christian game',f'{BASE}/imagenes/pines/juego-{g["id"]}-en.jpg','Christian games','',g['descripcion']['en']+' Play free in your browser, nothing to install, at verbobiblia.com',f'{BASE}/juegos/{g["id"]}/','','christian games, bible games'])
 carpeta=R/'docs/pinterest';carpeta.mkdir(parents=True,exist_ok=True)
 for l,nombre in (('es','pines.csv'),('en','pines-en.csv')):
  with open(carpeta/nombre,'w',newline='',encoding='utf-8') as f:
   w=csv.writer(f);w.writerow(['Title','Media URL','Pinterest board','Thumbnail','Description','Link','Publish date','Keywords']);w.writerows(filas[l])
 print(f'Pines: {len(libros)} imágenes y {len(cat)} juegos; CSV en docs/pinterest/.')

if __name__=='__main__':main()
