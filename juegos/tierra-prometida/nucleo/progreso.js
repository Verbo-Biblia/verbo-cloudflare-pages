// Progresión FIJA del jugador: colección, monedas, tienda, desbloqueos y mazos.
// Igual para todas las temáticas (la temática solo nombra las cartas).
//
// - Empiezas con la colección inicial (forma un mazo de 40 listo para jugar).
// - Conquistar una mazmorra por primera vez da su carta de premio y abre una tanda nueva en la tienda.
// - Las monedas se ganan jugando (campaña y partida rápida) y se gastan en la tienda: cartas sueltas, sin azar.
// - Lo desbloqueado nunca se pierde, aunque el enemigo recupere territorio.

import { CARTAS, LIMITES, listaMazo } from './cartas.js';
import { MAZMORRAS, nuevaCampaña, registrarResultado, campañaGanada, MONEDAS } from './mundo.js';

// Colección inicial = mazo inicial (40 cartas básicas).
export const COLECCION_INICIAL = {
  R01: 3, R02: 3, R03: 3, K01: 3, K03: 2,
  U01: 3, U02: 3, U03: 3, U04: 3, U05: 2, U07: 3,
  F01: 3, F03: 2, F06: 2, E02: 1, M03: 1,
};

// Qué tanda de la tienda abre cada mazmorra al conquistarla por primera vez, y qué carta regala.
export const DESBLOQUEOS = {
  pueblo: { tienda: ['R01', 'R02', 'R03', 'K01', 'K03', 'U01', 'U02', 'U03', 'U04', 'U05', 'U07', 'F01', 'F03', 'F06', 'E02', 'M03'] },
  m01: { premio: 'E01', tienda: ['E01', 'F08'] },
  m02: { premio: 'U10', tienda: ['U10', 'F04'] },
  m03: { premio: 'K02', tienda: ['K02', 'E04'] },
  m04: { premio: 'U06', tienda: ['U06', 'F02', 'M01'] },
  m05: { premio: 'F02', tienda: ['U09', 'F05'] },
  m06: { premio: 'M01', tienda: ['M02', 'F07'] },
  m07: { premio: 'U08', tienda: ['U08', 'U11'] },
  m08: { premio: 'U12', tienda: ['U12', 'M04'] },
  m09: { premio: 'E03', tienda: ['E03', 'F09'] },
  m10: { premio: 'U08', tienda: [] },
};

export const MONEDAS_ESCARAMUZA = { gana: 5, pierde: 1 };

// Precio en la tienda: los recolectores son baratos; el resto, según su costo en la partida.
export function precio(id) {
  const d = CARTAS[id];
  return d.tipo === 'recolector' ? 10 : 15 + d.costo * 8;
}

export function nuevoProgreso() {
  return {
    ...nuevaCampaña(),           // conquistadas, avance, monedas
    premiados: ['pueblo'],       // mazmorras que ya dieron su premio (nunca se repite)
    coleccion: { ...COLECCION_INICIAL },
    mazos: [{ nombre: 'Mazo inicial', receta: { ...COLECCION_INICIAL } }],
    mazoActivo: 0,
    escaramuzas: { ganadas: 0, jugadas: 0 },
  };
}

// Cartas a la venta: lo abierto por las mazmorras conquistadas alguna vez, hasta tener 3 copias.
export function tienda(prog) {
  const abiertas = new Set(prog.premiados.flatMap(id => DESBLOQUEOS[id]?.tienda || []));
  // Al ganar la campaña se abre todo.
  if (campañaGanada(prog)) Object.keys(CARTAS).forEach(id => abiertas.add(id));
  return [...abiertas]
    .filter(id => (prog.coleccion[id] || 0) < LIMITES.copias)
    .map(id => ({ id, precio: precio(id), tengo: prog.coleccion[id] || 0 }));
}

export function comprar(prog, id) {
  const oferta = tienda(prog).find(o => o.id === id);
  if (!oferta || prog.monedas < oferta.precio) return false;
  prog.monedas -= oferta.precio;
  prog.coleccion[id] = (prog.coleccion[id] || 0) + 1;
  return true;
}

function darCarta(prog, id) {
  if ((prog.coleccion[id] || 0) < LIMITES.copias) { prog.coleccion[id] = (prog.coleccion[id] || 0) + 1; return id; }
  prog.monedas += precio(id); // si ya tienes 3, se paga en monedas
  return null;
}

// Resultado de una partida de campaña: territorio (mundo.js) + premios de la primera conquista.
export function resultadoCampaña(prog, mazmorra, gano) {
  const r = registrarResultado(prog, mazmorra, gano);
  if (r.tipo === 'conquista' && !prog.premiados.includes(mazmorra)) {
    prog.premiados.push(mazmorra);
    const d = DESBLOQUEOS[mazmorra] || {};
    r.premio = d.premio ? darCarta(prog, d.premio) : null;
    r.tienda = d.tienda || [];
    r.primeraVez = true;
  }
  if (campañaGanada(prog)) r.campañaGanada = true;
  return r;
}

export function resultadoEscaramuza(prog, gano) {
  prog.escaramuzas.jugadas++;
  if (gano) prog.escaramuzas.ganadas++;
  const m = gano ? MONEDAS_ESCARAMUZA.gana : MONEDAS_ESCARAMUZA.pierde;
  prog.monedas += m;
  return { monedas: m };
}

// Crónicas desbloqueadas: las de las mazmorras conquistadas alguna vez (y las del inicio).
export function cronicasAbiertas(prog, cronicas = []) {
  return cronicas.filter(c => prog.premiados.includes(c.desbloquea || 'pueblo'));
}

// Un mazo es válido si tiene 40 cartas, máximo 3 copias y todas están en la colección.
export function revisarMazo(prog, receta) {
  const problemas = [];
  const total = Object.values(receta).reduce((s, n) => s + n, 0);
  if (total !== LIMITES.mazo) problemas.push(`El mazo tiene ${total} cartas; deben ser ${LIMITES.mazo}.`);
  for (const [id, n] of Object.entries(receta)) {
    if (n > LIMITES.copias) problemas.push(`${id}: máximo ${LIMITES.copias} copias.`);
    if (n > (prog.coleccion[id] || 0)) problemas.push(`${id}: tienes ${prog.coleccion[id] || 0}.`);
  }
  const recolectores = Object.entries(receta).filter(([id]) => CARTAS[id].tipo === 'recolector').reduce((s, [, n]) => s + n, 0);
  if (recolectores < 7) problemas.push(`Solo ${recolectores} recolectores: se recomiendan 8 o más.`);
  return problemas;
}

export function mazoActivo(prog) {
  return listaMazo(prog.mazos[prog.mazoActivo]?.receta || COLECCION_INICIAL);
}

export { MONEDAS, MAZMORRAS };
