# Portal de juegos de Verbo

Todo el portal sale de **una sola fuente**: `juegos/catalogo.json`. Desde ahí `tools/build_juegos.py` genera:

- `/juegos/`: H1, introducción, filtros por categoría, buscador, Destacado, Nuevos y la cuadrícula completa.
- `/juegos/pequenos/`, `/juegos/ninos/`, `/juegos/familia/`, `/juegos/desafio/`: una página indexable por categoría.
- `/juegos/<id>/`: la ficha de cada juego (historia bíblica, cómo se juega, preguntas para conversar, imágenes del
  banco del mismo libro y más juegos), con JSON-LD `VideoGame` y `BreadcrumbList`.
- El bloque de juegos de la portada (`/index.html`, entre `<!-- verbo:portal-juegos -->` y su cierre).
- Las URL nuevas en `sitemap.xml`.

El juego en sí vive en `/juegos/<id>/jugar/`. La ficha queda en `/juegos/<id>/` para que quien tenga guardada la
dirección antigua llegue a una página con el botón «Jugar».

## Agregar un juego nuevo

1. Copia el juego en `juegos/<id>/jugar/` (con su `index.html`). Usa rutas relativas dentro del juego; el botón
   «Más juegos» apunta a `/juegos/`.
2. Pon en `juegos/<id>/`:
   - `portada.webp` y `portada-en.webp` (1280×720),
   - `og.jpg` (1200×630; se puede generar desde la portada, ver más abajo),
   - `ficha.json` con los textos de la página (mismo formato que los demás: `historia`, `cita`, `como`, `preguntas`,
     en `es` y `en`). La historia bíblica tiene de 150 a 300 palabras, con su cita; tono pastoral y fiel al pasaje.
3. Suma su entrada a `juegos` en `catalogo.json`:

```json
{
 "id": "mi-juego",
 "titulo": {"es": "…", "en": "…"},
 "descripcion": {"es": "Una línea para la tarjeta.", "en": "…"},
 "meta_descripcion": {"es": "Descripción larga para buscadores y la ficha.", "en": "…"},
 "categoria": "pequenos | ninos | familia | desafio",
 "infantil": true,
 "genero": "una clave de «generos»",
 "pasaje": "Hechos",
 "duracion_min": 10,
 "movil": true,
 "idiomas": ["es", "en"],
 "portada": "/juegos/mi-juego/portada.webp",
 "portada_en": "/juegos/mi-juego/portada-en.webp",
 "og_image": "/juegos/mi-juego/og.jpg",
 "url_juego": "/juegos/mi-juego/jugar/",
 "android": null,
 "publicado": "AAAA-MM-DD",
 "destacado": false,
 "orden_mas_jugados": 9
}
```

4. Compila y revisa:

```sh
python3 tools/build_juegos.py
python3 tools/pie_comun.py
```

El script valida que existan la portada, la imagen `og`, la carpeta `jugar/` y que la categoría y el género sean
conocidos. Si falta `ficha.json`, avisa y la página sale sin los bloques de texto.

Para crear `og.jpg` desde la portada:

```sh
python3 -c "from PIL import Image,ImageOps;ImageOps.fit(Image.open('juegos/mi-juego/portada.webp').convert('RGB'),(1200,630),Image.LANCZOS).save('juegos/mi-juego/og.jpg',quality=86)"
```

## Campos que conviene conocer

- `pasaje`: libro de la Biblia (o lista de libros) del juego. Se usa para «Imágenes de esta historia» en la ficha y
  para «Juega esta historia» en las páginas del banco de imágenes. `null` si el juego no sigue un libro concreto.
- `destacado`: el primer juego con `true` aparece grande en la portada y en `/juegos/`.
- `publicado`: la insignia «Nuevo» se muestra 21 días desde esa fecha. La calcula el navegador (`assets/portal/portal.js`),
  así que desaparece sola aunque no se vuelva a compilar.
- `orden_mas_jugados`: orden manual de «Más jugados» (1 = primero). Punto preparado para conectar estadísticas
  reales más adelante: `window.VerboPortal.masJugados` en `assets/portal/portal.js`.
- `infantil`: marca la ficha como contenido dirigido a niños (ver «Anuncios y contenido infantil»).

## Diseño

Colores, tipografías y componentes en `assets/portal/portal.css` (tokens `--v-*` y `--cat-*`). Todo el texto va en
HTML real en español; el inglés viaja en `data-en` y lo cambia `assets/secciones/secciones.js` con el selector ES/EN.

## Anuncios y contenido infantil

Las páginas de juegos con `"infantil": true` (y las categorías Pequeños y Niños) llevan
`<meta name="verbo-publico" content="infantil">` y `data-publico="infantil"` en `<body>`.

Según la documentación vigente de AdSense (Google retiró en 2026 las etiquetas antiguas TFCD/TFUA y las reemplazó por
TFAT, «tag for age treatment»), cada bloque de anuncio de esas páginas debe llevar:

```html
<ins class="adsbygoogle" … data-tag-for-age-treatment="1"></ins>
```

Fuentes: https://support.google.com/adsense/answer/3248194 y https://support.google.com/adsense/answer/9007197.
La documentación no dice cómo aplicarlo a los anuncios automáticos (Auto ads); por eso los anuncios de estas páginas
deben ser bloques manuales con ese atributo. La API de anuncios de juegos (Ad Placement API) no documenta una opción
equivalente; ver la sección del módulo de anuncios.
