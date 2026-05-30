const CLIENTS = {
  alphaville: { name: 'Alphaville', companyId: '7773', workspaceId: 126365, projectId: 291862 },
  yousafer: { name: 'YouSafer', companyId: '7773', workspaceId: 72535, projectId: 291857 },
  prime: { name: 'Prime', companyId: '7773', workspaceId: 106839, projectId: 291839 },
  multimed: { name: 'MultiMed', companyId: '7773', workspaceId: 124293, projectId: 287299 },
  'seg-eletronic': { name: 'Seg Eletronic', companyId: '7773', workspaceId: 125773, projectId: 273483 },
  'espaco-master': { name: 'Espaco Master', companyId: '7773', workspaceId: 131114, projectId: 276870 },
  'st1-internet': { name: 'ST1 Internet', companyId: '7773', workspaceId: 127063, projectId: 273637 },
  'sindihoteleiros-cuidar-on': { name: 'SindiHoteleiros', companyId: '7773', workspaceId: 87694, projectId: 165830 },
  'sindi-hoteleiros': { name: 'SindiHoteleiros', companyId: '7773', workspaceId: 87694, projectId: 165830 },
  sindihoteleiros: { name: 'SindiHoteleiros', companyId: '7773', workspaceId: 87694, projectId: 165830 }
};

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
    companyId: param(req, 'companyId') || client.companyId || '7773',
    workspaceId: param(req, 'workspaceId') || param(req, 'idWorkspaceEkyte') || String(client.workspaceId || ''),
    projectId: param(req, 'projectId') || param(req, 'idProjetoEkyte') || String(client.projectId || '')
  };
}

function appendQuery(url, params) {
  const target = new URL(url);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== '') target.searchParams.set(key, String(value));
  });
  return target.toString();
}

function rows(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.tasks)) return payload.tasks;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.result)) return payload.result;
  if (Array.isArray(payload?.rows)) return payload.rows;
  return [];
}

async function fetchExternal(params) {
  const proxyUrl = process.env.V4_EKYTE_PROXY_URL || process.env.EKYTE_PROXY_URL || process.env.EKYTE_N8N_URL || '';
  if (!proxyUrl) return null;

  const url = appendQuery(proxyUrl, {
    resource: 'tasks',
    clientId: params.clientId,
    companyId: params.companyId,
    workspaceId: params.workspaceId,
    idWorkspaceEkyte: params.workspaceId,
    projectId: params.projectId,
    idProjetoEkyte: params.projectId,
    taskScope: 'project'
  });

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'X-V4-Source': 'v4-command-center',
      'X-V4-Client-Id': params.clientId,
      'X-Ekyte-Company-Id': params.companyId,
      'X-Ekyte-Workspace-Id': params.workspaceId,
      'X-Ekyte-Project-Id': params.projectId
    }
  });

  const text = await response.text();
  let payload = null;
  try { payload = text ? JSON.parse(text) : null; } catch (_) { payload = { raw: text }; }
  if (!response.ok) throw new Error(payload?.message || payload?.error || `HTTP ${response.status}`);
  return payload;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') return json(res, 405, { ok: false, message: 'Method not allowed' });

  const params = resolveClient(req);
  if (!params.clientId) return json(res, 400, { ok: false, message: 'clientId obrigatorio.' });
  if (!params.workspaceId || !params.projectId) return json(res, 400, { ok: false, message: 'Cliente sem workspace/projeto eKyte.', ...params });

  try {
    const payload = await fetchExternal(params);
    if (!payload) {
      return json(res, 501, {
        ok: false,
        message: 'Proxy eKyte nao configurado. Configure V4_EKYTE_PROXY_URL na Vercel apontando para o webhook/N8N que consulta o eKyte.',
        ...params
      });
    }
    const taskRows = rows(payload);
    return json(res, 200, { ok: true, source: 'ekyte', ...params, taskScope: 'project', totalReceived: taskRows.length, tasks: taskRows, raw: payload });
  } catch (error) {
    return json(res, 500, { ok: false, message: error.message, ...params });
  }
};
