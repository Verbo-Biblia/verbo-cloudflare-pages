// Héroes de la fe: menú para elegir historia y lector. Cada historia es un JSON por idioma en historias/
// (<id>.es.json, <id>.en.json), escrito por herramientas/crear_historias.py; el lector es js/jugar.js.

import { t, idioma, cambiarIdioma, fijarTextos, traducirPagina } from '../comun/idioma.js';
import { iniciarJugador, jugar } from './jugar.js?v=9cd2360b';

const TEXTOS = {
  es: {
    masJuegos: '← Más juegos',
    sobretitulo: 'Novelas gráficas',
    titulo: 'Héroes de la fe',
    subtitulo: 'Vidas reales que confiaron en Dios',
    como: 'Toca la pantalla (o la barra espaciadora) para avanzar. Cuando aparezca una pregunta, elige qué harías tú: verás lo que de verdad pasó.',
    leer: 'Leer',
    fin: 'Fin', otraVez: '↺ Leer otra vez', otraHistoria: 'Otra historia',
    atras: '◀ Atrás', reiniciar: '↺ Reiniciar', salir: '✕ Salir',
    girar: 'Gira el teléfono para leer más grande',
    cargando: 'Cargando…',
  },
  en: {
    masJuegos: '← More games',
    sobretitulo: 'Graphic novels',
    titulo: 'Heroes of Faith',
    subtitulo: 'Real lives that trusted God',
    como: 'Tap the screen (or press the space bar) to go on. When a question appears, choose what you would do: you will see what really happened.',
    leer: 'Read',
    fin: 'The End', otraVez: '↺ Read again', otraHistoria: 'Another story',
    atras: '◀ Back', reiniciar: '↺ Restart', salir: '✕ Exit',
    girar: 'Turn your phone sideways to read bigger',
    cargando: 'Loading…',
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
];

const $ = s => document.querySelector(s);
fijarTextos(TEXTOS);

function pintarMenu() {
  traducirPagina();
  document.title = `${t('titulo')} · ${t('sobretitulo')} | Verbo`;
  $('#btn-idioma').textContent = idioma() === 'es' ? 'EN' : 'ES';
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
  boton.querySelector('.t-leer').textContent = t('cargando');
  try {
    const historia = await (await fetch(`historias/${h.id}.${idioma()}.json?v=9cd2360b`)).json();
    traducirPagina($('#jugador'));
    document.body.classList.add('leyendo');
    jugar(historia, null, () => { document.body.classList.remove('leyendo'); pintarMenu(); });
  } finally {
    boton.querySelector('.t-leer').textContent = t('leer') + ' ▶';
  }
}

iniciarJugador();
pintarMenu();
$('#btn-idioma').addEventListener('click', () => {
  cambiarIdioma(idioma() === 'es' ? 'en' : 'es');
  pintarMenu();
});
