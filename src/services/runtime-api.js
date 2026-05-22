(function () {
  const DEFAULT_BASE_URL = window.V4_RUNTIME_API_URL || '';
  const DEFAULT_TIMEOUT_MS = 18000;
  let jsonpCounter = 0;

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

  function fetchJsonp(params = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
    return new Promise((resolve, reject) => {
      const callbackName = `__v4GrowthPackJsonp_${Date.now()}_${jsonpCounter++}`;
      const script = document.createElement('script');
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error(`Timeout da API apos ${Math.round(timeoutMs / 1000)}s. Apps Script nao respondeu via JSONP.`));
      }, timeoutMs);

      function cleanup() {
        clearTimeout(timeout);
        try { delete window[callbackName]; } catch (_) { window[callbackName] = undefined; }
        if (script.parentNode) script.parentNode.removeChild(script);
      }

      window[callbackName] = (payload) => {
        cleanup();
        if (!payload || payload.ok === false) {
          reject(new Error(payload?.message || 'Apps Script retornou erro.'));
          return;
        }
        resolve(payload);
      };

      script.onerror = () => {
        cleanup();
        reject(new Error('Falha ao carregar Apps Script via JSONP. Verifique implantação e acesso público.'));
      };
      script.src = appsScriptUrl({ ...params, callback: callbackName });
      document.head.appendChild(script);
    });
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
      if (error.name === 'AbortError') throw new Error(`Timeout da API apos ${Math.round(timeoutMs / 1000)}s. Teste o Apps Script direto no navegador.`);
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  async function request(path, options = {}) {
    if (!hasRuntimeApi()) throw new Error('Runtime API publica nao configurada.');
    if (/script\.google\.com/.test(DEFAULT_BASE_URL)) {
      return fetchJsonp(options.params || {}, options.timeoutMs || DEFAULT_TIMEOUT_MS);
    }
    const url = `${DEFAULT_BASE_URL}${path}${path.includes('?') ? '&' : '?'}cacheBust=${Date.now()}`;
    return fetchJson(url, { headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }, ...options });
  }

  async function loadGrowthPackClient(clientId, options = {}) {
    return request('/api/growthpack', {
      params: {
        clientId,
        mode: options.mode || 'crm',
        limit: options.limit || 300
      },
      timeoutMs: options.timeoutMs || DEFAULT_TIMEOUT_MS
    });
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
