(function () {
  const STORAGE_KEY = 'v4-command-center-state-v6-crm-performance-losses';
  const FILTER_PREFIX = 'v4-crm-panel-filters-v2';
  const FIXED_SOURCES = ['Geral', 'Meta Ads', 'Google Ads', 'Orgânico', 'Indicação', 'Direto', 'WhatsApp', 'Outros'];

  function readState() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch { return {}; }
  }

  function currentClientId() {
    return document.querySelector('.client-btn.active')?.dataset?.client || null;
  }

  function currentClientName() {
    return document.querySelector('.client-btn.active .client-name')?.textContent?.trim() || 'Cliente';
  }

  function esc(value) {
    return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  }

  function fmt(value) {
    return Number(value || 0).toLocaleString('pt-BR');
  }

  function brl(value) {
    return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function pct(value) {
    return `${Number(value || 0).toFixed(1).replace('.', ',')}%`;
  }

  function parseDate(value, end) {
    if (!value) return null;
    const parts = String(value).split('-').map(Number);
    if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    d.setHours(end ? 23 : 0, end ? 59 : 0, end ? 59 : 0, end ? 999 : 0);
    return d.getTime();
  }

  function toInput(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function limits(records) {
    const times = records.map((r) => Number(r.timestamp || 0)).filter(Boolean).sort((a, b) => a - b);
    return { min: toInput(times[0]), max: toInput(times[times.length - 1]) };
  }

  function saved(clientId, records) {
    const lim = limits(records);
    let data = {};
    try { data = JSON.parse(sessionStorage.getItem(`${FILTER_PREFIX}-${clientId}`) || '{}'); } catch {}
    return { source: data.source || 'Geral', start: data.start || lim.min, end: data.end || lim.max };
  }

  function save(clientId, filters) {
    try { sessionStorage.setItem(`${FILTER_PREFIX}-${clientId}`, JSON.stringify(filters)); } catch {}
  }

  function sourceList(records) {
    const dynamic = Array.from(new Set(records.map((r) => r.source).filter(Boolean)));
    return Array.from(new Set([...FIXED_SOURCES, ...dynamic]));
  }

  function aggregate(records) {
    if (window.V4_CRM_SHEETS?.aggregateRecords) return window.V4_CRM_SHEETS.aggregateRecords(records);
    const totals = { label: 'Geral', value: 0, lead: 0, mql: 0, sql: 0, opportunity: 0, purchase: 0, lost: 0 };
    records.forEach((r) => ['value', 'lead', 'mql', 'sql', 'opportunity', 'purchase', 'lost'].forEach((k) => { totals[k] += Number(r[k] || 0); }));
    return { totals, rates: { saleRate: totals.lead ? totals.purchase / totals.lead * 100 : 0, lossRate: totals.lead ? totals.lost / totals.lead * 100 : 0, ticket: totals.purchase ? totals.value / totals.purchase : 0 } };
  }

  function filtered(records, filters) {
    const start = parseDate(filters.start, false);
    const end = parseDate(filters.end, true);
    return records.filter((record) => {
      const ts = Number(record.timestamp || 0);
      if (start && (!ts || ts < start)) return false;
      if (end && (!ts || ts > end)) return false;
      if (filters.source && filters.source !== 'Geral' && String(record.source || '') !== filters.source) return false;
      return true;
    });
  }

  function sourceRows(records, sources) {
    return sources.filter((s) => s !== 'Geral').map((source) => {
      const data = aggregate(records.filter((r) => String(r.source || '') === source));
      const t = data.totals || {};
      const rates = data.rates || {};
      return `<tr><td>${esc(source)}</td><td>${fmt(t.lead)}</td><td>${fmt(t.mql)}</td><td>${fmt(t.sql)}</td><td>${fmt(t.opportunity)}</td><td>${fmt(t.purchase)}</td><td>${brl(t.value)}</td><td>${pct(rates.saleRate)}</td></tr>`;
    }).join('');
  }

  function render(clientId) {
    const state = readState();
    const snapshot = state.crmSnapshots?.[clientId];
    const records = snapshot?.rawRecords || [];
    if (!records.length) return '';
    const filters = saved(clientId, records);
    const sources = sourceList(records);
    if (!sources.includes(filters.source)) filters.source = 'Geral';
    const lim = limits(records);
    const selectedRecords = filtered(records, filters);
    const data = aggregate(selectedRecords);
    const t = data.totals || {};
    const rates = data.rates || {};
    return `
      <article class="glass-card span-12 crm-filter-panel" data-crm-filter-panel="true">
        <div class="crm-filter-layout">
          <div class="crm-filter-copy">
            <p class="eyebrow">Filtros ativos da BASE_CRM</p>
            <h2>${esc(currentClientName())} • período, origem e funil</h2>
            <p class="muted">Os cards abaixo são recalculados usando somente as linhas filtradas da BASE_CRM.</p>
          </div>
          <form class="crm-filter-controls" data-crm-filter-form="true">
            <label>Data inicial<input type="date" name="start" value="${esc(filters.start)}" min="${esc(lim.min)}" max="${esc(lim.max)}" /></label>
            <label>Data final<input type="date" name="end" value="${esc(filters.end)}" min="${esc(lim.min)}" max="${esc(lim.max)}" /></label>
            <label>Origem<select name="source">${sources.map((s) => `<option value="${esc(s)}" ${s === filters.source ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select></label>
            <button class="btn primary" type="submit">Aplicar filtro</button>
            <button class="btn ghost" type="button" data-crm-filter-reset="true">Limpar filtros</button>
          </form>
        </div>
        <div class="source-filter-grid crm-filter-summary">
          <div class="insight-card"><span class="badge client">Origem</span><strong>${esc(filters.source)}</strong><p class="muted">${fmt(selectedRecords.length)} de ${fmt(records.length)} linhas.</p></div>
          <div class="insight-card"><span class="badge ok">Receita</span><strong>${brl(t.value)}</strong><p class="muted">Soma filtrada.</p></div>
          <div class="insight-card"><span class="badge client">Leads</span><strong>${fmt(t.lead)}</strong><p class="muted">MQL ${fmt(t.mql)} • SQL ${fmt(t.sql)}</p></div>
          <div class="insight-card"><span class="badge ok">Vendas</span><strong>${fmt(t.purchase)}</strong><p class="muted">Ticket ${brl(rates.ticket)}</p></div>
          <div class="insight-card"><span class="badge bad">Perdidos</span><strong>${fmt(t.lost)}</strong><p class="muted">Perda ${pct(rates.lossRate)}</p></div>
        </div>
        <div class="table-wrap"><table><thead><tr><th>Origem</th><th>Leads</th><th>MQL</th><th>SQL</th><th>Oport.</th><th>Vendas</th><th>Receita</th><th>Taxa venda</th></tr></thead><tbody>${sourceRows(records, sources)}</tbody></table></div>
      </article>`;
  }

  function updateFunnel(records) {
    const data = aggregate(records);
    const t = data.totals || {};
    const rates = data.rates || {};
    const map = { Leads: [t.lead, brl(t.value)], MQLs: [t.mql, 'Qualificados'], Oportunidades: [t.opportunity, 'Comercial'], Vendas: [t.purchase, brl(rates.ticket)] };
    document.querySelectorAll('.funnel-step').forEach((step) => {
      const label = step.querySelector('small')?.textContent?.trim();
      if (!map[label]) return;
      step.querySelector('strong').textContent = fmt(map[label][0]);
      step.querySelector('.muted').textContent = map[label][1];
    });
  }

  function apply() {
    const clientId = currentClientId();
    if (!clientId) return;
    const state = readState();
    const snapshot = state.crmSnapshots?.[clientId];
    const records = snapshot?.rawRecords || [];
    if (!records.length) return;
    const html = render(clientId);
    const current = document.querySelector('[data-crm-filter-panel]');
    if (current) current.outerHTML = html;
    else {
      const target = Array.from(document.querySelectorAll('.glass-card')).find((card) => card.querySelector('.funnel')) || document.querySelector('.dashboard-grid');
      if (target) target.insertAdjacentHTML(target.classList.contains('dashboard-grid') ? 'afterbegin' : 'beforebegin', html);
    }
    updateFunnel(filtered(records, saved(clientId, records)));
  }

  document.addEventListener('submit', (event) => {
    const form = event.target.closest('[data-crm-filter-form]');
    if (!form) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const clientId = currentClientId();
    if (!clientId) return;
    const data = new FormData(form);
    save(clientId, { start: data.get('start') || '', end: data.get('end') || '', source: data.get('source') || 'Geral' });
    apply();
  }, true);

  document.addEventListener('click', (event) => {
    if (!event.target.closest('[data-crm-filter-reset]')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const clientId = currentClientId();
    const records = readState().crmSnapshots?.[clientId]?.rawRecords || [];
    const lim = limits(records);
    save(clientId, { source: 'Geral', start: lim.min, end: lim.max });
    apply();
  }, true);

  document.addEventListener('DOMContentLoaded', () => {
    const main = document.getElementById('main') || document.body;
    const observer = new MutationObserver(() => requestAnimationFrame(apply));
    observer.observe(main, { childList: true, subtree: true });
    setTimeout(apply, 600);
    setTimeout(apply, 1600);
  });

  window.V4_FILTER_RUNTIME_FIX = { apply };
})();
