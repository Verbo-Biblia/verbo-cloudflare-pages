# The Pulpit Commentary: edición de Verbo

Esta carpeta contiene las herramientas de preparación de una edición digital
propia de *The Pulpit Commentary*. No se usan ni se convierten archivos de
Olive Tree, BibleHub, StudyLight ni otras ediciones electrónicas comerciales.

## Fuente autorizada

La fuente primaria son facsímiles de ediciones históricas publicados por
Theology on the Web / BiblicalStudies.org.uk y marcados individualmente como
`Public domain`. Cada libro debe conservar en `sources.json` la página
bibliográfica y el PDF exactos empleados.

La primera fuente auditada es:

- Thomas Whitelaw, *Genesis*, en H. D. M. Spence y Joseph S. Exell (eds.),
  *The Pulpit Commentary*, nueva edición, Funk & Wagnalls, 1907.
- Ficha: <https://biblicalstudies.gospelstudies.org.uk/book_genesis_pulpit-commentary_whitelaw.html>
- Facsímil: <https://biblicalstudies.gospelstudies.org.uk/pdf/pulpit-commentary/ot/01_genesis_pulpit-commentary_whitelaw.pdf>
- La ficha declara expresamente `Copyright Holder: Public domain`.

`supplemental-sources.json` registra facsímiles u OCR adicionales usados para
cotejo. Estos nunca sustituyen la prueba de dominio público de `sources.json`.
Si un archivo aportado por un tercero es una recompresión, se documentan por
separado su hash y los hashes del archivo canónico para no presentarlos como si
fueran idénticos.

## Flujo de preparación

1. Descargar el PDF fuera del árbol versionado.
2. Extraer su capa de texto con `pdftotext -raw`. Los facsímiles suelen tener
   dos columnas y la extracción con `-layout` puede entrelazarlas dentro de una
   misma entrada. Antes de convertir un libro, comprobar visualmente en varias
   páginas que el orden de lectura conserva primero la columna izquierda y luego
   la derecha.
3. Ejecutar `audit_ocr.py` para medir capítulos y marcadores de versículos.
4. Corregir el OCR contrastándolo con la imagen del facsímil. Los límites que
   el OCR no pueda reconocer se documentan en `boundaries/<ID>.json`, con la
   página física y la página impresa donde fueron comprobados visualmente.
5. Convertir únicamente el texto verificado al esquema de comentarios de Verbo.
   Cada exposición u homilía debe conservar una referencia de inicio y fin para
   que aparezca al seleccionar cualquiera de los versículos que realmente trata.
6. Validar cada rango contra la versificación de Biblia Verbo, además de validar
   capítulos, JSON e índices, antes de registrar el módulo.

Las correcciones del cuerpo OCR se registran en `bodyTextCorrections` dentro
del archivo `corrections/<ID>.json`. Cada corrección debe indicar el capítulo,
la cadena OCR exacta, el texto corregido, la página física y la razón basada en
el facsímil. Si una cadena se repite, `occurrence` (comenzando en 1) identifica
la aparición que debe sustituirse. El conversor falla si no encuentra una
corrección declarada, para impedir que una regeneración la omita silenciosamente.

Una entrada cotejada de principio a fin puede registrarse en
`entryTextReplacements`, identificada por capítulo, encabezado fuente y páginas
físicas. El conversor sustituye solamente esa unidad, comprueba que el reemplazo
se utilice y le asigna `editorialStatus: reviewed`; el resto del libro conserva
`ocr-unreviewed`. Esto permite avanzar entrada por entrada sin presentar como
revisado texto que todavía depende del OCR.

La conversión separa listas discontinuas: un encabezado como `Vers. 14, 16`
genera dos rangos independientes y nunca hace aparecer el comentario en el
versículo 15. Después de convertir, `audit_staging.py` vuelve a comprobar cada
rango contra Biblia Verbo y genera una cola de entradas cuyo OCR exige cotejo
visual. Una salida con `editorialStatus: ocr-unreviewed` jamás es publicable.

No debe publicarse OCR crudo. La prueba inicial de Génesis confundió, entre
otros casos, `God`/`Goel`, `truth`/`troth`, `verse`/`vcr.` y omitió varios
encabezados de capítulo. La ausencia de un encabezado tampoco autoriza a
atribuir automáticamente el texto al capítulo anterior.

Cuando la capa de texto incrustada sea demasiado defectuosa,
`ocr_facsimile.py` puede generar un segundo OCR auxiliar con RapidOCR. Las
regiones de lectura, verificadas visualmente y expresadas en coordenadas
normalizadas, se guardan por libro en `ocr-layouts/`. Esta salida tampoco es
publicable: sirve para comparar lecturas y encontrar correcciones que siempre
deben resolverse contra la imagen del facsímil.

## Auditoría inicial

```bash
pdftotext pulpit-genesis.pdf pulpit-genesis.txt
python3 tools/pulpit-commentary/audit_ocr.py \
  --source pulpit-genesis.txt --book GEN --chapters 50 \
  --verified-boundaries tools/pulpit-commentary/boundaries/GEN.json
```

El comando termina con estado distinto de cero mientras falten capítulos. Esa
condición es intencional: evita que un OCR parcial llegue al catálogo público.
