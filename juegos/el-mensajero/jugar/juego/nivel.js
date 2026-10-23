// Constructor genérico de misiones: recibe los DATOS de una misión (juego/misiones/*.js) y arma el mundo 3D, la
// física y los objetos que se mueven. Medidas en metros; suelo en y = 0; el juego va en el plano z = 0.
//
// Piezas que entiende (todas opcionales salvo limites, control y meta):
//   suelo [[x0, x1, y?]]           tramos de suelo (entre ellos, vacío: caer = volver al punto de control)
//   tejados [[x0, x1, alto, mat?]] casas por cuya azotea se camina
//   casasFondo [[x0, x1, alto, puertas?]]   casas detrás de la calle; casasRelleno [[x0, x1, alto]] más atrás
//   bloques [[x0, x1, y0, y1, mat]]          sólidos (mat 'caja' | 'barril' | 'carreta' usan modelos)
//   vigas [[x0, x1, y0, y1]]       madera visible (sin física); mastiles [[x, y0, y1]] palo de barco detrás; postes [[x, y0, y1]]; techos [[x0, x1, y0, y1]] roca sólida de túnel
//   toldos [[x0, x1, y, mat]]      se suben de un salto o agarrándose desde abajo
//   puertas [x | [x, y]] / coberturas [[x, 'barril'|'caja']]   escondites
//   cajas [{x, a, h}]              se empujan o se jalan
//   palancas [{x, reja: {x, alto}}] la palanca sube su portón (y despierta al cazador si la misión tiene uno)
//   guillotinas [{x, alto?, periodo?, fase?, mat?: 'madera'|'hierro', y?}]  portones que suben y bajan solos
//   guardias [{x, ruta, dir}] / cazador {x, escape} / huidor {x, ruta, escape}   (ver guardia.js)
//   moviles [{x0, x1, y, dx, dy, periodo, fase?}]  plataformas que van y vienen
//   caedizas [[x0, x1, y]]         tablas que se caen al pisarlas (y vuelven)
//   escaleras [[x, y0, y1, tipo?]] escaleras de mano o sogas para trepar ('cuerda' | 'escalera')
//   tirolesas [[x0, y0, x1, y1]]   cuerda inclinada: se agarra saltando y se desliza
//   rampas [[x0, y0, x1, y1]]      laderas o tejados inclinados: se resbala hacia abajo
//   aguas [[x0, x1, y]]            canales: caer al agua = volver al punto de control
//   rodantes [{x, hasta, cada, vel, tam?}]  barriles o piedras que ruedan (saltarlos)
//   cantaros [[x, y]]              agua para correr rápido; pergaminos [[x, y]] (3 por misión)
//   faroles [[x, y, z]] (antorchas en 'cueva'), deco [[modelo, x, y, z, alto]], pistas, objetivos, meta {x}

import * as THREE from 'three';
import { Constructor, casa, fondo, material, halo, ambiente, capasPintadas, objetosPintados } from './mundo.js?v=ff246806';
import { Mundo, mover, GRAVEDAD } from './fisica.js?v=ff246806';

export function construirNivel(escena, recursos, D) {
  const mundo = new Mundo();
  const raiz = new THREE.Group();
  escena.add(raiz);
  const b = new Constructor();
  const cueva = D.ambiente === 'cueva';
  const L = D.limites;

  // --- suelo y vacíos
  const matSuelo = D.matSuelo ?? (cueva ? 'roca' : 'suelo');
  // en el campo pintado, el terreno sigue hacia atrás (los árboles pintados se apoyan en él) y los vacíos son
  // barrancos de roca hasta el fondo, en vez de dejar ver el cielo
  const campo = D.fondo === 'campo' && D.pintura;
  for (const [x0, x1, y = 0] of D.suelo ?? []) {
    mundo.agregar({ x0, x1, y0: y - 9, y1: y });
    b.caja(x0, y - 3, -6, x1, y, 2.5, matSuelo);
    if (y > 0.5 || campo) b.caja(x0, -9, -6, x1, y - 3, 2.5, campo ? 'roca' : matSuelo);
    if (campo) {
      b.caja(x0, y - 3, -40, x1, y - 0.03, -6, matSuelo);
      b.caja(x0, -9, -40, x1, y - 3, -6, 'roca');
    }
  }
  // bordes de los barrancos (campo y cueva): piedras de pocas caras sobre la pared y el labio, para que no sean
  // esquinas rectas. Solo se ven: no sobresalen por encima del suelo en el camino (z cerca de 0) ni cambian el salto.
  if (campo || cueva) {
    const tramos = D.suelo ?? [];
    let semilla = 7;
    const azar = () => (semilla = (semilla * 16807) % 2147483647) / 2147483647;
    const geo = new THREE.DodecahedronGeometry(1, 0);
    const matPiedra = material('roca');
    const piedra = (x, y, z, sx, sy, sz) => {
      const p = new THREE.Mesh(geo, matPiedra);
      p.position.set(x, y, z); p.scale.set(sx, sy, sz);
      p.rotation.set(azar() * 3, azar() * 3, azar() * 3);
      raiz.add(p);
    };
    for (const [x0, x1, y = 0] of tramos) {
      for (const [borde, lado] of [[x0, -1], [x1, 1]]) {
        if (borde <= L[0] - 1 || borde >= L[1] + 1) continue;
        if (tramos.some(t => t !== tramos.find(u => u[0] === x0 && u[1] === x1) && (Math.abs(t[0] - borde) < 0.05 || Math.abs(t[1] - borde) < 0.05))) continue;
        const zFondo = campo ? -9 : -5.5;
        // pared del barranco: piedras que asoman hasta 0,35 m hacia el vacío, por debajo del labio
        for (let k = 0; k < 14; k++) {
          const sx = 0.35 + azar() * 0.5, sy = 0.3 + azar() * 0.6, sz = 0.4 + azar() * 0.8;
          const cy = Math.min(y - 0.12 - sy, y - 0.4 - azar() * 5.5);
          piedra(borde + lado * (azar() * 0.35 - sx * 0.6), cy, zFondo + azar() * (2.5 - zFondo), sx, sy, sz);
        }
        // labio de adelante (lo que más se ve): piedras colgando bajo la esquina
        for (let k = 0; k < 3; k++) {
          const sy = 0.25 + azar() * 0.35;
          piedra(borde + lado * (azar() * 0.3 - 0.35), y - 0.1 - sy, 2.1 + azar() * 0.5, 0.35 + azar() * 0.3, sy, 0.35 + azar() * 0.3);
        }
        // detrás del camino, peñascos sobre el borde que rompen la línea recta del horizonte
        for (let k = 0; k < 3; k++) {
          const t = 0.3 + azar() * 0.6;
          piedra(borde - lado * (0.3 + azar() * 1.2), y + t * 0.25, -2.2 - azar() * 3, t * 1.3, t, t * 1.1);
        }
      }
    }
  }
  // objetos pintados más atrás que el suelo (puesto, tinajas, árboles): piso de patio debajo, que sigue a la calle;
  // si no, desde los techos se veían flotando sobre el vacío
  if (!campo) for (const [, x, y, z, alto] of D.objetos ?? []) {
    if (y === 0 && z < -5.5) b.caja(x - alto * 0.6, -3, z - 1.2, x + alto * 0.6, 0, -6, matSuelo);
  }
  if (campo) b.caja(L[0] - 30, -9, -42, L[1] + 30, -0.4, -40, 'roca');   // pared del fondo de los barrancos
  // en la ciudad, por los callejones se veía el cielo bajo el nivel de la calle: muro oscuro detrás, hasta el suelo
  if ((D.fondo ?? 'ciudad') === 'ciudad' && !cueva) b.caja(L[0] - 30, -9.2, -7, L[1] + 30, 0.05, -6.2, 'revoqueOscuro');
  // fondo de los vacíos: oscuro, se nota que es caída (en el campo, roca oscura: el negro liso parecía un hueco vacío)
  b.caja(L[0] - 30, -9.2, campo ? -40 : -6, L[1] + 30, -9, 2.5, campo ? 'rocaOscura' : 'hueco');

  // --- tejados
  for (const [x0, x1, alto, mat] of D.tejados ?? []) {
    mundo.agregar({ x0, x1, y0: -9, y1: alto });
    const ventanas = [];
    for (let x = x0 + 1.2; x < x1 - 0.8; x += 2.6) ventanas.push([x, alto - 1.6, 0.5, 0.65, (x * 7) % 3 > 1]);
    casa(b, { x0, x1, alto, z0: -4, z1: 1.2, base: -9, mat: mat ?? (alto > 4.5 ? 'piedra' : 'revoque'), ventanas, pretil: false });
  }

  // --- casas del fondo de la calle (detrás del plano del juego)
  for (const [x0, x1, alto, puertas = [], mat] of D.casasFondo ?? []) {
    const ventanas = [];
    for (let x = x0 + 1.5; x < x1 - 1; x += 3.1) ventanas.push([x, alto - 1.7, 0.55, 0.7, ((x * 13) | 0) % 4 !== 0]);
    casa(b, { x0, x1, alto, z0: -6, z1: -1.2, mat: mat ?? 'revoque', puertas, ventanas });
  }
  for (const [x0, x1, alto] of D.casasRelleno ?? []) {
    casa(b, { x0, x1, alto, z0: -11, z1: -6.5, mat: 'revoqueOscuro', ventanas: [[x0 + 2, alto - 1.5], [x1 - 2, alto - 1.5, 0.5, 0.7, false]] });
  }

  // --- bloques, techos de túnel y vigas
  const props = [];
  for (const [x0, x1, y0, y1, mat] of D.bloques ?? []) {
    mundo.agregar({ x0, x1, y0, y1 });
    if (mat === 'caja' || mat === 'barril' || mat === 'carreta') {
      props.push([mat, (x0 + x1) / 2, y0, x1 - x0, y1 - y0]);
      if (mat === 'carreta') b.caja(x0, y0, -0.6, x1, y1 - 0.05, 0.6, 'madera');
    } else {
      b.caja(x0, y0, -2.5, x1, y1, 1.2, mat);
    }
  }
  for (const [x0, x1, y0, y1] of D.techos ?? []) {
    mundo.agregar({ x0, x1, y0, y1 });
    b.caja(x0, y0, -6, x1, y1, 2.5, 'roca');
  }
  for (const [x0, x1, y0, y1] of D.vigas ?? []) b.caja(x0, y0, -2.6, x1, y1, 1.3, 'madera');
  // postes: palos redondos que sostienen pasarelas (detrás del camino, sin física)
  for (const [x, y0, y1] of D.postes ?? []) {
    const palo = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, y1 - y0, 8), material('madera'));
    palo.position.set(x, (y0 + y1) / 2, -1.05);
    raiz.add(palo);
  }
  // mástiles: palo redondo detrás del camino (Eliab pasa por delante) con su verga arriba
  for (const [x, y0, y1] of D.mastiles ?? []) {
    const palo = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.18, y1 - y0, 10), material('madera'));
    palo.position.set(x, (y0 + y1) / 2, -1.3);
    raiz.add(palo);
    const verga = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 6, 8), material('madera'));
    verga.rotation.z = Math.PI / 2;
    verga.position.set(x, y1 - 0.6, -1.4);
    raiz.add(verga);
  }

  // --- toldos
  for (const [x0, x1, y, mat] of D.toldos ?? []) {
    mundo.agregar({ x0, x1, y0: y - 0.1, y1: y, tipo: 'toldo' });
    const tela = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, 1.9), material(mat));
    tela.position.set((x0 + x1) / 2, y - 0.05, -0.35);
    tela.rotation.x = -Math.PI / 2 + 0.2;
    raiz.add(tela);
    b.caja(x0, y - 0.12, 0.55, x1, y, 0.65, 'madera');
    const piso = sueloBajo(D, (x0 + x1) / 2, y);
    b.caja(x0 + 0.1, piso, 0.5, x0 + 0.22, y, 0.62, 'madera');
    b.caja(x1 - 0.22, piso, 0.5, x1 - 0.1, y, 0.62, 'madera');
  }

  // --- escondites
  const iconos = [];
  const marco = cueva ? 'roca' : 'piedra';
  // cada portal: x, o [x, y] cuando hay algo encima (una pasarela) y no debe ir sobre eso
  const portales = (D.puertas ?? []).map(p => Array.isArray(p) ? p : [p, sueloBajo(D, p, 30)]);
  for (const [px, py] of portales) {
    b.caja(px - 0.92, py, -1.2, px - 0.7, py + 2.45, -0.7, marco);
    b.caja(px + 0.7, py, -1.2, px + 0.92, py + 2.45, -0.7, marco);
    b.caja(px - 0.92, py + 2.25, -1.2, px + 0.92, py + 2.5, -0.7, marco);
    b.caja(px - 0.7, py, -1.6, px + 0.7, py + 2.25, -1.19, 'hueco');
    iconos.push(icono(raiz, px, py + 2.95, -0.8));
  }
  const zonas = portales.map(([px, py]) => [px - 0.7, px + 0.7, py]);
  for (const [cx, tipo] of D.coberturas ?? []) {
    const py = sueloBajo(D, cx, 30);
    for (const dx of [-0.42, 0.42]) {
      const m = recursos.utileria[tipo].clone();
      ajustarProp(m, tipo === 'caja' ? 0.84 : null, 1.15, tipo === 'caja' ? 0.84 : null);
      m.position.set(cx + dx, py, 0.62);
      m.rotation.y = dx * 2;
      raiz.add(m);
    }
    zonas.push([cx - 0.85, cx + 0.85, py]);
    iconos.push(icono(raiz, cx, py + 1.75, 0.62));
  }

  // --- guillotinas: portones de madera o de hierro que suben y bajan solos; se pasa por debajo cuando están arriba
  // (si bajan encima de Eliab, vuelve al punto de control). El panel sube hasta quedar tapado por el muro de arriba.
  const guillotinas = (D.guillotinas ?? []).map((G) => {
    const piso = G.y ?? sueloBajo(D, G.x, 30);
    const alto = G.alto ?? 2.4, mat = G.mat ?? 'madera';
    const choque = mundo.agregar({ x0: G.x - 0.18, x1: G.x + 0.18, y0: piso, y1: piso + alto });
    const panel = new THREE.Group();
    const tabla = new THREE.Mesh(new THREE.BoxGeometry(0.22, alto, 2.0), material(mat === 'hierro' ? 'hierro' : 'madera'));
    tabla.position.y = alto / 2;
    panel.add(tabla);
    // barrotes o bandas para que se lea como portón
    for (let k = 0; k < 4; k++) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.1, 2.05), material('hierro'));
      b.position.y = 0.2 + k * (alto - 0.4) / 3;
      panel.add(b);
    }
    panel.position.set(G.x, piso, 0);
    raiz.add(panel);
    // marco: dos postes de piedra a los lados del camino (atrás y adelante)
    b.caja(G.x - 0.3, piso, -1.3, G.x + 0.3, piso + alto + 0.3, -1.0, G.marco ?? 'piedra');
    b.caja(G.x - 0.3, piso, 1.0, G.x + 0.3, piso + alto + 0.3, 1.25, G.marco ?? 'piedra');
    return { x: G.x, piso, alto, panel, choque, periodo: G.periodo ?? 4, fase: G.fase ?? 0, abre: 0, bajando: false, golpe: false };
  });

  // --- palancas y portones
  const palancas = (D.palancas ?? []).map((P) => {
    const R = P.reja;
    const piso = sueloBajo(D, R.x, 30);
    const reja = mundo.agregar({ x0: R.x - 0.2, x1: R.x + 0.2, y0: piso, y1: piso + R.alto, transparente: true });
    const malla = new THREE.Group();
    const porton = new THREE.Mesh(new THREE.BoxGeometry(0.36, R.alto, 2.2), material('madera'));
    porton.position.set(R.x, piso + R.alto / 2, 0);
    malla.add(porton);
    for (const y of [0.35, R.alto / 2, R.alto - 0.35]) {
      const banda = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.14, 2.25), material('hierro'));
      banda.position.set(R.x, piso + y, 0);
      malla.add(banda);
    }
    raiz.add(malla);
    const pisoP = sueloBajo(D, P.x, 30);
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.35, 0.4), material('hierro'));
    const brazo = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.25, 0.1), material('madera'));
    brazo.geometry.translate(0, 0.62, 0);
    const pomo = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), material('hierro'));
    pomo.position.y = 1.25;
    brazo.add(pomo);
    brazo.rotation.z = 0.6;
    g.add(base, brazo);
    g.position.set(P.x, pisoP + 0.17, -0.7);
    raiz.add(g);
    const brillo = brilloObjeto(0xffd88a);
    brillo.position.set(P.x, pisoP + 1.3, -0.5);
    raiz.add(brillo);
    return {
      x: P.x, y: pisoP, reja, malla, brazo, brillo, alto: R.alto, piso, abierta: false, abrirT: 0, palancaT: undefined,
      despierta: P.despierta ?? true,
      mover() { this.palancaT = 0; },
      abrir() { this.abierta = true; },
      reiniciar() {
        Object.assign(this, { abierta: false, abrirT: 0, palancaT: undefined });
        malla.position.y = 0;
        Object.assign(reja, { y0: piso, y1: piso + R.alto, inactivo: false });
        brazo.rotation.z = 0.6;
      },
    };
  });

  // --- cajas que se empujan
  const cajas = (D.cajas ?? []).map((K) => {
    const y0 = sueloBajo(D, K.x, 30);
    const c = { x: K.x, y: y0, a: K.a ?? 1.1, h: K.h ?? 1.1, vx: 0, vy: 0, enSuelo: true };
    const s = mundo.agregar({ x0: 0, x1: 0, y0: 0, y1: 0 });
    c.solido = s;
    const m = recursos.utileria.caja.clone();
    ajustarProp(m, c.a, c.h, c.a);
    raiz.add(m);
    const caja = {
      c, solido: s,
      mover() { Object.assign(s, { x0: c.x - c.a / 2, x1: c.x + c.a / 2, y0: c.y, y1: c.y + c.h }); m.position.set(c.x, c.y, 0); },
      reiniciar() { Object.assign(c, { x: K.x, y: y0, vx: 0, vy: 0 }); this.mover(); },
    };
    caja.mover();
    return caja;
  });

  // --- plataformas que se mueven (tablón colgado de sogas o canasto de polea)
  const moviles = (D.moviles ?? []).map((P, i) => {
    const s = mundo.agregar({ x0: P.x0, x1: P.x1, y0: P.y - 0.25, y1: P.y, movil: true });
    const m = new THREE.Mesh(new THREE.BoxGeometry(P.x1 - P.x0, 0.25, 1.6), material('madera'));
    raiz.add(m);
    const sogas = [];
    let carro = null;
    if (!P.sinSogas) {
      for (const dx of [0.1, P.x1 - P.x0 - 0.1]) {
        const soga = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1, 5), material('cuerda'));
        raiz.add(soga);
        sogas.push([soga, dx]);
      }
      // la que va de lado cuelga de una grúa: travesaño a lo largo del recorrido, sobre dos postes que bajan al
      // agua, y un carrito que corre por él con las sogas (antes las sogas subían al aire, sin nada arriba)
      if (P.dx) {
        const arriba = P.y + Math.max(0, P.dy ?? 0) + 5;
        const xa = Math.min(P.x0, P.x0 + P.dx) - 0.5, xb = Math.max(P.x1, P.x1 + P.dx) + 0.5;
        b.caja(xa - 0.2, arriba, 0.4, xb + 0.2, arriba + 0.35, 0.8, 'madera');
        for (const x of [xa, xb]) b.caja(x - 0.17, -1.2, 0.43, x + 0.17, arriba + 0.35, 0.77, 'madera');
        carro = new THREE.Mesh(new THREE.BoxGeometry(P.x1 - P.x0 + 0.3, 0.28, 0.5), material('hierro'));
        carro.position.y = arriba - 0.14;
        raiz.add(carro);
      }
    }
    return { P, s, m, sogas, carro, dx: 0, dy: 0, fase: P.fase ?? i * 0.37, x0: P.x0, y: P.y };
  });

  // --- tablas que se caen al pisarlas
  const caedizas = (D.caedizas ?? []).map(([x0, x1, y]) => {
    const s = mundo.agregar({ x0, x1, y0: y - 0.2, y1: y });
    const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, 0.2, 1.4), material('maderaVieja'));
    m.position.set((x0 + x1) / 2, y - 0.1, 0);
    raiz.add(m);
    // grietas: dos tablas más oscuras encima, para que se note que está vieja
    for (const k of [0.3, 0.7]) {
      const g = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.205, 1.42), material('hierro'));
      g.position.set(x0 + (x1 - x0) * k - (x0 + x1) / 2, 0, 0);
      m.add(g);
    }
    return { x0, x1, y, s, m, t: -1, cayendo: false, vy: 0, vuelve: 0 };
  });

  // --- escaleras de mano y sogas
  const escaleras = (D.escaleras ?? []).map(([x, y0, y1, tipo = 'escalera']) => {
    if (tipo === 'cuerda') {
      // junto a un mástil, la soga cuelga de un brazo que sale del palo, por encima de la cabeza de Eliab
      // (antes terminaba en el aire)
      const mastil = (D.mastiles ?? []).find(([mx, , my1]) => Math.abs(mx - x) < 3 && my1 > y1 + 2.4);
      const tope = mastil ? y1 + 2.2 : y1 + 0.6;
      const soga = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, tope - y0, 6), material('cuerda'));
      soga.position.set(x, (y0 + tope) / 2, -0.3);
      raiz.add(soga);
      if (mastil) {
        const mx = mastil[0];
        b.caja(Math.min(x, mx) - 0.12, tope, -1.4, Math.max(x, mx) + 0.12, tope + 0.2, -0.2, 'madera');
        const nudo = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.18, 8), material('cuerda'));
        nudo.position.set(x, tope - 0.05, -0.3);
        raiz.add(nudo);
      }
    } else {
      b.caja(x - 0.32, y0, -0.45, x - 0.25, y1 + 0.6, -0.38, 'madera');
      b.caja(x + 0.25, y0, -0.45, x + 0.32, y1 + 0.6, -0.38, 'madera');
      for (let y = y0 + 0.3; y < y1 + 0.5; y += 0.35) b.caja(x - 0.25, y, -0.44, x + 0.25, y + 0.05, -0.39, 'madera');
    }
    return { x, y0, y1, tipo };
  });

  // --- tirolesas: cuerda entre dos postes, con una polea de madera que se agarra
  const tirolesas = (D.tirolesas ?? []).map(([x0, y0, x1, y1]) => {
    const largo = Math.hypot(x1 - x0, y1 - y0);
    const soga = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, largo, 5), material('cuerda'));
    soga.position.set((x0 + x1) / 2, (y0 + y1) / 2, 0.25);
    soga.rotation.z = Math.atan2(y1 - y0, x1 - x0) - Math.PI / 2;
    raiz.add(soga);
    for (const [px, py] of [[x0, y0], [x1, y1]]) {
      const piso = sueloBajo(D, px, py);
      b.caja(px - 0.1, piso, 0.15, px + 0.1, py + 0.4, 0.35, 'madera');
    }
    return { x0, y0, x1, y1 };
  });

  // --- rampas para resbalar (tejado o ladera inclinada)
  const rampas = (D.rampas ?? []).map(([x0, y0, x1, y1, mat]) => {
    const largo = Math.hypot(x1 - x0, y1 - y0);
    const m = new THREE.Mesh(new THREE.BoxGeometry(largo, 0.3, 2.4), material(mat ?? (cueva ? 'roca' : 'tierra')));
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2 - 0.15, -0.3);
    m.rotation.z = Math.atan2(y1 - y0, x1 - x0);
    raiz.add(m);
    return { x0, y0, x1, y1 };
  });

  // --- agua (canales de las cisternas, el mar)
  const aguas = (D.aguas ?? []).map(([x0, x1, y]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, 0.1, 3.2), material('agua'));
    m.position.set((x0 + x1) / 2, y, -0.6);
    m.visible = D.fondo !== 'puerto';   // en el puerto el agua ya es el mar entero (la franja se veía cortada)
    raiz.add(m);
    return { x0, x1, y, m };
  });

  // --- barriles (o piedras) que ruedan
  const rodantes = (D.rodantes ?? []).map((R) => ({ R, t: R.desfase ?? 0, activos: [] }));

  // --- utilería
  for (const [tipo, x, y, ancho, alto] of props) {
    const m = recursos.utileria[tipo].clone();
    ajustarProp(m, ancho, alto, tipo === 'carreta' ? 1.6 : ancho);
    m.position.set(x, y, 0);
    raiz.add(m);
  }
  for (const [tipo, x, y, z, alto] of D.deco ?? []) {
    if (!recursos.utileria[tipo]) continue;
    const m = recursos.utileria[tipo].clone();
    ajustarProp(m, null, alto, null);
    m.position.set(x, y, z);
    m.rotation.y = x * 1.7;
    raiz.add(m);
  }

  // --- faroles (en la cueva, antorchas): modelo + halo; la luz de verdad solo en los más cercanos (principal.js)
  const faroles = (D.faroles ?? []).map(([x, y, z = -1.2]) => {
    if (cueva) {
      b.caja(x - 0.05, y - 0.5, z - 0.05, x + 0.05, y, z + 0.05, 'madera');
      const llama = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo(), color: 0xff9a3a, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      llama.scale.set(0.5, 0.8, 1);
      llama.position.set(x, y + 0.15, z + 0.1);
      raiz.add(llama);
    } else {
      const f = recursos.utileria.farol.clone();
      ajustarProp(f, null, 0.5, null);
      f.position.set(x, y - 0.25, z);
      raiz.add(f);
      const tejado = (D.tejados ?? []).find(([x0, x1]) => x > x0 && x < x1);
      const pared = (D.casasFondo ?? []).some(([x0, x1, alto]) => x > x0 && x < x1 && alto > y);
      if (tejado || !pared) {   // poste desde la azotea o desde el suelo (sin pared, el soporte quedaría en el aire)
        b.caja(x - 0.06, tejado ? tejado[2] : sueloBajo(D, x, y), z - 0.06, x + 0.06, y + 0.3, z + 0.06, 'madera');
      } else {
        b.caja(x - 0.03, y + 0.24, -1.2, x + 0.03, y + 0.3, z + 0.03, 'hierro');
        b.caja(x - 0.09, y - 0.1, -1.22, x + 0.09, y + 0.4, -1.17, 'hierro');
      }
    }
    const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo(), color: 0xffb060, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    h.scale.set(cueva ? 1.6 : 0.9, cueva ? 1.6 : 0.9, 1);
    h.material.opacity = ambiente.ventanas || cueva ? 0.7 : 0.25;
    h.position.set(x, y, z + 0.2);
    raiz.add(h);
    return { x, y, z, halo: h };
  });

  // --- puntos de control
  const controles = D.control.map(([x, y, dir], i) => {
    const g = new THREE.Group();
    const piedra = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.5, 8), material('piedra'));
    piedra.position.y = 0.25;
    const llama = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo(), color: 0x6a6a7a, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    llama.scale.set(0.5, 0.5, 1);
    llama.position.y = 0.62;
    g.add(piedra, llama);
    g.position.set(x + 0.9, y, -0.8);
    if (i > 0) raiz.add(g);
    return { x, y, dir, llama, alcanzado: i === 0 };
  });

  // --- pergaminos y cántaros
  const pergaminos = (D.pergaminos ?? []).map(([x, y], i) => {
    const g = new THREE.Group();
    const rollo = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.42, 10), new THREE.MeshLambertMaterial({ color: 0xf2e2b8, emissive: 0x3a2a10 }));
    rollo.rotation.z = Math.PI / 2;
    const cinta = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.06, 10), new THREE.MeshLambertMaterial({ color: 0x8a2a1e }));
    cinta.rotation.z = Math.PI / 2;
    const brillo = brilloObjeto(0xfff0c0);
    brillo.scale.set(1.1, 1.1, 1);
    g.add(rollo, cinta, brillo);
    g.position.set(x, y, 0);
    raiz.add(g);
    return { x, y, g, tomado: false, i };
  });
  const cantaros = (D.cantaros ?? []).map(([x, y]) => {
    const g = new THREE.Group();
    const barro = new THREE.MeshLambertMaterial({ color: 0xb8643a, emissive: 0x2a1006 });
    const cuerpo = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), barro);
    cuerpo.scale.y = 1.15;
    const cuello = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 0.16, 8), barro);
    cuello.position.y = 0.26;
    const agua = new THREE.Mesh(new THREE.CircleGeometry(0.065, 10), new THREE.MeshBasicMaterial({ color: 0x8ad0ff }));
    agua.rotation.x = -Math.PI / 2; agua.position.y = 0.335;
    const brillo = brilloObjeto(0x9ad8ff);
    brillo.scale.set(1, 1, 1);
    g.add(cuerpo, cuello, agua, brillo);
    g.position.set(x, y + 0.25, 0);
    raiz.add(g);
    return { x, y, g, tomado: false };
  });

  if (D.extra) D.extra({ b, raiz, mundo, recursos, material, THREE });   // piezas propias de una misión (la casa de María…)
  if (D.pintura) capasPintadas(D.pintura, { cueva });
  if (D.objetos) objetosPintados(raiz, D.objetos);
  fondo(raiz, L[0] - 30, L[1] + 30, D.fondo ?? (cueva ? 'cueva' : 'ciudad'), { templo: D.templo ?? false, pintado: !!D.pintura });
  b.terminar(raiz);

  const nivel = {
    D, mundo, raiz, zonas, portales, iconos, controles, pergaminos, cantaros, faroles, palancas, cajas, guillotinas,
    moviles, caedizas, escaleras, tirolesas, rampas, aguas, rodantes,
    // Antes de mover al jugador: plataformas que se mueven (llevan encima a quien esté parado) y tablas que caen.
    antes(dt, t, cuerpos) {
      for (const p of moviles) {
        const { P } = p;
        const k = (Math.sin((t / P.periodo + p.fase) * Math.PI * 2) + 1) / 2;
        const nx = P.x0 + (P.dx ?? 0) * k, ny = P.y + (P.dy ?? 0) * k;
        const dx = nx - p.s.x0, dy = ny - p.s.y1;
        for (const c of cuerpos) {
          if (c.enSuelo && c.x + c.a / 2 > p.s.x0 && c.x - c.a / 2 < p.s.x1 && Math.abs(c.y - p.s.y1) < 0.06) { c.x += dx; c.y += dy; }
        }
        Object.assign(p.s, { x0: nx, x1: nx + (P.x1 - P.x0), y0: ny - 0.25, y1: ny });
        p.m.position.set(nx + (P.x1 - P.x0) / 2, ny - 0.125, 0);
        for (const [soga, ox] of p.sogas) {
          const arriba = P.y + Math.max(0, P.dy ?? 0) + 5;
          soga.scale.y = arriba - ny;
          soga.position.set(nx + ox, (arriba + ny) / 2, 0.6);
        }
        if (p.carro) p.carro.position.set(nx + (P.x1 - P.x0) / 2, p.carro.position.y, 0.6);
      }
      for (const c of caedizas) {
        const pisada = cuerpos.some(j => j.enSuelo && j.x + j.a / 2 > c.x0 && j.x - j.a / 2 < c.x1 && Math.abs(j.y - c.y) < 0.06);
        if (c.t < 0 && pisada && !c.cayendo) c.t = 0;
        if (c.t >= 0 && !c.cayendo) {
          c.t += dt;
          c.m.position.x = (c.x0 + c.x1) / 2 + Math.sin(c.t * 60) * 0.04;   // tiembla
          if (c.t > 0.55) { c.cayendo = true; c.s.inactivo = true; c.vy = 0; c.sonido = true; }
        }
        if (c.cayendo) {
          c.vy -= GRAVEDAD * dt;
          c.m.position.y += c.vy * dt;
          c.m.rotation.z += dt * 1.5;
          if (c.m.position.y < c.y - 14) { c.vuelve += dt; c.m.visible = false; }
          if (c.vuelve > 2.5) this.reponerCaediza(c);
        }
      }
    },
    reponerCaediza(c) {
      Object.assign(c, { t: -1, cayendo: false, vy: 0, vuelve: 0 });
      c.s.inactivo = false;
      c.m.visible = true;
      c.m.position.set((c.x0 + c.x1) / 2, c.y - 0.1, 0);
      c.m.rotation.z = 0;
    },
    actualizar(dt, t) {
      for (const caja of cajas) {
        const c = caja.c;
        c.vy -= GRAVEDAD * dt;
        c.vx = 0;
        mover(mundo, c, dt, { subir: 0 });
        caja.mover();
        if (c.y < -8) caja.reiniciar();
      }
      for (const p of palancas) {
        if (p.palancaT !== undefined && p.palancaT < 1) {
          p.palancaT = Math.min(1, p.palancaT + dt / 0.35);
          const k = p.palancaT * p.palancaT * (3 - 2 * p.palancaT);
          p.brazo.rotation.z = 0.6 - 1.2 * k;
        }
        p.brillo.visible = !p.abierta && p.palancaT === undefined;
        p.brillo.material.opacity = 0.5 + Math.sin(t * 4) * 0.3;
        if (p.abierta && p.abrirT < 1) {
          p.abrirT = Math.min(1, p.abrirT + dt / 1.6);
          const y = p.abrirT * (p.alto - 0.1);
          p.malla.position.y = y;
          p.reja.y0 = p.piso + y; p.reja.y1 = p.piso + p.alto + y;
          if (p.abrirT > 0.6) p.reja.inactivo = true;
        }
      }
      // guillotinas: arriba 45 % del ciclo, cae rápido, abajo 30 %, sube despacio
      for (const g of guillotinas) {
        const u = ((t / g.periodo + g.fase) % 1 + 1) % 1;
        const abre = u < 0.45 ? 1 : u < 0.52 ? 1 - ((u - 0.45) / 0.07) ** 2 : u < 0.82 ? 0 : (u - 0.82) / 0.18;
        g.bajando = abre < g.abre;
        g.golpe = g.abre > 0.02 && abre <= 0.02;   // acaba de tocar el piso (sonido)
        g.abre = abre;
        const y = abre * (g.alto - 0.1);
        g.panel.position.y = g.piso + y;
        g.choque.y0 = g.piso + y; g.choque.y1 = g.piso + g.alto + y;
      }
      for (const p of pergaminos) if (!p.tomado) { p.g.position.y = p.y + Math.sin(t * 2.5 + p.i) * 0.08; p.g.rotation.y = t * 1.2; }
      for (const c of cantaros) if (!c.tomado) c.g.rotation.y = t * 1.5;
      for (const f of faroles) f.halo.material.opacity = (cueva ? 0.75 : ambiente.ventanas ? 0.6 : 0.25) + Math.sin(t * 9 + f.x) * 0.06;
      for (const a of aguas) a.m.position.y = a.y + Math.sin(t * 1.3 + a.x0) * 0.03;
      // rodantes: aparecen cada «cada» segundos en x y ruedan hacia «hasta»
      for (const r of rodantes) {
        const R = r.R;
        r.t -= dt;
        if (r.t <= 0) {
          r.t = R.cada;
          const m = recursos.utileria[R.modelo ?? 'barril'].clone();
          const tam = R.tam ?? 0.9;
          ajustarProp(m, null, tam, null);
          const pivote = new THREE.Group();
          m.position.y = -tam / 2;
          pivote.add(m);
          pivote.rotation.x = Math.PI / 2;   // de lado, rueda
          const giro = new THREE.Group();
          giro.add(pivote);
          raiz.add(giro);
          r.activos.push({ x: R.x, y: R.y ?? sueloBajo(D, R.x, 30), vy: 0, tam, g: giro, dir: Math.sign(R.hasta - R.x) });
        }
        for (const o of [...r.activos]) {
          o.x += o.dir * R.vel * dt;
          const piso = sueloBajo(D, o.x, o.y + 0.3);
          o.vy -= GRAVEDAD * dt;
          o.y = Math.max(piso, o.y + o.vy * dt);
          if (o.y === piso) o.vy = 0;
          o.g.position.set(o.x, o.y + o.tam / 2, 0);
          o.g.rotation.z -= o.dir * (R.vel / (o.tam / 2)) * dt;
          if ((o.dir > 0 ? o.x > R.hasta : o.x < R.hasta) || o.y < -8) { raiz.remove(o.g); r.activos.splice(r.activos.indexOf(o), 1); }
        }
      }
    },
    reiniciarPiezas() {
      for (const c of caedizas) this.reponerCaediza(c);
      for (const r of rodantes) { for (const o of r.activos) raiz.remove(o.g); r.activos = []; r.t = r.R.desfase ?? 0; }
    },
  };
  return nivel;
}

// Altura del suelo más alto bajo el punto x que quede por debajo de «desde» (para apoyar objetos).
export function sueloBajo(D, x, desde = 30) {
  let y = -9;
  for (const [x0, x1, yy = 0] of D.suelo ?? []) if (x >= x0 && x <= x1 && yy <= desde) y = Math.max(y, yy);
  for (const [x0, x1, alto] of D.tejados ?? []) if (x >= x0 && x <= x1 && alto <= desde) y = Math.max(y, alto);
  for (const [x0, x1, , y1, mat] of D.bloques ?? []) if (x >= x0 && x <= x1 && y1 <= desde && mat !== 'caja' && mat !== 'barril') y = Math.max(y, y1);
  return y;
}

// Escala un modelo normalizado (pie central en el origen, ver normalizarProp) a ese alto, y a ese ancho/fondo.
export function ajustarProp(m, ancho, alto, fondoZ) {
  const t = m.userData.tam;
  const s = alto / t.y;
  m.scale.set(ancho ? ancho / t.x : s, s, fondoZ ? fondoZ / t.z : s);
}

export function normalizarProp(escenaGltf) {
  const g = new THREE.Group();
  g.add(escenaGltf);
  const caja = new THREE.Box3().setFromObject(escenaGltf);
  const centro = caja.getCenter(new THREE.Vector3());
  escenaGltf.position.set(-centro.x, -caja.min.y, -centro.z);
  g.userData.tam = caja.getSize(new THREE.Vector3());
  return g;
}

// Ojo entrecerrado: «aquí puedes esconderte». Se ve solo cerca (lo maneja principal.js).
let texOjo;
function icono(padre, x, y, z) {
  if (!texOjo) {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d');
    g.fillStyle = 'rgba(10,14,40,0.75)';
    g.beginPath(); g.arc(32, 32, 30, 0, 7); g.fill();
    g.strokeStyle = '#cfe0ff'; g.lineWidth = 4; g.lineCap = 'round';
    g.beginPath(); g.moveTo(12, 34); g.quadraticCurveTo(32, 14, 52, 34); g.quadraticCurveTo(32, 50, 12, 34); g.stroke();
    g.fillStyle = '#cfe0ff'; g.beginPath(); g.arc(32, 33, 6, 0, 7); g.fill();
    g.strokeStyle = '#ffd27a'; g.beginPath(); g.moveTo(16, 50); g.lineTo(48, 16); g.stroke();
    texOjo = new THREE.CanvasTexture(c);
    texOjo.colorSpace = THREE.SRGBColorSpace;
  }
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texOjo, transparent: true, depthTest: false, opacity: 0 }));
  s.scale.set(0.55, 0.55, 1);
  s.position.set(x, y, z);
  s.renderOrder = 10;
  padre.add(s);
  return s;
}

function brilloObjeto(color) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo(), color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  s.scale.set(0.9, 0.9, 1);
  return s;
}
