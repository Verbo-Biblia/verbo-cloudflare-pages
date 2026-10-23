// Motor de reglas: estado puro + acciones. No sabe nada de pantallas ni de temáticas.
// Cada acción modifica el estado y deja eventos en st.eventos para que la pantalla los anime.

import { CARTAS, LIMITES, ZONA_TIPO } from './cartas.js';

export function crearRng(semilla) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function barajar(lista, rng) {
  for (let i = lista.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [lista[i], lista[j]] = [lista[j], lista[i]];
  }
  return lista;
}

export const def = id => CARTAS[id];

// Todo lo que va contra el rival (efectos de daño y maldiciones) se prepara y se dispara al pulsar «Al ataque»,
// después de los combatientes. Lo que ayuda a uno mismo es inmediato.
export const DIFERIDAS = ['daño', 'dañoTodos', 'derribar', 'sequia', 'peste', 'debilidad', 'asedioMuralla'];
export const esDiferida = id => DIFERIDAS.includes(def(id).efecto?.accion);

// regla (campaña): { rivalMuralla | rivalFortaleza | rivalRecursos | manoCorta | resistir: N } — el jugador es el 0.
export function nuevaPartida({ mazos, nombres = ['Jugador', 'Rival'], semilla = Date.now(), empieza = 0, regla = {} }) {
  const rng = crearRng(semilla);
  const st = { jugadores: [], turno: empieza, numTurno: 0, fase: 'inicio', ganador: null, eventos: [], sigUid: 1, semilla,
    plan: [],  // lo preparado, en orden: [{ tipo: 'atacar', uid, objetivo } | { tipo: 'efecto', uid }]
    cola: [] }; // lo que falta resolver en la fase de ataque
  st.rng = rng;
  for (let j = 0; j < 2; j++) {
    const mazo = barajar([...mazos[j]], rng);
    const p = {
      nombre: nombres[j], fortaleza: LIMITES.fortaleza, muralla: 0, recursos: LIMITES.recursosIniciales,
      mazo, mano: [], aldea: [], frente: [], estructuras: [], efectos: [], descarte: [],
      mesaEfectos: [], // efectos y maldiciones jugados que siguen a la vista (zona azul)
    };
    // La mano inicial siempre trae 2 recolectores, para que nadie pierda por mala suerte al repartir.
    for (let k = 0; k < 2; k++) {
      const i = p.mazo.findIndex(id => def(id).tipo === 'recolector');
      if (i >= 0) p.mano.push(carta(st, p.mazo.splice(i, 1)[0]));
    }
    let tamMano = LIMITES.manoInicial + (j !== empieza ? LIMITES.cartaExtraSegundo : 0);
    if (j === 0 && regla.manoCorta) tamMano = Math.min(tamMano, regla.manoCorta);
    while (p.mano.length < tamMano && p.mazo.length) p.mano.push(carta(st, p.mazo.pop()));
    // Quien no empieza recibe 1 recurso extra para compensar la ventaja de ir primero.
    if (j !== empieza) p.recursos += 1;
    if (j === 1) {
      if (regla.rivalMuralla) p.muralla = Math.min(LIMITES.muralla, regla.rivalMuralla);
      if (regla.rivalFortaleza) p.fortaleza = regla.rivalFortaleza;
      if (regla.rivalRecursos) p.recursos += regla.rivalRecursos;
    }
    st.jugadores.push(p);
  }
  st.resistir = regla.resistir || 0; // ganas si llegas vivo al inicio de tu turno N+1
  iniciarTurno(st);
  return st;
}

function carta(st, id) { return { uid: st.sigUid++, id }; }
function ev(st, tipo, datos = {}) { st.eventos.push({ tipo, ...datos }); }
export const rival = j => 1 - j;

// ---------- consultas ----------

export function unidades(p) { return [...p.frente, ...p.aldea, ...p.estructuras]; }

export function buscarUnidad(st, uid) {
  for (let j = 0; j < 2; j++) {
    const p = st.jugadores[j];
    for (const zona of ['frente', 'aldea', 'estructuras']) {
      const u = p[zona].find(x => x.uid === uid);
      if (u) return { u, j, zona };
    }
  }
  return null;
}

function activo(p, accion) { return p.efectos.filter(e => e.accion === accion); }

export function ataqueDe(st, u, j) {
  if (def(u.id).tipo !== 'combatiente') return 0;
  let a = def(u.id).ataque;
  for (const e of activo(st.jugadores[j], 'refuerzo')) if (e.uid === u.uid) a += e.n;
  for (const e of activo(st.jugadores[j], 'debilidad')) a -= e.n;
  return Math.max(0, a);
}

export const tieneClave = (u, k) => (def(u.id).claves || []).includes(k);

function tieneEstructura(p, accion) { return p.estructuras.filter(u => def(u.id).efecto?.accion === accion); }

// Unidades del rival que un efecto puede tocar: el frente siempre; el resto solo sin muralla.
function unidadesAlcanzables(st, r, ignoraMuralla = false) {
  const p = st.jugadores[r];
  return (p.muralla > 0 && !ignoraMuralla) ? [...p.frente] : unidades(p);
}

export function objetivosDeCarta(st, j, id) {
  const e = def(id).efecto;
  if (!e || !e.a) return null; // no necesita objetivo
  // Lo que se dispara en el ataque apunta a la mesa tal como quedará después de lo ya planeado.
  if (esDiferida(id) && st.plan?.length) st = simularPlan(st);
  const p = st.jugadores[j];
  if (e.a === 'unidadRival') return unidadesAlcanzables(st, rival(j)).map(u => ({ tipo: 'unidad', uid: u.uid }));
  if (e.a === 'unidadPropia') return unidades(p).map(u => ({ tipo: 'unidad', uid: u.uid }));
  if (e.a === 'combatientePropio') return p.frente.map(u => ({ tipo: 'unidad', uid: u.uid }));
  return [];
}

export function puedeJugar(st, j, manoUid) {
  if (st.ganador !== null || st.turno !== j || st.fase !== 'preparacion') return false;
  const p = st.jugadores[j];
  const c = p.mano.find(x => x.uid === manoUid);
  if (!c) return false;
  const d = def(c.id);
  if (d.costo > p.recursos) return false;
  if (d.tipo === 'recolector' && (p.recolectoresJugados || 0) >= LIMITES.recolectoresPorTurno) return false;
  const zona = ZONA_TIPO[d.tipo];
  if (zona && p[zona].length >= LIMITES[zona]) return false;
  const obj = objetivosDeCarta(st, j, c.id);
  if (obj && obj.length === 0) return false;
  return true;
}

export function objetivosDeAtaque(st, j, uid) {
  const r = rival(j);
  const pr = st.jugadores[r];
  const b = buscarUnidad(st, uid);
  if (!b || b.j !== j || b.zona !== 'frente' || !b.u.listo || ataqueDe(st, b.u, j) <= 0) return [];
  const guardias = pr.frente.filter(u => tieneClave(u, 'guardia'));
  if (guardias.length) return guardias.map(u => ({ tipo: 'unidad', uid: u.uid }));
  const lista = pr.frente.map(u => ({ tipo: 'unidad', uid: u.uid }));
  const incursor = tieneClave(b.u, 'incursor');
  if (pr.muralla > 0) lista.push({ tipo: 'muralla' });
  // El incursor salta la muralla para saquear la aldea y las estructuras; la fortaleza exige derribar la muralla.
  if (pr.muralla === 0) lista.push({ tipo: 'fortaleza' });
  if (pr.muralla === 0 || incursor) for (const u of [...pr.aldea, ...pr.estructuras]) lista.push({ tipo: 'unidad', uid: u.uid });
  return lista;
}

export function atacantesListos(st, j) {
  return st.jugadores[j].frente.filter(u => objetivosDeAtaque(st, j, u.uid).length > 0);
}

// ---------- daño y muerte ----------

function dañar(st, j, u, n, fuente) {
  if (n <= 0) return;
  u.vida -= n;
  ev(st, 'daño', { uid: u.uid, j, n, fuente });
}

function curar(st, j, u, n) {
  const antes = u.vida;
  u.vida = Math.min(u.vidaMax, u.vida + n);
  if (u.vida > antes) ev(st, 'cura', { uid: u.uid, j, n: u.vida - antes });
}

function dañarFortaleza(st, j, n) {
  st.jugadores[j].fortaleza -= n;
  ev(st, 'dañoFortaleza', { j, n });
}

function dañarMuralla(st, j, n) {
  const p = st.jugadores[j];
  const q = Math.min(p.muralla, n);
  if (q <= 0) return;
  p.muralla -= q;
  ev(st, 'muralla', { j, n: -q });
}

function limpiarMuertos(st) {
  for (let j = 0; j < 2; j++) {
    const p = st.jugadores[j];
    for (const zona of ['frente', 'aldea', 'estructuras']) {
      for (const u of p[zona].filter(x => x.vida <= 0)) {
        ev(st, 'muere', { uid: u.uid, j, id: u.id });
        p.descarte.push(u.id);
        p.efectos = p.efectos.filter(e => e.uid !== u.uid);
      }
      p[zona] = p[zona].filter(x => x.vida > 0);
    }
  }
  for (let j = 0; j < 2; j++) {
    if (st.jugadores[j].fortaleza <= 0 && st.ganador === null) {
      st.ganador = rival(j);
      st.fase = 'fin';
      ev(st, 'victoria', { j: rival(j) });
    }
  }
}

// ---------- turno ----------

function robar(st, j, n = 1) {
  const p = st.jugadores[j];
  for (let i = 0; i < n; i++) {
    if (!p.mazo.length) { dañarFortaleza(st, j, 2); ev(st, 'mazoVacio', { j }); continue; }
    const c = carta(st, p.mazo.pop());
    if (p.mano.length >= LIMITES.mano) { p.descarte.push(c.id); ev(st, 'quema', { j, id: c.id }); continue; }
    p.mano.push(c);
    ev(st, 'roba', { j, uid: c.uid });
  }
}

function iniciarTurno(st) {
  const j = st.turno;
  const p = st.jugadores[j];
  const r = rival(j);
  st.numTurno++;
  st.fase = 'inicio';
  // Regla «resistir»: si el jugador llega al inicio de su turno número N+1, gana.
  if (st.resistir && j === 0 && Math.ceil(st.numTurno / 2) > st.resistir) {
    st.ganador = 0; st.fase = 'fin'; ev(st, 'victoria', { j: 0, resistio: true }); return;
  }
  st.plan = [];
  st.cola = [];
  p.recolectoresJugados = 0;
  ev(st, 'turno', { j, num: st.numTurno });
  for (const u of p.frente) { u.listo = true; }

  // Producción
  let prod = p.aldea.reduce((s, u) => s + (def(u.id).prod || 0), 0);
  prod += tieneEstructura(p, 'almacen').reduce((s, u) => s + def(u.id).efecto.n, 0);
  prod -= activo(p, 'sequia').reduce((s, e) => s + e.n, 0);
  prod = Math.max(0, prod);
  const antes = p.recursos;
  p.recursos = Math.min(LIMITES.recursos, p.recursos + prod);
  if (p.recursos > antes) ev(st, 'recursos', { j, n: p.recursos - antes });

  // Construcción
  const extra = tieneEstructura(p, 'taller').reduce((s, u) => s + def(u.id).efecto.n, 0);
  const constructores = p.aldea.filter(u => def(u.id).tipo === 'constructor');
  const constr = constructores.reduce((s, u) => s + def(u.id).constr + extra, 0);
  subirMuralla(st, j, constr);

  // Pasivos
  for (const u of p.frente.filter(x => tieneClave(x, 'sanador'))) {
    const herida = unidades(p).filter(x => x.vida < x.vidaMax).sort((a, b) => (a.vida - a.vidaMax) - (b.vida - b.vidaMax))[0];
    if (herida) curar(st, j, herida, 2);
  }

  // Maldiciones que tengo encima
  for (const e of activo(p, 'peste')) for (const u of p.aldea) dañar(st, j, u, e.n, 'peste');
  for (const e of activo(p, 'asedioMuralla')) dañarMuralla(st, j, e.n);

  if (!(st.numTurno === 1)) robar(st, j, LIMITES.roboPorTurno);
  limpiarMuertos(st);
  if (st.ganador === null) st.fase = 'preparacion';
}

function subirMuralla(st, j, n) {
  const p = st.jugadores[j];
  const q = Math.min(LIMITES.muralla - p.muralla, n);
  if (q > 0) { p.muralla += q; ev(st, 'muralla', { j, n: q }); }
}

// En la preparación se arma el plan: el orden en que preparas las cosas es el orden en que pasan.
export function declararAtaque(st, uid, objetivo) {
  if (st.ganador !== null || st.fase !== 'preparacion') return false;
  // Se acepta un plan en cadena (p. ej., «Derrumbe tira la muralla y luego el soldado va a la fortaleza»):
  // aquí solo se revisa que el atacante pueda atacar y que el blanco exista; la legalidad se revisa al resolver.
  const a = buscarUnidad(st, uid);
  if (!a || a.j !== st.turno || a.zona !== 'frente' || !a.u.listo || ataqueDe(st, a.u, st.turno) <= 0) return false;
  if (objetivo.tipo === 'unidad') { const b = buscarUnidad(st, objetivo.uid); if (!b || b.j === st.turno) return false; }
  else if (objetivo.tipo !== 'muralla' && objetivo.tipo !== 'fortaleza') return false;
  st.plan = st.plan.filter(x => x.uid !== uid);
  st.plan.push({ tipo: 'atacar', uid, objetivo: { tipo: objetivo.tipo, uid: objetivo.uid } });
  ev(st, 'declara', { j: st.turno, uid, objetivo });
  return true;
}

// Quita algo del plan. Si era una carta preparada, vuelve a la mano y se devuelve su costo.
export function cancelarPlan(st, uid) {
  if (st.fase !== 'preparacion') return false;
  const paso = st.plan.find(x => x.uid === uid);
  if (!paso) return false;
  st.plan = st.plan.filter(x => x.uid !== uid);
  if (paso.tipo === 'efecto') {
    const p = st.jugadores[st.turno];
    const m = p.mesaEfectos.find(x => x.uid === uid);
    p.mesaEfectos = p.mesaEfectos.filter(x => x.uid !== uid);
    p.mano.push({ uid, id: m.id });
    p.recursos = Math.min(LIMITES.recursos, p.recursos + def(m.id).costo);
    ev(st, 'devuelve', { j: st.turno, uid, id: m.id });
  }
  return true;
}

export const enPlan = (st, uid) => st.plan.some(x => x.uid === uid);

// La mesa tal como quedaría si se resolviera el plan ahora (para elegir objetivos en cadena y para la máquina).
export function simularPlan(st) {
  const c = clonar(st);
  c.eventos = [];
  c.fase = 'ataque';
  c.cola = c.plan;
  c.plan = [];
  while (resolverSiguiente(c));
  return c;
}

export function objetivosPlaneados(st, j, uid) {
  return objetivosDeAtaque(simularPlan(st), j, uid);
}

export function pasarAtaque(st) {
  if (st.fase !== 'preparacion') return false;
  st.fase = 'ataque';
  st.cola = st.plan;
  st.plan = [];
  ev(st, 'fase', { fase: 'ataque' });
  return true;
}

// Resuelve un paso de la cola. Devuelve false cuando ya no queda nada.
export function resolverSiguiente(st) {
  if (st.ganador !== null || st.fase !== 'ataque' || !st.cola.length) return false;
  const j = st.turno;
  const paso = st.cola.shift();
  if (paso.tipo === 'atacar') {
    if (!atacar(st, paso.uid, paso.objetivo)) ev(st, 'sinObjetivo', { j, uid: paso.uid });
  } else {
    const m = st.jugadores[j].mesaEfectos.find(x => x.uid === paso.uid);
    if (m) {
      m.pendiente = false;
      ev(st, 'dispara', { j, uid: m.uid, id: m.id });
      aplicarEfecto(st, j, m.uid, m.id, m.objetivo);
      limpiarMuertos(st);
    }
  }
  return true;
}

export function terminarTurno(st) {
  if (st.ganador !== null || (st.fase !== 'preparacion' && st.fase !== 'ataque')) return false;
  // Nada preparado se pierde: si falta resolver algo, se resuelve antes de pasar el turno.
  if (st.fase === 'preparacion') pasarAtaque(st);
  while (resolverSiguiente(st));
  if (st.ganador !== null) return true;
  const j = st.turno;
  const p = st.jugadores[j];
  // Las duraciones cuentan los turnos del jugador afectado, incluido el actual.
  for (const e of p.efectos) e.turnos--;
  const vencidos = p.efectos.filter(e => e.turnos <= 0);
  for (const e of vencidos) ev(st, 'vence', { j, accion: e.accion, uid: e.uid, id: e.id });
  p.efectos = p.efectos.filter(e => e.turnos > 0);
  limpiarMesaEfectos(st, j);
  st.turno = rival(j);
  iniciarTurno(st);
  return true;
}

// ---------- jugar cartas ----------

export function jugarCarta(st, j, manoUid, objetivo = null) {
  if (!puedeJugar(st, j, manoUid)) return false;
  const p = st.jugadores[j];
  const r = rival(j);
  const c = p.mano.find(x => x.uid === manoUid);
  const d = def(c.id);
  const obj = objetivosDeCarta(st, j, c.id);
  if (obj) {
    if (!objetivo || !obj.some(o => o.uid === objetivo.uid)) return false;
  }
  p.recursos -= d.costo;
  p.mano = p.mano.filter(x => x.uid !== manoUid);
  ev(st, 'juega', { j, uid: c.uid, id: c.id, objetivo });

  const zona = ZONA_TIPO[d.tipo];
  if (zona) {
    const cuartel = d.tipo === 'combatiente' && tieneEstructura(p, 'cuartel').length > 0;
    const u = { uid: c.uid, id: c.id, vida: d.vida, vidaMax: d.vida, listo: tieneClave(c, 'veloz') || cuartel };
    p[zona].push(u);
    ev(st, 'entra', { j, uid: u.uid, zona });
    if (d.efecto?.accion === 'muralla') subirMuralla(st, j, d.efecto.n);
    // Igual que el recolector produce al entrar, el constructor construye al entrar.
    if (d.tipo === 'constructor') {
      const extra = tieneEstructura(p, 'taller').reduce((s, t) => s + def(t.id).efecto.n, 0);
      subirMuralla(st, j, d.constr + extra);
    }
    if (d.tipo === 'recolector') {
      // Como una tierra de Magic: produce en cuanto entra.
      p.recolectoresJugados = (p.recolectoresJugados || 0) + 1;
      const antes = p.recursos;
      p.recursos = Math.min(LIMITES.recursos, p.recursos + d.prod);
      if (p.recursos > antes) ev(st, 'recursos', { j, n: p.recursos - antes });
    }
    limpiarMuertos(st);
    return true;
  }

  const e = d.efecto;
  if (DIFERIDAS.includes(e.accion)) {
    p.mesaEfectos.push({ uid: c.uid, id: c.id, duradero: !!d.dur, pendiente: true, objetivo });
    while (p.mesaEfectos.length > LIMITES.efectosMesa) retirarEfecto(st, j, p.mesaEfectos.find(m => !m.pendiente)?.uid ?? p.mesaEfectos[0].uid);
    st.plan.push({ tipo: 'efecto', uid: c.uid });
    ev(st, 'prepara', { j, uid: c.uid, objetivo });
    return true;
  }
  aplicarEfecto(st, j, c.uid, c.id, objetivo);
  p.mesaEfectos.push({ uid: c.uid, id: c.id, duradero: !!d.dur });
  while (p.mesaEfectos.length > LIMITES.efectosMesa) retirarEfecto(st, j, p.mesaEfectos[0].uid);
  limpiarMuertos(st);
  return true;
}

function aplicarEfecto(st, j, cartaUid, id, objetivo) {
  const p = st.jugadores[j];
  const r = rival(j);
  const d = def(id);
  const e = d.efecto;
  const c = { uid: cartaUid, id };
  const blanco = objetivo ? buscarUnidad(st, objetivo.uid) : null;
  if (e.a && !blanco) { ev(st, 'sinObjetivo', { j, uid: cartaUid, id }); return; }
  switch (e.accion) {
    case 'daño': dañar(st, blanco.j, blanco.u, e.n, c.uid); break;
    case 'curar': curar(st, j, blanco.u, e.n); break;
    case 'escudo': blanco.u.vidaMax += e.n; blanco.u.vida += e.n; ev(st, 'cura', { uid: blanco.u.uid, j, n: e.n }); break;
    case 'refuerzo': p.efectos.push({ accion: 'refuerzo', n: e.n, uid: blanco.u.uid, turnos: d.dur, id: c.id, carta: c.uid }); ev(st, 'refuerzo', { j, uid: blanco.u.uid }); break;
    case 'recursos': p.recursos = Math.min(LIMITES.recursos, p.recursos + e.n); ev(st, 'recursos', { j, n: e.n }); break;
    case 'robar': robar(st, j, e.n); break;
    case 'dañoTodos': for (const u of [...st.jugadores[r].frente]) dañar(st, r, u, e.n, c.uid); break;
    case 'derribar': dañarMuralla(st, r, e.n); break;
    default: // maldiciones
      st.jugadores[r].efectos.push({ accion: e.accion, n: e.n, turnos: d.dur, id: c.id, carta: c.uid });
      ev(st, 'maldicion', { j: r, id: c.id });
  }
}

function efectoVivo(st, cartaUid) {
  return st.jugadores.some(p => p.efectos.some(e => e.carta === cartaUid));
}

function retirarEfecto(st, j, uid) {
  const p = st.jugadores[j];
  const m = p.mesaEfectos.find(x => x.uid === uid);
  if (!m) return;
  p.mesaEfectos = p.mesaEfectos.filter(x => x.uid !== uid);
  p.descarte.push(m.id);
  ev(st, 'retira', { j, uid });
}

function limpiarMesaEfectos(st, jTermina) {
  for (let k = 0; k < 2; k++) {
    for (const m of [...st.jugadores[k].mesaEfectos]) {
      const fuera = m.duradero ? !efectoVivo(st, m.uid) : k === jTermina;
      if (fuera) retirarEfecto(st, k, m.uid);
    }
  }
}

// ---------- atacar ----------

export function atacar(st, uid, objetivo) {
  if (st.ganador !== null || st.fase !== 'ataque') return false;
  const j = st.turno;
  const r = rival(j);
  const validos = objetivosDeAtaque(st, j, uid);
  const ok = validos.some(o => o.tipo === objetivo.tipo && (o.tipo !== 'unidad' || o.uid === objetivo.uid));
  if (!ok) return false;
  const a = buscarUnidad(st, uid).u;
  a.listo = false;
  ev(st, 'ataca', { j, uid, objetivo });
  // Cada torre del defensor dispara una vez por turno, al primer atacante, antes del golpe; si lo derriba, el ataque no llega.
  for (const t of tieneEstructura(st.jugadores[r], 'torre')) {
    if (t.disparo === st.numTurno) continue;
    t.disparo = st.numTurno;
    ev(st, 'disparo', { desde: t.uid, uid });
    dañar(st, j, a, def(t.id).efecto.n, t.uid);
  }
  if (a.vida <= 0) { limpiarMuertos(st); return true; }
  const atk = ataqueDe(st, a, j);
  if (objetivo.tipo === 'muralla') {
    dañarMuralla(st, r, tieneClave(a, 'asedio') ? atk * 2 : atk);
  } else if (objetivo.tipo === 'fortaleza') {
    dañarFortaleza(st, r, atk);
  } else {
    const b = buscarUnidad(st, objetivo.uid);
    const esEstructura = b.zona === 'estructuras';
    dañar(st, r, b.u, esEstructura && tieneClave(a, 'asedio') ? atk * 2 : atk, uid);
    if (b.zona === 'frente' && !tieneClave(a, 'distancia')) dañar(st, j, a, ataqueDe(st, b.u, r), b.u.uid);
  }
  limpiarMuertos(st);
  return true;
}

// Copia profunda para que la IA pruebe jugadas sin tocar la partida real.
export function clonar(st) {
  const c = JSON.parse(JSON.stringify({ ...st, rng: undefined }));
  c.rng = st.rng;
  return c;
}
