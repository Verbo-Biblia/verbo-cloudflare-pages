/* ---------------------------------------------------------
   Estado global
--------------------------------------------------------- */
let presentWindow = null;
let detallesPantallas = null;
let pantallaDePresentacion = null;
let vigilandoPantallas = false;
let currentSlides = [];   // [{ tag, texto, referencia }]
let currentIndex = -1;
let currentTitle = "";
let fondoActual = { key: "negro", tipo: "css", css: "#000000", url: null };
let ordenCulto = [];
let ordenIndex = -1;
let fontSizeActual = Number(localStorage.getItem("tamano-letra")) || 6.2;
const CLAVE_VOLUMEN_MULTIMEDIA = "proyector-media-volume";
const volumenMultimediaGuardado = localStorage.getItem(CLAVE_VOLUMEN_MULTIMEDIA);
let mediaVolume = volumenMultimediaGuardado === null ? 0.7 : Number(volumenMultimediaGuardado);
if (!Number.isFinite(mediaVolume)) mediaVolume = 0.7;
mediaVolume = Math.min(1, Math.max(0, mediaVolume));
let mediaSeleccionadaId = null;
let audioActivo = { id: null, url: null, playing: false };
let visualActivo = { id: null, tipo: null, url: null, visible: false, playing: false };
let estadoVisualActual = { tipo: "clear", payload: null };

const slidesGrid = document.getElementById("slides-grid");
const itemTitle = document.getElementById("item-title");
const itemMeta = document.getElementById("item-meta");

const FONDOS = [
  { key: "negro", label: "Negro", css: "#000000", dataUrl: null },
  { key: "azul", label: "Azul", css: "linear-gradient(160deg,#0b1220,#1b2b4a)" },
  { key: "dorado", label: "Dorado", css: "linear-gradient(160deg,#241a08,#4a3312)" },
  { key: "morado", label: "Morado", css: "linear-gradient(160deg,#1a1024,#3a1f4a)" },
];

/* ---------------------------------------------------------
   Utilidades de envío a la ventana de presentación
--------------------------------------------------------- */
function enviar(msg) {
  if (presentWindow && !presentWindow.closed) {
    presentWindow.postMessage(msg, "*");
  }
}

function pantallaExternaDisponible() {
  if (!detallesPantallas?.screens?.length || detallesPantallas.screens.length < 2) return null;
  return detallesPantallas.screens.find((pantalla) => pantalla.isInternal === false)
    || detallesPantallas.screens.find((pantalla) => pantalla !== detallesPantallas.currentScreen && !pantalla.isPrimary)
    || detallesPantallas.screens.find((pantalla) => pantalla !== detallesPantallas.currentScreen)
    || null;
}

function mostrarEstadoPantallas(mensaje, esError = false) {
  const estado = document.getElementById("estado-pantallas");
  estado.textContent = mensaje;
  estado.classList.toggle("error", esError);
}

function colocarPresentacionEnPantalla(pantalla) {
  if (!presentWindow || presentWindow.closed || !pantalla) return;
  pantallaDePresentacion = pantalla;
  try {
    presentWindow.moveTo(pantalla.availLeft ?? pantalla.left, pantalla.availTop ?? pantalla.top);
    presentWindow.resizeTo(pantalla.availWidth ?? pantalla.width, pantalla.availHeight ?? pantalla.height);
    presentWindow.focus();
    mostrarEstadoPantallas(`Presentación en ${pantalla.label || "pantalla externa"}.`);
  } catch (error) {
    console.warn("No se pudo mover la presentación a la pantalla externa.", error);
  }
}

function colocarPresentacionEnVentanaLocal() {
  if (!presentWindow || presentWindow.closed) return;
  pantallaDePresentacion = null;
  const anchoDisponible = window.screen.availWidth || window.innerWidth;
  const altoDisponible = window.screen.availHeight || window.innerHeight;
  const ancho = Math.min(1024, Math.max(640, Math.round(anchoDisponible * 0.8)));
  const alto = Math.min(576, Math.max(360, Math.round(altoDisponible * 0.7)));
  const izquierda = (window.screen.availLeft ?? 0) + Math.max(0, Math.round((anchoDisponible - ancho) / 2));
  const arriba = (window.screen.availTop ?? 0) + Math.max(0, Math.round((altoDisponible - alto) / 2));
  try {
    presentWindow.resizeTo(ancho, alto);
    presentWindow.moveTo(izquierda, arriba);
    presentWindow.focus();
  } catch (error) {
    console.warn("No se pudo ajustar la presentación en modo ventana.", error);
  }
}

function vigilarCambiosDePantallas() {
  if (!detallesPantallas || vigilandoPantallas) return;
  vigilandoPantallas = true;
  detallesPantallas.addEventListener("screenschange", () => {
    if (!presentWindow || presentWindow.closed) {
      pantallaDePresentacion = null;
      return;
    }
    if (pantallaDePresentacion && !detallesPantallas.screens.includes(pantallaDePresentacion)) {
      presentWindow.close();
      presentWindow = null;
      pantallaDePresentacion = null;
      mostrarEstadoPantallas("Pantalla externa desconectada; presentación cerrada.");
      return;
    }
    const externa = pantallaExternaDisponible();
    if (externa && externa !== pantallaDePresentacion) colocarPresentacionEnPantalla(externa);
  });
}

async function abrirPresentacion() {
  if (!presentWindow || presentWindow.closed) {
    // Se abre durante el clic para evitar que el bloqueador de ventanas la
    // rechace mientras esperamos el permiso de administración de pantallas.
    presentWindow = window.open(
      "presentacion.html",
      "presentacion",
      "popup=yes,width=1024,height=576",
    );
  }
  if (!presentWindow) {
    mostrarEstadoPantallas("Chrome bloqueó la ventana de presentación.", true);
    return;
  }

  let pantalla = null;
  if ("getScreenDetails" in window) {
    try {
      detallesPantallas ||= await window.getScreenDetails();
      vigilarCambiosDePantallas();
      pantalla = pantallaExternaDisponible();
    } catch (error) {
      mostrarEstadoPantallas("Permite administrar ventanas para usar la salida HDMI.", true);
      console.warn("No se concedió acceso a las pantallas.", error);
    }
  }

  if (pantalla) colocarPresentacionEnPantalla(pantalla);
  else {
    colocarPresentacionEnVentanaLocal();
    mostrarEstadoPantallas("Sin pantalla externa: presentación abierta en modo ventana.");
  }
}

document.getElementById("btn-open-presentation").addEventListener("click", abrirPresentacion);

// Cuando la ventana de presentación avisa que ya cargó, le re-enviamos
// el estado actual (por si ya había algo seleccionado).
window.addEventListener("message", (event) => {
  if (event.data && event.data.type === "presentacion-lista") {
    enviar({ type: "fondo", payload: fondoActual });
    enviar({ type: "fontSize", payload: { valor: fontSizeActual } });
    enviar({ type: "mediaVolume", payload: { volumen: mediaVolume } });
    if (audioActivo.url) {
      enviar({ type: "mediaAudioSource", payload: audioActivo });
      enviar({
        type: "mediaAudioControl",
        payload: { accion: audioActivo.playing ? "play" : "pause", volumen: mediaVolume },
      });
    }
    if (visualActivo.url) {
      enviar({ type: "mediaVisualSource", payload: visualActivo });
    }
    if (estadoVisualActual.tipo === "media") {
      enviar({
        type: "mediaVisualControl",
        payload: {
          accion: visualActivo.tipo === "imagen" ? "show" : (visualActivo.playing ? "play" : "pause"),
          volumen: mediaVolume,
        },
      });
    } else if (estadoVisualActual.tipo === "slide") {
      enviar({ type: "slide", payload: estadoVisualActual.payload });
    } else {
      enviar({ type: estadoVisualActual.tipo === "blank" ? "blank" : "clear" });
    }
  }
  if (event.data && event.data.type === "media-error") {
    const tipo = event.data.payload?.tipo;
    if (tipo === "audio") audioActivo.playing = false;
    if (tipo === "video") visualActivo.playing = false;
    actualizarControlesMultimedia();
    console.warn("La presentación no pudo reproducir multimedia:", event.data.payload?.mensaje);
  }
  if (event.data && event.data.type === "media-time") {
    const { tipo, id, currentTime } = event.data.payload || {};
    if (tipo === "audio" && audioActivo.id === id) audioActivo.currentTime = Number(currentTime) || 0;
    if (tipo === "video" && visualActivo.id === id) visualActivo.currentTime = Number(currentTime) || 0;
  }
});

/* ---------------------------------------------------------
   Tamaño global de letra en vivo
--------------------------------------------------------- */
const fontSizeSlider = document.getElementById("font-size-slider");
const fontSizeValue = document.getElementById("font-size-value");
fontSizeActual = Math.min(10, Math.max(3.8, fontSizeActual));
fontSizeSlider.value = String(fontSizeActual);
fontSizeValue.value = fontSizeActual.toFixed(1);

fontSizeSlider.addEventListener("input", () => {
  fontSizeActual = Number(fontSizeSlider.value);
  fontSizeValue.value = fontSizeActual.toFixed(1);
  localStorage.setItem("tamano-letra", String(fontSizeActual));
  enviar({ type: "fontSize", payload: { valor: fontSizeActual } });
});

/* ---------------------------------------------------------
   Pestañas (Canciones / Biblia)
--------------------------------------------------------- */
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("panel-" + btn.dataset.tab).classList.add("active");
  });
});

/* ---------------------------------------------------------
   Lista de canciones
--------------------------------------------------------- */
const listaCanciones = document.getElementById("lista-canciones");
const CLAVE_CANCIONES_USUARIO = "canciones-usuario";
const BD_PROYECTOR = "proyector-local";
const ALMACEN_PROYECTOR = "biblioteca";
const IDS_MUESTRAS_RETIRADAS = new Set(["c1", "c2", "c3"]);
let registrosCancionesUsuario = cargarRegistrosCancionesUsuario();

function retirarCancionesMuestra(registros) {
  return Array.isArray(registros)
    ? registros.filter((registro) => !IDS_MUESTRAS_RETIRADAS.has(registro?.id))
    : [];
}

function abrirBaseLocal() {
  return new Promise((resolve, reject) => {
    const solicitud = indexedDB.open(BD_PROYECTOR, 1);
    solicitud.onupgradeneeded = () => {
      if (!solicitud.result.objectStoreNames.contains(ALMACEN_PROYECTOR)) {
        solicitud.result.createObjectStore(ALMACEN_PROYECTOR);
      }
    };
    solicitud.onsuccess = () => resolve(solicitud.result);
    solicitud.onerror = () => reject(solicitud.error);
  });
}

async function escribirBibliotecaIndexedDB(registros) {
  const bd = await abrirBaseLocal();
  return new Promise((resolve, reject) => {
    const tx = bd.transaction(ALMACEN_PROYECTOR, "readwrite");
    tx.objectStore(ALMACEN_PROYECTOR).put(registros, CLAVE_CANCIONES_USUARIO);
    tx.oncomplete = () => { bd.close(); resolve(); };
    tx.onerror = () => { bd.close(); reject(tx.error); };
  });
}

async function leerBibliotecaIndexedDB() {
  const bd = await abrirBaseLocal();
  return new Promise((resolve, reject) => {
    const tx = bd.transaction(ALMACEN_PROYECTOR, "readonly");
    const solicitud = tx.objectStore(ALMACEN_PROYECTOR).get(CLAVE_CANCIONES_USUARIO);
    solicitud.onsuccess = () => { bd.close(); resolve(solicitud.result); };
    solicitud.onerror = () => { bd.close(); reject(solicitud.error); };
  });
}

function cargarRegistrosCancionesUsuario() {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE_CANCIONES_USUARIO) || "[]");
    const registros = retirarCancionesMuestra(datos);
    if (Array.isArray(datos) && registros.length !== datos.length) {
      localStorage.setItem(CLAVE_CANCIONES_USUARIO, JSON.stringify(registros));
    }
    return registros;
  } catch (error) {
    console.warn("No se pudo leer la biblioteca de canciones del usuario.", error);
    return [];
  }
}

function guardarRegistrosCancionesUsuario() {
  localStorage.setItem(CLAVE_CANCIONES_USUARIO, JSON.stringify(registrosCancionesUsuario));
  escribirBibliotecaIndexedDB(registrosCancionesUsuario).catch((error) => {
    console.warn("No se pudo guardar la copia local en IndexedDB.", error);
  });
}

async function inicializarPersistenciaCanciones() {
  try {
    const copiaLocal = await leerBibliotecaIndexedDB();
    if (!localStorage.getItem(CLAVE_CANCIONES_USUARIO) && Array.isArray(copiaLocal)) {
      registrosCancionesUsuario = retirarCancionesMuestra(copiaLocal);
      localStorage.setItem(CLAVE_CANCIONES_USUARIO, JSON.stringify(registrosCancionesUsuario));
      renderCanciones(document.getElementById("search-canciones").value);
    }
    if (!Array.isArray(copiaLocal) || copiaLocal.length !== registrosCancionesUsuario.length) {
      await escribirBibliotecaIndexedDB(registrosCancionesUsuario);
    }
  } catch (error) {
    console.warn("IndexedDB no está disponible; se mantiene localStorage y el respaldo JSON.", error);
  }
}

function obtenerCanciones() {
  const biblioteca = new Map(CANCIONES.map((c) => [c.id, c]));
  registrosCancionesUsuario.forEach((registro) => {
    if (!registro || !registro.id) return;
    if (registro.eliminado) biblioteca.delete(registro.id);
    else biblioteca.set(registro.id, registro);
  });
  return [...biblioteca.values()].sort((a, b) => a.titulo.localeCompare(b.titulo, "es"));
}

function renderCanciones(filtro = "") {
  const q = filtro.trim().toLowerCase();
  const items = obtenerCanciones().filter((c) =>
    `${c.titulo} ${c.autor}`.toLowerCase().includes(q)
  );
  listaCanciones.innerHTML = "";
  items.forEach((c) => {
    const div = document.createElement("div");
    div.className = "list-item song-list-item";
    const copy = document.createElement("div");
    copy.className = "song-list-copy";
    const title = document.createElement("div");
    title.className = "title";
    title.textContent = c.titulo;
    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = c.autor;
    copy.append(title, meta);
    const acciones = document.createElement("div");
    acciones.className = "song-list-actions";
    const agregar = document.createElement("button");
    agregar.className = "icon-btn song-add";
    agregar.type = "button";
    agregar.textContent = "+";
    agregar.title = `Agregar ${c.titulo} completa al orden del culto`;
    agregar.setAttribute("aria-label", `Agregar ${c.titulo} completa al orden del culto`);
    agregar.addEventListener("click", (event) => {
      event.stopPropagation();
      agregarCancionAOrden(c);
    });
    const editar = document.createElement("button");
    editar.className = "icon-btn";
    editar.type = "button";
    editar.textContent = "✎";
    editar.title = `Editar ${c.titulo}`;
    editar.setAttribute("aria-label", `Editar ${c.titulo}`);
    editar.addEventListener("click", (event) => {
      event.stopPropagation();
      abrirEditorCancion(c);
    });
    acciones.append(agregar, editar);
    div.append(copy, acciones);
    div.addEventListener("click", () => seleccionarCancion(c, div));
    listaCanciones.appendChild(div);
  });
}
renderCanciones();
inicializarPersistenciaCanciones();

/* ---------------------------------------------------------
   Editor, persistencia y respaldos de canciones
--------------------------------------------------------- */
const editorCancion = document.getElementById("editor-cancion");
const formCancion = document.getElementById("form-cancion");
const camposEstrofas = document.getElementById("campos-estrofas");
const errorCancion = document.getElementById("error-cancion");
const consultaLetra = document.getElementById("consulta-letra");
const estadoBusquedaLetra = document.getElementById("estado-busqueda-letra");
const resultadosLetras = document.getElementById("resultados-letras");
const importadorLetra = document.getElementById("importador-letra");
const letraImportada = document.getElementById("letra-importada");
const archivoCancionPdf = document.getElementById("archivo-cancion-pdf");
const estadoImportarPdf = document.getElementById("estado-importar-pdf");
const acordeonLetra = document.getElementById("acordeon-letra");
let idCancionEnEdicion = null;

function crearIdCancion() {
  return `usuario-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function dividirTextoEnEstrofas(texto) {
  return String(texto || "").replace(/\r\n?/g, "\n").trim()
    .split(/\n\s*\n+/).map((bloque) => bloque.trim()).filter(Boolean);
}

function ajustarAlturaEstrofa(textarea) {
  textarea.style.height = "auto";
  textarea.style.height = `${textarea.scrollHeight}px`;
}

function agregarCampoEstrofa(texto = "") {
  const row = document.createElement("div");
  row.className = "verse-field";
  const numero = camposEstrofas.children.length + 1;
  const pill = document.createElement("span");
  pill.className = "verse-field-pill";
  pill.textContent = `Estrofa ${numero}`;
  const textarea = document.createElement("textarea");
  textarea.rows = 3;
  textarea.required = true;
  textarea.value = texto;
  textarea.setAttribute("aria-label", pill.textContent);
  textarea.addEventListener("input", () => ajustarAlturaEstrofa(textarea));
  textarea.addEventListener("paste", (event) => {
    if (camposEstrofas.children.length !== 1 || textarea.value.trim()) return;
    const bloques = dividirTextoEnEstrofas(event.clipboardData?.getData("text/plain"));
    if (bloques.length < 2) return;
    event.preventDefault();
    camposEstrofas.innerHTML = "";
    bloques.forEach(agregarCampoEstrofa);
    errorCancion.textContent = `La letra se dividió automáticamente en ${bloques.length} estrofas.`;
  });
  const eliminar = document.createElement("button");
  eliminar.className = "icon-btn";
  eliminar.type = "button";
  eliminar.textContent = "×";
  eliminar.title = "Eliminar estrofa";
  eliminar.setAttribute("aria-label", "Eliminar estrofa");
  eliminar.addEventListener("click", () => {
    if (camposEstrofas.children.length === 1) {
      errorCancion.textContent = "La canción debe conservar al menos una estrofa.";
      return;
    }
    row.remove();
    actualizarNumerosEstrofas();
  });
  row.append(pill, textarea, eliminar);
  camposEstrofas.appendChild(row);
  ajustarAlturaEstrofa(textarea);
}

function actualizarNumerosEstrofas() {
  [...camposEstrofas.children].forEach((row, i) => {
    const texto = `Estrofa ${i + 1}`;
    row.querySelector(".verse-field-pill").textContent = texto;
    row.querySelector("textarea").setAttribute("aria-label", texto);
  });
}

function abrirEditorCancion(cancion = null) {
  idCancionEnEdicion = cancion?.id || null;
  formCancion.reset();
  camposEstrofas.innerHTML = "";
  errorCancion.textContent = "";
  consultaLetra.value = cancion ? `${cancion.titulo} ${cancion.autor}` : "";
  estadoBusquedaLetra.textContent = "";
  estadoBusquedaLetra.classList.remove("error");
  resultadosLetras.innerHTML = "";
  importadorLetra.hidden = true;
  letraImportada.value = "";
  estadoImportarPdf.textContent = "";
  estadoImportarPdf.classList.remove("error");
  acordeonLetra.open = false;
  document.getElementById("editor-cancion-titulo").textContent = cancion ? "Editar canción" : "Nueva canción";
  document.getElementById("cancion-id").value = idCancionEnEdicion || "";
  document.getElementById("cancion-titulo").value = cancion?.titulo || "";
  document.getElementById("cancion-autor").value = cancion?.autor || "";
  const estrofas = cancion?.estrofas || [""];
  const bloques = cancion?.coro
    ? estrofas.flatMap((estrofa) => [estrofa, `Coro\n${cancion.coro}`])
    : estrofas;
  bloques.forEach(agregarCampoEstrofa);
  document.getElementById("btn-eliminar-cancion").hidden = !cancion;
  editorCancion.showModal();
  camposEstrofas.querySelectorAll("textarea").forEach(ajustarAlturaEstrofa);
  document.getElementById("cancion-titulo").focus();
}

function cerrarEditorCancion() { editorCancion.close(); }

document.getElementById("btn-nueva-cancion").addEventListener("click", () => abrirEditorCancion());
document.getElementById("btn-agregar-estrofa").addEventListener("click", () => agregarCampoEstrofa());
document.getElementById("btn-cerrar-editor").addEventListener("click", cerrarEditorCancion);
document.getElementById("btn-cancelar-editor").addEventListener("click", cerrarEditorCancion);

function cambiarEstadoBusqueda(mensaje, esError = false) {
  estadoBusquedaLetra.textContent = mensaje;
  estadoBusquedaLetra.classList.toggle("error", esError);
}

function limpiarTituloDeVersion(titulo) {
  return String(titulo || "").replace(/\s*\([^)]*(remaster|live|version|edit|mix)[^)]*\)\s*$/i, "").trim();
}

function normalizarLetraInternet(texto) {
  let letra = String(texto || "").replace(/\r\n?/g, "\n");
  // Quita tiempos LRC, incluso cuando una línea contiene más de una marca.
  letra = letra.replace(/\[\d{1,2}:\d{2}(?:[.:]\d+)?\]/g, "");
  // Descarta metadatos LRC que no forman parte de la letra.
  letra = letra.replace(/^\s*\[(?:ar|al|ti|by|offset|length|re|ve):[^\]]*\]\s*$/gim, "");
  // Convierte encabezados habituales en separadores legibles de estrofa.
  letra = letra.replace(
    /^\s*\[(verse|verso|estrofa|chorus|coro|bridge|puente|pre[- ]?chorus|pre[- ]?coro|intro|outro|final|tag)([^\]]*)\]\s*$/gim,
    (_, nombre, detalle) => `\n\n${nombre}${detalle}`,
  );
  letra = letra.replace(
    /^\s*(verse|verso|estrofa|chorus|coro|bridge|puente|pre[- ]?chorus|pre[- ]?coro|intro|outro|final|tag)(\s*\d*)\s*:?[ \t]*$/gim,
    (_, nombre, detalle) => `\n\n${nombre}${detalle}`,
  );
  letra = letra.split("\n").map((linea) => linea.trimEnd()).join("\n")
    .replace(/[ \t]+$/gm, "").replace(/\n{3,}/g, "\n\n").trim();

  // Algunas fuentes entregan toda la canción como un párrafo continuo. En ese
  // caso crea bloques moderados para que la proyección siga siendo legible.
  if (!/\n\s*\n/.test(letra)) {
    const lineas = letra.split("\n").map((linea) => linea.trim()).filter(Boolean);
    if (lineas.length > 8) {
      const grupos = [];
      for (let i = 0; i < lineas.length; i += 4) grupos.push(lineas.slice(i, i + 4).join("\n"));
      letra = grupos.join("\n\n");
    }
  }
  return letra;
}

function pareceLineaDeAcordes(linea) {
  const acorde = /^(?:[A-G](?:#|b)?(?:m|maj|min|dim|aug|sus|add)?\d*(?:\/[A-G](?:#|b)?)?|N\.?C\.?|[-/|:xX0-9()]+)$/i;
  const partes = String(linea || "").replace(/\|/g, " | ").trim().split(/\s+/).filter(Boolean);
  return partes.length > 0 && partes.every((parte) => acorde.test(parte));
}

function limpiarTextoPdf(texto) {
  return String(texto || "").replace(/\r\n?/g, "\n")
    .replace(/\[[^\]\n]*\]/g, "")
    .split("\n")
    .filter((linea) => !pareceLineaDeAcordes(linea))
    .join("\n")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function extraerTextoPdf(archivo) {
  const pdfjs = await import("../vendor/pdfjs/pdf.min.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "vendor/pdfjs/pdf.worker.min.mjs",
    document.baseURI,
  ).href;
  const documento = await pdfjs.getDocument({ data: new Uint8Array(await archivo.arrayBuffer()) }).promise;
  const paginas = [];
  for (let numero = 1; numero <= documento.numPages; numero += 1) {
    const pagina = await documento.getPage(numero);
    const contenido = await pagina.getTextContent();
    let texto = "";
    contenido.items.forEach((item) => {
      if (typeof item.str !== "string") return;
      texto += item.str;
      texto += item.hasEOL ? "\n" : " ";
    });
    paginas.push(texto.trim());
  }
  return limpiarTextoPdf(paginas.filter(Boolean).join("\n\n"));
}

async function importarCancionPdf() {
  const archivo = archivoCancionPdf.files[0];
  archivoCancionPdf.value = "";
  if (!archivo) return;
  estadoImportarPdf.classList.remove("error");
  estadoImportarPdf.textContent = `Leyendo ${archivo.name}…`;
  const boton = document.getElementById("btn-importar-pdf");
  boton.disabled = true;
  try {
    let texto = await extraerTextoPdf(archivo);
    if (!texto) throw new Error("el PDF no contiene texto seleccionable; podría ser una imagen escaneada");
    const lineas = texto.split("\n");
    const indiceTonalidad = lineas.slice(0, 5).findIndex((linea) => /^\s*(?:tonalidad|key)\s*:/i.test(linea));
    if (indiceTonalidad >= 1) {
      if (!document.getElementById("cancion-titulo").value.trim()) {
        document.getElementById("cancion-titulo").value = lineas[0].trim();
      }
      if (indiceTonalidad >= 2 && !document.getElementById("cancion-autor").value.trim()) {
        document.getElementById("cancion-autor").value = lineas.slice(1, indiceTonalidad).join(" ").trim();
      }
      texto = lineas.slice(indiceTonalidad + 1).join("\n");
    } else if (!document.getElementById("cancion-titulo").value.trim()) {
      document.getElementById("cancion-titulo").value = archivo.name.replace(/\.pdf$/i, "");
    }
    letraImportada.value = normalizarLetraInternet(texto);
    importadorLetra.hidden = false;
    aplicarDivisionLetra();
    estadoImportarPdf.textContent = `PDF importado: ${documentoEstrofasActuales()} estrofas detectadas. Revisa el texto antes de guardar.`;
  } catch (error) {
    estadoImportarPdf.classList.add("error");
    estadoImportarPdf.textContent = `No se pudo importar: ${error.message}`;
  } finally {
    boton.disabled = false;
  }
}

function documentoEstrofasActuales() {
  return camposEstrofas.querySelectorAll("textarea").length;
}

async function buscarLetras() {
  const consulta = consultaLetra.value.trim();
  if (!consulta) {
    cambiarEstadoBusqueda("Escribe el título y, si lo conoces, el artista.", true);
    consultaLetra.focus();
    return;
  }
  resultadosLetras.innerHTML = "";
  importadorLetra.hidden = true;
  cambiarEstadoBusqueda("Buscando coincidencias…");
  const boton = document.getElementById("btn-buscar-letra");
  boton.disabled = true;
  try {
    const palabras = consulta.split(/\s+/).filter(Boolean);
    const consultas = [consulta];
    if (palabras.length >= 4) consultas.push(palabras.slice(0, -1).join(" "));
    if (palabras.length >= 3) consultas.push(palabras.slice(0, 2).join(" "));
    const respuestaLrclib = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(consulta)}`, {
      headers: { "Lrclib-Client": "ProyectorVerbo/0.1" },
    }).then((respuesta) => respuesta.ok ? respuesta.json() : []).catch(() => []);
    const resultadosLrclib = (Array.isArray(respuestaLrclib) ? respuestaLrclib : [])
      .filter((r) => !r.instrumental && (r.plainLyrics || r.syncedLyrics))
      .map((r) => ({
        id: `lrclib-${r.id}`,
        title: r.trackName,
        title_short: r.trackName,
        artist: { name: r.artistName },
        album: { title: r.albumName },
        letraDisponible: r.plainLyrics || r.syncedLyrics,
        fuente: "LRCLIB",
      }));
    const respuestas = await Promise.all([...new Set(consultas)].map(async (texto) => {
      const respuesta = await fetch(`https://api.lyrics.ovh/suggest/${encodeURIComponent(texto)}`);
      if (!respuesta.ok) return [];
      const datos = await respuesta.json();
      return Array.isArray(datos.data) ? datos.data : [];
    }));
    const vistos = new Set();
    const resultados = [...resultadosLrclib, ...respuestas.flat()].filter((resultado) => {
      const clave = `${resultado.artist?.name}|${resultado.title}`.toLocaleLowerCase("es");
      if (vistos.has(clave)) return false;
      vistos.add(clave);
      return true;
    }).slice(0, 15);
    if (!resultados.length) {
      cambiarEstadoBusqueda("No se encontraron coincidencias. Prueba agregando o quitando el artista.", true);
      return;
    }
    cambiarEstadoBusqueda(`Se encontraron ${resultados.length} opciones. Elige título, artista y versión:`);
    resultados.forEach((resultado) => {
      const botonResultado = document.createElement("button");
      botonResultado.className = "lyrics-result";
      botonResultado.type = "button";
      const titulo = document.createElement("strong");
      titulo.textContent = resultado.title || resultado.title_short || "Sin título";
      const detalle = document.createElement("span");
      detalle.textContent = `${resultado.artist?.name || "Artista desconocido"} · ${resultado.album?.title || "Versión no indicada"}${resultado.fuente ? ` · ${resultado.fuente}` : ""}`;
      botonResultado.append(titulo, detalle);
      botonResultado.addEventListener("click", () => importarResultadoLetra(resultado, botonResultado));
      resultadosLetras.appendChild(botonResultado);
    });
  } catch (error) {
    cambiarEstadoBusqueda(`No se pudo consultar el servicio de letras: ${error.message}. Revisa la conexión e inténtalo de nuevo.`, true);
  } finally {
    boton.disabled = false;
  }
}

async function importarResultadoLetra(resultado, botonResultado) {
  const artista = resultado.artist?.name || "";
  const titulo = resultado.title_short || resultado.title || "";
  document.querySelectorAll(".lyrics-result").forEach((b) => b.disabled = true);
  botonResultado.disabled = false;
  cambiarEstadoBusqueda(`Descargando “${titulo}” de ${artista}…`);
  try {
    let textoLetra = resultado.letraDisponible || "";
    if (!textoLetra) {
      const controlador = new AbortController();
      const limite = setTimeout(() => controlador.abort(), 20000);
      try {
        const respuesta = await fetch(
          `https://api.lyrics.ovh/v1/${encodeURIComponent(artista)}/${encodeURIComponent(titulo)}`,
          { signal: controlador.signal }
        );
        const datos = await respuesta.json().catch(() => ({}));
        if (!respuesta.ok || typeof datos.lyrics !== "string" || !datos.lyrics.trim()) {
          throw new Error(datos.error || "la letra no está disponible para esta versión");
        }
        textoLetra = datos.lyrics;
      } finally {
        clearTimeout(limite);
      }
    }
    document.getElementById("cancion-titulo").value = limpiarTituloDeVersion(titulo);
    document.getElementById("cancion-autor").value = artista;
    letraImportada.value = normalizarLetraInternet(textoLetra);
    importadorLetra.hidden = false;
    resultadosLetras.innerHTML = "";
    aplicarDivisionLetra();
    letraImportada.focus();
  } catch (error) {
    const mensaje = error.name === "AbortError" ? "el servicio tardó demasiado en responder" : error.message;
    cambiarEstadoBusqueda(`No se pudo descargar esta opción: ${mensaje}. Elige otra versión.`, true);
    document.querySelectorAll(".lyrics-result").forEach((b) => b.disabled = false);
  }
}

function aplicarDivisionLetra() {
  const bloques = dividirTextoEnEstrofas(letraImportada.value);
  if (!bloques.length) {
    cambiarEstadoBusqueda("La letra no contiene texto para dividir.", true);
    return;
  }
  camposEstrofas.innerHTML = "";
  bloques.forEach(agregarCampoEstrofa);
  cambiarEstadoBusqueda(`La letra se dividió en ${bloques.length} estrofas. Puedes agregar, editar o eliminar las que quieras.`);
}

document.getElementById("btn-buscar-letra").addEventListener("click", buscarLetras);
document.getElementById("btn-importar-pdf").addEventListener("click", () => archivoCancionPdf.click());
archivoCancionPdf.addEventListener("change", importarCancionPdf);
consultaLetra.addEventListener("keydown", (event) => {
  if (event.key === "Enter") { event.preventDefault(); buscarLetras(); }
});
document.getElementById("btn-dividir-letra").addEventListener("click", aplicarDivisionLetra);

formCancion.addEventListener("submit", (event) => {
  event.preventDefault();
  const estrofas = [...camposEstrofas.querySelectorAll("textarea")]
    .map((campo) => campo.value.trim())
    .filter(Boolean);
  if (!estrofas.length) {
    errorCancion.textContent = "Agrega al menos una estrofa con texto.";
    return;
  }
  const cancion = {
    // Una búsqueda nueva siempre crea un registro nuevo. Solo reutilizamos un
    // identificador cuando el editor se abrió expresamente con el lápiz.
    id: idCancionEnEdicion || crearIdCancion(),
    titulo: document.getElementById("cancion-titulo").value.trim(),
    autor: document.getElementById("cancion-autor").value.trim(),
    coro: "",
    estrofas,
  };
  registrosCancionesUsuario = registrosCancionesUsuario.filter((r) => r.id !== cancion.id);
  registrosCancionesUsuario.push(cancion);
  guardarRegistrosCancionesUsuario();
  cerrarEditorCancion();
  renderCanciones(document.getElementById("search-canciones").value);
});

document.getElementById("btn-eliminar-cancion").addEventListener("click", () => {
  const id = idCancionEnEdicion;
  const titulo = document.getElementById("cancion-titulo").value.trim();
  if (!id || !window.confirm(`¿Eliminar “${titulo}”?`)) return;
  registrosCancionesUsuario = registrosCancionesUsuario.filter((r) => r.id !== id);
  if (CANCIONES.some((c) => c.id === id)) registrosCancionesUsuario.push({ id, eliminado: true });
  guardarRegistrosCancionesUsuario();
  cerrarEditorCancion();
  renderCanciones(document.getElementById("search-canciones").value);
});

document.getElementById("btn-exportar-canciones").addEventListener("click", () => {
  const contenido = JSON.stringify({ version: 1, canciones: obtenerCanciones() }, null, 2);
  const enlace = document.createElement("a");
  enlace.href = URL.createObjectURL(new Blob([contenido], { type: "application/json" }));
  enlace.download = `respaldo-canciones-${new Date().toISOString().slice(0, 10)}.json`;
  enlace.click();
  URL.revokeObjectURL(enlace.href);
});

const archivoImportarCanciones = document.getElementById("archivo-importar-canciones");
document.getElementById("btn-importar-canciones").addEventListener("click", () => archivoImportarCanciones.click());
archivoImportarCanciones.addEventListener("change", async () => {
  const archivo = archivoImportarCanciones.files[0];
  archivoImportarCanciones.value = "";
  if (!archivo) return;
  try {
    const datos = JSON.parse(await archivo.text());
    const canciones = Array.isArray(datos) ? datos : datos.canciones;
    if (!Array.isArray(canciones) || canciones.some((c) =>
      !c || typeof c.id !== "string" || !c.id.trim() ||
      typeof c.titulo !== "string" || !c.titulo.trim() ||
      typeof c.autor !== "string" || !c.autor.trim() ||
      typeof c.coro !== "string" || !Array.isArray(c.estrofas) ||
      !c.estrofas.length || c.estrofas.some((e) => typeof e !== "string" || !e.trim())
    )) throw new Error("Formato de respaldo inválido");
    if (!window.confirm(`Este respaldo reemplazará la biblioteca actual con ${canciones.length} canciones. ¿Continuar?`)) return;
    const idsImportados = new Set(canciones.map((c) => c.id));
    const eliminadasBase = CANCIONES.filter((c) => !idsImportados.has(c.id)).map((c) => ({ id: c.id, eliminado: true }));
    registrosCancionesUsuario = [...canciones, ...eliminadasBase];
    guardarRegistrosCancionesUsuario();
    renderCanciones(document.getElementById("search-canciones").value);
    window.alert("Respaldo importado correctamente.");
  } catch (error) {
    window.alert(`No se pudo importar el respaldo: ${error.message}`);
  }
});

document.getElementById("search-canciones").addEventListener("input", (e) => {
  renderCanciones(e.target.value);
});

function crearDiapositivasCancion(cancion) {
  const slides = [];
  cancion.estrofas.forEach((estrofa, i) => {
    slides.push({ tag: `Estrofa ${i + 1}`, texto: estrofa, referencia: cancion.titulo });
    if (cancion.coro) {
      slides.push({ tag: "Coro", texto: cancion.coro, referencia: cancion.titulo });
    }
  });
  return slides;
}

function seleccionarCancion(cancion, elLista) {
  document.querySelectorAll("#lista-canciones .list-item").forEach((el) => el.classList.remove("selected"));
  elLista.classList.add("selected");

  cargarDiapositivas(crearDiapositivasCancion(cancion), cancion.titulo, `${cancion.autor}`, false, false);
}

/* ---------------------------------------------------------
   Biblia empaquetada: Versión A y Versión B, ambas opcionales.
   La que quede sola (sea A o B) se muestra centrada, sin idioma
   secundario; con las dos activas, B siempre va abajo.
--------------------------------------------------------- */
const RUTA_BIBLIAS = "modulos-biblia";
const VERSIONES_BIBLIA = [
  { id: "rv-verbo", etiqueta: "Biblia Verbo" },
  { id: "rvg-2004", etiqueta: "Reina-Valera Gómez 2004" },
  { id: "bsb", etiqueta: "Berean Standard Bible" },
  { id: "kjv-plano", etiqueta: "King James Version" },
];
const SIN_VERSION = "ninguna";
const CLAVE_VERSION_A = "biblia-version-a";
const CLAVE_VERSION_B = "biblia-version-b";
const selectVersionA = document.getElementById("select-version-a");
const selectVersionB = document.getElementById("select-version-b");
const selectLibro = document.getElementById("select-libro");
const selectCapitulo = document.getElementById("select-capitulo");
const listaVersiculos = document.getElementById("lista-versiculos");
const notaVersionBiblia = document.getElementById("bible-active-note");
const manifiestosBibliaCache = new Map();
let manifiestoPrincipal = null;
let manifiestoSecundario = null;
let cargaBibliaActual = 0;

async function cargarJson(ruta) {
  const respuesta = await fetch(ruta);
  if (!respuesta.ok) throw new Error(`No se pudo cargar ${ruta} (${respuesta.status})`);
  return respuesta.json();
}

function textoVersiculo(valor) {
  if (typeof valor === "string") return valor;
  return valor && typeof valor.text === "string" ? valor.text : "";
}

function etiquetaVersionBiblia(idVersion) {
  return VERSIONES_BIBLIA.find((v) => v.id === idVersion)?.etiqueta || idVersion;
}

async function cargarManifiestoVersion(idVersion) {
  if (manifiestosBibliaCache.has(idVersion)) return manifiestosBibliaCache.get(idVersion);
  const manifiesto = await cargarJson(`${RUTA_BIBLIAS}/${idVersion}/manifest.json`);
  manifiestosBibliaCache.set(idVersion, manifiesto);
  return manifiesto;
}

// Versiones elegidas y activas, en orden A luego B. Si A quedó en
// "Ninguna" pero B tiene una versión, esa versión pasa a ocupar el
// primer lugar (única versión → se muestra sola, centrada).
function versionesActivas() {
  return [selectVersionA.value, selectVersionB.value].filter((id) => id !== SIN_VERSION);
}

function valorGuardadoODefault(clave, porDefecto) {
  const guardado = localStorage.getItem(clave);
  if (guardado === SIN_VERSION || VERSIONES_BIBLIA.some((v) => v.id === guardado)) return guardado;
  return porDefecto;
}

function poblarSelectsVersionBiblia() {
  [selectVersionA, selectVersionB].forEach((select) => {
    select.innerHTML = "";
    const optNinguna = document.createElement("option");
    optNinguna.value = SIN_VERSION;
    optNinguna.textContent = "Ninguna";
    select.appendChild(optNinguna);
    VERSIONES_BIBLIA.forEach((version) => {
      const opt = document.createElement("option");
      opt.value = version.id;
      opt.textContent = version.etiqueta;
      select.appendChild(opt);
    });
  });

  selectVersionA.value = valorGuardadoODefault(CLAVE_VERSION_A, "rvg-2004");
  selectVersionB.value = valorGuardadoODefault(CLAVE_VERSION_B, SIN_VERSION);
}

function llenarCapitulos() {
  const libro = manifiestoPrincipal?.books.find((b) => b.number === Number(selectLibro.value));
  selectCapitulo.innerHTML = "";
  if (!libro) return;
  const libroGuardado = sessionStorage.getItem("biblia-libro");
  const capituloGuardado = libroGuardado === String(libro.number)
    ? Number(sessionStorage.getItem("biblia-capitulo"))
    : 1;
  // La cantidad real se confirma al cargar el libro; el manifiesto no la incluye.
  cargarLibroBiblia(libro, capituloGuardado);
}

function crearOpcionesCapitulo(cantidad, seleccionado) {
  selectCapitulo.innerHTML = "";
  for (let i = 1; i <= cantidad; i += 1) {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = i;
    selectCapitulo.appendChild(opt);
  }
  selectCapitulo.value = String(Math.min(Math.max(seleccionado, 1), cantidad));
}

async function cargarLibroBiblia(libroPrincipal, capituloPreferido = 1) {
  const token = ++cargaBibliaActual;
  listaVersiculos.innerHTML = '<div class="empty-state compact">Cargando capítulo…</div>';
  try {
    const [idPrincipal, idSecundario] = versionesActivas();
    const libroSecundario = idSecundario
      ? manifiestoSecundario?.books.find((b) => b.number === libroPrincipal.number)
      : null;
    const [datosPrincipal, datosSecundario] = await Promise.all([
      cargarJson(`${RUTA_BIBLIAS}/${idPrincipal}/${libroPrincipal.file}`),
      libroSecundario ? cargarJson(`${RUTA_BIBLIAS}/${idSecundario}/${libroSecundario.file}`) : Promise.resolve(null),
    ]);
    if (token !== cargaBibliaActual) return;
    const capitulosDisponibles = [
      ...Object.keys(datosPrincipal.chapters).map(Number),
      ...(datosSecundario ? Object.keys(datosSecundario.chapters).map(Number) : []),
    ];
    crearOpcionesCapitulo(Math.max(...capitulosDisponibles), capituloPreferido);
    renderVersiculosBiblia(libroPrincipal, libroSecundario, datosPrincipal, datosSecundario, idPrincipal, idSecundario);
  } catch (error) {
    console.error(error);
    listaVersiculos.innerHTML = "";
    const aviso = document.createElement("div");
    aviso.className = "empty-state compact";
    aviso.textContent = `No se pudo cargar la Biblia: ${error.message}`;
    listaVersiculos.appendChild(aviso);
  }
}

let libroCargado = null;

function renderVersiculosBiblia(libroPrincipal, libroSecundario, datosPrincipal, datosSecundario, idPrincipal, idSecundario) {
  libroCargado = { libroPrincipal, libroSecundario, datosPrincipal, datosSecundario, idPrincipal, idSecundario };
  const capitulo = Number(selectCapitulo.value);
  const versosPrincipal = datosPrincipal.chapters[String(capitulo)] || {};
  const versosSecundario = (datosSecundario && datosSecundario.chapters[String(capitulo)]) || {};
  const numeros = [...new Set([...Object.keys(versosPrincipal), ...Object.keys(versosSecundario)])]
    .map(Number).sort((a, b) => a - b);
  listaVersiculos.innerHTML = "";

  const etiquetaPrincipal = etiquetaVersionBiblia(idPrincipal);
  const etiquetaSecundaria = libroSecundario ? etiquetaVersionBiblia(idSecundario) : "";
  const notaVersiones = libroSecundario ? `${etiquetaPrincipal} · ${etiquetaSecundaria}` : etiquetaPrincipal;
  const tituloCapitulo = libroSecundario ? `${libroPrincipal.name} / ${libroSecundario.name} ${capitulo}` : `${libroPrincipal.name} ${capitulo}`;
  notaVersionBiblia.textContent = notaVersiones;

  const slides = numeros.map((numero) => {
    const textoPrincipal = textoVersiculo(versosPrincipal[String(numero)]);
    if (!libroSecundario) {
      return {
        tag: `v. ${numero}`,
        texto: textoPrincipal,
        referencia: `${libroPrincipal.name} ${capitulo}:${numero} · ${etiquetaPrincipal}`,
      };
    }
    const textoSecundario = textoVersiculo(versosSecundario[String(numero)]);
    return {
      tag: `v. ${numero}`,
      texto: `${textoPrincipal}\n\n${textoSecundario}`,
      textoEs: textoPrincipal,
      textoEn: textoSecundario,
      referencia: `${libroPrincipal.name} / ${libroSecundario.name} ${capitulo}:${numero} · ${notaVersiones}`,
    };
  });

  numeros.forEach((numero, i) => {
    const div = document.createElement("div");
    div.className = "list-item verse-list-item";
    const copy = document.createElement("div");
    copy.className = "verse-list-copy";
    const titulo = document.createElement("div");
    titulo.className = "title";
    titulo.textContent = `Versículo ${numero}`;
    const meta = document.createElement("div");
    meta.className = "meta verse-preview";
    meta.textContent = textoVersiculo(versosPrincipal[String(numero)]);
    copy.append(titulo, meta);
    const agregar = crearBotonAgregarOrden(slides[i]);
    div.append(copy, agregar);
    div.addEventListener("click", () => {
      document.querySelectorAll("#lista-versiculos .list-item").forEach((el) => el.classList.remove("selected"));
      div.classList.add("selected");
      cargarDiapositivas(slides, tituloCapitulo, notaVersiones);
      irADiapositiva(i);
    });
    listaVersiculos.appendChild(div);
  });
  sessionStorage.setItem("biblia-libro", libroPrincipal.number);
  sessionStorage.setItem("biblia-capitulo", capitulo);
  cargarDiapositivas(slides, tituloCapitulo, notaVersiones, true);
}

async function inicializarBiblias() {
  const activas = versionesActivas();
  if (!activas.length) {
    manifiestoPrincipal = null;
    manifiestoSecundario = null;
    libroCargado = null;
    selectLibro.innerHTML = "";
    selectCapitulo.innerHTML = "";
    selectLibro.disabled = true;
    selectCapitulo.disabled = true;
    notaVersionBiblia.textContent = "";
    listaVersiculos.innerHTML = '<div class="empty-state compact">Elegí al menos una versión de la Biblia.</div>';
    cargarDiapositivas([], "", "", true);
    return;
  }
  selectLibro.disabled = false;
  selectCapitulo.disabled = false;
  try {
    const [idPrincipal, idSecundario] = activas;
    manifiestoPrincipal = await cargarManifiestoVersion(idPrincipal);
    manifiestoSecundario = idSecundario ? await cargarManifiestoVersion(idSecundario) : null;
    selectLibro.innerHTML = "";
    manifiestoPrincipal.books.forEach((libro) => {
      const opt = document.createElement("option");
      opt.value = libro.number;
      opt.textContent = libro.name;
      selectLibro.appendChild(opt);
    });
    selectLibro.value = sessionStorage.getItem("biblia-libro") || "1";
    llenarCapitulos();
  } catch (error) {
    console.error(error);
    listaVersiculos.textContent = `No se pudieron iniciar las Biblias: ${error.message}`;
  }
}

selectLibro.addEventListener("change", llenarCapitulos);
selectCapitulo.addEventListener("change", () => {
  if (libroCargado) renderVersiculosBiblia(
    libroCargado.libroPrincipal, libroCargado.libroSecundario,
    libroCargado.datosPrincipal, libroCargado.datosSecundario,
    libroCargado.idPrincipal, libroCargado.idSecundario
  );
});
selectVersionA.addEventListener("change", () => {
  localStorage.setItem(CLAVE_VERSION_A, selectVersionA.value);
  inicializarBiblias();
});
selectVersionB.addEventListener("change", () => {
  localStorage.setItem(CLAVE_VERSION_B, selectVersionB.value);
  inicializarBiblias();
});
poblarSelectsVersionBiblia();
inicializarBiblias();

/* ---------------------------------------------------------
   Grid de diapositivas + navegación
--------------------------------------------------------- */
function cargarDiapositivas(slides, titulo, meta, soloMostrarGrid = false, permitirAgregarFragmentos = true) {
  currentSlides = slides;
  currentTitle = titulo;
  currentIndex = -1;

  itemTitle.textContent = titulo;
  itemMeta.textContent = meta || "";

  slidesGrid.innerHTML = "";
  slides.forEach((s, i) => {
    const card = document.createElement("div");
    card.className = "slide-card";
    card.dataset.index = i;
    const tag = document.createElement("div");
    tag.className = "tag";
    tag.textContent = s.tag;
    const snippet = document.createElement("div");
    snippet.className = "snippet";
    snippet.textContent = s.texto.slice(0, 90);
    card.append(tag, snippet);
    if (permitirAgregarFragmentos) card.appendChild(crearBotonAgregarOrden(s));
    card.addEventListener("click", () => irADiapositiva(i));
    slidesGrid.appendChild(card);
  });

  if (!soloMostrarGrid && slides.length) {
    // No enviamos automáticamente a pantalla al elegir canción/pasaje;
    // el operador elige la estrofa/versículo exacto con un clic.
  }
}

/* ---------------------------------------------------------
   Orden del culto (guion independiente)
--------------------------------------------------------- */
const orderList = document.getElementById("order-list");
const orderCount = document.getElementById("order-count");

function crearBotonAgregarOrden(slide) {
  const boton = document.createElement("button");
  boton.className = "slide-add";
  boton.type = "button";
  boton.textContent = "+";
  boton.title = "Agregar al orden del culto";
  boton.setAttribute("aria-label", `Agregar ${slide.tag} al orden del culto`);
  boton.addEventListener("click", (event) => {
    event.stopPropagation();
    agregarAOrden(slide);
  });
  return boton;
}

function agregarAOrden(slide) {
  ordenCulto.push({
    id: `orden-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    tipo: "versiculo",
    tag: slide.tag,
    texto: slide.texto,
    textoEs: slide.textoEs,
    textoEn: slide.textoEn,
    referencia: slide.referencia,
  });
  renderOrdenCulto();
  const ultimo = orderList.lastElementChild;
  if (ultimo) ultimo.scrollIntoView({ block: "nearest" });
}

function agregarCancionAOrden(cancion) {
  const slides = crearDiapositivasCancion(cancion);
  ordenCulto.push({
    id: `orden-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    tipo: "cancion",
    tag: cancion.titulo,
    titulo: cancion.titulo,
    autor: cancion.autor,
    slides,
  });
  renderOrdenCulto();
  const ultimo = orderList.lastElementChild;
  if (ultimo) ultimo.scrollIntoView({ block: "nearest" });
}

function moverElementoOrden(index, cambio) {
  const destino = index + cambio;
  if (destino < 0 || destino >= ordenCulto.length) return;
  [ordenCulto[index], ordenCulto[destino]] = [ordenCulto[destino], ordenCulto[index]];
  if (ordenIndex === index) ordenIndex = destino;
  else if (ordenIndex === destino) ordenIndex = index;
  renderOrdenCulto();
}

function limpiarMedioEliminado(item) {
  if (!item?.url) return;
  if (mediaSeleccionadaId === item.id) mediaSeleccionadaId = null;
  if (item.tipo === "audio" && audioActivo.id === item.id) {
    enviar({ type: "mediaAudioSource", payload: { id: null, url: "" } });
    audioActivo = { id: null, url: null, playing: false };
  }
  if (["video", "imagen"].includes(item.tipo) && visualActivo.id === item.id) {
    enviar({ type: "mediaVisualSource", payload: { id: null, tipo: null, url: "" } });
    visualActivo = { id: null, tipo: null, url: null, visible: false, playing: false };
    ocultarMediaPreview();
    if (estadoVisualActual.tipo === "media") {
      estadoVisualActual = { tipo: "clear", payload: null };
      actualizarPreview("", false, false);
    }
  }
  actualizarControlesMultimedia();
  setTimeout(() => URL.revokeObjectURL(item.url), 0);
}

function eliminarElementoOrden(index) {
  const [eliminado] = ordenCulto.splice(index, 1);
  if (["audio", "video", "imagen"].includes(eliminado?.tipo)) limpiarMedioEliminado(eliminado);
  if (ordenIndex === index) ordenIndex = -1;
  else if (ordenIndex > index) ordenIndex -= 1;
  renderOrdenCulto();
}

function proyectarElementoOrden(index) {
  if (index < 0 || index >= ordenCulto.length) return;
  ordenIndex = index;
  const item = ordenCulto[index];
  if (["audio", "video", "imagen"].includes(item.tipo)) {
    mediaSeleccionadaId = item.id;
    actualizarControlesMultimedia();
    renderOrdenCulto();
    const activo = orderList.querySelector(".order-item.active");
    if (activo) activo.scrollIntoView({ block: "nearest" });
    return;
  }
  mediaSeleccionadaId = null;
  actualizarControlesMultimedia();
  if (item.tipo === "cancion") {
    cargarDiapositivas(item.slides, item.titulo, item.autor, false, false);
    if (item.slides.length) irADiapositiva(0);
    renderOrdenCulto();
    const activo = orderList.querySelector(".order-item.active");
    if (activo) activo.scrollIntoView({ block: "nearest" });
    return;
  }
  document.querySelectorAll(".slide-card").forEach((c) => c.classList.remove("active"));
  ocultarContenidoVisual();
  actualizarPreview(item.texto, true);
  const payload = {
    texto: item.texto,
    textoEs: item.textoEs,
    textoEn: item.textoEn,
    referencia: item.referencia,
  };
  estadoVisualActual = { tipo: "slide", payload };
  enviar({
    type: "slide",
    payload,
  });
  renderOrdenCulto();
  const activo = orderList.querySelector(".order-item.active");
  if (activo) activo.scrollIntoView({ block: "nearest" });
}

function crearControlOrden(texto, titulo, accion, deshabilitado = false, clase = "") {
  const boton = document.createElement("button");
  boton.type = "button";
  boton.textContent = texto;
  boton.title = titulo;
  boton.setAttribute("aria-label", titulo);
  boton.disabled = deshabilitado;
  if (clase) boton.className = clase;
  boton.addEventListener("click", accion);
  return boton;
}

function renderOrdenCulto() {
  orderCount.textContent = `${ordenCulto.length} ${ordenCulto.length === 1 ? "elemento" : "elementos"}`;
  orderList.innerHTML = "";
  if (!ordenCulto.length) {
    const vacio = document.createElement("div");
    vacio.className = "empty-state compact";
    vacio.textContent = "Agrega canciones, versículos o multimedia con los botones +.";
    orderList.appendChild(vacio);
    return;
  }
  ordenCulto.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = `order-item${index === ordenIndex ? " active" : ""}`;
    const proyectar = document.createElement("button");
    proyectar.className = "order-project";
    proyectar.type = "button";
    const tag = document.createElement("strong");
    tag.textContent = item.tag;
    const descripcion = document.createElement("span");
    if (item.tipo === "cancion") descripcion.textContent = item.autor;
    else if (["audio", "video", "imagen"].includes(item.tipo)) {
      descripcion.textContent = `${{ audio: "MP3", video: "Video", imagen: "Imagen" }[item.tipo]} · ${item.nombre}`;
    } else descripcion.textContent = `${item.referencia || "Sin referencia"} — ${item.texto.replace(/\n/g, " ")}`;
    proyectar.append(tag, descripcion);
    proyectar.addEventListener("click", () => proyectarElementoOrden(index));
    const controles = document.createElement("div");
    controles.className = "order-controls";
    controles.append(
      crearControlOrden("▲", "Subir", () => moverElementoOrden(index, -1), index === 0),
      crearControlOrden("▼", "Bajar", () => moverElementoOrden(index, 1), index === ordenCulto.length - 1),
      crearControlOrden("×", "Eliminar", () => eliminarElementoOrden(index), false, "remove")
    );
    row.append(proyectar, controles);
    orderList.appendChild(row);
  });
}

document.getElementById("btn-order-prev").addEventListener("click", () => {
  if (ordenCulto.length) proyectarElementoOrden(ordenIndex > 0 ? ordenIndex - 1 : 0);
});
document.getElementById("btn-order-next").addEventListener("click", () => {
  if (ordenCulto.length) proyectarElementoOrden(ordenIndex < ordenCulto.length - 1 ? ordenIndex + 1 : ordenCulto.length - 1);
});
renderOrdenCulto();

function agregarMultimediaAOrden(archivo, tipo) {
  const item = {
    id: `orden-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    tipo,
    tag: archivo.name,
    nombre: archivo.name,
    url: URL.createObjectURL(archivo),
    mime: archivo.type || "",
  };
  ordenCulto.push(item);
  renderOrdenCulto();
  const ultimo = orderList.lastElementChild;
  if (ultimo) ultimo.scrollIntoView({ block: "nearest" });
}

function configurarImportadorOrden({ inputId, buttonId, tipo }) {
  const input = document.getElementById(inputId);
  document.getElementById(buttonId).addEventListener("click", () => input.click());
  input.addEventListener("change", () => {
    const archivo = input.files[0];
    input.value = "";
    if (archivo) agregarMultimediaAOrden(archivo, tipo);
  });
}

configurarImportadorOrden({ inputId: "order-audio-file", buttonId: "btn-order-audio", tipo: "audio" });
configurarImportadorOrden({ inputId: "order-video-file", buttonId: "btn-order-video", tipo: "video" });
configurarImportadorOrden({ inputId: "order-image-file", buttonId: "btn-order-image", tipo: "imagen" });

/* ---------------------------------------------------------
   Columnas redimensionables: recursos → orden → proyección
--------------------------------------------------------- */
function configurarPanelRedimensionable({ separador, variable, panel, minimo, maximo, maximoActual, clave }) {
  const valorGuardado = Number(localStorage.getItem(clave));
  if (Number.isFinite(valorGuardado) && valorGuardado >= minimo && valorGuardado <= maximo) {
    establecer(valorGuardado);
  }

  function establecer(ancho) {
    const limiteSuperior = Math.max(minimo, Math.min(maximo, maximoActual ? maximoActual() : maximo));
    const limitado = Math.min(limiteSuperior, Math.max(minimo, Math.round(ancho)));
    document.documentElement.style.setProperty(variable, `${limitado}px`);
    localStorage.setItem(clave, String(limitado));
  }

  separador.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    const inicioX = event.clientX;
    const anchoInicial = panel.getBoundingClientRect().width;
    separador.classList.add("dragging");
    separador.setPointerCapture(event.pointerId);
    const mover = (movimiento) => establecer(anchoInicial + movimiento.clientX - inicioX);
    const terminar = () => {
      separador.classList.remove("dragging");
      separador.removeEventListener("pointermove", mover);
      separador.removeEventListener("pointerup", terminar);
      separador.removeEventListener("pointercancel", terminar);
    };
    separador.addEventListener("pointermove", mover);
    separador.addEventListener("pointerup", terminar);
    separador.addEventListener("pointercancel", terminar);
  });

  separador.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    establecer(panel.getBoundingClientRect().width + (event.key === "ArrowRight" ? 16 : -16));
  });
}

configurarPanelRedimensionable({
  separador: document.getElementById("sidebar-resizer"),
  variable: "--sidebar-width",
  panel: document.getElementById("sidebar"),
  minimo: 240,
  maximo: 400,
  maximoActual: () => window.innerWidth - document.getElementById("order-panel").getBoundingClientRect().width - 430,
  clave: "ancho-panel-recursos",
});
configurarPanelRedimensionable({
  separador: document.getElementById("order-resizer"),
  variable: "--order-width",
  panel: document.getElementById("order-panel"),
  minimo: 220,
  maximo: 380,
  maximoActual: () => window.innerWidth - document.getElementById("sidebar").getBoundingClientRect().width - 430,
  clave: "ancho-panel-orden",
});

function irADiapositiva(index, silencioso = false) {
  if (index < 0 || index >= currentSlides.length) return;
  currentIndex = index;

  document.querySelectorAll(".slide-card").forEach((c) => c.classList.remove("active"));
  const card = slidesGrid.querySelector(`[data-index="${index}"]`);
  if (card) {
    card.classList.add("active");
    card.scrollIntoView({ block: "nearest" });
  }

  const s = currentSlides[index];
  ocultarContenidoVisual();
  actualizarPreview(s.texto, true);

  const payload = {
    texto: s.texto,
    textoEs: s.textoEs,
    textoEn: s.textoEn,
    referencia: s.referencia,
  };
  estadoVisualActual = { tipo: "slide", payload };

  enviar({
    type: "slide",
    payload,
  });
}

function siguienteDiapositiva() {
  if (currentIndex + 1 < currentSlides.length) irADiapositiva(currentIndex + 1);
}

function anteriorDiapositiva() {
  if (currentIndex - 1 >= 0) irADiapositiva(currentIndex - 1);
}

/* ---------------------------------------------------------
   Vista previa / negro / limpiar
--------------------------------------------------------- */
const previewScreen = document.getElementById("preview-screen");
const previewTxt = document.getElementById("preview-txt");
const previewStatus = document.getElementById("preview-status");
const previewMediaVideo = document.getElementById("preview-media-video");
const previewMediaImage = document.getElementById("preview-media-image");

function ocultarMediaPreview() {
  previewMediaVideo.pause();
  previewMediaVideo.style.display = "none";
  previewMediaImage.style.display = "none";
}

function ocultarContenidoVisual() {
  if (visualActivo.tipo === "video") visualActivo.playing = false;
  visualActivo.visible = false;
  ocultarMediaPreview();
  enviar({ type: "mediaVisualControl", payload: { accion: "hide", volumen: mediaVolume } });
}

function actualizarPreview(texto, enVivo) {
  previewTxt.textContent = texto;
  previewScreen.classList.toggle("is-live", enVivo);
  previewStatus.textContent = enVivo ? "En pantalla" : "Sin señal";
}

document.getElementById("btn-blank").addEventListener("click", () => {
  ocultarContenidoVisual();
  estadoVisualActual = { tipo: "blank", payload: null };
  enviar({ type: "blank" });
  actualizarPreview("", false);
  previewStatus.textContent = "Pantalla negra";
});

document.getElementById("btn-clear").addEventListener("click", () => {
  ocultarContenidoVisual();
  estadoVisualActual = { tipo: "clear", payload: null };
  enviar({ type: "clear" });
  actualizarPreview("", false);
  currentIndex = -1;
  document.querySelectorAll(".slide-card").forEach((c) => c.classList.remove("active"));
});

/* ---------------------------------------------------------
   Fondos
--------------------------------------------------------- */
const bgControls = document.getElementById("bg-controls");
const previewBgVideo = document.getElementById("preview-bg-video");

function aplicarFondoControl(nuevoFondo) {
  if (fondoActual.url?.startsWith("blob:") && fondoActual.url !== nuevoFondo.url) {
    URL.revokeObjectURL(fondoActual.url);
  }
  fondoActual = nuevoFondo;
  previewBgVideo.pause();
  previewBgVideo.removeAttribute("src");
  previewBgVideo.style.display = "none";
  previewScreen.style.backgroundImage = "none";
  if (nuevoFondo.tipo === "video") {
    previewScreen.style.background = "#000";
    previewBgVideo.src = nuevoFondo.url;
    previewBgVideo.style.display = "block";
    previewBgVideo.play().catch(() => {});
  } else if (nuevoFondo.tipo === "imagen") {
    previewScreen.style.background = `center / cover no-repeat url(${nuevoFondo.url})`;
  } else {
    previewScreen.style.background = nuevoFondo.key === "negro" ? "#000" : nuevoFondo.css;
  }
  enviar({ type: "fondo", payload: fondoActual });
}

FONDOS.forEach((f) => {
  const sw = document.createElement("div");
  sw.className = "bg-swatch" + (f.key === "negro" ? " selected" : "");
  sw.style.background = f.css;
  sw.title = f.label;
  sw.addEventListener("click", () => {
    document.querySelectorAll(".bg-swatch").forEach((s) => s.classList.remove("selected"));
    sw.classList.add("selected");
    aplicarFondoControl({ key: f.key, tipo: "css", css: f.css, url: null });
  });
  bgControls.appendChild(sw);
});

const fileInput = document.createElement("input");
fileInput.type = "file";
fileInput.accept = "image/*";
fileInput.style.display = "none";
fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;
  aplicarFondoControl({ key: "imagen", tipo: "imagen", url: URL.createObjectURL(file), nombre: file.name });
  document.querySelectorAll(".bg-swatch").forEach((s) => s.classList.remove("selected"));
  fileInput.value = "";
});
bgControls.appendChild(fileInput);

const btnSubirFondo = document.createElement("button");
btnSubirFondo.className = "btn";
btnSubirFondo.style.padding = "6px 10px";
btnSubirFondo.style.fontSize = "12px";
btnSubirFondo.textContent = "+ Imagen";
btnSubirFondo.addEventListener("click", () => fileInput.click());
bgControls.appendChild(btnSubirFondo);

const videoInput = document.createElement("input");
videoInput.type = "file";
videoInput.accept = "video/*";
videoInput.hidden = true;
videoInput.addEventListener("change", () => {
  const file = videoInput.files[0];
  if (!file) return;
  aplicarFondoControl({ key: "video", tipo: "video", url: URL.createObjectURL(file), nombre: file.name });
  document.querySelectorAll(".bg-swatch").forEach((s) => s.classList.remove("selected"));
  videoInput.value = "";
});
bgControls.appendChild(videoInput);

const btnSubirVideo = document.createElement("button");
btnSubirVideo.className = "btn";
btnSubirVideo.style.padding = "6px 10px";
btnSubirVideo.style.fontSize = "12px";
btnSubirVideo.textContent = "+ Video";
btnSubirVideo.addEventListener("click", () => videoInput.click());
bgControls.appendChild(btnSubirVideo);

/* ---------------------------------------------------------
   Multimedia del Orden: selección + controles globales
--------------------------------------------------------- */
const btnMediaPlay = document.getElementById("btn-media-play");
const btnMediaPause = document.getElementById("btn-media-pause");
const mediaVolumeInput = document.getElementById("media-volume");
const mediaVolumeValue = document.getElementById("media-volume-value");
const mediaCurrent = document.getElementById("media-current");

function obtenerMediaSeleccionada() {
  return ordenCulto.find((item) => item.id === mediaSeleccionadaId &&
    ["audio", "video", "imagen"].includes(item.tipo)) || null;
}

function actualizarControlesMultimedia() {
  const item = obtenerMediaSeleccionada();
  btnMediaPlay.disabled = !item;
  const puedePausar = item && (
    (item.tipo === "audio" && audioActivo.id === item.id) ||
    (item.tipo === "video" && visualActivo.id === item.id)
  );
  btnMediaPause.disabled = !puedePausar;
  mediaCurrent.textContent = item
    ? `${{ audio: "MP3", video: "Video", imagen: "Imagen" }[item.tipo]}\n${item.nombre}`
    : "Nada seleccionado";
}

function prepararVideoPreview(item) {
  if (previewMediaVideo.dataset.mediaId === item.id) return;
  previewMediaVideo.pause();
  previewMediaVideo.removeAttribute("src");
  previewMediaVideo.load();
  previewMediaVideo.src = item.url;
  previewMediaVideo.dataset.mediaId = item.id;
  previewMediaVideo.load();
}

function reproducirMediaSeleccionada() {
  const item = obtenerMediaSeleccionada();
  if (!item) return;
  if (item.tipo === "audio") {
    if (audioActivo.id !== item.id) {
      enviar({ type: "mediaAudioSource", payload: { id: item.id, url: item.url } });
      audioActivo = { id: item.id, url: item.url, playing: false };
    }
    audioActivo.playing = true;
    enviar({ type: "mediaAudioControl", payload: { accion: "play", volumen: mediaVolume } });
  } else if (item.tipo === "video") {
    if (visualActivo.id !== item.id) {
      enviar({ type: "mediaVisualSource", payload: item });
      visualActivo = { id: item.id, tipo: item.tipo, url: item.url, visible: false, playing: false };
      prepararVideoPreview(item);
    }
    previewMediaImage.style.display = "none";
    previewTxt.textContent = "";
    previewMediaVideo.style.display = "block";
    previewMediaVideo.play().catch(() => {});
    previewScreen.classList.add("is-live");
    previewStatus.textContent = `Video: ${item.nombre}`;
    visualActivo.visible = true;
    visualActivo.playing = true;
    estadoVisualActual = { tipo: "media", payload: { id: item.id } };
    enviar({ type: "mediaVisualControl", payload: { accion: "play", volumen: mediaVolume } });
  } else {
    if (visualActivo.id !== item.id) {
      enviar({ type: "mediaVisualSource", payload: item });
      visualActivo = { id: item.id, tipo: item.tipo, url: item.url, visible: false, playing: false };
    }
    previewMediaVideo.pause();
    previewMediaVideo.style.display = "none";
    previewMediaImage.src = item.url;
    previewMediaImage.style.display = "block";
    previewTxt.textContent = "";
    previewScreen.classList.add("is-live");
    previewStatus.textContent = `Imagen: ${item.nombre}`;
    visualActivo.visible = true;
    estadoVisualActual = { tipo: "media", payload: { id: item.id } };
    enviar({ type: "mediaVisualControl", payload: { accion: "show", volumen: mediaVolume } });
  }
  actualizarControlesMultimedia();
}

function pausarMediaSeleccionada() {
  const item = obtenerMediaSeleccionada();
  if (!item) return;
  if (item.tipo === "audio" && audioActivo.id === item.id) {
    audioActivo.playing = false;
    enviar({ type: "mediaAudioControl", payload: { accion: "pause", volumen: mediaVolume } });
  } else if (item.tipo === "video" && visualActivo.id === item.id) {
    visualActivo.playing = false;
    previewMediaVideo.pause();
    enviar({ type: "mediaVisualControl", payload: { accion: "pause", volumen: mediaVolume } });
  }
  actualizarControlesMultimedia();
}

btnMediaPlay.addEventListener("click", () => {
  reproducirMediaSeleccionada();
  notificarRelayProyector();
});
btnMediaPause.addEventListener("click", () => {
  pausarMediaSeleccionada();
  notificarRelayProyector();
});

mediaVolumeInput.value = String(mediaVolume);
mediaVolumeValue.value = `${Math.round(mediaVolume * 100)}%`;
mediaVolumeInput.addEventListener("input", () => {
  mediaVolume = Math.min(1, Math.max(0, Number(mediaVolumeInput.value)));
  mediaVolumeValue.value = `${Math.round(mediaVolume * 100)}%`;
  localStorage.setItem(CLAVE_VOLUMEN_MULTIMEDIA, String(mediaVolume));
  enviar({ type: "mediaVolume", payload: { volumen: mediaVolume } });
  if (relayProyector.room && !aplicandoRemotoProyector) {
    relayProyector.enviarVolumenConDebounce(Math.round(mediaVolume * 100));
  }
});
mediaVolumeInput.addEventListener("change", () => {
  if (relayProyector.room && !aplicandoRemotoProyector) {
    relayProyector.enviarVolumenInmediato(Math.round(mediaVolume * 100));
  }
});
actualizarControlesMultimedia();

/* ---------------------------------------------------------
   Control remoto por celular (relay vía Worker, ver
   js/proyector-relay.js). Sala inactiva por defecto: mientras
   no se presione "Activar control remoto" no hay ningún fetch.
--------------------------------------------------------- */
const btnActivarRemoto = document.getElementById("btn-activar-remoto");
const btnDesactivarRemoto = document.getElementById("btn-desactivar-remoto");
const remoteControlActive = document.getElementById("remote-control-active");
const remoteRoomCode = document.getElementById("remote-room-code");
const remoteQr = document.getElementById("remote-qr");
const remoteControlStatus = document.getElementById("remote-control-status");

let aplicandoRemotoProyector = false;

function estadoMultimediaActual() {
  const item = obtenerMediaSeleccionada();
  return {
    reproduciendo: audioActivo.playing || visualActivo.playing,
    volumen: Math.round(mediaVolume * 100),
    itemActivo: item?.nombre ?? null,
    origen: "control",
  };
}

function notificarRelayProyector() {
  if (!relayProyector.room || aplicandoRemotoProyector) return;
  relayProyector.enviar(estadoMultimediaActual());
}

function aplicarEstadoRemotoProyector(estado) {
  aplicandoRemotoProyector = true;
  try {
    if (typeof estado.volumen === "number") {
      mediaVolume = Math.min(1, Math.max(0, estado.volumen / 100));
      mediaVolumeInput.value = String(mediaVolume);
      mediaVolumeValue.value = `${Math.round(mediaVolume * 100)}%`;
      localStorage.setItem(CLAVE_VOLUMEN_MULTIMEDIA, String(mediaVolume));
      enviar({ type: "mediaVolume", payload: { volumen: mediaVolume } });
    }
    if (typeof estado.reproduciendo === "boolean") {
      if (estado.reproduciendo) reproducirMediaSeleccionada();
      else pausarMediaSeleccionada();
    }
  } finally {
    aplicandoRemotoProyector = false;
  }
}

const relayProyector = crearRelayProyector({
  onEstado: aplicarEstadoRemotoProyector,
  onError: () => {
    // Se loguea en crearRelayProyector(); la reproducción local sigue
    // funcionando aunque el relay esté caído, no se rompe nada acá.
  },
});

async function activarControlRemoto() {
  btnActivarRemoto.disabled = true;
  remoteControlStatus.classList.remove("error");
  remoteControlStatus.textContent = "Generando código…";
  try {
    const codigo = await generarCodigoSalaLibre();
    await relayProyector.postearEstado(codigo, estadoMultimediaActual());
    relayProyector.room = codigo;
    relayProyector.iniciarPolling(codigo);
    remoteRoomCode.textContent = codigo;
    const urlRemoto = `${location.origin}/proyector/remoto.html?room=${codigo}`;
    remoteQr.innerHTML = "";
    const qr = qrcode(0, "M");
    qr.addData(urlRemoto);
    qr.make();
    remoteQr.innerHTML = qr.createSvgTag(4);
    remoteControlActive.hidden = false;
    btnActivarRemoto.hidden = true;
    remoteControlStatus.textContent = "";
  } catch (error) {
    console.error(error);
    remoteControlStatus.classList.add("error");
    remoteControlStatus.textContent = "No se pudo activar el control remoto. Probá de nuevo.";
  } finally {
    btnActivarRemoto.disabled = false;
  }
}

function desactivarControlRemoto() {
  relayProyector.detenerPolling();
  relayProyector.room = null;
  remoteControlActive.hidden = true;
  btnActivarRemoto.hidden = false;
  remoteControlStatus.classList.remove("error");
  remoteControlStatus.textContent = "";
}

btnActivarRemoto.addEventListener("click", activarControlRemoto);
btnDesactivarRemoto.addEventListener("click", desactivarControlRemoto);

window.addEventListener("beforeunload", () => {
  ordenCulto.forEach((item) => {
    if (["audio", "video", "imagen"].includes(item.tipo) && item.url?.startsWith("blob:")) {
      URL.revokeObjectURL(item.url);
    }
  });
});

/* ---------------------------------------------------------
   Atajos de teclado
--------------------------------------------------------- */
document.addEventListener("keydown", (e) => {
  const enCampoTexto = ["INPUT", "SELECT", "TEXTAREA"].includes(document.activeElement.tagName);
  if (enCampoTexto) return;

  switch (e.key) {
    case "ArrowRight":
    case " ":
      e.preventDefault();
      siguienteDiapositiva();
      break;
    case "ArrowLeft":
      e.preventDefault();
      anteriorDiapositiva();
      break;
    case "b":
    case "B":
      document.getElementById("btn-blank").click();
      break;
    case "Escape":
      document.getElementById("btn-clear").click();
      break;
  }
});
