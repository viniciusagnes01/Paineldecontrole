(function () {
  if (!window.V4_CRM_SHEETS) return;

  const original = window.V4_CRM_SHEETS;
  const STORAGE_KEY = 'v4-command-center-state-v6-crm-performance-losses';
  const SOURCE_LABELS = ['Geral', 'Meta Ads', 'Google Ads', 'Orgânico'];

  const REQUIRED_COLUMNS = {
    date: ['DATA', 'Data'],
    leadId: ['LEAD ID', 'ID DO LEAD', 'Lead ID'],
    name: ['NOME', 'Nome'],
    value: ['VALOR', 'Valor'],
    lead: ['LEAD', 'Lead'],
    mql: ['MQL'],
    sql: ['SQL'],
    opportunity: ['OPORTUNIDADE', 'Oportunidade'],
    purchase: ['COMPRA', 'VENDA', 'Compra'],
    lost: ['LEAD PERDIDO', 'PERDIDO', 'Lead Perdido'],
    meta: ['META ADS', 'Meta Ads'],
    google: ['GOOGLE ADS', 'Google Ads'],
    owner: ['RESPONSAVEL', 'RESPONSÁVEL', 'Responsavel'],
    lossReason: ['MOTIVO DE PERDA', 'Motivo de Perda']
  };

  function normalizeKey(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase();
  }

  function mapHeaders(header = []) {
    const normalized = header.map(normalizeKey);
    const map = {};
    Object.entries(REQUIRED_COLUMNS).forEach(([key, options]) => {
      const possible = options.map(normalizeKey);
      map[key] = normalized.findIndex((name) => possible.includes(name));
    });
    return map;
  }

  function valueAt(row, map, key) {
    const index = map[key];
    if (index === -1 || index == null) return '';
    return row[index] ?? '';
  }

  function toNumber(value) {
    if (typeof value === 'number') return value;
    const raw = String(value || '').trim();
    if (!raw) return 0;
    const cleaned = raw.replace(/R\$/g, '').replace(/\s/g, '');
    if (cleaned.includes(',') && cleaned.includes('.')) return Number(cleaned.replace(/\./g, '').replace(',', '.')) || 0;
    if (cleaned.includes(',')) return Number(cleaned.replace(',', '.')) || 0;
    return Number(cleaned) || 0;
  }

  function parseDate(value) {
    const raw = String(value || '').trim();
    if (!raw) return null;
    const br = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (br) {
      const day = Number(br[1]);
      const month = Number(br[2]) - 1;
      const year = Number(br[3].length === 2 ? `20${br[3]}` : br[3]);
      return new Date(year, month, day, 12, 0, 0);
    }
    const iso = new Date(raw);
    return Number.isNaN(iso.getTime()) ? null : iso;
  }

  function dateToInput(date) {
    if (!date) return '';
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function parseInputDate(value, endOfDay = false) {
    const raw = String(value || '').trim();
    if (!raw) return null;
    const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
  }

  function formatMonth(date) {
    if (!date) return 'Sem data';
    return `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  }

  function isoWeek(date) {
    if (!date) return 'Sem data';
    const utc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = utc.getUTCDay() || 7;
    utc.setUTCDate(utc.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((utc - yearStart) / 86400000) + 1) / 7);
    return `${utc.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  }

  function emptyTotals(label = '') {
    return { label, value: 0, lead: 0, mql: 0, sql: 0, opportunity: 0, purchase: 0, lost: 0, meta: 0, google: 0 };
  }

  function addGroup(store, key, patch) {
    const safeKey = String(key || 'Sem informação').trim() || 'Sem informação';
    if (!store[safeKey]) store[safeKey] = emptyTotals(safeKey);
    Object.entries(patch).forEach(([field, value]) => {
      store[safeKey][field] = (store[safeKey][field] || 0) + Number(value || 0);
    });
  }

  function addTotals(target, patch) {
    Object.entries(patch).forEach(([field, value]) => {
      target[field] = (target[field] || 0) + Number(value || 0);
    });
  }

  function topList(group, orderBy = 'lead', limit = 8) {
    return Object.values(group).sort((a, b) => Number(b[orderBy] || 0) - Number(a[orderBy] || 0)).slice(0, limit);
  }

  function ratesFor(totals) {
    return {
      leadToMql: totals.lead ? totals.mql / totals.lead * 100 : 0,
      mqlToSql: totals.mql ? totals.sql / totals.mql * 100 : 0,
      sqlToOpportunity: totals.sql ? totals.opportunity / totals.sql * 100 : 0,
      opportunityToSale: totals.opportunity ? totals.purchase / totals.opportunity * 100 : 0,
      saleRate: totals.lead ? totals.purchase / totals.lead * 100 : 0,
      lossRate: totals.lead ? totals.lost / totals.lead * 100 : 0,
      ticket: totals.purchase ? totals.value / totals.purchase : 0
    };
  }

  function detectSource(meta, google) {
    if (Number(meta || 0) > 0) return 'Meta Ads';
    if (Number(google || 0) > 0) return 'Google Ads';
    return 'Orgânico';
  }

  function aggregateSubset(records) {
    const totals = emptyTotals('Geral');
    const bySource = { 'Meta Ads': emptyTotals('Meta Ads'), 'Google Ads': emptyTotals('Google Ads'), 'Orgânico': emptyTotals('Orgânico') };
    const byMonth = {}, byWeek = {}, lossReasons = {}, owners = {}, sources = {}, lossBySource = {}, ownerReasons = {};
    const latest = [], lostLatest = [];

    records.forEach((record) => {
      const patch = { value: record.value, lead: record.lead, mql: record.mql, sql: record.sql, opportunity: record.opportunity, purchase: record.purchase, lost: record.lost, meta: record.meta, google: record.google };
      addTotals(totals, patch);
      addTotals(bySource[record.source], patch);
      addGroup(byMonth, formatMonth(record.dateObj), patch);
      addGroup(byWeek, isoWeek(record.dateObj), patch);
      addGroup(owners, record.owner, patch);
      addGroup(sources, record.source, patch);
      if (record.lost) {
        addGroup(lossReasons, record.lossReason, { lost: record.lost, lead: record.lead, value: record.value });
        addGroup(lossBySource, record.source, { lost: record.lost, lead: record.lead, value: record.value, mql: record.mql, sql: record.sql, opportunity: record.opportunity, purchase: record.purchase });
        const matrixKey = `${record.owner}|||${record.lossReason}`;
        if (!ownerReasons[matrixKey]) ownerReasons[matrixKey] = { owner: record.owner, reason: record.lossReason, lost: 0 };
        ownerReasons[matrixKey].lost += record.lost;
      }
      const leadRecord = {
        date: record.dateLabel,
        leadId: record.leadId,
        name: record.name,
        value: record.value,
        owner: record.owner,
        source: record.source,
        lossReason: record.lost ? record.lossReason : '',
        flags: { lead: record.lead, mql: record.mql, sql: record.sql, opportunity: record.opportunity, purchase: record.purchase, lost: record.lost, meta: record.meta, google: record.google },
        timestamp: record.timestamp
      };
      latest.push(leadRecord);
      if (record.lost) lostLatest.push(leadRecord);
    });

    const sourceFunnels = {
      Geral: { ...totals, rates: ratesFor(totals) },
      'Meta Ads': { ...bySource['Meta Ads'], rates: ratesFor(bySource['Meta Ads']) },
      'Google Ads': { ...bySource['Google Ads'], rates: ratesFor(bySource['Google Ads']) },
      'Orgânico': { ...bySource['Orgânico'], rates: ratesFor(bySource['Orgânico']) }
    };

    return {
      sourceFunnels,
      totals,
      rates: ratesFor(totals),
      byMonth: Object.values(byMonth),
      byWeek: Object.values(byWeek),
      lossReasons: topList(lossReasons, 'lost', 14),
      owners: topList(owners, 'lead', 20).map((row) => ({ ...row, lossRate: row.lead ? row.lost / row.lead * 100 : 0, saleRate: row.lead ? row.purchase / row.lead * 100 : 0 })),
      sources: topList(sources, 'lead', 5),
      lossBySource: topList(lossBySource, 'lost', 5),
      ownerReasonMatrix: Object.values(ownerReasons).sort((a, b) => b.lost - a.lost),
      latest: latest.sort((a, b) => b.timestamp - a.timestamp).slice(0, 12),
      lostLatest: lostLatest.sort((a, b) => b.timestamp - a.timestamp).slice(0, 18)
    };
  }

  function aggregateEnhanced(rows) {
    if (!Array.isArray(rows) || rows.length < 2) throw new Error('CSV sem linhas suficientes.');
    const headerIndex = rows.findIndex((row) => row.some((cell) => normalizeKey(cell) === 'DATA') && row.some((cell) => normalizeKey(cell) === 'LEAD'));
    if (headerIndex === -1) throw new Error('Cabeçalho BASE_CRM não encontrado.');

    const header = rows[headerIndex];
    const map = mapHeaders(header);
    const dataRows = rows.slice(headerIndex + 1).filter((row) => row.some((cell) => String(cell).trim() !== ''));
    const rawRecords = dataRows.map((row) => {
      const dateObj = parseDate(valueAt(row, map, 'date'));
      const meta = toNumber(valueAt(row, map, 'meta'));
      const google = toNumber(valueAt(row, map, 'google'));
      return {
        dateObj,
        timestamp: dateObj ? dateObj.getTime() : 0,
        dateLabel: valueAt(row, map, 'date'),
        leadId: valueAt(row, map, 'leadId'),
        name: valueAt(row, map, 'name'),
        value: toNumber(valueAt(row, map, 'value')),
        lead: map.lead === -1 ? 1 : toNumber(valueAt(row, map, 'lead')),
        mql: toNumber(valueAt(row, map, 'mql')),
        sql: toNumber(valueAt(row, map, 'sql')),
        opportunity: toNumber(valueAt(row, map, 'opportunity')),
        purchase: toNumber(valueAt(row, map, 'purchase')),
        lost: toNumber(valueAt(row, map, 'lost')),
        meta,
        google,
        source: detectSource(meta, google),
        owner: valueAt(row, map, 'owner') || 'Sem responsável',
        lossReason: valueAt(row, map, 'lossReason') || 'Sem motivo informado'
      };
    });

    const base = aggregateSubset(rawRecords);
    const timestamps = rawRecords.map((record) => record.timestamp).filter(Boolean).sort((a, b) => a - b);
    return {
      generatedAt: new Date().toISOString(),
      rows: rawRecords.length,
      sourceLabels: SOURCE_LABELS,
      dateRange: {
        min: timestamps[0] ? dateToInput(new Date(timestamps[0])) : '',
        max: timestamps[timestamps.length - 1] ? dateToInput(new Date(timestamps[timestamps.length - 1])) : ''
      },
      rawRecords,
      ...base
    };
  }

  function getSpreadsheetId(urlOrId) {
    if (original.getSpreadsheetId) return original.getSpreadsheetId(urlOrId);
    const raw = String(urlOrId || '').trim();
    const match = raw.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : raw;
  }

  function buildCsvUrls(source = {}) {
    const id = getSpreadsheetId(source.spreadsheetId || source.url);
    if (!id) return [];
    const sheetName = encodeURIComponent(source.sheetName || 'BASE_CRM');
    const gid = source.gid || '';
    const urls = [];
    if (source.proxyUrl) urls.push(source.proxyUrl);
    urls.push(`https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=${sheetName}`);
    if (gid) urls.push(`https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${encodeURIComponent(gid)}`);
    return urls;
  }

  async function fetchText(url) {
    const response = await fetch(`${url}${url.includes('?') ? '&' : '?'}cacheBust=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    if (!text || /<html|<!doctype/i.test(text)) throw new Error('A resposta não veio em CSV. Confira o compartilhamento da planilha ou use proxy.');
    return text;
  }

  async function loadEnhanced(source = {}) {
    const urls = buildCsvUrls(source);
    if (!urls.length) throw new Error('Fonte CRM não configurada.');
    const errors = [];
    for (const url of urls) {
      try {
        const csv = await fetchText(url);
        const rows = original.parseCsv ? original.parseCsv(csv) : [];
        const snapshot = aggregateEnhanced(rows);
        return { ok: true, sourceUrl: url, snapshot };
      } catch (error) {
        errors.push(`${url}: ${error.message}`);
      }
    }
    throw new Error(errors.join(' | '));
  }

  function fmtNumber(value) { return Number(value || 0).toLocaleString('pt-BR'); }
  function fmtCurrency(value) { return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
  function pct(value) { return `${Number(value || 0).toFixed(1).replace('.', ',')}%`; }
  function escapeHtml(value) { return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char])); }
  function readState() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch (error) { return {}; } }
  function writeState(state) { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  function currentClientId() { return document.querySelector('.client-btn.active')?.dataset?.client || null; }
  function selectedSource(clientId) { return sessionStorage.getItem(`v4-source-filter-${clientId}`) || 'Geral'; }
  function setSelectedSource(clientId, source) { sessionStorage.setItem(`v4-source-filter-${clientId}`, source); }
  function dateFilter(clientId, snapshot) {
    const saved = JSON.parse(sessionStorage.getItem(`v4-date-filter-${clientId}`) || '{}');
    return { start: saved.start || snapshot?.dateRange?.min || '', end: saved.end || snapshot?.dateRange?.max || '' };
  }
  function setDateFilter(clientId, filter) { sessionStorage.setItem(`v4-date-filter-${clientId}`, JSON.stringify(filter)); }

  function filteredSnapshot(snapshot, filter) {
    if (!snapshot?.rawRecords?.length) return snapshot;
    const start = parseInputDate(filter.start, false);
    const end = parseInputDate(filter.end, true);
    const records = snapshot.rawRecords.filter((record) => {
      if (!record.timestamp) return false;
      if (start && record.timestamp < start.getTime()) return false;
      if (end && record.timestamp > end.getTime()) return false;
      return true;
    });
    return { ...snapshot, ...aggregateSubset(records), rows: records.length, activeDateRange: filter };
  }

  function persistFilteredSnapshot(clientId, originalSnapshot, filtered) {
    const state = readState();
    if (!state.crmSnapshots?.[clientId]) return;
    state.crmSnapshots[clientId] = { ...originalSnapshot, ...filtered, rawRecords: originalSnapshot.rawRecords, sourceLabels: originalSnapshot.sourceLabels, dateRange: originalSnapshot.dateRange };
    writeState(state);
  }

  function enhanceSourceUi() {
    const clientId = currentClientId();
    if (!clientId || !document.querySelector('.tab-btn.active')) return;
    const state = readState();
    const originalSnapshot = state.crmSnapshots?.[clientId];
    if (!originalSnapshot?.sourceFunnels) return;

    const filter = dateFilter(clientId, originalSnapshot);
    const snapshot = filteredSnapshot(originalSnapshot, filter);
    const source = selectedSource(clientId);
    const selected = snapshot.sourceFunnels[source] || snapshot.sourceFunnels.Geral;
    const labels = snapshot.sourceLabels || SOURCE_LABELS;
    const crmTitle = Array.from(document.querySelectorAll('h2')).find((el) => el.textContent.includes('BASE_CRM'));
    const funnel = document.querySelector('.funnel');
    if (!funnel) return;

    persistFilteredSnapshot(clientId, originalSnapshot, snapshot);

    let panel = document.querySelector('[data-source-filter-panel]');
    if (!panel) {
      panel = document.createElement('article');
      panel.className = 'glass-card span-12 source-filter-panel';
      panel.setAttribute('data-source-filter-panel', 'true');
      const anchor = crmTitle?.closest('.glass-card') || funnel.closest('.glass-card');
      anchor?.insertAdjacentElement('afterend', panel);
    }

    panel.innerHTML = `
      <div class="section-head source-filter-head">
        <div>
          <p class="eyebrow">Filtro de origem e período do funil</p>
          <h2>Visão por data, Geral, Meta Ads, Google Ads e Orgânico</h2>
          <p class="muted">Fonte: BASE_CRM. Meta/Google vêm das colunas META ADS e GOOGLE ADS; sem marcação entra como Orgânico.</p>
        </div>
        <div class="source-filter-actions">
          ${labels.map((label) => `<button class="btn ${label === source ? 'primary' : 'ghost'} source-filter-btn" data-source-filter="${escapeHtml(label)}">${escapeHtml(label)}</button>`).join('')}
        </div>
      </div>
      <form class="date-filter-form" data-date-filter-form="true">
        <label>Início<input type="date" name="start" value="${escapeHtml(filter.start)}" min="${escapeHtml(originalSnapshot.dateRange?.min || '')}" max="${escapeHtml(originalSnapshot.dateRange?.max || '')}"></label>
        <label>Fim<input type="date" name="end" value="${escapeHtml(filter.end)}" min="${escapeHtml(originalSnapshot.dateRange?.min || '')}" max="${escapeHtml(originalSnapshot.dateRange?.max || '')}"></label>
        <button class="btn primary" type="submit">Aplicar período</button>
        <button class="btn ghost" type="button" data-date-filter-reset="true">Período completo</button>
      </form>
      <div class="source-filter-grid">
        <div class="insight-card"><span class="badge client">Fonte</span><strong>${escapeHtml(source)}</strong><p class="muted">${fmtNumber(snapshot.rows)} linhas no período.</p></div>
        <div class="insight-card"><span class="badge ok">Receita</span><strong>${fmtCurrency(selected.value)}</strong><p class="muted">Valor somado na BASE_CRM.</p></div>
        <div class="insight-card"><span class="badge client">Leads</span><strong>${fmtNumber(selected.lead)}</strong><p class="muted">MQL ${fmtNumber(selected.mql)} • SQL ${fmtNumber(selected.sql)}</p></div>
        <div class="insight-card"><span class="badge ok">Vendas</span><strong>${fmtNumber(selected.purchase)}</strong><p class="muted">Ticket ${fmtCurrency(selected.rates?.ticket || 0)}</p></div>
        <div class="insight-card"><span class="badge bad">Perdidos</span><strong>${fmtNumber(selected.lost)}</strong><p class="muted">Taxa de perda ${pct(selected.rates?.lossRate || 0)}</p></div>
      </div>
      <div class="table-wrap source-filter-table"><table><thead><tr><th>Origem</th><th>Leads</th><th>MQL</th><th>SQL</th><th>Oport.</th><th>Vendas</th><th>Receita</th><th>Taxa venda</th></tr></thead><tbody>
        ${labels.filter((label) => label !== 'Geral').map((label) => {
          const row = snapshot.sourceFunnels[label] || {};
          return `<tr><td>${escapeHtml(label)}</td><td>${fmtNumber(row.lead)}</td><td>${fmtNumber(row.mql)}</td><td>${fmtNumber(row.sql)}</td><td>${fmtNumber(row.opportunity)}</td><td>${fmtNumber(row.purchase)}</td><td>${fmtCurrency(row.value)}</td><td>${pct(row.rates?.saleRate || 0)}</td></tr>`;
        }).join('')}
      </tbody></table></div>
    `;

    const steps = Array.from(funnel.querySelectorAll('.funnel-step'));
    const updates = [null, null, { value: selected.lead, sub: fmtCurrency(selected.value || 0) }, { value: selected.mql, sub: 'Qualificados' }, { value: selected.opportunity, sub: 'Comercial' }, { value: selected.purchase, sub: fmtCurrency(selected.rates?.ticket || 0) }];
    steps.forEach((step, index) => {
      const data = updates[index];
      if (!data) return;
      const strong = step.querySelector('strong');
      const sub = step.querySelector('.muted');
      if (strong) strong.textContent = fmtNumber(data.value);
      if (sub) sub.textContent = data.sub;
    });
  }

  window.V4_CRM_SHEETS = { ...original, load: loadEnhanced, aggregate: aggregateEnhanced };

  document.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-source-filter]');
    if (btn) {
      const clientId = currentClientId();
      if (!clientId) return;
      setSelectedSource(clientId, btn.dataset.sourceFilter);
      window.setTimeout(enhanceSourceUi, 0);
      return;
    }
    const reset = event.target.closest('[data-date-filter-reset]');
    if (reset) {
      const clientId = currentClientId();
      const snapshot = readState().crmSnapshots?.[clientId];
      if (!clientId || !snapshot) return;
      setDateFilter(clientId, { start: snapshot.dateRange?.min || '', end: snapshot.dateRange?.max || '' });
      window.setTimeout(enhanceSourceUi, 0);
    }
  });

  document.addEventListener('submit', (event) => {
    const form = event.target.closest('[data-date-filter-form]');
    if (!form) return;
    event.preventDefault();
    const clientId = currentClientId();
    if (!clientId) return;
    const data = new FormData(form);
    setDateFilter(clientId, { start: data.get('start') || '', end: data.get('end') || '' });
    enhanceSourceUi();
  });

  document.addEventListener('DOMContentLoaded', () => {
    const observer = new MutationObserver(() => window.requestAnimationFrame(enhanceSourceUi));
    const target = document.getElementById('main') || document.body;
    observer.observe(target, { childList: true, subtree: true });
    enhanceSourceUi();
  });
})();
