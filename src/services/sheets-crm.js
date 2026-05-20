window.V4_CRM_SHEETS = (() => {
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

  function getSpreadsheetId(urlOrId) {
    const raw = String(urlOrId || '').trim();
    if (!raw) return '';
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
    if (gid) urls.push(`https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${encodeURIComponent(gid)}`);
    urls.push(`https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=${sheetName}`);
    return urls;
  }

  async function fetchText(url) {
    const response = await fetch(`${url}${url.includes('?') ? '&' : '?'}cacheBust=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    if (!text || /<html|<!doctype/i.test(text)) throw new Error('A resposta não veio em CSV. Confira se a planilha está compartilhada/publicada ou use proxy N8N.');
    return text;
  }

  async function load(source = {}) {
    if (source.syncBlocked && source.fallbackSnapshot) {
      return { ok: true, sourceUrl: 'fallback:crm', snapshot: withGeneratedAt(source.fallbackSnapshot) };
    }

    const urls = buildCsvUrls(source);
    if (!urls.length) throw new Error('Fonte CRM não configurada.');
    const errors = [];
    for (const url of urls) {
      try {
        const csv = await fetchText(url);
        const rows = parseCsv(csv);
        return { ok: true, sourceUrl: url, snapshot: aggregate(rows) };
      } catch (error) {
        errors.push(`${url}: ${error.message}`);
      }
    }
    if (source.fallbackSnapshot) {
      return { ok: true, sourceUrl: 'fallback:crm', snapshot: withGeneratedAt(source.fallbackSnapshot) };
    }
    throw new Error(errors.join(' | '));
  }

  function withGeneratedAt(snapshot = {}) {
    return { ...snapshot, generatedAt: snapshot.generatedAt || new Date().toISOString() };
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
    return index === -1 || index == null ? '' : row[index] ?? '';
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
    if (br) return new Date(Number(br[3].length === 2 ? `20${br[3]}` : br[3]), Number(br[2]) - 1, Number(br[1]), 12, 0, 0);
    const iso = new Date(raw);
    return Number.isNaN(iso.getTime()) ? null : iso;
  }

  function dateToInput(date) {
    if (!date) return '';
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
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
    return `${utc.getUTCFullYear()}-W${String(Math.ceil((((utc - yearStart) / 86400000) + 1) / 7)).padStart(2, '0')}`;
  }

  function detectSource(meta, google) {
    if (Number(meta || 0) > 0) return 'Meta Ads';
    if (Number(google || 0) > 0) return 'Google Ads';
    return 'Orgânico';
  }

  function empty(label = '') {
    return { label, value: 0, lead: 0, mql: 0, sql: 0, opportunity: 0, purchase: 0, lost: 0, meta: 0, google: 0 };
  }

  function addTotals(target, record) {
    ['value','lead','mql','sql','opportunity','purchase','lost','meta','google'].forEach((key) => {
      target[key] = (target[key] || 0) + Number(record[key] || 0);
    });
  }

  function addGroup(store, key, record) {
    const safeKey = String(key || 'Sem informação').trim() || 'Sem informação';
    if (!store[safeKey]) store[safeKey] = empty(safeKey);
    addTotals(store[safeKey], record);
  }

  function ratesFor(t) {
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

  function topList(group, orderBy = 'lead', limit = 8) {
    return Object.values(group).sort((a, b) => Number(b[orderBy] || 0) - Number(a[orderBy] || 0)).slice(0, limit);
  }

  function aggregateRecords(records) {
    const totals = empty('Geral');
    const bySource = { 'Meta Ads': empty('Meta Ads'), 'Google Ads': empty('Google Ads'), 'Orgânico': empty('Orgânico') };
    const byMonth = {}, byWeek = {}, lossReasons = {}, owners = {}, sources = {}, lossBySource = {}, ownerReasons = {};
    const latest = [], lostLatest = [];

    records.forEach((record) => {
      addTotals(totals, record);
      addTotals(bySource[record.source], record);
      addGroup(byMonth, formatMonth(record.dateObj), record);
      addGroup(byWeek, isoWeek(record.dateObj), record);
      addGroup(owners, record.owner, record);
      addGroup(sources, record.source, record);
      if (record.lost) {
        addGroup(lossReasons, record.lossReason, { lost: record.lost, lead: record.lead, value: record.value });
        addGroup(lossBySource, record.source, record);
        const matrixKey = `${record.owner}|||${record.lossReason}`;
        if (!ownerReasons[matrixKey]) ownerReasons[matrixKey] = { owner: record.owner, reason: record.lossReason, lost: 0 };
        ownerReasons[matrixKey].lost += record.lost;
      }
      const leadRecord = { date: record.dateLabel, leadId: record.leadId, name: record.name, value: record.value, owner: record.owner, source: record.source, lossReason: record.lost ? record.lossReason : '', flags: { lead: record.lead, mql: record.mql, sql: record.sql, opportunity: record.opportunity, purchase: record.purchase, lost: record.lost, meta: record.meta, google: record.google }, timestamp: record.timestamp };
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
      rows: records.length,
      totals,
      rates: ratesFor(totals),
      sourceLabels: SOURCE_LABELS,
      sourceFunnels,
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

  function aggregate(rows) {
    if (!Array.isArray(rows) || rows.length < 2) throw new Error('CSV sem linhas suficientes.');
    const headerIndex = rows.findIndex((row) => row.some((cell) => normalizeKey(cell) === 'DATA') && row.some((cell) => normalizeKey(cell) === 'LEAD'));
    if (headerIndex === -1) throw new Error('Cabeçalho BASE_CRM não encontrado.');
    const map = mapHeaders(rows[headerIndex]);
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
    const timestamps = rawRecords.map((record) => record.timestamp).filter(Boolean).sort((a, b) => a - b);
    return { generatedAt: new Date().toISOString(), rawRecords, dateRange: { min: timestamps[0] ? dateToInput(new Date(timestamps[0])) : '', max: timestamps[timestamps.length - 1] ? dateToInput(new Date(timestamps[timestamps.length - 1])) : '' }, ...aggregateRecords(rawRecords) };
  }

  return { load, parseCsv, aggregate, aggregateRecords, getSpreadsheetId };
})();
