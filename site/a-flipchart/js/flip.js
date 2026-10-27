/* Flipchart: as folhas viram por cima da presilha ao rolar e a caneta desenha na folha que chega. */
(() => {
  'use strict';
  window.__flip = true;
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const sheets = Array.from(document.querySelectorAll('.sheet'));
  const binding = document.querySelector('.binding');
  const pad = document.querySelector('.pad');
  if (!sheets.length) return;

  // earlier sheets lie on top of later ones, like a real pad
  sheets.forEach((s, i) => { s.style.zIndex = String(sheets.length - i + 1); });

  /* ---- marker strokes draw on when a sheet arrives ---- */
  // each stroke's on-screen length (strokes are non-scaling, so dashes live in screen pixels)
  function screenLength(path) {
    const m = path.getScreenCTM();
    const total = path.getTotalLength();
    if (!m || !total) return 0;
    let len = 0, prev = null;
    const n = 48;
    for (let k = 0; k <= n; k++) {
      const pt = path.getPointAtLength((total * k) / n);
      const x = m.a * pt.x + m.c * pt.y, y = m.b * pt.x + m.d * pt.y;
      if (prev) len += Math.hypot(x - prev[0], y - prev[1]);
      prev = [x, y];
    }
    return Math.ceil(len * 1.08) + 6;
  }
  function measureInk(scope) {
    scope.querySelectorAll('.ink path').forEach((p) => p.style.setProperty('--len', String(screenLength(p))));
  }
  const draw = (s) => {
    if (s.classList.contains('is-drawn')) return;
    measureInk(s);
    void s.offsetWidth; // commit the hidden state before drawing
    s.classList.add('is-drawn');
    setTimeout(() => s.classList.add('is-done'), 2800);
  };
  const drawAll = () => sheets.forEach((s) => s.classList.add('is-drawn', 'is-done'));
  if (!root.classList.contains('motion') || !('IntersectionObserver' in window)) {
    drawAll();
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { draw(e.target); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -28% 0px', threshold: 0 });
    sheets.forEach((s) => io.observe(s));
  }
  reduce.addEventListener?.('change', () => { if (reduce.matches) { root.classList.remove('motion'); drawAll(); reset(); } });

  /* ---- sheets flip up over the binding ---- */
  let tops = [], heights = [], B = 52, vh = 800, ticking = false;

  function measure() {
    B = binding ? binding.offsetHeight : 52;
    vh = window.innerHeight;
    const padTop = pad.getBoundingClientRect().top + window.scrollY;
    sheets.forEach((s, i) => { tops[i] = padTop + s.offsetTop; heights[i] = s.offsetHeight; });
  }

  function reset() {
    sheets.forEach((s) => {
      s.style.transform = ''; s.style.transformOrigin = '';
      s.style.removeProperty('--shade'); s.classList.remove('is-flipping');
      s._flip = false;
    });
  }

  function update() {
    ticking = false;
    if (reduce.matches || root.dataset.flip === 'off') { reset(); return; }
    const y = window.scrollY;
    const start = B + vh * 0.58;   // the sheet's lower edge starts lifting here…
    const end = B + 2;             // …and is fully over the binding here
    for (let i = 0; i < sheets.length - 1; i++) {
      const s = sheets[i];
      const top = tops[i] - y;
      const bottom = top + heights[i];
      let p = (start - bottom) / (start - end);
      if (p <= 0) { if (s._flip) { s.style.transform = ''; s.style.removeProperty('--shade'); s.classList.remove('is-flipping'); s._flip = false; } continue; }
      if (p > 1) p = 1;
      const eased = Math.pow(p, 0.9);             // the lift is visible from the first pixels
      const angle = eased * 90;
      s._flip = true;
      s.classList.toggle('is-flipping', p < 1);
      s.style.transformOrigin = `50% ${(B - top).toFixed(1)}px`;
      s.style.transform = `perspective(1500px) rotateX(${angle.toFixed(2)}deg)`;
      s.style.setProperty('--shade', (eased * 0.75).toFixed(3));
    }
  }

  const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  const remeasure = () => { measure(); request(); };

  measure(); update();
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', remeasure);
  window.addEventListener('load', remeasure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);
  if ('ResizeObserver' in window) new ResizeObserver(remeasure).observe(pad);
  document.querySelectorAll('.faq details').forEach((d) => d.addEventListener('toggle', remeasure));
})();
