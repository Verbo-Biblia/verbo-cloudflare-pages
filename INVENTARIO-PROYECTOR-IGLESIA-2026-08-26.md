# Inventario verificado — Proyector Verbo e Iglesia (2026-08-26)

Solo lectura, verificado contra el código real de este repo (`main`), no contra memoria de sesiones previas (usada solo como punto de partida) ni contra lo planeado.

---

## 1. Proyector Verbo

**Qué es (confirmado):** pantalla de proyección para uso en vivo durante un culto — canciones (letras) y pasajes bíblicos, con control remoto desde el celular. Meta description del propio `proyector/control.html:7`: *"Proyector Verbo: pantalla de proyección gratuita para canciones y pasajes bíblicos durante el culto, con control remoto por celular. Sin cuentas, funciona desde el navegador."* Esto coincide con la suposición del pedido.

**Ubicación real:** `proyector/` en la raíz de este repo (ya NO vive en un directorio separado como decía una memoria de sesión de hace 10 días — eso quedó desactualizado, ya está copiado y desplegado acá).

**Acceso desde la portada:** `index.html:482` tiene la tarjeta `#card-proyector` → `/proyector/control.html`. `index.html:596-601` reenvía a `/proyector/remoto.html` en vez de `control.html` si el ancho de pantalla es móvil (mismo criterio `matchMedia('(max-width: 760px)')` que usa el resto del sitio). Es standalone: no requiere que `/biblia/` esté cargada antes ni ningún login — abre y funciona directo.

### Funciones confirmadas

- **Selector de versión bíblica A + B, ambas opcionales**: implementado y funcional (`proyector/control.html:43-44`, `proyector/js/control.js:836-837,872-898,1060-1066`). Si hay dos versiones activas, el texto se compone como `${textoPrincipal}\n\n${textoSecundario}` (`control.js:975-981`) y se manda ya armado a la ventana de proyección — no hace falta lógica aparte en el lado de la pantalla. Bibliotecas locales incluidas: `bsb`, `kjv-plano`, `rvg-2004`, `rv-verbo` (`proyector/modulos-biblia/`). Selección persiste en `localStorage`.
- **Editor de canciones/letras**: completo, no solo un campo de texto. Incluye (`proyector/control.html:156-195`, `proyector/js/control.js`):
  - Búsqueda de letra en internet contra dos APIs públicas de terceros (lrclib.net y api.lyrics.ovh, `control.js:617,632`) — dependencia externa fuera del control de Verbo, puede fallar o dar resultados pobres, pero no es la única vía.
  - Importar PDF y extraer texto automáticamente (usa `pdf.js` vendorizado en `proyector/vendor/pdfjs/`, wireado en `control.js:539-544`) — confirmado, no es una librería sin usar.
  - División automática en estrofas.
  - Exportar/importar respaldo de canciones en JSON (`control.html:30-32`).
- **Control remoto por celular** (`proyector/remoto.html` + `proyector/js/remoto.js`, 191 líneas): no es solo play/pausa/volumen — también navega el "orden del culto" completo y el carrusel de diapositivas en espejo con la PC (`remoto.js:16-46`). Emparejamiento por código de 6 dígitos + QR (librería `qrcode-generator` vendorizada, con licencia y hash verificados según memoria de sesión previa). Transporte: polling HTTP (~800ms) contra un endpoint del Worker ya existente (`proyector/js/proyector-relay.js:9` → `https://verbo-api-bible.juanjosevenegas78.workers.dev/proyector/estado`; ruta servida por `handleProyectorEstado` en `cloudflare/api-bible-worker/worker.js:1108`, registrada en el router en la línea 1152). El control remoto es **opcional**: usar Proyector sin activar "Control remoto" no requiere ningún código ni configuración.
- **Sin cuentas, todo local**: canciones, selección de versión y configuración viven en `localStorage`/`IndexedDB` del navegador, sin backend propio salvo el relay de estado del control remoto (que no persiste nada más allá de un TTL corto en KV).

### Estado de cada función

No encontré ningún `TODO`, `FIXME`, ni comentario de "no funciona"/"pendiente" dentro de `proyector/js/*.js` ni los `.html` (busqué explícitamente). Todo lo listado arriba está escrito y conectado end-to-end en el código actual. Lo único que **no puedo verificar desde los archivos del repo** es si el `wrangler deploy` de la ruta `/proyector/estado` en el Worker sigue efectivamente activo en producción ahora mismo — el código está en `worker.js` y registrado en el router, pero el estado de un despliegue de Cloudflare Worker no es un hecho verificable desde este repo estático. (Una memoria de sesión de hace 10 días afirma que se desplegó con tu autorización explícita y se probó extremo a extremo con dos pestañas reales; no lo tomé como verificado por mí mismo, solo lo señalo como contexto.)

**Recomendación:** Proyector Verbo está listo para aparecer en una descripción pública sin matices — no encontré bugs conocidos ni funciones a medias en el código actual. La única salvedad que te toca confirmar vos (no verificable desde el repo): que la ruta del Worker para el control remoto siga desplegada y respondiendo en producción.

---

## 2. Iglesia (sincronización de iglesia)

**Qué es (confirmado):** un publicador (líder/administrador de una congregación) se autentica por magic-link y publica anuncios — texto simple, tarjeta con fondo SVG y texto libre superpuesto, o embed de YouTube/Facebook. Los miembros siguen la iglesia vía un link de invitación permanente que siempre pasa por una pantalla de confirmación explícita antes de vincular (nunca auto-vincula con solo abrir el link) — confirmado en `iglesia/index.html:108+` y el comentario en esa misma zona del código.

### Los 4 bugs reportados previamente — verificados uno por uno contra el código actual

1. **Truncamiento de CSS por comillas sin escapar en `font-family`** → **NO reproducible hoy.** `iglesia/feed.js:38` arma el string de estilo incluyendo `font-family:${fontStack}` (varios stacks usan comillas dobles reales, ej. `"Times New Roman"` en `iglesia/panel.js:35`), pero ese string completo pasa por `escapeHTML()` (`feed.js:8`, que sí escapa `"` a `&quot;`) antes de insertarse en el atributo `style="..."` (`feed.js:41`). El editor (`iglesia/editor.js:78`) ni siquiera arma un string: asigna `textEl.style.fontFamily = fontStack` como propiedad JS, lo cual es intrínsecamente seguro. **Parece arreglado, o nunca se manifestó en esta forma exacta del código.**
2. **Falta de soporte de embed de Facebook** → **NO reproducible hoy.** `iglesia/panel.js:254-273` implementa `embedSrc()` con soporte explícito para `facebook.com/` y `fb.watch/` (distingue video vs. post público, arma la URL del plugin público de Facebook sin necesitar su SDK). Coincide con la regex de validación del propio Worker (comentario en `panel.js:254`). **Ya está implementado.**
3. **Nombre de iglesia capturado pero no mostrado** → **NO reproducible hoy.** `iglesia/index.html:65` tiene el elemento `<h2 class="iglesia-feed__church-name" id="iglesiaFeedChurchName">` y `iglesia/index.html:100` lo llena con `result.nombre` al cargar el feed de un miembro. **Ya se muestra.**
4. **Falta de tarjeta de entrada en la portada** → **NO reproducible hoy.** `index.html:491-498` tiene la tarjeta "Iglesia" enlazando a `/iglesia/`. **Ya existe.**

Los cuatro bugs que me pediste confirmar están resueltos en el código actual. No encontré timestamps de commit para saber cuándo se arreglaron (no corrí `git log` sobre estos archivos específicos porque no era parte del pedido), pero el estado presente es inequívoco por lectura directa del código.

### Detalle no pedido pero relevante para el copy público

La memoria de una sesión anterior describe el catálogo de fondos SVG como "450 piezas (Verbo SVG Library V2)". **Verificado: son 70**, no 450 (`iglesia/assets/fondos/manifest.json` tiene 70 entradas; `find iglesia/assets/fondos/svg -type f` devuelve 70 archivos, coincide). Si pensás mencionar una cifra de catálogo en el copy público, usá 70, no 450 — esa cifra de la memoria estaba desactualizada o nunca fue precisa.

### Qué funciona de forma confiable para un usuario nuevo

- **Miembro que sigue una iglesia**: abre el link de invitación → pantalla de confirmación explícita → ve el feed con nombre de iglesia, posts de texto, tarjetas con fondo, y embeds de YouTube/Facebook. Sin fricción, sin bugs detectados.
- **Publicador**: autenticación por magic-link (mismo patrón que el sync personal de usuario, pero con namespace y handlers separados a propósito — no comparte código con el link de sync personal). Puede publicar texto, tarjeta SVG con editor de texto libre (arrastrable/escalable/rotable), o embed. No encontré bugs activos en este flujo tampoco.

**Recomendación:** Iglesia está lista para aparecer en la descripción pública — los 4 bugs que motivaban cautela ya no están presentes en el código. La única corrección que te sugiero hacer vos mismo antes de escribir el copy: no menciones "450 fondos" si pensás dar una cifra del catálogo — son 70.

---

## Nota metodológica

No propuse copy nuevo ni toqué código — esto es solo el inventario de estado para que decidas. Si querés, en una fase posterior puedo ayudarte a redactar la descripción de estas dos secciones usando este inventario como base factual.
