// Misión 2 · «Hagan saber esto a Jacobo» (Hechos 12:17-18). Antes del amanecer, con las calles llenas de soldados,
// Eliab cruza por debajo de Jerusalén: bodega → escalera a la cisterna → tablas viejas sobre el agua → túnel bajo →
// gran cisterna con plataformas que van y vienen → bajada resbalosa → túnel de Ezequías → sala con un soldado →
// pozo vertical con escaleras → salida junto al estanque de Siloé.
// (Que Eliab lleve el aviso es ficción; las cisternas y el túnel de Ezequías existieron: 2 Crónicas 32:30.)

export const DATOS = {
  id: 'm02', titulo: 'm02t', lugar: 'm02l', ambiente: 'cueva', fondo: 'cueva', pintura: 'tunel',
  limites: [-4.5, 111], caidaY: -3,
  suelo: [[-6, 10, 6], [10, 16], [20, 31], [45, 52, 1.6], [62.6, 76.8], [79.6, 97], [97, 116, 12]],
  techos: [
    [-8, 12, 9, 14], [12, 24, 7, 12], [24, 30.5, 1.15, 9], [30.5, 46, 8, 14], [45, 62, 9, 14],
    [62, 65, 3.4, 9], [65, 69, 1.15, 9], [69, 72, 3.4, 9], [72, 76, 1.15, 9], [76, 82, 3.4, 9],
    [82, 92, 4.2, 9], [92, 97, 15.5, 20], [97, 116, 15.5, 20],
  ],
  bloques: [
    [-8, -5, 0, 14, 'roca'],            // fondo de la bodega
    [70, 71.2, 0, 0.6, 'roca'],         // escalón entre los dos pasos bajos
    [93.5, 96.9, 3.7, 4, 'roca'],       // repisas del pozo
    [92.2, 96.0, 7.7, 8, 'roca'],
    [93.1, 97, 11.7, 12, 'roca'],
    [97, 99, 0, 12, 'roca'],            // pared derecha del pozo
    [111, 116, 12, 20, 'roca'],         // fin
    [4, 4.9, 6, 6.9, 'barril'], [6.5, 7.4, 6, 6.8, 'caja'],
  ],
  aguas: [[16, 20, -0.3], [31, 45, -0.3], [60, 62.6, -0.3], [76.8, 79.6, -0.3]],
  caedizas: [[16.2, 17.4, 0], [17.4, 18.6, 0], [18.6, 19.8, 0], [77, 78.2, 0], [78.2, 79.4, 0]],
  moviles: [
    { x0: 31.4, x1: 33.6, y: 0, dx: 3.6, periodo: 4.5, sinSogas: true },
    { x0: 38.2, x1: 40.4, y: 0.6, dx: 3.6, periodo: 4.5, fase: 0.5, sinSogas: true },
  ],
  rampas: [[52, 1.6, 60, 0.1, 'roca']],
  escaleras: [[10.6, 0, 6], [93, 0, 4], [96.5, 4, 8], [92.6, 8, 12]],
  puertas: [84.5, 89.5],               // nichos de la sala del soldado
  guardias: [{ x: 90, ruta: [83, 91], dir: -1 }],
  control: [[0, 6, 1], [20.5, 0, 1], [46.5, 1.6, 1], [63.5, 0, 1], [80.5, 0, 1], [93.8, 4, 1]],
  meta: { x: 106, y: 12 },
  pergaminos: [[37.7, 2.3], [70.6, 1.2], [92.7, 8.7]],
  cantaros: [[22, 0], [46, 1.6], [81.5, 0]],
  faroles: [[2, 7.5, -1.2], [13, 2.6, -1.2], [22, 2.6, -1.2], [34.5, 3, -2.2], [42, 3, -2.2], [48, 4.0, -1.2],
    [64, 2.4, -1.2], [70.6, 2.4, -1.2], [80.5, 2.4, -1.2], [87, 3.2, -1.4], [95, 6, -1.2], [95, 10, -1.2], [103, 14, -1.2]],
  pistas: [[8.5, 'pEscaleraBaja', 'pEscaleraBajaT'], [14.5, 'pCaediza'], [23, 'pAgachate'], [30, 'pMovil'],
    [51, 'pRampa'], [81, 'm02pSoldado', 'm02pSoldadoT'], [91.5, 'pEscaleraT']],
  objetivos: [[-99, 'm02o1'], [45, 'm02o2'], [80, 'm02o3'], [92, 'm02o4']],
  prefijoPergaminos: 'm02perg',
  intro: ['m02i1', 'm02i2', ['m02iCita', 'm02iRef'], 'm02i3'],
  ficcion: 'm02ficcion',
  final: { tarjetas: [{ texto: 'm02f1' }, { texto: 'm02f2', ref: 'm02f2Ref' }] },
};
