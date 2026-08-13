# Plan: Sermones Históricos

Estado: **decisiones confirmadas, ejecución no arrancada.** Este documento es
la hoja de ruta para cuando Juan dé la orden de arrancar. No se ha creado
ningún archivo de contenido todavía.

## 0. Decisiones confirmadas (2026-08-13)

1. **Estructura de menú (§3)**: dos secciones separadas. "Sermones
   Históricos" solo para lo que es sermón propiamente dicho (Spurgeon,
   Wesley, Whitefield, Moody, Edwards, Ryle). Murray, Bounds, Simeon,
   Finney y cualquier otro que no sea sermón dominical van a su propio
   lugar (a definir cómo se llama esa sección — ver §3 actualizado).
2. **Traducción (§4)**: Opción A — Worker en vivo (Claude Haiku) + caché
   KV, el patrón ya en producción para Newton/Rutherford. No hace falta
   tocar el system prompt del Worker.
3. **Orden de ejecución por autor**: del que tiene menos sermones en su
   selección inicial al que tiene más (no Edwards primero por estar
   pre-curado, como se sugería originalmente en §8). Orden tentativo según
   los conteos de la tabla de §2 (**sin verificar contra la fuente real
   todavía** — Whitefield y Moody empatados en 3–4, hay que confirmar
   cifra exacta antes de fijar cuál va primero):
   Whitefield/Moody (3–4) → Ryle/Wesley/Spurgeon (4–5) → Edwards (7, ya
   preseleccionados).
4. **Diseño visual de la portada de pieza** (§5/§6): tercer código visual,
   distinto de `.book-cover` (Biblioteca, libro de piel) y `.article-cover`
   (Devocionales/Artículos, cartita de papel con esquina doblada) —
   **pergamino con sello de cera**:
   - Papel cálido/sepia (vitela envejecida), borde superior irregular tipo
     deckle (papel cortado a mano) en vez de dog-ear.
   - Sello de cera circular (borgoña o dorado apagado) en la esquina
     superior en vez de icono de libro/pluma.
   - Kicker en versalitas espaciadas estilo letterpress ("SERMÓN · 1858").
   - Regla ornamental bajo el título (no la rayita simple de artículos) —
     evoca los panfletos de sermón que efectivamente se vendían impresos
     cada semana (Spurgeon, Whitefield), fiel al objeto histórico real.
   - Implementación: nueva clase `.sermon-cover` en `recursos.css` (o
     archivo propio si la sección tiene su propio stylesheet), no reusar
     `.article-cover` ni `.book-cover` tal cual.

## 1. Objetivo

Nueva sección "Sermones Históricos" con acceso directo desde la portada
(misma lógica que hoy tienen Devocionales y Artículos y Reflexiones: tarjeta
en `index.html`, página propia, filtros temáticos, sin depender de un click
extra a través de Recursos).

Arranca con una **selección curada** por autor, no con corpus completos de
una sola vez (Spurgeon por sí solo tiene 3.563 sermones — eso es un proyecto
de meses, no un primer commit).

## 2. Autores investigados y prioridad

Todos dominio público (pre-1929 o explícitamente marcados `NOT_IN_COPYRIGHT`/
Gutenberg). **Los enlaces y IDs de Gutenberg/Internet Archive listados abajo
vienen de la investigación previa de Juan — hay que reverificar cada uno al
momento de ejecutar** (URLs cambian, ediciones se reemplazan; no asumir que
siguen vigentes sin comprobarlo).

| Autor | Años | Rating | Fuente principal | Selección inicial sugerida |
|---|---|---|---|---|
| Charles H. Spurgeon | 1834–1892 | ⭐⭐⭐⭐⭐ | Internet Archive (63 vols., New Park Street Pulpit → Metropolitan Tabernacle Pulpit) | 4–5 sermones representativos, no los 3.563 |
| John Wesley | 1703–1791 | ⭐⭐⭐⭐⭐ | Gutenberg, *The Works of the Rev. John Wesley* (32 vols.) | 4–5 sermones doctrinales (gracia, nuevo nacimiento, justificación, santificación) |
| George Whitefield | 1714–1770 | ⭐⭐⭐⭐⭐ | Gutenberg (6 vols. obras) + Internet Archive (*Twenty-three Sermons*, 1745; *Fifteen Sermons*, 1785) | 3–4 sermones evangelísticos |
| D. L. Moody | 1837–1899 | ⭐⭐⭐⭐⭐ | Gutenberg (16 obras) + Internet Archive (*Twelve Select Sermons*, 1884; *The Gospel Awakening*) | 3–4 sermones/discursos de campaña |
| Jonathan Edwards | 1703–1758 | ⭐⭐⭐⭐⭐ | *Selected Sermons of Jonathan Edwards* (7 sermones completos, dominio público) + Internet Archive (obras mayores) | Los 7 de la colección seleccionada ya es un buen punto de partida |
| J. C. Ryle | 1816–1900 | ⭐⭐⭐⭐⭐ | Internet Archive, *The Christian Race and Other Sermons* (1900, `NOT_IN_COPYRIGHT`) + *Living or Dead?*, *The Cross*, *Practical Religion* | 4–5 sermones, tono bíblico/pastoral directo |
| Charles G. Finney | 1792–1875 | ⭐⭐⭐⭐ | *Lectures on Revivals of Religion* (transcritos por el editor de *The Evangelist*, corregidos por Finney) | 3 lecciones sobre oración/avivamiento/arrepentimiento |
| Alexander Maclaren | 1826–1910 | ⭐⭐⭐⭐⭐ | Gutenberg, *Expositions of Holy Scripture* (por libro bíblico) + *The Secret of Power and Other Sermons* (1882) + *The Holy of Holies* (Juan 14–16) | Empezar con un libro bíblico corto (ideal: se puede enlazar directo al pasaje) |
| Charles Simeon | 1759–1836 | ⭐⭐⭐⭐⭐ | *Horae Homileticae* (21 vols., recorre todo el canon) | Son bosquejos/esqueletos de sermón, no transcripciones completas — **candidato a subcategoría propia** ("Bosquejos históricos") en vez de mezclarse como sermón completo |
| Andrew Murray | 1828–1917 | ⭐⭐⭐⭐ | Gutenberg (*Absolute Surrender*, *The Master's Indwelling*, *Lord, Teach Us to Pray*, *The Ministry of Intercession*, *Jesus Himself*, etc.) | Mayormente discursos de conferencia, no sermones dominicales — ver §4 |
| E. M. Bounds | 1835–1913 | ⭐⭐⭐⭐ | Obras sobre oración (*Power Through Prayer*, *Purpose in Prayer*, *The Reality of Prayer*, *Essentials of Prayer*, *Prayer and Praying Men*) | No es sermón técnicamente — ver §4 |
| A. B. Simpson | 1843–1919 | ⭐⭐⭐⭐ | Gutenberg (*Days of Heaven Upon Earth* y otras) | Revisar obra por obra para separar sermón de devocional antes de incluir |

## 3. Qué es "sermón" y qué no — dónde va cada cosa

Juan fue explícito: lo que no aplica a "predica" (sermón propiamente dicho)
no debe etiquetarse como tal. Tres casos reales en esta lista:

- **Murray y Bounds**: mayormente discursos de conferencia / tratados sobre
  oración, no sermones dominicales.
- **Simeon**: son bosquejos homiléticos (esqueletos), no transcripciones
  completas de sermón predicado.

**Recomendación**: una sola sección "Sermones Históricos" en el menú, con un
filtro por `subtipo` igual al patrón que ya usamos hoy en Devocionales
(`subtipo`: sermón / discurso / bosquejo — análogo a como Artículos ya
distingue artículo/reflexión/devocional). Evita fragmentar el menú principal
en 4-5 secciones nuevas por matices editoriales. **Alternativa** si Juan
prefiere separación más dura: "Sermones Históricos" (Spurgeon, Wesley,
Whitefield, Moody, Edwards, Ryle) vs. "Discursos y Enseñanzas Históricas"
(Murray, Bounds, Finney) como dos tarjetas distintas — más claro para el
usuario, más trabajo de mantenimiento. **Pendiente de decisión antes de
ejecutar.**

## 4. Patrón técnico — decisión pendiente

Ya existen **dos** patrones distintos en el proyecto para contenido
histórico en inglés traducido al español. Hay que elegir cuál usar aquí
(o si conviene mezclar según el autor):

### Opción A — Página estática + traductor en vivo (patrón Newton/Rutherford)
`tools/build_historical_articles.py` → `recursos/data/historical-articles.json`
→ páginas en `recursos/articulos-y-reflexiones/<slug>/`. El texto fuente
(inglés) se guarda tal cual; el español se genera en el momento vía el
Worker de Verbo (Claude Haiku) + caché en KV (`biblia/assets/site-translate.js`
+ `content-translate.js`), **igual que le pasa a "Verbo" como nombre de
autor esta misma semana** (ver conversación del worker de traducción, commit
`69ae763`) — cuidado con textos ambiguos que disparen preámbulo conversacional.
- Bueno para: decenas de piezas.
- Costo: llamada a Anthropic por pieza+idioma la primera vez que alguien la
  lee (luego cae de caché KV compartido entre todos los visitantes).
- Riesgo a escala de miles: factura de API alta si se traduce todo de golpe
  en vez de bajo demanda, y closeness Comentarios Verbo mostró que el
  traductor puede "romper personaje" con textos raros — a mayor volumen,
  mayor probabilidad de toparse con un caso así sin que nadie lo note hasta
  que un lector lo reporta.

### Opción B — Pipeline offline tipo NPNF (patrón Historia de la Iglesia)
Ver memoria `project_church_history_npnf_pipeline`: un script
`tools/build_<autor>.py` por autor que descarga el texto fuente, protege
referencias bíblicas (`__BIBREF_n__`), traduce EN→ES con la API no oficial
de Google Translate (`translate.googleapis.com/translate_a/single`), y
genera `entries.json` + páginas ya traducidas, versionadas en el repo.
- Bueno para: cientos/miles de piezas (que es literalmente el caso de
  Spurgeon si algún día se sube el corpus completo).
- Costo: gratis (Google Translate no oficial), una sola vez en build-time,
  no repetido por visitante.
- Calidad: Google Translate es más tosco que Claude para matices
  teológicos — aceptable para NPNF (textos ya densos/técnicos donde el
  usuario espera un tono "traducción académica"), a revisar si es
  suficientemente bueno para sermones pensados para leerse como
  predicación viva.

**Recomendación por defecto**: Opción A para la selección inicial curada
(pocas decenas de piezas, calidad de traducción más natural para textos
pensados para "sentirse predicados"); si más adelante se decide subir
corpus grandes completos (ej. los 3.563 de Spurgeon), migrar esas piezas
masivas a Opción B para no disparar costo de API. **Confirmar con Juan
antes de escribir el primer script.**

## 5. Esquema de datos (reusar, extender solo si hace falta)

Basado en `recursos/data/historical-articles.json` (ya probado en
producción con Newton/Rutherford):

```json
{
  "id": "spurgeon-sermon-xxx-slug",
  "author": "Charles H. Spurgeon",
  "title_es": "...",
  "title_en": "...",
  "subtitle_es": "...",
  "topics": ["gracia", "predicacion"],
  "category": "sermon",
  "subtype": "sermon",
  "year_label": "1858",
  "document_type": "Sermón",
  "publication": "New Park Street Pulpit, vol. IV",
  "source_url": "https://archive.org/details/...",
  "source_label": "Internet Archive",
  "rights": "Public domain",
  "paragraphs": ["...", "..."]
}
```

Cambios necesarios sobre el esquema actual:
- Nuevo valor de `category`: `"sermon"` (hoy solo existe `"devocional"` en
  este archivo; `"estudio"` vive en el `recursos.json` general). Confirmar
  que `filters.js` y `recursos.css` no asumen una lista cerrada de
  categorías en algún lado antes de agregar una nueva.
- Nuevo(s) `subtype`: `"sermon"`, y `"discurso"` y/o `"bosquejo"` según lo
  que se decida en §3.
- Temas nuevos probables en `biblia/assets/i18n/{es,en}.json` → `temas`:
  falta `sigloXVIII` (ya existen sigloI/II/XVII/XIX, falta el siglo de
  Wesley/Whitefield/Edwards), y posiblemente `avivamiento`/`revival`,
  `justificacion`, `nuevoNacimiento` — revisar contra los temas reales de
  la selección final antes de inventar etiquetas de más.

## 6. Dónde vive y cómo se llega

- Tarjeta nueva en `index.html` (portada), mismo patrón que Artículos y
  Devocionales de esta semana: ícono propio (sugerido: un púlpito o libro
  abierto con cruz — definir al ejecutar), `data-i18n="portal.cardSermonesTitle"`.
- Página física: `recursos/sermones-historicos/` (sigue viviendo bajo
  `recursos/` por consistencia con Devocionales/Artículos, aunque su acceso
  principal sea desde la portada — mismo criterio ya aplicado esta semana).
- Agregar como 7º ítem a la barra `quick-nav` (293 páginas la usan hoy) —
  reusar el script `fix_quicknav.py`-style generalizado a un ítem más en
  vez de escribirlo desde cero.
- `site.backToVerbo` como back-link de la página índice (no "← Recursos" —
  mismo bug que se corrigió hoy para Artículos/Devocionales, no repetirlo).
- Meta description, `<title>`, sitemap.xml: una entrada por página índice
  nueva; las piezas individuales entran también si se sigue el patrón NPNF/
  Newton (que sí generan sitemap por script).

## 7. Traducción — reafirmando la regla existente

Memoria `feedback_neutrality_scope`: la neutralidad doctrinal de Verbo
**nunca** aplica a fuentes históricas — el traductor debe preservar
exactamente la posición teológica de cada predicador (calvinismo de
Spurgeon/Edwards, arminianismo de Wesley, etc.) tal cual, sin suavizar ni
armonizar. El system prompt del Worker (`cloudflare/api-bible-worker/worker.js`)
ya tiene esta instrucción explícita ("AUTHORIAL AND DOCTRINAL FIDELITY") —
aplica igual aquí, no hace falta tocarlo, solo confirmarlo si se usa Opción A.

## 8. Orden de ejecución sugerido (cuando Juan confirme arrancar)

1. Confirmar con Juan: decisión de §3 (una sección con subtipos vs. dos
   secciones) y de §4 (Opción A vs. B, o A-para-empezar).
2. Elegir el primer autor piloto (sugerido: **Jonathan Edwards** — la
   colección de 7 sermones ya viene pre-seleccionada y acotada, sirve de
   plantilla antes de decidir la selección de los demás autores que
   requieren curar de corpus mucho más grandes).
3. Verificar la fuente real (Gutenberg ebook ID o Internet Archive
   identifier) del autor piloto — no asumir los datos de este documento
   sin comprobarlos contra la fuente viva.
4. Escribir/adaptar el script de extracción (Opción A: extender
   `build_historical_articles.py`; Opción B: nuevo `tools/build_sermones_<autor>.py`
   calcado de un `build_npnf*.py` existente).
5. Generar las páginas del piloto, revisar en servidor local (igual que
   todo lo de esta semana: nada se sube sin probarlo primero).
6. Ajustar portada, quick-nav, recursos.json/historical-articles.json,
   sitemap, claves i18n.
7. Confirmar con Juan el resultado del piloto antes de replicar el patrón
   a los otros 11 autores.
8. Repetir por autor, en el orden de prioridad de la tabla de §2, revisando
   cada selección con Juan antes de publicarla (no generar de más sin
   aprobación, dado el volumen potencial).

## 9. Riesgos / cosas a no asumir

- Los IDs/URLs de Gutenberg e Internet Archive de este documento vienen de
  investigación previa, no verificada línea por línea en esta sesión —
  revalidar cada uno antes de escribir un script contra ellos.
- Simeon, Murray y Bounds no son "sermón" en sentido estricto — no forzar
  la etiqueta solo por conveniencia de menú (ver §3).
- A escala de miles de piezas (Spurgeon completo), el costo del traductor
  en vivo (Opción A) puede ser real — no asumir que "ya funciona para 10"
  significa que funciona igual de barato para 3.563.
- Confirmar que agregar `"category": "sermon"` no rompe supuestos
  hardcodeados en `recursos/assets/filters.js` / `recursos.css` que asuman
  solo `devocional`/`estudio` — revisión rápida ya hecha: `filters.js` es
  genérico (filtra por atributos `data-*`, no por lista cerrada de
  valores), así que agregar una categoría nueva debería ser seguro; falta
  confirmar `recursos.css` no tenga selectores tipo `[data-categoria="devocional"]`
  que solo cubran los dos valores actuales.
