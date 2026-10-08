# El cristiano hoy: preguntas y respuestas

Encargo de Juan: crear diez artículos con títulos atractivos y SEO, enlazar la sección desde el inicio y replantear la portada conservando sus recursos. También autorizó commit y push.

## Criterio editorial

- Selección editorial de preguntas actuales y recurrentes, no ranking comprobado de búsquedas evangélicas en PC. No se dispone de volúmenes de búsqueda propios ni de datos segmentados que permitan afirmar ese ranking.
- Barna, 14 de abril de 2026: [Christians View AI as a Gift—and a Threat](https://www.barna.com/research/christians-view-ai-gift-threat/). Evidencia de conversación actual sobre IA entre cristianos en EE. UU.; no mide búsquedas de escritorio en español.
- Bible Gateway, 1 de diciembre de 2025: [Year in Review 2025](https://www.biblegateway.com/learn/bible-verses/top-verses-2025-year-in-review/). Evidencia de interés en pasajes y lectura bíblica; no se extrapola a un ranking exclusivo de PC.
- [Preguntas frecuentes de GotQuestions en español](https://www.gotquestions.org/Espanol/preguntas-frecuentes.html): referencia de preguntas recurrentes, no fuente doctrinal de las respuestas ni medición por dispositivo.
- Autoría de los artículos nuevos: redacción de Verbo. No atribuir los textos nuevos a Juan como si él los hubiese firmado. La orientación doctrinal procede de sus estudios y escritos; los artículos publicados pertinentes están enlazados en cada respuesta.
- IA: seguir su postura explícita sobre música hecha con IA, contenido bíblico y corazón del adorador. No extender esa postura a todo uso de IA ni convertir la herramienta en una fuente de autoridad espiritual.
- Conservar gracia y seguridad en Cristo junto con arrepentimiento y permanencia. Reconocer milagros actuales y distinguirlos de autoridad apostólica fundacional. Mantener el matiz de Romanos 11 al tratar Israel.

## Implementación

`preguntas-cristianas/data/articles.json` contiene los diez textos. `tools/build_christian_questions.py` genera once páginas estáticas, metadatos, Article/CollectionPage/BreadcrumbList y entradas de sitemap. No se incluye FAQPage ni se promete un resultado enriquecido de Google. Los títulos y descripciones describen el contenido sin repetir palabras clave artificialmente.

Índice con buscador, filtros por tema, contador y estado vacío. Funciona como listado de lectura si JavaScript está desactivado. Los artículos incluyen respuesta breve, desarrollo, pasajes, lecturas relacionadas y enlaces internos.

La portada destaca preguntas y lectura antes de las aplicaciones. Conserva las presentaciones y accesos anteriores a Desktop, Android, historias, librería, recursos, artículos, devocionales y demás áreas, con la visibilidad que ya tenían. Nuevos textos de portada traducidos en los diccionarios ES/EN. La colección inicial de artículos se publica en español, como la colección de historias existente.

No se integra contenido nuevo en los paneles o el Asistente de `biblia/`. No se modifica Worker, API ni configuración de despliegue. Únicamente se actualizan diccionarios de interfaz compartidos para la portada.

## Regeneración

Desde la raíz: `python3 tools/build_christian_questions.py`.

Consulta externa del artículo sobre ansiedad: [NIMH, cuándo buscar ayuda profesional](https://www.nimh.nih.gov/health/publications/espanol/trastorno-de-ansiedad-generalizada-cuando-no-se-pueden-controlar-las-preocupaciones-new). La respuesta es pastoral y no prescribe tratamientos.

## Validación realizada

- Doce páginas comprobadas: portada, índice y diez artículos; un H1, canonical y datos estructurados válidos en cada una. Once rutas nuevas únicas en sitemap.
- Enlaces nuevos, recursos locales y anclas internas comprobados; accesos anteriores de la portada conservados. Los parámetros de caché del diccionario se actualizaron.
- Chromium: búsqueda con y sin acentos, IA como término independiente, filtros temáticos, contador y resultado vacío. Diez artículos accesibles también sin JavaScript.
- Portada sin desbordamiento horizontal a 1440, 1024, 390 y 320 px. Selector ES/EN de portada comprobado. Artículo e índice comprobados también en ancho reducido.
- Ilustración WebP de 1200 × 800 px, 121352 bytes; imagen visible y metadatos sociales verificados. Sintaxis JavaScript, JSON, sitemap XML y git diff --check correctos.
- La introducción de portada se compactó a petición de Juan: «La Palabra para hoy», una frase y dos botones. No se añadieron imágenes al bloque inicial.
