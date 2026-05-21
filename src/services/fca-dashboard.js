(function () {
  const FCA_SPREADSHEET_ID = '1ET6cmm3SHCO_DnxJwMTLrDFpQ-pMOcSUm56hY5ZnGmk';
  const FCA_GID = '744728561';
  const FCA_CSV_URL = `https://docs.google.com/spreadsheets/d/${FCA_SPREADSHEET_ID}/export?format=csv&gid=${FCA_GID}`;

  const OFFICIAL_CLIENT_ALIASES = {
    alphaville: ['ALPHAVILLE'],
    yousafer: ['YOUSAFER', 'YOU SAFER'],
    prime: ['PRIME MECANICA', 'PRIME MECÂNICA', 'PRIME'],
    multimed: ['MULTIMED'],
    'treinando-online': ['TREINANDO ONLINE'],
    'seg-eletronic': ['SEG ELETRONIC', 'SEG ELETRONIC LTDA'],
    'espaco-master': ['ESPAÇO MASTER', 'ESPACO MASTER'],
    'st1-internet': ['ST1 INTERNET', 'ST1'],
    'sindihoteleiros-cuidar-on': ['SINDICATO HOTELEIROS', 'SINDIHOTELEIROS', 'CUIDAR ON']
  };

  const FIELD_MAP = {
    name: ['name'],
    fee: ['Fee'],
    coordenador: ['Coordenador'],
    account: ['Account'],
    gt: ['GT'],
    resultados: ['Resultados'],
    opsTrafego: ['Ops tráfego', 'Ops trafego'],
    entregasPrazo: ['Entregas prazo'],
    entregasQualidade: ['Entregas qualidade'],
    relacionamento: ['Relacionamento'],
    flag: ['Flag calculada'],
    flagDate: ['Flag  última alteração', 'Flag última alteração'],
    fato: ['Fato'],
    causa: ['Causa'],
    acao: ['Ação', 'Acao'],
    responsavel: ['Responsável', 'Responsavel'],
    deadline: ['Deadline'],
    tier: ['tier'],
    churn: ['Churn realizado'],
    inicioContrato: ['Início do contrato', 'Inicio do contrato'],
    lt: ['LT'],
    linkGrowthPack: ['Link GrowthPack'],
    feeUltimaAlteracao: ['Fee última alteração', 'Fee ultima alteração'],
    vgvCadastrado: ['VGV Cadastrado'],
    vgvUltimoRegistro: ['VGV Ultimo Registro', 'VGV Último Registro'],
    metaCliente: ['Meta do cliente'],
    existeMql: ['Existe critério de MQL?', 'Existe criterio de MQL?'],
    criterioMql: ['Descreva o critério MQL', 'Descreva o criterio MQL'],
    trackingMql: ['Existe tracking do MQL?'],
    contasMql: ['Contas otimizadas por MQL?'],
    usoCrm: ['Uso do CRM'],
    totalMediaBudget: ['Total Media Budget'],
    metaMediaPlan: ['Meta Media Plan'],
    googleMediaPlan: ['Google Media Plan'],
    totalBudget: ['Total Budget - Invest Total'],
    budgetUtilizado: ['% de Budget Utilizado'],
    saldoConta: ['Saldo em Conta'],
    investTotal: ['Invest total Tráfego', 'Invest total Trafego'],
    investMeta: ['Invest total Meta'],
    investGoogle: ['Invest total Google'],
    idMeta: ['id_meta'],
    idGoogle: ['id_google']
  };

  let fcaRowsCache = null;
  let active = false;

  function normalize(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toUpperCase();
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  }

  function parseCsv(text) {
    const rows = [];
    let row = [];
    let cell = '';
    let quoted = false;
    const input = String(text || '').replace(/^\uFEFF/, '');
    for (let i = 0; i < input.length; i += 1) {
      const char = input[i];
      const next = input[i + 1];
      if (char === '"' && quoted && next === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') quoted = !quoted;
      else if (char === ',' && !quoted) {
        row.push(cell);
        cell = '';
      } else if ((char === '\n' || char === '\r') && !quoted) {
        if (char === '\r' && next === '\n') i += 1;
        row.push(cell);
        if (row.some((value) => String(value).trim() !== '')) rows.push(row);
        row = [];
        cell = '';
      } else cell += char;
    }
    row.push(cell);
    if (row.some((value) => String(value).trim() !== '')) rows.push(row);
    return rows;
  }

  function rowsToObjects(rows) {
    const headerIndex = rows.findIndex((row) => row.some((cell) => normalize(cell) === 'NAME') && row.some((cell) => normalize(cell) === 'FATO'));
    if (headerIndex === -1) throw new Error('Cabeçalho do Cockpit Overview/FCA não encontrado.');
    const headers = rows[headerIndex].map((header) => String(header || '').trim());
    return rows.slice(headerIndex + 1).map((row) => {
      const object = {};
      headers.forEach((header, index) => { object[header] = row[index] ?? ''; });
      return object;
    }).filter((row) => row.name || row.Name || row.Fato || row['Flag calculada']);
  }

  function getField(row, key) {
    const options = FIELD_MAP[key] || [key];
    for (const option of options) {
      if (row[option] !== undefined && row[option] !== '') return row[option];
    }
    return '';
  }

  function currentClientId() {
    return document.querySelector('.client-btn.active')?.dataset?.client || null;
  }

  function currentClientName() {
    return document.querySelector('.client-btn.active .client-name')?.textContent?.trim() || 'Cliente';
  }

  function aliasesFor(clientId) {
    return OFFICIAL_CLIENT_ALIASES[clientId] || [];
  }

  async function loadFcaRows() {
    if (fcaRowsCache) return fcaRowsCache;
    const response = await fetch(`${FCA_CSV_URL}&cacheBust=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    if (!text || /<html|<!doctype/i.test(text)) throw new Error('A planilha FCA não retornou CSV. Confira o compartilhamento/publicação da aba Cockpit Overview.');
    fcaRowsCache = rowsToObjects(parseCsv(text));
    return fcaRowsCache;
  }

  function findClientFca(rows, clientId) {
    const aliases = aliasesFor(clientId).map(normalize);
    return rows.find((row) => aliases.includes(normalize(getField(row, 'name')))) || null;
  }

  function fmtCurrency(value) {
    const n = toNumber(value);
    if (!n) return 'R$ 0,00';
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function fmtNumber(value) {
    const n = toNumber(value);
    return n ? n.toLocaleString('pt-BR') : '0';
  }

  function pct(value) {
    const n = toNumber(value);
    if (Math.abs(n) <= 1) return `${(n * 100).toFixed(1).replace('.', ',')}%`;
    return `${n.toFixed(1).replace('.', ',')}%`;
  }

  function toNumber(value) {
    if (typeof value === 'number') return value;
    const raw = String(value || '').trim();
    if (!raw || raw === '-' || raw === '#DIV/0!') return 0;
    const cleaned = raw.replace(/R\$/g, '').replace(/%/g, '').replace(/\s/g, '');
    if (cleaned.includes(',') && cleaned.includes('.')) return Number(cleaned.replace(/\./g, '').replace(',', '.')) || 0;
    if (cleaned.includes(',')) return Number(cleaned.replace(',', '.')) || 0;
    return Number(cleaned) || 0;
  }

  function boolBadge(value) {
    const raw = String(value || '').toLowerCase();
    const ok = raw === 'true' || raw === '1' || raw === 'sim' || raw === 'yes';
    const warn = raw === 'false' || raw === '0' || raw === 'não' || raw === 'nao' || raw === 'no';
    if (ok) return '<span class="badge ok">OK</span>';
    if (warn) return '<span class="badge bad">Não</span>';
    return `<span class="badge client">${escapeHtml(value || '-')}</span>`;
  }

  function flagClass(flag) {
    const f = String(flag || '').toLowerCase();
    if (f.includes('safe') || f.includes('🟢')) return 'ok';
    if (f.includes('care') || f.includes('🟡')) return 'warn';
    if (f.includes('critical') || f.includes('danger') || f.includes('🔴') || f.includes('⚫')) return 'bad';
    return 'client';
  }

  function splitActions(text) {
    const raw = String(text || '').trim();
    if (!raw) return [];
    const parts = raw.split(/(?=\bA\d+(?:\.\d+)?\s*[:.-])/g).map((item) => item.trim()).filter(Boolean);
    return parts.length ? parts : raw.split(/\n+/).map((item) => item.trim()).filter(Boolean);
  }

  function actionStatus(action) {
    const a = normalize(action);
    if (a.includes('FINALIZADO') || a.includes('REALIZADO') || a.includes('CONCLUIDO')) return '<span class="badge ok">Feito</span>';
    if (a.includes('AGUARDO') || a.includes('AGUARDANDO')) return '<span class="badge warn">Aguardando</span>';
    if (a.includes('ANDAMENTO') || a.includes('REALIZANDO') || a.includes('ANALISE')) return '<span class="badge client">Em andamento</span>';
    return '<span class="badge warn">Aberto</span>';
  }

  function readState() {
    try { return JSON.parse(localStorage.getItem('v4-command-center-state-v6-crm-performance-losses') || JSON.stringify(window.V4_SEED || {})); } catch (error) { return JSON.parse(JSON.stringify(window.V4_SEED || {})); }
  }

  function writeState(state) {
    localStorage.setItem('v4-command-center-state-v6-crm-performance-losses', JSON.stringify(state));
  }

  function upsertById(rows, item) {
    const list = Array.isArray(rows) ? rows : [];
    const index = list.findIndex((row) => row.id === item.id);
    if (index >= 0) list[index] = { ...list[index], ...item };
    else list.push(item);
    return list;
  }

  function syncFcaActionPlan(clientId, row) {
    const actions = splitActions(getField(row, 'acao'));
    if (!actions.length) return;
    const state = readState();
    state.actionPlan = state.actionPlan || [];
    const deadline = getField(row, 'deadline') || 'Check-in quarter';
    const responsible = getField(row, 'responsavel') || getField(row, 'account') || 'V4 / Account';
    const link = getField(row, 'linkGrowthPack') || `https://docs.google.com/spreadsheets/d/${FCA_SPREADSHEET_ID}/edit#gid=${FCA_GID}`;

    actions.forEach((action, index) => {
      state.actionPlan = upsertById(state.actionPlan, {
        id: `fca-${clientId}-${index + 1}`,
        clientId,
        source: 'fca-cockpit',
        what: action.replace(/^\bA\d+(?:\.\d+)?\s*[:.-]\s*/i, '').trim() || action,
        why: getField(row, 'causa') || 'Plano extraido da base FCA para a reuniao de check-in quarter.',
        where: 'FCA / Cockpit Overview',
        when: deadline,
        who: responsible,
        how: `Acompanhar pela base oficial: ${link}`,
        status: normalize(action).includes('CONCLUIDO') || normalize(action).includes('FINALIZADO') ? 'Concluido' : 'Em execucao'
      });
    });

    const client = state.clients?.find((item) => item.id === clientId);
    if (client) {
      client.actionPlanSources = client.actionPlanSources || [];
      const source = { title: 'FCA Cockpit Overview', type: 'Sheets', status: 'FCA sincronizado', url: `https://docs.google.com/spreadsheets/d/${FCA_SPREADSHEET_ID}/edit#gid=${FCA_GID}` };
      if (!client.actionPlanSources.some((item) => item.url === source.url)) client.actionPlanSources.unshift(source);
    }

    writeState(state);
  }

  function textBlock(title, value, extraClass = '') {
    return `
      <article class="fca-text-card ${extraClass}">
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(value || 'Não informado na base FCA.').replace(/\n/g, '<br>')}</p>
      </article>
    `;
  }

  function renderKpi(label, value, helper, cls = 'client') {
    return `
      <div class="insight-card fca-kpi">
        <span class="badge ${cls}">${escapeHtml(label)}</span>
        <strong>${value}</strong>
        <p class="muted">${escapeHtml(helper || '')}</p>
      </div>
    `;
  }

  function renderFcaDashboard(row) {
    const flag = getField(row, 'flag');
    const actions = splitActions(getField(row, 'acao'));
    const mediaTotal = toNumber(getField(row, 'totalMediaBudget')) || toNumber(getField(row, 'totalBudget'));
    const mediaInvest = toNumber(getField(row, 'investTotal'));
    const mediaUsed = mediaTotal ? mediaInvest / mediaTotal : toNumber(getField(row, 'budgetUtilizado'));
    const healthScore = [getField(row, 'opsTrafego'), getField(row, 'entregasPrazo'), getField(row, 'entregasQualidade'), getField(row, 'relacionamento')]
      .reduce((sum, item) => sum + (String(item).toLowerCase() === 'true' ? 25 : 0), 0);

    return `
      <section class="dashboard-grid fca-dashboard" data-fca-dashboard="true">
        <article class="glass-card span-12 fca-hero-card">
          <div class="fca-hero-copy">
            <p class="eyebrow">FCA • Fato, Causa e Ação</p>
            <h2>${escapeHtml(currentClientName())} • Diagnóstico operacional</h2>
            <p class="muted">Base oficial: Cockpit Overview. O painel abaixo filtra somente os clientes ativos do seu escopo.</p>
            <div class="client-tags">
              <span class="badge ${flagClass(flag)}">${escapeHtml(flag || 'Sem flag')}</span>
              <span class="badge client">Última alteração: ${escapeHtml(getField(row, 'flagDate') || '-')}</span>
              <span class="badge client">Deadline: ${escapeHtml(getField(row, 'deadline') || '-')}</span>
              <span class="badge client">Tier: ${escapeHtml(getField(row, 'tier') || '-')}</span>
            </div>
          </div>
          <div class="fca-score-card">
            <small>Score operacional</small>
            <strong>${healthScore}/100</strong>
            <span class="muted">Prazo, qualidade, tráfego e relacionamento</span>
          </div>
        </article>

        <article class="glass-card span-12">
          <div class="source-filter-grid">
            ${renderKpi('Fee', fmtCurrency(getField(row, 'fee')), 'Valor mensal cadastrado na base FCA.', 'ok')}
            ${renderKpi('Resultados', fmtNumber(getField(row, 'resultados')), 'Nota/score registrado no Cockpit.', flagClass(flag))}
            ${renderKpi('Tempo de contrato', `${fmtNumber(getField(row, 'lt'))} meses`, `Início: ${getField(row, 'inicioContrato') || '-'}`, 'client')}
            ${renderKpi('Churn realizado', escapeHtml(getField(row, 'churn') || '-'), 'Status informado na base FCA.', 'warn')}
            ${renderKpi('Budget mídia', fmtCurrency(mediaTotal), `Utilizado: ${pct(mediaUsed)}`, 'client')}
          </div>
        </article>

        <article class="glass-card span-12 fca-grid-text">
          ${textBlock('Fato', getField(row, 'fato'), 'fca-fato')}
          ${textBlock('Causa', getField(row, 'causa'), 'fca-causa')}
          ${textBlock('Ação', getField(row, 'acao'), 'fca-acao')}
        </article>

        <article class="glass-card span-8">
          <div class="section-head">
            <div>
              <p class="eyebrow">Plano de ação quebrado por item</p>
              <h2>Checklist FCA</h2>
              <p class="muted">Itens extraídos automaticamente do campo Ação.</p>
            </div>
            <span class="badge client">${actions.length} ações</span>
          </div>
          <div class="fca-action-list">
            ${actions.length ? actions.map((action, index) => `
              <div class="fca-action-row">
                <span class="fca-action-index">${index + 1}</span>
                <p>${escapeHtml(action)}</p>
                ${actionStatus(action)}
              </div>
            `).join('') : '<div class="empty">Nenhuma ação cadastrada na base FCA.</div>'}
          </div>
        </article>

        <article class="glass-card span-4">
          <h3>Responsáveis e governança</h3>
          <div class="kpi-list">
            <div class="kpi-row"><span><strong>Coordenador</strong><br><small class="muted">${escapeHtml(getField(row, 'coordenador') || '-')}</small></span></div>
            <div class="kpi-row"><span><strong>Account</strong><br><small class="muted">${escapeHtml(getField(row, 'account') || '-')}</small></span></div>
            <div class="kpi-row"><span><strong>GT</strong><br><small class="muted">${escapeHtml(getField(row, 'gt') || '-')}</small></span></div>
            <div class="kpi-row"><span><strong>Responsável FCA</strong><br><small class="muted">${escapeHtml(getField(row, 'responsavel') || '-')}</small></span></div>
          </div>
        </article>

        <article class="glass-card span-6">
          <h3>Saúde de operação</h3>
          <div class="table-wrap"><table><thead><tr><th>Dimensão</th><th>Status</th></tr></thead><tbody>
            <tr><td>Ops tráfego</td><td>${boolBadge(getField(row, 'opsTrafego'))}</td></tr>
            <tr><td>Entregas no prazo</td><td>${boolBadge(getField(row, 'entregasPrazo'))}</td></tr>
            <tr><td>Entregas com qualidade</td><td>${boolBadge(getField(row, 'entregasQualidade'))}</td></tr>
            <tr><td>Relacionamento</td><td>${boolBadge(getField(row, 'relacionamento'))}</td></tr>
          </tbody></table></div>
        </article>

        <article class="glass-card span-6">
          <h3>CRM, MQL e rastreabilidade</h3>
          <div class="table-wrap"><table><thead><tr><th>Item</th><th>Informação</th></tr></thead><tbody>
            <tr><td>Existe critério de MQL?</td><td>${escapeHtml(getField(row, 'existeMql') || '-')}</td></tr>
            <tr><td>Critério MQL</td><td>${escapeHtml(getField(row, 'criterioMql') || '-')}</td></tr>
            <tr><td>Tracking do MQL?</td><td>${escapeHtml(getField(row, 'trackingMql') || '-')}</td></tr>
            <tr><td>Contas otimizadas por MQL?</td><td>${escapeHtml(getField(row, 'contasMql') || '-')}</td></tr>
            <tr><td>Uso do CRM</td><td>${escapeHtml(getField(row, 'usoCrm') || '-')}</td></tr>
          </tbody></table></div>
        </article>

        <article class="glass-card span-12">
          <h3>Dados de mídia e rastreio</h3>
          <div class="table-wrap"><table><thead><tr><th>Total budget</th><th>Meta plan</th><th>Google plan</th><th>Invest total</th><th>Invest Meta</th><th>Invest Google</th><th>Saldo</th><th>ID Meta</th><th>ID Google</th></tr></thead><tbody>
            <tr>
              <td>${fmtCurrency(getField(row, 'totalBudget') || mediaTotal)}</td>
              <td>${fmtCurrency(getField(row, 'metaMediaPlan'))}</td>
              <td>${fmtCurrency(getField(row, 'googleMediaPlan'))}</td>
              <td>${fmtCurrency(getField(row, 'investTotal'))}</td>
              <td>${fmtCurrency(getField(row, 'investMeta'))}</td>
              <td>${fmtCurrency(getField(row, 'investGoogle'))}</td>
              <td>${fmtCurrency(getField(row, 'saldoConta'))}</td>
              <td>${escapeHtml(getField(row, 'idMeta') || '-')}</td>
              <td>${escapeHtml(getField(row, 'idGoogle') || '-')}</td>
            </tr>
          </tbody></table></div>
        </article>
      </section>
    `;
  }

  function renderEmpty(clientId) {
    return `
      <section class="dashboard-grid fca-dashboard" data-fca-dashboard="true">
        <article class="glass-card span-12">
          <p class="eyebrow">FCA • Base oficial</p>
          <h2>${escapeHtml(currentClientName())}</h2>
          <div class="empty">Não encontrei FCA para este cliente na base Cockpit Overview. O cliente continua no escopo oficial, mas sem linha FCA localizada por alias: ${escapeHtml(aliasesFor(clientId).join(', ') || clientId)}.</div>
        </article>
      </section>
    `;
  }

  function renderLoading() {
    return `
      <section class="dashboard-grid fca-dashboard" data-fca-dashboard="true">
        <article class="glass-card span-12"><div class="empty">Carregando FCA da planilha oficial...</div></article>
      </section>
    `;
  }

  function renderError(error) {
    return `
      <section class="dashboard-grid fca-dashboard" data-fca-dashboard="true">
        <article class="glass-card span-12">
          <p class="eyebrow">FCA • Erro de leitura</p>
          <h2>Não consegui ler a base FCA</h2>
          <div class="empty">${escapeHtml(error.message || error)}</div>
        </article>
      </section>
    `;
  }

  function contentStart() {
    const nav = document.querySelector('.tab-rail');
    if (!nav) return null;
    return nav.nextElementSibling;
  }

  function clearClientContent() {
    const nav = document.querySelector('.tab-rail');
    if (!nav) return;
    let node = nav.nextElementSibling;
    while (node && !node.matches('footer')) {
      const next = node.nextElementSibling;
      node.remove();
      node = next;
    }
  }

  function insertFcaHtml(html) {
    const nav = document.querySelector('.tab-rail');
    if (!nav) return;
    clearClientContent();
    nav.insertAdjacentHTML('afterend', html);
  }

  async function openFca() {
    const clientId = currentClientId();
    if (!clientId) return;
    active = true;
    sessionStorage.setItem('v4-active-special-tab', 'fca');
    document.querySelectorAll('.tab-btn').forEach((button) => button.classList.remove('active'));
    document.querySelector('[data-fca-tab]')?.classList.add('active');
    insertFcaHtml(renderLoading());
    try {
      const rows = await loadFcaRows();
      const row = findClientFca(rows, clientId);
      if (row) syncFcaActionPlan(clientId, row);
      insertFcaHtml(row ? renderFcaDashboard(row) : renderEmpty(clientId));
      document.querySelector('[data-fca-tab]')?.classList.add('active');
    } catch (error) {
      insertFcaHtml(renderError(error));
      document.querySelector('[data-fca-tab]')?.classList.add('active');
    }
  }

  function ensureTab() {
    const rail = document.querySelector('.tab-rail');
    if (!rail || rail.querySelector('[data-fca-tab]')) return;
    const crm = rail.querySelector('[data-tab="crm"]');
    const button = document.createElement('button');
    button.className = 'tab-btn';
    button.type = 'button';
    button.dataset.fcaTab = 'true';
    button.textContent = 'FCA';
    if (crm) crm.insertAdjacentElement('afterend', button);
    else rail.appendChild(button);
  }

  document.addEventListener('click', (event) => {
    const specialTab = event.target.closest('[data-fca-tab]');
    if (specialTab) {
      event.preventDefault();
      event.stopPropagation();
      openFca();
      return;
    }
    const normalTab = event.target.closest('[data-tab], [data-client], [data-nav]');
    if (normalTab) {
      active = false;
      sessionStorage.removeItem('v4-active-special-tab');
    }
  }, true);

  document.addEventListener('DOMContentLoaded', () => {
    const main = document.getElementById('main') || document.body;
    const observer = new MutationObserver(() => {
      window.requestAnimationFrame(() => {
        ensureTab();
        if (active && sessionStorage.getItem('v4-active-special-tab') === 'fca' && document.querySelector('.tab-rail')) openFca();
      });
    });
    observer.observe(main, { childList: true, subtree: true });
    ensureTab();
  });
})();
