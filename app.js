/* ============================================================
   AI HUB — app.js  (JavaScript puro, sem dependências)
   ============================================================ */

const state = {
  data: null,
  models: [],
  categories: [],
  activeCategory: 'all',
  search: '',
  compare: [],          // ids selecionados (máx 3)
  wizard: { step: 0, answers: {} },
};

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const fmtInt = (n) => n.toLocaleString('pt-BR');
const fmtCtx = (n) => n >= 1000 ? `${(n / 1000).toFixed(0)}k` : `${n}`;
const fmtBRLish = (n) => `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
const escapeHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const badgeClass = (badge) => {
  const b = badge.toLowerCase();
  if (b.includes('value') || b.includes('compliance')) return 'value';
  if (b.includes('speed')) return 'speed';
  if (b.includes('open')) return 'open';
  return '';
};

/* ---------- Bootstrap ---------- */
async function init() {
  try {
    const res = await fetch('models-data.json');
    state.data = await res.json();
  } catch (e) {
    document.body.innerHTML = '<div style="padding:40px;color:#f87171">Falha ao carregar models-data.json. Rode via servidor local (ex.: <code>python3 -m http.server</code>).</div>';
    return;
  }
  state.models = state.data.models;
  state.categories = state.data.categories;
  state.benchmarks = state.data.benchmarks || [];
  state.benchmarkGroups = state.data.benchmarkGroups || [];
  state.guides = state.data.promptingGuides || [];
  state.generalTips = state.data.generalTips || [];

  renderHeroStats();
  renderPills();
  renderCatalog();
  renderWizard();
  renderComparator();
  renderBenchPills();
  renderBenchmarks();
  renderGovPills();
  renderGovernance();
  renderGuidelines();
  renderCalculator();
  bindGlobal();

  $('#disclaimer-text').textContent = state.data.meta.disclaimer;
}

function renderHeroStats() {
  $('#stat-models').textContent = state.models.length;
  $('#stat-providers').textContent = new Set(state.models.map(m => m.provider)).size;
  $('#stat-updated').textContent = new Date(state.data.meta.generatedAt)
    .toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

/* ---------- Pills ---------- */
function renderPills() {
  $('#pills').innerHTML = state.categories.map(c =>
    `<button class="pill ${c.id === state.activeCategory ? 'active' : ''}" data-cat="${c.id}">${c.label}</button>`
  ).join('');
  $$('#pills .pill').forEach(p => p.onclick = () => {
    state.activeCategory = p.dataset.cat;
    renderPills();
    renderCatalog();
  });
}

/* ---------- Catálogo ---------- */
function filteredModels() {
  const q = state.search.trim().toLowerCase();
  return state.models.filter(m => {
    const catOk = state.activeCategory === 'all' || m.categories.includes(state.activeCategory);
    const searchOk = !q ||
      [m.name, m.provider, m.badge, ...(m.categories || [])].join(' ').toLowerCase().includes(q) ||
      m.notes.toLowerCase().includes(q);
    return catOk && searchOk;
  });
}

function renderCatalog() {
  const list = filteredModels();
  const el = $('#cards');
  if (!list.length) {
    el.innerHTML = '<div class="empty-state">Nenhum modelo encontrado para esse filtro/busca.</div>';
    return;
  }
  el.innerHTML = list.map(cardHTML).join('');
  bindCardActions();
}

function cardHTML(m) {
  const inCompare = state.compare.includes(m.id);
  const verified = new Date(m.lastVerified).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  return `
  <div class="card" data-id="${m.id}">
    <div class="card-top">
      <div class="card-logo">${m.logo}</div>
      <div class="card-title">
        <h3>${m.name}</h3>
        <span class="provider">${m.provider}</span>
      </div>
      <span class="badge ${badgeClass(m.badge)}">${m.badge}</span>
    </div>

    <div class="elo-row">
      <span class="elo-badge">ELO ${m.elo}</span>
      <span class="chip-license ${m.license}">${m.license === 'open' ? 'Open-source' : 'Proprietário'}</span>
      <span class="verified" title="Fonte: ${m.source}"><span class="dot"></span>verif. ${verified}</span>
    </div>

    <div class="card-metrics">
      <div class="metric"><div class="label">Contexto</div><div class="val">${fmtCtx(m.context)}<small> tokens</small></div></div>
      <div class="metric"><div class="label">Preço /1M</div><div class="val">$${m.price.input}<small> in</small> · $${m.price.output}<small> out</small></div></div>
      <div class="metric"><div class="label">Latência (TTFT)</div><div class="val">${m.latencyTtftMs}<small> ms</small></div></div>
      <div class="metric"><div class="label">Throughput</div><div class="val">${m.throughputTps}<small> tok/s</small></div></div>
    </div>

    <div class="card-actions">
      <button class="btn ${inCompare ? 'added' : 'primary'}" data-action="compare" data-id="${m.id}">
        ${inCompare ? '✓ No comparador' : '+ Comparar'}
      </button>
      <button class="btn" data-action="metrics" data-id="${m.id}">Métricas</button>
    </div>
  </div>`;
}

function bindCardActions() {
  $$('#cards [data-action]').forEach(btn => btn.onclick = () => {
    const m = state.models.find(x => x.id === btn.dataset.id);
    if (btn.dataset.action === 'compare') toggleCompare(m.id);
    if (btn.dataset.action === 'metrics') openModal(m);
  });
}

/* ---------- Comparador ---------- */
function toggleCompare(id) {
  const i = state.compare.indexOf(id);
  if (i >= 0) state.compare.splice(i, 1);
  else {
    if (state.compare.length >= 3) {
      alert('Máximo de 3 modelos no comparador. Remova um antes de adicionar outro.');
      return;
    }
    state.compare.push(id);
  }
  renderCatalog();
  renderTray();
  renderComparator();
}

function renderTray() {
  const tray = $('#tray');
  if (!state.compare.length) { tray.classList.add('hidden'); return; }
  tray.classList.remove('hidden');
  $('#tray-chips').innerHTML = state.compare.map(id => {
    const m = state.models.find(x => x.id === id);
    return `<span class="tray-chip">${m.name}<button data-rm="${id}">×</button></span>`;
  }).join('');
  $$('#tray-chips [data-rm]').forEach(b => b.onclick = () => toggleCompare(b.dataset.rm));
}

const AXES = [
  { key: 'reasoning', label: 'Raciocínio' },
  { key: 'code', label: 'Código' },
  { key: 'knowledge', label: 'Conhecimento' },
  { key: 'speed', label: 'Velocidade' },
  { key: 'cost', label: 'Custo-benef.' },
];
const RADAR_COLORS = ['#7c8cff', '#52e5c9', '#ff7ac2'];

function renderComparator() {
  const el = $('#compare-content');
  const models = state.compare.map(id => state.models.find(m => m.id === id));

  if (models.length < 2) {
    el.innerHTML = `<div class="compare-empty">Selecione pelo menos 2 modelos no catálogo (botão “+ Comparar”) para ver a comparação lado a lado.</div>`;
    return;
  }

  const rows = [
    ['Provedor', m => m.provider],
    ['Licença', m => m.license === 'open' ? 'Open-source' : 'Proprietário'],
    ['Contexto', m => `${fmtInt(m.context)} tokens`, m => m.context, 'max'],
    ['Preço input /1M', m => `$${m.price.input}`, m => m.price.input, 'min'],
    ['Preço output /1M', m => `$${m.price.output}`, m => m.price.output, 'min'],
    ['Latência TTFT', m => `${m.latencyTtftMs} ms`, m => m.latencyTtftMs, 'min'],
    ['Throughput', m => `${m.throughputTps} tok/s`, m => m.throughputTps, 'max'],
    ['Arena ELO', m => m.elo, m => m.elo, 'max'],
    ['Governança', m => m.governance.regions],
  ];

  const tableRows = rows.map(([label, fmt, valFn, dir]) => {
    let bestIdx = -1;
    if (valFn) {
      const vals = models.map(valFn);
      const best = dir === 'min' ? Math.min(...vals) : Math.max(...vals);
      bestIdx = vals.indexOf(best);
    }
    const cells = models.map((m, i) =>
      `<td class="${i === bestIdx ? 'best' : ''}">${fmt(m)}</td>`).join('');
    return `<tr><td>${label}</td>${cells}</tr>`;
  }).join('');

  el.innerHTML = `
    <div class="compare-grid">
      <div>
        <table class="compare-table">
          <thead><tr><th>Métrica</th>${models.map(m => `<th>${m.name}</th>`).join('')}</tr></thead>
          <tbody>${tableRows}</tbody>
        </table>
      </div>
      <div class="radar-wrap">
        ${radarSVG(models)}
        <div class="radar-legend">
          ${models.map((m, i) => `<span class="lg"><span class="sw" style="background:${RADAR_COLORS[i]}"></span>${m.name}</span>`).join('')}
        </div>
      </div>
    </div>`;
}

/* Radar em SVG puro */
function radarSVG(models) {
  const size = 320, cx = size / 2, cy = size / 2, R = 120;
  const n = AXES.length;
  const angle = i => (Math.PI * 2 * i / n) - Math.PI / 2;
  const point = (i, r) => [cx + Math.cos(angle(i)) * r, cy + Math.sin(angle(i)) * r];

  // grades concêntricas
  let grid = '';
  for (let g = 1; g <= 4; g++) {
    const r = R * g / 4;
    const pts = AXES.map((_, i) => point(i, r).join(',')).join(' ');
    grid += `<polygon points="${pts}" fill="none" stroke="rgba(255,255,255,.08)" />`;
  }
  // eixos + labels
  let axes = '';
  AXES.forEach((ax, i) => {
    const [x, y] = point(i, R);
    const [lx, ly] = point(i, R + 22);
    axes += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="rgba(255,255,255,.08)" />`;
    axes += `<text x="${lx}" y="${ly}" fill="#aeb4c7" font-size="11" text-anchor="middle" dominant-baseline="middle">${ax.label}</text>`;
  });
  // polígonos dos modelos
  let polys = '';
  models.forEach((m, mi) => {
    const pts = AXES.map((ax, i) => point(i, R * (m.scores[ax.key] / 100)).join(',')).join(' ');
    const c = RADAR_COLORS[mi];
    polys += `<polygon points="${pts}" fill="${c}22" stroke="${c}" stroke-width="2" />`;
  });

  return `<svg viewBox="0 0 ${size} ${size}" width="100%" height="auto" style="max-width:340px;display:block;margin:0 auto">
    ${grid}${axes}${polys}
  </svg>`;
}

/* ---------- Wizard ---------- */
const WIZARD_QUESTIONS = [
  {
    key: 'goal', title: 'Qual é o objetivo principal?', sub: 'Isso define quais capacidades pesam mais.',
    options: [
      { val: 'chat', ico: '💬', title: 'Chatbot / Atendimento', desc: 'Conversa, suporte, FAQ' },
      { val: 'code', ico: '⌨️', title: 'Agente de código', desc: 'Geração e revisão de código' },
      { val: 'docs', ico: '📚', title: 'Documentos extensos', desc: 'RAG, análise de contexto longo' },
      { val: 'reason', ico: '🧠', title: 'Raciocínio complexo', desc: 'Análise, planejamento, math' },
    ],
  },
  {
    key: 'latency', title: 'Qual o requisito de latência?', sub: 'Tempo real penaliza modelos grandes.',
    options: [
      { val: 'realtime', ico: '⚡', title: 'Tempo real (< 1s)', desc: 'UX interativa, streaming' },
      { val: 'async', ico: '🕒', title: 'Assíncrono', desc: 'Batch, jobs em background' },
    ],
  },
  {
    key: 'privacy', title: 'Restrição de privacidade / hospedagem?', sub: 'Define cloud gerenciada vs. self-host.',
    options: [
      { val: 'cloud', ico: '☁️', title: 'Cloud gerenciada', desc: 'API do provedor, sem infra' },
      { val: 'onprem', ico: '🔒', title: 'Open-source / On-premise', desc: 'Dado sensível, controle total' },
    ],
  },
];

function renderWizard() {
  const w = $('#wizard');
  const step = state.wizard.step;

  if (step >= WIZARD_QUESTIONS.length) { renderWizardResult(); return; }

  const q = WIZARD_QUESTIONS[step];
  const selected = state.wizard.answers[q.key];
  w.innerHTML = `
    <div class="wizard-steps">
      ${WIZARD_QUESTIONS.map((_, i) => `<div class="wstep ${i <= step ? 'active' : ''}"></div>`).join('')}
    </div>
    <h3>${q.title}</h3>
    <div class="q-sub">${q.sub}</div>
    <div class="options">
      ${q.options.map(o => `
        <div class="option ${selected === o.val ? 'selected' : ''}" data-val="${o.val}">
          <div class="ico">${o.ico}</div>
          <b>${o.title}</b>
          <span>${o.desc}</span>
        </div>`).join('')}
    </div>
    <div class="wizard-nav">
      <button class="btn" ${step === 0 ? 'disabled style="opacity:.4"' : ''} data-w="back">← Voltar</button>
      <button class="btn primary" data-w="next" ${!selected ? 'disabled style="opacity:.4"' : ''}>
        ${step === WIZARD_QUESTIONS.length - 1 ? 'Ver recomendação →' : 'Próximo →'}
      </button>
    </div>`;

  $$('#wizard .option').forEach(o => o.onclick = () => {
    state.wizard.answers[q.key] = o.dataset.val;
    renderWizard();
  });
  $('#wizard [data-w="back"]').onclick = () => { if (step > 0) { state.wizard.step--; renderWizard(); } };
  $('#wizard [data-w="next"]').onclick = () => { if (selected) { state.wizard.step++; renderWizard(); } };
}

/* Algoritmo de recomendação: score ponderado por respostas */
function scoreForAnswers(m, a) {
  let s = 0;
  const S = m.scores;
  // objetivo
  if (a.goal === 'chat') s += S.speed * 0.9 + S.knowledge * 0.6 + S.cost * 0.6;
  if (a.goal === 'code') s += S.code * 1.4 + S.reasoning * 0.6;
  if (a.goal === 'docs') s += S.knowledge * 0.8 + (m.context / 1000000) * 40 + S.cost * 0.5;
  if (a.goal === 'reason') s += S.reasoning * 1.5 + S.code * 0.4;
  // latência
  if (a.latency === 'realtime') s += S.speed * 1.0 - (m.latencyTtftMs / 20);
  else s += S.reasoning * 0.3;
  // privacidade (hard filter feito fora)
  return s;
}

function recommend(a) {
  let pool = state.models.slice();
  if (a.privacy === 'onprem') pool = pool.filter(m => m.license === 'open');
  const ranked = pool
    .map(m => ({ m, s: scoreForAnswers(m, a) }))
    .sort((x, y) => y.s - x.s);
  const primary = ranked[0]?.m;
  // fallback econômico: melhor custo-benefício entre os top-5
  const fallback = ranked.slice(0, 5)
    .filter(r => r.m.id !== primary?.id)
    .sort((x, y) => (y.m.scores.cost - x.m.scores.cost))[0]?.m;
  return { primary, fallback };
}

function whyText(m, a) {
  const bits = [];
  if (a.goal === 'code') bits.push(`código ${m.scores.code}/100`);
  if (a.goal === 'reason') bits.push(`raciocínio ${m.scores.reasoning}/100`);
  if (a.goal === 'docs') bits.push(`contexto de ${fmtCtx(m.context)} tokens`);
  if (a.goal === 'chat') bits.push(`latência ${m.latencyTtftMs}ms`);
  if (a.latency === 'realtime') bits.push(`${m.throughputTps} tok/s`);
  if (a.privacy === 'onprem') bits.push('pesos abertos p/ on-premise');
  bits.push(`~$${m.price.output}/1M output`);
  return bits.join(' · ');
}

function renderWizardResult() {
  const a = state.wizard.answers;
  const { primary, fallback } = recommend(a);
  const w = $('#wizard');
  w.innerHTML = `
    <div class="wizard-steps">${WIZARD_QUESTIONS.map(() => `<div class="wstep active"></div>`).join('')}</div>
    <h3>Sua shortlist recomendada</h3>
    <div class="q-sub">Baseado em: objetivo <b>${a.goal}</b> · latência <b>${a.latency}</b> · hospedagem <b>${a.privacy}</b>. Recomendação orientada por dados — valide no comparador.</div>
    <div class="result-cards">
      <div class="rec-card primary">
        <span class="rec-label">★ Principal</span>
        <h4>${primary.name}</h4>
        <span class="provider" style="color:var(--text-2)">${primary.provider} · ELO ${primary.elo}</span>
        <div class="why">${whyText(primary, a)}</div>
      </div>
      ${fallback ? `
      <div class="rec-card">
        <span class="rec-label">💰 Alternativa econômica</span>
        <h4>${fallback.name}</h4>
        <span class="provider" style="color:var(--text-2)">${fallback.provider} · ELO ${fallback.elo}</span>
        <div class="why">${whyText(fallback, a)}</div>
      </div>` : ''}
    </div>
    <div class="wizard-nav">
      <button class="btn" data-w="restart">↺ Recomeçar</button>
      <button class="btn primary" data-w="compare">Comparar essas opções →</button>
    </div>`;

  $('#wizard [data-w="restart"]').onclick = () => {
    state.wizard = { step: 0, answers: {} };
    renderWizard();
  };
  $('#wizard [data-w="compare"]').onclick = () => {
    state.compare = [primary.id, fallback?.id].filter(Boolean);
    renderCatalog(); renderTray(); renderComparator();
    goTo('compare');
  };
}

/* ---------- Benchmarks (guia) ---------- */
state.activeBenchGroup = 'all';

// Rankeia modelos segundo o critério do benchmark (rankBy).
function topModels(rankBy, n = 3) {
  let pool = state.models.slice();
  let key, asc = false;
  if (rankBy.startsWith('score:')) key = m => m.scores[rankBy.split(':')[1]];
  else if (rankBy === 'elo') key = m => m.elo;
  else if (rankBy === 'context') key = m => m.context;
  else if (rankBy === 'ttft') { key = m => m.latencyTtftMs; asc = true; }
  else if (rankBy.startsWith('category:')) {
    const cat = rankBy.split(':')[1];
    pool = pool.filter(m => m.categories.includes(cat));
    key = m => m.elo;
  } else key = () => 0;
  return pool.sort((a, b) => asc ? key(a) - key(b) : key(b) - key(a)).slice(0, n);
}

function renderBenchPills() {
  const groups = [{ id: 'all', label: 'Todos' }, ...state.benchmarkGroups.map(g => ({ id: g.id, label: g.label.split(' (')[0] }))];
  $('#bench-pills').innerHTML = groups.map(g =>
    `<button class="pill ${g.id === state.activeBenchGroup ? 'active' : ''}" data-bg="${g.id}">${g.label}</button>`
  ).join('');
  $$('#bench-pills .pill').forEach(p => p.onclick = () => {
    state.activeBenchGroup = p.dataset.bg;
    renderBenchPills();
    renderBenchmarks();
  });
}

function renderBenchmarks() {
  const groups = state.benchmarkGroups.filter(g =>
    state.activeBenchGroup === 'all' || g.id === state.activeBenchGroup);

  $('#bench-content').innerHTML = groups.map(g => {
    const items = state.benchmarks.filter(b => b.group === g.id);
    if (!items.length) return '';
    return `
      <div class="bench-group">
        <div class="bench-group-head">
          <h3>${g.label}</h3>
          <span class="kind ${g.kind === 'operational' ? 'operational' : ''}">
            ${g.kind === 'operational' ? 'operacional' : 'qualidade'}
          </span>
        </div>
        <div class="bench-grid">
          ${items.map(benchCardHTML).join('')}
        </div>
      </div>`;
  }).join('');
}

function benchCardHTML(b) {
  const tops = topModels(b.rankBy);
  return `
  <div class="bench-card">
    <div class="bench-card-top">
      <div class="bench-ico">${b.icon}</div>
      <div>
        <h4>${b.name}</h4>
        <div class="full">${b.fullName}</div>
      </div>
    </div>

    <div class="bench-block">
      <span class="lbl">O que é</span>
      <p>${b.what}</p>
    </div>
    <div class="bench-block">
      <span class="lbl">O que mede</span>
      <p>${b.measures}</p>
    </div>
    <div class="bench-block">
      <span class="lbl">Use como referência quando</span>
      <ul class="bench-use">${b.useWhen.map(u => `<li>${u}</li>`).join('')}</ul>
    </div>
    <div class="bench-caveat"><span>⚠️</span><span>${b.caveat}</span></div>

    <div class="bench-top-models">
      <span class="lbl">Se destacam aqui:</span>
      ${tops.map((m, i) => `<span class="bench-model-chip"><span class="rk">${i + 1}º</span>${m.name}</span>`).join('')}
    </div>
  </div>`;
}

/* ---------- Governança & Compliance ---------- */
state.activeGovFilter = 'all';

const GOV_FILTERS = [
  { id: 'all', label: 'Todos', test: () => true },
  { id: 'selfhost', label: 'Self-host / On-premise', test: (m) => m.governance.selfHost === true },
  { id: 'hipaa', label: 'HIPAA (BAA)', test: (m) => (m.governance.certifications || []).some((c) => /HIPAA/i.test(c)) },
  { id: 'eu', label: 'Residência EU', test: (m) => /\bEU\b/.test(m.governance.dataResidency || '') },
  { id: 'soc2', label: 'SOC 2', test: (m) => (m.governance.certifications || []).some((c) => /SOC\s?2|SOC\s?1\/2/i.test(c)) },
];

function renderGovPills() {
  $('#gov-pills').innerHTML = GOV_FILTERS.map((f) =>
    `<button class="pill ${f.id === state.activeGovFilter ? 'active' : ''}" data-gov="${f.id}">${f.label}</button>`
  ).join('');
  $$('#gov-pills .pill').forEach((p) => p.onclick = () => {
    state.activeGovFilter = p.dataset.gov;
    renderGovPills();
    renderGovernance();
  });
}

const yesNo = (v, goodWhenTrue = true) => {
  const cls = v ? (goodWhenTrue ? 'gov-yes' : 'gov-warn') : (goodWhenTrue ? 'gov-no' : 'gov-yes');
  return `<span class="${cls}">${v ? (goodWhenTrue ? '✓ Sim' : '⚠️ Sim') : (goodWhenTrue ? '✗ Não' : '✓ Não')}</span>`;
};
const zeroRetentionCell = (v) => {
  if (v === true) return '<span class="gov-yes">✓ Sim</span>';
  if (!v) return '<span class="gov-no">—</span>';
  return `<span class="gov-warn">◑ ${v}</span>`; // "configurável", "total (self-host)"
};

function renderGovernance() {
  const filter = GOV_FILTERS.find((f) => f.id === state.activeGovFilter);
  const rows = state.models.filter(filter.test);
  const el = $('#gov-content');
  if (!rows.length) { el.innerHTML = '<div class="gov-empty">Nenhum modelo atende esse requisito.</div>'; return; }

  el.innerHTML = `
    <div class="gov-scroll">
      <table class="gov-table">
        <thead>
          <tr>
            <th>Modelo</th><th>Licença</th><th>Self-host</th><th>Treina com seus dados?</th>
            <th>Zero-retention</th><th>Residência de dados</th><th>DPA</th><th>Certificações</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((m) => `
            <tr>
              <td class="model-cell">${m.name}<small>${m.provider}</small></td>
              <td>${m.license === 'open' ? 'Open-source' : 'Proprietário'}</td>
              <td>${yesNo(m.governance.selfHost, true)}</td>
              <td>${yesNo(m.governance.trainsOnData, false)}</td>
              <td>${zeroRetentionCell(m.governance.zeroRetention)}</td>
              <td>${m.governance.dataResidency || '—'}</td>
              <td>${m.governance.dpa ? '<span class="gov-yes">✓</span>' : '<span class="gov-no">—</span>'}</td>
              <td><div class="cert-chips">${(m.governance.certifications || []).map((c) => `<span class="cert-chip">${c}</span>`).join('')}</div></td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

/* ---------- Guidelines (prompting) ---------- */
function renderGuidelines() {
  $('#general-tips').innerHTML = `
    <div class="tips-box">
      <h3>Dicas gerais (valem para qualquer modelo)</h3>
      <ul class="tips-list">${state.generalTips.map((t) => `<li>${t}</li>`).join('')}</ul>
    </div>`;

  $('#guide-content').innerHTML = state.guides.map((g) => `
    <div class="guide-card">
      <div class="guide-head">
        <div class="bench-ico">${g.icon}</div>
        <h3>${g.title}</h3>
      </div>
      <ul class="guide-principles">${g.principles.map((p) => `<li>${escapeHtml(p)}</li>`).join('')}</ul>
      <div class="snippet-wrap">
        <button class="copy-btn" data-copy="${g.id}">Copiar</button>
        <pre>${escapeHtml(g.snippet)}</pre>
      </div>
      <a class="guide-docs" href="${g.docsUrl}" target="_blank" rel="noopener">Documentação oficial ↗</a>
    </div>`).join('');

  $$('#guide-content .copy-btn').forEach((btn) => btn.onclick = async () => {
    const g = state.guides.find((x) => x.id === btn.dataset.copy);
    try {
      await navigator.clipboard.writeText(g.snippet);
      btn.textContent = '✓ Copiado';
      btn.classList.add('done');
      setTimeout(() => { btn.textContent = 'Copiar'; btn.classList.remove('done'); }, 1600);
    } catch { btn.textContent = 'Falhou'; }
  });
}

/* ---------- Calculadora ---------- */
function renderCalculator() {
  ['calc-req', 'calc-in', 'calc-out'].forEach(id => $('#' + id).oninput = updateCalc);
  updateCalc();
}

function updateCalc() {
  const req = +$('#calc-req').value || 0;
  const tin = +$('#calc-in').value || 0;
  const tout = +$('#calc-out').value || 0;

  const results = state.models.map(m => {
    const cost = (req * tin / 1e6) * m.price.input + (req * tout / 1e6) * m.price.output;
    return { m, cost };
  }).sort((a, b) => a.cost - b.cost);

  const max = results[results.length - 1]?.cost || 1;
  $('#calc-bars').innerHTML = results.map((r, i) => {
    const pct = max > 0 ? Math.max((r.cost / max) * 100, 1.5) : 1.5;
    return `
    <div class="calc-bar-row">
      <div class="name">${r.m.name}<small>${r.m.provider}</small></div>
      <div class="calc-track"><div class="calc-fill ${i === 0 ? 'cheap' : ''}" style="width:${pct}%"></div></div>
      <div class="calc-cost">${fmtBRLish(r.cost)}<small>/mês</small></div>
    </div>`;
  }).join('');
}

/* ---------- Modal (métricas + governança) ---------- */
function openModal(m) {
  const verified = new Date(m.lastVerified).toLocaleDateString('pt-BR');
  $('#modal').innerHTML = `
    <div class="modal-head">
      <div class="card-logo">${m.logo}</div>
      <div><h3>${m.name}</h3><span style="color:var(--text-2)">${m.provider} · ELO ${m.elo}</span></div>
      <button class="close" id="modal-close">×</button>
    </div>
    <p style="color:var(--text-1);margin-bottom:14px">${m.notes}</p>

    <div class="eyebrow" style="margin-bottom:8px">Scores (0–100, normalizados)</div>
    <div class="score-bars">
      ${AXES.map(ax => `
        <div class="score-bar-row">
          <span>${ax.label}</span>
          <div class="score-track"><div class="score-fill" style="width:${m.scores[ax.key]}%"></div></div>
          <span style="text-align:right">${m.scores[ax.key]}</span>
        </div>`).join('')}
    </div>

    <div class="eyebrow" style="margin:18px 0 8px">Governança & Compliance</div>
    <div class="gov-list">
      <div class="gov-item"><span class="k">Treina com seus dados?</span><span class="v">${m.governance.trainsOnData ? '⚠️ Sim' : '✓ Não'}</span></div>
      <div class="gov-item"><span class="k">Self-host / On-premise</span><span class="v">${m.governance.selfHost ? '✓ Sim' : '✗ Não'}</span></div>
      <div class="gov-item"><span class="k">Zero-retention</span><span class="v">${m.governance.zeroRetention === true ? '✓ Sim' : (m.governance.zeroRetention || '—')}</span></div>
      <div class="gov-item"><span class="k">Residência de dados</span><span class="v">${m.governance.dataResidency || m.governance.regions}</span></div>
      <div class="gov-item"><span class="k">DPA disponível</span><span class="v">${m.governance.dpa ? '✓ Sim' : '—'}</span></div>
      <div class="gov-item"><span class="k">Certificações</span><span class="v">${(m.governance.certifications || []).join(', ') || '—'}</span></div>
    </div>

    <div class="disclaimer" style="margin-top:18px">
      <span>ℹ️</span>
      <span>
        <b>Qualidade</b> (scores/ELO): ${m.source} · verif. ${verified}.
        <b>Preço/contexto</b>: ${m.priceSource || '—'}${m.priceVerified ? ' · verif. ' + new Date(m.priceVerified).toLocaleDateString('pt-BR') : ''}.
        Scores são ilustrativos no protótipo — confirme antes de decisão de produção.
      </span>
    </div>`;
  $('#modal-back').classList.add('open');
  $('#modal-close').onclick = closeModal;
}
function closeModal() { $('#modal-back').classList.remove('open'); }

/* ---------- Tema claro/escuro ---------- */
function setThemeIcon() {
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  $('#theme-toggle').textContent = isLight ? '☀️' : '🌙';
}
function toggleTheme() {
  const root = document.documentElement;
  const isLight = root.getAttribute('data-theme') === 'light';
  if (isLight) root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', 'light');
  localStorage.setItem('aihub-theme', isLight ? 'dark' : 'light');
  setThemeIcon();
}

/* ---------- Roteamento (cada rota é uma view) ---------- */
const ROUTES = ['catalog', 'matcher', 'compare', 'benchmarks', 'governance', 'guidelines', 'calculator'];

function currentRoute() {
  const h = (location.hash || '').replace(/^#\/?/, '');
  return ROUTES.includes(h) ? h : 'catalog';
}

function showView() {
  const route = currentRoute();
  $$('.view').forEach((v) => v.classList.toggle('active', v.id === route));
  $$('.nav-links a').forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + route));
  window.scrollTo(0, 0);
}

function goTo(route) { location.hash = '#' + route; }

/* ---------- Global bindings ---------- */
function bindGlobal() {
  window.addEventListener('hashchange', showView);
  showView();
  setThemeIcon();
  $('#theme-toggle').onclick = toggleTheme;
  $('#search').oninput = (e) => { state.search = e.target.value; renderCatalog(); };
  $('#tray-go').onclick = () => goTo('compare');
  $('#modal-back').onclick = (e) => { if (e.target.id === 'modal-back') closeModal(); };
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
}

init();
