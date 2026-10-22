import * as THREE from '../../lib/three/three.module.min.js';
// Polvo blando y fragmentos de piedra; recursos compartidos y cantidad acotada.
export class ParticulasEscenario {
  constructor(tablero, materiales) {
    this.tablero = tablero;
    this.materiales = materiales;
    this.lista = [];
    this.geometria = new THREE.BoxGeometry(0.09, 0.08, 0.07);
  }
  emitir(pos, derribo = false) {
    if (this.lista.length > 180) return;
    for (let indice = 0; indice < (derribo ? 12 : 6); indice++) {
      const cascote = derribo && indice % 2 === 0;
      const objeto = cascote
        ? new THREE.Mesh(this.geometria, this.materiales.piedra)
        : new THREE.Sprite(
            new THREE.SpriteMaterial({
              map: this.materiales.sombra,
              color: '#d0b997',
              opacity: 0.3,
              transparent: true,
              depthWrite: false,
            }),
          );
      objeto.position.copy(pos);
      if (!cascote) objeto.scale.setScalar(0.3);
      this.tablero.escena.add(objeto);
      this.lista.push({
        objeto,
        cascote,
        tiempo: 0,
        vida: 0.8 + Math.random() * 0.5,
        velocidad: new THREE.Vector3(
          (Math.random() - 0.5) * 1.8,
          0.4 + Math.random() * (cascote ? 2 : 0.6),
          (Math.random() - 0.5) * 1.3,
        ),
      });
    }
  }
  cuadro(delta) {
    for (const particula of this.lista) {
      particula.tiempo += delta;
      const progreso = particula.tiempo / particula.vida;
      particula.objeto.position.addScaledVector(particula.velocidad, delta);
      if (particula.cascote) {
        particula.velocidad.y -= delta * 5;
        particula.objeto.position.y = Math.max(0.045, particula.objeto.position.y);
        particula.objeto.rotation.x += delta * 4;
        particula.objeto.rotation.z += delta * 3;
        particula.objeto.scale.setScalar(Math.max(0.001, 1 - progreso));
      } else {
        particula.objeto.material.opacity = 0.28 * Math.sin(Math.PI * Math.min(progreso, 1));
        particula.objeto.scale.setScalar(0.35 + progreso * 0.9);
      }
      if (progreso >= 1) {
        this.tablero.escena.remove(particula.objeto);
        if (!particula.cascote) particula.objeto.material.dispose();
      }
    }
    this.lista = this.lista.filter((particula) => particula.tiempo < particula.vida);
  }
  destruir() {
    this.geometria.dispose();
    for (const particula of this.lista) if (!particula.cascote) particula.objeto.material.dispose();
  }
}
