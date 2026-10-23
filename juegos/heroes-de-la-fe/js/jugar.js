// Modo jugar: muestra la historia como la verá el lector.
// Orden en cada escena: 1) globos y efectos puestos a mano (uno por clic), 2) el guion (líneas y elecciones),
// 3) la salida de la escena (seguir, decisión o fin).
import { W, H } from './estado.js?v=9cd2360b';
import { pintarFondo, pintarElementos, actualizarNodo } from './render.js?v=9cd2360b';
import { nombreDe } from './personajes.js?v=9cd2360b';
import { globoDeLinea } from './dialogo.js?v=9cd2360b';

const $ = s => document.querySelector(s);
let historia, actual, historial, pendientes, alSalir;
let pila, eligiendo, escribiendo;
let raiz, esc, capaFondo, capaEl, capaDialogo, caja, nombre, texto, opciones, fin, seguir;

function ajustar() {
  const k = Math.min(innerWidth / W, innerHeight / H);
  esc.style.transform = `translate(${(innerWidth - W * k) / 2}px,${(innerHeight - H * k) / 2}px) scale(${k})`;
}

export function iniciarJugador() {
  raiz = $('#jugador');
  esc = $('#j-escenario');
  capaFondo = esc.querySelector('.capa-fondo');
  capaEl = esc.querySelector('.capa-el');
  capaDialogo = esc.querySelector('.j-dialogo');
  caja = esc.querySelector('.j-caja');
  nombre = esc.querySelector('.j-nombre');
  texto = esc.querySelector('.j-texto');
  opciones = esc.querySelector('.j-opciones');
  fin = esc.querySelector('.j-fin');
  seguir = esc.querySelector('.j-seguir');
  addEventListener('resize', () => raiz.classList.contains('activo') && ajustar());
  esc.addEventListener('click', ev => {
    if (ev.target.closest('button')) return;
    avanzar();
  });
  raiz.addEventListener('click', ev => {
    const b = ev.target.closest('[data-j]');
    if (!b) return;
    ev.stopPropagation();
    ({ salir, reiniciar, atras })[b.dataset.j]();
  });
  addEventListener('keydown', ev => {
    if (!raiz.classList.contains('activo')) return;
    ev.stopPropagation();
    if (ev.key === 'Escape') salir();
    else if ([' ', 'Enter', 'ArrowRight'].includes(ev.key)) { ev.preventDefault(); avanzar(); }
    else if (['Backspace', 'ArrowLeft'].includes(ev.key)) { ev.preventDefault(); atras(); }
    else if (/^[1-4]$/.test(ev.key)) elegir(+ev.key - 1);
  }, true);
}

export function jugar(h, desde, salirFn) {
  historia = h;
  alSalir = salirFn;
  historial = [];
  raiz.classList.add('activo');
  ajustar();
  mostrar(desde || h.inicio);
}

const escena = id => historia.escenas.find(s => s.id === id);

function mostrar(id) {
  const s = escena(id);
  if (!s) return terminar();
  actual = s;
  pararEscritura();
  pintarFondo(capaFondo, s);
  capaEl.innerHTML = '';
  capaDialogo.innerHTML = '';
  pintarElementos(capaEl, s, new Map());
  pendientes = [];
  if (historia.revelar) {
    for (const el of s.elementos) {
      if (el.tipo === 'burbuja' || el.tipo === 'onomatopeya') {
        const n = capaEl.querySelector(`[data-id="${el.id}"]`);
        n.classList.add('oculto');
        pendientes.push(n);
      }
    }
  }
  pila = [{ pasos: s.guion || [], i: 0, despues: null }];
  eligiendo = null;
  caja.classList.remove('visible');
  opciones.classList.remove('visible', 'en-caja');
  fin.classList.remove('visible');
  esc.classList.remove('transicion');
  void esc.offsetWidth;
  esc.classList.add('transicion');
  seguir.classList.add('visible');
  // Lo primero aparece solo, sin esperar el clic.
  setTimeout(() => { if (actual === s && !capaDialogo.children.length && !caja.classList.contains('visible')) avanzar(true); }, 450);
}

function avanzar(automatico = false) {
  if (fin.classList.contains('visible') || eligiendo) return;
  if (escribiendo) return pararEscritura(true);
  if (pendientes.length) {
    const n = pendientes.shift();
    n.classList.remove('oculto');
    n.classList.add('aparece');
    return;
  }
  // Guion
  const paso = siguientePaso();
  if (paso === 'salto') return;
  if (paso?.tipo === 'linea') return decir(paso);
  if (paso?.tipo === 'eleccion') return preguntar(paso);
  if (automatico) return salidaSiHaceFalta();
  // Fin del guion: salida de la escena
  const { modo, opciones: ops } = actual.salida;
  if (modo === 'dos') return mostrarDecisionFinal();
  if (modo === 'una' && ops[0].destino && escena(ops[0].destino)) return ir(ops[0].destino);
  terminar();
}

// Si la escena no tiene nada que revelar ni decir y termina en decisión, la muestra de una vez.
function salidaSiHaceFalta() {
  if (actual.salida.modo === 'dos') mostrarDecisionFinal();
}

function siguientePaso() {
  while (pila.length) {
    const marco = pila[pila.length - 1];
    if (marco.i < marco.pasos.length) return marco.pasos[marco.i++];
    pila.pop();
    if (marco.despues === 'repetir') return marco.eleccion;
    const destino = resolver(marco.despues);
    if (destino) {
      ir(destino);
      return 'salto';
    }
  }
  return null;
}

// «A»/«B» = las salidas de la escena; «seguir»/«repetir» no saltan; si no, el id de una escena.
function resolver(despues) {
  if (!despues || despues === 'seguir' || despues === 'repetir') return null;
  const id = despues === 'A' ? actual.salida.opciones[0]?.destino : despues === 'B' ? actual.salida.opciones[1]?.destino : despues;
  return id && escena(id) ? id : null;
}

// ── Decir una línea ───────────────────────────────────────────────────────────────────────────

function decir(l) {
  const quien = actual.elementos.find(e => e.id === l.quien);
  capaDialogo.innerHTML = '';
  caja.classList.remove('visible');
  // Cara de esta línea (queda puesta para las siguientes).
  if (quien && l.expresion) {
    const img = capaEl.querySelector(`[data-id="${quien.id}"] img`);
    if (img) img.src = l.expresion;
  }
  // Quien habla se ve normal; los demás personajes, un poco más oscuros.
  capaEl.querySelectorAll('.el[data-tipo=imagen]').forEach(n => {
    const el = actual.elementos.find(e => e.id === n.dataset.id);
    n.classList.toggle('callado', !!quien && !!el?.personaje && el.id !== quien.id);
  });

  if (l.forma === 'caja') {
    const quienEs = quien ? nombreDe(quien) : l.quien === '*' ? (l.nombre || 'Voz') : '';
    caja.classList.toggle('narrador', !quienEs);
    nombre.textContent = quienEs;
    nombre.style.background = quienEs ? colorDe(quienEs) : '';
    caja.classList.add('visible');
    escribir(l.texto);
  } else {
    capaDialogo.appendChild(globoPara(l));
  }
}

function colorDe(texto) {
  let h = 0;
  for (const c of texto) h = (h * 31 + c.charCodeAt(0)) % 360;
  return `hsl(${h} 85% 68%)`;
}

// Globo de la línea (el acomodado a mano en el editor o el automático).
function globoPara(l) {
  const n = document.createElement('div');
  n.className = 'el';
  actualizarNodo(n, globoDeLinea(l, actual));
  return n;
}

function escribir(t) {
  pararEscritura();
  let i = 0;
  texto.textContent = '';
  escribiendo = {
    texto: t,
    reloj: setInterval(() => {
      i += 2;
      texto.textContent = t.slice(0, i);
      if (i >= t.length) pararEscritura();
    }, 28),
  };
}

function pararEscritura(completar = false) {
  if (!escribiendo) return;
  clearInterval(escribiendo.reloj);
  if (completar) texto.textContent = escribiendo.texto;
  escribiendo = null;
}

// ── Elecciones ────────────────────────────────────────────────────────────────────────────────

function mostrarOpciones(pregunta, textos, alElegir) {
  opciones.innerHTML = (pregunta ? '<div class="pregunta"></div>' : '') +
    `<div class="botones ${textos.length > 2 ? 'muchas' : ''}"></div>`;
  if (pregunta) opciones.querySelector('.pregunta').textContent = pregunta;
  textos.forEach((t, i) => {
    const b = document.createElement('button');
    b.className = 'abcd'[i];
    b.textContent = t || `Opción ${'ABCD'[i]}`;
    b.addEventListener('click', () => elegir(i));
    opciones.querySelector('.botones').appendChild(b);
  });
  opciones.classList.toggle('en-caja', caja.classList.contains('visible'));
  opciones.classList.add('visible');
  seguir.classList.remove('visible');
  eligiendo = { cantidad: textos.length, alElegir };
}

function elegir(i) {
  if (!eligiendo || i >= eligiendo.cantidad) return;
  const fn = eligiendo.alElegir;
  eligiendo = null;
  opciones.classList.remove('visible');
  seguir.classList.add('visible');
  fn(i);
}

function preguntar(p) {
  mostrarOpciones(p.pregunta, p.opciones.map(o => o.texto), i => {
    const o = p.opciones[i];
    pila.push({ pasos: o.lineas, i: 0, despues: o.destino || 'seguir', eleccion: p });
    avanzar();
  });
}

function mostrarDecisionFinal() {
  const { pregunta, opciones: ops } = actual.salida;
  mostrarOpciones(pregunta, ops.slice(0, 2).map(o => o.texto), i => {
    const o = ops[i];
    if (o?.destino && escena(o.destino)) ir(o.destino);
    else terminar();
  });
}

// ── Navegación ────────────────────────────────────────────────────────────────────────────────

function ir(id) {
  historial.push(actual.id);
  mostrar(id);
}

function terminar() {
  pararEscritura(true);
  seguir.classList.remove('visible');
  opciones.classList.remove('visible');
  eligiendo = null;
  fin.classList.add('visible');
}

function atras() {
  if (!historial.length) return;
  mostrar(historial.pop());
}

function reiniciar() {
  historial = [];
  mostrar(historia.inicio);
}

function salir() {
  pararEscritura();
  raiz.classList.remove('activo');
  capaEl.innerHTML = '';
  capaDialogo.innerHTML = '';
  alSalir?.();
}
