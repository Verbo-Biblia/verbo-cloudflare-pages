// Disposición FIJA de la mesa: dónde va cada cosa. Es la única fuente de medidas: la usan el tablero (cartas,
// mazos, mano), la muralla, las torres, los edificios, el tapete y la plantilla para pintar tapetes nuevos.
// Coordenadas de la mesa en unidades three.js: x a la derecha, z hacia el jugador (abajo en la pantalla).
// Índice 0 = jugador (abajo), 1 = rival (arriba).

export const MESA = { ancho: 22, fondo: 18 };

export const CARTA = { ancho: 1.3, alto: 1.82 };

export const Z = {
  frente: [1.25, -1.5],
  muralla: [2.85, -3.05],
  aldea: [4.45, -4.65],
  mano: [6.75, -7.3],
};

export const MURALLA = { x0: -4.5, paso: 1, ancho: 0.95, fondo: 0.84, carril: [-5.2, 5.2] };
export const FORTALEZA = { x: 5.5, z: Z.muralla }; // dos torres por jugador, en x = ±5.5
export const MAZO = { x: 8.7 };

// Casilleros de cartas por zona (centro x de la carta número i de n).
export const CASILLERO = {
  frente: (i, n) => (i - (n - 1) / 2) * 1.45,
  aldea: i => -5.0 + i * 1.4,
  estructuras: i => 3.45 + i * 1.45,
  efectos: i => 4.75 + i * 0.95,
};

// Zonas del tapete (rectángulos en la mesa) con su término para el rótulo y su tinte.
export function zonas(j) {
  const fz = Z.frente[j], az = Z.aldea[j];
  return [
    { clave: 'frente', x0: -3.75, z0: fz - 1.1, x1: 3.75, z1: fz + 1.1, tinte: 'rgba(70,24,16,0.32)', guia: '#c0392b' },
    { clave: 'efectos', x0: 4.05, z0: fz - 1.1, x1: 8.25, z1: fz + 1.1, tinte: 'rgba(24,46,78,0.34)', guia: '#2f6fb0' },
    { clave: 'aldea', x0: -6.55, z0: az - 1.1, x1: 2.55, z1: az + 1.1, tinte: 'rgba(38,58,28,0.30)', guia: '#3f8f3a' },
    { clave: 'estructuras', x0: 2.75, z0: az - 1.1, x1: 7.05, z1: az + 1.1, tinte: 'rgba(60,58,54,0.30)', guia: '#7d7d7d' },
  ];
}

// Pasa de la mesa a píxeles de una imagen de ancho `px` (la altura sale de la proporción de la mesa).
export const altoPx = px => Math.round(px * MESA.fondo / MESA.ancho);
export const aPx = (x, z, px) => [((x + MESA.ancho / 2) / MESA.ancho) * px, ((z + MESA.fondo / 2) / MESA.fondo) * altoPx(px)];

// Plantilla tipo atlas UV para pintar un tapete nuevo. modo 'plantilla': fondo gris con todo rotulado y medido;
// modo 'guia': solo contornos sobre transparente, para poner como capa encima del dibujo.
export function dibujarPlantilla(ctx, px = 2048, modo = 'plantilla') {
  const H = altoPx(px), k = px / 1024;
  const rect = (x0, z0, x1, z1) => { const [a, b] = aPx(x0, z0, px), [c, d] = aPx(x1, z1, px); return [a, b, c - a, d - b]; };
  const guia = modo === 'guia';
  ctx.clearRect(0, 0, px, H);
  if (!guia) {
    ctx.fillStyle = '#3a3a3a'; ctx.fillRect(0, 0, px, H);
    // Margen: queda bajo el marco de madera y la cenefa.
    ctx.fillStyle = '#2a2a2a'; ctx.fillRect(0, 0, px, 40 * k); ctx.fillRect(0, H - 40 * k, px, 40 * k);
    ctx.fillRect(0, 0, 40 * k, H); ctx.fillRect(px - 40 * k, 0, 40 * k, H);
  }
  const texto = (t, x, y, tam, color = '#fff', alin = 'left') => {
    ctx.font = `bold ${tam * k}px sans-serif`; ctx.textAlign = alin; ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillText(t, x + 1.5 * k, y + 1.5 * k);
    ctx.fillStyle = color; ctx.fillText(t, x, y);
  };
  const marco = (r, color, relleno) => {
    if (relleno && !guia) { ctx.fillStyle = relleno; ctx.fillRect(...r); }
    ctx.strokeStyle = color; ctx.lineWidth = 3 * k; ctx.strokeRect(...r);
  };
  for (const j of [0, 1]) {
    const lado = j === 0 ? 'JUGADOR' : 'RIVAL';
    for (const z of zonas(j)) {
      const r = rect(z.x0, z.z0, z.x1, z.z1);
      marco(r, z.guia, z.guia + '55');
      // Arriba a la izquierda, el juego escribe el rótulo de la zona (término de la temática): no pintar texto ahí.
      if (!guia) {
        ctx.setLineDash([4 * k, 3 * k]); ctx.strokeStyle = '#ffe08a'; ctx.lineWidth = 1.5 * k;
        ctx.strokeRect(r[0] + 20 * k, r[1] + 9 * k, 170 * k, 24 * k); ctx.setLineDash([]);
        texto('rótulo del juego', r[0] + 26 * k, r[1] + 14 * k, 11, '#ffe08a');
      }
      texto(`${z.clave.toUpperCase()} · ${lado}`, r[0] + 10 * k, r[1] + r[3] - 26 * k, 14, '#fff');
    }
    // Casilleros de cartas (cartas acostadas sobre la mesa).
    const casillas = [
      ...Array.from({ length: 5 }, (_, i) => [CASILLERO.frente(i, 5), Z.frente[j]]),
      ...Array.from({ length: 6 }, (_, i) => [CASILLERO.aldea(i), Z.aldea[j]]),
      ...Array.from({ length: 3 }, (_, i) => [CASILLERO.estructuras(i), Z.aldea[j]]),
      ...Array.from({ length: 4 }, (_, i) => [CASILLERO.efectos(i), Z.frente[j]]),
    ];
    ctx.setLineDash([6 * k, 5 * k]);
    for (const [x, z] of casillas) {
      ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1.5 * k;
      ctx.strokeRect(...rect(x - CARTA.ancho / 2, z - CARTA.alto / 2, x + CARTA.ancho / 2, z + CARTA.alto / 2));
    }
    ctx.setLineDash([]);
    // Carril de la muralla y sus 10 tramos.
    const mz = Z.muralla[j];
    marco(rect(MURALLA.carril[0], mz - 0.42, MURALLA.carril[1], mz + 0.42), '#c9a33b', '#c9a33b33');
    for (let i = 0; i < 10; i++) {
      const x = MURALLA.x0 + i * MURALLA.paso;
      ctx.strokeStyle = 'rgba(201,163,59,0.8)'; ctx.lineWidth = 1 * k;
      ctx.strokeRect(...rect(x - MURALLA.ancho / 2, mz - 0.3, x + MURALLA.ancho / 2, mz + 0.3));
    }
    if (!guia) texto(`MURALLA · ${lado} (los bloques 3D van encima)`, aPx(-4.9, mz - 0.38, px)[0], aPx(0, mz - 0.38, px)[1], 11, '#ffe08a');
    // Torres de la fortaleza (círculo = base de la torre 3D).
    for (const x of [-FORTALEZA.x, FORTALEZA.x]) {
      const [cx, cy] = aPx(x, FORTALEZA.z[j], px), r = (0.55 / MESA.ancho) * px;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
      if (!guia) { ctx.fillStyle = '#c9a33b66'; ctx.fill(); }
      ctx.strokeStyle = '#c9a33b'; ctx.lineWidth = 3 * k; ctx.stroke();
      if (!guia) texto('TORRE', cx, cy - 7 * k, 11, '#fff', 'center');
    }
    // Mazo.
    marco(rect(MAZO.x - CARTA.ancho / 2, Z.aldea[j] - CARTA.alto / 2, MAZO.x + CARTA.ancho / 2, Z.aldea[j] + CARTA.alto / 2), '#b07cff', '#b07cff44');
    if (!guia) texto('MAZO', aPx(MAZO.x, 0, px)[0], aPx(0, Z.aldea[j] - 0.2, px)[1], 12, '#fff', 'center');
  }
  // Mano del jugador (las cartas flotan ahí, se ven sobre el tapete) y mano del rival.
  for (const [z, t] of [[Z.mano[0], 'MANO DEL JUGADOR (cartas flotando: aquí poco detalle)'], [Z.mano[1], 'MANO DEL RIVAL (boca abajo)']]) {
    const r = rect(-6, z - 1.0, 6, z + 1.0);
    ctx.setLineDash([10 * k, 8 * k]); marco(r, '#ffffff99'); ctx.setLineDash([]);
    if (!guia) texto(t, r[0] + 10 * k, r[1] + 8 * k, 12, '#ddd');
  }
  if (!guia) {
    const [cx, cy] = aPx(0, (Z.frente[0] + Z.frente[1]) / 2, px);
    texto('CENTRO DE LA MESA', cx, cy - 8 * k, 12, '#ffe08a', 'center');
    texto(`Plantilla del tapete · ${px}×${H} px · el borde oscuro queda bajo el marco de madera`, 50 * k, H - 34 * k, 13, '#ccc');
  }
}
