// Atualização manual de dados reais via Apps Script GrowthPack API.
(function () {
  const STORAGE_KEY = 'v4-command-center-state-v6-crm-performance-losses';
  const SYNCABLE_CLIENTS = [
    'alphaville',
    'yousafer',
    'prime',
    'multimed',
    'treinando-online',
    'seg-eletronic',
    'espaco-master',
    'st1-internet'
  ];

  function getCurrentClientId() {
    const route = window.V4_APP?.getRoute?.();
    if (route?.clientId && SYNCABLE_CLIENTS.includes(route.clientId)) return route.clientId;
    const activeClient = document.querySelector('[data-client].active')?.dataset?.client;
    if (activeClient && SYNCABLE_CLIENTS.includes(activeClient)) return activeClient;
    return '';
  }

  function readState() {
    if (window.V4_APP?.getState) return window.V4_APP.getState();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (error) {
      console.warn('[RealDataSync] Não foi possível ler localStorage', error);
    }
    return window.V4_SEED || {};
  }

  function writeState(state) {
    if (window.V4_APP?.setState) {
      window.V4_APP.setState(state);
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn('[RealDataSync] Não foi possível salvar localStorage', error);
    }
    setTimeout(() => window.location.reload(), 900);
  }

  function setStatus(label, status) {
    const el = document.querySelector('[data-real-sync-status]');
    if (!el) return;
    el.dataset.status = status;
    el.textContent = label;
  }

  function findClient(state, clientId) {
    return (state.clients || []).find((client) => client.id === clientId);
  }

  function normalizeApiRows(sheetPayload) {
    if (!sheetPayload?.rows || !Array.isArray(sheetPayload.rows)) return null;
    return sheetPayload.rows;
  }

  function applyCrmSnapshot(state, client, payload) {
    const rows = normalizeApiRows(payload.crm);
    if (!rows || !window.V4_CRM_SHEETS?.aggregate) return false;
    state.crmSnapshots = state.crmSnapshots || {};
    state.crmSnapshots[client.id] = window.V4_CRM_SHEETS.aggregate(rows);
    client.crmSheet = client.crmSheet || {};
    client.crmSheet.status = 'Sincronizado via Apps Script';
    client.crmSheet.lastSync = new Date().toLocaleString('pt-BR');
    client.crmSheet.sourceUrl = payload.spreadsheetId;
    return true;
  }

  function applyRuntimeEvidence(client, payload) {
    client.apiStatus = payload.apiStatus || [];
    client.apiConfig = payload.apiConfig || {};
    client.growthPack = {
      ...(client.growthPack || {}),
      spreadsheetId: payload.spreadsheetId || client.growthPack?.spreadsheetId || '',
      title: payload.spreadsheetName || client.growthPack?.title || '',
      status: 'located',
      resultSource: true,
      sourcePriority: 'growthpack_first',
      lastRuntimeLoad: payload.loadedAt || new Date().toISOString()
    };
    client.dataPolicy = {
      ...(client.dataPolicy || {}),
      primarySource: 'growthpack_apps_script',
      secondarySource: 'communication_base_evolution',
      resultSource: 'growthpack_apps_script',
      allowDemoData: false,
      requireEvidence: true
    };
  }

  async function syncClientGrowthPack(clientId, state) {
    if (!window.V4_RUNTIME_API?.hasRuntimeApi?.()) {
      return { ok: false, clientId, message: 'Runtime API pública não configurada.' };
    }
    if (!window.V4_RUNTIME_API?.loadGrowthPackClient) {
      return { ok: false, clientId, message: 'loadGrowthPackClient indisponível.' };
    }

    const client = findClient(state, clientId);
    if (!client) return { ok: false, clientId, message: 'Cliente não encontrado no painel.' };

    const payload = await window.V4_RUNTIME_API.loadGrowthPackClient(clientId);
    applyRuntimeEvidence(client, payload);
    const crmOk = applyCrmSnapshot(state, client, payload);

    return {
      ok: true,
      clientId,
      fromBackend: true,
      crmOk,
      spreadsheetName: payload.spreadsheetName,
      rows: payload.crm?.rowCount || 0
    };
  }

  async function runSync(clientId) {
    const state = readState();
    const targets = clientId ? [clientId] : SYNCABLE_CLIENTS;
    setStatus(clientId ? `Atualizando ${clientId}...` : 'Atualizando GrowthPacks...', 'syncing');

    const results = [];
    for (const target of targets) {
      try {
        results.push(await syncClientGrowthPack(target, state));
      } catch (error) {
        results.push({ ok: false, clientId: target, message: error.message });
      }
    }

    state.events = state.events || [];
    const ok = results.filter((item) => item.ok).length;
    const failed = results.filter((item) => !item.ok).length;
    state.events.unshift({
      id: `ev-growthpack-api-${Date.now()}`,
      type: 'sync',
      text: `GrowthPack API: ${ok} cliente(s) atualizados, ${failed} falha(s)`,
      time: 'agora'
    });

    writeState(state);

    if (failed) setStatus(`${ok} ok, ${failed} falha(s)`, 'error');
    else setStatus(`${ok} ok via Apps Script`, 'ok');
    return results;
  }

  function injectManualSync() {
    if (document.querySelector('[data-real-sync-box]')) return;

    const style = document.createElement('style');
    style.textContent = `
      [data-real-sync-box] {
        position: fixed;
        right: 20px;
        bottom: 20px;
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        border-radius: 14px;
        border: 1px solid rgba(255,255,255,.18);
        background: rgba(13, 15, 23, .92);
        color: #f5f5f5;
        box-shadow: 0 20px 55px rgba(0,0,0,.35);
        backdrop-filter: blur(12px);
        font: 700 12px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }
      [data-real-sync-box] button {
        border: 0;
        border-radius: 999px;
        padding: 8px 12px;
        background: linear-gradient(135deg, var(--red, #cf1022), var(--red-2, #700814));
        color: white;
        font-weight: 900;
        cursor: pointer;
      }
      [data-real-sync-status][data-status="syncing"] { color: #ffcc66; }
      [data-real-sync-status][data-status="ok"] { color: #66dd88; }
      [data-real-sync-status][data-status="warn"] { color: #ffcc66; }
      [data-real-sync-status][data-status="error"] { color: #ff7777; }
    `;
    document.head.appendChild(style);

    const box = document.createElement('div');
    box.dataset.realSyncBox = 'true';
    box.innerHTML = `
      <span data-real-sync-status data-status="idle">GrowthPack API ativa</span>
      <button type="button" data-real-sync-current>Atualizar cliente</button>
      <button type="button" data-real-sync-all>Atualizar todos</button>
    `;
    document.body.appendChild(box);
  }

  document.addEventListener('DOMContentLoaded', injectManualSync);
  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-real-sync-current]')) runSync(getCurrentClientId() || null);
    if (event.target.closest('[data-real-sync-all]')) runSync(null);
  });

  window.V4_REAL_DATA_SYNC = { runSync, syncClientGrowthPack, clients: SYNCABLE_CLIENTS };
})();
