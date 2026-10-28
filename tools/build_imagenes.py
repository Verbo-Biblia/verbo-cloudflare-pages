#!/usr/bin/env python3
"""Build offline: --todas includes unreviewed images for local preview only."""
import sys
import argparse,json,re,shutil,unicodedata
from pathlib import Path
from collections import Counter
from html import escape as e
from PIL import Image,ImageOps
from section_builder import R,tr,page,save
import referencias_contenido
BASE='https://verbobiblia.com'
# Párrafos de contexto (60-120 palabras ES/EN) y textos de las colecciones, escritos aparte de las fuentes del banco.
DATOS=R/'data/banco'
def leer(nombre):
 f=DATOS/nombre;return json.loads(f.read_text()) if f.exists() else {}
JUEGOS=[g for g in json.loads((R/'juegos/catalogo.json').read_text())['juegos'] if g.get('visible',True)]

def slug(s):return re.sub(r'[^a-z0-9]+','-',unicodedata.normalize('NFD',str(s)).encode('ascii','ignore').decode().lower()).strip('-')
def ba(attr,es,en):return ' '+attr+'="'+e(es,quote=True)+'" data-es-'+attr+'="'+e(es,quote=True)+'" data-en-'+attr+'="'+e(en,quote=True)+'"'
def cuenta(n,es1,esn,en1,enn,tag='p',**attrs):return bi(f'{n} {es1 if n==1 else esn}',f'{n} {en1 if n==1 else enn}',tag,**attrs)
def bi(es,en,tag='p',**attrs):return '<'+tag+' data-es="'+e(str(es),quote=True)+'" data-en="'+e(str(en),quote=True)+'"'+''.join(' '+k+'="'+e(str(v),quote=True)+'"' for k,v in attrs.items())+'>'+e(str(es))+'</'+tag+'>'
CANON='Génesis|Éxodo|Levítico|Números|Deuteronomio|Josué|Jueces|Rut|1 Samuel|2 Samuel|1 Reyes|2 Reyes|1 Crónicas|2 Crónicas|Esdras|Nehemías|Ester|Job|Salmos|Proverbios|Eclesiastés|Cantares|Isaías|Jeremías|Lamentaciones|Ezequiel|Daniel|Oseas|Joel|Amós|Abdías|Jonás|Miqueas|Nahúm|Habacuc|Sofonías|Hageo|Zacarías|Malaquías|Mateo|Marcos|Lucas|Juan|Hechos|Romanos|1 Corintios|2 Corintios|Gálatas|Efesios|Filipenses|Colosenses|1 Tesalonicenses|2 Tesalonicenses|1 Timoteo|2 Timoteo|Tito|Filemón|Hebreos|Santiago|1 Pedro|2 Pedro|1 Juan|2 Juan|3 Juan|Judas|Apocalipsis'.split('|')
BOOKS=dict(zip(CANON,'Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|1 Samuel|2 Samuel|1 Kings|2 Kings|1 Chronicles|2 Chronicles|Ezra|Nehemiah|Esther|Job|Psalms|Proverbs|Ecclesiastes|Song of Songs|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|1 Corinthians|2 Corinthians|Galatians|Ephesians|Philippians|Colossians|1 Thessalonians|2 Thessalonians|1 Timothy|2 Timothy|Titus|Philemon|Hebrews|James|1 Peter|2 Peter|1 John|2 John|3 John|Jude|Revelation'.split('|')))
TYPES={'escena':('Escenas bíblicas','Bible scenes'),'lugar':('Paisajes bíblicos','Biblical landscapes'),'objeto':('Objetos de la Biblia','Bible objects'),'simbolo':('Símbolos bíblicos','Bible symbols'),'fondo':('Fondos cristianos gratis para versículos y proyector','Free Christian backgrounds for verses and projectors'),'wallpapers':('Wallpapers cristianos para celular','Christian phone wallpapers')}
# Editorial keyword translations; preserved across builds and extensible for future catalogs.
PAIRS='''Ana|Anna;Andrés|Andrew;Bartimeo|Bartimaeus;Belén|Bethlehem;Betania|Bethany;Betsaida|Bethsaida;Capernaúm|Capernaum;Cesarea de Filipo|Caesarea Philippi;Cristo|Christ;Decápolis|Decapolis;Egipto|Egypt;Elisabet|Elizabeth;Elías|Elijah;Emanuel|Immanuel;Escrituras|Scriptures;Espíritu Santo|Holy Spirit;Gabriel|Gabriel;Galilea|Galilee;Genesaret|Gennesaret;Hijo de Dios|Son of God;Isaías|Isaiah;Jairo|Jairus;Jericó|Jericho;Jerusalén|Jerusalem;Jesús|Jesus;Jordán|Jordan;José|Joseph;Juan|John;Juan el Bautista|John the Baptist;Juana|Joanna;Judea|Judea;Magníficat|Magnificat;Mar de Galilea|Sea of Galilee;Marta|Martha;María|Mary;María Magdalena|Mary Magdalene;Mateo|Matthew;Moisés|Moses;Monte de los Olivos|Mount of Olives;Nazaret|Nazareth;Naín|Nain;Padre|Father;Padre nuestro|Lord's Prayer;Palabra de Dios|Word of God;Pedro|Peter;Santiago|James;Sermón del Monte|Sermon on the Mount;Sidón|Sidon;Simeón|Simeon;Simón el fariseo|Simon the Pharisee;Susana|Susanna;Tiro|Tyre;Zacarías|Zechariah;acceso a Dios|access to God;aceite|oil;acogida|welcome;adoración|worship;agua|water;alabanza|praise;alabastro|alabaster;aldea|village;aldeas|villages;amistad|friendship;amor|love;anillo|ring;anunciación|annunciation;anuncio|announcement;arrepentimiento|repentance;asno|donkey;autoridad|authority;avaricia|greed;aves|birds;ayuno|fasting;banquete|banquet;barca|boat;barcas|boats;bautismo|baptism;bendición|blessing;bienaventuranzas|beatitudes;bodas|wedding;buen samaritano|good Samaritan;buenas noticias|good news;búsqueda|search;cambistas|money changers;camilla|mat;camino|path;campo|field;campos|fields;carga|burden;casa|house;centurión|centurion;ciego|blind man;cielo|sky;cinturón|belt;cizaña|weeds;compasión|compassion;confesión|confession;confianza|trust;cosecha|harvest;creación|creation;crecimiento|growth;cuatro mil|four thousand;cuerdas|ropes;cuidado|care;descanso|rest;desierto|wilderness;determinación|determination;deuda|debt;diez vírgenes|ten virgins;discipulado|discipleship;discípulos|disciples;doce apóstoles|twelve apostles;encarnación|incarnation;enseñanza|teaching;entrada triunfal|triumphal entry;entrega|surrender;escucha|listening;esperanza|hope;espiga|ear of grain;espíritu impuro|unclean spirit;estrella|star;familia|family;familias|families;fe|faith;fidelidad|faithfulness;fiebre|fever;flores|flowers;fruto|fruit;fundamento|foundation;generosidad|generosity;gerasenos|Gerasenes;gozo|joy;gracia|grace;graneros|barns;habla|speech;higuera|fig tree;hija|daughter;hija de Jairo|Jairus's daughter;hijo|son;hijo pródigo|prodigal son;huida|flight;humildad|humility;incienso|frankincense;incredulidad|unbelief;intimidad|intimacy;invitación|invitation;justicia|righteousness;lepra|leprosy;liberación|deliverance;llamamiento|calling;luz|light;lámpara|lamp;lámparas|lamps;madrugada|dawn;maestros|teachers;mano|hand;mansedumbre|meekness;manto|cloak;medianoche|midnight;mies|harvest;ministerio|ministry;mirra|myrrh;misericordia|mercy;misión|mission;moneda perdida|lost coin;monedas|coins;montañas|mountains;monte|mountain;mostaza|mustard;muerte de Jesús|death of Jesus;mujer|woman;mujer cananea|Canaanite woman;mujer encorvada|bent-over woman;mujer enferma|sick woman;mujer perdonada|forgiven woman;mujeres|women;multitud|crowd;nacimiento|birth;nardo|nard;niño|child;niños|children;noche|night;obediencia|obedience;obreros|workers;ofrenda|offering;oración|prayer;orilla|shore;oro|gold;oveja perdida|lost sheep;paciencia|patience;padre|father;paloma|dove;pan|bread;pan cotidiano|daily bread;panes|loaves;paralítico|paralyzed man;parábola|parable;pastor|shepherd;pastores|shepherds;paz|peace;pañales|swaddling cloths;pelo de camello|camel hair;perdón|forgiveness;peregrinos|pilgrims;perfume|perfume;perseverancia|perseverance;pescadores|fishermen;pesebre|manger;pichones|young pigeons;piedras|stones;pobres|poor people;pobreza|poverty;presencia de Dios|presence of God;profecía|prophecy;profeta|prophet;protección|protection;providencia|providence;prójimo|neighbor;puerta|door;pureza|purity;recaudador|tax collector;recogimiento|reflection;redes|nets;regreso|return;reino de Dios|kingdom of God;reino de los cielos|kingdom of heaven;responsabilidad|responsibility;restauración|restoration;resurrección|resurrection;riqueza|wealth;roca|rock;rollo|scroll;sabios de Oriente|wise men from the East;sal|salt;salario|wages;sandalias|sandals;sanidad|healing;santidad|holiness;sembrador|sower;semilla|seed;sencillez|simplicity;sepulcros|tombs;servicio|service;siega|harvest;siervo|servant;siervos|servants;sinagoga|synagogue;soledad|solitude;sordera|deafness;suegra de Pedro|Peter's mother-in-law;sueño|dream;sábado|Sabbath;talentos|talents;tempestad|storm;templo|temple;tentación|temptation;tesoro|treasure;testimonio|testimony;tierra|earth;transfiguración|transfiguration;travesía|crossing;trigo|wheat;tórtolas|turtledoves;unción|anointing;velo|veil;vendas|bandages;viaje|journey;vida|life;vigilancia|watchfulness;vino|wine;visita|visit;vista|sight;viuda|widow;viña|vineyard;yugo|yoke;ángel|angel;ángeles|angels'''
TAGS=dict(p.split('|') for p in PAIRS.split(';'))
TAGS.update(dict(p.split('|') for p in 'Judas|Judas;Lázaro|Lazarus;Pascua|Passover;Zaqueo|Zacchaeus;apóstoles|apostles;arresto|arrest;copa|cup;diez leprosos|ten lepers;fariseo|Pharisee;gratitud|gratitude;juez|judge;nuevo pacto|new covenant;publicano|tax collector;rico|rich man;salvación|salvation;samaritano|Samaritan;sicómoro|sycamore;última cena|Last Supper'.split(';')))
TAGS.update(dict(p.split('|') for p in 'Caná|Cana;Emaús|Emmaus;Getsemaní|Gethsemane;Herodes|Herod;Pilato|Pilate;ascensión|ascension;gallo|rooster;injusticia|injustice;juicio|judgment;negación|denial;patio|courtyard;piedra|stone;purificación|purification;señal|sign;tinajas|jars'.split(';')))
VERTICAL=(720,1280)
LICENSE_LINE=('Gratis para cualquier uso, también comercial · Sin registro · Generadas con IA y revisadas por Verbo','Free for any use, including commercial · No sign-up · AI-generated and reviewed by Verbo')
LICENSE_ES='Gratis para cualquier uso, también comercial; no hace falta atribución, se agradece mencionar Verbo.'
LICENSE_EN='Free for any use, including commercial use. Attribution is not required; mentioning Verbo is appreciated.'
SIZES='(max-width:600px) 100vw, (max-width:1000px) 50vw, 33vw'
def card(x,first=False):
 load=' loading="eager" fetchpriority="high"' if first else ' loading="lazy"'
 return '<article class="tile"><a class="tile-link" href="'+x['url']+'"><picture><source type="image/webp" srcset="'+x['thumb_webp']+' 480w, '+x['medium_webp']+' 640w" sizes="'+SIZES+'"><img src="'+x['thumb']+'" srcset="'+x['thumb']+' 480w, '+x['medium']+' 640w" sizes="'+SIZES+'" width="640" height="360"'+load+' alt="'+e(x['titulo'],quote=True)+'" data-es="'+e(x['titulo'],quote=True)+'" data-en="'+e(x['title_en'],quote=True)+'"></picture><div class="tile-caption">'+bi(x['titulo'],x['title_en'],'h2')+'<small>'+e(x['cita'])+'</small></div></a><a class="quick-download" download="'+slug(x['titulo'])+'.jpg" href="'+x['original']+'"'+ba('aria-label','Descargar','Download')+'>↓</a></article>'
def mosaic(rows,first=False):
 return '<div class="grid">'+''.join(card(x,first and i==0)+('<!-- verbo:anuncio:banco-entre-filas -->' if (i+1)%12==0 else '') for i,x in enumerate(rows))+'</div>'
RVG=Path(__file__).resolve().parent.parent/'biblia/modules/bibles/rv-verbo'
RVG_IDS={b['name']:b['id'] for b in json.loads((RVG/'manifest.json').read_text())['books']}
RVG_BOOKS={}
BIBLIAS={'es':RVG,'en':RVG.parent/'bsb'};CACHE={}
def verse_plain(x,lang,maximo=230):
 try:
  bid=RVG_IDS[x['libro']];book=CACHE.setdefault((lang,bid),json.loads((BIBLIAS[lang]/'books'/(bid+'.json')).read_text()))
  chapter=book['chapters'][str(x['capitulo'])];a,_,b=str(x['versiculos']).partition('-');a=int(a);b=int(b or a)
 except (KeyError,ValueError,FileNotFoundError):return '',''
 txt='';fin=a
 for n in range(a,b+1):
  v=chapter.get(str(n));v=v['text'] if isinstance(v,dict) else v
  if not v:continue
  v=re.sub(r'[«»“”]','',v).strip()
  if txt and len(txt)+len(v)>maximo:break
  txt=(txt+' '+v).strip();fin=n
  if len(txt)>maximo*0.6:break
 libro=x['libro'] if lang=='es' else BOOKS.get(x['libro'],x['libro'])
 return txt,f"{libro} {x['capitulo']}:{a}"+(f"-{fin}" if fin>a else '')
def verse_text(x,limit=6):
 # Texto Biblia Verbo del pasaje, sin enlazar al lector bíblico (retirado de la web).
 try:
  book=RVG_BOOKS.setdefault(x['libro'],json.loads((RVG/'books'/(RVG_IDS[x['libro']]+'.json')).read_text()))
  chapter=book['chapters'][str(x['capitulo'])];a,_,b=str(x['versiculos']).partition('-');a=int(a);b=int(b or a)
 except (KeyError,ValueError):return ''
 verses=[(n,chapter[str(n)]['text'] if isinstance(chapter[str(n)],dict) else chapter[str(n)]) for n in range(a,min(b,a+limit-1)+1) if str(n) in chapter]
 if not verses:return ''
 more=' …' if b>a+limit-1 else ''
 return '<blockquote class="verse-text" lang="es">'+' '.join('<sup>'+str(n)+'</sup> '+e(s) for n,s in verses)+more+'<footer>Biblia Verbo</footer></blockquote>'
CTX=leer('contextos.json')
IDX=referencias_contenido.indice()
def sugerencia(x):
 # Juan (2026-10-28): reconocer que puede haber errores y dejar que la gente sugiera correcciones.
 return ('<form class="sugerencia" id="sugerencia" data-imagen="'+x['id']+'">'+bi('¿Ves un error en esta imagen?','See a mistake in this image?','h2')
  +bi('Estas ilustraciones se hacen con inteligencia artificial y las revisamos una por una, pero pueden tener errores: algo que no sigue el texto bíblico, de otra época o fuera de proporción. Cuéntanos y la corregimos.','These illustrations are made with AI and reviewed one by one, but they may contain mistakes: something that does not follow the biblical text, belongs to another era or is out of proportion. Tell us and we will fix it.','p')
  +'<label for="sug-texto" class="visually-hidden">Sugerencia</label><textarea id="sug-texto" name="texto" maxlength="1500" required placeholder="Ej.: en el versículo dice que eran cuatrocientos hombres y aquí se ven cinco"></textarea>'
  +'<label for="sug-contacto" class="visually-hidden">Contacto</label><input id="sug-contacto" name="contacto" maxlength="120" placeholder="Tu correo o nombre (opcional)"><input class="trampa" name="web" tabindex="-1" autocomplete="off" aria-hidden="true">'
  +'<button type="submit">'+bi('Enviar sugerencia','Send suggestion','span')+'</button><p class="sug-estado" role="status" aria-live="polite"></p></form><script src="/imagenes/sugerencia.js?v=20261028" defer></script>')
def pin_btn(x):
 from urllib.parse import quote
 url=BASE+x['url'];media=BASE+'/imagenes/pines/'+x['id']+'.jpg';desc=x['titulo']+' ('+x['cita']+'). Imagen bíblica gratis en HD en verbobiblia.com'
 return ('<a class="pin-link" target="_blank" rel="noopener" href="https://www.pinterest.com/pin/create/button/?url='+quote(url,safe='')+'&amp;media='+quote(media,safe='')+'&amp;description='+quote(desc,safe='')+'">'
  +bi('Guardar en Pinterest','Save to Pinterest','span')+'<span aria-hidden="true"> ↗</span></a>')
def tarjeta_btn(x):
 return '<button class="card-open" type="button" data-tarjeta>'+bi('Crear tarjeta con versículo','Create a verse card','span')+'</button>' if verse_plain(x,'es')[0] else ''
def tarjeta_dialogo(x):
 es,ref_es=verse_plain(x,'es');en,ref_en=verse_plain(x,'en')
 if not es:return ''
 A=lambda k,v:' data-'+k+'="'+e(v,quote=True)+'"'
 return ('<dialog class="verse-card"'+ba('aria-label','Tarjeta con versículo','Verse card')+A('img',x['original'])+A('verso-es',es)+A('ref-es',ref_es+' · Biblia Verbo')+A('verso-en',en or es)+A('ref-en',(ref_en+' · BSB') if en else ref_es)+A('nombre',x['id'])+'>'
  '<div class="verse-card__head">'+bi('Tarjeta con versículo','Verse card','h2')+'<button type="button" data-cerrar'+ba('aria-label','Cerrar','Close')+'>✕</button></div>'
  '<canvas width="1080" height="1080"></canvas>'
  '<div class="verse-card__formatos" role="group"'+ba('aria-label','Formato','Format')+'><button type="button" data-formato="1080x1080" aria-pressed="true">'+bi('Cuadrada 1:1','Square 1:1','span')+'</button><button type="button" data-formato="1080x1350" aria-pressed="false">'+bi('Vertical 4:5','Portrait 4:5','span')+'</button></div>'
  '<div class="verse-card__acciones"><button type="button" data-descargar>'+bi('Descargar','Download','span')+' ↓</button><button type="button" data-compartir>'+bi('Compartir','Share','span')+'</button>'
  '<a data-whatsapp target="_blank" rel="noopener" href="https://wa.me/">WhatsApp<span aria-hidden="true"> ↗</span></a></div>'
  +bi('La tarjeta lleva una marca pequeña de verbobiblia.com. La descarga normal de la imagen sigue sin marca.','The card carries a small verbobiblia.com mark. The regular image download has no mark.','p',**{'class':'fine'})+
  '</dialog><script src="/imagenes/tarjeta.js?v=20261023b" defer></script>')
def cruces(x):
 """«Juega esta historia» (juego del mismo libro) y «Lee más» (texto de Verbo que cita el mismo pasaje)."""
 out=''
 js=[g for g in JUEGOS if x['libro'] in ([g['pasaje']] if isinstance(g.get('pasaje'),str) else (g.get('pasaje') or []))]
 if js:
  g=js[0]
  out+=('<section class="cross cross--game"><a class="cross__img" href="/juegos/'+g['id']+'/" tabindex="-1" aria-hidden="true"><img src="'+g['portada']+'" width="1280" height="720" loading="lazy" alt=""></a><div>'
   +bi('JUEGA ESTA HISTORIA','PLAY THIS STORY','p',**{'class':'eyebrow'})+bi(g['titulo']['es'],g['titulo']['en'],'h2')+bi(g['descripcion']['es'],g['descripcion']['en'])
   +'<a class="button" href="'+g['url_juego']+'">▶ '+bi('Jugar gratis','Play free','span')+'</a> <a class="text-more" href="/juegos/'+g['id']+'/">'+bi('Sobre el juego','About the game','span')+'</a></div></section>')
 pgs=referencias_contenido.paginas_para(IDX,x['libro'],x['capitulo'],x['versiculos'])[:2]
 if pgs:
  out+='<section class="cross cross--read"><div>'+bi('LEE MÁS','READ MORE','p',**{'class':'eyebrow'})+bi('Sobre este pasaje en Verbo','About this passage on Verbo','h2')+'<ul>'
  out+=''.join('<li><a href="'+pg['url']+'"><small>'+bi(*pg['tipo'],'span')+'</small> '+e(pg['titulo'])+'</a></li>' for pg in pgs)+'</ul></div></section>'
 return out
TEMAS='imagenes/temas/'   # colecciones por etiqueta: noindex y fuera del sitemap
def build():
 ap=argparse.ArgumentParser();ap.add_argument('--todas',action='store_true');ap.add_argument('--banco',type=Path,default=Path.home()/'Verbo/Banco-Imagenes');args=ap.parse_args()
 import fcntl
 with open(args.banco/'.estado.lock','a') as lock:
  fcntl.flock(lock,fcntl.LOCK_SH);state=json.loads((args.banco/'estado.json').read_text())
 records=[]
 for f in sorted((args.banco/'catalogo').glob('*.json')):records.extend(json.loads(f.read_text()))
 out=R/'imagenes';out.mkdir(exist_ok=True)
 old=json.loads((out/'generated.json').read_text()) if (out/'generated.json').exists() else []
 # Remove only prior generated artifacts; never touch hand-authored files.
 for rel in old:
  p=R/rel
  if p.is_relative_to(out) and p.is_file():p.unlink()
 before={p for p in out.rglob('*') if p.is_file()};items=[];ids=set()
 for x in records:
  ident=x['id'];status=state.get(ident,{}).get('estado');book=slug(x['libro'])
  if ident in ids:raise ValueError('Duplicate ID '+ident)
  ids.add(ident)
  if status not in (['aprobada','generada'] if args.todas else ['aprobada']):continue
  if not re.fullmatch('[a-z0-9-]+',ident):raise ValueError('Unsafe ID')
  jpg=state.get(ident,{}).get('jpg');source=args.banco/jpg if jpg else args.banco/'web'/book/(ident+'.jpg')
  if not source.is_file():print('Sin JPG, omitida:',ident);continue
  base=f'/imagenes/{book}/{ident}';dest=R/base.lstrip('/');dest.parent.mkdir(parents=True,exist_ok=True)
  shutil.copyfile(source,str(dest)+'.jpg')
  with Image.open(source) as im:
   im=ImageOps.exif_transpose(im).convert('RGB');mini=ImageOps.fit(im,(480,270),Image.LANCZOS);mini.save(str(dest)+'-mini.jpg',quality=76,optimize=True);mini.save(str(dest)+'-mini.webp',quality=76,method=6)
   medium=im.copy();medium.thumbnail((640,640),Image.LANCZOS);medium.save(str(dest)+'-media.jpg',quality=80,optimize=True);medium.save(str(dest)+'-media.webp',quality=80,method=6)
   resolution=f'{im.width} × {im.height}';size=(im.width,im.height);ImageOps.fit(im,VERTICAL,Image.LANCZOS,centering=(.5,.5)).save(str(dest)+'-vertical.jpg',quality=88,optimize=True)
  y={k:x[k] for k in ('id','libro','testamento','capitulo','versiculos','paralelos','titulo','title_en','tipo','tags','descripcion')};y.update(url=base+'/',original=base+'.jpg',thumb=base+'-mini.jpg',thumb_webp=base+'-mini.webp',vertical=base+'-vertical.jpg',medium=base+'-media.jpg',medium_webp=base+'-media.webp',resolution=resolution,width=size[0],height=size[1],weight=f'{source.stat().st_size/1048576:.1f} MB',estado=status,tags_en=[TAGS.get(t,t) for t in x['tags']]);y['cita']=f"{x['libro']} {x['capitulo']}:{x['versiculos']}";y['description_en']=x.get('description_en',f"{x['title_en']}. Bible illustration inspired by {BOOKS.get(x['libro'],x['libro'])} {x['capitulo']}:{x['versiculos']}. Themes: {', '.join(y['tags_en'])}.");items.append(y)
 canonical=CANON
 items.sort(key=lambda x: (canonical.index(x['libro']) if x['libro'] in canonical else 99,int(x['capitulo']),int(str(x['versiculos']).split('-')[0]),x['id']))
 def write(route,title,desc,body,schema=None,image=None,title_en=None,pin=None,indexar=True):
  page(route,title,desc,body,schema)
  p=R/route/'index.html';s=p.read_text()
  if title_en:s=s.replace('<title>','<title data-es="'+e(title+' | Verbo',quote=True)+'" data-en="'+e(title_en+' | Verbo',quote=True)+'">',1)
  # Vista previa al compartir (Facebook, WhatsApp, X) con la imagen de la página.
  img='https://verbobiblia.com'+(image or (items[0]['original'] if items else '/imagenes/'))
  og=''.join(f'<meta property="{k}" content="{e(str(v),quote=True)}">' for k,v in (('og:type','article' if image else 'website'),('og:site_name','Verbo'),('og:locale','es_419'),('og:title',title),('og:description',desc),('og:url',f'https://verbobiblia.com/{route}/'),('og:image',img)))
  if pin:og+=f'<meta property="og:image" content="{e(pin,quote=True)}"><meta property="og:image:width" content="1000"><meta property="og:image:height" content="1500">'
  og+=f'<meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="{e(img,quote=True)}">'
  s=s.replace('</head>',og+'</head>',1);s=s.replace('</head>','<link rel="stylesheet" href="/imagenes/banco.css?v=20261023-1c"></head>').replace('<body>','<body class="image-bank">').replace('<script src="/assets/depth/depth.js" defer data-tilt=".tile" data-enter=".tile,.intro" data-sky="0.5"></script>','');s=s.replace('</head>','<meta name="keywords" content="banco de imágenes cristianas, imágenes cristianas gratis, fondos cristianos gratis, imágenes bíblicas gratis, fondos cristianos, wallpaper cristiano, fondos de pantalla cristianos para celular, fondos para proyector de iglesia, ilustraciones bíblicas, free Bible images, Christian wallpaper, Christian backgrounds, church projector backgrounds, Bible illustrations, Bible stock photos">'+('<meta name="robots" content="noindex,nofollow">' if args.todas else '' if indexar else '<meta name="robots" content="noindex,follow">')+'</head>');p.write_text(s)
 license=bi(LICENSE_ES,LICENSE_EN,'p',id='licencia');license_line=bi(*LICENSE_LINE,'p',**{'class':'license-line'})
 for x in items:
  approved=x['estado']=='aprobada';notice=bi('Imagen generada con IA y revisada por Verbo' if approved else 'Vista previa local: imagen generada con IA, pendiente de revisión por Verbo.','AI-generated image reviewed by Verbo' if approved else 'Local preview: AI-generated image awaiting review by Verbo.','p',**{'class':'notice'})
  body='<a class="back-link" href="/imagenes/">← '+bi('Banco de imágenes','Image library','span')+'</a><div class="image-layout"><div class="image-stage"><button class="open-viewer"'+ba('aria-label','Abrir imagen a pantalla completa','Open full screen')+'><img src="'+x['original']+'" fetchpriority="high" width="'+str(x['width'])+'" height="'+str(x['height'])+'" alt="'+e(x['descripcion'],quote=True)+'" data-es="'+e(x['descripcion'],quote=True)+'" data-en="'+e(x['description_en'],quote=True)+'" data-pin-media="'+BASE+'/imagenes/pines/'+x['id']+'.jpg"><span>⛶ '+bi('Ampliar imagen','Enlarge image','span')+'</span></button>'+notice+'</div><aside class="image-info">'+bi('ILUSTRACIONES DE LA BIBLIA','BIBLE ILLUSTRATIONS','p',**{'class':'eyebrow'})+bi(x['titulo'],x['title_en'],'h1')+'<p class="passage">'+bi(x['cita'],x['cita'].replace(x['libro'],BOOKS.get(x['libro'],x['libro'])),'span')+'</p>'+verse_text(x)
  if x['paralelos']:body+=bi('También en: '+' · '.join(x['paralelos']),'Also in: '+' · '.join(x['paralelos']),'p',**{'class':'parallel'})
  ctx=CTX.get(x['id'])
  body+=bi(x['descripcion'],x['description_en'])+(bi(ctx['es'],ctx['en'],'p',**{'class':'scene-context'}) if ctx else '')+'<div class="tags">'+''.join('<a href="/imagenes/temas/'+slug(t)+'/">'+bi(t,TAGS.get(t,t),'span')+'</a>' for t in x['tags'])+'</div><div class="download-panel">'+bi('Descarga gratuita','Free download','h2')+'<a class="button download" download="'+slug(x['titulo'])+'-16x9.jpg" href="'+x['original']+'"><span>'+bi('Original · 16:9','Original · 16:9','strong')+'<small>'+x['resolution']+' · '+x['weight']+'</small></span><span>↓</span></a><a class="button download secondary" download="'+slug(x['titulo'])+'-9x16.jpg" href="'+x['vertical']+'">'+bi('Vertical · 9:16 para celular','Vertical · 9:16 for phones','strong')+'<small>'+'{} × {}'.format(*VERTICAL)+'</small>'+'<span>↓</span></a>'+bi('El recorte vertical puede omitir elementos de la escena.','The vertical crop may omit elements of the scene.','p',**{'class':'fine'})+'</div><div class="license-note">'+bi('✓ Uso libre, también comercial','✓ Free for commercial use','strong')+license+'</div><div class="share-row"><button class="share-link" type="button">'+bi('Copiar enlace / compartir','Copy link / share','span')+'</button>'+tarjeta_btn(x)+pin_btn(x)+'</div><p id="share-status" role="status" aria-live="polite"></p>'+sugerencia(x)+'</aside></div>'+cruces(x)
  index=items.index(x);body+='<nav class="image-navigation"'+ba('aria-label','Orden bíblico','Biblical order')+'>'
  if index:body+='<a href="'+items[index-1]['url']+'">← '+bi('Anterior','Previous','span')+'</a>'
  if index+1<len(items):body+='<a href="'+items[index+1]['url']+'">'+bi('Siguiente','Next','span')+' →</a>'
  body+='</nav><section class="related"><div class="section-heading">'+bi('Sigue explorando','Keep exploring','p',**{'class':'eyebrow'})+bi('Imágenes relacionadas','Related images','h2')+'</div>'
  related=sorted((z for z in items if z['id']!=x['id']),key=lambda z:len(set(z['tags'])&set(x['tags'])),reverse=True)[:6]
  body+=mosaic(related)+'</section><!-- verbo:anuncio:imagen-lectura --><dialog class="lightbox"'+ba('aria-label','Visor de imagen','Image viewer')+'><div class="viewer-tools"><button data-zoom="1.25"'+ba('aria-label','Acercar','Zoom in')+'>+</button><button data-zoom="0.8"'+ba('aria-label','Alejar','Zoom out')+'>−</button><button data-reset>1:1</button><button data-close'+ba('aria-label','Cerrar','Close')+'>✕</button></div><div class="viewer" tabindex="0"><img draggable="false" src="'+x['original']+'" alt="'+e(x['titulo'],quote=True)+'" data-es="'+e(x['titulo'],quote=True)+'" data-en="'+e(x['title_en'],quote=True)+'"></div>'+bi('Rueda o pellizca para ampliar · Arrastra para mover · Esc para cerrar','Scroll or pinch to zoom · Drag to move · Esc to close','p',**{'class':'viewer-help'})+'</dialog><script src="/imagenes/visor.js" defer></script>'+tarjeta_dialogo(x)
  schema={'@context':'https://schema.org','@type':'ImageObject','name':x['titulo'],'alternateName':x['title_en'],'description':x['descripcion'],'caption':x['cita'],'contentUrl':'https://verbobiblia.com'+x['original'],'thumbnailUrl':'https://verbobiblia.com'+x['thumb'],'license':BASE+'/imagenes/licencia/','acquireLicensePage':BASE+'/imagenes/licencia/','copyrightNotice':'Verbo · verbobiblia.com · uso libre','creditText':'Verbo','width':x['width'],'height':x['height'],'encodingFormat':'image/jpeg','keywords':', '.join(x['tags']+x['tags_en']),'creator':{'@type':'Organization','name':'Verbo','url':BASE+'/'},'inLanguage':['es','en']}
  write(x['url'].strip('/'),x['titulo']+' · Imagen bíblica gratis en HD','Imagen cristiana gratis: '+x['titulo']+' ('+x['cita']+'). '+x['descripcion']+' Descarga libre en HD, horizontal y vertical.',body,schema,image=x['original'],title_en=x['title_en']+' · Free HD Bible image',pin=BASE+'/imagenes/pines/'+x['id']+'.jpg')
 tags=Counter(t for x in items for t in x['tags']);collections=[]
 def collection(route,es,en,rows,desc_es,desc_en):
  # Las páginas por etiqueta (temas) son casi solo galería: AdSense las juzgó «contenido de poco valor» (2026-10-26).
  # Siguen visibles para quien navega, pero fuera del índice de Google y del sitemap.
  collections.append((route,es,en,rows));n=len(rows);write(route,es,desc_es,indexar=not route.startswith(TEMAS),image=rows[0]['original'] if rows else None,title_en=en,body='<a class="back-link" href="/imagenes/">← '+bi('Imágenes','Images','span')+'</a><header class="collection-heading">'+bi('LA BIBLIA EN IMÁGENES','THE BIBLE IN IMAGES','p',**{'class':'eyebrow'})+bi(es,en,'h1')+license_line+bi(desc_es,desc_en)+bi(f"{n} {'imagen' if n==1 else 'imágenes'} · Descarga gratuita",f"{n} {'image' if n==1 else 'images'} · Free download",'p')+'</header>'+mosaic(rows,True)+license)
 for book in sorted({x['libro'] for x in items}):collection('imagenes/'+slug(book),'Imágenes bíblicas de '+book+' gratis',BOOKS.get(book,book)+' Bible images',[x for x in items if x['libro']==book],'Imágenes cristianas gratis de '+book+': recorre sus pasajes con ilustraciones para acompañar la lectura, preparar clases y compartir el mensaje bíblico.','Explore '+BOOKS.get(book,book)+' with illustrations for reading, teaching and sharing the biblical message.')
 for typ,(es,en) in TYPES.items():collection('imagenes/tipos/'+typ,es,en,[x for x in items if typ=='wallpapers' or slug(x['tipo'])==typ],('Descarga recortes verticales para el fondo de tu celular. Revisa que el encuadre conserve lo que quieres mostrar.' if typ=='wallpapers' else 'Encuentra '+es.lower()+' para enseñar y crear materiales. Revisa cada pasaje y elige una composición adecuada para tu proyecto.'),('Download vertical crops for your phone background. Check that the crop keeps what you want to show.' if typ=='wallpapers' else 'Find '+en.lower()+' for teaching and creative projects. Read the passage and choose a composition that fits your project.'))
 for tag,count in tags.items():collection('imagenes/temas/'+slug(tag),'Imágenes cristianas: '+tag,'Bible images: '+TAGS.get(tag,tag),[x for x in items if tag in x['tags']],'Imágenes cristianas gratis sobre '+tag+' para acompañar tus materiales. Consulta la cita de cada imagen para comprender su contexto bíblico.','A selection about '+TAGS.get(tag,tag)+' for your materials. Read each image’s reference to understand its biblical context.')
 # Colecciones por intención de búsqueda (aprobadas por Juan el 2026-10-23) y por personaje.
 def tiene(x,*ts):return any(t in x['tags'] for t in ts)
 def semana_santa(x):
  c=int(x['capitulo']);v=int(str(x['versiculos']).split('-')[0])
  return (x['libro']=='Mateo' and c>=21) or (x['libro']=='Marcos' and c>=11) or (x['libro']=='Lucas' and (c>19 or (c==19 and v>=28))) or (x['libro']=='Juan' and c>=12)
 TEMATICAS={'navidad':lambda x:tiene(x,'nacimiento','pesebre','Belén','pastores','sabios de Oriente','anunciación','estrella','Magníficat','Emanuel','pañales') and x['testamento']=='NT',
  'semana-santa':semana_santa,
  'fondos-para-predicacion':lambda x:slug(x['tipo']) in ('fondo','lugar'),
  'fondos-para-versiculos':lambda x:slug(x['tipo']) in ('fondo','simbolo'),
  'escuela-dominical':lambda x:x['tipo']=='escena' and tiene(x,'parábola','sanidad','niños','niño','Moisés','Noé','José','arca','milagro','tempestad','panes'),
  'miniaturas-youtube-cristianas':lambda x:x['tipo']=='escena' and tiene(x,'Jesús')}
 PERSONAJES={'jesus':lambda x:tiene(x,'Jesús'),
  'maria-madre-de-jesus':lambda x:tiene(x,'María') and x['libro'] in ('Mateo','Lucas','Juan','Hechos') and not tiene(x,'Marta','Lázaro','Betania'),
  'pedro':lambda x:tiene(x,'Pedro'),'jose-esposo-de-maria':lambda x:tiene(x,'José') and x['testamento']=='NT',
  'juan-el-bautista':lambda x:tiene(x,'Juan el Bautista'),'moises':lambda x:tiene(x,'Moisés'),'pablo':lambda x:tiene(x,'Pablo','Saulo'),
  'elisabet':lambda x:tiene(x,'Elisabet'),'abraham':lambda x:tiene(x,'Abraham','Abram'),'isaac':lambda x:tiene(x,'Isaac'),'jacob':lambda x:tiene(x,'Jacob'),
  'jose-hijo-de-jacob':lambda x:tiene(x,'José') and x['testamento']=='AT','bernabe':lambda x:tiene(x,'Bernabé'),'juan-apostol':lambda x:tiene(x,'Juan')}
 textos=leer('colecciones.json')
 def especial(route,d,rows,volver=('/imagenes/','Imágenes','Images')):
  if len(rows)<3 or not d:return
  n=len(rows);intro='<div class="collection-intro">'+''.join(bi(a,b) for a,b in zip(d['intro']['es'],d['intro']['en']))+'</div>'
  collections.append((route,d['h1']['es'],d['h1']['en'],rows))
  write(route,d['title']['es'],d['desc']['es'],image=rows[0]['original'],title_en=d['title']['en'],
   schema={'@context':'https://schema.org','@type':'CollectionPage','name':d['h1']['es'],'description':d['desc']['es'],'url':BASE+'/'+route+'/','license':BASE+'/imagenes/licencia/','numberOfItems':n},
   body='<a class="back-link" href="'+volver[0]+'">← '+bi(volver[1],volver[2],'span')+'</a><header class="collection-heading">'+bi('LA BIBLIA EN IMÁGENES','THE BIBLE IN IMAGES','p',**{'class':'eyebrow'})+bi(d['h1']['es'],d['h1']['en'],'h1')+license_line+intro
   +bi(f"{n} {'imagen' if n==1 else 'imágenes'} · Descarga gratuita",f"{n} {'image' if n==1 else 'images'} · Free download",'p')+'</header>'+mosaic(rows,True)+license)
 for k,f in TEMATICAS.items():especial('imagenes/'+k,textos.get('tematicas',{}).get(k),[x for x in items if f(x)])
 pers=textos.get('personajes',{});lista_p=[]
 for k,f in PERSONAJES.items():
  rows=[x for x in items if f(x)]
  if len(rows)>=3 and k in pers:especial('imagenes/personajes/'+k,pers[k],rows,('/imagenes/personajes/','Personajes','Characters'));lista_p.append((k,pers[k],rows))
 if lista_p:
  cards=''.join('<a class="collection-card" href="/imagenes/personajes/'+k+'/"><picture><source type="image/webp" srcset="'+rows[0]['medium_webp']+'"><img src="'+rows[0]['medium']+'" width="640" height="360" loading="lazy" alt=""></picture><div>'+bi(d['nombre']['es'],d['nombre']['en'],'h3')+cuenta(len(rows),'imagen','imágenes','image','images','span')+'</div></a>' for k,d,rows in lista_p)
  write('imagenes/personajes','Personajes bíblicos en imágenes gratis','Imágenes bíblicas gratis por personaje: Jesús, María, Pedro, Moisés, Pablo, Abraham y más, en HD para tus clases y presentaciones.',title_en='Bible characters in free images',
   body='<a class="back-link" href="/imagenes/">← '+bi('Imágenes','Images','span')+'</a><header class="collection-heading">'+bi('LA BIBLIA EN IMÁGENES','THE BIBLE IN IMAGES','p',**{'class':'eyebrow'})+bi('Personajes bíblicos','Bible characters','h1')+license_line+bi('Elige un personaje para ver las escenas del banco donde aparece, cada una con su pasaje.','Choose a character to see the scenes in the library where they appear, each with its passage.')+'</header><div class="collection-grid">'+cards+'</div>')
 # Guías de uso (texto para buscadores y AdSense) con un esquema simple de cada flujo.
 def tx(x,y,es,en,size=15,fill='#081b30',weight=600,anchor='start'):
  return f'<text x="{x}" y="{y}" font-size="{size}" font-weight="{weight}" fill="{fill}" text-anchor="{anchor}" font-family="Inter,system-ui,sans-serif" data-es="{e(es,quote=True)}" data-en="{e(en,quote=True)}">{e(es)}</text>'
 def caja(x,y,w,h,fill='#0f2a47',r=10):return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}"/>'
 flecha=lambda x1,y1,x2,y2:f'<path d="M{x1} {y1} L{x2} {y2}" stroke="#98703c" stroke-width="3" marker-end="url(#pt)"/>'
 defs='<defs><marker id="pt" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#98703c"/></marker></defs>'
 FIG={
  'proyector':(caja(10,30,170,96,'#e9dfcd')+tx(24,62,'1. Banco de Verbo','1. Verbo library')+tx(24,86,'Original 16:9','16:9 original',13,'#586574',500)+flecha(184,78,236,78)
   +caja(240,30,190,96,'#e9dfcd')+tx(254,62,'2. Lumbrera','2. Lumbrera')+tx(254,86,'Fondos › Cargar imagen','Backgrounds › Load image',13,'#586574',500)+flecha(434,78,486,78)
   +caja(490,14,240,128)+tx(610,70,'Letra de la canción','Song lyrics',17,'#f6efe0',700,'middle')+tx(610,96,'sobre el fondo','over the background',13,'#a9b6c6',500,'middle'),
   'Del banco de imágenes al proyector: descarga, carga el fondo en Lumbrera y proyecta.','From the image library to the projector: download, load the background in Lumbrera and project.'),
  'diapositiva':(caja(10,14,330,186,'#e9dfcd')+caja(30,34,290,146,'#0f2a47',6)+tx(175,96,'Título del mensaje','Sermon title',18,'#f6efe0',700,'middle')+tx(175,124,'Juan 3:16','John 3:16',13,'#e2b55c',600,'middle')
   +flecha(346,108,396,108)+caja(400,30,330,150,'#e9dfcd')+tx(416,62,'PowerPoint: Diseño › Formato del fondo','PowerPoint: Design › Format Background',13)+tx(416,96,'Slides: Diapositiva › Cambiar fondo','Slides: Slide › Change background',13)+tx(416,130,'Canva: Establecer imagen como fondo','Canva: Set image as background',13),
   'La imagen va como fondo de la diapositiva; el texto, encima y en una zona tranquila.','The image goes in as the slide background; the text sits on top, in a calm area.'),
  'miniatura':(caja(10,14,400,225,'#0f2a47',8)+caja(30,150,230,60,'#081b30',6)+tx(42,188,'TÍTULO CORTO','SHORT TITLE',24,'#e2b55c',900)+'<circle cx="320" cy="100" r="46" fill="#163a5f"/>'+tx(320,106,'escena','scene',14,'#f6efe0',600,'middle')
   +tx(430,60,'1280 × 720 px · 16:9','1280 × 720 px · 16:9',15)+tx(430,92,'3 a 5 palabras','3 to 5 words',15)+tx(430,124,'Sin tapar el rostro','Don’t cover the face',15)+tx(430,156,'Archivo de menos de 2 MB','File under 2 MB',15),
   'Esquema de una miniatura: escena clara, texto corto a un lado y buen contraste.','Thumbnail layout: a clear scene, short text on one side and good contrast.'),
  'obs':(caja(10,14,200,200,'#e9dfcd')+tx(24,44,'Escenas','Scenes',15,'#081b30',800)+''.join(tx(30,76+i*30,a,b,14,'#586574',500) for i,(a,b) in enumerate((('Espera','Waiting'),('Alabanza','Worship'),('Lectura bíblica','Bible reading'),('Predicación','Sermon'),('Cierre','Closing'))))
   +caja(230,14,200,200,'#e9dfcd')+tx(244,44,'Fuentes','Sources',15,'#081b30',800)+tx(250,76,'Texto (cita)','Text (reference)',14,'#586574',500)+tx(250,106,'Imagen del banco','Library image',14,'#586574',500)+flecha(434,114,476,114)
   +caja(480,40,250,150)+tx(605,108,'Lucas 15:11-32','Luke 15:11-32',18,'#f6efe0',700,'middle')+tx(605,134,'sobre la imagen','over the image',13,'#a9b6c6',500,'middle'),
   'En OBS cada parte del culto es una escena; la imagen va como fuente, debajo del texto.','In OBS each part of the service is a scene; the image is a source, under the text.')}
 guias=leer('guias.json');tarjetas=''
 rutas_col={c[0].split('/')[-1]:(c[1],c[2]) for c in collections}
 for k,g in guias.items():
  svg,ces,cen=FIG[g['figura']]
  fig='<figure><svg viewBox="0 0 740 240" role="img"'+ba('aria-label',ces,cen)+'>'+defs+svg+'</svg>'+bi(ces,cen,'figcaption')+'</figure>'
  cuerpo=''
  for i,s in enumerate(g['secciones']):
   cuerpo+=bi(s['h']['es'],s['h']['en'],'h2')+''.join(bi(a,b) for a,b in zip(s['es'],s['en']))
   if i==0:cuerpo+=fig
  cols=''.join('<li><a href="/imagenes/'+c+'/">'+bi(*rutas_col[c],'span')+'</a></li>' for c in g['colecciones'] if c in rutas_col)
  write('imagenes/como-usar/'+k,g['titulo']['es'],g['desc']['es'],title_en=g['titulo']['en'],
   schema={'@context':'https://schema.org','@type':'HowTo','name':g['titulo']['es'],'description':g['desc']['es'],'inLanguage':'es','step':[{'@type':'HowToStep','name':s['h']['es'],'text':' '.join(s['es'])} for s in g['secciones']]},
   body='<a class="back-link" href="/imagenes/como-usar/">← '+bi('Guías de uso','How-to guides','span')+'</a><article class="guide">'+bi('GUÍA','GUIDE','p',**{'class':'eyebrow'})+bi(g['titulo']['es'],g['titulo']['en'],'h1')+cuerpo
   +bi('Colecciones para esta guía','Collections for this guide','h2')+'<ul class="related-links">'+cols+'</ul>'+'</article>')
  tarjetas+='<a class="collection-card" href="/imagenes/como-usar/'+k+'/"><div>'+bi(g['titulo']['es'],g['titulo']['en'],'h3')+bi(g['desc']['es'],g['desc']['en'],'span')+'</div></a>'
 if guias:
  write('imagenes/como-usar','Cómo usar las imágenes bíblicas de Verbo','Guías para usar imágenes bíblicas gratis en Lumbrera, PowerPoint, Google Slides, Canva, miniaturas de YouTube y OBS para la iglesia.',title_en='How to use Verbo’s Bible images',
   body='<a class="back-link" href="/imagenes/">← '+bi('Imágenes','Images','span')+'</a><header class="collection-heading">'+bi('GUÍAS DE USO','HOW-TO GUIDES','p',**{'class':'eyebrow'})+bi('Cómo usar las imágenes bíblicas','How to use the Bible images','h1')+license_line
   +bi('Guías cortas para llevar las imágenes del banco a la pantalla de tu iglesia, a tus presentaciones, a tus videos y a la transmisión del culto.','Short guides to bring the library images to your church screen, your presentations, your videos and your service livestream.')+'</header><div class="collection-grid guides-grid">'+tarjetas+'</div>')
 # Página de la licencia: Google pide que «license» sea una página que la describa.
 write('imagenes/licencia','Licencia de las imágenes de Verbo','Las imágenes bíblicas de Verbo son gratis para cualquier uso, también comercial, sin registro y sin atribución obligatoria.',title_en='Verbo image license',
  schema={'@context':'https://schema.org','@type':'WebPage','name':'Licencia de las imágenes de Verbo','url':BASE+'/imagenes/licencia/'},
  body='<a class="back-link" href="/imagenes/">← '+bi('Imágenes','Images','span')+'</a><article class="guide">'+bi('LICENCIA','LICENSE','p',**{'class':'eyebrow'})+bi('Licencia de las imágenes de Verbo','Verbo image license','h1')+license_line
  +bi('Puedes descargar, usar, modificar y compartir las imágenes del banco de Verbo gratis y para cualquier fin, también comercial: presentaciones, predicaciones, clases, videos (incluso en canales monetizados), redes sociales, impresos, sitios web y productos.','You may download, use, modify and share the images in the Verbo library free of charge and for any purpose, including commercial: presentations, sermons, classes, videos (including monetized channels), social media, print, websites and products.')
  +bi('Qué no hace falta','What is not required','h2')+'<ul>'+bi('No hace falta registrarse ni pedir permiso.','No sign-up or permission is required.','li')+bi('No es obligatorio dar crédito, aunque agradecemos que menciones a Verbo (verbobiblia.com).','Attribution is not required, although we appreciate a mention of Verbo (verbobiblia.com).','li')+'</ul>'
  +bi('Qué te pedimos','What we ask','h2')+'<ul>'+bi('No presentes las imágenes como fotografías reales ni como obras históricas: son ilustraciones generadas con inteligencia artificial y revisadas por Verbo.','Do not present the images as real photographs or historical artworks: they are AI-generated illustrations reviewed by Verbo.','li')+bi('No las uses para engañar, para atribuir a la Biblia lo que no dice ni en contextos que ridiculicen la fe.','Do not use them to deceive, to attribute to the Bible what it does not say, or in contexts that mock the faith.','li')+bi('No vendas las imágenes sin cambios como si fueran tuyas, por ejemplo en otros bancos de imágenes.','Do not resell the unmodified images as your own, for example on other stock image sites.','li')+'</ul>'
  +bi('Cómo descargarlas','How to download them','h2')+bi('En la página de cada imagen están el original horizontal en HD y un recorte vertical de 720 × 1280. La descarga no lleva marca de agua. Las tarjetas con versículo que se crean para compartir sí llevan una marca pequeña de verbobiblia.com.','Each image page offers the landscape HD original and a 720 × 1280 vertical crop. The download has no watermark. Verse cards created for sharing carry a small verbobiblia.com mark.')
  +bi('Los textos bíblicos que acompañan las imágenes son de la Biblia Verbo (español) y la Berean Standard Bible (inglés, dominio público).','The Bible texts shown with the images are from the Biblia Verbo (Spanish) and the Berean Standard Bible (English, public domain).')+'<p><a href="/licencias/">'+bi('Licencias de los demás recursos de Verbo','Licenses for Verbo’s other resources','span')+'</a></p></article>')
 options=''.join('<option value="'+e(b)+'"'+(' data-es="'+e(b,quote=True)+'" data-en="'+e(BOOKS[b],quote=True)+'"' if b in BOOKS else '')+'>'+e(b)+'</option>' for b in sorted({x['libro'] for x in items},key=lambda b:canonical.index(b) if b in canonical else 99))
 todos='<option value="" data-es="Todos" data-en="All">Todos</option>'
 body='<header class="bank-hero">'+bi('BANCO DE IMÁGENES CRISTIANAS GRATIS','FREE CHRISTIAN STOCK IMAGES','p',**{'class':'eyebrow'})+bi('La Biblia, en imágenes.','The Bible, in images.','h1')+license_line+bi('Imágenes cristianas gratis para contar una historia eterna: escenas bíblicas, fondos cristianos para proyector y wallpapers para celular. Para tus clases, tu iglesia y tus ideas.','Free Christian images to tell a timeless story: Bible scenes, church projector backgrounds and phone wallpapers. For your classroom, your church and your ideas.')+'<form class="filters" role="search"><label class="search-box"><span aria-hidden="true">⌕</span>'+bi('Buscar','Search','span',**{'class':'sr-only'})+'<input id="query" type="search"'+ba('placeholder','Jesús, Mateo 14, oración…','Jesus, Matthew 14, prayer…')+'><button type="submit"'+ba('aria-label','Buscar','Search')+'>→</button></label><div class="suggestions">'
 for es,en in [('Navidad','Christmas'),('Semana Santa','Holy Week'),('milagros','miracles'),('parábolas','parables'),('paisajes','landscapes'),('fondos para versículos','verse backgrounds')]:body+='<button type="button" data-suggestion="'+es+'" data-suggestion-en="'+en+'">'+bi(es,en,'span')+'</button>'
 body+='</div><div class="filter-row"><label>'+bi('Libro','Book','span')+'<select id="book">'+todos+options+'</select></label><label>'+bi('Testamento','Testament','span')+'<select id="testament">'+todos+'<option value="NT" data-es="Nuevo Testamento" data-en="New Testament">Nuevo Testamento</option><option value="AT" data-es="Antiguo Testamento" data-en="Old Testament">Antiguo Testamento</option></select></label><label>'+bi('Tipo','Type','span')+'<select id="type">'+todos+''.join('<option value="'+k+'" data-es="'+a+'" data-en="'+b+'">'+a+'</option>' for k,(a,b) in TYPES.items() if k!='wallpapers')+'</select></label><button type="reset">'+bi('Limpiar','Clear','span')+'</button></div></form></header>'
 if args.todas:body+=bi('VISTA PREVIA LOCAL: incluye imágenes pendientes de revisión. No publicar esta compilación.','LOCAL PREVIEW: includes images awaiting review. Do not publish this build.','p')
 body+='<div class="results-heading">'+bi('Explora la colección','Explore the library','h2')+''+cuenta(len(items),'imagen','imágenes','image','images','p',id='results',role='status',**{'aria-live':'polite'})+'</div><div class="grid" id="image-grid">'+''.join(card(x,i==0)+('<!-- verbo:anuncio:banco-entre-filas -->' if (i+1)%12==0 else '') for i,x in enumerate(items[:24]))+'</div><noscript><p>Explora las colecciones para ver todas las imágenes.</p></noscript><section class="collections"><div class="section-heading">'+bi('UNA NUEVA FORMA DE EXPLORAR','A NEW WAY TO EXPLORE','p',**{'class':'eyebrow'})+bi('Encuentra tu inspiración','Find your inspiration','h2')+'</div><div class="collection-grid">'
 featured=[c for c in collections if c[0].split('/')[-1] in TEMATICAS]+([c for c in collections if c[3] and '/temas/' not in c[0] and '/tipos/' not in c[0] and c[0].count('/')==1 and c[0].split('/')[-1] not in TEMATICAS][:3]+[c for c in collections if c[3] and '/tipos/' in c[0]][:3]+[c for c in collections if c[3] and '/temas/' in c[0]][:3])
 for route,es,en,rows in featured:body+='<a class="collection-card" href="/'+route+'/"><picture><source type="image/webp" srcset="'+rows[0]['medium_webp']+'"><img src="'+rows[0]['medium']+'" width="640" height="360" loading="lazy" alt=""></picture><div>'+bi(es,en,'h3')+cuenta(len(rows),'imagen','imágenes','image','images','span')+'</div></a>'
 body+='</div><p class="bank-more"><a href="/imagenes/personajes/">'+bi('Personajes bíblicos','Bible characters','span')+' →</a> · <a href="/imagenes/como-usar/">'+bi('Guías de uso: Lumbrera, PowerPoint, Canva, YouTube y OBS','How-to guides: Lumbrera, PowerPoint, Canva, YouTube and OBS','span')+' →</a></p></section><section class="bank-about">'+bi('Imágenes para compartir la Palabra','Images for sharing the Word','h2')+bi('Un banco de ilustraciones bíblicas generadas con IA y revisadas por Verbo. Explora por evento, cita o tema y consulta el pasaje para conocer su contexto.','A library of AI-generated Bible illustrations reviewed by Verbo. Explore by event, reference or theme, and read the passage for its context.')+license+bi('Elige el original horizontal para presentaciones y materiales de iglesia, o el recorte vertical para fondos de pantalla cristianos. Descarga directamente, sin registro.','Choose the landscape original for presentations and church materials, or a vertical crop for Christian phone wallpapers. Download directly, without signing up.')+'</section><script src="/imagenes/buscador.js" defer></script>'
 write('imagenes','Banco de imágenes cristianas gratis · Imágenes bíblicas y fondos cristianos en HD', 'Banco de imágenes cristianas gratis: imágenes bíblicas en HD, fondos cristianos gratis para proyector y celular, wallpapers e ilustraciones de la Biblia para descargar.',body,title_en='Free Christian stock images · Bible images and backgrounds in HD')
 if not args.todas:
  # Sitemap de imágenes para Google Imágenes (declarado en robots.txt).
  x_=lambda s:e(str(s),quote=False)
  urls=''.join(f'<url><loc>https://verbobiblia.com{x["url"]}</loc><image:image><image:loc>https://verbobiblia.com{x["original"]}</image:loc></image:image><image:image><image:loc>https://verbobiblia.com{x["vertical"]}</image:loc></image:image></url>\n' for x in items)
  (R/'sitemap-imagenes.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n'+urls+'</urlset>\n')
 (out/'indice.json').write_text(json.dumps(items,ensure_ascii=False,separators=(',',':'))+'\n')
 save();generated=sorted(str(p.relative_to(R)) for p in out.rglob('*') if p.is_file() and p not in before);(out/'generated.json').write_text(json.dumps(generated,indent=2)+'\n');print(f'Banco: {len(items)} imágenes; {len(collections)} colecciones; vista previa={args.todas}')
def sync_sitemap():
 # Las páginas del banco entran y salen del sitemap con cada compilación (pie_comun lo usa como lista pública).
 import datetime
 sm=R/'sitemap.xml';t=sm.read_text();base='https://verbobiblia.com/'
 def keep(m):
  u=m.group(1);return '' if u.startswith(base+'imagenes/') and (u.startswith(base+TEMAS) or not (R/u[len(base):]/'index.html').exists()) else m.group(0)
 t=re.sub(r'  <url>\n    <loc>(.*?)</loc>\n(?:    .*\n)*?  </url>\n',keep,t);have=set(re.findall(r'<loc>(.*?)</loc>',t));today=datetime.date.today().isoformat();add=''
 for q in sorted((R/'imagenes').rglob('index.html')):
  u=base+str(q.parent.relative_to(R))+'/'
  if u not in have and not u.startswith(base+TEMAS):add+=f'  <url>\n    <loc>{u}</loc>\n    <lastmod>{today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>{"0.6" if len(q.parent.relative_to(R).parts)>2 else "0.7"}</priority>\n  </url>\n'
 sm.write_text(t.replace('</urlset>',add+'</urlset>'))
if __name__=='__main__':
 build()
 if '--todas' not in sys.argv:sync_sitemap()
 from pie_comun import apply
 apply()
