# Tareas pendientes — Recursos

Guardado el 2026-08-04. No empezada — es solo el brief a la espera de
retomar. Borrar la sección conforme se complete.

---

## Tarea — Dos entradas de menú separadas para Artículos y Reflexiones — PENDIENTE (guardada 2026-08-04)

**⚠️ Nota importante antes de retomar:** ya existe trabajo relacionado
publicado (commit `a1f1d21`, "Reestructura Artículos y Reflexiones en dos
secciones por categoría", del mismo día) que **NO es exactamente esto**.
Ese commit dividió `recursos/articulos-y-reflexiones/index.html` en dos
**secciones visuales dentro de la misma página** ("Reflexiones y
Devocionales" 16 ítems / "Estudios Temáticos" 19 ítems, cada una con su
propio filtro por tema), pero el menú de `recursos/index.html` sigue
mostrando **una sola tarjeta** "Artículos y Reflexiones" que enlaza a esa
página única (`recursos/index.html:63-65`). El campo `categoria` en
`recursos.json`/`tools/build_content_taxonomy.py` y `lang-aware-list.js` ya
fueron extendidos en ese commit para soportar la categorización.

El brief de abajo (tal cual lo dio Juan) pide ir un paso más allá: que el
**menú de Recursos** muestre dos entradas separadas en vez de una — es
decir, posiblemente dos rutas/páginas distintas, no solo dos secciones
dentro de la misma página. Antes de escribir código, confirmar con Juan si
quiere:
(a) dos rutas nuevas (ej. `recursos/reflexiones-y-devocionales/` y
`recursos/estudios-tematicos/`), reemplazando la tarjeta única del menú por
dos tarjetas, cada una filtrando por `categoria` — lo que implica decidir
qué pasa con la URL/página actual `articulos-y-reflexiones/` (¿se elimina,
queda como redirect, o uno de los dos nuevos hereda esa ruta?); o
(b) dejar la página única tal cual quedó en `a1f1d21` (con sus dos
secciones internas) y solo split the top-level menu card into two cards
that both point to same page with an anchor/filtro preseleccionado.
El punto 5 del brief ("actualizar sitemap/menú/breadcrumbs que apunten a
articulos-y-reflexiones") depende directamente de esta decisión.

**Brief tal cual lo dio Juan:**

Tarea: reemplazar la sección única "Artículos y Reflexiones" en Recursos
por dos secciones separadas — "Reflexiones y Devocionales" y "Estudios
Temáticos" — usando el campo "categoria" que Codex ya agregó a
recursos.json (valores: "devocional" o "estudio", ya confirmado por Juan:
16 devocional, 19 estudio, 101 lecciones sin ese campo, sin tocar).

Contexto técnico existente (revisar antes de tocar nada):
- Índice bilingüe con data-titulo-es/en + data-ruta-es/en por ítem.
- lang-aware-list.js: arma el listado visible según el idioma seleccionado.
- article-lang-redirect.js: maneja redirecciones bidireccionales ES/EN para
  cada artículo individual.
- La sección actual vive en algo como recursos/articulos-y-reflexiones/ —
  confirmar ruta exacta.
- El menú/barra de Recursos hoy muestra "Artículos y Reflexiones" como una
  sola entrada.

Qué hacer:
1. En el menú de Recursos, reemplazar la entrada única "Artículos y
   Reflexiones" por dos entradas: "Reflexiones y Devocionales" y "Estudios
   Temáticos".
2. Cada una lista únicamente los ítems cuyo campo "categoria" coincida
   ("devocional" o "estudio" respectivamente), reutilizando la misma
   lógica de lang-aware-list.js pero filtrando por categoria antes de
   renderizar.
3. Las rutas individuales de cada artículo/reflexión (data-ruta-es/en, los
   archivos HTML de cada ítem) NO cambian — evitar romper enlaces
   existentes ya indexados o compartidos. Solo cambia cómo se listan y
   agrupan en la página/menú de índice.
4. article-lang-redirect.js sigue funcionando igual para cada ítem
   individual — no requiere cambios si las rutas no cambian.
5. Si existe algún enlace/breadcrumb duro apuntando a
   "articulos-y-reflexiones" (menú, sitemap, otras páginas que enlacen
   ahí), actualizarlo para apuntar a la sección correspondiente o dejar un
   redirect simple si aplica.

Restricciones:
- No tocar module-loader.js ni app.js salvo estrictamente necesario — si es
  necesario, mostrar el diff exacto antes de aplicar.
- No tocar recursos/escuela-dominida/ ni las 101 lecciones.
- No tocar el trabajo de Historia de la Iglesia ni modo predicación (tareas
  separadas, ya en curso — ver `TAREAS-PENDIENTES-HISTORIA.md`).
- git add solo de los archivos tocados, uno por uno. No usar git add -A.
  Mostrar git status antes de cada commit. No hacer push — espero el
  resumen y diff para revisar.

**Antes de escribir código:** confirmar la ruta exacta actual de la
sección, cómo lang-aware-list.js arma el listado hoy, y si hay algún otro
archivo (sitemap.xml, menú principal, footer) que enlace directamente a
"articulos-y-reflexiones" y necesite actualizarse.
