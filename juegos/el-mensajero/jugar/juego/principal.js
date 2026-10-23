// El mensajero · Caminos de la fe. Capítulo 1: «La noche de Pedro».
// Une todo: carga, pantallas, bucle del juego, cámara, luces cercanas, eventos del nivel y la escena final.

import * as THREE from 'three';
import { fijarTextos, traducirPagina, t, idioma, cambiarIdioma } from '../comun/idioma.js';
import { sonidoActivo, fijarSonido, sonar as sonarComun, precargar } from '../comun/sonido.js';
import { musica, musicaActiva, fijarMusica } from '../comun/musica.js';
import { TEXTOS } from './textos.js?v=ff246806';
import { entrada, leerEntrada, tomar, conectarTactil, limpiarPulsados, usaTactil, pulsar } from './entrada.js?v=ff246806';
import { crearEscena, fijarCalidad, aplicarAmbiente, moverCapas, renderizador, escena, camara } from './mundo.js?v=ff246806';
import { cargarAnimaciones, cargarModelo, cargarGlb, Personaje } from './personajes.js?v=ff246806';
import { construirNivel, normalizarProp } from './nivel.js?v=ff246806';
import { MISIONES } from './misiones/index.js';
import { Jugador } from './jugador.js?v=ff246806';
import { Guardia } from './guardia.js?v=ff246806';

fijarTextos(TEXTOS);
// Misión actual: ?m=2 (cada misión se abre en su propia carga de página: así no queda nada de la anterior)
const parametros = new URLSearchParams(location.search);
let numMision = Math.min(MISIONES.length, Math.max(1, parseInt(parametros.get('m') || '1', 10) || 1));
const DATOS = MISIONES[numMision - 1];
const CLAVE_AVANCE = 'mini:mensajero:avance';   // cuántas misiones se completaron
const $ = (id) => document.getElementById(id);
const CLAVE_CALIDAD = 'mini:mensajero:calidad';
const leer = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const guardar = (k, v) => { try { localStorage.setItem(k, v); } catch { /* sin almacenamiento */ } };
let calidadAlta = leer(CLAVE_CALIDAD) ? leer(CLAVE_CALIDAD) === 'alta' : !matchMedia('(pointer: coarse)').matches;

// ---------- sonidos propios (los comunes: boton, victoria, premio, fallo)
const SON = { paso: ['paso0', 'paso1', 'paso2', 'paso3', 'paso4'], salto: ['salto'], aterrizar: ['aterrizar'], caja: ['caja'],
  palanca: ['palanca'], reja: ['reja'], alarma: ['alarma'], tocar: ['tocar'], pergamino: ['pergamino'], atrapado: ['atrapado'],
  deslizar: ['deslizar'], cantaro: ['cantaro0', 'cantaro1'], papel: ['papel'] };
// Web Audio: cada sonido se decodifica una vez y se toca sin crear reproductores (los pasos suenan muy seguido).
let audio = null;
const buffers = {};
function iniciarAudio() {
  if (audio) return;
  audio = new (window.AudioContext || window.webkitAudioContext)();
  for (const f of new Set(Object.values(SON).flat())) {
    fetch(`sonidos/${f}.ogg`).then(r => r.arrayBuffer()).then(d => audio.decodeAudioData(d)).then(b => { buffers[f] = b; }).catch(() => {});
  }
}
function sonar(nombre, volumen = 0.6) {
  if (!SON[nombre]) return sonarComun(nombre, volumen);
  if (!sonidoActivo() || !audio) return;
  const lista = SON[nombre];
  const b = buffers[lista[Math.floor(Math.random() * lista.length)]];
  if (!b) return;
  if (audio.state === 'suspended') audio.resume();
  const fuente = audio.createBufferSource();
  fuente.buffer = b;
  fuente.playbackRate.value = 0.94 + Math.random() * 0.12;
  const g = audio.createGain();
  g.gain.value = volumen;
  fuente.connect(g).connect(audio.destination);
  fuente.start();
}
addEventListener('pointerdown', iniciarAudio, { once: true, capture: true });
addEventListener('keydown', iniciarAudio, { once: true, capture: true });

// Voz del narrador (Chatterbox con la voz elegida por Juan; herramientas/narrar.py): voz/<clave>_<idioma>.mp3.
let manifiestoVoz = new Set();
fetch('voz/manifiesto.json').then(r => r.json()).then(l => { manifiestoVoz = new Set(l); }).catch(() => {});
const vozAudio = new Audio();
let colaVoz = [];
function narrar(claves) {
  callarVoz();
  colaVoz = [].concat(claves).filter(Boolean).map(k => `${k}_${idioma()}`).filter(k => manifiestoVoz.has(k));
  siguienteVoz();
}
function siguienteVoz() {
  const k = colaVoz.shift();
  if (!k || !sonidoActivo()) return;
  vozAudio.src = `voz/${k}.mp3`;
  vozAudio.volume = 1;
  vozAudio.onended = () => setTimeout(siguienteVoz, 350);
  vozAudio.play().catch(() => {});
}
function callarVoz() { colaVoz = []; vozAudio.onended = null; vozAudio.pause(); }

// Retrasos en tiempo de juego (se detienen en pausa, a diferencia de setTimeout).
let programados = [];
function programar(segundos, fn) { programados.push({ t: segundos, fn }); }
function correrProgramados(dt) {
  if (!programados.length) return;
  const listos = [];
  for (const p of programados) if ((p.t -= dt) <= 0) listos.push(p);
  programados = programados.filter(p => p.t > 0);
  for (const p of listos) p.fn();
}

// ---------- pantallas
function mostrar(id) {
  for (const p of document.querySelectorAll('.pantalla')) {
    if (p.classList.contains('capa') && p.id !== id) p.classList.remove('activa');
  }
  const capa = $(id).classList.contains('capa');
  document.body.classList.toggle('jugando', id === 'partida');
  if (!capa) for (const p of document.querySelectorAll('.pantalla:not(.capa)')) p.classList.toggle('activa', p.id === id);
  else $(id).classList.add('activa');
}

function pintarBotonesSonido() {
  document.querySelectorAll('[data-musica]').forEach(b => b.classList.toggle('apagado', !musicaActiva()));
  document.querySelectorAll('[data-sonido]').forEach(b => b.classList.toggle('apagado', !sonidoActivo()));
  $('btn-idioma').textContent = idioma() === 'es' ? 'EN' : 'ES';
  $('btn-calidad').textContent = t(calidadAlta ? 'calidadAlta' : 'calidadBaja');
  const ayuda = usaTactil || document.body.classList.contains('tactil-activo') ? t('controlesTactil') : t('controlesTeclado');
  $('ayuda-controles').textContent = ayuda;
  $('ayuda-controles-pausa').textContent = ayuda;
}

// ---------- carga
const recursos = { utileria: {} };
let listo = false;
async function cargarTodo() {
  const principales = ['eliab', 'guardia', ...(DATOS.modelos ?? [])];
  const utileria = ['caja', 'barril', 'palmera1', 'palmera2', 'carreta', 'farol', 'cubeta', 'roca1', 'roca2'];
  const total = 2 + principales.length + utileria.length;
  let hechos = 0;
  const avance = () => { hechos++; $('carga-por').textContent = Math.round((hechos / total) * 100) + ' %'; };
  await Promise.all([
    cargarAnimaciones('modelos/animaciones.glb').then(avance),
    ...principales.map(n => cargarModelo(n, `modelos/${n}.glb`).then(avance)),
    ...utileria.map(n => cargarGlb(`modelos/${n}.glb`).then(g => { if (n.startsWith('palmera')) pintarPalmera(g.scene); recursos.utileria[n] = normalizarProp(g.scene); avance(); })),
  ]);
  avance();
  // los del final, sin esperar
  recursos.finales = Promise.all((DATOS.modelosFinal ?? []).map(n => cargarModelo(n, `modelos/${n}.glb`)));
}

// Palmeras de Pirate Kit: su textura es casi gris (de noche se veía morada). Se pinta por altura: abajo tronco
// café, arriba hojas verdes (el tronco es angosto; las hojas, anchas y en lo alto).
function pintarPalmera(escenaGltf) {
  escenaGltf.updateMatrixWorld(true);
  const caja = new THREE.Box3().setFromObject(escenaGltf);
  const alto = caja.max.y - caja.min.y;
  escenaGltf.traverse(o => {
    if (!o.isMesh) return;
    const g = o.geometry, p = g.attributes.position, n = g.attributes.normal;
    const colores = new Float32Array(p.count * 3), v = new THREE.Vector3();
    const tronco = new THREE.Color(0x8a6440), hoja = new THREE.Color(0x4f8a3a), hojaClara = new THREE.Color(0x76a84c);
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld);
      const k = (v.y - caja.min.y) / alto;
      const r = Math.hypot(v.x - (caja.min.x + caja.max.x) / 2, v.z - (caja.min.z + caja.max.z) / 2);
      const esHoja = k > 0.72 || (k > 0.55 && r > alto * 0.12);
      const c = esHoja ? hoja.clone().lerp(hojaClara, (n ? Math.max(0, n.getY(i)) : 0.5)) : tronco;
      colores.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(colores, 3));
    o.material = new THREE.MeshLambertMaterial({ vertexColors: true });
  });
}

// ---------- estado del juego
let nivel, jugador, eliab, guardia, cazador, huidor, guardias = [];
let persecucionDesde = 99;      // punto de control desde el que se repite la persecución
let fase = 'menu';            // menu | intro | juego | pausa | relato | final
let control = 0;              // punto de control actual
let tiempoJuego = 0, atrapadas = 0, pergaminosTomados = 0;
let pistasVistas = new Set();
let bloqueo = 0;              // s sin control (palanca, atrapado)
let persecucion = 'no';       // no | activa | escapado
let luces = [];
let luzFarol;
const camPos = new THREE.Vector3(), camMira = new THREE.Vector3();
let camSueloY = 0, camAdelante = 0;
let relojAnterior = performance.now();
let tReloj = 0;
let tMundo = 0;        // reloj del juego: solo corre jugando (plataformas, piezas que se mueven)

function crearGuardia() {
  const p = new Personaje('guardia', {
    tinte: (mat, tex) => (/Peasant/i.test(tex) || /Peasant/i.test(mat) ? 0xd2665a : null),
  });
  // casco de bronce, lanza y farol
  const casco = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0xb08a3a, metalness: 0.6, roughness: 0.45 }));
  const cresta = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.09, 0.26), new THREE.MeshLambertMaterial({ color: 0x8a1e16 }));
  cresta.position.y = 0.15;
  casco.add(cresta);
  p.seguir('Head', casco, new THREE.Vector3(0, 0.1, 0));
  const lanza = new THREE.Group();
  const asta = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.3, 6), new THREE.MeshLambertMaterial({ color: 0x5a3a1e }));
  const punta = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.22, 6), new THREE.MeshStandardMaterial({ color: 0xcfcfd6, metalness: 0.7, roughness: 0.3 }));
  punta.position.y = 1.25;
  lanza.add(asta, punta);
  p.seguir('hand_r', lanza, new THREE.Vector3(0, 0.25, 0));
  const farol = recursos.utileria.farol.clone();
  farol.scale.multiplyScalar(0.32 / farol.userData.tam.y);
  p.seguir('hand_l', farol, new THREE.Vector3(0, -0.36, 0));
  p.farol = farol;
  return p;
}

function prepararPartida() {
  const lienzo = $('lienzo');
  if (!renderizador) crearEscena(lienzo, calidadAlta);
  aplicarAmbiente(DATOS.ambiente);
  nivel = construirNivel(escena, recursos, DATOS);
  eliab = new Personaje('eliab');
  escena.add(eliab.raiz);
  jugador = new Jugador(eliab, nivel.mundo);
  Object.assign(jugador, { cajas: nivel.cajas, sombras: nivel.zonas, puertas: nivel.portales, escaleras: nivel.escaleras,
    tirolesas: nivel.tirolesas, rampas: nivel.rampas });
  guardias = [];
  for (const G of DATOS.guardias ?? []) {
    const pg = crearGuardia();
    escena.add(pg.raiz);
    guardias.push(new Guardia(pg, nivel.mundo, { x: G.x, y: G.y ?? 0, ruta: G.ruta, dir: G.dir ?? -1, ajustes: G.ajustes }));
  }
  guardia = guardias[0] ?? null;
  cazador = null;
  if (DATOS.cazador) {
    const pc = crearGuardia();
    escena.add(pc.raiz);
    cazador = new Guardia(pc, nivel.mundo, { x: DATOS.cazador.x, y: DATOS.cazador.y ?? 0, modo: 'cazador', escape: DATOS.cazador.escape, ajustes: DATOS.cazador.ajustes });
    guardias.push(cazador);
  }
  huidor = null;
  if (DATOS.huidor) {
    const H = DATOS.huidor;
    const ph = new Personaje(H.modelo ?? 'creyente', { tinte: () => 0x9a8a7a });
    escena.add(ph.raiz);
    huidor = new Guardia(ph, nivel.mundo, { x: H.x, y: H.y ?? 0, modo: 'huidor', escape: H.escape, dir: 1, ajustes: { velocidadPersigue: H.vel ?? 6.2, saltoObstaculo: 1.6 } });
    guardias.push(huidor);
  }
  for (const g of guardias) {
    const m = document.createElement('div');
    m.className = 'marca';
    m.innerHTML = '<span></span><span class="medidor"><i></i></span>';
    $('marcas').appendChild(m);
    g.marca = m;
  }
  crearLuces();
}

// Pocas luces de verdad, puestas en los faroles más cercanos a la cámara (cada luz cuesta en el teléfono).
function crearLuces() {
  for (const l of luces) escena.remove(l);
  luces = [];
  const n = calidadAlta ? 5 : 3;
  for (let i = 0; i < n; i++) {
    const l = new THREE.PointLight(0xffa04a, 0, 10, 1.5);
    escena.add(l);
    luces.push(l);
  }
  if (!luzFarol) {
    luzFarol = new THREE.PointLight(0xffb866, 5, 7.5, 1.4);
    escena.add(luzFarol);
  }
}

function actualizarLuces() {
  const cx = camMira.x;
  const cerca = nivel.faroles.map(f => [Math.abs(f.x - cx), f]).sort((a, b) => a[0] - b[0]);
  luces.forEach((l, i) => {
    const f = cerca[i]?.[1];
    if (!f) { l.intensity = 0; return; }
    l.position.set(f.x, f.y, f.z + 0.6);
    l.intensity = 7 * (0.92 + Math.sin(tReloj * 11 + f.x) * 0.06);
  });
  // farol del guardia más cercano activo
  const g = guardias.filter(g => g.activo && g.p.farol).sort((a, b) => Math.abs(a.c.x - cx) - Math.abs(b.c.x - cx))[0];
  if (g) {
    g.p.farol.getWorldPosition(luzFarol.position);
    luzFarol.position.z += 0.5;
    luzFarol.intensity = 5;
  } else luzFarol.intensity = 0;
}

// ---------- partida
function empezarPartida() {
  control = 0;
  tiempoJuego = 0; atrapadas = 0; pergaminosTomados = 0;
  pistasVistas = new Set();
  persecucion = 'no';
  nivel.controles.forEach((c, i) => { c.alcanzado = i === 0; c.llama.material.color.set(i === 0 ? 0xffb060 : 0x6a6a7a); });
  nivel.pergaminos.forEach(p => { p.tomado = false; p.g.visible = true; });
  for (const p of nivel.palancas) p.reiniciar();
  for (const k of nivel.cajas) k.reiniciar();
  persecucionDesde = 99;
  reaparecer(false);
  pintarPergaminos();
  fase = 'juego';
  mostrar('partida');
  musica('partida');
}

function reaparecer(conVelo = true) {
  programados = [];
  const [x, y, dir] = DATOS.control[control];
  jugador.colocar(x, y, dir);
  for (const g of guardias) if (g.modo === 'patrulla') g.reiniciar();
  // la persecución se repite si se vuelve al punto de control desde el que empezó; antes de él, se deshace
  if (cazador) {
    if (control < persecucionDesde) { cazador.reiniciar(); if (persecucion === 'activa') persecucion = 'no'; }
    else if (persecucion !== 'escapado') { cazador.reiniciar(); cazador.despertar(DATOS.cazador.x, DATOS.cazador.y ?? 0, 1.4); persecucion = 'activa'; }
  }
  if (huidor && x >= DATOS.huidor.escape) { persecucion = 'escapado'; huidor.activo = false; huidor.p.raiz.visible = false; }
  else if (huidor && persecucion !== 'escapado') {
    huidor.inicial.x = Math.max(DATOS.huidor.x, x + 4);   // el ladrón espera un poco más adelante del punto de control
    huidor.inicial.y = y;
    huidor.reiniciar(); persecucion = 'no';
  }
  for (const k of nivel.cajas) if (x < k.c.x - 3 && Math.abs(k.c.x - (DATOS.cajas.find(c => c.x === k.c.x)?.x ?? k.c.x)) < 0.01) k.reiniciar();
  nivel.reiniciarPiezas();
  for (const c of nivel.cantaros) if (c.x > x) { c.tomado = false; c.g.visible = true; }
  bloqueo = 0;
  eliab.oscurecer(0);
  camSueloY = y; camAdelante = 0;
  colocarCamara(true);
  if (conVelo) { $('velo').classList.add('ver'); setTimeout(() => $('velo').classList.remove('ver'), 380); }
}

function atrapar(textoClave = 'pAtrapado') {
  if (bloqueo > 0) return;
  bloqueo = 1.1;
  jugador.estado = 'atrapado';
  jugador.c.vx = 0;
  if (textoClave === 'pAtrapado') { atrapadas++; eliab.animar('golpe', { una_vez: true, mezcla: 0.05 }); sonar('atrapado', 0.7); }
  aviso(t(textoClave), true);
  programar(0.65, () => $('velo').classList.add('ver'));
  programar(1.05, () => { reaparecer(false); $('velo').classList.remove('ver'); });
}

let tPista = 0, tAviso = 0;
function pista(texto, segundos = 4.5) { $('pista').textContent = texto; $('pista').classList.add('ver'); tPista = segundos; }
function aviso(texto, peligro = false, segundos = 2.2) {
  const a = $('aviso');
  a.textContent = texto; a.classList.toggle('peligro', peligro); a.classList.add('ver'); tAviso = segundos;
}
function pintarPergaminos() { $('hud-pergaminos').textContent = pergaminosTomados ? '📜 ' + pergaminosTomados + '/3' : ''; }

function actualizarJuego(dt) {
  tiempoJuego += dt;
  tMundo += dt;
  correrProgramados(dt);
  if (bloqueo > 0) {
    bloqueo -= dt;
    if (jugador.estado === 'atrapado') { eliab.actualizar(dt); for (const g of guardias) g.p.actualizar(dt); return; }
    if (bloqueo <= 0 && jugador.estado === 'quieto') jugador.estado = 'normal';
  }
  // plataformas que se mueven o se caen (llevan a quien está encima) antes de mover a nadie
  nivel.antes(dt, tMundo, [jugador.c, ...guardias.filter(g => g.activo).map(g => g.c)]);
  for (const c of nivel.caedizas) if (c.sonido) { c.sonido = false; sonar('caja', 0.5); }
  jugador.sinRecarga = persecucion === 'activa';
  jugador.actualizar(dt);
  // ¿lo vio entrar al portal un soldado que ya lo perseguía de cerca?
  if (jugador.entro) {
    for (const g of guardias) {
      if (g.activo && g.estado === 'persigue' && Math.abs(g.c.x - jugador.c.x) < 5) {
        jugador.descubierto = true; jugador.escondido = false; aviso(t('pVioEntrar'), true);
      }
    }
  }
  for (const e of jugador.eventos) {
    if (e === 'puerta') sonar('deslizar', 0.25);
    if (e === 'paso') sonar('paso', 0.22);
    else if (e === 'salto') sonar('salto', 0.35);
    else if (e === 'aterrizar') sonar('aterrizar', 0.3);
    else if (e === 'deslizar') sonar('deslizar', 0.45);
    else if (e === 'trepar') sonar('salto', 0.25);
  }
  if (jugador.empujando && Math.random() < dt * 3) sonar('caja', 0.3);
  eliab.oscurecer(jugador.escondido ? 1 : 0);
  $('escondido').classList.toggle('ver', jugador.escondido);
  nivel.actualizar(dt, tMundo);
  const j = jugador.c;

  // límites y caídas
  if (j.x < DATOS.limites[0]) { j.x = DATOS.limites[0]; j.vx = 0; }
  if (j.y < (DATOS.caidaY ?? -4.5)) return atrapar('pCaida');
  for (const a of nivel.aguas) if (j.x > a.x0 && j.x < a.x1 && j.y < a.y - 0.3) return atrapar('pAgua');
  for (const g of nivel.guillotinas) {
    if (g.golpe && Math.abs(j.x - g.x) < 14) sonar('caja', 0.5 * (1 - Math.abs(j.x - g.x) / 14));
    const borde = g.choque.y0;
    if (g.bajando && Math.abs(j.x - g.x) < 0.18 + j.a / 2 && j.y < borde && j.y + j.h > borde - 0.05) return atrapar('pGuillotina');
  }
  for (const r of nivel.rodantes) {
    for (const o of r.activos) {
      if (Math.abs(o.x - j.x) < o.tam / 2 + 0.22 && j.y < o.y + o.tam * 0.85 && j.y + j.h > o.y + 0.1) return atrapar('pGolpe');
    }
  }

  // guardias
  for (const g of guardias) {
    const ev = g.actualizar(dt, jugador);
    g.p.actualizar(dt);
    if (ev === 'visto') { aviso(t('pVisto'), true); sonar('alarma', 0.35); }
    else if (ev === 'perdido') aviso(t('pPerdio'));
    else if (ev === 'atrapado') atrapar();
    else if (ev === 'rinde') { persecucion = 'escapado'; aviso(t('pEscapaste')); sonar('premio', 0.5); }
    else if (ev === 'huye') { persecucion = 'activa'; aviso(t(DATOS.huidor.aviso ?? 'pLadron'), true); sonar('alarma', 0.35); }
    else if (ev === 'alcanzado') { persecucion = 'escapado'; aviso(t(DATOS.huidor.avisoFin ?? 'pRecuperaste')); sonar('premio', 0.6); }
    else if (ev === 'escapo') atrapar('pSeEscapo');
  }
  // el cazador que se despierta al pasar por un punto (sin palanca)
  if (cazador && typeof DATOS.cazador.despierta === 'number' && persecucion === 'no' && j.x >= DATOS.cazador.despierta) despertarCazador();
  eliab.actualizar(dt);

  // puntos de control
  nivel.controles.forEach((c, i) => {
    if (i > control && j.x >= c.x - 0.3 && Math.abs(j.y - c.y) < 1.6 && jugador.c.enSuelo) {
      control = i;
      c.alcanzado = true;
      c.llama.material.color.set(0xffb060);
      pista(t('pControl'), 1.8);
      sonar('boton', 0.4);
    }
  });
  // pistas
  for (const [x, clave, claveT] of DATOS.pistas) {
    if (!pistasVistas.has(clave) && j.x >= x) {
      pistasVistas.add(clave);
      pista(t(document.body.classList.contains('tactil-activo') && claveT ? claveT : clave));
    }
  }
  // objetivo
  let obj = DATOS.objetivos?.[0]?.[1] ?? 'obj1';
  for (const [x, clave] of DATOS.objetivos ?? []) if (j.x >= x) obj = clave;
  if (persecucion === 'activa') obj = DATOS.objPersecucion ?? 'obj6';
  if (persecucion === 'escapado') obj = DATOS.objEscape ?? 'obj7';
  if ($('objetivo').dataset.clave !== obj) { $('objetivo').dataset.clave = obj; $('objetivo').textContent = t(obj); }

  // palancas: de frente a la palanca (de espaldas a la cámara); el portón sube y, si hay cazador, lo despierta
  const P = nivel.palancas.find(p => !p.abierta && Math.abs(j.x - p.x) < 1.2 && Math.abs(j.y - p.y) < 0.6);
  if (P && j.enSuelo && tomar('usar')) {
    jugador.estado = 'quieto';
    bloqueo = 0.9;
    jugador.c.vx = 0;
    jugador.c.x = P.x - 0.15;
    eliab.mirarAtras();
    eliab.animar('interactuar', { una_vez: true, mezcla: 0.1, velocidad: 1.6, desde: 0.3 });
    programar(0.3, () => { P.mover(); sonar('palanca', 0.6); });
    programar(0.85, () => eliab.mirar(1));
    programar(0.45, () => {
      P.abrir();
      sonar('reja', 0.7);
      if (cazador && P.despierta && DATOS.cazador.despierta !== undefined && typeof DATOS.cazador.despierta !== 'number') {
        aviso(t('pReja'), true, 2.6);
        despertarCazador(1.3);
      }
    });
  }
  tomar('usar');
  // cántaros de agua
  for (const c of nivel.cantaros) {
    if (!c.tomado && Math.abs(j.x - c.x) < 0.7 && j.y < c.y + 0.9 && j.y + j.h > c.y) {
      c.tomado = true; c.g.visible = false;
      jugador.agua = Math.min(1, jugador.agua + 0.6);
      sonar('cantaro', 0.55);   // agua
      sonar('premio', 0.18);
      if (!pistasVistas.has('pCantaro')) { pistasVistas.add('pCantaro'); pista(t('pCantaro'), 4); }
    }
  }
  pintarAgua();
  // pergaminos
  for (const p of nivel.pergaminos) {
    if (!p.tomado && Math.abs(j.x - p.x) < 0.7 && j.y + 1.0 > p.y - 0.9 && j.y < p.y + 0.4) {
      p.tomado = true; p.g.visible = false;
      pergaminosTomados++;
      pintarPergaminos();
      sonar('papel', 0.7);
      sonar('premio', 0.4);   // campanita de hallazgo
      pista(t('pPergamino', { n: pergaminosTomados }), 2.6);
    }
  }
  // meta
  if (j.x >= DATOS.meta.x && j.enSuelo && (!DATOS.meta.y || Math.abs(j.y - DATOS.meta.y) < 1.5) &&
      (!huidor || persecucion === 'escapado')) {
    if (DATOS.meta.final === 'maria') escenaFinal(); else finalSimple();
  }
}

function despertarCazador(demora = 1.3) {
  cazador.despertar(DATOS.cazador.x, DATOS.cazador.y ?? 0, demora);
  persecucion = 'activa';
  persecucionDesde = control;
  programar(0.7, () => sonar('alarma', 0.45));
}

// Barra de agua (correr rápido): se ve al gastarla o al llenarla y se esconde llena.
let aguaVista = 1;
function pintarAgua() {
  const a = jugador.agua;
  const el = $('agua');
  el.querySelector('i').style.width = Math.round(a * 100) + '%';
  el.classList.toggle('ver', a < 0.995 || persecucion === 'activa');
  el.classList.toggle('poca', a < 0.2);
  aguaVista = a;
}

// ---------- cámara: sigue con suavidad, adelanta hacia donde mira y no salta con cada salto
function colocarCamara(instante = false, dt = 1 / 60) {
  const j = jugador.c;
  if (j.enSuelo || ['trepando', 'escalando', 'tirolesa'].includes(jugador.estado)) camSueloY = j.y;
  else if (j.y < camSueloY - 0.5) camSueloY = j.y + 0.5;      // cae: bajar con él
  else if (j.y > camSueloY + 3) camSueloY = j.y - 3;          // sube mucho (no debería): seguir
  const vertical = innerWidth / innerHeight < 1;
  camAdelante += ((jugador.p.mirando * (vertical ? 1.2 : 2.2)) - camAdelante) * Math.min(1, dt * 1.6);
  const objetivoX = j.x + camAdelante, objetivoY = camSueloY + 1.5;
  const k = instante ? 1 : Math.min(1, dt * 4.5), ky = instante ? 1 : Math.min(1, dt * 3);
  camMira.x += (objetivoX - camMira.x) * k;
  camMira.y += (objetivoY - camMira.y) * ky;
  camMira.z = 0;
  const dist = vertical ? 14 : 13;
  camPos.set(camMira.x, camMira.y + 2.1, dist);
  camara.position.copy(camPos);
  camara.lookAt(camMira.x, camMira.y + 0.7, 0);
}

// Aviso de lo que se puede hacer aquí (sobre la cabeza de Eliab) e íconos de escondite cercanos.
function pintarAyudas() {
  const el = $('accion');
  const tactil = document.body.classList.contains('tactil-activo');
  const u = tactil ? '✋' : 'E', d = tactil ? '▼' : '↓';
  let clave = { puerta: 'aPuerta', dentro: 'aSalir', caja: 'aCaja', cobertura: 'aCobertura', escalera: 'aEscalera',
    dentro_escalera: 'aEnEscalera', tirolesa: 'aTirolesa' }[jugador.cerca] ?? null;
  if (!clave && nivel.palancas.some(p => !p.abierta && Math.abs(jugador.c.x - p.x) < 1.2 && Math.abs(jugador.c.y - p.y) < 0.6)) clave = 'aPalanca';
  if (jugador.empujando || jugador.jalando) clave = null;
  el.classList.toggle('ver', !!clave && fase === 'juego');
  if (clave) {
    el.textContent = t(clave, { u, d });
    const v = new THREE.Vector3(jugador.c.x, jugador.c.y + 2.15, jugador.z).project(camara);
    el.style.left = ((v.x + 1) / 2) * innerWidth + 'px';
    el.style.top = ((1 - v.y) / 2) * innerHeight + 'px';
  }
  for (const i of nivel.iconos) {
    const cerca = Math.abs(i.position.x - jugador.c.x) < 7 && !jugador.escondido;
    i.material.opacity += ((cerca ? 0.85 + Math.sin(tReloj * 4) * 0.1 : 0) - i.material.opacity) * 0.15;
  }
}

function pintarMarcas() {
  for (const g of guardias) {
    const m = g.marca;
    const ver = g.activo && (g.sospecha > 0.05 || ['persigue', 'busca', 'alerta'].includes(g.estado)) && fase === 'juego';
    m.style.display = ver ? 'block' : 'none';
    if (!ver) continue;
    const v = new THREE.Vector3(g.c.x, g.c.y + 2.25, 0).project(camara);
    m.style.left = ((v.x + 1) / 2) * innerWidth + 'px';
    m.style.top = ((1 - v.y) / 2) * innerHeight + 'px';
    const alerta = ['persigue', 'alerta'].includes(g.estado);
    m.classList.toggle('alerta', alerta);
    m.firstChild.textContent = alerta ? '!' : '?';
    m.querySelector('.medidor').style.display = alerta || g.estado === 'busca' ? 'none' : 'block';
    m.querySelector('i').style.width = Math.round(g.sospecha * 100) + '%';
  }
}

// ---------- bucle
function cuadro(ahora) {
  requestAnimationFrame(cuadro);
  let dt = Math.min(0.05, (ahora - relojAnterior) / 1000);
  relojAnterior = ahora;
  if (!nivel) return;
  tReloj += dt;
  leerEntrada();
  if (fase === 'juego' && !congelado) {
    if (tomar('pausa')) { pausar(); return; }
    // pasos de física cortos: saltos y choques iguales a 30 o a 120 cuadros por segundo
    const pasos = Math.ceil(dt / (1 / 90));
    for (let i = 0; i < pasos && fase === 'juego'; i++) actualizarJuego(dt / pasos);
    colocarCamara(false, dt);
  } else if (fase === 'relato') {
    actualizarRelato(dt);
  } else if (fase === 'pausa') {
    if (tomar('pausa')) seguir();
  }
  if (tPista > 0 && (tPista -= dt) <= 0) $('pista').classList.remove('ver');
  if (tAviso > 0 && (tAviso -= dt) <= 0) $('aviso').classList.remove('ver');
  if (fase !== 'pausa') {
    actualizarLuces();
    moverCapas();
    pintarMarcas();
    if (fase === 'juego') pintarAyudas(); else $('accion').classList.remove('ver');
    renderizador.render(escena, camara);
  }
}

function pausar() {
  if (fase !== 'juego') return;
  fase = 'pausa';
  pintarBotonesSonido();
  mostrar('pausa');
}
function seguir() {
  fase = 'juego';
  document.body.classList.add('jugando');
  $('pausa').classList.remove('activa');
  limpiarPulsados();
  relojAnterior = performance.now();
}

// ---------- escena final (Hechos 12:12-17)
const actores = {};
const grupoFinal = [];   // los que esperan a Eliab al final (finalSimple)
let relato = null;
async function escenaFinal() {
  fase = 'relato';
  document.body.classList.add('en-relato');
  $('pista').classList.remove('ver');
  musica('menu');
  await recursos.finales;
  const puertaX = DATOS.puertaX ?? 193;   // centro de la puerta de María (m01.js)
  for (const [n, x, dir] of [['maria', puertaX, -1], ['pedro', puertaX - 6, 1], ['creyente', puertaX + 0.5, -1]]) {
    if (!actores[n]) { actores[n] = new Personaje(n); escena.add(actores[n].raiz); }
    const a = actores[n];
    a.raiz.position.set(x, 0, -2.3);
    a.raiz.visible = false;
    a.mirar(dir);
    a.animar('quieto', { mezcla: 0 });
  }
  relato = { t: 0, camX: puertaX - 0.8, camY: 1.3, dist: 7.2, pasos: [], puerta: 0 };
  // tocar: de frente a la puerta (de espaldas a la cámara), dos golpes
  const tocar = async (p) => {
    p.mirarAtras();
    await esperar(350);
    for (let i = 0; i < 2; i++) {
      p.animar('interactuar', { una_vez: true, velocidad: 1.8, desde: 0.35, mezcla: 0.1 });
      await esperar(300); sonar('tocar', 0.7); await esperar(260); sonar('tocar', 0.7); await esperar(650);
    }
    p.animar('quieto');
  };
  // Eliab llega, toca y se hace a un lado; se abre la puerta y sale María
  await caminar(eliab, jugador.c.x, puertaX - 0.2, 0, -0.6);
  await tocar(eliab);
  eliab.mirar(-1);
  await caminar(eliab, puertaX - 0.2, puertaX - 1.3, -0.6);
  eliab.mirar(1);
  relato.puerta = 1;
  await esperar(500);
  const maria = actores.maria;
  maria.raiz.visible = true;
  await caminar(maria, puertaX + 0.15, puertaX + 0.15, -2.3, -0.9);
  maria.mirar(-1);
  eliab.animar('hablar');
  await tarjeta(t('fin1Quien'), t('fin1'), t('finFiccion'));
  eliab.animar('quieto');
  maria.animar('si', { una_vez: true });
  await tarjeta(t('fin2Quien'), t('fin2'), t('finFiccion'));
  // entran y se cierra la puerta; pasa el tiempo
  maria.mirarAtras(); eliab.mirar(1);
  await caminar(eliab, eliab.raiz.position.x, puertaX - 0.2, -0.6);
  await Promise.all([caminar(maria, maria.raiz.position.x, puertaX + 0.2, -0.9, -2.4), caminar(eliab, puertaX - 0.2, puertaX, -0.6, -2.3)]);
  eliab.raiz.visible = false; maria.raiz.visible = false;
  relato.puerta = 0;
  await esperar(500);
  $('velo').classList.add('ver');
  await esperar(500);
  // Hechos 12:6-10, pintado (arte/codex/escenas): se ve detrás de la tarjeta
  const ilus = $('ilustracion');
  await ilustracion('escena_pedro_liberado');
  ilus.classList.add('ver');
  await tarjeta('', t('finMasTarde'), '', true, 'finMasTarde');
  ilus.classList.remove('ver');
  await esperar(500);
  $('velo').classList.remove('ver');
  // Pedro llega y llama; Rode reconoce su voz pero no abre (12:14)
  const pedro = actores.pedro;
  pedro.raiz.visible = true;
  relato.camX = puertaX - 1.4;
  await caminar(pedro, puertaX - 6, puertaX - 0.2, -0.75);
  await tocar(pedro);
  await tarjeta('', t('finCita1'), t('finRef1'), true, 'finCita1');
  await tocar(pedro);
  // abren y lo ven: asombrados (12:16); Pedro les hace señas y les cuenta (12:17)
  pedro.mirar(-1);
  await caminar(pedro, puertaX - 0.2, puertaX - 1.4, -0.75);
  pedro.mirar(1);
  relato.puerta = 1;
  await esperar(450);
  for (const [a, x] of [[actores.maria, puertaX - 0.2], [actores.creyente, puertaX + 0.5], [eliab, puertaX + 1.2]]) {
    a.raiz.visible = true;
    a.raiz.position.set(puertaX, 0, -2.3);
    a.animar('quieto', { mezcla: 0 });
    caminar(a, puertaX, x, -2.3, -0.6).then(() => { a.mirar(-1); a.animar('brazos'); });
    await esperar(350);
  }
  await esperar(900);
  pedro.mirar(1);   // les habla a ellos, no a la cámara
  pedro.animar('hablar');
  await tarjeta('', t('finCita2'), t('finRef2'), true, 'finCita2');
  // «y salió y se fue a otro lugar»
  pedro.mirar(-1);
  await caminar(pedro, pedro.raiz.position.x, puertaX - 6.5, -0.75);
  await fundirPersonaje(pedro);
  terminar();
}

function fundirPersonaje(p) {
  return new Promise(ok => {
    let k = 0;
    const paso = setInterval(() => {
      k = Math.min(1, k + 0.08);
      p.raiz.traverse(o => { if (o.material) { o.material.transparent = true; o.material.opacity = 1 - k; } });
      if (k >= 1) { clearInterval(paso); p.raiz.visible = false; p.raiz.traverse(o => { if (o.material) o.material.opacity = 1; }); ok(); }
    }, 40);
  });
}

function caminar(p, desde, hasta, z, zFin = z) {
  return new Promise(ok => {
    if (Math.abs(hasta - desde) > 0.05) p.mirar(Math.sign(hasta - desde));
    p.animar('caminar');
    relato.pasos.push({ p, x: desde, hasta, z, zFin, z0: z, d0: Math.abs(hasta - desde) + Math.abs(zFin - z), ok, vel: 1.6 });
  });
}
function esperar(ms) { return new Promise(ok => setTimeout(ok, ms)); }

function tarjeta(quien, texto, ref, cita = false, voz = null) {
  return new Promise(ok => {
    narrar(voz);
    $('d-quien').textContent = quien;
    $('d-texto').textContent = texto;
    $('d-ref').textContent = ref;
    $('dialogo').classList.toggle('cita', cita);
    mostrar('relato');
    const b = $('btn-siguiente');
    const listo = () => { callarVoz(); b.removeEventListener('click', listo); clearInterval(tecla); $('relato').classList.remove('activa'); sonar('boton', 0.4); ok(); };
    b.addEventListener('click', listo);
    limpiarPulsados();
    const tecla = setInterval(() => { leerEntrada(); if (tomar('saltar') || tomar('usar')) listo(); }, 50);
    b.focus({ preventScroll: true });
  });
}

function actualizarRelato(dt) {
  for (const s of [...relato.pasos]) {
    // avanza en x y en profundidad a la vez (salir o entrar por la puerta)
    const dx = s.hasta - s.x, dz = s.zFin - s.z, d = Math.hypot(dx, dz);
    const paso = Math.min(d, s.vel * dt);
    if (d > 0) { s.x += (dx / d) * paso; s.z += (dz / d) * paso; }
    s.p.raiz.position.set(s.x, s.p.raiz.position.y, s.z);
    if (d - paso < 0.01) { s.p.animar('quieto'); relato.pasos.splice(relato.pasos.indexOf(s), 1); s.ok(); }
  }
  const puerta = DATOS.puertaMaria;
  if (puerta) puerta.rotation.y += (relato.puerta * 1.45 - puerta.rotation.y) * Math.min(1, dt * 3);
  for (const a of [eliab, ...Object.values(actores), ...grupoFinal]) a.actualizar(dt);
  for (const g of guardias) g.p.actualizar(dt);
  const k = Math.min(1, dt * 2);
  camMira.x += (relato.camX - camMira.x) * k;
  camMira.y += (relato.camY - camMira.y) * k;
  camara.position.set(camMira.x, camMira.y + 0.7, relato.dist);
  camara.lookAt(camMira.x, camMira.y, -0.5);
}

// Final de las misiones (menos la 1, que tiene su escena en la casa de María): Eliab llega, quien lo espera
// (si hay) habla, y las tarjetas del final, narradas.
async function finalSimple() {
  fase = 'relato';
  document.body.classList.add('en-relato');
  $('pista').classList.remove('ver');
  musica('menu');
  const F = DATOS.final;
  relato = { t: 0, camX: jugador.c.x + 0.8, camY: jugador.c.y + 1.3, dist: 8, pasos: [], puerta: 0 };
  jugador.c.vx = 0;
  eliab.animar('quieto');
  if (F.actor) {
    await recursos.finales;
    const a = actores[F.actor.modelo] ??= new Personaje(F.actor.modelo);
    escena.add(a.raiz);
    a.raiz.visible = true;
    a.raiz.position.set(jugador.c.x + 1.6, jugador.c.y, -0.5);
    a.mirar(-1);
    a.animar('hablar');
    eliab.mirar(1);
  }
  // grupo que lo recibe, quieto (m05: la iglesia de Antioquía): [{ modelo, dx, z, tinte }] desde donde llega Eliab
  for (const p of grupoFinal) escena.remove(p.raiz);
  grupoFinal.length = 0;
  if (F.grupo) {
    await recursos.finales;
    for (const G of F.grupo) {
      const p = new Personaje(G.modelo, G.tinte ? { tinte: () => G.tinte } : {});
      escena.add(p.raiz);
      p.raiz.position.set(jugador.c.x + G.dx, jugador.c.y, G.z ?? -0.8);
      p.mirar(-1);
      p.animar('quieto', { mezcla: 0 });
      grupoFinal.push(p);
    }
    eliab.mirar(1);
    relato.camX = jugador.c.x + 2.2;
    relato.dist = 9;
  }
  // ilustración pintada del final (arte/fondos/escena_mNN_final.webp): detrás de las tarjetas del narrador
  const ilus = $('ilustracion');
  const hayIlus = await ilustracion(`escena_${DATOS.id}_final`);
  for (const c of F.tarjetas) {
    ilus.classList.toggle('ver', hayIlus && !c.quien);
    await tarjeta(c.quien ? t(c.quien) : '', t(c.texto), c.ref ? t(c.ref) : c.ficcion ? t('finFiccion') : '', !!c.ref || !c.quien, c.quien ? null : c.texto);
  }
  ilus.classList.remove('ver');
  terminar();
}

// Carga una ilustración de arte/fondos/<nombre>.webp en el elemento #ilustracion; false si no existe.
function ilustracion(nombre, el = $('ilustracion')) {
  return new Promise(ok => {
    const img = new Image();
    img.onload = () => { el.style.backgroundImage = `url(${img.src})`; ok(true); };
    img.onerror = () => ok(false);
    img.src = `arte/fondos/${nombre}.webp`;
  });
}

function terminar() {
  fase = 'final';
  try { localStorage.setItem(CLAVE_AVANCE, String(Math.max(avance(), numMision))); } catch { /* sin almacenamiento */ }
  $('btn-siguiente-mision').hidden = numMision >= MISIONES.length;
  document.body.classList.remove('en-relato');
  const m = Math.floor(tiempoJuego / 60), s = Math.floor(tiempoJuego % 60);
  $('f-tiempo').textContent = t('tiempo', { t: `${m}:${String(s).padStart(2, '0')}` });
  $('f-pergaminos').textContent = t('pergaminos', { n: pergaminosTomados });
  $('f-atrapado').textContent = t('vecesAtrapado', { n: atrapadas });
  const notas = $('f-notas');
  notas.innerHTML = '';
  nivel.pergaminos.forEach((p, i) => {
    if (!p.tomado) return;
    const e = document.createElement('p');
    const b = document.createElement('b');
    const pre = DATOS.prefijoPergaminos ?? 'perg';
    b.textContent = t(`${pre}${i + 1}t`) + ': ';
    e.append(b, t(`${pre}${i + 1}`));
    notas.appendChild(e);
  });
  sonar('victoria', 0.6);
  musica('final', false);
  mostrar('final');
}

// ---------- botones
function avance() { try { return parseInt(localStorage.getItem(CLAVE_AVANCE) || '0', 10) || 0; } catch { return 0; } }
function irAMision(n) { location.href = `?m=${n}&jugar=1`; }

// Introducción de la misión: tarjeta armada con sus textos (y narrada).
function mostrarIntro() {
  const caja = $('intro-textos');
  caja.innerHTML = '';
  const narradas = [];
  (DATOS.intro ?? []).forEach((e, i) => {
    if (Array.isArray(e)) {
      const q = document.createElement('blockquote');
      const span = document.createElement('span'); span.textContent = t(e[0]);
      const cite = document.createElement('cite'); cite.textContent = t(e[1]);
      q.append(span, cite); caja.appendChild(q); narradas.push(e[0]);
    } else {
      const p = document.createElement('p'); p.textContent = t(e);
      if (i === 0) p.className = 'lugar';
      caja.appendChild(p); narradas.push(e);
    }
  });
  if (DATOS.ficcion) { const f = document.createElement('p'); f.className = 'ficcion'; f.textContent = t(DATOS.ficcion); caja.appendChild(f); }
  $('intro-mision').textContent = t('misionN', { n: numMision, total: MISIONES.length }) + ' · ' + t(DATOS.titulo);
  fase = 'intro';
  mostrar('intro');
  // ilustración de la introducción (arte/fondos/escena_mNN_intro.webp), oscurecida para leer encima
  ilustracion(`escena_${DATOS.id}_intro`, $('intro')).then(hay => $('intro').classList.toggle('con-ilustracion', hay));
  narrar(narradas);
}

function pintarMisiones() {
  const lista = $('lista-misiones');
  lista.innerHTML = '';
  const hecho = avance();
  MISIONES.forEach((M, i) => {
    const n = i + 1;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'mision' + (n <= hecho ? ' hecha' : '');
    const abierta = n <= hecho + 1;
    b.disabled = !abierta;
    b.innerHTML = `<b>${n}</b><span></span><small></small>`;
    b.querySelector('span').textContent = abierta ? t(M.titulo) : '🔒';
    b.querySelector('small').textContent = abierta ? t(M.lugar) : '';
    b.addEventListener('click', () => { sonar('boton', 0.5); if (n === numMision) { if (!nivel) prepararPartida(); mostrarIntro(); } else irAMision(n); });
    lista.appendChild(b);
  });
}

$('btn-jugar').addEventListener('click', () => {
  if (!listo) return;
  sonar('boton', 0.5);
  precargar();
  const siguiente = Math.min(MISIONES.length, avance() + 1);
  if (!parametros.has('m') && siguiente !== numMision) return irAMision(siguiente);
  if (!nivel) prepararPartida();
  mostrarIntro();
});
$('btn-misiones').addEventListener('click', () => { sonar('boton', 0.5); pintarMisiones(); mostrar('misiones'); });
$('btn-misiones-volver').addEventListener('click', () => mostrar('inicio'));
$('btn-siguiente-mision').addEventListener('click', () => irAMision(numMision + 1));
$('btn-empezar').addEventListener('click', () => { callarVoz(); sonar('boton', 0.5); reiniciarEscenaFinal(); empezarPartida(); });
$('btn-pausa').addEventListener('click', pausar);
$('btn-seguir').addEventListener('click', seguir);
$('btn-control').addEventListener('click', () => { seguir(); reaparecer(); });
$('btn-reiniciar').addEventListener('click', () => { seguir(); empezarPartida(); });
$('btn-salir').addEventListener('click', () => { fase = 'menu'; $('pausa').classList.remove('activa'); mostrar('inicio'); musica('menu'); });
$('btn-otra').addEventListener('click', () => { reiniciarEscenaFinal(); empezarPartida(); });
$('btn-calidad').addEventListener('click', () => {
  calidadAlta = !calidadAlta;
  guardar(CLAVE_CALIDAD, calidadAlta ? 'alta' : 'baja');
  fijarCalidad(calidadAlta);
  crearLuces();
  pintarBotonesSonido();
});
$('btn-idioma').addEventListener('click', () => {
  cambiarIdioma(idioma() === 'es' ? 'en' : 'es');
  traducirPagina();
  pintarBotonesSonido();
});
document.querySelectorAll('[data-musica]').forEach(b => b.addEventListener('click', () => { fijarMusica(!musicaActiva()); pintarBotonesSonido(); }));
document.querySelectorAll('[data-sonido]').forEach(b => b.addEventListener('click', () => { fijarSonido(!sonidoActivo()); pintarBotonesSonido(); }));
document.addEventListener('visibilitychange', () => { if (document.hidden) pausar(); });

function reiniciarEscenaFinal() {
  document.body.classList.remove('en-relato');
  if (DATOS.puertaMaria) DATOS.puertaMaria.rotation.y = 0;
  if (eliab) eliab.raiz.visible = true;
  for (const a of [...Object.values(actores), ...grupoFinal]) a.raiz.visible = false;
}

// pantalla táctil: los botones aparecen con el primer toque (y desde el inicio en teléfonos)
conectarTactil($('tactil'));
if (usaTactil) document.body.classList.add('tactil-activo');
addEventListener('touchstart', () => { document.body.classList.add('tactil-activo'); pintarBotonesSonido(); }, { once: true, passive: true });

// ---------- arranque
traducirPagina();
pintarBotonesSonido();
musica('menu');
$('btn-jugar').disabled = true;
cargarTodo().then(() => {
  listo = true;
  $('btn-jugar').disabled = false;
  $('carga').style.visibility = 'hidden';
  requestAnimationFrame(cuadro);
  // ?m=N&jugar=1 (viene de «Siguiente misión» o de la lista): directo a la introducción
  if (parametros.get('jugar') === '1' && !parametros.has('x')) { prepararPartida(); mostrarIntro(); }
}).catch((e) => {
  console.error(e);
  $('error').textContent = t('errorCarga');
  $('error').hidden = false;
});
// modo de prueba: ?x=120 empieza en ese punto (para revisar un tramo sin recorrer todo)
const prueba = new URLSearchParams(location.search);
if (prueba.has('x')) {
  const x = +prueba.get('x');
  const esperarListo = setInterval(() => {
    if (!listo) return;
    clearInterval(esperarListo);
    if (!nivel) prepararPartida();
    empezarPartida();
    const i = DATOS.control.findLastIndex(c => c[0] <= x);
    control = Math.max(0, i);
    reaparecer(false);
  }, 100);
}
// Pruebas automáticas: simular(segundos, {x, saltar, correr, abajo, usar}) avanza el juego a 60 pasos por segundo
// sin dibujar, como si alguien mantuviera esas teclas. Devuelve dónde quedó Eliab.
let antesSim = {}, congelado = false;
function simular(segundos, teclas = {}) {
  const n = Math.round(segundos * 60);
  for (let i = 0; i < n && fase === 'juego'; i++) {
    leerEntrada();
    Object.assign(entrada, { x: 0, saltar: false, correr: false, abajo: false, usar: false }, teclas);
    for (const k of ['saltar', 'usar']) if (teclas[k] && !antesSim[k]) pulsar(k);
    antesSim = { ...teclas };
    actualizarJuego(1 / 60);
    colocarCamara(false, 1 / 60);
  }
  const j = jugador.c;
  return { x: +j.x.toFixed(2), y: +j.y.toFixed(2), fase, control, atrapadas, persecucion, pergaminos: pergaminosTomados,
    estado: jugador.estado, guardia: guardia?.estado, cazador: cazador?.estado, huidor: huidor?.estado, agua: +jugador.agua.toFixed(2) };
}
window.__mensajero = { get jugador() { return jugador; }, get nivel() { return nivel; }, get guardias() { return guardias; }, DATOS, simular,
  empezar() { if (!nivel) prepararPartida(); empezarPartida(); congelado = true; return 1; },
  ir(i) { control = i; reaparecer(false); return 1; },
  final() { finalSimple(); return 1; } };   // pruebas: ver el final sin jugar la misión
