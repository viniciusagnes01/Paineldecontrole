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
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toUpperCase();
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
      return new Date(year, month, day);
    }
    const iso = new Date(raw);
    return Number.isNaN(iso.getTime()) ? null : iso;
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

  function aggregateEnhanced(rows) {
    if (!Array.isArray(rows) || rows.length < 2) throw new Error('CSV sem linhas suficientes.');
    const headerIndex = rows.findIndex((row) => row.some((cell) => normalizeKey(cell) === 'DATA') && row.some((cell) => normalizeKey(cell) === 'LEAD'));
    if (headerIndex === -1) throw new Error('Cabeçalho BASE_CRM não encontrado.');

    const header = rows[headerIndex];
    const map = mapHeaders(header);
    const dataRows = rows.slice(headerIndex + 1).filter((row) => row.some((cell) => String(cell).trim() !== ''));

    const totals = emptyTotals('Geral');
    const bySource = {
      'Meta Ads': emptyTotals('Meta Ads'),
      'Google Ads': emptyTotals('Google Ads'),
      'Orgânico': emptyTotals('Orgânico')
    };
    const byMonth = {};
    const byWeek = {};
    const lossReasons = {};
    const owners = {};
    const sources = {};
    const lossBySource = {};
    const ownerReasons = {};
    const latest = [];
    const lostLatest = [];

    dataRows.forEach((row) => {
      const date = parseDate(valueAt(row, map, 'date'));
      const value = toNumber(valueAt(row, map, 'value'));
      const lead = map.lead === -1 ? 1 : toNumber(valueAt(row, map, 'lead'));
      const mql = toNumber(valueAt(row, map, 'mql'));
      const sql = toNumber(valueAt(row, map, 'sql'));
      const opportunity = toNumber(valueAt(row, map, 'opportunity'));
      const purchase = toNumber(valueAt(row, map, 'purchase'));
      const lost = toNumber(valueAt(row, map, 'lost'));
      const meta = toNumber(valueAt(row, map, 'meta'));
      const google = toNumber(valueAt(row, map, 'google'));
      const owner = valueAt(row, map, 'owner') || 'Sem responsável';
      const lossReason = valueAt(row, map, 'lossReason') || 'Sem motivo informado';
      const source = detectSource(meta, google);
      const patch = { value, lead, mql, sql, opportunity, purchase, lost, meta, google };

      addTotals(totals, patch);
      addTotals(bySource[source], patch);
      addGroup(byMonth, formatMonth(date), patch);
      addGroup(byWeek, isoWeek(date), patch);
      addGroup(owners, owner, patch);
      addGroup(sources, source, patch);

      if (lost) {
        addGroup(lossReasons, lossReason, { lost, lead, value });
        addGroup(lossBySource, source, { lost, lead, value, mql, sql, opportunity, purchase });
        const matrixKey = `${owner}|||${lossReason}`;
        if (!ownerReasons[matrixKey]) ownerReasons[matrixKey] = { owner, reason: lossReason, lost: 0 };
        ownerReasons[matrixKey].lost += lost;
      }

      const leadRecord = {
        date: valueAt(row, map, 'date'),
        leadId: valueAt(row, map, 'leadId'),
        name: valueAt(row, map, 'name'),
        value,
        owner,
        source,
        lossReason: lost ? lossReason : '',
        flags: { lead, mql, sql, opportunity, purchase, lost, meta, google },
        timestamp: date ? date.getTime() : 0
      };
      latest.push(leadRecord);
      if (lost) lostLatest.push(leadRecord);
    });

    const sourceFunnels = {
      Geral: { ...totals, rates: ratesFor(totals) },
      'Meta Ads': { ...bySource['Meta Ads'], rates: ratesFor(bySource['Meta Ads']) },
      'Google Ads': { ...bySource['Google Ads'], rates: ratesFor(bySource['Google Ads']) },
      'Orgânico': { ...bySource['Orgânico'], rates: ratesFor(bySource['Orgânico']) }
    };

    return {
      generatedAt: new Date().toISOString(),
      rows: dataRows.length,
      sourceLabels: SOURCE_LABELS,
      sourceFunnels,
      totals,
      rates: ratesFor(totals),
      byMonth: Object.values(byMonth),
      byWeek: Object.values(byWeek),
      lossReasons: topList(lossReasons, 'lost', 14),
      owners: topList(owners, 'lead', 20).map((row) => ({
        ...row,
        lossRate: row.lead ? row.lost / row.lead * 100 : 0,
        saleRate: row.lead ? row.purchase / row.lead * 100 : 0
      })),
      sources: topList(sources, 'lead', 5),
      lossBySource: topList(lossBySource, 'lost', 5),
      ownerReasonMatrix: Object.values(ownerReasons).sort((a, b) => b.lost - a.lost),
      latest: latest.sort((a, b) => b.timestamp - a.timestamp).slice(0, 12),
      lostLatest: lostLatest.sort((a, b) => b.timestamp - a.timestamp).slice(0, 18)
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

  function readState() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch (error) { return {}; }
  }

  function currentClientId() {
    return document.querySelector('.client-btn.active')?.dataset?.client || null;
  }

  function selectedSource(clientId) {
    return sessionStorage.getItem(`v4-source-filter-${clientId}`) || 'Geral';
  }

  function setSelectedSource(clientId, source) {
    sessionStorage.setItem(`v4-source-filter-${clientId}`, source);
  }

  function enhanceSourceUi() {
    const clientId = currentClientId();
    if (!clientId || !document.querySelector('.tab-btn.active')) return;
    const state = readState();
    const snapshot = state.crmSnapshots?.[clientId];
    if (!snapshot?.sourceFunnels) return;

    const source = selectedSource(clientId);
    const selected = snapshot.sourceFunnels[source] || snapshot.sourceFunnels.Geral;
    const labels = snapshot.sourceLabels || SOURCE_LABELS;
    const crmTitle = Array.from(document.querySelectorAll('h2')).find((el) => el.textContent.includes('BASE_CRM'));
    const funnel = document.querySelector('.funnel');
    if (!funnel) return;

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
          <p class="eyebrow">Filtro de origem do funil</p>
          <h2>Visão por Geral, Meta Ads, Google Ads e Orgânico</h2>
          <p class="muted">A separação usa as colunas META ADS e GOOGLE ADS da BASE_CRM. Quando nenhuma das duas está marcada, o lead entra como Orgânico.</p>
        </div>
        <div class="source-filter-actions">
          ${labels.map((label) => `<button class="btn ${label === source ? 'primary' : 'ghost'} source-filter-btn" data-source-filter="${escapeHtml(label)}">${escapeHtml(label)}</button>`).join('')}
        </div>
      </div>
      <div class="source-filter-grid">
        <div class="insight-card"><span class="badge client">Fonte</span><strong>${escapeHtml(source)}</strong><p class="muted">Filtro aplicado na jornada abaixo.</p></div>
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
    const updates = [
      null,
      null,
      { value: selected.lead, sub: fmtCurrency(selected.value || 0) },
      { value: selected.mql, sub: 'Qualificados' },
      { value: selected.opportunity, sub: 'Comercial' },
      { value: selected.purchase, sub: fmtCurrency(selected.rates?.ticket || 0) }
    ];
    steps.forEach((step, index) => {
      const data = updates[index];
      if (!data) return;
      const strong = step.querySelector('strong');
      const sub = step.querySelector('.muted');
      if (strong) strong.textContent = fmtNumber(data.value);
      if (sub) sub.textContent = data.sub;
    });
  }

  window.V4_CRM_SHEETS = {
    ...original,
    load: loadEnhanced,
    aggregate: aggregateEnhanced
  };

  document.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-source-filter]');
    if (!btn) return;
    const clientId = currentClientId();
    if (!clientId) return;
    setSelectedSource(clientId, btn.dataset.sourceFilter);
    window.setTimeout(enhanceSourceUi, 0);
  });

  document.addEventListener('DOMContentLoaded', () => {
    const observer = new MutationObserver(() => window.requestAnimationFrame(enhanceSourceUi));
    const target = document.getElementById('main') || document.body;
    observer.observe(target, { childList: true, subtree: true });
    enhanceSourceUi();
  });
})();
