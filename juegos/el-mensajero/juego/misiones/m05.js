// Misión 5 · «Antioquía» (Hechos 11:19-26). Eliab llega con las cartas de Jerusalén. En el mercado un ladrón le
// arrebata la bolsa (ficción): persecución corriendo (cántaros de agua para no cansarse) entre barriles, carretas,
// callejones y una viga baja. Recuperada la bolsa, escalada por los techos hasta la casa donde se reúne la iglesia.

export const DATOS = {
  id: 'm05', titulo: 'm05t', lugar: 'm05l', ambiente: 'atardecer', fondo: 'ciudad', templo: false, pintura: 'antioquia',
  limites: [-5.5, 162], caidaY: -3,
  modelos: ['creyente'],
  suelo: [[-9, 52], [54.5, 84], [86.5, 168]],
  tejados: [[124, 130, 3.0], [132, 137, 6.0], [139.6, 145, 9.0], [147, 160, 11.5]],
  casasFondo: [
    [-4, 14, 5.2, [[5]]], [14, 28, 6, [[21]]], [28, 44, 5.4, [[36]]], [44, 60, 6.4, [[49]]], [60, 76, 5, [[70]]],
    [76, 92, 6.2, [[80]]], [92, 108, 5.6, [[100]]], [108, 124, 6.6, [[116]]],
  ],
  bloques: [
    [-9, -4, 0, 9, 'revoque'],
    [20, 20.8, 0, 0.9, 'barril'], [30, 32.2, 0, 1.1, 'carreta'], [40, 41, 0, 1.0, 'caja'],
    [62, 66, 1.15, 9, 'piedra'], [74, 74.8, 0, 0.9, 'barril'], [95, 96, 0, 1.0, 'caja'], [104, 104.8, 0, 0.9, 'barril'],
    [160, 168, 0, 16, 'revoque'],
  ],
  vigas: [[61.8, 66.2, 1.15, 1.45]],
  toldos: [[10, 14, 2.3, 'toldoRojo'], [24, 28, 2.3, 'toldoAzul'], [44, 48, 2.3, 'toldoVerde'], [88, 92, 2.3, 'toldoRojo']],
  moviles: [{ x0: 137.4, x1: 139.2, y: 6, dy: 3, periodo: 4.5 }],
  escaleras: [[146.4, 9, 11.5]],
  huidor: { x: 9, escape: 118, vel: 6.0 },
  control: [[1, 0, 1], [55.5, 0, 1], [119, 0, 1], [140.5, 9, 1]],
  meta: { x: 152, y: 11.5 },
  pergaminos: [[46, 3.0], [127, 3.6], [154, 12.2]],
  cantaros: [[16, 0], [36, 0], [58, 0], [80, 0], [99, 0], [112, 0]],
  faroles: [[6, 2.5], [22, 2.6], [38, 2.5], [56, 2.6], [72, 2.5], [90, 2.6], [106, 2.5], [128, 4.4], [143, 10.4], [151, 12.9]],
  objetos: [['puesto_mercado', 8, 0, -1.0, 3.2], ['puesto_mercado', 52, 0, -1.0, 3.2], ['tinajas_barro', 66.5, 0, -9, 2],
    ['palmera_datilera', 30, 0, -9, 9], ['cipres', 86, 0, -9, 9], ['palmera_datilera', 114, 0, -9, 8.5], ['ropa_tendida', 134.5, 6, -3, 2.4]],
  pistas: [[2, 'm05pInicio'], [118.5, 'm05pSubir'], [136.5, 'pMovil']],
  objetivos: [[-99, 'm05o1']],
  objPersecucion: 'm05oLadron', objEscape: 'm05o2',
  prefijoPergaminos: 'm05perg',
  intro: ['m05i1', 'm05i2', ['m05iCita', 'm05iRef'], 'm05i3'],
  ficcion: 'm05ficcion',
  modelosFinal: ['maria'],
  // en el techo de la casa lo espera la iglesia (Hechos 13:1): cuatro creyentes, quietos
  final: { grupo: [{ modelo: 'creyente', dx: 1.5, z: -0.6 }, { modelo: 'maria', dx: 2.4, z: -1.3 },
      { modelo: 'creyente', dx: 3.2, z: -0.4, tinte: 0xb8c8e0 }, { modelo: 'creyente', dx: 4.1, z: -1.1, tinte: 0xe0c49a }],
    tarjetas: [{ texto: 'm05f1', ficcion: true, quien: 'fin1Quien' }, { texto: 'm05f2' }, { texto: 'm05f3', ref: 'm05f3Ref' }] },
};
