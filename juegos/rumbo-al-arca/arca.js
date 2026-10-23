// Rumbo al arca: puzle de flechas como AmazeArrow, con 15 niveles. Las flechas finas de colores dibujan la pareja
// de animales del nivel. Se toca una flecha y avanza hacia donde apunta: si el camino hasta el borde está libre, sale
// del tablero; si choca con otra, vuelve y se pierde un corazón (hay 3). Al sacarlas todas, la pareja sube al arca de
// Noé y se ve su pintura. Herramientas: goma (borra una flecha), pista (marca una flecha libre) y zoom.
// Los tableros vienen de niveles.json (herramientas/generar_niveles.mjs: todos tienen solución).

import { t, idioma, cambiarIdioma, fijarTextos, traducirPagina } from './comun/idioma.js';
import { sonar, sonidoActivo, fijarSonido, precargar } from './comun/sonido.js';
import { musica, musicaActiva, fijarMusica, carpetaMusica } from './comun/musica.js';

const TEXTOS = {
  es: {
    sobretitulo: 'Puzle de flechas',
    titulo: 'Rumbo al arca',
    subtitulo: 'Los animales de dos en dos',
    como: 'Toca una flecha y avanzará hacia donde apunta. Si su camino está libre, sale; si choca con otra, pierdes un corazón. Sácalas todas, una por una, y lleva a cada pareja de animales al arca de Noé.',
    jugar: 'Jugar', continuar: 'Continuar · nivel {n}', niveles: 'Niveles',
    progreso: '{n} de 15 parejas en el arca · {e} de 45 estrellas',
    elegirNivel: 'Elige un nivel', nivel: 'Nivel {n}',
    flechas: 'Flechas que quedan',
    volver: 'Volver a los juegos', menu: 'Volver al menú', salir: 'Salir a los niveles',
    sonido: 'Efectos de sonido', musica: 'Música', pista: 'Pista', goma: 'Goma: borra una flecha', zoom: 'Acercar',
    reiniciar: 'Empezar de nuevo', ajustes: 'Ajustes',
    bloqueado: 'Termina el nivel {n} para abrir este',
    sinPistas: 'Ya usaste las pistas de este nivel',
    sinGomas: 'Ya usaste las gomas de este nivel',
    gomaLista: 'Toca la flecha que quieres borrar',
    sinVidas: 'Te quedaste sin corazones',
    sinVidasTexto: 'No pasa nada: mira bien hacia dónde apunta cada flecha y vuelve a intentarlo.',
    reintentar: 'Intentar de nuevo',
    completo: '¡{animal} suben al arca!',
    todo: '¡Todos los animales están en el arca!',
    finTodo: 'Después del diluvio, Dios puso el arcoíris en las nubes como señal de su promesa (Génesis 9:13).',
    resumen: 'Te quedaron {v} de 3 corazones',
    siguiente: 'Siguiente nivel', repetir: 'Repetir',
  },
  en: {
    sobretitulo: 'Arrow puzzle',
    titulo: 'Into the Ark',
    subtitulo: 'The animals two by two',
    como: 'Tap an arrow and it moves where it points. If its way is clear, it leaves; if it bumps into another, you lose a heart. Clear them all, one by one, and bring each pair of animals into Noah’s ark.',
    jugar: 'Play', continuar: 'Continue · level {n}', niveles: 'Levels',
    progreso: '{n} of 15 pairs in the ark · {e} of 45 stars',
    elegirNivel: 'Choose a level', nivel: 'Level {n}',
    flechas: 'Arrows left',
    volver: 'Back to the games', menu: 'Back to the menu', salir: 'Back to the levels',
    sonido: 'Sound effects', musica: 'Music', pista: 'Hint', goma: 'Eraser: removes one arrow', zoom: 'Zoom',
    reiniciar: 'Start over', ajustes: 'Settings',
    bloqueado: 'Finish level {n} to open this one',
    sinPistas: 'You used the hints for this level',
    sinGomas: 'You used the erasers for this level',
    gomaLista: 'Tap the arrow you want to erase',
    sinVidas: 'You ran out of hearts',
    sinVidasTexto: 'That’s all right: look closely at where each arrow points and try again.',
    reintentar: 'Try again',
    completo: '{animal} go into the ark!',
    todo: 'All the animals are in the ark!',
    finTodo: 'After the flood, God set the rainbow in the clouds as the sign of his promise (Genesis 9:13).',
    resumen: 'You kept {v} of 3 hearts',
    siguiente: 'Next level', repetir: 'Play again',
  },
};

// Las 15 parejas, con una frase del relato del arca (Génesis 6-8) para cada una.
const ANIMALES = [
  { es: 'Las ovejas', en: 'The sheep', cita: { es: 'Dios le dijo a Noé que hiciera un arca de madera (Génesis 6:14).', en: 'God told Noah to make an ark of wood (Genesis 6:14).' } },
  { es: 'Los conejos', en: 'The rabbits', cita: { es: 'De cada especie entraría una pareja, macho y hembra (Génesis 6:19).', en: 'Two of every kind would come in, male and female (Genesis 6:19).' } },
  { es: 'Los patos', en: 'The ducks', cita: { es: 'También las aves entrarían, cada una según su especie (Génesis 6:20).', en: 'The birds would come too, each after its kind (Genesis 6:20).' } },
  { es: 'Las cabras', en: 'The goats', cita: { es: 'Noé hizo todo lo que Dios le mandó (Génesis 6:22).', en: 'Noah did everything God commanded him (Genesis 6:22).' } },
  { es: 'Los burros', en: 'The donkeys', cita: { es: 'Noé guardó comida para él y para todos los animales (Génesis 6:21).', en: 'Noah stored food for himself and for all the animals (Genesis 6:21).' } },
  { es: 'Los camellos', en: 'The camels', cita: { es: 'Entraron con Noé al arca de dos en dos (Génesis 7:9).', en: 'They went into the ark with Noah two by two (Genesis 7:9).' } },
  { es: 'Los ciervos', en: 'The deer', cita: { es: 'Noé tenía seiscientos años cuando llegó el diluvio (Génesis 7:6).', en: 'Noah was six hundred years old when the flood came (Genesis 7:6).' } },
  { es: 'Los osos', en: 'The bears', cita: { es: 'Entraron Noé, su esposa, sus hijos y las esposas de sus hijos (Génesis 7:7).', en: 'Noah, his wife, his sons and their wives went in (Genesis 7:7).' } },
  { es: 'Los caballos', en: 'The horses', cita: { es: 'Los animales vinieron a Noé, de dos en dos (Génesis 7:15).', en: 'The animals came to Noah, two by two (Genesis 7:15).' } },
  { es: 'Los leones', en: 'The lions', cita: { es: 'Y el Señor cerró la puerta del arca (Génesis 7:16).', en: 'And the Lord shut the door of the ark (Genesis 7:16).' } },
  { es: 'Las jirafas', en: 'The giraffes', cita: { es: 'Llovió sobre la tierra cuarenta días y cuarenta noches (Génesis 7:12).', en: 'It rained on the earth forty days and forty nights (Genesis 7:12).' } },
  { es: 'Los elefantes', en: 'The elephants', cita: { es: 'El arca flotaba sobre las aguas (Génesis 7:18).', en: 'The ark floated on the waters (Genesis 7:18).' } },
  { es: 'Las tortugas', en: 'The tortoises', cita: { es: 'Dios se acordó de Noé y de todos los animales del arca (Génesis 8:1).', en: 'God remembered Noah and all the animals in the ark (Genesis 8:1).' } },
  { es: 'Los búhos', en: 'The owls', cita: { es: 'El arca se detuvo sobre los montes de Ararat (Génesis 8:4).', en: 'The ark came to rest on the mountains of Ararat (Genesis 8:4).' } },
  { es: 'Las palomas', en: 'The doves', cita: { es: 'La paloma volvió con una hoja de olivo en el pico (Génesis 8:11).', en: 'The dove came back with an olive leaf in its beak (Genesis 8:11).' } },
];
const DIRS = [[-1, 0], [0, 1], [1, 0], [0, -1]];
const CLAVE_AVANCE = 'mini:arca:avance';
const VIDAS = 3, PISTAS = 3, GOMAS = 2;
const VELOCIDAD = 22; // casillas por segundo

const $ = s => document.querySelector(s);
const SVG = 'http://www.w3.org/2000/svg';
let niveles = null;
let estado = null;

fijarTextos(TEXTOS);
carpetaMusica('musica/'); // música propia, hecha con el Compositor

// ---------- utilidades ----------

const imagen = i => `animales/animal_${String(i + 1).padStart(2, '0')}.webp`;
const nombreAnimal = i => ANIMALES[i][idioma()] || ANIMALES[i].es;

function leerAvance() {
  try { return JSON.parse(localStorage.getItem(CLAVE_AVANCE)) || {}; } catch { return {}; }
}
function guardarAvance(i, estrellas) {
  const av = leerAvance();
  av[i] = { estrellas: Math.max(estrellas, av[i]?.estrellas || 0) };
  try { localStorage.setItem(CLAVE_AVANCE, JSON.stringify(av)); } catch { /* sin almacenamiento */ }
}
const abierto = (i, av = leerAvance()) => i === 0 || !!av[i - 1];
function nivelActual(av = leerAvance()) {
  for (let i = 0; i < ANIMALES.length; i++) if (!av[i]) return i;
  return ANIMALES.length - 1;
}

const MUSICA = { inicio: 'menu', niveles: 'menu', partida: 'partida' };
function mostrar(id) {
  document.querySelectorAll('.pantalla').forEach(p => p.classList.toggle('activa', p.id === id));
  document.body.dataset.pantalla = id;
  window.scrollTo(0, 0);
  if (id === 'final') musica('final', false);
  else musica(MUSICA[id]);
}

function pintarSonido() {
  document.querySelectorAll('[data-sonido]').forEach(b => { b.textContent = sonidoActivo() ? '🔊' : '🔇'; });
  document.querySelectorAll('[data-musica]').forEach(b => { b.classList.toggle('apagado', !musicaActiva()); });
}

let avisoTimer = 0;
function avisar(texto, ms = 2400) {
  const aviso = $('#aviso');
  aviso.textContent = texto;
  aviso.classList.add('visible');
  clearTimeout(avisoTimer);
  avisoTimer = setTimeout(() => aviso.classList.remove('visible'), ms);
}

// ---------- dibujo de flechas ----------

// Puntos de la vía de una flecha: centros del cuerpo y, desde la punta, derecho hasta bien afuera del tablero.
function via(f, n) {
  const dir = DIRS[f.d];
  const [hr, hc] = f.c[f.c.length - 1];
  const v = f.c.map(([r, c]) => [c + .5, r + .5]);
  for (let s = 1; s <= n + f.c.length + 2; s++) v.push([hc + .5 + dir[1] * s, hr + .5 + dir[0] * s]);
  return v;
}

// Puntos cuando la flecha avanzó «s» casillas por su vía.
function puntosEn(v, largo, s) {
  const pt = k => {
    const i = Math.min(Math.floor(k), v.length - 2), u = k - i;
    return [v[i][0] + (v[i + 1][0] - v[i][0]) * u, v[i][1] + (v[i + 1][1] - v[i][1]) * u];
  };
  const hasta = s + largo - 1;
  const out = [pt(s)];
  for (let k = Math.floor(s) + 1; k < hasta; k++) out.push(v[k]);
  out.push(pt(hasta));
  return out;
}

function forma(puntos, dir) {
  // Una flecha de una sola casilla: un trazo corto que termina en la punta.
  if (puntos.length === 2 && puntos[0][0] === puntos[1][0] && puntos[0][1] === puntos[1][1]) {
    const [x, y] = puntos[0];
    puntos = [[x - dir[1] * .32, y - dir[0] * .32], [x + dir[1] * .05, y + dir[0] * .05]];
  }
  const cuerpo = 'M' + puntos.map(p => `${p[0].toFixed(3)} ${p[1].toFixed(3)}`).join('L');
  const [x, y] = puntos[puntos.length - 1];
  const [dy, dx] = dir;
  const px = x + dx * .36, py = y + dy * .36, a = .25;
  const punta = `M${(px).toFixed(3)} ${(py).toFixed(3)}L${(x - dy * a).toFixed(3)} ${(y + dx * a).toFixed(3)}L${(x + dy * a).toFixed(3)} ${(y - dx * a).toFixed(3)}Z`;
  return { cuerpo, punta };
}

function nuevaFlecha(puntos, dir, color) {
  const g = document.createElementNS(SVG, 'g');
  g.classList.add('flecha');
  g.style.setProperty('--color', color);
  g.innerHTML = '<path class="f-cuerpo"/><path class="f-punta"/>';
  ponerForma(g, puntos, dir);
  return g;
}
function ponerForma(g, puntos, dir) {
  const { cuerpo, punta } = forma(puntos, dir);
  g.children[0].setAttribute('d', cuerpo);
  g.children[1].setAttribute('d', punta);
}

// Recuadro del dibujo (las casillas con flecha), con un margen para las puntas: así la figura llena la pantalla.
function recuadro(d) {
  let r0 = d.lado, c0 = d.lado, r1 = 0, c1 = 0;
  for (const f of d.flechas) for (const [r, c] of f.c) { r0 = Math.min(r0, r); c0 = Math.min(c0, c); r1 = Math.max(r1, r); c1 = Math.max(c1, c); }
  const alto = r1 - r0 + 1, ancho = c1 - c0 + 1, lado = Math.max(alto, ancho) + 1.4;
  return { x: c0 - (lado - ancho) / 2, y: r0 - (lado - alto) / 2, lado };
}

// Dibujo completo (en miniatura) de un nivel: para el menú y las fichas de niveles.
function miniatura(i) {
  const d = niveles[i], n = d.lado;
  const svg = document.createElementNS(SVG, 'svg');
  const v = recuadro(d);
  svg.setAttribute('viewBox', `${v.x} ${v.y} ${v.lado} ${v.lado}`);
  svg.classList.add('mini-tablero');
  for (const f of d.flechas) svg.append(nuevaFlecha(puntosEn(via(f, n), f.c.length, 0), DIRS[f.d], d.colores[f.z]));
  return svg;
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
  if (!$('#muestra').children.length) $('#muestra').append(miniatura(9));
  pintarSonido();
}

// ---------- niveles ----------

function pintarNiveles() {
  traducirPagina($('#niveles'));
  const av = leerAvance();
  const total = Object.values(av).reduce((s, x) => s + x.estrellas, 0);
  $('#estrellas-total').textContent = `★ ${total}/45`;
  const rejilla = $('#rejilla');
  rejilla.innerHTML = '';
  ANIMALES.forEach((a, i) => {
    const libre = abierto(i, av);
    const hecho = av[i];
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `nivel-ficha ${libre ? '' : 'cerrado'} ${hecho ? 'hecho' : ''}`;
    b.dataset.i = i;
    if (!libre) { b.setAttribute('aria-disabled', 'true'); b.title = t('bloqueado', { n: i }); }
    const est = hecho ? [1, 2, 3].map(k => `<i class="${k <= hecho.estrellas ? 'llena' : ''}">★</i>`).join('') : '';
    b.innerHTML = `${hecho ? `<img src="${imagen(i)}" alt="" loading="lazy">` : ''}
      <span class="ficha-num">${i + 1}</span>
      ${libre ? '' : '<span class="candado" aria-hidden="true">🔒</span>'}
      <span class="ficha-texto"><b>${hecho ? nombreAnimal(i) : t('nivel', { n: i + 1 })}</b>
        <small>${niveles[i].flechas.length} ${idioma() === 'es' ? 'flechas' : 'arrows'}</small>
        <span class="ficha-estrellas">${est}</span></span>`;
    if (!hecho) b.prepend(miniatura(i));
    rejilla.append(b);
  });
  mostrar('niveles');
  const actual = $(`#rejilla [data-i="${nivelActual(av)}"]`);
  actual?.classList.add('actual');
  actual?.scrollIntoView({ block: 'center' });
}

// ---------- partida ----------

function empezar(i) {
  const datos = niveles[i];
  const n = datos.lado;
  const ocupado = Array.from({ length: n }, () => Array(n).fill(-1));
  const flechas = datos.flechas.map((f, k) => {
    f.c.forEach(([r, c]) => { ocupado[r][c] = k; });
    return { k, celdas: f.c, dir: DIRS[f.d], via: via(f, n), color: datos.colores[f.z], fuera: false };
  });
  estado = { i, n, flechas, ocupado, quedan: flechas.length, vidas: VIDAS, pistas: PISTAS, gomas: GOMAS,
    modoGoma: false, terminado: false };

  const svg = $('#tablero');
  const v = recuadro(datos);
  estado.vista = v;
  svg.setAttribute('viewBox', `${v.x} ${v.y} ${v.lado} ${v.lado}`);
  svg.innerHTML = '<g id="capa-flechas"></g>';
  const capa = $('#capa-flechas');
  for (const f of flechas) {
    f.g = nuevaFlecha(puntosEn(f.via, f.celdas.length, 0), f.dir, f.color);
    capa.append(f.g);
  }
  $('#sin-vidas').hidden = true;
  $('#ajustes').hidden = true;
  $('#zoom').value = 1;
  traducirPagina($('#partida'));
  $('#m-nivel').textContent = t('nivel', { n: i + 1 });
  actualizarMarcador();
  mostrar('partida');
  acomodar();
  sonar('boton', .5);
}

function actualizarMarcador() {
  const e = estado;
  $('#m-flechas').textContent = e.quedan;
  $('#barra').style.width = `${(1 - e.quedan / e.flechas.length) * 100}%`;
  $('#corazones').innerHTML = [0, 1, 2].map(k => `<span class="${k < e.vidas ? '' : 'perdido'}">♥</span>`).join('');
  $('#m-pistas').textContent = e.pistas;
  $('#m-gomas').textContent = e.gomas;
  $('#btn-pista').classList.toggle('gastado', !e.pistas);
  $('#btn-goma').classList.toggle('gastado', !e.gomas);
  $('#btn-goma').classList.toggle('activo', e.modoGoma);
}

// Primer obstáculo en la línea de la punta: casillas que puede avanzar antes de chocar (o null si sale).
function obstaculo(f) {
  const { n, ocupado } = estado;
  const [r, c] = f.celdas[f.celdas.length - 1];
  for (let s = 1; ; s++) {
    const rr = r + f.dir[0] * s, cc = c + f.dir[1] * s;
    if (rr < 0 || cc < 0 || rr >= n || cc >= n) return null;
    const otra = ocupado[rr][cc];
    if (otra !== -1 && otra !== f.k) return { pasos: s - 1, otra };
  }
}

// La flecha bajo el dedo: la casilla tocada o, si está vacía, la vecina ocupada más cercana.
function flechaEn(x, y) {
  const { n, ocupado } = estado;
  let mejor = null, dist = .85;
  for (let r = Math.floor(y) - 1; r <= Math.floor(y) + 1; r++) for (let c = Math.floor(x) - 1; c <= Math.floor(x) + 1; c++) {
    if (r < 0 || c < 0 || r >= n || c >= n || ocupado[r][c] === -1) continue;
    const d = Math.hypot(c + .5 - x, r + .5 - y);
    if (d < dist) { dist = d; mejor = ocupado[r][c]; }
  }
  return mejor === null ? null : estado.flechas[mejor];
}

function tocar(x, y) {
  if (!estado || estado.terminado) return;
  $('#ajustes').hidden = true;
  const f = flechaEn(x, y);
  if (!f || f.fuera || f.moviendo) return;
  quitarPista();
  if (estado.modoGoma) return borrar(f);
  const choque = obstaculo(f);
  if (choque) chocar(f, choque);
  else salir(f);
}

function liberar(f) {
  f.fuera = true;
  for (const [r, c] of f.celdas) estado.ocupado[r][c] = -1;
  estado.quedan--;
  actualizarMarcador();
  if (!estado.quedan) setTimeout(ganar, 450);
}

function salir(f) {
  liberar(f);
  sonar('voltear', .5);
  const total = f.via.length - f.celdas.length;
  animar(f, [[0, total]], () => f.g.remove());
}

function borrar(f) {
  estado.gomas--;
  estado.modoGoma = false;
  liberar(f);
  sonar('fallo', .25);
  f.g.classList.add('borrada');
  setTimeout(() => f.g.remove(), 450);
}

function chocar(f, { pasos, otra }) {
  const tope = pasos + .3;
  animar(f, [[0, tope], [tope, 0]], () => {});
  setTimeout(() => {
    sonar('fallo', .4);
    for (const g of [f.g, estado.flechas[otra].g]) { g.classList.remove('golpe'); void g.getBBox(); g.classList.add('golpe'); }
    estado.vidas--;
    actualizarMarcador();
    const c = $('#corazones').children[estado.vidas];
    c?.classList.add('cae');
    if (!estado.vidas) {
      estado.terminado = true;
      setTimeout(() => { traducirPagina($('#sin-vidas')); $('#sin-vidas').hidden = false; }, 700);
    }
  }, (tope / VELOCIDAD) * 1000);
}

// Mueve una flecha por su vía en tramos [desde, hasta] (en casillas).
function animar(f, tramos, alTerminar) {
  f.moviendo = true;
  const [a, b] = tramos.shift();
  const dur = Math.max(110, Math.abs(b - a) / VELOCIDAD * 1000);
  const t0 = performance.now();
  const largo = f.celdas.length;
  const paso = ahora => {
    const u = Math.min(1, (ahora - t0) / dur);
    const e = b > a ? u * u : 1 - (1 - u) * (1 - u);
    ponerForma(f.g, puntosEn(f.via, largo, a + (b - a) * e), f.dir);
    if (u < 1) return requestAnimationFrame(paso);
    if (tramos.length) return animar(f, tramos, alTerminar);
    f.moviendo = false;
    alTerminar();
  };
  requestAnimationFrame(paso);
}

function pista() {
  if (!estado || estado.terminado) return;
  if (!estado.pistas) return avisar(t('sinPistas'));
  // La flecha libre más «al fondo»: la que más ayuda a destrabar.
  const libres = estado.flechas.filter(f => !f.fuera && !f.moviendo && !obstaculo(f));
  if (!libres.length) return;
  quitarPista();
  estado.pistas--;
  actualizarMarcador();
  const f = libres[Math.floor(Math.random() * libres.length)];
  f.g.classList.add('pista');
  centrarEn(f);
  sonar('boton', .5);
}
function quitarPista() { document.querySelectorAll('.flecha.pista').forEach(g => g.classList.remove('pista')); }

function goma() {
  if (!estado || estado.terminado) return;
  if (!estado.gomas) return avisar(t('sinGomas'));
  estado.modoGoma = !estado.modoGoma;
  actualizarMarcador();
  if (estado.modoGoma) avisar(t('gomaLista'));
  sonar('boton', .5);
}

function ganar() {
  if (estado.terminado) return;
  estado.terminado = true;
  const { i, vidas } = estado;
  guardarAvance(i, vidas);
  sonar('par', .6);
  const ultimo = i === ANIMALES.length - 1;
  traducirPagina($('#final'));
  $('#f-nivel').textContent = t('nivel', { n: i + 1 });
  $('#f-titulo').textContent = ultimo ? t('todo') : t('completo', { animal: nombreAnimal(i) });
  $('#f-animal').src = imagen(i);
  $('#f-cita').textContent = ANIMALES[i].cita[idioma()] + (ultimo ? ' ' + t('finTodo') : '');
  $('#estrellas').innerHTML = [1, 2, 3].map(k => `<span class="${k <= vidas ? 'llena' : ''}" style="--k:${k}">★</span>`).join('');
  $('#resumen').textContent = t('resumen', { v: vidas });
  $('#btn-siguiente').hidden = ultimo;
  mostrar('final');
  sonar(ultimo ? 'premio' : 'victoria', .6);
}

// ---------- tamaño, zoom y toque ----------

// Tablero cuadrado, lo más grande posible dentro de su zona; el zoom lo agranda y la zona se desplaza.
function acomodar() {
  if (!estado || !$('#partida').classList.contains('activa')) return;
  const zona = $('#zona');
  const base = Math.floor(Math.min(zona.clientWidth, zona.clientHeight) - 8);
  const lado = Math.round(base * Number($('#zoom').value));
  const svg = $('#tablero');
  svg.style.width = svg.style.height = `${lado}px`;
}

function zoom() {
  const zona = $('#zona');
  const cx = (zona.scrollLeft + zona.clientWidth / 2) / zona.scrollWidth;
  const cy = (zona.scrollTop + zona.clientHeight / 2) / zona.scrollHeight;
  acomodar();
  zona.scrollLeft = cx * zona.scrollWidth - zona.clientWidth / 2;
  zona.scrollTop = cy * zona.scrollHeight - zona.clientHeight / 2;
}

function centrarEn(f) {
  if (Number($('#zoom').value) <= 1.02) return;
  const zona = $('#zona');
  const [r, c] = f.celdas[f.celdas.length - 1];
  const v = estado.vista, k = $('#tablero').clientWidth / v.lado;
  zona.scrollTo({ left: (c + .5 - v.x) * k - zona.clientWidth / 2, top: (r + .5 - v.y) * k - zona.clientHeight / 2, behavior: 'smooth' });
}

function puntoDe(evento) {
  const svg = $('#tablero');
  const p = svg.createSVGPoint();
  p.x = evento.clientX; p.y = evento.clientY;
  const q = p.matrixTransform(svg.getScreenCTM().inverse());
  return [q.x, q.y];
}

// Toque corto = jugar; si el dedo se mueve, es para desplazar el tablero con zoom.
let toque = null;
function alBajar(e) { toque = { x: e.clientX, y: e.clientY, t: Date.now() }; }
function alSubir(e) {
  if (!toque) return;
  const movido = Math.hypot(e.clientX - toque.x, e.clientY - toque.y);
  toque = null;
  if (movido > 12) return;
  const [x, y] = puntoDe(e);
  tocar(x, y);
}

// ---------- arranque ----------

async function iniciar() {
  niveles = await (await fetch('niveles.json')).json();
  pintarInicio();
  mostrar('inicio');

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
  const svg = $('#tablero');
  svg.addEventListener('pointerdown', alBajar);
  svg.addEventListener('pointerup', alSubir);
  svg.addEventListener('pointercancel', () => { toque = null; });
  $('#btn-pista').addEventListener('click', pista);
  $('#btn-goma').addEventListener('click', goma);
  $('#zoom').addEventListener('input', zoom);
  $('#btn-reiniciar').addEventListener('click', () => empezar(estado.i));
  $('#btn-ajustes').addEventListener('click', () => { $('#ajustes').hidden = !$('#ajustes').hidden; sonar('boton', .4); });
  $('#btn-salir').addEventListener('click', () => { estado.terminado = true; pintarNiveles(); });
  $('#btn-reintentar').addEventListener('click', () => empezar(estado.i));
  $('#btn-velo-niveles').addEventListener('click', () => pintarNiveles());
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
  $('#btn-siguiente').addEventListener('click', () => empezar(estado.i + 1));
  $('#btn-otra').addEventListener('click', () => empezar(estado.i));
  $('#btn-a-niveles').addEventListener('click', () => { sonar('boton', .5); pintarNiveles(); });
  addEventListener('resize', acomodar);
  addEventListener('pointerdown', precargar, { once: true });
}

iniciar();
