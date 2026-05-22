(function () {
  const STORAGE_KEY = 'v4-command-center-state-v6-crm-performance-losses';
  const FILTER_PREFIX = 'v4-crm-panel-filters-v3';
  const SOURCES = ['Geral', 'Meta Ads', 'Google Ads', 'Orgânico', 'Indicação', 'Direto', 'WhatsApp', 'Outros'];
  let lastClientId = '';
  let lastPanelHash = '';
  let scheduled = false;

  function readState() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch { return {}; }
  }

  function currentClientId() {
    return document.querySelector('.client-btn.active')?.dataset?.client || '';
  }

  function currentClientName() {
    return document.querySelector('.client-btn.active .client-name')?.textContent?.trim() || 'Cliente';
  }

  function esc(value) {
    return String(value ?? '').replace(/[&<>'"]/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char];
    });
  }

  function fmt(value) { return Number(value || 0).toLocaleString('pt-BR'); }
  function brl(value) { return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
  function pct(value) { return `${Number(value || 0).toFixed(1).replace('.', ',')}%`; }

  function parseInputDate(value, endOfDay) {
    if (!value) return null;
    const parts = String(value).split('-').map(Number);
    if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    date.setHours(endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
    return date.getTime();
  }

  function dateInput(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function recordsForClient(clientId) {
    const state = readState();
    return state.crmSnapshots?.[clientId]?.rawRecords || [];
  }

  function getLimits(records) {
    const times = records.map((item) => Number(item.timestamp || 0)).filter(Boolean).sort((a, b) => a - b);
    return { min: dateInput(times[0]), max: dateInput(times[times.length - 1]) };
  }

  function getFilters(clientId, records) {
    const lim = getLimits(records);
    let saved = {};
    try { saved = JSON.parse(sessionStorage.getItem(`${FILTER_PREFIX}-${clientId}`) || '{}'); } catch {}
    return { source: saved.source || 'Geral', start: saved.start || lim.min, end: saved.end || lim.max };
  }

  function saveFilters(clientId, filters) {
    try { sessionStorage.setItem(`${FILTER_PREFIX}-${clientId}`, JSON.stringify(filters)); } catch {}
  }

  function availableSources(records) {
    const dynamic = records.map((item) => item.source).filter(Boolean);
    return Array.from(new Set(SOURCES.concat(dynamic)));
  }

  function filterRecords(records, filters) {
    const start = parseInputDate(filters.start, false);
    const end = parseInputDate(filters.end, true);
    return records.filter((record) => {
      const timestamp = Number(record.timestamp || 0);
      if (start && (!timestamp || timestamp < start)) return false;
      if (end && (!timestamp || timestamp > end)) return false;
      if (filters.source && filters.source !== 'Geral' && String(record.source || '') !== filters.source) return false;
      return true;
    });
  }

  function empty() {
    return { value: 0, lead: 0, mql: 0, sql: 0, opportunity: 0, purchase: 0, lost: 0 };
  }

  function aggregate(records) {
    const totals = empty();
    records.forEach((record) => {
      Object.keys(totals).forEach((key) => { totals[key] += Number(record[key] || 0); });
    });
    const rates = {
      saleRate: totals.lead ? totals.purchase / totals.lead * 100 : 0,
      lossRate: totals.lead ? totals.lost / totals.lead * 100 : 0,
      ticket: totals.purchase ? totals.value / totals.purchase : 0
    };
    return { totals, rates };
  }

  function rowsBySource(records, sources) {
    return sources.filter((source) => source !== 'Geral').map((source) => {
      const data = aggregate(records.filter((record) => String(record.source || '') === source));
      const t = data.totals;
      return `<tr><td>${esc(source)}</td><td>${fmt(t.lead)}</td><td>${fmt(t.mql)}</td><td>${fmt(t.sql)}</td><td>${fmt(t.opportunity)}</td><td>${fmt(t.purchase)}</td><td>${brl(t.value)}</td><td>${pct(data.rates.saleRate)}</td></tr>`;
    }).join('');
  }

  function panelHtml(clientId) {
    const records = recordsForClient(clientId);
    if (!records.length) return '';
    const sources = availableSources(records);
    const filters = getFilters(clientId, records);
    if (!sources.includes(filters.source)) filters.source = 'Geral';
    const lim = getLimits(records);
    const selected = filterRecords(records, filters);
    const data = aggregate(selected);
    const t = data.totals;
    const r = data.rates;
    return `
      <article class="glass-card span-12 crm-filter-panel" data-crm-filter-panel="true">
        <div class="crm-filter-layout">
          <div class="crm-filter-copy">
            <p class="eyebrow">Filtros da BASE_CRM</p>
            <h2>${esc(currentClientName())} • período e origem</h2>
            <p class="muted">Filtro leve: recalcula os cards usando apenas a BASE_CRM sincronizada.</p>
          </div>
          <form class="crm-filter-controls" data-crm-filter-form="true">
            <label>Data inicial<input type="date" name="start" value="${esc(filters.start)}" min="${esc(lim.min)}" max="${esc(lim.max)}" /></label>
            <label>Data final<input type="date" name="end" value="${esc(filters.end)}" min="${esc(lim.min)}" max="${esc(lim.max)}" /></label>
            <label>Origem<select name="source">${sources.map((source) => `<option value="${esc(source)}" ${source === filters.source ? 'selected' : ''}>${esc(source)}</option>`).join('')}</select></label>
            <button class="btn primary" type="submit">Aplicar</button>
            <button class="btn ghost" type="button" data-crm-filter-reset="true">Limpar</button>
          </form>
        </div>
        <div class="source-filter-grid crm-filter-summary">
          <div class="insight-card"><span class="badge client">Origem</span><strong>${esc(filters.source)}</strong><p class="muted">${fmt(selected.length)} de ${fmt(records.length)} linhas.</p></div>
          <div class="insight-card"><span class="badge ok">Receita</span><strong>${brl(t.value)}</strong><p class="muted">Soma filtrada.</p></div>
          <div class="insight-card"><span class="badge client">Leads</span><strong>${fmt(t.lead)}</strong><p class="muted">MQL ${fmt(t.mql)} • SQL ${fmt(t.sql)}</p></div>
          <div class="insight-card"><span class="badge ok">Vendas</span><strong>${fmt(t.purchase)}</strong><p class="muted">Ticket ${brl(r.ticket)}</p></div>
          <div class="insight-card"><span class="badge bad">Perdidos</span><strong>${fmt(t.lost)}</strong><p class="muted">Perda ${pct(r.lossRate)}</p></div>
        </div>
        <div class="table-wrap"><table><thead><tr><th>Origem</th><th>Leads</th><th>MQL</th><th>SQL</th><th>Oport.</th><th>Vendas</th><th>Receita</th><th>Taxa venda</th></tr></thead><tbody>${rowsBySource(records, sources)}</tbody></table></div>
      </article>`;
  }

  function updateFunnel(clientId) {
    const records = recordsForClient(clientId);
    const filters = getFilters(clientId, records);
    const data = aggregate(filterRecords(records, filters));
    const t = data.totals;
    const r = data.rates;
    const values = { Leads: [t.lead, brl(t.value)], MQLs: [t.mql, 'Qualificados'], Oportunidades: [t.opportunity, 'Comercial'], Vendas: [t.purchase, brl(r.ticket)] };
    document.querySelectorAll('.funnel-step').forEach((step) => {
      const label = step.querySelector('small')?.textContent?.trim();
      if (!values[label]) return;
      const strong = step.querySelector('strong');
      const muted = step.querySelector('.muted');
      if (strong) strong.textContent = fmt(values[label][0]);
      if (muted) muted.textContent = values[label][1];
    });
  }

  function apply(force) {
    const clientId = currentClientId();
    if (!clientId) return;
    if (!force && clientId === lastClientId && document.querySelector('[data-crm-filter-panel]')) return;
    lastClientId = clientId;
    const html = panelHtml(clientId);
    if (!html) return;
    const hash = `${clientId}:${html.length}:${html.slice(0, 120)}`;
    if (!force && hash === lastPanelHash) return;
    lastPanelHash = hash;
    const existing = document.querySelector('[data-crm-filter-panel]');
    if (existing) existing.outerHTML = html;
    else {
      const funnelCard = Array.from(document.querySelectorAll('.glass-card')).find((card) => card.querySelector('.funnel'));
      const grid = document.querySelector('.dashboard-grid');
      if (funnelCard) funnelCard.insertAdjacentHTML('beforebegin', html);
      else if (grid) grid.insertAdjacentHTML('afterbegin', html);
    }
    updateFunnel(clientId);
  }

  function schedule(force) {
    if (scheduled) return;
    scheduled = true;
    setTimeout(() => { scheduled = false; apply(force); }, 250);
  }

  document.addEventListener('submit', (event) => {
    const form = event.target.closest('[data-crm-filter-form]');
    if (!form) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const clientId = currentClientId();
    if (!clientId) return;
    const data = new FormData(form);
    saveFilters(clientId, { start: data.get('start') || '', end: data.get('end') || '', source: data.get('source') || 'Geral' });
    apply(true);
  }, true);

  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-client], [data-tab], [data-nav]')) schedule(true);
    if (!event.target.closest('[data-crm-filter-reset]')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const clientId = currentClientId();
    const lim = getLimits(recordsForClient(clientId));
    saveFilters(clientId, { source: 'Geral', start: lim.min, end: lim.max });
    apply(true);
  }, true);

  document.addEventListener('DOMContentLoaded', () => {
    schedule(true);
    setTimeout(() => schedule(true), 900);
  });

  window.V4_FILTER_RUNTIME_FIX = { apply: () => apply(true) };
})();
