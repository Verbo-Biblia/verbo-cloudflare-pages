#!/usr/bin/env python3
"""Copia La Senda (la app Android de preguntas bíblicas, que también funciona en el navegador) a /juegos/la-senda/.
Origen: ~/Verbo/Juego-Preguntas-Biblicas/la-senda-app/www. Agrega título, descripción, imagen para redes y el enlace
de regreso a Juegos, y dibuja las miniaturas de la tarjeta (portada.webp y portada-en.webp).
Uso (desde la raíz del sitio): python3 tools/publicar_la_senda_web.py  — después, python3 tools/pie_comun.py"""
import shutil
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

R = Path(__file__).resolve().parent.parent
APP = Path.home() / 'Verbo/Juego-Preguntas-Biblicas/la-senda-app'
DESTINO = R / 'juegos/la-senda'

shutil.copytree(APP / 'www', DESTINO, dirs_exist_ok=True)
pagina = DESTINO / 'index.html'
html = pagina.read_text(encoding='utf-8')
if 'verbo:la-senda-web' not in html:
    # verbo:sin-pie: pie_comun.py no le agrega el pie ni los scripts del sitio (chocan con su propio i18n).
    cabeza = ('<!-- verbo:la-senda-web --><!-- verbo:sin-pie -->'
              '<meta name="description" content="La Senda: juego gratis de preguntas bíblicas en español e inglés. '
              'Tres niveles (Fácil, Difícil y Teólogo) con 278 preguntas, explicaciones y citas. Sin instalar nada.">'
              '<link rel="canonical" href="https://verbobiblia.com/juegos/la-senda/">'
              '<meta property="og:title" content="La Senda · Preguntas bíblicas">'
              '<meta property="og:description" content="Juego gratis de preguntas bíblicas con la Escritura abierta.">'
              '<meta property="og:image" content="https://verbobiblia.com/juegos/la-senda/portada.webp">'
              '<meta property="og:type" content="website">'
              '<style>#verboVolver{position:fixed;top:6px;left:8px;z-index:50;font:600 12px system-ui,sans-serif;'
              'color:#f0c75e;text-decoration:none;opacity:.8}#verboVolver:hover{opacity:1}</style>')
    html = html.replace('<title>La Senda</title>', '<title>La Senda · preguntas bíblicas gratis | Verbo</title>' + cabeza, 1)
    html = html.replace('<body>', '<body><a id="verboVolver" href="/juegos/" aria-label="Juegos de Verbo / Verbo games">← Verbo</a>', 1)
    pagina.write_text(html, encoding='utf-8')

# Miniatura 1280x720: fondo azul noche, ícono y nombre en dorado, y un teléfono con una pregunta real.
W, H = 1280, 720
SERIF = '/usr/share/fonts/truetype/SourceSerifPro-Bold.otf'
SANS = '/usr/share/fonts/truetype/Poppins-Medium.ttf'
TEXTOS = {'es': ('Preguntas bíblicas', 'con la Escritura abierta', '278 preguntas · 3 niveles', 'tienda/es/captura-2.png'),
          'en': ('Bible questions', 'with the Scripture open', '278 questions · 3 levels', 'tienda/en/screenshot-en-2.png')}
for idioma, (linea1, linea2, dato, captura) in TEXTOS.items():
    lienzo = Image.new('RGB', (W, H), '#06101d')
    luz = Image.new('RGB', (W, H), '#06101d')
    ImageDraw.Draw(luz).ellipse((-200, -420, 900, 420), fill='#1d4a76')
    lienzo = Image.blend(lienzo, luz.filter(ImageFilter.GaussianBlur(160)), .9).convert('RGBA')
    resplandor = Image.new('RGBA', (W, H))
    ImageDraw.Draw(resplandor).ellipse((760, 80, 1220, 700), fill=(240, 199, 94, 70))
    lienzo = Image.alpha_composite(lienzo, resplandor.filter(ImageFilter.GaussianBlur(90)))
    # Teléfono inclinado con la parte de arriba de una pregunta.
    pantalla = Image.open(APP / captura).convert('RGBA').crop((0, 0, 1080, 1300)).resize((420, 506), Image.LANCZOS)
    telefono = Image.new('RGBA', (452, 560), (0, 0, 0, 0))
    ImageDraw.Draw(telefono).rounded_rectangle((0, 0, 451, 559), 44, fill='#0b1626', outline='#3a5878', width=4)
    mascara = Image.new('L', pantalla.size, 0)
    ImageDraw.Draw(mascara).rounded_rectangle((0, 0, *pantalla.size), 30, fill=255)
    telefono.paste(pantalla, (16, 30), mascara)
    telefono = telefono.rotate(-6, resample=Image.BICUBIC, expand=True)
    sombra = Image.new('RGBA', (W, H))
    sombra.paste((0, 0, 0, 150), (750, 150), telefono.getchannel('A'))
    lienzo = Image.alpha_composite(lienzo, sombra.filter(ImageFilter.GaussianBlur(24)))
    lienzo.alpha_composite(telefono, (720, 110))
    icono = Image.open(APP / 'icono-playstore-512.png').convert('RGBA').resize((150, 150), Image.LANCZOS)
    mascara = Image.new('L', icono.size, 0)
    ImageDraw.Draw(mascara).rounded_rectangle((0, 0, 149, 149), 34, fill=255)
    lienzo.paste(icono, (80, 110), mascara)
    d = ImageDraw.Draw(lienzo)
    d.text((76, 300), 'La Senda', font=ImageFont.truetype(SERIF, 128), fill='#f0c75e')
    d.text((82, 460), linea1, font=ImageFont.truetype(SANS, 40), fill='#f7f3e7')
    d.text((82, 512), linea2, font=ImageFont.truetype(SANS, 40), fill='#f7f3e7')
    d.text((82, 592), dato, font=ImageFont.truetype(SANS, 28), fill='#a9b9ca')
    lienzo.convert('RGB').save(DESTINO / ('portada.webp' if idioma == 'es' else 'portada-en.webp'), 'WEBP', quality=82)

total = sum(f.stat().st_size for f in DESTINO.rglob('*') if f.is_file())
print(f'La Senda web en {DESTINO}: {total / 1e6:.1f} MB')
