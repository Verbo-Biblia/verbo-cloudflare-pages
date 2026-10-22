import * as THREE from '../../lib/three/three.module.min.js';
// Semilla fija: el trabajo artesanal no cambia al abrir la mesa.
export function lienzo(tamaño, pintar) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = tamaño;
  pintar(canvas.getContext('2d'), tamaño);
  const textura = new THREE.CanvasTexture(canvas);
  textura.colorSpace = THREE.SRGBColorSpace;
  return textura;
}
let semilla = 71;
export const azar = () => {
  semilla = (semilla * 1664525 + 1013904223) >>> 0;
  return semilla / 4294967296;
};
export function materiales() {
  const piedra = lienzo(512, (contexto, tamaño) => {
    contexto.fillStyle = '#a99b81';
    contexto.fillRect(0, 0, tamaño, tamaño);
    for (let indice = 0; indice < 14000; indice++) {
      contexto.fillStyle = azar() > 0.5 ? '#ffffff12' : '#30251b18';
      contexto.fillRect(azar() * tamaño, azar() * tamaño, azar() * 5 + 1, 2);
    }
    // Musgo fino y depósitos de humedad en el pie de cada sillar.
    for (let indice = 0; indice < 1600; indice++) {
      contexto.fillStyle = indice % 2 ? '#4c614439' : '#37433125';
      contexto.fillRect(
        azar() * tamaño,
        tamaño * (0.83 + azar() * 0.17),
        1 + azar() * 5,
        1 + azar() * 3,
      );
    }
    const degradado = contexto.createLinearGradient(0, 0, 0, tamaño);
    degradado.addColorStop(0, '#fff4cc30');
    degradado.addColorStop(0.8, '#00000000');
    degradado.addColorStop(1, '#20170c60');
    contexto.fillStyle = degradado;
    contexto.fillRect(0, 0, tamaño, tamaño);
  });
  piedra.wrapS = piedra.wrapT = THREE.RepeatWrapping;
  // El mismo campo de altura produce normales y rugosidad, sin cargar imágenes.
  const relieve = mapasPiedra();
  const madera = lienzo(512, (contexto, tamaño) => {
    contexto.fillStyle = '#704224';
    contexto.fillRect(0, 0, tamaño, tamaño);
    for (let indice = 0; indice < 350; indice++) {
      contexto.strokeStyle = indice % 3 ? '#30180d35' : '#dfab6540';
      contexto.lineWidth = 1 + azar() * 3;
      contexto.beginPath();
      const y = azar() * tamaño;
      for (let x = 0; x <= tamaño; x += 16) contexto.lineTo(x, y + Math.sin(x / 70 + indice) * 3);
      contexto.stroke();
    }
    for (let indice = 0; indice < 4; indice++) {
      contexto.fillStyle = '#24140d80';
      contexto.fillRect(0, indice * 128, tamaño, 3);
    }
  });
  const sombra = lienzo(128, (contexto) => {
    const degradado = contexto.createRadialGradient(64, 64, 4, 64, 64, 64);
    degradado.addColorStop(0, '#160c08aa');
    degradado.addColorStop(1, '#160c0800');
    contexto.fillStyle = degradado;
    contexto.fillRect(0, 0, 128, 128);
  });
  return {
    piedra: new THREE.MeshStandardMaterial({
      map: piedra,
      normalMap: relieve.normal,
      normalScale: new THREE.Vector2(0.32, 0.32),
      roughnessMap: relieve.rugosidad,
      roughness: 1,
    }),
    madera: new THREE.MeshStandardMaterial({ map: madera, roughness: 0.84 }),
    cimiento: new THREE.MeshStandardMaterial({
      map: piedra,
      color: '#5a4c3e',
      roughness: 1,
    }),
    mortero: new THREE.MeshStandardMaterial({ color: '#625c4c', roughness: 1 }),
    luz: new THREE.MeshBasicMaterial({ color: '#ffc879' }),
    oscuro: new THREE.MeshStandardMaterial({ color: '#34261d', roughness: 1 }),
    metal: new THREE.MeshStandardMaterial({
      color: '#af8650',
      metalness: 0.5,
      roughness: 0.6,
    }),
    techo: new THREE.MeshStandardMaterial({ color: '#654a43', roughness: 1 }),
    saco: new THREE.MeshStandardMaterial({ color: '#c4a779', roughness: 1 }),
    sombra,
  };
}
export function caja(grupo, material, x, y, z, ancho, alto, profundidad) {
  const objeto = new THREE.Mesh(geometriaSillar(), material);
  objeto.position.set(x, y, z);
  objeto.scale.set(ancho, alto, profundidad);
  objeto.userData.compartida = true;
  grupo.add(objeto);
  return objeto;
}
export function sombra(grupo, textura, x, z, ancho, alto) {
  const objeto = new THREE.Mesh(
    new THREE.PlaneGeometry(ancho, alto),
    new THREE.MeshBasicMaterial({
      map: textura,
      transparent: true,
      depthWrite: false,
    }),
  );
  objeto.rotation.x = -Math.PI / 2;
  objeto.position.set(x, 0.006, z);
  grupo.add(objeto);
  return objeto;
}
// Un solo draw call para todos los sillares de cada pieza.
export function sillares(grupo, material, lista) {
  const objeto = new THREE.InstancedMesh(geometriaSillar(), material, lista.length);
  const molde = new THREE.Object3D();
  lista.forEach(([x, y, z, ancho, alto, profundidad], indice) => {
    // Cada sillar va un poco torcido y desigual: piedra tallada a mano, no cubos.
    molde.position.set(x + (azar() - 0.5) * 0.008, y, z + (azar() - 0.5) * 0.01);
    molde.rotation.set((azar() - 0.5) * 0.04, (azar() - 0.5) * 0.06, (azar() - 0.5) * 0.04);
    molde.scale.set(ancho * (0.97 + azar() * 0.05), alto * (0.95 + azar() * 0.08), profundidad * (0.97 + azar() * 0.05));
    molde.updateMatrix();
    objeto.setMatrixAt(indice, molde.matrix);
    objeto.setColorAt(
      indice,
      new THREE.Color().setRGB(0.8 + azar() * 0.2, 0.8 + azar() * 0.18, 0.76 + azar() * 0.2),
    );
  });
  grupo.add(objeto);
  return objeto;
}
export function grieta(grupo, x, y, z) {
  const puntos = [0, 0, 0.03, 0.13, -0.04, 0.24, 0.05, 0.33, -0.02, 0.48];
  const vertices = [];
  for (let indice = 0; indice < puntos.length; indice += 2)
    vertices.push(x + puntos[indice], y + puntos[indice + 1], z);
  const geometria = new THREE.BufferGeometry().setAttribute(
    'position',
    new THREE.Float32BufferAttribute(vertices, 3),
  );
  const linea = new THREE.Line(geometria, new THREE.LineBasicMaterial({ color: '#30271f' }));
  grupo.add(linea);
  return linea;
}

// Cubo biselado compartido: las caras planas conservan la lectura de piedra tallada.
let sillarCompartido;
export function geometriaSillar() {
  if (sillarCompartido) return sillarCompartido;
  const forma = new THREE.Shape();
  forma.moveTo(-0.43, -0.43);
  forma.lineTo(0.43, -0.43);
  forma.lineTo(0.43, 0.43);
  forma.lineTo(-0.43, 0.43);
  forma.closePath();
  sillarCompartido = new THREE.ExtrudeGeometry(forma, {
    depth: 0.86,
    bevelEnabled: true,
    bevelThickness: 0.07,
    bevelSize: 0.07,
    bevelSegments: 2,
    steps: 1,
  });
  sillarCompartido.translate(0, 0, -0.43);
  return sillarCompartido;
}

function mapasPiedra() {
  const tamaño = 256;
  const alturas = new Float32Array(tamaño * tamaño);
  for (let y = 0; y < tamaño; y++) {
    for (let x = 0; x < tamaño; x++) {
      alturas[y * tamaño + x] = Math.sin(x * 0.17 + Math.sin(y * 0.11)) * 0.3 + azar() * 0.35;
    }
  }
  const normal = lienzo(tamaño, (contexto) => {
    const imagen = contexto.createImageData(tamaño, tamaño);
    for (let y = 0; y < tamaño; y++) {
      for (let x = 0; x < tamaño; x++) {
        const indice = y * tamaño + x;
        const dx = alturas[y * tamaño + ((x + 1) % tamaño)] - alturas[indice];
        const dy = alturas[((y + 1) % tamaño) * tamaño + x] - alturas[indice];
        imagen.data.set([128 - dx * 85, 128 - dy * 85, 248, 255], indice * 4);
      }
    }
    contexto.putImageData(imagen, 0, 0);
  });
  normal.colorSpace = THREE.NoColorSpace;
  normal.wrapS = normal.wrapT = THREE.RepeatWrapping;
  const rugosidad = lienzo(tamaño, (contexto, ancho) => {
    contexto.fillStyle = '#dddddd';
    contexto.fillRect(0, 0, ancho, ancho);
    for (let indice = 0; indice < 5000; indice++) {
      contexto.fillStyle = azar() > 0.5 ? '#eeeeee' : '#aaaaaa';
      contexto.fillRect(azar() * ancho, azar() * ancho, 2, 2);
    }
  });
  rugosidad.colorSpace = THREE.NoColorSpace;
  rugosidad.wrapS = rugosidad.wrapT = THREE.RepeatWrapping;
  return { normal, rugosidad };
}
