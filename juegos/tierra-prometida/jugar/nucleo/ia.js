// Rival de la máquina. Devuelve UNA acción a la vez, para que la pantalla pueda mostrarla con calma.
// Las personalidades solo cambian pesos; las reglas son las mismas que para el jugador.

import { LIMITES } from './cartas.js';
import { def, rival, puedeJugar, objetivosDeCarta, objetivosDeAtaque, buscarUnidad, ataqueDe, tieneClave, atacar, simularPlan } from './reglas.js';

export const PERSONALIDADES = {
  equilibrada: { eco: 1, defensa: 1, ejercito: 1, agresion: 1, saqueo: 1, mazo: 'equilibrado' },
  constructora: { eco: 1.1, defensa: 1.7, ejercito: 0.9, agresion: 0.7, saqueo: 0.6, mazo: 'constructor' },
  agresiva: { eco: 0.9, defensa: 0.4, ejercito: 1.3, agresion: 1.6, saqueo: 0.8, mazo: 'agresivo' },
  saqueadora: { eco: 1, defensa: 0.8, ejercito: 1, agresion: 1, saqueo: 2, mazo: 'saqueador' },
};

const valorUnidad = (st, u, j) => {
  const d = def(u.id);
  if (d.tipo === 'combatiente') return ataqueDe(st, u, j) * 1.2 + u.vida * 0.6 + (d.claves.length ? 1 : 0);
  if (d.tipo === 'recolector') return 2 + d.prod * 2;
  if (d.tipo === 'constructor') return 1.5 + d.constr * 1.5;
  return 3 + d.costo * 0.5;
};

function fuerzaFrente(st, j) {
  return st.jugadores[j].frente.reduce((s, u) => s + ataqueDe(st, u, j), 0);
}

function puntuarCarta(st, j, c, P) {
  const p = st.jugadores[j];
  const r = rival(j);
  const pr = st.jugadores[r];
  const d = def(c.id);
  const e = d.efecto || {};
  const recolectores = p.aldea.filter(u => def(u.id).tipo === 'recolector');
  const constructores = p.aldea.filter(u => def(u.id).tipo === 'constructor');
  const amenaza = fuerzaFrente(st, r);
  let mejorObj = null;
  let s = 0;

  switch (d.tipo) {
    case 'recolector': {
      const prod = recolectores.reduce((a, u) => a + def(u.id).prod, 0);
      s = (prod < 3 ? 9 : prod < 5 ? 5 : 1.5) * P.eco + d.prod;
      if (p.aldea.length >= LIMITES.aldea - 1) s -= 3;
      break;
    }
    case 'constructor': {
      const falta = LIMITES.muralla - p.muralla;
      s = (falta > 3 ? 4 : 1) * P.defensa + (amenaza > 3 ? 2 : 0) - constructores.length * 1.2;
      if (recolectores.length < 2) s -= 3;
      break;
    }
    case 'combatiente':
      s = (d.ataque * 1.1 + d.vida * 0.7) * P.ejercito + (amenaza > fuerzaFrente(st, j) ? 2 : 0);
      if (tieneClave(c, 'guardia')) s += amenaza > 2 ? 2 * P.defensa : 0;
      if (tieneClave(c, 'incursor')) s += 1.5 * P.saqueo;
      if (tieneClave(c, 'asedio')) s += pr.muralla >= 4 ? 2 * P.agresion : 0;
      if (tieneClave(c, 'sanador')) s += unidades2(p).some(u => u.vida < u.vidaMax) ? 1.5 : 0;
      break;
    case 'estructura':
      if (e.accion === 'almacen') s = 6 * P.eco;
      if (e.accion === 'torre') s = (amenaza > 0 ? 4 : 1.5) * P.defensa;
      if (e.accion === 'cuartel') s = 3 * P.ejercito;
      if (e.accion === 'taller') s = constructores.length >= 2 ? 4 * P.defensa : 0.5;
      break;
    default: {
      const objs = objetivosDeCarta(st, j, c.id);
      switch (e.accion) {
        case 'daño': {
          let mejor = -1;
          for (const o of objs) {
            const b = buscarUnidad(st, o.uid);
            const mata = b.u.vida <= e.n;
            const v = (mata ? valorUnidad(st, b.u, r) * 1.6 : valorUnidad(st, b.u, r) * 0.4) * (def(b.u.id).tipo === 'recolector' ? P.saqueo : 1);
            if (v > mejor) { mejor = v; mejorObj = o; }
          }
          s = mejor - d.costo * 0.5;
          break;
        }
        case 'curar': case 'escudo': {
          let mejor = -1;
          for (const o of objs) {
            const b = buscarUnidad(st, o.uid);
            const falta = b.u.vidaMax - b.u.vida;
            const v = e.accion === 'curar' ? Math.min(falta, e.n) * 1.2 : (def(b.u.id).tipo === 'combatiente' ? 2.5 : 0.5);
            if (v > mejor) { mejor = v; mejorObj = o; }
          }
          s = mejor;
          break;
        }
        case 'refuerzo': {
          const listos = objs.map(o => buscarUnidad(st, o.uid).u).filter(u => u.listo);
          if (listos.length) { mejorObj = { tipo: 'unidad', uid: listos.sort((a, b) => b.vida - a.vida)[0].uid }; s = 3 * P.agresion; }
          break;
        }
        case 'recursos': s = p.recursos <= 2 ? 3 : 0.5; break;
        case 'robar': s = p.mano.length <= 3 ? 5 : 1; break;
        case 'dañoTodos': s = pr.frente.reduce((a, u) => a + (u.vida <= e.n ? valorUnidad(st, u, r) : 0.8), 0) - 2; break;
        case 'derribar': s = pr.muralla >= 3 ? Math.min(pr.muralla, e.n) * 1.1 * P.agresion : 0; break;
        case 'sequia': s = pr.aldea.filter(u => def(u.id).tipo === 'recolector').length >= 2 ? 4 * P.saqueo : 0.5; break;
        case 'peste': s = pr.aldea.reduce((a, u) => a + (u.vida <= 2 ? 1.6 : 0.6), 0) * P.saqueo; break;
        case 'debilidad': s = pr.frente.length * 1.3 * P.defensa; break;
        case 'asedioMuralla': s = pr.muralla >= 4 ? 4.5 * P.agresion : 0.5; break;
      }
    }
  }
  return { s, objetivo: mejorObj };
}

const unidades2 = p => [...p.frente, ...p.aldea, ...p.estructuras];

function puntuarAtaque(st, j, u, o, P) {
  const r = rival(j);
  const pr = st.jugadores[r];
  const atk = ataqueDe(st, u, j);
  if (o.tipo === 'fortaleza') return atk >= pr.fortaleza ? 1000 : atk * 1.6 * P.agresion;
  if (o.tipo === 'muralla') return Math.min(pr.muralla, tieneClave(u, 'asedio') ? atk * 2 : atk) * 0.9 * P.agresion;
  const b = buscarUnidad(st, o.uid);
  const v = valorUnidad(st, b.u, r);
  const mata = b.u.vida <= atk;
  if (b.zona !== 'frente') {
    const mult = def(b.u.id).tipo === 'recolector' ? 1.4 * P.saqueo : 1;
    return (mata ? v * 1.5 : atk * 0.5) * mult;
  }
  const devuelve = tieneClave(u, 'distancia') ? 0 : ataqueDe(st, b.u, r);
  const muero = devuelve >= u.vida;
  return (mata ? v * 1.6 : atk * 0.35) - (muero ? valorUnidad(st, u, j) * 1.2 : devuelve * 0.2);
}

export function siguienteAccionIA(st, j, personalidad = 'equilibrada') {
  const P = PERSONALIDADES[personalidad] || PERSONALIDADES.equilibrada;
  if (st.ganador !== null || st.turno !== j) return null;
  const p = st.jugadores[j];

  if (st.fase === 'preparacion') {
    let mejor = null;
    for (const c of p.mano) {
      if (!puedeJugar(st, j, c.uid)) continue;
      const { s, objetivo } = puntuarCarta(st, j, c, P);
      const necesita = objetivosDeCarta(st, j, c.id);
      if (necesita && !objetivo) continue;
      if (!mejor || s > mejor.s) mejor = { s, accion: { tipo: 'jugar', uid: c.uid, objetivo } };
    }
    if (mejor && mejor.s > 1) return mejor.accion;
    // Plan de ataque: se prueba en una copia, uno tras otro, en el mismo orden en que se resolverá.
    return { tipo: 'planAtaque', ataques: planearAtaques(st, j, P) };
  }

  if (st.fase === 'ataque') return st.cola.length ? { tipo: 'resolver' } : { tipo: 'terminar' };
  return null;
}

function planearAtaques(st, j, P) {
  const copia = simularPlan(st); // primero lo ya preparado (efectos), luego se prueban los ataques encima
  copia.fase = 'ataque';
  const plan = [];
  for (let k = 0; k < 10; k++) {
    let mejor = null;
    for (const u of copia.jugadores[j].frente) {
      for (const o of objetivosDeAtaque(copia, j, u.uid)) {
        const s = puntuarAtaque(copia, j, u, o, P);
        if (!mejor || s > mejor.s) mejor = { s, uid: u.uid, objetivo: o };
      }
    }
    if (!mejor || mejor.s <= 0) break;
    atacar(copia, mejor.uid, mejor.objetivo);
    plan.push({ uid: mejor.uid, objetivo: mejor.objetivo });
    if (copia.ganador !== null) break;
  }
  return plan;
}
