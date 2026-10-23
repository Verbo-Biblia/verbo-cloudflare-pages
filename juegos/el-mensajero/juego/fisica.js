// Física de plataformas en el plano del juego (x horizontal, y vertical; la profundidad z es solo decorado).
// Cada cuerpo es una caja: x es el centro, y los pies; ancho a, alto h. Los sólidos son rectángulos
// { x0, y0, x1, y1, tipo: 'solido' | 'toldo' } (los toldos solo frenan desde arriba).

export const GRAVEDAD = 30;
export const VEL_CAIDA_MAX = 22;
const EPS = 0.001;

export class Mundo {
  constructor() {
    this.solidos = [];      // fijos y móviles (la caja, la reja): todos en la misma lista
  }

  agregar(s) {
    s.tipo ??= 'solido';
    this.solidos.push(s);
    return s;
  }

  // ¿Choca la caja [x0,x1]×[y0,y1] con algún sólido (sin contar toldos)? Devuelve el primero o null.
  choca(x0, y0, x1, y1, ignorar = null) {
    for (const s of this.solidos) {
      if (s === ignorar || s.tipo !== 'solido' || s.inactivo) continue;
      if (x1 > s.x0 + EPS && x0 < s.x1 - EPS && y1 > s.y0 + EPS && y0 < s.y1 - EPS) return s;
    }
    return null;
  }

  // ¿Hay línea de vista entre dos puntos? (muestreo cada 25 cm; basta para este juego)
  vista(ax, ay, bx, by) {
    const d = Math.hypot(bx - ax, by - ay);
    const n = Math.max(2, Math.ceil(d / 0.25));
    for (let i = 1; i < n; i++) {
      const t = i / n, x = ax + (bx - ax) * t, y = ay + (by - ay) * t;
      for (const s of this.solidos) {
        if (s.tipo !== 'solido' || s.inactivo || s.transparente) continue;
        if (x > s.x0 && x < s.x1 && y > s.y0 && y < s.y1) return false;
      }
    }
    return true;
  }

  // ¿Hay suelo justo debajo del punto x (entre y-prof y y)? Para que los guardias no se tiren al vacío.
  sueloEn(x, y, prof = 0.6) {
    for (const s of this.solidos) {
      if (s.inactivo) continue;
      if (x > s.x0 && x < s.x1 && s.y1 <= y + 0.05 && s.y1 >= y - prof) return s;
    }
    return null;
  }
}

// Mueve un cuerpo { x, y, a, h, vx, vy } con colisión por ejes. Devuelve { suelo, pared, techo, golpeado }.
// opciones.atravesarToldos: true mientras baja a propósito por un toldo. opciones.subir: escalón que sube solo.
export function mover(mundo, c, dt, opciones = {}) {
  const r = { suelo: null, pared: null, techo: false };
  const subir = opciones.subir ?? 0.32;
  // --- eje x
  let dx = c.vx * dt;
  if (dx !== 0) {
    let nx = c.x + dx;
    const s = mundo.choca(nx - c.a / 2, c.y, nx + c.a / 2, c.y + c.h, c.solido);
    if (s) {
      // escalón bajo: subir solo si está en el suelo y hay sitio arriba
      const alto = s.y1 - c.y;
      if (c.enSuelo && alto > 0 && alto <= subir &&
          !mundo.choca(nx - c.a / 2, s.y1 + EPS, nx + c.a / 2, s.y1 + c.h, c.solido)) {
        c.y = s.y1 + EPS;
      } else {
        nx = dx > 0 ? s.x0 - c.a / 2 - EPS : s.x1 + c.a / 2 + EPS;
        r.pared = s;
      }
    }
    c.x = nx;
  }
  // --- eje y
  const antesPies = c.y;
  let dy = c.vy * dt;
  let ny = c.y + dy;
  const s = mundo.choca(c.x - c.a / 2, ny, c.x + c.a / 2, ny + c.h, c.solido);
  if (s) {
    if (dy <= 0) { ny = s.y1 + EPS; r.suelo = s; }
    else { ny = s.y0 - c.h - EPS; r.techo = true; }
    c.vy = 0;
  } else if (dy <= 0 && !opciones.atravesarToldos) {
    // toldos: solo si los pies venían por encima
    for (const t of mundo.solidos) {
      if (t.tipo !== 'toldo' || t.inactivo) continue;
      if (c.x + c.a / 2 > t.x0 && c.x - c.a / 2 < t.x1 && antesPies >= t.y1 - EPS && ny <= t.y1) {
        ny = t.y1 + EPS; r.suelo = t; c.vy = 0; break;
      }
    }
  }
  c.y = ny;
  // ¿sigue apoyado? (si no se movió en y, revisar que haya algo debajo)
  if (!r.suelo) {
    const debajo = mundo.choca(c.x - c.a / 2, c.y - 0.02, c.x + c.a / 2, c.y, c.solido);
    if (debajo && c.vy <= 0) r.suelo = debajo;
    else if (!opciones.atravesarToldos && c.vy <= 0) {
      for (const t of mundo.solidos) {
        if (t.tipo === 'toldo' && !t.inactivo && c.x + c.a / 2 > t.x0 && c.x - c.a / 2 < t.x1 && Math.abs(c.y - t.y1) < 0.03) { r.suelo = t; break; }
      }
    }
  }
  c.enSuelo = !!r.suelo;
  return r;
}
