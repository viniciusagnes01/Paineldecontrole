const CLIENTS = {
  alphaville: { name: 'Alphaville', workspaceId: 126365, projectId: 291862 },
  yousafer: { name: 'YouSafer', workspaceId: 72535, projectId: 291857 },
  prime: { name: 'Prime', workspaceId: 106839, projectId: 291839 },
  multimed: { name: 'MultiMed', workspaceId: 124293, projectId: 287299 },
  'seg-eletronic': { name: 'Seg Eletronic', workspaceId: 125773, projectId: 273483 },
  'espaco-master': { name: 'Espaco Master', workspaceId: 131114, projectId: 276870 },
  'st1-internet': { name: 'ST1 Internet', workspaceId: 127063, projectId: 273637 },
  'sindihoteleiros-cuidar-on': { name: 'SindiHoteleiros', workspaceId: 87694, projectId: 165830 },
  'sindi-hoteleiros': { name: 'SindiHoteleiros', workspaceId: 87694, projectId: 165830 },
  sindihoteleiros: { name: 'SindiHoteleiros', workspaceId: 87694, projectId: 165830 }
};

const EKYTE_TASKS_ENDPOINT = 'https://api.ekyte.com/v1.2/tasks';

function json(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

function param(req, key) {
  const value = req.query?.[key] ?? req.body?.[key];
  return value === undefined || value === null ? '' : String(value).trim();
}

function resolveClient(req) {
  const clientId = param(req, 'clientId');
  const client = CLIENTS[clientId] || {};
  return {
    clientId,
    clientName: client.name || clientId,
    workspaceId: param(req, 'workspaceId') || param(req, 'idWorkspaceEkyte') || String(client.workspaceId || ''),
    projectId: param(req, 'projectId') || param(req, 'idProjetoEkyte') || String(client.projectId || ''),
    status: param(req, 'status') || '10',
    page: Number(param(req, 'page') || 1),
    includeChecklist: param(req, 'includeChecklist') || '',
    includePhases: param(req, 'includePhases') || '',
    includeComments: param(req, 'includeComments') || ''
  };
}

function appendQuery(url, params) {
  const target = new URL(url);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') target.searchParams.set(key, String(value));
  });
  return target.toString();
}

function rows(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.tasks)) return payload.tasks;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.result)) return payload.result;
  if (Array.isArray(payload?.rows)) return payload.rows;
  return [];
}

async function fetchEkyteTasks(params) {
  const apiKey = process.env.EKYTE_API_KEY || process.env.V4_EKYTE_API_KEY || '';
  if (!apiKey) {
    const error = new Error('EKYTE_API_KEY ausente na Vercel. A API BI do eKyte exige apiKey na query.');
    error.statusCode = 501;
    throw error;
  }

  const allRows = [];
  const maxPages = Math.max(1, Math.min(Number(param({ query: {}, body: {} }, 'maxPages') || process.env.EKYTE_MAX_PAGES || 5), 20));
  let page = Math.max(1, Number(params.page || 1));

  while (page < params.page + maxPages) {
    const url = appendQuery(EKYTE_TASKS_ENDPOINT, {
      apiKey,
      workspaceId: params.workspaceId,
      projectId: params.projectId,
      status: params.status,
      page,
      includeChecklist: params.includeChecklist,
      includePhases: params.includePhases,
      includeComments: params.includeComments
    });

    const response = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });
    const text = await response.text();
    let payload = null;
    try { payload = text ? JSON.parse(text) : null; } catch (_) { payload = { raw: text }; }

    if (!response.ok || payload?.error) {
      const message = payload?.error?.message || payload?.message || payload?.error || `HTTP ${response.status}`;
      const error = new Error(message);
      error.statusCode = response.status || Number(payload?.error?.code) || 500;
      error.payload = payload;
      throw error;
    }

    const batch = rows(payload);
    allRows.push(...batch);

    const paging = payload?.paging;
    const currentPage = Number(paging?.currentPage?.number || page);
    const totalPages = Number(paging?.totalPages || currentPage);
    if (!paging || currentPage >= totalPages || batch.length === 0) break;
    page += 1;
  }

  return allRows;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') return json(res, 405, { ok: false, message: 'Method not allowed' });

  const params = resolveClient(req);
  if (!params.clientId) return json(res, 400, { ok: false, message: 'clientId obrigatorio.' });
  if (!params.workspaceId || !params.projectId) return json(res, 400, { ok: false, message: 'Cliente sem workspace/projeto eKyte.', ...params });

  try {
    const taskRows = await fetchEkyteTasks(params);
    return json(res, 200, {
      ok: true,
      source: 'ekyte-bi-api',
      clientId: params.clientId,
      clientName: params.clientName,
      workspaceId: params.workspaceId,
      projectId: params.projectId,
      status: params.status,
      taskScope: 'project',
      totalReceived: taskRows.length,
      tasks: taskRows
    });
  } catch (error) {
    return json(res, error.statusCode || 500, {
      ok: false,
      message: error.message,
      clientId: params.clientId,
      clientName: params.clientName,
      workspaceId: params.workspaceId,
      projectId: params.projectId,
      payload: error.payload || null
    });
  }
};
