(function () {
  const DEFAULT_BASE_URL = window.V4_RUNTIME_API_URL || '';

  function hasRuntimeApi() {
    return Boolean(DEFAULT_BASE_URL && DEFAULT_BASE_URL !== 'disabled');
  }

  function appsScriptUrl(params = {}) {
    const url = new URL(DEFAULT_BASE_URL);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
    });
    url.searchParams.set('cacheBust', Date.now());
    return url.toString();
  }

  async function fetchJson(url, options = {}) {
    const response = await fetch(url, { cache: 'no-store', ...options });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.ok === false) throw new Error(payload.message || `Erro HTTP ${response.status}`);
    return payload;
  }

  async function request(path, options = {}) {
    if (!hasRuntimeApi()) throw new Error('Runtime API publica nao configurada.');
    if (/script\.google\.com/.test(DEFAULT_BASE_URL)) return fetchJson(appsScriptUrl(options.params || {}), options);
    const url = `${DEFAULT_BASE_URL}${path}${path.includes('?') ? '&' : '?'}cacheBust=${Date.now()}`;
    return fetchJson(url, { headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }, ...options });
  }

  async function loadGrowthPackClient(clientId) {
    return request('/api/growthpack', { params: { clientId } });
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
    hasRuntimeApi,
    request,
    loadGrowthPackClient,
    loadCommunicationBase,
    syncCommunicationBase,
    syncOfficialCommunicationClients
  };
})();
