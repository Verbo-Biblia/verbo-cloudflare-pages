# Ampliación histórica de Artículos y Reflexiones

## Estado

Documento creado el 10 de agosto de 2026 antes de modificar código o contenido y actualizado durante la ejecución. Implementación local completada; pendiente de commit, despliegue y comprobación final en producción.

## Objetivo

Ampliar `Artículos y Reflexiones` con documentos independientes del corpus aprobado cuya procedencia, integridad y reutilización puedan verificarse; atribuir las 35 piezas propias a Juan José Venegas; mostrar autoría al pie; conservar diseño, taxonomía y traducción de Verbo.

## Estado inicial y arquitectura encontrada

- Repositorio activo: `/home/juan/Verbo/verbo-cloudflare-pages`; rama `main`; base `7b93041b6d47e363b2eec2b8a671594b07f7351d`.
- Existían 35 piezas españolas y 35 contrapartes inglesas, sin autor estructurado. `.wrangler/` ya estaba sin seguimiento y quedó fuera de alcance.
- Índice canónico: `recursos/articulos-y-reflexiones/index.html`; páginas HTML por slug; catálogo `recursos/data/recursos.json`.
- Generación: `tools/build_content_taxonomy.py`. Filtros: `recursos/assets/filters.js`. Cambio de idioma del listado: `lang-aware-list.js`.
- Traducción: `biblia/assets/site-translate.js`, Worker `/translate`, KV y caché local con prefijo `verbo:t:`.
- Taxonomía visual vigente: `devocional` (Reflexiones y Devocionales) y `estudio` (Estudios Temáticos), con temas filtrables; no hay categorías por autor.

## Autoría del contenido actual

- Se añadieron `data-author="Juan José Venegas"` y un pie `article-attribution` a las 35 páginas españolas y sus 35 contrapartes inglesas.
- `tools/add_article_authorship.py` hace la operación idempotente. El catálogo deriva `autor` del dato estructurado.
- No se modificó ningún cuerpo de las 35 piezas.

## Corpus histórico incorporado

Se incorporaron 10 cartas independientes de Samuel Rutherford: III, IV, XIII, XIX, XX, XXIII, XXIX, LXI, LXV y CXLII. Todas están en `devocional`, con temas coherentes del sistema existente: fe, sufrimiento, esperanza, perseverancia, vida cristiana, vida en Cristo, fidelidad de Dios, seguridad en Cristo y juventud.

Fuente: *Letters of Samuel Rutherford*, tercera edición, ed. Andrew A. Bonar, Project Gutenberg eBook 42557. La licencia incluida declara `Public domain in the USA`. Se extrajo únicamente el cuerpo de las cartas; se retiraron notas entre corchetes y material biográfico/editorial.

Cada página conserva autor, tipo documental, referencia de la edición, fuente enlazada y estado jurídico en `recursos/data/historical-articles.json`. El título de carta se distingue del subtítulo editorial añadido por Verbo.

## Piezas omitidas

- **John Newton (10): PENDIENTE — TEXTO NO SUFICIENTEMENTE VERIFICADO.** La edición Cornell/Internet Archive `cu31924029450982` es histórica y de dominio público, pero su OCR sustituye letras y mezcla notas de Josiah Bull dentro de cartas. Requiere cotejo página por página.
- **Charles H. Spurgeon (19): PENDIENTE — DERECHOS NO SUFICIENTEMENTE VERIFICADOS.** Las reproducciones localizadas en BiblicalStudies.org.uk solo indican suministro gratuito educativo; no conceden claramente reutilización del archivo digital. No se copió su OCR.
- **Princeton (6): PENDIENTE.** Theological Commons declara `No Copyright - United States` en los fascículos localizados de Warfield 1903, Vos 1903/1906 y Machen 1913, pero su OCR daña palabras y términos griegos. Machen 1925 y Warfield 1911 no alcanzaron una reproducción histórica completa verificada. No se publicó texto defectuoso ni una republicación moderna.

Total candidato: 45. Incorporado: 10. Omitido: 35, sin sustituciones.

## Traducción

Los históricos conservan el inglés de dominio público como fuente canónica y declaran `data-source-lang="en"`. `content-translate.js` etiqueta título y cuerpo; `site-chrome.js` entrega el idioma fuente al traductor existente. Al seleccionar español se usa Worker + KV + localStorage; volver a inglés restaura el original. No se creó traductor paralelo ni se copió traducción española de terceros.

Prueba real: una petición inglés→español devolvió una traducción coherente con `cached:false`; la repetición idéntica devolvió `cached:true`, confirmando persistencia en el Worker.

## Archivos modificados

- `docs/ARTICULOS-HISTORICOS-AMPLIACION.md`.
- `tools/add_article_authorship.py`, `tools/build_historical_articles.py`, `tools/build_content_taxonomy.py`.
- `biblia/assets/content-translate.js`, `site-chrome.js`, `i18n/es.json`, `i18n/en.json`.
- `recursos/assets/recursos.css`, índice y catálogo de Recursos, `sitemap.xml`.
- 70 páginas propias para autoría y 10 páginas `rutherford-*` nuevas.
- `recursos/data/historical-articles.json`.

## Control de duplicados y pruebas

- Búsqueda por números, destinatarios y títulos en Recursos, Librería y módulos bíblicos: ninguna de las diez cartas estaba publicada.
- Resultado del catálogo: 45 piezas; 26 en `devocional`, 19 en `estudio`; 24 de tipo `devocional-reflexion`, 21 de tipo `articulo`.
- JSON ES/EN, catálogo y corpus válidos; Python compilado; JavaScript comprobado con `node --check`; `git diff --check` correcto.
- Las rutas EN de históricos apuntan a la misma página canónica, no a carpetas inexistentes.
- Revisión de marcadores Gutenberg, notas, caracteres de reemplazo y residuos editoriales en las diez cartas: sin coincidencias.
- Revisión visual local: índice a 1440×1200 y carta a 390×844; tipografía, ancho de lectura, selector, scroll y responsive correctos.
- Traducción y caché comprobados contra el Worker real. La verificación completa de interacción se repetirá sobre producción tras el despliegue.

## Decisiones

- Seguir la arquitectura estática y la taxonomía vigente; no crear biblioteca, lector, categorías de autor ni sistema paralelo.
- Publicar menos piezas antes que textos con OCR, procedencia o derechos dudosos.
- Mantener una sola ruta física para históricos ingleses y traducir bajo demanda mediante la infraestructura existente.

## Resultado final

Localmente: las 35 piezas existentes conservan contenido y muestran a Juan José Venegas al pie; se agregaron 10 cartas verificadas de Samuel Rutherford; filtros, temas, catálogo, sitemap, responsive y traducción permanecen integrados.

## Commit final

Pendiente de crear y registrar después de las validaciones finales.
