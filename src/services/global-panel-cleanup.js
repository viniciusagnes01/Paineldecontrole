(function () {
  const STORAGE_KEY = 'v4-command-center-state-v6-crm-performance-losses';

  function readState() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return window.V4_SEED || {}; }
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  }

  function money(value) {
    const number = Number(value || 0);
    return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function number(value) {
    return Number(value || 0).toLocaleString('pt-BR');
  }

  function decimal(value) {
    return Number(value || 0).toFixed(2).replace('.', ',');
  }

  function okBadge(label, ok) {
    return `<span class="badge ${ok ? 'ok' : 'warn'}">${escapeHtml(label)}</span>`;
  }

  function clientMetrics(state, client) {
    const crm = state.crmSnapshots?.[client.id] || null;
    const monthly = state.performanceSnapshots?.[client.id]?.monthly?.current?.metrics || null;
    const weekly = state.performanceSnapshots?.[client.id]?.weekly?.current?.metrics || null;
    const perf = monthly || weekly || {};
    const base = client.metrics || {};
    const investment = Number(perf.investment || base.investment || 0);
    const revenue = Number(crm?.totals?.value || perf.revenue || base.revenue || 0);
    const leads = Number(crm?.totals?.lead || perf.leads || base.leads || 0);
    const cpl = Number(perf.cpl || base.cpl || (investment && leads ? investment / leads : 0));
    const roas = Number(perf.roas || base.roas || (investment && revenue ? revenue / investment : 0));
    return { revenue, investment, leads, cpl, roas, hasCrm: Boolean(crm), hasMedia: Boolean(monthly || weekly) };
  }

  function hasDrive(client) {
    return Boolean(client.driveFolderId || client.knowledgeBase?.folderId || client.communicationBase?.driveFolderId || client.growthPack?.spreadsheetId);
  }

  function hasGrowthPack(client) {
    return Boolean(client.growthPack?.spreadsheetId || client.growthPack?.version || client.performanceSheets?.spreadsheetId);
  }

  function isGlobalPage() {
    return /Painel de Controle/i.test(document.querySelector('h1')?.textContent || '') && /V4 Company/i.test(document.body?.innerText || '');
  }

  function removeBrokenBlocks() {
    document.querySelectorAll('h2, h3').forEach((heading) => {
      const text = heading.textContent || '';
      if (!/Resumo de campanhas/i.test(text)) return;
      const card = heading.closest('article.glass-card, .glass-card, article');
      if (card) card.remove();
    });
  }

  function buildResultsTable(state) {
    const rows = (state.clients || []).map((client) => {
      const m = clientMetrics(state, client);
      return `<tr>
        <td><strong>${escapeHtml(client.name)}</strong><br><small class="muted">${escapeHtml(client.segment || '')}</small></td>
        <td>${money(m.revenue)}</td>
        <td>${number(m.leads)}</td>
        <td>${money(m.investment)}</td>
        <td>${money(m.cpl)}</td>
        <td>${decimal(m.roas)}x</td>
        <td>${okBadge(m.hasCrm ? 'CRM ok' : 'CRM pendente', m.hasCrm)}</td>
        <td>${okBadge(m.hasMedia ? 'Mídia ok' : 'Mídia pendente', m.hasMedia)}</td>
      </tr>`;
    }).join('');
    return `
      <article class="glass-card span-12" data-v4-global-results>
        <h3>Resultados por cliente</h3>
        <p class="muted">Consolidado operacional por cliente, usando CRM e mídia sincronizados quando disponíveis.</p>
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
        <td><strong>${escapeHtml(client.name)}</strong><br><small class="muted">Grupo ${escapeHtml(client.groupId || '-')}</small></td>
        <td>${okBadge(hasDrive(client) ? 'Drive ok' : 'Pendente', hasDrive(client))}</td>
        <td>${okBadge(hasGrowthPack(client) ? 'GrowthPack ok' : 'Fonte alternativa', hasGrowthPack(client))}</td>
        <td>${okBadge(m.hasCrm ? 'Sincronizado' : 'Pendente', m.hasCrm)}</td>
        <td>${okBadge(m.hasMedia ? 'Sincronizada' : 'Pendente', m.hasMedia)}</td>
        <td>${escapeHtml(client.responsible || 'V4')}</td>
      </tr>`;
    }).join('');
    return `
      <article class="glass-card span-12" data-v4-global-integrations>
        <h3>Integrações por cliente</h3>
        <p class="muted">Mapa limpo de fontes oficiais, sem blocos quebrados e sem tabelas comprimidas.</p>
        <div class="table-wrap v4-clean-table"><table>
          <thead><tr><th>Cliente</th><th>Drive</th><th>GrowthPack</th><th>CRM</th><th>Mídia</th><th>Responsável</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="6">Nenhuma integração cadastrada.</td></tr>'}</tbody>
        </table></div>
      </article>
    `;
  }

  function mountCleanPortfolio() {
    if (!isGlobalPage()) return;
    removeBrokenBlocks();
    document.querySelectorAll('[data-v4-global-results], [data-v4-global-integrations]').forEach((el) => el.remove());
    const grid = document.querySelector('.dashboard-grid');
    if (!grid) return;
    const state = readState();
    grid.insertAdjacentHTML('beforeend', buildResultsTable(state) + buildIntegrationsTable(state));
  }

  document.addEventListener('DOMContentLoaded', () => setTimeout(mountCleanPortfolio, 300));
  document.addEventListener('click', () => {
    setTimeout(mountCleanPortfolio, 120);
    setTimeout(mountCleanPortfolio, 700);
  });

  const observer = new MutationObserver(() => {
    clearTimeout(window.__v4GlobalCleanupTimer);
    window.__v4GlobalCleanupTimer = setTimeout(mountCleanPortfolio, 160);
  });

  if (document.body) observer.observe(document.body, { childList: true, subtree: true });
  setTimeout(mountCleanPortfolio, 700);
  setTimeout(mountCleanPortfolio, 1600);

  window.V4_GLOBAL_PANEL_CLEANUP = { mountCleanPortfolio, removeBrokenBlocks };
})();
