(function () {
  const STORAGE_KEY = 'v4-command-center-state-v6-crm-performance-losses';
  const BROKEN_HEADINGS = [
    /Resumo de campanhas/i,
    /Alertas e pontos de aten[cç][aã]o/i,
    /Eventos recentes/i,
    /[ÁA]rea edit[aá]vel do sistema/i
  ];

  function readState() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return stored && Array.isArray(stored.clients) ? stored : (window.V4_SEED || {});
    } catch {
      return window.V4_SEED || {};
    }
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  }

  function asNumber(value) {
    const number = Number(value || 0);
    return Number.isFinite(number) ? number : 0;
  }

  function money(value) {
    return asNumber(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function number(value) {
    return asNumber(value).toLocaleString('pt-BR');
  }

  function decimal(value) {
    return asNumber(value).toFixed(2).replace('.', ',');
  }

  function badge(label, ok, warnOnly) {
    const cls = ok ? 'ok' : warnOnly ? 'warn' : 'bad';
    return `<span class="badge ${cls}">${escapeHtml(label)}</span>`;
  }

  function latestPerformance(state, clientId) {
    return state.performanceSnapshots?.[clientId]?.monthly?.current?.metrics || state.performanceSnapshots?.[clientId]?.weekly?.current?.metrics || null;
  }

  function clientMetrics(state, client) {
    const crm = state.crmSnapshots?.[client.id] || null;
    const perf = latestPerformance(state, client.id) || {};
    const base = client.metrics || {};
    const investment = asNumber(perf.investment || base.investment);
    const revenue = asNumber(crm?.totals?.value || perf.revenue || base.revenue);
    const leads = asNumber(crm?.totals?.lead || perf.leads || base.leads);
    const cpl = asNumber(perf.cpl || base.cpl || (investment && leads ? investment / leads : 0));
    const roas = asNumber(perf.roas || base.roas || (investment && revenue ? revenue / investment : 0));
    return { revenue, investment, leads, cpl, roas, hasCrm: Boolean(crm), hasMedia: Boolean(perf && Object.keys(perf).length) };
  }

  function hasDrive(client) {
    return Boolean(client.driveFolderId || client.knowledgeBase?.folderId || client.communicationBase?.driveFolderId || client.growthPack?.spreadsheetId);
  }

  function hasGrowthPack(client) {
    return Boolean(client.growthPack?.spreadsheetId || client.growthPack?.version || client.performanceSheets?.spreadsheetId || client.crmSheet?.spreadsheetId);
  }

  function activeClientButton() {
    return document.querySelector('.client-btn.active, [data-client].active');
  }

  function isBlackOpsDashboard() {
    const active = activeClientButton();
    const activeText = active?.textContent || '';
    const activeClientId = active?.dataset?.client || '';
    return /black\s*ops/i.test(activeText) || /black-?ops/i.test(activeClientId);
  }

  function findMainGrid() {
    const main = document.getElementById('main');
    if (!main || !isBlackOpsDashboard()) return null;
    const grids = Array.from(main.querySelectorAll('.dashboard-grid'));
    return grids[0] || null;
  }

  function removePortfolioTables() {
    document.querySelectorAll('[data-v4-global-results], [data-v4-global-integrations]').forEach((el) => el.remove());
  }

  function removeBrokenBlocks() {
    document.querySelectorAll('h2, h3').forEach((heading) => {
      const text = heading.textContent || '';
      if (!BROKEN_HEADINGS.some((pattern) => pattern.test(text))) return;
      const card = heading.closest('article.glass-card, .glass-card, article, section');
      if (card) card.remove();
    });
  }

  function buildResultsTable(state) {
    const rows = (state.clients || []).map((client) => {
      const m = clientMetrics(state, client);
      return `<tr>
        <td data-label="Cliente"><strong>${escapeHtml(client.name)}</strong><small>${escapeHtml(client.segment || 'Segmento nao informado')}</small></td>
        <td data-label="Receita">${money(m.revenue)}</td>
        <td data-label="Leads">${number(m.leads)}</td>
        <td data-label="Investimento">${money(m.investment)}</td>
        <td data-label="CPL">${money(m.cpl)}</td>
        <td data-label="ROAS">${decimal(m.roas)}x</td>
        <td data-label="CRM">${badge(m.hasCrm ? 'CRM ok' : 'CRM pendente', m.hasCrm, true)}</td>
        <td data-label="Mídia">${badge(m.hasMedia ? 'Midia ok' : 'Midia pendente', m.hasMedia, true)}</td>
      </tr>`;
    }).join('');
    return `
      <article class="glass-card span-12 v4-clean-card" data-v4-global-results>
        <div class="section-head">
          <div><p class="eyebrow">Carteira</p><h3>Resultados por cliente</h3><p class="muted">Consolidado geral exclusivo do Black Ops.</p></div>
        </div>
        <div class="table-wrap v4-clean-table"><table>
          <thead><tr><th>Cliente</th><th>Receita</th><th>Leads</th><th>Investimento</th><th>CPL</th><th>ROAS</th><th>CRM</th><th>Mídia</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="8">Nenhum cliente cadastrado.</td></tr>'}</tbody>
        </table></div>
      </article>
    `;
  }

  function buildIntegrationsTable(state) {
    const rows = (state.clients || []).map((client) => {
      const m = clientMetrics(state, client);
      return `<tr>
        <td data-label="Cliente"><strong>${escapeHtml(client.name)}</strong><small>Grupo ${escapeHtml(client.groupId || '-')}</small></td>
        <td data-label="Drive">${badge(hasDrive(client) ? 'Drive ok' : 'Pendente', hasDrive(client), true)}</td>
        <td data-label="GrowthPack">${badge(hasGrowthPack(client) ? 'GrowthPack ok' : 'Fonte alternativa', hasGrowthPack(client), true)}</td>
        <td data-label="CRM">${badge(m.hasCrm ? 'Sincronizado' : 'Pendente', m.hasCrm, true)}</td>
        <td data-label="Mídia">${badge(m.hasMedia ? 'Sincronizada' : 'Pendente', m.hasMedia, true)}</td>
        <td data-label="Responsável">${escapeHtml(client.responsible || 'V4')}</td>
      </tr>`;
    }).join('');
    return `
      <article class="glass-card span-12 v4-clean-card" data-v4-global-integrations>
        <div class="section-head">
          <div><p class="eyebrow">Arquitetura operacional</p><h3>Integrações por cliente</h3><p class="muted">Mapa geral exclusivo do Black Ops.</p></div>
        </div>
        <div class="table-wrap v4-clean-table"><table>
          <thead><tr><th>Cliente</th><th>Drive</th><th>GrowthPack</th><th>CRM</th><th>Mídia</th><th>Responsável</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="6">Nenhuma integração cadastrada.</td></tr>'}</tbody>
        </table></div>
      </article>
    `;
  }

  function mountCleanPortfolio() {
    removeBrokenBlocks();
    removePortfolioTables();
    if (!isBlackOpsDashboard()) return;
    const grid = findMainGrid();
    if (!grid) return;
    const state = readState();
    grid.insertAdjacentHTML('beforeend', buildResultsTable(state) + buildIntegrationsTable(state));
  }

  document.addEventListener('DOMContentLoaded', () => setTimeout(mountCleanPortfolio, 250));
  document.addEventListener('click', () => {
    setTimeout(mountCleanPortfolio, 80);
    setTimeout(mountCleanPortfolio, 500);
  });

  const observer = new MutationObserver(() => {
    clearTimeout(window.__v4GlobalCleanupTimer);
    window.__v4GlobalCleanupTimer = setTimeout(mountCleanPortfolio, 120);
  });

  if (document.body) observer.observe(document.body, { childList: true, subtree: true });
  setTimeout(mountCleanPortfolio, 600);
  setTimeout(mountCleanPortfolio, 1500);

  window.V4_GLOBAL_PANEL_CLEANUP = { mountCleanPortfolio, removeBrokenBlocks, removePortfolioTables };
})();
