// Definiciones fijas de las cartas: SOLO mecánica. Ninguna temática las cambia.
// Los nombres, imágenes y ambientación viven en tematicas/<id>/tema.json, por código de carta.
//
// tipo: recolector | constructor | combatiente | estructura | efecto | maldicion
// claves (combatientes): veloz, guardia, incursor, distancia, asedio, sanador
// efecto.accion: daño, curar, refuerzo, recursos, robar, dañoTodos, escudo, derribar, muralla,
//                sequia, peste, debilidad, asedioMuralla (maldiciones), torre, almacen, cuartel, taller (estructuras)
// efecto.a (objetivo): unidadRival | unidadPropia | combatientePropio | (sin objetivo)

export const CARTAS = {
  // Recolectores (verde): gratis, uno por turno, producen desde que entran (como las tierras de Magic)
  R01: { tipo: 'recolector', costo: 0, vida: 2, prod: 1 },
  R02: { tipo: 'recolector', costo: 0, vida: 4, prod: 1 },
  R03: { tipo: 'recolector', costo: 0, vida: 1, prod: 2 },

  // Constructores (café)
  K01: { tipo: 'constructor', costo: 1, vida: 2, constr: 1 },
  K02: { tipo: 'constructor', costo: 3, vida: 2, constr: 2 },
  K03: { tipo: 'constructor', costo: 2, vida: 2, constr: 1, efecto: { accion: 'muralla', n: 2 } },

  // Combatientes (rojo)
  U01: { tipo: 'combatiente', costo: 1, ataque: 1, vida: 2, claves: [] },
  U02: { tipo: 'combatiente', costo: 2, ataque: 2, vida: 3, claves: [] },
  U03: { tipo: 'combatiente', costo: 2, ataque: 1, vida: 3, claves: ['guardia'] },
  U04: { tipo: 'combatiente', costo: 2, ataque: 2, vida: 1, claves: ['distancia'] },
  U05: { tipo: 'combatiente', costo: 3, ataque: 3, vida: 2, claves: ['veloz'] },
  U06: { tipo: 'combatiente', costo: 3, ataque: 2, vida: 3, claves: ['incursor'] },
  U07: { tipo: 'combatiente', costo: 4, ataque: 4, vida: 4, claves: [] },
  U08: { tipo: 'combatiente', costo: 6, ataque: 6, vida: 6, claves: [] },
  U09: { tipo: 'combatiente', costo: 3, ataque: 1, vida: 3, claves: ['sanador'] },
  U10: { tipo: 'combatiente', costo: 3, ataque: 2, vida: 4, claves: ['asedio'] },
  U11: { tipo: 'combatiente', costo: 6, ataque: 3, vida: 5, claves: ['guardia'] },
  U12: { tipo: 'combatiente', costo: 4, ataque: 3, vida: 2, claves: ['incursor', 'veloz'] },

  // Estructuras (gris)
  E01: { tipo: 'estructura', costo: 4, vida: 5, efecto: { accion: 'torre', n: 1 } },
  E02: { tipo: 'estructura', costo: 2, vida: 4, efecto: { accion: 'almacen', n: 1 } },
  E03: { tipo: 'estructura', costo: 4, vida: 6, efecto: { accion: 'cuartel' } },
  E04: { tipo: 'estructura', costo: 3, vida: 4, efecto: { accion: 'taller', n: 1 } },

  // Efectos (azul)
  F01: { tipo: 'efecto', costo: 1, efecto: { accion: 'daño', n: 2, a: 'unidadRival' } },
  F02: { tipo: 'efecto', costo: 4, efecto: { accion: 'daño', n: 4, a: 'unidadRival' } },
  F03: { tipo: 'efecto', costo: 1, efecto: { accion: 'curar', n: 3, a: 'unidadPropia' } },
  F04: { tipo: 'efecto', costo: 2, dur: 2, efecto: { accion: 'refuerzo', n: 2, a: 'combatientePropio' } },
  F05: { tipo: 'efecto', costo: 0, efecto: { accion: 'recursos', n: 2 } },
  F06: { tipo: 'efecto', costo: 2, efecto: { accion: 'robar', n: 2 } },
  F07: { tipo: 'efecto', costo: 4, efecto: { accion: 'dañoTodos', n: 1 } },
  F08: { tipo: 'efecto', costo: 2, efecto: { accion: 'escudo', n: 3, a: 'unidadPropia' } },
  F09: { tipo: 'efecto', costo: 3, efecto: { accion: 'derribar', n: 4 } },

  // Maldiciones (negro): caen sobre el rival entero; la muralla no las detiene
  M01: { tipo: 'maldicion', costo: 2, dur: 3, efecto: { accion: 'sequia', n: 1 } },
  M02: { tipo: 'maldicion', costo: 4, dur: 2, efecto: { accion: 'peste', n: 1 } },
  M03: { tipo: 'maldicion', costo: 2, dur: 2, efecto: { accion: 'debilidad', n: 1 } },
  M04: { tipo: 'maldicion', costo: 3, dur: 3, efecto: { accion: 'asedioMuralla', n: 2 } },
};

export const TIPOS = ['recolector', 'constructor', 'combatiente', 'estructura', 'efecto', 'maldicion'];

export const COLOR_TIPO = {
  recolector: '#3f7d3a',
  constructor: '#7a5532',
  combatiente: '#9b2f2a',
  estructura: '#6b6f74',
  efecto: '#2f5f9b',
  maldicion: '#2a2230',
};

export const ZONA_TIPO = {
  recolector: 'aldea',
  constructor: 'aldea',
  combatiente: 'frente',
  estructura: 'estructuras',
};

export const LIMITES = {
  aldea: 6, frente: 5, estructuras: 3, efectosMesa: 4,
  muralla: 10, recursos: 12, fortaleza: 20,
  mano: 9, mazo: 40, copias: 3,
  recursosIniciales: 0, cartaExtraSegundo: 1, recolectoresPorTurno: 1, roboPorTurno: 2, manoInicial: 5,
};

// Términos por defecto; una temática puede reemplazar cualquiera.
export const TERMINOS_BASE = {
  recurso: 'recurso', recursos: 'recursos',
  muralla: 'muralla', fortaleza: 'fortaleza', aldea: 'aldea', frente: 'frente',
  estructura: 'estructura', estructuras: 'estructuras', efectos: 'efectos',
  trabajador: 'trabajador', trabajadores: 'trabajadores',
  combatiente: 'combatiente', combatientes: 'combatientes',
  recolector: 'Recolector', constructor: 'Constructor', combatienteTipo: 'Combatiente',
  estructuraTipo: 'Estructura', efecto: 'Efecto', maldicion: 'Maldición',
  veloz: 'Veloz', guardia: 'Guardia', incursor: 'Incursor', distancia: 'Distancia', asedio: 'Asedio', sanador: 'Sanador',
};

// Texto de reglas generado a partir de los valores fijos: nunca contradice la mecánica.
export function textoReglas(def, t = TERMINOS_BASE) {
  const T = { ...TERMINOS_BASE, ...t };
  const p = [];
  const e = def.efecto || {};
  const turnos = d => d === 1 ? 'este turno' : `${d} turnos`;
  if (def.tipo === 'recolector') p.push(`Gratis, uno por turno. Produce ${def.prod} ${def.prod === 1 ? T.recurso : T.recursos} al entrar y al inicio de cada turno.`);
  if (def.tipo === 'constructor') p.push(`Suma ${def.constr} a la ${T.muralla} al entrar y al inicio de cada turno.`);
  if (def.claves && def.claves.length) p.push(def.claves.map(k => T[k]).join(', ') + '.');
  switch (e.accion) {
    case 'muralla': p.push(`Al entrar: +${e.n} a la ${T.muralla}.`); break;
    case 'torre': p.push(`Defiende: el primer ${T.combatiente} rival que te ataca cada turno recibe ${e.n} de daño antes de golpear.`); break;
    case 'almacen': p.push(`+${e.n} ${T.recurso} al inicio de tu turno.`); break;
    case 'cuartel': p.push(`Tus ${T.combatientes} entran listos para atacar.`); break;
    case 'taller': p.push(`Cada ${T.constructor.toLowerCase()} suma +${e.n} a la ${T.muralla}.`); break;
    case 'daño': p.push(`${e.n} de daño a una unidad rival.`); break;
    case 'curar': p.push(`Cura ${e.n} a una unidad tuya.`); break;
    case 'refuerzo': p.push(`+${e.n} de ataque a un ${T.combatiente} tuyo durante ${turnos(def.dur)}.`); break;
    case 'recursos': p.push(`+${e.n} ${T.recursos} ahora.`); break;
    case 'robar': p.push(`Roba ${e.n} cartas.`); break;
    case 'dañoTodos': p.push(`${e.n} de daño a cada ${T.combatiente} rival.`); break;
    case 'escudo': p.push(`+${e.n} de vida a una unidad tuya.`); break;
    case 'derribar': p.push(`Quita ${e.n} bloques a la ${T.muralla} rival.`); break;
    case 'sequia': p.push(`El rival produce ${e.n} ${T.recurso} menos por turno durante ${turnos(def.dur)}.`); break;
    case 'peste': p.push(`${e.n} de daño a cada ${T.trabajador} rival al inicio de su turno, durante ${turnos(def.dur)}.`); break;
    case 'debilidad': p.push(`Los ${T.combatientes} rivales tienen -${e.n} de ataque durante ${turnos(def.dur)}.`); break;
    case 'asedioMuralla': p.push(`La ${T.muralla} rival pierde ${e.n} bloques al inicio de su turno, durante ${turnos(def.dur)}.`); break;
  }
  return p.join(' ');
}

export function nombreTipo(tipo, t = TERMINOS_BASE) {
  const T = { ...TERMINOS_BASE, ...t };
  return { recolector: T.recolector, constructor: T.constructor, combatiente: T.combatienteTipo,
    estructura: T.estructuraTipo, efecto: T.efecto, maldicion: T.maldicion }[tipo];
}

// Mazos iniciales (30 cartas). Cada uno empuja un estilo de juego distinto.
export const MAZOS = {
  equilibrado: { R01: 3, R02: 3, R03: 3, K01: 3, K02: 1, K03: 1, U01: 2, U02: 3, U03: 2, U04: 2, U05: 2, U07: 3, U08: 1, U09: 1, U10: 1,
    F01: 2, F02: 1, F03: 1, F06: 1, F08: 1, M03: 1, E01: 1, E02: 1 },
  constructor: { R01: 3, R02: 3, R03: 2, K01: 3, K02: 1, K03: 2, U01: 2, U02: 3, U03: 2, U04: 3, U07: 3, U08: 1, U10: 1, U11: 1,
    E01: 2, E04: 1, F01: 3, F02: 1, F07: 1, F08: 1, M03: 1 },
  agresivo: { R01: 3, R02: 3, R03: 3, K01: 1, U01: 3, U02: 3, U05: 3, U06: 2, U07: 3, U08: 1, U10: 2, U12: 2,
    F01: 2, F02: 1, F04: 2, F05: 1, F09: 2, M03: 1, M04: 1, E03: 1 },
  saqueador: { R01: 3, R02: 3, R03: 3, K01: 2, U01: 2, U02: 3, U03: 1, U04: 2, U05: 2, U06: 3, U07: 2, U12: 3,
    F01: 3, F02: 1, F06: 1, F07: 1, M01: 2, M02: 2, E02: 1 },
};

export function listaMazo(receta) {
  const l = [];
  for (const [id, n] of Object.entries(receta)) for (let i = 0; i < n; i++) l.push(id);
  return l;
}
