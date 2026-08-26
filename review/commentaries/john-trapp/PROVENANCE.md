# John Trapp — Commentary (55 of 66 books)

## Decisión editorial (Juan, 2026-08-26)

Wave 1 había dejado este recurso detenido: los TEI/XML CC0 localizados
cubren 55 de los 66 libros canónicos (falta Josué, Jueces, Rut, 1–2
Samuel, 1–2 Reyes, 1–2 Crónicas, Juan y Hechos — sin transcripción CC0
localizada para ninguno). Juan indicó explícitamente publicar lo que
existe: *"John Trapp — Complete Commentary se sube lo que aya, preparalo"*.

En consecuencia el módulo se llama **"John Trapp — Commentary (55 of 66
books)"**, nunca "Complete Commentary" (que sí es el título impreso
original de Trapp) — tanto el nombre como la descripción del manifest
declaran explícitamente los 11 libros faltantes.

## Fuentes concretas

Los 6 volúmenes CC0 EEBO-TCP ya inventariados en `WAVE1-RESUME-STATE.md`,
re-descargados y re-verificados byte a byte en esta sesión:

| TCP | Libros | Edición | SHA-256 |
|---|---|---|---|
| A94797 | Génesis–Deuteronomio | Londres, 1649/1650 | `a1b0ef079a728f6ff40b8bc3d80bf5a413dca2cd6e08433eee4a62be293b05d5` |
| A63066 | Esdras, Nehemías, Ester, Job, Salmos | Londres, 1657 | `8899d8ef3b1af3be79b96feba3a19857f2c485854e98ab5e5789f22d0e991d4f` |
| A63069 | Proverbios–Daniel | Londres, 1660 | `0622c547e10058daae32da35e8cedef3e9cd5cc5e8eecf8c65315b8973248744` |
| A63068 | Doce Profetas Menores | Londres, 1654 | `1433f8113cb45b34400e1effacb259cdc15ff4789993ddff9348699457cab69b` |
| A63067 | Mateo, Marcos, Lucas | Londres, 1647 | `63d2f9a9e54439cce653aa8e3bac1bc5a6f622ef0d4fd74321dd8d02d7957c1f` |
| A63065 | Romanos–Apocalipsis | Londres, 1647 | `440b7caa1fc282bccd576ad0559dd29ac2fe6d788dcce7d9fbbf00756834dcf0` |

Licencia: CC0 1.0, transcripción codificada (Text Creation Partnership,
Universidad de Michigan y Universidad de Oxford). No incluye imágenes de
página ni archivos suplementarios.

A63068 también contiene "The Righteous Man's Recompence" (un tratado
sobre Malaquías 3:16-18, no comentario versículo a versículo) — excluido;
solo se importaron los 12 divs de comentario profético.

A63067 promete en su título "los cuatro Evangelios y los Hechos de los
Apóstoles", pero el XML concreto solo contiene 3 divisiones de comentario
(Mateo, Marcos, Lucas) y termina al final de Lucas 24 — confirmado de
nuevo esta sesión, igual que en la investigación previa. No hay Juan ni
Hechos en ningún volumen CC0 localizado.

## Dos encodings TCP distintos en el mismo recurso

A diferencia de Poole (comentario dentro de `<note>` anidados en párrafos
de texto bíblico), Trapp usa dos convenciones TCP completamente distintas
según el volumen:

**5 volúmenes (Pentateuco, Ezra–Salmos, Proverbios–Daniel, Profetas
Menores, Romanos–Apocalipsis):** el comentario vive directamente en
`<p>` sueltos bajo cada `<div type="chapter">` (o `<div type="Psalm">`
para Salmos). Cada párrafo que empieza un versículo nuevo lleva el
prefijo de texto plano "Verſe N." o "Ver. N." (a veces solo "Ver N."
sin punto); un párrafo sin ese prefijo continúa anotando el mismo
versículo que el párrafo anterior.

**1 volumen (A63067, los Evangelios):** estructura mucho más granular,
con un `<div type="verse" n="N">` por versículo, y dentro de cada uno,
uno o más `<div type="phrase">` — una por cada frase/palabra que Trapp
comenta dentro de ese versículo, cada una con su propio encabezado
(lema) y párrafo de exposición. `tools/import_trapp_commentary.py`
implementa `build_book()` para el primer patrón y `build_gospel_book()`
para este segundo, despachando por `source_id`.

## Números de capítulo: no siempre confiables, corregidos con evidencia

Los encabezados impresos ("CHAP. N.") son correctos en la inmensa mayoría
de los casos, pero no siempre. Se verificaron a mano todas las
discrepancias que el algoritmo de resolución (`resolve_chapter_numbers()`
en el importador) no pudo resolver por sí solo:

- **Éxodo e Isaías** bundlean deliberadamente varios capítulos reales bajo
  un solo `<div>` ("CHAP. XXXVI, XXXVII, &c." en Éxodo; "CHAP. XXXVI. and
  CHAP. XXXVII." en Isaías). Verificado a mano: el único párrafo de cada
  uno de esos divs es una remisión de una línea ("For theſe two Chapters,
  see 2 King. 18, and 19...") — no hay contenido real de los capítulos
  plegados que se pierda al etiquetarlos bajo el primer número.
- **Génesis, Éxodo, Levítico, Números y Deuteronomio** repiten el mismo
  error de imprenta en dos puntos: un capítulo "XV" impreso como "XXV", y
  un capítulo "XXIX" impreso como "XXVI" — idéntico en los 5 libros del
  mismo volumen (A94797), consistente con un error físico del taller de
  imprenta de 1649/1650 (probablemente reutilización de un mismo tipo
  móvil dañado), no una serie de erratas independientes. Corregido por
  posición (el capítulo real es el siguiente a la secuencia ya
  establecida), nunca por adivinación aislada: el algoritmo solo aplica
  esta corrección cuando el salto NO fue anunciado por un div previo tipo
  "bundle" (ver arriba) — de lo contrario habría aceptado por error el
  salto de Éxodo.
- **Salmos**: el Salmo 1 no tiene `<div>` propio en esta transcripción TCP
  (el primer div presente ya está indexado como "2"); hay además una
  etiqueta "CXLVI" duplicada más adelante. La posición secuencial (con un
  desplazamiento fijo de +2) es la única fuente confiable aquí — verificado
  contra el último div, correctamente etiquetado "PSAL. CL." (150).
- **Lucas 20**: encabezado impreso "CHAP. X X." (con un espacio suelto
  entre las dos X) — capturado por el algoritmo general sin necesidad de
  caso especial.

Cada corrección aplicada queda registrada en
`biblia/modules/commentaries/trapp-commentary/coverage.json` →
`anomalies` (22 en total).

## Versículos excluidos: errores de imprenta verificados contra KJV

9 versículos se excluyeron del módulo (no se adivinó su número real,
aunque en varios casos pudo identificarse con certeza comparando el texto
citado contra el KJV):

| Referencia impresa | Texto citado por Trapp | Coincide con KJV en | 
|---|---|---|
| Gen 8:27 | "While the earth remaineth..." | Génesis 8:22 |
| Deu 21:27 | "And they shall answer" | Deuteronomio 21:7 |
| Pro 15:47 | "He that is greedy of gain troubleth his own house" | Proverbios 15:27 |
| Pro 23:36 | "They have stricken me" | Proverbios 23:35 |
| Pro 27:33–37 (5 entradas) | "Be thou diligent to know the state..." | Proverbios 27:23–27 |
| Ecc 1:19 | "I communed with mine own heart" | Eclesiastés 1:16 |
| Sng 6:19 | "My Dove, mine undefiled is but one" | Cantares 6:9 |
| 1Th 2:29 | "For ye are our glory and joy" | 1 Tesalonicenses 2:20 |

No se corrigieron y republicaron con el número real: serían 9
correcciones aisladas, sin el mismo patrón sistemático y verificable que
las de capítulo (arriba), y el riesgo de una atribución incorrecta pesa
más que la pérdida de 9 versículos sobre 18.969 entradas (0.05%).

## Bugs de parseo encontrados y corregidos en esta sesión

1. **Palabra "Ver" sin "s/ſ" no reconocida** (ej. "Ver 3." en vez de
   "Verſe 3."/"Ver. 3."): el regex original exigía la letra s/ſ. Corregido
   a `Ver(?:[ſs]e?)?` — esto solo, aplicado a los 5 volúmenes de párrafos
   sueltos, subió el total de entradas de 11.874 a 17.060 (+44%): Levítico
   pasó de 28 a 466 entradas, por ejemplo.
2. **Nota marginal intercalada entre "Verſ." y el número** (ej. "Verſ.
   ⟨nota: Martial.⟩ 15." parseado como verso "M" = 1000): corregido
   detectando el número sobre el texto sin notas
   (`text_excluding_notes()`), y tolerando un paréntesis intercalado al
   quitar el prefijo del HTML ya renderizado.
3. **Número romano confundido con el inicio de una palabra normal**
   (ej. "Verſ. Martial." capturaba solo "M" antes del bug #2 exponer el
   problema real): se agregó `(?![A-Za-z])` tras cada captura de numeral,
   en la cita de capítulo y de versículo.
4. **IDs duplicados en los Evangelios**: algunos versículos tienen dos
   `<div type="verse">` separados con el mismo número (ej. Mateo 9:14
   aparece dos veces, cada una con sus propias frases). Se fusiona el
   contenido en una sola entrada por `(capítulo, versículo)`, mismo
   principio que usa Poole para notas partidas.

## Construcción

```bash
python3 tools/import_trapp_commentary.py
```

Descarga los 6 XML oficiales de TCP, exige los 6 SHA-256 documentados
arriba, y genera `biblia/modules/commentaries/trapp-commentary/`
completo (manifest, 55 archivos `books/*.json`, `coverage.json` con las
22 anomalías registradas). No modifica esquema, loader, cliente, Worker,
caché ni sistema de traducción — sí se registró en
`registry.json → commentaries` (Trapp no es Padre de la Iglesia; a
diferencia de Crisóstomo, corresponde a la lista normal de comentarios,
confirmado con Juan).
