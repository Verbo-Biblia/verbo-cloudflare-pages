// Misión 1 · «La noche de Pedro» (Hechos 12:1-17). Jerusalén de noche, de izquierda a derecha:
// patio (aprender) → calle y toldos → tejados (saltos y bordes) → calle vigilada (sigilo, rutas alta y baja)
// → barrio alto (dos caminos: pasarelas sin soldados o calle con dos soldados) → bodega (pasadizo angosto y
// guillotinas) → muro con caja → patio con palanca y portón → persecución → casa de María.

export const DATOS = {
  id: 'm01', titulo: 'm01t', lugar: 'm01l', ambiente: 'noche', fondo: 'ciudad', templo: true, pintura: 'jerusalen_noche',
  limites: [-5.5, 304],
  caidaY: -5,
  // tramos de suelo (entre ellos, callejones); 171-200 es el piso de la bodega, bajo la calle
  suelo: [[-9, 42], [72, 171], [171, 200, -3.2], [200, 260], [262.6, 310]],
  // casas en las que se camina por la azotea: [x0, x1, alto]
  tejados: [[34, 42, 4.0], [44.5, 52, 4.0], [54.5, 60, 5.0], [63.2, 72, 6.2], [220, 229, 4.3]],
  // obstáculos sólidos [x0, x1, y0, y1, material]
  bloques: [
    [-9, -4, 0, 9, 'revoque'],          // casa del patio (pared izquierda)
    [6.5, 7.5, 0, 1.0, 'caja'],
    [10.6, 11.6, 0, 1.4, 'piedra'],     // murete
    [14.4, 15.4, 0, 1.0, 'caja'], [15.4, 16.4, 0, 2.0, 'piedra'],
    [20.1, 20.9, 0, 0.9, 'barril'], [22.6, 23.4, 0, 1.0, 'barril'], [24.4, 25.2, 0, 0.8, 'caja'],
    [26, 28.2, 0, 1.1, 'carreta'],
    [56, 58, 5.0, 6.7, 'revoque'],      // cuartito en la azotea (pergamino arriba)
    [76.5, 77.5, 0, 1.0, 'caja'], [104.6, 105.5, 0, 1.0, 'barril'],
    [45, 45.9, 4.0, 4.9, 'caja'], [65, 65.9, 6.2, 7.1, 'barril'],     // en los tejados, para variar los saltos
    // barrio alto, camino de arriba: pasarelas de madera sobre la calle (los soldados no miran tan arriba)
    [118.6, 128, 4.2, 4.5, 'madera'], [130.5, 138, 4.2, 4.5, 'madera'], [140.5, 149, 4.2, 4.5, 'madera'],
    [142.5, 146.5, 5.6, 7.6, 'revoque'],   // alero bajo: se pasa agachado
    [151.2, 158, 5.0, 5.3, 'madera'], [160.5, 167.5, 4.2, 4.5, 'madera'],
    [133, 133.9, 4.5, 5.4, 'barril'],
    // camino de abajo: barriles y cajas para cubrirse
    [121.5, 122.4, 0, 0.9, 'barril'], [165.6, 166.5, 0, 0.9, 'caja'],
    // la bodega: la casa de arriba es el techo; un tramo bajo (agachado) y dos guillotinas
    [174, 197, -1.0, 8, 'piedra'],
    [179, 183, -2.1, -1.0, 'piedra'],
    [281.5, 282.4, 0, 0.9, 'caja'], [296.5, 297.3, 0, 0.9, 'barril'],
    [239.5, 241, 3.2, 10, 'piedra'],    // arco sobre la reja (no se puede saltar por encima)
    [229, 229.6, 0, 4.3, 'revoque'],    // pared del patio (lado del muro)
    [245, 245.8, 0, 1.0, 'barril'],
    [251, 256, 1.15, 9, 'piedra'],      // paso bajo: hay que agacharse
    [265.5, 266.6, 0, 1.0, 'caja'],
    [272, 273, 0, 2.6, 'piedra'],       // muro que el soldado no puede saltar
    [278, 278.5, 0, 1.2, 'piedra'],
    [286.1, 286.9, 0, 0.8, 'caja'], [288.6, 289.4, 0, 0.9, 'barril'],
    [302, 307, 0, 9, 'revoque'],        // fin de la calle
  ],
  postes: [[119, 0, 4.2], [127.6, 0, 4.2], [132.3, 0, 4.2], [137.6, 0, 4.2], [141.3, 0, 4.2], [148.6, 0, 4.2],
    [153.2, 0, 5.0], [157.6, 0, 5.0], [160.9, 0, 4.2], [167.1, 0, 4.2]],
  escaleras: [[118.1, 0, 4.5], [199.5, -3.2, 0]],
  guillotinas: [{ x: 186.5, y: -3.2, alto: 2.2, periodo: 3.6 }, { x: 192.5, y: -3.2, alto: 2.2, periodo: 4.2, fase: 0.45, mat: 'hierro' }],
  // toldos (se sube desde abajo de un salto; ↓ + saltar para bajar): [x0, x1, y, color]
  toldos: [[30, 33.5, 1.6, 'toldoRojo'], [79, 83, 2.3, 'toldoAzul'], [86, 90, 2.3, 'toldoRojo'],
    [93, 97, 2.3, 'toldoVerde'], [100, 104, 2.3, 'toldoAzul'], [107, 110, 2.3, 'toldoRojo'], [267, 271, 2.2, 'toldoVerde']],
  // escondites de la calle vigilada: portales (se entra con «usar») y barriles o cajas delante del camino
  // (agachado detrás, no te ven)
  puertas: [84.5, 88.8, 95.5, 102.5, 108.5, [131, 0], [140, 0], [152, 0], [164.5, 0]],   // bajo las pasarelas: a nivel de la calle
  coberturas: [[91.6, 'barril'], [98.5, 'caja'], [146.2, 'barril']],
  // puntos de control: [x, y, dir]
  control: [[1, 0, 1], [36, 4.0, 1], [74.5, 0, 1], [114, 0, 1], [170.5, 0, 1], [212, 0, 1], [232.5, 0, 1]],
  cajas: [{ x: 214.5, a: 1.1, h: 1.1 }],
  palancas: [{ x: 236, reja: { x: 240, alto: 3.2 } }],
  // los del barrio alto empiezan de espaldas al punto de control
  guardias: [{ x: 99, ruta: [80, 104], dir: -1 }, { x: 129, ruta: [123, 141], dir: 1 }, { x: 156, ruta: [148.5, 161], dir: 1 }],
  cazador: { x: 230.6, escape: 273.2, despierta: 'palanca' },
  modelosFinal: ['pedro', 'maria', 'creyente'],
  meta: { x: 292.5, final: 'maria' },
  puertaX: 293,
  // agua para correr rápido: antes de los saltos largos de los tejados y en la persecución
  cantaros: [[37.5, 4.0], [61, 5.0], [116.5, 0], [149.5, 4.5], [168, 0], [205, 0], [218, 0], [233.5, 0], [258.4, 0], [276, 0]],
  pergaminos: [[57, 7.3], [102, 3.0], [269, 3.5]],
  // faroles (solo los más cercanos a la cámara se encienden de verdad: ver actualizarLuces)
  faroles: [[2.5, 2.5, -1.2], [19, 2.5, -1.2], [29, 2.5, -1.3], [48, 5.4, -1.2], [66, 7.6, -1.2],
    [78, 2.5, -1.2], [92, 2.5, -1.3], [108.5, 2.5, -1.3], [118, 2.5, -1.2], [130, 2.5, -1.2], [144, 2.5, -1.2],
    [156, 2.5, -1.2], [168, 2.5, -1.2], [177, -1.5, -1.0], [189.5, -1.5, -1.0], [196, -1.5, -1.0], [206, 2.5, -1.2],
    [216, 2.5, -1.2], [235, 2.5, -1.2],
    [248, 2.5, -1.2], [263, 2.5, -1.2], [276, 2.5, -1.2], [290, 2.6, -0.6], [296, 2.6, -0.6]],
  // pistas: [x, clave del texto, clave táctil (si es distinta)]
  pistas: [[0, 'pMover', 'pMoverT'], [4.5, 'pSaltar', 'pSaltarT'], [28.6, 'pToldo', 'pToldoT'],
    [38, 'pCorrer', 'pCorrerT'], [56.5, 'pBorde'], [75.5, 'pSombra', 'pSombraT'], [77.8, 'pToldosArriba'],
    [114.5, 'pDosCaminos'], [142, 'pAgacharse'], [171, 'pBodega'], [184, 'pGuillotinaVer'], [212.5, 'pCaja'],
    [231.5, 'pPalanca', 'pPalancaT'], [248, 'pAgacharse']],
  // objetivo según dónde va el jugador: [desde x, clave]
  objetivos: [[-99, 'obj1'], [33, 'obj2'], [72, 'obj3'], [113, 'obj3b'], [170, 'obj3c'], [211, 'obj4'], [229.5, 'obj5']],

  casasFondo: [
    [-4, 8, 4.6, [[3, 1.2, 2.1]]], [8, 20, 3.8, [[13.5]]], [20, 34, 5.2, [[24.5], [31.8]]],
    [72, 79, 4.4, []], [79, 91, 5.4, [[84.5, 1.4, 2.2], [88.8]]], [91, 99, 4.6, [[95.5, 1.4, 2.2]]],
    [99, 112, 5.6, [[102.5, 1.4, 2.2], [108.5]]],
    // barrio alto
    [112, 124, 5.0, [[117]]], [124, 136, 5.6, [[126], [131, 1.4, 2.2]]], [136, 148, 4.8, [[140, 1.4, 2.2]]],
    [148, 160, 5.8, [[152, 1.4, 2.2], [156]]], [160, 171, 5.0, [[164.5, 1.4, 2.2]]], [200, 212, 4.6, [[205]]],
    [212, 220, 4.4, [[216]]], [229, 240, 6.5, [[231.2, 1.1, 2.1]]],
    [241, 251, 4.6, [[247]]], [256, 268, 5.2, [[263]]], [268, 286, 4.4, [[281]]],
    [286, 292.35, 5.6, [], 'piedra'], [293.65, 302, 5.6, [], 'piedra'],   // casa de María (el portal va en extra)
  ],
  casasRelleno: [[42, 54.5, 3], [54.5, 64, 3.8], [64, 72, 4.6]],
  vigas: [[250.8, 256.2, 1.15, 1.45]],   // el paso bajo de la persecución
  deco: [
    // palmeras detrás de las casas: asoman por encima de los techos
    ['palmera1', 2, 0, -7.5, 7.5], ['palmera2', 17, 0, -7.2, 6.8], ['palmera1', 47, 4.0, -3.4, 4.0],
    ['palmera2', 76, 0, -7.4, 7.6], ['palmera1', 120, 0, -7.6, 8.4], ['palmera2', 150, 0, -7.4, 8.8],
    ['palmera1', 233, 0, -7.6, 9.2], ['palmera2', 262, 0, -7.2, 7.4], ['palmera1', 283, 0, -7.4, 7], ['palmera2', 297, 0, -7.6, 8],
    ['cubeta', 9, 0, -1.0, 0.4], ['cubeta', 237.5, 0, -1.0, 0.4], ['cubeta', 175, -3.2, -1.0, 0.4],
  ],
  // la casa de María: portal hondo (la puerta se abre hacia adentro) y la puerta con bisagra
  extra({ b, raiz, material, THREE }) {
    // la casa de la que sale el alero bajo del camino de arriba (sin ella, el alero flotaba)
    b.caja(142.2, 0, -3.2, 146.8, 7.9, -1.3, 'revoque');
    b.caja(142.0, 7.6, -3.3, 147.0, 7.9, 1.25, 'madera');
    // la casa sobre la bodega: ventanas, una puerta tapiada y un pretil (era un muro liso de 9 m)
    for (const x of [176.5, 180.5, 184.5, 188.5, 192.5, 196]) {
      for (const y of [2.4, 5.6]) {
        b.caja(x - 0.3, y, 1.2, x + 0.3, y + 0.75, 1.22, ((x * 7 + y) | 0) % 3 ? 'ventana' : 'ventanaApagada');
        b.caja(x - 0.4, y - 0.08, 1.2, x + 0.4, y, 1.3, 'madera');
      }
    }
    b.caja(184.9, -1.0, 1.2, 186.3, 1.2, 1.24, 'madera');
    b.caja(174, 8, -2.5, 197, 8.35, -2.3, 'piedra'); b.caja(174, 8, 1.0, 197, 8.35, 1.2, 'piedra');
    // bodega: pared del fondo (si no, entre el piso y el techo se veía el cielo)
    b.caja(171, -3.2, -6, 200, -0.9, -2.5, 'interior');
    b.caja(292.35, 2.3, -6, 293.65, 5.6, -1.2, 'piedra');
    b.caja(292.35, 0, -2.8, 293.65, 2.3, -2.75, 'interior');          // fondo del zaguán, en penumbra
    b.caja(292.35, 2.3, -2.8, 293.65, 2.31, -1.2, 'madera');           // techo de vigas
    b.caja(292.35, -0.02, -2.8, 293.65, 0.01, -1.2, 'pisoInterior');
    b.caja(292.2, 2.3, -1.22, 293.8, 2.5, -1.08, 'madera');
    const puerta = new THREE.Group();
    const hoja = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.3, 0.08), material('madera'));
    hoja.position.set(0.65, 1.15, 0);
    for (const y of [0.5, 1.8]) {
      const banda = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.1, 0.1), material('hierro'));
      banda.position.set(0.65, y, 0.01);
      puerta.add(banda);
    }
    const argolla = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.015, 6, 12), material('hierro'));
    argolla.position.set(1.1, 1.1, 0.06);
    puerta.add(hoja, argolla);
    puerta.position.set(292.35, 0, -1.25);
    raiz.add(puerta);
    DATOS.puertaMaria = puerta;
  },
  // tarjetas: introducción (narradas) y la escena final de la casa de María (principal.js)
  intro: ['introLugar', 'introTexto', ['introCita', 'introRef'], 'introEliab'],
  ficcion: 'ficcion',
};
