// Sistema de auto-atualização a cada 1 minuto
(function () {
  const REFRESH_INTERVAL = 60 * 1000; // 1 minuto
  const LAST_REFRESH_KEY = 'v4-last-refresh-timestamp';
  const REFRESH_STATUS_KEY = 'v4-refresh-status';

  let refreshIntervalId = null;

  // ==================== AUTO-REFRESH LOGIC ====================
  async function triggerRefresh() {
    const lastRefresh = localStorage.getItem(LAST_REFRESH_KEY);
    const now = Date.now();
    const elapsed = lastRefresh ? now - parseInt(lastRefresh, 10) : REFRESH_INTERVAL;

    if (elapsed >= REFRESH_INTERVAL) {
      try {
        localStorage.setItem(REFRESH_STATUS_KEY, 'syncing');
        updateRefreshStatus('syncing');

        // Simular refresh de dados
        // Em produção, aqui você chamaria as APIs de sincronização
        await new Promise(resolve => setTimeout(resolve, 500));

        // Recarregar estado e aplicar filtros
        if (window.V4_FILTER_ENGINE?.applyFilters) {
          window.V4_FILTER_ENGINE.applyFilters();
        }

        localStorage.setItem(LAST_REFRESH_KEY, String(now));
        localStorage.setItem(REFRESH_STATUS_KEY, 'synced');
        updateRefreshStatus('synced');

        // Resetar status após 3 segundos
        setTimeout(() => {
          localStorage.setItem(REFRESH_STATUS_KEY, 'idle');
          updateRefreshStatus('idle');
        }, 3000);

      } catch (error) {
        console.error('[Auto-Refresh] Erro:', error);
        localStorage.setItem(REFRESH_STATUS_KEY, 'error');
        updateRefreshStatus('error');
      }
    }
  }

  function updateRefreshStatus(status) {
    const indicator = document.querySelector('[data-refresh-indicator]');
    if (!indicator) return;

    indicator.dataset.status = status;
    const icon = indicator.querySelector('[data-refresh-icon]');
    const time = indicator.querySelector('[data-refresh-time]');

    if (icon) {
      icon.textContent = status === 'syncing' ? '↻' : status === 'synced' ? '✓' : status === 'error' ? '✕' : '○';
      icon.style.opacity = status === 'syncing' ? '1' : '0.6';
      if (status === 'syncing') {
        icon.style.animation = 'spin 1s linear infinite';
      } else {
        icon.style.animation = 'none';
      }
    }

    if (time) {
      time.textContent = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
  }

  function startAutoRefresh() {
    if (refreshIntervalId) return; // Já está rodando

    refreshIntervalId = setInterval(() => {
      triggerRefresh();
    }, 1000); // Verificar a cada 1 segundo se passou 1 minuto

    // Primeira verificação imediata
    triggerRefresh();

    console.log('[Auto-Refresh] Sistema iniciado - atualizar a cada 1 minuto');
  }

  function stopAutoRefresh() {
    if (refreshIntervalId) {
      clearInterval(refreshIntervalId);
      refreshIntervalId = null;
      console.log('[Auto-Refresh] Sistema parado');
    }
  }

  // ==================== REFRESH INDICATOR UI ====================
  function injectRefreshIndicator() {
    if (document.querySelector('[data-refresh-indicator]')) return; // Já injetado

    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      [data-refresh-indicator] {
        position: fixed;
        bottom: 20px;
        right: 20px;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 14px;
        background: rgba(20, 20, 30, 0.9);
        border: 1px solid rgba(100, 150, 255, 0.3);
        border-radius: 6px;
        font-size: 12px;
        color: #888;
        backdrop-filter: blur(10px);
        z-index: 9999;
        font-family: monospace;
      }

      [data-refresh-indicator][data-status="syncing"] {
        border-color: rgba(255, 200, 0, 0.5);
        color: #ffaa00;
      }

      [data-refresh-indicator][data-status="synced"] {
        border-color: rgba(100, 200, 100, 0.5);
        color: #66dd88;
      }

      [data-refresh-indicator][data-status="error"] {
        border-color: rgba(255, 100, 100, 0.5);
        color: #ff6666;
      }

      [data-refresh-icon] {
        font-weight: bold;
        font-size: 13px;
      }

      [data-refresh-time] {
        opacity: 0.8;
      }
    `;
    document.head.appendChild(style);

    const indicator = document.createElement('div');
    indicator.dataset.refreshIndicator = 'true';
    indicator.dataset.status = 'idle';
    indicator.innerHTML = `
      <span data-refresh-icon>○</span>
      <span data-refresh-time>--:--:--</span>
      <span>Auto-sync</span>
    `;
    document.body.appendChild(indicator);
  }

  // ==================== INITIALIZATION ====================
  document.addEventListener('DOMContentLoaded', () => {
    injectRefreshIndicator();
    startAutoRefresh();
  });

  // Limpar ao descarregar
  window.addEventListener('beforeunload', stopAutoRefresh);

  // Exportar para uso global
  window.V4_AUTO_REFRESH = {
    startAutoRefresh,
    stopAutoRefresh,
    triggerRefresh,
    updateRefreshStatus
  };
})();
