// Misión 4 · «Rumbo a Antioquía» (Hechos 12:25). Bernabé y Saulo vuelven de Jerusalén a Antioquía con Juan Marcos;
// Eliab va con ellos y se adelanta por los cerros (ficción). Camino → soga para subir al peñasco → ladera para
// resbalar y saltar el barranco → otra soga → tirolesa sobre la quebrada → puente viejo de tablas que se caen,
// con piedras que ruedan → terrazas → ladera final → el pozo de la aldea.

export const DATOS = {
  id: 'm04', titulo: 'm04t', lugar: 'm04l', ambiente: 'dia', fondo: 'campo', pintura: 'camino_montana', matSuelo: 'tierra',
  limites: [-5.5, 172], caidaY: -3,
  suelo: [[-9, 18], [43, 55], [78, 88], [104, 118], [151, 178]],
  bloques: [
    [-9, -4, 0, 8, 'roca'],
    [8, 9.5, 0, 1.2, 'roca'], [13, 14, 0, 0.8, 'roca'],
    [18, 30, -3, 4, 'roca'],            // peñasco
    [26, 27, 4, 6, 'roca'],             // piedra alta (pergamino arriba)
    [55, 62, -3, 5, 'roca'],            // segundo peñasco, desde donde sale la tirolesa
    [118, 124, -3, 1.6, 'roca'], [124, 130, -3, 3.2, 'roca'], [130, 136, -3, 4.8, 'roca'],   // terrazas
    [172, 178, 0, 8, 'roca'],
  ],
  escaleras: [[17.6, 0, 4, 'cuerda'], [54.6, 0, 5, 'cuerda']],
  rampas: [[30, 4, 40, 0.4, 'tierra'], [136, 4.8, 148, 0.4, 'tierra']],
  tirolesas: [[61.2, 7.6, 79, 4.3]],
  caedizas: [[88, 89.6, 0], [89.6, 91.2, 0], [91.2, 92.8, 0], [92.8, 94.4, 0], [94.4, 96, 0],
    [96, 97.6, 0], [97.6, 99.2, 0], [99.2, 100.8, 0], [100.8, 102.4, 0], [102.4, 104, 0]],
  rodantes: [{ x: 117, hasta: 86, cada: 3.2, vel: 4.6, modelo: 'roca1', tam: 0.95, desfase: 1.5 }],
  control: [[1, 0, 1], [44, 0, 1], [80, 0, 1], [105.5, 0, 1], [152, 0, 1]],
  meta: { x: 163 },
  pergaminos: [[26.5, 6.6], [96, 1.1], [133, 5.4]],
  cantaros: [[23, 4], [50, 0], [84, 0], [121, 1.6], [154, 0]],
  deco: [['roca2', 4, 0, -1.6, 0.9], ['roca1', 46, 0, -1.8, 1.2], ['roca2', 110, 0, -1.5, 0.8], ['roca1', 160, 0, -2, 1.4]],
  objetos: [['olivo', 6, 0, -6, 6], ['olivo', 52, 0, -9, 7], ['cipres', 45, 0, -6, 7], ['olivo', 84, 0, -7, 6],
    ['camello_echado', 112, 0, -4, 2.6], ['cipres', 114, 0, -8, 8], ['olivo', 156, 0, -6, 6.5], ['carro_bueyes', 168, 0, -5, 3.4]],
  pistas: [[2, 'm04pInicio'], [16, 'pEscaleraT'], [29, 'pRampa'], [60, 'pTirolesa'], [86, 'pCaediza'], [105, 'm04pPiedras']],
  objetivos: [[-99, 'm04o1'], [78, 'm04o2'], [118, 'm04o3']],
  prefijoPergaminos: 'm04perg',
  intro: ['m04i1', ['m04iCita', 'm04iRef'], 'm04i2', 'm04i3'],
  ficcion: 'm04ficcion',
  final: { tarjetas: [{ texto: 'm04f1' }, { texto: 'm04f2', ref: 'm04f2Ref' }] },
};
