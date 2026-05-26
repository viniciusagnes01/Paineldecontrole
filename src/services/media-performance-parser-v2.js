window.V4_PERFORMANCE_SHEETS = (() => {
  function getSpreadsheetId(urlOrId) {
    const raw = String(urlOrId || '').trim();
    const match = raw.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : raw;
  }

  function buildCsvUrls(source = {}, mode = 'monthly') {
    const id = getSpreadsheetId(source.spreadsheetId || source.url);
    if (!id) return [];
    const gid = mode === 'weekly' ? source.weeklyGid : source.monthlyGid;
    const sheetName = mode === 'weekly'
      ? (source.weeklySheetName || '2.0 Semanal')
      : (source.monthlySheetName || '1,0 Mensal');
    return [
      gid ? `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${encodeURIComponent(gid)}` : '',
      `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`
    ].filter(Boolean);
  }

  async function fetchText(url) {
    const response = await fetch(`${url}${url.includes('?') ? '&' : '?'}cacheBust=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    if (!text || /<html|<!doctype/i.test(text)) throw new Error('A resposta não veio em CSV.');
    return text;
  }

  async function load(source = {}) {
    const [monthly, weekly] = await Promise.all([loadOne(source, 'monthly'), loadOne(source, 'weekly')]);
    return { ok: true, snapshot: buildSnapshot(monthly, weekly) };
  }

  async function loadOne(source, mode) {
    const urls = buildCsvUrls(source, mode);
    const errors = [];
    for (const url of urls) {
      try {
        const csv = await fetchText(url);
        const rows = parseCsv(csv);
        return { mode, sourceUrl: url, ...parsePerformanceRows(rows, mode) };
      } catch (error) {
        errors.push(`${url}: ${error.message}`);
      }
    }
    throw new Error(errors.join(' | '));
  }

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
    if (/CAC/.test(n)) return 'cac';
    if (/ROI/.test(n)) return 'roi';
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

  function parsePerformanceRows(rows, mode) {
    const cleanRows = rows.filter((row) => row.some((cell) => String(cell).trim() !== ''));
    const maxCols = cleanRows.reduce((max, row) => Math.max(max, row.length), 0);
    const periods = [];
    for (let col = 1; col < maxCols; col += 1) {
      const start = mode === 'weekly' ? valueAt(cleanRows, 2, col) : valueAt(cleanRows, 1, col);
      const end = mode === 'weekly' ? valueAt(cleanRows, 3, col) : valueAt(cleanRows, 2, col);
      const year = valueAt(cleanRows, 0, col);
      const month = mode === 'weekly' ? valueAt(cleanRows, 1, col) : valueAt(cleanRows, 3, col);
      if (!(start || end || month || year)) continue;
      const period = {
        index: col,
        mode,
        year,
        month,
        start,
        end,
        label: mode === 'weekly' ? `${start || 'Semana'} → ${end || ''}`.trim() : monthLabel(start, month, year),
        sortDate: parseDate(start)?.getTime() || col,
        metrics: {},
        sources: { meta: {}, google: {} },
        raw: {}
      };
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
    const sorted = periods.sort((a, b) => Number(a.sortDate || 0) - Number(b.sortDate || 0));
    const actual = sorted.filter(hasActualMetrics);
    return { periods: actual, current: actual[actual.length - 1] || null, updatedAt: new Date().toISOString() };
  }

  function valueAt(rows, rowIndex, colIndex) { return rows[rowIndex]?.[colIndex] || ''; }

  function hasActualMetrics(period) {
    const m = period?.metrics || {};
    if (/2030/.test([period?.label, period?.start, period?.end, period?.year].join(' '))) return false;
    return Number(m.investment || 0) > 0 || Number(m.leads || 0) > 0 || Number(m.clicks || 0) > 0 || Number(m.impressions || 0) > 0;
  }

  function derive(metrics) {
    const investment = Number(metrics.investment || 0);
    const leads = Number(metrics.leads || 0);
    const clicks = Number(metrics.clicks || 0);
    const impressions = Number(metrics.impressions || 0);
    const revenue = Number(metrics.revenue || 0);
    const sales = Number(metrics.sales || 0);
    if (!metrics.cpl && leads) metrics.cpl = investment / leads;
    if (!metrics.cpc && clicks) metrics.cpc = investment / clicks;
    if (!metrics.ctr && impressions) metrics.ctr = clicks / impressions * 100;
    if (!metrics.conversion && clicks) metrics.conversion = leads / clicks * 100;
    if (!metrics.cpv && sales) metrics.cpv = investment / sales;
    if (!metrics.roas && investment && revenue) metrics.roas = revenue / investment;
  }

  function sumPeriods(periods) {
    const totals = {};
    periods.forEach((period) => {
      Object.entries(period.metrics || {}).forEach(([key, value]) => {
        if (!Number.isFinite(Number(value))) return;
        if (['pacing', 'ctr', 'conversion', 'cpl', 'cpc', 'roas', 'roi', 'cac', 'cpv', 'ticket'].includes(key)) return;
        totals[key] = (totals[key] || 0) + Number(value || 0);
      });
    });
    derive(totals);
    return totals;
  }

  function sumSource(periods, source) {
    const totals = {};
    periods.forEach((period) => {
      Object.entries(period.sources?.[source] || {}).forEach(([key, value]) => {
        if (!Number.isFinite(Number(value))) return;
        if (['ctr', 'conversion', 'cpl', 'cpc', 'roas'].includes(key)) return;
        totals[key] = (totals[key] || 0) + Number(value || 0);
      });
    });
    derive(totals);
    return totals;
  }

  function buildSnapshot(monthly, weekly) {
    const monthlyPeriods = monthly.periods || [];
    const weeklyPeriods = weekly.periods || [];
    return {
      generatedAt: new Date().toISOString(),
      monthly: {
        sourceUrl: monthly.sourceUrl,
        current: monthlyPeriods[monthlyPeriods.length - 1] || null,
        periods: monthlyPeriods,
        totals: sumPeriods(monthlyPeriods),
        sourceTotals: { meta: sumSource(monthlyPeriods, 'meta'), google: sumSource(monthlyPeriods, 'google') }
      },
      weekly: {
        sourceUrl: weekly.sourceUrl,
        current: weeklyPeriods[weeklyPeriods.length - 1] || null,
        periods: weeklyPeriods,
        totals: sumPeriods(weeklyPeriods),
        sourceTotals: { meta: sumSource(weeklyPeriods, 'meta'), google: sumSource(weeklyPeriods, 'google') }
      }
    };
  }

  return { load, loadOne, parseCsv, parsePerformanceRows, getSpreadsheetId };
})();
