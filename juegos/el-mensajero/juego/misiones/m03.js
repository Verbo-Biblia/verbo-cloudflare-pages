// Misión 3 · «El alboroto» (Hechos 12:18-19, 24). Al amanecer los soldados buscan a Pedro por toda Jerusalén.
// Eliab lleva el aviso a Jacobo: calle vigilada (portales, barriles, toldos) → caja para subir a los techos →
// cuerda de techo a techo → plaza con dos soldados y una plataforma de polea → callejón por donde bajan rodando
// los barriles de un carro → casa de Jacobo.

export const DATOS = {
  id: 'm03', titulo: 'm03t', lugar: 'm03l', ambiente: 'amanecer', fondo: 'ciudad', templo: true, pintura: 'jerusalen_amanecer',
  limites: [-5.5, 166],
  suelo: [[-9, 172]],
  tejados: [[33, 40, 4.2], [42, 49, 4.2], [57, 64, 3.2], [82, 90, 5.2], [93, 99, 4.2]],
  casasFondo: [
    [-4, 10, 4.6, [[3, 1.2, 2.1]]], [10, 20, 5.4, [[15.5, 1.4, 2.2]]], [20, 33, 5, [[22, 1.4, 2.2], [28]]],
    [64, 72, 4.4, [[68]]], [72, 82, 5.6, [[74.5, 1.4, 2.2]]], [99, 112, 4.6, [[104]]], [112, 126, 5.2, [[119]]],
    [126, 142, 4.8, [[133]]], [142, 152, 5.4, [[146]]], [152, 166, 5.8, [[158.5, 1.3, 2.2]]],
  ],
  casasRelleno: [[40, 57, 3.2], [57, 66, 2.6]],
  bloques: [
    [-9, -4, 0, 9, 'revoque'],
    [6.2, 7.2, 0, 1.0, 'caja'],
    [108, 109, 0, 1.0, 'caja'], [118, 119, 0, 1.0, 'caja'], [128, 129, 0, 1.0, 'caja'],
    [139, 141.2, 0, 1.1, 'carreta'],
    [166, 171, 0, 9, 'revoque'],
  ],
  toldos: [[9, 13, 2.3, 'toldoAzul'], [15, 19, 2.3, 'toldoRojo'], [21.5, 25.5, 2.3, 'toldoVerde'],
    [112, 116, 2.3, 'toldoRojo'], [122, 126, 2.3, 'toldoAzul'], [132, 136, 2.3, 'toldoVerde']],
  puertas: [15.5, 22, 28, 68, 74.5],
  coberturas: [[18.6, 'barril'], [78.3, 'barril'], [92, 'barril']],   // junto a la polea: esperar agachado
  cajas: [{ x: 31, a: 1.1, h: 1.1 }],
  tirolesas: [[47.6, 6.9, 58.6, 5.5]],
  moviles: [{ x0: 79.6, x1: 81.8, y: 0, dx: 0, dy: 5.2, periodo: 5 }],
  rodantes: [{ x: 138.5, hasta: 99, cada: 2.4, vel: 4.2, tam: 0.85 }],
  guardias: [
    { x: 20, ruta: [12, 23], dir: -1 },
    { x: 53, ruta: [50, 56], dir: 1 },
    { x: 70, ruta: [66, 73], dir: 1, ajustes: { velocidadPatrulla: 1.7 } },
  ],
  control: [[1, 0, 1], [30.2, 0, 1], [65.5, 0, 1], [100.5, 0, 1], [142.5, 0, 1]],
  meta: { x: 157 },
  pergaminos: [[36.5, 4.9], [86, 6.4], [113.8, 3.0]],
  cantaros: [[41, 4.2], [88.5, 5.2], [101.5, 0], [123.5, 0]],
  faroles: [[2.5, 2.5], [19, 2.5], [29, 2.5], [44, 5.6], [66, 2.5], [92, 2.5], [101, 2.5], [117, 2.5], [137, 2.5], [150, 2.5], [158, 2.6, -0.6]],
  deco: [['palmera1', 8, 0, -7.4, 7.2], ['palmera2', 52, 0, -12, 8], ['palmera1', 120, 0, -7.4, 7.4], ['palmera2', 150, 0, -7.2, 7]],
  objetos: [['ropa_tendida', 45.5, 4.2, -3.2, 2.6], ['puesto_mercado', 88, 0, -9, 4], ['olivo', 160, 0, -7.6, 6]],
  pistas: [[2, 'm03pInicio'], [30, 'pCaja'], [46.5, 'pTirolesa'], [77, 'm03pPolea'], [102, 'pRodantes']],
  objetivos: [[-99, 'm03o1'], [32, 'm03o2'], [65, 'm03o3'], [100, 'm03o4'], [142, 'm03o5']],
  prefijoPergaminos: 'm03perg',
  modelosFinal: ['creyente'],
  intro: ['m03i1', 'm03i2', ['m03iCita', 'm03iRef'], 'm03i3'],
  ficcion: 'm02ficcion',
  final: {
    actor: { modelo: 'creyente' },
    tarjetas: [{ quien: 'fin1Quien', texto: 'm03f1', ficcion: true }, { quien: 'm03fJacobo', texto: 'm03f2', ficcion: true },
      { texto: 'm03f3' }, { texto: 'm03f4', ref: 'm03f4Ref' }],
  },
};
