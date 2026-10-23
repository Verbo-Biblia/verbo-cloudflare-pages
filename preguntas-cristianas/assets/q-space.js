/* Viaje a través de las preguntas: al bajar, cada pregunta llega desde el
   fondo, queda nítida en el centro con su tema, su resumen y el enlace a la
   respuesta, y pasa junto a la cámara. Se arma con las tarjetas de .q-grid
   (no duplica contenido en el HTML). La lista accesible completa sigue debajo,
   por eso el escenario va con aria-hidden y sin foco de teclado.
   Misma técnica que /historias/assets/journey.js. */
(() => {
  'use strict';
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cards = [...document.querySelectorAll('.q-grid .q-card')];
  const anchor = document.querySelector('.q-intro');
  if (!cards.length || !anchor) return;

  const GAP = 1300;
  const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
  const esc = s => s.replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);

  const section = el('section', 'q-space');
  section.id = 'recorrido-preguntas';
  section.setAttribute('aria-hidden', 'true');
  section.style.setProperty('--count', cards.length);
  const stage = el('div', 'q-space-stage');
  const world = el('div', 'q-space-world');
  const items = [];
  const dust = [0, 1, 2, 3].map(i => { const d = el('div', 'q-space-dust'); world.append(d); return { node: d, base: i * 1100 }; });

  const stops = cards.map((card, i) => {
    const num = el('div', 'q-space-num', String(i + 1).padStart(2, '0'));
    const box = el('div', 'q-space-card',
      `<small>${esc(card.dataset.topic || '')}</small><strong>${esc(card.querySelector('h2')?.textContent.trim() || '')}</strong>` +
      `<p>${esc(card.querySelector('p')?.textContent.trim() || '')}</p>`);
    const link = el('a', '', 'Leer la respuesta');
    link.href = card.getAttribute('href'); link.tabIndex = -1;
    box.append(link);
    world.append(num, box);
    items.push({ node: num, stop: i, z: -380, link: null }, { node: box, stop: i, z: 0, link });
    return { z: -i * GAP };
  });

  const intro = el('div', 'q-space-intro', 'BAJA: CADA PREGUNTA VIENE A TU ENCUENTRO');
  const skip = el('a', 'q-space-skip', 'Ver todas las preguntas ↓');
  skip.href = '#preguntas'; skip.tabIndex = -1;
  const hud = el('div', 'q-space-hud');
  const dots = cards.map((_, i) => {
    const b = el('button', '');
    b.type = 'button'; b.tabIndex = -1;
    b.addEventListener('click', () => scrollTo({ top: scrollForStop(i), behavior: 'smooth' }));
    hud.append(b);
    return b;
  });
  stage.append(world, intro, skip, hud);
  section.append(stage);
  anchor.after(section);

  // La llamada de la portada entra en la primera pregunta del recorrido.
  // Sin este escenario (sin JS o con movimiento reducido), conserva la lista como destino.
  const explore = anchor.querySelector('a[href="#preguntas"]');
  if (explore) {
    explore.href = '#recorrido-preguntas';
    explore.addEventListener('click', e => {
      e.preventDefault();
      scrollTo({ top: scrollForStop(0), behavior: 'smooth' });
      history.pushState(null, '', explore.hash);
    });
  }

  /* Un enlace interno (#...) que cruza el escenario salta directo: con scroll
     suave atravesaba el viaje entero y todos los títulos parpadeaban. */
  document.addEventListener('click', e => {
    if (e.defaultPrevented) return;
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.hash.length < 2) return;
    const dest = document.getElementById(decodeURIComponent(a.hash.slice(1)));
    if (!dest) return;
    const top = section.getBoundingClientRect().top + scrollY;
    const bottom = top + section.offsetHeight;
    const y = dest.getBoundingClientRect().top + scrollY;
    if ((scrollY < bottom - innerHeight && y >= bottom - 1) || (scrollY > top && y <= top)) {
      e.preventDefault();
      const pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
      scrollTo({ top: y - pad, behavior: 'instant' });
      history.pushState(null, '', a.hash);
    }
  });

  const START = -700;
  const travelTotal = (cards.length - 1) * GAP + 1000;
  const range = () => ({ top: section.getBoundingClientRect().top + scrollY, len: section.offsetHeight - innerHeight });
  function scrollForStop(i) { const { top, len } = range(); return top + ((i * GAP - START - 120) / travelTotal) * len; }

  /* Nítida cerca, apenas visible a lo lejos, se desvanece al pasar. */
  function alpha(ez) {
    if (ez > 300) return 0;
    if (ez > 80) return 1 - (ez - 80) / 220;
    if (ez > -520) return 1;
    if (ez > -1500) return ((ez + 1500) / 980) * 0.18;
    return 0;
  }

  let raf = 0, cam = START, target = START;
  function measure() {
    const { top, len } = range();
    const p = Math.max(0, Math.min(1, (scrollY - top) / len));
    target = START + p * travelTotal;
    intro.style.opacity = p < 0.03 ? '1' : '0';
  }
  function render() {
    cam += (target - cam) * 0.12;
    let current = 0, best = Infinity;
    stops.forEach((s, i) => { const d = Math.abs(s.z + cam + 120); if (d < best) { best = d; current = i; } });
    for (const it of items) {
      const ez = stops[it.stop].z + cam + it.z;
      const o = alpha(ez);
      const n = it.node.style;
      n.opacity = o.toFixed(3);
      n.visibility = o < 0.01 ? 'hidden' : 'visible';
      if (o >= 0.01) n.transform = `translate(-50%,-50%) translate3d(0,0,${ez.toFixed(1)}px)`;
      if (it.link) it.link.style.pointerEvents = o > 0.7 ? 'auto' : 'none';
    }
    for (const d of dust) {
      const z = ((d.base + cam) % 4400 + 4400) % 4400 - 3800;
      d.node.style.transform = `translate3d(-50%,-50%,${z.toFixed(1)}px)`;
      d.node.style.opacity = (z > 300 ? Math.max(0, 1 - (z - 300) / 300) : Math.min(1, (z + 3800) / 1200)) * 0.5;
    }
    dots.forEach((d, i) => d.setAttribute('aria-current', String(i === current)));
    raf = Math.abs(target - cam) > 0.5 ? requestAnimationFrame(render) : 0;
  }
  function onScroll() { measure(); if (!raf) raf = requestAnimationFrame(render); }
  measure(); cam = target; render();
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll, { passive: true });
})();
