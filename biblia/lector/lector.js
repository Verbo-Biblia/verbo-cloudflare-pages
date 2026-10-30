/* Lector de la Biblia Verbo: referencias cruzadas (al tocar el número del versículo) y buscador semántico. */
(() => {
  // Referencias cruzadas: se ven bajo cada versículo; «+N más» muestra el resto.
  document.querySelectorAll('.refs button.vermas').forEach(b => b.addEventListener('click', () => {
    b.previousElementSibling.hidden = false; b.remove();
  }));

  // Selector de Testamento, Libro y Capítulo.
  document.querySelectorAll('form.selector').forEach(async f => {
    let libros; try { libros = await fetch('/biblia/lector/libros.json?v=20261028g').then(r => r.json()); } catch { return; }
    const [st, sl, sc] = [f.t, f.l, f.c];
    const actual = libros.find(b => b.s === f.dataset.libro) || libros[0];
    const llenarLibros = (t, elegido) => {
      sl.replaceChildren(...libros.filter(b => b.t === t).map(b => new Option(b.n, b.s, false, b.s === elegido)));
      llenarCaps();
    };
    const llenarCaps = (elegido) => {
      const b = libros.find(x => x.s === sl.value);
      sc.replaceChildren(...Array.from({ length: b.c }, (_, i) => new Option(String(i + 1), String(i + 1), false, String(i + 1) === elegido)));
    };
    st.value = actual.t; llenarLibros(actual.t, actual.s); llenarCaps(f.dataset.cap || '1');
    st.addEventListener('change', () => llenarLibros(st.value));
    sl.addEventListener('change', () => llenarCaps());
    sc.addEventListener('change', () => f.requestSubmit());
    f.addEventListener('submit', ev => { ev.preventDefault(); location.href = `/biblia/${sl.value}/${sc.value}/`; });
  });

  // Buscador semántico (solo en /biblia/buscar/): versículos y pasajes, por sentido.
  const form = document.getElementById('buscador');
  if (!form) return;
  const BASE = '/biblia/modules/semantic-search/bible-rv-verbo/';
  const estado = document.getElementById('estado');
  const listaV = document.getElementById('resultados'), listaP = document.getElementById('pasajes');
  const SLUG = JSON.parse(document.getElementById('slugs').textContent);
  let listo = null;
  async function preparar() {
    if (listo) return listo;
    listo = (async () => {
      estado.textContent = 'Preparando el buscador (la primera vez tarda un poco)…';
      const carga = n => Promise.all([fetch(BASE + n + '.meta.json').then(r => r.json()), fetch(BASE + n + '.i8.bin').then(r => r.arrayBuffer())]);
      const [{ pipeline }, [mv, bv], [mp, bp]] = await Promise.all([
        import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/+esm'), carga('verses'), carga('pericopes')]);
      const extractor = await pipeline('feature-extraction', mv.model);
      return { extractor, v: { meta: mv, vec: new Int8Array(bv) }, p: { meta: mp, vec: new Int8Array(bp) } };
    })();
    return listo;
  }
  function mejores(ix, qv, n) {
    const { meta, vec } = ix, d = meta.dimensions, recs = meta.records, sc = new Float32Array(recs.length);
    for (let i = 0; i < recs.length; i++) { let s = 0; const o = recs[i].offset; for (let k = 0; k < d; k++) s += qv[k] * vec[o + k]; sc[i] = s; }
    return [...sc.keys()].sort((a, b) => sc[b] - sc[a]).slice(0, n).map(i => recs[i]);
  }
  function pintar(lista, recs, recortar) {
    lista.replaceChildren(...recs.map(r => {
      const li = document.createElement('li'), a = document.createElement('a'), p = document.createElement('p');
      a.href = `/biblia/${SLUG[r.book]}/${r.chapterStart}/#v${r.verseStart}`; a.textContent = r.label;
      p.textContent = recortar && r.text.length > 320 ? r.text.slice(0, 320).replace(/\s\S*$/, '') + '…' : r.text;
      li.append(a, p); return li;
    }));
  }
  async function buscar(q) {
    listaV.replaceChildren(); listaP.replaceChildren();
    document.querySelectorAll('.res-titulo').forEach(h => h.hidden = true);
    try {
      const ix = await preparar();
      estado.textContent = 'Buscando…';
      const qv = (await ix.extractor(q, { pooling: 'mean', normalize: true })).data;
      pintar(listaP, mejores(ix.p, qv, 6), true); pintar(listaV, mejores(ix.v, qv, 20), false);
      document.querySelectorAll('.res-titulo').forEach(h => h.hidden = false);
      estado.textContent = '';
    } catch (e) { estado.textContent = 'No se pudo cargar el buscador. Revisa tu conexión e inténtalo de nuevo.'; listo = null; }
  }
  form.addEventListener('submit', ev => {
    ev.preventDefault(); const q = form.q.value.trim(); if (!q) return;
    history.replaceState(null, '', '?q=' + encodeURIComponent(q)); buscar(q);
  });
  const q0 = new URLSearchParams(location.search).get('q');
  if (q0) { form.q.value = q0; buscar(q0); }
})();
