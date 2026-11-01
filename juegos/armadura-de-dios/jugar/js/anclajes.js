// Cómo se dibuja cada jefe (imagen de Codex sobre su caja de enemies.json) y dónde quedan su ojo, boca o arma.
// La lógica de los ataques usa estos mismos puntos, así los rayos y disparos salen del dibujo.
// Las imágenes miran a la IZQUIERDA; con e.dir > 0 se reflejan. Puntos [u, v] en fracción de la imagen recortada.
import { TAM_JEFES } from './arte_cajas.js';

export const ARTE_JEFES = {
  crimson_over_eye: { img: 'gran_ojo_envidia', escala: 1.4, pie: false, puntos: { ojo: [0.11, 0.53] } },
  warden_goliath: { img: 'goliat_sabueso', escala: 1.2, pie: true, puntos: { boca: [0.08, 0.57] } },
  seraph_engine: { img: 'falso_angel', escala: 1.22, pie: true, puntos: { visor: [0.12, 0.28], armaJet: [0.05, 0.38] } },
  aegis_behemoth: { img: 'behemot', escala: 1.4, pie: true, puntos: { boca: [0.06, 0.3] } },
  rival_assault: { img: 'duda', escala: 1.6, pie: true, puntos: { arma: [0.03, 0.38] } },
  rival_scout: { img: 'desanimo', escala: 1.6, pie: true, puntos: { arma: [0.06, 0.62] } },
  regent_frame: { img: 'leviatan', escala: 1.15, pie: true, puntos: { arma: [0.1, 0.43] } },
};

/** Rectángulo de dibujo del jefe en el mundo: { x, y, w, h } (sin reflejar). */
export function marcoJefe(e) {
  const a = ARTE_JEFES[e.def.id];
  if (!a) return null;
  const [iw, ih] = TAM_JEFES[a.img];
  const h = e.h * a.escala, w = h * iw / ih;
  const x = e.x + e.w / 2 - w / 2;
  const y = a.pie ? e.y + e.h - h : e.y + e.h / 2 - h / 2;
  return { x, y, w, h };
}

/** Punto del dibujo en coordenadas del mundo, o null si el jefe no lo tiene. */
export function puntoJefe(e, nombre) {
  const a = ARTE_JEFES[e.def.id], m = marcoJefe(e);
  const p = a?.puntos[nombre];
  if (!p || !m) return null;
  const u = e.dir > 0 ? 1 - p[0] : p[0];
  return [m.x + u * m.w, m.y + p[1] * m.h];
}
