/* Viaje por cinco siglos: la cámara avanza en profundidad con el scroll y
   atraviesa un "portal" por siglo; las vidas de ese siglo flotan alrededor.
   Se arma con los datos de las tarjetas de .story-grid (no duplica contenido
   en el HTML). Es un atajo visual: la colección accesible completa sigue
   debajo, por eso el escenario va con aria-hidden y sin foco de teclado. */
(() => {
  'use strict';
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cards = [...document.querySelectorAll('.story-card[data-century]')];
  const anchor = document.querySelector('.collection-principle');
  if (!cards.length || !anchor) return;

  const roman = { 16: 'XVI', 17: 'XVII', 18: 'XVIII', 19: 'XIX', 20: 'XX' };
  const groups = new Map();
  cards.forEach(card => {
    const c = card.dataset.century;
    if (!groups.has(c)) groups.set(c, []);
    groups.get(c).push({
      href: card.getAttribute('href'),
      name: card.querySelector('.cover-name')?.textContent.trim() || '',
      years: card.querySelector('.cover-years')?.textContent.trim() || '',
      theme: card.querySelector('.story-card-body .kicker')?.textContent.trim() || ''
    });
  });
  const centuries = [...groups.keys()].sort((a, b) => a - b);
  const GAP = 1500;

  const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
  const esc = s => s.replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);

  const section = el('section', 'journey');
  section.setAttribute('aria-hidden', 'true');
  section.style.setProperty('--gates', centuries.length);
  const stage = el('div', 'journey-stage');
  const world = el('div', 'journey-world');
  /* Cada pieza del escenario lleva su propia profundidad: así la opacidad de
     una no aplana a las demás (opacity < 1 rompe preserve-3d en los padres). */
  const items = []; /* { node, gate, x, y, z } — z relativo al portal */
  const dust = [0, 1, 2, 3].map(i => {
    const d = el('div', 'journey-dust');
    world.append(d);
    return { node: d, base: i * 1100 };
  });
  const gates = centuries.map((c, i) => {
    const gz = -i * GAP;
    const numeral = el('div', 'journey-numeral', roman[c] || c);
    const people = groups.get(c);
    const themes = [...new Set(people.map(p => p.theme).filter(Boolean))].slice(0, 3).join(' · ');
    const label = el('div', 'journey-label', `<small>SIGLO ${roman[c] || c}</small><strong>${people.length} ${people.length === 1 ? 'vida' : 'vidas'}</strong><em>${esc(themes)}</em>`);
    world.append(numeral, label);
    items.push({ node: numeral, gate: i, x: 0, y: 0, z: -260 }, { node: label, gate: i, x: 0, y: 0, z: 0 });
    const plaques = people.map(p => {
      const a = el('a', 'journey-plaque', `<span>${esc(p.theme)}</span><strong>${esc(p.name)}</strong><em>${esc(p.years)}</em>`);
      a.href = p.href; a.tabIndex = -1;
      world.append(a);
      const it = { node: a, gate: i, x: 0, y: 0, z: 0, plaque: true };
      items.push(it);
      return it;
    });
    return { plaques, z: gz };
  });

  const intro = el('div', 'journey-intro', 'BAJA PARA VIAJAR POR CINCO SIGLOS DE FE');
  const skip = el('a', 'journey-skip', 'Ir a la colección ↓');
  skip.href = '#historias'; skip.tabIndex = -1;
  const hud = el('div', 'journey-hud');
  const dots = centuries.map((c, i) => {
    const b = el('button', '', roman[c] || c);
    b.type = 'button'; b.tabIndex = -1;
    b.addEventListener('click', () => scrollTo({ top: scrollForGate(i), behavior: 'smooth' }));
    hud.append(b);
    return b;
  });
  stage.append(world, intro, skip, hud);
  section.append(stage);
  anchor.after(section);

  /* Ubica las placas alrededor del portal: a los lados en pantallas anchas,
     arriba y abajo del rótulo en celulares. Cada una a una profundidad distinta. */
  function layout() {
    const wide = innerWidth > 760;
    gates.forEach(({ plaques }) => {
      plaques.forEach((p, j) => {
        const side = j % 2 ? 1 : -1;
        const row = Math.floor(j / 2);
        if (wide) {
          p.x = side * (innerWidth * 0.29 + (row % 2) * 50);
          p.y = (row - (Math.ceil(plaques.length / 2) - 1) / 2) * 160;
        } else {
          p.x = side * innerWidth * 0.08;
          p.y = side * Math.min(innerHeight * 0.17 + row * innerHeight * 0.12, innerHeight * 0.36);
        }
        p.z = wide ? 220 - j * 110 : 40 - j * 120;
        /* Compensa la perspectiva (900px): las placas más lejanas se abren
           más para que en pantalla no se monten sobre las cercanas. */
        const k = wide ? 1 : (900 - p.z) / 900;
        p.x *= k; p.y *= k;
      });
    });
  }

  const travelTotal = (centuries.length - 1) * GAP + 900;
  const START = -650;
  function scrollRange() {
    const top = section.getBoundingClientRect().top + scrollY;
    return { top, len: section.offsetHeight - innerHeight };
  }
  function scrollForGate(i) {
    const { top, len } = scrollRange();
    return top + ((i * GAP - START - 300) / travelTotal) * len;
  }

  let raf = 0, cam = START, target = START;
  function measure() {
    const { top, len } = scrollRange();
    const p = Math.max(0, Math.min(1, (scrollY - top) / len));
    target = START + p * travelTotal;
    intro.style.opacity = p < 0.04 ? '1' : '0';
  }
  /* Opacidad según la distancia a la cámara: nítido cerca, tenue a lo lejos,
     desaparece al pasar a su lado. Solo un siglo queda nítido a la vez. */
  function alpha(ez) {
    if (ez > 330) return 0;
    if (ez > 90) return 1 - (ez - 90) / 240;
    if (ez > -650) return 1;
    if (ez > -1700) return ((ez + 1700) / 1050) * 0.22;
    return 0;
  }
  function render() {
    cam += (target - cam) * 0.12;
    let current = 0, best = Infinity;
    gates.forEach((g, i) => {
      const dist = Math.abs(g.z + cam + 300);
      if (dist < best) { best = dist; current = i; }
    });
    for (const it of items) {
      const ez = gates[it.gate].z + cam + it.z;
      const o = alpha(ez);
      const n = it.node.style;
      n.opacity = o.toFixed(3);
      n.visibility = o < 0.01 ? 'hidden' : 'visible';
      if (o >= 0.01) n.transform = `translate(-50%,-50%) translate3d(${it.x}px,${it.y}px,${ez.toFixed(1)}px)`;
      if (it.plaque) n.pointerEvents = o > 0.6 ? 'auto' : 'none';
    }
    for (const d of dust) {
      /* Tres capas de polvo que se repiten: la sensación de avanzar no se acaba. */
      const z = ((d.base + cam) % 4400 + 4400) % 4400 - 3800;
      d.node.style.transform = `translate3d(-50%,-50%,${z.toFixed(1)}px)`;
      d.node.style.opacity = (z > 300 ? Math.max(0, 1 - (z - 300) / 300) : Math.min(1, (z + 3800) / 1200)) * 0.5;
    }
    dots.forEach((d, i) => d.setAttribute('aria-current', String(i === current)));
    raf = Math.abs(target - cam) > 0.5 ? requestAnimationFrame(render) : 0;
  }
  function onScroll() { measure(); if (!raf) raf = requestAnimationFrame(render); }
  layout();
  measure(); cam = target; render();
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => { layout(); onScroll(); }, { passive: true });
})();
