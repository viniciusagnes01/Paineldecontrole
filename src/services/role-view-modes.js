(function () {
  const STORAGE_KEY = 'v4-command-center-state-v6-crm-performance-losses';
  const MODE_KEY = 'v4-command-center-view-mode';
  const MODES = {
    gp: { label: 'GP detalhista', short: 'GP', desc: 'Execucao por cliente, tarefas, CRM, midia e plano de acao.' },
    coordinator: { label: 'Coordenador', short: 'Coord.', desc: 'Carteira, excecoes, donos, prazos e gargalos.' },
    coo: { label: 'COO', short: 'COO', desc: 'Saude executiva, forecast, risco e decisoes.' }
  };

  function readState() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return window.V4_SEED || {}; }
  }

  function writeState(state) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }

  function mode() {
    return sessionStorage.getItem(MODE_KEY) || localStorage.getItem(MODE_KEY) || 'gp';
  }

  function setMode(next) {
    if (!MODES[next]) return;
    localStorage.setItem(MODE_KEY, next);
    sessionStorage.setItem(MODE_KEY, next);
    applyRoleView();
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  }

  function money(value) {
    return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function number(value) {
    return Number(value || 0).toLocaleString('pt-BR');
  }

  function pct(value) {
    return `${Number(value || 0).toFixed(1).replace('.', ',')}%`;
  }

  function normalizeStatus(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  function sanitizeDashCrmObject(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    Object.keys(obj).forEach((key) => {
      const value = obj[key];
      const valueText = String(value || '').trim().toUpperCase();
      if (key === 'dashboardSheetName' || key === 'dashboardGid' || key === 'dashCrm' || valueText === 'DASH_CRM') {
        delete obj[key];
      } else if (value && typeof value === 'object') {
        sanitizeDashCrmObject(value);
      }
    });
    return obj;
  }

  function sanitizeState() {
    const state = readState();
    sanitizeDashCrmObject(state);
    if (Array.isArray(state.clients)) {
      state.clients.forEach((client) => {
        if (!client.crmSheet) return;
        client.crmSheet.sheetName = client.crmSheet.sheetName || 'BASE_CRM';
        delete client.crmSheet.dashboardSheetName;
        delete client.crmSheet.dashboardGid;
        delete client.crmSheet.dashCrm;
      });
    }
    writeState(state);
    sanitizeDashCrmObject(window.V4_SEED);
    document.querySelectorAll('body *').forEach((node) => {
      if (node.childNodes.length === 1 && node.firstChild?.nodeType === Node.TEXT_NODE && /DASH_CRM/i.test(node.textContent || '')) {
        node.textContent = node.textContent.replace(/DASH_CRM fora do fluxo\.?/gi, 'CRM tratado somente pela BASE_CRM.').replace(/DASH_CRM/gi, 'BASE_CRM');
      }
    });
  }

  function activeClientId() {
    return document.querySelector('[data-client].active')?.dataset?.client || null;
  }

  function getClient(state) {
    const id = activeClientId();
    return (state.clients || []).find((client) => client.id === id) || null;
  }

  function clientMetrics(state, client) {
    const crm = state.crmSnapshots?.[client.id] || null;
    const perf = state.performanceSnapshots?.[client.id]?.monthly?.current?.metrics || state.performanceSnapshots?.[client.id]?.weekly?.current?.metrics || {};
    const base = client.metrics || {};
    const investment = Number(perf.investment || base.investment || 0);
    const revenue = Number(crm?.totals?.value || perf.revenue || base.revenue || 0);
    const leads = Number(crm?.totals?.lead || perf.leads || base.leads || 0);
    const sales = Number(crm?.totals?.purchase || perf.sales || base.sales || 0);
    const cpl = Number(perf.cpl || base.cpl || (investment && leads ? investment / leads : 0));
    const roas = Number(perf.roas || (investment && revenue ? revenue / investment : base.roas || 0));
    return { revenue, investment, leads, sales, cpl, roas, mql: Number(crm?.totals?.mql || base.mql || 0), sql: Number(crm?.totals?.sql || base.sql || 0), opportunities: Number(crm?.totals?.opportunity || base.opportunities || 0) };
  }

  function portfolio(state) {
    const clients = state.clients || [];
    const tasks = state.tasks || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const rows = clients.map((client) => {
      const m = clientMetrics(state, client);
      const hasCrm = Boolean(state.crmSnapshots?.[client.id]);
      const hasMedia = Boolean(state.performanceSnapshots?.[client.id]?.monthly?.current || state.performanceSnapshots?.[client.id]?.weekly?.current);
      const clientTasks = tasks.filter((task) => task.clientId === client.id);
      const openTasks = clientTasks.filter((task) => !/conclu|done|finaliz/i.test(normalizeStatus(task.status))).length;
      const overdue = clientTasks.filter((task) => {
        if (/conclu|done|finaliz/i.test(normalizeStatus(task.status))) return false;
        if (!task.end) return false;
        const end = new Date(task.end);
        return !Number.isNaN(end.getTime()) && end < today;
      }).length;
      const issues = [];
      if (!hasCrm) issues.push('CRM sem snapshot');
      if (!hasMedia) issues.push('Midia sem snapshot');
      if (Number(client.health || 0) < 65) issues.push('Saude baixa');
      if (overdue) issues.push(`${overdue} task(s) vencida(s)`);
      const severity = issues.length >= 2 || Number(client.health || 0) < 55 ? 'critico' : issues.length ? 'atencao' : 'ok';
      return { client, metrics: m, hasCrm, hasMedia, openTasks, overdue, issues, severity };
    });
    const totals = rows.reduce((acc, row) => {
      acc.revenue += row.metrics.revenue;
      acc.investment += row.metrics.investment;
      acc.leads += row.metrics.leads;
      acc.sales += row.metrics.sales;
      acc.target += Number(row.client.goals?.revenue || row.client.metrics?.revenueTarget || 0);
      return acc;
    }, { revenue: 0, investment: 0, leads: 0, sales: 0, target: 0 });
    totals.cpl = totals.leads ? totals.investment / totals.leads : 0;
    totals.roas = totals.investment ? totals.revenue / totals.investment : 0;
    totals.goalPct = totals.target ? totals.revenue / totals.target * 100 : 0;
    return { rows, totals, critical: rows.filter((row) => row.severity === 'critico'), attention: rows.filter((row) => row.severity === 'atencao'), ok: rows.filter((row) => row.severity === 'ok') };
  }

  function statusBadge(row) {
    const cls = row.severity === 'critico' ? '#ff4258' : row.severity === 'atencao' ? '#ffbd2e' : '#38d66b';
    const label = row.severity === 'critico' ? 'Critico' : row.severity === 'atencao' ? 'Atencao' : 'OK';
    return `<span style="display:inline-flex;align-items:center;gap:6px;color:${cls};font-weight:950"><i style="width:8px;height:8px;border-radius:50%;background:${cls};display:inline-block"></i>${label}</span>`;
  }

  function roleToolbarHtml(current) {
    return `
      <div data-v4-role-toolbar class="glass-card" style="display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;margin:0 0 16px;padding:12px 14px;border:1px solid rgba(255,255,255,.12);border-radius:18px;background:rgba(255,255,255,.045)">
        <div>
          <strong style="font-size:15px">Modo de gestao</strong>
          <p class="muted" style="margin:3px 0 0">${escapeHtml(MODES[current].desc)}</p>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${Object.entries(MODES).map(([id, item]) => `<button type="button" data-v4-role-mode="${id}" class="btn ${current === id ? 'primary' : 'ghost'}" style="border-radius:999px">${escapeHtml(item.label)}</button>`).join('')}
        </div>
      </div>
    `;
  }

  function cooPanel(state) {
    const p = portfolio(state);
    const riskRows = [...p.critical, ...p.attention].slice(0, 6);
    return `
      <section data-v4-role-panel class="dashboard-grid" style="margin-bottom:16px">
        <article class="glass-card span-12">
          <p class="eyebrow">Visao COO</p>
          <h2>Resumo executivo da carteira</h2>
          <p class="muted">Foco em receita, forecast, risco de carteira, gargalos e decisoes necessarias. Detalhes operacionais ficam na visao GP.</p>
        </article>
        <article class="glass-card span-3"><h3>Receita / Meta</h3><strong style="font-size:28px;color:#38d66b">${money(p.totals.revenue)}</strong><p class="muted">${pct(p.totals.goalPct)} da meta</p></article>
        <article class="glass-card span-3"><h3>Investimento</h3><strong style="font-size:28px;color:#ff4258">${money(p.totals.investment)}</strong><p class="muted">CPL medio ${money(p.totals.cpl)}</p></article>
        <article class="glass-card span-3"><h3>Clientes em risco</h3><strong style="font-size:28px;color:#ffbd2e">${p.critical.length + p.attention.length}</strong><p class="muted">${p.critical.length} criticos • ${p.attention.length} em atencao</p></article>
        <article class="glass-card span-3"><h3>ROAS consolidado</h3><strong style="font-size:28px;color:#aa61ff">${Number(p.totals.roas || 0).toFixed(2).replace('.', ',')}x</strong><p class="muted">Base CRM + midia sincronizada</p></article>
        <article class="glass-card span-8">
          <h3>Riscos executivos</h3>
          <div class="table-wrap"><table><thead><tr><th>Cliente</th><th>Status</th><th>Problema</th><th>Impacto</th></tr></thead><tbody>
            ${riskRows.map((row) => `<tr><td>${escapeHtml(row.client.name)}</td><td>${statusBadge(row)}</td><td>${escapeHtml(row.issues.join(', ') || 'Sem risco')}</td><td>${money(row.metrics.revenue)} receita • ${number(row.metrics.leads)} leads</td></tr>`).join('') || '<tr><td colspan="4">Carteira sem riscos criticos no momento.</td></tr>'}
          </tbody></table></div>
        </article>
        <article class="glass-card span-4">
          <h3>Decisoes necessarias</h3>
          <div class="kpi-list">
            <div class="kpi-row"><span><strong>Priorizar risco</strong><br><small class="muted">Atuar primeiro em clientes criticos e sem dado confiavel.</small></span><span class="badge warn">Hoje</span></div>
            <div class="kpi-row"><span><strong>Forecast</strong><br><small class="muted">Usar somente clientes com CRM e midia sincronizados.</small></span><span class="badge client">Semana</span></div>
            <div class="kpi-row"><span><strong>Capacidade</strong><br><small class="muted">Revisar carga de tarefas abertas por dono.</small></span><span class="badge ok">Operacao</span></div>
          </div>
        </article>
      </section>
    `;
  }

  function coordinatorPanel(state) {
    const p = portfolio(state);
    const rows = [...p.critical, ...p.attention, ...p.ok].slice(0, 12);
    const openTasks = (state.tasks || []).filter((task) => !/conclu|done|finaliz/i.test(normalizeStatus(task.status))).length;
    return `
      <section data-v4-role-panel class="dashboard-grid" style="margin-bottom:16px">
        <article class="glass-card span-12">
          <p class="eyebrow">Visao Coordenador</p>
          <h2>Central de operacao e excecoes</h2>
          <p class="muted">Carteira por prioridade: o que esta fora do padrao, impacto, dono e proxima acao.</p>
        </article>
        <article class="glass-card span-3"><h3>OK</h3><strong style="font-size:28px;color:#38d66b">${p.ok.length}</strong><p class="muted">Clientes sem excecao critica</p></article>
        <article class="glass-card span-3"><h3>Atencao</h3><strong style="font-size:28px;color:#ffbd2e">${p.attention.length}</strong><p class="muted">Exigem acompanhamento</p></article>
        <article class="glass-card span-3"><h3>Criticos</h3><strong style="font-size:28px;color:#ff4258">${p.critical.length}</strong><p class="muted">Escalar prioridade</p></article>
        <article class="glass-card span-3"><h3>Tasks abertas</h3><strong style="font-size:28px;color:#5d94ff">${openTasks}</strong><p class="muted">Backlog + execucao + validacao</p></article>
        <article class="glass-card span-12">
          <h3>Fila de gestao da carteira</h3>
          <div class="table-wrap"><table><thead><tr><th>Cliente</th><th>Status</th><th>Problema</th><th>Dono</th><th>Proxima acao</th></tr></thead><tbody>
            ${rows.map((row) => `<tr><td>${escapeHtml(row.client.name)}</td><td>${statusBadge(row)}</td><td>${escapeHtml(row.issues.join(', ') || 'Operacao normal')}</td><td>${escapeHtml(row.client.responsible || 'V4')}</td><td>${row.issues.length ? 'Resolver fonte/pendencia e atualizar plano' : 'Manter acompanhamento semanal'}</td></tr>`).join('')}
          </tbody></table></div>
        </article>
      </section>
    `;
  }

  function gpPanel(state) {
    const client = getClient(state);
    const p = portfolio(state);
    const row = client ? p.rows.find((item) => item.client.id === client.id) : null;
    return `
      <section data-v4-role-panel class="dashboard-grid" style="margin-bottom:16px">
        <article class="glass-card span-12">
          <p class="eyebrow">Visao GP detalhista</p>
          <h2>${client ? escapeHtml(client.name) : 'Execucao detalhada por cliente'}</h2>
          <p class="muted">Profundidade operacional: plano de acao, tasks, CRM, midia, LPs, integracoes e status do projeto.</p>
        </article>
        ${client ? `
          <article class="glass-card span-3"><h3>Status</h3><strong style="font-size:24px">${row ? statusBadge(row) : 'OK'}</strong><p class="muted">Saude ${Number(client.health || 0)}%</p></article>
          <article class="glass-card span-3"><h3>CRM</h3><strong style="font-size:24px;color:${row?.hasCrm ? '#38d66b' : '#ffbd2e'}">${row?.hasCrm ? 'Sincronizado' : 'Pendente'}</strong><p class="muted">Fonte oficial BASE_CRM</p></article>
          <article class="glass-card span-3"><h3>Midia</h3><strong style="font-size:24px;color:${row?.hasMedia ? '#38d66b' : '#ffbd2e'}">${row?.hasMedia ? 'Sincronizada' : 'Pendente'}</strong><p class="muted">Mensal/Semanal</p></article>
          <article class="glass-card span-3"><h3>Tasks abertas</h3><strong style="font-size:24px;color:#5d94ff">${row?.openTasks || 0}</strong><p class="muted">${row?.overdue || 0} vencidas</p></article>
        ` : ''}
      </section>
    `;
  }

  function panelHtml(state, currentMode) {
    if (currentMode === 'coo') return cooPanel(state);
    if (currentMode === 'coordinator') return coordinatorPanel(state);
    return gpPanel(state);
  }

  function removeEventsCards() {
    document.querySelectorAll('h3').forEach((h3) => {
      if (/Eventos recentes/i.test(h3.textContent || '')) {
        const card = h3.closest('article.glass-card, .glass-card');
        if (card) card.remove();
      }
    });
  }

  function applyModeClasses(current) {
    document.body.classList.remove('v4-mode-gp', 'v4-mode-coordinator', 'v4-mode-coo');
    document.body.classList.add(`v4-mode-${current}`);
    let style = document.getElementById('v4-role-mode-style');
    if (!style) {
      style = document.createElement('style');
      style.id = 'v4-role-mode-style';
      document.head.appendChild(style);
    }
    style.textContent = `
      body.v4-mode-coo [data-tab="client-config"], body.v4-mode-coo [data-tab="competitors"], body.v4-mode-coo [data-tab="tasks"], body.v4-mode-coo [data-tab="central"] { display:none !important; }
      body.v4-mode-coordinator [data-tab="client-config"], body.v4-mode-coordinator [data-tab="competitors"] { display:none !important; }
      [data-v4-role-toolbar] .btn.primary { box-shadow:0 10px 26px rgba(93,148,255,.22); }
    `;
  }

  function mountRoleUi() {
    const main = document.getElementById('main');
    const page = main?.querySelector('.page');
    if (!main || !page) return;
    const current = mode();
    applyModeClasses(current);
    document.querySelectorAll('[data-v4-role-toolbar], [data-v4-role-panel]').forEach((node) => node.remove());
    const hero = page.querySelector('.hero');
    const anchor = hero || page.firstElementChild;
    if (!anchor) return;
    anchor.insertAdjacentHTML('afterend', roleToolbarHtml(current) + panelHtml(readState(), current));
  }

  function applyRoleView() {
    sanitizeState();
    removeEventsCards();
    mountRoleUi();
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-v4-role-mode]');
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    setMode(button.dataset.v4RoleMode);
  }, true);

  document.addEventListener('click', () => {
    setTimeout(applyRoleView, 120);
    setTimeout(applyRoleView, 800);
  });

  const observer = new MutationObserver(() => {
    clearTimeout(window.__v4RoleModeTimer);
    window.__v4RoleModeTimer = setTimeout(applyRoleView, 160);
  });

  if (document.body) observer.observe(document.body, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', () => setTimeout(applyRoleView, 250));
  setTimeout(applyRoleView, 700);
  setTimeout(applyRoleView, 1600);

  window.V4_ROLE_VIEW_MODES = { applyRoleView, setMode, mode, sanitizeState };
})();
