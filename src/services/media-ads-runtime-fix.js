(function () {
  const STORAGE_KEY = 'v4-command-center-state-v6-crm-performance-losses';
  const PERIOD_KEY_PREFIX = 'v4-media-month-filter-';
  const SOURCE_KEY_PREFIX = 'v4-media-source-filter-';

  function parseCsv(text) {
    const rows = [];
    let row = [];
    let cell = '';
    let quoted = false;
    const input = String(text || '').replace(/^\uFEFF/, '');
    for (let i = 0; i < input.length; i += 1) {
      const char = input[i];
      const next = input[i + 1];
      if (char === '"' && quoted && next === '"') { cell += '"'; i += 1; }
      else if (char === '"') quoted = !quoted;
      else if (char === ',' && !quoted) { row.push(cell); cell = ''; }
      else if ((char === '\n' || char === '\r') && !quoted) {
        if (char === '\r' && next === '\n') i += 1;
        row.push(cell);
        if (row.some((value) => String(value).trim() !== '')) rows.push(row);
        row = [];
        cell = '';
      } else cell += char;
    }
    row.push(cell);
    if (row.some((value) => String(value).trim() !== '')) rows.push(row);
    return rows;
  }

  function normalize(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toUpperCase();
  }

  function toNumber(value) {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    const raw = String(value || '').trim();
    if (!raw || raw === '-' || raw === '--' || /^#N\/?A$/i.test(raw)) return 0;
    let cleaned = raw.replace(/R\$/g, '').replace(/\$/g, '').replace(/%/g, '').replace(/\s/g, '').replace(/[^0-9,.-]/g, '');
    if (!cleaned || cleaned === '-' || cleaned === ',' || cleaned === '.') return 0;
    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');
    if (lastComma >= 0 && lastDot >= 0) cleaned = lastComma > lastDot ? cleaned.replace(/\./g, '').replace(',', '.') : cleaned.replace(/,/g, '');
    else if (lastComma >= 0) cleaned = cleaned.replace(',', '.');
    const number = Number(cleaned);
    return Number.isFinite(number) ? number : 0;
  }

  function getSpreadsheetId(value) {
    const raw = String(value || '').trim();
    const match = raw.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : raw;
  }

  function parseDate(value) {
    const raw = String(value || '').trim();
    const br = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (br) return new Date(Number(br[3].length === 2 ? `20${br[3]}` : br[3]), Number(br[2]) - 1, Number(br[1]));
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function monthLabel(start, fallbackMonth, year) {
    const date = parseDate(start);
    if (date) return `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
    return `${fallbackMonth || 'Mês'} ${year || ''}`.trim();
  }

  function buildCsvUrls(source = {}, mode = 'monthly') {
    const id = getSpreadsheetId(source.spreadsheetId || source.url);
    if (!id) return [];
    const gid = mode === 'weekly' ? source.weeklyGid : source.monthlyGid;
    const sheetName = mode === 'weekly' ? (source.weeklySheetName || '2.0 Semanal') : (source.monthlySheetName || '1,0 Mensal');
    return [
      gid ? `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${encodeURIComponent(gid)}` : '',
      `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`
    ].filter(Boolean);
  }

  async function fetchCsv(url) {
    const response = await fetch(`${url}${url.includes('?') ? '&' : '?'}cacheBust=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    if (!text || /<html|<!doctype/i.test(text)) throw new Error('A resposta nao veio em CSV.');
    return text;
  }

  function setMetric(target, key, value) {
    if (!key) return;
    const number = toNumber(value);
    if (number || target[key] == null) target[key] = number;
  }

  function budgetKey(label) {
    const n = normalize(label);
    if (/PLANO DE MIDIA|BUDGET|VALOR MENSAL PROJETADO/.test(n)) return 'plannedMedia';
    if (/INVESTIMENTO REALIZADO|INVESTIMENTO \(\$\)|VALOR INVESTIDO/.test(n)) return 'investment';
    if (/PREVISTO/.test(n)) return 'plannedUntilYesterday';
    if (/PACING/.test(n)) return 'pacing';
    if (/FEE V4/.test(n)) return 'fee';
    return '';
  }

  function totalKey(label) {
    const n = normalize(label);
    if (/^TICKET MEDIO/.test(n)) return 'ticket';
    if (/^IMPRESS/.test(n)) return 'impressions';
    if (/^SESS/.test(n)) return 'sessions';
    if (/^CLIQUES?$|^CLIQUE /.test(n)) return 'clicks';
    if (/^LEADS$/.test(n)) return 'leads';
    if (/^MQLS?/.test(n)) return 'mql';
    if (/^SQLS?/.test(n)) return 'sql';
    if (/^VENDAS?/.test(n)) return 'sales';
    if (/FATURAMENTO|VALOR FATURADO|RECEITA/.test(n)) return 'revenue';
    if (/^ROAS/.test(n)) return 'roas';
    if (/^CTR/.test(n)) return 'ctr';
    if (/TAXA DE CONVERSAO|TAXA DE CONVERSÃO/.test(n)) return 'conversion';
    if (/CUSTO POR CLIQUE|CPC/.test(n)) return 'cpc';
    if (/CUSTO POR LEAD|CPL/.test(n)) return 'cpl';
    return '';
  }

  function sourceKey(label, source) {
    const n = normalize(label);
    if (source === 'meta' && /INVESTIMENTO META/.test(n)) return 'investment';
    if (source === 'google' && /INVESTIMENTO GOOGLE/.test(n)) return 'investment';
    if (/^IMPRESS/.test(n)) return 'impressions';
    if (/CLIQUES NO LINK|^CLIQUES?$/.test(n)) return 'clicks';
    if (/^RESULTADO$|CONVERSOES|CONVERSÕES/.test(n)) return 'leads';
    if (/CUSTO POR RESULTADO|CUSTO POR CONVERS|CUSTO POR LEAD/.test(n)) return 'cpl';
    if (/^CPC|CPC MEDIO|CUSTO POR CLIQUE/.test(n)) return 'cpc';
    if (/^CTR/.test(n)) return 'ctr';
    if (/TAXA DE CONVERSAO|TAXA DE CONVERSÃO/.test(n)) return 'conversion';
    if (/^MQLS?/.test(n)) return 'mql';
    if (/^SQLS?/.test(n)) return 'sql';
    if (/^VENDAS?/.test(n)) return 'sales';
    if (/VALOR DE VENDA/.test(n)) return 'revenue';
    if (/ROAS/.test(n)) return 'roas';
    return '';
  }

  function sectionFromLabel(label, current) {
    const n = normalize(label);
    if (/INDICADORES V4/.test(n)) return 'total';
    if (/INVESTIMENTO META/.test(n)) return 'meta';
    if (/INVESTIMENTO GOOGLE/.test(n)) return 'google';
    if (/INDICADORES GERAIS/.test(n)) return 'general';
    return current;
  }

  function derive(metrics) {
    const investment = toNumber(metrics.investment);
    const leads = toNumber(metrics.leads);
    const clicks = toNumber(metrics.clicks);
    const impressions = toNumber(metrics.impressions);
    const revenue = toNumber(metrics.revenue);
    if (!metrics.cpl && leads) metrics.cpl = investment / leads;
    if (!metrics.cpc && clicks) metrics.cpc = investment / clicks;
    if (!metrics.ctr && impressions) metrics.ctr = clicks / impressions * 100;
    if (!metrics.conversion && clicks) metrics.conversion = leads / clicks * 100;
    if (!metrics.roas && investment && revenue) metrics.roas = revenue / investment;
  }

  function hasActualMetrics(period) {
    const m = period?.metrics || {};
    if (/2030/.test([period?.label, period?.start, period?.end, period?.year].join(' '))) return false;
    return toNumber(m.investment) > 0 || toNumber(m.leads) > 0 || toNumber(m.clicks) > 0 || toNumber(m.impressions) > 0;
  }

  function parsePerformanceRows(rows, mode) {
    const cleanRows = rows.filter((row) => row.some((cell) => String(cell).trim() !== ''));
    const maxCols = cleanRows.reduce((max, row) => Math.max(max, row.length), 0);
    const periods = [];
    for (let col = 1; col < maxCols; col += 1) {
      const start = mode === 'weekly' ? (cleanRows[2]?.[col] || '') : (cleanRows[1]?.[col] || '');
      const end = mode === 'weekly' ? (cleanRows[3]?.[col] || '') : (cleanRows[2]?.[col] || '');
      const year = cleanRows[0]?.[col] || '';
      const month = mode === 'weekly' ? (cleanRows[1]?.[col] || '') : (cleanRows[3]?.[col] || '');
      if (!(start || end || month || year)) continue;
      const period = { index: col, mode, year, month, start, end, label: mode === 'weekly' ? `${start || 'Semana'} → ${end || ''}`.trim() : monthLabel(start, month, year), sortDate: parseDate(start)?.getTime() || col, metrics: {}, sources: { meta: {}, google: {} } };
      let section = 'budget';
      cleanRows.forEach((row) => {
        const label = row[0];
        if (!label) return;
        section = sectionFromLabel(label, section);
        const rawValue = row[col];
        if (section === 'budget') setMetric(period.metrics, budgetKey(label), rawValue);
        else if (section === 'total') setMetric(period.metrics, totalKey(label), rawValue);
        else if (section === 'meta' || section === 'google') setMetric(period.sources[section], sourceKey(label, section), rawValue);
      });
      derive(period.metrics);
      derive(period.sources.meta);
      derive(period.sources.google);
      periods.push(period);
    }
    const actual = periods.sort((a, b) => Number(a.sortDate || 0) - Number(b.sortDate || 0)).filter(hasActualMetrics);
    return { periods: actual, current: actual[actual.length - 1] || null, updatedAt: new Date().toISOString() };
  }

  function sumPeriods(periods) {
    const totals = {};
    periods.forEach((period) => Object.entries(period.metrics || {}).forEach(([key, value]) => {
      if (['pacing', 'ctr', 'conversion', 'cpl', 'cpc', 'roas', 'ticket'].includes(key)) return;
      totals[key] = (totals[key] || 0) + toNumber(value);
    }));
    derive(totals);
    return totals;
  }

  function buildSnapshot(monthly, weekly) {
    const monthlyPeriods = monthly.periods || [];
    const weeklyPeriods = weekly.periods || [];
    return { generatedAt: new Date().toISOString(), monthly: { sourceUrl: monthly.sourceUrl, current: monthlyPeriods[monthlyPeriods.length - 1] || null, periods: monthlyPeriods, totals: sumPeriods(monthlyPeriods) }, weekly: { sourceUrl: weekly.sourceUrl, current: weeklyPeriods[weeklyPeriods.length - 1] || null, periods: weeklyPeriods, totals: sumPeriods(weeklyPeriods) } };
  }

  async function loadOne(source, mode) {
    const urls = buildCsvUrls(source, mode);
    const errors = [];
    for (const url of urls) {
      try { return { mode, sourceUrl: url, ...parsePerformanceRows(parseCsv(await fetchCsv(url)), mode) }; }
      catch (error) { errors.push(`${url}: ${error.message}`); }
    }
    throw new Error(errors.join(' | '));
  }

  window.V4_PERFORMANCE_SHEETS = {
    load: async (source = {}) => {
      const monthly = await loadOne(source, 'monthly');
      const weekly = await loadOne(source, 'weekly');
      return { ok: true, snapshot: buildSnapshot(monthly, weekly) };
    },
    loadOne,
    parseCsv,
    parsePerformanceRows,
    getSpreadsheetId
  };

  function readState() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; } }
  function saveState(state) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {} }
  function getActiveClientId() { return document.querySelector('[data-client].active')?.dataset?.client || ''; }
  function fmtCurrency(value) { return toNumber(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
  function fmtNumber(value) { return toNumber(value).toLocaleString('pt-BR'); }
  function pct(value) { return `${toNumber(value).toFixed(1).replace('.', ',')}%`; }
  function escapeHtml(value) { return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char])); }
  function selectedSource(clientId) { return sessionStorage.getItem(SOURCE_KEY_PREFIX + clientId) || 'total'; }
  function sourceLabel(source) { return source === 'meta' ? 'Meta Ads' : source === 'google' ? 'Google Ads' : 'Total mídia'; }
  function selectedPeriod(clientId, snapshot) { const periods = snapshot?.monthly?.periods || []; const stored = sessionStorage.getItem(PERIOD_KEY_PREFIX + clientId); return periods.find((period) => period.label === stored) || periods[periods.length - 1] || null; }
  function metricsFor(period, source) { if (!period) return {}; if (source === 'meta') return period.sources?.meta || {}; if (source === 'google') return period.sources?.google || {}; return period.metrics || {}; }

  function sanitizeClientPerformance(clientId) {
    const state = readState();
    const snapshot = state.performanceSnapshots?.[clientId];
    if (!snapshot) return null;
    const cleanMonthly = (snapshot.monthly?.periods || []).filter(hasActualMetrics);
    const cleanWeekly = (snapshot.weekly?.periods || []).filter(hasActualMetrics);
    const clean = { ...snapshot, monthly: { ...(snapshot.monthly || {}), periods: cleanMonthly, current: cleanMonthly[cleanMonthly.length - 1] || null }, weekly: { ...(snapshot.weekly || {}), periods: cleanWeekly, current: cleanWeekly[cleanWeekly.length - 1] || null } };
    state.performanceSnapshots[clientId] = clean;
    saveState(state);
    return clean;
  }

  function setMetricCard(title, value, subtitle) {
    const card = Array.from(document.querySelectorAll('.metric-card')).find((item) => (item.querySelector('.metric-top span:first-child, .metric-card__top span:first-child, .metric-title')?.textContent || '').trim().toLowerCase() === title.toLowerCase());
    if (!card) return;
    const valueEl = card.querySelector('.metric-value');
    const deltaEl = card.querySelector('.metric-delta, .metric-subtitle');
    if (valueEl) valueEl.textContent = value;
    if (deltaEl) deltaEl.textContent = subtitle || '';
  }

  function renderFilters(clientId, snapshot, period, source) {
    const periods = snapshot?.monthly?.periods || [];
    const title = Array.from(document.querySelectorAll('h2')).find((el) => /Mídia & Ads/i.test(el.textContent || ''));
    if (!title || !periods.length) return;
    let box = document.querySelector('[data-media-period-filter]');
    if (!box) {
      box = document.createElement('div');
      box.dataset.mediaPeriodFilter = 'true';
      box.style.cssText = 'display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:12px 0 14px;padding:10px 12px;border:1px solid rgba(255,255,255,.12);border-radius:14px;background:rgba(255,255,255,.04);font-weight:800;';
      title.parentElement?.insertBefore(box, title.nextSibling);
    }
    box.innerHTML = `<span style="color:#aeb3c2">Data</span><select data-media-period-select style="background:#111827;color:white;border:1px solid rgba(255,255,255,.18);border-radius:999px;padding:8px 12px;font-weight:900;outline:none;">${periods.map((item) => `<option value="${escapeHtml(item.label)}" ${item.label === period?.label ? 'selected' : ''}>${escapeHtml(item.label)}</option>`).join('')}</select><span style="color:#aeb3c2">Origem</span><select data-media-source-select style="background:#111827;color:white;border:1px solid rgba(255,255,255,.18);border-radius:999px;padding:8px 12px;font-weight:900;outline:none;">${['total', 'meta', 'google'].map((item) => `<option value="${item}" ${item === source ? 'selected' : ''}>${sourceLabel(item)}</option>`).join('')}</select><span style="color:#aeb3c2">Fonte oficial: 1,0 Mensal. DASH_CRM fora do fluxo.</span>`;
    box.querySelector('[data-media-period-select]').onchange = function () { sessionStorage.setItem(PERIOD_KEY_PREFIX + clientId, this.value); patchMediaScreen(); };
    box.querySelector('[data-media-source-select]').onchange = function () { sessionStorage.setItem(SOURCE_KEY_PREFIX + clientId, this.value); patchMediaScreen(); };
  }

  function patchMonthlyTable(period, source) {
    const monthlyTitle = Array.from(document.querySelectorAll('h3')).find((el) => /Mensal.*histórico consolidado/i.test(el.textContent || ''));
    if (!monthlyTitle || !period) return;
    const article = monthlyTitle.closest('article');
    if (!article) return;
    const m = metricsFor(period, source);
    const summary = article.querySelector('.mini-summary');
    if (summary) summary.innerHTML = `<span class="badge ok">Atual</span><strong>${escapeHtml(period.label)} • ${sourceLabel(source)}</strong><small class="muted">Investimento ${fmtCurrency(m.investment)} • Leads ${fmtNumber(m.leads)}</small>`;
    const tbody = article.querySelector('tbody');
    if (tbody) tbody.innerHTML = `<tr><td>${escapeHtml(period.label)}</td><td>${fmtCurrency(m.investment)}</td><td>${fmtNumber(m.impressions)}</td><td>${fmtNumber(m.clicks)}</td><td>${fmtNumber(m.leads)}</td><td>${fmtCurrency(m.cpl)}</td><td>${pct(m.ctr)}</td><td>${pct(source === 'total' ? m.pacing : 0)}</td></tr>`;
  }

  function patchWeeklyTable(snapshot) {
    const weeklyTitle = Array.from(document.querySelectorAll('h3')).find((el) => /Semanal.*histórico consolidado/i.test(el.textContent || ''));
    if (!weeklyTitle) return;
    const article = weeklyTitle.closest('article');
    if (!article) return;
    const periods = snapshot?.weekly?.periods || [];
    const current = periods[periods.length - 1] || null;
    const summary = article.querySelector('.mini-summary');
    if (summary) summary.innerHTML = current ? `<span class="badge ok">Atual</span><strong>${escapeHtml(current.label)}</strong><small class="muted">Investimento ${fmtCurrency(current.metrics?.investment)} • Leads ${fmtNumber(current.metrics?.leads)}</small>` : '<span class="badge warn">Sem dados reais</span><strong>Aguardando mídia semanal</strong>';
    const tbody = article.querySelector('tbody');
    if (tbody) tbody.innerHTML = periods.length ? periods.slice(-8).reverse().map((period) => `<tr><td>${escapeHtml(period.label)}</td><td>${fmtCurrency(period.metrics?.investment)}</td><td>${fmtNumber(period.metrics?.impressions)}</td><td>${fmtNumber(period.metrics?.clicks)}</td><td>${fmtNumber(period.metrics?.leads)}</td><td>${fmtCurrency(period.metrics?.cpl)}</td><td>${pct(period.metrics?.ctr)}</td><td>${pct(period.metrics?.pacing)}</td></tr>`).join('') : '<tr><td colspan="8">Sem dados semanais reais na aba 2.0 Semanal.</td></tr>';
  }

  function patchMediaScreen() {
    const clientId = getActiveClientId();
    if (!clientId) return;
    const snapshot = sanitizeClientPerformance(clientId);
    if (!snapshot?.monthly?.periods?.length) return;
    const period = selectedPeriod(clientId, snapshot);
    const source = selectedSource(clientId);
    const m = metricsFor(period, source);
    renderFilters(clientId, snapshot, period, source);
    setMetricCard('Investimento mensal', fmtCurrency(m.investment), `${sourceLabel(source)} • ${period.label}`);
    setMetricCard('Impressões', fmtNumber(m.impressions), `${fmtNumber(m.clicks)} cliques`);
    setMetricCard('Leads de mídia', fmtNumber(m.leads), `CPL ${fmtCurrency(m.cpl)}`);
    setMetricCard('CTR', pct(m.ctr), `CPC ${fmtCurrency(m.cpc)}`);
    setMetricCard('Pacing', pct(source === 'total' ? m.pacing : 0), `Planejado ${fmtCurrency(source === 'total' ? m.plannedMedia : 0)}`);
    patchMonthlyTable(period, source);
    patchWeeklyTable(snapshot);
  }

  async function runCorrectMediaSync(clientId) { if (!clientId || !window.V4_REAL_DATA_SYNC?.runSync) return false; await window.V4_REAL_DATA_SYNC.runSync(clientId); return true; }
  document.addEventListener('click', function (event) { const button = event.target.closest('[data-action="sync-performance-client"]'); if (!button) return; event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation(); runCorrectMediaSync(button.dataset.clientId || getActiveClientId()); }, true);
  document.addEventListener('click', function () { setTimeout(patchMediaScreen, 150); setTimeout(patchMediaScreen, 700); });
  document.addEventListener('change', function (event) { if (event.target.closest('[data-media-period-select], [data-media-source-select]')) setTimeout(patchMediaScreen, 30); });
  const observer = new MutationObserver(() => { clearTimeout(window.__v4MediaPatchTimer); window.__v4MediaPatchTimer = setTimeout(patchMediaScreen, 120); });
  if (document.body) observer.observe(document.body, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', () => setTimeout(patchMediaScreen, 400));
  setTimeout(patchMediaScreen, 900);
  window.V4_MEDIA_ADS_RUNTIME_FIX = { patchMediaScreen, sanitizeClientPerformance, runCorrectMediaSync };
})();
