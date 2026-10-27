(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;

  // Quebra títulos em palavras para a animação de subida
  document.querySelectorAll('.split').forEach(el => {
    const words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', el.textContent.trim());
    el.innerHTML = words.map((w, i) => `<span class="w" aria-hidden="true"><span style="--i:${i}">${w}</span></span>`).join(' ');
  });

  // Contadores
  const count = el => {
    const end = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0);
    const t0 = performance.now(), dur = 1600;
    const fmt = v => v.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    const step = now => {
      const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 4);
      el.textContent = fmt(end * e);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  if (!reduce && 'IntersectionObserver' in window) {
    root.classList.add('anim');
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const t = en.target;
        if (t.matches('figure')) t.classList.add('in-art'); else t.classList.add('in');
        t.querySelectorAll?.('[data-count]').forEach(count);
        io.unobserve(t);
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
    document.querySelectorAll('.split, .reveal, .part__art, .ideas__art, .hero__art, .steps').forEach(el => io.observe(el));
    // segurança: se algo não disparar, mostra tudo
    setTimeout(() => document.querySelectorAll('.split, .reveal').forEach(el => {
      if (el.getBoundingClientRect().top < innerHeight) el.classList.add('in');
    }), 2500);
  } else {
    document.querySelectorAll('.steps').forEach(s => s.classList.add('in'));
  }

  // Palavras que trocam na abertura
  const rot = [...document.querySelectorAll('.rot b')];
  if (rot.length) {
    let i = 0; rot[0].classList.add('on');
    if (!reduce) setInterval(() => {
      const cur = rot[i]; i = (i + 1) % rot.length; const nx = rot[i];
      cur.classList.remove('on'); cur.classList.add('out');
      nx.classList.remove('out'); nx.classList.add('on');
      setTimeout(() => cur.classList.remove('out'), 700);
    }, 2200);
  }

  // Inclinação das imagens seguindo o mouse + parallax no scroll
  if (!reduce && matchMedia('(pointer: fine)').matches) {
    const arts = [...document.querySelectorAll('[data-tilt]')];
    let mx = 0, my = 0, raf = 0;
    addEventListener('pointermove', e => {
      mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5;
      if (!raf) raf = requestAnimationFrame(apply);
    }, { passive: true });
    addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(apply); }, { passive: true });
    function apply() {
      raf = 0;
      arts.forEach(a => {
        const r = a.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        const off = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
        a.style.transform = `perspective(900px) translateY(${off * -40}px) rotateY(${mx * 14}deg) rotateX(${my * -10}deg)`;
      });
    }
  }
})();
