(function () {
  if (!window.V4_EKYTE) return;

  const PANEL_ID = 'v4-ekyte-sync-panel';

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  }

  function currentClientId() {
    return document.querySelector('.client-btn.active')?.dataset.client || null;
  }

  function currentBinding() {
    const clientId = currentClientId();
    return clientId ? window.V4_EKYTE.getClientBinding?.(clientId) || window.V4_EKYTE_CLIENT_BINDINGS?.[clientId] : null;
  }

  function isTasksPage() {
    return [...document.querySelectorAll('h2')].some((el) => /Tasks Atuais/i.test(el.textContent || ''));
  }

  function panelHtml() {
    const binding = currentBinding();
    const workspaceId = binding?.workspaceId || binding?.idWorkspaceEkyte || '-';
    const projectId = binding?.projectId || binding?.idProjetoEkyte || '-';
    return `
      <article class="glass-card span-12" id="${PANEL_ID}">
        <div class="source-panel">
          <div>
            <p class="eyebrow">eKyte</p>
            <h2>Tasks do projeto eKyte</h2>
            <p class="muted">Sincronização operacional filtrada pelo workspace e pelo projeto oficial deste cliente.</p>
            <div class="client-tags">
              <span class="badge client">Workspace ${escapeHtml(workspaceId)}</span>
              <span class="badge client">Projeto ${escapeHtml(projectId)}</span>
              <span class="badge ok">Tasks por cliente/projeto</span>
            </div>
          </div>
          <div class="source-actions">
            <button class="btn primary" data-ekyte-sync-current>Sincronizar eKyte deste cliente</button>
            <button class="btn ghost" data-ekyte-sync-all>Sincronizar eKyte geral</button>
          </div>
        </div>
        <div class="empty" data-ekyte-status style="margin-top:14px">Aguardando sincronização.</div>
      </article>
    `;
  }

  function injectPanel() {
    const old = document.getElementById(PANEL_ID);
    if (old) old.remove();
    if (!isTasksPage()) return;
    const grid = document.querySelector('.dashboard-grid');
    if (!grid) return;
    grid.insertAdjacentHTML('afterbegin', panelHtml());
  }

  function setStatus(message, ok) {
    const status = document.querySelector('[data-ekyte-status]');
    if (!status) return;
    status.textContent = message;
    status.style.borderColor = ok ? 'rgba(18,216,66,.35)' : 'rgba(255,189,46,.35)';
  }

  async function runSync(options) {
    try {
      setStatus('Sincronizando eKyte...', true);
      const result = options?.clientId ? await window.V4_EKYTE.sync({ clientId: options.clientId }) : await window.V4_EKYTE.syncAll();
      setStatus(`eKyte sincronizado: ${result.synced || 0} tasks importadas. Recarregando painel...`, true);
      setTimeout(() => window.location.reload(), 900);
    } catch (error) {
      console.error(error);
      setStatus(`Erro ao sincronizar eKyte: ${error.message}`, false);
    }
  }

  document.addEventListener('click', (event) => {
    const current = event.target.closest('[data-ekyte-sync-current]');
    if (current) {
      event.preventDefault();
      return runSync({ clientId: currentClientId() });
    }
    const all = event.target.closest('[data-ekyte-sync-all]');
    if (all) {
      event.preventDefault();
      return runSync({});
    }
  });

  const observer = new MutationObserver(() => {
    clearTimeout(window.__v4EkyteUiTimer);
    window.__v4EkyteUiTimer = setTimeout(injectPanel, 120);
  });
  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener('load', injectPanel);
  setTimeout(injectPanel, 300);
})();
