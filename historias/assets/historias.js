(function () {
  'use strict';
  const input = document.getElementById('story-search');
  const century = document.getElementById('story-century');
  if (!input || !century) return;
  const cards = Array.from(document.querySelectorAll('[data-story]'));
  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  function filter() {
    const words = normalize(input.value.trim()).split(/\s+/).filter(Boolean);
    let count = 0;
    cards.forEach(card => {
      const content = normalize(card.dataset.search);
      const matches = words.every(word => content.includes(word)) &&
        (century.value === 'all' || card.dataset.century === century.value);
      card.hidden = !matches;
      if (matches) count++;
    });
    document.getElementById('story-count').textContent = `${count} ${count === 1 ? 'historia disponible' : 'historias disponibles'}`;
    document.getElementById('story-empty').hidden = count !== 0;
  }
  input.addEventListener('input', filter);
  century.addEventListener('change', filter);
  document.getElementById('story-reset').addEventListener('click', () => {
    input.value = '';
    century.value = 'all';
    filter();
    input.focus();
  });
})();
