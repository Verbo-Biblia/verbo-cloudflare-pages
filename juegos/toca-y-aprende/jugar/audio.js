// Todo el sonido de «Toca y aprende»: efectos hechos al vuelo con Web Audio (brillo, pop, boing, fiesta),
// instrumentos y notas del xilófono (sonidos/, del banco del Compositor), la voz (la del navegador: Google en Chrome;
// Juan lo pidió así el 2026-10-26, las grabaciones de Chatterbox salían con repeticiones) y la música de fondo, que
// baja sola mientras habla la voz.
import { idioma } from './comun/idioma.js';
import { VOCES } from './voces.js';

let ctx = null, maestro = null;
const CLAVE_SONIDO = 'toca:sonido', CLAVE_MUSICA = 'toca:musica';
const leer = (k) => { try { return localStorage.getItem(k) !== 'no'; } catch { return true; } };
const guardar = (k, si) => { try { localStorage.setItem(k, si ? 'si' : 'no'); } catch { /* sin almacenamiento */ } };
export const sonidoActivo = () => leer(CLAVE_SONIDO);
export const musicaActiva = () => leer(CLAVE_MUSICA);

export function despertar() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    maestro = ctx.createGain(); maestro.gain.value = 0.6; maestro.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
}

// ---------------------------------------------------------------- efectos sintetizados
const PENTA = [0, 2, 4, 7, 9];   // pentatónica: tocar botones al azar siempre suena bonito
const hz = (m) => 440 * 2 ** ((m - 69) / 12);
function tono(f, t, dur, { tipo = 'sine', vol = 0.3, a = 0.005, hasta = null } = {}) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = tipo; o.frequency.setValueAtTime(f, t);
  if (hasta) o.frequency.exponentialRampToValueAtTime(hasta, t + dur);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + a); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(maestro); o.start(t); o.stop(t + dur + 0.05);
}
function campanita(m, t, vol = 0.22) {   // seno + armónico brillante, como una cajita de música
  tono(hz(m), t, 0.9, { vol });
  tono(hz(m + 12), t, 0.4, { vol: vol * 0.35 });
  tono(hz(m + 24 + 7), t, 0.15, { vol: vol * 0.12, tipo: 'triangle' });
}
function ruido(t, dur, f, vol) {
  const n = Math.floor(ctx.sampleRate * dur), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 2;
  const s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = b; fl.type = 'bandpass'; fl.frequency.value = f; fl.Q.value = 1.2; g.gain.value = vol;
  s.connect(fl).connect(g).connect(maestro); s.start(t);
}

export function efecto(nombre, k = 0) {
  if (!sonidoActivo() || !ctx) return;
  const t = ctx.currentTime + 0.01;
  if (nombre === 'tin') {   // cada botón, su nota
    const m = 72 + 12 * Math.floor(k / 5) % 24 + PENTA[k % 5];
    campanita(m, t); campanita(m + 7, t + 0.07, 0.1);
  } else if (nombre === 'pop') {
    tono(900, t, 0.09, { hasta: 180, vol: 0.4, tipo: 'triangle' }); ruido(t, 0.06, 2500, 0.25);
  } else if (nombre === 'burbuja') {
    tono(300 + Math.random() * 200, t, 0.12, { hasta: 1400, vol: 0.3 }); ruido(t + 0.02, 0.05, 3000, 0.15);
  } else if (nombre === 'boing') {
    const o = ctx.createOscillator(), g = ctx.createGain(), l = ctx.createOscillator(), lg = ctx.createGain();
    o.type = 'triangle'; o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(140, t + 0.45);
    l.frequency.value = 14; lg.gain.value = 30; l.connect(lg).connect(o.frequency);
    g.gain.setValueAtTime(0.3, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    o.connect(g).connect(maestro); o.start(t); l.start(t); o.stop(t + 0.55); l.stop(t + 0.55);
  } else if (nombre === 'bien') {   // acierto: arpegio que sube
    [72, 76, 79, 84].forEach((m, i) => campanita(m, t + i * 0.08, 0.2));
  } else if (nombre === 'fiesta') {   // fanfarria + palmas
    [[67, 0], [72, 0.12], [76, 0.24], [79, 0.36], [84, 0.5], [79, 0.7], [84, 0.82]].forEach(([m, d]) => {
      tono(hz(m), t + d, 0.35, { tipo: 'square', vol: 0.07 }); campanita(m, t + d, 0.14);
    });
    for (let i = 0; i < 8; i++) ruido(t + 0.1 + i * 0.13 + Math.random() * 0.03, 0.08, 1500, 0.35);
  } else if (nombre === 'abrir') {
    tono(500, t, 0.18, { hasta: 1100, vol: 0.18 });
  }
}

// ---------------------------------------------------------------- muestras (instrumentos, xilófono)
const muestras = {};
async function muestra(ruta) {
  if (!muestras[ruta]) muestras[ruta] = fetch(ruta).then((r) => r.arrayBuffer()).then((b) => ctx.decodeAudioData(b)).catch(() => null);
  return muestras[ruta];
}
let sonandoInst = null;
export async function tocarMuestra(ruta, vol = 0.9) {
  if (!sonidoActivo() || !ctx) return;
  const buf = await muestra(ruta);
  if (!buf) return;
  const s = ctx.createBufferSource(), g = ctx.createGain();
  s.buffer = buf; g.gain.value = vol; s.connect(g).connect(maestro); s.start();
  return s;
}
export async function instrumento(id) {
  try { sonandoInst?.stop(); } catch { /* ya terminó */ }
  sonandoInst = await tocarMuestra(`sonidos/inst/${id}.ogg`);
}
export const nota = (k) => tocarMuestra(`sonidos/notas/${k}.ogg`, 0.8);
export function precargarMuestras() {
  for (let k = 0; k < 8; k++) muestra(`sonidos/notas/${k}.ogg`);
}

// ---------------------------------------------------------------- voz
export const textoVoz = (clave, lang = idioma()) => VOCES[clave]?.[lang] ?? VOCES[clave]?.es;
export const otro = () => (idioma() === 'es' ? 'en' : 'es');   // el idioma que el niño aprende
let turno = 0;
// la voz de Google del idioma (en Chrome); si no hay, cualquiera del idioma
function vozDe(lang) {
  const vs = speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith(lang));
  const pref = lang === 'es' ? ['es-us', 'es-mx', 'es-419', 'es-es'] : ['en-us', 'en-gb'];
  const google = vs.filter((v) => /google/i.test(v.name));
  for (const l of pref) { const v = google.find((x) => x.lang.toLowerCase() === l); if (v) return v; }
  return google[0] || vs[0] || null;
}
if ('speechSynthesis' in window) speechSynthesis.getVoices();   // Chrome carga la lista de voces al primer pedido
function hablarNavegador(texto, lang) {
  return new Promise((ok) => {
    if (!('speechSynthesis' in window) || !texto) return ok();
    // Chrome se traba si se habla justo después de cancelar y a veces avisa «terminé» antes de tiempo:
    // se espera a que de verdad deje de hablar (con un tope)
    setTimeout(() => {
      const u = new SpeechSynthesisUtterance(texto);
      const v = vozDe(lang);
      u.lang = v?.lang || (lang === 'es' ? 'es-US' : 'en-US'); if (v) u.voice = v;
      u.rate = 0.9; u.pitch = 1.15; u.volume = 1;
      speechSynthesis.speak(u);
      const t0 = performance.now(), tope = 1500 + texto.length * 120;
      const mirar = () => {
        const ya = performance.now() - t0;
        if (ya > tope || (ya > 400 && !speechSynthesis.speaking && !speechSynthesis.pending)) ok();
        else setTimeout(mirar, 80);
      };
      setTimeout(mirar, 150);
    }, 120);
  });
}
// una clave es 'frutas_fresa' (en el idioma del juego) o { k: 'frutas_fresa', lang: 'en' } (en el otro)
function unaClave(c, mio) {
  return new Promise((ok) => {
    if (mio !== turno) return ok();
    const clave = c.k ?? c, lang = c.lang ?? idioma();
    hablarNavegador(VOCES[clave]?.[lang] ?? VOCES[clave]?.es, lang).then(ok);
  });
}
// decir('frutas_fresa') o decir(['frase_muybien', ...]): corta lo que se estuviera diciendo
export async function decir(claves) {
  callar();
  if (!sonidoActivo()) return;
  const mio = ++turno;
  bajarMusica(true);
  for (const c of [].concat(claves)) { if (c === 'pausa') await pausa(350); else await unaClave(c, mio); }
  if (mio === turno) bajarMusica(false);
}
export function callar() {
  turno++;
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}
export const pausa = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------- música de fondo
const VOL = 0.5, VOL_BAJO = 0.08;   // la voz del navegador suena más bajita: la música baja más
let pista = null, nombrePista = null, bajada = false;
function fundir(a, destino, ms = 700, fin) {
  clearInterval(a._f);
  const desde = a.volume, t0 = performance.now();
  a._f = setInterval(() => {
    const k = Math.min(1, (performance.now() - t0) / ms);
    a.volume = desde + (destino - desde) * k;
    if (k === 1) { clearInterval(a._f); fin?.(); }
  }, 40);
}
export function musica(nombre) {
  if (nombre === nombrePista && pista && !pista.paused) return;
  const vieja = pista;
  if (vieja) fundir(vieja, 0, 600, () => vieja.pause());
  nombrePista = nombre; pista = null;
  if (!nombre || !musicaActiva()) return;
  pista = new Audio(`musica/${nombre}.mp3`);
  pista.loop = true; pista.volume = 0;
  pista.play().then(() => fundir(pista, bajada ? VOL_BAJO : VOL)).catch(() => {});
}
function bajarMusica(si) {
  bajada = si;
  if (pista) fundir(pista, si ? VOL_BAJO : VOL, si ? 200 : 900);
}
export function fijarSonido(si) { guardar(CLAVE_SONIDO, si); if (!si) callar(); }
export function fijarMusica(si) {
  guardar(CLAVE_MUSICA, si);
  const n = nombrePista;
  if (!si) { if (pista) { const p = pista; fundir(p, 0, 400, () => p.pause()); } pista = null; }
  else { nombrePista = null; musica(n); }
}
document.addEventListener('visibilitychange', () => {
  if (!pista) return;
  if (document.hidden) pista.pause(); else pista.play().catch(() => {});
});
