(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const reveals = [...document.querySelectorAll('.reveal')];
  if (!reduced.matches && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.remove('pending');
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    reveals.forEach(el => { el.classList.add('pending'); observer.observe(el); });
  }
  const layers = [...document.querySelectorAll('[data-depth]')];
  let frame = 0;
  function update() {
    frame = 0;
    layers.forEach(el => {
      if (reduced.matches) { el.style.translate = ''; return; }
      const rect = el.parentElement.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > innerHeight) return;
      const offset = Math.max(-80, Math.min(80, -rect.top * Number(el.dataset.depth)));
      el.style.translate = `0 ${offset}px`;
    });
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(update); }
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule, { passive: true });
  reduced.addEventListener('change', () => {
    reveals.forEach(el => el.classList.remove('pending'));
    schedule();
  });
  schedule();
  document.getElementById('card-proyector')?.addEventListener('click', e => {
    if (matchMedia('(max-width:760px)').matches) {
      e.preventDefault(); location.href = '/proyector/remoto.html';
    }
  });
})();
