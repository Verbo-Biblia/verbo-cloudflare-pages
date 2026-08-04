# Tareas pendientes — Historia de la Iglesia / Sermon Prep

Guardado el 2026-08-03. Ninguna de estas tareas está empezada — son solo
briefs a la espera de retomar. Borrar las secciones conforme se completen.

---

## Bug — traducción automática de Historia no funciona (atender antes de Tarea 3)

Reportado por Juan en producción el 2026-08-03: el panel de Historia de la
Iglesia no traduce — ni libros en inglés a español, ni títulos a inglés.

**Antes de asumir que es un bug de código nuevo**: el mismo día se encontró
que `service-worker.js` cacheaba `registry.json`/`entries.json` de forma
permanente (cache-first sin `?v=`) causando contenido vacío en móvil — ver
el fix en el commit del 2026-08-03 (bump de `CACHE_VERSION` a
`verbo-biblia-v17-historia-estante` + `Response.error()` en `cacheFirst()`).
Confirmar primero si el problema de traducción persiste DESPUÉS de que Juan
actualice a esa versión del Service Worker (banner "Actualizar ahora", o
limpiar datos del sitio) — es muy posible que sea el mismo problema de
caché disparando `getJSON`/fetch fallidos, no un bug nuevo en la lógica de
traducción.

Si persiste después de confirmar la versión del SW: revisar
`applyChurchHistoryTranslation` / `applyChurchHistoryResultsTranslation` en
`biblia/assets/app.js`, y el servicio de traducción que usan
(`translateEntry`/`translateCommentaryHeader`, backend MyMemory) — confirmar
si el servicio externo está devolviendo error, si `contentLang()` está
devolviendo el valor esperado, y si `entry.sourceLang` se está leyendo bien
en las entradas de los 4 volúmenes (incluido el nuevo `npnf2-continuadores`).

---

## Tarea 3 — Notas y marcadores en Historia de la Iglesia

**No empezar hasta que el estante de portadas (commits `b71df77`, `2f13914`,
`33d3ec7`, `cae2c3b`, más el fix de `service-worker.js` del 2026-08-03) esté
validado en producción por Juan** (desktop y móvil).

### Contexto confirmado (no re-auditar)

- El sistema de notas de Biblia guarda cada nota en un array `notas` dentro
  de IndexedDB (vía `biblia/assets/backup.js`, no localStorage), con esta
  forma:
  ```js
  { id, ubicacion: { tipo: 'biblia', ref: 'ROM-8' }, texto, fecha }
  ```
- `ref` en Biblia se compone como `${bookId}-${chapter}` (ver `renderNotes()`,
  `app.js` ~línea 3209). `getNota(ref)` / `setNota(ref, texto)` en
  `backup.js:146-155` filtran por `ubicacion.tipo==='biblia' &&
  ubicacion.ref===ref`.
- En Historia, cada entrada ya tiene un `id` estable que por sí solo codifica
  libro+capítulo (ej. `eusebio-he-l1-c1`) o autor+libro+capítulo (ej.
  `npnf2-socrates-l1-c1`). No hace falta componer nada — ese `id` es
  directamente el `ref`.
- **Hallazgo importante sin explotar todavía:** `backup.js` ya tiene un array
  `marcadores: []` reservado en `emptyData()` (línea 48) y normalizado en
  `init()`/`replaceData()`/`importFromFile()` — pero hoy no existe ningún
  getter/setter que lo use; está vacío en todos los usuarios. Antes de crear
  un array nuevo `marcadoresHistoria`, evaluar si conviene reusar este mismo
  array genérico con `ubicacion: {tipo: 'historia', ref}` (mismo patrón que
  `notas`/`resaltados`), en vez de inventar una estructura paralela.

### Objetivo — dos funciones que comparten la misma mecánica de `ref`

#### 1. Notas en Historia (extensión aditiva del esquema existente)

Nueva variante de `ubicacion.tipo`:
```js
{ id, ubicacion: { tipo: 'historia', ref: '<id de la entrada>' }, texto, fecha, titulo }
```

- **Campo `titulo` nuevo (opcional, elegido por el usuario al crear la
  nota).** Si el usuario no escribe título, cae a un título generado
  automáticamente a partir de la referencia (ej. "Historia Eclesiástica —
  Libro I, Cap. I"), nunca queda en blanco.
- Este campo `titulo` es aditivo también para las notas de Biblia existentes
  (mismo esquema, mismo array) — las notas ya guardadas simplemente no
  tienen `titulo` hasta que el usuario las edite; no requiere migración,
  solo fallback al título autogenerado cuando el campo no existe.
- Ajustar `backup.js` para que `getNota(ref)` / `setNota(ref, texto)`
  acepten un parámetro de `tipo` (o una función paralela
  `getNotaHistoria(ref)` si es más limpio con el patrón existente — decidir
  cuál encaja mejor antes de programar).
- En el panel de Historia, agregar el mismo control de notas que ya existe
  en Biblia (mismo componente visual si es reutilizable, o una copia mínima
  si el DOM no lo permite directamente) — usando `churchHistoryOpenId`
  (variable de estado ya existente en `app.js`) como `ref`, y un campo de
  texto simple para el `titulo` al guardar.

#### 1b. Índice de notas — buscador con predicción, no solo lista

"Mis Notas en Historia" necesita un buscador con autocompletado/predicción
a medida que el usuario escribe, filtrando por:
- `titulo` de la nota (elegido por el usuario) — prioridad más alta en el
  matching.
- Título del libro/capítulo (ej. "Historia Eclesiástica", "Libro I").
- Texto de la nota, como fallback si no hay coincidencia en título.

Componente tipo campo de búsqueda + lista desplegable de resultados en
vivo — revisar si el patrón visual de `churchHistoryPredictions` /
`renderChurchHistoryPredictions` (`app.js`, ya usado por el buscador de
Historia) es reutilizable antes de construir uno nuevo. Al elegir un
resultado, abre directo la entrada correspondiente con la nota visible.

#### 2. Marcadores de capítulo (Nivel 1 — no resaltado de frases)

- Ver hallazgo del array `marcadores` ya reservado arriba — decidir si se
  reusa con `ubicacion:{tipo:'historia',ref}` o si se crea
  `marcadoresHistoria` aparte, y por qué.
- Control tipo estrella/marcador en cada entrada de Historia, que
  guarda/quita el `id` actual de `churchHistoryOpenId`.
- Panel "Mis marcadores" (puede vivir junto a "Mis Prédicas" en el sidebar,
  o como pestaña dentro del propio panel de Historia — proponer ubicación
  antes de construir).
- Cada marcador en la lista abre directo la entrada correspondiente
  reutilizando `renderChurchHistoryEntry(id)` (ya existe, no crear función
  nueva de apertura).

#### 3. Integración con Sermon Prep

- **No basta con un botón "copiar" desde el panel de Historia.** "Mis
  Marcadores" (y las notas de Historia) deben ser **visibles y accesibles
  directamente dentro del modo Prédica** — quien escribe un sermón necesita
  poder consultarlos ahí mismo, sin salir del editor.
- Sermon Prep ya tiene un mecanismo de "cross-reference history stack" para
  pasar referencias bíblicas al sermón en preparación. Revisar cómo está
  implementado hoy (qué función lo alimenta, qué formato de dato espera,
  dónde vive visualmente dentro del modo Prédica) y replicar el mismo
  patrón de UI para una sección nueva de "Marcadores de Historia" — mismo
  lugar/mecanismo que el stack bíblico, no un panel aparte con lógica
  distinta.
- Desde esa vista dentro de Prédica, cada marcador/nota debe poder
  insertarse en el sermón con un solo clic, igual que ya funciona con las
  referencias bíblicas.
- Si el stack bíblico vive en un panel lateral o pestaña dentro del editor,
  la sección de Historia debería vivir ahí mismo (como pestaña adicional o
  sección plegable), no en una ubicación distinta — proponer dónde encaja
  mejor antes de programar.

### Restricciones

- No tocar `entries.json` de ningún volumen, ni el índice semántico.
- No usar `git add -A`. `git status` antes de cada commit. Sin push sin
  revisión.
- Commits separados: (1) extensión de notas, (2) marcadores.

### Antes de escribir código, responder

1. ¿`getNota`/`setNota` con parámetro de tipo, o funciones paralelas? Con
   recomendación.
2. ¿Dónde vive el panel "Mis marcadores"?
3. Confirmar que el sync existente (magic link → Cloudflare KV) absorbe el
   array nuevo/reusado sin cambios estructurales al backend.
4. Cómo funciona hoy el cross-reference history stack de Sermon Prep (qué
   función lo alimenta, formato de dato, dónde vive en la UI del editor) +
   propuesta de integración para "Marcadores de Historia".
5. ¿Existe componente de autocompletado reutilizable en Historia, o hay que
   construir uno nuevo para el índice de notas?

---

## Tarea 4 — Diagnóstico: separar Biblia (modo Prédica) de Comparar versiones

**Solo diagnóstico, sin código todavía.**

### Contexto

Hoy, cuando el usuario está en Sermon Prep (modo Prédica) y necesita ver la
Biblia, usa el mismo icono/panel que "Comparar versiones" en el icon bar
lateral. Separarlos visualmente: un icono de "Biblia" que solo aparezca en
modo Prédica, y el icono de "Comparar versiones" que solo aparezca fuera de
ese modo — para que el usuario no confunda ambas funciones.

### Lo que hay que confirmar antes de programar

1. ¿La Biblia que se muestra dentro de Sermon Prep es literalmente el mismo
   componente/panel de "Comparar versiones" reutilizado (mismo código,
   mismo estado), o es una instancia separada que solo se ve parecida? Si
   es el mismo componente: ¿qué estado comparten (versión seleccionada,
   capítulo actual, posición de scroll)? ¿Separar el punto de entrada
   rompería algo de ese estado compartido?
2. ¿Ya existe una variable o mecanismo de "modo actual" (ej. `currentMode`,
   `sermonPrepActive`) que el resto de la UI ya consulta para saber si el
   usuario está en Sermon Prep? Nombre exacto y dónde se declara/actualiza.
   Si no existe: ¿cómo sabe hoy el código que debe mostrar el panel de
   Biblia en vez de otra cosa cuando se abre Sermon Prep?
3. ¿Cómo está armado el icon bar lateral hoy? ¿Lista estática siempre
   visible, o ya hay lógica condicional que oculta/muestra iconos según
   contexto? Si ya existe ese patrón condicional en cualquier otro icono,
   es el patrón a replicar aquí.
4. Si se separan los dos iconos, ¿hay algún flujo hoy que dependa de que
   ambos apunten al mismo panel? (ej. abrir "Comparar versiones" mientras
   se está en modo Prédica — ¿pasa algo raro, o es un caso que no ocurre
   hoy porque el mismo botón cubre ambos usos?)

### Formato de respuesta esperado

Texto plano, punto por punto, sin modificar ningún archivo. Al final,
estimación honesta de complejidad: ¿"ocultar/mostrar un icono según una
condición ya existente" (cambio pequeño), o hay estado
compartido/lógica enredada que desenredar primero (cambio más grande)? Si
es lo segundo, especificar qué habría que desenredar.
