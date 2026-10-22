import * as THREE from '../../lib/three/three.module.min.js';
import { caja, sombra, grieta, geometriaSillar } from './texturas.js';

// Hiladas radiales alternadas: cada dovela sigue la curva de la torre.
function cuerpoTorre(grupo, material, jugador) {
  const hiladas = 7;
  const lados = 12;
  const piedras = new THREE.InstancedMesh(geometriaSillar(), material, hiladas * lados);
  const molde = new THREE.Object3D();
  for (let fila = 0; fila < hiladas; fila++) {
    for (let columna = 0; columna < lados; columna++) {
      const angulo = ((columna + (fila % 2) * 0.5) * Math.PI * 2) / lados;
      molde.position.set(Math.sin(angulo) * 0.39, 0.12 + fila * 0.17, Math.cos(angulo) * 0.39);
      molde.rotation.y = angulo;
      molde.scale.set(0.215, 0.158, 0.19);
      molde.updateMatrix();
      piedras.setMatrixAt(fila * lados + columna, molde.matrix);
      piedras.setColorAt(
        fila * lados + columna,
        new THREE.Color().setScalar(0.8 + ((fila * 7 + columna * 3) % 9) * 0.023),
      );
    }
  }
  piedras.userData = { tipo: 'fortaleza', j: jugador };
  grupo.add(piedras);
  const cornisa = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.47, 0.16, 24), material);
  cornisa.position.y = 1.29;
  grupo.add(cornisa);
  const adarve = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.045, 24), material);
  adarve.position.y = 1.39;
  grupo.add(adarve);
  for (let indice = 0; indice < 10; indice++) {
    const angulo = (indice * Math.PI) / 5;
    const merlon = caja(
      grupo,
      material,
      Math.sin(angulo) * 0.47,
      1.53,
      Math.cos(angulo) * 0.47,
      0.21,
      0.27,
      0.18,
    );
    merlon.rotation.y = angulo;
  }
}

function ventanaArco(grupo, materiales, altura, angulo) {
  const ventana = new THREE.Group();
  const forma = new THREE.Shape();
  forma.moveTo(-0.065, 0);
  forma.lineTo(0.065, 0);
  forma.lineTo(0.065, 0.23);
  forma.absarc(0, 0.23, 0.065, 0, Math.PI, false);
  forma.closePath();
  const hueco = new THREE.Mesh(new THREE.ShapeGeometry(forma), materiales.oscuro);
  ventana.add(hueco);
  caja(ventana, materiales.metal, 0, -0.015, 0.01, 0.19, 0.035, 0.06);
  ventana.position.set(Math.sin(angulo) * 0.492, altura, Math.cos(angulo) * 0.492);
  ventana.rotation.y = angulo;
  grupo.add(ventana);
}

export function crearFortalezas(tablero, materiales, extremo, posiciones) {
  tablero.fortalezas = [];
  for (const jugador of [0, 1]) {
    const fortaleza = new THREE.Group();
    const piedra = materiales.piedra.clone();
    const banderas = [];
    const grietas = [];
    const humos = [];
    for (const lado of [-1, 1]) {
      const torre = new THREE.Group();
      torre.position.x = lado * extremo;
      fortaleza.add(torre);
      sombra(torre, materiales.sombra, 0, 0, 1.9, 1.8);
      cuerpoTorre(torre, piedra, jugador);
      for (const angulo of [0, Math.PI, Math.PI / 2, -Math.PI / 2]) {
        ventanaArco(torre, materiales, 0.65, angulo);
      }
      for (const profundidad of [-0.49, 0.49]) grietas.push(grieta(torre, 0.1, 0.17, profundidad));
      caja(torre, materiales.madera, 0, 1.71, 0, 0.028, 1.05, 0.028);
      const bandera = new THREE.Mesh(
        new THREE.PlaneGeometry(0.49, 0.31, 12, 5),
        new THREE.MeshStandardMaterial({
          color: jugador ? '#a52d32' : '#286e9b',
          side: THREE.DoubleSide,
          roughness: 0.95,
        }),
      );
      bandera.position.set(0.25, 2.05, 0);
      bandera.userData.base = bandera.geometry.attributes.position.array.slice();
      torre.add(bandera);
      banderas.push(bandera);
      for (let indice = 0; indice < 3; indice++) {
        const humo = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: materiales.sombra,
            color: '#908c80',
            transparent: true,
            depthWrite: false,
          }),
        );
        humo.userData.fase = indice / 3;
        torre.add(humo);
        humos.push(humo);
      }
    }
    const etiqueta = new THREE.Sprite(new THREE.SpriteMaterial({ depthTest: false }));
    etiqueta.scale.set(1.3, 0.65, 1);
    etiqueta.position.set(-extremo, 2.65, 0);
    etiqueta.renderOrder = 9;
    fortaleza.add(etiqueta);
    fortaleza.position.z = posiciones[jugador];
    fortaleza.userData = {
      tipo: 'fortaleza',
      j: jugador,
      piedra,
      etiqueta,
      valor: null,
      banderas,
      grietas,
      humos,
      sacudir: 0,
    };
    tablero.escena.add(fortaleza);
    tablero.fortalezas.push(fortaleza);
  }
}

export function animarTorres(tablero, delta, vidaMaxima) {
  for (const fortaleza of tablero.fortalezas) {
    const datos = fortaleza.userData;
    datos.sacudir = Math.max(0, datos.sacudir - delta);
    fortaleza.position.x = datos.sacudir > 0 ? (Math.random() - 0.5) * 0.2 : 0;
    datos.grietas.forEach((grieta) => (grieta.visible = datos.valor < vidaMaxima * 0.5));
    for (const humo of datos.humos) {
      const fase = (tablero.tiempo * 0.3 + humo.userData.fase) % 1;
      humo.visible = datos.valor < vidaMaxima * 0.25;
      humo.position.set(Math.sin(fase * 5) * 0.16, 1.5 + fase * 1.4, 0);
      humo.material.opacity = 0.5 * Math.sin(fase * Math.PI);
      humo.scale.setScalar(0.4 + fase * 0.85);
    }
    for (const bandera of datos.banderas) {
      const posiciones = bandera.geometry.attributes.position;
      const base = bandera.userData.base;
      for (let indice = 0; indice < posiciones.count; indice++) {
        const distancia = (base[indice * 3] + 0.245) / 0.49;
        posiciones.setZ(indice, Math.sin(tablero.tiempo * 3 + distancia * 6) * 0.075 * distancia);
      }
      posiciones.needsUpdate = true;
      bandera.geometry.computeVertexNormals();
    }
  }
}
