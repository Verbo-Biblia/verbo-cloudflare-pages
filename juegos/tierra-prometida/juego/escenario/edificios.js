import { CASILLERO } from './disposicion.js';
import * as THREE from '../../lib/three/three.module.min.js';
import { caja, sombra, sillares } from './texturas.js';
// Miniaturas detrás de la carta: no cubren su texto ni participan en el raycast.
function edificio(id, materiales, jugador) {
  const grupo = new THREE.Group();
  const tela = new THREE.MeshStandardMaterial({
    color: jugador ? '#a23c34' : '#377ba0',
    roughness: 1,
  });
  grupo.userData.tela = tela;
  // Tejas individuales instanciadas, con faldones escalonados y cumbrera.
  const techo = (altura, ancho, fondo) => {
    for (const lado of [-1, 1]) {
      const faldon = new THREE.Group();
      faldon.position.y = altura;
      faldon.rotation.z = lado * -0.57;
      grupo.add(faldon);
      const lista = [];
      for (let fila = 0; fila < 4; fila++)
        for (let columna = 0; columna < 7; columna++) {
          lista.push([
            lado * (0.06 + fila * ancho * 0.14),
            0.03 + fila * 0.008,
            ((columna - 3) * fondo) / 7,
            ancho * 0.17,
            0.045,
            (fondo / 7) * 0.96,
          ]);
        }
      sillares(faldon, materiales.techo, lista);
    }
    caja(grupo, materiales.madera, 0, altura + 0.055, 0, 0.08, 0.08, fondo * 1.05);
  };
  if (id === 'E01') {
    caja(grupo, materiales.piedra, 0, 0.47, 0, 0.48, 0.94, 0.48);
    caja(grupo, materiales.madera, 0, 0.96, 0, 0.8, 0.1, 0.72);
    for (const x of [-0.34, 0.34])
      for (const z of [-0.3, 0.3]) caja(grupo, materiales.madera, x, 1.15, z, 0.06, 0.38, 0.06);
    techo(1.4, 0.88, 0.86);
    caja(grupo, materiales.oscuro, 0, 0.72, 0.247, 0.14, 0.24, 0.02);
    caja(grupo, materiales.metal, 0, 1.12, 0.3, 0.05, 0.05, 0.5);
  } else if (id === 'E02') {
    caja(grupo, materiales.piedra, 0, 0.28, 0, 0.85, 0.56, 0.66);
    techo(0.69, 1.05, 0.88);
    for (const x of [-0.46, 0.36]) {
      caja(grupo, materiales.madera, x, 0.16, 0.46, 0.26, 0.3, 0.26);
      caja(grupo, materiales.metal, x, 0.16, 0.6, 0.28, 0.035, 0.02);
    }
    const saco = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 6), materiales.saco);
    saco.position.set(-0.1, 0.14, 0.5);
    saco.scale.y = 0.8;
    grupo.add(saco);
  } else if (id === 'E03') {
    caja(grupo, materiales.piedra, 0, 0.3, 0, 1, 0.6, 0.64);
    techo(0.77, 1.18, 0.88);
    caja(grupo, materiales.madera, 0, 0.24, 0.33, 0.36, 0.48, 0.025);
    for (const x of [-0.14, 0, 0.14])
      caja(grupo, materiales.metal, x, 0.24, 0.351, 0.016, 0.44, 0.01);
    caja(grupo, materiales.madera, 0.47, 0.86, 0.22, 0.025, 0.95, 0.025);
    caja(grupo, tela, 0.32, 1.17, 0.22, 0.3, 0.3, 0.025);
  } else {
    caja(grupo, materiales.piedra, -0.18, 0.24, 0, 0.65, 0.48, 0.65);
    techo(0.6, 0.8, 0.8);
    for (const x of [-0.5, 0.5]) caja(grupo, materiales.madera, x, 0.58, -0.22, 0.06, 1.16, 0.07);
    caja(grupo, materiales.madera, 0, 1.13, -0.22, 1.2, 0.07, 0.08);
    caja(grupo, materiales.oscuro, 0.45, 0.78, -0.22, 0.014, 0.7, 0.014);
    const rueda = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.045, 5, 12), materiales.madera);
    rueda.position.set(0.34, 0.3, 0.27);
    grupo.add(rueda);
    for (const angulo of [0, Math.PI / 2]) {
      const jugadorEstado = caja(grupo, materiales.madera, 0.34, 0.3, 0.27, 0.49, 0.035, 0.04);
      jugadorEstado.rotation.z = angulo;
    }
  }
  // Entramado, ventanas encendidas y zócalo: detalles lisibles angulo escala de miniatura.
  for (const lado of [-1, 1]) {
    caja(grupo, materiales.madera, lado * 0.32, 0.27, 0.34, 0.045, 0.48, 0.04);
    caja(grupo, materiales.madera, 0, 0.13, lado * 0.34, 0.73, 0.045, 0.045);
    const diagonal = caja(grupo, materiales.madera, lado * 0.22, 0.31, 0.35, 0.045, 0.44, 0.035);
    diagonal.rotation.z = lado * 0.55;
    caja(grupo, materiales.oscuro, lado * 0.22, 0.4, 0.365, 0.18, 0.18, 0.03);
    caja(grupo, materiales.luz, lado * 0.22, 0.4, 0.385, 0.12, 0.12, 0.01);
    caja(grupo, materiales.madera, lado * 0.22, 0.4, 0.398, 0.016, 0.16, 0.012);
  }
  if (id === 'E01') {
    const brasero = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.07, 0.13, 8),
      materiales.metal,
    );
    brasero.position.set(0, 1.1, 0.12);
    grupo.add(brasero);
    const fuego = new THREE.Mesh(new THREE.SphereGeometry(0.085, 8, 6), materiales.luz);
    fuego.position.set(0, 1.24, 0.12);
    fuego.scale.y = 1.7;
    grupo.add(fuego);
  }
  if (id === 'E02' || id === 'E04') {
    caja(grupo, materiales.piedra, -0.23, 0.78, -0.18, 0.16, 0.58, 0.18);
    caja(grupo, materiales.oscuro, -0.23, 1.08, -0.18, 0.18, 0.04, 0.2);
    const humo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: materiales.sombra,
        color: '#c6bdb0',
        transparent: true,
        opacity: 0.3,
        depthWrite: false,
      }),
    );
    humo.position.set(-0.23, 1.3, -0.18);
    grupo.add(humo);
    grupo.userData.humo = humo;
  }
  if (id === 'E04') {
    caja(grupo, materiales.madera, 0.5, 0.55, 0.24, 0.06, 1.1, 0.06);
    for (let altura = 0.15; altura < 1; altura += 0.16)
      caja(grupo, materiales.madera, 0.5, altura, 0, 0.07, 0.035, 0.53);
    const brazo = caja(grupo, materiales.madera, 0.25, 0.83, -0.22, 0.055, 0.7, 0.055);
    brazo.rotation.z = -0.72;
  }
  for (const lado of [-1, 1]) {
    const barril = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.1, 0.28, 10),
      materiales.madera,
    );
    barril.position.set(lado * 0.48, 0.14, 0.25);
    grupo.add(barril);
    for (const altura of [0.06, 0.22]) {
      const aro = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.012, 4, 10), materiales.metal);
      aro.rotation.x = Math.PI / 2;
      aro.position.set(lado * 0.48, altura, 0.25);
      grupo.add(aro);
    }
  }
  sombra(grupo, materiales.sombra, 0, 0, 1.8, 1.5);
  return grupo;
}
export class Edificios {
  constructor(tablero, materiales, Z) {
    this.tablero = tablero;
    this.materiales = materiales;
    this.Z = Z;
    this.lista = new Map();
  }
  sync(estado) {
    const vistos = new Set();
    estado.jugadores.forEach((jugadorEstado, jugador) =>
      jugadorEstado.estructuras.forEach((datos, indice) => {
        vistos.add(datos.uid);
        let grupo = this.lista.get(datos.uid);
        if (!grupo) {
          grupo = edificio(datos.id, this.materiales, jugador);
          grupo.scale.setScalar(0.01);
          this.tablero.escena.add(grupo);
          this.lista.set(datos.uid, grupo);
          grupo.userData.tiempo = 0;
          this.tablero.polvo.emitir(
            new THREE.Vector3(CASILLERO.estructuras(indice), 0.1, this.Z.aldea[jugador] - 0.12),
          );
          this.tablero.chispas(
            new THREE.Vector3(CASILLERO.estructuras(indice), 0.1, this.Z.aldea[jugador] - 0.12),
            '#bcad89',
            16,
            1,
          );
        }
        grupo.userData.x = CASILLERO.estructuras(indice);
        grupo.userData.z = this.Z.aldea[jugador] - 0.12;
        grupo.rotation.y = 0;
      }),
    );
    for (const [uid, grupo] of this.lista)
      if (!vistos.has(uid) && !grupo.userData.salida) {
        grupo.userData.salida = true;
        grupo.userData.tiempo = 0;
        this.tablero.polvo.emitir(grupo.position.clone(), true);
        this.tablero.chispas(grupo.position.clone(), '#b4a58c', 28, 2);
      }
  }
  cuadro(delta) {
    for (const [uid, grupo] of this.lista) {
      const datos = grupo.userData;
      datos.tiempo += delta;
      const progreso = datos.salida
        ? Math.max(0, 1 - datos.tiempo * 1.8)
        : Math.min(1, datos.tiempo * 2);
      grupo.scale.setScalar(Math.max(0.001, progreso * 0.64));
      grupo.position.set(datos.x, -0.1 * (1 - progreso), datos.z);
      if (datos.humo) {
        const fase = (this.tablero.tiempo * 0.35) % 1;
        datos.humo.position.y = 1.15 + fase * 0.65;
        datos.humo.scale.setScalar(0.3 + fase * 0.5);
        datos.humo.material.opacity = 0.35 * Math.sin(fase * Math.PI);
      }
      grupo.rotation.z = datos.salida ? datos.tiempo * 0.4 : 0;
      if (datos.salida && progreso === 0) {
        this.tablero.escena.remove(grupo);
        grupo.traverse((objeto) => {
          if (!objeto.isInstancedMesh && !objeto.userData.compartida) objeto.geometry?.dispose();
          if (objeto.isSprite) objeto.material.dispose();
        });
        datos.tela.dispose();
        this.lista.delete(uid);
      }
    }
  }
  disparo(evento) {
    const grupo = this.lista.get(evento.desde);
    if (!grupo) return;
    const desde = grupo.position.clone().add(new THREE.Vector3(0, 0.75, 0)),
      hasta = this.tablero.posicionDe({ uid: evento.uid });
    const proyectil = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: this.tablero.fx.circle_05,
        color: '#ffd68a',
        transparent: true,
        depthWrite: false,
      }),
    );
    proyectil.position.copy(desde);
    proyectil.scale.setScalar(0.25);
    this.tablero.escena.add(proyectil);
    this.tablero.efimeros.push({
      obj: proyectil,
      t: 0,
      vida: 0.4,
      tipo: 'proyectil',
      desde,
      hasta,
    });
    this.tablero.destello(desde, '#ffe6ac', 0.8);
  }
}
