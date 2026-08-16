/* ---------------------------------------------------------
   Control remoto (celular): navega el orden del culto y las
   diapositivas igual que la PC, más play/pausa/detener/volumen
   del audio de fondo — sobre el mismo relay que control.js (ver
   js/proyector-relay.js). Este lado nunca reproduce ni arma
   contenido nuevo, solo refleja y comanda lo que ya carga la PC.
--------------------------------------------------------- */
const pantallaCodigo = document.getElementById("pantalla-codigo");
const pantallaControl = document.getElementById("pantalla-control");
const formCodigo = document.getElementById("form-codigo");
const inputCodigo = document.getElementById("input-codigo");
const estadoConexionCodigo = document.getElementById("estado-conexion-codigo");
const estadoConexionControl = document.getElementById("estado-conexion-control");
const codigoConectado = document.getElementById("codigo-conectado");
const btnCambiarSala = document.getElementById("btn-cambiar-sala");

const diapositivaContador = document.getElementById("diapositiva-contador");
const diapositivaTexto = document.getElementById("diapositiva-texto");
const diapositivaReferencia = document.getElementById("diapositiva-referencia");
const btnAnterior = document.getElementById("btn-anterior");
const btnSiguiente = document.getElementById("btn-siguiente");

const listaOrden = document.getElementById("lista-orden");

const btnPlayPausa = document.getElementById("btn-play-pausa");
const btnDetener = document.getElementById("btn-detener");
const inputVolumen = document.getElementById("input-volumen");
const outputVolumen = document.getElementById("output-volumen");

let aplicandoRemoto = false;
let reproduciendoActual = false;
let diapositivaIndexActual = -1;
let diapositivaTotalActual = 0;
let ordenActivoIndexActual = -1;

function aplicarEstadoRemoto(estado) {
  aplicandoRemoto = true;
  try {
    if (typeof estado.reproduciendo === "boolean") {
      reproduciendoActual = estado.reproduciendo;
      btnPlayPausa.textContent = reproduciendoActual ? "❚❚" : "▶";
    }
    if (typeof estado.volumen === "number") {
      inputVolumen.value = String(estado.volumen);
      outputVolumen.textContent = `${estado.volumen}%`;
    }
    if (typeof estado.diapositivaIndex === "number") diapositivaIndexActual = estado.diapositivaIndex;
    if (typeof estado.diapositivaTotal === "number") diapositivaTotalActual = estado.diapositivaTotal;
    if (diapositivaIndexActual >= 0 && diapositivaTotalActual > 0) {
      diapositivaContador.textContent = `${diapositivaIndexActual + 1} / ${diapositivaTotalActual}`;
      diapositivaTexto.textContent = estado.diapositivaTexto || "";
      diapositivaReferencia.textContent = estado.diapositivaReferencia || "";
    } else {
      diapositivaContador.textContent = "";
      diapositivaTexto.textContent = "Nada seleccionado";
      diapositivaReferencia.textContent = "";
    }
    btnAnterior.disabled = diapositivaIndexActual <= 0;
    btnSiguiente.disabled = diapositivaIndexActual < 0 || diapositivaIndexActual + 1 >= diapositivaTotalActual;

    if (typeof estado.ordenActivoIndex === "number") ordenActivoIndexActual = estado.ordenActivoIndex;
    if (Array.isArray(estado.ordenCulto)) renderListaOrden(estado.ordenCulto, ordenActivoIndexActual);

    estadoConexionControl.classList.remove("error");
    estadoConexionControl.textContent = "";
  } finally {
    aplicandoRemoto = false;
  }
}

function renderListaOrden(ordenCulto, activoIndex) {
  listaOrden.innerHTML = "";
  if (!ordenCulto.length) {
    const vacio = document.createElement("div");
    vacio.className = "orden-vacio";
    vacio.textContent = "Nada en el orden del culto todavía.";
    listaOrden.appendChild(vacio);
    return;
  }
  ordenCulto.forEach((item, index) => {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = `orden-item${index === activoIndex ? " activo" : ""}`;
    const tag = document.createElement("strong");
    tag.textContent = item.tag;
    const descripcion = document.createElement("span");
    descripcion.textContent = item.descripcion;
    boton.append(tag, descripcion);
    boton.addEventListener("click", () => {
      if (aplicandoRemoto) return;
      relay.enviar({ ordenActivoIndex: index, origen: "remoto" });
    });
    listaOrden.appendChild(boton);
  });
}

const relay = crearRelayProyector({
  onEstado: aplicarEstadoRemoto,
  onError: () => {
    estadoConexionControl.classList.add("error");
    estadoConexionControl.textContent = "Sin conexión con la PC, reintentando…";
  },
});

async function conectarSala(codigo) {
  estadoConexionCodigo.classList.remove("error");
  estadoConexionCodigo.textContent = "Conectando…";
  try {
    const estado = await relay.pedirEstado(codigo);
    if (!estado) {
      estadoConexionCodigo.classList.add("error");
      estadoConexionCodigo.textContent = "Ese código no existe o venció. Verificalo en la pantalla de la PC.";
      return;
    }
    relay.room = codigo;
    aplicarEstadoRemoto(estado);
    relay.marcarComoAplicado(estado.ts);
    relay.iniciarPolling(codigo);
    codigoConectado.textContent = codigo;
    pantallaCodigo.hidden = true;
    pantallaControl.hidden = false;
  } catch (error) {
    console.error(error);
    estadoConexionCodigo.classList.add("error");
    estadoConexionCodigo.textContent = "No se pudo conectar. Revisá tu conexión e intentá de nuevo.";
  }
}

formCodigo.addEventListener("submit", (event) => {
  event.preventDefault();
  const codigo = inputCodigo.value.trim();
  if (!/^\d{6}$/.test(codigo)) {
    estadoConexionCodigo.classList.add("error");
    estadoConexionCodigo.textContent = "El código debe tener 6 dígitos.";
    return;
  }
  conectarSala(codigo);
});

btnAnterior.addEventListener("click", () => {
  if (aplicandoRemoto || diapositivaIndexActual <= 0) return;
  relay.enviar({ diapositivaIndex: diapositivaIndexActual - 1, origen: "remoto" });
});
btnSiguiente.addEventListener("click", () => {
  if (aplicandoRemoto || diapositivaIndexActual < 0 || diapositivaIndexActual + 1 >= diapositivaTotalActual) return;
  relay.enviar({ diapositivaIndex: diapositivaIndexActual + 1, origen: "remoto" });
});

btnPlayPausa.addEventListener("click", () => {
  if (aplicandoRemoto) return;
  reproduciendoActual = !reproduciendoActual;
  btnPlayPausa.textContent = reproduciendoActual ? "❚❚" : "▶";
  relay.enviar({ reproduciendo: reproduciendoActual, origen: "remoto" });
});

btnDetener.addEventListener("click", () => {
  if (aplicandoRemoto) return;
  reproduciendoActual = false;
  btnPlayPausa.textContent = "▶";
  relay.enviar({ reproduciendo: false, origen: "remoto" });
});

inputVolumen.addEventListener("input", () => {
  if (aplicandoRemoto) return;
  outputVolumen.textContent = `${inputVolumen.value}%`;
  relay.enviarVolumenConDebounce(Number(inputVolumen.value));
});
inputVolumen.addEventListener("change", () => {
  if (aplicandoRemoto) return;
  relay.enviarVolumenInmediato(Number(inputVolumen.value));
});

btnCambiarSala.addEventListener("click", () => {
  relay.detenerPolling();
  relay.room = null;
  pantallaControl.hidden = true;
  pantallaCodigo.hidden = false;
  inputCodigo.value = "";
  estadoConexionCodigo.textContent = "";
});

// Auto-conectar si la URL trae ?room=XXXXXX (vino del QR).
const paramsUrl = new URLSearchParams(location.search);
const roomDesdeUrl = paramsUrl.get("room");
if (roomDesdeUrl && /^\d{6}$/.test(roomDesdeUrl)) {
  inputCodigo.value = roomDesdeUrl;
  conectarSala(roomDesdeUrl);
}
