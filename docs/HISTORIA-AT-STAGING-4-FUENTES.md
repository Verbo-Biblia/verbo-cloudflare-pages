# Cierre de staging — cuatro fuentes históricas del AT

Fecha de verificación: 2026-08-31
Alcance: `STAGING_ONLY`

No se modificaron `biblia/`, Historia, Términos, el Asistente, índices activos, `registry.json`, R2 ni producción. No se añadieron estas obras a `BIBLIOGRAPHY.json`.

## Resultado comparativo

| Fuente | Año/edición usada | Tamaño preservado y derivados | Palabras OCR/texto | Estructura | Calidad de transcripción | Riesgo editorial | Estado técnico |
|---|---:|---:|---:|---|---|---|---|
| Sayce, *Patriarchal Palestine* | 1895; impresión base exacta pendiente | 423,594 B de texto; 427,157 B expediente | 72,121 | prefacio, 6 capítulos, índice; marcador de mapa | buena para lectura; no permite citas seguras por página hasta identificar impresión | alto: apologética y arqueología decimonónica; identificaciones presentadas como confirmaciones | `PASS` |
| Maclear, *A Class-Book of Old Testament History* | 1894 (obra original 1865) | 1,093,166 B de texto; 1,096,519 B expediente | 175,120 | sinopsis, 11 libros, 71 capítulos, apéndice, tablas e índice | buena; Gutenberg estandarizó puntuación, reubicó notas y no verificó referencias del índice | medio-alto: narración confesional, cronologías y armonizaciones antiguas | `PASS` |
| Pinches, *The Old Testament in the Light…* | 2.ª ed. revisada, 1903 (1.ª: 1902) | PDF 25,760,387 B; conjunto 43,779,451 B | 207,027 | prólogo, 13 capítulos, apéndice Hammurabi, ensayo, notas; 16 ilustraciones | útil para descubrimiento; alto riesgo en transliteraciones, diacríticos, notas y columnas | alto: paralelos mesopotámicos, Amrafel/Hammurabi, Génesis 14, Habiri/Éxodo y conclusiones de 1903 | `WARNING` editorial/OCR; íntegro |
| H. P. Smith, *Old Testament History* | 1.ª ed., septiembre de 1903 | PDF 153,112,090 B; conjunto 167,422,082 B | 238,926 | 2 prefacios, 20 capítulos, cronología y 2 índices | buena para descubrimiento; notas, hebreo, columnas e índices requieren facsímil | muy alto: reconstrucción histórico-crítica explícita, composición, fechas, historicidad y desarrollo religioso | `WARNING` editorial/OCR; íntegro |

`WARNING` no indica corrupción: en Pinches y Smith registra cautelas editoriales y de OCR. No hubo `FAIL`.

## Rutas y procedencia

- Sayce: `data/fuentes-externas/historia-at/sayce-patriarchal-palestine/`; Project Gutenberg eBook 14405, <https://www.gutenberg.org/ebooks/14405>.
- Maclear: `data/fuentes-externas/historia-at/maclear-class-book-ot-history/`; Project Gutenberg eBook 63528, transcripción de Macmillan 1894, <https://www.gutenberg.org/ebooks/63528>.
- Pinches: `data/fuentes-externas/historia-at/pinches-ot-historical-records-1903/`; Internet Archive `oldtestamentinli00pincuoft`, ejemplar de Robarts Library, University of Toronto, <https://archive.org/details/oldtestamentinli00pincuoft>.
- Smith: `data/fuentes-externas/historia-at/hp-smith-ot-history-1903/`; Library of Congress LCCN 03023384, OCLC 597724, signatura `BS1197 .S6`, <https://www.loc.gov/item/03023384/>.

Cada directorio contiene `acquisition.json`, `legal.json` y `original/`. Pinches y Smith añaden `structure.json`, `EDITORIAL-NOTES.md` y `upstream-derivatives/`. Los derivados son OCR/XML de los repositorios, no OCR producido por Verbo.

## Checksums conservados

| Fuente/archivo | Bytes | Líneas | Palabras | SHA-256 |
|---|---:|---:|---:|---|
| Sayce `original/pg14405.txt` | 423,594 | 7,718 | 72,121 | `04c75c37f20cc05cde8cb2002c83583f683ffeb902419bf560ad857b9549a70b` |
| Maclear `original/pg63528.txt` | 1,093,166 | 19,706 | 175,120 | `063508045ac981ceb4d49192408aa9e845d28b64b1cf37b5ebb633829bc240a4` |
| Pinches `original/oldtestamentinli00pincuoft.pdf` | 25,760,387 | — | — | `2ccf19b8863d3b079be62d9c63e7e520dfccd2bc06318eb45ea71c06c34fe26e` |
| Pinches `upstream-derivatives/*_djvu.txt` | 1,382,792 | 33,180 | 207,027 | `45ac7cd9efbdcc688c10e14dc174459ed7a15d29a42172e79264933a1673f133` |
| Pinches `upstream-derivatives/*_djvu.xml` | 16,279,613 | — | — | `4e48c524da48123b4bc64d913dd195a78575a0080b9041f57f2eb5d7c3d79a05` |
| Pinches `upstream-derivatives/*_scandata.xml` | 345,635 | — | — | `6c12b735f1e1c0340162f11fb648d46b33446264e4cd7faee78d6a397201fbca` |
| Smith `original/oldtestamenthist01smit.pdf` | 153,112,090 | — | — | `957a995c59ff9df637d0fdb1e50f0174b9446ee951ec8a6f517b8c1185657d67` |
| Smith `upstream-derivatives/*_djvu.txt` | 1,375,412 | 29,319 | 238,926 | `ee3132ec79f181623d4b265fa8473cc3f5ee014de841a470589f5de374ff5e90` |
| Smith `upstream-derivatives/*_djvu.xml` | 12,923,890 | — | — | `fa510ce32170bc849be4d38902bcf538d14de31320c5d07b3734cef51a996e50` |

## Estado jurídico

Las cuatro obras tienen expediente `legal.json` y estado `CLEARED_TEXT_ONLY`.

- Estados Unidos: las ediciones de 1894, 1895 y 1903 están en dominio público. LOC además declara expresamente que los libros de la colección de Smith son de dominio público y libres para usar y reutilizar.
- Costa Rica: evaluación preliminar conforme al plazo ordinario de vida más 70 años. Maclear murió en 1902, Sayce en 1933, Pinches en 1934 y Smith en 1927; sus plazos patrimoniales ordinarios finalizaron, respectivamente, en 1972, 2003, 2004 y 1997.
- Se mantiene atribución. El artículo 7 de la Ley 6683 exige no suprimir el nombre del autor conocido y distinguir interpolaciones o adiciones; el artículo 58 establece el plazo general.
- `images_allowed: false` para las cuatro. Mapas, fotografías, láminas, facsímiles extraídos, reediciones y aparatos modernos están fuera de esta autorización. Los PDF completos solo se preservan como originales de auditoría.
- No se evaluaron jurisdicciones adicionales; deberán revisarse si llegan a ser operativamente relevantes.

Esto es documentación técnica preliminar, no dictamen jurídico.

## Transcripción y diferencias editoriales

### Sayce

La envoltura de Gutenberg se conserva. La portada transcrita no permite identificar todavía la impresión concreta; por eso no deben publicarse referencias de página. El marcador del mapa no incluye la imagen. El texto es legible, pero la transcripción no sustituye un facsímil.

### Maclear

Gutenberg identifica la edición Macmillan de 1894. Sus transcriptores declararon estandarización de puntuación, traslado de notas y referencias de índice sin comprobar. Los marcadores textuales no preservan mapas e ilustraciones.

### Pinches

La portada del facsímil confirma «Second edition—revised, with appendices and notes», 1903. No se cotejó línea por línea con la primera edición de 1902. El OCR introduce espacios anómalos, confunde signos y puede perder diacríticos en nombres acadios/asirios/babilónicos; también altera el orden de notas. Se preservó el DjVu XML para recuperar coordenadas, pero toda cita y transliteración exige cotejo visual.

### Smith

LOC proporciona PDF, OCR TXT y DjVu XML, por lo que no se ejecutó OCR local. El escaneo corresponde a la edición publicada en septiembre de 1903. Las diferencias detectadas son de reconocimiento y disposición, no una edición textual distinta: encabezados se mezclan con cuerpo, notas pueden desordenarse y columnas de índices pierden alineación.

## Advertencias y ejemplos reales

- **Sayce:** el prefacio afirma que los monumentos restauran la credibilidad de la historia bíblica y habla de descubrimientos como confirmación. Es el marco apologético de 1895 y debe atribuirse, no convertirse en evaluación arqueológica moderna.
- **Maclear:** organiza el relato «desde la Creación» como historia continua y ofrece tablas cronológicas. Su esquema pedagógico-confesional, fechas y armonizaciones deben distinguirse de evidencia histórica independiente.
- **Pinches:** la leyenda del frontispicio identifica a Hammurabi con Amrafel; los capítulos I–III interpretan paralelos de creación y diluvio; el VI reconstruye los reyes de Génesis 14; el VIII relaciona Amarna, `Habiri` y una fecha del Éxodo; el apéndice compara Hammurabi con la ley mosaica. Son ejemplos registrados en `EDITORIAL-NOTES.md`, no conclusiones aceptadas.
- **Smith:** el prefacio declara una nueva «reconstrucción histórica» fundada en crítica; el capítulo I afirma composición estratificada y juzga al Cronista; el capítulo II asigna Génesis a `P/J/E/D`, fecha al autor sacerdotal después de 500 a. C., caracteriza material temprano como mitológico y niega que sea histórico en sentido propio. La prosa debe atribuirse a Smith y contrastarse de forma independiente.

## Auditor y cambios de herramienta

`tools/historia-at/audit_staged_source.py` conserva compatibilidad con las fuentes textuales y ahora:

- calcula siempre bytes y SHA-256 de binarios y textos;
- calcula líneas y palabras solo cuando el manifiesto las declara;
- acepta `CLEARED_TEXT_ONLY`;
- emite `PASS`, `WARNING` o `FAIL`;
- admite `auditWarnings` sin convertir cautelas editoriales en fallos técnicos;
- falla por archivos ausentes, checksum/métricas discordantes, JSON legal incompleto o estado distinto de `STAGING_ONLY`.

Resultados del 2026-08-31:

```text
Sayce     PASS     0 warnings, 0 errors
Maclear   PASS     0 warnings, 0 errors
Pinches   WARNING  2 warnings, 0 errors
H. P. Smith WARNING 2 warnings, 0 errors
```

## Validación y límite de fase

- Los cuatro manifiestos fueron auditados contra los archivos reales.
- `git diff --check`: sin errores.
- `git status --short` al cierre muestra únicamente el cambio documentado en `AGENTS.md` y los directorios nuevos `data/fuentes-externas/historia-at/`, `docs/` y `tools/historia-at/`.
- ISBE 1915 no se inició.
- No se realizará integración productiva ni procesamiento editorial adicional hasta revisión expresa.
