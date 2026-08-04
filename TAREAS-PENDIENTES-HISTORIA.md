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
