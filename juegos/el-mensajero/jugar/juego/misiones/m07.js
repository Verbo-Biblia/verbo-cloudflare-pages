// Misión 7 · «El palacio de Pafos» (Hechos 13:6-12). El procónsul Sergio Paulo llama a Bernabé y a Saulo para oír la
// palabra de Dios. Eliab trae de noche un mensaje de los hermanos de Salamina y entra al palacio por los jardines
// (ficción; no participa de lo que pasa con Elimas):
// calle de Pafos con un guardia → caja para subir el muro del jardín → estanques y dos caminos (pérgola arriba, sin
// guardias; abajo, un guardia y escondites) → pórtico de columnas con dos guardias y portales → aljibe bajo el
// palacio (paso agachado y guillotinas) → patio interior: palanca que abre la reja → guardia del patio → la sala.

export const DATOS = {
  id: 'm07', titulo: 'm07t', lugar: 'm07l', ambiente: 'noche', fondo: 'ciudad', pintura: 'pafos_noche',
  limites: [-5.5, 258],
  caidaY: -5,
  // entre los tramos, los estanques del jardín; 171-200 es el aljibe, bajo el palacio
  suelo: [[-9, 70], [72.6, 84], [86.6, 110], [112.6, 171], [171, 200, -3.2], [200, 262]],
  aguas: [[70, 72.6, -0.4], [84, 86.6, -0.4], [110, 112.6, -0.4]],
  bloques: [
    [-9, -4, 0, 9, 'revoque'],
    [6, 7, 0, 1.0, 'caja'],
    [14, 16.2, 0, 1.1, 'carreta'],
    [56, 58, 0, 4.4, 'piedra'],             // muro del jardín (con la caja se llega al borde)
    // pérgola del jardín: camino de arriba, sin guardias (ellos no miran tan alto)
    [76, 83.5, 4.2, 4.5, 'madera'], [86.2, 94, 4.2, 4.5, 'madera'], [96.8, 104.5, 4.2, 4.5, 'madera'],
    [99, 99.9, 4.5, 5.4, 'caja'],
    // el aljibe: el palacio de arriba es el techo; un tramo bajo (agachado) y dos guillotinas
    [174, 197, -1.0, 8, 'piedra'],
    [179, 183, -2.1, -1.0, 'piedra'],
    // patio interior: arco sobre la reja (no se salta por encima) y la pared de la sala
    [221.3, 222.7, 3.2, 10, 'piedra'],
    [253, 262, 0, 9, 'piedra'],
  ],
  postes: [[76.4, 0, 4.2], [83.1, 0, 4.2], [86.6, 0, 4.2], [93.6, 0, 4.2], [97.2, 0, 4.2], [104.1, 0, 4.2]],
  escaleras: [[75.5, 0, 4.5], [199.5, -3.2, 0]],
  guillotinas: [{ x: 186.5, y: -3.2, alto: 2.2, periodo: 3.6 }, { x: 192.5, y: -3.2, alto: 2.2, periodo: 4.2, fase: 0.45, mat: 'hierro' }],
  toldos: [[18, 22, 2.3, 'toldoAzul'], [38, 42, 2.3, 'toldoRojo']],
  cajas: [{ x: 50.5, a: 1.1, h: 1.1 }],
  palancas: [{ x: 214, reja: { x: 222, alto: 3.2 } }],
  // escondites: portales (usar) y barriles o cajas (agachado detrás)
  puertas: [25, 33, 124, 132, 138, 146, 152, 243],
  coberturas: [[29, 'barril'], [95.5, 'caja'], [240, 'caja']],
  // todos empiezan de espaldas al punto de control anterior
  guardias: [
    { x: 30, ruta: [23, 36], dir: 1 },
    { x: 96, ruta: [89, 104], dir: 1 },
    { x: 129, ruta: [122.5, 136], dir: 1 },
    { x: 150, ruta: [143, 158], dir: 1 },
    { x: 240, ruta: [233, 247], dir: 1 },
  ],
  control: [[1, 0, 1], [46, 0, 1], [60, 0, 1], [114.5, 0, 1], [168.5, 0, 1], [203, 0, 1], [225.5, 0, 1]],
  meta: { x: 250 },
  pergaminos: [[101.5, 5.3], [176.5, -2.2], [166, 1.2]],
  cantaros: [[40, 0], [62, 0], [80, 4.5], [113.5, 0], [202, 0], [226.5, 0]],
  faroles: [[2.5, 2.5, -1.2], [19, 2.5, -1.2], [35, 2.5, -1.2], [52, 2.5, -1.2], [64, 2.0, -0.6], [88, 2.0, -0.6],
    [108, 2.0, -0.6], [118, 3.2, -1.2], [134, 3.2, -1.2], [148, 3.2, -1.2], [162, 3.2, -1.2],
    [177, -1.5, -1.0], [189.5, -1.5, -1.0], [196, -1.5, -1.0], [206, 2.5, -1.2], [218, 2.5, -1.2], [232, 2.5, -1.2],
    [246, 2.5, -1.2], [251.5, 2.6, -0.6]],
  objetos: [['olivo', 66, 0, -8, 6], ['cipres', 79, 0, -9, 9], ['tinajas_barro', 90, 0, -8.5, 2], ['cipres', 107, 0, -9, 9],
    ['palmera_datilera', 4, 0, -8, 8], ['olivo', 210, 0, -8, 6]],
  pistas: [[2, 'm07pInicio'], [10, 'pSombra', 'pSombraT'], [46.5, 'pCaja'], [61, 'm07pEstanque'], [74, 'm07pDosCaminos'],
    [115, 'm07pPortico', 'm07pPorticoT'], [169, 'm07pAljibe'], [184, 'pGuillotinaVer'], [204, 'pPalanca', 'pPalancaT'],
    [226, 'm07pPatio', 'm07pPatioT']],
  objetivos: [[-99, 'm07o1'], [58, 'm07o2'], [114, 'm07o3'], [170, 'm07o4'], [202, 'm07o5'], [223, 'm07o6']],
  prefijoPergaminos: 'm07perg',
  casasFondo: [
    [-4, 10, 4.6, [[3, 1.2, 2.1]]], [10, 22, 5.2, [[13.5]]], [22, 30, 4.4, [[25, 1.4, 2.2]]], [30, 44, 5.4, [[33, 1.4, 2.2], [40]]],
    [44, 56, 4.8, []],
    // pórtico del palacio: muro de sillares con portales entre las columnas
    [114, 128, 6, [[118], [124, 1.4, 2.2]], 'piedra'], [128, 142, 6, [[132, 1.4, 2.2], [138]], 'piedra'],
    [142, 156, 6, [[146, 1.4, 2.2], [152, 1.4, 2.2]], 'piedra'], [156, 171, 6, [[161]], 'piedra'],
    [200, 221, 6.5, [[208]], 'piedra'], [223, 253, 6.5, [[243, 1.4, 2.2]], 'piedra'],
  ],
  casasRelleno: [[0, 56, 3.4]],
  extra({ b, raiz, material, THREE }) {
    // columnas del pórtico (delante del muro, detrás del camino) y el dintel de piedra
    const geo = new THREE.CylinderGeometry(0.26, 0.3, 4.6, 12);
    for (let x = 115.5; x < 171; x += 3.5) {
      const col = new THREE.Mesh(geo, material('piedra'));
      col.position.set(x, 2.3, -1.0);
      raiz.add(col);
      b.caja(x - 0.42, 0, -1.42, x + 0.42, 0.25, -0.58, 'piedra');
      b.caja(x - 0.4, 4.6, -1.4, x + 0.4, 4.85, -0.6, 'piedra');
    }
    b.caja(114, 4.85, -1.5, 171, 5.45, -0.5, 'piedra');
    // bordes de los estanques del jardín
    for (const [x0, x1] of [[70, 72.6], [84, 86.6], [110, 112.6]]) {
      b.caja(x0 - 0.15, -0.6, -3.5, x0, 0.12, 1.4, 'piedra');
      b.caja(x1, -0.6, -3.5, x1 + 0.15, 0.12, 1.4, 'piedra');
    }
    // fuente en el centro del jardín, detrás del camino
    b.caja(63.5, 0, -4.2, 66.5, 0.6, -2.4, 'piedra');
    const taza = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.2, 0.35, 14), material('piedra'));
    taza.position.set(65, 1.5, -3.3);
    const pie = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.9, 10), material('piedra'));
    pie.position.set(65, 1.0, -3.3);
    raiz.add(taza, pie);
    // el palacio sobre el aljibe: ventanas y pretil (si no, un muro liso de 9 m)
    for (const x of [176.5, 180.5, 184.5, 188.5, 192.5, 196]) {
      for (const y of [2.4, 5.6]) {
        b.caja(x - 0.3, y, 1.2, x + 0.3, y + 0.75, 1.22, ((x * 7 + y) | 0) % 3 ? 'ventana' : 'ventanaApagada');
        b.caja(x - 0.4, y - 0.08, 1.2, x + 0.4, y, 1.3, 'madera');
      }
    }
    b.caja(174, 8, -2.5, 197, 8.35, -2.3, 'piedra'); b.caja(174, 8, 1.0, 197, 8.35, 1.2, 'piedra');
    b.caja(171, -3.2, -6, 200, -0.9, -2.5, 'interior');   // pared del fondo del aljibe
    // la entrada de la sala: portal iluminado al final del patio
    b.caja(250.6, 0, -1.3, 251.9, 2.4, -1.25, 'ventana');
    b.caja(250.4, 2.4, -1.4, 252.1, 2.65, -1.1, 'piedra');
  },
  intro: ['m07i1', ['m07iCita', 'm07iRef'], 'm07i2'],
  ficcion: 'm07ficcion',
  final: { tarjetas: [{ texto: 'm07f1', ref: 'm07f1Ref' }, { texto: 'm07f2', ref: 'm07f2Ref' }, { texto: 'm07f3', ficcion: true }] },
};
