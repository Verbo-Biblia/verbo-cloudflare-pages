/* Capa de profundidad de Verbo (ver depth.css).
   Uso: <script src="/assets/depth/depth.js" defer
          data-enter=".selector, ..."   bloques que entran en perspectiva
          data-through=".selector"      héroes que se atraviesan al bajar
          data-fly=".selector"         imágenes en las que se "entra" al bajar
          data-tilt=".selector, ..."    tarjetas que se inclinan con el mouse
          data-progress                 línea de lectura (artículos)
          data-sky="0.6"></script>      intensidad del campo de luz (0 = sin campo)
   Dentro de la app Android (iframe con ?verboEmbed=app) corre en modo
   liviano: menos luces y resolución 1x. Con "reducir movimiento" no hace nada. El campo de luz solo se dibuja mientras hay scroll:
   en reposo no gasta CPU ni batería. */
(() => {
  'use strict';
  const script = document.currentScript;
  const opts = script ? script.dataset : {};
  let embedded = new URLSearchParams(location.search).has('verboEmbed');
  try { embedded = embedded || window.self !== window.top; } catch (_) { embedded = true; }
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced.matches) return;

  const root = document.documentElement;
  root.classList.add('depth-on');
  if (embedded) root.classList.add('depth-lite');
  const all = sel => (sel ? [...document.querySelectorAll(sel)] : []);
  all(opts.enter).forEach(el => el.classList.add('depth-enter'));
  all(opts.through).forEach(el => el.classList.add('depth-through'));
  all(opts.fly).forEach(el => el.classList.add('depth-fly'));

  /* Progreso de salida de cada héroe (--depth-p), medido sobre su sección. */
  const scrubbed = [...document.querySelectorAll('.depth-through,.depth-fly')]
    .map(el => ({ el, box: el.closest('section') || el }));
  if (scrubbed.length) {
    let pending = 0;
    const scrub = () => {
      pending = 0;
      for (const { el, box } of scrubbed) {
        const r = box.getBoundingClientRect();
        const p = Math.max(0, Math.min(1, -r.top / (r.height * 0.85)));
        el.style.setProperty('--depth-p', p.toFixed(4));
      }
    };
    addEventListener('scroll', () => { if (!pending) pending = requestAnimationFrame(scrub); }, { passive: true });
    addEventListener('resize', scrub, { passive: true });
    scrub();
  }

  /* ---------- Campo de luz: motas doradas en profundidad ---------- */
  const skyLevel = opts.sky === undefined ? 0.6 : Number(opts.sky);
  let draw = () => {};
  if (skyLevel > 0) {
    const canvas = document.createElement('canvas');
    canvas.className = 'depth-sky';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.prepend(canvas);
    const ctx = canvas.getContext('2d');
    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = 64;
    const sctx = sprite.getContext('2d');
    const g = sctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,240,205,1)');
    g.addColorStop(0.25, 'rgba(226,186,120,.75)');
    g.addColorStop(1, 'rgba(214,174,112,0)');
    sctx.fillStyle = g;
    sctx.fillRect(0, 0, 64, 64);

    let w = 0, h = 0, dpr = 1, motes = [];
    let travel = 0, target = 0, raf = 0;
    const rand = (a, b) => a + Math.random() * (b - a);
    function seed() {
      const count = Math.round(Math.min(embedded ? 60 : 150, (w * h) / (embedded ? 16000 : 11000)));
      motes = Array.from({ length: count }, () => ({
        x: rand(-1.6, 1.6), y: rand(-1.1, 1.1), z: Math.random(),
        r: rand(0.6, 1.8), a: rand(0.35, 1)
      }));
    }
    function resize() {
      dpr = embedded ? 1 : Math.min(devicePixelRatio || 1, 1.75);
      w = innerWidth; h = innerHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!motes.length) seed();
    }
    draw = () => {
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2, f = Math.min(w, h) * 0.55;
      for (const m of motes) {
        /* El scroll mueve la cámara hacia adelante: z baja y la mota se acerca. */
        let z = (m.z - travel) % 1; if (z <= 0) z += 1;
        const depth = 0.08 + z * 1.6;
        const sx = cx + (m.x / depth) * f, sy = cy + (m.y / depth) * f;
        if (sx < -40 || sx > w + 40 || sy < -40 || sy > h + 40) continue;
        const size = (m.r * 9) / depth;
        /* Aparece suave desde el fondo y se desvanece al pasar junto a la cámara. */
        const fade = Math.min(1, (1 - z) * 3) * Math.min(1, z * 6);
        /* Menos luz en la columna central, donde está el texto. */
        const side = Math.min(1, Math.abs(sx - cx) / (w * 0.45));
        ctx.globalAlpha = m.a * fade * skyLevel * (0.28 + 0.72 * side);
        ctx.drawImage(sprite, sx - size / 2, sy - size / 2, size, size);
      }
      ctx.globalAlpha = 1;
    };
    function frame() {
      travel += (target - travel) * 0.09;
      draw();
      raf = Math.abs(target - travel) > 0.0004 ? requestAnimationFrame(frame) : 0;
    }
    function onScroll() {
      target = scrollY / 2600;
      if (!raf) raf = requestAnimationFrame(frame);
    }
    resize();
    target = travel = scrollY / 2600;
    draw();
    addEventListener('resize', () => { resize(); draw(); }, { passive: true });
    addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Línea de lectura ---------- */
  if ('progress' in opts) {
    const bar = document.createElement('div');
    bar.className = 'depth-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.append(bar);
    let pending = 0;
    const update = () => {
      pending = 0;
      const max = root.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
    };
    addEventListener('scroll', () => { if (!pending) pending = requestAnimationFrame(update); }, { passive: true });
    update();
  }

  /* ---------- Inclinación de tarjetas ---------- */
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    all(opts.tilt).forEach(card => {
      card.classList.add('depth-tilt');
      if (getComputedStyle(card).position === 'static') card.style.position = 'relative';
      const glare = document.createElement('span');
      glare.className = 'depth-glare';
      glare.setAttribute('aria-hidden', 'true');
      card.append(glare);
      let frameId = 0, px = 0.5, py = 0.5;
      const apply = () => {
        frameId = 0;
        card.style.transform = `perspective(900px) rotateX(${(0.5 - py) * 7}deg) rotateY(${(px - 0.5) * 9}deg) translateZ(14px)`;
        card.style.setProperty('--gx', `${px * 100}%`);
        card.style.setProperty('--gy', `${py * 100}%`);
      };
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        px = (e.clientX - r.left) / r.width; py = (e.clientY - r.top) / r.height;
        card.classList.add('is-tilting');
        if (!frameId) frameId = requestAnimationFrame(apply);
      });
      card.addEventListener('pointerleave', () => {
        card.classList.remove('is-tilting');
        card.style.transform = '';
      });
    });
  }

  /* Si la persona activa "reducir movimiento" con la página abierta, se apaga todo. */
  reduced.addEventListener('change', () => { if (reduced.matches) location.reload(); });
  window.VerboDepth = { redraw: () => draw() };
})();
