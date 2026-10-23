// Estructura FIJA del mundo: mazmorras del mapa, caminos, partidas y recompensas.
// Igual que las cartas, no depende de la temática: la temática solo pone nombres y textos (tema.json → "mundo").
// Las coordenadas coinciden con el fondo juego/fondos/mapa.png (porcentajes desde arriba a la izquierda).
//
// Cada mazmorra tiene varias partidas que se juegan en orden. Al ganarlas todas, queda conquistada.
// Perder es caro: se pierde el progreso de la mazmorra y el enemigo recupera tu última conquista.

import { MAZOS, listaMazo } from './cartas.js';

// regla (opcional) de cada partida, de una lista corta:
//   rivalMuralla: el rival empieza con N bloques · rivalFortaleza: el rival tiene N de fortaleza
//   rivalRecursos: el rival empieza con N recursos · manoCorta: empiezas con N cartas · resistir: ganas si aguantas N turnos
export const REGLAS_ESPECIALES = ['rivalMuralla', 'rivalFortaleza', 'rivalRecursos', 'manoCorta', 'resistir'];

const p = (rival, regla = null, valor = 0) => ({ rival, regla, valor });

export const MAZMORRAS = {
  pueblo: { x: 7, y: 88, acto: 0, partidas: [] },
  m01: { x: 17, y: 74, acto: 1, monedas: 30, partidas: [p('equilibrada', 'rivalFortaleza', 14)] },
  m02: { x: 30, y: 62, acto: 1, monedas: 40, partidas: [p('agresiva'), p('equilibrada')] },
  m03: { x: 22, y: 42, acto: 1, monedas: 40, partidas: [p('constructora'), p('constructora', 'rivalMuralla', 3)] },
  m04: { x: 42, y: 54, acto: 2, monedas: 60, partidas: [p('saqueadora'), p('equilibrada', 'rivalMuralla', 3)] },
  m05: { x: 53, y: 36, acto: 2, monedas: 70, partidas: [p('constructora'), p('agresiva'), p('constructora', 'rivalFortaleza', 26)] },
  m06: { x: 62, y: 66, acto: 2, monedas: 60, partidas: [p('saqueadora'), p('saqueadora', 'resistir', 12)] },
  m07: { x: 72, y: 46, acto: 2, monedas: 80, partidas: [p('agresiva'), p('equilibrada'), p('agresiva', 'rivalMuralla', 3)] },
  m08: { x: 66, y: 22, acto: 3, monedas: 90, partidas: [p('saqueadora'), p('agresiva', 'manoCorta', 4), p('saqueadora', 'rivalFortaleza', 24)] },
  m09: { x: 82, y: 32, acto: 3, monedas: 90, partidas: [p('constructora', 'rivalMuralla', 6), p('equilibrada'), p('constructora', 'rivalFortaleza', 28)] },
  m10: { x: 90, y: 12, acto: 3, monedas: 150, partidas: [p('equilibrada', 'rivalMuralla', 5), p('agresiva', 'rivalRecursos', 2), p('constructora', 'rivalMuralla', 7)] },
};

export const CAMINOS = [
  ['pueblo', 'm01'], ['m01', 'm02'], ['m02', 'm03'], ['m02', 'm04'], ['m03', 'm04'], ['m04', 'm05'], ['m04', 'm06'],
  ['m05', 'm07'], ['m06', 'm07'], ['m07', 'm08'], ['m07', 'm09'], ['m08', 'm10'], ['m09', 'm10'],
];

export const MONEDAS = { victoriaPartida: 10, derrotaPartida: 3, escaramuza: 5 };

// Qué cuesta perder (calibrado con pruebas/progresion.mjs):
//   avance: 'reiniciar' (vuelves a la partida 1 de la mazmorra) · 'restar' (retrocedes una) · 'mantener'
//   rachaParaPerderTerritorio: derrotas seguidas para que el enemigo recupere tu última conquista (0 = nunca)
export const DERROTA = { avance: 'mantener', rachaParaPerderTerritorio: 3 };

export const vecinos = id => CAMINOS.filter(c => c.includes(id)).map(c => (c[0] === id ? c[1] : c[0]));

// ---------- progreso de la campaña ----------
// progreso: { conquistadas: [ids en orden de conquista], avance: { id: partidas ganadas }, monedas }

export function nuevaCampaña() {
  return { conquistadas: ['pueblo'], avance: {}, monedas: 0, racha: 0, recuperar: [] };
}

// Se puede jugar una mazmorra no conquistada que tenga un camino desde algo conquistado.
export function disponibles(prog) {
  const c = new Set(prog.conquistadas);
  return Object.keys(MAZMORRAS).filter(id => !c.has(id) && vecinos(id).some(v => c.has(v)));
}

export function estadoMazmorra(prog, id) {
  if (prog.conquistadas.includes(id)) return 'conquistada';
  return disponibles(prog).includes(id) ? 'disponible' : 'bloqueada';
}

export function siguientePartida(prog, id) {
  const m = MAZMORRAS[id];
  // Una mazmorra que el enemigo te quitó se reconquista con una sola partida: la última (la más difícil).
  if ((prog.recuperar || []).includes(id)) {
    const k = m.partidas.length - 1;
    return { indice: k, total: m.partidas.length, recuperar: true, ...m.partidas[k] };
  }
  const k = prog.avance[id] || 0;
  return k < m.partidas.length ? { indice: k, total: m.partidas.length, ...m.partidas[k] } : null;
}

// Aplica el resultado de una partida. Devuelve qué pasó, para mostrarlo en la ventana de narrativa.
export function registrarResultado(prog, id, gano) {
  const m = MAZMORRAS[id];
  if (gano) {
    prog.racha = 0;
    if ((prog.recuperar || []).includes(id)) {
      prog.recuperar = prog.recuperar.filter(x => x !== id);
      prog.conquistadas.push(id);
      prog.monedas += MONEDAS.victoriaPartida;
      return { tipo: 'reconquista', id, monedas: MONEDAS.victoriaPartida, abre: vecinos(id).filter(v => !prog.conquistadas.includes(v)) };
    }
    prog.avance[id] = (prog.avance[id] || 0) + 1;
    prog.monedas += MONEDAS.victoriaPartida;
    if (prog.avance[id] >= m.partidas.length) {
      prog.conquistadas.push(id);
      delete prog.avance[id];
      prog.monedas += m.monedas;
      return { tipo: 'conquista', id, monedas: MONEDAS.victoriaPartida + m.monedas, abre: vecinos(id).filter(v => !prog.conquistadas.includes(v)) };
    }
    return { tipo: 'avance', id, monedas: MONEDAS.victoriaPartida, faltan: m.partidas.length - prog.avance[id] };
  }
  // Derrota: retrocedes en la mazmorra y, tras una racha de derrotas, el enemigo recupera tu última conquista
  // (nunca el pueblo).
  prog.monedas += MONEDAS.derrotaPartida;
  prog.racha = (prog.racha || 0) + 1;
  if (DERROTA.avance === 'reiniciar') delete prog.avance[id];
  else if (DERROTA.avance === 'restar' && prog.avance[id]) prog.avance[id]--;
  let perdida = null;
  if (DERROTA.rachaParaPerderTerritorio && prog.racha >= DERROTA.rachaParaPerderTerritorio && prog.conquistadas.length > 1) {
    prog.racha = 0;
    perdida = prog.conquistadas.pop();
    // Lo que quedó sin camino desde el pueblo también se pierde.
    const conectadas = new Set(['pueblo']);
    let cambio = true;
    while (cambio) {
      cambio = false;
      for (const c of prog.conquistadas) if (!conectadas.has(c) && vecinos(c).some(v => conectadas.has(v))) { conectadas.add(c); cambio = true; }
    }
    const sueltas = prog.conquistadas.filter(c => !conectadas.has(c));
    prog.conquistadas = prog.conquistadas.filter(c => conectadas.has(c));
    prog.recuperar = [...new Set([...(prog.recuperar || []), perdida, ...sueltas])];
  }
  return { tipo: 'derrota', id, monedas: MONEDAS.derrotaPartida, perdida };
}

export const campañaGanada = prog => prog.conquistadas.includes('m10');

// Opciones para nuevaPartida() a partir de una partida de mazmorra.
export function opcionesPartida(partida, mazoJugador, PERSONALIDADES) {
  return {
    mazos: [mazoJugador, listaMazo(MAZOS[PERSONALIDADES[partida.rival].mazo])],
    regla: partida.regla ? { [partida.regla]: partida.valor } : {},
  };
}
