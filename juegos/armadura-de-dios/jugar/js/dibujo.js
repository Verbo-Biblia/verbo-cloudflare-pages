// Utilidades de dibujo (equivalen a render/Draw.kt). Los colores se manejan como [r, g, b, a] (a de 0 a 255),
// igual que los Int de Android, para poder traducir withAlpha y lerpColor sin cambiar la lógica.

export const rgb = (r, g, b) => [r, g, b, 255];
export const argb = (a, r, g, b) => [r, g, b, a];
export const hex = (h) => {
  const v = parseInt(h.replace('#', ''), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255, 255];
};
export const css = (c) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${(c[3] / 255).toFixed(3)})`;
export const withAlpha = (c, a) => [c[0], c[1], c[2], c[3] * Math.min(1, Math.max(0, a))];
export function lerpColor(a, b, t) {
  const k = Math.min(1, Math.max(0, t));
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k, a[3] + (b[3] - a[3]) * k];
}
export const WHITE = rgb(255, 255, 255);

export function rect(g, x, y, w, h, c) { g.fillStyle = css(c); g.fillRect(x, y, w, h); }
/** Rectángulo por esquinas (como drawRect de Android). */
export function lrtb(g, l, t, r, b, c) { g.fillStyle = css(c); g.fillRect(l, t, r - l, b - t); }
export function rr(g, x, y, w, h, r, c) {
  if (w <= 0 || h <= 0) return;
  g.fillStyle = css(c); g.beginPath(); g.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2)); g.fill();
}
export function poly(g, c, ...pts) {
  g.fillStyle = css(c); g.beginPath(); g.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
  g.closePath(); g.fill();
}
export function circle(g, x, y, r, c) {
  if (r <= 0) return;
  g.fillStyle = css(c); g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
}
/** Círculo con mezcla aditiva (Paint con xfermode ADD). */
export function glowCircle(g, x, y, r, c) {
  if (r <= 0 || c[3] <= 0) return;
  g.save(); g.globalCompositeOperation = 'lighter'; circle(g, x, y, r, c); g.restore();
}
export function glowRect(g, l, t, r, b, c) {
  g.save(); g.globalCompositeOperation = 'lighter'; lrtb(g, l, t, r, b, c); g.restore();
}
export function line(g, x1, y1, x2, y2, c, w) {
  g.strokeStyle = css(c); g.lineWidth = w; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
}
export function linearV(g, y0, y1, c0, c1) {
  const gr = g.createLinearGradient(0, y0, 0, y1);
  gr.addColorStop(0, css(c0)); gr.addColorStop(1, css(c1));
  return gr;
}
/** Hash 0..1 determinista (mismo que hh() en Background/GeometryPainter). */
export function hh(i) { const v = Math.sin(i * 12.9898 + 78.233) * 43758.547; return v - Math.floor(v); }
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
