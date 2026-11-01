// Escenas de historia y radio (port de ui/StoryPlayer.kt y de la banda de radio de hud/Hud.kt).
// Cada paso: imagen 16:9 a pantalla completa con zoom/paneo lento + «golpes» de texto: primero la narración
// (caption) y después cada línea de diálogo con el retrato y el nombre de quien habla.
import { tr } from './datos.js';

const $ = (s) => document.querySelector(s);
const LETRAS_POR_SEG = 48;

/** Ruta del retrato de una voz ('@player' = el Peregrino). */
export function rutaRetrato(id) {
  const r = !id || id === '@player' ? 'portrait_peregrino' : id;
  return `assets/portraits/${r}.webp`;
}

/** Pone un retrato en un contenedor; si la imagen no existe, deja un marco con la inicial. */
export function ponerRetrato(caja, voz, color) {
  caja.innerHTML = '';
  caja.style.borderColor = color;
  const img = new Image();
  img.alt = voz?.name ?? '';
  img.onerror = () => { caja.innerHTML = ''; const i = document.createElement('span'); i.textContent = (voz?.name ?? '?').replace(/^(EL|LA|THE)\s+/, '').charAt(0); i.style.color = color; caja.append(i); };
  img.src = rutaRetrato(voz?.portrait);
  caja.append(img);
}

/** Une varias escenas ('a+b') en una sola lista de pasos; las que no existan se omiten. */
export function escena(data, ids) {
  if (!ids) return null;
  const pasos = ids.split('+').flatMap((id) => data.story.scenes[id]?.steps ?? []);
  return pasos.length ? pasos : null;
}

export class Historia {
  constructor(data, sfx) { this.data = data; this.sfx = sfx; this.activa = false; }

  /** Reproduce los pasos sobre el juego. `fondo` = ruta del fondo del nivel para el respaldo; al terminar llama a `alTerminar`. */
  reproducir(pasos, fondo, alTerminar) {
    this.pasos = pasos; this.fondo = fondo; this.alTerminar = alTerminar;
    this.i = -1; this.activa = true; this.imgId = undefined;
    $('#historia').classList.remove('oculto', 'cerrando');
    $('#historia-saltar').textContent = tr('SALTAR ›');
    this.siguientePaso();
  }

  siguientePaso() {
    this.i++;
    if (this.i >= this.pasos.length) return this.terminar();
    const p = this.pasos[this.i];
    if (p.image !== this.imgId) this.ponerImagen(p.image, p.motion);
    this.golpes = [...(p.caption ? [[null, p.caption]] : []), ...(p.lines ?? [])];
    this.g = -1; this.tPaso = performance.now();
    this.siguienteGolpe();
  }

  ponerImagen(id, motion) {
    this.imgId = id;
    const capa = $('#historia-imagen'), nueva = capa.cloneNode(false);
    // Las imágenes de jefe son cuadradas: se muestran enteras sobre fondo oscuro en vez de recortarlas.
    nueva.className = `mov-${motion || 'in'}` + (id?.startsWith('jefe_') ? ' contener' : '');
    const ruta = `assets/story/${id}.webp`, prueba = new Image();
    prueba.onload = () => { nueva.style.backgroundImage = `url(${ruta})`; nueva.classList.remove('respaldo'); };
    prueba.onerror = () => { nueva.style.backgroundImage = this.fondo ? `url(${this.fondo})` : 'none'; nueva.classList.add('respaldo'); };
    prueba.src = ruta;
    capa.replaceWith(nueva);
  }

  siguienteGolpe() {
    this.g++;
    if (this.g >= this.golpes.length) return this.siguientePaso();
    const [voz, texto] = this.golpes[this.g];
    this.texto = texto; this.tGolpe = performance.now();
    const caja = $('#historia-dialogo'), narr = $('#historia-narracion');
    if (!voz) {
      caja.classList.add('oculto'); narr.classList.remove('oculto');
      this.destino = narr;
    } else {
      const v = this.data.story.speakers[voz] ?? { name: voz, portrait: null, color: '#7fe4ff' };
      narr.classList.add('oculto'); caja.classList.remove('oculto');
      ponerRetrato($('#historia-retrato'), v, v.color);
      $('#historia-nombre').textContent = v.name; $('#historia-nombre').style.color = v.color;
      caja.style.setProperty('--color-voz', v.color);
      this.destino = $('#historia-texto');
    }
    this.destino.textContent = '';
  }

  /** Avance con toque o tecla: completa el texto si se está escribiendo; si no, pasa al siguiente. */
  tocar() {
    if (!this.activa || performance.now() - this.tPaso < 250) return;
    if (this.letras() < this.texto.length) { this.tGolpe = -1e9; return; }
    this.sfx('ui_click', 0.5);
    this.siguienteGolpe();
  }

  letras() { return Math.floor((performance.now() - this.tGolpe) / 1000 * LETRAS_POR_SEG); }

  saltar() { if (this.activa) { this.sfx('ui_back'); this.terminar(); } }

  terminar() {
    if (!this.activa) return;
    this.activa = false;
    $('#historia').classList.add('cerrando');
    setTimeout(() => { $('#historia').classList.add('oculto'); $('#historia').classList.remove('cerrando'); this.alTerminar?.(); }, 280);
  }

  /** Llamar en cada cuadro: escribe el texto letra a letra. */
  actualizar() {
    if (!this.activa || !this.destino) return;
    const n = Math.min(this.texto.length, this.letras());
    if (this.destino.textContent.length !== n) this.destino.textContent = this.texto.slice(0, n);
    $('#historia-sigue').classList.toggle('visible', n >= this.texto.length);
  }
}

/** Radio en pleno juego: banda inferior con retrato y texto; avanza sola y no pausa (docs: regla de lectura). */
export class Radio {
  constructor(data, sfx) { this.data = data; this.sfx = sfx; this.cola = []; this.linea = null; this.disparados = new Set(); }

  reiniciar(level) { this.level = level; this.cola = []; this.linea = null; this.disparados = new Set(); this.ocultar(); }

  /** Dispara los avisos del nivel con `on` igual al evento (boss, bossPhase2, bossCore, bossDefeated). */
  evento(on) { for (const t of this.level?.radio ?? []) if (t.on === on) this.reproducir(t.id); }

  reproducir(id) {
    const lineas = this.data.story.radio[id];
    if (!lineas || this.disparados.has(id)) return;
    this.disparados.add(id);
    this.cola.push(...lineas);
    if (!this.linea) this.siguiente();
  }

  siguiente() {
    this.linea = this.cola.shift() ?? null;
    if (!this.linea) return this.ocultar();
    const [voz, texto] = this.linea, v = this.data.story.speakers[voz] ?? { name: voz, color: '#7fe4ff' };
    this.t = 0; this.dura = Math.max(3, texto.length / 17);
    ponerRetrato($('#radio-retrato'), v, v.color);
    $('#radio-nombre').textContent = v.name; $('#radio-nombre').style.color = v.color;
    $('#radio-texto').textContent = texto;
    $('#radio').style.setProperty('--color-voz', v.color);
    $('#radio-omitir').textContent = tr('OMITIR ›');
    $('#radio').classList.remove('oculto');
    this.sfx('radio', 0.5);
  }

  omitir() { this.cola = []; this.siguiente(); }
  ocultar() { $('#radio').classList.add('oculto'); }

  /** En cada cuadro de juego: avisos por segmento (al pasar el inicio del segmento + 40) y avance automático. */
  actualizar(dt, session) {
    if (!this.level || !session) return;
    const starts = session.world?.segmentStarts ?? [];
    for (const t of this.level.radio ?? []) {
      if (t.segment === undefined || t.segment === null || this.disparados.has(t.id)) continue;
      const x = starts[t.segment];
      if (x !== undefined && session.player.cx > x + 40) this.reproducir(t.id);
    }
    if (this.linea) { this.t += dt; if (this.t >= this.dura) this.siguiente(); }
  }
}
