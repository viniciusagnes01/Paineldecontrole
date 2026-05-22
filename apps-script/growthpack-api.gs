const CLIENTS = {
  'alphaville': { id: '1CtfFiB0q2B72Cwb9VjTkv8gZHYtBv2keICwBNj7Z0ws', crm: 'BASE_CRM' },
  'yousafer': { id: '1KLxctUK2ZGaM7jm1y2zj-StwLTgV6qP0PL1a-ZEnMmo', crm: 'BASE_CRM' },
  'prime': { id: '1h6-xdgyekZrNLZ4luZU61S0hzh0Z-HLAZR7qCm8NQG8', crm: 'BASE_CRM' },
  'multimed': { id: '1h4obelICw7z1rbYNaEdkbrCH-qYUhFttzW3SopNxodg', crm: 'BASE DO CRM' },
  'treinando-online': { id: '1rnD4jIpKfX5DAQMETQhOG-ULg81iAglJoej_AY8ArvA', crm: 'BASE_CRM' },
  'seg-eletronic': { id: '1-CSmqLVLbfwVuVxkez4Q38fSTkVzyGOudUmj_GIxHAc', crm: 'BASE_CRM' },
  'espaco-master': { id: '19-VWUfoJD27KxlFEn8uvoDVTKkahT7CSLlVoZD5-VUQ', crm: 'BASE_CRM' },
  'st1-internet': { id: '1BurqRDqYbWq8dPVxXiKjWH6WmfBNoe39AymwJM8LpFA', crm: 'BASE_CRM' }
};

function output(payload, callback) {
  const jsonText = JSON.stringify(payload);
  if (callback) {
    const safeCallback = String(callback).replace(/[^a-zA-Z0-9_$\.]/g, '');
    return ContentService.createTextOutput(safeCallback + '(' + jsonText + ');').setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(jsonText).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return handle(e || { parameter: {} });
}

function doPost(e) {
  return handle(e || { parameter: {} });
}

function handle(e) {
  const startedAt = new Date();
  const params = e.parameter || {};
  const callback = params.callback || '';
  const clientId = String(params.clientId || '').trim();
  const mode = String(params.mode || 'crm').trim();
  const limit = Math.max(50, Math.min(Number(params.limit || 1200), 2500));
  const client = CLIENTS[clientId];

  if (!client) return output({ ok: false, message: 'Cliente não configurado', clientId }, callback);

  const ss = SpreadsheetApp.openById(client.id);
  const payload = {
    ok: true,
    clientId,
    mode,
    spreadsheetId: client.id,
    spreadsheetName: ss.getName(),
    loadedAt: new Date().toISOString(),
    apiConfig: readConfig(ss),
    apiStatus: readStatus(ss),
    crm: readSheet(ss, client.crm, limit)
  };

  if (mode === 'full') {
    payload.leads = readSheet(ss, 'bd Leads LP', limit);
    payload.metaAds = readSheet(ss, 'bd Meta Ads', limit);
    payload.googleAds = readSheet(ss, 'bd Google Ads ', limit) || readSheet(ss, 'bd Google Ads', limit);
    payload.analytics = readSheet(ss, 'bd Analytics', limit);
  }

  payload.elapsedMs = new Date().getTime() - startedAt.getTime();
  return output(payload, callback);
}

function readConfig(ss) {
  const rows = readRows(ss, 'API_CONFIG', 200);
  const out = {};
  if (!rows) return out;
  rows.slice(1).forEach(function(row) {
    if (row[0]) out[String(row[0])] = row[1] || '';
  });
  return out;
}

function readStatus(ss) {
  return readRows(ss, 'API_STATUS', 200) || [];
}

function readSheet(ss, name, maxRows) {
  const rows = readRows(ss, name, maxRows || 1200);
  if (!rows) return null;
  return { name, rows, rowCount: Math.max(rows.length - 1, 0) };
}

function readRows(ss, name, maxRows) {
  const sheet = ss.getSheetByName(name);
  if (!sheet) return null;
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (!lastRow || !lastCol) return [];

  const headerRows = Math.min(lastRow, 20);
  const readLimit = Math.max(1, Math.min(maxRows || 1200, lastRow));

  if (lastRow <= readLimit) {
    return sheet.getRange(1, 1, lastRow, lastCol).getDisplayValues();
  }

  const header = sheet.getRange(1, 1, headerRows, lastCol).getDisplayValues();
  const tailStart = Math.max(headerRows + 1, lastRow - readLimit + headerRows + 1);
  const tailCount = Math.max(0, lastRow - tailStart + 1);
  const tail = tailCount ? sheet.getRange(tailStart, 1, tailCount, lastCol).getDisplayValues() : [];
  return header.concat(tail);
}
