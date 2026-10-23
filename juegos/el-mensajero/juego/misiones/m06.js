// Misión 6 · «Al puerto de Seleucia» (Hechos 13:1-5). El Espíritu Santo aparta a Bernabé y a Saulo; bajan a
// Seleucia para navegar a Chipre. Eliab lleva las cartas de la iglesia y debe llegar al barco (ficción):
// muelle → barcas que suben y bajan con las olas → muelle viejo de tablas que se caen → guardia del puerto
// (cajas para esconderse) → plataforma de la grúa sobre el agua → caja para subir al almacén → cuerda al barco.

export const DATOS = {
  id: 'm06', titulo: 'm06t', lugar: 'm06l', ambiente: 'dia', fondo: 'puerto', pintura: 'puerto', matSuelo: 'muelle',
  limites: [-5.5, 131], caidaY: -3,
  suelo: [[-9, 22], [38, 46], [52, 70], [96, 108]],
  tejados: [[100, 106, 4.6, 'piedra']],
  casasFondo: [[-4, 22, 4.6, [[6], [15]]], [52, 70, 5, [[62]]], [96, 108, 6, []]],
  bloques: [
    [-9, -4, 0, 9, 'piedra'],
    [10, 11, 0, 1.0, 'caja'],
    [110, 130, -2, 3.0, 'maderaVieja'],                       // casco del barco (cubierta a 3 m)
    [117, 120, 8.7, 9, 'madera'],                              // cofa del mástil (pergamino)
    [129, 131, 3, 6, 'madera'],                                // popa
  ],
  aguas: [[22, 38, -0.4], [46, 52, -0.4], [70, 96, -0.4], [108, 110, -0.4]],
  moviles: [
    { x0: 23, x1: 26, y: 0, dy: 0.45, periodo: 2.2, sinSogas: true },
    { x0: 28, x1: 31, y: 0.2, dy: 0.45, periodo: 2.6, fase: 0.3, sinSogas: true },
    { x0: 33, x1: 36, y: 0, dy: 0.45, periodo: 2.4, fase: 0.6, sinSogas: true },
    { x0: 71, x1: 73.6, y: 1.4, dx: 20, periodo: 12 },        // plataforma de la grúa
  ],
  caedizas: [[46, 47.5, 0], [47.5, 49, 0], [49, 50.5, 0], [50.5, 52, 0]],
  coberturas: [[57.5, 'caja'], [69.2, 'barril']],   // los barriles junto a la grúa: esperarla agachado
  guardias: [{ x: 60, ruta: [55, 66], dir: 1 }],   // empieza de espaldas al punto de control
  cajas: [{ x: 98.5, a: 1.1, h: 1.1 }],
  tirolesas: [[105.4, 7.4, 116, 5.3]],
  escaleras: [[116.6, 3, 9, 'cuerda']],
  mastiles: [[118.25, 3, 13]],   // detrás del camino: se pasa por delante
  control: [[1, 0, 1], [40, 0, 1], [53, 0, 1], [97, 0, 1]],
  meta: { x: 124, y: 3 },
  pergaminos: [[30, 2.2], [64, 1.2], [117.6, 9.9]],
  cantaros: [[20, 0], [41.5, 0], [54, 0], [102, 4.6]],
  faroles: [[4, 2.5], [18, 2.5], [44, 2.2, -0.4], [60, 2.5], [101, 6.0]],
  objetos: [['barca_varada', 14, 0, -1.4, 2.6], ['tinajas_barro', 56, 0, -9, 2], ['palmera_datilera', 2, 0, -8, 8], ['cipres', 104, 0, -9, 9]],
  pistas: [[2, 'm06pInicio'], [21, 'm06pBarcas'], [45, 'pCaediza'], [53.5, 'm06pGuardia'], [70.5, 'm06pGrua'], [97.5, 'pCaja'], [104.5, 'pTirolesa']],
  objetivos: [[-99, 'm06o1'], [96, 'm06o2']],
  prefijoPergaminos: 'm06perg',
  intro: ['m06i1', ['m06iCita', 'm06iRef'], 'm06i2'],
  ficcion: 'm06ficcion',
  final: { tarjetas: [{ texto: 'm06f1', ref: 'm06f1Ref' }, { texto: 'm06f2', ficcion: true }] },
};
