(function () {
  const PANEL_ID = 'v4-drive-live-panel';

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[char]));
  }

  function bootLog(type, message) {
    if (window.V4_BOOT_LOG) window.V4_BOOT_LOG(type, message);
  }

  function styles() {
    if (document.getElementById('v4-drive-live-style')) return;
    const style = document.createElement('style');
    style.id = 'v4-drive-live-style';
    style.textContent = `
      .v4-drive-live-launcher{position:fixed;right:18px;bottom:18px;z-index:2147483000;border:0;border-radius:999px;padding:12px 16px;background:#cf1022;color:#fff;font:900 13px system-ui;box-shadow:0 18px 50px rgba(0,0,0,.35);cursor:pointer;letter-spacing:.02em}
      .v4-drive-live-panel{position:fixed;right:18px;bottom:76px;width:min(960px,calc(100vw - 36px));max-height:min(760px,calc(100vh - 110px));z-index:2147482999;background:rgba(12,14,20,.98);border:1px solid rgba(255,255,255,.14);border-radius:22px;color:#fff;box-shadow:0 24px 80px rgba(0,0,0,.45);display:none;overflow:hidden;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
      .v4-drive-live-panel.open{display:block}
      .v4-drive-live-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:18px 18px 12px;border-bottom:1px solid rgba(255,255,255,.1)}
      .v4-drive-live-head h2{margin:0;font-size:18px}.v4-drive-live-head p{margin:4px 0 0;color:#a9b0c2;font-size:12px}
      .v4-drive-live-close{border:0;border-radius:999px;background:rgba(255,255,255,.1);color:#fff;padding:8px 10px;cursor:pointer;font-weight:900}
      .v4-drive-live-body{padding:16px;display:grid;gap:14px;grid-template-columns:280px 1fr;max-height:650px;overflow:auto}
      .v4-drive-live-card{background:rgba(255,255,255,.055);border:1px solid rgba(255,255,255,.1);border-radius:16px;padding:14px}
      .v4-drive-live-field{display:flex;flex-direction:column;gap:6px;margin-bottom:10px}.v4-drive-live-field label{font-size:11px;color:#a9b0c2;font-weight:800;text-transform:uppercase}.v4-drive-live-field input,.v4-drive-live-field select{width:100%;box-sizing:border-box;border:1px solid rgba(255,255,255,.16);background:rgba(0,0,0,.25);color:#fff;border-radius:12px;padding:10px;font:700 13px system-ui}
      .v4-drive-live-actions{display:flex;gap:8px;flex-wrap:wrap}.v4-drive-live-actions button,.v4-drive-live-btn{border:0;border-radius:12px;padding:10px 12px;font:900 12px system-ui;cursor:pointer;background:#cf1022;color:#fff}.v4-drive-live-actions button.secondary,.v4-drive-live-btn.secondary{background:rgba(255,255,255,.1);color:#fff}
      .v4-drive-live-status{margin-top:10px;font-size:12px;color:#a9b0c2;line-height:1.4}.v4-drive-live-status.error{color:#ff8585}.v4-drive-live-status.ok{color:#7ee787}
      .v4-drive-live-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:12px}.v4-drive-live-kpi{background:rgba(255,255,255,.06);border-radius:14px;padding:12px}.v4-drive-live-kpi small{display:block;color:#a9b0c2;font-size:11px}.v4-drive-live-kpi strong{font-size:18px}
      .v4-drive-live-table{overflow:auto;max-height:420px;border-radius:14px;border:1px solid rgba(255,255,255,.09)}.v4-drive-live-table table{width:100%;border-collapse:collapse;font-size:12px;min-width:720px}.v4-drive-live-table th,.v4-drive-live-table td{padding:9px 10px;border-bottom:1px solid rgba(255,255,255,.07);text-align:left;vertical-align:top}.v4-drive-live-table th{position:sticky;top:0;background:#171923;color:#d9deea;z-index:1}.v4-drive-live-table td{color:#eef2ff}.v4-drive-live-muted{color:#a9b0c2;font-size:12px}.v4-drive-live-warning{background:rgba(255,204,0,.08);border:1px solid rgba(255,204,0,.18);color:#ffe08a;border-radius:14px;padding:10px;font-size:12px;margin-top:10px}
      @media(max-width:780px){.v4-drive-live-body{grid-template-columns:1fr}.v4-drive-live-summary{grid-template-columns:1fr}.v4-drive-live-panel{right:8px;bottom:68px;width:calc(100vw - 16px)}}
    `;
    document.head.appendChild(style);
  }

  function panelTemplate() {
    return `
      <button class="v4-drive-live-launcher" type="button" data-drive-live-toggle>Drive Live</button>
      <section class="v4-drive-live-panel" id="${PANEL_ID}" aria-live="polite">
        <header class="v4-drive-live-head">
          <div>
            <h2>Drive Live • GrowthPack</h2>
            <p>Consulta ao vivo das planilhas cadastradas. Não salva leads/tarefas no Supabase.</p>
          </div>
          <button class="v4-drive-live-close" type="button" data-drive-live-close>×</button>
        </header>
        <div class="v4-drive-live-body">
          <aside class="v4-drive-live-card">
            <div class="v4-drive-live-field">
              <label>E-mail Supabase</label>
              <input type="email" data-drive-live-email placeholder="seu.email@v4company.com" value="vinicius.agnes@v4company.com" />
            </div>
            <div class="v4-drive-live-actions">
              <button type="button" data-drive-live-login>Login magic link</button>
              <button type="button" class="secondary" data-drive-live-session>Checar sessão</button>
            </div>
            <div class="v4-drive-live-status" data-drive-live-auth-status>Informe o e-mail e faça login para consultar.</div>
            <hr style="border:0;border-top:1px solid rgba(255,255,255,.1);margin:14px 0" />
            <div class="v4-drive-live-field">
              <label>Cliente</label>
              <select data-drive-live-client><option value="">Carregar clientes</option></select>
            </div>
            <div class="v4-drive-live-field">
              <label>Fonte / Aba</label>
              <select data-drive-live-source><option value="">Selecione uma fonte</option></select>
            </div>
            <div class="v4-drive-live-field">
              <label>Limite de linhas</label>
              <input type="number" min="10" max="2000" value="500" data-drive-live-limit />
            </div>
            <div class="v4-drive-live-actions">
              <button type="button" data-drive-live-load>Carregar fontes</button>
              <button type="button" class="secondary" data-drive-live-read>Ler aba</button>
            </div>
            <div class="v4-drive-live-warning">Fonte oficial: Google Sheets/GrowthPack. O Supabase guarda apenas metadados da fonte.</div>
          </aside>
          <main class="v4-drive-live-card">
            <div data-drive-live-output>
              <p class="v4-drive-live-muted">Nenhuma aba carregada ainda.</p>
            </div>
          </main>
        </div>
      </section>
    `;
  }

  function getEls(root) {
    return {
      panel: root.querySelector(`#${PANEL_ID}`),
      toggle: root.querySelector('[data-drive-live-toggle]'),
      close: root.querySelector('[data-drive-live-close]'),
      email: root.querySelector('[data-drive-live-email]'),
      login: root.querySelector('[data-drive-live-login]'),
      session: root.querySelector('[data-drive-live-session]'),
      authStatus: root.querySelector('[data-drive-live-auth-status]'),
      client: root.querySelector('[data-drive-live-client]'),
      source: root.querySelector('[data-drive-live-source]'),
      limit: root.querySelector('[data-drive-live-limit]'),
      load: root.querySelector('[data-drive-live-load]'),
      read: root.querySelector('[data-drive-live-read]'),
      output: root.querySelector('[data-drive-live-output]')
    };
  }

  function setStatus(el, message, type) {
    el.textContent = message;
    el.className = `v4-drive-live-status ${type || ''}`;
  }

  function renderTable(payload) {
    const rows = payload.rows || [];
    const summary = payload.summary || {};
    const headers = summary.headers || Object.keys(rows[0] || {}).filter((key) => key !== 'raw');
    const visibleHeaders = headers.slice(0, 10);
    return `
      <div class="v4-drive-live-summary">
        <div class="v4-drive-live-kpi"><small>Linhas lidas</small><strong>${escapeHtml(payload.rows_read || 0)}</strong></div>
        <div class="v4-drive-live-kpi"><small>Linhas exibidas</small><strong>${escapeHtml(payload.rows_returned || 0)}</strong></div>
        <div class="v4-drive-live-kpi"><small>Modo</small><strong>Live</strong></div>
      </div>
      <p class="v4-drive-live-muted">Dados renderizados ao vivo. Nenhuma linha foi persistida no Supabase.</p>
      <div class="v4-drive-live-table">
        <table>
          <thead><tr>${visibleHeaders.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr></thead>
          <tbody>
            ${rows.map((row) => `<tr>${visibleHeaders.map((header) => `<td>${escapeHtml(row[header] ?? '')}</td>`).join('')}</tr>`).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  async function init() {
    if (document.getElementById(PANEL_ID)) return;
    if (!window.V4_DRIVE_LIVE) {
      bootLog('drive_live_panel_error', 'Servico V4_DRIVE_LIVE ausente.');
      return;
    }

    styles();
    const mount = document.createElement('div');
    mount.innerHTML = panelTemplate();
    document.body.appendChild(mount);
    const els = getEls(mount);

    els.toggle.addEventListener('click', () => els.panel.classList.toggle('open'));
    els.close.addEventListener('click', () => els.panel.classList.remove('open'));

    els.login.addEventListener('click', async () => {
      try {
        await window.V4_DRIVE_LIVE.signInWithEmail(els.email.value.trim());
        setStatus(els.authStatus, 'Magic link enviado. Confirme no e-mail e volte ao painel.', 'ok');
      } catch (error) {
        setStatus(els.authStatus, error.message, 'error');
      }
    });

    els.session.addEventListener('click', async () => {
      try {
        const session = await window.V4_DRIVE_LIVE.getSession();
        setStatus(els.authStatus, session ? `Sessao ativa: ${session.user?.email || 'usuario autenticado'}` : 'Sem sessao ativa.', session ? 'ok' : 'error');
      } catch (error) {
        setStatus(els.authStatus, error.message, 'error');
      }
    });

    async function loadSources() {
      const clientsPayload = await window.V4_DRIVE_LIVE.panelClients();
      const clients = clientsPayload.data || [];
      els.client.innerHTML = '<option value="">Todos os clientes</option>' + clients.map((client) => `<option value="${escapeHtml(client.client_id)}">${escapeHtml(client.client_name)} (${escapeHtml(client.growthpack_sources_count || 0)})</option>`).join('');

      const selectedClientId = els.client.value || '';
      const sourcesPayload = await window.V4_DRIVE_LIVE.panelSources(selectedClientId);
      const sources = sourcesPayload.data || [];
      els.source.innerHTML = '<option value="">Selecione uma fonte</option>' + sources.map((source) => `<option value="${escapeHtml(source.source_id)}">${escapeHtml(source.client_name)} • ${escapeHtml(source.source_name)}</option>`).join('');
      els.output.innerHTML = `<p class="v4-drive-live-muted">${sources.length} fontes GrowthPack disponíveis.</p>`;
    }

    els.load.addEventListener('click', async () => {
      try {
        els.output.innerHTML = '<p class="v4-drive-live-muted">Carregando fontes...</p>';
        await loadSources();
      } catch (error) {
        els.output.innerHTML = `<p class="v4-drive-live-status error">${escapeHtml(error.message)}</p>`;
      }
    });

    els.client.addEventListener('change', async () => {
      try {
        const sourcesPayload = await window.V4_DRIVE_LIVE.panelSources(els.client.value || '');
        const sources = sourcesPayload.data || [];
        els.source.innerHTML = '<option value="">Selecione uma fonte</option>' + sources.map((source) => `<option value="${escapeHtml(source.source_id)}">${escapeHtml(source.client_name)} • ${escapeHtml(source.source_name)}</option>`).join('');
      } catch (error) {
        els.output.innerHTML = `<p class="v4-drive-live-status error">${escapeHtml(error.message)}</p>`;
      }
    });

    els.read.addEventListener('click', async () => {
      try {
        const sourceId = els.source.value;
        if (!sourceId) throw new Error('Selecione uma fonte GrowthPack.');
        els.output.innerHTML = '<p class="v4-drive-live-muted">Lendo Google Sheets ao vivo...</p>';
        const payload = await window.V4_DRIVE_LIVE.readSource(sourceId, { limit: Number(els.limit.value || 500) });
        els.output.innerHTML = renderTable(payload);
      } catch (error) {
        els.output.innerHTML = `<p class="v4-drive-live-status error">${escapeHtml(error.message)}</p>`;
      }
    });

    bootLog('drive_live_panel', 'Painel Drive Live montado.');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
