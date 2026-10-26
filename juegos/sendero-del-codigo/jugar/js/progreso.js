// Progreso del jugador en localStorage (con try/catch: puede no haber almacenamiento) y exportar/importar en JSON.
const CLAVE = 'sendero-del-codigo-v1';
const VACIO = () => ({ version: 1, ajustes: {}, capitulos: {}, pergaminos: [], medallas: [] });
let datos = VACIO();

export function cargar() {
  try { const t = localStorage.getItem(CLAVE); if (t) datos = { ...VACIO(), ...JSON.parse(t) }; } catch (e) { /* sin almacenamiento */ }
  return datos;
}
export function guardar() { try { localStorage.setItem(CLAVE, JSON.stringify(datos)); } catch (e) { /* lleno o bloqueado */ } }
export const ajustes = () => datos.ajustes;
export function ajustar(k, v) { datos.ajustes[k] = v; guardar(); }

export function capitulo(id) { return (datos.capitulos[id] ||= { ejercicios: {}, completo: false }); }
export function ejercicio(cap, id) { return (capitulo(cap).ejercicios[id] ||= { hecho: false, intentos: 0, pistas: 0, codigo: {} }); }
export const pergaminos = () => datos.pergaminos;
export const medallas = () => datos.medallas;
export function completarCapitulo(id, versiculo, medalla) {
  const c = capitulo(id), nuevo = !c.completo;
  c.completo = true;
  if (versiculo && !datos.pergaminos.includes(versiculo)) datos.pergaminos.push(versiculo);
  if (medalla && !datos.medallas.includes(id)) datos.medallas.push(id);
  guardar();
  return nuevo;
}

export function exportar() {
  const b = new Blob([JSON.stringify({ juego: 'sendero-del-codigo', ...datos }, null, 1)], { type: 'application/json' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(b), download: 'sendero-del-codigo-progreso.json' });
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
export async function importar(archivo) {
  const d = JSON.parse(await archivo.text());
  if (d.juego !== 'sendero-del-codigo' || typeof d.capitulos !== 'object') throw new Error('formato');
  delete d.juego; datos = { ...VACIO(), ...d }; guardar();
}
export function borrar() { const a = datos.ajustes; datos = VACIO(); datos.ajustes = a; guardar(); }
