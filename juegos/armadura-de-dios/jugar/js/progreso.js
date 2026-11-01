// Progreso y guardado (port de progress/Progression.kt + SaveManager.kt) en localStorage.
// Sin compras: todos los niveles son gratis; se desbloquean en orden al completar el anterior.

const CLAVE = 'armaduraDios.guardado';

function leer() {
  try { return JSON.parse(localStorage.getItem(CLAVE) || 'null') || {}; } catch { return {}; }
}
let guardado = leer();
function escribir() { try { localStorage.setItem(CLAVE, JSON.stringify(guardado)); } catch { /* sin almacenamiento */ } }

const camp = (id) => (guardado.campanas ??= {})[id] ??= { ultimo: 1, habilidades: [], completados: [], empezada: false };

/** Ajustes del jugador (idioma, sonido, volumen de música). */
export const ajustes = {
  get(k, d) { return guardado.ajustes?.[k] ?? d; },
  set(k, v) { (guardado.ajustes ??= {})[k] = v; escribir(); },
};

export class Progreso {
  constructor(data) { this.data = data; }
  setData(data) { this.data = data; }

  ultimoDesbloqueado(c) { return camp(c.id).ultimo; }
  // window.PRUEBA_TODO (solo en la versión de prueba del teléfono): todos los niveles abiertos para revisar novedades.
  desbloqueado(level) { return !!window.PRUEBA_TODO || level.levelNumber <= camp(level.campaignId).ultimo; }
  completado(level) { return camp(level.campaignId).completados.includes(level.levelId); }
  empezada(c) { return camp(c.id).empezada || camp(c.id).completados.length > 0; }

  /** Primer nivel desbloqueado y no completado (o el último desbloqueado). */
  sugerido(c) {
    const last = camp(c.id).ultimo;
    return c.levels.find((l) => l.levelNumber <= last && !this.completado(l)) ?? [...c.levels].reverse().find((l) => l.levelNumber <= last);
  }

  nuevaPartida(c) {
    guardado.campanas ??= {};
    guardado.campanas[c.id] = { ultimo: 1, habilidades: [...c.startAbilities], completados: [], empezada: true };
    escribir();
  }

  /** Habilidades con las que se juega un nivel: iniciales + ganadas + las del inicio del nivel. */
  habilidadesPara(level) {
    const c = this.data.campaign(level.campaignId);
    const previas = window.PRUEBA_TODO ? (c?.levels ?? []).filter((l) => l.levelNumber < level.levelNumber).flatMap((l) => l.unlockOnComplete ?? []) : [];
    return new Set([...(c?.startAbilities ?? []), ...camp(level.campaignId).habilidades, ...level.unlockOnStart, ...previas]);
  }

  /** Una habilidad recogida dentro del nivel queda guardada al instante. */
  ganarEnNivel(level, id) {
    const s = camp(level.campaignId);
    if (!s.habilidades.includes(id)) { s.habilidades.push(id); escribir(); }
  }

  /** Completar un nivel: guarda habilidades y desbloquea el siguiente. Devuelve las recompensas. */
  completar(level) {
    const c = this.data.campaign(level.campaignId), s = camp(c.id);
    const previas = new Set([...s.habilidades, ...c.startAbilities]);
    const todas = new Set([...previas, ...level.unlockOnStart, ...level.unlockDuringLevel.map((u) => u.type.replace('ability:', '')), ...level.unlockOnComplete]);
    const siguiente = c.levels.find((l) => l.levelNumber === level.levelNumber + 1) ?? null;
    s.habilidades = [...todas];
    if (!s.completados.includes(level.levelId)) s.completados.push(level.levelId);
    s.ultimo = Math.max(s.ultimo, siguiente?.levelNumber ?? level.levelNumber);
    s.empezada = true;
    escribir();
    return {
      nuevas: level.unlockOnComplete.filter((a) => !previas.has(a)),
      siguiente,
      campanaTerminada: level.isCampaignFinal || !siguiente,
    };
  }

  borrarTodo() { guardado = { ajustes: guardado.ajustes }; escribir(); }
}
