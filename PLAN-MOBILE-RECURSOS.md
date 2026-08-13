# Plan: simplificar vista móvil de subpáginas de Recursos

Estado: **preparación, sin ejecutar.** Guardado el 2026-08-13 para retomar
más adelante — no es la tarea activa de esta sesión.

## Contexto

Verbo (verbobiblia.com), sitio estático en Cloudflare Pages, sin framework.
Problema observado en la vista móvil de las subpáginas de `recursos/`
(revisado con capturas de Devocionales y Escuela Dominical, mismo patrón se
repite en Artículos y Reflexiones, y aplica también a Sermones Históricos
cuando exista): demasiado contenido de "navegación/explicación" antes de
llegar a la lista real de piezas.

## Objetivo

Reducir el ruido visual en móvil para que el usuario llegue al contenido (la
lista de ítems) más rápido, sin scroll innecesario antes del primer
resultado.

## Paso 0 — Investigar antes de tocar nada

- Localizar el/los archivo(s) HTML/JS/CSS que generan estas subpáginas
  (Devocionales, Escuela Dominical, Artículos y Reflexiones, y luego
  Sermones Históricos). Es probable que compartan una plantilla o
  componente común, ya que muestran el mismo patrón: 6 botones de
  navegación arriba, breadcrumb, título grande, descripción larga, contador
  de piezas, selector "Todos los temas".
- Confirmar si el bloque de 6 botones (Biblia, Seminario, Librería,
  Recursos, Artículos y Reflexiones, Devocionales) viene de
  `site-chrome.js` u otro componente reutilizado en otras páginas
  estáticas del sitio, no solo en `recursos/`.
- Confirmar el breakpoint móvil que ya usa el CSS del sitio
  (`recursos/assets/recursos.css` u otro) — no inventar uno nuevo si ya
  existe una convención.
- No tocar nada de la vista desktop/tablet: todo cambio debe ir dentro de
  un media query móvil existente o uno nuevo bien acotado.

## Cambios pedidos (solo vista móvil)

1. **Menú de 6 botones** (Biblia / Seminario / Librería / Recursos /
   Artículos y Reflexiones / Devocionales)
   - Bajarlo de prioridad visual: que no sea lo primero que ve el usuario
     al entrar a una subpágina. Debe aparecer después del título de la
     subpágina (ver punto 3), no antes.
   - Mantener el estilo actual (icono + texto) — no reducir a solo iconos.
   - Cambiar la etiqueta "Artículos y Reflexiones" por "Artículos"
     (revisar si el texto sale de `i18n.json` o de
     `recursos/data/recursos.json`, y aplicar también al inglés si
     corresponde).

2. **Breadcrumb** ("VERBO · DEVOCIONALES", etc.)
   - Eliminarlo en vista móvil. Es redundante: el botón de la sección ya
     aparece resaltado/activo en el menú, y el usuario entró a la
     subpágina a propósito.

3. **Título de la subpágina** ("Devocionales", "Escuela Dominical", etc.)
   - Mantenerlo, pero:
     - Reducir el tamaño de fuente en móvil (hoy es un H1 muy grande).
     - Moverlo más arriba, justo debajo del header (Verbo + selector
       ES/EN), para que quede visible en la primera pantalla sin scroll.

4. **Párrafo descriptivo** (ej. "Reflexiones breves para leer en minutos,
   organizadas por tema y por lo que estás viviendo.")
   - Eliminarlo en vista móvil. El usuario ya sabe qué es la sección a la
     que entró; la descripción larga solo ocupa espacio.

5. **Contador de piezas** (ej. "76 PIEZAS")
   - Ocultarlo en vista móvil por ahora. Mientras el catálogo es pequeño,
     mostrar el número transmite escasez en vez de abundancia.

6. **Selector de temas** (hoy: "Todos los temas" + dropdown)
   - Mantener el dropdown de filtro por tema.
   - Reorganizar esa fila: el título pequeño de la subpágina (ver punto 3,
     o una versión corta) a un lado, y el dropdown de filtro al otro lado,
     en la misma línea. El dropdown puede perder la etiqueta "Todos los
     temas" o quedarse como selector puro.

## Restricciones

- Cambios solo dentro del breakpoint móvil; no alterar el layout
  desktop/tablet.
- No tocar la lógica de filtrado (`filters.js`) ni la carga de datos
  (`recursos.json`) — solo layout, orden y visibilidad de estos elementos.
- Si el bloque de 6 botones es un componente compartido con otras páginas
  del sitio (no solo `recursos/`), confirmar antes de decidir si el cambio
  aplica sitio-ancho o solo a estas subpáginas — si hay duda, preguntar
  antes de modificar un componente global.
- Aplicar el mismo patrón a Devocionales, Escuela Dominical, Artículos y
  Reflexiones, y Sermones Históricos de forma consistente, salvo que su
  HTML difiera y amerite ajuste independiente.
- Seguir las reglas de `AGENTS.md` (cache-busting `?v=` si se toca CSS/JS
  compartido, no exponer secretos, etc.)
- Verificar que el cambio no rompa la versión en inglés (EN) de estas
  subpáginas si existen equivalentes.

## Qué NO hacer

- No rediseñar la vista desktop.
- No agregar funcionalidad nueva — esto es simplificación de lo existente,
  no una feature.
- No tocar Biblia, Librería ni Seminario, salvo que el componente de
  navegación sea compartido y el cambio de posición/etiqueta deba
  propagarse ahí también (confirmar primero).
