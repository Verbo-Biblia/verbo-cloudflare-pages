// Juego: cada paso de estudio se domina jugando una ronda de retos hechos con sus propias palabras y frases.
// Rutas: #/l/N/p/I/juego (ronda de un paso) · #/repaso (repaso del día con la libreta).
'use strict';

const VIDAS = 5;
const XP_ACIERTO = 5, XP_COMBO = 2, XP_PASO = 20, XP_EXAMEN = 100, META_DIA = 150;
const ELOGIOS = ['¡Muy bien!', '¡Excelente!', '¡Así se hace!', '¡Correcto!', '¡Bien hecho!', '¡Eso es!'];

// ---------- Arte ----------
// Imagen del juego (app/img). Si falta, no se muestra nada roto.
const img = (n, cls = '', alt = '') => `<img class="${cls}" src="img/${/\./.test(n) ? n : n + '.svg'}" alt="${esc(alt)}" onerror="this.remove()">`;

// ---------- Sonido ----------
let actx = null;
function tono(fs, dur = 0.12, tipo = 'sine', vol = 0.16) {
  if (!E.sonido) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    fs.forEach((f, i) => {
      const o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime + i * dur;
      o.type = tipo; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(actx.destination); o.start(t); o.stop(t + dur + 0.02);
    });
  } catch (e) {}
}
const SON = {
  bien: () => tono([660, 990], 0.1),
  mal: () => { tono([196, 147], 0.15, 'triangle', 0.2); if (navigator.vibrate) navigator.vibrate(120); },
  toque: () => tono([520], 0.05, 'sine', 0.08),
  fin: () => tono([523, 659, 784, 1047], 0.14),
};
// ¿Se puede oír este texto? El audio grabado se mira palabra por palabra (L2-L11 aún se están grabando).
const hayVoz = t => (t != null && hayAudio(t)) || !!((window.Android && Android.decir) || (window.speechSynthesis && vozEn));

// ---------- Puntos y racha ----------
function diaStr(d) { return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; }
function ganarXP(n) {
  E.xp = (E.xp || 0) + n;
  const hoy = diaStr(new Date()), ayer = diaStr(new Date(Date.now() - 864e5));
  if (E.racha.dia !== hoy) { E.racha.n = E.racha.dia === ayer ? E.racha.n + 1 : 1; E.racha.dia = hoy; }
  E.hoyXP = E.hoyDia === hoy ? (E.hoyXP || 0) + n : n; E.hoyDia = hoy;
  guardar();
}
// La racha se pierde si pasa un día entero sin jugar.
function rachaActual() {
  const r = E.racha;
  return r.dia === diaStr(new Date()) || r.dia === diaStr(new Date(Date.now() - 864e5)) ? r.n : 0;
}
const nivel = xp => Math.floor(Math.sqrt((xp || 0) / 100)) + 1;
const xpNivel = n => (n - 1) * (n - 1) * 100;
const NOMBRES_NIVEL = ['Oyente', 'Aprendiz', 'Discípulo', 'Escriba', 'Mensajero', 'Maestro', 'Sabio', 'Anciano'];
const nombreNivel = n => NOMBRES_NIVEL[Math.min(Math.floor((n - 1) / 3), NOMBRES_NIVEL.length - 1)];

// ---------- Material de la ronda ----------
function itemsDePaso(p) {
  const pal = [], fra = [];
  const addP = w => pal.push({ en: w[0], pr: w[1], es: w[2], decir: (w[3] || {}).decir || w[0] });
  const addF = f => fra.push({ en: f[0], es: f[1] });
  let tabla = 0;
  for (const b of p.bloques || []) {
    if (b.t === 'palabras') b.v.forEach(addP);
    if (b.t === 'grupo') { b.palabras.forEach(addP); b.frases.forEach(addF); }
    if (b.t === 'frases') b.v.forEach(addF);
    if (b.t === 'biblia') b.v.forEach(v => fra.push({ en: v[0], es: v[1], cita: v[2] }));
    if (b.t === 'tabla') { tabla++; b.filas.forEach(f => fra.push({ en: f[0], es: f[1], tabla })); }
  }
  if (p.palabras) p.palabras.forEach(addP);
  if (p.tipo === 'versiculo') fra.push({ en: p.en, es: p.es, versiculo: true });
  return { pal, fra };
}
const tieneJuego = p => { const it = itemsDePaso(p); return it.pal.length + it.fra.length > 0; };
function unicos(xs) { const v = new Set(); return xs.filter(x => !v.has(normal(x.en)) && v.add(normal(x.en))); }
// Todo lo que el alumno ya pudo ver: sirve para las opciones falsas.
function material(hasta) {
  const pal = [], fra = [];
  for (let n = 1; n <= hasta; n++) (LECCIONES[n] ? LECCIONES[n].pasos : []).forEach(p => {
    const it = itemsDePaso(p); pal.push(...it.pal); fra.push(...it.fra);
  });
  Object.values(E.libreta).forEach(w => pal.push({ en: w.en, pr: w.pr, es: w.es, decir: w.en }));
  return { pal: unicos(pal), fra: unicos(fra) };
}
function barajar(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; }
// Opciones falsas: distintas de la respuesta y entre sí, en el campo que se muestra.
function falsas(item, pool, campo, k = 3) {
  const vistos = new Set([normal(item[campo]), normal(item.en)]), out = [];
  for (const c of barajar(pool)) {
    const v = normal(c[campo]);
    if (vistos.has(v) || vistos.has(normal(c.en))) continue;
    vistos.add(v); vistos.add(normal(c.en)); out.push(c);
    if (out.length === k) break;
  }
  return out;
}
// En «arma la frase» las fichas van en minúscula para no delatar la primera palabra, salvo nombres propios.
const PROPIAS = new Set(['i', 'god', 'lord', 'jesus', 'christ', 'bible', 'monday', 'egypt', 'israel', 'daniel', 'eden', 'adam',
  'nazareth', 'bethlehem', 'jerusalem', 'galilee', 'moses', 'david', 'mary', 'joseph', 'peter', 'paul', 'john', 'abraham',
  'noah', 'eve', 'martha', 'ruth', 'samuel', 'rome', 'judaea', 'jordan', 'canaan', 'babylon', 'nineveh', 'sinai', 'jonah',
  'jacob', 'isaac', 'sarah', 'elijah', 'lazarus', 'bethany', 'capernaum', 'goliath', 'solomon', 'zacchaeus', 'timothy', 'james',
  'andrew', 'thomas', 'philip', 'luke', 'mark', 'matthew', 'jews', 'english', 'sabbath', 'naomi', 'abel', 'cain', 'boaz', 'herod', 'pilate', 'jericho', 'tuesday', 'wednesday',
  'thursday', 'friday', 'saturday', 'sunday', 'january', 'february', 'march', 'april', 'june', 'july', 'august',
  'september', 'october', 'november', 'december', 'galilee']);
const ficha = w => PROPIAS.has(normal(w)) ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w.toLowerCase();
// Palabra que se escribe igual en los dos idiomas (Animal, Metal): no sirve para elegir la traducción.
const identica = w => normal(w.en) === normal(String(w.es).split(';')[0]);
const palabrasDe = s => String(s).replace(/[.,;:!?¿¡"«»]/g, '').split(/\s+/).filter(Boolean);

function retoPalabra(w, tipo, pool) {
  // Sin voz, la idéntica se escribe (elegir la traducción sería regalarla).
  if (tipo === 'oye' && !hayVoz(w.decir)) tipo = identica(w) ? 'escribe' : 'elige-es';
  // Los verbos (To come) se escriben también: el libro los pide en los dos sentidos.
  if (tipo === 'escribe' && !/^to \S+$/i.test(w.en) && (/\s/.test(w.en) || w.en.length > 9)) tipo = 'elige-en';
  const campo = tipo === 'elige-es' ? 'es' : 'en';
  if (tipo === 'escribe') return { tipo, item: w };
  return { tipo, item: w, opciones: barajar([w, ...falsas(w, pool.pal, campo)]) };
}
function retoFrase(f, tipo, pool) {
  if (tipo === 'frase-es' && pool.fra.length < 4) tipo = 'arma';
  if (tipo === 'arma' && !f.versiculo && palabrasDe(f.en).length > 9) tipo = 'frase-es';   // muy larga para armarla
  if (tipo === 'arma') {
    const propias = palabrasDe(f.en);
    const ajenas = f.versiculo ? [] : barajar(pool.pal.map(w => w.en).filter(x => !/\s/.test(x)
      && !propias.some(p => normal(p) === normal(x)))).slice(0, propias.length > 5 ? 3 : 2);
    return { tipo, item: f, fichas: barajar([...propias, ...ajenas].map(ficha)) };
  }
  return { tipo, item: f, opciones: barajar([f, ...falsas(f, pool.fra, 'es')]) };
}
// Retos de hablar: si hay reconocimiento de voz, el alumno no pidió una pausa y no los apagó en Ajustes.
const puedeHablar = () => E.hablar !== false && !(E.sinMicHasta > Date.now()) && typeof Hablar !== 'undefined' && Hablar.disponible();
function retosHablar(items, n) {
  if (!puedeHablar() || n <= 0) return [];
  const cortas = barajar(items.fra.filter(f => !f.versiculo && palabrasDe(f.en).length <= 7));
  const fuente = cortas.length ? cortas : barajar(items.pal.filter(w => !/\s/.test(w.en) || w.en.length < 25));
  return fuente.slice(0, n).map(item => ({ tipo: 'habla', item }));
}
// Ronda: las palabras se juegan todas (en parejas si son muchas) y se refuerzan con retos sueltos; las frases,
// alternando «arma la frase» y «¿qué significa?». Al final, un par de palabras viejas de la libreta.
function armarRonda(items, pool, { maxFrases = 10, repaso = [], hablar = 2 } = {}) {
  const retos = [];
  // Las idénticas se juegan de oído y por escrito: lo que hay que aprender de ellas es cómo suenan y se escriben.
  const iguales = barajar(items.pal.filter(identica)), pal = barajar(items.pal.filter(w => !identica(w)));
  iguales.slice(0, 12).forEach((w, i) => retos.push(retoPalabra(w, i % 3 === 2 ? 'escribe' : 'oye', pool)));
  let sueltas = pal;
  if (pal.length >= 7) {
    const g = Math.ceil(pal.length / 5);
    for (let k = 0; k < g; k++) retos.push({ tipo: 'parejas', items: pal.filter((_, i) => i % g === k) });
    sueltas = pal.slice(0, Math.min(8, pal.length));
  }
  const tipos = ['elige-es', 'oye', 'elige-en', 'escribe', 'elige-es', 'oye', 'elige-en', 'escribe'];
  // Los 16 verbos: cada uno de inglés a español y de español a inglés, escrito.
  const verbos = pal.filter(w => /^to \S+$/i.test(w.en));
  if (verbos.length >= 8) {
    sueltas = sueltas.filter(w => !verbos.includes(w));
    verbos.forEach(w => retos.push(retoPalabra(w, 'elige-es', pool), retoPalabra(w, 'escribe', pool)));
  }
  sueltas.forEach((w, i) => retos.push(retoPalabra(w, tipos[i % tipos.length], pool)));
  // De cada tabla sale al menos una fila; el resto, al azar.
  const sinVers = barajar(items.fra.filter(f => !f.versiculo)), porTabla = [];
  sinVers.forEach(f => { if (f.tabla && !porTabla.some(x => x.tabla === f.tabla)) porTabla.push(f); });
  const fra = porTabla.concat(sinVers.filter(f => !porTabla.includes(f))).slice(0, Math.max(maxFrases, porTabla.length));
  fra.forEach((f, i) => retos.push(retoFrase(f, i % 2 ? 'frase-es' : 'arma', pool)));
  repaso.forEach(w => retos.push(retoPalabra(w, 'elige-es', pool)));
  retos.push(...retosHablar(items, hablar));
  const mezcla = barajar(retos);
  // El versículo, si lo hay, se arma al final y luego se dice en voz alta.
  items.fra.filter(f => f.versiculo).forEach(f => {
    mezcla.push(retoFrase(f, 'arma', pool));
    if (puedeHablar()) mezcla.push({ tipo: 'habla', item: f });
  });
  return mezcla;
}

// ---------- Estado de la ronda ----------
let G = null;

function pJuego(n, i) {
  const l = LECCIONES[n], p = l && l.pasos[i];
  if (!p || !abierta(n) || !pasoAbierto(l, i) || !tieneJuego(p)) return ir(`#/l/${n}`);
  const pool = material(n);
  anotarPalabras(l, p);   // a la libreta desde el principio, para que cuenten también los fallos de la primera ronda
  const propias = new Set(itemsDePaso(p).pal.map(w => normal(w.en)));
  const viejas = Object.values(E.libreta).filter(w => !propias.has(normal(w.en)))
    .sort((a, b) => (b.mal - b.bien) - (a.mal - a.bien) + Math.random() - 0.5).slice(0, 2)
    .map(w => ({ en: w.en, pr: w.pr, es: w.es, decir: w.en }));
  const retos = armarRonda(itemsDePaso(p), pool, { maxFrases: p.tipo === 'perfeccionamiento' ? 12 : 10, repaso: viejas,
    hablar: p.tipo === 'perfeccionamiento' ? 4 : p.tipo === 'versiculo' ? 0 : 2 });
  empezar({ modo: 'paso', l, p, i, retos, salir: `#/l/${n}/p/${i}` });
}
function pRepaso() {
  const ws = Object.values(E.libreta);
  if (ws.length < 4) return ir('#/libreta');
  const elegidas = ws.slice().sort((a, b) => (b.mal - b.bien) - (a.mal - a.bien) + (Math.random() - 0.5) * 3).slice(0, 12)
    .map(w => ({ en: w.en, pr: w.pr, es: w.es, decir: w.en }));
  const pool = material(LECCIONES.length - 1);
  const tipos = ['elige-es', 'oye', 'elige-en', 'escribe'];
  const distintas = elegidas.filter(w => !identica(w));
  const retos = [...(distintas.length >= 4 ? [{ tipo: 'parejas', items: distintas.slice(0, 5) }] : []),
    ...elegidas.map((w, k) => retoPalabra(w, identica(w) ? 'oye' : tipos[k % tipos.length], pool))];
  empezar({ modo: 'repaso', retos, salir: '#/' });
}
function empezar(o) {
  G = Object.assign({ k: 0, total: o.retos.length, vidas: VIDAS, errores: 0, aciertos: 0, xp: 0, combo: 0, comboMax: 0 }, o);
  mostrarReto();
}

// ---------- Pantalla de reto ----------
const CONSIGNAS = {
  'elige-es': '¿Qué significa?', 'elige-en': '¿Cómo se dice en inglés?', oye: 'Escucha y elige lo que oyes',
  escribe: 'Escríbelo en inglés', 'frase-es': '¿Qué significa esta frase?', arma: 'Arma la frase en inglés',
  parejas: 'Une cada palabra con su traducción', habla: '¡Dilo en voz alta!',
};
function barraJuego() {
  const prog = Math.min(1, G.k / G.retos.length);
  const corazones = Array.from({ length: VIDAS }, (_, k) => img(k < G.vidas ? 'corazon' : 'corazon-vacio', 'vida')).join('');
  return `<header class="jbarra"><a class="salir" href="${G.salir}" aria-label="Salir">✕</a>
    <div class="progreso"><div style="width:${prog * 100}%"></div></div>
    <span class="vidas" aria-label="${G.vidas} vidas">${corazones}<b>${G.vidas}</b></span></header>`;
}
function mostrarReto() {
  if (G.vidas <= 0) return pantallaSinVidas();
  if (G.k >= G.retos.length) return pantallaFinal();
  const r = G.retos[G.k];
  app().innerHTML = barraJuego() + `<main class="reto t-${r.tipo}">
    ${G.combo >= 3 ? `<div class="combo">${img('llama', 'mini')} ¡${G.combo} seguidas!</div>` : ''}
    <p class="consigna">${CONSIGNAS[r.tipo]}</p>${htmlReto(r)}</main>
    <footer class="veredicto" id="veredicto"></footer>`;
  activarReto(r);
  if (G.k === 0 && !(E.tour && E.tour.juego)) setTimeout(() => recorrido('juego'), 300);
  if (r.tipo === 'elige-es' || r.tipo === 'oye' || r.tipo === 'frase-es') setTimeout(() => decir(r.item.decir || r.item.en), 250);
  window.scrollTo(0, 0);
}
function htmlReto(r) {
  const w = r.item;
  const opc = (campo, sonar) => `<div class="opciones">${r.opciones.map((o, k) =>
    `<button class="opcion" data-k="${k}" ${sonar ? `data-sonar="${esc(o.decir || o.en)}"` : ''}>${esc(o[campo])}</button>`).join('')}</div>`;
  switch (r.tipo) {
    case 'elige-es': return `<div class="enunciado-reto">${img('oveja-feliz', 'guia')}<div class="globo">
        <div class="grande">${esc(w.en)} ${bocina(w.decir)}</div><div class="pr">(${pron(w.pr)})</div></div></div>${opc('es')}`;
    case 'elige-en': return `<div class="enunciado-reto">${img('oveja-feliz', 'guia')}<div class="globo"><div class="grande es">${esc(w.es)}</div></div></div>${opc('en', true)}`;
    case 'oye': return `<div class="oir"><button class="voz-grande" data-decir="${esc(w.decir)}" aria-label="Escuchar">${img('altavoz')}<span>🔊</span></button>
        <button class="voz-lenta chip" data-lento="${esc(w.decir)}">🐢 más despacio</button></div>${opc('en')}`;
    case 'escribe': return `<div class="enunciado-reto">${img('oveja-feliz', 'guia')}<div class="globo"><div class="grande es">${esc(w.es)}</div>
        <button class="chip pista" data-decir="${esc(w.decir)}">🔊 oír la palabra</button></div></div>
        <input id="escrito" class="escrito" enterkeyhint="done" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Escribe en inglés">
        <button class="boton ancho" id="comprobar">Comprobar</button>`;
    case 'frase-es': return `<div class="enunciado-reto">${img('oveja-feliz', 'guia')}<div class="globo"><div class="grande">${esc(w.en)} ${bocina(w.en)}</div></div></div>${opc('es')}`;
    case 'arma': return `<div class="enunciado-reto">${img('oveja-feliz', 'guia')}<div class="globo"><div class="grande es">${esc(w.es)}</div></div></div>
        <div class="armada" id="armada"></div>
        <div class="fichas" id="fichas">${r.fichas.map((f, k) => `<button class="ficha" data-k="${k}">${esc(f)}</button>`).join('')}</div>
        <button class="boton ancho" id="comprobar" disabled>Comprobar</button>`;
    case 'habla': return `<div class="enunciado-reto">${img('oveja-feliz', 'guia')}<div class="globo">
        <div class="grande">${esc(w.en)} ${bocina(w.decir || w.en)}</div>${w.pr ? `<div class="pr">(${pron(w.pr)})</div>` : ''}
        <div class="es chica">${esc(w.es)}</div></div></div>
        <div class="microfono"><button class="mic" id="mic" aria-label="Hablar">🎤</button><p class="mic-estado" id="mic-estado">Escúchala, luego toca el micrófono y dila</p></div>
        <div class="dicho" id="dicho"></div>
        <button class="chip saltar-mic" id="sin-mic">Ahora no puedo hablar</button>`;
    case 'parejas': {
      const izq = barajar(r.items.map((w, k) => ({ k, t: w.en, d: w.decir })));
      const der = barajar(r.items.map((w, k) => ({ k, t: w.es })));
      return `<div class="parejas"><div class="col">${izq.map(o => `<button class="par" data-lado="en" data-k="${o.k}" data-sonar="${esc(o.d)}">${esc(o.t)}</button>`).join('')}</div>
        <div class="col">${der.map(o => `<button class="par" data-lado="es" data-k="${o.k}">${esc(o.t)}</button>`).join('')}</div></div>`;
    }
  }
  return '';
}
function activarReto(r) {
  document.querySelectorAll('[data-lento]').forEach(b => b.onclick = () => {
    const v = E.velocidad; E.velocidad = Math.max(0.5, v - 0.3); decir(b.dataset.lento); E.velocidad = v;
  });
  if (r.opciones) document.querySelectorAll('.opcion').forEach(b => b.onclick = () => {
    if (G.respondido) return;
    if (b.dataset.sonar) decir(b.dataset.sonar);
    const o = r.opciones[+b.dataset.k];
    const ok = normal(o.en) === normal(r.item.en);
    b.classList.add(ok ? 'bien' : 'mal');
    if (!ok) document.querySelectorAll('.opcion').forEach(x => normal(r.opciones[+x.dataset.k].en) === normal(r.item.en) && x.classList.add('bien'));
    responder(r, ok);
  });
  if (r.tipo === 'escribe') {
    const inp = $('#escrito');
    setTimeout(() => inp.focus(), 50);
    const comprobar = () => { if (G.respondido || !inp.value.trim()) return; const ok = correcta(inp.value, r.item.en + (/^to \S+$/i.test(r.item.en) ? ' | ' + r.item.en.slice(3) : '')); inp.classList.add(ok ? 'bien' : 'mal'); inp.disabled = true; responder(r, ok); };
    $('#comprobar').onclick = comprobar;
    inp.onkeydown = ev => { if (ev.key === 'Enter') { ev.preventDefault(); comprobar(); } };
  }
  if (r.tipo === 'arma') {
    const armada = $('#armada'), btn = $('#comprobar');
    const actualizar = () => { btn.disabled = !armada.children.length; };
    document.querySelectorAll('.ficha').forEach(f => f.onclick = () => {
      if (G.respondido) return;
      SON.toque();
      (f.parentElement === armada ? $('#fichas') : armada).appendChild(f);
      actualizar();
    });
    btn.onclick = () => {
      if (G.respondido) return;
      const dicho = [...armada.children].map(f => f.textContent).join(' ');
      const ok = normal(dicho) === normal(palabrasDe(r.item.en).join(' '));
      armada.classList.add(ok ? 'bien' : 'mal');
      responder(r, ok);
    };
  }
  if (r.tipo === 'habla') activarHabla(r);
  if (r.tipo === 'parejas') {
    let sel = null, hechas = 0, fallos = 0;
    document.querySelectorAll('.par').forEach(b => b.onclick = () => {
      if (b.classList.contains('hecha')) return;
      if (b.dataset.sonar) decir(b.dataset.sonar); else SON.toque();
      if (!sel || sel.dataset.lado === b.dataset.lado) {
        if (sel) sel.classList.remove('sel');
        sel = b; b.classList.add('sel'); return;
      }
      const a = sel; sel = null; a.classList.remove('sel');
      const wa = r.items[+a.dataset.k], wb = r.items[+b.dataset.k];
      if (a.dataset.k === b.dataset.k || normal(wa.es) === normal(wb.es)) {
        [a, b].forEach(x => x.classList.add('hecha')); hechas++;
        tono([660 + hechas * 80], 0.08);
        if (hechas === r.items.length) setTimeout(() => responder(r, fallos === 0, true), 300);
      } else {
        fallos++; G.errores++; G.vidas--; G.combo = 0; SON.mal();
        [wa, wb].forEach(w => { if (E.libreta[w.en]) { E.libreta[w.en].mal++; guardar(); } });
        [a, b].forEach(x => { x.classList.add('error'); setTimeout(() => x.classList.remove('error'), 500); });
        const v = $('.vidas'); if (v) v.outerHTML = barraJuego().match(/<span class="vidas"[\s\S]*?<\/span>/)[0];
        if (G.vidas <= 0) setTimeout(pantallaSinVidas, 600);
      }
    });
  }
}
// Hablar: no cuesta corazones. Se puede repetir; tras tres intentos fallidos se sigue adelante sin el acierto.
function activarHabla(r) {
  let intentos = 0, ocupado = false, miAudio = null;
  const mic = $('#mic'), est = $('#mic-estado'), dicho = $('#dicho');
  const ESTADOS = { escuchando: 'Te escucho…', procesando: 'Revisando…', repite: 'Dilo otra vez, por favor' };
  const ERRORES = { permiso: 'La app necesita permiso para usar el micrófono. Actívalo y vuelve a intentar.',
    nada: 'No te oí. Toca el micrófono y habla cerca del teléfono.', red: 'Sin conexión: el reconocimiento de voz de este equipo necesita internet.',
    otro: 'No pude escucharte esta vez. Inténtalo de nuevo.',
    idioma: 'Tu teléfono está descargando el inglés para entender tu voz. Espera un minuto (con internet) y vuelve a intentar.' };
  const sonar = url => { callar(); sonando = new Audio(url); sonando.play().catch(() => {}); };
  const botones = () => `<div class="comparar"><button class="chip" data-decir="${esc(r.item.decir || r.item.en)}">🔊 Voz nativa</button>
    ${miAudio ? '<button class="chip" id="mi-voz">▶ Tu voz</button>' : ''}</div>`;
  const ponerBotones = () => { const b = $('#mi-voz'); if (b) b.onclick = () => sonar(miAudio); };
  mic.onclick = async () => {
    if (ocupado || G.respondido) return;
    ocupado = true; intentos++;
    callar(); mic.classList.add('oyendo'); est.textContent = 'Preparando el micrófono…'; dicho.innerHTML = '';
    const res = await Hablar.escuchar(e => { est.textContent = ESTADOS[e] || est.textContent; if (e === 'procesando') mic.classList.remove('oyendo'); });
    mic.classList.remove('oyendo'); ocupado = false;
    if (G.retos[G.k] !== r) return; // el alumno ya salió de este reto
    if (res.audio) miAudio = res.audio;
    if (res.error && !res.alternativas.length) {
      est.textContent = ERRORES[res.error] || ERRORES.otro;
      dicho.innerHTML = miAudio ? botones() : ''; ponerBotones();
      return;
    }
    const ev = Hablar.evaluar(r.item.en, res.alternativas);
    const esp = ev.esp.length === ev.marcas.length ? ev.esp : ev.marcas.map((_, k) => '…');
    dicho.innerHTML = `<p class="frase-marcada">${esp.map((w, k) => `<span class="${ev.marcas[k] ? 'ok' : 'no'}">${esc(w)}</span>`).join(' ')}</p>
      <p class="oido">Entendí: «${esc(ev.dicho || res.alternativas[0].t)}»</p>${botones()}`;
    ponerBotones();
    if (ev.bien) { est.textContent = '¡Se te entendió!'; responder(r, true); return; }
    SON.mal();
    est.textContent = intentos < 3 ? 'Casi. Escucha la voz nativa, compárala con la tuya y vuelve a intentar.' : 'Sigue practicándola en voz alta. Pasemos a la siguiente.';
    if (intentos >= 3) siguienteSinAcierto(r);
  };
  $('#sin-mic').onclick = () => {
    E.sinMicHasta = Date.now() + 3600e3; guardar();
    // Se quitan los retos de hablar que quedan en esta ronda.
    G.retos = G.retos.filter((x, k) => k <= G.k || x.tipo !== 'habla');
    siguienteSinAcierto(r, 'Está bien. Por una hora no te pediré hablar.');
  };
}
function siguienteSinAcierto(r, msj) {
  G.respondido = true; G.combo = 0;
  const v = $('#veredicto');
  v.className = 'veredicto neutro';
  v.innerHTML = `<div class="msj">${img('oveja-feliz', 'cara')}<div><h3>${esc(msj || 'Practícala en voz alta')}</h3>
    <p>${respuestaTexto(r)}</p></div></div><button class="boton ancho" id="continuar">Continuar</button>`;
  $('#continuar').onclick = () => { G.respondido = false; G.k++; mostrarReto(); };
}
function respuestaTexto(r) {
  const w = r.item;
  if (r.tipo === 'elige-es' || r.tipo === 'frase-es') return `<b>${esc(w.en)}</b> = ${esc(w.es)}`;
  return `<b>${esc(w.en)}</b>${w.pr ? ` <span class="pr">(${pron(w.pr)})</span>` : ''} = ${esc(w.es)}`;
}
function responder(r, ok, parejas) {
  G.respondido = true;
  if (ok) {
    G.combo++; G.comboMax = Math.max(G.comboMax, G.combo); G.aciertos++;
    G.xp += (parejas ? XP_ACIERTO * 2 : XP_ACIERTO) + (G.combo >= 3 ? XP_COMBO : 0);
    SON.bien();
    if (r.item && r.tipo !== 'oye' && r.tipo !== 'elige-en') setTimeout(() => decir(r.item.decir || r.item.en), 350);
  } else if (!parejas) {
    G.errores++; G.vidas--; G.combo = 0; SON.mal();
    G.retos.push(Object.assign({}, r, r.opciones ? { opciones: barajar(r.opciones) } : {}, r.fichas ? { fichas: barajar(r.fichas) } : {}));
    if (r.item) setTimeout(() => decir(r.item.decir || r.item.en), 400);
  }
  if (r.item && E.libreta[r.item.en]) { E.libreta[r.item.en][ok ? 'bien' : 'mal']++; guardar(); }
  const v = $('#veredicto');
  v.className = 'veredicto ' + (ok ? 'bien' : 'mal');
  v.innerHTML = `<div class="msj">${img(ok ? 'oveja-feliz' : 'oveja-triste', 'cara')}<div>
      <h3>${ok ? ELOGIOS[Math.random() * ELOGIOS.length | 0] : parejas ? 'Lo lograste, con algún tropiezo' : 'Casi. La respuesta es:'}</h3>
      ${r.item ? `<p>${respuestaTexto(r)}</p>` : ''}</div></div>
    <button class="boton ancho" id="continuar">Continuar</button>`;
  const b = $('#continuar');
  b.focus();
  b.onclick = () => { G.respondido = false; G.k++; mostrarReto(); };
}

// ---------- Final de la ronda ----------
function estrellasDe(errores) { return errores === 0 ? 3 : errores <= 2 ? 2 : 1; }
function htmlEstrellas(n, cls = '') { return `<div class="estrellas ${cls}">${[1, 2, 3].map(k => img(k <= n ? 'estrella' : 'estrella-vacia', k <= n ? 'llena' : '')).join('')}</div>`; }
function pantallaFinal() {
  const est = estrellasDe(G.errores);
  let xp = G.xp + XP_PASO;
  let titulo = '¡Repaso terminado!', texto = 'Las palabras que más te cuestan saldrán más seguido. Vuelve mañana para no perder la racha.';
  let sig = '#/', etiqueta = 'Volver al inicio';
  if (G.modo === 'paso') {
    const { l, p, i } = G, st = estLec(l.n);
    const nuevo = !st.hechos[p.id];
    if (!nuevo) xp = Math.round(xp / 2); // repetir un paso ya hecho da la mitad
    marcarHecho(l, p); anotarPalabras(l, p);
    st.estrellas = st.estrellas || {};
    st.estrellas[p.id] = Math.max(st.estrellas[p.id] || 0, est);
    titulo = est === 3 ? '¡Paso dominado, sin un error!' : '¡Paso superado!';
    texto = est === 3 ? 'Así se aprende: cada palabra, bien sabida.'
      : 'Repasa en voz alta las que fallaste. Puedes volver a jugar este paso cuando quieras para ganar las tres estrellas.';
    const siguiente = i + 1 < l.pasos.length && pasoAbierto(l, i + 1);
    sig = siguiente ? `#/l/${l.n}/p/${i + 1}` : `#/l/${l.n}`;
    etiqueta = siguiente ? 'Siguiente paso ›' : 'Volver a la lección';
  }
  const nAntes = nivel(E.xp);
  ganarXP(xp);
  const subio = nivel(E.xp) > nAntes;
  const total = G.aciertos + G.errores;
  SON.fin();
  app().innerHTML = `<main class="final">${img('oveja-fiesta', 'mascota')}
    ${G.modo === 'paso' ? htmlEstrellas(est, 'grandes') : ''}
    <h2>${titulo}</h2><p>${esc(texto)}</p>
    <div class="cifras">
      <div>${img('pan', 'ico')}<b>+${xp}</b><small>puntos</small></div>
      <div>🎯<b>${total ? Math.round(G.aciertos / total * 100) : 100}%</b><small>precisión</small></div>
      <div>${img('llama', 'ico')}<b>${rachaActual()}</b><small>${rachaActual() === 1 ? 'día seguido' : 'días seguidos'}</small></div>
    </div>
    ${subio ? `<div class="subida">¡Subiste al nivel ${nivel(E.xp)} · ${nombreNivel(nivel(E.xp))}!</div>` : ''}
    <button class="boton ancho" id="seguir">${etiqueta}</button></main>`;
  $('#seguir').onclick = () => ir(sig);
  window.scrollTo(0, 0);
}
function pantallaSinVidas() {
  G.respondido = true;
  const repasar = G.modo === 'paso' ? G.salir : '#/libreta';
  app().innerHTML = `<main class="final">${img('oveja-triste', 'mascota')}
    <h2>Te quedaste sin corazones</h2>
    <p>No pasa nada: es la señal de que este paso necesita otro repaso. Vuelve a estudiarlo <b>en voz alta</b>, sin prisa, y juega otra vez. Así lo pide el método: no avanzar hasta dominarlo.</p>
    <button class="boton ancho" id="repasar">Repasar el paso</button>
    <button class="boton sec ancho" id="otra">Jugar otra vez</button></main>`;
  $('#repasar').onclick = () => ir(repasar);
  $('#otra').onclick = () => (G.modo === 'paso' ? pJuego(G.l.n, G.i) : pRepaso());
}

// ---------- Ayuda para las pruebas automáticas ----------
// Resuelve bien el reto actual a través de la interfaz (lo usa herramientas/probar.mjs).
window.JUEGO_PRUEBA = {
  estado: () => G && { k: G.k, total: G.retos.length, vidas: G.vidas, tipo: G.retos[G.k] && G.retos[G.k].tipo },
  acertar() {
    const r = G.retos[G.k];
    if (r.opciones) document.querySelector(`.opcion[data-k="${r.opciones.findIndex(o => normal(o.en) === normal(r.item.en))}"]`).click();
    else if (r.tipo === 'escribe') { $('#escrito').value = r.item.en; $('#comprobar').click(); }
    else if (r.tipo === 'arma') {
      for (const w of palabrasDe(r.item.en)) [...document.querySelectorAll('#fichas .ficha')].find(f => normal(f.textContent) === normal(w)).click();
      $('#comprobar').click();
    } else if (r.tipo === 'habla') responder(r, Hablar.evaluar(r.item.en, [{ t: r.item.en, c: 1 }]).bien);
    else if (r.tipo === 'parejas') r.items.forEach((_, k) => {
      document.querySelector(`.par[data-lado="en"][data-k="${k}"]`).click();
      document.querySelector(`.par[data-lado="es"][data-k="${k}"]`).click();
    });
  },
  fallar() {
    const r = G.retos[G.k];
    if (r.opciones) document.querySelector(`.opcion[data-k="${r.opciones.findIndex(o => normal(o.en) !== normal(r.item.en))}"]`).click();
    else if (r.tipo === 'escribe') { $('#escrito').value = 'zzz'; $('#comprobar').click(); }
    else if (r.tipo === 'arma') { $('#fichas .ficha').click(); $('#comprobar').click(); }
    else return false;
    return true;
  },
};
