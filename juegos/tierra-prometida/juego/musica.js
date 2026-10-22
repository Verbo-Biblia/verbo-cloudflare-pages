// Música de fondo por pantalla, con fundido entre temas. Se apaga junto con el sonido (botón 🔊).
// Temas fijos de la base; una temática puede reemplazar cualquiera con tema.json → musica.<clave>.

import { sonidoActivo } from './sonido.js';

const CARPETA = new URL('./musica/', import.meta.url).href;
const TEMAS = {
  inicio: ['tema_alderium.mp3'],
  pueblo: ['tema_ciudad_central.mp3'],
  mapa: ['tema_mapa_mundial.mp3'],
  partida: ['tema_duelo.mp3', 'tema_constructor.mp3'],
  tienda: ['tema_taberna.mp3'],
  relato: ['tema_lugar.mp3'],
};
const CIERRE = { victoria: 'stinger_victoria.mp3', derrota: 'stinger_derrota.mp3' };
const VOLUMEN = 0.35;

let actual = null, claveActual = null, propios = {}, vuelta = 0;

export function musicaDeTema(tema) {
  propios = {};
  for (const [k, ruta] of Object.entries(tema?.datos?.musica || {})) if (ruta) propios[k] = tema.base + ruta;
}

function fundir(audio, desde, hasta, ms, alFinal) {
  const pasos = 20; let i = 0;
  const t = setInterval(() => {
    i++;
    audio.volume = Math.max(0, Math.min(1, desde + (hasta - desde) * i / pasos));
    if (i >= pasos) { clearInterval(t); alFinal?.(); }
  }, ms / pasos);
}

function soltar() {
  if (!actual) return;
  const a = actual; actual = null;
  fundir(a, a.volume, 0, 800, () => a.pause());
}

export function musica(clave) {
  if (clave === claveActual && actual && !actual.paused) return;
  claveActual = clave;
  soltar();
  if (!sonidoActivo() || !clave) return;
  let src = propios[clave];
  if (!src) { const lista = TEMAS[clave]; if (!lista) return; src = CARPETA + lista[vuelta++ % lista.length]; }
  const a = new Audio(src);
  a.loop = true; a.volume = 0;
  a.play().then(() => fundir(a, 0, VOLUMEN, 1200)).catch(() => { claveActual = null; }); // el navegador exige un clic antes
  actual = a;
}

export function cierre(gano) {
  claveActual = null;
  soltar();
  if (!sonidoActivo()) return;
  const a = new Audio(propios[gano ? 'victoria' : 'derrota'] || CARPETA + CIERRE[gano ? 'victoria' : 'derrota']);
  a.volume = 0.5;
  a.play().catch(() => {});
}

// Si se apaga el sonido, se calla la música; al prenderlo vuelve la de la pantalla.
export function alCambiarSonido() {
  const c = claveActual;
  if (!sonidoActivo()) { soltar(); return; }
  claveActual = null;
  musica(c);
}
