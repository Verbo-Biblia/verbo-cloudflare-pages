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

## Tarea 5 — Comparar Biblia lado a lado con Biblia en modo Prédica — PENDIENTE (guardada 2026-08-04)

Brief tal cual lo dio Juan, sin empezar todavía.

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
