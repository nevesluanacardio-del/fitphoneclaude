/* Diagnóstico do Gargalo Oculto — lógica de fluxo, pontuação e renderização. */
(function () {
  'use strict';

  // ====== CONFIGURAÇÃO QUE VOCÊ PODE EDITAR ======
  // Link de destino do CTA (mentoria / agendamento). Troque pelo seu.
  var CTA_URL = 'https://wa.me/5500000000000?text=Quero%20destravar%20meu%20gargalo';
  var CTA_BUTTON = 'Quero destravar meu gargalo';

  // Captura de leads: endpoint que recebe os dados (Make, Zapier, n8n, sua API...).
  // Recebe um POST JSON com { nome, email, celular, gargalo, pontuacoes, data }.
  // Deixe '' (vazio) para apenas salvar localmente, sem enviar para fora.
  var WEBHOOK_URL = '';
  // ===============================================

  var STORAGE_KEY = 'gargalo_oculto_v1';

  var screenEl = document.getElementById('screen');
  var topbar = document.getElementById('topbar');
  var stepLabel = document.getElementById('stepLabel');
  var progressBar = document.getElementById('progressBar');

  // Estado: respostas[dimId][index] = optionId
  var state = loadState();

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return { answers: {}, step: 0 };
  }
  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  // ---------- Navegação ----------
  // step 0 = intro, 1..N = dimensões, N+1 = captura de lead, N+2 = resultado
  var TOTAL_DIMS = DIMENSIONS.length;
  var LEAD_STEP = TOTAL_DIMS + 1;
  var RESULT_STEP = TOTAL_DIMS + 2;

  function go(step) {
    state.step = step;
    saveState();
    render();
    window.scrollTo({ top: 0, behavior: 'instant' in document ? 'auto' : 'auto' });
    window.scrollTo(0, 0);
  }

  function render() {
    var step = state.step;
    if (step <= 0) return renderIntro();
    if (step <= TOTAL_DIMS) return renderDimension(step - 1);
    if (step === LEAD_STEP) return renderLead();
    // Garante que o resultado só apareça com o lead capturado.
    if (!state.lead) return renderLead();
    return renderResult();
  }

  function updateTopbar(step) {
    if (step < 1 || step > TOTAL_DIMS) { topbar.hidden = true; return; }
    topbar.hidden = false;
    stepLabel.textContent = 'Etapa ' + step + ' de ' + TOTAL_DIMS;
    progressBar.style.width = (step / TOTAL_DIMS) * 100 + '%';
  }

  // ---------- Telas ----------
  function renderIntro() {
    updateTopbar(0);
    var resumed = countAnswered() > 0;
    screenEl.innerHTML =
      '<section class="hero">' +
        '<span class="hero__tag">Diagnóstico • 60 minutos</span>' +
        '<h1 class="hero__title">Descubra o Gargalo Oculto que travou seu faturamento</h1>' +
        '<p class="hero__sub">O mapa que revela, em 4 dimensões, exatamente <b>por que</b> seu negócio parou de crescer.</p>' +
        '<ul class="hero__bullets">' +
          '<li>30 perguntas objetivas — você só marca o que existe hoje.</li>' +
          '<li>Resultado visual em gráfico radar das 4 áreas do negócio.</li>' +
          '<li>Leitura automática apontando o seu gargalo nº 1.</li>' +
        '</ul>' +
      '</section>' +
      '<div class="actions" style="grid-template-columns:1fr">' +
        '<button class="btn btn--primary" id="startBtn">' +
          (resumed ? 'Continuar diagnóstico' : 'Começar diagnóstico') +
        '</button>' +
      '</div>' +
      (resumed ? '<button class="linkbtn" id="resetBtn" style="margin:6px auto 0">Recomeçar do zero</button>' : '');

    document.getElementById('startBtn').onclick = function () {
      go(resumed ? Math.min(state.step || 1, TOTAL_DIMS) || 1 : 1);
    };
    var rb = document.getElementById('resetBtn');
    if (rb) rb.onclick = function () { state = { answers: {}, step: 0 }; saveState(); render(); };
  }

  function renderDimension(dimIndex) {
    updateTopbar(dimIndex + 1);
    var dim = DIMENSIONS[dimIndex];
    state.answers[dim.id] = state.answers[dim.id] || {};
    var saved = state.answers[dim.id];

    var qHtml = dim.questions.map(function (q, i) {
      var opts = ANSWER_OPTIONS.map(function (o) {
        var on = saved[i] === o.id ? ' is-on' : '';
        return (
          '<label class="opt opt--' + o.id + on + '" data-q="' + i + '" data-opt="' + o.id + '">' +
            '<input type="radio" name="' + dim.id + '_' + i + '" ' + (saved[i] === o.id ? 'checked' : '') + '>' +
            '<span class="opt__dot"></span>' +
            '<span>' + esc(o.label) + '</span>' +
          '</label>'
        );
      }).join('');
      return (
        '<div class="qcard">' +
          '<p class="qcard__text">' + (i + 1) + '. ' + esc(q) + '</p>' +
          '<div class="opts">' + opts + '</div>' +
        '</div>'
      );
    }).join('');

    var isLast = dimIndex === TOTAL_DIMS - 1;
    screenEl.innerHTML =
      '<div class="step__header">' +
        '<div class="step__kicker">Dimensão ' + (dimIndex + 1) + '/' + TOTAL_DIMS + '</div>' +
        '<h2 class="step__title">' + esc(dim.name) + '</h2>' +
        '<p class="step__intro">' + esc(dim.intro) + '</p>' +
      '</div>' +
      '<div class="qlist">' + qHtml + '</div>' +
      '<div class="actions">' +
        '<button class="btn btn--ghost" id="backBtn">Voltar</button>' +
        '<button class="btn btn--primary" id="nextBtn" disabled>' +
          (isLast ? 'Quase lá — ver resultado →' : 'Próxima dimensão →') +
        '</button>' +
      '</div>';

    // Marcação das opções
    Array.prototype.forEach.call(screenEl.querySelectorAll('.opt'), function (label) {
      label.addEventListener('click', function () {
        var qi = label.getAttribute('data-q');
        var optId = label.getAttribute('data-opt');
        saved[qi] = optId;
        saveState();
        // atualiza visual do grupo
        var group = label.parentElement.querySelectorAll('.opt');
        Array.prototype.forEach.call(group, function (el) { el.classList.remove('is-on'); });
        label.classList.add('is-on');
        refreshNext();
      });
    });

    function allAnswered() {
      return dim.questions.every(function (_, i) { return saved[i]; });
    }
    function refreshNext() {
      document.getElementById('nextBtn').disabled = !allAnswered();
    }
    refreshNext();

    document.getElementById('backBtn').onclick = function () { go(dimIndex); }; // step-1
    document.getElementById('nextBtn').onclick = function () {
      if (!allAnswered()) return;
      go(dimIndex + 2); // próxima dimensão ou resultado
    };
  }

  // ---------- Captura de lead ----------
  function renderLead() {
    updateTopbar(LEAD_STEP);
    var saved = state.lead || {};
    screenEl.innerHTML =
      '<div class="step__header">' +
        '<div class="step__kicker">Último passo</div>' +
        '<h2 class="step__title">Seu diagnóstico está pronto 🔓</h2>' +
        '<p class="step__intro">Preencha os dados abaixo para liberar o seu mapa do gargalo oculto e receber uma cópia.</p>' +
      '</div>' +
      '<form class="leadform" id="leadForm" novalidate>' +
        '<label class="field">' +
          '<span class="field__label">Nome</span>' +
          '<input class="field__input" id="lf_nome" type="text" name="nome" autocomplete="name" ' +
            'placeholder="Seu nome completo" value="' + esc(saved.nome || '') + '" required>' +
          '<span class="field__err" data-for="nome"></span>' +
        '</label>' +
        '<label class="field">' +
          '<span class="field__label">E-mail</span>' +
          '<input class="field__input" id="lf_email" type="email" name="email" autocomplete="email" ' +
            'inputmode="email" placeholder="voce@email.com" value="' + esc(saved.email || '') + '" required>' +
          '<span class="field__err" data-for="email"></span>' +
        '</label>' +
        '<label class="field">' +
          '<span class="field__label">Celular / WhatsApp</span>' +
          '<input class="field__input" id="lf_celular" type="tel" name="celular" autocomplete="tel" ' +
            'inputmode="numeric" placeholder="(11) 99999-9999" value="' + esc(saved.celular || '') + '" required>' +
          '<span class="field__err" data-for="celular"></span>' +
        '</label>' +
        '<p class="leadform__privacy">🔒 Seus dados estão seguros. Usamos apenas para enviar seu diagnóstico e conteúdos relacionados.</p>' +
        '<div class="actions">' +
          '<button class="btn btn--ghost" id="backBtn" type="button">Voltar</button>' +
          '<button class="btn btn--primary" id="submitBtn" type="submit">Liberar meu diagnóstico →</button>' +
        '</div>' +
      '</form>';

    document.getElementById('backBtn').onclick = function () { go(TOTAL_DIMS); };

    var form = document.getElementById('leadForm');
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var nome = document.getElementById('lf_nome').value.trim();
      var email = document.getElementById('lf_email').value.trim();
      var celular = document.getElementById('lf_celular').value.trim();

      clearErrors();
      var ok = true;
      if (nome.length < 2) { ok = false; setError('nome', 'Informe seu nome.'); }
      if (!isValidEmail(email)) { ok = false; setError('email', 'Informe um e-mail válido.'); }
      if (digits(celular).length < 10) { ok = false; setError('celular', 'Informe um celular válido com DDD.'); }
      if (!ok) return;

      state.lead = { nome: nome, email: email, celular: celular, capturadoEm: new Date().toISOString() };
      saveState();
      submitLead(state.lead);
      go(RESULT_STEP);
    });

    // Máscara simples de celular brasileiro
    var cel = document.getElementById('lf_celular');
    cel.addEventListener('input', function () {
      cel.value = maskPhone(cel.value);
    });
  }

  function clearErrors() {
    Array.prototype.forEach.call(screenEl.querySelectorAll('.field__err'), function (e) { e.textContent = ''; });
    Array.prototype.forEach.call(screenEl.querySelectorAll('.field__input'), function (e) { e.classList.remove('is-invalid'); });
  }
  function setError(name, msg) {
    var err = screenEl.querySelector('.field__err[data-for="' + name + '"]');
    if (err) err.textContent = msg;
    var input = screenEl.querySelector('#lf_' + name);
    if (input) input.classList.add('is-invalid');
  }
  function isValidEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }
  function digits(v) { return String(v).replace(/\D/g, ''); }
  function maskPhone(v) {
    var d = digits(v).slice(0, 11);
    if (d.length <= 2) return d.length ? '(' + d : d;
    if (d.length <= 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
    if (d.length <= 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
    return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
  }

  // Envia o lead para o webhook (se configurado) junto do resultado do diagnóstico.
  function submitLead(lead) {
    if (!WEBHOOK_URL) return;
    var scores = DIMENSIONS.map(function (d) { return { dimensao: d.name, pontuacao: scoreFor(d) }; });
    var bottleneck = scores.slice().sort(function (a, b) { return a.pontuacao - b.pontuacao; })[0];
    var payload = {
      nome: lead.nome,
      email: lead.email,
      celular: lead.celular,
      gargalo: bottleneck ? bottleneck.dimensao : null,
      pontuacoes: scores,
      data: lead.capturadoEm,
    };
    try {
      fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(function () {});
    } catch (e) {}
  }

  // ---------- Pontuação ----------
  function scoreFor(dim) {
    var ans = state.answers[dim.id] || {};
    var max = dim.questions.length * dim.weight;
    var got = 0;
    dim.questions.forEach(function (_, i) {
      var opt = ANSWER_OPTIONS.filter(function (o) { return o.id === ans[i]; })[0];
      if (opt) got += dim.weight * opt.factor;
    });
    return Math.round((got / max) * 100); // % (0-100), já que cada dimensão tem max 100
  }

  function countAnswered() {
    var n = 0;
    DIMENSIONS.forEach(function (d) {
      var a = state.answers[d.id] || {};
      d.questions.forEach(function (_, i) { if (a[i]) n++; });
    });
    return n;
  }

  // ---------- Resultado ----------
  function renderResult() {
    updateTopbar(RESULT_STEP);
    var scores = DIMENSIONS.map(function (d) {
      return { dim: d, score: scoreFor(d) };
    });

    // Gargalo = menor pontuação (desempate: ordem das dimensões)
    var bottleneck = scores.slice().sort(function (a, b) { return a.score - b.score; })[0];
    var avg = Math.round(scores.reduce(function (s, x) { return s + x.score; }, 0) / scores.length);
    var band = MATURITY_BANDS.filter(function (b) { return avg < b.max; })[0] || MATURITY_BANDS[MATURITY_BANDS.length - 1];

    var legend = scores.map(function (s) {
      return (
        '<div><span><span class="dot" style="background:' + s.dim.color + '"></span>' +
        esc(s.dim.name) + '</span><b>' + s.score + '%</b></div>'
      );
    }).join('');

    var bn = bottleneck.dim.bottleneck;
    var symptoms = bn.sintomas.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('');

    screenEl.innerHTML =
      '<div class="result__head">' +
        '<div class="result__eyebrow">Seu diagnóstico está pronto</div>' +
        '<h2 class="result__title">O mapa do seu negócio hoje</h2>' +
      '</div>' +

      '<div class="radar-wrap">' +
        buildRadar(scores) +
        '<div class="radar-legend">' + legend + '</div>' +
      '</div>' +

      '<div class="maturity">' +
        '<div class="maturity__row">' +
          '<span class="maturity__label">Maturidade geral</span>' +
          '<span class="maturity__score">média ' + avg + '%</span>' +
        '</div>' +
        '<div class="maturity__band">' + esc(band.label) + '</div>' +
        '<p class="maturity__text">' + esc(band.resumo) + '</p>' +
      '</div>' +

      '<div class="bottleneck">' +
        '<div class="bottleneck__label">⛔ Gargalo oculto identificado — ' + bottleneck.score + '%</div>' +
        '<h3 class="bottleneck__title">' + esc(bn.titulo) + '</h3>' +
        '<p class="bottleneck__text">' + esc(bn.diagnostico) + '</p>' +
        '<ul class="bottleneck__sym">' + symptoms + '</ul>' +
      '</div>' +

      '<div class="cta">' +
        '<p class="cta__q">Agora você sabe ONDE travou.<br>A próxima pergunta vale seu próximo salto: <b>como destravar?</b></p>' +
        '<p class="cta__sub">Esse diagnóstico mostra o gargalo. O plano de ação para resolvê-lo é o passo seguinte.</p>' +
        '<a class="btn btn--primary" id="ctaBtn" href="' + esc(CTA_URL) + '" target="_blank" rel="noopener">' + esc(CTA_BUTTON) + '</a>' +
        '<p class="cta__note">Leva menos de 1 minuto para dar o próximo passo.</p>' +
      '</div>' +

      '<button class="linkbtn" id="restartBtn" style="margin:0 auto">Refazer diagnóstico</button>' +
      '<p class="footnote">Diagnóstico de maturidade do negócio • 4 dimensões • 30 pontos de checagem</p>';

    document.getElementById('restartBtn').onclick = function () {
      state = { answers: {}, step: 0 };
      saveState();
      go(0);
    };
  }

  // ---------- Radar em SVG ----------
  function buildRadar(scores) {
    var size = 320, cx = size / 2, cy = size / 2, R = 120;
    var n = scores.length;
    var rings = [0.25, 0.5, 0.75, 1];

    function point(i, r) {
      var ang = (Math.PI * 2 * i) / n - Math.PI / 2;
      return [cx + Math.cos(ang) * R * r, cy + Math.sin(ang) * R * r];
    }

    var gridPolys = rings.map(function (r) {
      var pts = scores.map(function (_, i) { return point(i, r).join(','); }).join(' ');
      return '<polygon points="' + pts + '" fill="none" stroke="#26324f" stroke-width="1"/>';
    }).join('');

    var spokes = scores.map(function (_, i) {
      var p = point(i, 1);
      return '<line x1="' + cx + '" y1="' + cy + '" x2="' + p[0] + '" y2="' + p[1] + '" stroke="#26324f" stroke-width="1"/>';
    }).join('');

    var dataPts = scores.map(function (s, i) { return point(i, s.score / 100).join(','); }).join(' ');
    var dataPoly = '<polygon points="' + dataPts + '" fill="rgba(245,158,11,0.28)" stroke="#f59e0b" stroke-width="2.5" stroke-linejoin="round"/>';

    var dots = scores.map(function (s, i) {
      var p = point(i, s.score / 100);
      return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="4" fill="' + s.dim.color + '"/>';
    }).join('');

    var labels = scores.map(function (s, i) {
      var p = point(i, 1.18);
      var anchor = Math.abs(p[0] - cx) < 8 ? 'middle' : (p[0] > cx ? 'start' : 'end');
      return '<text x="' + p[0] + '" y="' + (p[1] + 4) + '" fill="#9aa7c4" font-size="12" font-weight="700" text-anchor="' + anchor + '">' + esc(shortName(s.dim.name)) + '</text>';
    }).join('');

    return (
      '<svg viewBox="0 0 ' + size + ' ' + size + '" role="img" aria-label="Gráfico radar das 4 dimensões">' +
        gridPolys + spokes + dataPoly + dots + labels +
      '</svg>'
    );
  }

  function shortName(name) {
    return name === 'Sistema de Gestão' ? 'Gestão' : name;
  }

  // ---------- Boot ----------
  render();
})();
