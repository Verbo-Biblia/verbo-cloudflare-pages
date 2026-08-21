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

## Flujo editorial y publicación por libro

1. Catalogar el facsímil de dominio público y descargar el PDF fuera del árbol
   versionado.
2. Extraer preferentemente su capa de texto con `pdftotext -raw`; comprobar
   visualmente el orden de las columnas antes de aceptar el OCR como base. Si un
   libro necesita `-layout` para recuperar sus límites históricos, se mantiene
   `ocr-unreviewed` hasta comprobar que las columnas no quedaron entrelazadas.
3. Ejecutar `audit_ocr.py` y documentar en `boundaries/<ID>.json` los límites
   cotejados contra el facsímil.
4. Cotejar cada entrada completa contra el facsímil y registrar correcciones o
   reemplazos reproducibles en `corrections/<ID>.json`.
5. Convertir el staging con `build_book.py` y auditarlo con
   `audit_staging.py`; ninguna señal automática sustituye el cotejo integral.
6. Clasificar cada entrada como `exposition` o `homiletics`, conservando el
   encabezado y el contenido inglés originales. No se pretraduce: cuando el
   módulo esté publicado, la traducción será bajo demanda por el pipeline
   existente de `POST /translate` y su caché en `SYNC_KV`.
7. Validar capítulos y rangos de inicio y fin contra la versificación de Biblia
   Verbo, incluidas listas discontinuas y diferencias de versificación.
8. Preparar `books/<ID>.json` y `books/<ID>.index.json` con
   `prepare_module_book.py`; esta preparación fuerza todas las entradas a
   `editorialStatus: ocr-unreviewed` y no registra el libro.
9. Obtener la aprobación manual de Juan. El estado global del libro solo puede
   pasar a `reviewed` cuando **todas** sus entradas fuente hayan sido cotejadas
   contra el facsímil.
10. Incorporar el libro aprobado a `manifest.json` y, únicamente en el paso de
    publicación autorizado, reconstruir los índices y el catálogo y registrar
    el módulo.

Orden recomendado: Filemón, Abdías, 2 Juan, 3 Juan y Judas primero, por ser
libros de un capítulo y menor riesgo; después Tito, 2 Pedro,
2 Tesalonicenses y Santiago. Génesis, Romanos y 1 Corintios quedan al final por
su volumen.

Las correcciones del cuerpo OCR se registran en `bodyTextCorrections` dentro
del archivo `corrections/<ID>.json`. Cada corrección debe indicar el capítulo,
la cadena OCR exacta, el texto corregido, la página física y la razón basada en
el facsímil. Si una cadena se repite, `occurrence` (comenzando en 1) identifica
la aparición que debe sustituirse. El conversor falla si no encuentra una
corrección declarada, para impedir que una regeneración la omita silenciosamente.

Cuando se usa una capa OCR alternativa, `--allow-unused-corrections` permite
conservar correcciones ligadas a la cadena exacta de otra capa; esta excepción
no omite la validación de capítulos, referencias ni rangos, y nunca concede
estado `reviewed` al artefacto preparado para el módulo.

Una entrada cotejada de principio a fin puede registrarse en
`entryTextReplacements`, identificada por capítulo, encabezado fuente, sección
(`exposition` u `homiletics`) y páginas físicas. Por compatibilidad, los
reemplazos antiguos sin `section` se interpretan como `exposition`. El conversor
sustituye solamente esa unidad y comprueba que el reemplazo se utilice. El
artefacto preparado para el módulo conserva siempre `editorialStatus:
ocr-unreviewed` hasta la aprobación manual de Juan.

En volúmenes que incluyen “Homilies by Various Authors”, el reemplazo registra
también `author` cuando el facsímil firma la entrada. El preparador usa ese autor
individual y solo recurre al autor general del libro cuando la fuente no aporta
una firma.

Cuando una entrada conserva afirmaciones cronológicas, arqueológicas, de
crítica textual o estadísticas propias de la erudición del siglo XIX que hoy
requieren cautela, el reemplazo puede declarar `editorialNote`. La nota se copia
como campo adicional al artefacto del módulo; nunca reemplaza, recorta ni
reescribe el contenido histórico original.

La conversión separa listas discontinuas: un encabezado como `Vers. 14, 16`
genera dos rangos independientes y nunca hace aparecer el comentario en el
versículo 15. Después de convertir, `audit_staging.py` vuelve a comprobar cada
rango contra Biblia Verbo y genera una cola de entradas cuyo OCR exige cotejo
visual. Una salida con `editorialStatus: ocr-unreviewed` jamás es publicable.
Las heurísticas no vuelven a encolar una entrada cuyo reemplazo completo ya fue
cotejado contra el facsímil y figura como `reviewed` en el staging; el artefacto
del módulo conserva de todos modos `ocr-unreviewed` hasta la aprobación de Juan.

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

## Ideas futuras (no implementadas)

### Sermones históricos como plantilla editable en el Editor de Sermones

Estado: idea aprobada por Juan, sin fecha ni diseño técnico. No implementar
sin instrucción explícita.

Concepto: además de que el material homilético de Pulpit Commentary
(entradas con section: "homiletics") aparezca como comentario visible en
modo prédica —comportamiento ya cubierto por la arquitectura actual, sin
cambios de código—, la idea adicional es permitir que el usuario tome un
sermón histórico de Pulpit y lo cargue como punto de partida DENTRO del
Editor de Sermones (sermonComparePanel en app.js), lo edite libremente, y
lo guarde como su propia versión (autoguardado, como ya funciona el
editor).

Esto es distinto de "mostrar comentario en modo prédica": es una función
de escritura nueva ("usar como plantilla") que clona contenido externo
hacia el estado editable del usuario. El editor hoy compara y muestra
contenido, pero no tiene un flujo de "importar como borrador propio".

Prerrequisitos antes de siquiera diseñarlo:

- Pulpit Commentary publicado con volumen suficiente para que valga la pena
  (no tiene sentido con solo Filemón).
- Definir si "usar como plantilla" crea una copia local (localStorage/
  IndexedDB, igual que el resto del editor) o si necesita algún otro
  mecanismo.
- Definir atribución: si el usuario edita un sermón de Eales/Pulpit y lo
  guarda como propio, ¿el editor conserva algún rastro de que partió de
  una fuente histórica, o queda como sermón nuevo sin marca?

No crear ningún código, componente ni campo de schema para esto ahora.
Es solo registro de la idea para revisarla cuando Pulpit esté publicado.
