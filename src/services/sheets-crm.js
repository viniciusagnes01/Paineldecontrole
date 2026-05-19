window.V4_CRM_SHEETS = (() => {
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

  function getSpreadsheetId(urlOrId) {
    const raw = String(urlOrId || '').trim();
    if (!raw) return '';
    const match = raw.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match) return match[1];
    return raw;
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
    if (!text || /<html|<!doctype/i.test(text)) throw new Error('A resposta não veio em CSV. Confira se a planilha está publicada/compartilhada ou use proxy N8N.');
    return text;
  }

  async function load(source = {}) {
    const urls = buildCsvUrls(source);
    if (!urls.length) throw new Error('Fonte CRM não configurada.');
    const errors = [];
    for (const url of urls) {
      try {
        const csv = await fetchText(url);
        const rows = parseCsv(csv);
        const snapshot = aggregate(rows);
        return { ok: true, sourceUrl: url, snapshot };
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

  function addGroup(store, key, patch) {
    const safeKey = String(key || 'Sem informação').trim() || 'Sem informação';
    if (!store[safeKey]) store[safeKey] = { label: safeKey, value: 0, lead: 0, mql: 0, sql: 0, opportunity: 0, purchase: 0, lost: 0 };
    Object.entries(patch).forEach(([field, value]) => {
      store[safeKey][field] = (store[safeKey][field] || 0) + Number(value || 0);
    });
  }

  function topList(group, orderBy = 'lead', limit = 8) {
    return Object.values(group).sort((a, b) => Number(b[orderBy] || 0) - Number(a[orderBy] || 0)).slice(0, limit);
  }

  function aggregate(rows) {
    if (!Array.isArray(rows) || rows.length < 2) throw new Error('CSV sem linhas suficientes.');
    const headerIndex = rows.findIndex((row) => row.some((cell) => normalizeKey(cell) === 'DATA') && row.some((cell) => normalizeKey(cell) === 'LEAD'));
    if (headerIndex === -1) throw new Error('Cabeçalho BASE_CRM não encontrado.');
    const header = rows[headerIndex];
    const map = mapHeaders(header);
    const dataRows = rows.slice(headerIndex + 1).filter((row) => row.some((cell) => String(cell).trim() !== ''));

    const totals = { value: 0, lead: 0, mql: 0, sql: 0, opportunity: 0, purchase: 0, lost: 0, meta: 0, google: 0 };
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
      const source = meta ? 'Meta Ads' : google ? 'Google Ads' : 'Orgânico / outros';

      totals.value += value;
      totals.lead += lead;
      totals.mql += mql;
      totals.sql += sql;
      totals.opportunity += opportunity;
      totals.purchase += purchase;
      totals.lost += lost;
      totals.meta += meta;
      totals.google += google;

      const patch = { value, lead, mql, sql, opportunity, purchase, lost };
      addGroup(byMonth, formatMonth(date), patch);
      addGroup(byWeek, isoWeek(date), patch);
      addGroup(owners, owner, patch);
      if (lost) {
        addGroup(lossReasons, lossReason, { lost, lead });
        addGroup(lossBySource, source, { lost, lead, value });
        const matrixKey = `${owner}|||${lossReason}`;
        if (!ownerReasons[matrixKey]) ownerReasons[matrixKey] = { owner, reason: lossReason, lost: 0 };
        ownerReasons[matrixKey].lost += lost;
      }
      addGroup(sources, source, { lead: meta || google || lead, value, lost });

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

    const rates = {
      leadToMql: totals.lead ? totals.mql / totals.lead * 100 : 0,
      mqlToSql: totals.mql ? totals.sql / totals.mql * 100 : 0,
      sqlToOpportunity: totals.sql ? totals.opportunity / totals.sql * 100 : 0,
      opportunityToSale: totals.opportunity ? totals.purchase / totals.opportunity * 100 : 0,
      saleRate: totals.lead ? totals.purchase / totals.lead * 100 : 0,
      lossRate: totals.lead ? totals.lost / totals.lead * 100 : 0,
      ticket: totals.purchase ? totals.value / totals.purchase : 0
    };

    return {
      generatedAt: new Date().toISOString(),
      rows: dataRows.length,
      totals,
      rates,
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

  return { load, parseCsv, aggregate, getSpreadsheetId };
})();
