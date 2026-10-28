/* «¿Ves un error en esta imagen?»: envía la sugerencia a la API de Verbo (D1). */
(() => {
  const f = document.getElementById('sugerencia');
  if (!f) return;
  const estado = f.querySelector('.sug-estado');
  f.addEventListener('submit', async ev => {
    ev.preventDefault();
    const texto = f.texto.value.trim();
    if (texto.length < 5) { estado.textContent = 'Escribe qué ves mal en la imagen.'; return; }
    const boton = f.querySelector('button'); boton.disabled = true; estado.textContent = 'Enviando…';
    try {
      const r = await fetch('https://verbo-api-bible.juanjosevenegas78.workers.dev/v1/imagenes/sugerencia', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagen: f.dataset.imagen, texto, contacto: f.contacto.value, web: f.web.value })
      });
      if (!r.ok) throw new Error(r.status);
      f.texto.value = ''; f.contacto.value = '';
      estado.textContent = '¡Gracias! Revisaremos tu sugerencia y, si corresponde, corregiremos la imagen.';
    } catch (e) {
      estado.textContent = 'No se pudo enviar. Inténtalo de nuevo en un momento.';
    }
    boton.disabled = false;
  });
})();
