# Juan Crisóstomo — Homilías sobre Mateo (NPNF1-10)

## Corrección de arquitectura (Juan, 2026-08-26)

El plan original de Wave 1 trataba los seis recursos por igual, como módulos
de `biblia/modules/commentaries/` sin más. Juan corrigió esto a mitad de
tarea: Crisóstomo es un Padre de la Iglesia, así que este recurso pertenece
a la arquitectura de "Padres Apostólicos" (`biblia/modules/patristic/`,
lectura corrida por secciones), no a la lista plana de comentarios. Debe
seguir sincronizado verso a verso, pero por el mecanismo que ya usan Ignacio,
Policarpo, Ireneo, etc.: el mismo contenido se registra dos veces —

- `biblia/modules/patristic/chrysostom-mateo-<n>/` — lectura completa,
  esquema `sections.json`, registrado en `registry.json → patristic`.
- `biblia/modules/commentaries/chrysostom-mateo/` — el mismo contenido
  re-anclado a versículo, esquema estándar de comentario
  (`manifest.json` + `books/MAT.json`), registrado **solo** en
  `registry.json → patristicByVerse` (nunca en `commentaries`: esa lista es
  para el estante de comentarios reformados/protestantes).

## Fuente concreta

- Obra: *Nicene and Post-Nicene Fathers*, Serie I, Vol. X — Crisóstomo,
  *Homilies on the Gospel of Saint Matthew*, ed. Philip Schaff.
- Traducción inglesa: Sir George Prevost, revisada por M. B. Riddle.
- Edición impresa: Christian Literature Publishing Co., Nueva York, 1886/1888.
- Fuente digital: CCEL, ThML/XML versión 3.0.
- URL: `https://ccel.org/ccel/schaff/npnf110.xml`
- Tamaño: 3.956.654 bytes.
- SHA-256: `e110c98b1f444147bf7baf79e46e56ae6c6a1f0b2983e6fc52f2356fac7f858f`
- Licencia: dominio público (obra de 1888; digitalización CCEL sin
  restricciones adicionales declaradas en el `electronicEdInfo` del XML).

## Resolución de referencias (book/chapter/verse)

Cada homilía (`<div2 type="Homily">`) trae dos citas estructuradas de CCEL
que a veces no coinciden entre sí (ver ejemplos abajo). Se usa como fuente
primaria el `<scripRef>` dentro del párrafo de cita que sigue al encabezado
"Homily N." — es literalmente el encabezado impreso que ve el lector. Como
respaldo (cuando ese párrafo de cita no existe, ej. Homilía LXXI) se usa el
`<scripCom type="Sermon">`, la anotación propia de CCEL para "qué cubre este
sermón", que puede venir compuesta (varios puntos separados por `;` cuando
la cita es discontinua, ej. Homilía LXXIII: "Matt. 24:16,18").

Ejemplo de discrepancia real: Homilía V — el `<scripCom>` dice `Matt. 1:23,24`
pero el `<scripRef>` de la cita impresa dice `Matt. I. 22, 23`. Se usó el
`<scripRef>` (22–23) por ser el encabezado que efectivamente ve el lector.

Cuando la cita propia de una homilía es un solo punto sin final explícito
(ej. Homilía IV: "Matthew I. 17." sin rango), el final del rango se cierra
por transición al inicio de la siguiente homilía:

- Mismo capítulo: el final es un versículo antes del inicio de la siguiente.
- Capítulo distinto: el final es el último versículo del capítulo actual
  (tomado del texto KJV ya presente en Verbo,
  `biblia/modules/bibles/kjv-strong/books/MAT.json` — un dato bíblico real,
  no inventado).

Dos homilías no tienen un cierre seguro y se dejaron como un solo versículo
en vez de inventar un final (ver `coverage.json → openEndedHomilies`):

- **Homilía II** (Matt. 1:1): la Homilía III también empieza en Matt. 1:1 —
  ambas exponen el mismo versículo de apertura desde ángulos distintos, no
  hay "siguiente inicio" que sea posterior.
- **Homilía XXXVI** (Matt. 11:1): la Homilía XXXVII retoma Matt. 10:7-9 —
  Crisóstomo vuelve atrás de capítulo, así que el inicio de la homilía
  siguiente no sirve para cerrar el rango de la XXXVI.

## Tratamiento editorial

- **Epígrafe bíblico excluido**: el bloque de texto bíblico citado en
  cursiva, íntegro, que precede a cada homilía (heredero del "texto base
  antes del comentario") se excluye por redundante con la Biblia de Verbo.
  Detección: párrafo que empieza con comilla tipográfica de apertura (`“`) Y
  está mayoritariamente en cursiva — no una lista fija de clases CSS, porque
  esas clases (`c47`, `c48`, etc.) las asigna el conversor de CCEL por
  archivo y no son estables entre volúmenes NPNF distintos.
- **Citas integradas en la exposición se conservan** — solo se excluye el
  epígrafe inicial, no las citas que Crisóstomo intercala en su argumento.
- **Notas editoriales de NPNF1-10** (críticas textuales, variantes griegas,
  marcadas "—R." por el revisor M. B. Riddle) se conservan, movidas al final
  de cada entrada bajo "Notas del editor (NPNF1-10)" — mismo criterio que
  Lightfoot.
- **Griego preservado como Unicode plano**, sin `<span>` (no está en la
  lista de etiquetas permitidas). El texto griego del propio XML de CCEL
  tiene al menos un defecto de origen conocido: en el offset 128311 del XML
  fuente, la palabra que debería ser "παρέλκοντα" aparece como "παρλκοντα"
  (falta la "έ"). Es un defecto de la digitalización de CCEL, no de esta
  importación — se conserva tal cual, sin corregir, porque enmendar griego
  antiguo sin fuente adicional sería inventar contenido.
- **Una homilía = una entrada**, sin excepción — nunca se fragmenta una
  homilía en Parte 1/Parte 2 aunque su HTML supere los ~20.000 caracteres
  que limita el flujo de traducción; ese límite se resuelve (si hace falta)
  en el cliente, no partiendo el módulo.
- Portada del volumen ("Homilies of St. John Chrysostom, archbishop of
  constantinople, on the gospel according to st. matthew.") aparece dentro
  del mismo `<div2>` de la Homilía I, antes de su propio encabezado — se
  excluye explícitamente (bug detectado y corregido durante la validación,
  ver VALIDATION.md).

## Construcción

```bash
python3 tools/import_chrysostom_matthew.py
```

El importador descarga únicamente el XML oficial de CCEL, exige el tamaño y
SHA-256 documentados, y genera:

- 6 módulos `patristic` (`chrysostom-mateo-1`..`6`), divididos por cantidad
  de homilías (~14-15 cada uno) para no repetir el problema de tamaño que
  motivó dividir — un solo `sections.json` con las 86 homilías pesaría
  ~2,2 MB, muy por encima de cualquier otra obra patrística ya cargada en
  Verbo (la más grande hoy son ~10 KB). Precedente de la misma lógica que
  `chapterSplit` en comentarios grandes, aplicado aquí al esquema
  `patristic` (que no tiene ese flag).
- 1 módulo `commentaries/chrysostom-mateo` (patristicByVerse), sin dividir.

No modifica esquema, loader, cliente, Worker, caché ni sistema de
traducción.

## Limitación de rendimiento — resuelta (2026-08-26, mismo día)

`biblia/modules/commentaries/chrysostom-mateo/books/MAT.json` pesa 2,57 MB
— grande para "comentarios" (no atípico ahí: Calvin sobre Jeremías pesa
4,8 MB), pero muy atípico para `patristicByVerse`, donde los 11 módulos
existentes pesan unos pocos KB. Se detectó que `loadLinkedEntries()` en
`assets/module-loader.js` (compartida con "Biblioteca") siempre descargaba
el archivo **completo** del libro solo para calcular el badge "cuántos
fragmentos hay en este capítulo" — sin el equivalente liviano que
`loadCommentaryIndex()` ya da a `registry.commentaries`.

Juan pidió usar el criterio propio ("lo que consideres más inteligente").
Se optó por extender el mecanismo en vez de solo documentarlo, de forma
retrocompatible y quirúrgica:

- `loadLinkedEntries(manifestPath, bookId, chapter, {lightweight})` — nuevo
  cuarto parámetro opcional, `false` por defecto. Con `lightweight:true` Y
  el libro declarando `indexFile`, pide ese archivo en vez del completo.
  Sin `indexFile` (los 11 módulos patrísticos existentes, todos los de
  `library`), el comportamiento es idéntico al de antes — no se tocó nada
  para ellos.
- Los dos llamados de `buildChapterData()` que solo cuentan fragmentos para
  el badge (uno para `library`, otro para `patristicByVerse`) ahora pasan
  `{lightweight:true}`.
- Los dos llamados que sí necesitan el contenido completo para mostrarlo
  (`renderPatristicByVerse` en el panel "Padres Apostólicos → Por
  versículo", y el panel de Exégesis) **no** pasan el flag — siguen pidiendo
  el archivo completo como siempre, porque lo necesitan.
- `chrysostom-mateo/books/MAT.index.json` (11,7 KB: solo `id`+`reference`
  de las 86 entradas, sin `content`) generado por el propio
  `tools/import_chrysostom_matthew.py` y declarado en el manifest
  (`books[0].indexFile`).

Resultado verificado en navegador real: abrir cualquier capítulo de Mateo
ahora pide manifest.json (4KB) + MAT.index.json (11,7KB) — no los 2,57MB —
y los badges por versículo muestran los mismos conteos que antes del
cambio. Abrir "Por versículo → Crisóstomo" sigue pidiendo el archivo
completo correctamente, con el contenido real de cada homilía.

No se tocó ningún módulo existente de `patristicByVerse` ni `library`; sin
`indexFile` en su manifest, tanto antes como después de este cambio piden
exactamente el mismo archivo de siempre. Este mecanismo queda disponible
para los próximos 16 libros de Crisóstomo — cada uno debería generar su
propio `.index.json` igual que este.
