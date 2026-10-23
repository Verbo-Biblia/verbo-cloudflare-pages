/* Tarjeta para compartir: la imagen de la página con un versículo del pasaje encima, en 1080×1080 o 1080×1350,
   con una marca pequeña «verbobiblia.com». Se dibuja en el navegador; la descarga normal de la imagen sigue limpia. */
(() => {
  'use strict';
  const dlg = document.querySelector('dialog.verse-card');
  const abrir = document.querySelector('[data-tarjeta]');
  if (!dlg || !abrir) return;
  const canvas = dlg.querySelector('canvas'), ctx = canvas.getContext('2d');
  const en = () => window.VerboI18n?.getUiLang?.() === 'en';
  const d = dlg.dataset;
  const img = new Image();
  let lista = false, formato = [1080, 1080], blobURL = null;
  img.decoding = 'async';
  img.onload = () => { lista = true; dibujar(); };
  img.src = d.img;

  function lineas(texto, ancho) {
    const palabras = texto.split(/\s+/), out = [];
    let linea = '';
    for (const p of palabras) {
      const prueba = linea ? linea + ' ' + p : p;
      if (ctx.measureText(prueba).width > ancho && linea) { out.push(linea); linea = p; } else linea = prueba;
    }
    if (linea) out.push(linea);
    return out;
  }

  function dibujar() {
    const [W, H] = formato;
    canvas.width = W; canvas.height = H;
    ctx.fillStyle = '#081b30'; ctx.fillRect(0, 0, W, H);
    if (lista) {
      // Recorte que cubre todo el lienzo (como object-fit: cover), centrado.
      const s = Math.max(W / img.naturalWidth, H / img.naturalHeight);
      const w = img.naturalWidth * s, h = img.naturalHeight * s;
      ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
    }
    // Velo para que el texto se lea sobre cualquier imagen.
    const g = ctx.createLinearGradient(0, H * 0.25, 0, H);
    g.addColorStop(0, 'rgba(8,27,48,0)'); g.addColorStop(0.45, 'rgba(8,27,48,.72)'); g.addColorStop(1, 'rgba(8,27,48,.94)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    const texto = en() ? '“' + d.versoEn + '”' : '«' + d.versoEs + '»', ref = en() ? d.refEn : d.refEs;
    const margen = 84, ancho = W - margen * 2;
    let tam = 58, ls;
    do { ctx.font = `600 ${tam}px Georgia, "Times New Roman", serif`; ls = lineas(texto, ancho); tam -= 2; }
    while (ls.length * tam * 1.3 > H * 0.5 && tam > 30);
    tam += 2;
    const alto = ls.length * tam * 1.3;
    let y = H - 150 - alto;
    ctx.fillStyle = '#f6efe0'; ctx.textBaseline = 'top';
    ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 12;
    ls.forEach(l => { ctx.fillText(l, margen, y); y += tam * 1.3; });
    ctx.shadowBlur = 0;
    ctx.font = '700 30px Inter, system-ui, sans-serif'; ctx.fillStyle = '#e2b55c';
    ctx.fillText(ref, margen, y + 18);
    // Marca pequeña.
    ctx.font = '600 24px Inter, system-ui, sans-serif'; ctx.fillStyle = 'rgba(246,239,224,.82)';
    ctx.textAlign = 'right'; ctx.fillText('verbobiblia.com', W - 40, H - 52); ctx.textAlign = 'left';
    actualizarWhatsApp();
  }

  function nombre() { return `${d.nombre}-versiculo-${formato[0]}x${formato[1]}.jpg`; }
  function blob() { return new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.92)); }

  function actualizarWhatsApp() {
    const a = dlg.querySelector('[data-whatsapp]');
    const msg = `${en() ? d.versoEn : d.versoEs} (${en() ? d.refEn : d.refEs}) ${location.href}`;
    a.href = 'https://wa.me/?text=' + encodeURIComponent(msg);
  }

  async function descargar() {
    const b = await blob();
    if (blobURL) URL.revokeObjectURL(blobURL);
    blobURL = URL.createObjectURL(b);
    const a = document.createElement('a');
    a.href = blobURL; a.download = nombre(); document.body.append(a); a.click(); a.remove();
  }

  async function compartir() {
    const b = await blob();
    const archivo = new File([b], nombre(), { type: 'image/jpeg' });
    const datos = { files: [archivo], title: document.title, text: (en() ? d.refEn : d.refEs) + ' · verbobiblia.com' };
    try {
      if (navigator.canShare && navigator.canShare({ files: [archivo] })) { await navigator.share(datos); return; }
    } catch (err) { if (err.name === 'AbortError') return; }
    // Sin Web Share con archivos: se descarga la tarjeta y se abre WhatsApp con el versículo y el enlace.
    await descargar();
    window.open(dlg.querySelector('[data-whatsapp]').href, '_blank', 'noopener');
  }

  abrir.addEventListener('click', () => { dlg.showModal(); dibujar(); });
  dlg.querySelector('[data-cerrar]').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  dlg.querySelectorAll('[data-formato]').forEach(b => b.addEventListener('click', () => {
    formato = b.dataset.formato.split('x').map(Number);
    dlg.querySelectorAll('[data-formato]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    dibujar();
  }));
  dlg.querySelector('[data-descargar]').addEventListener('click', descargar);
  dlg.querySelector('[data-compartir]').addEventListener('click', compartir);
  document.addEventListener('verbo:uilang-changed', () => { if (dlg.open) dibujar(); });
})();
