# Investigación Paso 0 — Sistemas de notas actuales (para diseñar el popup unificado)

Fecha: 2026-08-25. Solo lectura, cero cambios de código. Este documento es el insumo para que Claude (chat) diseñe la arquitectura del popup unificado de notas con pestañas (capítulo, historia, diccionarios, extracanónico, costumbres/tradiciones, idiomas). No propone arquitectura nueva — solo documenta el estado actual.

---

## 1. Diagrama — cómo se relacionan hoy los dos sistemas de notas

```
                    ┌─────────────────────────────────────┐
                    │   backup.js (window.VerboBackup)     │
                    │   Fuente única de verdad, IndexedDB  │
                    │   store 'kv', clave 'unified-data'    │
                    │   cached.notas = [ ... ]  (UN array)  │
                    └───────┬───────────────┬───────────────┘
                            │               │
              setNota/getNota/           addNota/getNotaById/
              getNotaObj/deleteNota      deleteNotaById
              (backup.js:151-188)        (backup.js:194-215)
              "una nota por ubicación"   "N notas por ubicación"
                            │               │
            ┌───────────────┘               └────────────────┐
            │                                                 │
   ┌────────▼─────────┐                          ┌────────────▼────────────┐
   │ Notas de capítulo │                          │ historia-nota-rapida.js │
   │ (Biblia, tipo=    │                          │ (modal "Nota rápida")   │
   │ 'biblia')         │                          │ tipo='historia'|'padres'│
   │ app.js:6196-6202  │                          │ archivo completo        │
   └───────────────────┘                          └──────────────────────────┘
                                                                │
                                                    ┌────────────▼────────────┐
                                                    │ Editor embebido en      │
                                                    │ vista de lectura Padres │
                                                    │ tipo='padres', usa      │
                                                    │ setNota (no addNota!)   │
                                                    │ app.js:2458-2483        │
                                                    └──────────────────────────┘
                                                                │
                                                    ┌────────────▼────────────┐
                                                    │ Panel "Notas de         │
                                                    │ Historia" (lista/buscar/│
                                                    │ borrar, tipo historia+  │
                                                    │ padres combinados)      │
                                                    │ app.js:2344-2456        │
                                                    └──────────────────────────┘
```

**Hallazgo central:** ambos sistemas ya comparten el mismo backend y el mismo esquema de datos (`cached.notas`, un solo array, diferenciado por `ubicacion.tipo`). No son dos estructuras de datos distintas — son dos **patrones de UI** distintos sobre la misma tabla. Esto reduce el riesgo de "unificar esquemas"; el riesgo real está en la UI (ver sección 6).

Un tercer sistema tangencial y genérico por `tipo`: `toggleMarcador`/`isMarcado`/`updateMarcadorContexto` (backup.js:224-262). Hoy solo dos consumidores lo usan: el panel "Notas de Historia" (`getMarcadores(['historia','padres'])`, app.js:2423) y, fuera de `biblia/`, `libreria/assets/mi-biblioteca.js:28,33,38,44,51,59` con `tipo='libreria-libro'`. Ningún consumidor lo usa hoy para Biblia, Diccionarios, Costumbres o Extracanónico.

---

## 2. Tabla comparativa: notas de capítulo vs. notas de historia

| Aspecto | Notas de capítulo (Biblia) | Notas de historia/padres |
|---|---|---|
| Función de guardado | `VerboBackup.setNota(ref, texto, {tipo:'biblia'})` — **una por ubicación**, sobreescribe | Dos mecanismos coexisten: `addNota` (múltiples, modal) y `setNota` (una, editor embebido) |
| Clave de ubicación (`ref`) | `` `${bookId}-${chapter}` `` (app.js:6198) | `data-entry-id` del DOM (historia-nota-rapida.js:44) o `patristicRef` (app.js:5008) |
| Campos del objeto nota | `{id, ubicacion:{tipo:'biblia',ref}, texto, fecha}` — sin `titulo`/`contexto` en la práctica | `{id, ubicacion:{tipo,ref}, texto, fecha, titulo, contexto:{obra,capitulo}}` — `titulo`/`contexto` sí se usan |
| Id generado | `id = ref` (ej. `"GEN-1"`) | Editor embebido: `id = "padres:"+ref`. Modal rápido: `id = "historia:REF:timestamp:random"` (backup.js:196) — nunca colisiona |
| UI / contenedor | `<textarea>` en el panel lateral derecho normal (`#panelBody`), pestaña `notas` | Dos UIs: (a) `<details>` embebido en la vista de lectura de Padres (app.js:2463-2472); (b) modal centrado overlay `.hnr-overlay` (fixed, z-index:3000) |
| Posición/movilidad | Fija, dentro del flujo normal del panel — no flotante | Editor embebido: fijo, inline. Modal: centrado en viewport, no draggable/resizable (solo `resize:vertical` nativo del `<textarea>`) |
| Apertura/cierre | Cambiar de pestaña (`tab==='notas'`) | Editor embebido: siempre visible al leer una entrada de Padres. Modal: ícono lateral dispara `openForCurrentEntry(tipo)` (app.js:6348-6356) solo si hay entrada abierta |
| Guardado | Autoguardado con debounce 400ms (app.js:6201) | Editor embebido: autoguardado debounce 400ms (app.js:2483). Modal: guardado explícito por botón, sin debounce, limpia el formulario después (historia-nota-rapida.js:101-114) |
| Edición inline | Sí (mismo textarea, reescribe) | Editor embebido: sí. Modal: no — cada "Guardar" crea una nota nueva |
| Borrado | No hay UI directa (solo vaciar vía `setNota(key,'')`) | Sí, desde "Notas de Historia": botón eliminar por nota (`deleteHistoriaNotaWithConfirm`, app.js:2446-2449) con `confirm()` nativo |
| Listado/búsqueda | No existe — solo se ve la nota del capítulo actual | Sí — panel dedicado con buscador de texto libre (app.js:2407-2455), combina notas + marcadores |
| Exportación | Genérica vía `backup.js:exportDownload()`, no hay export por-nota | Igual — mismo mecanismo genérico |
| Sincronización | Igual para ambos: viaja como parte de `cached.notas` completo, last-write-wins por `fecha_guardado` | Igual |
| Límites conocidos | Ninguno explícito (sin límite de caracteres ni cantidad) | Ninguno explícito. `getNotas()` (backup.js:179-181) filtra `n.texto?.trim()` — nota de solo espacios no aparece en el listado aunque exista en el array |

---

## 3. Archivos y líneas exactas por sistema

**Backend común — `biblia/assets/backup.js`**
- `emptyData()` / esquema raíz: línea 48
- `getNota`/`getNotaObj`/`setNota`/`getNotas`/`deleteNota`: líneas 151–188
- `addNota`/`getNotaById`/`deleteNotaById`: líneas 194–215
- `getMarcadores`/`isMarcado`/`toggleMarcador`/`updateMarcadorContexto`: líneas 224–262
- `persist()` y disciplina de `fecha_guardado`: líneas 100–117

**Notas de capítulo (Biblia) — `biblia/assets/app.js`**
- `renderNotes()`: líneas 6196–6202 (todo el sistema vive en 7 líneas)
- Entrada de pestaña: línea 1091 (`if(tab==='notas') renderNotes();`), línea 1746 (modo sermón)
- Etiquetas i18n: `notas.title`, `notas.label`, `notas.placeholder`, `notas.guardado`, `notas.escribiendo`

**Notas de historia/padres**
- Panel de lista/búsqueda "Notas de Historia": `biblia/assets/app.js:2344-2456`
  - `historiaNotasContextoLabel`/`historiaNotasMatches`/`historiaNotasOpen`: 2351-2374
  - `historiaNotasRowHTML`/`historiaNotaDetailHTML`: 2375-2405
  - `renderHistoriaNotasBody`/`renderHistoriaNotasPanel`: 2407-2456
  - `deleteHistoriaNotaWithConfirm`: 2446-2449
- Editor embebido en Padres: `biblia/assets/app.js:2458-2483` (`historiaNotaControlHTML`, `wireHistoriaNotaControl`)
  - Invocado en línea 5002 (`historiaNotaControlHTML('padres', patristicRef)`) y línea 5008 (`wireHistoriaNotaControl`)
- Punto de entrada del ícono lateral: `biblia/assets/app.js:6334-6356`
- Modal "Nota rápida": `biblia/assets/historia-nota-rapida.js` (157 líneas, completo) + `biblia/assets/historia-nota-rapida.css` (101 líneas, completo)
- Entrada de pestaña del panel de lista: línea 1093 (`if(tab==='historia-notas') renderHistoriaNotasPanel();`)

---

## 4. ¿Qué es "Idiomas"? (pregunta abierta resuelta)

**"Idiomas" = el tab interno `diccionario` (singular), NO el tab `diccionarios` (plural).**

Evidencia: `biblia/assets/i18n/es.json:45` → `"diccionario": "Idiomas bíblicos"` (en `en.json:45` → `"Biblical languages"`). Ese tab (`data-tab="diccionario"`, botones en `index.html:240,286`) es el panel de números Strong / interlinear hebreo-griego — contiene el popup `.strong-def-popup` (sección 5) y la vista interlineal (`originalTokenDetail`, tokens con `data-strong-code`, app.js:4298-4299).

El tab `diccionarios` (plural, rail lateral izquierdo, `index.html:104`) es la sección de **diccionarios bíblicos como libros de referencia** (Smith, Easton, Hitchcock — ver `biblia/modules/diccionarios/*/manifest.json`, que además usa `"type": "diccionario"` en singular dentro del manifest — fuente adicional de confusión terminológica en el propio código).

Esta ambigüedad de nombres ya existe en el código. Queda resuelto para el diseño del popup: son dos cosas distintas — "Idiomas" = Strong/interlineal, "Diccionarios" = Smith/Easton/Hitchcock — y ya existen así en el código, por lo que conviene nombrar las pestañas del popup nuevo exactamente con esa distinción explícita.

---

## 5. Precedente de popup flotante draggable/resizable

**No existe nada, ni parcial ni comentado.** `grep -rniI "draggable|resizable|drag-handle|dragHandle"` sobre todo el repo (`.js`, `.css`, `.html`) — cero resultados.

Lo más cercano reutilizable como patrón visual (no de interacción):

- **`.strong-def-popup`** (`biblia/assets/style.css:740-809`, markup en `index.html:192-216`, lógica en `app.js:4348-4463`): popup superpuesto pero de posición fija, `position:absolute` dentro de `.side-panel__inner` (ancla `position:relative`, línea 731-732), centrado verticalmente (`top:50%; transform:translateY(-50%)`), `z-index:20`. Tiene navegación interna (historial "atrás" entre entradas Strong relacionadas, `strongPopupHistory`) y animación de "shake" al reabrir el mismo código, pero **no es arrastrable ni redimensionable** — tamaño fijo por CSS (`left/right:12px`, `max-height:80%`).
- **`.hnr-overlay`/`.hnr-modal`** (modal "Nota rápida"): `position:fixed; inset:0`, centrado con flexbox, `z-index:3000`. Tampoco draggable/resizable; el único "resize" es el atributo nativo `resize:vertical` del `<textarea>` (css:79) — affordance del navegador, no del componente.

Ambos usan z-index altos y anclaje a contenedor `position:relative`/`fixed`, pero ninguno tiene lógica de arrastre (mousedown/pointerdown + mousemove) ni redimensionado real. Si el popup de notas nuevo necesita ser draggable/resizable, se construye desde cero — no hay código que adaptar, solo el patrón visual de overlay + z-index como precedente de superposición.

---

## 6. Puntos de integración para categorías nuevas y riesgos de unificación

### Estado de gancho de anotación por categoría nueva

- **Diccionarios (plural)**: no hay un `renderDiccionariosPanel` con concepto de "entrada actual" verificado línea por línea en esta pasada (fuera del foco de notas). Hay indicios (app.js:266, 5164) de que comparte el mismo patrón shelf/entry que Costumbres, pero falta confirmarlo antes de implementar.
- **Extracanónico**: sección nueva (commit reciente, "feat: agregar sección Literatura Extracanónica"). Mismo patrón shelf→índice→entrada que Costumbres (`renderExtracanonicoEntry`, app.js:5587). Aún no tiene ningún gancho de nota — no bloquea este reporte, pero bloquea la implementación de esa pestaña hasta definir qué es el "ref" de una entrada extracanónica (¿capítulo de 1 Enoc? ¿sección?).
- **Costumbres**: `renderCostumbresEntry` (app.js:5334) — falta verificar si ya expone un `data-entry-id` reusable o si hay que añadirlo.
- **Idiomas (panel Strong)**: el más distinto de todos — no es un documento con "entrada actual" sino un código Strong individual (`strongPopupEls().code`). Una nota aquí se ancla naturalmente a un **código Strong** (ej. `G2316`), no a un capítulo/sección — esquema de `ref` distinto a los otros tres, conceptualmente más parecido a "guardar una entrada de diccionario" que a "anotar una lectura".

### Riesgos técnicos para unificar bajo un solo popup con pestañas

1. **Dos filosofías de "una nota" conviven bajo el mismo tipo `padres`.** Hoy `padres` tiene simultáneamente un editor embebido de nota única (`setNota`) y un modal de notas múltiples (`addNota`) apuntando al mismo `ref`. Si el popup unificado solo expone una pestaña "Historia/Padres" con lista, hay que decidir qué pasa con la nota única del editor embebido: ¿se convierte en "una nota más" de la lista (rompe la semántica de "nota fija del capítulo"), o coexiste como entrada especial? Es decisión de producto, no de esquema.

2. **Biblia usa "una nota por capítulo", el resto usa "N notas por ubicación".** Si el popup impone la misma UI de lista+detalle para todas las pestañas, Biblia migraría de textarea-único a lista (cambio de UX visible: pierde "escribo y ya", pasa a "creo una nota nueva"). Alternativa: cada pestaña con su propia sub-UI, pero eso diluye la idea de "un solo popup uniforme".

3. **`id = ref` en `getNota`/`setNota` (backup.js:168) no admite múltiples notas por capítulo de Biblia.** Si a futuro Biblia también admite N notas, hace falta migrar datos existentes de usuarios reales (colisión de ID).

4. **`getNotas()` filtra por `texto?.trim()` (backup.js:180).** Cualquier vista "todas las categorías" debe respetar este filtro o aparecerán notas vacías fantasma en un merge naive.

5. **Ninguna de las 4 categorías nuevas tiene hoy un `ref`/`data-entry-id` definido.** Cada una necesita definirse desde cero, y especialmente Idiomas tiene una naturaleza de `ref` distinta (código Strong, no capítulo/sección).

6. **Tres UI de notas competirían por espacio en Padres si conviven.** El editor embebido vive en el flujo de lectura (siempre visible); el modal viejo flota con z-index:3000. El popup nuevo debe decidir si reemplaza a ambos o convive con ellos — convivir con tres mecanismos sería confuso para el usuario.

7. **Sync es todo-o-nada por blob completo, last-write-wins por `fecha_guardado`** (ver memoria `feedback_fecha_guardado_sync_clock`). No cambia con la unificación, pero cualquier función nueva sobre `cached.notas` debe seguir sin tocar `fecha_guardado` en acciones pasivas — este bug ya se envió dos veces.

### Conclusión de riesgo

El esquema de datos (`cached.notas` + `ubicacion.tipo`) **ya es unificable tal cual** — ese no es el problema. El problema real es que hoy hay **tres patrones de UX distintos** para "la misma idea de nota" (textarea único, editor embebido inline, modal de lista múltiple), aplicados de forma inconsistente incluso dentro de una sola categoría (`padres` tiene dos a la vez), y las 4 categorías nuevas no tienen ningún `ref` definido todavía — especialmente Idiomas, cuyo `ref` natural (código Strong) es de naturaleza distinta a capítulo/sección. Unificar la **presentación** (un popup, pestañas) es viable; unificar el **modelo de interacción** (¿una nota o N notas por pestaña?) es la decisión de diseño pendiente, no técnica.
