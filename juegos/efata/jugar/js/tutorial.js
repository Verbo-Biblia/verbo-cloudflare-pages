// Bienvenida y recorridos guiados.
// 1) La primera vez, antes de la portada: la ovejita cuenta en partes qué es Efatá (el texto se va escribiendo).
// 2) Recorridos con foco: se oscurece la pantalla, se ilumina un elemento y un globo explica qué es y cómo se usa.
//    Hay uno para la portada, otro para el primer paso de estudio y otro para la primera ronda de juego.
'use strict';

const BIENVENIDA = [
  { titulo: '¡Bienvenido a Efatá!', texto: 'Aquí vas a aprender a **entender, leer y hablar inglés**, paso a paso y **jugando**.\n\nJunto con las palabras de todos los días vas a aprender **palabras, frases y versículos de la Biblia** en inglés.' },
  { titulo: 'El corazón del inglés', texto: 'Vas a aprender las **850 palabras y los 16 verbos** que sostienen el inglés. Con ellas se dice casi todo lo de cada día.\n\nCon esas mismas palabras, y unas pocas más propias de la Biblia, **se tradujo la Biblia entera al inglés**. Por eso, mientras aprendes, también vas a ir leyendo la Palabra.' },
  { titulo: 'Un método probado', texto: 'El curso sigue, paso a paso, un método clásico para aprender inglés desde el español: **cada regla bien practicada, cada palabra repetida hasta que sale sola, y siempre en voz alta**.\n\nEs el camino más directo para entender y hacerte entender, y una base firme para todo lo que aprendas después.' },
  { titulo: 'Cómo vas a avanzar', texto: 'Cada lección tiene sus **pasos**. En cada paso primero **estudias** las palabras, tocándolas para oírlas y diciéndolas en voz alta, y luego **juegas** con ellas.\n\nSi superas el juego, se abre el paso siguiente. Al final de cada lección hay un **examen**: si lo apruebas, se abre la lección siguiente. No avances hasta dominar lo anterior; así lo pide el método, y así funciona.' },
  { titulo: '¿Empezamos?', texto: 'Ahora te muestro dónde está cada cosa. Es un momento, y luego empiezas tu primera lección.' },
];

const RECORRIDOS = {
  inicio: [
    { sel: '.tablero .cifra:nth-child(1)', titulo: 'Tu racha', texto: 'Cuenta los días seguidos que estudias. Un poco cada día vale más que mucho de vez en cuando. Si pasa un día entero sin jugar, la racha vuelve a cero.' },
    { sel: '.tablero .cifra:nth-child(2)', titulo: 'Tus puntos', texto: 'Ganas puntos con cada acierto, y más si aciertas varias seguidas. Aprobar un examen da un premio grande.' },
    { sel: '.tablero .cifra.nivel', titulo: 'Tu nivel', texto: 'Con los puntos subes de nivel: Oyente, Aprendiz, Discípulo, Escriba…' },
    { sel: '.meta', titulo: 'La meta de hoy', texto: 'Si juntas 150 puntos en el día, cumpliste tu meta. Es más o menos un paso de lección.' },
    { sel: 'a[href="#/libreta"]', titulo: 'Mi libreta', texto: 'Cada palabra que estudias se anota aquí sola, con su pronunciación y su traducción. Ábrela en los ratos libres (en la fila, en el bus, antes de dormir) y repásala con tarjetas. Cuando tengas palabras, aparecerá también el **Repaso del día**: un juego con las que más te cuestan.' },
    { sel: 'a[href="#/guia"]', titulo: 'Pronunciación', texto: 'Aquí están juntas todas las explicaciones de cómo se lee la pronunciación escrita: qué significa la letra pálida, la tilde, la sh… Dentro de las lecciones aparecen justo cuando las necesitas.' },
    { sel: '.parada.actual, .camino .parada', titulo: 'El camino', texto: 'Estas son las lecciones. Cada una se abre cuando apruebas el examen de la anterior. **Empieza aquí, por la lección 1.**' },
  ],
  paso: [
    { sel: '.palabra .voz', titulo: 'Escucha', texto: 'Toca el parlante para oír cómo se dice. Repítela en voz alta, varias veces.' },
    { sel: '.palabra .pr', titulo: 'La pronunciación escrita', texto: 'Debajo de cada palabra va cómo se pronuncia, escrito con letras del español. Las letras pálidas casi no se dicen; la que lleva tilde se dice con más fuerza.' },
    { sel: '.ocultar', titulo: 'Tapar', texto: 'Para repasar, tapa el inglés o el español y trata de recordarlo. Toca una tarjeta para destaparla y comprobar.' },
    { sel: '#jugar', titulo: '¡A jugar!', texto: 'Cuando ya te sepas las palabras, toca aquí. Si superas el juego, se abre el paso siguiente.' },
  ],
  juego: [
    { sel: '.jbarra .progreso', titulo: 'Tu avance', texto: 'La barra se llena con cada reto. Al completarla, superas el paso.' },
    { sel: '.jbarra .vidas', titulo: 'Tus corazones', texto: 'Tienes 5. Cada error cuesta uno, y esa pregunta vuelve al final para que la aprendas. Si te quedas sin corazones, toca repasar el paso y volver a jugar.' },
    { sel: '.consigna', titulo: 'Qué hay que hacer', texto: 'Aquí dice qué pide cada reto: elegir, escuchar, escribir, unir parejas, armar la frase o decirla en voz alta.' },
  ],
};

// ---------- Bienvenida ----------
function pBienvenida(k = 0) {
  const parte = BIENVENIDA[k], ultima = k === BIENVENIDA.length - 1;
  app().innerHTML = `<main class="bienvenida">
    <div class="puntos-avance">${BIENVENIDA.map((_, j) => `<span class="${j <= k ? 'si' : ''}"></span>`).join('')}</div>
    ${k === 0 ? img('logo', 'logo-grande') : ''}
    <div class="narra">${img(ultima ? 'oveja-fiesta' : 'oveja-feliz', 'oveja-narra')}
      <div class="globo-narra"><h2>${esc(parte.titulo)}</h2><div class="escribiendo" id="escribiendo">${escrito(parte.texto)}</div></div></div>
    <div class="acciones-bienvenida" id="acciones">
      <button class="boton ancho" id="sig">${ultima ? 'Muéstrame la app' : 'Siguiente ›'}</button>
      ${k === 0 && E.bienvenida ? '<button class="chip" id="saltar">Saltar la introducción</button>' : ''}
    </div></main>`;
  const caja = $('#escribiendo'), acc = $('#acciones');
  const palabras = [...caja.querySelectorAll('.pal')];
  let i = 0, t = null;
  const terminar = () => { clearInterval(t); palabras.forEach(p => p.classList.add('ver')); acc.classList.add('ver'); };
  t = setInterval(() => { if (i < palabras.length) palabras[i++].classList.add('ver'); else terminar(); }, 70);
  caja.onclick = terminar;
  $('#sig').onclick = () => {
    if (!ultima) return pBienvenida(k + 1);
    E.bienvenida = true; E.tour = {}; guardar();
    location.hash = '#/'; render();
    setTimeout(() => recorrido('inicio'), 400);
  };
  const s = $('#saltar');
  if (s) s.onclick = () => { E.bienvenida = true; guardar(); render(); };
}
// Convierte el texto en palabras sueltas (con **negrita**) para que aparezcan una a una.
function escrito(t) {
  return t.split(/\n\s*\n/).map(par => {
    let neg = false;
    const ws = par.split(/\s+/).map(w => {
      // Cada «**» dentro de la palabra abre o cierra la negrita (sirve para «**Efatá**,» o «**palabra**.»).
      const html = w.split('**').map((trozo, j) => {
        if (j) neg = !neg;
        return trozo ? (neg ? `<b>${esc(trozo)}</b>` : esc(trozo)) : '';
      }).join('');
      return `<span class="pal">${html}</span>`;
    });
    return `<p>${ws.join(' ')}</p>`;
  }).join('');
}

// ---------- Recorridos con foco ----------
let tourActivo = null;
function recorrido(nombre, forzar) {
  E.tour = E.tour || {};
  if (tourActivo || (!forzar && E.tour[nombre])) return;
  const pasos = RECORRIDOS[nombre].filter(p => document.querySelector(p.sel));
  if (!pasos.length) return;
  tourActivo = nombre;
  let k = 0;
  const capa = document.createElement('div');
  capa.className = 'tour';
  capa.innerHTML = '<div class="tour-hueco"></div><div class="tour-globo"></div>';
  document.body.appendChild(capa);
  const hueco = capa.querySelector('.tour-hueco'), globo = capa.querySelector('.tour-globo');
  const cerrar = () => {
    E.tour[nombre] = true; guardar(); capa.remove(); tourActivo = null;
    window.removeEventListener('resize', mostrar);
  };
  function mostrar() {
    const p = pasos[k], el = document.querySelector(p.sel);
    if (!el) return cerrar();
    el.scrollIntoView({ block: 'center' });
    setTimeout(() => {
      const r = el.getBoundingClientRect(), m = 8;
      Object.assign(hueco.style, { left: r.left - m + 'px', top: r.top - m + 'px', width: r.width + 2 * m + 'px', height: r.height + 2 * m + 'px' });
      globo.innerHTML = `<h3>${esc(p.titulo)}</h3>${md(p.texto)}
        <div class="tour-pie"><span>${k + 1} de ${pasos.length}</span>
          ${k < pasos.length - 1 ? '<button class="chip" id="tour-fin">Saltar</button>' : ''}
          <button class="boton" id="tour-sig">${k < pasos.length - 1 ? 'Siguiente' : '¡Entendido!'}</button></div>`;
      // El globo va debajo del elemento si cabe; si no, encima.
      const alto = globo.offsetHeight, abajo = r.bottom + m + 14;
      globo.style.top = (abajo + alto < innerHeight - 10 ? abajo : Math.max(10, r.top - m - 14 - alto)) + 'px';
      globo.querySelector('#tour-sig').onclick = () => { k++; k < pasos.length ? mostrar() : cerrar(); };
      const f = globo.querySelector('#tour-fin'); if (f) f.onclick = cerrar;
    }, 250);
  }
  window.addEventListener('resize', mostrar);
  mostrar();
}
