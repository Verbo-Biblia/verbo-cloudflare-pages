# Estado de incorporación de The Pulpit Commentary

Última actualización: 2026-08-20 (America/Costa_Rica).

## Estado general

- Meta: 66 libros completos, corregidos contra facsímiles de dominio público,
  sincronizados con Biblia Verbo y validados antes de publicación.
- Fuentes catalogadas: 66 libros, 77 PDF en `sources.json`.
- Borradores estructuralmente sincronizados: 25 libros.
- Libros publicados o registrados: 0.
- Todos los borradores conservan `editorialStatus: ocr-unreviewed`.
- Módulo de trabajo creado en
  `biblia/modules/commentaries/pulpit-commentary/`, todavía sin registrar y con
  el arreglo `books` vacío. Los 25 libros están preparados físicamente como
  artefactos de revisión; sus 6,038 entradas permanecen `ocr-unreviewed`.

| Libro | Entradas | Grupos fuente | Capítulos | Errores estructurales | Cola OCR |
| --- | ---: | ---: | ---: | ---: | ---: |
| Génesis | 1,274 | 1,174 | 50 | 0 | 908 |
| Esdras | 264 | 254 | 10 | 0 | 164 |
| Nehemías | 391 | 376 | 13 | 0 | 207 |
| Ester | 312 | 288 | 10 | 0 | 193 |
| Filemón | 50 | 45 | 1 | 0 | 38 |
| Abdías | 52 | 43 | 1 | 0 | 43 |
| 2 Juan | 20 | 17 | 1 | 0 | 18 |
| 3 Juan | 18 | 14 | 1 | 0 | 15 |
| Judas | 43 | 31 | 1 | 0 | 35 |
| Tito | 90 | 80 | 3 | 0 | 84 |
| Santiago | 117 | 103 | 5 | 0 | 106 |
| 2 Pedro | 72 | 68 | 3 | 0 | 66 |
| 2 Timoteo | 108 | 99 | 4 | 0 | 92 |
| 1 Pedro | 167 | 154 | 5 | 0 | 151 |
| 1 Juan | 130 | 115 | 5 | 0 | 127 |
| 1 Timoteo | 192 | 171 | 6 | 0 | 175 |
| 1 Tesalonicenses | 174 | 153 | 5 | 0 | 146 |
| 2 Tesalonicenses | 93 | 80 | 3 | 0 | 83 |
| Efesios | 292 | 269 | 6 | 0 | 267 |
| Filipenses | 223 | 177 | 4 | 0 | 203 |
| Colosenses | 179 | 162 | 4 | 0 | 165 |
| Gálatas | 241 | 218 | 6 | 0 | 224 |
| 2 Corintios | 441 | 416 | 13 | 0 | 396 |
| Romanos | 390 | 340 | 16 | 0 | 370 |
| 1 Corintios | 705 | 639 | 16 | 0 | 625 |

Los conteos de la cola son señales automáticas prioritarias; no sustituyen la
revisión completa de cada entrada contra el facsímil.

## Fuentes y archivos de trabajo

- Génesis usa el facsímil de Theology on the Web documentado en `README.md`.
- Esdras, Nehemías y Ester usan como cotejo el volumen XV aportado por el
  usuario: `Noor-Book.com  تعليق المنبر 2 .pdf` (554 páginas). Su procedencia,
  recompresión y hashes están documentados en `supplemental-sources.json`.
- La capa OCR canónica de Internet Archive para ese volumen fue comprobada con
  el identificador `cu31924101105041`.
- Los stagings y reportes regenerables están en `/tmp`; los 25 pares
  normalizados de libro e índice están en el módulo como artefactos de revisión.
  Ninguno es publicable mientras conserve `ocr-unreviewed` o quede fuera del
  manifest.
- El facsímil de Éxodo, volumen 1, fue descargado y validado temporalmente como
  `/tmp/pulpit-exodus-v1-complete.pdf`, pero Éxodo todavía no se ha convertido.
- El facsímil de Filemón fue descargado y validado (1,148,536 bytes, 31 páginas,
  SHA-256 `65660944faffa6d20676960e2906b241537af8a51c60c09259b55322942cc24b`).
  Su borrador y sus reportes temporales son `/tmp/pulpit-philemon-staging.json`,
  `/tmp/pulpit-philemon-audit.json` y `/tmp/pulpit-philemon-review.json`. Se
  cotejaron y registraron catorce correcciones estructurales o inequívocas del
  OCR en las páginas físicas 14, 16, 17, 19, 20, 23, 24, 25, 27 y 29; la revisión
  integral continúa abierta. La regeneración con `pdftotext -raw` corrigió el
  entrelazado de las dos columnas que sufría el borrador anterior: recuperó los
  25 versículos de la exposición y varios encabezados homiléticos omitidos.
- Los facsímiles de Abdías, 2 Juan, 3 Juan y Judas también fueron descargados,
  validados y convertidos temporalmente. Sus límites de capítulo único fueron
  cotejados visualmente y sus borradores no tienen errores estructurales.
- Tito, Santiago y 2 Pedro fueron delimitados capítulo por capítulo contra sus
  facsímiles y convertidos a borradores temporales sin errores estructurales.
  Cuatro encabezados numéricos degradados por el OCR fueron corregidos con
  evidencia visual registrada en sus archivos de correcciones.
- 2 Timoteo, 1 Pedro y 1 Juan fueron delimitados capítulo por capítulo contra
  sus facsímiles y convertidos a borradores temporales sin errores
  estructurales.
- 1 Timoteo, 1 Tesalonicenses y 2 Tesalonicenses fueron delimitados capítulo
  por capítulo y convertidos sin errores estructurales. En 2 Tesalonicenses se
  corrigió con evidencia visual un `Ver. 18` espurio a `Ver. 13`.
- Efesios, Filipenses y Colosenses fueron delimitados y convertidos sin errores
  estructurales. Se corrigieron visualmente `Efesios 5:32` y el rango
  discontinuo `Filipenses 3:15, 16`, ambos degradados por el OCR.
- Gálatas y 2 Corintios fueron delimitados y convertidos sin errores
  estructurales. La diferencia entre los 14 versículos del facsímil inglés de
  2 Corintios 13 y los 13 de Biblia Verbo quedó documentada explícitamente.
- Romanos fue delimitado en sus 16 capítulos y convertido sin errores
  estructurales; dos encabezados numéricos degradados se corrigieron contra el
  facsímil.
- 1 Corintios fue delimitado en sus 16 capítulos, convertido y auditado sin
  errores estructurales. El facsímil temporal `/tmp/pulpit-1co.pdf` fue descargado y
  validado (22,550,075 bytes, 591 páginas, SHA-256
  `90ca786144e05f022e67fcdfd0167510f6c96fe491d713293ce5a4a870fa9097`).
  Su OCR está en `/tmp/pulpit-1co.txt`. Los límites de sus 16 capítulos fueron
  cotejados visualmente en las páginas físicas 8, 65, 99, 139, 172, 200, 232,
  271, 295, 331, 370, 405, 431, 465, 492 y 558. El borrador y el reporte están
  en `/tmp/pulpit-1co-staging.json` y `/tmp/pulpit-1co-audit.json`.

## Evidencia versionada

- Límites verificados: `boundaries/GEN.json`, `boundaries/EZR.json`,
  `boundaries/NEH.json`, `boundaries/EST.json`, `boundaries/OBA.json`,
  `boundaries/PHM.json`, `boundaries/2JN.json`, `boundaries/3JN.json` y
  `boundaries/JUD.json`, además de `boundaries/TIT.json`,
  `boundaries/JAS.json`, `boundaries/2PE.json`, `boundaries/2TI.json`,
  `boundaries/1PE.json`, `boundaries/1JN.json`, `boundaries/1TI.json`,
  `boundaries/1TH.json`, `boundaries/2TH.json`, `boundaries/EPH.json`,
  `boundaries/PHP.json`, `boundaries/COL.json`, `boundaries/GAL.json` y
  `boundaries/2CO.json`, `boundaries/ROM.json` y `boundaries/1CO.json`.
- Correcciones de referencias: `corrections/GEN.json`, `corrections/EZR.json`,
  `corrections/NEH.json`, `corrections/EST.json`, `corrections/OBA.json`,
  `corrections/PHM.json`, `corrections/2JN.json`, `corrections/3JN.json` y
  `corrections/JUD.json`, además de `corrections/TIT.json`,
  `corrections/JAS.json`, `corrections/2PE.json`, `corrections/2TI.json`,
  `corrections/1PE.json`, `corrections/1JN.json`, `corrections/1TI.json`,
  `corrections/1TH.json`, `corrections/2TH.json`, `corrections/EPH.json`,
  `corrections/PHP.json`, `corrections/COL.json`, `corrections/GAL.json` y
  `corrections/2CO.json`, `corrections/ROM.json` y `corrections/1CO.json`.
- Herramientas: `discover_sources.py`, `audit_ocr.py`, `build_book.py` y
  `audit_staging.py`. `build_book.py` admite correcciones exactas del cuerpo OCR
  documentadas con página y razón en `bodyTextCorrections`.
- `git diff --check` estaba limpio al terminar las últimas validaciones.

## Reanudación (2026-08-17)

### Pausa guardada (2026-08-18)

- Trabajo pausado por solicitud del usuario después de cotejar íntegramente las
  exposiciones de Filemón 1:1–4. Hay 4 de 50 entradas con estado individual
  `reviewed`; las 46 restantes y el libro completo conservan
  `ocr-unreviewed`.
- Siguiente unidad exacta: exposición `Ver. 5.`, página física 14 del
  facsímil canónico de Filemón.
- Temporales regenerados: `/tmp/pulpit-philemon.pdf`,
  `/tmp/pulpit-philemon.txt`, `/tmp/pulpit-philemon-staging.json` y
  `/tmp/pulpit-philemon-audit.json`. Si desaparecen, regenerarlos según este
  documento; el facsímil verificado conserva SHA-256
  `65660944faffa6d20676960e2906b241537af8a51c60c09259b55322942cc24b`.
- Última validación: 50 entradas, 45 grupos fuente, 0 errores estructurales,
  39 señales automáticas y `publishable: false`. No se modificaron catálogo,
  índices ni módulo público.

- Se reanudó la revisión integral de Filemón y se descubrió que la extracción
  `-layout` entrelazaba las columnas del facsímil. El flujo documentado usa
  ahora `pdftotext -raw`; los borradores anteriores de otros libros deben
  comprobar su orden de columnas antes de considerarlos estructuralmente
  fiables.
- Filemón conserva ahora 50 entradas en 45 grupos, 0 errores estructurales y 39
  entradas todavía señaladas para revisión; no debe cambiarse el estado global
  `ocr-unreviewed`. Las exposiciones de los versículos 1–4 están ya cotejadas
  íntegramente y marcadas individualmente como `reviewed`; quedan 46
  entradas por cotejar, incluidas las que no aparecen en la cola automática.
- Ya quedaron versionadas catorce correcciones estructurales o inequívocas y
  cuatro reemplazos de entrada cotejados en `corrections/PHM.json`. Al reanudar,
  continuar con la exposición de `Ver. 5.` en la página física 14 y después con
  las demás señales del reporte `/tmp/pulpit-philemon-audit.json`, cotejando
  también las entradas no señaladas contra el facsímil.
- Los archivos de `/tmp` pueden desaparecer entre sesiones. Si faltan, volver a
  descargar el facsímil de Filemón indicado en `sources.json`, extraerlo con
  `pdftotext -layout` y regenerar el borrador y la auditoría antes de continuar.
- No se modificaron el catálogo, los índices, el módulo público ni Cloudflare.

### Reanudación (2026-08-20)

- Se regeneraron el facsímil, la capa de texto `-raw`, el borrador y la auditoría
  temporales de Filemón. El PDF volvió a coincidir con el tamaño, las 31 páginas
  y el SHA-256 ya documentados.
- La exposición de `Ver. 5.` se cotejó íntegramente contra las dos columnas de
  la página física 14 y quedó registrada como `reviewed`, incluidas las
  expresiones griegas que el OCR había degradado.
- La evidencia versionada de Filemón contiene ahora 14 de 50 exposiciones
  cotejadas contra el facsímil (versículos 1–14); quedan 36 entradas fuente por
  cotejar. El staging temporal previo solo reflejaba las primeras 8, por lo que
  la preparación del piloto aplica los reemplazos más recientes de
  `corrections/PHM.json`. El libro completo y sus 50 entradas en el módulo se
  mantienen deliberadamente como `ocr-unreviewed` hasta decisión manual de
  Juan. La última auditoría del staging generó 38 señales automáticas, 45 grupos
  fuente y 0 errores estructurales.
- También se cotejaron íntegramente las exposiciones de `Ver. 6.` y `Ver. 7.`
  contra la columna derecha de la página física 14, restaurando el griego, las
  citas latinas y las referencias dañadas por el OCR.
- También se cotejó la exposición de `Ver. 8.` entre las páginas físicas 14–15.
- También se cotejaron las exposiciones de `Ver. 9.` a `Ver. 14.` y se
  versionaron sus reemplazos completos en `corrections/PHM.json`.
- Siguiente unidad exacta: exposición `Ver. 15.`, página física 16 del
  facsímil canónico de Filemón. No se modificaron registro ni catálogos.

## Paso 0 del módulo independiente

- Estructura creada: `biblia/modules/commentaries/pulpit-commentary/`.
- `manifest.json` es compatible con comentarios esquema 2, pero conserva
  `books: []`; por tanto Filemón no está registrado como libro disponible.
- Los 25 pares `books/<ID>.json` y `books/<ID>.index.json` son artefactos de
  revisión, no una publicación. Las 6,038 entradas están marcadas
  `ocr-unreviewed`; el manifest continúa con `books: []`.
- Las capas OCR se regeneraron desde los facsímiles catalogados. Cuando una
  extracción alternativa no reutilizó correcciones ligadas textualmente a otra
  capa OCR, el conversor permitió dejarlas sin aplicar, pero nunca relajó la
  validación de capítulos y rangos. Los 25 libros terminaron con cero errores
  estructurales y conservan sus colas completas de revisión visual.
- Filemón conserva 50 entradas; aunque 14 reemplazos fuente ya tienen evidencia
  de cotejo, las 50 siguen `ocr-unreviewed` por instrucción expresa de no otorgar
  aprobación editorial en este paso.
- Antes de publicar Filemón faltan: cotejar las 36 entradas restantes, resolver
  todas las señales OCR, validar nuevamente JSON/rangos/índice y recibir la
  aprobación manual de Juan.

## Plan de reanudación

1. Corregir integralmente las colas OCR de los cinco libros de un capítulo
   (Filemón, Abdías, 2 Juan, 3 Juan y Judas) contra sus facsímiles; revisar
   también las entradas no señaladas antes de cambiar cualquier estado.
2. Continuar la corrección integral del OCR de Génesis, Esdras, Nehemías y
   Ester, manteniéndolos fuera del catálogo hasta completar el cotejo.
3. Preparar y convertir los restantes 41 libros con el mismo control de
   licencias, límites, rangos y estado editorial.
4. Preparar cada libro terminado en el módulo independiente y publicarlo solo
   después de aprobación manual, siguiendo el orden recomendado documentado en
   `README.md`. La reconstrucción de índices, catálogo y registro pertenece al
   paso de publicación autorizado, no a esta preparación.

No reconstruir índices ni modificar `biblia/modules/registry.json` mientras
exista algún libro con OCR sin revisar.

## Pausa guardada: preparación de los 25 libros (2026-08-20)

- Los 25 libros estructurados están materializados en
  `biblia/modules/commentaries/pulpit-commentary/books/`, cada uno con su JSON
  completo y su índice liviano: 50 archivos y 6,038 entradas en total.
- Las 6,038 entradas conservan `editorialStatus: ocr-unreviewed`; ninguna fue
  aprobada durante la preparación.
- Los 25 pares libro/índice tienen identificadores únicos, correspondencia
  exacta entre índice y contenido, capítulos y rangos válidos contra Biblia
  Verbo, contenido no vacío y cero errores estructurales en
  `audit_staging.py`.
- `biblia/modules/commentaries/pulpit-commentary/manifest.json` conserva
  `books: []`. El módulo no está en `biblia/modules/registry.json`, no es
  visible en la aplicación y no debe presentarse todavía como publicado.
- No se ejecutaron `tools/build_commentary_index.py` ni
  `tools/build_registry_catalog.py`; tampoco se hicieron operaciones de staging,
  commit o push en Git.
- Los facsímiles, capas OCR, stagings y auditorías regenerables de esta sesión
  están temporalmente en `/tmp`. Los artefactos valiosos que deben conservarse
  a largo plazo son el módulo, las herramientas, límites, correcciones y esta
  documentación dentro del repositorio.
- Próxima decisión de Juan: escoger entre guardar en Git solamente la
  infraestructura y los artefactos de revisión todavía invisibles, o continuar
  primero el cotejo editorial de Filemón. Registrar o hacer visible cualquier
  libro requiere una instrucción posterior explícita.
