// Pantallas del mundo: inicio, pueblo, mapa de campaña, ventanas de narrativa, taller de mazos, tienda,
// casa del cronista y arena (partida rápida). La estructura es fija (nucleo/mundo.js y nucleo/progreso.js);
// la temática solo pone nombres y textos (tema.datos.mundo). Los fondos son fijos: juego/fondos/<nombre>.png.

import { CARTAS, TIPOS, LIMITES, nombreTipo, textoReglas } from '../nucleo/cartas.js';
import { PERSONALIDADES } from '../nucleo/ia.js';
import { MAZMORRAS, CAMINOS, DERROTA, estadoMazmorra, siguientePartida, campañaGanada } from '../nucleo/mundo.js';
import {
  nuevoProgreso, tienda, comprar, DESBLOQUEOS, resultadoCampaña, resultadoEscaramuza, revisarMazo, mazoActivo, cronicasAbiertas, precio,
} from '../nucleo/progreso.js';
import { dibujarCarta } from './carta-dibujo.js';
import { sonar, sonidoActivo, alternarSonido } from './sonido.js';
import { musica, musicaDeTema, alCambiarSonido } from './musica.js';

const $ = s => document.querySelector(s);
const FONDOS = new URL('./fondos/', import.meta.url).href;

let tema = null;
let prog = null;
let jugarPartida = null; // función de main.js: ({ mazo, rival, regla, alTerminar }) → arranca la mesa
let temas = [];
let alCambiarTema = null;

// ---------- utilidades ----------

const leer = k => { try { return localStorage.getItem(k); } catch { return null; } };
const escribir = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
const borrar = k => { try { localStorage.removeItem(k); } catch {} };
const claveProgreso = () => `baseCartas.progreso.${tema.id}`;

function guardarProgreso() { escribir(claveProgreso(), JSON.stringify(prog)); }

function cargarProgreso() {
  try { const t = leer(claveProgreso()); return t ? JSON.parse(t) : null; } catch { return null; }
}

const M = () => tema.datos.mundo || {};
const pantalla = (k, def) => M().pantallas?.[k] || def;
const moneda = () => pantalla('moneda', 'monedas');
// «1 siclo», «5 siclos»: singular simple quitando la -s final del término de la temática.
const monedasTexto = n => `${n} ${n === 1 ? moneda().replace(/s$/, '') : moneda()}`;
const nombreCarta = id => tema.info(id).nombre || id;
const nombreMazmorra = id => id === 'pueblo' ? pantalla('pueblo', 'El pueblo') : (M().mazmorras?.[id]?.nombre || id.toUpperCase());
const textoMazmorra = (id, k) => M().mazmorras?.[id]?.[k] || '';
const escapar = t => String(t ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const parrafos = t => escapar(t).split(/\n+/).filter(Boolean).map(p => `<p>${p}</p>`).join('');

// Fondo fijo con respaldo: si la imagen todavía no existe, se ve el fondo provisional de la pantalla (--provisional en mundo.css).
// Una temática puede traer su propio fondo para cualquier pantalla (tema.json → fondos.<nombre>).
// Comillas simples: el resultado también se usa dentro de atributos style="…" del HTML.
const fondo = nombre => `url('${tema.fondos?.[nombre] || `${FONDOS}${nombre}.png`}'), var(--provisional)`;

const REGLA = {
  rivalMuralla: n => `El rival empieza con ${n} de muralla.`,
  rivalFortaleza: n => `La fortaleza rival tiene ${n} de vida.`,
  rivalRecursos: n => `El rival empieza con ${n} recursos extra.`,
  manoCorta: n => `Empiezas con solo ${n} cartas.`,
  resistir: n => `Ganas si resistes ${n} turnos.`,
};

const MUSICA_PANTALLA = { pInicio: 'inicio', pPueblo: 'pueblo', pMapa: 'mapa', pTaller: 'tienda', pTienda: 'tienda',
  pCronista: 'relato', pArena: 'pueblo', pNarrativa: 'relato' };

function mostrar(id) {
  for (const s of document.querySelectorAll('.pantalla')) s.classList.toggle('oculto', s.id !== id);
  $('#mundo').classList.remove('oculto');
  musica(MUSICA_PANTALLA[id]);
}

function miniCarta(id, actual = null) {
  const c = document.createElement('canvas');
  c.className = 'mini';
  dibujarCarta(c, CARTAS[id], tema.info(id), tema.imagenes[id], tema.terminos, actual);
  c.title = `${nombreCarta(id)} — ${textoReglas(CARTAS[id], tema.terminos)}`;
  return c;
}

function barraSuperior(titulo, volver = 'pueblo') {
  return `<div class="barra">
    <button class="volver" data-volver="${volver}">← ${volver === 'inicio' ? 'Inicio' : escapar(pantalla(volver, volver === 'mapa' ? 'Mapa' : 'El pueblo'))}</button>
    <h2>${escapar(titulo)}</h2>
    <span class="monedas" title="${escapar(moneda())}">◉ ${prog.monedas} ${escapar(moneda())}</span>
  </div>`;
}

function conectarVolver(el) {
  for (const b of el.querySelectorAll('[data-volver]')) b.onclick = () => ir(b.dataset.volver);
}

// ---------- navegación ----------

export function ir(destino, extra) {
  ({ inicio: verInicio, pueblo: verPueblo, mapa: verMapa, taller: verTaller, tienda: verTienda,
    cronista: verCronista, arena: verArena, mazmorra: () => verMapa(extra) })[destino]?.();
}

// ---------- inicio ----------

function verInicio() {
  const el = $('#pInicio');
  const hay = !!cargarProgreso();
  // El creador solo existe en la copia local (con servir.py); en la web publicada no se muestra.
  const local = ['127.0.0.1', 'localhost'].includes(location.hostname);
  el.style.backgroundImage = `linear-gradient(rgba(10,6,3,.15), rgba(10,6,3,.75)), ${fondo('inicio')}`;
  el.innerHTML = `
    <div class="portada">
      <h1>${escapar(tema.datos.titulo)}</h1>
      <p class="sub">${escapar(tema.datos.subtitulo || '')}</p>
      <div class="botones">
        ${hay ? '<button class="grande" id="iContinuar">Continuar</button>' : ''}
        <button class="${hay ? '' : 'grande'}" id="iNueva">${hay ? 'Nueva partida' : 'Comenzar'}</button>
        <button id="iReglas">Cómo se juega</button>
        <button id="iSonido">${sonidoActivo() ? '🔊 Sonido activado' : '🔇 Sonido apagado'}</button>
        ${local ? '<a class="boton" href="../creador/">Creador</a>' : ''}
      </div>
      ${temas.length > 1 ? `<label class="tema">Temática <select id="iTema">${temas.map(t => `<option ${t === tema.id ? 'selected' : ''}>${t}</option>`).join('')}</select></label>` : ''}
    </div>`;
  if (hay) $('#iContinuar').onclick = () => { prog = cargarProgreso(); completarProgreso(); ir('pueblo'); };
  let confirmar = false;
  $('#iNueva').onclick = () => {
    if (hay && !confirmar) { confirmar = true; $('#iNueva').textContent = '¿Seguro? Se borra el progreso guardado'; return; }
    prog = nuevoProgreso();
    guardarProgreso();
    narrativa({ fondo: 'narrativa_camino', titulo: tema.datos.titulo, texto: tema.datos.narrativa?.intro || '', alSeguir: () => ir('pueblo') });
  };
  $('#iReglas').onclick = () => $('#reglas').classList.remove('oculto');
  $('#iSonido').onclick = () => { $('#iSonido').textContent = alternarSonido() ? '🔊 Sonido activado' : '🔇 Sonido apagado'; alCambiarSonido(); sonar('seleccion'); };
  // Los navegadores no dejan sonar música sin un primer toque: arranca con el primero.
  document.addEventListener('pointerdown', () => musica('inicio'), { once: true });
  const sel = $('#iTema');
  if (sel) sel.onchange = () => alCambiarTema?.(sel.value);
  mostrar('pInicio');
}

// Partidas guardadas con versiones anteriores: se completan los campos nuevos.
function completarProgreso() {
  const base = nuevoProgreso();
  for (const [k, v] of Object.entries(base)) if (prog[k] === undefined) prog[k] = v;
}

// ---------- pueblo ----------

const LUGARES_PUEBLO = [
  { id: 'taller', def: 'Taller de mazos', x: 3, y: 30, w: 21, h: 55 },
  { id: 'tienda', def: 'Tienda', x: 26, y: 40, w: 18, h: 48 },
  { id: 'arena', def: 'Arena', x: 42, y: 12, w: 19, h: 33 },
  { id: 'cronista', def: 'Casa del cronista', x: 56, y: 35, w: 20, h: 50 },
  { id: 'mapa', def: 'Puerta al mapa', clave: 'puerta', x: 78, y: 20, w: 20, h: 68 },
];

function verPueblo() {
  const el = $('#pPueblo');
  el.innerHTML = `${barraSuperior(pantalla('pueblo', 'El pueblo'), 'inicio')}
    <div class="lienzo-fondo" style="background-image:${fondo('pueblo')}"></div>
    <div class="lienzo" style="background-image:${fondo('pueblo')}">
      ${LUGARES_PUEBLO.map(l => `<button class="lugar" data-ir="${l.id}" style="left:${l.x}%;top:${l.y}%;width:${l.w}%;height:${l.h}%">
        <span>${escapar(pantalla(l.clave || l.id, l.def))}</span></button>`).join('')}
      <div class="pie-pueblo">${escapar(pantalla('campaña', 'Campaña'))}: ${prog.conquistadas.length - 1}/10 · ${escapar(prog.mazos[prog.mazoActivo]?.nombre || '')}</div>
    </div>`;
  conectarVolver(el);
  for (const b of el.querySelectorAll('[data-ir]')) b.onclick = () => { sonar('seleccion'); ir(b.dataset.ir); };
  mostrar('pPueblo');
}

// ---------- mapa ----------

function verMapa(seleccion = null) {
  const el = $('#pMapa');
  const estado = id => (prog.recuperar || []).includes(id) ? 'recuperar' : estadoMazmorra(prog, id);
  const lineas = CAMINOS.map(([a, b]) => {
    const A = MAZMORRAS[a], B = MAZMORRAS[b];
    const abierto = prog.conquistadas.includes(a) || prog.conquistadas.includes(b);
    return `<line x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}" class="${abierto ? 'abierto' : ''}"/>`;
  }).join('');
  const racha = prog.racha || 0;
  el.innerHTML = `${barraSuperior(pantalla('mapa', 'Mapa'))}
    <div class="lienzo-fondo" style="background-image:${fondo('mapa')}"></div>
    <div class="lienzo mapa" style="background-image:${fondo('mapa')}">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">${lineas}</svg>
      ${Object.entries(MAZMORRAS).map(([id, m]) => {
        const e = estado(id);
        const avance = prog.avance[id] ? `<small>${prog.avance[id]}/${m.partidas.length}</small>` : '';
        return `<button class="punto ${e} ${id === 'pueblo' ? 'casa' : ''}" data-id="${id}" style="left:${m.x}%;top:${m.y}%" title="${escapar(nombreMazmorra(id))}">
          <i></i><span>${escapar(nombreMazmorra(id))}</span>${avance}</button>`;
      }).join('')}
      ${racha && DERROTA.rachaParaPerderTerritorio ? `<div class="racha">Derrotas seguidas: ${racha}/${DERROTA.rachaParaPerderTerritorio}</div>` : ''}
    </div>
    <aside id="ficha" class="ficha oculto"></aside>`;
  conectarVolver(el);
  for (const b of el.querySelectorAll('.punto')) b.onclick = () => { sonar('seleccion'); fichaMazmorra(b.dataset.id); };
  mostrar('pMapa');
  if (seleccion) fichaMazmorra(seleccion);
}

function fichaMazmorra(id) {
  const f = $('#ficha');
  if (id === 'pueblo') { ir('pueblo'); return; }
  const m = MAZMORRAS[id];
  const recuperar = (prog.recuperar || []).includes(id);
  const e = recuperar ? 'recuperar' : estadoMazmorra(prog, id);
  const pt = siguientePartida(prog, id);
  const estados = {
    conquistada: 'Conquistada', bloqueada: 'Todavía no hay camino hasta aquí.',
    disponible: `Partida ${(pt?.indice || 0) + 1} de ${m.partidas.length}`,
    recuperar: 'El enemigo la recuperó: reconquístala con una sola partida.',
  };
  const titulo = M().actos?.[m.acto]?.titulo || `Acto ${m.acto}`;
  f.innerHTML = `
    <button class="x" id="fCerrar" title="Cerrar">✕</button>
    <div class="lamina" style="background-image:${fondo('lugar_' + id.slice(1))}"></div>
    <p class="acto">${escapar(titulo)}</p>
    <h3>${escapar(nombreMazmorra(id))}</h3>
    ${parrafos(textoMazmorra(id, 'descripcion'))}
    <p class="estado ${e}">${escapar(estados[e])}</p>
    ${(e === 'disponible' || e === 'recuperar') && pt ? `
      <p>Rival: <b>${escapar(tema.nombreRival(pt.rival))}</b></p>
      ${pt.regla ? `<p class="regla">${escapar(REGLA[pt.regla](pt.valor))}</p>` : ''}
      ${!prog.premiados.includes(id) ? `<p class="premio">Premio al conquistarla: <b>${escapar(nombreCarta(premioDe(id)))}</b> y ${m.monedas} ${escapar(moneda())}</p>` : ''}
      <button class="grande" id="fJugar">Jugar</button>` : ''}`;
  f.classList.remove('oculto');
  $('#fCerrar').onclick = () => f.classList.add('oculto');
  const b = $('#fJugar');
  if (b) b.onclick = () => entrarMazmorra(id);
}

const premioDe = id => DESBLOQUEOS[id]?.premio;

function entrarMazmorra(id) {
  const m = MAZMORRAS[id];
  const pt = siguientePartida(prog, id);
  const problemas = revisarMazo(prog, prog.mazos[prog.mazoActivo].receta).filter(p => !p.includes('recomiendan'));
  if (problemas.length) { narrativa({ titulo: 'Tu mazo no está listo', texto: problemas.join('\n') + '\nArréglalo en el taller de mazos.', alSeguir: () => ir('taller') }); return; }
  prog.actosVistos ||= [];
  const pasos = [];
  if (!prog.actosVistos.includes(m.acto)) {
    prog.actosVistos.push(m.acto);
    guardarProgreso();
    const a = M().actos?.[m.acto] || {};
    // Cada parte con su imagen: la temática puede traer acto_1, acto_2…; si no, tres escenas fijas distintas.
    const fondoActo = tema.fondos?.[`acto_${m.acto}`] ? `acto_${m.acto}` : ['narrativa_consejo', 'narrativa_batalla', 'narrativa_campamento'][(m.acto - 1) % 3];
    pasos.push({ fondo: fondoActo, titulo: a.titulo || `Acto ${m.acto}`, texto: a.texto || '' });
  }
  const antes = pt.recuperar ? '' : M().mazmorras?.[id]?.partidas?.[pt.indice]?.antes;
  pasos.push({
    fondo: 'lugar_' + id.slice(1), titulo: nombreMazmorra(id),
    subtitulo: pt.recuperar ? 'Reconquista' : `Partida ${pt.indice + 1} de ${pt.total}`,
    texto: [antes, pt.regla ? REGLA[pt.regla](pt.valor) : ''].filter(Boolean).join('\n'), boton: 'A la batalla',
  });
  encadenar(pasos, () => jugarPartida({
    mazo: mazoActivo(prog), rival: pt.rival, regla: pt.regla ? { [pt.regla]: pt.valor } : {},
    alTerminar: gano => despuesDeMazmorra(id, pt, gano),
  }));
}

function despuesDeMazmorra(id, pt, gano) {
  const r = resultadoCampaña(prog, id, gano);
  guardarProgreso();
  const t = M().mazmorras?.[id] || {};
  const pasos = [];
  if (r.tipo === 'avance') pasos.push({ fondo: 'narrativa_victoria', titulo: '¡Victoria!', texto: [t.partidas?.[pt.indice]?.despues, `Faltan ${r.faltan} ${r.faltan === 1 ? 'partida' : 'partidas'} para conquistar ${nombreMazmorra(id)}.`].filter(Boolean).join('\n'), monedas: r.monedas });
  if (r.tipo === 'conquista' || r.tipo === 'reconquista') {
    pasos.push({
      fondo: 'narrativa_victoria', titulo: r.tipo === 'conquista' ? '¡Conquista!' : '¡Reconquista!',
      texto: [r.tipo === 'conquista' ? t.partidas?.[pt.indice]?.despues : '', t.conquista].filter(Boolean).join('\n'),
      monedas: r.monedas, carta: r.premio || null,
      nota: r.tienda?.length ? `Nuevas cartas en la tienda: ${r.tienda.map(nombreCarta).join(', ')}.` : '',
    });
  }
  if (r.tipo === 'derrota') {
    const falta = DERROTA.rachaParaPerderTerritorio - (prog.racha || 0);
    pasos.push({
      fondo: 'narrativa_derrota', titulo: 'Derrota', monedas: r.monedas,
      texto: r.perdida
        ? [M().mazmorras?.[r.perdida]?.perdida || `El enemigo recuperó ${nombreMazmorra(r.perdida)}.`, 'Puedes reconquistarla con una sola partida.'].join('\n')
        : (prog.conquistadas.length > 1 && DERROTA.rachaParaPerderTerritorio
          ? `Cuidado: ${falta === 1 ? 'una derrota más seguida' : `${falta} derrotas más seguidas`} y el enemigo recuperará ${nombreMazmorra(prog.conquistadas.at(-1))}.`
          : 'Reúne fuerzas e inténtalo otra vez.'),
    });
  }
  if (r.campañaGanada && r.tipo === 'conquista' && id === 'm10') {
    pasos.push({ fondo: 'narrativa_victoria', titulo: tema.datos.titulo, texto: [M().final?.victoria, M().final?.creditos, 'Toda la tienda está abierta.'].filter(Boolean).join('\n') });
  }
  const abiertas = cronicasAbiertas(prog, M().cronicas).filter(c => c.desbloquea === id);
  if (r.primeraVez && abiertas.length) pasos.push({ fondo: 'cronista', titulo: pantalla('cronista', 'Casa del cronista'), texto: `Nueva crónica: ${abiertas.map(c => c.titulo).join(', ')}.` });
  encadenar(pasos, () => ir('mazmorra', id));
}

// ---------- ventanas de narrativa ----------

function narrativa({ fondo: f = 'narrativa_camino', titulo = '', subtitulo = '', texto = '', boton = 'Continuar', monedas = 0, carta = null, nota = '', alSeguir }) {
  const el = $('#pNarrativa');
  el.style.backgroundImage = `linear-gradient(rgba(10,6,3,0) 35%, rgba(10,6,3,.92) 75%), ${fondo(f)}`;
  el.innerHTML = `<div class="relato">
      ${subtitulo ? `<p class="acto">${escapar(subtitulo)}</p>` : ''}
      <h2>${escapar(titulo)}</h2>
      ${parrafos(texto)}
      <div class="botin"></div>
      ${monedas ? `<p class="ganancia">+${escapar(monedasTexto(monedas))}</p>` : ''}
      ${nota ? `<p class="nota">${escapar(nota)}</p>` : ''}
      <button class="grande" id="nSeguir">${escapar(boton)}</button>
    </div>`;
  if (carta) { const c = miniCarta(carta); c.classList.add('premio'); el.querySelector('.botin').append('Premio:', c); sonar('premio'); }
  if (monedas) sonar('monedas');
  $('#nSeguir').onclick = () => { sonar('confirmar'); alSeguir(); };
  mostrar('pNarrativa');
}

function encadenar(pasos, alFinal) {
  const siguiente = () => {
    const p = pasos.shift();
    if (!p) { alFinal(); return; }
    if (!p.texto && !p.monedas && !p.carta && !p.nota && p.boton === undefined) { siguiente(); return; }
    narrativa({ ...p, alSeguir: siguiente });
  };
  siguiente();
}

// ---------- taller de mazos ----------

function verTaller() {
  const el = $('#pTaller');
  const mazo = prog.mazos[prog.mazoActivo];
  const receta = mazo.receta;
  const total = Object.values(receta).reduce((s, n) => s + n, 0);
  const problemas = revisarMazo(prog, receta);
  el.style.backgroundImage = `linear-gradient(90deg, rgba(10,6,3,.55), rgba(10,6,3,.92) 55%), ${fondo('taller')}`;
  el.innerHTML = `${barraSuperior(pantalla('taller', 'Taller de mazos'))}
    <div class="taller">
      <div class="coleccion">
        <p class="nota">Toca una carta para agregarla al mazo. Tienes ${Object.values(prog.coleccion).reduce((s, n) => s + n, 0)} cartas.</p>
        ${TIPOS.map(tipo => `<h3>${escapar(nombreTipo(tipo, tema.terminos))}</h3><div class="rejilla" data-tipo="${tipo}"></div>`).join('')}
      </div>
      <div class="mazo">
        <div class="fila">
          <select id="tMazos">${prog.mazos.map((m, i) => `<option value="${i}" ${i === prog.mazoActivo ? 'selected' : ''}>${escapar(m.nombre)}</option>`).join('')}</select>
          <button id="tNuevo" title="Copia del mazo actual">+ Copiar</button>
          ${prog.mazos.length > 1 ? '<button id="tBorrar">Borrar</button>' : ''}
        </div>
        <label>Nombre <input id="tNombre" maxlength="30" value="${escapar(mazo.nombre)}"></label>
        <p class="cuenta ${total === LIMITES.mazo ? 'ok' : ''}">${total} / ${LIMITES.mazo} cartas</p>
        ${problemas.length ? `<ul class="problemas">${problemas.map(p => `<li>${escapar(p.replace(/\b([A-Z]\d\d)\b/g, id => nombreCarta(id)))}</li>`).join('')}</ul>` : '<p class="ok">Mazo listo. Es el que usarás en la campaña y en la arena.</p>'}
        <p class="nota">Toca una carta de la lista para quitarla.</p>
        <ul class="lista">${Object.entries(receta).sort((a, b) => CARTAS[a[0]].costo - CARTAS[b[0]].costo).map(([id, n]) =>
          `<li data-id="${id}"><span class="costo">${CARTAS[id].costo}</span> ${escapar(nombreCarta(id))} <b>×${n}</b></li>`).join('')}</ul>
      </div>
    </div>`;
  conectarVolver(el);
  for (const [id, tengo] of Object.entries(prog.coleccion).sort((a, b) => CARTAS[a[0]].costo - CARTAS[b[0]].costo)) {
    const caja = document.createElement('div');
    caja.className = 'carta-col';
    const usadas = receta[id] || 0;
    const c = miniCarta(id);
    caja.append(c);
    caja.insertAdjacentHTML('beforeend', `<span>${usadas}/${tengo}</span>`);
    if (usadas >= Math.min(tengo, LIMITES.copias)) caja.classList.add('agotada');
    caja.onclick = () => { if (usadas < Math.min(tengo, LIMITES.copias)) { receta[id] = usadas + 1; guardarProgreso(); verTaller(); } };
    el.querySelector(`.rejilla[data-tipo="${CARTAS[id].tipo}"]`).append(caja);
  }
  for (const li of el.querySelectorAll('.lista li')) li.onclick = () => {
    const id = li.dataset.id;
    receta[id]--; if (!receta[id]) delete receta[id];
    guardarProgreso(); verTaller();
  };
  $('#tMazos').onchange = e => { prog.mazoActivo = Number(e.target.value); guardarProgreso(); verTaller(); };
  $('#tNombre').onchange = e => { mazo.nombre = e.target.value.trim() || 'Mazo'; guardarProgreso(); verTaller(); };
  $('#tNuevo').onclick = () => { prog.mazos.push({ nombre: `${mazo.nombre} (copia)`, receta: { ...receta } }); prog.mazoActivo = prog.mazos.length - 1; guardarProgreso(); verTaller(); };
  const borrarB = $('#tBorrar');
  if (borrarB) {
    let seguro = false;
    borrarB.onclick = () => {
      if (!seguro) { seguro = true; borrarB.textContent = '¿Seguro?'; return; }
      prog.mazos.splice(prog.mazoActivo, 1); prog.mazoActivo = 0; guardarProgreso(); verTaller();
    };
  }
  mostrar('pTaller');
}

// ---------- tienda ----------

function verTienda() {
  const el = $('#pTienda');
  const ofertas = tienda(prog).sort((a, b) => a.precio - b.precio);
  el.style.backgroundImage = `linear-gradient(rgba(10,6,3,.55), rgba(10,6,3,.85)), ${fondo('tienda')}`;
  el.innerHTML = `${barraSuperior(pantalla('tienda', 'Tienda'))}
    <p class="nota centro">Cartas sueltas, sin sorpresas. Cada mazmorra conquistada trae cartas nuevas. Máximo ${LIMITES.copias} copias de cada una.</p>
    <div class="vitrina"></div>`;
  conectarVolver(el);
  const v = el.querySelector('.vitrina');
  if (!ofertas.length) v.innerHTML = '<p class="nota">No hay nada nuevo por ahora. Conquista mazmorras para traer más cartas.</p>';
  for (const o of ofertas) {
    const caja = document.createElement('div');
    caja.className = 'oferta';
    caja.append(miniCarta(o.id));
    const alcanza = prog.monedas >= o.precio;
    caja.insertAdjacentHTML('beforeend', `<p>Tienes ${o.tengo}/${LIMITES.copias}</p><button ${alcanza ? '' : 'disabled'}>◉ ${o.precio}</button>`);
    caja.querySelector('button').onclick = () => { if (comprar(prog, o.id)) { sonar('monedas'); guardarProgreso(); verTienda(); } };
    v.append(caja);
  }
  mostrar('pTienda');
}

// ---------- casa del cronista ----------

function verCronista(indice = 0) {
  const el = $('#pCronista');
  const todas = M().cronicas || [];
  const abiertas = cronicasAbiertas(prog, todas);
  const sel = abiertas[indice];
  el.style.backgroundImage = `linear-gradient(90deg, rgba(10,6,3,.92) 45%, rgba(10,6,3,.4)), ${fondo('cronista')}`;
  el.innerHTML = `${barraSuperior(pantalla('cronista', 'Casa del cronista'))}
    <div class="cronicas">
      <ul>${abiertas.map((c, i) => `<li class="${i === indice ? 'sel' : ''}" data-i="${i}">${escapar(c.titulo || 'Sin título')}</li>`).join('')}
        ${todas.length > abiertas.length ? `<li class="cerrada">${todas.length - abiertas.length} por descubrir…</li>` : ''}</ul>
      <article>${sel ? `<h3>${escapar(sel.titulo)}</h3>${parrafos(sel.texto)}` : '<p class="nota">Todavía no hay crónicas.</p>'}</article>
    </div>`;
  conectarVolver(el);
  for (const li of el.querySelectorAll('li[data-i]')) li.onclick = () => { sonar('pagina'); verCronista(Number(li.dataset.i)); };
  mostrar('pCronista');
}

// ---------- arena (partida rápida) ----------

function verArena() {
  const el = $('#pArena');
  el.style.backgroundImage = `linear-gradient(rgba(10,6,3,.45), rgba(10,6,3,.85)), ${fondo('arena')}`;
  const e = prog.escaramuzas || { ganadas: 0, jugadas: 0 };
  el.innerHTML = `${barraSuperior(pantalla('arena', 'Arena'))}
    <div class="caja arena">
      <h2>${escapar(pantalla('escaramuza', 'Partida rápida'))}</h2>
      <p class="nota">Sin territorio en juego. Ganas 5 ${escapar(moneda())} si vences y 1 si pierdes.</p>
      <label>Rival <select id="aRival">${Object.keys(PERSONALIDADES).map(p => `<option value="${p}">${escapar(tema.nombreRival(p))}</option>`).join('')}</select></label>
      <label>Tu mazo <select id="aMazo">${prog.mazos.map((m, i) => `<option value="${i}" ${i === prog.mazoActivo ? 'selected' : ''}>${escapar(m.nombre)}</option>`).join('')}</select></label>
      <p class="nota">Llevas ${e.ganadas} victorias en ${e.jugadas} partidas.</p>
      <p class="problemas" id="aProblemas"></p>
      <button class="grande" id="aJugar">Jugar</button>
    </div>`;
  conectarVolver(el);
  $('#aJugar').onclick = () => {
    const i = Number($('#aMazo').value);
    const problemas = revisarMazo(prog, prog.mazos[i].receta).filter(p => !p.includes('recomiendan'));
    if (problemas.length) { $('#aProblemas').textContent = problemas.join(' '); return; }
    prog.mazoActivo = i; guardarProgreso();
    const rival = $('#aRival').value;
    jugarPartida({
      mazo: mazoActivo(prog), rival, regla: {},
      alTerminar: gano => {
        const r = resultadoEscaramuza(prog, gano);
        guardarProgreso();
        narrativa({ fondo: 'arena', titulo: gano ? '¡Victoria!' : 'Derrota', monedas: r.monedas, alSeguir: () => ir('arena') });
      },
    });
  };
  mostrar('pArena');
}

// ---------- arranque ----------

export function iniciarMundo(opciones) {
  ({ tema, jugar: jugarPartida, temas, alCambiarTema } = opciones);
  musicaDeTema(tema);
  prog = cargarProgreso();
  if (prog) completarProgreso();
  verInicio();
}

export function ocultarMundo() { $('#mundo').classList.add('oculto'); }

// Para pruebas automáticas.
export const _mundo = { get prog() { return prog; }, set prog(p) { prog = p; }, guardarProgreso };
