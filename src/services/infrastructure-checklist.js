(function () {
  const STORAGE_KEY = 'v4-infrastructure-checklist-state-v1';
  const ENHANCED_ATTR = 'data-v4-infra-checklist-enhanced';

  const DEFAULT_ITEMS = [
    {
      id: 'landing-pages',
      title: 'Landing Pages',
      area: 'Aquisição',
      description: 'LPs cadastradas, URLs revisadas, status monitorado, velocidade acompanhada e conversão visível no painel.'
    },
    {
      id: 'crm',
      title: 'CRM',
      area: 'Comercial',
      description: 'Funil conectado, responsáveis definidos, campos obrigatórios validados e perdas rastreáveis.'
    },
    {
      id: 'evolution-api',
      title: 'Evolution API',
      area: 'Comunicação',
      description: 'Grupo, WhatsApp ou canal operacional conectado para registrar aprovações, pendências, riscos e promessas.'
    },
    {
      id: 'n8n',
      title: 'N8N',
      area: 'Automação',
      description: 'Webhooks preparados para coleta, auditoria, alertas, follow-ups, tarefas e sincronizações operacionais.'
    },
    {
      id: 'google-drive-sheets',
      title: 'Google Drive/Sheets',
      area: 'Dados',
      description: 'GrowthPack, BASE_CRM, mídia mensal/semanal, assets e evidências acessíveis por fonte oficial.'
    },
    {
      id: 'semrush',
      title: 'SEMrush',
      area: 'Inteligência',
      description: 'Concorrentes, domínios, gaps, palavras-chave e oportunidades preparados para análise competitiva.'
    }
  ];

  function slugify(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function loadStore() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch (error) {
      return {};
    }
  }

  function saveStore(store) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }

  function getClientId() {
    const activeClient = document.querySelector('.client-btn.active[data-client]');
    return activeClient ? activeClient.dataset.client : 'global';
  }

  function findChecklistCards() {
    return Array.from(document.querySelectorAll('.glass-card')).filter((card) => {
      const title = card.querySelector('h3');
      return title && title.textContent.trim().toLowerCase() === 'checklist de infraestrutura';
    });
  }

  function readLegacyStatuses(card) {
    const statuses = {};
    card.querySelectorAll('.status-row').forEach((row) => {
      const name = row.querySelector('strong')?.textContent?.trim();
      const status = Array.from(row.querySelectorAll('span'))
        .map((span) => span.textContent.trim())
        .filter(Boolean)
        .pop();
      if (name) statuses[slugify(name)] = status || 'Pendente';
    });
    return statuses;
  }

  function getChecklistState(clientId) {
    const store = loadStore();
    return store[clientId] || {};
  }

  function setChecklistState(clientId, itemId, checked) {
    const store = loadStore();
    store[clientId] = store[clientId] || {};
    store[clientId][itemId] = {
      checked: Boolean(checked),
      updatedAt: new Date().toISOString()
    };
    saveStore(store);
  }

  function renderChecklist(card, clientId, legacyStatuses) {
    const state = getChecklistState(clientId);
    const items = DEFAULT_ITEMS.map((item) => ({
      ...item,
      status: legacyStatuses[item.id] || 'Pendente',
      checked: Boolean(state[item.id]?.checked)
    }));

    card.setAttribute(ENHANCED_ATTR, 'true');
    card.dataset.v4InfraClient = clientId;
    card.innerHTML = `
      <div class="v4-checklist-header">
        <div>
          <p class="eyebrow">Modo V4 On</p>
          <h3>Checklist de infraestrutura</h3>
          <p class="muted">Marque cada item quando a infraestrutura estiver validada. O progresso fica salvo por cliente no navegador e serve como ponto de controle operacional.</p>
        </div>
        <div class="v4-checklist-score" aria-live="polite">
          <strong data-v4-checklist-done>0/0</strong>
          <span>concluído</span>
        </div>
      </div>
      <div class="v4-checklist-progress" aria-hidden="true"><span data-v4-checklist-bar></span></div>
      <div class="v4-infra-checklist" role="list">
        ${items.map((item) => `
          <label class="v4-check-item ${item.checked ? 'is-done' : ''}" role="listitem">
            <input type="checkbox" data-v4-infra-check="${item.id}" ${item.checked ? 'checked' : ''} />
            <span class="v4-check-box" aria-hidden="true"></span>
            <span class="v4-check-copy">
              <span class="v4-check-title-line">
                <strong>${escapeHtmlSafe(item.title)}</strong>
                <span class="badge ${item.checked ? 'ok' : 'warn'}" data-v4-check-badge>${item.checked ? 'Concluído' : escapeHtmlSafe(item.status || 'Pendente')}</span>
              </span>
              <small class="muted">${escapeHtmlSafe(item.area)} • ${escapeHtmlSafe(item.description)}</small>
            </span>
          </label>
        `).join('')}
      </div>
      <div class="v4-checklist-footer">
        <span class="dot"></span>
        <span>Nada importante fica só na memória: se houver pendência, transforme em tarefa, follow-up, registro, FCA ou alerta.</span>
      </div>
    `;
    updateProgress(card);
  }

  function escapeHtmlSafe(value) {
    return String(value ?? '').replace(/[&<>'"]/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[char]));
  }

  function updateProgress(card) {
    const inputs = Array.from(card.querySelectorAll('[data-v4-infra-check]'));
    const done = inputs.filter((input) => input.checked).length;
    const total = inputs.length;
    const percent = total ? Math.round((done / total) * 100) : 0;
    const score = card.querySelector('[data-v4-checklist-done]');
    const bar = card.querySelector('[data-v4-checklist-bar]');
    if (score) score.textContent = `${done}/${total}`;
    if (bar) bar.style.width = `${percent}%`;
    card.dataset.v4InfraProgress = String(percent);
  }

  function enhanceChecklistCards() {
    findChecklistCards().forEach((card) => {
      if (card.getAttribute(ENHANCED_ATTR) === 'true') return;
      const clientId = getClientId();
      const legacyStatuses = readLegacyStatuses(card);
      renderChecklist(card, clientId, legacyStatuses);
    });
  }

  function scheduleEnhance() {
    window.requestAnimationFrame(enhanceChecklistCards);
  }

  document.addEventListener('change', (event) => {
    const input = event.target.closest('[data-v4-infra-check]');
    if (!input) return;
    const card = input.closest(`[${ENHANCED_ATTR}]`);
    if (!card) return;
    const clientId = card.dataset.v4InfraClient || getClientId();
    setChecklistState(clientId, input.dataset.v4InfraCheck, input.checked);
    const item = input.closest('.v4-check-item');
    const badge = item?.querySelector('[data-v4-check-badge]');
    item?.classList.toggle('is-done', input.checked);
    if (badge) {
      badge.textContent = input.checked ? 'Concluído' : 'Pendente';
      badge.classList.toggle('ok', input.checked);
      badge.classList.toggle('warn', !input.checked);
    }
    updateProgress(card);
  });

  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-tab], [data-client], [data-nav]')) {
      window.setTimeout(scheduleEnhance, 60);
    }
  });

  const observer = new MutationObserver(() => scheduleEnhance());

  function boot() {
    injectStyles();
    observer.observe(document.body, { childList: true, subtree: true });
    enhanceChecklistCards();
    if (window.V4_BOOT_LOG) window.V4_BOOT_LOG('ux', 'Checklist de infraestrutura V4 On carregado.');
  }

  function injectStyles() {
    if (document.getElementById('v4-infrastructure-checklist-styles')) return;
    const style = document.createElement('style');
    style.id = 'v4-infrastructure-checklist-styles';
    style.textContent = `
      .v4-checklist-header { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 18px; align-items: start; margin-bottom: 16px; }
      .v4-checklist-header h3 { margin-bottom: 8px; }
      .v4-checklist-score { min-width: 112px; padding: 14px 16px; border-radius: 18px; text-align: center; background: rgba(255, 255, 255, .055); border: 1px solid rgba(255, 255, 255, .1); }
      .v4-checklist-score strong { display: block; font-size: 1.45rem; line-height: 1; letter-spacing: -.04em; }
      .v4-checklist-score span { display: block; margin-top: 5px; color: var(--muted); font-size: .78rem; font-weight: 900; text-transform: uppercase; letter-spacing: .08em; }
      .v4-checklist-progress { height: 10px; margin-bottom: 16px; border-radius: 999px; background: rgba(255, 255, 255, .08); overflow: hidden; }
      .v4-checklist-progress span { display: block; height: 100%; width: 0; border-radius: inherit; background: linear-gradient(90deg, var(--red), var(--red-2), var(--green)); transition: width .2s ease; }
      .v4-infra-checklist { display: grid; gap: 10px; }
      .v4-check-item { display: grid; grid-template-columns: 22px 34px minmax(0, 1fr); gap: 12px; align-items: center; padding: 14px; border-radius: 18px; border: 1px solid rgba(255,255,255,.09); background: rgba(255,255,255,.045); cursor: pointer; transition: border-color .16s ease, background .16s ease, transform .16s ease; }
      .v4-check-item:hover { transform: translateY(-1px); border-color: rgba(255,48,72,.32); background: rgba(255,255,255,.065); }
      .v4-check-item input { width: 20px; height: 20px; min-height: 20px; margin: 0; accent-color: var(--red-2); cursor: pointer; }
      .v4-check-box { width: 34px; height: 34px; display: grid; place-items: center; border-radius: 12px; background: rgba(255,255,255,.075); border: 1px solid rgba(255,255,255,.12); }
      .v4-check-box::before { content: ''; width: 14px; height: 8px; border-left: 3px solid transparent; border-bottom: 3px solid transparent; transform: rotate(-45deg); margin-top: -3px; }
      .v4-check-item.is-done { border-color: rgba(53,208,90,.28); background: rgba(53,208,90,.07); }
      .v4-check-item.is-done .v4-check-box { background: rgba(53,208,90,.14); border-color: rgba(53,208,90,.34); }
      .v4-check-item.is-done .v4-check-box::before { border-color: #8dffa8; }
      .v4-check-copy { display: grid; gap: 6px; min-width: 0; }
      .v4-check-title-line { display: flex; gap: 10px; justify-content: space-between; align-items: center; min-width: 0; }
      .v4-check-title-line strong { overflow-wrap: anywhere; }
      .v4-check-copy small { line-height: 1.35; }
      .v4-checklist-footer { display: flex; gap: 10px; align-items: flex-start; margin-top: 16px; padding-top: 14px; color: var(--muted); border-top: 1px solid var(--line); font-size: .92rem; line-height: 1.35; }
      .v4-checklist-footer .dot { margin-top: 5px; flex: 0 0 auto; box-shadow: 0 0 18px rgba(53,208,90,.4); }
      @media (max-width: 760px) { .v4-checklist-header { grid-template-columns: 1fr; } .v4-checklist-score { justify-self: start; } .v4-check-title-line { align-items: flex-start; flex-direction: column; } }
    `;
    document.head.appendChild(style);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
