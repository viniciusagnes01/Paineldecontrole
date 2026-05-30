(function () {
  function bootLog(type, message) {
    if (window.V4_BOOT_LOG) window.V4_BOOT_LOG(type, message);
  }

  function loadAuthRedirectFix() {
    if (document.querySelector('script[data-v4-auth-redirect-fix]')) return;
    const script = document.createElement('script');
    script.src = 'src/services/auth-redirect-fix.js?v=auth-redirect-fix-20260530-01';
    script.defer = true;
    script.dataset.v4AuthRedirectFix = 'true';
    document.head.appendChild(script);
  }

  loadAuthRedirectFix();

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, function (char) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char];
    });
  }

  function waitForPanel(attempt) {
    attempt = attempt || 0;
    const panel = document.getElementById('v4-drive-live-panel');
    if (panel && window.V4_GROWTHPACK_BLOCK_ROUTER && window.V4_DRIVE_LIVE) {
      enhance(panel);
      return;
    }
    if (attempt < 80) window.setTimeout(function () { waitForPanel(attempt + 1); }, 250);
  }

  function blockOptions() {
    const blocks = window.V4_GROWTHPACK_BLOCK_ROUTER?.blocks || [];
    return '<option value="">Todos os blocos</option>' + blocks.map(function (block) {
      return '<option value="' + escapeHtml(block.key) + '">' + escapeHtml(block.label) + '</option>';
    }).join('');
  }

  function sourceRows(sources) {
    return '<div class="v4-drive-live-table"><table><thead><tr><th>Cliente</th><th>Bloco</th><th>Aba</th><th>GID</th></tr></thead><tbody>' +
      sources.slice(0, 100).map(function (source) {
        return '<tr><td>' + escapeHtml(source.client_name) + '</td><td>' + escapeHtml((source.block_labels || []).join(', ') || '-') + '</td><td>' + escapeHtml(source.source_name || source.sheet_name || '-') + '</td><td>' + escapeHtml(source.gid || '-') + '</td></tr>';
      }).join('') +
      '</tbody></table></div>';
  }

  function enhance(panel) {
    if (panel.dataset.driveLiveFiltersEnhanced === 'true') return;
    panel.dataset.driveLiveFiltersEnhanced = 'true';

    const sourceSelect = panel.querySelector('[data-drive-live-source]');
    const clientSelect = panel.querySelector('[data-drive-live-client]');
    const output = panel.querySelector('[data-drive-live-output]');
    const loadButton = panel.querySelector('[data-drive-live-load]');
    const readButton = panel.querySelector('[data-drive-live-read]');

    if (!sourceSelect || !clientSelect || !output || !loadButton) return;

    const sourceField = sourceSelect.closest('.v4-drive-live-field');
    const blockField = document.createElement('div');
    blockField.className = 'v4-drive-live-field';
    blockField.innerHTML = '<label>Bloco do painel</label><select data-drive-live-block-filter>' + blockOptions() + '</select>';
    sourceField.insertAdjacentElement('beforebegin', blockField);

    const searchField = document.createElement('div');
    searchField.className = 'v4-drive-live-field';
    searchField.innerHTML = '<label>Filtro livre</label><input type="search" data-drive-live-search-filter placeholder="Ex.: BASE_CRM, Meta, FCA, DRE..." />';
    blockField.insertAdjacentElement('afterend', searchField);

    const blockSelect = panel.querySelector('[data-drive-live-block-filter]');
    const searchInput = panel.querySelector('[data-drive-live-search-filter]');

    async function applyFilters() {
      output.innerHTML = '<p class="v4-drive-live-muted">Aplicando filtros por cliente, bloco e aba...</p>';
      if (!clientSelect.options.length || clientSelect.options[0].textContent === 'Carregar clientes') {
        const clientsPayload = await window.V4_DRIVE_LIVE.panelClients();
        const clients = clientsPayload.data || [];
        clientSelect.innerHTML = '<option value="">Todos os clientes</option>' + clients.map(function (client) {
          return '<option value="' + escapeHtml(client.client_id) + '">' + escapeHtml(client.client_name) + ' (' + escapeHtml(client.growthpack_sources_count || 0) + ')</option>';
        }).join('');
      }

      const filters = {
        clientId: clientSelect.value || '',
        blockKey: blockSelect.value || '',
        search: searchInput.value || ''
      };
      const payload = await window.V4_GROWTHPACK_BLOCK_ROUTER.loadSources(filters);
      const sources = payload.data || [];
      sourceSelect.innerHTML = '<option value="">Selecione uma fonte</option>' + sources.map(function (source) {
        return '<option value="' + escapeHtml(source.source_id) + '">' + escapeHtml(source.client_name) + ' • ' + escapeHtml(source.source_name || source.sheet_name || '-') + ' • ' + escapeHtml((source.block_labels || []).join('/')) + '</option>';
      }).join('');
      output.innerHTML = '<div class="v4-drive-live-summary"><div class="v4-drive-live-kpi"><small>Fontes filtradas</small><strong>' + sources.length + '</strong></div><div class="v4-drive-live-kpi"><small>Persistência</small><strong>0 linhas</strong></div><div class="v4-drive-live-kpi"><small>Modo</small><strong>Live</strong></div></div>' + sourceRows(sources);
    }

    loadButton.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopImmediatePropagation();
      applyFilters().catch(function (error) {
        output.innerHTML = '<p class="v4-drive-live-status error">' + escapeHtml(error.message) + '</p>';
      });
    }, true);

    [clientSelect, blockSelect].forEach(function (field) {
      field.addEventListener('change', function () {
        applyFilters().catch(function (error) {
          output.innerHTML = '<p class="v4-drive-live-status error">' + escapeHtml(error.message) + '</p>';
        });
      });
    });

    searchInput.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        applyFilters().catch(function (error) {
          output.innerHTML = '<p class="v4-drive-live-status error">' + escapeHtml(error.message) + '</p>';
        });
      }
    });

    if (readButton) {
      readButton.title = 'Ler a aba filtrada ao vivo, sem gravar leads ou tarefas no Supabase.';
    }

    bootLog('drive_live_filters', 'Filtros cliente + bloco + aba aplicados ao Drive Live.');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { waitForPanel(0); });
  } else {
    waitForPanel(0);
  }
})();
