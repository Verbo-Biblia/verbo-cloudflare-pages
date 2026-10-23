// Motor del curso. Las lecciones se registran con LECCION({...}) desde lecciones/leccion-XX.js.
// Rutas: #/ (inicio) · #/l/N (lección) · #/l/N/p/I (paso) · #/l/N/p/I/juego · #/repaso · #/libreta · #/guia
'use strict';

const LECCIONES = [];
function LECCION(l) { LECCIONES[l.n] = l; }

const APROBAR = 0.9;            // fracción mínima de aciertos para aprobar un examen
const CLAVE = 'ingles-biblia-v1';

// ---------- Estado guardado ----------
const E = cargar();
function cargar() {
  let d = null;
  try { d = JSON.parse(localStorage.getItem(CLAVE)); } catch (e) {}
  return Object.assign({ lec: {}, libreta: {}, libre: false, velocidad: 0.85, xp: 0, racha: { n: 0, dia: null }, sonido: true }, d || {});
}
function guardar() { try { localStorage.setItem(CLAVE, JSON.stringify(E)); } catch (e) {} }
function estLec(n) { return E.lec[n] || (E.lec[n] = { hechos: {}, examen: null }); }
// Modo revisión (Juan y su esposa): todo abierto y sin compra. Solo en el navegador y en el APK de depuración;
// la versión de Play (release) va con el curso real: pasos en orden, exámenes y compra.
const REVISION = location.protocol === 'file:' || !!(window.Android && Android.revision && Android.revision());
const libre = () => REVISION || E.libre || /[?&]libre\b/.test(location.search);

// ---------- Utilidades ----------
const $ = (s, r = document) => r.querySelector(s);
const app = () => $('#app');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// Marcado mínimo en textos: **negrita**, *cursiva*, párrafos con línea en blanco.
function md(s) {
  return String(s).split(/\n\s*\n/).map(p => '<p>' + esc(p.trim())
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*(.+?)\*/g, '<i>$1</i>')
    .replace(/\n/g, '<br>') + '</p>').join('');
}
// Pronunciación figurada: mayúscula = débil, SH = sh, ë = th suave.
function pron(p) {
  let h = '';
  for (let i = 0; i < p.length; i++) {
    const c = p[i];
    if (c === 'S' && p[i + 1] === 'H') { h += '<b class="sh">sh</b>'; i++; }
    else if (c === 'ë') h += '<span class="dz" title="th suave">d</span>';
    else if (c === 'þ') h += '<span class="dz" title="th fuerte">z</span>';
    else if (/[A-Z]/.test(c)) h += '<span class="debil">' + c.toLowerCase() + '</span>';
    else h += esc(c);
  }
  return h;
}
function quitarTildes(s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, ''); }
// Contracciones (lección 8): se comparan desarmadas. El 's solo tras pronombres, para no tocar el posesivo.
const CONTRACCIONES = [[/\bwon't\b/g, 'will not'], [/\bcan't\b/g, 'can not'], [/n't\b/g, ' not'], [/\bi'm\b/g, 'i am'],
  [/'re\b/g, ' are'], [/'ve\b/g, ' have'], [/'ll\b/g, ' will'], [/'d\b/g, ' would'],
  [/\b(it|he|she|that|there|what|who|where|here)'s\b/g, '$1 is']];
function normal(s) {
  let t = String(s).toLowerCase().replace(/[’‘`´]/g, "'");
  for (const [re, x] of CONTRACCIONES) t = t.replace(re, x);
  return quitarTildes(t).replace(/to-day/g, 'today').replace(/to-morrow/g, 'tomorrow')
    .replace(/to-night/g, 'tonight').replace(/[¿?¡!.,;:()"«»]/g, ' ').replace(/\s+/g, ' ').trim();
}
// El pronombre sujeto se puede omitir en español. Se quita antes de borrar las tildes: «Él» sí, el artículo «El» no.
const PRONOMBRES = /^(yo|tú|él|ella|nosotros|nosotras|ellos|ellas|usted|ustedes) /;
const sinPronombre = s => String(s).trim().toLowerCase().replace(/^[¿¡]/, '').replace(PRONOMBRES, '');
// Femenino y masculino plural valen igual cuando la clave no distingue (they = ellos o ellas).
const genero = s => s.replace(/\bnosotras\b/g, 'nosotros').replace(/\bellas\b/g, 'ellos');
// ¿La respuesta coincide con alguna variante de la clave? Variantes: «a | b»; en palabras sueltas, «a; b» o «a, b».
function correcta(resp, clave) {
  if (!normal(resp)) return false;
  const rs = new Set([normal(resp), normal(sinPronombre(resp))].map(genero));
  const variantes = [];
  for (const v of String(clave).split('|')) {
    variantes.push(v);
    // «;» separa acepciones; la coma solo cuando separa palabras sueltas (en una frase es puntuación).
    const trozos = v.split(/[;,]/).map(x => x.replace(/\(.*?\)/g, '').trim());
    if (/;/.test(v) || (trozos.length > 1 && trozos.every(x => !/\s/.test(x)))) v.split(/[;,]/).forEach(x => variantes.push(x));
  }
  return variantes.some(v => {
    const k = v.replace(/\(.*?\)/g, '');
    return normal(k) && [normal(k), normal(sinPronombre(k))].some(x => rs.has(genero(x)));
  });
}

// ---------- Voz ----------
let vozEn = null;
function elegirVoz() {
  const vs = (window.speechSynthesis && speechSynthesis.getVoices()) || [];
  vozEn = vs.find(v => /^en[-_]US/i.test(v.lang)) || vs.find(v => /^en/i.test(v.lang)) || null;
}
if (window.speechSynthesis) { elegirVoz(); speechSynthesis.onvoiceschanged = elegirVoz; }
// Primero el audio grabado (app/audio, ver herramientas/audios.sh); si no hay, la voz del teléfono o del navegador.
let sonando = null;
const hayAudio = t => typeof AUDIOS !== 'undefined' && !!AUDIOS[normal(t)];
function callar() { if (sonando) { sonando.pause(); sonando = null; } if (window.speechSynthesis) speechSynthesis.cancel(); }
function decir(texto) {
  if (hayAudio(texto)) {
    callar();
    sonando = new Audio('audio/' + AUDIOS[normal(texto)] + '.mp3');
    sonando.playbackRate = Math.max(0.5, E.velocidad / 0.85);
    sonando.preservesPitch = true;
    sonando.play().catch(() => {});
    return;
  }
  if (window.Android && Android.decir) { Android.decir(texto, E.velocidad); return; } // puente nativo (APK)
  if (!window.speechSynthesis) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(texto);
  u.lang = 'en-US'; u.rate = E.velocidad; if (vozEn) u.voice = vozEn;
  speechSynthesis.speak(u);
}
// En los exámenes y ejercicios, «Enter» (o «Siguiente» en el teclado del teléfono) pasa a la respuesta siguiente.
document.addEventListener('keydown', ev => {
  if (ev.key !== 'Enter' || !ev.target.matches('.item input')) return;
  ev.preventDefault();
  const todos = [...document.querySelectorAll('.item input')];
  const sig = todos[todos.indexOf(ev.target) + 1];
  if (sig) sig.focus(); else ev.target.blur();
});
document.addEventListener('click', ev => {
  const b = ev.target.closest('[data-decir]');
  if (b) { ev.stopPropagation(); decir(b.dataset.decir); }
});
const bocina = t => `<button class="voz" data-decir="${esc(t)}" aria-label="Escuchar">🔊</button>`;

// ---------- Curso completo (compra única de Google Play) ----------
// Las primeras GRATIS lecciones son libres; el resto se abre con una sola compra («curso_completo» en Play Console).
// Los revisores de Google entran con un código (solo se guarda su SHA-256; el código está en MK-KEYSTORE-BACKUP/efata).
const GRATIS = 5;
const CODIGOS = new Set(['93b0f753a4cb3bea988a77358219dcb22d52a6982cc30076d5b8b74ddaf7ec21']);
const tienda = () => window.Android && Android.comprado ? Android : null;
// Versión web (verbobiblia.com/juegos/efata/jugar/): solo trae las lecciones gratis; las demás se ofrecen en la app de
// Android. La marca la pone el script de publicación (window.EFATA_WEB) y el enlace sale de window.EFATA_PLAY.
const WEB = !!window.EFATA_WEB && !tienda();
const PLAY = window.EFATA_PLAY || 'https://play.google.com/store/apps/details?id=com.verbobiblia.ingles';
const comprado = () => REVISION || !!E.codigo || !!(tienda() && tienda().comprado());
const dePago = n => n > GRATIS && !comprado();
async function canjear(codigo) {
  const datos = new TextEncoder().encode(String(codigo).trim().toUpperCase());
  const hex = [...new Uint8Array(await crypto.subtle.digest('SHA-256', datos))].map(b => b.toString(16).padStart(2, '0')).join('');
  if (!CODIGOS.has(hex)) return false;
  E.codigo = true; guardar(); return true;
}
// La app nativa avisa así cuando cambia la compra (comprada, pendiente, precio).
window.compraCambio = () => { if (/^#\/(comprar)?$/.test(location.hash || '#/') || location.hash === '') render(); };
function pComprar() {
  window.scrollTo(0, 0);
  const t = tienda(), precio = (t && t.precio()) || '2,99 USD';
  const pendiente = t && t.pendiente();
  app().innerHTML = cabecera('Curso completo', '#/') + `<main class="hoja comprar">
    ${img('oveja-fiesta', 'mascota')}
    <h2>Sigue hasta el final</h2>
    ${comprado() ? `<p class="texto"><b>¡Ya tienes el curso completo!</b> Todas las lecciones están abiertas. Gracias por apoyar este proyecto.</p>
      <a class="boton ancho" href="#/">Volver al camino</a>` : `
    <div class="texto">${md(`Las lecciones 1 a ${GRATIS} son gratis. Con **una sola compra de ${precio}** se abren las lecciones ${GRATIS + 1} a 11: las horas, los pronombres, cómo negar y preguntar, cómo hacer más verbos con los 16 que ya sabes y el vocabulario completo, con el examen final.\n\nNo es una suscripción: pagas una vez y el curso es tuyo, también si cambias de teléfono.`)}</div>
    ${pendiente ? '<p class="aviso-ej">Tu pago está pendiente. Cuando Google Play lo confirme, las lecciones se abrirán solas.</p>' : ''}
    ${WEB ? `<a class="boton ancho" href="${PLAY}"${/^https?:/.test(PLAY) ? ' target="_blank" rel="noopener"' : ''}>Descargar Efatá para Android${/^https?:/.test(PLAY) ? ' ↗' : ''}</a>
      <p class="texto">En la web puedes hacer gratis las lecciones 1 a ${GRATIS}. Las lecciones ${GRATIS + 1} a 11 están en la app de Android, con una sola compra.</p>`
    : t ? `<button class="boton ancho" id="comprar">Comprar el curso completo · ${esc(precio)}</button>
      <button class="boton sec ancho" id="restaurar">Ya lo compré: restaurar</button>`
      : '<p class="texto">La compra se hace desde la app Efatá de Google Play.</p>'}
    ${WEB ? '' : `<details class="ajustes" open><summary>Tengo un código</summary>
      <label>Código <input id="codigo" autocomplete="off" autocapitalize="characters" spellcheck="false"></label>
      <button class="boton sec" id="canjear">Canjear</button><p id="codigo-res"></p></details>`}`}
    </main>`;
  const b = $('#comprar'); if (b) b.onclick = () => { if (!t.comprar()) $('#codigo-res').textContent = 'Google Play no responde ahora. Inténtalo en un momento.'; };
  const r = $('#restaurar'); if (r) r.onclick = () => t.revisar();
  const c = $('#canjear'); if (c) c.onclick = async () => {
    if (await canjear($('#codigo').value)) render(); else $('#codigo-res').textContent = 'Ese código no es válido.';
  };
}

// ---------- Progreso ----------
// Una lección se abre cuando la anterior está dominada: examen aprobado y, después, su perfeccionamiento hecho.
function abierta(n) {
  if (dePago(n)) return false;
  if (n === 1 || libre()) return true;
  const st = E.lec[n - 1], ant = LECCIONES[n - 1];
  const perf = ant && ant.pasos.find(p => p.tipo === 'perfeccionamiento');
  return !!(st && st.examen && st.examen.aprobado && (!perf || st.hechos[perf.id]));
}
function pasoAbierto(l, i) {
  if (libre()) return true;
  const p = l.pasos[i], st = estLec(l.n);
  if (p.tipo === 'perfeccionamiento' || p.tipo === 'versiculo') return !!(st.examen && st.examen.aprobado);
  for (let j = 0; j < i; j++) {
    const q = l.pasos[j];
    if (q.tipo !== 'perfeccionamiento' && q.tipo !== 'versiculo' && !st.hechos[q.id]) return false;
  }
  return true;
}
function marcarHecho(l, p) { estLec(l.n).hechos[p.id] = true; guardar(); }
function anotarPalabras(l, p) {
  for (const b of (p.bloques || []).concat(p.palabras ? [{ t: 'palabras', v: p.palabras }] : [])) {
    const lista = b.t === 'palabras' ? b.v : b.t === 'grupo' ? b.palabras : null;
    if (!lista) continue;
    for (const w of lista) if (!E.libreta[w[0]]) E.libreta[w[0]] = { en: w[0], pr: w[1], es: w[2], l: l.n, bien: 0, mal: 0 };
  }
  guardar();
}

// ---------- Pantallas ----------
function ir(ruta) { location.replace(ruta); }

function cabecera(titulo, atras) {
  return `<header class="barra">${atras ? `<a class="atras" href="${atras}" aria-label="Volver">‹</a>` : '<span></span>'}
    <h1>${esc(titulo)}</h1><span></span></header>`;
}

// Las 11 lecciones del libro. Las que aún no están escritas se muestran en el camino, bloqueadas.
const PLAN = [, null,
  ['Los 16 verbos', 'Meses y días, pronombres, los 16 verbos, el presente y el futuro con will.'],
  ['Would, may y might', 'The, palabras parecidas, condicional, plurales, -tion, números, -ly.'],
  ['El pasado', 'Ordinales, el pasado de los 16 verbos, do y make, -ed, to have.'],
  ['Ser y estar', 'Plurales irregulares, to be, -er y -or, lo que está pasando ahora.'],
  ['Las horas', 'Imperativo, expresiones con it is, las horas, this y that, el prefijo un-.'],
  ['Pronombres', 'Me, him, us; here y there; some y any; posesivos y reflexivos.'],
  ['Comparar y negar', 'El clima, más y menos que, la negación en todos los tiempos.'],
  ['Preguntar', 'Preguntas con do, did y will; who, where, when, what, why, how.'],
  ['Verbos sin verbos nuevos', 'Give, have, make, get y keep combinados; preposiciones; participios.'],
  ['Todo el vocabulario', 'Pronunciación difícil, el alfabeto y las 850 palabras, con el examen final.'],
];
// Estrellas ganadas en una lección y máximo posible (3 por cada paso que se juega).
function estrellasLeccion(l) {
  const st = estLec(l.n), jugables = l.pasos.filter(tieneJuego);
  return [jugables.reduce((s, p) => s + ((st.estrellas || {})[p.id] || 0), 0), jugables.length * 3];
}
function pInicio() {
  const ls = LECCIONES.filter(Boolean);
  const actual = (ls.find(l => abierta(l.n) && !(E.lec[l.n] && E.lec[l.n].examen && E.lec[l.n].examen.aprobado)) || {}).n;
  // El camino: una parada por lección, en zigzag, con su medalla.
  const todas = PLAN.map((x, n) => LECCIONES[n] || (x && { n, titulo: x[0], resumen: x[1], pasos: [], falta: true })).filter(Boolean);
  const paradas = todas.map((l, k) => {
    const st = estLec(l.n), ab = abierta(l.n) && !l.falta;
    const ex = st.examen, [est, max] = estrellasLeccion(l);
    const hechos = l.pasos.filter(p => st.hechos[p.id]).length;
    const estado = ex && ex.aprobado ? `<span class="sello">✓ Aprobada · ${Math.round(ex.nota * 100)}%</span>`
      : ab ? `<span class="avance">${hechos} de ${l.pasos.length} pasos</span>`
      : dePago(l.n) ? `<span class="candado">🔒 Curso completo · toca para abrirlo</span>` : `<span class="candado">🔒 Bloqueada · aprueba la lección ${l.n - 1}</span>`;
    return `<a class="parada ${k % 2 ? 'der' : 'izq'} ${ab ? '' : 'cerrada'} ${l.n === actual ? 'actual' : ''}" ${ab ? `href="#/l/${l.n}"` : dePago(l.n) ? 'href="#/comprar"' : ''}>
      <div class="medalla">${img('l' + String(l.n).padStart(2, '0'), 'med')}<span class="num">${l.n}</span>
        ${ab ? '' : img('candado', 'cand')}</div>
      <div class="info"><h2>${esc(l.titulo)}</h2><p>${esc(l.resumen)}</p>
        ${ab && max ? `<span class="mini-est">${img('estrella', 'ico')} ${est}/${max}</span>` : ''}${estado}</div></a>
      ${img(k % 2 ? 'olivo' : 'palmera', 'adorno ' + (k % 2 ? 'izq' : 'der'))}`;
  }).join('');
  const nPal = Object.keys(E.libreta).length, nv = nivel(E.xp);
  const avanceNivel = (E.xp - xpNivel(nv)) / (xpNivel(nv + 1) - xpNivel(nv));
  const hoy = E.hoyDia === diaStr(new Date()) ? E.hoyXP || 0 : 0;
  app().innerHTML = `
    <header class="portada">${img('fondo-portada', 'paisaje dia')}${img('fondo-noche', 'paisaje noche')}
      ${img('nube', 'nube n1')}${img('nube', 'nube n2')}
      <div class="marca">${img('logo', 'logo')}<h1>Efatá</h1><p>Inglés con la Biblia</p></div></header>
    <section class="tablero">
      <div class="cifra">${img('llama', 'ico')}<b>${rachaActual()}</b><small>racha</small></div>
      <div class="cifra">${img('pan', 'ico')}<b>${E.xp || 0}</b><small>puntos</small></div>
      <div class="cifra nivel"><b>Nivel ${nv}</b><small>${nombreNivel(nv)}</small>
        <div class="progreso"><div style="width:${Math.round(avanceNivel * 100)}%"></div></div></div>
    </section>
    <div class="meta">Meta de hoy: <b>${Math.min(hoy, META_DIA)}/${META_DIA}</b> puntos ${hoy >= META_DIA ? '✓' : ''}
      <div class="progreso"><div style="width:${Math.min(100, hoy / META_DIA * 100)}%"></div></div></div>
    <nav class="atajos">
      ${nPal >= 4 ? `<a class="boton" href="#/repaso">${img('cofre', 'ico')} Repaso del día</a>` : ''}
      <a class="boton sec" href="#/libreta">${img('pergamino', 'ico')} Mi libreta <small>${nPal}</small></a>
      <a class="boton sec" href="#/guia">🗣 Pronunciación</a>
    </nav>
    <main class="camino">${paradas}</main>
    <details class="ajustes"><summary>Ajustes</summary>
      <label>Velocidad de la voz <input type="range" id="vel" min="0.5" max="1.2" step="0.05" value="${E.velocidad}"></label>
      <label class="chk"><input type="checkbox" id="sonido" ${E.sonido ? 'checked' : ''}> Sonidos del juego</label>
      <label class="chk"><input type="checkbox" id="hablar" ${E.hablar !== false ? 'checked' : ''}> Retos de hablar (usa el micrófono)</label>
      <label class="chk"><input type="checkbox" id="libre" ${E.libre ? 'checked' : ''}> Abrir todas las lecciones sin examen
        <small>(el método pide no avanzar sin dominar cada lección)</small></label>
      <button class="boton sec" id="ver-intro">Ver la introducción otra vez</button>
      ${comprado() ? '' : WEB ? '<a class="boton sec" href="#/comprar">Lecciones 6 a 11 en Android</a>' : '<a class="boton sec" href="#/comprar">Tengo un código de desbloqueo</a>'}
      <div class="acerca">${img('verbo.png', 'verbo-chico')}<div><b>Efatá · Inglés con la Biblia</b><br><b>Un proyecto de Verbo</b> · verbobiblia.com</div></div>
    </details>`;
  $('#vel').oninput = e => { E.velocidad = +e.target.value; guardar(); };
  $('#sonido').onchange = e => { E.sonido = e.target.checked; guardar(); };
  $('#hablar').onchange = e => { E.hablar = e.target.checked; E.sinMicHasta = 0; guardar(); };
  $('#libre').onchange = e => { E.libre = e.target.checked; guardar(); render(); };
  $('#ver-intro').onclick = () => { E.tour = {}; guardar(); pBienvenida(0); };
  if (E.bienvenida && !(E.tour && E.tour.inicio)) setTimeout(() => recorrido('inicio'), 400);
  const act = $('.parada.actual');
  if (act && location.hash.length < 3 && window.scrollY === 0) setTimeout(() => act.scrollIntoView({ block: 'center' }), 50);
}

function pLeccion(n) {
  window.scrollTo(0, 0);
  const l = LECCIONES[n];
  if (!l || !abierta(n)) return ir('#/');
  const st = estLec(n);
  const pasos = l.pasos.map((p, i) => {
    const ab = pasoAbierto(l, i), ok = st.hechos[p.id], est = (st.estrellas || {})[p.id];
    return `<a class="paso ${ab ? '' : 'cerrada'} ${ok ? 'hecho' : ''}" ${ab ? `href="#/l/${n}/p/${i}"` : ''}>
      <span class="marca">${ok ? '✓' : ab ? i + 1 : '🔒'}</span><span class="nombre">${esc(p.titulo)}</span>
      ${tieneJuego(p) && ok ? htmlEstrellas(est || 0, 'chicas') : ''}${p.tipo === 'examen' ? '<span class="etiqueta">examen</span>' : ''}</a>`;
  }).join('');
  app().innerHTML = cabecera(`Lección ${n}`, '#/') + `<main class="hoja">
    <div class="cabeza-lec">${img('l' + String(n).padStart(2, '0'), 'med')}<h2 class="titulo-lec">${esc(l.titulo)}</h2></div>
    ${l.intro ? md(l.intro) : ''}${img('ornamento', 'ornamento')}<div class="pasos">${pasos}</div></main>`;
}

function pPaso(n, i) {
  const l = LECCIONES[n], p = l && l.pasos[i];
  if (!p || !abierta(n) || !pasoAbierto(l, i)) return ir(`#/l/${n}`);
  const sig = i + 1 < l.pasos.length ? `#/l/${n}/p/${i + 1}` : `#/l/${n}`;
  let cuerpo = '';
  if (p.tipo === 'examen') cuerpo = htmlExamen(l, p);
  else if (p.tipo === 'perfeccionamiento') cuerpo = htmlBloques(p.bloques, true);
  else if (p.tipo === 'versiculo') cuerpo = htmlVersiculo(p);
  else cuerpo = htmlBloques(p.bloques);
  // Los pasos con palabras o frases se dominan jugando; los demás, con el botón de siempre.
  const est = (estLec(n).estrellas || {})[p.id];
  const pie = p.tipo === 'examen' ? '' : tieneJuego(p)
    ? `<footer class="pie"><button class="boton jugar" id="jugar">▶ ${estLec(n).hechos[p.id] ? 'Jugar otra vez' : '¡A jugar!'}
        ${est ? htmlEstrellas(est, 'chicas') : ''}</button></footer>`
    : `<footer class="pie"><button class="boton" id="listo">${esc(p.boton || 'Ya lo domino ✓')}</button></footer>`;
  app().innerHTML = cabecera(`Lección ${n} · ${i + 1}/${l.pasos.length}`, `#/l/${n}`) +
    `<main class="hoja"><h2>${esc(p.titulo)}</h2>${cuerpo}</main>${pie}`;
  activarBloques();
  if (p.tipo === 'examen') activarExamen(l, p);
  if ($('.hoja .ejercicio')) {
    if (estLec(n).hechos[p.id]) document.querySelectorAll('#listo, #jugar').forEach(b => b.dataset.yaHecho = '1');
    else $('.pie').insertAdjacentHTML('afterbegin', '<p class="aviso-ej">Primero haz el ejercicio y compruébalo: necesitas el 90 %.</p>');
    revisarEjercicios();
  }
  const j = $('#jugar');
  if (j) j.onclick = () => ir(`#/l/${n}/p/${i}/juego`);
  if (j && $('.palabra')) setTimeout(() => recorrido('paso'), 500);
  const b = $('#listo');
  if (b) b.onclick = () => {
    marcarHecho(l, p); anotarPalabras(l, p);
    // Entre pasos se reemplaza la entrada del historial: «atrás» vuelve siempre a la lista de la lección.
    ir(i + 1 >= l.pasos.length || pasoAbierto(l, i + 1) ? sig : `#/l/${n}`);
  };
  window.scrollTo(0, 0);
}

// ---------- Bloques de estudio ----------
function htmlPalabra(w) {
  const op = w[3] || {};
  return `<div class="palabra"><div class="en">${esc(w[0])} ${bocina(op.decir || w[0])}</div>
    <div class="pr">(${pron(w[1])})${op.alt ? ` <span class="alt">o (${pron(op.alt)})</span>` : ''}</div>
    <div class="es">${esc(w[2])}</div></div>`;
}
function htmlFrase(f, practica) {
  return `<div class="frase ${practica ? 'practica' : ''}"><div class="en">${esc(f[0])} ${bocina(f[0])}</div>
    <div class="es">${esc(f[1])}</div></div>`;
}
function htmlNota(id) {
  const n = FONETICA[id];
  if (!n) return '';
  const ej = (n.ejemplos || []).map(e => `<div class="ej"><b>${esc(e[0])}</b> ${bocina(e[0])} (${pron(e[1])}) · ${esc(e[2])}${e[3] ? `<br><small>${esc(e[3])}</small>` : ''}</div>`).join('');
  return `<aside class="nota"><h3>🗣 ${esc(n.titulo)}</h3>${md(n.texto)}${ej}</aside>`;
}
function htmlBloques(bloques, practica) {
  let h = '';
  for (const b of bloques || []) {
    if (b.t === 'texto') h += `<div class="texto">${md(b.v)}</div>`;
    else if (b.t === 'nota') h += htmlNota(b.v);
    else if (b.t === 'palabras') h += `${ocultadores()}<div class="palabras">${b.v.map(htmlPalabra).join('')}</div>`;
    else if (b.t === 'frases') h += `${ocultadores(practica)}<div class="frases">${b.v.map(f => htmlFrase(f, practica)).join('')}</div>`;
    else if (b.t === 'biblia') h += `${ocultadores(practica)}<div class="frases biblia">${b.v.map(v => `<div class="frase verso">
      <div class="en">${esc(v[0])} ${bocina(v[0])}</div><div class="es">${esc(v[1])}</div><div class="cita">📖 ${esc(v[2])}</div></div>`).join('')}</div>`;
    else if (b.t === 'grupo') h += `<div class="grupo"><div class="palabras">${b.palabras.map(htmlPalabra).join('')}</div>
      <div class="frases">${b.frases.map(f => htmlFrase(f)).join('')}</div></div>`;
    else if (b.t === 'preguntas') h += b.v.map(q => `<details class="pregunta"><summary><b>Pregunta:</b> ${esc(q[0])}</summary>
      <p><b>Respuesta:</b> ${esc(q[1])}</p></details>`).join('');
    else if (b.t === 'ejercicio') h += htmlEjercicio(b);
    else if (b.t === 'tabla') h += htmlTabla(b);
  }
  return h;
}
function ocultadores(practica) {
  return `<div class="ocultar"><span>Tapar:</span>
    <button class="chip" data-tapar="en">inglés</button><button class="chip ${practica ? 'activo' : ''}" data-tapar="es">español</button></div>`;
}
function htmlTabla(b) {
  // Tabla de conjugación: {t:'tabla', titulo, filas:[[en, es], ...]}
  return `<div class="tabla"><h3>${esc(b.titulo)}</h3>${b.filas.map(f => `<div class="fila"><span class="en">${esc(f[0])} ${bocina(f[0])}</span><span class="es">${esc(f[1])}</span></div>`).join('')}</div>`;
}
function htmlEjercicio(b) {
  // {t:'ejercicio', id, enunciado, items:[[pregunta, clave], ...]}
  return `<div class="ejercicio" data-ej="${esc(b.id)}"><p class="enunciado">${esc(b.enunciado)}</p>
    ${b.items.map((it, k) => `<label class="item"><span class="q">${k + 1}. ${esc(it[0])}</span>
      <input enterkeyhint="next" autocomplete="off" autocapitalize="off" spellcheck="false" data-clave="${esc(it[1])}">
      <span class="clave"></span></label>`).join('')}
    <button class="boton sec comprobar">Comprobar</button></div>`;
}
function activarBloques() {
  document.querySelectorAll('.ocultar').forEach(o => {
    const cont = o.nextElementSibling;
    o.querySelectorAll('[data-tapar]').forEach(btn => {
      const aplicar = () => cont.classList.toggle('tapar-' + btn.dataset.tapar, btn.classList.contains('activo'));
      aplicar();
      btn.onclick = () => { btn.classList.toggle('activo'); aplicar(); };
    });
    cont.addEventListener('click', ev => {
      const it = ev.target.closest('.palabra, .frase');
      if (it && !ev.target.closest('.voz')) it.classList.toggle('ver');
    });
  });
  document.querySelectorAll('.ejercicio .comprobar').forEach(btn => btn.onclick = () => {
    const ej = btn.closest('.ejercicio');
    ej.querySelectorAll('input').forEach(inp => corregir(inp));
    ej.classList.add('corregido');
    revisarEjercicios();
  });
}
// Un paso con ejercicios no se da por dominado hasta hacerlos bien («hasta no fallar», dice el libro): 90 %.
function revisarEjercicios() {
  const ejs = [...document.querySelectorAll('.hoja .ejercicio')];
  const ok = ejs.every(ej => { const its = [...ej.querySelectorAll('.item')]; return ej.classList.contains('corregido')
    && its.filter(i => i.classList.contains('bien')).length >= its.length * APROBAR; });
  document.querySelectorAll('#listo, #jugar').forEach(b => {
    if (b.dataset.yaHecho) return;
    b.disabled = !ok;
    const av = $('.aviso-ej'); if (av) av.hidden = ok;
  });
}
document.addEventListener('cambio', () => document.querySelector('.hoja .ejercicio') && revisarEjercicios());
function corregir(inp) {
  const ok = correcta(inp.value, inp.dataset.clave);
  const item = inp.closest('.item');
  item.classList.toggle('bien', ok); item.classList.toggle('mal', !ok);
  // Preguntas de teoría: no se adivina el texto exacto; el alumno compara con la respuesta modelo y se califica.
  item.querySelector('.clave').innerHTML = ok ? '✓' : inp.dataset.abierta
    ? `Respuesta modelo: ${esc(inp.dataset.clave.split('|')[0].trim())} <button class="chip yo" type="button">Dije lo mismo con otras palabras</button>`
    : `${esc(inp.dataset.clave.split('|')[0].trim())} <button class="chip yo" type="button">La mía también vale</button>`;
  const yo = item.querySelector('.yo');
  if (yo) yo.onclick = () => { item.classList.remove('mal'); item.classList.add('bien', 'propia'); yo.remove(); item.dispatchEvent(new Event('cambio', { bubbles: true })); };
  return ok;
}

// ---------- Examen ----------
// Un examen repite primero los de todas las lecciones anteriores y luego trae sus partes nuevas.
function partesExamen(l) {
  const partes = [], propio = l.pasos.find(p => p.tipo === 'examen');
  // El examen final (lección 11) no repite los anteriores, y el autoexamen de la 10 los repasa de memoria: así lo hace el libro.
  for (let n = 1; n < (propio.sinRepaso || propio.repasoMental ? 0 : l.n); n++) {
    const ex = LECCIONES[n] && LECCIONES[n].pasos.find(p => p.tipo === 'examen');
    if (ex) ex.partes.forEach(pt => partes.push(Object.assign({ repaso: n }, pt)));
  }
  l.pasos.find(p => p.tipo === 'examen').partes.forEach(pt => partes.push(pt));
  return partes;
}
// Tandas: una por cada examen anterior (repaso) y la última con lo nuevo. Se corrigen una a una, pero la nota
// es la de todo el examen.
function tandasExamen(l) {
  const tandas = [];
  for (const pt of partesExamen(l)) {
    const t = pt.repaso || 0;
    if (!tandas.length || tandas[tandas.length - 1].repaso !== t) tandas.push({ repaso: t, partes: [] });
    tandas[tandas.length - 1].partes.push(pt);
  }
  return tandas;
}
function htmlExamen(l, p) {
  const tandas = tandasExamen(l);
  let h = `<div class="texto">${md(p.intro)}</div>`;
  if (tandas.length > 1) h += `<div class="texto">${md(`El examen va en **${tandas.length} tandas**: primero se repiten los exámenes de las lecciones anteriores, como pide el libro (unos cinco minutos cada uno), y al final viene lo nuevo. Para aprobar necesitas el 90 % en todo el examen **y también en la tanda nueva**.`)}</div>`;
  // Autoexamen (lección 10): primero se repasan de memoria los exámenes y perfeccionamientos anteriores.
  if (p.repasoMental) h += `<div class="repaso-mental"><p><b>Repaso de memoria.</b> Antes de escribir, recorre mentalmente el examen y el perfeccionamiento de cada lección. Marca cada una cuando la domines sin mirar:</p>
    ${LECCIONES.filter(x => x && x.n < l.n).map(x => `<label class="chk"><input type="checkbox" class="rm"> Lección ${x.n}: ${esc(x.titulo)} · <a href="#/l/${x.n}">abrir</a></label>`).join('')}</div>`;
  h += `<div class="tandas-barra">${tandas.map((t, k) => `<span class="tanda-pt" data-t="${k}">${t.repaso ? 'L' + t.repaso : 'Nuevo'}</span>`).join('')}</div>`;
  tandas.forEach((t, k) => {
    h += `<div class="tanda" data-t="${k}" ${k ? 'hidden' : ''}><h3 class="${t.repaso ? 'repaso-tit' : 'nuevo'}">${t.repaso
      ? `Tanda ${k + 1} de ${tandas.length} · Repaso del examen de la lección ${t.repaso}` : `Tanda ${k + 1} de ${tandas.length} · Examen de la lección ${l.n}`}</h3>`;
    for (const pt of t.partes) h += `<section class="parte"><h4>${t.repaso ? `L${t.repaso} · ` : ''}${esc(pt.letra)}) ${esc(pt.enunciado)}</h4>${pt.items.map((it, j) =>
      `<label class="item"><span class="q">${j + 1}. ${esc(it[0])}</span>
        <input enterkeyhint="next" autocomplete="off" autocapitalize="off" spellcheck="false" data-clave="${esc(it[1])}"${pt.abierta ? ' data-abierta="1"' : ''}>
        <span class="clave"></span></label>`).join('')}</section>`;
    h += `<div class="tanda-pie"></div><button class="boton ancho comprobar-tanda">${k + 1 < tandas.length ? 'Comprobar esta tanda' : 'Comprobar y ver mi nota'}</button></div>`;
  });
  const ant = estLec(l.n).examen;
  h += `<div class="resultado" id="resultado">${ant ? `Último intento: ${Math.round(ant.nota * 100)}% ${ant.aprobado ? '· aprobado' : ''}` : ''}</div>`;
  return h;
}
function activarExamen(l, p) {
  const tandas = [...document.querySelectorAll('.tanda')];
  const rm = [...document.querySelectorAll('.rm')];
  if (rm.length) {
    const ver = () => document.querySelectorAll('.comprobar-tanda').forEach(b => { b.disabled = !rm.every(c => c.checked); });
    rm.forEach(c => c.onchange = ver); ver();
  }
  const marcar = k => document.querySelectorAll('.tanda-pt').forEach((x, j) => { x.classList.toggle('activa', j === k); x.classList.toggle('lista', j < k); });
  marcar(0);
  const calcular = () => {
    const items = [...document.querySelectorAll('.parte .item')];
    const bien = items.filter(i => i.classList.contains('bien')).length;
    // La tanda nueva también tiene que llegar al mínimo: si no, los repasos taparían lo que no se domina.
    const nuevos = [...tandas[tandas.length - 1].querySelectorAll('.parte .item')];
    const notaNueva = nuevos.length ? nuevos.filter(i => i.classList.contains('bien')).length / nuevos.length : 1;
    const minimo = p.aprobar || APROBAR;
    const nota = bien / items.length, aprobado = nota >= minimo && notaNueva >= minimo;
    // Lo que falló va a la libreta para el «Repaso del día».
    items.filter(i => i.classList.contains('mal')).forEach(i => {
      const q = i.querySelector('.q').textContent.replace(/^\d+\.\s*/, '').trim();
      const w = E.libreta[q] || Object.values(E.libreta).find(x => normal(x.es.split(';')[0]) === normal(q));
      if (w) w.mal = (w.mal || 0) + 1;
    });
    const st = estLec(l.n), primeraVez = aprobado && !(st.examen && st.examen.aprobado);
    st.examen = { nota, aprobado: aprobado || !!(st.examen && st.examen.aprobado), fecha: Date.now() };
    if (aprobado) st.hechos[p.id] = true;
    guardar();
    if (primeraVez) { ganarXP(XP_EXAMEN); SON.fin(); }
    const errores = items.length - bien;
    $('#resultado').innerHTML = aprobado
      ? `<div class="final-examen">${img('oveja-fiesta', 'mascota')}<h3>¡Aprobado! ${bien} de ${items.length}</h3>
        ${primeraVez ? `<p class="premio">${img('pan', 'ico')} +${XP_EXAMEN} puntos</p>` : ''}${md(p.aprobado)}<a class="boton ancho" href="#/l/${l.n}">Seguir</a></div>`
      : `<div class="final-examen">${img('oveja-triste', 'mascota')}<h3>${errores} errores · ${bien} de ${items.length}</h3>
        ${nota >= minimo ? `<p>El repaso salió bien, pero en lo nuevo de esta lección lograste ${Math.round(notaNueva * 100)} %: hace falta ${Math.round(minimo * 100)} %.</p>` : ''}
        ${md(p.reprobado)}<p>Como pide el libro, repasa la lección (sobre todo los pasos donde fallaste) y vuelve a hacer el examen.</p>
        <a class="boton ancho" href="#/l/${l.n}">Repasar la lección</a>
        <button class="boton sec ancho" id="otra-vez">Hacer el examen otra vez</button></div>`;
    const ov = $('#otra-vez'); if (ov) ov.onclick = () => render();
  };
  tandas.forEach((t, k) => {
    const btn = t.querySelector('.comprobar-tanda');
    btn.onclick = () => {
      if (!t.classList.contains('corregida')) {
        t.querySelectorAll('.parte input').forEach(corregir);
        t.classList.add('corregida');
        const its = [...t.querySelectorAll('.item')], b = its.filter(i => i.classList.contains('bien')).length;
        t.querySelector('.tanda-pie').innerHTML = `<p class="nota-tanda"><b>${b} de ${its.length}</b> en esta tanda. Estudia cada error antes de seguir.</p>`;
        if (k + 1 < tandas.length) { btn.textContent = 'Siguiente tanda ›'; return; }
        btn.remove(); calcular();
        return $('#resultado').scrollIntoView({ behavior: 'smooth' });
      }
      t.hidden = true; tandas[k + 1].hidden = false; marcar(k + 1);
      window.scrollTo(0, 0);
      const primero = tandas[k + 1].querySelector('input'); if (primero) primero.focus({ preventScroll: true });
    };
  });
  recalcular = () => { if (tandas.every(t => t.classList.contains('corregida'))) calcular(); };
}
let recalcular = null;
document.addEventListener('cambio', () => recalcular && document.querySelector('.parte') && recalcular());

// ---------- Versículo ----------
function htmlVersiculo(p) {
  return `<div class="texto">${md(p.texto)}</div>${img('paloma', 'paloma')}<figure class="versiculo">
    <blockquote lang="en">${esc(p.en)} ${bocina(p.en)}</blockquote>
    <blockquote class="es">${esc(p.es)}</blockquote>
    <figcaption>${esc(p.cita)} · <i>Bible in Basic English</i>${p.rv ? ' y <i>Reina-Valera 1909</i>' : ''}</figcaption></figure>
    ${p.palabras ? `<p class="texto">Palabras nuevas del versículo:</p><div class="palabras">${p.palabras.map(htmlPalabra).join('')}</div>` : ''}`;
}

// ---------- Libreta ----------
function pLibreta() {
  const ws = Object.values(E.libreta);
  const porLec = {};
  ws.forEach(w => (porLec[w.l] = porLec[w.l] || []).push(w));
  const lista = Object.keys(porLec).map(n => `<h3>Lección ${n}</h3><div class="palabras compacta">${porLec[n].map(w =>
    htmlPalabra([w.en, w.pr, w.es])).join('')}</div>`).join('');
  app().innerHTML = cabecera('Mi libreta', '#/') + `<main class="hoja">
    <div class="texto">${md('Aquí se anota cada palabra que estudias, con su pronunciación y su traducción. Repásala en los ratos libres del día: en la fila, en el autobús, antes de dormir. Cada palabra, sabida a la perfección.')}</div>
    ${ws.length >= 4 ? `<div class="atajos"><a class="boton" href="#/repaso">${img('cofre', 'ico')} Repaso jugando</a></div>` : ''}
    ${ws.length ? `<p class="texto">O con tarjetas, a tu ritmo:</p><div class="atajos"><button class="boton sec" id="rep-en">Inglés → español</button><button class="boton sec" id="rep-es">Español → inglés</button></div>
      <div id="tarjeta"></div>${lista}` : '<p class="vacio">Todavía no hay palabras. Empieza la lección 1.</p>'}</main>`;
  if (ws.length) { $('#rep-en').onclick = () => repasar(ws, 'en'); $('#rep-es').onclick = () => repasar(ws, 'es'); }
}
function repasar(ws, dir) {
  // Primero las que más se fallan.
  const w = ws.slice().sort((a, b) => (b.mal - b.bien) - (a.mal - a.bien) + Math.random() - 0.5)[0];
  const frente = dir === 'en' ? `<div class="en">${esc(w.en)} ${bocina(w.en)}</div>` : `<div class="es grande">${esc(w.es)}</div>`;
  const dorso = dir === 'en' ? `<div class="pr">(${pron(w.pr)})</div><div class="es">${esc(w.es)}</div>`
    : `<div class="en">${esc(w.en)} ${bocina(w.en)}</div><div class="pr">(${pron(w.pr)})</div>`;
  $('#tarjeta').innerHTML = `<div class="flash">${frente}<div class="dorso oculto">${dorso}</div>
    <div class="atajos"><button class="boton sec" id="ver">Ver respuesta</button></div></div>`;
  $('#tarjeta').scrollIntoView({ behavior: 'smooth' });
  $('#ver').onclick = () => {
    $('.flash .dorso').classList.remove('oculto');
    $('.flash .atajos').innerHTML = '<button class="boton sec" id="mal">No la sabía</button><button class="boton" id="bien">La sabía</button>';
    $('#bien').onclick = () => { w.bien++; guardar(); repasar(ws, dir); };
    $('#mal').onclick = () => { w.mal++; guardar(); repasar(ws, dir); };
  };
}

// ---------- Guía ----------
function pGuia() {
  app().innerHTML = cabecera('Pronunciación', '#/') + `<main class="hoja">
    <div class="texto">${md('Todas las indicaciones de pronunciación del curso, juntas. Dentro de las lecciones aparecen cuando llega la primera palabra que las necesita.')}</div>
    ${Object.keys(FONETICA).map(htmlNota).join('')}</main>`;
}

// ---------- Rutas ----------
function render() {
  callar();
  const capa = document.querySelector('.tour'); if (capa) { capa.remove(); tourActivo = null; }
  if (!E.bienvenida && !/[?&]libre\b/.test(location.search)) return pBienvenida(0);
  const h = location.hash.replace(/^#\/?/, '').split('/');
  if (h[0] === 'l' && h[2] === 'p' && h[4] === 'juego') pJuego(+h[1], +h[3]);
  else if (h[0] === 'l' && h[2] === 'p') pPaso(+h[1], +h[3]);
  else if (h[0] === 'repaso') pRepaso();
  else if (h[0] === 'l') pLeccion(+h[1]);
  else if (h[0] === 'libreta') pLibreta();
  else if (h[0] === 'guia') pGuia();
  else if (h[0] === 'comprar') pComprar();
  else pInicio();
}
window.addEventListener('hashchange', render);
// Al abrir la app: pantalla de arranque con la marca de Verbo (como en las demás apps de Verbo). Se salta tocándola.
function arranque() {
  if (sessionStorage.getItem('arranque') || /[?&]libre\b/.test(location.search)) return render();
  try { sessionStorage.setItem('arranque', '1'); } catch (e) {}
  const capa = document.createElement('div');
  capa.className = 'arranque';
  capa.innerHTML = `<div class="arranque-app">${img('logo', 'arranque-logo')}<h1>Efatá</h1><p>Inglés con la Biblia</p></div>
    <div class="arranque-verbo">${img('verbo.png', 'verbo-logo')}<div class="verbo-lema">Un proyecto de Verbo</div><div class="verbo-web">verbobiblia.com</div></div>`;
  document.body.appendChild(capa);
  render();
  let fuera = false;
  const quitar = () => { if (fuera) return; fuera = true; capa.classList.add('fuera'); setTimeout(() => capa.remove(), 500); };
  capa.onclick = quitar;
  setTimeout(quitar, 2600);
}
window.addEventListener('DOMContentLoaded', arranque);
