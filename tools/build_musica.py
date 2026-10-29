#!/usr/bin/env python3
"""Sección Música (/musica/), generada desde una sola fuente: data/musica.json.

Escribe musica/index.html, las imágenes locales de musica/img/ (portadas, fotos y miniaturas en WebP),
musica/og.jpg y la entrada del sitemap. Hojas de estilo y script fijos: musica/musica.css y musica/musica.js.

Privacidad: la página no carga nada de Spotify ni de YouTube. Cada canción o video muestra su portada local y un
botón ▶; al tocarlo, musica.js pone el reproductor (open.spotify.com/embed o youtube-nocookie.com).
Las imágenes se descargan una sola vez (solo de los CDN de Spotify y de i.ytimg.com) en una carpeta temporal,
se procesan con Pillow y se guardan en musica/img/. Si ya existen, no se vuelven a pedir.

El texto va en español en el HTML; el inglés viaja en data-en y lo pone /assets/secciones/secciones.js.

Uso:  python3 tools/build_musica.py     y después   python3 tools/pie_comun.py
Para actualizar: agrega pistas, artistas o videos en data/musica.json (ver «_leeme») y vuelve a correrlo.
"""
import datetime, io, json, re, sys, tempfile, unicodedata, urllib.request
from html import escape as e
from pathlib import Path
from urllib.parse import urlsplit

from PIL import Image, ImageDraw, ImageFilter, ImageFont

R = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(R / 'tools'))
from build_juegos import bi, ba, jd, barra, sitemap  # mismo encabezado, i18n y sitemap que /juegos/

BASE = 'https://verbobiblia.com'
V = '20261029-musica'
D = json.loads((R / 'data/musica.json').read_text(encoding='utf-8'))
IMG = R / 'musica/img'
HOSTS = ('i.scdn.co', 'i.ytimg.com', 'image-cdn-ak.spotifycdn.com', 'image-cdn-fa.spotifycdn.com', 'mosaic.scdn.co')
MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

# ---------- imágenes locales ----------
_tmp = None
USADAS = set()  # imágenes que usa esta compilación; las demás de musica/img/ se borran al terminar
def bajar(url):
    """Descarga una imagen permitida a la carpeta temporal propia y la devuelve abierta con Pillow."""
    global _tmp
    if urlsplit(url).hostname not in HOSTS or urlsplit(url).scheme != 'https':
        raise SystemExit(f'Imagen de un dominio no permitido: {url}')
    _tmp = _tmp or Path(tempfile.mkdtemp(prefix='verbo-musica-'))
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (verbobiblia.com build_musica)'})
    with urllib.request.urlopen(req, timeout=30) as r:
        datos = r.read(8_000_000)
    f = _tmp / re.sub(r'[^A-Za-z0-9_.-]', '_', url.rsplit('/', 2)[-2] + '_' + url.rsplit('/', 1)[-1])
    f.write_bytes(datos)
    im = Image.open(f)
    im.load()
    return im.convert('RGB')

def recorte(im, ancho, alto):
    """Recorte centrado a la proporción pedida y reducción de calidad alta."""
    w, h = im.size; r = ancho / alto
    if w / h > r: nw = round(h * r); im = im.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
    else: nh = round(w / r); im = im.crop((0, (h - nh) // 2, w, (h - nh) // 2 + nh))
    return im.resize((ancho, alto), Image.LANCZOS)

def local(nombre, url, ancho, alto, calidad=80, prep=None):
    """Ruta pública de una imagen local; la crea si falta. prep: ajuste opcional antes del recorte."""
    dest = IMG / f'{nombre}.webp'
    USADAS.add(dest.name)
    if not dest.exists():
        im = bajar(url)
        if prep: im = prep(im)
        dest.parent.mkdir(parents=True, exist_ok=True)
        recorte(im, ancho, alto).save(dest, 'WEBP', quality=calidad, method=6)
        print('  imagen nueva:', dest.relative_to(R))
    return f'/musica/img/{nombre}.webp'

def sin_franjas(im):
    """Las miniaturas hqdefault de YouTube son 4:3 con franjas negras: se quitan antes de recortar a 16:9."""
    w, h = im.size
    return im.crop((0, round(h * .125), w, round(h * .875))) if abs(w / h - 4 / 3) < .02 else im

def clave_portada(url): return url.rstrip('/').rsplit('/', 1)[-1][-24:]
def portada(p, grande=False):
    k = clave_portada(p['portada'])
    return local(f'c-{k}-g' if grande else f'c-{k}', p['portada'], 600 if grande else 160, 600 if grande else 160, 82 if grande else 78)
def foto(a): return local(f'a-{a["id"]}', a['foto'], 400, 400, 80)
def mini(v, grande=False):
    if grande:
        try: return local(f'v-{v["id"]}-g', f'https://i.ytimg.com/vi/{v["id"]}/maxresdefault.jpg', 960, 540, 80)
        except Exception: pass
    return local(f'v-{v["id"]}', f'https://i.ytimg.com/vi/{v["id"]}/hqdefault.jpg', 480, 270, 78, sin_franjas)

# ---------- utilidades ----------
def slug(t):
    t = unicodedata.normalize('NFKD', t).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', t).strip('-')
def dur(ms): s = round(ms / 1000); return f'{s // 60}:{s % 60:02d}'
def fecha(iso):
    d = datetime.date.fromisoformat(iso)
    return bi(f'{d.day} de {MESES[d.month - 1]} de {d.year}', f'{MONTHS[d.month - 1]} {d.day}, {d.year}', 'time', datetime=iso)
def ext(url, es, en, clase='m-enlace'):
    return f'<a class="{clase}" href="{e(url, quote=True)}" target="_blank" rel="noopener">' + bi(es, en, 'span') + '<span aria-hidden="true"> ↗</span></a>'

ARTISTAS = D['artistas']
POR_ID = {a['id']: a for a in ARTISTAS}
ESTILOS = {s['id']: s for s in D['estilos']}
CANALES = {c['id']: c for c in D['canales']}
EXCLUIR = set(D.get('excluir_videos', {}))
VIDEOS = sorted((v for v in D['videos'] if v['id'] not in EXCLUIR), key=lambda v: v['fecha'], reverse=True)
ARTICULOS = [x for x in D.get('articulos', []) if x.get('mostrar')]

def pistas_de(a):
    """Más recientes primero; con la misma fecha se conserva el orden de Spotify."""
    return sorted(a['pistas'], key=lambda p: p['fecha'], reverse=True)

# ---------- reproductores (se activan solo al tocar) ----------
def boton_play(tipo, ident, titulo, clase='m-play'):
    return (f'<button type="button" class="{clase}" data-tipo="{tipo}" data-id="{e(ident, quote=True)}" data-titulo="{e(titulo, quote=True)}"'
            + ba('aria-label', f'Reproducir «{titulo}»', f'Play “{titulo}”') + '><span aria-hidden="true">▶</span></button>')

def video_media(v, grande=False, primera=False):
    carga = ' fetchpriority="high"' if primera else ' loading="lazy"'
    w, h = (960, 540) if grande else (480, 270)
    return (f'<div class="m-media m-media--video" data-reproductor><img src="{mini(v, grande)}" width="{w}" height="{h}" alt=""{carga}>'
            + boton_play('youtube', v['id'], v['titulo'], 'm-play m-play--grande' if grande else 'm-play') + '</div>')

def fila_pista(p, a, con_portada=True):
    img = f'<img src="{portada(p)}" width="160" height="160" alt="" loading="lazy">' if con_portada else ''
    return (f'<li class="m-pista" data-reproductor>{img}<span class="m-pista__t">{e(p["titulo"])}</span>'
            f'<span class="m-pista__d">{dur(p["ms"])}</span>' + boton_play('spotify', p['id'], f'{p["titulo"]} · {a["nombre"]}', 'm-play m-play--fila') + '</li>')

# ---------- lanzamientos (para portada y «Lo nuevo») ----------
def lanzamientos():
    out = []
    for a in ARTISTAS:
        grupos = {}
        for p in a['pistas']: grupos.setdefault(p['fecha'], []).append(p)
        for f, ps in grupos.items():
            out.append({'tipo': 'pista', 'fecha': f, 'artista': a['nombre'], 'a': a, 'p': ps[0], 'n': len(ps)})
    for v in VIDEOS:
        out.append({'tipo': 'video', 'fecha': v['fecha'], 'artista': v.get('artista'), 'v': v})
    return sorted(out, key=lambda x: (x['fecha'], x['tipo'] == 'video'), reverse=True)

def destacado(todos):
    d = D.get('destacado')
    if d:
        for x in todos:
            if (x['tipo'] == 'video' and x['v']['id'] == d.get('id')) or (x['tipo'] == 'pista' and x['p']['id'] == d.get('id')): return x
        raise SystemExit(f'destacado no encontrado: {d}')
    return next(x for x in todos if x['artista'])

def titulo_de(x): return x['p']['titulo'] if x['tipo'] == 'pista' else (x['v'].get('cancion') or x['v']['titulo'])

def nota_de(x):
    if x['tipo'] == 'pista':
        n = x['n']
        return (f'{n} canciones en Spotify', f'{n} songs on Spotify') if n > 1 else ('Sencillo en Spotify', 'Single on Spotify')
    v = x['v']
    if v['canal'] == 'rock': return (v.get('estilo') or 'Rock cristiano', v.get('estilo') or 'Christian rock')
    n = v.get('nota') or {}
    return (n.get('es', 'Video'), n.get('en', 'Video'))

def portada_html(x):
    es, en = nota_de(x); t = titulo_de(x)
    if x['tipo'] == 'pista':
        a, p = x['a'], x['p']
        media = (f'<div class="m-media m-media--cuadrada" data-reproductor data-alto="352"><img src="{portada(p, True)}" width="600" height="600" alt="" fetchpriority="high">'
                 + boton_play('spotify', p['id'], f'{t} · {a["nombre"]}', 'm-play m-play--grande') + '</div>')
        enl = ext(f'https://open.spotify.com/artist/{a["spotify"]}', 'Escuchar en Spotify', 'Listen on Spotify', 'm-boton') + ext(f'https://song.link/s/{p["id"]}', 'Otras plataformas', 'Other platforms', 'm-boton m-boton--sec')
        txt = a['descripcion']
    else:
        v = x['v']; media = video_media(v, grande=True, primera=True)
        canal = CANALES[v['canal']]
        enl = ext(f'https://www.youtube.com/watch?v={v["id"]}', 'Ver en YouTube', 'Watch on YouTube', 'm-boton') + ext(canal['url'], 'Ir al canal', 'Go to the channel', 'm-boton m-boton--sec')
        banda = D['bandas'].get(v.get('artista') or '', {})
        g = banda.get('genero')
        txt = {'es': f'{v["artista"]} abre esta edición' + (f' con «{v["cancion"]}»' if v.get('cancion') else ' con un nuevo bloque de canciones') + (f': {g["es"].lower()} con letras de fe.' if g else '.'),
               'en': f'{v["artista"]} opens this issue' + (f' with “{v["cancion"]}”' if v.get('cancion') else ' with a new set of songs') + (f': {g["en"].lower()} with lyrics of faith.' if g else '.')}
        if v.get('artista') in (a['nombre'] for a in ARTISTAS): txt = next(a for a in ARTISTAS if a['nombre'] == v['artista'])['descripcion']
        if v.get('bajada'): txt = v['bajada']
    return ('<section class="m-portada" aria-labelledby="portada-titulo"><div class="portal-wrap m-portada__grid"><article class="m-portada__nota">' + media +
            '<div class="m-portada__texto">' + bi('Portada · Lo más reciente', 'Cover · Latest release', 'p', class_='m-antetitulo') +
            f'<p class="m-portada__artista">{e(x["artista"])}</p>' + f'<h2 id="portada-titulo">{e(t)}</h2>' +
            '<p class="m-portada__meta">' + bi(es, en, 'span') + ' · ' + fecha(x['fecha']) + '</p>' + bi(txt['es'], txt['en'], 'p', class_='m-portada__bajada') +
            '<div class="m-botones">' + enl + '</div></div></article>')

def lo_nuevo(todos, dest, n=4):
    filas = []
    for x in todos:
        if x is dest: continue
        if x['tipo'] == 'video' and x['v']['id'] == dest.get('v', {}).get('id'): continue
        es, en = nota_de(x)
        quien = x['artista'] or CANALES[x['v']['canal']]['nombre']
        if x['tipo'] == 'pista':
            img = f'<img src="{portada(x["p"])}" width="160" height="160" alt="" loading="lazy">'
            play = boton_play('spotify', x['p']['id'], f'{titulo_de(x)} · {quien}', 'm-play m-play--fila')
            clase = 'm-nuevo m-nuevo--pista'
        else:
            img = f'<img src="{mini(x["v"])}" width="480" height="270" alt="" loading="lazy">'
            play = boton_play('youtube', x['v']['id'], f'{titulo_de(x)} · {quien}', 'm-play m-play--fila')
            clase = 'm-nuevo'
        filas.append(f'<li class="{clase}" data-reproductor>{img}<div><p class="m-nuevo__quien">{e(quien)}</p><p class="m-nuevo__t">{e(titulo_de(x))}</p>'
                     '<p class="m-nuevo__meta">' + bi(es, en, 'span') + ' · ' + fecha(x['fecha']) + f'</p></div>{play}</li>')
        if len(filas) == n: break
    return ('<aside class="m-nuevos"' + ba('aria-label', 'Lo nuevo', 'New') + '>' + bi('Lo nuevo', 'New this month', 'h2', class_='m-columna') +
            '<ol>' + ''.join(filas) + '</ol>' + bi('Toca ▶ para escuchar aquí mismo.', 'Tap ▶ to listen right here.', 'p', class_='m-nota') + '</aside></div></section>')

# ---------- artistas ----------
def tarjeta_artista(a):
    ps = pistas_de(a); top, resto = ps[:3], ps[3:]
    arts = [x for x in ARTICULOS if x.get('artista') == a['id']]
    mas = ''
    if resto:
        mas = ('<details class="m-mas"><summary>' + bi(f'Más canciones ({len(resto)})', f'More songs ({len(resto)})', 'span') + '</summary><ol class="m-pistas m-pistas--simple">' +
               ''.join(fila_pista(p, a, False) for p in resto) + '</ol></details>')
    leer = ''.join(f'<a class="m-enlace" href="{e(x["url"], quote=True)}">' + bi('Leer el perfil', 'Read the profile', 'span') + '</a>' for x in arts)
    rock = ('<a class="m-enlace" href="#rock">' + bi('Ver sus videos', 'See the videos', 'span') + '</a>') if a['estilo'] == 'rock' else ''
    return (f'<article class="m-artista" id="{a["id"]}"><div class="m-artista__cabeza"><img class="m-artista__foto" src="{foto(a)}" width="400" height="400" alt="{e(a["nombre"], quote=True)}" loading="lazy">'
            '<div>' + bi(a['genero']['es'], a['genero']['en'], 'p', class_='m-genero') + f'<h3>{e(a["nombre"])}</h3></div></div>' +
            bi(a['descripcion']['es'], a['descripcion']['en'], 'p', class_='m-artista__desc') +
            '<ol class="m-pistas">' + ''.join(fila_pista(p, a) for p in top) + '</ol>' + mas +
            '<div class="m-artista__enlaces">' + ext(f'https://open.spotify.com/artist/{a["spotify"]}', 'Escuchar en Spotify', 'Listen on Spotify') +
            ext(f'https://song.link/s/{ps[0]["id"]}', 'Apple Music y otras', 'Apple Music and more') + rock + leer + '</div></article>')

def seccion_artistas():
    out = ('<section class="m-papel" id="artistas" aria-labelledby="artistas-titulo"><div class="portal-wrap">'
           '<header class="m-seccion__cabeza">' + bi('Artistas', 'Artists', 'p', class_='m-antetitulo') +
           bi('Voces de la música cristiana', 'Voices of Christian music', 'h2', id='artistas-titulo') +
           bi('Quince artistas, por estilo. Cada uno con sus canciones más recientes: toca ▶ para escucharlas sin salir de la página.',
              'Fifteen artists, by style. Each with their latest songs: tap ▶ to listen without leaving the page.', 'p', class_='m-bajada') + '</header>')
    out += '<nav class="m-estilos"' + ba('aria-label', 'Estilos', 'Styles') + '>' + ''.join(f'<a href="#estilo-{k}">' + bi(s['es'], s['en'], 'span') + '</a>' for k, s in ESTILOS.items()) + '<a href="#rock">' + bi('Bandas de rock', 'Rock bands', 'span') + '</a></nav>'
    for k, s in ESTILOS.items():
        arts = [a for a in ARTISTAS if a['estilo'] == k]
        if not arts: continue
        out += (f'<section class="m-estilo" id="estilo-{k}" data-estilo="{k}"><header class="m-estilo__cabeza">' + bi(s['es'], s['en'], 'h3') +
                bi(s['lema']['es'], s['lema']['en'], 'p') + '</header><div class="m-artistas">' + ''.join(tarjeta_artista(a) for a in arts) + '</div></section>')
    return out + '</div></section>'

# ---------- rock ----------
def seccion_rock():
    canal = CANALES['rock']; vistos = {}; conteo = {}
    for v in VIDEOS:
        if v['canal'] != 'rock' or not v.get('artista'): continue
        conteo[v['artista']] = conteo.get(v['artista'], 0) + 1
        vistos.setdefault(v['artista'], v)
    tarjetas = []
    for i, (banda, v) in enumerate(vistos.items()):
        b = D['bandas'].get(banda, {}); g = b.get('genero', {'es': 'Rock cristiano', 'en': 'Christian rock'})
        otro = ''
        a = POR_ID.get(b.get('artista', ''))
        if a: otro = ext(f'https://open.spotify.com/artist/{a["spotify"]}', 'En Spotify', 'On Spotify')
        tarjetas.append('<article class="m-banda">' + video_media(v) + '<div class="m-banda__texto">' + bi(g['es'], g['en'], 'p', class_='m-genero') +
                        f'<h3>{e(banda)}</h3><p class="m-banda__cancion">{e(v.get("cancion") or v["titulo"])}</p>' +
                        '<p class="m-banda__meta">' + fecha(v['fecha']) + '</p>'
                        '<div class="m-artista__enlaces">' + ext(f'https://www.youtube.com/watch?v={v["id"]}', 'Ver en YouTube', 'Watch on YouTube') + otro + '</div></div></article>')
    return ('<section class="m-rock" id="rock" aria-labelledby="rock-titulo"><div class="portal-wrap"><header class="m-rock__cabeza"><div>' +
            bi('Especial', 'Special', 'p', class_='m-antetitulo') + bi('Rock cristiano', 'Christian rock', 'h2', id='rock-titulo') +
            bi(f'{len(vistos)} bandas que cantan su fe con guitarras eléctricas: del thrash y el nu metal al AOR de estadio, el rock latino y el instrumental. La mayoría se escucha, por ahora, solo en YouTube.',
               f'{len(vistos)} bands singing their faith with electric guitars: from thrash and nu metal to stadium AOR, Latin rock and instrumental rock. Most of them, for now, are only on YouTube.', 'p', class_='m-bajada') +
            '</div>' + ext(canal['url'], 'Canal Rock Cristiano en YouTube', 'Rock Cristiano channel on YouTube', 'm-boton m-boton--rock') + '</header>'
            '<div class="m-bandas">' + ''.join(tarjetas) + '</div></div></section>')

# ---------- videos recientes ----------
def seccion_videos(excluir, n=8):
    vs = [v for v in VIDEOS if v['id'] not in excluir][:n]
    def tarjeta(v):
        canal = CANALES[v['canal']]
        quien = v.get('artista') or canal['nombre']
        nota = v.get('nota') or {'es': v.get('estilo') or 'Video', 'en': v.get('estilo') or 'Video'}
        return ('<article class="m-video">' + video_media(v) + f'<p class="m-video__quien">{e(quien)}</p><h3>{e(v.get("cancion") or v["titulo"])}</h3>'
                '<p class="m-video__meta">' + bi(nota['es'], nota['en'], 'span') + (f' · {e(v["duracion"])}' if v.get('duracion') else '') + ' · ' + fecha(v['fecha']) + '</p></article>')
    return ('<section class="m-videos" id="videos" aria-labelledby="videos-titulo"><div class="portal-wrap"><header class="m-seccion__cabeza">' +
            bi('En video', 'On video', 'p', class_='m-antetitulo') + bi('Videos recientes', 'Recent videos', 'h2', id='videos-titulo') +
            bi('Álbumes completos, recopilaciones y estrenos de los dos canales.', 'Full albums, compilations and premieres from both channels.', 'p', class_='m-bajada') +
            '</header><div class="m-rejilla">' + ''.join(tarjeta(v) for v in vs) + '</div></div></section>')

# ---------- canales y selección ----------
def seccion_canales():
    pl = D['playlist']['spotify']
    canales = ''.join(f'<a class="m-canal m-canal--{c["id"]}" href="{e(c["url"], quote=True)}" target="_blank" rel="noopener"><span class="m-canal__icono" aria-hidden="true">▶</span>'
                      f'<span><strong>{e(c["nombre"])}</strong>' + bi(c['lema']['es'], c['lema']['en'], 'span') + '</span><span aria-hidden="true">↗</span></a>' for c in D['canales'])
    lectura = ''
    if ARTICULOS:
        lectura = ('<div class="m-lecturas">' + bi('Para leer', 'Further reading', 'h3') + '<ul>' +
                   ''.join(f'<li><a href="{e(x["url"], quote=True)}">{e(x["titulo"])}</a></li>' for x in ARTICULOS) + '</ul></div>')
    return ('<section class="m-escucha" id="escucha" aria-labelledby="escucha-titulo"><div class="portal-wrap m-escucha__grid"><div>' +
            bi('Escucha', 'Listen', 'p', class_='m-antetitulo') + bi('Una lista con todos', 'One playlist with everyone', 'h2', id='escucha-titulo') +
            bi('Una lista de Spotify con canciones de los quince artistas, para escuchar de corrido. Y dos canales de YouTube con álbumes completos y videos nuevos cada semana.',
               'A Spotify playlist with songs from all fifteen artists, to listen straight through. And two YouTube channels with full albums and new videos every week.', 'p', class_='m-bajada') +
            '<div class="m-canales">' + canales + '</div>' + lectura + '</div>'
            '<div class="m-lista" data-reproductor data-alto="452"><div class="m-lista__tapa" aria-hidden="true">' +
            ''.join(f'<img src="{foto(a)}" width="400" height="400" alt="" loading="lazy">' for a in ARTISTAS[:9]) + '</div>' +
            '<div class="m-lista__pie">' + bi('Lista en Spotify', 'Spotify playlist', 'strong') +
            boton_play('spotify-lista', pl, 'Música cristiana · Verbo', 'm-play m-play--grande') +
            ext(f'https://open.spotify.com/playlist/{pl}', 'Abrir en Spotify', 'Open in Spotify') + '</div></div></div></section>')

# ---------- imagen para redes ----------
def og_image():
    dest = R / 'musica/og.jpg'
    lienzo = Image.new('RGB', (1200, 630), (8, 27, 48))
    fotos = [Image.open(R / foto(a).lstrip('/')).convert('RGB') for a in ARTISTAS]
    lado = 210
    for i, f in enumerate(fotos[:15]):
        x, y = 1200 - lado * (5 - i % 5), (i // 5) * lado
        lienzo.paste(f.resize((lado, lado), Image.LANCZOS), (x, y))
    capa = Image.new('L', (1200, 630), 0); dib = ImageDraw.Draw(capa)
    for x in range(1200): dib.line([(x, 0), (x, 630)], fill=max(0, min(255, int(255 * (1 - (x - 380) / 520)))))
    lienzo.paste(Image.new('RGB', (1200, 630), (8, 27, 48)), (0, 0), capa.filter(ImageFilter.GaussianBlur(4)))
    dib = ImageDraw.Draw(lienzo)
    def fuente(nombres, t):
        for n in nombres:
            for d in ('/usr/share/fonts/truetype', '/usr/share/fonts/truetype/dejavu', '/usr/share/fonts/liberation'):
                p = Path(d) / n
                if p.exists(): return ImageFont.truetype(str(p), t)
        return ImageFont.load_default(t)
    serif = ['LiberationSerif-Bold.ttf', 'DejaVuSerif-Bold.ttf']; sans = ['LiberationSans-Bold.ttf', 'DejaVuSans-Bold.ttf']
    dib.text((72, 150), 'VERBO · MÚSICA', font=fuente(sans, 26), fill=(226, 181, 92))
    dib.text((72, 200), 'Música', font=fuente(serif, 108), fill=(246, 239, 224))
    dib.text((72, 318), 'cristiana', font=fuente(serif, 108), fill=(246, 239, 224))
    dib.text((72, 470), 'Flamenco · boleros · adoración · rock', font=fuente(sans, 30), fill=(169, 182, 198))
    lienzo.save(dest, 'JPEG', quality=86, optimize=True, progressive=True)
    return '/musica/og.jpg'

# ---------- página ----------
def pagina():
    todos = lanzamientos(); dest = destacado(todos)
    hoy = datetime.date.fromisoformat(D.get('actualizado') or datetime.date.today().isoformat())
    cab = ('<header class="m-cabecera"><div class="portal-wrap"><p class="m-cabecera__linea"><span>' + bi('Verbo · Música', 'Verbo · Music', 'span') + '</span>' +
           bi(f'Edición de {MESES[hoy.month - 1]} de {hoy.year}', f'{MONTHS[hoy.month - 1]} {hoy.year} issue', 'span') + '</p>' +
           bi('Música cristiana', 'Christian music', 'h1') +
           bi('Flamenco y rumba, boleros, adoración andina y rock: una selección de artistas que cantan su fe en español. Escucha aquí mismo o sigue a cada uno en tu plataforma favorita.',
              'Flamenco and rumba, boleros, Andean worship and rock: a selection of artists who sing their faith in Spanish. Listen right here or follow each one on your favorite platform.', 'p', class_='m-cabecera__lema') +
           '<nav class="m-indice"' + ba('aria-label', 'En esta página', 'On this page') + '>' +
           ''.join(f'<a href="#{h}">' + bi(es, en, 'span') + '</a>' for h, es, en in (('artistas', 'Artistas', 'Artists'), ('rock', 'Rock cristiano', 'Christian rock'), ('videos', 'Videos', 'Videos'), ('escucha', 'Lista y canales', 'Playlist and channels'))) +
           '</nav></div></header>')
    excluir = {dest['v']['id']} if dest['tipo'] == 'video' else set()
    rock_vistos = set()
    for v in VIDEOS:
        if v['canal'] == 'rock' and v.get('artista') and v['artista'] not in rock_vistos:
            rock_vistos.add(v['artista']); excluir.add(v['id'])
    cuerpo = cab + portada_html(dest) + lo_nuevo(todos, dest) + seccion_artistas() + seccion_rock() + seccion_videos(excluir) + seccion_canales()
    og = og_image()
    te, tn = 'Música cristiana: flamenco, boleros, adoración y rock | Verbo', 'Christian music: flamenco, boleros, worship and rock | Verbo'
    de = 'Música cristiana en español: flamenco y rumba, boleros, adoración andina y bandas de rock cristiano. Escucha canciones y videos recientes de quince artistas.'
    dn = 'Christian music in Spanish: flamenco and rumba, boleros, Andean worship and Christian rock bands. Listen to recent songs and videos from fifteen artists.'
    url = f'{BASE}/musica/'
    schemas = [{'@context': 'https://schema.org', '@type': 'CollectionPage', 'name': 'Música cristiana', 'url': url, 'inLanguage': 'es', 'description': de,
                'mainEntity': {'@type': 'ItemList', 'itemListElement': [{'@type': 'ListItem', 'position': i + 1, 'item': {'@type': 'MusicGroup', 'name': a['nombre'], 'genre': a['genero']['es'],
                    'sameAs': f'https://open.spotify.com/artist/{a["spotify"]}'}} for i, a in enumerate(ARTISTAS)]}},
               {'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [{'@type': 'ListItem', 'position': 1, 'name': 'Inicio', 'item': BASE + '/'},
                    {'@type': 'ListItem', 'position': 2, 'name': 'Música', 'item': url}]}]
    html = (f'<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
            f'<title data-es="{e(te, quote=True)}" data-en="{e(tn, quote=True)}">{e(te)}</title><meta name="description" content="{e(de, quote=True)}">'
            f'<link rel="canonical" href="{url}"><meta name="theme-color" content="#081b30"><meta name="google-adsense-account" content="ca-pub-4810728953852074">'
            f'<meta property="og:type" content="website"><meta property="og:site_name" content="Verbo"><meta property="og:locale" content="es_419"><meta property="og:locale:alternate" content="en_US">'
            f'<meta property="og:title" content="{e(te, quote=True)}"><meta property="og:description" content="{e(de, quote=True)}"><meta property="og:url" content="{url}">'
            f'<meta property="og:image" content="{BASE}{og}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">'
            f'<meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="{BASE}{og}">'
            '<link rel="icon" type="image/png" sizes="192x192" href="/biblia/assets/icons/icon-192.png">'
            '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
            '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Playfair+Display:ital,wght@0,700;0,900;1,700&display=swap" rel="stylesheet">'
            f'<link rel="stylesheet" href="/assets/portal/portal.css?v=20261024-votos"><link rel="stylesheet" href="/musica/musica.css?v={V}">'
            + ''.join(f'<script type="application/ld+json">{jd(s)}</script>' for s in schemas) +
            '</head><body class="portal musica"><a class="skip" href="#contenido" data-i18n="home.skip">Ir al contenido</a>' + barra('/musica/') +
            f'<main id="contenido">{cuerpo}</main>'
            '<script src="/biblia/assets/i18n.js?v=20261021-secciones"></script><script src="/biblia/assets/site-chrome.js?v=20261021-secciones"></script>'
            f'<script src="/assets/secciones/secciones.js?v=20261024-votos" defer></script><script src="/musica/musica.js?v={V}" defer></script></body></html>')
    (R / 'musica').mkdir(exist_ok=True)
    (R / 'musica/index.html').write_text(html, encoding='utf-8')
    return dest

def validar():
    ids = set()
    for a in ARTISTAS:
        for k in ('id', 'nombre', 'spotify', 'estilo', 'genero', 'descripcion', 'foto', 'pistas'):
            if k not in a: raise SystemExit(f'{a.get("nombre")}: falta {k}')
        if a['estilo'] not in ESTILOS: raise SystemExit(f'{a["nombre"]}: estilo desconocido {a["estilo"]}')
        if a['id'] in ids: raise SystemExit('artista repetido ' + a['id'])
        ids.add(a['id'])
        if not a['pistas']: raise SystemExit(f'{a["nombre"]}: sin pistas')
        for p in a['pistas']:
            for k in ('id', 'titulo', 'ms', 'fecha', 'portada'):
                if k not in p: raise SystemExit(f'{a["nombre"]} / {p.get("titulo")}: falta {k}')
    for v in D['videos']:
        if v['canal'] not in CANALES: raise SystemExit(f'video {v["id"]}: canal desconocido')
        if not re.fullmatch(r'[A-Za-z0-9_-]{11}', v['id']): raise SystemExit(f'id de video inválido: {v["id"]}')

if __name__ == '__main__':
    validar()
    dest = pagina()
    sitemap(['musica/'])
    for f in IMG.glob('*.webp'):
        if f.name not in USADAS: f.unlink(); print('  imagen retirada:', f.relative_to(R))
    imgs = list(IMG.glob('*.webp'))
    print(f'Música: {len(ARTISTAS)} artistas, {len(VIDEOS)} videos, {len(imgs)} imágenes locales '
          f'({sum(p.stat().st_size for p in imgs) // 1024} KB). Portada: {dest["artista"]} – {titulo_de(dest)} ({dest["fecha"]}).')
    print('Ahora: python3 tools/pie_comun.py')
