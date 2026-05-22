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

const SOURCE_TABS = ['API_CONFIG', 'API_STATUS', 'bd Leads LP', 'bd Meta Ads', 'bd Google Ads ', 'bd Google Ads', 'bd Analytics'];

function json(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return handle(e);
}

function doPost(e) {
  return handle(e);
}

function handle(e) {
  const clientId = String(e.parameter.clientId || '').trim();
  const client = CLIENTS[clientId];
  if (!client) return json({ ok: false, message: 'Cliente não configurado', clientId });

  const ss = SpreadsheetApp.openById(client.id);
  const payload = {
    ok: true,
    clientId,
    spreadsheetId: client.id,
    spreadsheetName: ss.getName(),
    loadedAt: new Date().toISOString(),
    apiConfig: readConfig(ss),
    apiStatus: readStatus(ss),
    crm: readSheet(ss, client.crm),
    leads: readSheet(ss, 'bd Leads LP'),
    metaAds: readSheet(ss, 'bd Meta Ads'),
    googleAds: readSheet(ss, 'bd Google Ads ') || readSheet(ss, 'bd Google Ads'),
    analytics: readSheet(ss, 'bd Analytics')
  };

  return json(payload);
}

function readConfig(ss) {
  const rows = readRows(ss, 'API_CONFIG', 200);
  const out = {};
  rows.slice(1).forEach(function(row) {
    if (row[0]) out[String(row[0])] = row[1] || '';
  });
  return out;
}

function readStatus(ss) {
  return readRows(ss, 'API_STATUS', 200);
}

function readSheet(ss, name) {
  const rows = readRows(ss, name, 5000);
  if (!rows) return null;
  return { name, rows, rowCount: Math.max(rows.length - 1, 0) };
}

function readRows(ss, name, maxRows) {
  const sheet = ss.getSheetByName(name);
  if (!sheet) return null;
  const lastRow = Math.min(sheet.getLastRow(), maxRows || 1000);
  const lastCol = sheet.getLastColumn();
  if (!lastRow || !lastCol) return [];
  return sheet.getRange(1, 1, lastRow, lastCol).getDisplayValues();
}
