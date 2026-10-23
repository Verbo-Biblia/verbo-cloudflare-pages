// Pares de la arena: juego de memoria con 15 niveles. Se voltean dos cartas por intento; si son iguales quedan boca
// arriba. Cada nivel es un sitio arqueológico y siempre trae el hallazgo de ese sitio; el resto de las cartas sale al
// azar del mazo (mazos/hallazgos.json), y cada hallazgo tiene varias imágenes, así las partidas no se repiten tanto.
// Al terminar un nivel se abre el siguiente; el avance y las estrellas se guardan en el navegador.

import { t, idioma, cambiarIdioma, fijarTextos, traducirPagina } from './comun/idioma.js';
import { sonar, sonidoActivo, fijarSonido, precargar } from './comun/sonido.js';
import { musica, musicaActiva, fijarMusica } from './comun/musica.js';

const TEXTOS = {
  es: {
    sobretitulo: 'Juego de memoria',
    titulo: 'Pares de la arena',
    subtitulo: 'Hallazgos de la arqueología bíblica',
    como: 'Viaja por 15 sitios de excavación. Da vuelta a dos cartas: si son iguales, ¡encontraste un par! Encuéntralos todos con pocos intentos para ganar 3 estrellas.',
    jugar: 'Jugar', continuar: 'Continuar · nivel {n}', niveles: 'Niveles',
    progreso: '{n} de 15 niveles · {e} de 45 estrellas',
    elegirNivel: 'Elige un nivel', nivel: 'Nivel {n}', nPares: '{n} pares',
    pares: 'pares', intentos: 'intentos',
    volver: 'Volver a los juegos', menu: 'Volver al menú', salir: 'Salir a los niveles', sonido: 'Efectos de sonido', musica: 'Música',
    bloqueado: 'Termina el nivel {n} para abrir este',
    carta: 'Carta {n}',
    par: '¡Par!',
    completo: '¡Nivel completado!',
    todo: '¡Terminaste los 15 niveles!',
    resumen: '{p} pares en {i} intentos y {tiempo}.',
    recordNuevo: '¡Nueva mejor marca en este nivel!',
    recordAnterior: 'Tu mejor marca aquí: {i} intentos.',
    descubriste: 'Los hallazgos de este nivel',
    siguiente: 'Siguiente nivel', repetir: 'Repetir',
    salirSeguro: 'Toca otra vez para salir',
  },
  en: {
    sobretitulo: 'Memory game',
    titulo: 'Pairs in the Sand',
    subtitulo: 'Discoveries of biblical archaeology',
    como: 'Travel through 15 excavation sites. Turn over two cards: if they match, you found a pair! Find them all in few tries to earn 3 stars.',
    jugar: 'Play', continuar: 'Continue · level {n}', niveles: 'Levels',
    progreso: '{n} of 15 levels · {e} of 45 stars',
    elegirNivel: 'Choose a level', nivel: 'Level {n}', nPares: '{n} pairs',
    pares: 'pairs', intentos: 'tries',
    volver: 'Back to the games', menu: 'Back to the menu', salir: 'Back to the levels', sonido: 'Sound effects', musica: 'Music',
    bloqueado: 'Finish level {n} to open this one',
    carta: 'Card {n}',
    par: 'A pair!',
    completo: 'Level complete!',
    todo: 'You finished all 15 levels!',
    resumen: '{p} pairs in {i} tries and {tiempo}.',
    recordNuevo: 'New best for this level!',
    recordAnterior: 'Your best here: {i} tries.',
    descubriste: 'The discoveries in this level',
    siguiente: 'Next level', repetir: 'Play again',
    salirSeguro: 'Tap again to leave',
  },
};

// Los 15 niveles: sitio, hallazgo que siempre sale y cantidad de pares (de 3 a 15).
const NIVELES = [
  { pares: 3, hallazgo: 'BA-01', es: 'Las cuevas de Qumrán', en: 'The Caves of Qumran' },
  { pares: 4, hallazgo: 'BA-05', es: 'El mar de Galilea', en: 'The Sea of Galilee' },
  { pares: 5, hallazgo: 'BA-02', es: 'El túnel de Ezequías', en: "Hezekiah's Tunnel" },
  { pares: 6, hallazgo: 'BA-06', es: 'El estanque de Siloé', en: 'The Pool of Siloam' },
  { pares: 6, hallazgo: 'BA-07', es: 'Los cinco pórticos de Betesda', en: 'The Five Porches of Bethesda' },
  { pares: 7, hallazgo: 'BA-08', es: 'El teatro de Cesarea', en: 'The Theater of Caesarea' },
  { pares: 8, hallazgo: 'BA-03', es: 'Dibón, en Moab', en: 'Dibon, in Moab' },
  { pares: 8, hallazgo: 'BA-04', es: 'La puerta de Tel Dan', en: 'The Gate of Tel Dan' },
  { pares: 9, hallazgo: 'BA-19', es: 'Los campos de Gézer', en: 'The Fields of Gezer' },
  { pares: 10, hallazgo: 'BA-13', es: 'Las murallas de Laquis', en: 'The Walls of Lachish' },
  { pares: 10, hallazgo: 'BA-14', es: 'Las cuevas de Ketef Hinom', en: 'The Caves of Ketef Hinnom' },
  { pares: 12, hallazgo: 'BA-17', es: 'Las calles de Corinto', en: 'The Streets of Corinth' },
  { pares: 12, hallazgo: 'BA-11', es: 'El palacio de Nínive', en: 'The Palace of Nineveh' },
  { pares: 14, hallazgo: 'BA-15', es: 'El templo de Ur', en: 'The Temple of Ur' },
  { pares: 15, hallazgo: 'BA-20', es: 'Las puertas de Babilonia', en: 'The Gates of Babylon' },
];
const MAZO = 'hallazgos';
const CLAVE_AVANCE = 'mini:pares:avance';
const ESPERA_FALLO = 950;

const $ = s => document.querySelector(s);
let mazo = null;
let estado = null; // partida en curso

fijarTextos(TEXTOS);

// ---------- utilidades ----------

function barajar(lista) {
  const a = lista.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function reloj(seg) { return `${Math.floor(seg / 60)}:${String(seg % 60).padStart(2, '0')}`; }

const nombreNivel = i => NIVELES[i][idioma()] || NIVELES[i].es;
const cartaDe = id => mazo.cartas.find(c => c.id === id);
const textoCarta = c => c[idioma()] || c.es;
const estrellasPor = (pares, intentos) => intentos <= Math.ceil(pares * 1.5) ? 3 : intentos <= Math.ceil(pares * 2.2) ? 2 : 1;

// Avance: { "0": {estrellas, intentos, seg}, ... } por índice de nivel terminado.
function leerAvance() {
  try { return JSON.parse(localStorage.getItem(CLAVE_AVANCE)) || {}; } catch { return {}; }
}
function guardarAvance(i, estrellas, intentos, seg) {
  const av = leerAvance();
  const antes = av[i];
  const mejor = !antes || intentos < antes.intentos || (intentos === antes.intentos && seg < antes.seg);
  if (mejor) av[i] = { estrellas: Math.max(estrellas, antes?.estrellas || 0), intentos, seg };
  else av[i] = { ...antes, estrellas: Math.max(estrellas, antes.estrellas) };
  try { localStorage.setItem(CLAVE_AVANCE, JSON.stringify(av)); } catch { /* sin almacenamiento */ }
  return { mejor, antes };
}
const abierto = (i, av = leerAvance()) => i === 0 || !!av[i - 1];
// El primer nivel abierto sin terminar (o el último, si ya se terminó todo).
function nivelActual(av = leerAvance()) {
  for (let i = 0; i < NIVELES.length; i++) if (!av[i]) return i;
  return NIVELES.length - 1;
}

// Cada pantalla con su música: menú y niveles, partida, y el cierre de victoria una sola vez.
const MUSICA = { inicio: 'menu', niveles: 'menu', partida: 'partida' };

function mostrar(id) {
  document.querySelectorAll('.pantalla').forEach(p => p.classList.toggle('activa', p.id === id));
  window.scrollTo(0, 0);
  if (id === 'final') musica('final', false);
  else musica(MUSICA[id]);
}

function pintarSonido() {
  document.querySelectorAll('[data-sonido]').forEach(b => { b.textContent = sonidoActivo() ? '🔊' : '🔇'; });
  document.querySelectorAll('[data-musica]').forEach(b => { b.classList.toggle('apagado', !musicaActiva()); });
}

// ---------- menú inicial ----------

function pintarInicio() {
  traducirPagina();
  document.title = `${t('titulo')} · ${t('subtitulo')} | Verbo`;
  $('#btn-idioma').textContent = idioma() === 'es' ? 'EN' : 'ES';
  const av = leerAvance();
  const hechos = Object.keys(av).length;
  const estrellas = Object.values(av).reduce((s, x) => s + x.estrellas, 0);
  $('#btn-jugar').textContent = hechos ? t('continuar', { n: nivelActual(av) + 1 }) : t('jugar');
  $('#progreso').textContent = hechos ? t('progreso', { n: hechos, e: estrellas }) : '';
  // Abanico de cinco cartas: dos iguales en el centro boca arriba, las demás boca abajo.
  if (!$('#abanico').children.length) {
    const c = cartaDe('BA-01');
    $('#abanico').innerHTML = [0, 1, 2, 3, 4].map(k => (k === 1 || k === 3)
      ? `<span class="mini frente" style="--k:${k};--y:${Math.abs(k - 2) * 9}px"><img src="${c.imagenes[0]}" alt=""></span>`
      : `<span class="mini dorso" style="--k:${k};--y:${Math.abs(k - 2) * 9}px"></span>`).join('');
  }
  pintarSonido();
}

// ---------- niveles ----------

function pintarNiveles() {
  traducirPagina($('#niveles'));
  const av = leerAvance();
  const total = Object.values(av).reduce((s, x) => s + x.estrellas, 0);
  $('#estrellas-total').textContent = `★ ${total}/45`;
  $('#rejilla').innerHTML = NIVELES.map((n, i) => {
    const libre = abierto(i, av);
    const hecho = av[i];
    const img = cartaDe(n.hallazgo).imagenes[0];
    const est = hecho ? [1, 2, 3].map(k => `<i class="${k <= hecho.estrellas ? 'llena' : ''}">★</i>`).join('') : '';
    return `<button class="nivel-ficha ${libre ? '' : 'cerrado'} ${hecho ? 'hecho' : ''}" type="button" data-i="${i}"
        ${libre ? '' : `aria-disabled="true" title="${t('bloqueado', { n: i })}"`}>
      <img src="${img}" alt="" loading="lazy">
      <span class="ficha-num">${i + 1}</span>
      ${libre ? '' : '<span class="candado" aria-hidden="true">🔒</span>'}
      <span class="ficha-texto">
        <b>${nombreNivel(i)}</b>
        <small>${t('nPares', { n: n.pares })}</small>
        <span class="ficha-estrellas">${est}</span>
      </span>
    </button>`;
  }).join('');
  mostrar('niveles');
  const actual = $(`#rejilla [data-i="${nivelActual(av)}"]`);
  actual?.classList.add('actual');
  actual?.scrollIntoView({ block: 'center' });
}

// ---------- partida ----------

function empezar(i) {
  const nivel = NIVELES[i];
  const fija = cartaDe(nivel.hallazgo);
  const otras = barajar(mazo.cartas.filter(c => c !== fija)).slice(0, nivel.pares - 1);
  const elegidas = [fija, ...otras].map(c => ({ ...c, imagen: c.imagenes[Math.floor(Math.random() * c.imagenes.length)] }));
  const cartas = barajar(elegidas.flatMap(c => [{ ...c }, { ...c }])).map((c, n) => ({ ...c, n, hecha: false }));
  clearInterval(estado?.reloj);
  estado = { i, nivel, elegidas, cartas, abiertas: [], pares: 0, intentos: 0, inicio: 0, reloj: null, bloqueo: false, salir: 0 };

  traducirPagina($('#partida'));
  $('#m-nivel').textContent = `${i + 1}. ${nombreNivel(i)}`;
  const mesa = $('#mesa');
  mesa.innerHTML = cartas.map(c => `
    <button class="carta" type="button" data-n="${c.n}" aria-label="${t('carta', { n: c.n + 1 })}">
      <span class="cara dorso"></span>
      <span class="cara frente"><img src="${c.imagen}" alt="" draggable="false"></span>
    </button>`).join('');
  actualizarMarcador();
  mostrar('partida');
  acomodar();
  sonar('boton', .5);
}

function actualizarMarcador() {
  $('#m-pares').textContent = `${estado.pares}/${estado.nivel.pares}`;
  $('#m-intentos').textContent = estado.intentos;
  const seg = estado.inicio ? Math.floor((Date.now() - estado.inicio) / 1000) : 0;
  $('#m-tiempo').textContent = reloj(seg);
}

const cartaEl = n => $(`#mesa .carta[data-n="${n}"]`);

function tocar(n) {
  if (!estado || estado.bloqueo) return;
  const c = estado.cartas[n];
  if (c.hecha || estado.abiertas.includes(n)) return;
  if (!estado.inicio) {
    estado.inicio = Date.now();
    estado.reloj = setInterval(actualizarMarcador, 1000);
  }
  const el = cartaEl(n);
  el.classList.add('volteada');
  el.setAttribute('aria-label', textoCarta(c).titulo);
  sonar('voltear', .6);
  estado.abiertas.push(n);
  if (estado.abiertas.length < 2) return;

  estado.intentos++;
  const [a, b] = estado.abiertas.map(k => estado.cartas[k]);
  if (a.id === b.id) {
    a.hecha = b.hecha = true;
    estado.pares++;
    estado.abiertas = [];
    for (const x of [a, b]) cartaEl(x.n).classList.add('hecha');
    setTimeout(() => sonar('par', .6), 180);
    avisarPar(a);
    actualizarMarcador();
    if (estado.pares === estado.nivel.pares) setTimeout(terminar, 1300);
  } else {
    estado.bloqueo = true;
    actualizarMarcador();
    setTimeout(() => {
      for (const x of [a, b]) {
        const e = cartaEl(x.n);
        e.classList.remove('volteada');
        e.classList.add('fallo');
        e.setAttribute('aria-label', t('carta', { n: x.n + 1 }));
        setTimeout(() => e.classList.remove('fallo'), 400);
      }
      sonar('fallo', .35);
      estado.abiertas = [];
      estado.bloqueo = false;
    }, ESPERA_FALLO);
  }
}

let avisoTimer = 0;
function avisar(html, ms = 2600) {
  const aviso = $('#aviso');
  aviso.innerHTML = html;
  aviso.classList.add('visible');
  clearTimeout(avisoTimer);
  avisoTimer = setTimeout(() => aviso.classList.remove('visible'), ms);
}
function avisarPar(c) {
  const x = textoCarta(c);
  avisar(`<b>${t('par')}</b> ${x.titulo}${x.libro ? ` <small>· ${x.libro}</small>` : ''}`);
}

function terminar() {
  clearInterval(estado.reloj);
  const seg = Math.floor((Date.now() - estado.inicio) / 1000);
  const { i, nivel, intentos } = estado;
  const estrellas = estrellasPor(nivel.pares, intentos);
  const { mejor, antes } = guardarAvance(i, estrellas, intentos, seg);
  const ultimo = i === NIVELES.length - 1;

  traducirPagina($('#final'));
  $('#f-nivel').textContent = `${t('nivel', { n: i + 1 })} · ${nombreNivel(i)}`;
  $('#f-titulo').textContent = ultimo ? t('todo') : t('completo');
  $('#estrellas').innerHTML = [1, 2, 3].map(k => `<span class="${k <= estrellas ? 'llena' : ''}" style="--k:${k}">★</span>`).join('');
  $('#resumen').textContent = t('resumen', { p: nivel.pares, i: intentos, tiempo: reloj(seg) });
  $('#record').textContent = mejor ? (antes ? t('recordNuevo') : '') : t('recordAnterior', { i: antes.intentos });
  $('#record').classList.toggle('nuevo', mejor);
  $('#btn-siguiente').hidden = ultimo;
  $('#lista').innerHTML = estado.elegidas.map(c => {
    const x = textoCarta(c);
    return `<li><img src="${c.imagen}" alt=""><span><b>${x.titulo}</b>${x.libro ? `<small>${x.libro}</small>` : ''}</span></li>`;
  }).join('');
  const mas = $('#mas-info');
  mas.textContent = (mazo[idioma()] || mazo.es).masInfo + ' →';
  mas.href = mazo.enlace;
  mostrar('final');
  sonar(ultimo ? 'premio' : 'victoria', .6);
}

// Tamaño de las cartas: la cuadrícula que deja las cartas más grandes sin salirse de la pantalla.
function acomodar() {
  if (!estado || !$('#partida').classList.contains('activa')) return;
  const mesa = $('#mesa');
  const total = estado.cartas.length;
  const proporcion = mazo.forma === 'vertical' ? 2 / 3 : mazo.forma === 'cuadrada' ? 1 : 4 / 3; // ancho / alto
  const W = mesa.clientWidth, H = mesa.clientHeight;
  const gap = Math.max(5, Math.min(14, Math.round(Math.min(W, H) / 60)));
  let mejor = { ancho: 0, cols: 2 };
  for (let cols = 2; cols <= total; cols++) {
    if (total % cols) continue;
    const filas = total / cols;
    const ancho = Math.min((W - gap * (cols - 1)) / cols, ((H - gap * (filas - 1)) / filas) * proporcion);
    if (ancho > mejor.ancho) mejor = { ancho, cols };
  }
  mesa.style.setProperty('--cols', mejor.cols);
  mesa.style.setProperty('--ancho', `${Math.floor(mejor.ancho)}px`);
  mesa.style.setProperty('--gap', `${gap}px`);
  mesa.style.setProperty('--proporcion', proporcion);
}

// ---------- arranque ----------

async function iniciar() {
  mazo = await (await fetch(`mazos/${MAZO}.json`)).json();
  pintarInicio();
  musica('menu');

  $('#btn-jugar').addEventListener('click', () => empezar(nivelActual()));
  $('#btn-ver-niveles').addEventListener('click', () => { sonar('boton', .5); pintarNiveles(); });
  $('#btn-niveles-volver').addEventListener('click', () => { sonar('boton', .5); pintarInicio(); mostrar('inicio'); });
  $('#rejilla').addEventListener('click', e => {
    const b = e.target.closest('.nivel-ficha');
    if (!b) return;
    const i = Number(b.dataset.i);
    if (abierto(i)) return empezar(i);
    sonar('fallo', .3);
    b.classList.remove('sacudir'); void b.offsetWidth; b.classList.add('sacudir');
  });
  $('#mesa').addEventListener('click', e => {
    const c = e.target.closest('.carta');
    if (c) tocar(Number(c.dataset.n));
  });
  $('#btn-idioma').addEventListener('click', () => {
    cambiarIdioma(idioma() === 'es' ? 'en' : 'es');
    pintarInicio();
    sonar('boton', .5);
  });
  document.querySelectorAll('[data-sonido]').forEach(b => b.addEventListener('click', () => {
    fijarSonido(!sonidoActivo());
    pintarSonido();
    sonar('boton', .5);
  }));
  document.querySelectorAll('[data-musica]').forEach(b => b.addEventListener('click', () => {
    fijarMusica(!musicaActiva());
    pintarSonido();
  }));
  // Salir a mitad de partida pide un segundo toque, para no perderla por error.
  $('#btn-salir').addEventListener('click', () => {
    const empezada = estado.inicio && estado.pares < estado.nivel.pares;
    if (empezada && Date.now() - estado.salir > 2500) {
      estado.salir = Date.now();
      avisar(t('salirSeguro'), 2400);
      return;
    }
    clearInterval(estado.reloj);
    pintarNiveles();
  });
  $('#btn-siguiente').addEventListener('click', () => empezar(estado.i + 1));
  $('#btn-otra').addEventListener('click', () => empezar(estado.i));
  $('#btn-a-niveles').addEventListener('click', () => { sonar('boton', .5); pintarNiveles(); });
  addEventListener('resize', acomodar);
  addEventListener('pointerdown', precargar, { once: true });
}

iniciar();
