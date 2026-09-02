# Historia · Verbo — Compendio histórico y arqueológico del Antiguo Testamento

**Estado:** metodología aprobada; primera integración (Sayce) completada el 2026-09-02

**Fecha de verificación:** 2026-08-31

**Alcance:** auditoría, fuentes, derechos, arquitectura y piloto de Génesis

> La aprobación expresa del 2026-09-02 autorizó únicamente la adaptación de
> *Patriarchal Palestine* descrita en este expediente. Las demás fuentes y toda
> ficha nueva del Asistente conservan puertas editoriales independientes.

## Resumen ejecutivo

Verbo ya tiene una infraestructura estática y reutilizable para documentos históricos: manifiestos, estante, entradas JSON, carga bajo demanda, traducción diferida y búsqueda semántica preconstruida. Sin embargo, la relevancia del Asistente es una capa distinta, generada offline por versículo. Registrar una obra histórica no hace que aparezca automáticamente junto a un pasaje.

El compendio no debería ser una sola colección de prosa antigua. Se recomienda separar:

1. **Fuentes históricas:** textos completos de Pinches, Sayce, Smith, etc., preservando autoría y contexto.
2. **Fuentes primarias:** objetos, inscripciones y textos antiguos, con identidad institucional y derechos separados para objeto, transcripción, traducción e imagen.
3. **Historia · Verbo:** síntesis editorial bilingüe y moderna.
4. **Evidencia y afirmaciones:** unidades trazables que indiquen qué se afirma, con qué respaldo y con qué certeza.
5. **Anclajes bíblicos:** relaciones explícitas con libro, capítulo, versículo o rango, sin convertir paralelos en confirmaciones.

La recomendación legal inicial es conservadora: ingerir únicamente ediciones identificadas que sean seguras tanto en Estados Unidos como en Costa Rica. Una declaración de “public domain” de un repositorio estadounidense no resuelve por sí sola Costa Rica, imágenes, traducciones modernas ni reediciones.

## A. Auditoría técnica de Verbo

### A.1 Registro y almacenamiento

No se encontró PostgreSQL, SQLite, D1, KV ni R2 como almacenamiento del contenido histórico público. Los recursos activos son archivos estáticos versionados en Git y servidos por Cloudflare Pages.

| Función | Path |
|---|---|
| Registro fuente de módulos | `biblia/modules/registry.json` |
| Catálogo embebido generado | clave `catalog` del mismo `registry.json` |
| Obras de Historia | `biblia/modules/church-history/<id>/` |
| Estante de Historia | `biblia/modules/church-history/shelf.json` |
| Entradas de cada obra | `biblia/modules/church-history/<id>/entries.json` |
| Cargador | `biblia/assets/module-loader.js` (`loadChurchHistory`, `loadChurchHistoryShelf`) |
| UI del panel | `biblia/assets/app.js` (`renderChurchHistoryPanel` y auxiliares) |
| Índice semántico histórico | `biblia/modules/semantic-search/church-history/` |
| Constructor del índice | `tools/semantic-search/build-church-history-index.mjs` |
| Paquetes del Asistente | `biblia/modules/study-assistant/chapters/<BOOK>/<CHAPTER>.json` |
| Ensamblador del Asistente | `tools/asistente-estudio/ensamblador.py` |
| Constructor de paquetes | `tools/asistente-estudio/build_paquetes_asistente.py` |
| Catálogo de traducción | `cloudflare/api-bible-worker/study-assistant-catalog.json` |
| Constructor del catálogo | `tools/asistente-estudio/build_catalogo_traducciones.py` |
| Catálogo general | `tools/build_registry_catalog.py` |

El Worker se usa para traducción diferida y servicios API; no es la fuente canónica del contenido histórico. No se justifica R2 para el piloto textual. R2 solo debe reconsiderarse si futuros facsímiles o mapas autorizados hacen inadecuado el repositorio Git.

### A.2 Modelo actual de Historia

Un manifiesto histórico declara, entre otros campos, `id`, `type`, `name`, `abbreviation`, `language`, `entriesFile`, autoría, fuente, licencia y estado. `loadChurchHistory()` lee todas las rutas de `registry.churchHistory`, carga sus manifiestos y concatena sus entradas.

Las entradas actuales son heterogéneas, pero Eusebio utiliza un ID estable y campos como `title`, `personas`, `eventos`, `periodo`, `epoca`, fechas, `excerpt` y `content`. El cargador agrega `sourceId`, etiquetas, idioma y temas.

`shelf.json` es deliberadamente independiente: controla portada, título, período y descripción del estante, pero no participa en el índice ni en la búsqueda.

### A.3 Búsqueda histórica

Existen dos capas:

- Clasificación temática local mediante `CHURCH_HISTORY_TOPIC_RULES` en `module-loader.js`. Si una entrada trae `temas`, estos tienen precedencia; en caso contrario se infieren por palabras.
- Búsqueda semántica mediante un índice cuantizado `Int8Array` y metadatos estáticos. Se carga bajo demanda. El modelo se ejecuta en el navegador y el resultado se limita y filtra allí.

Para el compendio se recomienda declarar temas explícitos y no depender de inferencias léxicas en materias históricas delicadas.

### A.4 Relaciones con pasajes

Historia de la Iglesia no alimenta directamente los indicadores por versículo. El Asistente usa otro modelo:

```text
pasaje seleccionado
→ versículos del rango
→ paquete estático BOOK/CHAPTER.json
→ IDs asociados a cada versículo
→ unión y deduplicación
→ Historia/Costumbres/Términos
```

El paquete contiene `resources` y `verses`. Por ello puede representar una perícopa, pero el constructor la materializa como asociaciones por versículo.

Eusebio entra al Asistente mediante `cruce_historia_eusebio.py`: cruza ventanas cronológicas del libro/pasaje con entradas previamente curadas. El contexto de libro usa `book-classification-ot.json` y `book-classification-nt.json`; los concilios usan mapeos explícitos. Esta combinación produce relevancia de distinta precisión y no debe copiarse ciegamente para el AT.

### A.5 Costumbres y Padres como precedentes

- Freeman: `entries.json` contiene `libro`, `capitulo`, `versiculoInicio` y `versiculoFin`; el Asistente usa solapamiento explícito. Es el precedente más preciso.
- Tucker: se activa por ventana histórica y presenta capítulos curados como `alta`; es contexto amplio, no evidencia específica del verso.
- Padres: documentos completos en `biblia/modules/patristic/`; fragmentos por versículo separados en `registry.patristicByVerse`; una selección adicional de prácticas cristianas aparece en Costumbres por período.

El futuro compendio debe preferir anclajes editoriales explícitos tipo Freeman. Las fechas pueden ayudar a descubrir candidatos, pero no deben publicar automáticamente una relación.

### A.6 Bilingüismo y atribución

Los manifiestos declaran `language`. El frontend traduce bajo demanda títulos y cuerpos y conserva el original como fallback. El Asistente agrega a cada recurso `resourceId`, `sourceLanguage` y `sourceHash`; el Worker solo acepta identidades registradas en su catálogo.

La atribución actual vive principalmente en manifiestos y entradas. Para Historia · Verbo no basta: cada afirmación editorial debe tener citas estructuradas y ubicación concreta en la fuente.

### A.7 Infraestructura reutilizable y límites

Reutilizable sin cambiar mecánicas:

- manifiesto + `entries.json` + `shelf.json`;
- carga bajo demanda;
- navegación por ID estable;
- traducción diferida;
- catálogo generado;
- índice semántico offline;
- paquetes estáticos del Asistente.

No reutilizar sin rediseño aprobado:

- cruce cronológico amplio de Eusebio para todo el AT;
- listas hardcodeadas de fuentes e idiomas del Asistente;
- navegación del Asistente histórico, actualmente especial para Eusebio;
- carga conjunta de todo Historia si el corpus crece mucho;
- reglas temáticas por simples palabras como clasificación editorial final.

## B. Inventario inicial de obras

Las cifras de páginas varían por edición y digitalización. “PD” significa evaluación preliminar, no sustitución de un expediente por edición.

| Obra | Autor (vida) | Edición candidata | Vol./págs. aprox. | Repositorio/formato | OCR | EE. UU. | Costa Rica | Utilidad | Prioridad |
|---|---|---:|---:|---|---|---|---|---|---|
| *The Old Testament in the Light…* | T. G. Pinches (1856–1934) | 1902, SPCK | 1 / 512 | Google Books; IA `oldtestamentinli00pincuoft`; PDF/OCR | Sí, requiere limpieza | PD | PD preliminar | Mesopotamia, patriarcas, Asiria/Babilonia | Alta |
| misma, 2.ª revisada | Pinches | 1903 | 1 / 583 en una copia | Google Books/IA | Sí | PD | PD preliminar | Preferible si se verifica integridad | Alta |
| *The Bible and Archaeology* | F. G. Kenyon (1863–1952) | 1940, Harrap | 1 / 310 | copia web PDF | Sí/posible | **No resuelto; 1940 no entra por regla de 1930** | plazo vital vencido | Panorama arqueológico | Bloqueada |
| *Patriarchal Palestine* | A. H. Sayce (1845–1933) | 1895 | 1 / ~240 | Gutenberg 14405, HTML/TXT/EPUB | Excelente | PD | PD preliminar | Génesis patriarcal | Alta |
| *Fresh Light from the Ancient Monuments* | Sayce | ediciones s. XIX | 1 / variable | IA/Google Books, escaneo/OCR | Variable | PD | PD preliminar | Inscripciones y monumentos | Alta |
| *Early Israel and the Surrounding Nations* | Sayce | 1899 | 1 | Gutenberg, texto | Buena | PD | PD preliminar | Israel y vecinos | Media-alta |
| *The Historical Geography of the Holy Land* | G. A. Smith (1856–1942) | 1894/edición identificada | 1 / ~700 | IA/Google/posibles copias institucionales | Sí | PD | PD preliminar | Geografía, rutas y regiones | Alta |
| *Atlas of the Historical Geography…* | G. A. Smith / J. G. Bartholomew (1860–1920) | 1915 | 57 mapas en 60 hojas | Columbia; Google Books | Texto parcial | PD textual preliminar | PD preliminar | Atlas y geografía histórica | Alta, imágenes separadas |
| *Old Testament History* | H. P. Smith (1847–1927) | 1903, Scribner | 1 / xxv+512 | Library of Congress, PDF/OCR/IIIF | Sí | PD; LOC permite reutilizar | PD preliminar | Narrativa crítica general | Alta |
| *A Class-Book of Old Testament History* | G. F. Maclear (1833–1902) | 1894 (1.ª 1865) | 1 | Gutenberg 63528, HTML/TXT/EPUB | Excelente | PD | PD preliminar | Cobertura narrativa completa | Media |
| *Bible History: Old Testament* | Alfred Edersheim (1825–1889) | 1876–1887 | 7 partes/volúmenes editoriales | CCEL/IA, HTML/PDF | Sí | PD | PD | Narrativa y contexto judío antiguo | Media-alta |
| *International Standard Bible Encyclopaedia* | ed. James Orr (1844–1913) | 1915 | 5 vol. | IA `cu31924008045423`, PDF/TXT/EPUB | Sí, desigual | PD | obra colectiva >70 años | Entidades y artículos | Alta |
| *A Dictionary of the Bible* | ed. James Hastings (1852–1922) | 1898–1904 | 5 vol., ~900 p. c/u | HathiTrust/IA/CCEL | OCR parcial | PD | obra colectiva >70 años | Artículos firmados y entidades | Alta |
| *A Dictionary of the Bible* | William Smith (1813–1893), ed. Peloubet | 1884 identificada | 1 / 818 | Library of Congress, PDF/OCR/IIIF | Sí | PD; LOC permite reutilizar | PD | Entidades, geografía, antigüedades | Alta |

Evidencia bibliográfica principal:

- Pinches: <https://books.google.com/books?id=9f02AAAAMAAJ>
- Maclear: <https://www.gutenberg.org/ebooks/63528>
- Sayce: <https://www.gutenberg.org/ebooks/14405>
- H. P. Smith: <https://www.loc.gov/item/03023384/>
- Atlas: <https://www.columbia.edu/cu/lweb/digital/collections/cul/texts/ldpd_7032971_000/>
- ISBE 1915: <https://archive.org/details/cu31924008045423>
- William Smith: <https://www.loc.gov/item/37018197/>

### Decisión sobre Kenyon

`LEGAL_REVIEW_REQUIRED`. No ingerir. La publicación de 1940 es posterior al corte estadounidense general de 1930 vigente en 2026. Deben investigarse registro/renovación, país de origen y restauración antes de cualquier reutilización integral. Que una web afirme “public domain” no es evidencia jurídica suficiente.

## C. Recursos adicionales candidatos

| Obra/colección | Uso potencial | Estado inicial |
|---|---|---|
| Sayce, *Early Israel and the Surrounding Nations* | pueblos, reinos y entorno | Gutenberg; candidato PD |
| Charles Foster Kent, *Biblical Geography and History* | geografía histórica | Gutenberg; verificar edición |
| Carl Niebuhr, *The Tell El Amarna Period* | Amarna y Levante | Gutenberg; verificar traducción/edición |
| R. W. Rogers, *Cuneiform Parallels to the Old Testament* | corpus comparativo | candidato PD; OCR a evaluar |
| George Rawlinson, *The Seven Great Monarchies* | imperios antiguos | candidato PD; muy obsoleto, solo fuente histórica |
| E. A. Wallis Budge, obras de Babilonia/Asiria | traducciones e historia temprana | candidato PD; contraste moderno obligatorio |
| W. F. Albright, obras anteriores a 1931 | arqueología histórica | solo edición por edición; varias tesis superadas |
| *Encyclopaedia Biblica* (Cheyne/Black) | artículos críticos y entidades | 4 vol.; candidato PD |
| Palestine Exploration Fund, números antiguos | topografía e informes de campo | derechos por número/imagen; investigar |
| Survey of Western Palestine | mapas y nombres geográficos | complejo: mapas/imágenes y ediciones por separado |

No se recomienda convertir automáticamente ninguna de estas obras en voz editorial de Verbo.

## D. Inventario inicial de fuentes primarias

| Fuente/objeto | Institución o corpus | ID/fecha aproximada | Relevancia | Reutilización inicial |
|---|---|---|---|---|
| Gilgamesh XI, “Flood Tablet” | British Museum | K.3375; s. VII a.C. | paralelo literario del diluvio | datos citables; imagen BM requiere licencia según uso; traducción moderna separada |
| Atrahasis | BM/CDLI y otros fragmentos | múltiples testigos, II milenio a.C. | creación humana/diluvio | inventariar cada testigo; traducción crítica protegida |
| Enūma Eliš | BM/CDLI y otras colecciones | tablillas múltiples | contexto/literatura de creación babilónica | texto antiguo libre; ediciones/traducciones e imágenes separadas |
| Estela de Hammurabi | Louvre | Sb 8; s. XVIII a.C. | contexto jurídico comparativo | verificar datos y política de imagen Louvre |
| Archivos de Mari | Louvre/expediciones | miles de tablillas; s. XVIII a.C. | administración, profecía, nombres, movilidad | no tratar “Mari” como un solo documento |
| Textos de Nuzi | Harvard Semitic Museum/Yale/Oriental Institute y otros | corpus, II milenio a.C. | contexto familiar comparativo | tesis antiguas de “confirmación patriarcal” requieren revisión estricta |
| Textos de Ugarit | Louvre/Damasco y proyectos epigráficos | desde s. XIV–XIII a.C. | lengua, religión y literatura levantina | ediciones modernas normalmente protegidas |
| Cartas de Amarna | British Museum, Berlín, Cairo y otros | EA 1–382; s. XIV a.C. | Canaán y diplomacia | inventario por carta e institución |
| Estela de Merneptah | Egyptian Museum, Cairo | JE 31408; ca. 1208 a.C. | mención temprana de Israel | imagen y traducción separadas |
| Estela de Mesa | Louvre | AO 5066; s. IX a.C. | Moab/Israel | verificar imagen Louvre; transcripción crítica separada |
| Inscripción de Siloé | Istanbul Archaeological Museums | inv. por verificar; s. VIII a.C. | túnel de Ezequías/Jerusalén | `UNVERIFIED` hasta confirmar ficha institucional |
| Taylor/Sennacherib Prism | British Museum | BM 91032 / 1855,1003.1; 691 a.C. | campaña de 701 y tributo de Ezequías | ficha institucional citable; imagen comercial requiere licencia |
| Obelisco Negro | British Museum | BM 118885; s. IX a.C. | Jehú y Salmanasar III | verificar ficha y licencia de imagen |
| anales de Tiglat-pileser III | BM y otras colecciones | múltiples | Israel/Judá y expansión asiria | entrada por testigo, no por rey genérico |
| Crónicas Babilónicas | BM | tablillas múltiples | caída de Jerusalén/imperio neobabilónico | inventario por número BM |
| Cilindro de Ciro | British Museum | BM 90920 / 1880,0617.1941; ca. 539 a.C. | política imperial persa como contexto | no llamarlo “primera carta de derechos”; imagen separada |
| Papiros de Elefantina | Berlín/Brooklyn y otros | corpus, s. V a.C. | comunidad judía y templo | derechos por edición, traducción e imagen |
| Rollos del Mar Muerto | Israel Museum/IAA y otras instituciones | múltiples signaturas | historia textual y judaísmo del Segundo Templo | imágenes y ediciones con términos propios; no copiar automáticamente |

Ejemplos institucionales verificados:

- K.3375: <https://www.britishmuseum.org/collection/object/W_K-3375>
- Taylor Prism: <https://www.britishmuseum.org/collection/object/W_1855-1003-1>
- Cyrus Cylinder: <https://www.britishmuseum.org/collection/object/W_1880-0617-1941>
- Condiciones de imágenes BM: <https://www.britishmuseum.org/terms-use/copyright-and-permissions/images-and-photography>

## E. Evaluación legal

### E.1 Regla operativa

Para cada edición se requiere un registro con:

```yaml
title:
author:
author_birth:
author_death:
original_publication_year:
edition_used:
edition_publication_year:
publisher:
source_repository:
source_url:
copyright_status_US:
copyright_status_Costa_Rica:
copyright_status_other_relevant:
evidence_for_status: []
full_text_reuse_allowed:
translation_allowed:
images_allowed:
attribution_required:
notes:
verified_date:
review_status:
```

Estados permitidos: `CLEARED`, `CITATION_ONLY`, `LEGAL_REVIEW_REQUIRED`, `REJECTED`.

### E.2 Costa Rica y Estados Unidos

La Ley costarricense 6683, texto consolidado, establece como regla general vida del autor + 70 años (art. 58), 70 años desde publicación para obras colectivas como diccionarios y enciclopedias (art. 60), cómputo desde el 31 de diciembre (art. 65) y cita limitada por finalidad (art. 70). Fuente: <https://www.wipo.int/wipolex/es/legislation/details/21963> y texto del régimen en <https://www.wipo.int/wipolex/es/legislation/details/11316>.

En Estados Unidos, en 2026 las obras publicadas en 1930 o antes están generalmente libres de restricciones de copyright por expiración. Fuente: U.S. Copyright Office, <https://www.copyright.gov/what-is-copyright/> y Library of Congress, <https://blogs.loc.gov/copyright/2025/12/lifecycle-of-copyright-1930-works-in-the-public-domain/>.

Project Gutenberg verifica EE. UU., no otros países, y no puede conceder permisos sobre una obra de dominio público: <https://www.gutenberg.org/policy/permission>.

### E.3 Separación obligatoria de derechos

Se evaluarán por separado:

- texto original antiguo;
- edición/transcripción moderna;
- traducción;
- notas y aparato crítico;
- OCR del repositorio;
- fotografía o escaneo;
- mapas e ilustraciones;
- metadatos y condiciones del repositorio.

Hasta nueva revisión, no incorporar imágenes del British Museum para un producto público potencialmente comercial: sus términos distinguen uso no comercial y licencia comercial.

## F. Arquitectura propuesta

No reemplazar la arquitectura actual. Añadir, si se aprueba, un módulo autocontenido:

```text
biblia/modules/church-history/verbo-historia-at/
├── manifest.json
├── entries.json                 # lectura editorial, segmentada
├── entities.json                # entidades canónicas
├── claims.json                  # afirmaciones y certeza
├── sources.json                 # expedientes bibliográficos/jurídicos
├── evidence.json                # fuentes primarias y modernas
├── passage-links.json           # anclajes bíblicos explícitos
└── bibliography.json
```

Para escala mayor, dividir por libro sin cambiar el contrato público:

```text
books/GEN/entries.json
books/GEN/passage-links.json
```

No duplicar entidades ni datos objetivos entre idiomas. Mantener cadenas editoriales como objetos localizados:

```json
{"es":"...","en":"..."}
```

El panel Historia leería documentos; el Asistente consumiría una proyección offline de `passage-links.json`. Ninguna de las dos capas debería consultar una base remota en tiempo de lectura.

### F.1 Distribución aprobada por icono principal

La naturaleza de cada obra determina su hogar principal; no se agrupan todas bajo Historia solo porque contengan información histórica.

| Recurso | Icono/sección principal | Criterio |
|---|---|---|
| Pinches, *The Old Testament in the Light…* | `🏛️ Historia` | Arqueología, inscripciones, Asiria, Babilonia y paralelos históricos del AT |
| Sayce, *Patriarchal Palestine* | `🏛️ Historia` | Contexto histórico y arqueológico del período patriarcal |
| Henry Preserved Smith, *Old Testament History* | `🏛️ Historia` | Historia de Israel y reconstrucción histórica del AT |
| Maclear, *A Class-Book of Old Testament History* | `🏛️ Historia` | Historia bíblica organizada cronológicamente |
| ISBE original de 1915 | `📖 Términos` | Enciclopedia alfabética de personas, lugares, objetos, pueblos, conceptos y libros |

Las cuatro obras históricas formarán una colección reconocible dentro del estante existente de Historia:

```text
Historia
├── Pinches
├── Sayce
├── H. P. Smith
└── Maclear
```

Cada resultado conservará autor, obra y ubicación, de modo que el Asistente pueda resumir “Encontré 4 fuentes históricas relacionadas con este pasaje” sin fusionar sus voces. Al abrir Historia, se mostrarán por fuente y cada enlace llevará a la entrada exacta.

ISBE no se duplicará como obra completa en Historia. Su hogar será Términos y se segmentará por artículo. Una síntesis histórica de Verbo podrá citar un artículo de ISBE o enlazarlo como fuente, pero eso no cambia la clasificación principal de la enciclopedia.

H. P. Smith llevará un aviso editorial discreto y persistente en su manifiesto y vista de lectura: es una fuente académica de 1903 que incluye reconstrucciones propias de la crítica histórica de comienzos del siglo XX. Sus hipótesis no deben mostrarse como datos establecidos ni como voz editorial de Verbo. El mismo principio se aplicará a toda fuente antigua, aunque este caso requiere señalización especialmente visible.

### F.2 Requisito doble de integración

Ninguna fuente se considerará preparada hasta completar y validar dos entregables independientes pero enlazados:

#### Entregable 1 — documento completo de lectura

- Ubicación bajo su icono aprobado: Historia o Términos.
- Manifiesto con ID estable, nombre, autor, edición, idioma, procedencia, licencia, estado y aviso editorial cuando corresponda.
- Segmentación respetuosa de la estructura original: partes, capítulos, secciones o artículos.
- Tabla de contenido, búsqueda interna y navegación anterior/siguiente.
- Texto completo cotejado con la edición declarada; correcciones de OCR documentadas, nunca silenciosas.
- Conservación de títulos, notas, números de página y ubicación suficiente para citar el original.
- Atribución y expediente legal accesibles.
- Soporte ES/EN que distinga texto original, traducción de Verbo y traducción automática provisional.
- Rendimiento compatible con carga bajo demanda; no descargar el corpus completo al abrir el panel.
- Enlaces profundos estables capaces de abrir una sección o artículo exacto.

#### Entregable 2 — contenido contextual del Asistente

- Selección editorial de fragmentos o síntesis; nunca volcado automático del documento completo.
- Anclaje explícito a versículo, rango o perícopa.
- `relation_type` obligatorio para distinguir evidencia, contexto, paralelo y tradición.
- Resumen fiel que no atribuya al autor palabras o conclusiones que no sostuvo.
- Identificación visible de fuente, autor y fecha.
- Certeza, naturaleza de la afirmación y estado editorial registrados por separado.
- Trazabilidad desde cada frase factual hasta `claim_id`, `source_id` y `source_location`.
- Enlace de regreso a la entrada exacta del documento de lectura.
- Deduplificación cuando varias fuentes sostienen la misma información, sin ocultar desacuerdos.
- Presentación proporcional: agrupar el conteo por categoría, pero mantener cada fuente separada al expandirlo.
- Traducción controlada mediante ID estable, idioma de origen y hash del texto.
- Exclusión expresa de asociaciones basadas solo en palabras coincidentes, cronología amplia o semejanza superficial.

### F.3 Matriz de preparación por recurso

Cada obra tendrá una matriz antes de cualquier integración:

| Control | Pinches | Sayce | H. P. Smith | Maclear | ISBE 1915 |
|---|---:|---:|---:|---:|---:|
| Edición y derechos verificados | pendiente | pendiente | pendiente | pendiente | pendiente |
| Original preservado con checksum | pendiente | pendiente | pendiente | pendiente | pendiente |
| OCR cotejado y normalizado | pendiente | pendiente | pendiente | pendiente | pendiente |
| Estructura de lectura definida | capítulos | capítulos | capítulos | libros/capítulos | artículos |
| Panel principal | Historia | Historia | Historia | Historia | Términos |
| Aviso editorial diseñado | requerido | requerido | reforzado | requerido | requerido por artículo/autor |
| Anclajes candidatos extraídos | pendiente | pendiente | pendiente | pendiente | pendiente |
| Anclajes revisados humanamente | pendiente | pendiente | pendiente | pendiente | pendiente |
| Síntesis del Asistente revisadas | pendiente | pendiente | pendiente | pendiente | pendiente |
| Enlaces profundos validados | pendiente | pendiente | pendiente | pendiente | pendiente |
| ES/EN revisado | pendiente | pendiente | pendiente | pendiente | pendiente |
| Pruebas y reporte final | pendiente | pendiente | pendiente | pendiente | pendiente |

Los estados permitidos serán `pendiente`, `en revisión`, `aprobado` y `bloqueado`. No se publicará una obra con controles críticos pendientes.

### F.4 Criterios de aceptación de extremo a extremo

Para una muestra aprobada de pasajes se comprobará:

```text
seleccionar pasaje
→ el Asistente cuenta el resultado correcto
→ muestra categoría, relación, fuente y certeza correctas
→ abre el panel correspondiente
→ abre la obra correcta
→ llega a la sección o artículo exacto
→ permite volver sin perder el pasaje seleccionado
```

También se probarán ausencia de resultados, selecciones de varios versículos, rangos de capítulo, cambio ES/EN, texto largo, dispositivo móvil, caché desactualizada y enlaces a fuentes retiradas. La prueba visual no sustituirá validaciones automáticas de IDs, rangos, hashes y referencias.

## G. Modelo editorial

### G.1 Entrada editorial

Campos recomendados:

```yaml
id:
type: book_context | event | place | artifact | ancient_text | custom | historical_question
title: {es, en}
summary: {es, en}
body: {es, en}
relation_type:
passages: []
entity_ids: []
claim_ids: []
source_ids: []
confidence:
review_status:
reviewed_at:
```

### G.2 Relación con la Biblia

Usar el mismo sistema canónico de IDs de Verbo (`GEN`, `EXO`, etc.) y rangos inclusivos:

```json
{
  "book":"GEN",
  "chapterStart":6,
  "verseStart":1,
  "chapterEnd":9,
  "verseEnd":29,
  "relationType":"LITERARY_PARALLEL"
}
```

Tipos definitivos propuestos:

- `DIRECT_EVIDENCE`
- `HISTORICAL_CONTEXT`
- `CULTURAL_PARALLEL`
- `LITERARY_PARALLEL`
- `GEOGRAPHICAL_CONTEXT`
- `ARCHAEOLOGICAL_CONTEXT`
- `TEXTUAL_WITNESS`
- `TRADITION`
- `DEBATED_IDENTIFICATION`

`DIRECT_EVIDENCE` exige vínculo directo e identificable con la persona, lugar, evento o texto bíblico; semejanza cultural no basta.

### G.3 Afirmaciones trazables

```yaml
claim_id:
claim: {es, en}
source_id:
source_location:
source_type: PRIMARY | SECONDARY_HISTORICAL | MODERN_VERIFICATION
confidence:
relation_type:
review_status:
reviewer:
reviewed_at:
```

La IA puede extraer candidatos, nunca actuar como `source_id` ni aprobar una afirmación.

## H. Sistema de certeza

La escala inicial mezcla certeza, tradición y tipo de relación. Se recomienda separarlos.

**Certeza epistémica:**

- `ESTABLISHED`: evidencia directa o consenso excepcionalmente firme.
- `STRONG`: varias líneas independientes y consenso amplio.
- `PROBABLE`: explicación mejor sustentada, con incertidumbre relevante.
- `POSSIBLE`: compatible y defendida, pero insuficiente para preferirla.
- `DISPUTED`: alternativas académicas vivas y significativas.
- `UNKNOWN`: evidencia insuficiente.

**Naturaleza de la afirmación:** `EVIDENCE`, `CONSENSUS`, `RECONSTRUCTION`, `HYPOTHESIS`, `JEWISH_TRADITION`, `CHRISTIAN_TRADITION`, `INTERPRETATION`.

**Estado editorial:** `RESEARCH_REQUIRED`, `DRAFT`, `SOURCE_VERIFIED`, `HISTORICALLY_REVIEWED`, `APPROVED`, `REJECTED`, `UNVERIFIED`.

Esto evita errores como asignar “CONFIRMED” a una tradición o “TRADITION” como si fuera un nivel bajo de probabilidad.

## I. Piloto Génesis 1–50

No se propone una entrada por versículo. El mapa agrupa oportunidades responsables.

| Pasaje | Tema histórico/cultural/geográfico | Fuentes primarias candidatas | Fuentes PD candidatas | Verificación moderna | Relación/certeza esperada |
|---|---|---|---|---|---|
| 1:1–2:3 | tradiciones de creación del ANE | Enūma Eliš, Atrahasis, textos sumerios | Pinches, Sayce | asiriología y estudios literarios | `LITERARY_PARALLEL`; `STRONG` para existencia, no dependencia |
| 2:4–3:24 | jardín, ríos, humanidad y mortalidad | Gilgamesh, Adapa, iconografía | Pinches/Sayce | filología y geografía; identidades debatidas | paralelo/contexto; `DISPUTED` |
| 4:1–26 | urbanización, metalurgia, música, pastoralismo | datos arqueológicos, listas/artefactos | enciclopedias antiguas | arqueología prehistórica; no sincronizar genealogía | contexto general; `PROBABLE/UNKNOWN` |
| 5 | genealogías y longevidad | listas reales mesopotámicas | Pinches | estudios de géneros y numeración | paralelo literario; `DISPUTED` |
| 6–9 | diluvios mesopotámicos | Atrahasis; Gilgamesh XI K.3375; Ziusudra | Pinches/Sayce | ediciones críticas actuales | `LITERARY_PARALLEL`; `ESTABLISHED` para los textos, `UNKNOWN` para dependencia exacta |
| 10 | pueblos y geografía | inscripciones y topónimos regionales | diccionarios/Pinches/Sayce | lingüística e historia regional | geografía/historiografía; por nombre |
| 11:1–9 | Babilonia, ciudades y zigurats | inscripciones de Babilonia y templos | Pinches/Sayce | arqueología de Babilonia | contexto; no identificar una torre concreta |
| 11:10–32 | genealogía y ruta hacia Harán | textos/topónimos mesopotámicos | Pinches/Sayce/Smith | geografía y cronología | contexto; `DISPUTED` |
| 12–13 | movilidad pastoral, Canaán y Egipto | Amarna es posterior; datos regionales | Sayce/G. A. Smith | arqueología de Bronce Medio y cronología | contexto comparativo, no confirmación |
| 14 | reyes, Elam y ciudades del valle | textos elamitas/mesopotámicos | Pinches/Sayce | identificaciones antiguas muy revisadas | `DEBATED_IDENTIFICATION` |
| 15 | pactos, concesiones y ritual | tratados/documentos del ANE | Pinches/diccionarios | derecho comparado con control cronológico | `CULTURAL_PARALLEL`; `PROBABLE` |
| 16 | servidumbre doméstica, herencia y familia | Nuzi, Mari, códigos legales | Sayce/ISBE/Hastings | revisar abuso histórico de Nuzi | contexto; `DISPUTED` en paralelos específicos |
| 17 | circuncisión y pactos | evidencia egipcia y levantina | enciclopedias antiguas | historia comparada del rito | contexto; distinguir Israel de otros usos |
| 18–19 | hospitalidad, ciudades y valle del Jordán | textos de hospitalidad; arqueología regional | diccionarios | identificaciones de Sodoma controvertidas | costumbre/contexto; `DISPUTED/UNKNOWN` |
| 20–22 | Gerar, Abimelec, sacrificio y Moriah | datos filisteos son mayormente posteriores; rituales regionales | Edersheim/Maclear | anacronismo y toponimia | preguntas históricas; cautela alta |
| 23 | compra de tierra y sepultura | contratos del ANE; tumbas de Bronce | Sayce/Pinches | historia legal y arqueología funeraria | contexto cultural; no autentica el negocio |
| 24 | matrimonio, parentesco y viaje | contratos de Mari/Nuzi y geografía | Sayce | parentesco comparado | contexto; `PROBABLE` |
| 25–26 | pozos, pastoreo, Gerar y filisteos | arqueología regional | G. A. Smith/Sayce | cronología del término “filisteo” | geografía/contexto; `DISPUTED` |
| 27–28 | bendición, herencia, Betel y rutas | documentos legales y sitios | Sayce/Smith | arqueología de Betel y derecho familiar | contexto |
| 29–30 | matrimonio, dote, servidumbre y fertilidad | Mari/Nuzi/códigos | Sayce/Pinches | antropología histórica | paralelo cultural, no confirmación |
| 31 | terafines y tratados fronterizos | figurillas y textos domésticos | Sayce/Pinches | función de terafines debatida | `CULTURAL_PARALLEL`; `DISPUTED` |
| 32–33 | Transjordania, Jaboc, Siquem | geografía y arqueología regional | G. A. Smith | identificación de rutas/sitios | geografía; grados por lugar |
| 34 | ciudad, parentesco, matrimonio intergrupal | textos legales/sociales | diccionarios | evitar generalizaciones étnicas | contexto social; `POSSIBLE` |
| 35–36 | Betel, Edom y genealogías | inscripciones/topónimos edomitas posteriores | Sayce/diccionarios | arqueología de Edom y cronología | geografía/historiografía; `DISPUTED` |
| 37 | comercio caravanero, esclavitud y rutas a Egipto | archivos comerciales y evidencia de rutas | G. A. Smith/Pinches | economía del Bronce | contexto; no fecha automáticamente el relato |
| 38 | levirato, viudez, sellos y prendas | códigos y sellos del ANE | diccionarios | derecho familiar comparado | contexto cultural |
| 39–41 | administración, prisión, sueños y corte egipcia | textos e iconografía egipcios | Pinches/Edersheim | egiptología por período; fecha narrativa debatida | contexto egipcio; `DISPUTED` cronológicamente |
| 42–45 | hambre, graneros, viaje y administración | registros climáticos/administrativos generales | Pinches | no buscar una hambruna “de José” sin evidencia | contexto; `UNKNOWN` para identificación directa |
| 46–47 | migración, Gosén, tierra y fiscalidad | textos egipcios y asentamientos asiáticos | Pinches | egiptología y Delta oriental | contexto; `DISPUTED` |
| 48–50 | adopción, bendición, embalsamamiento y entierro | prácticas funerarias egipcias | Pinches/Edersheim | egiptología funeraria | contexto cultural; `STRONG` para práctica general |

## J. Plan de ingestión

1. Crear expediente legal por edición; bloquear automáticamente todo lo que no sea `CLEARED`.
2. Descargar a un staging fuera de módulos activos, con URL, fecha, checksum y tamaño.
3. Conservar original inmutable y generar derivados reproducibles.
4. Extraer OCR sin corregir silenciosamente; registrar página física y página impresa.
5. Normalizar Unicode, guiones de fin de línea, encabezados y notas mediante scripts revisables.
6. Segmentar por estructura original, no por longitud arbitraria.
7. Registrar citas y referencias bíblicas como candidatos, nunca como asociaciones aprobadas.
8. Resolver entidades mediante IDs canónicos y alias bilingües.
9. Crear afirmaciones candidatas con ubicación exacta.
10. Contrastar con fuentes modernas institucionales.
11. Revisión histórica y editorial humana.
12. Solo después de aprobación: generar documento de lectura, catálogo, índice semántico y proyección del Asistente.

Cada ejecución debe emitir conteos, errores OCR, IDs duplicados, referencias inválidas, checksums y `git diff --check`.

## K. Plan bilingüe

- IDs, fechas, coordenadas, relaciones y referencias bíblicas son neutrales al idioma.
- Nombres tienen forma canónica y alias ES/EN; conservar también transliteración académica.
- La fuente original se conserva en su idioma y edición.
- Historia · Verbo se redacta y revisa primero en un idioma canónico definido por entrada; la traducción debe tener revisión propia.
- No presentar traducción automática como cita del autor.
- Citas traducidas por Verbo deben marcarse “traducción de Verbo” y conservar original y ubicación.
- `sourceHash` debe invalidar traducciones cuando cambie el texto.

## L. Plan por etapas y aprobaciones

| Ola | Resultado | Requiere aprobación antes de ejecutar |
|---|---|---|
| 0 | auditoría e informe | autorizada |
| 1 | expedientes legales y corpus staging mínimo | sí, selección final de obras |
| 2 | normalización reproducible | sí |
| 3 | piloto editorial Génesis, sin publicar | sí |
| 4 | revisión histórica/arqueológica externa | sí/coordinar revisor |
| 5 | módulo de lectura en Historia | sí, cambio de producción |
| 6 | UI, búsqueda e integración del Asistente | sí, mecánicas activas |
| 7 | resto del Pentateuco | sí |
| 8 | Históricos y monarquía | sí |
| 9 | Profetas, exilio y retorno | sí |
| 10 | Sapienciales y cierre de los 39 libros | sí |

## M. Riesgos y mitigación

| Riesgo | Mitigación |
|---|---|
| dominio público distinto por país | expediente por edición; bloqueo conservador |
| fotografía moderna protegida | derechos de imagen separados; no usar por defecto |
| traducción moderna protegida | traducir solo desde texto legalmente permitido o licenciar |
| OCR defectuoso | conservar imagen/original, ubicación y control humano |
| erudición obsoleta | fuente antigua ≠ voz de Verbo; verificación moderna |
| apologética o escepticismo encubierto | relación y certeza explícitas; lenguaje proporcional |
| “paralelo” presentado como confirmación | campo `relation_type` obligatorio |
| duplicación de entidades | IDs canónicos y relaciones muchos-a-muchos |
| afirmaciones sin origen | `claim_id` y `source_location` obligatorios |
| crecimiento del bundle | carga por obra/libro bajo demanda; índices separados |
| traducción costosa/inconsistente | datos neutrales; caché por hash; revisión bilingüe |
| semántica que devuelve coincidencias llamativas pero irrelevantes | búsqueda no publica asociaciones; anclajes aprobados aparte |
| exceso de entradas | priorizar perícopas y temas sólidos; permitir vacíos |

## Recomendación para aprobación

Antes de descargar o integrar corpus, aprobar o modificar estas decisiones:

1. adoptar las cinco capas (fuentes, evidencia, entidades, afirmaciones y anclajes);
2. usar la escala de certeza separada de naturaleza y estado editorial;
3. iniciar staging únicamente con Pinches 1903, Sayce *Patriarchal Palestine*, H. P. Smith 1903, Maclear 1894 e ISBE 1915;
4. mantener Kenyon bloqueado;
5. no incorporar imágenes en la primera ola;
6. limitar el piloto editorial a las agrupaciones de Génesis indicadas arriba;
7. no tocar panel Historia ni Asistente hasta una segunda aprobación específica.
