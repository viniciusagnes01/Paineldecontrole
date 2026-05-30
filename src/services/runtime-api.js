(function () {
  const DEFAULT_BASE_URL = window.V4_RUNTIME_API_URL || '';
  const DEFAULT_TIMEOUT_MS = 28000;

  function hasRuntimeApi() {
    return true;
  }

  function sameOriginUrl(path) {
    return `${window.location.origin}${path}${path.includes('?') ? '&' : '?'}cacheBust=${Date.now()}`;
  }

  async function fetchJson(url, options = {}) {
    const controller = new AbortController();
    const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { cache: 'no-store', ...options, signal: controller.signal });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.ok === false) throw new Error(payload.message || `Erro HTTP ${response.status}`);
      return payload;
    } catch (error) {
      if (error.name === 'AbortError') throw new Error(`Timeout da API apos ${Math.round(timeoutMs / 1000)}s.`);
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  async function request(path, options = {}) {
    const url = path.startsWith('/api/') ? sameOriginUrl(path) : `${DEFAULT_BASE_URL}${path}${path.includes('?') ? '&' : '?'}cacheBust=${Date.now()}`;
    const fetchOptions = { headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }, ...options };
    delete fetchOptions.params;
    return fetchJson(url, fetchOptions);
  }

  async function loadGrowthPackClient(clientId, options = {}) {
    const params = new URLSearchParams({
      clientId,
      mode: options.mode || 'crm',
      limit: String(options.limit || 1200)
    });
    return request(`/api/growthpack?${params.toString()}`, { timeoutMs: options.timeoutMs || DEFAULT_TIMEOUT_MS });
  }

  async function loadCommunicationBase(clientId, options = {}) {
    const force = options.force ? '?force=true' : '';
    return request(`/api/communication-base/${clientId}${force}`);
  }

  async function syncCommunicationBase(clientId) {
    return request(`/api/communication-base/${clientId}/sync`, { method: 'POST' });
  }

  async function syncOfficialCommunicationClients() {
    const clientIds = ['espaco-master', 'st1-internet'];
    const results = [];
    for (const clientId of clientIds) {
      try { results.push(await syncCommunicationBase(clientId)); }
      catch (error) { results.push({ ok: false, clientId, message: error.message }); }
    }
    return results;
  }

  window.V4_RUNTIME_API = {
    baseUrl: DEFAULT_BASE_URL,
    proxyBaseUrl: window.location.origin,
    hasRuntimeApi,
    request,
    loadGrowthPackClient,
    loadCommunicationBase,
    syncCommunicationBase,
    syncOfficialCommunicationClients
  };
})();
