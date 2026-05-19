(function () {
  const STORAGE_KEY = 'v4-command-center-state-v6-crm-performance-losses';
  const SOURCES = ['Geral', 'Meta Ads', 'Google Ads', 'Orgânico'];

  function readState() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch (error) { return {}; }
  }

  function writeState(state) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (error) { /* noop */ }
  }

  function currentClientId() {
    return document.querySelector('.client-btn.active')?.dataset?.client || null;
  }

  function currentClientName() {
    return document.querySelector('.client-btn.active .client-name')?.textContent?.trim() || 'Cliente';
  }

  function parseDateInput(value, endOfDay) {
    const raw = String(value || '').trim();
    if (!raw) return null;
    const parts = raw.split('-').map(Number);
    if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
    return new Date(parts[0], parts[1] - 1, parts[2], endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
  }

  function toDateInput(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function fmtNumber(value) {
    return Number(value || 0).toLocaleString('pt-BR');
  }

  function fmtCurrency(value) {
    return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function pct(value) {
    return `${Number(value || 0).toFixed(1).replace('.', ',')}%`;
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  }

  function empty(label) {
    return { label, value: 0, lead: 0, mql: 0, sql: 0, opportunity: 0, purchase: 0, lost: 0, meta: 0, google: 0 };
  }

  function add(target, record) {
    target.value += Number(record.value || 0);
    target.lead += Number(record.lead || 0);
    target.mql += Number(record.mql || 0);
    target.sql += Number(record.sql || 0);
    target.opportunity += Number(record.opportunity || 0);
    target.purchase += Number(record.purchase || 0);
    target.lost += Number(record.lost || 0);
    target.meta += Number(record.meta || 0);
    target.google += Number(record.google || 0);
  }

  function rates(t) {
    return {
      leadToMql: t.lead ? t.mql / t.lead * 100 : 0,
      mqlToSql: t.mql ? t.sql / t.mql * 100 : 0,
      sqlToOpportunity: t.sql ? t.opportunity / t.sql * 100 : 0,
      opportunityToSale: t.opportunity ? t.purchase / t.opportunity * 100 : 0,
      saleRate: t.lead ? t.purchase / t.lead * 100 : 0,
      lossRate: t.lead ? t.lost / t.lead * 100 : 0,
      ticket: t.purchase ? t.value / t.purchase : 0
    };
  }

  function buildFilteredSnapshot(snapshot, filters) {
    if (!snapshot?.rawRecords?.length) return snapshot;
    const start = parseDateInput(filters.start, false);
    const end = parseDateInput(filters.end, true);
    const rawRecords = snapshot.rawRecords;
    const records = rawRecords.filter((record) => {
      const ts = Number(record.timestamp || 0);
      if (!ts) return false;
      if (start && ts < start.getTime()) return false;
      if (end && ts > end.getTime()) return false;
      return true;
    });

    const bySource = {
      Geral: empty('Geral'),
      'Meta Ads': empty('Meta Ads'),
      'Google Ads': empty('Google Ads'),
      'Orgânico': empty('Orgânico')
    };

    records.forEach((record) => {
      add(bySource.Geral, record);
      add(bySource[record.source] || bySource['Orgânico'], record);
    });

    const sourceFunnels = {};
    SOURCES.forEach((source) => {
      sourceFunnels[source] = { ...bySource[source], rates: rates(bySource[source]) };
    });

    return {
      ...snapshot,
      rows: records.length,
      totals: bySource.Geral,
      rates: rates(bySource.Geral),
      sourceFunnels,
      activeDateRange: filters
    };
  }

  function getDateLimits(snapshot) {
    if (snapshot?.dateRange?.min && snapshot?.dateRange?.max) return snapshot.dateRange;
    const times = (snapshot?.rawRecords || []).map((record) => Number(record.timestamp || 0)).filter(Boolean).sort((a, b) => a - b);
    return { min: toDateInput(times[0]), max: toDateInput(times[times.length - 1]) };
  }

  function getSavedFilters(clientId, snapshot) {
    const limits = getDateLimits(snapshot);
    let saved = {};
    try { saved = JSON.parse(sessionStorage.getItem(`v4-crm-panel-filters-${clientId}`) || '{}'); } catch (error) { saved = {}; }
    return {
      source: saved.source || 'Geral',
      start: saved.start || limits.min || '',
      end: saved.end || limits.max || ''
    };
  }

  function saveFilters(clientId, filters) {
    sessionStorage.setItem(`v4-crm-panel-filters-${clientId}`, JSON.stringify(filters));
  }

  function findFunnelArticle() {
    const title = Array.from(document.querySelectorAll('h3')).find((el) => el.textContent.trim().includes('Jornada completa do funil'));
    return title?.closest('.glass-card') || document.querySelector('.funnel')?.closest('.glass-card') || null;
  }

  function updateFunnelValues(sourceData) {
    const funnel = document.querySelector('.funnel');
    if (!funnel || !sourceData) return;
    const valuesByLabel = {
      Leads: { value: sourceData.lead, sub: fmtCurrency(sourceData.value || 0) },
      MQLs: { value: sourceData.mql, sub: 'Qualificados' },
      Oportunidades: { value: sourceData.opportunity, sub: 'Comercial' },
      Vendas: { value: sourceData.purchase, sub: fmtCurrency(sourceData.rates?.ticket || 0) }
    };
    funnel.querySelectorAll('.funnel-step').forEach((step) => {
      const label = step.querySelector('small')?.textContent?.trim();
      const data = valuesByLabel[label];
      if (!data) return;
      const strong = step.querySelector('strong');
      const muted = step.querySelector('.muted');
      if (strong) strong.textContent = fmtNumber(data.value);
      if (muted) muted.textContent = data.sub;
    });
  }

  function renderPanel(clientId, snapshot, filters, filtered) {
    const sourceData = filtered?.sourceFunnels?.[filters.source] || filtered?.sourceFunnels?.Geral || empty('Geral');
    const limits = getDateLimits(snapshot);
    const hasRaw = Boolean(snapshot?.rawRecords?.length);
    return `
      <article class="glass-card span-12 crm-filter-panel" data-crm-filter-panel="true">
        <div class="crm-filter-layout">
          <div class="crm-filter-copy">
            <p class="eyebrow">Filtro do relatório</p>
            <h2>${escapeHtml(currentClientName())} • período + origem</h2>
            <p class="muted">Escolha um intervalo e uma origem. O funil abaixo recalcula apenas os dados daquele período e canal.</p>
          </div>
          <form class="crm-filter-controls" data-crm-filter-form="true">
            <label>Data inicial<input type="date" name="start" value="${escapeHtml(filters.start)}" min="${escapeHtml(limits.min || '')}" max="${escapeHtml(limits.max || '')}"></label>
            <label>Data final<input type="date" name="end" value="${escapeHtml(filters.end)}" min="${escapeHtml(limits.min || '')}" max="${escapeHtml(limits.max || '')}"></label>
            <label>Origem<select name="source">
              ${SOURCES.map((source) => `<option value="${escapeHtml(source)}" ${source === filters.source ? 'selected' : ''}>${escapeHtml(source)}</option>`).join('')}
            </select></label>
            <button class="btn primary" type="submit">Aplicar filtro</button>
            <button class="btn ghost" type="button" data-crm-filter-reset="true">Período completo</button>
          </form>
        </div>
        ${!hasRaw ? '<div class="empty">Sincronize o CRM novamente para ativar o filtro por data usando a BASE_CRM atual.</div>' : ''}
        <div class="source-filter-grid crm-filter-summary">
          <div class="insight-card"><span class="badge client">Origem</span><strong>${escapeHtml(filters.source)}</strong><p class="muted">${fmtNumber(filtered?.rows || 0)} linhas no período.</p></div>
          <div class="insight-card"><span class="badge ok">Receita</span><strong>${fmtCurrency(sourceData.value)}</strong><p class="muted">Soma de Valor.</p></div>
          <div class="insight-card"><span class="badge client">Leads</span><strong>${fmtNumber(sourceData.lead)}</strong><p class="muted">MQL ${fmtNumber(sourceData.mql)} • SQL ${fmtNumber(sourceData.sql)}</p></div>
          <div class="insight-card"><span class="badge ok">Vendas</span><strong>${fmtNumber(sourceData.purchase)}</strong><p class="muted">Ticket ${fmtCurrency(sourceData.rates?.ticket || 0)}</p></div>
          <div class="insight-card"><span class="badge bad">Perdidos</span><strong>${fmtNumber(sourceData.lost)}</strong><p class="muted">Perda ${pct(sourceData.rates?.lossRate || 0)}</p></div>
        </div>
        <div class="table-wrap"><table><thead><tr><th>Origem</th><th>Leads</th><th>MQL</th><th>SQL</th><th>Oport.</th><th>Vendas</th><th>Receita</th><th>Taxa venda</th></tr></thead><tbody>
          ${SOURCES.filter((source) => source !== 'Geral').map((source) => {
            const row = filtered?.sourceFunnels?.[source] || empty(source);
            return `<tr><td>${escapeHtml(source)}</td><td>${fmtNumber(row.lead)}</td><td>${fmtNumber(row.mql)}</td><td>${fmtNumber(row.sql)}</td><td>${fmtNumber(row.opportunity)}</td><td>${fmtNumber(row.purchase)}</td><td>${fmtCurrency(row.value)}</td><td>${pct(row.rates?.saleRate || 0)}</td></tr>`;
          }).join('')}
        </tbody></table></div>
      </article>
    `;
  }

  function applyFiltersAndRender() {
    const clientId = currentClientId();
    if (!clientId) return;
    const funnelArticle = findFunnelArticle();
    const crmSource = Array.from(document.querySelectorAll('h2')).find((el) => el.textContent.includes('BASE_CRM'));
    if (!funnelArticle || !crmSource) return;

    const state = readState();
    const snapshot = state.crmSnapshots?.[clientId];
    if (!snapshot) {
      document.querySelector('[data-crm-filter-panel]')?.remove();
      return;
    }

    const filters = getSavedFilters(clientId, snapshot);
    const filtered = buildFilteredSnapshot(snapshot, filters);
    const sourceData = filtered?.sourceFunnels?.[filters.source] || filtered?.sourceFunnels?.Geral;

    state.crmSnapshots[clientId] = { ...snapshot, ...filtered, rawRecords: snapshot.rawRecords, sourceLabels: snapshot.sourceLabels, dateRange: snapshot.dateRange };
    writeState(state);

    let wrapper = document.querySelector('[data-crm-filter-panel]');
    if (!wrapper) {
      funnelArticle.insertAdjacentHTML('beforebegin', renderPanel(clientId, snapshot, filters, filtered));
    } else {
      wrapper.outerHTML = renderPanel(clientId, snapshot, filters, filtered);
    }

    updateFunnelValues(sourceData);
  }

  document.addEventListener('submit', (event) => {
    const form = event.target.closest('[data-crm-filter-form]');
    if (!form) return;
    event.preventDefault();
    const clientId = currentClientId();
    if (!clientId) return;
    const data = new FormData(form);
    saveFilters(clientId, { start: data.get('start') || '', end: data.get('end') || '', source: data.get('source') || 'Geral' });
    applyFiltersAndRender();
  });

  document.addEventListener('click', (event) => {
    const reset = event.target.closest('[data-crm-filter-reset]');
    if (!reset) return;
    const clientId = currentClientId();
    const snapshot = readState().crmSnapshots?.[clientId];
    if (!clientId || !snapshot) return;
    const limits = getDateLimits(snapshot);
    saveFilters(clientId, { source: 'Geral', start: limits.min || '', end: limits.max || '' });
    applyFiltersAndRender();
  });

  const schedule = () => window.requestAnimationFrame(applyFiltersAndRender);
  document.addEventListener('DOMContentLoaded', () => {
    const main = document.getElementById('main') || document.body;
    const observer = new MutationObserver(schedule);
    observer.observe(main, { childList: true, subtree: true });
    schedule();
    window.setTimeout(schedule, 700);
    window.setTimeout(schedule, 1800);
  });
})();
