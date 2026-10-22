import { MURALLA } from './disposicion.js';
import * as THREE from '../../lib/three/three.module.min.js';
import { caja, sillares, sombra, grieta } from './texturas.js';
export function crearMurallas(tablero, materiales, Z, limite) {
  tablero.murallas = [[], []];
  tablero.golpeMuralla = [];
  for (let jugador = 0; jugador < 2; jugador++) {
    for (let indice = 0; indice < limite; indice++) {
      const grupo = new THREE.Group();
      grupo.position.set(MURALLA.x0 + indice * MURALLA.paso, 0, Z.muralla[jugador]);
      tablero.escena.add(grupo);
      sombra(grupo, materiales.sombra, 0, 0, 1.6, 1.35);
      const base = [];
      for (let columna = 0; columna < 2; columna++)
        base.push([columna * 0.46 - 0.23, 0.025, 0, 0.44, 0.05, 0.65]);
      sillares(grupo, materiales.cimiento, base);
      const pieza = new THREE.Group();
      grupo.add(pieza);
      const lista = [];
      // Mortero hundido y adarve detrás del parapeto.
      caja(pieza, materiales.mortero, 0, 0.34, 0, 0.94, 0.64, 0.43);
      for (let fila = 0; fila < 4; fila++) {
        const anchos = fila % 2 ? [0.22, 0.4, 0.32] : [0.34, 0.27, 0.33];
        let borde = -0.48;
        for (const ancho of anchos) {
          lista.push([borde + ancho / 2, 0.095 + fila * 0.16, 0, ancho - 0.012, 0.148, 0.48]);
          borde += ancho;
        }
      }
      lista.push([0, 0.665, 0, 0.98, 0.07, 0.62]);
      for (const x of [-0.32, 0.32]) lista.push([x, 0.81, -0.18, 0.27, 0.24, 0.23]);
      const material = materiales.piedra.clone();
      sillares(pieza, material, lista);
      const fisura = grieta(pieza, -0.05, 0.12, 0.246);
      fisura.visible = false;
      grupo.userData = {
        pieza,
        grieta: fisura,
        material: material,
        meta: 0.02,
        altura: 0.02,
        activo: false,
      };
      pieza.position.y = -1.0;
      // Compatibilidad con el resaltado del tablero.
      grupo.material = material;
      tablero.murallas[jugador].push(grupo);
    }
    const zonaToque = new THREE.Mesh(
      new THREE.BoxGeometry(10.2, 1, 0.9),
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    zonaToque.position.set(0, 0.4, Z.muralla[jugador]);
    zonaToque.userData = { tipo: 'muralla', j: jugador };
    tablero.escena.add(zonaToque);
    tablero.golpeMuralla.push(zonaToque);
  }
}
export function actualizarMurallas(tablero, delta) {
  for (const fila of tablero.murallas)
    for (const grupo of fila) {
      const datos = grupo.userData,
        activo = datos.meta === 1;
      if (activo !== datos.activo) {
        datos.activo = activo;
        datos.transicion = 0;
        if (!activo) datos.grieta.visible = true;
        tablero.polvo.emitir(grupo.position.clone(), !activo);
        tablero.chispas(
          grupo.position.clone().add(new THREE.Vector3(0, 0.18, 0)),
          activo ? '#b6aa87' : '#8e8069',
          18,
          1.3,
        );
      }
      datos.transicion = (datos.transicion ?? 1) + delta;
      datos.altura += (datos.meta - datos.altura) * (1 - Math.exp(-delta * 7));
      datos.pieza.position.y = -1.0 * (1 - datos.altura);
      datos.pieza.rotation.z = activo
        ? 0
        : Math.sin(Math.min(datos.transicion, 1) * Math.PI) * 0.22;
      datos.grieta.visible = !activo && datos.transicion < 1;
      datos.pieza.visible = activo || datos.transicion < 1;
    }
}
