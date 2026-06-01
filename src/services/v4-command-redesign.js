(function () {
  const STORAGE_KEY = 'v4-command-center-state-v6-crm-performance-losses';
  const ASSET_VERSION = 'v4-redesign-20260531-01';
  const V4_LOGO = 'src/assets/v4-company-logo.jpg';

  let state = null;
  let route = { view: 'dashboard', clientId: null, squadId: 'all' };

  function q(sel, root = document) { return root.querySelector(sel); }
  function qa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }
  function escapeHtml(value) { return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char])); }
  function fmtCurrency(value) { return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
  function fmtNumber(value) { return Number(value || 0).toLocaleString('pt-BR'); }
  function pct(value) { return `${Number(value || 0).toFixed(1).replace('.', ',')}%`; }
  function initials(name) { return String(name || 'V4').split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase(); }
  function clamp(value, min, max) { return Math.max(min, Math.min(max, Number(value || 0))); }

  function loadState() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : null;
      const seed = window.V4_SEED || {};
      const base = parsed || seed;
      base.clients = base.clients || [];
      base.integrations = base.integrations || [];
      base.campaigns = base.campaigns || [];
      base.pixels = base.pixels || [];
      base.crmSnapshots = base.crmSnapshots || {};
      base.performanceSnapshots = base.performanceSnapshots || {};
      base.settings = base.settings || {};
      base.clients.forEach((client) => {
        client.initials = client.initials || initials(client.name);
        client.color = client.color || '#e50922';
        client.accent = client.accent || client.color || '#e50922';
        client.metrics = client.metrics || {};
        client.goals = client.goals || {};
        client.lps = client.lps || [];
      });
      return base;
    } catch (_error) {
      return { clients: [], integrations: [], campaigns: [], pixels: [], crmSnapshots: {}, performanceSnapshots: {}, settings: {} };
    }
  }

  function getUser() {
    return window.V4_RBAC?.getCurrentUser?.() || { name: 'Vinicius Agnes', email: 'vinicius.agnes@v4company.com', role: 'SUPER_ADMIN' };
  }

  function roleLabel(role) {
    return window.V4_RBAC?.roles?.[role] || role || 'Admin';
  }

  function squads() {
    return window.V4_RBAC?.storedSquads?.() || [
      { id: 'all', name: 'Todos os clientes', clientIds: ['*'], headEmail: 'vinicius.agnes@v4company.com' }
    ];
  }

  function clientById(id) {
    return state.clients.find((client) => client.id === id) || state.clients[0] || null;
  }

  function selectedClients() {
    if (route.view === 'client') return clientById(route.clientId) ? [clientById(route.clientId)] : [];
    if (route.squadId && route.squadId !== 'all') {
      const squad = squads().find((item) => item.id === route.squadId);
      if (squad?.clientIds?.includes('*')) return state.clients;
      if (squad?.clientIds?.length) return state.clients.filter((client) => squad.clientIds.includes(client.id));
    }
    return state.clients;
  }

  function getCrmSnapshot(client) { return state.crmSnapshots?.[client?.id] || null; }
  function getPerformanceSnapshot(client) { return state.performanceSnapshots?.[client?.id] || null; }
  function currentPerformance(client) {
    const snapshot = getPerformanceSnapshot(client);
    return snapshot?.monthly?.current || snapshot?.weekly?.current || null;
  }

  function clientMetrics(client) {
    if (!client) return emptyMetrics();
    const crm = getCrmSnapshot(client);
    const perf = currentPerformance(client)?.metrics || {};
    const base = client.metrics || {};
    const investment = Number(perf.investment || base.investment || 0);
    const crmRevenue = Number(crm?.totals?.value || 0);
    const revenue = crmRevenue || Number(perf.revenue || base.revenue || 0);
    const crmLeads = Number(crm?.totals?.lead || 0);
    const leads = crmLeads || Number(perf.leads || base.leads || 0);
    const sales = Number(crm?.totals?.purchase || perf.sales || base.sales || 0);
    const cpl = Number(perf.cpl || base.cpl || (investment && leads ? investment / leads : 0));
    const roas = Number(perf.roas || base.roas || (investment && revenue ? revenue / investment : 0));
    return {
      revenue,
      investment,
      leads,
      sales,
      cpl,
      roas,
      impressions: Number(perf.impressions || base.impressions || 0),
      clicks: Number(perf.clicks || base.clicks || 0),
      ctr: Number(perf.ctr || base.ctr || 0),
      mql: Number(crm?.totals?.mql || base.mql || 0),
      sql: Number(crm?.totals?.sql || base.sql || 0),
      opportunities: Number(crm?.totals?.opportunity || base.opportunities || 0),
      ticket: Number(crm?.rates?.ticket || base.ticket || 0),
      source: crm ? 'CRM' : perf ? 'GrowthPack' : 'Base local'
    };
  }

  function emptyMetrics() {
    return { revenue: 0, investment: 0, leads: 0, sales: 0, cpl: 0, roas: 0, impressions: 0, clicks: 0, ctr: 0, mql: 0, sql: 0, opportunities: 0, ticket: 0, source: 'Sem dados' };
  }

  function aggregateMetrics(clients) {
    const total = clients.reduce((acc, client) => {
      const m = clientMetrics(client);
      Object.keys(acc).forEach((key) => { if (typeof acc[key] === 'number') acc[key] += Number(m[key] || 0); });
      return acc;
    }, { revenue: 0, investment: 0, leads: 0, sales: 0, impressions: 0, clicks: 0, mql: 0, sql: 0, opportunities: 0, ticket: 0 });
    total.cpl = total.leads ? total.investment / total.leads : 0;
    total.roas = total.investment ? total.revenue / total.investment : 0;
    total.ctr = total.impressions ? total.clicks / total.impressions * 100 : 0;
    total.ticket = total.sales ? total.revenue / total.sales : 0;
    return total;
  }

  function sparkPoints(seed = 20) {
    const base = [18, 24, 20, 32, 29, 42, 38, 54, 48, 61, 58, 70];
    return base.map((value, index) => clamp(value + Math.sin(index + seed) * 10, 8, 92));
  }

  function lineChart(seriesA, seriesB) {
    const max = Math.max(...seriesA, ...seriesB, 100);
    const pointsA = seriesA.map((v, i) => `${(i / (seriesA.length - 1)) * 100},${100 - (v / max) * 86}`).join(' ');
    const pointsB = seriesB.map((v, i) => `${(i / (seriesB.length - 1)) * 100},${100 - (v / max) * 80}`).join(' ');
    return `<svg class="v4x-chart-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      ${[20, 40, 60, 80].map((y) => `<line class="v4x-chart-gridline" x1="0" x2="100" y1="${y}" y2="${y}"/>`).join('')}
      <polygon class="v4x-chart-area" fill="#00d4ff" points="0,100 ${pointsA} 100,100"/>
      <polyline class="v4x-chart-line" stroke="#00d4ff" points="${pointsA}"/>
      <polyline class="v4x-chart-line" stroke="#8b5cff" points="${pointsB}"/>
    </svg>`;
  }

  function barChart(values) {
    const max = Math.max(...values, 1);
    return `<div class="v4x-bars">${values.map((v) => `<span style="--h:${Math.max(10, (v / max) * 100)}%"></span>`).join('')}</div>`;
  }

  function kpiCard(label, value, delta, icon, color = '#087cff') {
    return `<article class="v4x-kpi" style="--kpi-color:${color}">
      <div class="v4x-kpi-head"><span class="v4x-kpi-label">${escapeHtml(label)}</span><span class="v4x-icon-chip">${icon}</span></div>
      <strong class="v4x-kpi-value" style="color:${color}">${value}</strong>
      <small class="v4x-kpi-sub">${escapeHtml(delta)}</small>
    </article>`;
  }

  function integrationNamesFor(client) {
    const names = [];
    if (client?.growthPack?.status === 'located') names.push('GrowthPack');
    if (client?.driveFolderId || client?.knowledgeBase?.folderId) names.push('Google Drive');
    if (client?.crm) names.push(client.crm);
    (state.integrations || []).filter((item) => !item.clientId || item.clientId === client?.id).slice(0, 4).forEach((item) => names.push(item.name));
    return Array.from(new Set(names.filter(Boolean))).slice(0, 6);
  }

  function dataSourceLabel(client) {
    const perf = getPerformanceSnapshot(client);
    const crm = getCrmSnapshot(client);
    if (crm && perf) return 'CRM + GrowthPack vinculados';
    if (crm) return 'CRM vinculado';
    if (perf) return 'GrowthPack vinculado';
    return 'Aguardando fonte oficial';
  }

  function renderSidebar() {
    const user = getUser();
    const clients = state.clients;
    const groups = squads();
    const avatar = user.avatar_url ? `<img src="${escapeHtml(user.avatar_url)}" alt=""/>` : escapeHtml(initials(user.name || user.email));
    q('#sidebar').innerHTML = `<aside class="v4x-sidebar">
      <div class="v4x-brand"><span class="v4x-brand-mark">V4</span><span><strong>V4 Command</strong><small>Center</small></span></div>
      <div class="v4x-sidebar-scroll">
        <div class="v4x-nav-group"><div class="v4x-nav-label">Principal</div>
          ${navItem('dashboard', '⌂', 'Dashboard', 'Visão consolidada', route.view === 'dashboard')}
          ${navItem('squads', '▦', 'Squads', 'Geral ou por equipe', route.view === 'squads', groups.length)}
          ${navItem('clients', '◈', 'Clientes', 'Carteira operacional', route.view === 'clients' || route.view === 'client', clients.length)}
        </div>
        <div class="v4x-nav-group"><div class="v4x-nav-label">Gestão</div>
          ${navItem('users', '●', 'Usuários', 'Pessoas e acessos', false)}
          ${navItem('admin-squads', '▣', 'Gestão de squads', 'Heads e membros', false)}
          ${navItem('admin-clients', '◇', 'Gestão de clientes', 'Cadastro e fontes', false)}
        </div>
        <div class="v4x-nav-group"><div class="v4x-nav-label">Clientes</div>
          ${clients.map((client) => clientItem(client)).join('')}
        </div>
      </div>
      <div class="v4x-sidebar-footer"><button class="v4x-user-card" type="button" data-v4x-admin="users"><span class="v4x-mini-avatar">${avatar}</span><span class="v4x-user-info"><strong>${escapeHtml(user.name || user.email)}</strong><small>${escapeHtml(roleLabel(user.role))} • ${escapeHtml(user.email || '')}</small></span></button></div>
    </aside>`;
  }

  function navItem(view, icon, title, sub, active, count) {
    return `<button class="v4x-nav-item ${active ? 'active' : ''}" type="button" data-v4x-view="${view}"><span class="v4x-nav-icon">${icon}</span><span class="v4x-nav-text"><strong>${escapeHtml(title)}</strong><small>${escapeHtml(sub)}</small></span>${count != null ? `<span class="v4x-badge-count">${count}</span>` : ''}</button>`;
  }

  function clientItem(client) {
    const active = route.view === 'client' && route.clientId === client.id;
    return `<button class="v4x-client-item ${active ? 'active' : ''}" type="button" data-v4x-client="${escapeHtml(client.id)}" style="--client-color:${escapeHtml(client.color || '#e50922')}"><span class="v4x-client-avatar">${escapeHtml(client.initials || initials(client.name))}</span><span class="v4x-client-text"><strong>${escapeHtml(client.name)}</strong><small>${escapeHtml(dataSourceLabel(client))}</small></span><span></span></button>`;
  }

  function topbar(title, sub) {
    return `<div class="v4x-topbar"><div class="v4x-breadcrumb"><small>Pages / ${escapeHtml(title)}</small><strong>${escapeHtml(sub || title)}</strong></div><div class="v4x-search">⌕ <span>Pesquisar cliente, squad ou integração...</span></div></div>`;
  }

  function renderDashboard() {
    const clients = state.clients;
    const metrics = aggregateMetrics(clients);
    const health = clients.length ? Math.round(clients.reduce((acc, c) => acc + Number(c.health || 70), 0) / clients.length) : 0;
    q('#main').innerHTML = `<main class="v4x-main-shell">
      ${topbar('Dashboard', 'Painel de Comando')}
      <section class="v4x-kpi-grid">
        ${kpiCard('Faturamento total', fmtCurrency(metrics.revenue), `${clients.length} clientes oficiais`, '💼', '#14e07f')}
        ${kpiCard('Leads totais', fmtNumber(metrics.leads), `CPL ${fmtCurrency(metrics.cpl)}`, '👥', '#087cff')}
        ${kpiCard('ROAS consolidado', `${metrics.roas.toFixed(2).replace('.', ',')}x`, `Investimento ${fmtCurrency(metrics.investment)}`, '↗', '#ff9f1a')}
        ${kpiCard('Saúde média', `${health}/100`, 'Operação consolidada', '◎', '#8b5cff')}
      </section>
      <section class="v4x-hero-grid">
        <article class="v4x-hero-card main"><span class="v4x-jelly"></span><div><p class="v4x-eyebrow">MODO V4 ON</p><h1 class="v4x-hero-title">Painel de Comando</h1><p class="v4x-hero-copy">Dashboard executivo com visão geral de clientes, GrowthPack, CRM, mídia, funil, squads e saúde operacional. Dados preservados das integrações existentes e preparados para Supabase/Drive Live.</p></div><div class="v4x-pill-list"><span class="v4x-pill">V4 Company</span><span class="v4x-pill">${clients.length} clientes</span><span class="v4x-pill">Supabase conectado</span></div></article>
        <article class="v4x-card"><div class="v4x-card-head"><h3>Satisfação operacional</h3><span class="v4x-pill">Health</span></div><div class="v4x-ring" style="--value:${health}"><div class="v4x-ring-inner"><strong>${health}%</strong><small class="v4x-muted">Score</small></div></div></article>
        <article class="v4x-card"><div class="v4x-card-head"><h3>Rastreamento</h3><span class="v4x-pill">Live</span></div>${trackingBlock(metrics)}</article>
      </section>
      <section class="v4x-grid">
        <article class="v4x-card v4x-span-8"><div class="v4x-card-head"><div><h3>Performance consolidada</h3><small class="v4x-muted">Faturamento, leads e investimento por tendência</small></div></div><div class="v4x-chart-wrap">${lineChart(sparkPoints(metrics.revenue / 1000), sparkPoints(metrics.leads / 10))}</div></article>
        <article class="v4x-card v4x-span-4"><div class="v4x-card-head"><h3>Atividade</h3><span class="v4x-pill">Clientes</span></div>${barChart([metrics.leads, metrics.mql, metrics.sql, metrics.opportunities, metrics.sales].map((v) => Math.max(1, v)))}${miniStats(metrics)}</article>
        <article class="v4x-card v4x-span-8">${clientsTable(clients)}</article>
        <article class="v4x-card v4x-span-4">${integrationsPanel(clients)}</article>
      </section>
    </main>`;
  }

  function trackingBlock(metrics) {
    return `<div class="v4x-list"><div class="v4x-list-row"><span><strong>${fmtNumber(metrics.impressions)}</strong><small>Impressões</small></span><span class="v4x-pill">Mídia</span></div><div class="v4x-list-row"><span><strong>${fmtNumber(metrics.clicks)}</strong><small>Cliques</small></span><span class="v4x-pill">CTR ${pct(metrics.ctr)}</span></div><div class="v4x-list-row"><span><strong>${fmtNumber(metrics.sales)}</strong><small>Vendas</small></span><span class="v4x-pill">Ticket ${fmtCurrency(metrics.ticket)}</span></div></div>`;
  }

  function miniStats(metrics) {
    const rows = [['Leads', metrics.leads], ['MQL', metrics.mql], ['SQL', metrics.sql], ['Vendas', metrics.sales]];
    return `<div class="v4x-mini-grid">${rows.map(([label, value]) => `<div><strong>${fmtNumber(value)}</strong><small>${label}</small><div class="v4x-progress" style="--p:${clamp(value / Math.max(metrics.leads || 1, 1) * 100, 8, 100)}%"><span></span></div></div>`).join('')}</div>`;
  }

  function clientsTable(clients) {
    return `<div class="v4x-card-head"><div><h3>Clientes e saúde da operação</h3><small class="v4x-muted">Carteira consolidada com vínculo de integrações</small></div><button class="v4x-btn" data-v4x-view="clients">Ver carteira</button></div><div class="v4x-table"><div class="v4x-table-row header"><span>Cliente</span><span>Leads</span><span>ROAS</span><span>Saúde</span></div>${clients.map((client) => { const m = clientMetrics(client); return `<button class="v4x-table-row" type="button" data-v4x-client="${escapeHtml(client.id)}"><span><strong>${escapeHtml(client.name)}</strong><small>${escapeHtml(integrationNamesFor(client).join(' • ') || dataSourceLabel(client))}</small></span><span>${fmtNumber(m.leads)}</span><span>${Number(m.roas || 0).toFixed(2)}x</span><span><strong>${client.health || 70}/100</strong><div class="v4x-progress" style="--p:${client.health || 70}%"><span></span></div></span></button>`; }).join('')}</div>`;
  }

  function integrationsPanel(clients) {
    const rows = [
      ['GrowthPack', clients.filter((c) => c.growthPack?.status === 'located').length],
      ['Google Drive', clients.filter((c) => c.driveFolderId || c.knowledgeBase?.folderId).length],
      ['CRM', clients.filter((c) => c.crm).length],
      ['Supabase', clients.length]
    ];
    return `<div class="v4x-card-head"><h3>Integrações</h3><span class="v4x-pill">Live</span></div><div class="v4x-list">${rows.map(([label, value]) => `<div class="v4x-list-row"><span><strong>${label}</strong><small>${value}/${clients.length} clientes vinculados</small></span><span class="v4x-pill">${value ? 'Ativo' : 'Pendente'}</span></div>`).join('')}</div>`;
  }

  function renderSquadsDashboard() {
    const groups = squads();
    const selected = route.squadId || 'all';
    const clients = selectedClients();
    const metrics = aggregateMetrics(clients);
    q('#main').innerHTML = `<main class="v4x-main-shell">
      ${topbar('Squads', 'Dashboard de Squads')}
      <section class="v4x-card"><div class="v4x-card-head"><div><p class="v4x-eyebrow">V4 Company</p><h2>Dashboard Geral por Squad</h2><p class="v4x-muted">Use o filtro para ver geral ou selecionar cliente/equipe sem perder vínculos de integração.</p></div><select class="v4x-select" data-v4x-squad-filter><option value="all">Geral • todos os clientes</option>${groups.map((s) => `<option value="${escapeHtml(s.id)}" ${s.id === selected ? 'selected' : ''}>${escapeHtml(s.name)}</option>`).join('')}</select></div></section>
      <section class="v4x-kpi-grid">${kpiCard('Clientes no escopo', fmtNumber(clients.length), 'Carteira filtrada', '◈', '#087cff')}${kpiCard('Faturamento', fmtCurrency(metrics.revenue), 'Consolidado do squad', '💼', '#14e07f')}${kpiCard('Leads', fmtNumber(metrics.leads), `CPL ${fmtCurrency(metrics.cpl)}`, '👥', '#8b5cff')}${kpiCard('ROAS', `${metrics.roas.toFixed(2).replace('.', ',')}x`, 'Retorno consolidado', '↗', '#ff9f1a')}</section>
      <section class="v4x-grid"><article class="v4x-card v4x-span-8"><h3>Performance do Squad</h3>${lineChart(sparkPoints(metrics.revenue / 1000), sparkPoints(metrics.leads / 10))}</article><article class="v4x-card v4x-span-4"><h3>Funil consolidado</h3>${trackingBlock(metrics)}</article><article class="v4x-card v4x-span-12">${clientsTable(clients)}</article></section>
    </main>`;
  }

  function renderClientsDirectory() {
    const clients = state.clients;
    q('#main').innerHTML = `<main class="v4x-main-shell">${topbar('Clientes', 'Carteira de Clientes')}<section class="v4x-grid">${clients.map((client) => { const m = clientMetrics(client); return `<article class="v4x-card v4x-span-4" style="--client-color:${escapeHtml(client.color || '#e50922')}"><div class="v4x-card-head"><span class="v4x-client-avatar">${escapeHtml(client.initials || initials(client.name))}</span><button class="v4x-btn primary" data-v4x-client="${escapeHtml(client.id)}">Abrir</button></div><h2>${escapeHtml(client.name)}</h2><p class="v4x-muted">${escapeHtml(dataSourceLabel(client))}</p><div class="v4x-pill-list">${integrationNamesFor(client).map((name) => `<span class="v4x-pill">${escapeHtml(name)}</span>`).join('')}</div><div class="v4x-progress" style="--p:${client.health || 70}%"><span></span></div><small class="v4x-muted">Leads ${fmtNumber(m.leads)} • ROAS ${Number(m.roas || 0).toFixed(2)}x</small></article>`; }).join('')}</section></main>`;
  }

  function renderClientDashboard() {
    const client = clientById(route.clientId);
    if (!client) return renderClientsDirectory();
    const m = clientMetrics(client);
    q('#main').innerHTML = `<main class="v4x-main-shell">
      ${topbar('Cliente', client.name)}
      <section class="v4x-hero-card v4x-client-header" data-client-theme="custom" style="--client-color:${escapeHtml(client.color || '#e50922')}"><p class="v4x-eyebrow">Painel operacional V4</p><h1 class="v4x-hero-title">${escapeHtml(client.name)}</h1><p class="v4x-hero-copy">${escapeHtml(client.segment || client.description || 'Operação conectada ao ecossistema V4: CRM, mídia, GrowthPack, Drive e Supabase.')}</p><div class="v4x-pill-list"><span class="v4x-pill">Saúde ${client.health || 70}/100</span><span class="v4x-pill">Grupo ${escapeHtml(client.groupId || '-')}</span>${integrationNamesFor(client).map((name) => `<span class="v4x-pill">${escapeHtml(name)}</span>`).join('')}</div></section>
      <section class="v4x-kpi-grid">${kpiCard('Faturamento', fmtCurrency(m.revenue), m.source, '💼', '#14e07f')}${kpiCard('Leads', fmtNumber(m.leads), `CPL ${fmtCurrency(m.cpl)}`, '👥', '#087cff')}${kpiCard('ROAS', `${Number(m.roas || 0).toFixed(2).replace('.', ',')}x`, `Invest ${fmtCurrency(m.investment)}`, '↗', '#ff9f1a')}${kpiCard('Vendas', fmtNumber(m.sales), `Ticket ${fmtCurrency(m.ticket)}`, '◎', '#8b5cff')}</section>
      <section class="v4x-grid"><article class="v4x-card v4x-span-8"><h3>Performance do cliente</h3>${lineChart(sparkPoints(m.revenue / 1000), sparkPoints(m.leads / 10))}</article><article class="v4x-card v4x-span-4"><h3>Funil</h3>${trackingBlock(m)}</article><article class="v4x-card v4x-span-6">${clientSourcesCard(client)}</article><article class="v4x-card v4x-span-6">${clientOpsCard(client)}</article></section>
    </main>`;
  }

  function clientSourcesCard(client) {
    const sources = integrationNamesFor(client);
    return `<div class="v4x-card-head"><h3>Integrações do cliente</h3><span class="v4x-pill">${sources.length}</span></div><div class="v4x-list">${sources.map((name) => `<div class="v4x-list-row"><span><strong>${escapeHtml(name)}</strong><small>${escapeHtml(client.name)} vinculado</small></span><span class="v4x-pill">Ativo</span></div>`).join('') || '<p class="v4x-muted">Nenhuma integração oficial localizada.</p>'}</div>`;
  }

  function clientOpsCard(client) {
    const lps = client.lps || [];
    const pixels = (state.pixels || []).filter((p) => p.clientId === client.id);
    const campaigns = (state.campaigns || []).filter((c) => c.clientId === client.id);
    return `<div class="v4x-card-head"><h3>Operação</h3><span class="v4x-pill">Live</span></div><div class="v4x-list"><div class="v4x-list-row"><span><strong>Landing Pages</strong><small>${lps.length} páginas monitoradas</small></span><span class="v4x-pill">${lps.filter((lp) => lp.status === 'Ativo').length} ativas</span></div><div class="v4x-list-row"><span><strong>Pixels</strong><small>${pixels.length} conversões</small></span><span class="v4x-pill">Monitorando</span></div><div class="v4x-list-row"><span><strong>Campanhas</strong><small>${campaigns.length} campanhas</small></span><span class="v4x-pill">Mídia</span></div></div>`;
  }

  function renderAdminBridge(page) {
    if (window.V4_ADMIN_PAGES?.render) return window.V4_ADMIN_PAGES.render(page);
    q('#main').innerHTML = `<main class="v4x-main-shell"><section class="v4x-card"><h2>${escapeHtml(page)}</h2><p class="v4x-muted">Módulo administrativo carregando.</p></section></main>`;
  }

  function render() {
    state = loadState();
    if (!route.clientId && state.clients[0]) route.clientId = state.clients[0].id;
    renderSidebar();
    if (route.view === 'dashboard') renderDashboard();
    else if (route.view === 'squads') renderSquadsDashboard();
    else if (route.view === 'clients') renderClientsDirectory();
    else if (route.view === 'client') renderClientDashboard();
  }

  function bind() {
    if (window.__v4CommandRedesignBound) return;
    window.__v4CommandRedesignBound = true;
    document.addEventListener('click', function (event) {
      const admin = event.target.closest('[data-v4x-admin]');
      if (admin) { event.preventDefault(); renderAdminBridge(admin.dataset.v4xAdmin); return; }
      const view = event.target.closest('[data-v4x-view]');
      if (view) {
        event.preventDefault();
        const value = view.dataset.v4xView;
        if (value === 'users') return renderAdminBridge('users');
        if (value === 'admin-squads') return renderAdminBridge('squads');
        if (value === 'admin-clients') return renderAdminBridge('clients');
        route.view = value;
        render();
        return;
      }
      const client = event.target.closest('[data-v4x-client]');
      if (client) { event.preventDefault(); route.view = 'client'; route.clientId = client.dataset.v4xClient; render(); }
    }, true);
    document.addEventListener('change', function (event) {
      const select = event.target.closest('[data-v4x-squad-filter]');
      if (!select) return;
      route.squadId = select.value;
      route.view = 'squads';
      render();
    }, true);
  }

  function ensureCss() {
    if (q('#v4-command-redesign-css')) return;
    const link = document.createElement('link');
    link.id = 'v4-command-redesign-css';
    link.rel = 'stylesheet';
    link.href = `src/services/v4-command-redesign.css?v=${ASSET_VERSION}`;
    document.head.appendChild(link);
  }

  function start() {
    ensureCss();
    bind();
    setTimeout(render, 50);
    setTimeout(render, 800);
    window.V4_COMMAND_REDESIGN = { render, route, loadState };
    if (window.V4_BOOT_LOG) window.V4_BOOT_LOG('v4_command_redesign', 'Novo dashboard V4 Vision carregado.');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
