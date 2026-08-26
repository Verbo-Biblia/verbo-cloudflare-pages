# Inventario verificado de Verbo — 2026-08-26

Investigación de solo lectura, verificada contra el código real del repo (`/home/juan/Verbo/verbo-cloudflare-pages`, rama `main`, sitio estático sin build step — lo que está en el filesystem es lo que está en producción). No se encontró `INVENTARIO-SITIO.md` en el repo actual; este documento no depende de él ni de ningún otro reporte previo.

**Ampliación posterior (mismo día):** Juan pidió más detalle en Devocionales, Librería, Recursos/Artículos y, sobre todo, un desglose honesto de la sección Biblia — está incorporado en la sección 2.1 (nueva) y en las expansiones de Librería/Recursos dentro de la sección 2. Esa ronda también corrigió una cifra (artículos/reflexiones/devocionales pasó de 21+12+63 a 19+12+65, recontado directo del JSON) y agregó un módulo que faltaba contar (Diccionarios bíblicos, 3 obras).

---

## 1. Copy actual de portada (citas literales)

### `index.html` (raíz, portal)

**`<title>`:**
> Verbo — Compendio de recursos cristianos

**`<meta name="description">`:**
> Verbo: Biblia, comentarios, formación teológica y recursos pastorales gratuitos en español, para quienes predican, enseñan y forman.

**`<meta property="og:title">`:** idéntico al `<title>`.
**`<meta property="og:description">`:** idéntico al `<meta name="description">`.

**Header (wordmark):**
> Verbo `<span>`compendio bíblico`</span>`

**Hero:**
- Eyebrow: `Estudio · Formación · Lectura`
- H1: `Todo lo que necesitas,` *(em)* `en un solo lugar.`

**Footer tagline:**
> Verbo — hecho para quienes predican, enseñan y forman.

**Quote strip:**
> "Vosotros sois la luz del mundo. Una ciudad asentada sobre un monte no se puede esconder." — Mateo 5:14

**Tarjetas de la grilla principal (`card-grid`, en orden):** Biblia de Estudio, Librería, Recursos, Artículos y Reflexiones, Devocionales, Sermones Históricos, Proyector Verbo, Iglesia.

**Sección "Más de Verbo":** Configuración (Cuenta) · Conoce Verbo (Acerca de).

Todo el texto de portada vive en `biblia/assets/i18n/es.json` bajo el namespace `"portal"` (líneas 405–427) — el HTML solo tiene el fallback, idéntico al i18n verificado.

### `acerca/index.html`

- `<title>`: `Acerca de Verbo`
- `<meta name="description">`: *"Conoce la misión, el origen y la información general de Verbo, una biblioteca bíblica digital gratuita para la iglesia de habla hispana."*
- H1 + primer párrafo (cita literal):
  > Acerca de Verbo
  >
  > Verbo es una biblioteca bíblica digital gratuita, creada para reunir en un solo lugar herramientas de estudio, formación teológica y recursos útiles para la iglesia de habla hispana.

### `mision/index.html`

- `<title>`: `Estudio Bíblico Gratuito en Español — Nuestra Misión | Verbo`
- `<meta name="description">`: *"Verbo es una biblioteca bíblica digital gratuita en español: comentarios bíblicos en español gratis, Biblias y diccionarios para el estudio bíblico serio."*
- Frase central (cita literal):
  > Nuestra misión es construir una **biblioteca bíblica digital gratuita** en español, moderna e intuitiva, que reúna en un solo lugar herramientas útiles para el **estudio bíblico serio**.

### `sobre-el-fundador/index.html`

- `<title>`: `Sobre el fundador | Verbo`
- `<meta name="description">`: *"Juan José Venegas, pastor en Costa Rica, cuenta por qué construyó Verbo: una biblioteca bíblica digital gratuita para pastores y líderes de habla hispana."*
- Frase central (cita literal):
  > Verbo no pretende reemplazar el excelente trabajo realizado por otras plataformas de estudio bíblico. Al contrario, reconoce el enorme aporte que muchas de ellas han hecho durante años. Su propósito es responder a una necesidad muy concreta: ofrecer a la iglesia de habla hispana una plataforma moderna, intuitiva y cada vez más completa, donde el acceso a recursos de calidad no dependa del poder adquisitivo de cada persona.

### ⚠️ Inconsistencia detectada

La portada (`index.html`) se presenta como **"Compendio de recursos cristianos"** y nunca usa la palabra "biblioteca" — enumera Biblia, comentarios, formación teológica y recursos pastorales como cosas separadas. Las tres páginas internas (`acerca/`, `mision/`, `sobre-el-fundador/`) en cambio se presentan sistemáticamente como **"una biblioteca bíblica digital gratuita"**. Es el mismo proyecto descrito con dos marcos distintos (compendio de recursos vs. biblioteca digital) — vale la pena decidir cuál es el marco vigente antes de reescribir cualquiera de los dos.

---

## 2. Inventario verificado de módulos y funciones en producción

### Biblias locales — 8 manifests (`biblia/modules/bibles/*/manifest.json`)

| id | Nombre | Idioma | Strong |
|---|---|---|---|
| rva-1909 | Reina-Valera Antigua (1909) | es | no |
| rvg-2004 | Reina-Valera Gómez 2004 | es | no |
| rv-verbo | Biblia Verbo | es | no |
| rv-verbo-strong-provisional | Biblia Verbo RV2026 con Strong (**provisional**) | es | sí |
| kjv | King James Version (1769) | en | no |
| kjv-strong | King James Version (1769) with Strong's Numbers | en | sí |
| asv-1901 | American Standard Version (1901) | en | no |
| bsb | Berean Standard Bible | en | no |

Nota: el propio manifest de `rv-verbo-strong-provisional` la nombra "(provisional)" en su campo `name` — no se presenta como una edición terminada; conviene no listarla en marketing como si fuera equivalente a las demás.

### Biblias remotas vía API.Bible — 3 (`biblia/modules/registry.json`, clave `apiBible.bibles`)

LBLA (La Biblia de las Américas), NTV (Nueva Traducción Viviente), NASB 2020 (New American Standard Bible 2020, inglés). Confirmado también en código: `app.js:1157` — *"LBLA, NTV y NASB 2020 se consultan bajo demanda mediante API.Bible."*

### Comentarios verso-a-versículo — 11 (`registry.json`, clave `commentaries`)

Matthew Henry (en), Jamieson-Fausset-Brown, Keil-Delitzsch, Scofield, Wesley, Barnes, Clarke, Calvin, Cambridge Bible for Schools, Pulpit Commentary, Utley Free Bible Commentary.

*(Los dos comentarios propios de Verbo — Exégesis Verbo y Comentarios Verbo — ya no están: `registry.json` tiene `"exegesis": []` y `"library": []` vacíos, consistente con su eliminación del 2026-08-24.)*

### Literatura Extracanónica — exactamente 3 (`registry.json`, clave `extracanonico`)

1 Enoc, Asunción de Moisés, Jubileos. Confirmado, no hay una cuarta obra agregada después.

### Historia eclesiástica — 5 obras (`registry.json`, clave `churchHistory`)

Eusebio — Historia Eclesiástica; Eusebio — Vida de Constantino; NPNF2-14 Concilios Ecuménicos; NPNF2 Continuadores; NPNF1-05 Agustín, Escritos Antipelagianos.

### Padres Apostólicos (lectura corrida) — 11 documentos (`registry.json`, clave `patristic`)

Ireneo (Contra las Herejías), 1 Clemente, 2 Clemente, Policarpo a los Filipenses, Martirio de Policarpo, Martirio de Ignacio, Didaché, Bernabé, A Diogneto, Pastor de Hermas, Fragmentos de Papías.

### Costumbres bíblicas — 2 obras (`registry.json`, clave `costumbres`)

Freeman — *Manners and Customs of the Bible*; Tucker — *Life in the Roman World of Nero and St. Paul*.

### Diccionarios bíblicos — 3 obras (`registry.json`, clave `diccionarios`)

Easton's Bible Dictionary, Smith's Bible Dictionary, Hitchcock's Bible Names Dictionary — todos de dominio público en inglés. (Esta clave no estaba contada en una versión anterior de este inventario; se agrega acá.)

### Cross-references (TSK) — confirmado

`crossrefs/tsk/manifest.json`, nombre: *"Referencias cruzadas (Treasury of Scripture Knowledge)"*.

### Armonía evangélica — confirmado

`gospel/evangelio-uf/manifest.json` — *"Evangelio según Jesucristo — Versión Cronológica Fluida UF — Unción Fresca"*, armonización de los 4 evangelios en 100 capítulos, traducida del griego (NA28/SBLGNT) con revisión paralela TR/Mayoritario.

### Conversor de unidades bíblicas — confirmado

`conversor/manifest.json` existe; tab `conversor` activo en `app.js`.

### Buscador semántico bilingüe — 3 índices reales (`biblia/modules/semantic-search/`)

`bible-rv-verbo` (es) y `bible-en-bsb` (en) — cada uno con sub-índice de versículos y de perícopas/pasajes — más `church-history` (índice de entradas de Historia de la Iglesia). Cableado confirmado en `module-loader.js:11-12`. **No cubre comentarios** — solo texto bíblico (ES/EN) e Historia de la Iglesia.

### Librería (`libreria/`) — 118 obras catalogadas, detalle ampliado

Cifra tomada de `libreria/data/libreria.json` (array de 118 entradas, cada una con `id`/`titulo`/`autor`/`url`/`licencia`/`temas`/`idioma`). El directorio físico tiene ~120 carpetas; la diferencia son 2 carpetas de infraestructura sin ser "obras" (`mi-biblioteca/` = capa de guardado personal, `biblia-verbo/` = página informativa sobre la traducción Biblia Verbo, no una obra externa catalogada).

- **Tipo**: las 118 son `"tipo":"libro"` — no hay folletos, audio ni video catalogados, solo libros/tratados en texto.
- **Idioma**: 68 en español, 50 en inglés.
- **Autores** (36 distintos; los más representados): Charles H. Spurgeon (28 obras, con 2 más bajo la variante de nombre "Charles Spurgeon" — inconsistencia menor de datos, 30 en total), John Bunyan (16), Horatius Bonar (16), J. C. Ryle (14), Arthur W. Pink (6). El resto son autores con 1-2 obras cada uno (Padres Apostólicos incluidos: Hermas, Iglesia de Esmirna, "Enseñanza de los Doce Apóstoles").
- **Temas/categorías** (`temas`, no exclusivos, un libro puede tener varios): la etiqueta más común es `chapel-library` (80 obras — la fuente/procedencia de la mayoría del catálogo en inglés), seguida de `vida-cristiana` (24), `patristica` (21), `john-bunyan` (16, autoetiqueta), `clasicos-cristianos` (14), `teologia` (12). No hay una taxonomía de "géneros" separada de estos temas — es un solo campo de etiquetas libres.
- **"Mi biblioteca"** (`libreria/assets/mi-biblioteca.js`, 78 líneas) — confirmado: es una capa de **guardado/marcado personal**, no un sistema de progreso de lectura. Reutiliza `VerboBackup.toggleMarcador('libreria-libro', id)` (mismo mecanismo de marcadores que el resto del sitio), por lo que sincroniza solo si el usuario ya vinculó su email en Ajustes, sin pedir nada adicional. Guarda únicamente el id del libro (nunca título/autor/portada, siempre se leen del catálogo real) y una marca de tiempo `lastOpenedAt` para poder ordenar "continuar leyendo" por más reciente. Cita textual del propio código (línea 53): *"No hay progreso de lectura real todavía -- no se inventa uno."* — es decir, no hay porcentaje de avance ni marcador de página, solo lista de guardados ordenada por último acceso.

### Recursos — cifras exactas de `recursos/data/recursos.json` (recontadas campo por campo, no repetidas de memoria)

`recursos.json` tiene 249 entradas en total: 153 son lecciones de escuela dominical (sin `categoria`/`subtipo`, ver más abajo) + 96 son artículos/reflexiones/devocionales, desglosadas así por `(categoria, subtipo)`:

| categoria | subtipo | cantidad |
|---|---|---|
| estudio | articulo | 19 |
| devocional | reflexion | 12 |
| devocional | devocional | 65 |

**Esto corrige una cifra:** la cuenta real hoy es **19 artículos + 12 reflexiones + 65 devocionales = 96**, no 21+12+63 como circulaba antes — la diferencia es pequeña pero conviene usar esta cifra recontada.

- **Devocionales** (tarjeta de portada separada, `recursos/devocionales/index.html`) **no es un pool de contenido distinto**: es un filtro (`subtipo:'devocional'`, confirmado en el HTML del índice, `data-subtipo="devocional"`) sobre esas mismas 96 piezas — los devocionales viven físicamente bajo `/recursos/articulos-y-reflexiones/`, no en una carpeta propia (`recursos/devocionales/` en el filesystem contiene solo el `index.html` de este filtro, cero archivos de contenido). Vale la pena no describir "Artículos y Reflexiones" y "Devocionales" como dos bibliotecas separadas.
- **Los devocionales son temáticos, no un plan diario fechado**: organizados por tema (`data-tema`, ej. "gracia", "fe", "perseverancia", "vida-cristiana") y con fecha de publicación en el dato (`data-fecha-es`), pero la mayoría comparte la misma fecha de publicación en lote (ej. "12 ago 2026") — no son 63/65 entregas de un calendario diario, son piezas cortas agrupadas por tema para leer según lo que el lector esté viviendo (así lo dice el propio lede de la página: *"Reflexiones breves para leer en minutos, organizadas por tema y por lo que estás viviendo."*). La autoría que se muestra en las tarjetas es mayormente "Verbo" (sin firma personal) para los devocionales cortos, y "Juan José Venegas" para al menos algunas reflexiones más largas.
- **Bilingüe parcial**: existe un espejo en inglés (`recursos/articles-and-reflections-en/`, misma cantidad de carpetas que `articulos-y-reflexiones/` a simple vista) pero el propio i18n tiene la cadena `"translationPending": "Traducción al inglés en preparación — se muestra el original en español."` (`biblia/assets/i18n/es.json:402`), es decir, no todas las piezas en español tienen todavía su traducción real al inglés lista — algunas muestran el original en español con un aviso.
- Dataset aparte ya señalado antes: `recursos/data/historical-articles.json` (10 piezas, cartas devocionales históricas de Samuel Rutherford) — no forma parte de las 96, es un tercer pool de contenido, pequeño y no mencionado en el pedido original.
- **Escuela dominical — 153 lecciones reales**, en 3 currículos por edad (`recursos.json`, campo `grupo_edad`):
  - 4–7 años: 52 lecciones
  - 8–10 años: 49 lecciones
  - 12–14 años: **52 lecciones — SÍ está publicado** (carpeta `recursos/escuela-dominical/12-14-anos/`, 53 subcarpetas incluyendo índice; también hay espejo en inglés `12-14-years/`).
  - **No existe currículo de adultos de 104 lecciones en el código.** Búsqueda explícita (`grep -r "adultos\|104 lecciones"`) no encontró ningún rastro — ni carpeta, ni entrada en `recursos.json`, ni manifest. Es un proyecto que, si existe, vive completamente fuera de este repo; no debería mencionarse como disponible.
  - Nota aparte: existe también `recursos/data/historical-articles.json` (10 piezas — cartas devocionales históricas, ej. Samuel Rutherford), un dataset distinto del de Sermones Históricos, no mencionado explícitamente en el pedido original — lo señalo por si es relevante.

### Sermones Históricos — 60 piezas, 6 autores (`recursos/data/sermones-historicos.json`)

Charles H. Spurgeon (31), D. L. Moody (7), Jonathan Edwards (7), John Wesley (5), George Whitefield (5), J. C. Ryle (5).

### Editor de sermones — funciones verificadas (`biblia/assets/app.js`)

- **Comparar versiones**: sí, panel lateral dedicado en modo predicación (`renderSermonCompare`/tab `comparar`).
- **Exportar a Word**: sí, real — genera un `.doc` vía Blob con namespace de MS Word (`exportSermonToWord`, línea 2019).
- **Exportar a PDF**: sí, pero **es la función de impresión del navegador** (`window.print()` en modo impresión, `exportSermonToPDF`, línea 2038) — no una generación de PDF propia. Preciso para no prometer un exportador nativo que no existe.
- **Autoguardado: NO EXISTE.** Comentario textual en el propio código (línea 2152): *"Única vía de guardado hoy: no hay autoguardado por inactividad ni botón 'Salir' todavía (confirmado con Juan 2026-08-01) — mientras tanto, si el pastor recarga sin haber tocado 'Guardar', el contenido en el editor se pierde."* Solo hay guardado manual explícito (botón "Guardar") + una advertencia de `beforeunload` si hay cambios sin guardar. **Esto es importante: no describir el editor de sermones como que tiene autoguardado.**

### Sincronización entre dispositivos — confirmado

`biblia/assets/sync.js:1` — *"Sincronización de verbo-datos entre dispositivos vía email + magic link."* Sin cuentas de usuario ni contraseñas.

### Backup/restore de datos — confirmado

`biblia/assets/backup.js` — `exportDownload()`/`importFromFile()`, exporta/importa un único archivo `verbo-datos.json`.

### Notas (popup unificado, recién migrado) — 6 categorías confirmadas (`app.js`, `NP_TABS`)

Capítulo, Historia y Padres, Costumbres, Extracanónico, Diccionarios, Idiomas. Todas comparten el mismo modelo (lista + búsqueda + "Nueva nota" siempre disponible + edición inline), verificado en el propio código (`NP_TABS`, líneas 70-77).

### Selector de idioma ES/EN + traducción de contenido bajo demanda — confirmado

Mecanismo real: `POST /translate` sobre el Worker `verbo-api-bible` (Cloudflare), usando Claude Haiku según comentario en `app.js:1410`. Se usa para traducir comentarios/patrística/etc. cuando el idioma de interfaz no coincide con el idioma fuente del contenido. (No se encontró ningún rastro literal de "translate:v3"/"v5" en el código actual — si esa numeración de versión existe, vive en otro lado, no en este repo tal como está hoy.)

### PWA instalable — confirmado

`biblia/manifest.webmanifest` (name, icons, display:standalone) + `biblia/service-worker.js` (cache-first de assets versionados, shell network-first).

### Apps nativas — parcialmente verificable

- **Android**: existe un paquete TWA real (`com.verbobiblia.app`) — confirmado por `.well-known/assetlinks.json` con fingerprints de firma, y el enlace a Google Play ya está en el footer de la portada (`https://play.google.com/store/apps/details?id=com.verbobiblia.app`). **El estado real en la tienda (open testing vs. producción) NO es verificable desde este código** — requiere confirmación directa de Juan o revisar Play Console.
- **iOS**: el repo de la app (`verbo-ios`, Capacitor) es un repositorio privado **separado**, fuera de este código — no hay nada verificable acá. Requiere confirmación de Juan sobre el estado con Apple Developer.

---

## 2.1 Sección Biblia (`biblia/`) a detalle — qué se puede hacer ahí, sin adornos

Ampliación pedida específicamente por Juan: no alcanza con contar módulos, hace falta describir el nivel real de la herramienta de estudio, en lenguaje llano y verificado contra `biblia/index.html` y `biblia/assets/app.js` (~6900 líneas).

**Lectura de capítulos.** Navegación por libro/capítulo con selector nativo, flechas anterior/siguiente, y una versión "activa" (persistida en `localStorage`). Bajo cada versículo aparecen automáticamente, sin que el usuario tenga que activar nada:
- **Referencias cruzadas (TSK)**: hasta 5 chips por versículo con un botón "+N más" si hay más (`app.js:791`, `XREF_LIMIT=5`). Siempre visibles, no es una función que haya que encender.
- **Indicador de comentarios** (💬 + número): cuenta cuántos de los 11 comentarios tienen nota sobre ese versículo; al tocarlo abre el panel Comentario ya filtrado a ese versículo (`app.js:754-768`).
- **Indicador de Padres Apostólicos** (📜 + número): igual, pero para fragmentos patrísticos que citan ese versículo; abre Padres en modo "por versículo" (`app.js:771-787`).
- **Resaltado de texto**: sí existe, 6 colores fijos (`HL_COLORS = ['hl-yellow','hl-green','hl-blue','hl-pink','hl-coral','hl-violet']`, `app.js:327`), por versículo individual, persistido y sincronizable igual que el resto de los datos del usuario.

**Comparar versiones.** Es una comparación de **exactamente dos** Biblias a la vez: la versión principal que se está leyendo, más UNA alterna elegida en un `<select>` (`renderCompare`, `app.js:1691-1714`) — no es una vista de N versiones en paralelo. Las versiones remotas (LBLA/NTV/NASB 2020, vía API.Bible) se cargan bajo demanda ahí mismo si se eligen como alterna.

**Comentarios verso a versículo.** Los 11 comentarios (ver sección 2) se muestran completos al abrir el panel, filtrados al versículo activo. Cuando el comentario está en inglés (Matthew Henry, JFB, Barnes, Clarke, Calvin, Cambridge, Pulpit, Utley) y el idioma de interfaz activo es español, se dispara traducción automática bajo demanda vía el mismo mecanismo `POST /translate` (Worker `verbo-api-bible`, Claude Haiku) ya confirmado en la sección 2 — no es una traducción pre-hecha guardada, se traduce en el momento y se cachea localmente.

**Idiomas bíblicos (Strong/interlineal) — tres sub-modos reales**, con pestañas propias (`app.js:4377-4379`), todos sincronizados al capítulo que se esté leyendo:
1. **Texto original**: el texto hebreo/griego corrido, sin desglose palabra por palabra.
2. **Interlineal**: palabra por palabra con alineación a la traducción, con etiquetas de código Strong clicables debajo de cada palabra.
3. **Strong** (antes llamado "Diccionario"): panel dedicado que muestra las entradas Strong del capítulo; comentario del propio código aclara que esto **reemplazó** un panel de Diccionario viejo que "estaba vacío hasta que el usuario tocaba un código Strong" (`app.js:4552-4555`) — hoy viene poblado de entrada.
Tocar cualquier código Strong (desde el interlineal, el texto principal si tiene etiquetas, o este panel) abre un popup flotante con la definición y navegación a "palabras relacionadas". Es un interlineal real con morfología, no una lista simplificada de "palabras clave".

**Historia de la Iglesia, Padres Apostólicos, Costumbres, Extracanónico, Diccionarios, Conversor** — todos viven en un **riel lateral de pestañas** (`tab-rail`/`library-rail` en `index.html`) que **reemplaza** el panel de lectura normal cuando se abren (no hay vista simultánea "Biblia + Historia" lado a lado en el layout normal de estudio) — cada uno tiene su propio patrón de 3 niveles (estante de portadas → índice de la obra → entrada), documentado por cantidad de obras en la sección 2 de este informe.

**Modo "Preparación de Bosquejo/Estudio" (editor de sermones).** No es una ventana aparte: es un **toggle que reemplaza** la vista de lectura normal por un layout de 3 columnas (Biblia de referencia + editor + panel lateral de apoyo), confirmado en `toggleSermonMode` (`app.js:1807-1823`): `readingPane` se oculta, `editorPane` se muestra. Dentro de este modo, Comparar/Comentario/Notas/Mis prédicas/Diccionario vuelven a estar disponibles en un segundo panel lateral propio del modo sermón, sin salir del editor. Recordatorio ya señalado en la sección 2: **no autoguarda**.

**Buscador.** Botón de búsqueda propio en la barra superior (`els.search`), abre un panel de resultados (`openPanel('buscar')`) con dos modalidades: texto libre y semántico (los 3 índices ya descritos en la sección 2 — biblia ES, biblia EN, Historia de la Iglesia; **no cubre comentarios**). Vive integrado en el mismo panel lateral que todo lo demás, no es una página separada.

**Notas.** Ya documentado en detalle en la sección 2 (popup unificado, 6 categorías) — no se repite acá.

**Limitaciones reales encontradas dentro de `biblia/` que un usuario nuevo podría notar:**
- Los textos de "está en preparación" que existen en el i18n (`i18n/es.json:307,324,340,660`, para Padres/Costumbres/Diccionarios/Extracanónico) son estados de **respaldo defensivos** que solo se muestran si el estante de esa sección viniera vacío — hoy NO se activan en la práctica porque las 4 secciones tienen contenido real cargado (11, 2, 3 y 3 obras respectivamente). No es una limitación activa hoy, pero es texto que sigue en el código por si algo falla al cargar.
- La "Biblia Verbo con Strong" es provisional (ver sección 2) — es la única Biblia local marcada como no terminada.

---

## 3. Qué NO está listo (para no prometer de más)

- **`seminario/` ya NO EXISTE en el repo — fue eliminado por completo**, no es un placeholder. Confirmado por historial de git: commits `b54a9188` ("Quitar Seminario de la portada") y `c7d0e90a` ("Eliminar Seminario del sitio (no va a existir en Verbo)"). No debería aparecer en ninguna descripción, ni siquiera como "próximamente".
- **`biblia/modules/library-drafts/`** existe y contiene 2 carpetas vacías: `la-esclavitud-de-la-voluntad-es/` y `the-bondage-of-the-will-en/` (Lutero, *La esclavitud de la voluntad* / *The Bondage of the Will*) — ninguna de las dos tiene archivos adentro todavía, y ninguna aparece en `libreria/data/libreria.json`. Es un borrador sin empezar, no una obra a medio publicar.
- Currículo de escuela dominical para adultos (104 lecciones): no existe rastro en el código, ver sección 2.

---

## 4. Diferenciadores reales frente a competencia de pago

Búsqueda explícita en todo el código de cualquier mecanismo de pago, cuenta obligatoria o muro de suscripción (`grep -r "stripe\|payment\|subscription\|paywall\|checkout\|login required"` sobre `biblia/assets/*.js` y el resto de `assets/*.js` del sitio): **cero resultados**. No hay ningún módulo con paywall, no hay pasarela de pago integrada, no hay cuenta de usuario obligatoria en ningún punto (la sincronización usa magic link por email, no cuentas con contraseña). Esto es un hecho verificado en el código, no una afirmación de marketing — puede citarse como tal.

---

## Notas para quien escriba el copy nuevo

- La contradicción "compendio de recursos" (portal) vs. "biblioteca bíblica digital" (páginas internas) necesita una decisión antes de tocar meta descriptions.
- El editor de sermones **no tiene autoguardado** — cualquier copy que lo insinúe sería falso hoy.
- La "Biblia Verbo con Strong" es explícitamente provisional en su propio manifest — no listarla al mismo nivel que las ediciones terminadas sin aclararlo.
- El currículo de adultos de 104 lecciones no existe en producción — no mencionarlo como disponible.
- El estado de las tiendas de apps (Android/iOS) no se puede confirmar desde el código — preguntarle a Juan antes de afirmar nada sobre "disponible en Google Play" más allá de "existe una app Android".
- "Comparar versiones" son siempre DOS Biblias a la vez (la que se lee + una alterna elegida), nunca una vista de varias en paralelo — no describirlo como "compara múltiples versiones simultáneamente".
- "Mi biblioteca" (Librería) es guardado/marcado personal con orden por "último abierto", no un sistema de progreso de lectura con porcentaje — el propio código lo dice explícitamente, no inventarle una barra de progreso en el copy.
- Devocionales son piezas temáticas cortas, no un plan de lectura diario fechado — no prometer "una devoción distinta cada día".
