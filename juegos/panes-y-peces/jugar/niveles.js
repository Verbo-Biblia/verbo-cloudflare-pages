// Niveles sin fin: el nivel n siempre sale igual (semilla = n). Los 20 primeros siguen una curva pensada a mano;
// del 21 en adelante se mezclan formas y objetivos con dificultad que sube despacio y descansos cada 5.
// Un tema puede fijar niveles propios en tema.niveles (lista; el índice 0 es el nivel 1) y esos mandan.
import { azarConSemilla } from './tablero.js?v=6a08fd71';
import { CALIBRADOS } from './calibrados.js?v=6a08fd71';

// ---------- formas del tablero (true = casilla) ----------
const FORMAS = {
  lleno: () => true,
  esquinas: (r, c, F, C) => !((r === 0 || r === F - 1) && (c === 0 || c === C - 1)),
  rombo: (r, c, F, C) => Math.abs(r - (F - 1) / 2) + Math.abs(c - (C - 1) / 2) <= Math.max(F, C) / 2 + 0.5,
  cruz: (r, c, F, C) => !((r < 2 || r > F - 3) && (c < 2 || c > C - 3)),
  hueco: (r, c, F, C) => !(Math.abs(r - (F - 1) / 2) < 1 && Math.abs(c - (C - 1) / 2) < 1.5),
  reloj: (r, c, F, C) => Math.abs(c - (C - 1) / 2) <= 1.5 + Math.abs(r - (F - 1) / 2) * 0.9,
  pilares: (r, c, F, C) => !((c === 2 || c === C - 3) && r >= 2 && r <= F - 3),
  copa: (r, c, F, C) => r < F - 3 || Math.abs(c - (C - 1) / 2) <= 1.5,
};

// ---------- dónde van capas y bloques ----------
const ZONAS = {
  todo: () => true,
  centro: (r, c, F, C) => Math.abs(r - (F - 1) / 2) <= 1.5 && Math.abs(c - (C - 1) / 2) <= 1.5,
  abajo: (r, c, F) => r >= F - 3,
  borde: (r, c, F, C) => r === 0 || c === 0 || r === F - 1 || c === C - 1,
  ajedrez: (r, c) => (r + c) % 2 === 0,
  franja: (r, c, F) => Math.abs(r - (F - 1) / 2) < 1,
  esquinas: (r, c, F, C) => (r < 3 || r > F - 4) && (c < 3 || c > C - 4),
};

// Bloques: en fila a media altura (con hueco) o sueltos en espejo.
const MUROS = {
  fila: (r, c, F) => r === Math.floor(F / 2) && c % 3 !== 1,
  dientes: (r, c, F, C) => r === Math.floor(F / 2) && c % 2 === 0,
  sueltos: (r, c, F, C, azar) => r > 0 && r < F - 1 && azar() < 0.13,
  arriba: (r, c, F, C) => r === 2 && c > 0 && c < C - 1 && c % 3 !== 0,
  islas: (r, c, F, C) => (r === 2 || r === F - 4) && (c === 1 || c === 2 || c === C - 2 || c === C - 3),
};

function dibujar({ filas, cols, forma = 'lleno', capas = null, capa2 = false, bloques = null, bloque2 = false, semilla }) {
  const azar = azarConSemilla(semilla * 31 + 7);
  const mapa = [];
  for (let r = 0; r < filas; r++) {
    let fila = '';
    for (let c = 0; c < cols; c++) {
      if (!FORMAS[forma](r, c, filas, cols)) { fila += '#'; continue; }
      if (bloques && MUROS[bloques](r, c, filas, cols, azar)) { fila += bloque2 ? 'P' : 'p'; continue; }
      if (capas && ZONAS[capas](r, c, filas, cols)) { fila += capa2 ? 'C' : 'c'; continue; }
      fila += '.';
    }
    mapa.push(fila);
  }
  // Bloques sueltos: en espejo para que se vea ordenado.
  if (bloques === 'sueltos') {
    for (let r = 0; r < filas; r++) {
      const f = [...mapa[r]];
      for (let c = 0; c < cols; c++) if (f[c] === 'p' || f[c] === 'P') f[cols - 1 - c] = f[c];
      mapa[r] = f.join('');
    }
  }
  return abrirPaso(mapa);
}

// Una casilla debajo de un bloque solo se llena en diagonal; si las dos diagonales de arriba también son bloque,
// quedaría vacía para siempre: se quita ese bloque.
function abrirPaso(mapa) {
  const m = mapa.map(f => [...f]);
  const esBloque = (r, c) => m[r]?.[c] === 'p' || m[r]?.[c] === 'P';
  const sirve = (r, c) => m[r]?.[c] !== undefined && m[r][c] !== '#' && !esBloque(r, c);
  for (let cambio = true; cambio;) {
    cambio = false;
    for (let r = 0; r < m.length - 1; r++) for (let c = 0; c < m[r].length; c++) {
      if (!esBloque(r, c)) continue;
      let y = r + 1;
      while (y < m.length && m[y][c] === '#') y++;
      if (y >= m.length || esBloque(y, c)) continue;
      if (!sirve(y - 1, c - 1) && !sirve(y - 1, c + 1)) { m[r][c] = '.'; cambio = true; }
    }
  }
  return m.map(f => f.join(''));
}

// La curva de los 20 primeros: [filas, cols, tipos, forma, objetivos, extras]
// Objetivos: 'puntos' · 'recoger' (una pieza) · 'recoger2' (dos piezas) · 'capas' · 'bloques' · 'bajar'
const CURVA = [
  [7, 7, 5, 'lleno', ['puntos']],
  [7, 7, 5, 'lleno', ['recoger']],
  [8, 8, 5, 'esquinas', ['puntos']],
  [8, 8, 5, 'lleno', ['capas'], { capas: 'centro' }],
  [8, 8, 5, 'lleno', ['bajar'], { cestas: 2 }],
  [8, 8, 6, 'lleno', ['bloques'], { bloques: 'fila' }],
  [8, 8, 6, 'rombo', ['recoger2']],
  [8, 8, 6, 'lleno', ['capas'], { capas: 'franja' }],
  [9, 8, 6, 'cruz', ['bloques', 'recoger'], { bloques: 'dientes' }],
  [9, 9, 5, 'esquinas', ['bajar', 'capas'], { cestas: 3, capas: 'centro' }],
  [9, 9, 6, 'hueco', ['puntos']],
  [9, 9, 6, 'lleno', ['capas'], { capas: 'centro', capa2: true }],
  [9, 9, 6, 'reloj', ['recoger2']],
  [9, 9, 6, 'lleno', ['bloques'], { bloques: 'sueltos', bloque2: true }],
  [9, 9, 5, 'lleno', ['bajar'], { cestas: 3 }],
  [9, 9, 6, 'rombo', ['capas'], { capas: 'franja' }],
  [9, 9, 6, 'copa', ['recoger', 'capas'], { capas: 'abajo' }],
  [9, 9, 6, 'esquinas', ['bloques', 'capas'], { bloques: 'arriba', capas: 'centro' }],
  [9, 9, 6, 'lleno', ['bajar', 'recoger'], { cestas: 2 }],
  [9, 9, 6, 'lleno', ['capas', 'bloques'], { capas: 'centro', capa2: true, bloques: 'islas' }],
];

// Dificultad: 0 en el nivel 1, ~1 hacia el 30, sube lento después.
function presion(n) { return Math.min(1.4, (n - 1) / 30 + Math.max(0, n - 30) / 200); }

// Arma el nivel n sin los movimientos (esos los fija la calibración). variante = otra versión del mismo nivel.
export function generarNivel(n, totalPiezas = 6, variante = 0) {
  const azar = azarConSemilla(n * 9973 + 11 + variante * 7919);
  const elegir = lista => lista[Math.floor(azar() * lista.length)];
  let filas, cols, tipos, forma, kinds, extras;
  if (n <= CURVA.length) {
    [filas, cols, tipos, forma, kinds, extras = {}] = CURVA[n - 1];
  } else {
    filas = 9; cols = elegir([8, 9, 9]);
    tipos = n % 5 === 1 ? 5 : 6; // cada 5 niveles, uno de descanso
    forma = elegir(Object.keys(FORMAS));
    const solos = ['puntos', 'recoger', 'recoger2', 'capas', 'bloques', 'bajar'];
    const pares = [['capas', 'bloques'], ['recoger', 'capas'], ['bajar', 'capas'], ['bloques', 'recoger'], ['bajar', 'recoger'], ['recoger2', 'bloques']];
    kinds = azar() < 0.45 ? [elegir(solos)] : elegir(pares);
    extras = {};
    if (kinds.includes('capas')) { extras.capas = elegir(['centro', 'franja', 'abajo', 'centro']); extras.capa2 = azar() < presion(n) * 0.5; }
    if (kinds.includes('bloques')) { extras.bloques = elegir(Object.keys(MUROS)); extras.bloque2 = azar() < presion(n) * 0.6; }
    if (kinds.includes('bajar')) { extras.cestas = 2 + Math.floor(azar() * 2); if (forma === 'copa' || forma === 'reloj') forma = 'lleno'; }
  }
  tipos = Math.min(tipos, totalPiezas);
  const mapa = dibujar({ filas, cols, forma, ...extras, semilla: n + variante * 1000 });
  const activas = mapa.join('').replace(/#/g, '').length;
  const piezaA = Math.floor(azar() * tipos);
  const piezaB = (piezaA + 1 + Math.floor(azar() * (tipos - 1))) % tipos;
  const objetivos = [];
  for (const k of kinds) {
    if (k === 'puntos') objetivos.push({ tipo: 'puntos', n: Math.round((5000 + activas * 40 + n * 150) / 100) * 100 });
    if (k === 'recoger') objetivos.push({ tipo: 'recoger', pieza: piezaA, n: Math.min(60, 16 + Math.round(n * 0.7)) });
    if (k === 'recoger2') {
      const m = Math.min(45, 12 + Math.round(n * 0.5));
      objetivos.push({ tipo: 'recoger', pieza: piezaA, n: m }, { tipo: 'recoger', pieza: piezaB, n: m });
    }
    if (k === 'capas') objetivos.push({ tipo: 'capas' });
    if (k === 'bloques') objetivos.push({ tipo: 'bloques' });
    if (k === 'bajar') objetivos.push({ tipo: 'bajar', n: extras.cestas });
  }
  return { numero: n, mapa, tipos, movimientos: 25, objetivos, estrellas: [0, 6000, 9000], cestasALaVez: 2 };
}

// Nivel listo para jugar. Los calibrados (pruebas/calibrar.sh) traen variante, movimientos y estrellas; después del
// último calibrado se vuelve a empezar la lista con el tablero en espejo y algo menos de movimientos.
export function nivel(n, tema = {}) {
  const propio = tema.niveles?.[n - 1];
  if (propio) return { numero: n, cestasALaVez: 2, estrellas: [0, propio.movimientos * 250, propio.movimientos * 400], ...propio };
  const L = CALIBRADOS.length;
  if (!L) return generarNivel(n, tema.piezas?.length || 6);
  const base = ((n - 1) % L) + 1, ciclo = Math.floor((n - 1) / L);
  const [variante, movs, e2, e3] = CALIBRADOS[base - 1];
  const nv = generarNivel(base, tema.piezas?.length || 6, variante);
  const menos = 1 - 0.05 * Math.min(ciclo, 4);
  nv.numero = n;
  nv.movimientos = Math.max(12, Math.round(movs * menos));
  nv.estrellas = [0, Math.round(e2 * menos / 100) * 100, Math.round(e3 * menos / 100) * 100];
  if (ciclo % 2) nv.mapa = nv.mapa.map(f => [...f].reverse().join(''));
  return nv;
}
