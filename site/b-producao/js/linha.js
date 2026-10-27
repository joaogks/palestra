/* Quadro de produção · João Signor
   1) Trilho: no desktop, a página rola e a ordem de serviço anda de coluna em coluna;
      ao chegar em ENTREGUE o carimbo cai.
   2) Celular: o carimbo cai quando a coluna ENTREGUE entra na tela.
   3) Formulário da OS: monta a mensagem e abre o WhatsApp. */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduz = window.matchMedia('(prefers-reduced-motion: reduce)');
  var telaGrande = window.matchMedia('(min-width: 901px) and (min-height: 620px)');

  var linha = document.querySelector('.linha');
  var colunas = Array.prototype.slice.call(document.querySelectorAll('.coluna'));
  var fichas = Array.prototype.slice.call(document.querySelectorAll('.ficha[data-ficha]'));
  var fichaFim = document.querySelector('.ficha--entrega');
  var statusNum = document.querySelector('[data-status-num]');
  var statusNome = document.querySelector('[data-status-nome]');
  var nomes = ['Entrada', 'Planejamento', 'Roteiro', 'Narração', 'Thumbnail', 'Entregue'];
  var ultimo = fichas.length - 1;

  /* ---------- 1. trilho ---------- */
  var passo = 0, ativo = false, pedido = false, iniciado = false;

  var alturas = [];
  function medir() {
    if (colunas.length > 1) passo = colunas[1].offsetLeft - colunas[0].offsetLeft;
    fichas.forEach(function (el) { el.style.height = ''; });
    alturas = fichas.map(function (el) { return el.offsetHeight; });
  }
  function suave(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }

  function desenhar() {
    pedido = false;
    if (!ativo) return;
    var total = linha.offsetHeight - linha.querySelector('.linha__palco').offsetHeight;
    var topo = linha.getBoundingClientRect().top - parseFloat(getComputedStyle(root).getPropertyValue('--placa-h') || 60);
    var p = total > 0 ? Math.max(0, Math.min(1, -topo / total)) : 1;
    var t = p * ultimo;
    var i = Math.floor(t), f = t - i;
    /* pausa em cada coluna: a ficha para, depois anda */
    var te = Math.min(ultimo, i + suave((f - 0.3) / 0.45));

    fichas.forEach(function (el, k) {
      var pos = Math.min(te, k);
      var dx = (pos - k) * passo;
      var naPilha = te < k;
      var fundo = naPilha ? k - Math.floor(te) - 1 : 0;
      var dy = fundo * 7;
      var giro = naPilha ? ((k % 2 ? 1 : -1) * (0.8 + fundo * 0.6)) + 'deg' : '';
      el.style.setProperty('--dx', dx.toFixed(1) + 'px');
      el.style.setProperty('--dy', dy + 'px');
      if (giro) el.style.setProperty('--rr', giro); else el.style.removeProperty('--rr');
      el.style.zIndex = String(20 - k);
      /* fichas no fundo da pilha: só a borda do papel aparece */
      var escondida = naPilha && fundo >= 1;
      el.classList.toggle('na-pilha', escondida);
      el.style.height = escondida ? (alturas[Math.min(ultimo, Math.floor(te) + 1)] || 0) + 'px' : '';
      colunas[k].classList.toggle('vaga', te < k - 0.5);
    });

    var etapa = Math.min(ultimo, Math.round(te));
    if (statusNum) statusNum.textContent = String(etapa + 1);
    if (statusNome) statusNome.textContent = nomes[etapa];
    if (fichaFim) {
      if (te >= ultimo - 0.001) fichaFim.classList.add('carimbado');
      else if (te < ultimo - 0.3) fichaFim.classList.remove('carimbado');
    }
  }
  function agendar() { if (!pedido) { pedido = true; requestAnimationFrame(desenhar); } }

  function limpar() {
    fichas.forEach(function (el) {
      el.style.removeProperty('--dx'); el.style.removeProperty('--dy'); el.style.removeProperty('--rr'); el.style.zIndex = '';
      el.style.height = ''; el.classList.remove('na-pilha');
    });
    colunas.forEach(function (c) { c.classList.remove('vaga'); });
  }

  function configurar() {
    var deve = !!linha && telaGrande.matches && !reduz.matches;
    if (deve === ativo && iniciado) { if (ativo) { medir(); agendar(); } return; }
    iniciado = true;
    ativo = deve;
    root.classList.toggle('trilho', ativo);
    if (ativo) {
      root.classList.remove('estampa');
      medir(); desenhar();
      window.addEventListener('scroll', agendar, { passive: true });
    } else {
      window.removeEventListener('scroll', agendar);
      limpar();
      if (fichaFim) fichaFim.classList.remove('carimbado');
      prepararEstampa();
    }
  }

  /* ---------- 2. celular: carimbo cai ao ver ENTREGUE ---------- */
  var observador = null;
  function prepararEstampa() {
    if (reduz.matches || !('IntersectionObserver' in window) || !fichaFim) { root.classList.remove('estampa'); return; }
    root.classList.add('estampa');
    if (observador) observador.disconnect();
    observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting && e.intersectionRatio > 0.6) { fichaFim.classList.add('carimbado'); observador.disconnect(); }
      });
    }, { threshold: [0, 0.6, 1] });
    observador.observe(fichaFim);
  }

  configurar();
  window.addEventListener('resize', configurar);
  if (telaGrande.addEventListener) { telaGrande.addEventListener('change', configurar); reduz.addEventListener('change', configurar); }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (ativo) { medir(); agendar(); } });

  /* ---------- 3. ordem de serviço → WhatsApp ---------- */
  var form = document.getElementById('form-os');
  if (!form) return;
  var FONE = '5545920005653';
  var caixaErros = document.getElementById('os-erros');
  var saida = document.getElementById('os-msg');
  var obrig = [
    { nome: 'nome', rotulo: '1 · Nome', msg: 'Escreva seu nome no campo 1.' },
    { nome: 'empresa', rotulo: '2 · Empresa', msg: 'Escreva o nome da empresa ou entidade no campo 2.' },
    { nome: 'formato', rotulo: '3 · Formato', msg: 'Marque um formato no campo 3 (pode ser “Ainda não sei”).' }
  ];

  function valor(nome) {
    var el = form.elements[nome];
    if (!el) return '';
    if (el.length !== undefined && !el.tagName) { /* RadioNodeList */
      for (var i = 0; i < el.length; i++) if (el[i].checked) return el[i].value;
      return '';
    }
    return (el.value || '').trim();
  }

  function mensagem() {
    var linhas = ['Olá, João! Quero abrir uma ordem de serviço.'];
    linhas.push('Nome: ' + (valor('nome') || '…'));
    linhas.push('Empresa: ' + (valor('empresa') || '…'));
    linhas.push('Formato: ' + (valor('formato') || '…'));
    if (valor('time')) linhas.push('Tamanho do time: ' + valor('time'));
    if (valor('obs')) linhas.push('Observação: ' + valor('obs'));
    return linhas.join('\n');
  }

  function atualizar() { if (saida) saida.textContent = mensagem(); }

  function marcar(campo, msg) {
    var bloco = form.querySelector('[data-campo="' + campo + '"]');
    var p = document.getElementById('e-' + campo);
    if (bloco) bloco.classList.toggle('tem-erro', !!msg);
    if (p) { p.textContent = msg || ''; p.hidden = !msg; }
    var el = form.elements[campo];
    if (el && el.tagName) el.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }

  form.addEventListener('input', function (e) {
    atualizar();
    var n = e.target && e.target.name;
    if (n && valor(n)) marcar(n, '');
  });
  form.addEventListener('change', atualizar);

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var faltam = [];
    obrig.forEach(function (c) {
      if (!valor(c.nome)) { faltam.push(c); marcar(c.nome, c.msg); } else marcar(c.nome, '');
    });
    if (faltam.length) {
      caixaErros.hidden = false;
      caixaErros.textContent = (faltam.length === 1 ? 'Falta preencher o campo ' : 'Faltam ' + faltam.length + ' campos: ') +
        faltam.map(function (c) { return c.rotulo; }).join(', ') + '.';
      var primeiro = form.elements[faltam[0].nome];
      var foco = primeiro && primeiro.tagName ? primeiro : (primeiro && primeiro[0]);
      if (foco) foco.focus();
      return;
    }
    caixaErros.hidden = true; caixaErros.textContent = '';
    var url = 'https://wa.me/' + FONE + '?text=' + encodeURIComponent(mensagem());
    var janela = window.open(url, '_blank');
    if (janela) { try { janela.opener = null; } catch (err) { /* ok */ } }
    else window.location.href = url;
    var os = form.parentNode; os.classList.remove('enviada'); void os.offsetWidth; os.classList.add('enviada');
  });

  atualizar();
})();
