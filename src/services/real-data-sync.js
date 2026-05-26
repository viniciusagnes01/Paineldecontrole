// Atualização manual segura via Apps Script GrowthPack API + Performance Sheets.
(function () {
  const STORAGE_KEY = 'v4-command-center-state-v6-crm-performance-losses';
  const DEBUG_KEY = 'v4-growthpack-debug-log';
  const MAX_RAW_RECORDS_PER_CLIENT = 1200;
  const SYNCABLE_CLIENTS = ['alphaville', 'prime', 'seg-eletronic', 'espaco-master', 'st1-internet', 'yousafer', 'multimed'];
  const ALTERNATIVE_SOURCE_CLIENTS = {
    'espaco-master': 'Fonte alternativa / planilha convertida. Integração direta GrowthPack não aplicável.',
    'multimed': 'Fonte alternativa / integração GrowthPack pendente.',
    'yousafer': 'GrowthPack sem BASE_CRM. CRM deve ser tratado como fonte alternativa.'
  };
  let isSyncing = false;

  function now() { return new Date().toLocaleString('pt-BR'); }

  function isAlternativeSource(clientId) {
    return Boolean(ALTERNATIVE_SOURCE_CLIENTS[clientId]);
  }

  function logDebug(type, message, data) {
    const item = { at: now(), type, message, data: data || null };
    console.log('[V4 DEBUG]', item);
    try {
      const list = JSON.parse(localStorage.getItem(DEBUG_KEY) || '[]');
      list.unshift(item);
      localStorage.setItem(DEBUG_KEY, JSON.stringify(list.slice(0, 140)));
    } catch {}
    paintDebug();
  }

  function readState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (error) {
      logDebug('state_error', 'Falha ao ler cache local. Cache será ignorado.', error.message);
    }
    return window.V4_APP?.getState?.() || window.V4_SEED || {};
  }

  function shrinkState(state) {
    if (state.crmSnapshots) {
      Object.values(state.crmSnapshots).forEach((snapshot) => {
        if (Array.isArray(snapshot.rawRecords)) snapshot.rawRecords = snapshot.rawRecords.slice(-MAX_RAW_RECORDS_PER_CLIENT);
        if (Array.isArray(snapshot.latest)) snapshot.latest = snapshot.latest.slice(0, 12);
        if (Array.isArray(snapshot.lostLatest)) snapshot.lostLatest = snapshot.lostLatest.slice(0, 12);
      });
    }
    return state;
  }

  function writeState(state, options = {}) {
    const reload = options.reload !== false;
    try {
      const cleanState = shrinkState(state);
      const serialized = JSON.stringify(cleanState);
      const sizeKb = Math.round(serialized.length / 1024);
      localStorage.setItem(STORAGE_KEY, serialized);
      logDebug('state_saved', `Estado salvo (${sizeKb} KB).`, { sizeKb });
    } catch (error) {
      logDebug('state_save_error', 'Falha ao salvar estado mesmo após redução.', error.message);
    }
    if (reload) setTimeout(() => window.location.reload(), 700);
  }

  function getCurrentClientId() {
    const activeClient = document.querySelector('[data-client].active')?.dataset?.client;
    const routeClient = window.V4_APP?.getRoute?.()?.clientId;
    const detected = activeClient || routeClient || SYNCABLE_CLIENTS[0];
    return SYNCABLE_CLIENTS.includes(detected) ? detected : SYNCABLE_CLIENTS[0];
  }

  function findClient(state, clientId) {
    return (state.clients || []).find((client) => client.id === clientId);
  }

  function setStatus(label, status) {
    const el = document.querySelector('[data-real-sync-status]');
    if (!el) return;
    el.dataset.status = status;
    el.textContent = label;
    el.title = label;
  }

  function setBusy(value) {
    isSyncing = value;
    document.querySelectorAll('[data-real-sync-current], [data-real-sync-all]').forEach((button) => {
      button.disabled = value;
      button.style.opacity = value ? '.65' : '1';
      button.style.cursor = value ? 'wait' : 'pointer';
    });
  }

  function emptyCrmSnapshot(clientId, reason, sourceType) {
    return {
      source: sourceType || 'growthpack_apps_script',
      clientId,
      rows: 0,
      rawRecords: [],
      latest: [],
      lostLatest: [],
      totals: { value: 0, lead: 0, mql: 0, sql: 0, opportunity: 0, purchase: 0, lost: 0 },
      rates: { saleRate: 0, lossRate: 0, ticket: 0 },
      warning: reason || 'CRM não localizado na GrowthPack',
      pending: sourceType === 'alternative_source'
    };
  }

  function markAlternativeSource(state, clientId) {
    const client = findClient(state, clientId);
    const reason = ALTERNATIVE_SOURCE_CLIENTS[clientId] || 'Fonte alternativa / integração GrowthPack pendente.';

    state.crmSnapshots = state.crmSnapshots || {};
    state.crmSnapshots[clientId] = emptyCrmSnapshot(clientId, reason, 'alternative_source');

    if (client) {
      client.crmSheet = client.crmSheet || {};
      client.crmSheet.status = reason;
      client.crmSheet.lastSync = now();
      client.crmSheet.rowCount = 0;
      client.growthPack = {
        ...(client.growthPack || {}),
        status: client.growthPack?.status || 'alternative_source',
        resultSource: false,
        lastRuntimeLoad: new Date().toISOString()
      };
      client.dataPolicy = {
        ...(client.dataPolicy || {}),
        primarySource: 'alternative_source',
        resultSource: 'alternative_source',
        allowDemoData: false,
        requireEvidence: true
      };
    }

    logDebug('sync_pending', `${clientId}: ${reason}`);
    return { ok: true, pending: true, source: 'crm', clientId, rows: 0, message: reason };
  }

  function trimSnapshot(snapshot) {
    if (!snapshot || !Array.isArray(snapshot.rawRecords)) return snapshot;
    const rawRecords = snapshot.rawRecords.slice(-MAX_RAW_RECORDS_PER_CLIENT);
    return { ...snapshot, rawRecords, rows: rawRecords.length, latest: (snapshot.latest || []).slice(0, 12), lostLatest: (snapshot.lostLatest || []).slice(0, 12) };
  }

  function applyCrmSnapshot(state, client, payload) {
    const rows = payload?.crm?.rows;
    state.crmSnapshots = state.crmSnapshots || {};
    client.crmSheet = client.crmSheet || {};

    if (!Array.isArray(rows)) {
      const reason = `CRM não localizado na GrowthPack (${payload?.crm?.name || client.crmSheet?.sheetName || 'BASE_CRM'})`;
      state.crmSnapshots[client.id] = emptyCrmSnapshot(client.id, reason);
      client.crmSheet.status = reason;
      client.crmSheet.lastSync = now();
      client.crmSheet.rowCount = 0;
      logDebug('crm_warning', `${client.id}: ${reason}`);
      return 0;
    }

    if (!window.V4_CRM_SHEETS?.aggregate) {
      const reason = 'Agregador V4_CRM_SHEETS indisponível.';
      state.crmSnapshots[client.id] = emptyCrmSnapshot(client.id, reason);
      client.crmSheet.status = reason;
      client.crmSheet.lastSync = now();
      client.crmSheet.rowCount = 0;
      logDebug('crm_warning', `${client.id}: ${reason}`);
      return 0;
    }

    const snapshot = window.V4_CRM_SHEETS.aggregate(rows);
    state.crmSnapshots[client.id] = trimSnapshot(snapshot);
    client.crmSheet.status = 'Sincronizado via Apps Script';
    client.crmSheet.lastSync = now();
    client.crmSheet.rowCount = payload.crm?.rowCount || rows.length;
    return state.crmSnapshots[client.id].rows || 0;
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
      lastRuntimeLoad: payload.loadedAt || new Date().toISOString()
    };
    client.dataPolicy = {
      ...(client.dataPolicy || {}),
      primarySource: 'growthpack_apps_script',
      resultSource: 'growthpack_apps_script',
      allowDemoData: false,
      requireEvidence: true
    };
  }

  function applyMetricsFromPerformance(client, snapshot) {
    const metrics = snapshot?.monthly?.current?.metrics || snapshot?.weekly?.current?.metrics || {};
    client.metrics = {
      ...(client.metrics || {}),
      investment: Number(metrics.investment || client.metrics?.investment || 0),
      cpl: Number(metrics.cpl || client.metrics?.cpl || 0),
      roas: Number(metrics.roas || client.metrics?.roas || 0),
      impressions: Number(metrics.impressions || client.metrics?.impressions || 0),
      clicks: Number(metrics.clicks || client.metrics?.clicks || 0),
      ctr: Number(metrics.ctr || client.metrics?.ctr || 0),
      cpc: Number(metrics.cpc || client.metrics?.cpc || 0),
      conversion: Number(metrics.conversion || client.metrics?.conversion || 0),
      pacing: Number(metrics.pacing || client.metrics?.pacing || 0),
      plannedMedia: Number(metrics.plannedMedia || client.metrics?.plannedMedia || 0)
    };
  }

  async function syncClientPerformance(clientId, state) {
    const client = findClient(state, clientId);
    if (!client) throw new Error(`Cliente ${clientId} não encontrado para mídia.`);
    if (!window.V4_PERFORMANCE_SHEETS?.load) {
      logDebug('performance_skip', `${clientId}: serviço V4_PERFORMANCE_SHEETS não disponível.`);
      return { ok: false, source: 'performance', clientId, message: 'Serviço de performance indisponível.' };
    }

    const source = client.performanceSheets || {};
    const configured = Boolean(source.spreadsheetId || source.url || source.proxyUrl || source.monthlyProxyUrl || source.weeklyProxyUrl || source.fallbackSnapshot);
    if (!configured) {
      logDebug('performance_skip', `${clientId}: fonte de mídia não configurada.`);
      return { ok: false, source: 'performance', clientId, message: 'Fonte de mídia não configurada.' };
    }

    setStatus(`Buscando mídia ${clientId}...`, 'syncing');
    logDebug('performance_call_start', `Lendo mensal/semanal para ${clientId}`, {
      spreadsheetId: source.spreadsheetId || source.url || '',
      monthly: source.monthlySheetName,
      weekly: source.weeklySheetName,
      monthlyGid: source.monthlyGid,
      weeklyGid: source.weeklyGid
    });

    const result = await window.V4_PERFORMANCE_SHEETS.load(source);
    state.performanceSnapshots = state.performanceSnapshots || {};
    state.performanceSnapshots[clientId] = result.snapshot;
    client.performanceSheets = {
      ...source,
      status: 'Sincronizado via Google Sheets',
      lastSync: now()
    };
    applyMetricsFromPerformance(client, result.snapshot);
    logDebug('performance_sync_ok', `${clientId}: mídia sincronizada`, {
      monthlyCurrent: result.snapshot?.monthly?.current?.label || '',
      weeklyCurrent: result.snapshot?.weekly?.current?.label || '',
      investment: result.snapshot?.monthly?.current?.metrics?.investment || 0
    });
    return { ok: true, source: 'performance', clientId, message: 'Mídia sincronizada.' };
  }

  async function syncClientGrowthPack(clientId, state) {
    if (isAlternativeSource(clientId)) {
      setStatus(`Fonte alternativa CRM: ${clientId}`, 'warn');
      return markAlternativeSource(state, clientId);
    }

    logDebug('api_check', `Runtime disponível: ${Boolean(window.V4_RUNTIME_API?.hasRuntimeApi?.())}`);
    if (!window.V4_RUNTIME_API?.hasRuntimeApi?.()) throw new Error('Runtime API pública não configurada.');
    if (!window.V4_RUNTIME_API?.loadGrowthPackClient) throw new Error('loadGrowthPackClient não disponível no runtime-api.js.');

    const client = findClient(state, clientId);
    if (!client) throw new Error(`Cliente ${clientId} não encontrado no painel.`);

    setStatus(`Buscando CRM ${clientId}...`, 'syncing');
    logDebug('api_call_start', `Chamando Apps Script para ${clientId}`);
    const payload = await window.V4_RUNTIME_API.loadGrowthPackClient(clientId, { mode: 'crm', limit: 300 });
    logDebug('api_call_ok', `Resposta recebida de ${clientId}`, { ok: payload.ok, spreadsheetName: payload.spreadsheetName, crmRows: payload.crm?.rowCount, elapsedMs: payload.elapsedMs });
    applyRuntimeEvidence(client, payload);
    const rows = applyCrmSnapshot(state, client, payload);
    const warning = state.crmSnapshots?.[client.id]?.warning || '';
    if (warning) logDebug('sync_warn', `${clientId} sincronizado com aviso: ${warning}`, { rows });
    else logDebug('sync_ok', `${clientId} CRM sincronizado`, { spreadsheetName: payload.spreadsheetName, rows });
    return { ok: true, warning: Boolean(warning), source: 'crm', clientId, rows, spreadsheetName: payload.spreadsheetName, message: warning };
  }

  async function syncClientAllSources(clientId, state) {
    const results = [];
    try { results.push(await syncClientGrowthPack(clientId, state)); }
    catch (error) {
      if (isAlternativeSource(clientId)) results.push(markAlternativeSource(state, clientId));
      else {
        logDebug('sync_error', `${clientId}: ${error.message}`);
        results.push({ ok: false, source: 'crm', clientId, message: error.message });
      }
    }

    try { results.push(await syncClientPerformance(clientId, state)); }
    catch (error) {
      const client = findClient(state, clientId);
      if (client) {
        client.performanceSheets = client.performanceSheets || {};
        client.performanceSheets.status = 'Erro de sync';
        client.performanceSheets.lastSync = `Erro: ${error.message}`;
      }
      logDebug('performance_sync_error', `${clientId}: ${error.message}`);
      results.push({ ok: false, source: 'performance', clientId, message: error.message });
    }
    return results;
  }

  async function runSync(clientId) {
    if (isSyncing) return [];
    setBusy(true);
    const targetClientId = clientId || getCurrentClientId();
    logDebug('run_sync_called', `runSync chamado para ${targetClientId}`);
    const state = readState();
    setStatus(`Atualizando ${targetClientId}...`, 'syncing');

    const results = await syncClientAllSources(targetClientId, state);
    finishSync(state, results, true);
    setBusy(false);
    return results;
  }

  async function runSyncAll() {
    if (isSyncing) return [];
    setBusy(true);
    const state = readState();
    const results = [];
    logDebug('run_sync_all_called', `Fila segura iniciada para ${SYNCABLE_CLIENTS.length} clientes.`);

    for (let index = 0; index < SYNCABLE_CLIENTS.length; index += 1) {
      const clientId = SYNCABLE_CLIENTS[index];
      setStatus(`Atualizando ${index + 1}/${SYNCABLE_CLIENTS.length}: ${clientId}`, 'syncing');
      const clientResults = await syncClientAllSources(clientId, state);
      results.push(...clientResults);
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    finishSync(state, results, true);
    setBusy(false);
    return results;
  }

  function finishSync(state, results, reload) {
    const crmResults = results.filter((item) => item.source !== 'performance');
    const performanceResults = results.filter((item) => item.source === 'performance');
    const growthOk = crmResults.filter((item) => item.ok && !item.warning && !item.pending).length;
    const pending = crmResults.filter((item) => item.ok && item.pending).length;
    const warnings = crmResults.filter((item) => item.ok && item.warning && !item.pending).length;
    const failed = results.filter((item) => !item.ok).length;
    const mediaOk = performanceResults.filter((item) => item.ok).length;
    const failedNames = results.filter((item) => !item.ok).map((item) => `${item.clientId}/${item.source || 'sync'}`).join(', ');
    const warningNames = crmResults.filter((item) => item.ok && item.warning && !item.pending).map((item) => item.clientId).join(', ');
    const pendingNames = crmResults.filter((item) => item.ok && item.pending).map((item) => item.clientId).join(', ');

    state.events = state.events || [];
    state.events.unshift({ id: `ev-growthpack-api-${Date.now()}`, type: 'sync', text: `Sync: CRM ${growthOk} ok, ${pending} fonte(s) alternativa(s), mídia ${mediaOk} ok, ${failed} falha(s)`, time: 'agora' });
    writeState(state, { reload });

    if (failed) setStatus(`CRM ${growthOk} ok, mídia ${mediaOk} ok, ${failed} falha(s): ${failedNames}`, 'error');
    else if (warnings) setStatus(`CRM ${growthOk} ok, mídia ${mediaOk} ok, ${pending} fonte(s) alternativa(s), ${warnings} aviso(s): ${warningNames}`, 'warn');
    else if (pending) setStatus(`CRM ${growthOk} ok, mídia ${mediaOk} ok, ${pending} fonte(s) alternativa(s): ${pendingNames}`, 'warn');
    else setStatus(`CRM ${growthOk} ok, mídia ${mediaOk} ok`, 'ok');
  }

  function clearLocalCache() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(DEBUG_KEY);
    localStorage.removeItem('v4-boot-debug-log');
    sessionStorage.clear();
    logDebug('cache_clear', 'Cache do painel limpo pelo botão.');
    setStatus('Cache limpo. Recarregando...', 'warn');
    setTimeout(() => window.location.reload(), 400);
  }

  function paintDebug() {
    const panel = document.querySelector('[data-v4-debug-panel]');
    if (!panel) return;
    let logs = [];
    try { logs = JSON.parse(localStorage.getItem(DEBUG_KEY) || '[]'); } catch {}
    panel.querySelector('[data-v4-debug-list]').innerHTML = logs.slice(0, 20).map((item) => `<div><strong>${item.at}</strong> [${item.type}] ${item.message}</div>`).join('') || '<div>Nenhum log ainda.</div>';
  }

  function injectManualSync() {
    if (document.querySelector('[data-real-sync-box]')) return;
    const style = document.createElement('style');
    style.textContent = `
      [data-real-sync-box] { position: fixed; right: 20px; bottom: 20px; z-index: 9999; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; max-width: 820px; padding: 10px 12px; border-radius: 14px; border: 1px solid rgba(255,255,255,.18); background: rgba(13,15,23,.94); color: #f5f5f5; box-shadow: 0 20px 55px rgba(0,0,0,.35); font: 700 12px system-ui; }
      [data-real-sync-box] button { border: 0; border-radius: 999px; padding: 8px 12px; background: linear-gradient(135deg, var(--red,#cf1022), var(--red-2,#700814)); color: white; font-weight: 900; cursor: pointer; }
      [data-real-sync-status][data-status="syncing"] { color: #ffcc66; } [data-real-sync-status][data-status="ok"] { color: #66dd88; } [data-real-sync-status][data-status="warn"] { color: #ffcc66; } [data-real-sync-status][data-status="error"] { color: #ff7777; }
      [data-v4-debug-panel] { flex-basis: 100%; max-height: 260px; overflow: auto; padding: 8px; border-radius: 10px; background: rgba(255,255,255,.06); font-weight: 600; line-height: 1.35; display: none; }
      [data-real-sync-box][data-debug-open="true"] [data-v4-debug-panel] { display: block; }
      @media (max-width: 720px) { [data-real-sync-box] { left: 12px; right: 12px; bottom: 12px; } }
    `;
    document.head.appendChild(style);
    const box = document.createElement('div');
    box.dataset.realSyncBox = 'true';
    box.innerHTML = `
      <span data-real-sync-status data-status="idle">GrowthPack API + Mídia prontos</span>
      <button type="button" data-real-sync-current>Atualizar cliente</button>
      <button type="button" data-real-sync-all>Atualizar todos</button>
      <button type="button" data-v4-debug-toggle>Debug</button>
      <button type="button" data-v4-clear-cache>Limpar cache</button>
      <div data-v4-debug-panel><div data-v4-debug-list></div></div>
    `;
    document.body.appendChild(box);
    logDebug('sync_panel_ready', 'Painel de sync CRM + mídia carregado e listener ativo.');
    paintDebug();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', injectManualSync);
  else injectManualSync();

  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-real-sync-current]')) {
      const clientId = getCurrentClientId();
      logDebug('click_update_client', `Clique recebido. Cliente detectado: ${clientId}`);
      runSync(clientId);
    }
    if (event.target.closest('[data-real-sync-all]')) {
      logDebug('click_update_all', 'Clique recebido. Iniciando fila segura de todos os clientes.');
      runSyncAll();
    }
    if (event.target.closest('[data-v4-clear-cache]')) clearLocalCache();
    if (event.target.closest('[data-v4-debug-toggle]')) {
      const box = document.querySelector('[data-real-sync-box]');
      if (box) box.dataset.debugOpen = box.dataset.debugOpen === 'true' ? 'false' : 'true';
      logDebug('debug_toggle', 'Painel de debug alternado.');
      paintDebug();
    }
  });

  window.addEventListener('error', (event) => logDebug('window_error', event.message));
  window.addEventListener('unhandledrejection', (event) => logDebug('promise_error', event.reason?.message || String(event.reason)));
  window.V4_REAL_DATA_SYNC = { runSync, runSyncAll, syncClientGrowthPack, syncClientPerformance, clearLocalCache, clients: SYNCABLE_CLIENTS, alternativeSources: ALTERNATIVE_SOURCE_CLIENTS, debug: logDebug };
})();
