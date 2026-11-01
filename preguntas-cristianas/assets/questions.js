(() => {
  'use strict';
  const input = document.getElementById('q-search');
  if (!input) return;
  const cards = [...document.querySelectorAll('[data-question]')];
  const buttons = [...document.querySelectorAll('[data-filter]')];
  let topic = 'all';
  const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const apply = () => {
    const terms = normalize(input.value).trim().split(/\s+/).filter(Boolean);
    let count = 0;
    for (const card of cards) {
      const content = normalize(card.dataset.search);
      const words = content.split(/[^a-z0-9]+/);
      const visible = (topic === 'all' || card.dataset.topic === topic) && terms.every(term => term.length <= 2 ? words.includes(term) : content.includes(term));
      card.hidden = !visible;
      if (visible) count++;
    }
    // Bilingüe: el contador se escribe en los dos idiomas (pie.css muestra el elegido).
    document.getElementById('q-count').innerHTML = `<span data-idioma="es">${count} ${count === 1 ? 'respuesta para leer' : 'respuestas para leer'}</span><span data-idioma="en" lang="en">${count} ${count === 1 ? 'answer to read' : 'answers to read'}</span>`;
    document.getElementById('q-empty').hidden = count !== 0;
  };
  input.addEventListener('input', apply);
  buttons.forEach(button => button.addEventListener('click', () => {
    topic = button.dataset.filter;
    buttons.forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    apply();
  }));
  document.getElementById('q-controls').hidden = false;
})();
