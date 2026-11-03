// Héroes de la fe: menú para elegir historia y lector. Cada historia es un JSON por idioma en historias/
// (<id>.es.json, <id>.en.json), escrito por herramientas/crear_historias.py; el lector es js/jugar.js.

import { t, idioma, cambiarIdioma, fijarTextos, traducirPagina } from '../comun/idioma.js';
import { sonar, sonidoActivo, fijarSonido, precargar } from '../comun/sonido.js';
import { musica, musicaActiva, fijarMusica, carpetaMusica } from '../comun/musica.js';
import { iniciarJugador, jugar, alPasar } from './jugar.js?v=dbc2e41f';

const TEXTOS = {
  es: {
    masJuegos: '← Más juegos',
    sobretitulo: 'Historias interactivas',
    titulo: 'Héroes de la fe',
    subtitulo: 'Vidas reales que confiaron en Dios',
    como: 'Toca la pantalla para avanzar. Cuando aparezca una pregunta, elige qué harías tú: verás lo que de verdad pasó.',
    comoPc: 'Haz clic en la pantalla (o usa la barra espaciadora) para avanzar. Cuando aparezca una pregunta, elige qué harías tú: verás lo que de verdad pasó.',
    leer: 'Leer',
    fin: 'Fin', otraVez: '↺ Leer otra vez', otraHistoria: 'Otra historia',
    atras: '◀ Atrás', reiniciar: '↺ Reiniciar', salir: '✕ Salir',
    girar: 'Gira el teléfono para leer más grande',
    cargando: 'Cargando…',
    musica: 'Música', sonido: 'Efectos de sonido',
  },
  en: {
    masJuegos: '← More games',
    sobretitulo: 'Interactive stories',
    titulo: 'Heroes of Faith',
    subtitulo: 'Real lives that trusted God',
    como: 'Tap the screen to go on. When a question appears, choose what you would do: you will see what really happened.',
    comoPc: 'Click the screen (or press the space bar) to go on. When a question appears, choose what you would do: you will see what really happened.',
    leer: 'Read',
    fin: 'The End', otraVez: '↺ Read again', otraHistoria: 'Another story',
    atras: '◀ Back', reiniciar: '↺ Restart', salir: '✕ Exit',
    girar: 'Turn your phone sideways to read bigger',
    cargando: 'Loading…',
    musica: 'Music', sonido: 'Sound effects',
  },
};

// Las historias del menú (se agregan más aquí y en crear_historias.py).
const HISTORIAS = [
  { id: 'muller', portada: 'img/portada_muller.webp',
    es: { nombre: 'George Müller', lema: 'El padre de los huérfanos', anos: '1805-1898 · Inglaterra' },
    en: { nombre: 'George Müller', lema: 'Father to the orphans', anos: '1805-1898 · England' } },
  { id: 'carmichael', portada: 'img/portada_carmichael.webp',
    es: { nombre: 'Amy Carmichael', lema: 'Amma, la madre de Dohnavur', anos: '1867-1951 · India' },
    en: { nombre: 'Amy Carmichael', lema: 'Amma, the mother of Dohnavur', anos: '1867-1951 · India' } },
  { id: 'graham', portada: 'img/portada_graham.webp',
    es: { nombre: 'Billy Graham', lema: 'El predicador del mundo', anos: '1918-2018 · Estados Unidos' },
    en: { nombre: 'Billy Graham', lema: 'Preacher to the world', anos: '1918-2018 · United States' } },
  { id: 'cruz', portada: 'img/portada_cruz.webp',
    es: { nombre: 'Nicky Cruz', lema: 'De la pandilla a Jesús', anos: 'Desde 1938 · Puerto Rico y Nueva York' },
    en: { nombre: 'Nicky Cruz', lema: 'From the gang to Jesus', anos: 'Since 1938 · Puerto Rico and New York' } },
];

const $ = s => document.querySelector(s);
fijarTextos(TEXTOS);
// En el teléfono las instrucciones hablan solo de tocar; la barra espaciadora, solo en computadora.
if (!matchMedia('(pointer: coarse)').matches) $('.como').dataset.t = 'comoPc';
carpetaMusica('musica/');   // compuesta para este juego (herramientas/componer_musica.mjs)

// Voz del narrador: solo en las líneas que la traen (prólogo y epílogo de los libros largos); se calla al pasar.
let voz = null;
function callarVoz() { if (voz) { voz.pause(); voz = null; } }
function narrar(src) {
  callarVoz();
  if (!sonidoActivo()) return;
  voz = new Audio(src);
  voz.play().catch(() => {});
}

// Lo que suena mientras se lee: hoja que pasa al cambiar de escena, un acorde al acertar, el cierre al final.
// Cada capítulo terminado se avisa al panel de Verbo (VerboModoJuego.etapa), para saber hasta dónde se lee.
let leyendo = null;
alPasar((que, x, n, total) => {
  if (que === 'linea') { callarVoz(); if (x.voz) narrar(x.voz); return; }
  if (que === 'escena') { sonar('voltear', 0.35); callarVoz(); if (n > 1) window.VerboModoJuego?.etapa?.(n - 1, total); }
  else if (que === 'acierto') sonar('par', 0.4);
  else if (que === 'repite') sonar('boton', 0.35);
  else if (que === 'fin') { musica('final', false); sonar('premio', 0.45); const s = HISTORIAS.find(h => h.id === leyendo); if (s) window.VerboModoJuego?.etapa?.(s.capitulos || 1, s.capitulos || 1); }
  else if (que === 'salir') {
    callarVoz();
    // Un libro abierto desde su página de /historias/ vuelve a esa página.
    if (directo?.pagina) { location.href = directo.pagina; return; }
    leyendo = null; window.VerboAds?.pausa('heroes-volver-al-menu', 'browse');
  }
});

function pintarSonido() {
  document.querySelectorAll('[data-sonido]').forEach(b => { b.textContent = sonidoActivo() ? '🔊' : '🔇'; });
  document.querySelectorAll('[data-musica]').forEach(b => { b.classList.toggle('apagado', !musicaActiva()); });
}

function pintarMenu() {
  traducirPagina();
  document.title = `${t('titulo')} · ${t('sobretitulo')} | Verbo`;
  $('#btn-idioma').textContent = idioma() === 'es' ? 'EN' : 'ES';
  pintarSonido();
  musica('menu');
  const lista = $('#historias');
  lista.innerHTML = '';
  for (const h of HISTORIAS) {
    const d = h[idioma()] || h.es;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tarjeta';
    b.innerHTML = `<img src="${h.portada}" alt="" loading="lazy"><span class="t-texto"><b></b><small class="lema"></small>
      <small class="anos"></small><span class="t-leer"></span></span>`;
    b.querySelector('b').textContent = d.nombre;
    b.querySelector('.lema').textContent = d.lema;
    b.querySelector('.anos').textContent = d.anos;
    b.querySelector('.t-leer').textContent = t('leer') + ' ▶';
    b.addEventListener('click', () => abrir(h, b));
    lista.append(b);
  }
}

async function abrir(h, boton) {
  if (boton) boton.querySelector('.t-leer').textContent = t('cargando');
  try {
    const historia = await (await fetch(`historias/${h.id}.${idioma()}.json?v=dbc2e41f`)).json();
    traducirPagina($('#jugador'));
    document.body.classList.add('leyendo');
    leyendo = h.id;
    musica(`lectura_${h.id}`);
    sonar('boton', 0.5);
    h.capitulos = historia.escenas.length;
    jugar(historia, null, () => { document.body.classList.remove('leyendo'); pintarMenu(); });
  } finally {
    if (boton) boton.querySelector('.t-leer').textContent = t('leer') + ' ▶';
  }
}

// Abrir un libro directo (…/jugar/?libro=muller), como hace el botón «Leer» de su página en /historias/.
const pedido = new URLSearchParams(location.search);
const directo = HISTORIAS.find(h => h.id === pedido.get('libro')) || null;
// Al salir vuelve a la página desde la que se abrió (?volver=/historias/<slug>/; solo rutas del propio sitio).
if (directo && /^\/(?!\/)[a-z0-9\-\/]*$/.test(pedido.get('volver') || '')) directo.pagina = pedido.get('volver');

iniciarJugador();
pintarMenu();
if (directo) abrir(directo, null);
addEventListener('pointerdown', precargar, { once: true });
document.querySelectorAll('[data-sonido]').forEach(b => b.addEventListener('click', ev => {
  ev.stopPropagation();
  fijarSonido(!sonidoActivo()); pintarSonido(); sonar('boton', 0.5);
}));
document.querySelectorAll('[data-musica]').forEach(b => b.addEventListener('click', ev => {
  ev.stopPropagation();
  fijarMusica(!musicaActiva()); pintarSonido();
}));
// «Leer otra vez» vuelve a poner el tema de la historia (el del final suena una sola vez).
document.querySelectorAll('#jugador [data-j="reiniciar"]').forEach(b => b.addEventListener('click', () => { if (leyendo) musica(`lectura_${leyendo}`); }));
$('#btn-idioma').addEventListener('click', () => {
  cambiarIdioma(idioma() === 'es' ? 'en' : 'es');
  pintarMenu();
});
