# Material real de Lumbrera

Capturas proporcionadas por el autor el 2026-10-08 desde
`/home/juan/Descargas/Lumbrera-capturas/`:

| Original | Nombre en la web | Uso |
| --- | --- | --- |
| `1-culto-en-vivo.png` | `culto-en-vivo` | Hero, Software y proyección en vivo |
| `2-biblia-en-dos-idiomas.png` | `biblia-dos-idiomas` | Selección y proyección bíblica bilingüe |
| `3-editor-de-canciones.png` | `editor-canciones` | Cancionero y editor |
| `4-buscar-letras-en-internet.png` | `buscar-letras` | Búsqueda de letras |
| `5-culto-tema-claro.png` | `culto-tema-claro` | Preparación de reuniones en tema claro |

Versiones WebP de 800 y 1600 píxeles, calidad 90. Las imágenes conservan
la captura completa, sin mockups ni funciones añadidas. Las capturas fuera
del hero se cargan con `loading="lazy"`; `srcset` y `sizes` ajustan el peso
a cada pantalla. Cada captura enlaza a su versión de 1600 píxeles.

`lumbrera.svg` es el icono original de la aplicación, copiado desde
`datos/iconos/hicolor/scalable/apps/com.verbobiblia.Lumbrera.svg`.

Los instaladores se distribuyen exclusivamente desde MEGA mediante los dos
links proporcionados por el autor. No se alojan builds locales en el sitio.
La descarga `.deb` corresponde a Linux Mint 22+ y la `.rpm` a openSUSE
Tumbleweed / Leap 16.

Las funciones y requisitos se verificaron contra `importar.py`,
`importar_biblia.py`, `configuracion.py`, `editor.py`, `letras_web.py`,
`panel_biblia.py`, `panel_orden.py`, `proyeccion.py` y
`empaquetar/construir.sh`. El código incluye `importar_biblia.py`.

Paquetes preparados para Linux Mint 22+ y openSUSE Tumbleweed / Leap 16.
No se afirma soporte general de Ubuntu, Debian, Fedora u otros sistemas
solo porque utilicen el mismo formato de paquete.
