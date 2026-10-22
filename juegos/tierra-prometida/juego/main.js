import { CARTAS, MAZOS, listaMazo, textoReglas, TERMINOS_BASE, TERMINOS_BASE_EN } from '../nucleo/cartas.js';
import {
  nuevaPartida, jugarCarta, esDiferida, pasarAtaque, declararAtaque, cancelarPlan, enPlan, objetivosPlaneados, resolverSiguiente, terminarTurno,
  puedeJugar, objetivosDeCarta, objetivosDeAtaque, atacantesListos, buscarUnidad, ataqueDe, def,
} from '../nucleo/reglas.js';
import { siguienteAccionIA, PERSONALIDADES } from '../nucleo/ia.js';
import { cargarTema, listaTemas } from './tema.js';
import { Tablero } from './tablero.js';
import { dibujarCarta } from './carta-dibujo.js';
import { ICONOS } from './iconos.js';
import { t, idioma } from './idioma.js';
import { iniciarMundo, ir, ocultarMundo } from './mundo.js';
import { sonar, sonarEventos, sonidoActivo, alternarSonido } from './sonido.js';
import { musica, cierre, alCambiarSonido } from './musica.js';

const $ = s => document.querySelector(s);
const NOMBRES_MAZO = { equilibrado: 'Equilibrado', constructor: 'Constructor', agresivo: 'Agresivo', saqueador: 'Saqueador' };
const guardar = (k, v) => { try { localStorage.setItem('baseCartas.' + k, v); } catch {} };
const leer = (k, d) => { try { return localStorage.getItem('baseCartas.' + k) || d; } catch { return d; } };

let tema = null, tablero = null, st = null;
let rivalPers = 'equilibrada';
let modo = null;          // null | { tipo: 'carta', uid, objetivos } | { tipo: 'ataque', uid, objetivos }
let ocupado = false;      // la máquina está jugando o hay una animación que esperar
let temporizador = null;

// ---------- temática y mundo ----------

let partidaActual = null; // { mazo, rival, regla, alTerminar } de la partida en curso

async function aplicarTema(id) {
  tema = await cargarTema(id);
  guardar('tema', id);
  document.title = tema.datos.titulo;
  adaptarReglas();
}

// «Cómo se juega» está escrito con los términos genéricos de cada idioma; aquí se muestra el bloque del idioma
// actual, se ponen los nombres de cartas de la temática y se cambian los términos (recolectores → obreros del campo…).
let reglasOriginales = null;
function adaptarReglas() {
  const lang = idioma();
  for (const el of document.querySelectorAll('[data-t]')) el.textContent = t(el.dataset.t);
  const caja = $('#reglas .caja');
  reglasOriginales ??= caja.innerHTML;
  const molde = document.createElement('div');
  molde.innerHTML = reglasOriginales;
  for (const b of molde.querySelectorAll('[data-idioma]')) b.hidden = b.dataset.idioma !== lang;
  for (const c of molde.querySelectorAll('[data-carta]')) c.textContent = tema.info(c.dataset.carta).nombre || c.textContent;
  const T = tema.terminos, B = lang === 'en' ? TERMINOS_BASE_EN : TERMINOS_BASE;
  const minus = x => x.charAt(0).toLowerCase() + x.slice(1);
  const plural = lang === 'en'
    ? x => x.replace(/(\w+)$/, w => /s$/.test(w) ? w : /y$/.test(w) ? w.slice(0, -1) + 'ies' : w + 's')
    : x => { const [p0, ...r] = x.split(' '); const p1 = /[aeiouáéó]$/i.test(p0) ? p0 + 's' : /ón$/.test(p0) ? p0.replace(/ón$/, 'ones') : /s$/.test(p0) ? p0 : p0 + 'es'; return [p1, ...r].join(' '); };
  const cambios = [
    [plural(minus(B.recolector)), plural(minus(T.recolector))], [minus(B.recolector), minus(T.recolector)],
    [B.trabajadores, T.trabajadores], [B.combatientes, T.combatientes], [B.combatiente, T.combatiente],
    [B.estructuras, T.estructuras], [B.estructura, T.estructura], [B.aldea, T.aldea], [B.fortaleza, T.fortaleza],
    [B.muralla, T.muralla], [B.frente, T.frente], [B.recursos, T.recursos],
    [plural(minus(B.efecto)), plural(minus(T.efecto))], [plural(minus(B.maldicion)), plural(minus(T.maldicion))],
  ];
  let html = molde.innerHTML;
  if (lang === 'es') {
    // Artículos que dependen del género del término (la aldea → el campamento).
    const art = x => /a$/i.test(x.split(' ')[0]) ? 'la' : 'el';
    html = html.replace(/\bla aldea\b/g, `${art(T.aldea)} ${T.aldea}`).replace(/\bla muralla\b/g, `${art(T.muralla)} ${T.muralla}`)
      .replace(/\bla fortaleza\b/g, `${art(T.fortaleza)} ${T.fortaleza}`).replace(/\bde el\b/g, 'del').replace(/\ba el\b/g, 'al');
  }
  for (const [de, a] of cambios) {
    if (!a || !de || a === de) continue;
    // Solo texto visible (no dentro de etiquetas); respeta la mayúscula inicial.
    const mayus = de.charAt(0).toUpperCase() + de.slice(1);
    html = html.replace(new RegExp(`(?<=>[^<]*)\\b(${de}|${mayus})\\b`, 'g'),
      m => m[0] === m[0].toUpperCase() ? a.charAt(0).toUpperCase() + a.slice(1) : a);
  }
  caja.innerHTML = html;
  $('#cerrarReglas').onclick = () => $('#reglas').classList.add('oculto');
}

async function iniciar() {
  const temas = await listaTemas();
  const elegido = temas.includes(leer('tema', '')) ? leer('tema', '') : temas[0];
  await aplicarTema(elegido);
  const abrirMundo = () => iniciarMundo({
    tema, temas, jugar: empezarPartida,
    alCambiarTema: async id => { await aplicarTema(id); abrirMundo(); },
  });
  abrirMundo();
  $('#cerrarReglas').onclick = () => $('#reglas').classList.add('oculto');
  if (!leer('vioReglas', '')) { $('#reglas').classList.remove('oculto'); guardar('vioReglas', '1'); }
}

function cerrarMesa() {
  clearTimeout(temporizador);
  if (tablero) { tablero.destruir(); tablero = null; }
  st = null; modo = null; ocupado = false;
  $('#juego').classList.add('oculto');
  $('#final').classList.add('oculto');
}

// ✕ o Esc durante la partida: se sale sin resultado (no cuenta como derrota).
function volverAlMenu() {
  cerrarMesa();
  partidaActual = null;
  ir('pueblo');
}

// La lanza el mundo (campaña o arena). Al terminar, llama a alTerminar(gano).
async function empezarPartida(opciones) {
  partidaActual = opciones;
  rivalPers = opciones.rival;
  tema.rivalActual = rivalPers; // cada nación rival puede tener sus propios nombres e imágenes
  await tema.cargarNacion(rivalPers);
  musica('partida');
  ocultarMundo();
  $('#reglas').classList.add('oculto');
  $('#final').classList.add('oculto');
  $('#juego').classList.remove('oculto');
  $('#registro').innerHTML = '';
  if (tablero) tablero.destruir();
  tablero = new Tablero($('#mesa'), tema);
  tablero.alClic = clic;
  tablero.alHover = mostrarVista;
  st = nuevaPartida({
    mazos: [opciones.mazo, listaMazo(MAZOS[PERSONALIDADES[rivalPers].mazo])],
    nombres: [t('tu'), tema.nombreRival(rivalPers)],
    empieza: Math.random() < 0.5 ? 0 : 1,
    regla: opciones.regla || {},
  });
  modo = null; ocupado = false;
  procesar();
}

function terminarYVolver() {
  const gano = st?.ganador === 0;
  const fin = partidaActual?.alTerminar;
  cerrarMesa();
  partidaActual = null;
  if (fin) fin(gano); else ir('pueblo');
}

// ---------- ciclo ----------

function procesar() {
  const eventos = st.eventos;
  st.eventos = [];
  tablero.sync(st, eventos);
  const dur = tablero.animar(eventos, st);
  sonarEventos(eventos);
  for (const e of eventos) registrar(e);
  actualizarHUD();
  if (st.ganador !== null) {
    clearTimeout(temporizador);
    temporizador = setTimeout(mostrarFinal, 1400);
    return dur;
  }
  if (st.turno === 1) {
    ocupado = true;
    clearTimeout(temporizador);
    temporizador = setTimeout(turnoMaquina, dur * 1000 + 450);
  } else {
    ocupado = false;
    resaltarEstado();
  }
  // Después de decidir de quién es el turno: si no, al volver a tu turno los botones quedaban apagados.
  actualizarHUD();
  return dur;
}

// Resuelve la cola de ataque del jugador paso a paso, para que se vea cada golpe.
function resolverJugador(terminarAlFinal) {
  ocupado = true;
  actualizarHUD();
  const paso = () => {
    if (!st || st.ganador !== null) return;
    if (resolverSiguiente(st)) {
      const dur = procesar();
      ocupado = true; actualizarHUD(); tablero.resaltar({});
      temporizador = setTimeout(paso, dur * 1000 + 300);
      return;
    }
    ocupado = false;
    if (terminarAlFinal) { terminarTurno(st); procesar(); }
    else { actualizarHUD(); resaltarEstado(); aviso(t('ataqueTerminado')); }
  };
  paso();
}

function turnoMaquina() {
  if (!st || st.turno !== 1 || st.ganador !== null) return;
  const a = siguienteAccionIA(st, 1, rivalPers);
  let ok = false;
  if (!a) return;
  if (a.tipo === 'jugar') ok = jugarCarta(st, 1, a.uid, a.objetivo);
  else if (a.tipo === 'planAtaque') { for (const x of a.ataques) declararAtaque(st, x.uid, x.objetivo); ok = pasarAtaque(st); }
  else if (a.tipo === 'resolver') ok = resolverSiguiente(st);
  else if (a.tipo === 'terminar') ok = terminarTurno(st);
  if (!ok) terminarTurno(st); // nunca debería pasar; evita que la partida se trabe
  procesar();
}

// ---------- entrada del jugador ----------

function coincide(objetivos, h) {
  if (!h) return null;
  return objetivos.find(o =>
    (o.tipo === 'unidad' && (h.tipo === 'unidad') && o.uid === h.uid) ||
    (o.tipo === 'muralla' && h.tipo === 'muralla' && h.j === 1) ||
    (o.tipo === 'fortaleza' && h.tipo === 'fortaleza' && h.j === 1)) || null;
}

function clic(h) {
  if (!st || ocupado || st.turno !== 0 || st.ganador !== null) return;

  // Efectos y maldiciones sin objetivo: el segundo toque sobre la misma carta la usa.
  if (modo?.tipo === 'confirmar') {
    const misma = h?.tipo === 'mano' && h.uid === modo.uid;
    const uid = modo.uid;
    modo = null; aviso(''); resaltarEstado();
    if (misma) { jugarCarta(st, 0, uid); procesar(); return; }
  }

  if (modo) {
    const o = coincide(modo.objetivos, h);
    if (o) {
      if (modo.tipo === 'carta') jugarCarta(st, 0, modo.uid, o);
      else declararAtaque(st, modo.uid, o);
      modo = null;
      aviso('');
      procesar();
      return;
    }
    // tocó fuera de los objetivos: se cancela, y el mismo clic puede elegir otra carta o atacante
    modo = null;
    aviso('');
    resaltarEstado();
  }

  if (!h) return;
  if (st.fase === 'preparacion' && h.tipo === 'mano' && h.j === 0) {
    const c = st.jugadores[0].mano.find(x => x.uid === h.uid);
    if (!puedeJugar(st, 0, h.uid)) { sonar('error'); aviso(motivoNoJugable(c)); return; }
    const objs = objetivosDeCarta(st, 0, c.id);
    const d = CARTAS[c.id];
    const unSoloUso = d.tipo === 'efecto' || d.tipo === 'maldicion';
    if (!objs && unSoloUso) {
      modo = { tipo: 'confirmar', uid: h.uid };
      aviso(t('tocaOtraVez', nombreCarta(c.id), textoReglas(d, tema.terminos), esDiferida(c.id) ? t('prepararla') : t('usarla')));
      tablero.resaltar({ seleccion: h.uid });
      return;
    }
    if (!objs) { jugarCarta(st, 0, h.uid); procesar(); return; }
    modo = { tipo: 'carta', uid: h.uid, objetivos: objs };
    aviso(t('objetivoCarta', nombreCarta(c.id)));
    tablero.resaltar({ objetivos: objs, seleccion: h.uid });
    return;
  }
  if (st.fase === 'preparacion' && h.tipo === 'efecto' && h.j === 0 && enPlan(st, h.uid)) {
    cancelarPlan(st, h.uid);
    aviso(t('vuelveMano', nombreCarta(h.id)));
    procesar();
    return;
  }
  if (st.fase === 'preparacion' && h.tipo === 'unidad' && h.j === 0 && def(h.id).tipo === 'combatiente') {
    if (enPlan(st, h.uid)) { cancelarPlan(st, h.uid); aviso(t('ataqueQuitado')); procesar(); return; }
    const objs = objetivosPlaneados(st, 0, h.uid);
    if (!objs.length) { aviso(t('noPuedeAtacar')); return; }
    modo = { tipo: 'ataque', uid: h.uid, objetivos: objs.map(o => ({ ...o, j: 1 })) };
    aviso(t('eligeAtaque', nombreCarta(h.id)));
    tablero.resaltar({ objetivos: modo.objetivos, seleccion: h.uid });
  }
}

function motivoNoJugable(c) {
  const d = CARTAS[c.id];
  const p = st.jugadores[0];
  const T = tema.terminos;
  if (d.tipo === 'recolector' && p.recolectoresJugados >= 1 && p.aldea.length < 6) return t('unRecolector', T.recolector.toLowerCase());
  if (d.costo > p.recursos) return t('faltanRecursos', d.costo - p.recursos, T.recursos);
  if (d.tipo === 'combatiente' && p.frente.length >= 5) return t('frenteLleno', T.frente);
  if ((d.tipo === 'recolector' || d.tipo === 'constructor') && p.aldea.length >= 6) return t('aldeaLlena', T.aldea);
  if (d.tipo === 'estructura' && p.estructuras.length >= 3) return t('sinEspacio', T.estructuras);
  return t('sinObjetivo');
}

function resaltarEstado() {
  if (!st || st.turno !== 0) { tablero.resaltar({}); return; }
  if (st.fase === 'preparacion') {
    const declarados = new Set(st.plan.filter(x => x.tipo === 'atacar').map(x => x.uid));
    tablero.resaltar({
      jugables: new Set(st.jugadores[0].mano.filter(c => puedeJugar(st, 0, c.uid)).map(c => c.uid)),
      listos: new Set(atacantesListos(st, 0).map(u => u.uid).filter(uid => !declarados.has(uid))),
      declarados,
    });
  } else tablero.resaltar({});
}

function alAtaque() {
  if (ocupado || st?.turno !== 0 || st.fase !== 'preparacion') return;
  modo = null; aviso('');
  if (pasarAtaque(st)) {
    if (!st.cola.length) aviso(t('nadieAtaca'));
    procesar();
    resolverJugador(false);
  }
}

function finTurno() {
  if (ocupado || st?.turno !== 0) return;
  modo = null; aviso('');
  if (st.fase === 'preparacion' && st.plan.length) {
    pasarAtaque(st); procesar(); resolverJugador(true); return;
  }
  terminarTurno(st);
  procesar();
}

// ---------- interfaz ----------

function nombreCarta(id, j = 0) { return tema.info(id, j).nombre || id; }
// Las maldiciones las juega el otro: el dueño de la carta es el rival del afectado.
const dueño = (id, jAfectado) => CARTAS[id].tipo === 'maldicion' ? 1 - jAfectado : jAfectado;

function registrar(e) {
  const quien = j => st.jugadores[j].nombre;
  const nomUid = uid => { const g = tablero.cartas.get(uid); return g ? nombreCarta(g.userData.id, g.userData.j) : t('laUnidad'); };
  const T = tema.terminos;
  // El jugador es «tú»: sus frases van en segunda persona; las del rival, con su nombre en tercera.
  let txt = '';
  switch (e.tipo) {
    case 'turno': txt = `<b>— ${e.j === 0 ? t('tuTurno') : t('turnoDe', quien(e.j))} —</b>`; break;
    case 'juega': txt = e.j === 0 ? t('rJuegas', nombreCarta(e.id, e.j)) : t('rJuega', quien(e.j), nombreCarta(e.id, e.j)); break;
    case 'ataca': {
      const o = e.objetivo;
      const blanco = o.tipo === 'muralla' ? t('laMuralla', T.muralla) : o.tipo === 'fortaleza' ? t('laFortaleza', T.fortaleza) : `<i>${nomUid(o.uid)}</i>`;
      txt = t('rAtaca', nomUid(e.uid), blanco);
      break;
    }
    case 'muere': txt = t('rCae', nombreCarta(e.id, e.j)); break;
    case 'prepara': txt = e.j === 0 ? t('rPreparas', nomUid(e.uid)) : t('rPrepara', quien(e.j), nomUid(e.uid)); break;
    case 'dispara': txt = t('rDispara', nombreCarta(e.id, e.j)); break;
    case 'devuelve': txt = t('rDevuelve', nombreCarta(e.id, e.j)); break;
    case 'disparo': txt = t('rDisparoTorre', nomUid(e.uid)); break;
    case 'sinObjetivo': txt = t('rPierde', nomUid(e.uid)); break;
    case 'maldicion': txt = e.j === 0 ? t('rSufres', nombreCarta(e.id, 1 - e.j)) : t('rSufre', quien(e.j), nombreCarta(e.id, 1 - e.j)); break;
    case 'mazoVacio': txt = e.j === 0 ? t('rMazoVacioTu', T.fortaleza) : t('rMazoVacio', quien(e.j), T.fortaleza); break;
    case 'quema': txt = e.j === 0 ? t('rQuemaTu', nombreCarta(e.id, e.j)) : t('rQuema', quien(e.j), nombreCarta(e.id, e.j)); break;
    case 'vence': txt = t('rVence', nombreCarta(e.id, dueño(e.id, e.j)), e.j === 0 ? t('ti') : quien(e.j)); break;
  }
  if (!txt) return;
  const r = $('#registro');
  const p = document.createElement('p');
  p.innerHTML = txt;
  r.appendChild(p);
  while (r.children.length > 9) r.firstChild.remove();
}

function hudJugador(el, j) {
  const p = st.jugadores[j];
  const T = tema.terminos;
  const efectos = p.efectos.map(e => {
    const d = CARTAS[e.id];
    const mala = d.tipo === 'maldicion';
    return `<span class="chip ${mala ? 'mala' : ''}" title="${textoReglas(d, T)}">${nombreCarta(e.id, dueño(e.id, j))} · ${e.turnos}</span>`;
  }).join('');
  const cap = t => t.charAt(0).toUpperCase() + t.slice(1);
  const dato = (icono, valor, etiqueta, clase = '') =>
    `<div class="dato ${clase}" title="${etiqueta}"><span class="ico">${ICONOS[icono]}</span><b>${valor}</b><small>${etiqueta}</small></div>`;
  el.innerHTML = `
    <div class="nombre">${p.nombre}</div>
    <div class="valores">
      ${dato('fortaleza', Math.max(0, p.fortaleza), cap(T.fortaleza), p.fortaleza <= 6 ? 'peligro' : '')}
      ${dato('recurso', p.recursos, cap(T.recursos), 'rec')}
      ${dato('muralla', p.muralla, cap(T.muralla))}
      ${dato('mano', p.mano.length, t('mano'))}
      ${dato('mazo', p.mazo.length, t('mazoHud'))}
    </div>
    <div class="efectos">${efectos}</div>`;
}

const NUMEROS = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];

function pintarPlan() {
  const el = $('#plan');
  const lista = st && st.turno === 0 && st.fase === 'preparacion' ? st.plan : [];
  el.classList.toggle('oculto', !lista.length);
  if (!lista.length) return;
  const T = tema.terminos;
  const nom = uid => { const g = tablero.cartas.get(uid); return g ? nombreCarta(g.userData.id, g.userData.j) : '—'; };
  const blanco = o => !o ? '' : o.tipo === 'muralla' ? t('laMuralla', T.muralla) : o.tipo === 'fortaleza' ? t('laFortaleza', T.fortaleza) : nom(o.uid);
  el.innerHTML = `<b>${t('planTitulo')}</b>` + lista.map((x, i) => {
    let destino = '';
    if (x.tipo === 'atacar') destino = blanco(x.objetivo);
    else {
      const m = st.jugadores[0].mesaEfectos.find(y => y.uid === x.uid);
      const acc = m ? CARTAS[m.id].efecto.accion : '';
      destino = m?.objetivo ? blanco(m.objetivo)
        : acc === 'derribar' || acc === 'asedioMuralla' ? t('muralla_rival', T.muralla)
        : acc === 'dañoTodos' || acc === 'debilidad' ? t('frente_rival', T.frente) : t('elRival');
    }
    return `<p class="${x.tipo}"><span>${NUMEROS[i] || i + 1}</span> ${nom(x.uid)} → ${destino}</p>`;
  }).join('') + `<small>${t('planQuitar')}</small>`;
}

function actualizarHUD() {
  if (!st) return;
  pintarPlan();
  hudJugador($('#hudRival'), 1);
  hudJugador($('#hudYo'), 0);
  const mio = st.turno === 0 && st.ganador === null;
  $('#estadoTurno').textContent = st.ganador !== null ? '' : mio
    ? (st.fase === 'preparacion' ? t('preparacion') : ocupado ? t('atacando') : t('ataqueHecho'))
    : t('turnoDeRival', st.jugadores[1].nombre);
  $('#btnAtaque').disabled = !(mio && st.fase === 'preparacion' && !ocupado);
  $('#btnFin').disabled = !mio || ocupado;
  guiar(mio);
}

// Qué conviene hacer ahora: un texto corto y el botón sugerido late (Espacio o Enter lo pulsan).
function botonSugerido() {
  if (!st || st.turno !== 0 || st.ganador !== null || ocupado) return null;
  if (st.fase === 'preparacion') {
    const jugables = st.jugadores[0].mano.some(c => puedeJugar(st, 0, c.uid));
    const libres = atacantesListos(st, 0).some(u => !enPlan(st, u.uid));
    if (st.plan.length && !jugables && !libres) return $('#btnAtaque');
    if (!st.plan.length && !jugables && !libres) return $('#btnFin');
    return null;
  }
  return $('#btnFin');
}

function guiar(mio) {
  const g = $('#guia');
  for (const b of [$('#btnAtaque'), $('#btnFin')]) b.classList.remove('sugerido');
  if (!mio || ocupado) { g.textContent = ''; return; }
  const T = tema.terminos;
  let texto = '';
  if (st.fase === 'preparacion') {
    const jugables = st.jugadores[0].mano.some(c => puedeJugar(st, 0, c.uid));
    const libres = atacantesListos(st, 0).some(u => !enPlan(st, u.uid));
    if (jugables) texto = t('guiaJugables');
    else if (libres) texto = t('guiaAtacar', T.combatientes);
    else if (st.plan.length) texto = t('guiaListo');
    else texto = t('guiaNada');
  } else texto = t('guiaAtaqueHecho');
  g.textContent = texto;
  botonSugerido()?.classList.add('sugerido');
}

let avisoT = null;
function aviso(texto) {
  const a = $('#aviso');
  a.textContent = texto;
  a.classList.toggle('visible', !!texto);
  clearTimeout(avisoT);
  if (texto) avisoT = setTimeout(() => a.classList.remove('visible'), modo ? 9000 : 3500);
}

function mostrarVista(h) {
  const v = $('#vista');
  if (!h || !['mano', 'unidad', 'efecto'].includes(h.tipo) || (h.tipo === 'mano' && h.j !== 0) || !st) { v.classList.remove('visible'); return; }
  let actual = null;
  if (h.tipo === 'unidad') {
    const b = buscarUnidad(st, h.uid);
    if (b) actual = { ataque: ataqueDe(st, b.u, b.j), vida: b.u.vida, vidaMax: b.u.vidaMax };
  }
  dibujarCarta($('#vistaCanvas'), CARTAS[h.id], tema.info(h.id, h.j), tema.imagen(h.id, h.j), tema.terminos, actual);
  // Justo en medio, entre el panel del rival y el tuyo.
  if (window.innerWidth > 800 && window.innerHeight > 520) {
    const arriba = $('#hudRival').getBoundingClientRect().bottom, abajo = $('#hudYo').getBoundingClientRect().top;
    const alto = Math.min(560, abajo - arriba - 24);
    const c = $('#vistaCanvas');
    c.style.height = alto + 'px';
    v.style.top = (arriba + (abajo - arriba - alto) / 2) + 'px';
  }
  v.classList.add('visible');
}

function mostrarFinal() {
  const gane = st.ganador === 0;
  cierre(gane);
  $('#finalTitulo').textContent = gane ? t('victoria') : t('derrota');
  $('#finalTexto').textContent = gane ? tema.datos.narrativa?.victoria || '' : tema.datos.narrativa?.derrota || '';
  $('#final').classList.remove('oculto');
}

// Para ver la mesa sin el mundo (pruebas): una partida suelta con los mazos de ejemplo.
function partidaDePrueba(mazo = 'equilibrado', rival = 'equilibrada') {
  empezarPartida({ mazo: listaMazo(MAZOS[mazo]), rival, regla: {} });
}

// ---------- arranque ----------

const pintarSonido = () => { $('#sonido').textContent = sonidoActivo() ? '🔊' : '🔇'; };
$('#sonido').onclick = () => { alternarSonido(); alCambiarSonido(); pintarSonido(); };
pintarSonido();
$('#btnAtaque').onclick = alAtaque;
$('#btnFin').onclick = finTurno;
$('#cerrar').onclick = volverAlMenu;
$('#btnOtra').onclick = terminarYVolver;
window.addEventListener('keydown', e => {
  if (st && !e.target.closest?.('input, textarea, select')) {
    // Espacio o Enter: el botón sugerido (o «Al ataque» si hay plan). Números 1-9: carta de la mano.
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      const b = botonSugerido() || (st.fase === 'preparacion' && st.plan.length ? $('#btnAtaque') : null);
      if (b && !b.disabled) b.click();
      return;
    }
    if (/^[1-9]$/.test(e.key) && st.turno === 0) {
      const c = st.jugadores[0].mano[Number(e.key) - 1];
      if (c) clic({ tipo: 'mano', uid: c.uid, j: 0, id: c.id });
      return;
    }
  }
  if (e.key !== 'Escape') return;
  if (!$('#reglas').classList.contains('oculto')) { $('#reglas').classList.add('oculto'); return; }
  if (modo) { modo = null; aviso(''); resaltarEstado(); return; }
  if (st) volverAlMenu();
});
window.addEventListener('contextmenu', e => { if (modo) { e.preventDefault(); modo = null; aviso(''); resaltarEstado(); } });

iniciar();

// En celulares: pantalla completa y orientación horizontal fija (Android). iPhone no deja fijarla: ahí queda el
// aviso «Gira el teléfono». Se pide con un toque, porque los navegadores solo lo permiten tras una acción del usuario.
const esTactil = window.matchMedia('(pointer: coarse)').matches;
async function ponerHorizontal() {
  try {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.({ navigationUI: 'hide' });
    await screen.orientation?.lock?.('landscape');
  } catch {}
}
if (esTactil) document.addEventListener('pointerdown', ponerHorizontal, { once: true });
$('#btnHorizontal').onclick = ponerHorizontal;

// Acceso para pruebas automáticas (pruebas/pantalla.mjs).
window.baseCartas = { get st() { return st; }, get tablero() { return tablero; }, empezar: partidaDePrueba, empezarPartida, terminarYVolver, alAtaque, finTurno, clic };
