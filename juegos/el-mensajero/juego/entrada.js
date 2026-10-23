// Entrada unificada: teclado, mando y botones táctiles. El juego solo lee `entrada` (estado actual) y los
// «pulsados» de este cuadro (saltar, usar, pausa), que se consumen con tomar().

export const entrada = { x: 0, abajo: false, arriba: false, saltar: false, correr: false, usar: false };
const pulsado = { saltar: false, usar: false, pausa: false };
const teclas = new Set();
const toques = { izq: false, der: false, abajo: false, saltar: false, correr: false, usar: false };
let mandoAntes = {};
export let usaTactil = matchMedia('(pointer: coarse)').matches;

const MAPA = {
  izq: ['ArrowLeft', 'KeyA'], der: ['ArrowRight', 'KeyD'], abajo: ['ArrowDown', 'KeyS'],
  arriba: ['ArrowUp', 'KeyW'], saltar: ['Space', 'ArrowUp', 'KeyW', 'KeyK'], correr: ['ShiftLeft', 'ShiftRight', 'KeyJ'],
  usar: ['KeyE', 'KeyL', 'Enter'], pausa: ['Escape', 'KeyP'],
};
const tiene = (accion) => MAPA[accion].some(k => teclas.has(k));

addEventListener('keydown', (e) => {
  if (e.repeat) return;
  for (const [accion, lista] of Object.entries(MAPA)) {
    if (lista.includes(e.code) && accion in pulsado) pulsado[accion] = true;
  }
  teclas.add(e.code);
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
});
addEventListener('keyup', (e) => teclas.delete(e.code));
addEventListener('blur', () => teclas.clear());

// Botones táctiles: cada elemento con data-boton="izq|der|abajo|saltar|correr|usar|pausa".
// Se sigue cada dedo: deslizar de ◀ a ▶ cambia de botón sin levantar el dedo.
export function conectarTactil(raiz) {
  const dedos = new Map();   // pointerId -> botón
  const recalcular = () => {
    for (const k in toques) toques[k] = false;
    for (const b of dedos.values()) if (b in toques) toques[b] = true;
    raiz.querySelectorAll('[data-boton]').forEach(el => el.classList.toggle('activo', [...dedos.values()].includes(el.dataset.boton)));
  };
  const boton = (x, y) => document.elementFromPoint(x, y)?.closest?.('[data-boton]')?.dataset.boton;
  // Si un dedo se levantó sin que llegara su «pointerup» (se apagó la pantalla, una notificación, el navegador
  // canceló el toque), su botón quedaba apretado para siempre: ◀ pegado anulaba ▶ y las flechas «no respondían».
  const soltarTodo = () => { if (dedos.size) { dedos.clear(); recalcular(); } };
  raiz.addEventListener('pointerdown', (e) => {
    // El dedo «principal» es el primero que toca la pantalla: si llega uno, no hay otros apoyados.
    if (e.isPrimary) soltarTodo();
    const b = boton(e.clientX, e.clientY);
    if (!b) return;
    e.preventDefault();
    usaTactil = true;
    raiz.setPointerCapture?.(e.pointerId);
    dedos.set(e.pointerId, b);
    if (b in pulsado) pulsado[b] = true;
    recalcular();
  });
  raiz.addEventListener('pointermove', (e) => {
    if (!dedos.has(e.pointerId)) return;
    const b = boton(e.clientX, e.clientY);
    const antes = dedos.get(e.pointerId);
    // solo las flechas cambian al deslizar; saltar/usar se quedan en su botón
    if (b && b !== antes && ['izq', 'der', 'abajo'].includes(antes) && ['izq', 'der', 'abajo'].includes(b)) {
      dedos.set(e.pointerId, b);
      recalcular();
    }
  });
  const soltar = (e) => { if (dedos.delete(e.pointerId)) recalcular(); };
  raiz.addEventListener('pointerup', soltar);
  raiz.addEventListener('pointercancel', soltar);
  raiz.addEventListener('lostpointercapture', soltar);
  document.addEventListener('visibilitychange', soltarTodo);
  addEventListener('blur', soltarTodo);
  raiz.addEventListener('contextmenu', (e) => e.preventDefault());
}

// Se llama una vez por cuadro, antes de la lógica.
export function leerEntrada() {
  let x = (tiene('der') ? 1 : 0) - (tiene('izq') ? 1 : 0);
  let abajo = tiene('abajo'), arriba = tiene('arriba'), saltar = tiene('saltar'), correr = tiene('correr'), usar = tiene('usar');
  if (toques.izq || toques.der) x = (toques.der ? 1 : 0) - (toques.izq ? 1 : 0);
  abajo ||= toques.abajo; saltar ||= toques.saltar; correr ||= toques.correr; usar ||= toques.usar;
  for (const m of navigator.getGamepads?.() ?? []) {
    if (!m || !m.connected) continue;
    const b = (i) => !!m.buttons[i]?.pressed;
    const ejeX = Math.abs(m.axes[0] ?? 0) > 0.35 ? Math.sign(m.axes[0]) : 0;
    const ejeY = m.axes[1] ?? 0;
    const mx = (b(15) ? 1 : 0) - (b(14) ? 1 : 0) || ejeX;
    if (mx) x = mx;
    abajo ||= b(13) || ejeY > 0.5;
    arriba ||= b(12) || ejeY < -0.5;
    const ahora = { saltar: b(0), usar: b(2) || b(3), pausa: b(9), correr: b(1) || b(5) || b(7) || b(4) || b(6) };
    for (const k of ['saltar', 'usar', 'pausa']) if (ahora[k] && !mandoAntes[k]) pulsado[k] = true;
    saltar ||= ahora.saltar; usar ||= ahora.usar; correr ||= ahora.correr;
    mandoAntes = ahora;
  }
  Object.assign(entrada, { x, abajo, arriba, saltar, correr, usar });
}

// Pulsar a mano (pruebas automáticas).
export function pulsar(accion) { pulsado[accion] = true; }

// Devuelve si se pulsó (y lo consume).
export function tomar(accion) {
  const v = pulsado[accion];
  pulsado[accion] = false;
  return v;
}

export function limpiarPulsados() {
  for (const k in pulsado) pulsado[k] = false;
}
