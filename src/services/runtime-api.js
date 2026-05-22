(function () {
  const DEFAULT_BASE_URL = window.V4_RUNTIME_API_URL || 'http://localhost:5174';

  async function request(path, options = {}) {
    const response = await fetch(`${DEFAULT_BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.ok === false) {
      throw new Error(payload.message || `Erro HTTP ${response.status}`);
    }
    return payload;
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
      try {
        results.push(await syncCommunicationBase(clientId));
      } catch (error) {
        results.push({ ok: false, clientId, message: error.message });
      }
    }
    return results;
  }

  window.V4_RUNTIME_API = {
    baseUrl: DEFAULT_BASE_URL,
    loadCommunicationBase,
    syncCommunicationBase,
    syncOfficialCommunicationClients
  };
})();
