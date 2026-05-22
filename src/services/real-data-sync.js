// Atualização manual de dados reais. Substitui o antigo auto-sync em intervalo.
(function () {
  const STORAGE_KEY = 'v4-command-center-state-v6-crm-performance-losses';
  const SYNCABLE_CLIENTS = ['espaco-master', 'st1-internet'];

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

  async function runSync(clientId) {
    if (!window.V4_COMMUNICATION_BASE) {
      setStatus('Serviço de comunicação não carregado', 'error');
      return;
    }

    const state = readState();
    const targets = clientId ? [clientId] : SYNCABLE_CLIENTS;
    setStatus(clientId ? `Atualizando ${clientId}...` : 'Atualizando bases reais...', 'syncing');

    const results = [];
    for (const target of targets) {
      results.push(await window.V4_COMMUNICATION_BASE.syncClientBase(target, state, { fetchRemote: true }));
    }

    const ok = results.filter((item) => item.ok).length;
    const fallback = results.filter((item) => item.ok && !item.fromBackend).length;
    const failed = results.filter((item) => !item.ok).length;

    writeState(state);

    if (failed) setStatus(`${ok} ok, ${failed} falha(s)`, 'error');
    else if (fallback) setStatus(`${ok} ok via base verificada`, 'warn');
    else setStatus(`${ok} ok via backend`, 'ok');
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
        background: linear-gradient(135deg, #cf1022, #700814);
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
      <span data-real-sync-status data-status="idle">Atualização manual</span>
      <button type="button" data-real-sync-current>Atualizar cliente</button>
      <button type="button" data-real-sync-all>Atualizar bases</button>
    `;
    document.body.appendChild(box);
  }

  document.addEventListener('DOMContentLoaded', injectManualSync);
  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-real-sync-current]')) runSync(getCurrentClientId() || null);
    if (event.target.closest('[data-real-sync-all]')) runSync(null);
  });

  window.V4_REAL_DATA_SYNC = { runSync };
})();
