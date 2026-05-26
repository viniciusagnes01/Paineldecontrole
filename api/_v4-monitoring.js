const CLIENTS = {
  alphaville: {
    name: 'Alphaville',
    growthPackClientId: 'alphaville',
    crmMode: 'growthpack',
    landingPages: [],
    tracking: { ga4PropertyId: '', ga4MeasurementId: '', gtmContainerId: '', metaPixelId: '' }
  },
  yousafer: {
    name: 'YouSafer',
    growthPackClientId: 'yousafer',
    crmMode: 'alternative_source',
    crmNote: 'GrowthPack sem BASE_CRM; monitorar mídia, analytics e fonte de CRM alternativa.',
    landingPages: [],
    tracking: { ga4PropertyId: '', ga4MeasurementId: '', gtmContainerId: '', metaPixelId: '' }
  },
  prime: {
    name: 'Prime Mecanica',
    growthPackClientId: 'prime',
    crmMode: 'growthpack',
    landingPages: [],
    tracking: { ga4PropertyId: '', ga4MeasurementId: '', gtmContainerId: '', metaPixelId: '' }
  },
  multimed: {
    name: 'MultiMed',
    growthPackClientId: 'multimed',
    crmMode: 'alternative_source',
    landingPages: [],
    tracking: { ga4PropertyId: '', ga4MeasurementId: '', gtmContainerId: '', metaPixelId: '' }
  },
  'seg-eletronic': {
    name: 'Seg Eletronic',
    growthPackClientId: 'seg-eletronic',
    crmMode: 'growthpack',
    landingPages: [],
    tracking: { ga4PropertyId: '', ga4MeasurementId: '', gtmContainerId: '', metaPixelId: '' }
  },
  'espaco-master': {
    name: 'Espaco Master',
    growthPackClientId: 'espaco-master',
    crmMode: 'alternative_source',
    landingPages: [],
    tracking: { ga4PropertyId: '', ga4MeasurementId: '', gtmContainerId: '', metaPixelId: '' }
  },
  'st1-internet': {
    name: 'ST1 Internet',
    growthPackClientId: 'st1-internet',
    crmMode: 'growthpack',
    landingPages: [],
    tracking: { ga4PropertyId: '', ga4MeasurementId: '', gtmContainerId: '', metaPixelId: '' }
  }
};

const DEFAULT_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw3St4yVxOXDrJorFa-CWCzn08G2Ht9Ctu4QCIPPYK15RiQFayZaw63UyyHrWk8kKO8/exec';

function json(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

function nowIso() {
  return new Date().toISOString();
}

function getBaseUrl() {
  return process.env.V4_GROWTHPACK_API_URL || DEFAULT_APPS_SCRIPT_URL;
}

function timeoutSignal(timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return { signal: controller.signal, clear: () => clearTimeout(timeout) };
}

function normalizePhone(phone) {
  return String(phone || '').replace(/[^0-9]/g, '');
}

function renderTemplate(template, data) {
  return String(template || '').replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, function (_, key) {
    return data[key] == null ? '' : String(data[key]);
  });
}

function alertText(incident) {
  const prefix = incident.severity === 'critical' ? '🚨 ALERTA V4 Command Center' : '⚠️ ALERTA V4 Command Center';
  return `${prefix}\n\nCliente: ${incident.clientName}\nProblema: ${incident.problem}\nDetalhe: ${incident.detail}\nDetectado em: ${incident.detectedAt}\n\nAcao sugerida:\n${incident.suggestedAction}`;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 12000) {
  const timer = timeoutSignal(timeoutMs);
  try {
    return await fetch(url, { ...options, signal: timer.signal });
  } finally {
    timer.clear();
  }
}

async function checkLandingPage(clientId, client, url) {
  const startedAt = Date.now();
  try {
    const response = await fetchWithTimeout(url, { method: 'GET', redirect: 'follow' }, 12000);
    const elapsedMs = Date.now() - startedAt;
    if (!response.ok) {
      return {
        ok: false,
        severity: 'critical',
        type: 'landing_page_down',
        clientId,
        clientName: client.name,
        problem: 'LP fora do ar',
        detail: `${url} retornou HTTP ${response.status}`,
        suggestedAction: 'Verificar hospedagem, DNS, publicacao da LP ou dominio.',
        detectedAt: nowIso(),
        elapsedMs
      };
    }
    return { ok: true, type: 'landing_page', clientId, url, status: response.status, elapsedMs };
  } catch (error) {
    return {
      ok: false,
      severity: 'critical',
      type: 'landing_page_unreachable',
      clientId,
      clientName: client.name,
      problem: 'LP inacessivel',
      detail: `${url} falhou: ${error.message}`,
      suggestedAction: 'Verificar DNS, SSL, hospedagem e disponibilidade da pagina.',
      detectedAt: nowIso()
    };
  }
}

async function checkGrowthPack(clientId, client) {
  if (client.crmMode === 'alternative_source') {
    return {
      ok: true,
      type: 'crm_alternative_source',
      clientId,
      clientName: client.name,
      status: 'alternative_source',
      detail: client.crmNote || 'Cliente usa fonte alternativa ou integracao GrowthPack pendente.'
    };
  }

  const baseUrl = getBaseUrl();
  const url = new URL(baseUrl);
  url.searchParams.set('clientId', client.growthPackClientId || clientId);
  url.searchParams.set('mode', 'crm');
  url.searchParams.set('limit', '50');
  url.searchParams.set('cacheBust', String(Date.now()));

  try {
    const response = await fetchWithTimeout(url.toString(), { method: 'GET', redirect: 'follow' }, 18000);
    const text = await response.text();
    let payload = null;
    try { payload = JSON.parse(text); } catch (_) {}

    if (!response.ok || !payload || payload.ok === false) {
      return {
        ok: false,
        severity: 'warning',
        type: 'growthpack_api_error',
        clientId,
        clientName: client.name,
        problem: 'GrowthPack/API com erro',
        detail: payload?.message || `HTTP ${response.status}`,
        suggestedAction: 'Verificar Apps Script, permissoes da planilha e aba BASE_CRM.',
        detectedAt: nowIso()
      };
    }

    if (!payload.crm || !Array.isArray(payload.crm.rows)) {
      return {
        ok: false,
        severity: 'warning',
        type: 'growthpack_crm_missing',
        clientId,
        clientName: client.name,
        problem: 'CRM nao localizado na GrowthPack',
        detail: 'API respondeu, mas nao retornou linhas de CRM.',
        suggestedAction: 'Validar nome da aba BASE_CRM ou configurar fonte alternativa.',
        detectedAt: nowIso()
      };
    }

    return {
      ok: true,
      type: 'growthpack_api',
      clientId,
      clientName: client.name,
      spreadsheetName: payload.spreadsheetName,
      rows: payload.crm.rowCount || Math.max(payload.crm.rows.length - 1, 0),
      elapsedMs: payload.elapsedMs || null
    };
  } catch (error) {
    return {
      ok: false,
      severity: 'warning',
      type: 'growthpack_api_unreachable',
      clientId,
      clientName: client.name,
      problem: 'GrowthPack/API inacessivel',
      detail: error.message,
      suggestedAction: 'Verificar Apps Script publicado, permissao publica e tempo de resposta.',
      detectedAt: nowIso()
    };
  }
}

function checkTrackingConfig(clientId, client) {
  const checks = [];
  const tracking = client.tracking || {};

  checks.push({ ok: Boolean(tracking.gtmContainerId), type: 'gtm_config', clientId, clientName: client.name, status: tracking.gtmContainerId ? 'configured' : 'pending_ids' });
  checks.push({ ok: Boolean(tracking.ga4PropertyId || tracking.ga4MeasurementId), type: 'ga4_config', clientId, clientName: client.name, status: (tracking.ga4PropertyId || tracking.ga4MeasurementId) ? 'configured' : 'pending_ids' });
  checks.push({ ok: Boolean(tracking.metaPixelId), type: 'meta_pixel_config', clientId, clientName: client.name, status: tracking.metaPixelId ? 'configured' : 'pending_ids' });

  return checks;
}

async function runMonitoring(options = {}) {
  const targetClientId = options.clientId || '';
  const entries = Object.entries(CLIENTS).filter(([clientId]) => !targetClientId || clientId === targetClientId);

  const results = [];
  const incidents = [];

  for (const [clientId, client] of entries) {
    if (!client) continue;

    for (const url of client.landingPages || []) {
      const result = await checkLandingPage(clientId, client, url);
      results.push(result);
      if (!result.ok) incidents.push(result);
    }

    const growthPack = await checkGrowthPack(clientId, client);
    results.push(growthPack);
    if (!growthPack.ok) incidents.push(growthPack);

    for (const trackingCheck of checkTrackingConfig(clientId, client)) {
      results.push(trackingCheck);
    }
  }

  return {
    ok: incidents.length === 0,
    checkedAt: nowIso(),
    totalClients: entries.length,
    totalChecks: results.length,
    totalIncidents: incidents.length,
    results,
    incidents
  };
}

async function sendEvolutionAlert({ text, phone, incident }) {
  const baseUrl = process.env.EVOLUTION_BASE_URL || process.env.EVOLUTION_API_URL || '';
  const apiKey = process.env.EVOLUTION_API_KEY || '';
  const instance = process.env.EVOLUTION_INSTANCE || process.env.EVOLUTION_INSTANCE_NAME || '';
  const defaultPhone = process.env.MONITORING_ALERT_PHONE || process.env.V4_ALERT_PHONE || '';
  const targetPhone = normalizePhone(phone || defaultPhone);

  if (!baseUrl || !apiKey || !instance || !targetPhone) {
    return {
      ok: false,
      dryRun: true,
      message: 'Evolution nao configurado. Configure EVOLUTION_BASE_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE e MONITORING_ALERT_PHONE na Vercel.',
      text: text || (incident ? alertText(incident) : '')
    };
  }

  const endpoint = `${baseUrl.replace(/\/$/, '')}/message/sendText/${encodeURIComponent(instance)}`;
  const body = {
    number: targetPhone,
    text: text || (incident ? alertText(incident) : '')
  };

  const response = await fetchWithTimeout(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: apiKey
    },
    body: JSON.stringify(body)
  }, 15000);

  const responseText = await response.text();
  let payload = null;
  try { payload = JSON.parse(responseText); } catch (_) { payload = { raw: responseText }; }

  if (!response.ok) {
    return { ok: false, status: response.status, message: 'Evolution retornou erro.', payload };
  }

  return { ok: true, status: response.status, payload };
}

module.exports = {
  CLIENTS,
  json,
  runMonitoring,
  sendEvolutionAlert,
  alertText
};
