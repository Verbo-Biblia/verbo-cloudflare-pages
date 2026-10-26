// «Toca y aprende»: botones grandes que suenan, brillan y hablan, para bebés y niños pequeños.
// Secciones: números, letras, frutas, colores, formas, cosas de bebé, música (con el xilófono de colores),
// Dios y yo, y dos juegos libres (burbujas y globos). Cada sección de aprender trae su juego «¿Dónde está…?».
import { idioma, cambiarIdioma } from './comun/idioma.js';
import { FRUTAS, BEBE, MUSICA, DIOS, COLORES, FORMAS, NUMEROS, LETRAS, SECCIONES } from './datos.js';
import { cosa, claveLetra } from './voces.js';
import * as A from './audio.js';

const $ = (s) => document.querySelector(s);
const pantalla = $('#pantalla');
const azar = (l) => l[Math.floor(Math.random() * l.length)];
const barajar = (l) => { const c = [...l]; for (let i = c.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [c[i], c[j]] = [c[j], c[i]]; } return c; };
const nom = (x) => x[idioma()] ?? x.es;

const UI = {
  es: { titulo: 'Toca y aprende', empezar: '¡Toca para empezar!', masJuegos: '← Más juegos', jugar: '¡A jugar!',
    conmigo: '⭐ Toca conmigo', otra: 'Otra vez', volver: 'Volver', lograste: '¡Lo lograste!', cuantos: '¿Cuántos hay?',
    xilo: 'Xilófono de colores', cancion: '¡Tocaste la canción!' },
  en: { titulo: 'Tap and Learn', empezar: 'Tap to start!', masJuegos: '← More games', jugar: 'Let’s play!',
    conmigo: '⭐ Play with me', otra: 'Again', volver: 'Back', lograste: 'You did it!', cuantos: 'How many are there?',
    xilo: 'Rainbow xylophone', cancion: 'You played the song!' },
};
const ui = (k) => UI[idioma()][k];
const PASTEL = ['#ffd6d6', '#ffe7c2', '#fff4b8', '#d9f5c9', '#c9ecf5', '#d6dcff', '#ecd6ff', '#ffd6ee'];
const ARCOIRIS = ['#e8443a', '#ff8f2e', '#ffd23a', '#45b84a', '#33c3d6', '#3a7be8', '#8e4fd1', '#ff7eb6'];

// ---------------------------------------------------------------- dibujos
const img = (id, emoji = '⭐') => `<img class="fig" src="img/${id}.webp" alt="" draggable="false" data-emoji="${emoji}">`;
// imagen que falta (Codex aún no la entrega): el emoji de reserva
addEventListener('error', (e) => {
  const el = e.target;
  if (el.tagName === 'IMG' && el.classList.contains('fig')) {
    const s = document.createElement('span'); s.className = 'fig emoji'; s.textContent = el.dataset.emoji; el.replaceWith(s);
  }
}, true);
const cara = (cx, cy, s = 1, ojo = '#2b2b33') => `
  <circle cx="${cx - 14 * s}" cy="${cy}" r="${5 * s}" fill="${ojo}"/><circle cx="${cx + 14 * s}" cy="${cy}" r="${5 * s}" fill="${ojo}"/>
  <circle cx="${cx - 12.5 * s}" cy="${cy - 1.8 * s}" r="${1.6 * s}" fill="#fff"/><circle cx="${cx + 15.5 * s}" cy="${cy - 1.8 * s}" r="${1.6 * s}" fill="#fff"/>
  <path d="M${cx - 10 * s} ${cy + 11 * s} Q${cx} ${cy + 21 * s} ${cx + 10 * s} ${cy + 11 * s}" stroke="${ojo}" stroke-width="${3.2 * s}" fill="none" stroke-linecap="round"/>
  <circle cx="${cx - 24 * s}" cy="${cy + 10 * s}" r="${5 * s}" fill="#ff8fa3" opacity=".45"/><circle cx="${cx + 24 * s}" cy="${cy + 10 * s}" r="${5 * s}" fill="#ff8fa3" opacity=".45"/>`;
function mancha(hex) {   // mancha de pintura con carita
  const borde = hex === '#ffffff' ? '#c9c9d4' : '#0002', ojo = hex === '#2b2b33' ? '#fff' : '#2b2b33';
  return `<svg class="fig" viewBox="0 0 200 200"><path d="M100 18c26 0 34 16 52 22s34 22 30 50-2 34-12 52-30 38-62 38-46-12-62-30-30-34-26-60 14-40 34-52 20-20 46-20z"
    fill="${hex}" stroke="${borde}" stroke-width="5"/><circle cx="160" cy="160" r="12" fill="${hex}" stroke="${borde}" stroke-width="4"/>
    <circle cx="36" cy="40" r="8" fill="${hex}" stroke="${borde}" stroke-width="3"/>${cara(100, 92, 1.3, ojo)}</svg>`;
}
const FORMA_D = {
  circulo: '<circle cx="100" cy="100" r="78"/>',
  cuadrado: '<rect x="28" y="28" width="144" height="144" rx="16"/>',
  triangulo: '<path d="M100 22 182 170H18z" stroke-linejoin="round"/>',
  estrella: '<path d="M100 14l24 54 58 5-44 39 13 57-51-30-51 30 13-57-44-39 58-5z" stroke-linejoin="round"/>',
  corazon: '<path d="M100 178C40 136 14 104 18 70c4-30 40-48 66-28 8 6 12 12 16 18 4-6 8-12 16-18 26-20 62-2 66 28 4 34-22 66-82 108z"/>',
  rectangulo: '<rect x="14" y="52" width="172" height="104" rx="14"/>',
  ovalo: '<ellipse cx="100" cy="100" rx="86" ry="60"/>',
  rombo: '<path d="M100 14 178 100 100 186 22 100z" stroke-linejoin="round"/>',
};
const CARA_Y = { triangulo: 122, estrella: 104, corazon: 92 };
const forma = (f) => `<svg class="fig" viewBox="0 0 200 200"><g fill="${f.hex}" stroke="#0003" stroke-width="6">${FORMA_D[f.id]}</g>${cara(100, CARA_Y[f.id] ?? 96, f.id === 'triangulo' ? 0.9 : 1.1)}</svg>`;
const digito = (n) => `<span class="digito" style="--c:${ARCOIRIS[(n - 1) % 8]}">${n}</span>`;
const letra = (L) => `<span class="letra-grande" style="--c:${ARCOIRIS['AEIOUBCDFGHJKLMNÑPQRSTVWXYZ'.indexOf(L) % 8]}">${L}<small>${L.toLowerCase()}</small></span>`;

// ---------------------------------------------------------------- contenido de cada sección
function items(sec) {
  const lang = idioma();
  if (sec === 'numeros') return NUMEROS.map((_, i) => ({ id: String(i + 1), dibujo: digito(i + 1), nombre: '', voz: `num_${i + 1}`, n: i + 1 }));
  if (sec === 'letras') return LETRAS[lang].map(([L, id]) => {
    const c = cosa(id);
    return { id: claveLetra(L), L, cosa: id, dibujo: `<span class="letra-boton">${L}</span>${img(id, c.emoji).replace('class="fig"', 'class="fig mini"')}`, nombre: '', voz: `letrasola_${claveLetra(L)}` };
  });
  if (sec === 'colores') return COLORES.map((c) => ({ ...c, dibujo: mancha(c.hex), nombre: nom(c), voz: `colores_${c.id}` }));
  if (sec === 'formas') return FORMAS.map((f) => ({ ...f, dibujo: forma(f), nombre: nom(f), voz: `formas_${f.id}` }));
  const lista = { frutas: FRUTAS, bebe: BEBE, musica: MUSICA, dios: DIOS }[sec];
  return lista.map((x) => ({ ...x, dibujo: img(x.id, x.emoji), nombre: nom(x), voz: `${sec}_${x.id}` }));
}

// ---------------------------------------------------------------- efectos visuales
function chispas(x, y, n = 12, colores = ARCOIRIS) {
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span'), ang = (Math.PI * 2 * i) / n + Math.random() * 0.4, d = 70 + Math.random() * 90;
    s.className = 'chispa'; s.textContent = azar(['★', '✦', '●', '♪']);
    s.style.cssText = `left:${x}px;top:${y}px;color:${azar(colores)};--dx:${Math.cos(ang) * d}px;--dy:${Math.sin(ang) * d}px;font-size:${16 + Math.random() * 18}px`;
    document.body.append(s);
    setTimeout(() => s.remove(), 900);
  }
}
function confeti(n = 70) {
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span');
    s.className = 'confeti';
    s.style.cssText = `left:${Math.random() * 100}vw;background:${azar(ARCOIRIS)};--giro:${Math.random() * 720 - 360}deg;--x:${Math.random() * 120 - 60}px;animation-delay:${Math.random() * 0.5}s;animation-duration:${1.8 + Math.random() * 1.4}s`;
    document.body.append(s);
    setTimeout(() => s.remove(), 4000);
  }
}
const centro = (el) => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
function brillar(el, k) {
  el.classList.remove('salta'); void el.offsetWidth; el.classList.add('salta');
  A.efecto('tin', k);
  chispas(...centro(el), 10);
}

// ---------------------------------------------------------------- barra superior
let atras = null;   // qué hace el botón ← (y Esc)
function barra(titulo, color, alVolver) {
  atras = alVolver;
  $('#barra').innerHTML = `
    ${alVolver ? '<button class="redondo volver" aria-label="Volver">←</button>' : `<a class="salir-sitio" href="/juegos/">${ui('masJuegos')}</a>`}
    <h1 style="--c:${color || '#ff7e5f'}">${titulo}</h1>
    <div class="ajustes">
      <button class="redondo" id="bIdioma" aria-label="Idioma">${idioma() === 'es' ? 'EN' : 'ES'}</button>
      <button class="redondo ${A.musicaActiva() ? '' : 'apagado'}" id="bMusica" aria-label="Música">🎵</button>
      <button class="redondo ${A.sonidoActivo() ? '' : 'apagado'}" id="bSonido" aria-label="Sonido">🔊</button>
    </div>`;
  $('#barra .volver')?.addEventListener('click', () => { A.efecto('abrir'); atras(); });
  $('#bIdioma').onclick = () => { cambiarIdioma(idioma() === 'es' ? 'en' : 'es'); document.title = ui('titulo'); rehacer(); };
  $('#bMusica').onclick = (e) => { A.fijarMusica(!A.musicaActiva()); e.currentTarget.classList.toggle('apagado', !A.musicaActiva()); };
  $('#bSonido').onclick = (e) => { A.fijarSonido(!A.sonidoActivo()); e.currentTarget.classList.toggle('apagado', !A.sonidoActivo()); };
}
addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!$('#grande').hidden) return cerrarGrande();
  if (atras) atras();
});
let rehacer = () => menu();
let limpiar = () => {};   // detiene lo que tenga en marcha la pantalla actual (burbujas, globos)
function cambiar(fn) { limpiar(); limpiar = () => {}; A.callar(); cerrarGrande(); pantalla.className = ''; pantalla.innerHTML = ''; rehacer = fn; fn(); }

// ---------------------------------------------------------------- menú
function menu() {
  barra(ui('titulo'), null, null);
  A.musica('menu');
  pantalla.className = 'menu';
  pantalla.innerHTML = SECCIONES.map((s, i) => {
    let dib = s.img ? img(s.img, s.emoji) : '';
    if (s.icono === '123') dib = `<span class="icono-texto">1 2 3</span>`;
    if (s.icono === 'ABC') dib = `<span class="icono-texto">A B C</span>`;
    if (s.icono === 'colores') dib = mancha('#8e4fd1');
    if (s.icono === 'formas') dib = forma(FORMAS[3]);
    if (s.icono === 'burbujas') dib = `<span class="icono-burbujas"><i></i><i></i><i></i></span>`;
    if (s.icono === 'globos') dib = globoSVG('#e8443a');
    return `<button class="boton-seccion" data-i="${i}" style="--c:${s.color}"><span class="dib">${dib}</span><span class="nombre">${nom(s)}</span></button>`;
  }).join('');
  pantalla.querySelectorAll('.boton-seccion').forEach((b) => b.addEventListener('click', async () => {
    const s = SECCIONES[+b.dataset.i];
    brillar(b, +b.dataset.i);
    A.decir(`sec_${s.id}`);
    await A.pausa(350);
    cambiar(s.id === 'burbujas' ? burbujas : s.id === 'globos' ? globos : () => seccion(s.id));
  }));
}

// ---------------------------------------------------------------- una sección
function seccion(sec) {
  const S = SECCIONES.find((s) => s.id === sec);
  barra(nom(S), S.color, () => cambiar(menu));
  A.musica(sec === 'musica' ? null : sec === 'dios' ? 'cuna' : 'aprender');
  const lista = items(sec);
  pantalla.className = `seccion sec-${sec}`;
  const jugar = sec === 'dios' ? '' : `<button class="boton-jugar">▶ ${ui('jugar')}</button>`;
  const xilo = sec === 'musica' ? `<button class="boton-item xilo-boton" style="--c:#fff">${xiloMini()}<span class="nombre">${ui('xilo')}</span></button>` : '';
  pantalla.innerHTML = `${jugar}<div class="rejilla">${xilo}${lista.map((x, i) => `
    <button class="boton-item" data-i="${i}" style="--c:${PASTEL[i % PASTEL.length]}">${x.dibujo}${x.nombre ? `<span class="nombre">${x.nombre}</span>` : ''}</button>`).join('')}</div>`;
  pantalla.querySelector('.boton-jugar')?.addEventListener('click', () => { A.efecto('abrir'); cambiar(() => juego(sec)); });
  pantalla.querySelector('.xilo-boton')?.addEventListener('click', () => { A.decir('sec_xilo'); cambiar(xilofono); });
  pantalla.querySelectorAll('.boton-item[data-i]').forEach((b) => b.addEventListener('click', () => {
    const k = +b.dataset.i;
    brillar(b, k);
    grande(sec, lista[k], b);
  }));
}

// ---------------------------------------------------------------- presentación en grande
let cierre = null;
async function grande(sec, x, desde) {
  const g = $('#grande');
  clearTimeout(cierre);
  let cuerpo = `<div class="dibujo-grande">${x.dibujo}</div><div class="nombre-grande">${x.nombre}</div>`;
  if (sec === 'letras') {
    const c = cosa(x.cosa), palabra = nom(c);
    cuerpo = `<div class="letra-y-cosa">${letra(x.L)}<div class="dibujo-grande">${img(x.cosa, c.emoji)}</div></div>
      <div class="nombre-grande">${resaltar(palabra, x.L)}</div>`;
  }
  if (sec === 'numeros') {
    const fruta = azar(FRUTAS);
    cuerpo = `<div class="dibujo-grande numero">${digito(x.n)}</div>
      <div class="contar">${Array.from({ length: x.n }, () => `<span class="contado visto">${img(fruta.id, fruta.emoji)}</span>`).join('')}</div>`;
  }
  if (sec === 'dios') cuerpo = `<div class="dibujo-grande foto">${x.dibujo}</div><div class="nombre-grande">${x.nombre}</div><p class="frase">${x.frase[idioma()]}</p>`;
  g.innerHTML = `<div class="tarjeta" style="--c:${desde?.style.getPropertyValue('--c') || '#fff'}">${cuerpo}</div>`;
  g.hidden = false;
  g.onclick = cerrarGrande;
  const mio = (grande.turno = (grande.turno || 0) + 1);
  // una sola palabra, en el idioma del juego (para aprender la otra lengua se cambia el idioma arriba)
  await A.decir(x.voz);
  if (sec === 'musica' && grande.turno === mio) { g.querySelector('.dibujo-grande').classList.add('baila'); await A.instrumento(x.id); }
  if (grande.turno === mio) cierre = setTimeout(cerrarGrande, sec === 'musica' ? 3000 : 2200);
}
function cerrarGrande() {
  const g = $('#grande');
  if (g.hidden) return;
  grande.turno = (grande.turno || 0) + 1;
  clearTimeout(cierre); A.callar();
  g.hidden = true; g.innerHTML = '';
}
const resaltar = (palabra, L) => {
  const i = palabra.toUpperCase().indexOf(L);
  return i < 0 ? palabra : `${palabra.slice(0, i)}<b>${palabra.slice(i, i + 1)}</b>${palabra.slice(i + 1)}`;
};

// ---------------------------------------------------------------- juego «¿Dónde está…?»
function juego(sec) {
  const S = SECCIONES.find((s) => s.id === sec), RONDAS = 5;
  barra(nom(S), S.color, () => cambiar(() => seccion(sec)));
  A.musica(sec === 'musica' ? null : 'aprender');
  const lista = items(sec);
  let ronda = 0, ultimo = null;
  pantalla.className = `juego ${sec}`;
  const estrellas = () => `<div class="estrellas">${Array.from({ length: RONDAS }, (_, i) => `<span class="${i < ronda ? 'llena' : ''}">★</span>`).join('')}</div>`;
  function nueva() {
    if (ronda >= RONDAS) return final();
    const meta = azar(lista.filter((x) => x !== ultimo)); ultimo = meta;
    const opciones = barajar([meta, ...barajar(lista.filter((x) => x !== meta)).slice(0, 2)]);
    const contar = sec === 'numeros' && Math.random() < 0.5;
    const fruta = azar(FRUTAS);
    const voz = contar ? 'frase_cuantos' : `donde_${sec}_${meta.id}`;
    const pregunta = contar ? ui('cuantos') : (A.textoVoz(voz) || '');
    pantalla.innerHTML = `${estrellas()}
      <button class="pregunta">🔊 <span>${pregunta}</span></button>
      ${contar ? `<div class="contar fijo">${Array.from({ length: meta.n }, () => `<span class="contado visto">${img(fruta.id, fruta.emoji)}</span>`).join('')}</div>` : ''}
      <div class="opciones">${opciones.map((o, i) => `<button class="opcion" data-i="${i}" style="--c:${PASTEL[(i * 3 + ronda) % 8]}">${sec === 'letras' ? `<span class="letra-boton">${o.L}</span>` : o.dibujo}</button>`).join('')}</div>`;
    pantalla.querySelector('.pregunta').onclick = () => A.decir(voz);
    A.decir(voz);
    let listo = false;
    pantalla.querySelectorAll('.opcion').forEach((b) => b.addEventListener('click', async () => {
      if (listo) return;
      const o = opciones[+b.dataset.i];
      if (o === meta) {
        listo = true; ronda++;
        b.classList.add('acierto'); A.efecto('bien'); chispas(...centro(b), 18);
        pantalla.querySelector('.estrellas').outerHTML = estrellas();
        if (sec === 'musica') A.instrumento(o.id);
        const elogio = azar(['frase_muybien', 'frase_bravo', 'frase_excelente']);
        felicitar(elogio);
        const t0 = performance.now();
        await A.decir(elogio);
        await A.pausa(Math.max(400, 2200 - (performance.now() - t0)));   // que la fiesta se vea antes de seguir
        nueva();
      } else {
        b.classList.remove('fallo'); void b.offsetWidth; b.classList.add('fallo');
        A.efecto('boing');
        await A.decir(['frase_otravez', voz]);
      }
    }));
  }
  function final() {
    pantalla.innerHTML = `${estrellas()}<div class="final"><div class="trofeo">🏆</div><h2>${ui('lograste')}</h2>
      <div class="botones-final"><button class="boton-jugar otra">↻ ${ui('otra')}</button><button class="boton-jugar volver2">← ${ui('volver')}</button></div></div>`;
    A.efecto('fiesta'); confeti(); A.decir('frase_lologaste');
    pantalla.querySelector('.otra').onclick = () => cambiar(() => juego(sec));
    pantalla.querySelector('.volver2').onclick = () => cambiar(() => seccion(sec));
  }
  nueva();
}

// cartel grande de «¡Muy bien!» con la palabra en el otro idioma
function felicitar(clave, palabraOtra) {
  const c = document.createElement('div');
  c.className = 'felicita';
  c.innerHTML = `<span class="estrella-gorda">★</span><b>${A.textoVoz(clave)}</b>${palabraOtra ? `<span class="nombre-otro"><i>${A.otro().toUpperCase()}</i>${palabraOtra}</span>` : ''}`;
  document.body.append(c);
  confeti(30);
  setTimeout(() => c.remove(), 2000);
}

// ---------------------------------------------------------------- burbujas
function burbujas() {
  const S = SECCIONES.find((s) => s.id === 'burbujas');
  barra(nom(S), S.color, () => cambiar(menu));
  A.musica('fiesta');
  pantalla.className = 'libre';
  const reserva = [...items('frutas'), ...items('bebe'), ...items('formas'), ...items('numeros'), ...items('colores')];
  const vivas = [];
  let corre = true, ultimo = performance.now(), cuenta = 0;
  function nacer() {
    const x = reserva[Math.floor(Math.random() * reserva.length)], b = document.createElement('button');
    const tam = Math.min(innerWidth, innerHeight) * (0.2 + Math.random() * 0.08);
    b.className = 'burbuja'; b.innerHTML = x.dibujo;
    b.style.cssText = `width:${tam}px;height:${tam}px;padding:${tam * 0.17}px;font-size:${tam * 0.19}px`;
    const o = { b, x, px: Math.random() * (innerWidth - tam), py: innerHeight + 10, vy: 45 + Math.random() * 40, fase: Math.random() * 6, tam };
    b.addEventListener('pointerdown', () => reventar(o));
    pantalla.append(b); vivas.push(o);
  }
  function reventar(o) {
    if (o.fuera) return;
    o.fuera = true;
    A.efecto('pop'); chispas(o.px + o.tam / 2, o.py + o.tam / 2, 12, ['#9be7ff', '#fff', '#ffd6ee', '#fff4b8']);
    A.decir(o.x.voz);
    o.b.classList.add('revienta'); setTimeout(() => o.b.remove(), 250);
    if (++cuenta % 15 === 0) { A.efecto('fiesta'); confeti(40); }
  }
  function cuadro(t) {
    if (!corre) return;
    const dt = Math.min(0.05, (t - ultimo) / 1000); ultimo = t;
    if (vivas.filter((o) => !o.fuera).length < 7 && Math.random() < dt * 1.6) nacer();
    for (let i = vivas.length - 1; i >= 0; i--) {
      const o = vivas[i];
      o.py -= o.vy * dt; o.fase += dt * 1.8;
      o.b.style.transform = `translate(${o.px + Math.sin(o.fase) * 18}px, ${o.py}px)`;
      if (o.py < -o.tam - 20) { o.fuera = true; o.b.remove(); }
      if (o.fuera) vivas.splice(i, 1);
    }
    requestAnimationFrame(cuadro);
  }
  for (let i = 0; i < 4; i++) { nacer(); vivas[i].py = innerHeight * (0.35 + i * 0.15); }
  requestAnimationFrame(cuadro);
  limpiar = () => { corre = false; };
}

// ---------------------------------------------------------------- globos
function globoSVG(hex) {
  const borde = hex === '#ffffff' ? '#c9c9d4' : '#0002', ojo = hex === '#2b2b33' ? '#fff' : '#2b2b33';
  return `<svg class="fig" viewBox="0 0 120 190"><path d="M60 128c-4 20 8 30 0 60" stroke="#8a8a99" stroke-width="2.5" fill="none"/>
    <path d="M60 8c30 0 50 24 50 54 0 34-26 62-50 66-24-4-50-32-50-66C10 32 30 8 60 8z" fill="${hex}" stroke="${borde}" stroke-width="4"/>
    <path d="M54 128h12l-6 9z" fill="${hex}" stroke="${borde}" stroke-width="3"/>
    <ellipse cx="38" cy="38" rx="9" ry="15" fill="#fff" opacity=".45" transform="rotate(25 38 38)"/>${cara(60, 64, 0.85, ojo)}</svg>`;
}
function globos() {
  const S = SECCIONES.find((s) => s.id === 'globos');
  barra(nom(S), S.color, () => cambiar(menu));
  A.musica('fiesta');
  pantalla.className = 'libre';
  pantalla.innerHTML = `<button class="pregunta flotante">🔊 <span></span></button>`;
  const vivos = [];
  let corre = true, ultimo = performance.now(), meta = null, aciertos = 0, desdePedido = 0;
  const pedir = () => {
    meta = azar(COLORES.filter((c) => c !== meta)); desdePedido = 0;
    pantalla.querySelector('.pregunta span').innerHTML = `<i class="punto" style="background:${meta.hex}"></i>${A.textoVoz(`globo_${meta.id}`)}`;
    A.decir(`globo_${meta.id}`);
  };
  pantalla.querySelector('.pregunta').onclick = () => A.decir(`globo_${meta.id}`);
  function nacer(c) {
    const b = document.createElement('button'), tam = Math.min(innerWidth * 0.24, innerHeight * 0.19, 190);
    b.className = 'globo'; b.innerHTML = globoSVG(c.hex);
    b.style.cssText = `width:${tam}px;height:${tam * 1.58}px`;
    const o = { b, c, px: Math.random() * (innerWidth - tam), py: innerHeight + 10, vy: 55 + Math.random() * 35, fase: Math.random() * 6, tam };
    b.addEventListener('pointerdown', () => reventar(o));
    pantalla.append(b); vivos.push(o);
  }
  async function reventar(o) {
    if (o.fuera) return;
    o.fuera = true;
    A.efecto('pop'); chispas(o.px + o.tam / 2, o.py + o.tam * 0.6, 14, [o.c.hex, '#fff', o.c.hex]);
    o.b.classList.add('revienta'); setTimeout(() => o.b.remove(), 250);
    if (o.c === meta) {
      aciertos++; A.efecto('bien');
      if (aciertos % 5 === 0) { A.efecto('fiesta'); confeti(); }
      await A.decir(azar(['frase_muybien', 'frase_bravo', 'frase_excelente']));
      if (corre) pedir();
    } else A.decir(`colores_${o.c.id}`);
  }
  function cuadro(t) {
    if (!corre) return;
    const dt = Math.min(0.05, (t - ultimo) / 1000); ultimo = t; desdePedido += dt;
    const activos = vivos.filter((o) => !o.fuera);
    if (activos.length < 6 && Math.random() < dt * 1.5) nacer(meta && !activos.some((o) => o.c === meta) ? meta : azar(COLORES));
    if (desdePedido > 12) { desdePedido = 0; A.decir(`globo_${meta.id}`); }
    for (let i = vivos.length - 1; i >= 0; i--) {
      const o = vivos[i];
      o.py -= o.vy * dt; o.fase += dt * 1.5;
      o.b.style.transform = `translate(${o.px + Math.sin(o.fase) * 12}px, ${o.py}px) rotate(${Math.sin(o.fase) * 6}deg)`;
      if (o.py < -o.tam * 1.7) { o.fuera = true; o.b.remove(); }
      if (o.fuera) vivos.splice(i, 1);
    }
    requestAnimationFrame(cuadro);
  }
  pedir();
  for (let i = 0; i < 4; i++) { nacer(i === 0 ? meta : azar(COLORES)); vivos[i].py = innerHeight * (0.4 + i * 0.14); }
  requestAnimationFrame(cuadro);
  limpiar = () => { corre = false; };
}

// ---------------------------------------------------------------- xilófono de colores
const xiloMini = () => `<span class="xilo-mini">${ARCOIRIS.map((c, i) => `<i style="background:${c};height:${90 - i * 7}%"></i>`).join('')}</span>`;
// «Estrellita, ¿dónde estás?» (melodía tradicional, dominio público): índices de las barras
const ESTRELLITA = [0, 0, 4, 4, 5, 5, 4, 3, 3, 2, 2, 1, 1, 0, 4, 4, 3, 3, 2, 2, 1, 4, 4, 3, 3, 2, 2, 1, 0, 0, 4, 4, 5, 5, 4, 3, 3, 2, 2, 1, 1, 0];
function xilofono() {
  barra(ui('xilo'), '#ffb020', () => cambiar(() => seccion('musica')));
  A.musica(null); A.precargarMuestras();
  pantalla.className = 'xilo';
  pantalla.innerHTML = `<button class="boton-jugar conmigo">${ui('conmigo')}</button>
    <div class="barras">${ARCOIRIS.map((c, i) => `<button class="barra-x" data-k="${i}" style="--c:${c};height:${92 - i * 6}%"><i></i><i></i></button>`).join('')}</div>`;
  let cancion = null;   // posición en la canción mientras se toca «conmigo»
  const barras = [...pantalla.querySelectorAll('.barra-x')];
  const marcar = () => barras.forEach((b, k) => b.classList.toggle('siguiente', cancion != null && k === ESTRELLITA[cancion]));
  const golpe = (b) => {
    const k = +b.dataset.k;
    A.nota(k);
    b.classList.remove('suena'); void b.offsetWidth; b.classList.add('suena');
    chispas(...centro(b), 6, [ARCOIRIS[k], '#fff']);
    if (cancion != null && k === ESTRELLITA[cancion]) {
      cancion++;
      if (cancion >= ESTRELLITA.length) {
        cancion = null; setTimeout(() => { A.efecto('fiesta'); confeti(); A.decir('frase_cancion'); }, 500);
      }
      marcar();
    }
  };
  // se puede tocar barra por barra o deslizar el dedo por encima (glissando)
  let apretado = false;
  barras.forEach((b) => {
    b.addEventListener('pointerdown', (e) => { apretado = true; b.releasePointerCapture?.(e.pointerId); golpe(b); });
    b.addEventListener('pointerenter', () => { if (apretado) golpe(b); });
  });
  const soltar = () => { apretado = false; };
  addEventListener('pointerup', soltar); addEventListener('pointercancel', soltar);
  pantalla.querySelector('.conmigo').onclick = () => { cancion = 0; marcar(); A.decir('frase_conmigo'); };
  limpiar = () => { removeEventListener('pointerup', soltar); removeEventListener('pointercancel', soltar); };
}

// ---------------------------------------------------------------- arranque
document.title = ui('titulo');
$('#arranque h1').textContent = ui('titulo');
$('#arranque .empezar').textContent = ui('empezar');
$('#arranque').addEventListener('click', () => {
  A.despertar();
  $('#arranque').remove();
  cambiar(menu);
  A.decir('frase_hola');
}, { once: true });
