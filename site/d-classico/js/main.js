// Versão D: header compacto + revelação única do pipeline do Genie.
(function () {
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  var root = document.documentElement;
  var pipeline = document.querySelector('[data-pipeline]');
  if (!pipeline || !root.classList.contains('js-motion')) return;

  var steps = pipeline.querySelectorAll('.step');
  pipeline.style.setProperty('--steps', steps.length);
  steps.forEach(function (step, i) { step.style.setProperty('--i', i); });

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        pipeline.classList.add('is-played');
        io.disconnect();
      }
    });
  }, { threshold: 0.35 });
  io.observe(pipeline);
})();
