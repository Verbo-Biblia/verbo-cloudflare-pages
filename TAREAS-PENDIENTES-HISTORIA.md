# Tareas pendientes — Historia de la Iglesia / Sermon Prep

Guardado el 2026-08-03. Ninguna de estas tareas está empezada — son solo
briefs a la espera de retomar. Borrar las secciones conforme se completen.

---

## Bug — traducción automática de Historia no funciona — RESUELTO (2026-08-04)

Causa real (no era el Service Worker): `contentLang()` leía el idioma de la
**Biblia activa** en vez del botón de idioma de interfaz (ES/EN) — mismo
bug reportado independientemente para Padres Apostólicos. Con la Biblia por
defecto en español, `contentLang()` devolvía `'es'` sin importar el botón,
así que `needsTranslation` en `applyChurchHistoryTranslation` nunca se
disparaba con el valor esperado en algunos flujos. Fix: `contentLang()`
ahora lee `VerboI18n.getUiLang()`. Probado en vivo: con el botón en ES, el
capítulo de Eusebio (fuente en inglés) traduce título y cuerpo a español;
con el botón en EN, el índice y los títulos de capítulo se muestran en
inglés. Fix ya publicado (commit `9c5567c`, mismo cambio en `contentLang()`
resolvió Padres, Historia y Comentario a la vez).

---

## Tarea 3 — Notas y marcadores en Historia de la Iglesia — COMPLETADA (2026-08-04)

Implementado como panel unificado **"Notas de Historia"** (índice de notas +
marcadores de Historia de la Iglesia y Padres Apostólicos juntos, en vez de
paneles separados por volumen): `backup.js` gana `getNotas()`, `getNotaObj()`,
`deleteNota()`, `getMarcadores()`, `isMarcado()`, `toggleMarcador()` — el
array `marcadores` ya reservado se reusó tal cual, con `ubicacion:{tipo,ref}`
(mismo patrón que `notas`). Control de marcar/anotar embebido al final de
cada entrada de Historia y cada sección de Padres. Ícono propio en el riel
izquierdo, debajo de Padres Apostólicos (decisión de Juan: no en el riel de
herramientas de estudio). Integración con Sermon Prep (punto 3 del brief
original) **no se hizo** — queda pendiente si Juan la pide más adelante.
Probado en vivo: crear nota, listarla, abrir, eliminar — funciona de punta
a punta. Commit `9c5567c`.

---

## Tarea 4 — Separar Biblia (modo Prédica) de Comparar versiones — COMPLETADA (2026-08-04)

Diagnóstico confirmó: instancias de estado totalmente separadas
(`sermonBible` vs. estado global de Comparar), compartían solo el mismo
botón/ícono (`data-tab="comparar"`) relabeleado a mano en JS
(`updateBibleTabForSermonMode`). Ya existía el patrón CSS exacto a replicar
(`.tab-rail__btn[data-tab="predicas"]{display:none} body.sermon-mode
...{display:flex}`, usado por "Mis prédicas").

Implementado: nuevo ícono `data-tab="sermon-biblia"` (mismo patrón CSS,
visible solo en modo Prédica) en el riel derecho, desktop y móvil.
`renderPanel` separa `tab==='comparar'` (siempre nativo, siempre visible,
Juan confirmó que debe quedar disponible también dentro de modo Prédica —
antes era imposible) de `tab==='sermon-biblia'` (siempre
`renderSermonBiblePanel`). Se eliminó `updateBibleTabForSermonMode()`
(ya no hace falta relabelear nada a mano). Probado en vivo: ambos íconos
visibles y funcionando de forma independiente dentro de modo Prédica; al
salir, "Biblia" y "Mis prédicas" vuelven a ocultarse y solo queda
"Comparar versiones".

---

## Tarea 5 — Comparar Biblia lado a lado con Biblia en modo Prédica — COMPLETADA (2026-08-04)

Implementado como segundo panel independiente (`#sermonComparePanel` /
`.sermon-compare-panel`), hermano de `#sidePanel` dentro de `.app-body`
(ya era flexbox) — no reemplaza el sistema de panel único, solo aplica
dentro de modo sermón. `renderCompare()` ganó parámetros de contenedor
destino (toolbarEl/bodyEl/selectId) para poder pintar en este segundo panel
sin colisionar con el panel único. Se cierra solo al salir de modo sermón.
Desactivado por completo en pantallas ≤900px (responsive quedó fuera de
alcance, como pedía el brief). Probado en vivo: Biblia + Comparar
simultáneos, toggle con el ícono y con el botón ✕, Comparar sin Biblia
abierta, salida de modo sermón con el panel abierto, y comportamiento
normal de "Comparar versiones" fuera de modo sermón sin cambios. Commit
`2c4f5e9`.

Brief original tal cual lo dio Juan, para referencia:

**Tarea:** cambiar el comportamiento del panel "Comparar Biblia" en el modo
predicación, para que se muestre simultáneamente junto al panel de Biblia en
vez de reemplazarlo u ocultarlo.

**Contexto:** en modo predicación, el usuario tiene un editor de texto
(sermón) y puede abrir un panel de Biblia con su ícono correspondiente. Hoy,
al tocar el ícono "Comparar Biblia", ese panel de comparación
reemplaza/oculta el panel de Biblia (o requiere cerrar uno para ver el
otro) — no es práctico para trabajar comparando versiones mientras se
escribe.

**Comportamiento deseado:**
1. Con el panel de Biblia abierto, al tocar el ícono "Comparar Biblia": el
   panel de Biblia se desplaza hacia la izquierda (no se cierra, sigue
   visible) y el panel de Comparar Biblia aparece a su derecha,
   empujándolo. Ambos paneles quedan visibles simultáneamente, lado a lado.
2. El área del editor de texto se reduce de ancho proporcionalmente para
   dar espacio a los dos paneles — sigue visible y editable, solo más
   angosta.
3. Al volver a tocar el ícono "Comparar Biblia" (toggle), el panel de
   comparación se retrae/cierra, y el panel de Biblia vuelve a su ancho
   normal, quedando solo él visible (como está hoy antes de abrir
   comparación).
4. Transición con animación suave (CSS transition en width/transform), no
   un salto abrupto.

**Alcance explícito:** este cambio aplica ÚNICAMENTE al modo predicación
(editor de sermón). No tocar el comportamiento de paneles de la app de
lectura bíblica normal (Comentario, Historia de la Iglesia, Notas, etc.) —
ese sistema de panel único intercambiable está bien como está y no se toca.

No es necesario resolver comportamiento responsive/móvil en esta tarea — el
modo predicación es un contexto de escritorio, distinto de la app
principal.

**Antes de escribir código:** identificar los archivos/componentes exactos
que controlan el layout del modo predicación (editor + panel Biblia + panel
Comparar Biblia) y confirmar si ya existe algún sistema de layout flexible
(flexbox/grid) que se pueda extender, o si hay que introducir uno.

**Reglas de entrega (igual que siempre):** `git add` solo de los archivos
tocados, uno por uno — no usar `git add -A`. Mostrar `git status` antes de
cada commit. No hacer push — Juan espera el resumen y diff para revisar.

---

## Tarea 6 — Bug: panel Historia de la Iglesia no vuelve al índice al reabrir — COMPLETADA (2026-08-04)

Diagnóstico confirmó: el estado (`churchHistoryOpenId`, `churchHistoryOpenVolume`,
`churchHistoryOpenFromShelf`, `churchHistorySearchActive`) vive en variables
de módulo de `app.js` que nunca se reseteaban — por diseño intencional de
una sesión previa (comentario explícito en el código: preservar posición
al cambiar de tab y volver a Historia). Juan confirmó que solo quiere el
reset al **cerrar el panel completo**, no al cambiar de tab y volver (eso
último debe seguir preservando la posición, sin cambios).

Implementado: `closePanel()` resetea las 4 variables cuando `activeTab==='historia'`
al momento de cerrar. Probado en vivo con Playwright: (1) abrir Historia →
libro → capítulo → cerrar panel (✕) → reabrir Historia → vuelve al estante,
correcto; (2) abrir Historia → libro (TOC) → cambiar a Comentario → volver
a Historia sin cerrar → conserva el TOC del libro, correcto. Commit
`cdf8489`.

**Bug original:** al cerrar el panel de Historia de la Iglesia (cambiando a
otro panel lateral o cerrándolo) y volver a abrirlo, el panel conserva el
estado del libro/capítulo que se estaba leyendo, en vez de volver al índice
de libros. El usuario tiene que navegar manualmente "atrás" para volver al
índice cada vez.

**Comportamiento esperado:** cada vez que el panel de Historia de la
Iglesia se abre desde la barra de íconos (después de haber estado
cerrado/oculto), debe mostrar el índice de libros por defecto, no el último
libro/capítulo leído.

**Antes de corregir:** identificar dónde se guarda el estado de
"libro/capítulo actualmente abierto" en Historia de la Iglesia y confirmar
si se resetea al cerrar el panel o si persiste en una variable/estado
global. Mostrar el approach antes de aplicar el cambio.

**Reglas de entrega:** `git add` solo de los archivos tocados. Mostrar
`git status` antes de cada commit. No hacer push.

---

## Tarea 7 — Bugs en el sistema de notas de Historia de la Iglesia

Guardado el 2026-08-04. Sin empezar.

Reporte de bugs en el sistema de notas de Historia de la Iglesia (modal
"Nota rápida" + lista de notas guardadas). Reproducir exactamente estos
pasos antes de tocar código.

**Bug 1 — el modal no se limpia entre notas:**
1. Abrir un libro, seleccionar texto, abrir el modal de nota (ícono "Notas
   de Historia"), escribir título+texto, Guardar, cerrar el modal.
2. Volver a abrir el modal para una nueva nota: el título y texto de la
   nota ANTERIOR siguen ahí, en vez de aparecer un formulario en blanco.

**Bug 2 — solo se guarda la última nota, no se acumulan:**
1. Guardar una primera nota (como en Bug 1).
2. Abrir el modal de nuevo, borrar el contenido anterior, escribir una nota
   distinta, Guardar.
3. Cerrar el libro y la sección de Historia de la Iglesia, abrir el
   listado de notas guardadas.
4. Resultado actual: solo aparece la última nota guardada. La primera
   desapareció — no se está agregando a un array, se está SOBREESCRIBIENDO
   un solo registro cada vez.

**Bug 3 — "Abrir" en una nota guardada no muestra la nota, abre el libro
completo:**
1. En el listado de notas guardadas, hacer clic en "Abrir" sobre una nota.
2. Resultado actual: abre todo el libro/capítulo de origen, obligando al
   usuario a buscar manualmente dónde estaba el fragmento citado.
3. Esperado: debe mostrar el contenido de la nota (título + texto
   guardado), no el libro de origen completo. Opcionalmente puede incluir
   un enlace/botón separado tipo "ver en contexto" que sí lleve al libro,
   pero eso no debe ser el comportamiento por defecto de "Abrir".

**Bug 4 — no se puede copiar el texto de la nota:**
- Agregar un botón "Copiar" en la vista de la nota guardada (usar
  Clipboard API estándar del navegador).

**Diagnóstico requerido antes de corregir:** revisar la función de
guardado de notas de Historia de la Iglesia y confirmar si escribe en un
array (push de nuevo objeto) o sobreescribe una key fija (esto último
explicaría el Bug 2). Confirmar también si el estado del formulario del
modal se resetea al cerrarlo (explicaría Bug 1). Mostrar el diagnóstico
antes de aplicar la corrección.

**Alcance:** estos bugs son específicos de las notas de Historia de la
Iglesia — verificar si comparten código con el sistema general de notas
(afectaría también notas de la Biblia normal) o si es una implementación
separada. Decir cuál es el caso antes de corregir.

**Reglas de entrega:** `git add` solo de los archivos tocados. Mostrar
`git status` antes de cada commit. No hacer push.

---

## Tarea 8 — Sincronizar referencia entre panel Biblia y Comparar Biblia (modo Prédica)

Guardado el 2026-08-04. Sin empezar.

El push/desplazamiento entre panel Biblia y panel Comparar Biblia en modo
predicación ya quedó funcionando correctamente (confirmado por Juan, ver
[[Tarea 5]]). Falta un comportamiento adicional: sincronización de
referencia (libro/capítulo/versículo) entre ambos paneles.

**Problema:** el panel Comparar Biblia no tiene su propio buscador de
cita — depende de que el usuario navegue manualmente ahí también, lo cual
es redundante ya que el propósito es comparar el MISMO pasaje en otra
versión.

**Comportamiento esperado:** cuando el usuario cambia de referencia en el
panel de Biblia principal (cambia de capítulo, de libro, o navega a un
versículo específico — ej. de Génesis 1 a Josué 3), el panel Comparar
Biblia debe actualizarse automáticamente a la misma referencia, sin acción
adicional del usuario.

**Antes de escribir código:** identificar cómo el panel de Biblia
expone/emite su referencia actual (evento, estado compartido, callback) y
si el panel Comparar Biblia ya escucha algo similar para otro propósito.
Confirmar el mecanismo antes de implementar el listener.

**Alcance:** solo modo predicación, solo dirección Biblia → Comparar (el
panel principal es la fuente de verdad de la referencia). No es necesario
sincronizar en sentido inverso salvo que sea trivial hacerlo con el mismo
mecanismo — si es trivial, decirlo y evaluarlo con Juan; si no, no
agregarlo.

**Reglas de entrega:** `git add` solo de los archivos tocados. Mostrar
`git status` antes de cada commit. No hacer push.
