// Atualização manual segura via Apps Script GrowthPack API.
(function () {
  const STORAGE_KEY = 'v4-command-center-state-v6-crm-performance-losses';
  const DEBUG_KEY = 'v4-growthpack-debug-log';
  const MAX_RAW_RECORDS_PER_CLIENT = 1200;
  const SYNCABLE_CLIENTS = ['alphaville', 'yousafer', 'prime', 'multimed', 'treinando-online', 'seg-eletronic', 'espaco-master', 'st1-internet'];

  function now() { return new Date().toLocaleString('pt-BR'); }

  function logDebug(type, message, data) {
    const item = { at: now(), type, message, data: data || null };
    console.log('[V4 DEBUG]', item);
    try {
      const list = JSON.parse(localStorage.getItem(DEBUG_KEY) || '[]');
      list.unshift(item);
      localStorage.setItem(DEBUG_KEY, JSON.stringify(list.slice(0, 60)));
    } catch {}
    paintDebug();
  }

  function readState() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch (error) {
      logDebug('state_error', 'Falha ao ler cache local. Cache será ignorado.', error.message);
      return window.V4_SEED || {};
    }
  }

  function writeState(state) {
    try {
      const serialized = JSON.stringify(state);
      const sizeKb = Math.round(serialized.length / 1024);
      localStorage.setItem(STORAGE_KEY, serialized);
      logDebug('state_saved', `Estado salvo (${sizeKb} KB).`, { sizeKb });
    } catch (error) {
      logDebug('state_save_error', 'Falha ao salvar estado. Limpando snapshots pesados.', error.message);
      try {
        if (state.crmSnapshots) {
          Object.values(state.crmSnapshots).forEach((snapshot) => {
            if (Array.isArray(snapshot.rawRecords)) snapshot.rawRecords = snapshot.rawRecords.slice(-300);
          });
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (secondError) {
        logDebug('state_save_error_final', 'Ainda não foi possível salvar estado.', secondError.message);
      }
    }
    setTimeout(() => window.location.reload(), 600);
  }

  function getCurrentClientId() {
    const activeClient = document.querySelector('[data-client].active')?.dataset?.client;
    if (activeClient && SYNCABLE_CLIENTS.includes(activeClient)) return activeClient;
    return SYNCABLE_CLIENTS[0];
  }

  function findClient(state, clientId) {
    return (state.clients || []).find((client) => client.id === clientId);
  }

  function setStatus(label, status) {
    const el = document.querySelector('[data-real-sync-status]');
    if (!el) return;
    el.dataset.status = status;
    el.textContent = label;
  }

  function trimSnapshot(snapshot) {
    if (!snapshot || !Array.isArray(snapshot.rawRecords)) return snapshot;
    const rawRecords = snapshot.rawRecords.slice(-MAX_RAW_RECORDS_PER_CLIENT);
    return { ...snapshot, rawRecords, rows: rawRecords.length, latest: (snapshot.latest || []).slice(0, 12), lostLatest: (snapshot.lostLatest || []).slice(0, 12) };
  }

  function applyCrmSnapshot(state, client, payload) {
    const rows = payload?.crm?.rows;
    if (!Array.isArray(rows)) throw new Error('Payload CRM sem rows. Verifique BASE_CRM no Apps Script.');
    if (!window.V4_CRM_SHEETS?.aggregate) throw new Error('Agregador V4_CRM_SHEETS indisponível.');
    state.crmSnapshots = state.crmSnapshots || {};
    const snapshot = window.V4_CRM_SHEETS.aggregate(rows);
    state.crmSnapshots[client.id] = trimSnapshot(snapshot);
    client.crmSheet = client.crmSheet || {};
    client.crmSheet.status = 'Sincronizado via Apps Script';
    client.crmSheet.lastSync = now();
    client.crmSheet.rowCount = payload.crm?.rowCount || rows.length;
    return state.crmSnapshots[client.id].rows || 0;
  }

  function applyRuntimeEvidence(client, payload) {
    client.apiStatus = payload.apiStatus || [];
    client.apiConfig = payload.apiConfig || {};
    client.growthPack = { ...(client.growthPack || {}), spreadsheetId: payload.spreadsheetId || '', title: payload.spreadsheetName || '', status: 'located', resultSource: true, lastRuntimeLoad: payload.loadedAt || new Date().toISOString() };
    client.dataPolicy = { ...(client.dataPolicy || {}), primarySource: 'growthpack_apps_script', resultSource: 'growthpack_apps_script', allowDemoData: false, requireEvidence: true };
  }

  async function syncClientGrowthPack(clientId, state) {
    if (!window.V4_RUNTIME_API?.hasRuntimeApi?.()) throw new Error('Runtime API pública não configurada.');
    const client = findClient(state, clientId);
    if (!client) throw new Error(`Cliente ${clientId} não encontrado no painel.`);

    setStatus(`Buscando ${clientId}...`, 'syncing');
    logDebug('sync_start', `Iniciando ${clientId}`);
    const payload = await window.V4_RUNTIME_API.loadGrowthPackClient(clientId);
    applyRuntimeEvidence(client, payload);
    const rows = applyCrmSnapshot(state, client, payload);
    logDebug('sync_ok', `${clientId} sincronizado`, { spreadsheetName: payload.spreadsheetName, rows });
    return { ok: true, clientId, rows, spreadsheetName: payload.spreadsheetName };
  }

  async function runSync(clientId) {
    const state = readState();
    const targets = clientId ? [clientId] : [getCurrentClientId()];
    setStatus(clientId ? `Atualizando ${clientId}...` : 'Atualizando cliente atual...', 'syncing');

    const results = [];
    for (const target of targets) {
      try { results.push(await syncClientGrowthPack(target, state)); }
      catch (error) {
        logDebug('sync_error', `${target}: ${error.message}`);
        results.push({ ok: false, clientId: target, message: error.message });
      }
    }

    const ok = results.filter((item) => item.ok).length;
    const failed = results.length - ok;
    state.events = state.events || [];
    state.events.unshift({ id: `ev-growthpack-api-${Date.now()}`, type: 'sync', text: `GrowthPack API: ${ok} ok, ${failed} falha(s)`, time: 'agora' });
    writeState(state);
    setStatus(failed ? `${ok} ok, ${failed} falha(s)` : `${ok} ok via Apps Script`, failed ? 'error' : 'ok');
    return results;
  }

  function clearLocalCache() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(DEBUG_KEY);
    sessionStorage.clear();
    setStatus('Cache limpo. Recarregando...', 'warn');
    setTimeout(() => window.location.reload(), 300);
  }

  function paintDebug() {
    const panel = document.querySelector('[data-v4-debug-panel]');
    if (!panel) return;
    let logs = [];
    try { logs = JSON.parse(localStorage.getItem(DEBUG_KEY) || '[]'); } catch {}
    panel.querySelector('[data-v4-debug-list]').innerHTML = logs.slice(0, 8).map((item) => `<div><strong>${item.at}</strong> [${item.type}] ${item.message}</div>`).join('') || '<div>Nenhum log ainda.</div>';
  }

  function injectManualSync() {
    if (document.querySelector('[data-real-sync-box]')) return;
    const style = document.createElement('style');
    style.textContent = `
      [data-real-sync-box] { position: fixed; right: 20px; bottom: 20px; z-index: 9999; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; max-width: 520px; padding: 10px 12px; border-radius: 14px; border: 1px solid rgba(255,255,255,.18); background: rgba(13,15,23,.94); color: #f5f5f5; box-shadow: 0 20px 55px rgba(0,0,0,.35); font: 700 12px system-ui; }
      [data-real-sync-box] button { border: 0; border-radius: 999px; padding: 8px 12px; background: linear-gradient(135deg, var(--red,#cf1022), var(--red-2,#700814)); color: white; font-weight: 900; cursor: pointer; }
      [data-real-sync-status][data-status="syncing"] { color: #ffcc66; } [data-real-sync-status][data-status="ok"] { color: #66dd88; } [data-real-sync-status][data-status="warn"] { color: #ffcc66; } [data-real-sync-status][data-status="error"] { color: #ff7777; }
      [data-v4-debug-panel] { flex-basis: 100%; max-height: 140px; overflow: auto; padding: 8px; border-radius: 10px; background: rgba(255,255,255,.06); font-weight: 600; line-height: 1.35; display: none; }
      [data-real-sync-box][data-debug-open="true"] [data-v4-debug-panel] { display: block; }
    `;
    document.head.appendChild(style);
    const box = document.createElement('div');
    box.dataset.realSyncBox = 'true';
    box.innerHTML = `
      <span data-real-sync-status data-status="idle">Debug pronto</span>
      <button type="button" data-real-sync-current>Atualizar cliente</button>
      <button type="button" data-v4-debug-toggle>Debug</button>
      <button type="button" data-v4-clear-cache>Limpar cache</button>
      <div data-v4-debug-panel><div data-v4-debug-list></div></div>
    `;
    document.body.appendChild(box);
    paintDebug();
  }

  document.addEventListener('DOMContentLoaded', injectManualSync);
  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-real-sync-current]')) runSync(getCurrentClientId());
    if (event.target.closest('[data-real-sync-all]')) runSync(getCurrentClientId());
    if (event.target.closest('[data-v4-clear-cache]')) clearLocalCache();
    if (event.target.closest('[data-v4-debug-toggle]')) {
      const box = document.querySelector('[data-real-sync-box]');
      if (box) box.dataset.debugOpen = box.dataset.debugOpen === 'true' ? 'false' : 'true';
      paintDebug();
    }
  });

  window.addEventListener('error', (event) => logDebug('window_error', event.message));
  window.addEventListener('unhandledrejection', (event) => logDebug('promise_error', event.reason?.message || String(event.reason)));
  window.V4_REAL_DATA_SYNC = { runSync, syncClientGrowthPack, clearLocalCache, clients: SYNCABLE_CLIENTS, debug: logDebug };
})();
