(function () {
  const SUPABASE_URL = 'https://pptxhpmnojsldcjajxxc.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_N2mH6E8wh6QzsrWU8bkQPQ_wS-XjdVd';
  const DRIVE_LIVE_ENDPOINT = `${SUPABASE_URL}/functions/v1/drive-live`;

  let client = null;

  function bootLog(type, message) {
    if (window.V4_BOOT_LOG) window.V4_BOOT_LOG(type, message);
  }

  function ensureClient() {
    if (client) return client;

    if (!window.supabase || !window.supabase.createClient) {
      throw new Error('Supabase SDK nao carregado. Verifique o script @supabase/supabase-js no index.html.');
    }

    client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });

    return client;
  }

  async function getSession() {
    const supabaseClient = ensureClient();
    const { data, error } = await supabaseClient.auth.getSession();
    if (error) throw error;
    return data.session || null;
  }

  async function signInWithEmail(email) {
    if (!email) throw new Error('Informe um e-mail para login.');
    const supabaseClient = ensureClient();
    const { data, error } = await supabaseClient.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin + window.location.pathname
      }
    });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    const supabaseClient = ensureClient();
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;
    return true;
  }

  async function request(action, options = {}) {
    const session = await getSession();
    if (!session?.access_token) {
      throw new Error('Sessao Supabase ausente. Faca login para consultar o Drive Live.');
    }

    const method = options.method || 'GET';
    const url = new URL(DRIVE_LIVE_ENDPOINT);
    url.searchParams.set('action', action);

    if (options.query) {
      Object.entries(options.query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
      });
    }

    const response = await fetch(url.toString(), {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`
      },
      body: method === 'POST' ? JSON.stringify(options.body || {}) : undefined
    });

    const text = await response.text();
    const payload = text ? JSON.parse(text) : {};

    if (!response.ok || payload.ok === false) {
      throw new Error(payload.error || payload.message || `Erro HTTP ${response.status}`);
    }

    return payload;
  }

  async function status() {
    return request('status');
  }

  async function panelClients() {
    return request('panel-clients');
  }

  async function panelSources(clientId) {
    return request('panel-sources', {
      query: clientId ? { client_id: clientId } : undefined
    });
  }

  async function readSource(sourceId, options = {}) {
    if (!sourceId) throw new Error('source_id obrigatorio para leitura.');
    return request('read', {
      method: 'POST',
      body: {
        source_id: sourceId,
        limit: options.limit || 500,
        responseMode: options.responseMode || 'rows'
      }
    });
  }

  function loadAuthGateAssets() {
    if (!document.querySelector('link[data-v4-auth-gate]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'src/services/auth-gate.css?v=auth-gate-20260530-01';
      link.dataset.v4AuthGate = 'true';
      document.head.appendChild(link);
    }

    if (!document.querySelector('script[data-v4-auth-gate]')) {
      const script = document.createElement('script');
      script.src = 'src/services/auth-gate.js?v=auth-gate-20260530-01';
      script.defer = true;
      script.dataset.v4AuthGate = 'true';
      document.body.appendChild(script);
    }
  }

  window.V4_DRIVE_LIVE = {
    ensureClient,
    getSession,
    signInWithEmail,
    signOut,
    status,
    panelClients,
    panelSources,
    readSource,
    endpoint: DRIVE_LIVE_ENDPOINT,
    storesRowsInSupabase: false
  };

  bootLog('drive_live', 'Servico Supabase Drive Live carregado.');
  loadAuthGateAssets();
})();
