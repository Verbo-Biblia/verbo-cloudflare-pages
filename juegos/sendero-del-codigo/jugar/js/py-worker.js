// Worker de Python: carga Pyodide (CPython en WebAssembly) y corre el arnés. Si un programa se cuelga, la página
// termina este worker y crea otro (ver js/python.js).
const PYODIDE = 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/';
let listo = null;

async function preparar() {
  postMessage({ tipo: 'progreso', paso: 'descargando' });
  importScripts(PYODIDE + 'pyodide.js');
  const py = await loadPyodide({ indexURL: PYODIDE });
  postMessage({ tipo: 'progreso', paso: 'arnes' });
  const arnes = await (await fetch(new URL('arnes.py', self.location.href))).text();
  py.runPython(arnes);
  const datos = await (await fetch(new URL('../data/versiculos.json', self.location.href))).text();
  py.globals.get('datos_comunes')(JSON.stringify({ 'versiculos.json': datos }));
  return py.globals.get('ejecutar');
}

onmessage = async (e) => {
  const m = e.data;
  try {
    if (!listo) listo = preparar();
    const ejecutar = await listo;
    if (m.tipo === 'preparar') { postMessage({ tipo: 'listo' }); return; }
    const r = ejecutar(JSON.stringify(m.peticion));
    postMessage({ tipo: 'resultado', id: m.id, resultado: JSON.parse(r) });
  } catch (err) {
    postMessage({ tipo: 'fallo', id: m.id, mensaje: String(err && err.message || err) });
  }
};
