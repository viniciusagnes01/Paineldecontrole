(function () {
  const STORAGE_KEY = 'v4-command-center-state-v6-crm-performance-losses';

  function readState() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || JSON.stringify(window.V4_SEED || {}));
    } catch (error) {
      return JSON.parse(JSON.stringify(window.V4_SEED || {}));
    }
  }

  function writeState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function mergeArraysById(current, incoming) {
    const map = new Map((current || []).map((item) => [item.id, item]));
    (incoming || []).forEach((item) => map.set(item.id, { ...(map.get(item.id) || {}), ...item }));
    return Array.from(map.values());
  }

  function availableClients() {
    const dynamicClients = window.V4_GROWTHPACK_CLIENTS || {};
    const officialClients = (window.V4_OFFICIAL_ACTIVE_CLIENTS || [])
      .filter((client) => client.growthPack?.status === 'located' && client.growthPack?.spreadsheetId)
      .reduce((map, client) => {
        map[client.id] = {
          id: client.id,
          name: client.name,
          spreadsheetId: client.growthPack.spreadsheetId,
          spreadsheetUrl: client.growthPack.url,
          crmGid: client.growthPack.crmGid || '',
          crmSheetName: client.growthPack.crmSheetName || 'BASE_CRM',
          monthlySheetName: '1.0 Mensal',
          weeklySheetName: '2.0 Semanal'
        };
        return map;
      }, {});

    return { ...officialClients, ...dynamicClients };
  }

  async function fetchJson(url) {
    const response = await fetch(url, { headers: { Accept: 'application/json', 'X-V4-Source': 'v4-command-center-growthpack' } });
    const text = await response.text();
    const body = text ? JSON.parse(text) : {};
    if (!response.ok) throw new Error(body?.message || body?.error || `Erro HTTP ${response.status}`);
    return body;
  }

  async function syncClient(clientId) {
    const clients = availableClients();
    const config = clients[clientId];
    if (!config) throw new Error(`Cliente sem configuracao Growth Pack: ${clientId}`);

    const payload = await fetchJson(`/api/growthpack/${clientId}/summary`);
    const state = readState();
    const client = state.clients?.find((item) => item.id === clientId);
    if (client && payload.client) Object.assign(client, payload.client);
    if (payload.crmSnapshot) {
      state.crmSnapshots = state.crmSnapshots || {};
      state.crmSnapshots[clientId] = payload.crmSnapshot;
    }
    if (payload.performanceSnapshot) {
      state.performanceSnapshots = state.performanceSnapshots || {};
      state.performanceSnapshots[clientId] = payload.performanceSnapshot;
    }
    if (payload.tasks) state.tasks = mergeArraysById(state.tasks, payload.tasks);
    if (payload.actionPlan) state.actionPlan = mergeArraysById(state.actionPlan, payload.actionPlan);
    state.events = state.events || [];
    state.events.unshift({ id: `ev-gp-sync-${clientId}-${Date.now()}`, type: 'sync', text: `Growth Pack sincronizado: ${config.name}`, time: 'agora' });
    writeState(state);
    return { ok: true, clientId, message: 'Growth Pack sincronizado. Recarregue o painel para ver os dados.' };
  }

  async function syncAll() {
    const ids = Object.keys(availableClients());
    const results = [];
    for (const id of ids) {
      try {
        results.push(await syncClient(id));
      } catch (error) {
        results.push({ ok: false, clientId: id, message: error.message });
      }
    }
    return { ok: results.every((item) => item.ok), results };
  }

  window.V4_GROWTHPACK = { syncClient, syncAll, availableClients };
})();
