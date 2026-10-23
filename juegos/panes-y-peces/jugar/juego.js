// Pantalla de la base «combina 3»: menú, mapa de niveles sin fin, partida animada y ventanas.
// Todo lo temático (nombres, piezas, fondos, versículos, música) viene de tema/tema.json.
import { Tablero } from './tablero.js?v=2ad6f4e0';
import { nivel as armarNivel } from './niveles.js?v=2ad6f4e0';

const TEXTOS = {
  es: {
    masJuegos: '← Más juegos', niveles: 'Niveles', elegirNivel: 'Elige un nivel', menu: 'Volver al menú',
    salir: 'Salir al mapa', sonido: 'Efectos de sonido', musica: 'Música', movs: 'movimientos',
    jugar: 'Jugar', tramo: 'Niveles {a}–{b}', seguir: 'Seguir: nivel {n}', nivel: 'Nivel {n}', progreso: '{n} niveles superados · {e} ★',
    objetivo: 'Para ganar', obPuntos: 'Junta {n} puntos', obRecoger: 'Junta {n} {pieza}',
    obCapas: 'Limpia toda la {capa}', obBloques: 'Rompe todas las {bloque}', obBajar: 'Baja {n} {cesta} hasta el fondo',
    empezar: '¡A jugar!', ganaste: '¡Nivel superado!', perdiste: 'Sin movimientos', faltan: 'Te faltó:',
    siguiente: 'Siguiente nivel', reintentar: 'Reintentar', mapa: 'Mapa', mas5: '+5 movimientos',
    seguroSalir: '¿Salir del nivel?', salirSi: 'Salir', salirNo: 'Seguir jugando', puntos: 'puntos',
    mezclando: 'Sin jugadas: ¡a mezclar!', bien: ['¡Bien!', '¡Muy bien!', '¡Excelente!', '¡Maravilloso!'],
    premio: '¡Premio!', record: 'Récord: {n}', ayuda: 'Desliza una pieza hacia su vecina para formar filas de 3 o más iguales.',
  },
  en: {
    masJuegos: '← More games', niveles: 'Levels', elegirNivel: 'Choose a level', menu: 'Back to the menu',
    salir: 'Back to the map', sonido: 'Sound effects', musica: 'Music', movs: 'moves',
    jugar: 'Play', tramo: 'Levels {a}–{b}', seguir: 'Continue: level {n}', nivel: 'Level {n}', progreso: '{n} levels cleared · {e} ★',
    objetivo: 'To win', obPuntos: 'Score {n} points', obRecoger: 'Collect {n} {pieza}',
    obCapas: 'Clear all the {capa}', obBloques: 'Break all the {bloque}', obBajar: 'Bring {n} {cesta} down to the bottom',
    empezar: 'Let’s play!', ganaste: 'Level cleared!', perdiste: 'Out of moves', faltan: 'Still missing:',
    siguiente: 'Next level', reintentar: 'Try again', mapa: 'Map', mas5: '+5 moves',
    seguroSalir: 'Leave the level?', salirSi: 'Leave', salirNo: 'Keep playing', puntos: 'points',
    mezclando: 'No moves left: shuffling!', bien: ['Good!', 'Great!', 'Excellent!', 'Wonderful!'],
    premio: 'Bonus!', record: 'Best: {n}', ayuda: 'Slide a piece toward its neighbor to line up 3 or more of a kind.',
  },
};

const $ = s => document.querySelector(s);
const espera = ms => new Promise(r => setTimeout(r, ms));
let tema, lang, prog;
let T = null;            // Tablero en juego
let elementos = new Map(); // id de pieza → elemento
let lado = 48;           // tamaño de casilla en px
let ocupado = false, pistaReloj = 0, extraUsado = false;

// ---------- idioma ----------
function elegirIdioma() {
  let g = null;
  try { g = localStorage.getItem('verbo:uiLang'); } catch { /* sin almacenamiento */ }
  if (g === 'es' || g === 'en') return g;
  return (navigator.language || 'es').toLowerCase().startsWith('es') ? 'es' : 'en';
}
const tx = v => (v && typeof v === 'object' && !Array.isArray(v) ? v[lang] ?? v.es : v);
function t(k, vars = {}) {
  const s = tema?.textos?.[lang]?.[k] ?? TEXTOS[lang][k] ?? TEXTOS.es[k] ?? k;
  return typeof s === 'string' ? s.replace(/\{(\w+)\}/g, (_, x) => vars[x] ?? '') : s;
}
function traducir() {
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-t]').forEach(el => { el.textContent = t(el.dataset.t); });
  document.querySelectorAll('[data-t-aria]').forEach(el => el.setAttribute('aria-label', t(el.dataset.tAria)));
  $('#btn-idioma').textContent = lang === 'es' ? 'EN' : 'ES';
  document.title = `${tx(tema.titulo)} · ${tx(tema.subtitulo)}`;
}

// ---------- progreso guardado ----------
const CLAVE = () => `combina:${tema.id}`;
function cargarProgreso() {
  try { prog = JSON.parse(localStorage.getItem(CLAVE())) || {}; } catch { prog = {}; }
  prog.estrellas ||= {}; prog.mejor ||= {};
}
function guardarProgreso() { try { localStorage.setItem(CLAVE(), JSON.stringify(prog)); } catch { /* sin almacenamiento */ } }
const superados = () => Object.keys(prog.estrellas).length;
const nivelActual = () => { let n = 1; while (prog.estrellas[n]) n++; return n; };
const totalEstrellas = () => Object.values(prog.estrellas).reduce((a, b) => a + b, 0);

// ---------- sonido (sintetizado, sin archivos) y música (del tema) ----------
let audio = null;
const sonidoActivo = () => { try { return localStorage.getItem('mini:sonido') !== 'no'; } catch { return true; } };
const musicaActiva = () => { try { return localStorage.getItem('mini:musica') !== 'no'; } catch { return true; } };
function nota(freq, cuando, dur, tipo = 'sine', vol = 0.18) {
  const o = audio.createOscillator(), g = audio.createGain();
  o.type = tipo; o.frequency.value = freq;
  g.gain.setValueAtTime(0, cuando); g.gain.linearRampToValueAtTime(vol, cuando + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0008, cuando + dur);
  o.connect(g).connect(audio.destination); o.start(cuando); o.stop(cuando + dur + 0.02);
}
function sonar(nombre, x = 0) {
  if (!sonidoActivo()) return;
  try { audio ||= new AudioContext(); if (audio.state === 'suspended') audio.resume(); } catch { return; }
  const a = audio.currentTime;
  if (nombre === 'cambio') nota(520, a, 0.08, 'triangle', 0.08);
  if (nombre === 'no') { nota(180, a, 0.12, 'square', 0.05); nota(150, a + 0.1, 0.14, 'square', 0.05); }
  if (nombre === 'combina') { const f = 392 * Math.pow(2, Math.min(x, 10) * 2 / 12); nota(f, a, 0.28, 'sine', 0.2); nota(f * 2, a, 0.16, 'triangle', 0.05); }
  if (nombre === 'especial') [0, 4, 7, 12].forEach((s, i) => nota(523 * Math.pow(2, s / 12), a + i * 0.04, 0.35, 'triangle', 0.1));
  if (nombre === 'boom') { nota(110, a, 0.35, 'sawtooth', 0.08); nota(80, a + 0.02, 0.4, 'sine', 0.2); }
  if (nombre === 'cesta') [0, 5, 9].forEach((s, i) => nota(660 * Math.pow(2, s / 12), a + i * 0.07, 0.3, 'sine', 0.14));
  if (nombre === 'gana') [0, 4, 7, 12, 16].forEach((s, i) => nota(523 * Math.pow(2, s / 12), a + i * 0.11, 0.5, 'triangle', 0.13));
  if (nombre === 'pierde') [7, 4, 0].forEach((s, i) => nota(330 * Math.pow(2, s / 12), a + i * 0.16, 0.4, 'sine', 0.12));
  if (nombre === 'estrella') nota(880 * Math.pow(2, x * 4 / 12), a, 0.4, 'sine', 0.15);
  if (nombre === 'boton') nota(660, a, 0.06, 'sine', 0.06);
}
let musicaActual = null, musicaPedida = null, tocado = false;
function musica(nombre) {
  musicaPedida = nombre;
  const url = nombre && tema.musica?.[nombre];
  if (musicaActual?.nombre === nombre && !musicaActual.audio.paused) return;
  if (musicaActual) { musicaActual.audio.pause(); musicaActual = null; }
  if (!url || !tocado || !musicaActiva()) return;
  const a = new Audio(url); a.loop = nombre !== 'final'; a.volume = 0.3;
  musicaActual = { nombre, audio: a };
  a.play().catch(() => {});
}
function pintarBotonesSonido() {
  document.querySelectorAll('[data-sonido]').forEach(b => { b.textContent = sonidoActivo() ? '🔊' : '🔈'; b.classList.toggle('apagado', !sonidoActivo()); });
  document.querySelectorAll('[data-musica]').forEach(b => { b.hidden = !tema.musica; b.classList.toggle('apagado', !musicaActiva()); });
}

// ---------- pantallas ----------
function mostrar(id) {
  document.querySelectorAll('.pantalla').forEach(p => p.classList.toggle('activa', p.id === id));
}

function pintarInicio() {
  $('#sobretitulo').textContent = tx(tema.sobretitulo) || '';
  $('#titulo').textContent = tx(tema.titulo);
  $('#subtitulo').textContent = tx(tema.subtitulo) || '';
  const n = nivelActual();
  $('#btn-jugar').textContent = n > 1 ? t('seguir', { n }) : t('jugar');
  $('#progreso').textContent = n > 1 ? t('progreso', { n: superados(), e: totalEstrellas() }) : t('ayuda');
  const v = $('#vitrina'); v.innerHTML = '';
  tema.piezas.slice(0, 6).forEach((p, i) => {
    const img = new Image(); img.src = p.img; img.alt = ''; img.style.animationDelay = `${i * 0.12}s`; v.append(img);
  });
  if (tema.portada) document.body.style.setProperty('--portada', `url("${tema.portada}")`);
  musica('menu');
}

// Mapa: un camino que serpentea; se agregan niveles al llegar abajo (no tiene fin).
let mostrados = 0;
function pintarMapa() {
  const c = $('#camino'); c.innerHTML = ''; mostrados = 0;
  $('#estrellas-total').textContent = `★ ${totalEstrellas()}`;
  agregarAlMapa(Math.max(30, nivelActual() + 15));
  requestAnimationFrame(() => c.querySelector('.punto.actual')?.scrollIntoView({ block: 'center' }));
}
// Cada tramo de 10 niveles es una escena del tema (su fondo y su nombre) con un camino que une los puntos.
const PASO = 84, CABEZA = 96;
const xDe = n => 50 + Math.sin(n * 0.85) * 30;
function agregarAlMapa(hasta) {
  const c = $('#camino'), actual = nivelActual();
  hasta = Math.ceil(hasta / 10) * 10;
  for (let inicio = mostrados + 1; inicio <= hasta; inicio += 10) {
    const z = Math.floor((inicio - 1) / 10);
    const tramo = document.createElement('section');
    tramo.className = 'tramo';
    tramo.style.height = `${CABEZA + 10 * PASO}px`;
    const fondo = fondoDe(inicio); if (fondo) tramo.style.setProperty('--fondo-tramo', `url("${fondo}")`);
    const nombre = tx(tema.zonas?.[z % (tema.zonas?.length || 1)]) || '';
    const puntos = Array.from({ length: 11 }, (_, i) => [xDe(inicio + i), CABEZA + i * PASO + 33]);
    const ruta = puntos.map(([x, y], i) => (i ? `L${x} ${y}` : `M${x} ${y}`)).join(' ');
    tramo.innerHTML = `<h3><small>${t('tramo', { a: inicio, b: inicio + 9 })}</small>${nombre}</h3>
      <svg class="ruta" viewBox="0 0 100 ${CABEZA + 10 * PASO}" preserveAspectRatio="none" aria-hidden="true">
      <path d="${ruta}" class="ruta-fondo"/><path d="${ruta}" class="ruta-linea"/></svg>`;
    for (let i = 0; i < 10; i++) {
      const n = inicio + i, e = prog.estrellas[n] || 0;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'punto' + (n === actual ? ' actual' : '') + (n > actual ? ' cerrado' : '') + (e ? ' hecho' : '');
      b.style.left = `${xDe(n)}%`; b.style.top = `${CABEZA + i * PASO}px`;
      b.innerHTML = `<b>${n}</b><i>${n > actual ? '🔒' : '★'.repeat(e) + '☆'.repeat(e ? 3 - e : 0)}</i>`;
      b.disabled = n > actual;
      b.addEventListener('click', () => { sonar('boton'); antesDelNivel(n); });
      tramo.append(b);
    }
    c.append(tramo);
  }
  mostrados = hasta;
}

// Un fondo por tramo de 10 niveles (el mismo que se ve en el mapa).
function fondoDe(n) {
  const f = tema.fondos || [];
  return f.length ? f[Math.floor((n - 1) / 10) % f.length] : null;
}

// ---------- descripción de objetivos ----------
function nombrePieza(i, plural = true) { const p = tema.piezas[i]; return tx(plural ? p.plural || p.nombre : p.nombre); }
function iconoObjetivo(o) {
  if (o.tipo === 'recoger') return `<img src="${tema.piezas[o.pieza].img}" alt="">`;
  if (o.tipo === 'bajar') return `<img src="${tema.cesta.img}" alt="">`;
  if (o.tipo === 'bloques') return `<img src="${tema.bloque.img}" alt="">`;
  if (o.tipo === 'capas') return '<span class="muestra-capa"></span>';
  return '<span class="muestra-puntos">★</span>';
}
function textoObjetivo(o) {
  if (o.tipo === 'puntos') return t('obPuntos', { n: o.n.toLocaleString(lang) });
  if (o.tipo === 'recoger') return t('obRecoger', { n: o.n, pieza: nombrePieza(o.pieza) });
  if (o.tipo === 'capas') return t('obCapas', { capa: tx(tema.capa.nombre) });
  if (o.tipo === 'bloques') return t('obBloques', { bloque: tx(tema.bloque.plural || tema.bloque.nombre) });
  return t('obBajar', { n: o.n, cesta: tx(tema.cesta.plural || tema.cesta.nombre) });
}
function cuentaObjetivo(o) {
  if (T.cumplido(o)) return '✓';
  if (o.tipo === 'puntos') return Math.max(0, o.n - T.puntos).toLocaleString(lang);
  if (o.tipo === 'capas' || o.tipo === 'bloques') return T.progreso(o);
  return o.n - T.progreso(o);
}

// ---------- ventanas ----------
function ventana(html, clase = '') {
  const v = $('#ventana'); v.className = 'ventana ' + clase; v.innerHTML = html;
  $('#velo').hidden = false;
  return v;
}
function cerrarVentana() { $('#velo').hidden = true; }

function antesDelNivel(n) {
  const nv = armarNivel(n, tema);
  const lista = nv.objetivos.map(o => `<li>${iconoObjetivo(o)}<span>${textoObjetivo(o)}</span></li>`).join('');
  const mejor = prog.mejor[n] ? `<p class="record">${t('record', { n: prog.mejor[n].toLocaleString(lang) })}</p>` : '';
  const v = ventana(`
    <h2>${t('nivel', { n })}</h2>
    <p class="estrellas-grandes">${'★'.repeat(prog.estrellas[n] || 0)}${'☆'.repeat(3 - (prog.estrellas[n] || 0))}</p>
    <h3>${t('objetivo')}</h3><ul class="objetivos">${lista}</ul>
    <p class="movs-info"><b>${nv.movimientos}</b> ${t('movs')}</p>${mejor}
    <div class="botones"><button class="boton grande" data-a="jugar">${t('empezar')}</button>
    <button class="boton secundario" data-a="mapa">${t('mapa')}</button></div>`);
  v.querySelector('[data-a=jugar]').onclick = () => { sonar('boton'); cerrarVentana(); empezarNivel(n); };
  v.querySelector('[data-a=mapa]').onclick = () => { sonar('boton'); cerrarVentana(); pintarMapa(); mostrar('mapa'); };
}

// ---------- partida ----------
function empezarNivel(n) {
  const nv = armarNivel(n, tema);
  T = new Tablero(nv);
  extraUsado = false;
  mostrar('partida');
  const fondo = fondoDe(n);
  $('#fondo-nivel').style.backgroundImage = fondo ? `url("${fondo}")` : '';
  $('#hud-nivel').textContent = t('nivel', { n });
  construirTablero();
  pintarHUD();
  musica('partida');
  ocupado = false;
  programarPista();
}

function medir() {
  const z = $('#zona-tablero');
  const ancho = z.clientWidth - 8, alto = z.clientHeight - 8;
  lado = Math.max(28, Math.floor(Math.min(ancho / T.cols, alto / T.filas, 76)));
  const tab = $('#tablero');
  tab.style.setProperty('--t', `${lado}px`);
  tab.style.width = `${lado * T.cols}px`; tab.style.height = `${lado * T.filas}px`;
}
const pos = (r, c) => `translate(${c * lado}px, ${r * lado}px)`;

function construirTablero() {
  medir();
  const cas = $('#casillas'), pz = $('#piezas');
  cas.innerHTML = ''; pz.innerHTML = ''; $('#efectos').innerHTML = ''; elementos = new Map();
  T.recorrer((r, c, cel) => {
    if (!cel.activa) return;
    const d = document.createElement('div');
    d.className = 'casilla' + ((r + c) % 2 ? ' impar' : '');
    d.id = `k${r}_${c}`;
    d.style.transform = pos(r, c);
    cas.append(d);
    pintarCasilla(r, c);
    if (cel.pieza) crearPieza(cel.pieza, r, c);
  });
}

function pintarCasilla(r, c) {
  const cel = T.celda(r, c), d = $(`#k${r}_${c}`);
  if (!d) return;
  d.classList.toggle('capa1', cel.capa === 1); d.classList.toggle('capa2', cel.capa === 2);
  let b = d.querySelector('.bloque');
  if (cel.bloque) {
    if (!b) { b = document.createElement('div'); b.className = 'bloque'; b.innerHTML = `<img src="${tema.bloque.img}" alt="">`; d.append(b); }
    b.classList.toggle('doble', cel.bloque === 2);
  } else if (b) {
    b.classList.add('rompe'); setTimeout(() => b.remove(), 350);
  }
}

function imagenDe(p) {
  if (p.tipo === 'E') return tema.estrella.img;
  if (p.tipo === 'K') return tema.cesta.img;
  return tema.piezas[p.tipo].img;
}
function crearPieza(p, r, c, desdeFila = null) {
  const el = document.createElement('div');
  el.className = 'pieza';
  el.innerHTML = `<img src="${imagenDe(p)}" alt="" draggable="false">`;
  marcarEspecial(el, p);
  el.style.transform = pos(desdeFila ?? r, c);
  $('#piezas').append(el);
  elementos.set(p.id, el);
  return el;
}
function marcarEspecial(el, p) {
  el.classList.toggle('esp-fila', p.esp === 'fila');
  el.classList.toggle('esp-columna', p.esp === 'columna');
  el.classList.toggle('esp-bomba', p.esp === 'bomba');
  el.classList.toggle('esp-estrella', p.tipo === 'E');
  el.classList.toggle('cesta', p.tipo === 'K');
}
function mover(el, r, c, ms, curva = 'ease-in') {
  el.style.transition = `transform ${ms}ms ${curva}`;
  el.style.transform = pos(r, c);
}

function pintarHUD() {
  $('#hud-movs').textContent = T.movs;
  $('#hud-movs').parentElement.classList.toggle('pocos', T.movs <= 5);
  $('#hud-puntos').textContent = T.puntos.toLocaleString(lang);
  const [, e2, e3] = T.nivel.estrellas;
  const tope = e3 * 1.1;
  $('#barra-puntos').style.width = `${Math.min(100, T.puntos / tope * 100)}%`;
  document.querySelector('.marca.m2').style.left = `${e2 / tope * 100}%`;
  document.querySelector('.marca.m3').style.left = `${e3 / tope * 100}%`;
  $('#hud-objetivos').innerHTML = T.nivel.objetivos.map(o =>
    `<span class="obj${T.cumplido(o) ? ' listo' : ''}" title="${textoObjetivo(o)}">${iconoObjetivo(o)}<b>${cuentaObjetivo(o)}</b></span>`).join('');
}

// ---------- tocar y deslizar ----------
let inicioToque = null, elegida = null;
function casillaDe(ev) {
  const rect = $('#tablero').getBoundingClientRect();
  const c = Math.floor((ev.clientX - rect.left) / lado), r = Math.floor((ev.clientY - rect.top) / lado);
  return T.celda(r, c)?.activa ? [r, c] : null;
}
function marcarElegida(rc) {
  document.querySelectorAll('.pieza.elegida').forEach(e => e.classList.remove('elegida'));
  elegida = rc;
  if (rc) elementos.get(T.pieza(...rc)?.id)?.classList.add('elegida');
}
function prepararToques() {
  const tab = $('#tablero');
  tab.addEventListener('pointerdown', ev => {
    if (ocupado || !T) return;
    const rc = casillaDe(ev); if (!rc) return;
    try { tab.setPointerCapture(ev.pointerId); } catch { /* toque simulado */ }
    inicioToque = { x: ev.clientX, y: ev.clientY, rc, usado: false };
  });
  tab.addEventListener('pointermove', ev => {
    if (!inicioToque || inicioToque.usado || ocupado) return;
    const dx = ev.clientX - inicioToque.x, dy = ev.clientY - inicioToque.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < lado * 0.35) return;
    inicioToque.usado = true;
    const [r, c] = inicioToque.rc;
    const destino = Math.abs(dx) > Math.abs(dy) ? [r, c + Math.sign(dx)] : [r + Math.sign(dy), c];
    marcarElegida(null);
    intentar(inicioToque.rc, destino);
  });
  tab.addEventListener('pointerup', () => {
    if (!inicioToque) return;
    const { rc, usado } = inicioToque; inicioToque = null;
    if (usado || ocupado) return;
    if (elegida && Math.abs(elegida[0] - rc[0]) + Math.abs(elegida[1] - rc[1]) === 1) {
      const a = elegida; marcarElegida(null); intentar(a, rc);
    } else if (elegida && elegida[0] === rc[0] && elegida[1] === rc[1]) marcarElegida(null);
    else { marcarElegida(rc); sonar('boton'); }
  });
  tab.addEventListener('pointercancel', () => { inicioToque = null; });
}

async function intentar(a, b) {
  if (ocupado || !T.celda(...b)?.activa) return;
  const pa = T.pieza(...a), pb = T.pieza(...b);
  if (!pa || !pb || T.celda(...a).bloque || T.celda(...b).bloque) return;
  ocupado = true; quitarPista();
  const ea = elementos.get(pa.id), eb = elementos.get(pb.id);
  sonar('cambio');
  mover(ea, ...b, 150, 'ease-out'); mover(eb, ...a, 150, 'ease-out');
  await espera(160);
  const res = T.jugar(a, b);
  if (!res) {
    sonar('no');
    mover(ea, ...a, 150, 'ease-out'); mover(eb, ...b, 150, 'ease-out');
    await espera(160);
    ocupado = false; programarPista();
    return;
  }
  pintarHUD();
  await reproducir(res.fases);
  await despuesDeJugada();
}

// ---------- animar las fases que devuelve el tablero ----------
async function reproducir(fases, rapido = false) {
  const vel = rapido ? 0.6 : 1;
  for (const f of fases) {
    for (const tr of f.transformar) { const el = elementos.get(tr.id); if (el) { marcarEspecial(el, { esp: tr.esp }); el.classList.add('brilla'); } }
    if (f.transformar.length) await espera(260 * vel);
    if (f.efectos.length) dibujarEfectos(f.efectos);
    const especiales = f.efectos.length > 0;
    sonar(especiales ? 'especial' : 'combina', f.combo);
    if (f.efectos.some(e => e.tipo === 'bomba' || e.tipo === 'todo')) { sonar('boom'); sacudir(); }
    if (f.combo >= 2 && !rapido) cartel(t('bien')[Math.min(f.combo - 2, 3)]);
    for (const b of f.borradas) elementos.get(b.id)?.classList.add('sale');
    if (f.borradas.length) puntosFlotantes(f);
    for (const k of f.capas) { pintarCasilla(k.r, k.c); $(`#k${k.r}_${k.c}`)?.classList.add('golpe'); }
    for (const k of f.bloques) pintarCasilla(k.r, k.c);
    await espera(230 * vel);
    for (const b of f.borradas) { elementos.get(b.id)?.remove(); elementos.delete(b.id); }
    for (const nu of f.nuevas) { const el = crearPieza(nu.pieza, nu.r, nu.c); el.classList.add('nace'); }
    if (f.nuevas.length) sonar('estrella', 1);
    pintarHUD();
    for (const paso of f.caidas) {
      if (paso.cestas) {
        sonar('cesta');
        for (const k of paso.cestas) {
          const el = elementos.get(k.id);
          if (el) { el.classList.add('sale-cesta'); mover(el, k.r + 1, k.c, 300, 'ease-in'); setTimeout(() => el.remove(), 320); }
          elementos.delete(k.id);
        }
        pintarHUD();
        await espera(260 * vel);
        continue;
      }
      for (const m of paso) {
        if (m.nueva) { const el = crearPieza(m.pieza, ...m.a, m.a[0] - 1); el.getBoundingClientRect(); el.classList.add('entra'); }
        mover(elementos.get(m.id), ...m.a, 80 * vel, 'linear');
      }
      await espera(82 * vel);
    }
    document.querySelectorAll('.pieza.brilla, .pieza.nace, .pieza.entra').forEach(e => e.classList.remove('brilla', 'nace', 'entra'));
    await espera(40 * vel);
  }
  pintarHUD();
}

function dibujarEfectos(efectos) {
  const capa = $('#efectos');
  for (const e of efectos) {
    const d = document.createElement('div');
    if (e.tipo === 'fila') { d.className = 'rayo-h'; d.style.top = `${(e.r + 0.5) * lado}px`; }
    else if (e.tipo === 'columna') { d.className = 'rayo-v'; d.style.left = `${(e.c + 0.5) * lado}px`; }
    else if (e.tipo === 'bomba') {
      d.className = 'onda'; const tam = (e.radio * 2 + 1) * lado;
      Object.assign(d.style, { width: `${tam}px`, height: `${tam}px`, left: `${(e.c + 0.5) * lado - tam / 2}px`, top: `${(e.r + 0.5) * lado - tam / 2}px` });
    } else if (e.tipo === 'rayo') {
      const x1 = (e.de[1] + 0.5) * lado, y1 = (e.de[0] + 0.5) * lado, x2 = (e.a[1] + 0.5) * lado, y2 = (e.a[0] + 0.5) * lado;
      d.className = 'luz';
      Object.assign(d.style, { left: `${x1}px`, top: `${y1}px`, width: `${Math.hypot(x2 - x1, y2 - y1)}px`, transform: `rotate(${Math.atan2(y2 - y1, x2 - x1)}rad)` });
    } else if (e.tipo === 'todo' || e.tipo === 'estrella') { d.className = 'destello'; }
    capa.append(d);
    setTimeout(() => d.remove(), 600);
  }
}

function puntosFlotantes(f) {
  const xs = f.borradas.map(b => b.c), ys = f.borradas.map(b => b.r);
  const d = document.createElement('div');
  d.className = 'flota';
  d.textContent = `+${f.puntos}`;
  d.style.left = `${(xs.reduce((a, b) => a + b) / xs.length + 0.5) * lado}px`;
  d.style.top = `${(ys.reduce((a, b) => a + b) / ys.length + 0.5) * lado}px`;
  $('#efectos').append(d);
  setTimeout(() => d.remove(), 900);
}

function sacudir() { const t = $('#tablero'); t.classList.remove('sacude'); void t.offsetWidth; t.classList.add('sacude'); }
let cartelReloj = 0;
function cartel(texto, ms = 900) {
  const c = $('#cartel'); c.textContent = texto; c.hidden = false;
  c.classList.remove('aparece'); void c.offsetWidth; c.classList.add('aparece');
  clearTimeout(cartelReloj); cartelReloj = setTimeout(() => { c.hidden = true; }, ms);
}

// ---------- pista: si pasan unos segundos sin jugar, se mueven las dos piezas de una jugada ----------
function programarPista() {
  quitarPista();
  pistaReloj = setTimeout(() => {
    if (ocupado || !T) return;
    const j = T.hayMovimiento(); if (!j) return;
    j.forEach(rc => elementos.get(T.pieza(...rc)?.id)?.classList.add('pista'));
  }, 6000);
}
function quitarPista() { clearTimeout(pistaReloj); document.querySelectorAll('.pieza.pista').forEach(e => e.classList.remove('pista')); }

// ---------- fin de una jugada ----------
async function despuesDeJugada() {
  const est = T.estado();
  if (est === 'ganado') return ganar();
  if (est === 'perdido') return perder();
  if (!T.hayMovimiento()) {
    cartel(t('mezclando'), 1200);
    await espera(700);
    const pasos = T.mezclar();
    for (const p of pasos) {
      let el = elementos.get(p.id);
      if (el) { el.querySelector('img').src = imagenDe(T.pieza(...p.a)); mover(el, ...p.a, 350, 'ease-in-out'); }
    }
    await espera(400);
  }
  ocupado = false; programarPista();
}

async function ganar() {
  const n = T.nivel.numero;
  sonar('gana');
  cartel(t('premio'), 1000);
  await espera(600);
  const fases = T.premioFinal();
  if (fases.length) await reproducir(fases, true);
  const est = T.estrellas();
  prog.estrellas[n] = Math.max(prog.estrellas[n] || 0, est);
  prog.mejor[n] = Math.max(prog.mejor[n] || 0, T.puntos);
  guardarProgreso();
  musica('final');
  const vs = tema.versiculos || [];
  const v = vs.length ? vs[(n - 1) % vs.length] : null;
  const verso = v ? `<blockquote class="versiculo"><p>${tx(v.texto)}</p><cite>${tx(v.cita)}</cite></blockquote>` : '';
  const w = ventana(`
    <h2>${t('ganaste')}</h2>
    <p class="estrellas-grandes gana">${[1, 2, 3].map(i => `<span class="${i <= est ? 'si' : ''}" style="animation-delay:${i * 0.25}s">★</span>`).join('')}</p>
    <p class="puntaje"><b>${T.puntos.toLocaleString(lang)}</b> ${t('puntos')}</p>${verso}
    <div class="botones"><button class="boton grande" data-a="sig">${t('siguiente')}</button>
    <button class="boton secundario" data-a="mapa">${t('mapa')}</button></div>`, 'ganada');
  [1, 2, 3].slice(0, est).forEach(i => setTimeout(() => sonar('estrella', i - 1), i * 250 + 100));
  w.querySelector('[data-a=sig]').onclick = () => { sonar('boton'); cerrarVentana(); antesDelNivel(n + 1); };
  w.querySelector('[data-a=mapa]').onclick = () => { sonar('boton'); cerrarVentana(); pintarMapa(); mostrar('mapa'); musica('menu'); };
}

function perder() {
  sonar('pierde');
  const n = T.nivel.numero;
  const faltan = T.nivel.objetivos.filter(o => !T.cumplido(o)).map(o => `<li>${iconoObjetivo(o)}<span>${cuentaObjetivo(o)}</span></li>`).join('');
  const w = ventana(`
    <h2>${t('perdiste')}</h2><h3>${t('faltan')}</h3><ul class="objetivos fila">${faltan}</ul>
    <div class="botones">${extraUsado ? '' : `<button class="boton grande" data-a="mas">${t('mas5')}</button>`}
    <button class="boton ${extraUsado ? 'grande' : 'secundario'}" data-a="otra">${t('reintentar')}</button>
    <button class="boton secundario" data-a="mapa">${t('mapa')}</button></div>`, 'perdida');
  w.querySelector('[data-a=mas]')?.addEventListener('click', () => {
    sonar('boton'); extraUsado = true; T.movs += 5; cerrarVentana(); pintarHUD(); ocupado = false; programarPista();
  });
  w.querySelector('[data-a=otra]').onclick = () => { sonar('boton'); cerrarVentana(); empezarNivel(n); };
  w.querySelector('[data-a=mapa]').onclick = () => { sonar('boton'); cerrarVentana(); pintarMapa(); mostrar('mapa'); musica('menu'); };
}

function preguntarSalir() {
  const w = ventana(`<h2>${t('seguroSalir')}</h2>
    <div class="botones"><button class="boton grande" data-a="no">${t('salirNo')}</button>
    <button class="boton secundario" data-a="si">${t('salirSi')}</button></div>`);
  w.querySelector('[data-a=no]').onclick = () => { sonar('boton'); cerrarVentana(); };
  w.querySelector('[data-a=si]').onclick = () => { sonar('boton'); cerrarVentana(); quitarPista(); T = null; pintarMapa(); mostrar('mapa'); musica('menu'); };
}

// ---------- arranque ----------
async function iniciar() {
  tema = await (await fetch('tema/tema.json?v=2ad6f4e0', { cache: 'no-cache' })).json();
  lang = elegirIdioma();
  cargarProgreso();
  traducir(); pintarBotonesSonido(); pintarInicio();
  if (tema.volverA && !/^(localhost|127\.|192\.168\.)/.test(location.hostname)) { $('#salir-sitio').href = tema.volverA; $('#salir-sitio').hidden = false; }
  prepararToques();

  $('#btn-jugar').onclick = () => { sonar('boton'); antesDelNivel(nivelActual()); };
  $('#btn-mapa').onclick = () => { sonar('boton'); pintarMapa(); mostrar('mapa'); };
  $('#btn-mapa-volver').onclick = () => { sonar('boton'); pintarInicio(); mostrar('inicio'); };
  $('#btn-salir').onclick = () => { sonar('boton'); if (ocupado) return; preguntarSalir(); };
  $('#btn-idioma').onclick = () => {
    lang = lang === 'es' ? 'en' : 'es';
    try { localStorage.setItem('verbo:uiLang', lang); } catch { /* sin almacenamiento */ }
    traducir(); pintarInicio();
  };
  document.querySelectorAll('[data-sonido]').forEach(b => b.addEventListener('click', () => {
    try { localStorage.setItem('mini:sonido', sonidoActivo() ? 'no' : 'si'); } catch { /* sin almacenamiento */ }
    pintarBotonesSonido(); sonar('boton');
  }));
  document.querySelectorAll('[data-musica]').forEach(b => b.addEventListener('click', () => {
    try { localStorage.setItem('mini:musica', musicaActiva() ? 'no' : 'si'); } catch { /* sin almacenamiento */ }
    pintarBotonesSonido();
    if (musicaActiva()) musica(musicaPedida); else if (musicaActual) { musicaActual.audio.pause(); musicaActual = null; }
  }));
  // La música solo puede empezar después del primer toque.
  addEventListener('pointerdown', () => { if (!tocado) { tocado = true; musica(musicaPedida); } }, { once: true });
  $('#camino').addEventListener('scroll', ev => {
    const c = ev.target;
    if (c.scrollTop + c.clientHeight > c.scrollHeight - 300) agregarAlMapa(mostrados + 20);
  });
  addEventListener('resize', () => {
    if (!T || !$('#partida').classList.contains('activa')) return;
    medir();
    T.recorrer((r, c, cel) => {
      const k = $(`#k${r}_${c}`); if (k) k.style.transform = pos(r, c);
      if (cel.pieza) { const el = elementos.get(cel.pieza.id); if (el) { el.style.transition = 'none'; el.style.transform = pos(r, c); } }
    });
  });
  // Atajo de prueba: ?nivel=12 abre ese nivel directo.
  const pedido = Number(new URLSearchParams(location.search).get('nivel'));
  if (pedido > 0) empezarNivel(pedido);
}

iniciar();
