// Puente con el worker de Python: carga diferida, una ejecución a la vez y tiempo límite contra bucles infinitos.
const LIMITE_MS = 5000;
let worker = null, estado = 'apagado', esperaListo = null, oyentes = new Set(), siguienteId = 1;

function avisar(e) { oyentes.forEach(f => f(e)); }
export function alCambiar(f) { oyentes.add(f); f({ estado }); return () => oyentes.delete(f); }
export const estadoActual = () => estado;

function crear() {
  worker = new Worker(new URL('./py-worker.js', import.meta.url));
  estado = 'cargando'; avisar({ estado, paso: 'descargando' });
  esperaListo = new Promise((ok, mal) => {
    const f = (e) => {
      const m = e.data;
      if (m.tipo === 'progreso') avisar({ estado, paso: m.paso });
      else if (m.tipo === 'listo') { worker.removeEventListener('message', f); estado = 'listo'; avisar({ estado }); ok(); }
      else if (m.tipo === 'fallo') { worker.removeEventListener('message', f); estado = 'error'; avisar({ estado, mensaje: m.mensaje }); mal(new Error(m.mensaje)); }
    };
    worker.addEventListener('message', f);
  });
  worker.postMessage({ tipo: 'preparar' });
  return esperaListo;
}

export function preparar() { return worker ? esperaListo : crear(); }

/** Corre una petición {codigo, entradas, pruebas, semilla}. Si pasa el límite, reinicia Python y avisa con
 *  {tiempo: true}. */
export async function correr(peticion) {
  await preparar();
  const id = siguienteId++;
  estado = 'corriendo'; avisar({ estado });
  return new Promise((ok) => {
    const reloj = setTimeout(() => {
      worker.removeEventListener('message', f);
      worker.terminate(); worker = null;
      crear().catch(() => {});
      ok({ tiempo: true });
    }, LIMITE_MS);
    const f = (e) => {
      const m = e.data;
      if (m.id !== id) return;
      clearTimeout(reloj); worker.removeEventListener('message', f);
      estado = 'listo'; avisar({ estado });
      ok(m.tipo === 'resultado' ? m.resultado : { fallo: m.mensaje });
    };
    worker.addEventListener('message', f);
    worker.postMessage({ tipo: 'correr', id, peticion });
  });
}
