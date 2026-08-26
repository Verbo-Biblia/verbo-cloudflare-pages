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

## Limitación de rendimiento conocida, sin resolver (para decisión de Juan)

`biblia/modules/commentaries/chrysostom-mateo/books/MAT.json` pesa **2,57
MB** — grande para el patrón de "comentarios" (aunque no atípico ahí: Calvin
sobre Jeremías pesa 4,8 MB, Matthew Henry sobre Mateo 2,7 MB), pero **muy**
atípico para `patristicByVerse`: los 11 módulos patrísticos existentes
pesan unos pocos KB cada uno.

El motivo por el que **no se dividió** este módulo en varios (a diferencia
del lado `patristic`) es que no serviría de nada con el mecanismo actual:
`loadLinkedEntries()` en `assets/module-loader.js` (usado tanto por
`patristicByVerse` como por `library`) siempre descarga el archivo
**completo** del libro declarado en el manifest — no existe ahí un
equivalente al `loadCommentaryIndex()` liviano que sí tienen los módulos de
`registry.json → commentaries`. Registrar el mismo contenido partido en 6
módulos habría significado que **los 6** se descargan igual en cualquier
capítulo de Mateo (cada uno declara el libro "MAT"), sumando el mismo total
de bytes, sin ahorro real — solo más archivos que mantener.

En la práctica esto significa: **cualquier capítulo de Mateo** (28 de 1189
capítulos de toda la Biblia, ~2,4%) dispara una descarga de 2,57 MB la
primera vez que se abre en la sesión (después queda en caché HTTP del
navegador mientras dure la sesión). Ningún otro libro ni comentario se ve
afectado — `loadLinkedEntries` corta antes de pedir el archivo cuando el
libro pedido no está en el manifest del módulo.

No se tocó `loadLinkedEntries` para agregarle un modo liviano tipo índice
porque (a) es una función compartida con "Biblioteca" y cualquier cambio
exige analizar el impacto ahí también, y (b) la instrucción explícita fue no
tocar el mecanismo común salvo que fuera imprescindible. Si Juan quiere
seguir agregando más libros de Crisóstomo (quedan 16: Juan, Hechos, Romanos,
1-2 Corintios, Gálatas-Filemón, Hebreos — todos con perfil de tamaño
similar), este costo se acumula por libro (no en total: cada libro solo
paga su propio costo al abrirse), y en algún punto sí conviene invertir en
un `loadLinkedEntries` con índice liviano antes de seguir. Queda como
recomendación pendiente, no ejecutada.
