# Popup Unificado de Notas — Fase 1-3 (investigación + plan de migración)

Estado: **pendiente de aprobación de Juan.** No se ha escrito ni modificado código de implementación (Fase 4-5). Este documento completa lo que `INVESTIGACION-NOTAS-UNIFICADAS.md` dejó sin verificar línea por línea, propone el `ref` de cada pestaña nueva y documenta el plan de migración de datos. Cero commits, cero pushes.

---

## Fase 1 — Verificación pendiente completada

### `data-entry-id` genérico vs. atributos por categoría

El reporte previo asumía que había que "crear" un gancho de anotación para las categorías nuevas. La realidad, verificada línea por línea, es más favorable: **las cuatro categorías (Historia/Padres, Costumbres, Extracanónico, Diccionarios) ya comparten exactamente el mismo patrón DOM** — un `<div class="dict-entry__term" data-X-entry-id="...">` con el id de la entrada actual — solo que cada una usa un **nombre de atributo distinto**:

| Categoría | Atributo en `.dict-entry__term` | Función de render | Línea |
|---|---|---|---|
| Historia (Iglesia) | `data-entry-id` | `renderPanel('historia')` (entry template genérico) | app.js:3977 |
| Padres Apostólicos | `data-entry-id` (+ `data-patristic-title`) | `renderPatristicSection` | app.js:4998 |
| Costumbres | `data-costumbres-entry-id` | `renderCostumbresEntry` | app.js:5334, atributo en 5358 |
| Extracanónico | `data-extracanonico-entry-id` | `renderExtracanonicoEntry` | app.js:5587, atributo en 5624 |
| Diccionarios | `data-diccionarios-entry-id` | `renderDiccionariosEntry` | app.js:5967, atributo en 5991 |

`historia-nota-rapida.js:42` hoy solo busca `data-entry-id` (por eso Costumbres/Extracanónico/Diccionarios "no tienen gancho" — el selector no las encuentra, no porque el DOM no exista). Confirmado con `grep -n "data-entry-id\|data-costumbres-entry-id\|data-extracanonico-entry-id\|data-diccionario" app.js`.

**Implicación para Fase 4 (no se implementa aún):** un helper `currentEntryInfo(categoria)` que pruebe la lista de atributos conocidos (o, más simple, que cada categoría declare su nombre de atributo en una tabla de configuración) es suficiente — no hace falta tocar el HTML/render de ninguna de las tres secciones existentes para exponer el gancho. Esto reduce el riesgo que el reporte anterior marcaba como "cada categoría se define desde cero".

### Confirmación de líneas del reporte previo

- `renderExtracanonicoEntry` **sigue en la línea 5587** — la referencia del reporte anterior sigue siendo válida pese a haberse escrito en una sesión posterior.
- `renderCostumbresEntry`: línea 5334 (confirmado), atributo `data-costumbres-entry-id` en línea 5358/5360, lectura/escritura de esas mismas líneas en 5378-5379.
- `renderDiccionariosEntry`: línea 5967 (no estaba en el reporte previo, ahora localizada), atributo `data-diccionarios-entry-id` en 5991/5993.
- Comentario en app.js:265-274 confirma explícitamente (palabras de quien escribió el código): Diccionarios y Extracanónico son "mismo patrón de 3 niveles" que Costumbres (estante → índice de la obra → entrada) — no son arquitecturas paralelas independientes, son la misma plantilla repetida tres veces con nombres de atributo distintos.

### Idiomas (Strong) — sin gancho, confirmado

`strongPopupEls().code.textContent` (app.js:4381) es la única fuente del código Strong actualmente mostrado; no existe ningún `data-entry-id` ni equivalente en el popup de Strong (`.strong-def-popup`, `openStrongPopup`/`renderStrongPopupEntry`, app.js:4348-4463). Esto confirma lo que ya anticipaba el reporte previo: el `ref` de Idiomas no es un documento/sección sino un código léxico que se repite en cientos de lugares del texto — un modelo estructuralmente distinto a los otros cinco.

---

## Fase 2 — `ref` propuesto por pestaña (para aprobación)

| Pestaña | Modelo | `ref` propuesto | Fuente del `ref` | Atributo/variable existente |
|---|---|---|---|---|
| Capítulo (Biblia) | Una nota, autoguardado — **sin cambios** | `` `${bookId}-${chapter}` `` | `data.meta.bookId`/`data.meta.chapter` | ya en uso, app.js:6198 |
| Historia (Iglesia) | Lista de N notas | id de la entrada de Historia | DOM `data-entry-id` | ya en uso |
| Padres Apostólicos | Lista de N notas (+ compatibilidad con la nota única existente, ver Fase 3) | `` `${patristicOpenDoc}-${section.n}` `` | variable `patristicRef` | ya en uso, app.js:4996 |
| Costumbres | Lista de N notas | id de la entrada (`entry.id` de `costumbresDocData.entries`) | DOM `data-costumbres-entry-id` | ya expuesto, solo falta que el lector genérico lo reconozca |
| Extracanónico | Lista de N notas | id de la entrada (`entry.id` de la obra) | DOM `data-extracanonico-entry-id` | ya expuesto, mismo caso que Costumbres |
| Diccionarios | Lista de N notas | id de la entrada (`entry.id`) | DOM `data-diccionarios-entry-id` | ya expuesto, mismo caso |
| Idiomas (Strong) | Lista de N notas, tratada como **glosario personal plano** (buscable por código, no por "documento actual") | código Strong (ej. `G2316`) | `strongPopupEls().code.textContent` | ya en uso para mostrar la definición; nunca usado para notas hoy |

Nota sobre Padres: hoy conviven `setNota` (nota única, `id="padres:"+ref`) y `addNota` (N notas, `id="padres:ref:timestamp:random"`) bajo el **mismo `ref`** (`patristicRef`). Esto no es un conflicto de `ref` — es un conflicto de cuántas notas puede haber por `ref`, tratado en Fase 3.

Todas las categorías nuevas usan `tipo` = su propio nombre (`costumbres`, `extracanonico`, `diccionarios`, `idiomas`) en `ubicacion.tipo`, análogo a como ya existen `biblia`, `historia`, `padres`. No requiere cambios de esquema en `backup.js` — `getNota`/`setNota`/`addNota`/`getNotas` ya aceptan cualquier string de `tipo` sin lista cerrada.

---

## Fase 3 — Plan de migración de datos existentes

### Qué existe hoy en `cached.notas` (verificado en backup.js:145-215)

Para `ubicacion.tipo IN ('historia','padres')` pueden coexistir, para el **mismo `ref`**, hasta dos registros con orígenes distintos:

1. **Nota única del editor embebido** (solo se usa hoy para `padres`, ver app.js:2458-2483; Historia dejó de usarlo, comentario explícito en app.js:2460-2462): `id = "padres:"+ref`, creada/actualizada por `setNota()`.
2. **N notas del modal "Nota rápida"** (`historia-nota-rapida.js`, ambos tipos `historia` y `padres` según desde dónde se abrió): `id = "${tipo}:${ref}:${timestamp}:${random}"`, creadas por `addNota()`, nunca editadas — solo creadas o borradas.

**Verificación clave:** `VerboBackup.getNotas(['historia','padres'])` (backup.js:179-181) ya filtra únicamente por `ubicacion.tipo`, sin distinguir el patrón de `id`. Es decir, **el panel "Notas de Historia" actual (`renderHistoriaNotasBody`, app.js:2407-2445) ya lista ambos orígenes juntos, sin ambigüedad, hoy mismo, en producción.** No hay ningún registro "invisible" ni fragmentado por el patrón de id — ambos tipos de nota ya se muestran, abren y borran de forma idéntica en la UI existente (misma función `historiaNotasRowHTML`, mismo `historiaNotaDetailHTML`).

**Conclusión de riesgo de migración:** no hay pérdida ni duplicación posible al mover esto al popup nuevo, **siempre que el popup reutilice `getNotas(['historia','padres'])` + `getNotaById`/`deleteNotaById` tal como están** (que es justo lo que pide el encargo, "generalizar `historiaNotasRowHTML`/`historiaNotaDetailHTML`/`renderHistoriaNotasBody`"). El array de datos no necesita ninguna transformación, split, ni normalización de `id` para la migración de UI. Los únicos casos a decidir (producto, no dato) son:

- **¿Qué pasa con la nota única del editor embebido de Padres al pasar a un modelo de lista?** Con los datos tal cual están, esa nota (`id="padres:"+ref`) simplemente aparecerá como **una fila más** en la lista de la pestaña "Historia/Padres" del popup nuevo — ya es indistinguible en la UI actual de las notas creadas por el modal (mismo `historiaNotasRowHTML`). No requiere migración de datos: es un cambio de UX (¿se sigue permitiendo "una nota fija reeditable" además de la lista, o el editor embebido desaparece del todo y esa nota pasa a ser una fila editable más?) que Juan debe confirmar antes de la Fase 4, porque afecta si se sigue llamando a `setNota` en algún punto del popup o si todo pasa a `addNota`/edición de nota existente por id.
- **No se requiere ningún script de migración de datos ni transformación de `cached.notas` para las notas ya existentes de Historia/Padres.** Sí se necesitará, en Fase 4, una función nueva de "editar nota existente por id" (hoy `addNota` crea y `deleteNotaById` borra, pero no hay un `updateNotaById` — el editor embebido edita vía `setNota` por `ref`, no por `id`). Este es un **agregado** a `backup.js` (nueva función), no una modificación de las funciones existentes ni del esquema — se declara aquí para que quede explícito antes de tocar ese archivo.

### Disciplina de `fecha_guardado`

Verificado en backup.js:100-117 y en cada función (`setNota`, `addNota`, `deleteNota`, `deleteNotaById`, `toggleMarcador`): **todas** las funciones que modifican contenido real ya bumpean `cached.fecha_guardado` explícitamente antes de `persist()`, y `persist()` mismo **no** lo toca (comentario explícito, incidente real de 2026-07-30 documentado en el propio código). `updateMarcadorContexto` es el único setter que deliberadamente NO bumpea `fecha_guardado`, porque es una acción pasiva (reabrir un libro).

**Regla para Fase 4:** cualquier función nueva de solo-lectura (abrir el popup, cambiar de pestaña dentro del popup, listar notas) debe usar únicamente los getters existentes (`getNota`, `getNotaObj`, `getNotas`, `getNotaById`, `getMarcadores`) — ninguno de ellos toca `persist()` ni `fecha_guardado`. Solo las acciones de guardar/borrar/editar contenido real deben pasar por `setNota`/`addNota`/`deleteNota`/`deleteNotaById`/la futura `updateNotaById`. Si se agrega alguna función de conveniencia (ej. "marcar como visto", "última pestaña abierta") debe seguir el patrón de `updateMarcadorContexto`, no el de `setNota`.

### Otras dos disciplinas ya confirmadas del esquema, sin cambios

- `getNotas()` filtra `n.texto?.trim()` (backup.js:180) — cualquier vista "todas las categorías" del popup debe mantener este filtro o aparecerán filas fantasma de notas vacías.
- `id = tipo==='biblia' ? ref : ...` en `setNota` (backup.js:168) — Biblia sigue siendo estrictamente una nota por capítulo; el encargo confirma que esto no cambia ("sin cambios respecto a hoy"), así que no aplica ningún riesgo de colisión de id en esta fase.

---

## Resumen de lo que Fase 4-5 va a necesitar tocar (para que Juan apruebe el alcance, no para implementar todavía)

- `backup.js`: agregar `updateNotaById(id, texto, {titulo, contexto})` (nueva función, mismo patrón que `setNota`/`addNota`, bumpea `fecha_guardado`). No se toca ninguna función existente.
- `app.js`:
  - Generalizar `historiaNotasRowHTML`/`historiaNotaDetailHTML`/`renderHistoriaNotasBody` (app.js:2375-2456) para aceptar cualquier `tipo`, no solo `['historia','padres']`.
  - Nuevo helper `currentEntryInfo(categoria)` (reemplaza/generaliza `historia-nota-rapida.js:41-50`) que sepa el nombre de atributo por categoría (tabla de la Fase 2).
  - Reemplazar el punto de entrada único: el click handler de `els.tabs` (app.js:6333-6397) — el `if(b.dataset.tab==='historia-notas'...)` (6348-6359) y el `if(tab==='notas')`/`openPanel('notas')` (6396, y su espejo en modo sermón, línea 1746/6390-6394) pasan a abrir el popup nuevo en vez de navegar de panel. Este es el punto donde ya existe precedente de "interceptar antes de la navegación normal de pestaña", así que no es una construcción desde cero.
  - Eliminar: `historiaNotaControlHTML`/`wireHistoriaNotaControl` (2458-2486, tras decidir qué pasa con la nota única de Padres), el ícono/lógica de `historia-notas` como pestaña independiente (6334-6359), y las invocaciones en 5002/5008.
- Eliminar `historia-nota-rapida.js` + `historia-nota-rapida.css` completos (258 líneas) tras confirmar que toda su lógica de guardado quedó cubierta por el popup nuevo vía `addNota`/`updateNotaById`.
- Construir el componente popup (drag/resize/overlay global) desde cero — no existe precedente en el repo (confirmado en el reporte anterior); `.strong-def-popup` y `.hnr-overlay` solo aportan referencia visual de z-index/overlay, ninguna lógica de interacción.

---

## Preguntas abiertas para Juan antes de Fase 4 (no asumidas, no resueltas unilateralmente)

1. **La nota única del editor embebido de Padres** (`setNota`, hoy visible como `<details>` siempre abierto en la lectura): ¿desaparece como concepto (todo pasa a ser "una fila más" de la lista, editable con la nueva `updateNotaById`), o se mantiene como una fila "fija"/destacada dentro de la lista de esa pestaña? Los datos no obligan ninguna de las dos — es decisión de UX.
2. **Idiomas como "glosario plano"**: ¿la pestaña Idiomas del popup se abre igual desde cualquier código Strong clicado en el texto (mostrando solo las notas de ESE código), o también ofrece una vista de "todas mis notas de Idiomas" sin código específico (como un índice), similar a como hoy funciona el panel de Historia? El encargo dice "buscable por código Strong, no anclada a documento actual" pero no aclara si hace falta un listado global dentro de esa pestaña.

Ninguna de estas dos preguntas bloquea el resto del plan — ambas son decisiones acotadas a un detalle de UX dentro de una pestaña, no al esquema de datos ni a la arquitectura del popup.

---

## Checklist de lo que NO se tocó en esta fase (confirmado)

- `backup.js`: solo se leyó, no se escribió. Ninguna función existente fue modificada.
- `sync.js`: no se abrió ni se tocó.
- Ningún módulo de contenido (`bibles/`, `commentaries/`, `patristic/`, `church-history/`, `extracanonico/`, `costumbres/`, `dictionaries/`).
- Cero commits, cero `git add`, cero push.

**Este documento espera aprobación de Juan antes de iniciar Fase 4 (implementación del componente popup) y Fase 5 (pestañas).**
