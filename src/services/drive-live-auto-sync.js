(function () {
  const STATE = {
    status: 'idle',
    startedAt: null,
    finishedAt: null,
    user: null,
    clients: [],
    sources: [],
    byClient: {},
    byClientBlock: {},
    errors: []
  };

  const BLOCK_KEYS = [
    'crm_funil',
    'fca',
    'leads_lp',
    'meta_ads',
    'google_ads',
    'analytics',
    'performance_mensal',
    'performance_semanal',
    'performance_diaria',
    'projecoes',
    'dre_financeiro',
    'produtos',
    'config_tecnica'
  ];

  function log(type, message) {
    if (window.V4_BOOT_LOG) window.V4_BOOT_LOG(type, message);
  }

  function hideDriveLiveUi() {
    if (document.getElementById('v4-drive-live-auto-sync-style')) return;
    const style = document.createElement('style');
    style.id = 'v4-drive-live-auto-sync-style';
    style.textContent = '.v4-drive-live-launcher,#v4-drive-live-panel{display:none!important;visibility:hidden!important;pointer-events:none!important}';
    document.head.appendChild(style);
  }

  function sourceKey(source) {
    return String(source.source_id || source.id || source.gid || source.source_name || source.sheet_name || '');
  }

  function uniqueSources(sources) {
    const seen = new Set();
    return (sources || []).filter(function (source) {
      const key = sourceKey(source);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function groupSources(clients, sources) {
    const byClient = {};
    const byClientBlock = {};

    clients.forEach(function (client) {
      byClient[client.client_id] = [];
      byClientBlock[client.client_id] = {};
      BLOCK_KEYS.forEach(function (blockKey) {
        byClientBlock[client.client_id][blockKey] = [];
      });
    });

    sources.forEach(function (source) {
      if (!byClient[source.client_id]) byClient[source.client_id] = [];
      byClient[source.client_id].push(source);
      if (!byClientBlock[source.client_id]) byClientBlock[source.client_id] = {};
      (source.block_keys || []).forEach(function (blockKey) {
        if (!byClientBlock[source.client_id][blockKey]) byClientBlock[source.client_id][blockKey] = [];
        byClientBlock[source.client_id][blockKey].push(source);
      });
    });

    STATE.byClient = byClient;
    STATE.byClientBlock = byClientBlock;
  }

  async function waitForDependencies(attempt) {
    attempt = attempt || 0;
    if (window.V4_DRIVE_LIVE && window.V4_GROWTHPACK_BLOCK_ROUTER) return true;
    if (attempt > 120) throw new Error('Drive Live ou GrowthPack Block Router não carregou.');
    await new Promise(function (resolve) { window.setTimeout(resolve, 250); });
    return waitForDependencies(attempt + 1);
  }

  async function waitForSession(attempt) {
    attempt = attempt || 0;
    const session = await window.V4_DRIVE_LIVE.getSession().catch(function () { return null; });
    if (session) return session;
    if (attempt > 120) throw new Error('Sessão Supabase ausente. Login obrigatório.');
    await new Promise(function (resolve) { window.setTimeout(resolve, 500); });
    return waitForSession(attempt + 1);
  }

  async function syncSourcesOnly() {
    STATE.status = 'syncing';
    STATE.startedAt = new Date().toISOString();
    STATE.finishedAt = null;
    STATE.errors = [];

    await waitForDependencies(0);
    const session = await waitForSession(0);
    STATE.user = {
      id: session.user?.id || null,
      email: session.user?.email || null,
      name: session.user?.user_metadata?.full_name || session.user?.user_metadata?.name || null,
      avatar_url: session.user?.user_metadata?.avatar_url || session.user?.user_metadata?.picture || null,
      provider: session.user?.app_metadata?.provider || null
    };

    const clientsPayload = await window.V4_DRIVE_LIVE.panelClients();
    const clients = clientsPayload.data || [];
    const sourceGroups = await Promise.all(clients.map(function (client) {
      return window.V4_GROWTHPACK_BLOCK_ROUTER.loadSources({ clientId: client.client_id }).catch(function (error) {
        STATE.errors.push({ client_id: client.client_id, client_name: client.client_name, error: error.message });
        return { data: [] };
      });
    }));

    const allSources = uniqueSources(sourceGroups.flatMap(function (group) { return group.data || []; }));
    STATE.clients = clients;
    STATE.sources = allSources;
    groupSources(clients, allSources);
    STATE.status = STATE.errors.length ? 'partial' : 'ready';
    STATE.finishedAt = new Date().toISOString();

    window.dispatchEvent(new CustomEvent('v4:growthpack:sources-ready', { detail: snapshot() }));
    log('drive_live_auto_sync', 'Fontes GrowthPack sincronizadas automaticamente: ' + allSources.length);
    return snapshot();
  }

  async function readClientBlock(clientId, blockKey, options) {
    options = options || {};
    if (STATE.status === 'idle' || STATE.status === 'syncing') await syncSourcesOnly();
    const sources = STATE.byClientBlock?.[clientId]?.[blockKey] || [];
    const source = sources[0];
    if (!source) throw new Error('Nenhuma fonte encontrada para este cliente/bloco.');
    const payload = await window.V4_DRIVE_LIVE.readSource(source.source_id, {
      limit: options.limit || 500,
      responseMode: options.responseMode || 'rows'
    });
    return {
      ...payload,
      source,
      block_key: blockKey,
      client_id: clientId,
      client_name: source.client_name
    };
  }

  async function readClientBlockSummary(clientId, blockKey) {
    return readClientBlock(clientId, blockKey, { limit: 1, responseMode: 'summary' });
  }

  function getClientSources(clientId) {
    return STATE.byClient?.[clientId] || [];
  }

  function getClientBlockSources(clientId, blockKey) {
    return STATE.byClientBlock?.[clientId]?.[blockKey] || [];
  }

  function snapshot() {
    return {
      status: STATE.status,
      startedAt: STATE.startedAt,
      finishedAt: STATE.finishedAt,
      user: STATE.user,
      clients: STATE.clients,
      sources: STATE.sources,
      byClient: STATE.byClient,
      byClientBlock: STATE.byClientBlock,
      errors: STATE.errors,
      storesRowsInSupabase: false
    };
  }

  async function start() {
    hideDriveLiveUi();
    try {
      await syncSourcesOnly();
    } catch (error) {
      STATE.status = 'error';
      STATE.errors.push({ error: error.message });
      log('drive_live_auto_sync_error', error.message);
    }
  }

  window.V4_DRIVE_LIVE_AUTO_SYNC = {
    start,
    syncSourcesOnly,
    readClientBlock,
    readClientBlockSummary,
    getClientSources,
    getClientBlockSources,
    snapshot,
    state: STATE,
    storesRowsInSupabase: false
  };

  hideDriveLiveUi();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
