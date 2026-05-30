const DEFAULT_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw3St4yVxOXDrJorFa-CWCzn08G2Ht9Ctu4QCIPPYK15RiQFayZaw63UyyHrWk8kKO8/exec';

function json(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

function value(req, key, fallback = '') {
  const raw = req.query?.[key] ?? req.body?.[key] ?? fallback;
  return raw === undefined || raw === null ? '' : String(raw).trim();
}

function buildUrl(req) {
  const base = process.env.GROWTHPACK_APPS_SCRIPT_URL || process.env.V4_GROWTHPACK_APPS_SCRIPT_URL || DEFAULT_APPS_SCRIPT_URL;
  const url = new URL(base);
  const clientId = value(req, 'clientId');
  const mode = value(req, 'mode', 'crm');
  const limit = value(req, 'limit', '1200');

  if (clientId) url.searchParams.set('clientId', clientId);
  if (mode) url.searchParams.set('mode', mode);
  if (limit) url.searchParams.set('limit', limit);
  url.searchParams.set('cacheBust', Date.now());
  return url;
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 28000);
  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      redirect: 'follow',
      headers: { Accept: 'application/json,text/plain,*/*' },
      signal: controller.signal
    });
    const text = await response.text();
    let payload = null;
    try { payload = text ? JSON.parse(text) : {}; }
    catch (_) { payload = { ok: false, message: 'Apps Script retornou resposta não JSON.', raw: text.slice(0, 500) }; }

    if (!response.ok || payload?.ok === false) {
      const error = new Error(payload?.message || `GrowthPack HTTP ${response.status}`);
      error.statusCode = response.status || 500;
      error.payload = payload;
      throw error;
    }
    return payload;
  } finally {
    clearTimeout(timer);
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') return json(res, 405, { ok: false, message: 'Method not allowed' });

  const clientId = value(req, 'clientId');
  if (!clientId) return json(res, 400, { ok: false, message: 'clientId obrigatório.' });

  try {
    const payload = await fetchJson(buildUrl(req));
    return json(res, 200, {
      ...payload,
      ok: true,
      proxy: 'vercel-growthpack-proxy',
      clientId: payload.clientId || clientId,
      proxiedAt: new Date().toISOString()
    });
  } catch (error) {
    return json(res, error.statusCode || 500, {
      ok: false,
      message: error.name === 'AbortError' ? 'Timeout ao consultar Apps Script GrowthPack.' : error.message,
      clientId,
      proxy: 'vercel-growthpack-proxy',
      payload: error.payload || null
    });
  }
};
