(function () {
  if (!window.V4_EKYTE) return;

  const PANEL_ID = 'v4-ekyte-sync-panel';

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  }

  function currentClientId() {
    return document.querySelector('.client-btn.active')?.dataset.client || null;
  }

  function isTasksPage() {
    return [...document.querySelectorAll('h2')].some((el) => /Tasks Atuais/i.test(el.textContent || ''));
  }

  function isSettingsPage() {
    return [...document.querySelectorAll('h1')].some((el) => /Configurações Gerais|Configuracoes Gerais/i.test(el.textContent || ''));
  }

  function panelHtml(context) {
    const config = window.V4_EKYTE.getConfig();
    const isTasks = context === 'tasks';
    return `
      <article class="glass-card span-12" id="${PANEL_ID}">
        <div class="source-panel">
          <div>
            <p class="eyebrow">eKyte Data-Driven</p>
            <h2>Integração operacional eKyte</h2>
            <p class="muted">Uso no Command Center: importar tasks, Gantt, responsáveis, prazos, status e plano de ação. Performance de campanhas e redes sociais continua vindo das fontes de mídia/Sheets.</p>
            <div class="client-tags">
              <span class="badge ok">Empresa ${escapeHtml(config.companyId || '7773')}</span>
              <span class="badge client">Modo ${escapeHtml(config.mode || 'proxy')}</span>
              <span class="badge warn">Execução, não BI de mídia</span>
            </div>
          </div>
          <div class="source-actions">
            ${isTasks ? `<button class="btn primary" data-ekyte-sync-current>Sincronizar eKyte deste cliente</button>` : ''}
            <button class="btn ghost" data-ekyte-sync-all>Sincronizar eKyte geral</button>
          </div>
        </div>
        <form class="form-grid" data-ekyte-config style="margin-top:16px">
          <label class="form-field"><span>ID Empresa</span><input name="companyId" value="${escapeHtml(config.companyId || '7773')}" /></label>
          <label class="form-field"><span>Proxy/N8N</span><input name="proxyUrl" value="${escapeHtml(config.proxyUrl || '/api/ekyte')}" /></label>
          <label class="form-field"><span>Modo</span><input name="mode" value="${escapeHtml(config.mode || 'proxy')}" placeholder="proxy" /></label>
          <label class="form-field"><span>Base URL direta (teste)</span><input name="apiBaseUrl" value="${escapeHtml(config.apiBaseUrl || '')}" placeholder="usar apenas se nao houver proxy" /></label>
          <div class="form-field"><label>&nbsp;</label><button class="btn small success" type="submit">Salvar config eKyte</button></div>
        </form>
        <div class="empty" data-ekyte-status style="margin-top:14px">Aguardando sincronização.</div>
      </article>
    `;
  }

  function injectPanel() {
    if (document.getElementById(PANEL_ID)) return;

    const grid = document.querySelector('.dashboard-grid');
    if (!grid) return;

    if (isTasksPage()) {
      grid.insertAdjacentHTML('afterbegin', panelHtml('tasks'));
      return;
    }

    if (isSettingsPage()) {
      grid.insertAdjacentHTML('beforeend', panelHtml('settings'));
    }
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
      const result = options?.clientId
        ? await window.V4_EKYTE.sync({ clientId: options.clientId })
        : await window.V4_EKYTE.syncAll();
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

  document.addEventListener('submit', (event) => {
    const form = event.target.closest('form[data-ekyte-config]');
    if (!form) return;
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    window.V4_EKYTE.saveConfig({
      companyId: String(data.companyId || '7773').trim(),
      proxyUrl: String(data.proxyUrl || '/api/ekyte').trim(),
      mode: String(data.mode || 'proxy').trim(),
      apiBaseUrl: String(data.apiBaseUrl || '').trim()
    });
    setStatus('Configuração eKyte salva.', true);
  });

  const observer = new MutationObserver(() => injectPanel());
  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener('load', injectPanel);
  setTimeout(injectPanel, 300);
})();
