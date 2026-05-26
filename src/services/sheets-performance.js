window.V4_PERFORMANCE_SHEETS = (() => {
  function getSpreadsheetId(urlOrId) {
    const raw = String(urlOrId || '').trim();
    if (!raw) return '';
    const match = raw.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match) return match[1];
    return raw;
  }

  function buildCsvUrls(source = {}, mode = 'monthly') {
    const id = getSpreadsheetId(source.spreadsheetId || source.url);
    if (!id) return [];
    const sheetName = mode === 'weekly'
      ? (source.weeklySheetName || source.weekly || '2.0 Semanal')
      : (source.monthlySheetName || source.monthly || '1.0 Mensal');
    const gid = mode === 'weekly' ? source.weeklyGid : source.monthlyGid;
    const proxyUrl = mode === 'weekly' ? source.weeklyProxyUrl : source.monthlyProxyUrl;
    const urls = [];

    if (proxyUrl) urls.push(proxyUrl);
    if (gid) urls.push(`https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${encodeURIComponent(gid)}`);
    urls.push(`https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`);
    if (source.proxyUrl) urls.push(`${source.proxyUrl}${source.proxyUrl.includes('?') ? '&' : '?'}mode=${encodeURIComponent(mode)}`);
    return urls;
  }

  async function fetchText(url) {
    const response = await fetch(`${url}${url.includes('?') ? '&' : '?'}cacheBust=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    if (!text || /<html|<!doctype/i.test(text)) throw new Error('A resposta não veio em CSV. Confira compartilhamento/publicação da planilha.');
    return text;
  }

  async function load(source = {}) {
    if (source.syncBlocked && source.fallbackSnapshot) return { ok: true, snapshot: withGeneratedAt(source.fallbackSnapshot) };
    const [monthly, weekly] = await Promise.all([loadOne(source, 'monthly'), loadOne(source, 'weekly')]);
    return { ok: true, snapshot: buildSnapshot(monthly, weekly) };
  }

  function withGeneratedAt(snapshot = {}) {
    return { ...snapshot, generatedAt: snapshot.generatedAt || new Date().toISOString() };
  }

  async function loadOne(source, mode) {
    const urls = buildCsvUrls(source, mode);
    if (!urls.length) throw new Error(`Fonte ${mode} não configurada.`);
    const errors = [];

    for (const url of urls) {
      try {
        const csv = await fetchText(url);
        const rows = parseCsv(csv);
        const parsed = parsePerformanceRows(rows, mode);
        return { mode, sourceUrl: url, ...parsed };
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
      if (char === '"' && quoted && next === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        quoted = !quoted;
      } else if (char === ',' && !quoted) {
        row.push(cell);
        cell = '';
      } else if ((char === '\n' || char === '\r') && !quoted) {
        if (char === '\r' && next === '\n') i += 1;
        row.push(cell);
        if (row.some((value) => String(value).trim() !== '')) rows.push(row);
        row = [];
        cell = '';
      } else {
        cell += char;
      }
    }

    row.push(cell);
    if (row.some((value) => String(value).trim() !== '')) rows.push(row);
    return rows;
  }

  function normalize(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();
  }

  function toNumber(value) {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    const raw = String(value || '').trim();
    if (!raw || raw === '-' || raw === '--' || /^#N\/?A$/i.test(raw)) return 0;

    const isPercent = raw.includes('%');
    let cleaned = raw
      .replace(/R\$/g, '')
      .replace(/\$/g, '')
      .replace(/%/g, '')
      .replace(/\s/g, '')
      .replace(/[^0-9,.-]/g, '');

    if (!cleaned || cleaned === '-' || cleaned === ',' || cleaned === '.') return 0;

    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');
    if (lastComma >= 0 && lastDot >= 0) {
      if (lastComma > lastDot) cleaned = cleaned.replace(/\./g, '').replace(',', '.');
      else cleaned = cleaned.replace(/,/g, '');
    } else if (lastComma >= 0) {
      cleaned = cleaned.replace(',', '.');
    }

    const number = Number(cleaned);
    if (!Number.isFinite(number)) return 0;
    return isPercent ? number : number;
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
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function monthLabel(start, fallbackMonth, year) {
    const date = parseDate(start);
    if (date) return `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
    return `${fallbackMonth || 'Mês'} ${year || ''}`.trim();
  }

  function metricKey(label) {
    const n = normalize(label);
    if (!n) return '';
    if (/FEE V4/.test(n)) return 'fee';
    if (/PLANO DE MIDIA|BUDGET|VALOR MENSAL PROJETADO/.test(n)) return 'plannedMedia';
    if (/INVESTIMENTO REALIZADO|INVESTIMENTO \(\$\)|VALOR INVESTIDO/.test(n)) return 'investment';
    if (/PREVISTO/.test(n)) return 'plannedUntilYesterday';
    if (/PACING/.test(n)) return 'pacing';
    if (/TICKET MEDIO/.test(n)) return 'ticket';
    if (/IMPRESS/.test(n)) return 'impressions';
    if (/SESS/.test(n)) return 'sessions';
    if (/CLIQUE/.test(n)) return 'clicks';
    if (/TODOS OS LEADS|^LEADS$| LEADS/.test(n)) return 'leads';
    if (/MQL/.test(n)) return 'mql';
    if (/SQL/.test(n)) return 'sql';
    if (/OPORTUN/.test(n)) return 'opportunities';
    if (/VENDAS|COMPRA/.test(n)) return 'sales';
    if (/RECEITA|FATURAMENTO|VALOR FATURADO/.test(n)) return 'revenue';
    if (/CPL/.test(n)) return 'cpl';
    if (/CPC/.test(n)) return 'cpc';
    if (/CTR/.test(n)) return 'ctr';
    if (/ROAS/.test(n)) return 'roas';
    if (/ROI/.test(n)) return 'roi';
    if (/CAC/.test(n)) return 'cac';
    if (/CPV/.test(n)) return 'cpv';
    if (/CONVERSAO|CONVERSÃO/.test(n)) return 'conversion';
    return slugKey(n);
  }

  function slugKey(text) {
    return String(text || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 42);
  }

  function parsePerformanceRows(rows, mode) {
    const cleanRows = rows.filter((row) => row.some((cell) => String(cell).trim() !== ''));
    if (!cleanRows.length) throw new Error('Aba sem dados.');

    const maxCols = cleanRows.reduce((max, row) => Math.max(max, row.length), 0);
    const periods = [];

    for (let col = 1; col < maxCols; col += 1) {
      const start = mode === 'weekly' ? valueAt(cleanRows, 2, col) : valueAt(cleanRows, 1, col);
      const end = mode === 'weekly' ? valueAt(cleanRows, 3, col) : valueAt(cleanRows, 2, col);
      const year = valueAt(cleanRows, 0, col);
      const month = mode === 'weekly' ? valueAt(cleanRows, 1, col) : valueAt(cleanRows, 3, col);
      const hasPeriod = start || end || month || year;
      if (!hasPeriod) continue;

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
        raw: {}
      };

      cleanRows.forEach((row) => {
        const key = metricKey(row[0]);
        if (!key) return;
        const rawValue = row[col];
        period.metrics[key] = toNumber(rawValue);
        period.raw[key] = rawValue;
      });

      derive(period.metrics);
      periods.push(period);
    }

    const sorted = periods.sort((a, b) => Number(a.sortDate || 0) - Number(b.sortDate || 0));
    const actual = sorted.filter(hasActualMetrics);
    return {
      periods: actual,
      current: actual[actual.length - 1] || null,
      updatedAt: new Date().toISOString()
    };
  }

  function valueAt(rows, rowIndex, colIndex) {
    return rows[rowIndex]?.[colIndex] || '';
  }

  function hasActualMetrics(period) {
    const m = period?.metrics || {};
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

  function recentActualPeriods(periods, limit = 12) {
    return (periods || []).filter(hasActualMetrics).slice(-limit);
  }

  function buildSnapshot(monthly, weekly) {
    const recentMonthly = recentActualPeriods(monthly.periods || [], 12);
    const recentWeekly = recentActualPeriods(weekly.periods || [], 12);
    return {
      generatedAt: new Date().toISOString(),
      monthly: {
        sourceUrl: monthly.sourceUrl,
        current: recentMonthly[recentMonthly.length - 1] || null,
        periods: recentMonthly,
        totals: sumPeriods(recentMonthly)
      },
      weekly: {
        sourceUrl: weekly.sourceUrl,
        current: recentWeekly[recentWeekly.length - 1] || null,
        periods: recentWeekly,
        totals: sumPeriods(recentWeekly)
      }
    };
  }

  return { load, loadOne, parseCsv, parsePerformanceRows, getSpreadsheetId };
})();
