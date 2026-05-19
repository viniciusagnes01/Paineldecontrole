(function () {
  const STORAGE_KEY = 'v4-command-center-state-v6-crm-performance-losses';
  const seed = window.V4_SEED;
  const app = document.getElementById('app');
  const sidebar = document.getElementById('sidebar');
  const main = document.getElementById('main');

  const tabs = [
    { id: 'control', label: 'Painel de Controle' },
    { id: 'overview', label: 'Visão Geral' },
    { id: 'action', label: 'Plano de Ação' },
    { id: 'tasks', label: 'Tasks Atuais' },
    { id: 'central', label: 'Painel Central' },
    { id: 'ads', label: 'Mídia & Ads' },
    { id: 'crm', label: 'CRM & Funil' },
    { id: 'competitors', label: 'Concorrentes SEMrush' },
    { id: 'goals', label: 'Metas' },
    { id: 'status', label: 'Status do Projeto' },
    { id: 'client-config', label: 'Config do Cliente' }
  ];

  const entityMeta = {
    pixels: {
      title: 'Pixels e conversões',
      clientScoped: true,
      fields: [
        ['name', 'Nome'], ['platform', 'Plataforma'], ['status', 'Status'], ['events', 'Eventos'], ['lastEvent', 'Último evento']
      ],
      defaults: { platform: 'Meta', status: 'Ativo', events: 0, lastEvent: 'manual' }
    },
    competitors: {
      title: 'Concorrentes SEMrush',
      clientScoped: true,
      fields: [
        ['name', 'Nome'], ['domain', 'Domínio'], ['traffic', 'Tráfego'], ['keywords', 'Keywords'], ['authority', 'Autoridade'], ['paidKeywords', 'KW pagas'], ['gap', 'Gap'], ['status', 'Status']
      ],
      defaults: { traffic: 0, keywords: 0, authority: 0, paidKeywords: 0, gap: 'Mapear', status: 'Monitorando' }
    },
    campaigns: {
      title: 'Campanhas',
      clientScoped: true,
      fields: [
        ['name', 'Campanha'], ['channel', 'Canal'], ['investment', 'Investimento'], ['leads', 'Leads'], ['cpl', 'CPL'], ['roas', 'ROAS'], ['status', 'Status']
      ],
      defaults: { channel: 'Meta Ads', investment: 0, leads: 0, cpl: 0, roas: 0, status: 'Ativo' }
    },
    creatives: {
      title: 'Criativos',
      clientScoped: true,
      fields: [
        ['name', 'Criativo'], ['format', 'Formato'], ['ctr', 'CTR'], ['cpl', 'CPL'], ['status', 'Status']
      ],
      defaults: { format: 'Feed', ctr: 0, cpl: 0, status: 'Teste' }
    },
    tasks: {
      title: 'Tasks eKyte',
      clientScoped: true,
      fields: [
        ['title', 'Título'], ['status', 'Status'], ['owner', 'Executor'], ['type', 'Tipo'], ['priority', 'Prioridade'], ['start', 'Início'], ['end', 'Entrega'], ['progress', 'Progresso']
      ],
      defaults: { status: 'Backlog', owner: 'V4', type: 'Setup', priority: 'Média', start: '2026-05-16', end: '2026-05-20', progress: 0 }
    },
    actionPlan: {
      title: 'Plano de ação / Drawflow',
      clientScoped: true,
      fields: [
        ['what', 'O que'], ['why', 'Por que'], ['where', 'Onde'], ['when', 'Quando'], ['who', 'Quem'], ['how', 'Como'], ['status', 'Status']
      ],
      defaults: { where: 'Operação', when: 'Semana atual', who: 'V4', how: 'Executar plano', status: 'Backlog' }
    }
  };

  let state = normalizeState(loadState());
  let route = {
    scope: 'global',
    clientId: state.clients[0]?.id || null,
    tab: 'control'
  };

  function loadState() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return structuredCloneSafe(seed);
      return JSON.parse(stored);
    } catch (error) {
      return structuredCloneSafe(seed);
    }
  }

  function structuredCloneSafe(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function normalizeState(data) {
    const base = structuredCloneSafe(data || seed);
    base.settings = base.settings || seed.settings || {};
    base.integrations = base.integrations || [];
    base.clients = base.clients || [];
    base.pixels = base.pixels || [];
    base.competitors = base.competitors || [];
    base.campaigns = base.campaigns || [];
    base.creatives = base.creatives || [];
    base.tasks = base.tasks || [];
    base.actionPlan = base.actionPlan || [];
    base.events = base.events || [];
    base.alerts = base.alerts || [];
    base.crmSnapshots = base.crmSnapshots || {};
    base.performanceSnapshots = base.performanceSnapshots || {};
    base.clients.forEach((client) => {
      client.lps = client.lps || [];
      client.crmSheet = client.crmSheet || { type: 'googleSheetsCsv', spreadsheetId: '', url: '', sheetName: 'BASE_CRM', dashboardSheetName: 'DASH_CRM', gid: '', proxyUrl: '', status: 'Não configurado', lastSync: '' };
      client.performanceSheets = client.performanceSheets || { type: 'googleSheetsCsv', spreadsheetId: client.crmSheet?.spreadsheetId || '', url: client.crmSheet?.url || '', monthlySheetName: '1.0 Mensal', weeklySheetName: '2.0 Semanal', monthlyGid: '', weeklyGid: '', metaRawSheetName: 'bd Meta Ads', googleRawSheetName: 'bd Google Ads ', proxyUrl: '', status: client.crmSheet?.spreadsheetId ? 'Configurado' : 'Não configurado', lastSync: '' };
      client.metrics = client.metrics || {};
      client.goals = client.goals || {};
      client.initials = client.initials || getInitials(client.name);
      client.color = client.color || '#cf1022';
      client.accent = client.accent || '#ff3048';
      client.health = Number(client.health || 70);
    });
    return base;
  }

  function getInitials(name) {
    return String(name || 'V4').split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  }

  function uid(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`;
  }

  function fmtCurrency(value) {
    return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function fmtNumber(value) {
    return Number(value || 0).toLocaleString('pt-BR');
  }

  function pct(value) {
    return `${Number(value || 0).toFixed(1).replace('.', ',')}%`;
  }

  function getClient(id = route.clientId) {
    return state.clients.find((client) => client.id === id) || state.clients[0];
  }

  function byClient(collection, clientId = route.clientId) {
    return state[collection].filter((item) => item.clientId === clientId);
  }


  function getCrmSnapshot(clientOrId) {
    const id = typeof clientOrId === 'string' ? clientOrId : clientOrId?.id;
    return state.crmSnapshots?.[id] || null;
  }

  function getPerformanceSnapshot(clientOrId) {
    const id = typeof clientOrId === 'string' ? clientOrId : clientOrId?.id;
    return state.performanceSnapshots?.[id] || null;
  }

  function currentPerformance(clientOrId) {
    const snapshot = getPerformanceSnapshot(clientOrId);
    return snapshot?.monthly?.current || snapshot?.weekly?.current || null;
  }

  function performanceMetrics(clientOrId) {
    return currentPerformance(clientOrId)?.metrics || {};
  }

  function clientMetrics(client) {
    const crm = getCrmSnapshot(client);
    const perf = performanceMetrics(client);
    const base = client.metrics || {};
    const investment = Number(perf.investment || base.investment || 0);
    const crmRevenue = Number(crm?.totals?.value || 0);
    const revenue = crmRevenue || Number(perf.revenue || base.revenue || 0);
    const crmLeads = Number(crm?.totals?.lead || 0);
    const leads = crmLeads || Number(perf.leads || base.leads || 0);
    const sales = Number(crm?.totals?.purchase || perf.sales || base.sales || 0);
    const ticket = Number(crm?.rates?.ticket || perf.ticket || base.ticket || 0);
    const cpl = Number(perf.cpl || base.cpl || (investment && leads ? investment / leads : 0));
    const roas = Number(perf.roas || (investment && revenue ? revenue / investment : base.roas || 0));
    return {
      ...base,
      revenue,
      investment,
      leads,
      mql: Number(crm?.totals?.mql || base.mql || 0),
      sql: Number(crm?.totals?.sql || base.sql || 0),
      opportunities: Number(crm?.totals?.opportunity || base.opportunities || 0),
      sales,
      ticket,
      cpl,
      roas,
      impressions: Number(perf.impressions || base.impressions || 0),
      clicks: Number(perf.clicks || base.clicks || 0),
      ctr: Number(perf.ctr || base.ctr || 0),
      cpc: Number(perf.cpc || base.cpc || 0),
      conversion: Number(perf.conversion || base.conversion || 0),
      pacing: Number(perf.pacing || base.pacing || 0),
      plannedMedia: Number(perf.plannedMedia || base.plannedMedia || 0),
      dataSource: crm ? 'crm-sheet' : perf ? 'performance-sheet' : 'demo-local'
    };
  }

  function funnelRates(snapshot, metrics) {
    if (snapshot?.rates) return snapshot.rates;
    const m = metrics || {};
    return {
      leadToMql: (m.mql || 0) / Math.max(m.leads || 1, 1) * 100,
      mqlToSql: (m.sql || 0) / Math.max(m.mql || 1, 1) * 100,
      sqlToOpportunity: (m.opportunities || 0) / Math.max(m.sql || 1, 1) * 100,
      opportunityToSale: (m.sales || 0) / Math.max(m.opportunities || 1, 1) * 100,
      saleRate: (m.sales || 0) / Math.max(m.leads || 1, 1) * 100,
      lossRate: 0,
      ticket: m.ticket || 0
    };
  }

  function allLps() {
    return state.clients.flatMap((client) => (client.lps || []).map((lp) => ({ ...lp, clientId: client.id, clientName: client.name })));
  }

  function totals() {
    const metrics = state.clients.reduce((acc, client) => {
      const m = clientMetrics(client);
      acc.revenue += Number(m.revenue || 0);
      acc.target += Number(m.revenueTarget || client.goals?.revenue || 0);
      acc.leads += Number(m.leads || 0);
      acc.investment += Number(m.investment || 0);
      acc.mql += Number(m.mql || 0);
      acc.sql += Number(m.sql || 0);
      acc.opportunities += Number(m.opportunities || 0);
      acc.sales += Number(m.sales || 0);
      return acc;
    }, { revenue: 0, target: 0, leads: 0, investment: 0, mql: 0, sql: 0, opportunities: 0, sales: 0 });
    metrics.cpl = metrics.leads ? metrics.investment / metrics.leads : 0;
    metrics.roas = metrics.investment ? metrics.revenue / metrics.investment : 0;
    metrics.goalPct = metrics.target ? Math.round((metrics.revenue / metrics.target) * 100) : 0;
    return metrics;
  }

  function metricCard(title, value, subtitle, color, icon, points = [12, 28, 20, 36, 30, 48, 42, 60, 52, 70]) {
    const svgPoints = points.map((p, i) => `${(i / (points.length - 1)) * 100},${100 - p}`).join(' ');
    return `
      <article class="metric-card glass-card" style="--metric-color:${color || '#fff'}">
        <div class="metric-top"><span>${escapeHtml(title)}</span><span class="metric-icon">${icon || '•'}</span></div>
        <strong class="metric-value">${value}</strong>
        <span class="metric-delta">${escapeHtml(subtitle || '')}</span>
        <div class="sparkline"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polyline fill="none" stroke="${color || '#fff'}" stroke-width="5" stroke-linecap="round" points="${svgPoints}"/><polygon fill="${hexToRgba(color || '#fff', 0.18)}" points="0,100 ${svgPoints} 100,100"/></svg></div>
      </article>
    `;
  }

  function hexToRgba(hex, alpha) {
    const normalized = String(hex || '#ffffff').replace('#', '');
    if (normalized.length !== 6) return `rgba(255,255,255,${alpha})`;
    const r = parseInt(normalized.slice(0, 2), 16);
    const g = parseInt(normalized.slice(2, 4), 16);
    const b = parseInt(normalized.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  }

  function badge(status) {
    const s = String(status || '').toLowerCase();
    const cls = s.includes('ativo') || s.includes('ok') || s.includes('campe') || s.includes('conclu') || s.includes('monitor') ? 'ok' : s.includes('aten') || s.includes('pend') || s.includes('teste') || s.includes('backlog') || s.includes('execu') || s.includes('valida') ? 'warn' : s.includes('inativo') || s.includes('erro') ? 'bad' : 'client';
    return `<span class="badge ${cls}">${escapeHtml(status || 'N/A')}</span>`;
  }

  function renderSidebar() {
    const t = totals();
    sidebar.innerHTML = `
      <div class="brand-block">
        <img class="brand-logo" src="src/assets/v4-company-logo.jpg" alt="V4 Company" />
        <div>
          <span class="brand-title">V4 Command Center</span>
          <span class="brand-subtitle">Operação • Performance • CRM</span>
        </div>
      </div>
      <nav class="nav-stack" aria-label="Navegação principal">
        <button class="nav-btn ${route.scope === 'global' ? 'active' : ''}" data-nav="global"><span>⌂</span><span>Painel Geral</span></button>
        <button class="nav-btn ${route.scope === 'settings' ? 'active' : ''}" data-nav="settings"><span>⚙</span><span>Configurações Gerais</span></button>
      </nav>
      <div class="sidebar-card">
        <span class="muted">Infraestrutura</span>
        <strong>${state.clients.length} clientes ativos</strong>
        <p class="muted">CRUD local para clientes, LPs, pixels, concorrentes, campanhas, criativos, metas, eKyte e plano de ação.</p>
        <div class="progress" style="--p:${Math.min(t.goalPct, 100)}%"><span></span></div>
        <small class="muted">${t.goalPct}% da meta consolidada</small>
      </div>
      <div class="sidebar-section-title">Clientes monitorados</div>
      <div class="client-list">
        ${state.clients.map((client) => `
          <button class="client-btn ${route.scope === 'client' && route.clientId === client.id ? 'active' : ''}" data-client="${client.id}" style="--client-color:${client.color}">
            <span class="client-avatar">${escapeHtml(client.initials)}</span>
            <span>
              <span class="client-name">${escapeHtml(client.name)}</span>
              <span class="client-meta">ID Grupo: ${escapeHtml(client.groupId || '-')}</span>
            </span>
          </button>
        `).join('')}
      </div>
    `;
  }

  function render() {
    renderSidebar();
    if (route.scope === 'global') renderGlobalPanel();
    if (route.scope === 'settings') renderGlobalSettings();
    if (route.scope === 'client') renderClientPage();
  }

  function renderGlobalPanel() {
    const t = totals();
    const lps = allLps();
    const activeLps = lps.filter((lp) => lp.status === 'Ativo').length;
    const activePixels = state.pixels.filter((pixel) => pixel.status === 'Ativo').length;
    const activeCampaigns = state.campaigns.filter((campaign) => campaign.status === 'Ativo').length;
    main.innerHTML = `
      <section class="page">
        <header class="hero">
          <img class="hero-logo" src="src/assets/v4-company-logo.jpg" alt="Logo V4 Company" />
          <div>
            <p class="eyebrow">V4 Company</p>
            <h1>Painel de Controle</h1>
            <p class="hero-copy">Visão geral de todos os sistemas, clientes, integrações, alertas, CRM, mídia, LPs, pixels, concorrência e execução operacional.</p>
          </div>
          <div class="period-box">
            <small>Período</small>
            <strong>${escapeHtml(state.settings.period)}</strong>
            <button class="btn primary" data-action="refresh">↻ Atualizar</button>
          </div>
        </header>

        <section class="metric-grid">
          ${metricCard('Faturamento (mês)', fmtCurrency(t.revenue), `${t.goalPct}% da meta`, '#12d842', '$')}
          ${metricCard('Leads (mês)', fmtNumber(t.leads), '+18% vs mês anterior', '#5d94ff', '👥')}
          ${metricCard('CPL médio', fmtCurrency(t.cpl), '-12% vs mês anterior', '#aa61ff', '▦')}
          ${metricCard('ROAS (mês)', `${t.roas.toFixed(2).replace('.', ',')}x`, '+8% vs mês anterior', '#ff9800', '↗')}
          ${metricCard('Investimento (mês)', fmtCurrency(t.investment), '-5% vs mês anterior', '#ff424d', '$')}
        </section>

        <section class="dashboard-grid">
          <article class="glass-card span-3">${renderStatusPanel('Landing Pages', lps.slice(0, 5), 'name', 'status', `${activeLps}/${lps.length || 0} ativas`)}</article>
          <article class="glass-card span-3">${renderStatusPanel('Integrações', state.integrations.slice(0, 5), 'name', 'status', `${state.integrations.length} fontes`)}</article>
          <article class="glass-card span-3">${renderStatusPanel('CRM', crmRows(), 'name', 'status', 'Moskit + Kommo')}</article>
          <article class="glass-card span-3">${renderStatusPanel('Pixel & Conversões', state.pixels.slice(0, 5), 'name', 'status', `${activePixels}/${state.pixels.length} ativos`)}</article>

          <article class="glass-card span-4">${renderAlerts()}</article>
          <article class="glass-card span-4">${renderEvents()}</article>
          <article class="glass-card span-4">${renderCampaignSummary(state.campaigns.slice(0, 6))}</article>

          <article class="glass-card span-6">${renderClientHealth()}</article>
          <article class="glass-card span-6">${renderGlobalCompetitors()}</article>
          <article class="glass-card span-12">${renderSystemConfigPreview()}</article>
        </section>
        ${renderFooter()}
      </section>
    `;
  }

  function crmRows() {
    return [
      { name: 'Moskit CRM', status: state.integrations.find((i) => i.id === 'moskit')?.status || 'Ativo' },
      { name: 'Kommo CRM', status: state.integrations.find((i) => i.id === 'kommo')?.status || 'Ativo' },
      { name: 'Pipeline Comercial', status: 'Ativo' },
      { name: 'Etapas do Funil', status: 'Ativo' },
      { name: 'Tarefas Automáticas', status: 'Ativo' }
    ];
  }

  function renderStatusPanel(title, rows, nameKey, statusKey, footer) {
    return `
      <h3>${escapeHtml(title)}</h3>
      <div class="status-list">
        ${rows.map((row) => {
          const status = row[statusKey] || 'Ativo';
          const cls = String(status).toLowerCase().includes('inativo') || String(status).toLowerCase().includes('erro') ? 'danger' : String(status).toLowerCase().includes('aten') || String(status).toLowerCase().includes('pend') ? 'warning' : '';
          return `<div class="status-row"><span>▣</span><strong>${escapeHtml(row[nameKey])}</strong><span class="status-${cls || 'active'}">${escapeHtml(status)}</span><i class="dot ${cls}"></i></div>`;
        }).join('')}
      </div>
      <button class="btn ghost" data-nav="settings" style="width:100%; margin-top:14px;">Ver todos • ${escapeHtml(footer)}</button>
    `;
  }

  function renderAlerts() {
    return `
      <h3>Alertas e pontos de atenção</h3>
      <div class="status-list">
        ${state.alerts.map((alert) => `<div class="status-row"><span>${alert.level === 'ok' ? '✅' : '⚠️'}</span><strong>${escapeHtml(alert.text)}<br><small class="muted">${escapeHtml(alert.detail)}</small></strong><span></span><i class="dot ${alert.level === 'ok' ? '' : 'warning'}"></i></div>`).join('')}
      </div>
    `;
  }

  function renderEvents() {
    return `
      <h3>Eventos recentes</h3>
      <div class="status-list">
        ${state.events.map((event) => `<div class="status-row"><span>${event.type === 'sale' ? '💰' : event.type === 'alert' ? '🔴' : event.type === 'lead' ? '👤' : '🔄'}</span><strong>${escapeHtml(event.text)}</strong><span class="muted">${escapeHtml(event.time)}</span><i class="dot"></i></div>`).join('')}
      </div>
    `;
  }

  function renderCampaignSummary(rows) {
    return `
      <h3>Resumo de campanhas</h3>
      <div class="table-wrap"><table><thead><tr><th>Campanha</th><th>Investimento</th><th>Leads</th><th>CPL</th><th>ROAS</th><th>Status</th></tr></thead><tbody>
      ${rows.map((row) => `<tr><td>${escapeHtml(row.name)}</td><td>${fmtCurrency(row.investment)}</td><td>${fmtNumber(row.leads)}</td><td>${fmtCurrency(row.cpl)}</td><td>${Number(row.roas).toFixed(2).replace('.', ',')}x</td><td>${badge(row.status)}</td></tr>`).join('')}
      </tbody></table></div>
    `;
  }

  function renderClientHealth() {
    return `
      <h3>Clientes e saúde da operação</h3>
      <div class="kpi-list">
        ${state.clients.map((client) => `<div class="kpi-row"><span><strong>${escapeHtml(client.name)}</strong><br><small class="muted">${escapeHtml(client.segment)} • ${escapeHtml(client.crm)} • Grupo ${escapeHtml(client.groupId)}</small></span><span>${badge(`${client.health}/100`)}</span></div>`).join('')}
      </div>
    `;
  }

  function renderGlobalCompetitors() {
    return `
      <h3>Radar SEMrush consolidado</h3>
      <div class="table-wrap"><table><thead><tr><th>Cliente</th><th>Concorrente</th><th>Domínio</th><th>Tráfego</th><th>Keywords</th><th>Gap</th></tr></thead><tbody>
      ${state.competitors.slice(0, 8).map((co) => `<tr><td>${escapeHtml(getClient(co.clientId)?.name || '-')}</td><td>${escapeHtml(co.name)}</td><td>${escapeHtml(co.domain)}</td><td>${fmtNumber(co.traffic)}</td><td>${fmtNumber(co.keywords)}</td><td>${escapeHtml(co.gap)}</td></tr>`).join('')}
      </tbody></table></div>
    `;
  }

  function renderSystemConfigPreview() {
    return `
      <h3>Área editável do sistema</h3>
      <div class="config-nav">
        <div class="config-tile"><span>👥</span><strong>Clientes</strong><p class="muted">Inserir, editar, excluir e abrir operação.</p></div>
        <div class="config-tile"><span>🧩</span><strong>LPs e Pixels</strong><p class="muted">Ativar, pausar, atualizar eventos e URLs.</p></div>
        <div class="config-tile"><span>📊</span><strong>Campanhas</strong><p class="muted">Meta, Google, LinkedIn e resumo executivo.</p></div>
        <div class="config-tile"><span>🧠</span><strong>SEMrush</strong><p class="muted">Concorrentes, domínios, gaps e keywords.</p></div>
        <div class="config-tile"><span>✅</span><strong>eKyte</strong><p class="muted">Tasks, Gantt, status e plano de ação.</p></div>
      </div>
    `;
  }

  function renderClientPage() {
    const client = getClient();
    if (!client) {
      main.innerHTML = '<section class="page"><div class="empty">Nenhum cliente cadastrado.</div></section>';
      return;
    }
    const content = renderClientTab(client);
    main.innerHTML = `
      <section class="page" style="--client-color:${client.color}; --red-2:${client.accent || '#ff3048'}">
        ${renderClientHero(client)}
        ${renderTabs()}
        ${content}
        ${renderFooter()}
      </section>
    `;
  }

  function renderClientHero(client) {
    return `
      <header class="client-hero">
        <div>
          <p class="eyebrow">Painel operacional V4</p>
          <h1>${escapeHtml(client.name)}</h1>
          <p class="hero-copy">${escapeHtml(client.segment)} • CRM: <strong>${escapeHtml(client.crm)}</strong> • Responsável: <strong>${escapeHtml(client.responsible)}</strong></p>
          <div class="client-tags">
            <span class="badge ok">${escapeHtml(client.status)}</span>
            <span class="badge client">Saúde: ${escapeHtml(client.health)}/100</span>
            <span class="badge client">Grupo: ${escapeHtml(client.groupId)}</span>
            <span class="badge client">Atualizado: ${new Date().toLocaleString('pt-BR')}</span>
          </div>
        </div>
        <aside class="identity-card">
          <div class="identity-mark">${escapeHtml(client.mascot || client.initials)}</div>
          <small>Identidade do cliente</small>
          <strong>${escapeHtml(client.initials)}</strong>
        </aside>
      </header>
    `;
  }

  function renderTabs() {
    return `
      <nav class="tab-rail" aria-label="Abas do cliente">
        ${tabs.map((tab) => `<button class="tab-btn ${route.tab === tab.id ? 'active' : ''}" data-tab="${tab.id}">${escapeHtml(tab.label)}</button>`).join('')}
      </nav>
    `;
  }

  function renderClientTab(client) {
    const map = {
      control: () => renderClientControl(client),
      overview: () => renderOverview(client),
      action: () => renderActionPlan(client),
      tasks: () => renderTasks(client),
      central: () => renderCentral(client),
      ads: () => renderAds(client),
      crm: () => renderCrm(client),
      competitors: () => renderCompetitors(client),
      goals: () => renderGoals(client),
      status: () => renderStatusProject(client),
      'client-config': () => renderClientConfig(client)
    };
    return (map[route.tab] || map.control)();
  }

  function renderClientControl(client) {
    const m = clientMetrics(client);
    const target = Number(client.goals?.revenue || m.revenueTarget || 0);
    const goalPct = target ? Math.round(Number(m.revenue || 0) / target * 100) : 0;
    const lps = client.lps || [];
    return `
      <section class="metric-grid">
        ${metricCard('Faturamento (mês)', fmtCurrency(m.revenue), `${goalPct}% da meta`, '#12d842', '$')}
        ${metricCard('Leads (mês)', fmtNumber(m.leads), '+18% vs mês anterior', '#5d94ff', '👥')}
        ${metricCard('CPL médio', fmtCurrency(m.cpl), '-12% vs mês anterior', '#aa61ff', '▦')}
        ${metricCard('ROAS (mês)', `${Number(m.roas || 0).toFixed(2).replace('.', ',')}x`, '+8% vs mês anterior', '#ff9800', '↗')}
        ${metricCard('Investimento (mês)', fmtCurrency(m.investment), '-5% vs mês anterior', '#ff424d', '$')}
      </section>
      <section class="dashboard-grid">
        <article class="glass-card span-12">${renderPerformanceSourcePanel(client, getPerformanceSnapshot(client))}</article>
        <article class="glass-card span-3">${renderStatusPanel('Landing Pages', lps, 'name', 'status', `${lps.length} páginas`)}</article>
        <article class="glass-card span-3">${renderStatusPanel('Integrações', state.integrations.slice(0,5), 'name', 'status', 'N8N/API')}</article>
        <article class="glass-card span-3">${renderStatusPanel('CRM', crmRows(), 'name', 'status', client.crm)}</article>
        <article class="glass-card span-3">${renderStatusPanel('Pixel & Conversões', byClient('pixels', client.id), 'name', 'status', 'eventos ativos')}</article>
        <article class="glass-card span-4">${renderAlerts()}</article>
        <article class="glass-card span-4">${renderEvents()}</article>
        <article class="glass-card span-4">${renderCampaignSummary(byClient('campaigns', client.id))}</article>
        <article class="glass-card span-12">${renderFunnel(client)}</article>
        <article class="glass-card span-6">${renderSemrushCards(client)}</article>
        <article class="glass-card span-6">${renderEkyteSummary(client)}</article>
      </section>
    `;
  }

  function renderOverview(client) {
    return `
      <section class="dashboard-grid">
        <article class="glass-card span-12">${renderFunnel(client)}</article>
        <article class="glass-card span-6">
          <h3>Objetivo Smart Performance</h3>
          <p class="muted">Acelerar tração, elevar qualificação do funil, escalar investimento com CAC controlado e manter rastreabilidade ponta a ponta.</p>
          <div class="insight-grid">
            <div class="insight-card"><strong>KR 1</strong><p>Atingir ${fmtCurrency(client.goals?.revenue || 0)} em faturamento mensal/trimestral conforme plano.</p></div>
            <div class="insight-card"><strong>KR 2</strong><p>Elevar Lead → MQL para ${pct(client.goals?.mqlRate || 0)} com melhoria de segmentação e qualificação.</p></div>
            <div class="insight-card"><strong>KR 3</strong><p>Manter CAC abaixo de ${fmtCurrency(client.goals?.cac || 0)} e ROAS alvo de ${Number(client.goals?.roas || 0).toFixed(1)}x.</p></div>
          </div>
        </article>
        <article class="glass-card span-6">
          <h3>Restrição atual identificada</h3>
          <div class="kpi-list">
            <div class="kpi-row"><span><strong>Quem age não serve</strong><br><small class="muted">Leads sem perfil, capacidade ou intenção de compra.</small></span>${badge('Prioridade')}</div>
            <div class="kpi-row"><span><strong>Rastreabilidade de ponta a ponta</strong><br><small class="muted">Eventos precisam fechar Lead → MQL → SQL → Venda.</small></span>${badge('Em execução')}</div>
            <div class="kpi-row"><span><strong>Escala com CAC controlado</strong><br><small class="muted">Budget sobe somente com funil saudável.</small></span>${badge('Monitorando')}</div>
          </div>
        </article>
      </section>
    `;
  }

  function renderFunnel(client) {
    const m = clientMetrics(client);
    const steps = [
      ['Impressões', 1019630, 'Topo'],
      ['Cliques', Math.round(Number(m.leads || 0) * 5.4), 'CTR'],
      ['Leads', m.leads, fmtCurrency(m.cpl || 0)],
      ['MQLs', m.mql, 'Qualificados'],
      ['Oportunidades', m.opportunities, 'Comercial'],
      ['Vendas', m.sales, fmtCurrency(m.ticket || 0)]
    ];
    return `
      <h3>Jornada completa do funil</h3>
      <div class="funnel">
        ${steps.map(([label, value, sub]) => `<div class="funnel-step"><small>${escapeHtml(label)}</small><strong>${fmtNumber(value)}</strong><span class="muted">${escapeHtml(sub)}</span></div>`).join('')}
      </div>
    `;
  }

  function renderActionPlan(client) {
    const plans = byClient('actionPlan', client.id);
    return `
      <section class="dashboard-grid">
        <article class="glass-card span-12">
          <h2>Plano de Ação em Drawflow</h2>
          <p class="muted">Fluxo visual para o plano de ação. Esta área está preparada para receber dados do eKyte/N8N e virar um drawflow dinâmico.</p>
          <div class="drawflow">
            ${plans.slice(0,4).map((plan, index) => `<div class="draw-node"><span class="badge ${index === 0 ? 'ok' : 'warn'}">${escapeHtml(plan.status)}</span><h3>${escapeHtml(plan.what)}</h3><p><strong>Por que:</strong> ${escapeHtml(plan.why)}</p><p><strong>Como:</strong> ${escapeHtml(plan.how)}</p><small class="muted">${escapeHtml(plan.who)} • ${escapeHtml(plan.when)}</small></div>`).join('')}
          </div>
        </article>
        <article class="glass-card span-12">${editableEntity('actionPlan', client.id)}</article>
      </section>
    `;
  }

  function renderTasks(client) {
    const tasks = byClient('tasks', client.id);
    const statuses = ['Backlog', 'Em execução', 'Validação', 'Concluído'];
    return `
      <section class="dashboard-grid">
        <article class="glass-card span-12">
          <h2>Tasks Atuais • eKyte</h2>
          <p class="muted">Kanban operacional com fluxo preparado para puxar título, datas, tipo, executor, esforço, prioridade, status e progresso do eKyte.</p>
          <div class="kanban">
            ${statuses.map((status) => {
              const list = tasks.filter((task) => task.status === status);
              return `<div class="kanban-col"><div class="kanban-head"><h3>${status}</h3><span class="badge client">${list.length}</span></div>${list.map((task) => `<div class="task-card"><span class="badge warn">${escapeHtml(task.type)}</span><strong>${escapeHtml(task.title)}</strong><small>${escapeHtml(task.owner)} • ${escapeHtml(task.priority)} • ${escapeHtml(task.start)} → ${escapeHtml(task.end)}</small><div class="progress" style="--p:${Number(task.progress || 0)}%; margin-top:12px"><span></span></div></div>`).join('') || '<div class="empty">Sem cards</div>'}</div>`;
            }).join('')}
          </div>
        </article>
        <article class="glass-card span-12">
          <h3>Gantt eKyte / Revisão do Playbook</h3>
          <div class="gantt">
            ${tasks.map((task) => `<div class="gantt-row"><strong>${escapeHtml(task.title)}</strong><div class="gantt-line"><div class="gantt-bar" style="--p:${Number(task.progress || 0)}%"></div></div><small class="muted">${Number(task.progress || 0)}%</small></div>`).join('')}
          </div>
        </article>
        <article class="glass-card span-12">${editableEntity('tasks', client.id)}</article>
      </section>
    `;
  }

  function renderCentral(client) {
    const lps = client.lps || [];
    const systemRows = [
      { name: 'Landing Pages', value: `${lps.filter((lp) => lp.status === 'Ativo').length}/${lps.length}`, status: 'Ativo' },
      { name: 'CRM', value: client.crm, status: 'Ativo' },
      { name: 'Evolution API', value: client.groupId, status: 'Ativo' },
      { name: 'N8N', value: 'Webhooks preparados', status: 'Ativo' },
      { name: 'Google Drive/Sheets', value: 'Leitura e escrita', status: 'Ativo' },
      { name: 'SEMrush', value: 'Concorrentes', status: 'Preparado' }
    ];
    return `
      <section class="dashboard-grid">
        <article class="glass-card span-6">${renderStatusPanel('Checklist de infraestrutura', systemRows, 'name', 'status', 'operacional')}</article>
        <article class="glass-card span-6">
          <h3>Landing pages monitoradas</h3>
          <div class="table-wrap"><table><thead><tr><th>LP</th><th>URL</th><th>Status</th><th>Speed</th><th>Conversão</th></tr></thead><tbody>${lps.map((lp) => `<tr><td>${escapeHtml(lp.name)}</td><td>${escapeHtml(lp.url)}</td><td>${badge(lp.status)}</td><td>${lp.speed || 0}/100</td><td>${pct(lp.conversion || 0)}</td></tr>`).join('')}</tbody></table></div>
        </article>
        <article class="glass-card span-12">${editableLps(client)}</article>
      </section>
    `;
  }

  function renderAds(client) {
    const rows = byClient('campaigns', client.id);
    const snapshot = getPerformanceSnapshot(client);
    const currentMonth = snapshot?.monthly?.current;
    const currentWeek = snapshot?.weekly?.current;
    const m = clientMetrics(client);
    return `
      <section class="dashboard-grid">
        <article class="glass-card span-12">${renderPerformanceSourcePanel(client, snapshot)}</article>
        <article class="glass-card span-12">
          <h2>Mídia & Ads • Mensal + Semanal</h2>
          <p class="muted">O painel principal usa as abas consolidadas 1.0 Mensal e 2.0 Semanal. As abas brutas Meta/Google ficam como camada de drill-down por campanha.</p>
          <div class="metric-grid">
            ${metricCard('Investimento mensal', fmtCurrency(m.investment), currentMonth ? `Período ${escapeHtml(currentMonth.label)}` : 'base local/demo', '#ff424d', '$')}
            ${metricCard('Impressões', fmtNumber(m.impressions), `${fmtNumber(m.clicks)} cliques`, '#5d94ff', '↗')}
            ${metricCard('Leads de mídia', fmtNumber(currentMonth?.metrics?.leads || m.leads), `CPL ${fmtCurrency(m.cpl)}`, '#12d842', '👥')}
            ${metricCard('CTR', pct(m.ctr), `CPC ${fmtCurrency(m.cpc)}`, '#ffbd2e', '◎')}
            ${metricCard('Pacing', pct(m.pacing), `Planejado ${fmtCurrency(m.plannedMedia)}`, '#aa61ff', '▦')}
          </div>
        </article>
        <article class="glass-card span-6">${renderPerformancePeriodTable('Mensal', snapshot?.monthly)}</article>
        <article class="glass-card span-6">${renderPerformancePeriodTable('Semanal', snapshot?.weekly)}</article>
        <article class="glass-card span-8">${renderMediaBreakdown(client, snapshot)}</article>
        <article class="glass-card span-4">${editableEntity('creatives', client.id)}</article>
        <article class="glass-card span-12">${renderCampaignSummary(rows)}</article>
        <article class="glass-card span-12">${editableEntity('campaigns', client.id)}</article>
      </section>
    `;
  }

  function renderPerformanceSourcePanel(client, snapshot) {
    const source = client.performanceSheets || {};
    const configured = Boolean(source.spreadsheetId || source.url || source.proxyUrl);
    return `
      <div class="source-panel">
        <div>
          <p class="eyebrow">Mídia dinâmica • Google Sheets</p>
          <h2>${escapeHtml(client.name)} • 1.0 Mensal + 2.0 Semanal</h2>
          <p class="muted">Fonte recomendada para gestão executiva: mensal/semanal para investimento, pacing, impressões, cliques, leads, CPL, CTR e evolução. bd Meta Ads e bd Google Ads ficam para auditoria granular.</p>
          <div class="client-tags">
            ${badge(source.status || (configured ? 'Configurado' : 'Não configurado'))}
            <span class="badge client">Mensal: ${escapeHtml(source.monthlySheetName || '1.0 Mensal')}</span>
            <span class="badge client">Semanal: ${escapeHtml(source.weeklySheetName || '2.0 Semanal')}</span>
            <span class="badge client">Último sync: ${escapeHtml(source.lastSync || snapshot?.generatedAt || 'pendente')}</span>
          </div>
        </div>
        <div class="source-actions">
          <button class="btn primary" data-action="sync-performance-client" data-client-id="${client.id}">Sincronizar mídia agora</button>
          <button class="btn ghost" data-tab="client-config">Configurar fonte</button>
        </div>
      </div>
      ${!configured ? '<div class="empty">Configure o ID da planilha ou proxy N8N em Config do Cliente.</div>' : ''}
    `;
  }

  function renderPerformancePeriodTable(title, block) {
    const periods = block?.periods || [];
    const current = block?.current;
    return `
      <h3>${escapeHtml(title)} • histórico consolidado</h3>
      ${current ? `<div class="mini-summary"><span>${badge('Atual')}</span><strong>${escapeHtml(current.label)}</strong><small class="muted">Investimento ${fmtCurrency(current.metrics?.investment || 0)} • Leads ${fmtNumber(current.metrics?.leads || 0)}</small></div>` : '<div class="empty">Sincronize a fonte para carregar os períodos.</div>'}
      <div class="table-wrap"><table><thead><tr><th>Período</th><th>Invest.</th><th>Impr.</th><th>Cliques</th><th>Leads</th><th>CPL</th><th>CTR</th><th>Pacing</th></tr></thead><tbody>
      ${periods.length ? periods.slice(-8).reverse().map((period) => `<tr><td>${escapeHtml(period.label)}</td><td>${fmtCurrency(period.metrics?.investment || 0)}</td><td>${fmtNumber(period.metrics?.impressions || 0)}</td><td>${fmtNumber(period.metrics?.clicks || 0)}</td><td>${fmtNumber(period.metrics?.leads || 0)}</td><td>${fmtCurrency(period.metrics?.cpl || 0)}</td><td>${pct(period.metrics?.ctr || 0)}</td><td>${pct(period.metrics?.pacing || 0)}</td></tr>`).join('') : '<tr><td colspan="8">Aguardando sincronização.</td></tr>'}
      </tbody></table></div>
    `;
  }

  function renderMediaBreakdown(client, snapshot) {
    const crm = getCrmSnapshot(client);
    const sources = crm?.sources || [];
    const monthly = snapshot?.monthly?.current?.metrics || {};
    return `
      <h3>Cruzamento mídia paga → funil CRM</h3>
      <div class="insight-grid">
        <div class="insight-card"><span class="badge ok">Mensal</span><strong>${fmtCurrency(monthly.investment || 0)}</strong><p class="muted">Investimento consolidado da aba 1.0 Mensal.</p></div>
        <div class="insight-card"><span class="badge client">Meta/Google no CRM</span><strong>${fmtNumber((crm?.totals?.meta || 0) + (crm?.totals?.google || 0))}</strong><p class="muted">Leads atribuídos pelas colunas META ADS e GOOGLE ADS da BASE_CRM.</p></div>
        <div class="insight-card"><span class="badge warn">Drill-down</span><strong>${escapeHtml(client.performanceSheets?.metaRawSheetName || 'bd Meta Ads')}</strong><p class="muted">Camada preparada para campanha/conjunto/anúncio.</p></div>
        <div class="insight-card"><span class="badge warn">Drill-down</span><strong>${escapeHtml(client.performanceSheets?.googleRawSheetName || 'bd Google Ads')}</strong><p class="muted">Camada preparada para campanha/palavra-chave.</p></div>
      </div>
      <div class="table-wrap"><table><thead><tr><th>Origem no CRM</th><th>Leads</th><th>% do funil</th><th>Observação</th></tr></thead><tbody>
        ${sources.length ? sources.map((row) => `<tr><td>${escapeHtml(row.label)}</td><td>${fmtNumber(row.lead)}</td><td>${pct((row.lead || 0) / Math.max(crm?.totals?.lead || 1, 1) * 100)}</td><td>Base CRM atribuiu a origem nesta coluna.</td></tr>`).join('') : '<tr><td colspan="4">Sincronize CRM e mídia para cruzar origem.</td></tr>'}
      </tbody></table></div>
    `;
  }

  function renderCrm(client) {
    const snapshot = getCrmSnapshot(client);
    const m = clientMetrics(client);
    const rates = funnelRates(snapshot, m);
    return `
      <section class="dashboard-grid">
        <article class="glass-card span-12">${renderCrmSourcePanel(client, snapshot)}</article>
        <article class="glass-card span-12">${renderFunnel(client)}</article>
        <article class="glass-card span-3">${metricCard('Leads CRM', fmtNumber(m.leads), `${snapshot?.rows ? fmtNumber(snapshot.rows) + ' linhas lidas' : 'base local/demo'}`, '#5d94ff', '👥')}</article>
        <article class="glass-card span-3">${metricCard('MQL', fmtNumber(m.mql), `Lead → MQL ${pct(rates.leadToMql)}`, '#aa61ff', '◎')}</article>
        <article class="glass-card span-3">${metricCard('Vendas', fmtNumber(m.sales), `Ticket ${fmtCurrency(rates.ticket || m.ticket)}`, '#12d842', '$')}</article>
        <article class="glass-card span-3">${metricCard('Perdidos', fmtNumber(snapshot?.totals?.lost || 0), `Perda ${pct(rates.lossRate)}`, '#ff424d', '⚠')}</article>
        <article class="glass-card span-12">${renderLossReport(snapshot)}</article>
        <article class="glass-card span-6">${renderLossReasons(snapshot)}</article>
        <article class="glass-card span-6">${renderOwnerPerformance(snapshot)}</article>
        <article class="glass-card span-6">${renderSourceSplit(snapshot)}</article>
        <article class="glass-card span-6">${renderCrmTimeline(snapshot)}</article>
        <article class="glass-card span-12">${renderCrmLatest(snapshot)}</article>
        <article class="glass-card span-12">
          <h3>SLA Marketing & Vendas</h3>
          <div class="insight-grid">
            <div class="insight-card"><strong>Tempo 1ª resposta</strong><p>Meta: até 5 minutos. Atual: configurar pelo CRM/eKyte/N8N.</p></div>
            <div class="insight-card"><strong>Taxa MQL → SQL</strong><p>${pct(rates.mqlToSql)}</p></div>
            <div class="insight-card"><strong>SQL → Oportunidade</strong><p>${pct(rates.sqlToOpportunity)}</p></div>
            <div class="insight-card"><strong>Oportunidade → Venda</strong><p>${pct(rates.opportunityToSale)}</p></div>
          </div>
        </article>
      </section>
    `;
  }

  function renderCrmSourcePanel(client, snapshot) {
    const source = client.crmSheet || {};
    const configured = Boolean(source.spreadsheetId || source.url || source.proxyUrl);
    return `
      <div class="source-panel">
        <div>
          <p class="eyebrow">CRM dinâmico • Google Sheets</p>
          <h2>${escapeHtml(client.name)} • BASE_CRM</h2>
          <p class="muted">A leitura dinâmica usa as colunas Data, Lead ID, Nome, Valor, LEAD, MQL, SQL, OPORTUNIDADE, COMPRA, LEAD PERDIDO, META ADS, GOOGLE ADS, RESPONSAVEL e MOTIVO DE PERDA.</p>
          <div class="client-tags">
            ${badge(source.status || (configured ? 'Configurado' : 'Não configurado'))}
            <span class="badge client">Aba: ${escapeHtml(source.sheetName || 'BASE_CRM')}</span>
            <span class="badge client">GID: ${escapeHtml(source.gid || '-')}</span>
            <span class="badge client">Último sync: ${escapeHtml(source.lastSync || snapshot?.generatedAt || 'pendente')}</span>
          </div>
        </div>
        <div class="source-actions">
          <button class="btn primary" data-action="sync-crm-client" data-client-id="${client.id}">Sincronizar CRM agora</button>
          <button class="btn ghost" data-tab="client-config">Configurar fonte</button>
        </div>
      </div>
      ${!configured ? '<div class="empty">Configure o ID da planilha ou uma URL proxy N8N em Config do Cliente.</div>' : ''}
    `;
  }

  function renderLossReport(snapshot) {
    const totals = snapshot?.totals || {};
    const rates = snapshot?.rates || {};
    const lost = Number(totals.lost || 0);
    const lead = Number(totals.lead || 0);
    const owners = snapshot?.owners || [];
    const reasons = snapshot?.lossReasons || [];
    const matrix = snapshot?.ownerReasonMatrix || [];
    const lostLatest = snapshot?.lostLatest || [];
    const sourceLosses = snapshot?.lossBySource || [];
    const biggestReason = reasons[0]?.label || 'Sem dados';
    const biggestOwner = [...owners].sort((a, b) => Number(b.lost || 0) - Number(a.lost || 0))[0]?.label || 'Sem dados';
    return `
      <div class="section-head">
        <div>
          <p class="eyebrow">Relatório de perdas</p>
          <h2>Diagnóstico completo de perdas do CRM</h2>
          <p class="muted">Leitura da BASE_CRM com visão de motivos, responsáveis, origens, taxa de perda, impacto por etapa e plano de recuperação.</p>
        </div>
        <div class="source-actions"><span class="badge bad">${fmtNumber(lost)} perdas</span><span class="badge client">${pct(rates.lossRate || 0)} do funil</span></div>
      </div>
      <div class="metric-grid compact-metrics">
        ${metricCard('Leads perdidos', fmtNumber(lost), `${pct((lost / Math.max(lead, 1)) * 100)} sobre leads`, '#ff424d', '⚠')}
        ${metricCard('Maior motivo', escapeHtml(biggestReason), `${fmtNumber(reasons[0]?.lost || 0)} perdas`, '#ff9800', '×')}
        ${metricCard('Responsável crítico', escapeHtml(biggestOwner), `${fmtNumber((owners.find(o => o.label === biggestOwner)?.lost) || 0)} perdas`, '#aa61ff', '👤')}
        ${metricCard('Taxa venda', pct(rates.saleRate || 0), `${fmtNumber(totals.purchase || 0)} compras`, '#12d842', '$')}
      </div>
      <div class="loss-layout">
        <div class="loss-box">
          <h3>Top motivos com participação</h3>
          <div class="kpi-list">
            ${reasons.length ? reasons.map((row) => {
              const p = lost ? row.lost / lost * 100 : 0;
              return `<div class="kpi-row stacked"><span><strong>${escapeHtml(row.label)}</strong><br><small class="muted">${fmtNumber(row.lost)} perdas • ${pct(p)}</small></span><div class="mini-bar danger" style="--p:${Math.min(p, 100)}%"><span></span></div></div>`;
            }).join('') : '<div class="empty">Sincronize o CRM para preencher o ranking.</div>'}
          </div>
        </div>
        <div class="loss-box">
          <h3>Perdas por origem</h3>
          <div class="kpi-list">
            ${sourceLosses.length ? sourceLosses.map((row) => {
              const p = lost ? row.lost / lost * 100 : 0;
              return `<div class="kpi-row stacked"><span><strong>${escapeHtml(row.label)}</strong><br><small class="muted">${fmtNumber(row.lost)} perdas • ${fmtNumber(row.lead)} leads</small></span><div class="mini-bar" style="--p:${Math.min(p, 100)}%"><span></span></div></div>`;
            }).join('') : '<div class="empty">Aguardando colunas META ADS / GOOGLE ADS.</div>'}
          </div>
        </div>
      </div>
      <div class="table-wrap"><table><thead><tr><th>Responsável</th><th>Leads</th><th>MQL</th><th>SQL</th><th>Oport.</th><th>Vendas</th><th>Perdidos</th><th>Taxa perda</th><th>Conversão venda</th></tr></thead><tbody>
        ${owners.length ? owners.map((row) => `<tr><td>${escapeHtml(row.label)}</td><td>${fmtNumber(row.lead)}</td><td>${fmtNumber(row.mql)}</td><td>${fmtNumber(row.sql)}</td><td>${fmtNumber(row.opportunity)}</td><td>${fmtNumber(row.purchase)}</td><td>${fmtNumber(row.lost)}</td><td>${pct(row.lead ? row.lost / row.lead * 100 : 0)}</td><td>${pct(row.lead ? row.purchase / row.lead * 100 : 0)}</td></tr>`).join('') : '<tr><td colspan="9">Aguardando sincronização.</td></tr>'}
      </tbody></table></div>
      <div class="dashboard-grid nested-grid">
        <article class="glass-card inner-card span-6">
          <h3>Matriz responsável × motivo</h3>
          <div class="table-wrap"><table><thead><tr><th>Responsável</th><th>Motivo</th><th>Perdas</th></tr></thead><tbody>
            ${matrix.length ? matrix.slice(0, 12).map((row) => `<tr><td>${escapeHtml(row.owner)}</td><td>${escapeHtml(row.reason)}</td><td>${fmtNumber(row.lost)}</td></tr>`).join('') : '<tr><td colspan="3">Sem matriz carregada.</td></tr>'}
          </tbody></table></div>
        </article>
        <article class="glass-card inner-card span-6">
          <h3>Plano imediato de recuperação</h3>
          <div class="insight-grid">
            <div class="insight-card"><strong>1. Atacar maior motivo</strong><p>Priorizar scripts, filtros e promessa da LP para reduzir: ${escapeHtml(biggestReason)}.</p></div>
            <div class="insight-card"><strong>2. Auditar responsável crítico</strong><p>Escutar calls e WhatsApps de ${escapeHtml(biggestOwner)} para entender gargalo de abordagem.</p></div>
            <div class="insight-card"><strong>3. Separar perda por origem</strong><p>Cruzar Meta/Google com motivos para evitar escala de canal que gera perda.</p></div>
            <div class="insight-card"><strong>4. Régua de reativação</strong><p>Criar cadência de resgate para perdidos com motivo reversível: orçamento, prazo e falta de interesse.</p></div>
          </div>
        </article>
      </div>
      <h3>Últimos leads perdidos</h3>
      <div class="table-wrap"><table><thead><tr><th>Data</th><th>Lead ID</th><th>Nome</th><th>Responsável</th><th>Origem</th><th>Motivo</th><th>Valor</th></tr></thead><tbody>
        ${lostLatest.length ? lostLatest.map((row) => `<tr><td>${escapeHtml(row.date)}</td><td>${escapeHtml(row.leadId)}</td><td>${escapeHtml(row.name)}</td><td>${escapeHtml(row.owner)}</td><td>${escapeHtml(row.source)}</td><td>${escapeHtml(row.lossReason || '-')}</td><td>${fmtCurrency(row.value)}</td></tr>`).join('') : '<tr><td colspan="7">Sem perdas carregadas.</td></tr>'}
      </tbody></table></div>
    `;
  }

  function renderLossReasons(snapshot) {
    const rows = snapshot?.lossReasons || [];
    return `
      <h3>Motivos de perda</h3>
      <div class="kpi-list">
        ${rows.length ? rows.map((row) => {
          const pctValue = snapshot?.totals?.lost ? row.lost / snapshot.totals.lost * 100 : 0;
          return `<div class="kpi-row"><span><strong>${escapeHtml(row.label)}</strong><br><small class="muted">${fmtNumber(row.lost)} perdas • ${pct(pctValue)} do total</small></span><div class="mini-bar" style="--p:${Math.min(pctValue, 100)}%"><span></span></div></div>`;
        }).join('') : '<div class="empty">Sincronize a planilha para preencher os motivos de perda.</div>'}
      </div>
    `;
  }

  function renderOwnerPerformance(snapshot) {
    const rows = snapshot?.owners || [];
    return `
      <h3>Performance por responsável</h3>
      <div class="table-wrap"><table><thead><tr><th>Responsável</th><th>Leads</th><th>MQL</th><th>SQL</th><th>Vendas</th><th>Perdidos</th></tr></thead><tbody>
        ${rows.length ? rows.map((row) => `<tr><td>${escapeHtml(row.label)}</td><td>${fmtNumber(row.lead)}</td><td>${fmtNumber(row.mql)}</td><td>${fmtNumber(row.sql)}</td><td>${fmtNumber(row.purchase)}</td><td>${fmtNumber(row.lost)}</td></tr>`).join('') : '<tr><td colspan="6">Aguardando sincronização.</td></tr>'}
      </tbody></table></div>
    `;
  }

  function renderSourceSplit(snapshot) {
    const rows = snapshot?.sources || [];
    return `
      <h3>Origem dos leads</h3>
      <div class="insight-grid">
        ${rows.length ? rows.map((row) => `<div class="insight-card"><span class="badge ok">${escapeHtml(row.label)}</span><strong>${fmtNumber(row.lead)}</strong><p class="muted">Leads identificados nessa origem.</p></div>`).join('') : '<div class="empty">Aguardando dados de META ADS / GOOGLE ADS.</div>'}
      </div>
    `;
  }

  function renderCrmTimeline(snapshot) {
    const rows = (snapshot?.byMonth || []).slice(-8);
    const max = rows.reduce((acc, row) => Math.max(acc, Number(row.lead || 0)), 1);
    return `
      <h3>Evolução mensal CRM</h3>
      <div class="timeline-bars">
        ${rows.length ? rows.map((row) => `<div class="timeline-row"><span>${escapeHtml(row.label)}</span><div class="mini-bar" style="--p:${Math.max(3, row.lead / max * 100)}%"><span></span></div><strong>${fmtNumber(row.lead)}</strong></div>`).join('') : '<div class="empty">Aguardando sincronização.</div>'}
      </div>
    `;
  }

  function renderCrmLatest(snapshot) {
    const rows = snapshot?.latest || [];
    return `
      <h3>Últimos leads importados</h3>
      <div class="table-wrap"><table><thead><tr><th>Data</th><th>Lead ID</th><th>Nome</th><th>Valor</th><th>Responsável</th><th>Status</th><th>Motivo de perda</th></tr></thead><tbody>
        ${rows.length ? rows.map((row) => {
          const status = row.flags.purchase ? 'Compra' : row.flags.opportunity ? 'Oportunidade' : row.flags.sql ? 'SQL' : row.flags.mql ? 'MQL' : row.flags.lost ? 'Perdido' : 'Lead';
          return `<tr><td>${escapeHtml(row.date)}</td><td>${escapeHtml(row.leadId)}</td><td>${escapeHtml(row.name)}</td><td>${fmtCurrency(row.value)}</td><td>${escapeHtml(row.owner)}</td><td>${badge(status)}</td><td>${escapeHtml(row.lossReason || '-')}</td></tr>`;
        }).join('') : '<tr><td colspan="7">Clique em Sincronizar CRM agora para puxar a BASE_CRM.</td></tr>'}
      </tbody></table></div>
    `;
  }

  function renderCompetitors(client) {
    return `
      <section class="dashboard-grid">
        <article class="glass-card span-12">${renderSemrushCards(client)}</article>
        <article class="glass-card span-12">${editableEntity('competitors', client.id)}</article>
      </section>
    `;
  }

  function renderSemrushCards(client) {
    const rows = byClient('competitors', client.id);
    return `
      <h3>Concorrentes SEMrush</h3>
      <div class="insight-grid">
        ${rows.map((co) => `<div class="insight-card"><span class="badge ok">${escapeHtml(co.status)}</span><strong>${escapeHtml(co.name)}</strong><p>${escapeHtml(co.domain)}</p><p class="muted">Tráfego: ${fmtNumber(co.traffic)} • Keywords: ${fmtNumber(co.keywords)} • Autoridade: ${escapeHtml(co.authority)}</p><p><strong>Gap:</strong> ${escapeHtml(co.gap)}</p></div>`).join('') || '<div class="empty">Nenhum concorrente cadastrado. Use Config do Cliente para inserir.</div>'}
      </div>
    `;
  }

  function renderEkyteSummary(client) {
    const tasks = byClient('tasks', client.id);
    const done = tasks.filter((task) => task.status === 'Concluído').length;
    const avg = tasks.length ? Math.round(tasks.reduce((sum, task) => sum + Number(task.progress || 0), 0) / tasks.length) : 0;
    return `
      <h3>eKyte • Playbook e execução</h3>
      <div class="insight-grid">
        <div class="insight-card"><strong>${tasks.length}</strong><p>Tasks totais no fluxo atual.</p></div>
        <div class="insight-card"><strong>${done}</strong><p>Tasks concluídas.</p></div>
        <div class="insight-card"><strong>${avg}%</strong><p>Avanço médio do playbook.</p></div>
      </div>
    `;
  }

  function renderGoals(client) {
    return `
      <section class="dashboard-grid">
        <article class="glass-card span-12">
          <h2>Metas editáveis</h2>
          <form class="form-grid" data-submit="save-goals" data-client-id="${client.id}">
            ${['revenue','leads','mqlRate','cac','roas'].map((key) => `<label class="form-field"><span>${goalLabel(key)}</span><input name="${key}" value="${escapeHtml(client.goals?.[key] || '')}" /></label>`).join('')}
            <div class="form-field"><label>&nbsp;</label><button class="btn primary" type="submit">Salvar metas</button></div>
          </form>
        </article>
        <article class="glass-card span-12">${renderFunnel(client)}</article>
      </section>
    `;
  }

  function goalLabel(key) {
    return ({ revenue: 'Meta de faturamento', leads: 'Meta de leads', mqlRate: 'Taxa Lead → MQL (%)', cac: 'CAC máximo', roas: 'ROAS alvo' })[key] || key;
  }

  function renderStatusProject(client) {
    return `
      <section class="dashboard-grid">
        <article class="glass-card span-4"><h3>Onde estamos</h3><p class="muted">Step atual: V2. Operação com base criada, integrações preparadas, necessidade de consolidar rastreabilidade e rotina de dados.</p>${badge(client.status)}</article>
        <article class="glass-card span-4"><h3>Para onde vamos</h3><p class="muted">Escalar o investimento com CAC controlado, aumentar Lead → MQL, fortalecer LPs e qualificação via CRM/Evolution.</p>${badge('Próximo Quarter')}</article>
        <article class="glass-card span-4"><h3>Riscos</h3><p class="muted">Dados incompletos, perda de eventos, atraso em assets, CRM sem padronização e feedback comercial irregular.</p>${badge('Monitorar')}</article>
        <article class="glass-card span-12">${renderActionPlan(client)}</article>
      </section>
    `;
  }

  function renderClientConfig(client) {
    return `
      <section class="dashboard-grid">
        <article class="glass-card span-12">
          <h2>Configuração do Cliente</h2>
          <form class="form-grid" data-submit="save-client-profile" data-client-id="${client.id}">
            ${profileField('name', 'Nome', client.name)}
            ${profileField('initials', 'Iniciais', client.initials)}
            ${profileField('groupId', 'ID Grupo Evolution/WhatsApp', client.groupId)}
            ${profileField('segment', 'Segmento', client.segment)}
            ${profileField('crm', 'CRM', client.crm)}
            ${profileField('responsible', 'Responsável', client.responsible)}
            ${profileField('status', 'Status', client.status)}
            ${profileField('health', 'Saúde 0-100', client.health)}
            ${profileField('color', 'Cor primária', client.color)}
            ${profileField('accent', 'Cor de apoio', client.accent)}
            ${profileField('mascot', 'Mascote/ID visual', client.mascot)}
            ${profileField('crmSpreadsheetId', 'CRM Sheets • Spreadsheet ID', client.crmSheet?.spreadsheetId || '')}
            ${profileField('crmSheetName', 'CRM Sheets • Aba base', client.crmSheet?.sheetName || 'BASE_CRM')}
            ${profileField('crmSheetGid', 'CRM Sheets • GID da aba', client.crmSheet?.gid || '')}
            ${profileField('crmProxyUrl', 'CRM Sheets • Proxy N8N opcional', client.crmSheet?.proxyUrl || '')}
            ${profileField('performanceSpreadsheetId', 'Mídia Sheets • Spreadsheet ID', client.performanceSheets?.spreadsheetId || client.crmSheet?.spreadsheetId || '')}
            ${profileField('monthlySheetName', 'Mídia Sheets • Aba mensal', client.performanceSheets?.monthlySheetName || '1.0 Mensal')}
            ${profileField('weeklySheetName', 'Mídia Sheets • Aba semanal', client.performanceSheets?.weeklySheetName || '2.0 Semanal')}
            ${profileField('monthlyGid', 'Mídia Sheets • GID mensal', client.performanceSheets?.monthlyGid || '')}
            ${profileField('weeklyGid', 'Mídia Sheets • GID semanal', client.performanceSheets?.weeklyGid || '')}
            ${profileField('performanceProxyUrl', 'Mídia Sheets • Proxy N8N opcional', client.performanceSheets?.proxyUrl || '')}
            ${profileField('metaRawSheetName', 'Drill-down • Aba Meta Ads', client.performanceSheets?.metaRawSheetName || 'bd Meta Ads')}
            ${profileField('googleRawSheetName', 'Drill-down • Aba Google Ads', client.performanceSheets?.googleRawSheetName || 'bd Google Ads ')}
            <div class="form-field"><label>&nbsp;</label><button class="btn primary" type="submit">Atualizar cliente</button></div>
          </form>
        </article>
        <article class="glass-card span-12">${editableLps(client)}</article>
        <article class="glass-card span-12">${editableEntity('pixels', client.id)}</article>
        <article class="glass-card span-12">${editableEntity('competitors', client.id)}</article>
        <article class="glass-card span-12">${editableEntity('campaigns', client.id)}</article>
        <article class="glass-card span-12">${editableEntity('creatives', client.id)}</article>
        <article class="glass-card span-12">${editableEntity('tasks', client.id)}</article>
        <article class="glass-card span-12">${editableEntity('actionPlan', client.id)}</article>
      </section>
    `;
  }

  function profileField(name, label, value) {
    return `<label class="form-field"><span>${label}</span><input name="${name}" value="${escapeHtml(value || '')}" /></label>`;
  }

  function renderGlobalSettings() {
    main.innerHTML = `
      <section class="page">
        <header class="hero">
          <img class="hero-logo" src="src/assets/v4-company-logo.jpg" alt="Logo V4 Company" />
          <div><p class="eyebrow">Administração</p><h1>Configurações Gerais</h1><p class="hero-copy">Área geral para inserir ou retirar clientes, editar integrações globais, exportar base local e preparar conexão real via N8N/backend.</p></div>
          <div class="period-box"><small>Modo atual</small><strong>CRUD local + integrações preparadas</strong><button class="btn primary" data-action="export-json">Exportar JSON</button></div>
        </header>
        <section class="dashboard-grid">
          <article class="glass-card span-12">
            <h2>Inserir novo cliente</h2>
            <form class="form-grid" data-submit="add-client">
              ${profileField('name', 'Nome', '')}
              ${profileField('groupId', 'ID Grupo Evolution/WhatsApp', '')}
              ${profileField('segment', 'Segmento', '')}
              ${profileField('crm', 'CRM', 'Kommo')}
              ${profileField('responsible', 'Responsável', state.settings.operator || 'Vinicius Agnes')}
              ${profileField('color', 'Cor primária', '#cf1022')}
              ${profileField('accent', 'Cor de apoio', '#ff3048')}
              <div class="form-field"><label>&nbsp;</label><button class="btn primary" type="submit">Inserir cliente</button></div>
            </form>
          </article>
          <article class="glass-card span-12">
            <h2>Clientes cadastrados</h2>
            <div class="table-wrap"><table><thead><tr><th>Cliente</th><th>Grupo</th><th>CRM</th><th>Status</th><th>Saúde</th><th>Ações</th></tr></thead><tbody>
              ${state.clients.map((client) => `<tr><td>${escapeHtml(client.name)}</td><td>${escapeHtml(client.groupId)}</td><td>${escapeHtml(client.crm)}</td><td>${badge(client.status)}</td><td>${client.health}/100</td><td><button class="btn small" data-client="${client.id}">Abrir</button> <button class="btn small danger" data-delete-client="${client.id}">Excluir</button></td></tr>`).join('')}
            </tbody></table></div>
          </article>
          <article class="glass-card span-6">
            <h2>Integrações globais</h2>
            ${editableIntegrations()}
          </article>
          <article class="glass-card span-6">
            <h2>Backup e reset</h2>
            <p class="muted">Exporta todos os dados editados no navegador. O reset volta para a base inicial do protótipo.</p>
            <div class="actions"><button class="btn primary" data-action="export-json">Exportar JSON</button><button class="btn danger" data-action="reset-demo">Resetar demo</button><button class="btn ghost" data-action="refresh">Atualizar</button></div>
            <hr style="border-color:rgba(255,255,255,.1); margin:22px 0;">
            <h3>Próximas conexões reais</h3>
            <div class="kpi-list">${Object.entries(window.V4_INTEGRATIONS?.endpoints || {}).map(([key, value]) => `<div class="kpi-row"><span>${escapeHtml(key)}</span><small class="muted">${escapeHtml(value)}</small></div>`).join('')}</div>
          </article>
        </section>
      </section>
    `;
  }

  function editableIntegrations() {
    const fields = [['name','Nome'], ['type','Tipo'], ['status','Status'], ['sync','Sync'], ['lastUpdate','Última atualização']];
    return editableTable('integrations', state.integrations, fields, 'Integrações', false);
  }

  function editableLps(client) {
    const fields = [['name','LP'], ['url','URL'], ['status','Status'], ['speed','Speed'], ['conversion','Conversão']];
    const rows = client.lps || [];
    return editableTable('lps', rows, fields, 'Landing Pages', true, client.id);
  }

  function editableEntity(collection, clientId) {
    const meta = entityMeta[collection];
    if (!meta) return '';
    const rows = meta.clientScoped ? byClient(collection, clientId) : state[collection];
    return editableTable(collection, rows, meta.fields, meta.title, true, clientId);
  }

  function editableTable(collection, rows, fields, title, canAdd, clientId) {
    return `
      <h3>${escapeHtml(title)}</h3>
      <p class="muted">Edite direto na tabela e clique em salvar. Use excluir para remover e inserir para criar novos itens.</p>
      <div class="table-wrap">
        <table data-edit-table="${collection}">
          <thead><tr>${fields.map(([, label]) => `<th>${escapeHtml(label)}</th>`).join('')}<th>Ações</th></tr></thead>
          <tbody>
            ${rows.map((row) => `<tr data-row-id="${row.id}" data-collection="${collection}">
              ${fields.map(([key]) => `<td contenteditable="true" data-field="${key}">${escapeHtml(row[key] ?? '')}</td>`).join('')}
              <td><button class="btn small success" data-save-row="${row.id}" data-collection="${collection}">Salvar</button> <button class="btn small danger" data-delete-row="${row.id}" data-collection="${collection}">Excluir</button></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
      ${canAdd ? `
        <form class="form-grid" style="margin-top:16px" data-submit="add-row" data-collection="${collection}" data-client-id="${clientId || ''}">
          ${fields.map(([key, label]) => `<label class="form-field"><span>${escapeHtml(label)}</span><input name="${key}" placeholder="${escapeHtml(label)}" /></label>`).join('')}
          <div class="form-field"><label>&nbsp;</label><button class="btn primary" type="submit">Inserir ${escapeHtml(title)}</button></div>
        </form>
      ` : ''}
    `;
  }

  function renderFooter() {
    return `<footer class="footer-status"><span class="dot"></span><span>Dados atualizados em tempo real / modo demo local</span><span>|</span><span>Próxima atualização em: ${escapeHtml(state.settings.nextSync || '02:45')}</span><span>↻</span></footer>`;
  }

  function handleNav(target) {
    if (target.dataset.nav === 'global') route = { ...route, scope: 'global' };
    if (target.dataset.nav === 'settings') route = { ...route, scope: 'settings' };
    if (target.dataset.client) route = { scope: 'client', clientId: target.dataset.client, tab: 'control' };
    if (target.dataset.tab) route.tab = target.dataset.tab;
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function formToObject(form) {
    const data = {};
    new FormData(form).forEach((value, key) => {
      const text = String(value).trim();
      data[key] = parseMaybeNumber(text);
    });
    return data;
  }

  function parseMaybeNumber(value) {
    if (value === '') return '';
    const normalized = String(value).replace(/\./g, '').replace(',', '.');
    if (/^-?\d+(\.\d+)?$/.test(normalized) && String(value).length < 16) return Number(normalized);
    return value;
  }

  function handleSubmit(event) {
    const form = event.target.closest('form[data-submit]');
    if (!form) return;
    event.preventDefault();
    const action = form.dataset.submit;
    if (action === 'add-client') addClient(form);
    if (action === 'save-client-profile') saveClientProfile(form);
    if (action === 'save-goals') saveGoals(form);
    if (action === 'add-row') addRow(form);
    saveState();
    render();
  }

  function addClient(form) {
    const data = formToObject(form);
    if (!data.name) return notify('Informe o nome do cliente.');
    const id = slugify(data.name);
    const client = {
      id: state.clients.some((item) => item.id === id) ? `${id}-${state.clients.length + 1}` : id,
      name: data.name,
      initials: getInitials(data.name),
      groupId: data.groupId || '',
      segment: data.segment || 'Novo segmento',
      crm: data.crm || 'Kommo',
      responsible: data.responsible || state.settings.operator || 'Vinicius Agnes',
      status: 'Setup inicial',
      health: 60,
      color: data.color || '#cf1022',
      accent: data.accent || '#ff3048',
      mascot: getInitials(data.name),
      metrics: { revenue: 0, revenueTarget: 0, leads: 0, cpl: 0, roas: 0, investment: 0, mql: 0, sql: 0, opportunities: 0, sales: 0, ticket: 0, ctr: 0, conversion: 0 },
      goals: { revenue: 0, leads: 0, mqlRate: 0, cac: 0, roas: 0 },
      crmSheet: { type: 'googleSheetsCsv', spreadsheetId: '', url: '', sheetName: 'BASE_CRM', dashboardSheetName: 'DASH_CRM', gid: '', proxyUrl: '', status: 'Não configurado', lastSync: '' },
      performanceSheets: { type: 'googleSheetsCsv', spreadsheetId: '', url: '', monthlySheetName: '1.0 Mensal', weeklySheetName: '2.0 Semanal', monthlyGid: '', weeklyGid: '', metaRawSheetName: 'bd Meta Ads', googleRawSheetName: 'bd Google Ads ', proxyUrl: '', status: 'Não configurado', lastSync: '' },
      lps: []
    };
    state.clients.push(client);
    route = { scope: 'client', clientId: client.id, tab: 'client-config' };
    notify('Cliente inserido.');
  }

  function saveClientProfile(form) {
    const client = getClient(form.dataset.clientId);
    if (!client) return;
    const data = formToObject(form);
    client.crmSheet = {
      ...(client.crmSheet || {}),
      type: 'googleSheetsCsv',
      spreadsheetId: String(data.crmSpreadsheetId || '').trim(),
      url: data.crmSpreadsheetId ? `https://docs.google.com/spreadsheets/d/${String(data.crmSpreadsheetId).trim()}/edit` : (client.crmSheet?.url || ''),
      sheetName: String(data.crmSheetName || 'BASE_CRM').trim(),
      dashboardSheetName: client.crmSheet?.dashboardSheetName || 'DASH_CRM',
      gid: String(data.crmSheetGid || '').trim(),
      proxyUrl: String(data.crmProxyUrl || '').trim(),
      status: data.crmSpreadsheetId || data.crmProxyUrl ? 'Configurado' : 'Não configurado',
      lastSync: client.crmSheet?.lastSync || ''
    };
    client.performanceSheets = {
      ...(client.performanceSheets || {}),
      type: 'googleSheetsCsv',
      spreadsheetId: String(data.performanceSpreadsheetId || data.crmSpreadsheetId || client.performanceSheets?.spreadsheetId || '').trim(),
      url: data.performanceSpreadsheetId ? `https://docs.google.com/spreadsheets/d/${String(data.performanceSpreadsheetId).trim()}/edit` : (client.performanceSheets?.url || ''),
      monthlySheetName: String(data.monthlySheetName || '1.0 Mensal').trim(),
      weeklySheetName: String(data.weeklySheetName || '2.0 Semanal').trim(),
      monthlyGid: String(data.monthlyGid || '').trim(),
      weeklyGid: String(data.weeklyGid || '').trim(),
      metaRawSheetName: String(data.metaRawSheetName || 'bd Meta Ads').trim(),
      googleRawSheetName: String(data.googleRawSheetName || 'bd Google Ads ').trim(),
      proxyUrl: String(data.performanceProxyUrl || '').trim(),
      status: data.performanceSpreadsheetId || data.performanceProxyUrl ? 'Configurado' : (client.performanceSheets?.status || 'Não configurado'),
      lastSync: client.performanceSheets?.lastSync || ''
    };
    delete data.crmSpreadsheetId;
    delete data.crmSheetName;
    delete data.crmSheetGid;
    delete data.crmProxyUrl;
    delete data.performanceSpreadsheetId;
    delete data.monthlySheetName;
    delete data.weeklySheetName;
    delete data.monthlyGid;
    delete data.weeklyGid;
    delete data.performanceProxyUrl;
    delete data.metaRawSheetName;
    delete data.googleRawSheetName;
    Object.assign(client, data);
    client.initials = client.initials || getInitials(client.name);
    client.health = Number(client.health || 0);
    notify('Cliente atualizado.');
  }

  function saveGoals(form) {
    const client = getClient(form.dataset.clientId);
    if (!client) return;
    client.goals = { ...client.goals, ...formToObject(form) };
    if (client.metrics) client.metrics.revenueTarget = client.goals.revenue;
    notify('Metas atualizadas.');
  }

  function addRow(form) {
    const collection = form.dataset.collection;
    const clientId = form.dataset.clientId;
    const data = formToObject(form);
    const id = uid(collection.slice(0, 2));
    if (collection === 'lps') {
      const client = getClient(clientId);
      client.lps.push({ id, ...data });
    } else {
      const defaults = entityMeta[collection]?.defaults || {};
      state[collection].push({ id, clientId, ...defaults, ...data });
    }
    notify('Item inserido.');
  }

  function saveRow(button) {
    const rowEl = button.closest('tr');
    const collection = button.dataset.collection;
    const id = button.dataset.saveRow;
    const data = {};
    rowEl.querySelectorAll('[data-field]').forEach((cell) => {
      data[cell.dataset.field] = parseMaybeNumber(cell.textContent.trim());
    });
    const row = findRow(collection, id);
    if (row) Object.assign(row, data);
    saveState();
    notify('Linha salva.');
    render();
  }

  function deleteRow(button) {
    const collection = button.dataset.collection;
    const id = button.dataset.deleteRow;
    if (!confirm('Excluir este item?')) return;
    if (collection === 'lps') {
      const client = getClient();
      client.lps = (client.lps || []).filter((row) => row.id !== id);
    } else {
      state[collection] = state[collection].filter((row) => row.id !== id);
    }
    saveState();
    notify('Item excluído.');
    render();
  }

  function findRow(collection, id) {
    if (collection === 'lps') return (getClient()?.lps || []).find((row) => row.id === id);
    return (state[collection] || []).find((row) => row.id === id);
  }

  function deleteClient(id) {
    if (!confirm('Excluir cliente e dados relacionados?')) return;
    state.clients = state.clients.filter((client) => client.id !== id);
    ['pixels', 'competitors', 'campaigns', 'creatives', 'tasks', 'actionPlan'].forEach((collection) => {
      state[collection] = state[collection].filter((item) => item.clientId !== id);
    });
    route = { scope: 'global', clientId: state.clients[0]?.id || null, tab: 'control' };
    saveState();
    render();
  }

  async function syncCrmClient(clientId) {
    const client = getClient(clientId || route.clientId);
    if (!client) return notify('Cliente não encontrado.');
    if (!window.V4_CRM_SHEETS) return notify('Serviço de CRM Sheets não carregado.');
    try {
      notify('Sincronizando CRM...');
      client.crmSheet = client.crmSheet || {};
      client.crmSheet.status = 'Sincronizando';
      render();
      const result = await window.V4_CRM_SHEETS.load(client.crmSheet);
      state.crmSnapshots[client.id] = result.snapshot;
      client.crmSheet.status = 'Sincronizado';
      client.crmSheet.lastSync = new Date().toLocaleString('pt-BR');
      const metrics = clientMetrics(client);
      client.metrics = {
        ...(client.metrics || {}),
        revenue: metrics.revenue,
        leads: metrics.leads,
        mql: metrics.mql,
        sql: metrics.sql,
        opportunities: metrics.opportunities,
        sales: metrics.sales,
        ticket: metrics.ticket,
        roas: metrics.roas
      };
      state.events.unshift({ id: uid('ev'), type: 'sync', text: `CRM sincronizado: ${client.name}`, time: 'agora' });
      saveState();
      notify('CRM sincronizado com sucesso.');
      render();
    } catch (error) {
      client.crmSheet = client.crmSheet || {};
      client.crmSheet.status = 'Erro de sync';
      client.crmSheet.lastSync = `Erro: ${error.message}`;
      saveState();
      notify('Não consegui ler a planilha. Veja Config do Cliente.');
      render();
      console.error(error);
    }
  }

  async function syncPerformanceClient(clientId) {
    const client = getClient(clientId || route.clientId);
    if (!client) return notify('Cliente não encontrado.');
    if (!window.V4_PERFORMANCE_SHEETS) return notify('Serviço de performance Sheets não carregado.');
    try {
      notify('Sincronizando mídia...');
      client.performanceSheets = client.performanceSheets || {};
      client.performanceSheets.status = 'Sincronizando';
      render();
      const result = await window.V4_PERFORMANCE_SHEETS.load(client.performanceSheets);
      state.performanceSnapshots[client.id] = result.snapshot;
      client.performanceSheets.status = 'Sincronizado';
      client.performanceSheets.lastSync = new Date().toLocaleString('pt-BR');
      const metrics = clientMetrics(client);
      client.metrics = {
        ...(client.metrics || {}),
        investment: metrics.investment,
        cpl: metrics.cpl,
        roas: metrics.roas,
        impressions: metrics.impressions,
        clicks: metrics.clicks,
        ctr: metrics.ctr,
        cpc: metrics.cpc,
        conversion: metrics.conversion,
        pacing: metrics.pacing,
        plannedMedia: metrics.plannedMedia
      };
      state.events.unshift({ id: uid('ev'), type: 'sync', text: `Mídia sincronizada: ${client.name}`, time: 'agora' });
      saveState();
      notify('Mídia sincronizada com sucesso.');
      render();
    } catch (error) {
      client.performanceSheets = client.performanceSheets || {};
      client.performanceSheets.status = 'Erro de sync';
      client.performanceSheets.lastSync = `Erro: ${error.message}`;
      saveState();
      notify('Não consegui ler mensal/semanal. Veja Config do Cliente ou use proxy N8N.');
      render();
      console.error(error);
    }
  }

  async function handleAction(button) {
    const action = button.dataset.action;
    if (action === 'refresh') {
      state.settings.nextSync = '02:45';
      state.events.unshift({ id: uid('ev'), type: 'sync', text: 'Atualização manual executada', time: 'agora' });
      saveState();
      notify('Dados atualizados.');
      render();
    }
    if (action === 'reset-demo') {
      if (!confirm('Resetar todos os dados locais para a base inicial?')) return;
      localStorage.removeItem(STORAGE_KEY);
      state = normalizeState(structuredCloneSafe(seed));
      route = { scope: 'global', clientId: state.clients[0]?.id || null, tab: 'control' };
      notify('Demo resetada.');
      render();
    }
    if (action === 'export-json') exportJson();
    if (action === 'sync-crm-client') await syncCrmClient(button.dataset.clientId);
    if (action === 'sync-performance-client') await syncPerformanceClient(button.dataset.clientId);
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'v4-command-center-dados.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function slugify(text) {
    return String(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  function notify(message) {
    const el = document.createElement('div');
    el.textContent = message;
    el.style.cssText = 'position:fixed;right:18px;bottom:18px;z-index:9999;padding:14px 18px;border-radius:16px;background:linear-gradient(135deg,#cf1022,#700814);color:white;font-weight:850;box-shadow:0 20px 55px rgba(0,0,0,.35)';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2200);
  }

  document.addEventListener('click', (event) => {
    const navTarget = event.target.closest('[data-nav], [data-client], [data-tab]');
    if (navTarget) return handleNav(navTarget);
    const actionTarget = event.target.closest('[data-action]');
    if (actionTarget) return handleAction(actionTarget);
    const saveTarget = event.target.closest('[data-save-row]');
    if (saveTarget) return saveRow(saveTarget);
    const deleteTarget = event.target.closest('[data-delete-row]');
    if (deleteTarget) return deleteRow(deleteTarget);
    const deleteClientTarget = event.target.closest('[data-delete-client]');
    if (deleteClientTarget) return deleteClient(deleteClientTarget.dataset.deleteClient);
  });

  document.addEventListener('submit', handleSubmit);
  render();
})();
