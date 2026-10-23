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

## Módulo de anuncios de los juegos (preparado y apagado)

`/juegos/comun/anuncios.js` envuelve la Ad Placement API de Google (H5 Games Ads) en una API propia:

| Llamada | Qué hace |
|---|---|
| `VerboAds.init({ juego: 'mi-juego' })` | Una vez al cargar. Lee `infantil` del catálogo (o se pasa `{ infantil: true }`). |
| `VerboAds.pausa(nombre, tipo)` | Pausa natural. Devuelve una promesa: el juego sigue cuando se cumple. `tipo`: `'next'` (entre niveles, por defecto), `'pause'`, `'start'` o `'browse'` (menús). |
| `VerboAds.recompensa(nombre, alObtener, alCancelar)` | Anuncio opcional que el jugador eligió (pista, vida extra). |
| `VerboAds.recompensaDisponible()` | Si es `false`, no muestres el botón de la recompensa. |
| `VerboAds.sonido(activo)` | Avisa a Google si el juego tiene sonido. |

Durante un anuncio se disparan `verboads:inicio` y `verboads:fin` en `window`: el juego pausa y silencia su música
(los módulos `comun/musica.js` de los juegos ya lo hacen).

### Integrarlo en un juego nuevo

1. En el `index.html` del juego, antes de su script principal:
   ```html
   <script src="/juegos/comun/anuncios.js?v=20261023"></script><script>VerboAds.init({juego:'mi-juego'});</script>
   ```
2. Llama a `VerboAds.pausa(...)` **solo en pausas naturales**: al pasar de nivel, al terminar una partida, al
   reintentar o al volver al menú. Nunca en medio del juego. Ejemplo:
   `btnSiguiente.onclick = () => VerboAds.pausa('mi-juego-siguiente').then(() => empezar(nivel + 1));`
3. Las recompensas siempre son opcionales y las elige el jugador con un toque explícito (en Rumbo al arca: sin pistas,
   un aviso explica que tocar 💡 otra vez muestra un anuncio a cambio de una pista).
4. Escucha `verboads:inicio`/`verboads:fin` si el juego tiene audio propio.

Dónde está integrado hoy: Camino al Cielo (siguiente nivel, intenta de nuevo), La Senda (otra ronda y volver al
inicio, desde `juegos/la-senda/anuncios-web.js` para no tocar el código compartido con la app Android), Tierra
Prometida (fin de partida), Bajo la arena (al cerrar un caso resuelto), Pares de la arena y Rumbo al arca (siguiente
nivel, repetir, volver a los niveles; Rumbo al arca además ofrece la pista extra), El mensajero (siguiente misión,
repetir, salir al menú) y Héroes de la fe (al volver al menú).

### Activarlo

Cuando Google apruebe H5 Games Ads para `ca-pub-4810728953852074`:

1. En `/juegos/comun/anuncios.js` cambia `VERBO_H5_ACTIVO = false` por `true`. Es el único cambio necesario.
2. Para probar antes con anuncios de prueba, pon también `VERBO_H5_PRUEBA = true` (agrega `data-adbreak-test="on"`)
   y vuelve a `false` antes de publicar.
3. Sube el `?v=` del script en los juegos si quieres forzar que los navegadores lo recarguen.

Reglas que el módulo ya respeta: no carga nada dentro de la app Android (iframe `verboEmbedApp`), y **no muestra
anuncios en los juegos infantiles** mientras `VERBO_H5_INFANTIL = false`, porque la Ad Placement API no documenta
cómo marcar contenido dirigido a niños (AdSense usa hoy `data-tag-for-age-treatment="1"` solo en bloques `<ins>`).
