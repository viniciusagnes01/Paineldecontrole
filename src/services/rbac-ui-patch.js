(function () {
  function log(type, message) {
    if (window.V4_BOOT_LOG) window.V4_BOOT_LOG(type, message);
  }

  function user() {
    return window.V4_RBAC?.getCurrentUser?.() || null;
  }

  function roleLabel(role) {
    return window.V4_RBAC?.roles?.[role] || role || 'Sem cargo';
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, function (char) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char];
    });
  }

  async function loadRealClients() {
    const auto = window.V4_DRIVE_LIVE_AUTO_SYNC?.snapshot?.();
    if (auto?.clients?.length) {
      return auto.clients.map((client) => ({
        id: client.client_id || client.id,
        name: client.client_name || client.name,
        source: 'supabase_drive_live',
        growthpackSources: client.growthpack_sources_count || client.active_drive_sources_count || 0
      })).filter((client) => client.id && client.name);
    }

    if (window.V4_DRIVE_LIVE?.panelClients) {
      const payload = await window.V4_DRIVE_LIVE.panelClients();
      return (payload.data || []).map((client) => ({
        id: client.client_id || client.id,
        name: client.client_name || client.name,
        source: 'supabase_drive_live',
        growthpackSources: client.growthpack_sources_count || client.active_drive_sources_count || 0
      })).filter((client) => client.id && client.name);
    }

    return [];
  }

  function ensureStyle() {
    if (document.getElementById('v4-rbac-style')) return;
    const style = document.createElement('style');
    style.id = 'v4-rbac-style';
    style.textContent = `
      .v4-rbac-badge{position:fixed;left:18px;top:18px;z-index:999800;display:flex;align-items:center;gap:10px;max-width:min(480px,calc(100vw - 36px));padding:9px 13px;border-radius:999px;background:rgba(8,10,16,.80);border:1px solid rgba(255,255,255,.14);backdrop-filter:blur(14px);box-shadow:0 16px 42px rgba(0,0,0,.28);color:#fff;font:800 12px Inter,system-ui,sans-serif}.v4-rbac-badge img{width:26px;height:26px;border-radius:999px;object-fit:cover}.v4-rbac-badge small{display:block;color:#aeb4c4;font-weight:800}.v4-rbac-hidden{display:none!important}.v4-rbac-denied{position:fixed;right:18px;bottom:18px;z-index:999999;padding:14px 18px;border-radius:16px;background:linear-gradient(135deg,#cf1022,#700814);color:#fff;font-weight:900;box-shadow:0 20px 55px rgba(0,0,0,.35)}.v4-org-panel{position:fixed;inset:88px 22px 22px auto;width:min(980px,calc(100vw - 44px));z-index:999850;background:rgba(12,14,20,.98);border:1px solid rgba(255,255,255,.14);border-radius:22px;color:#fff;box-shadow:0 24px 80px rgba(0,0,0,.45);display:none;overflow:auto;max-height:calc(100vh - 110px);font-family:Inter,system-ui,sans-serif}.v4-org-panel.open{display:block}.v4-org-panel header{display:flex;justify-content:space-between;gap:16px;padding:18px;border-bottom:1px solid rgba(255,255,255,.1)}.v4-org-panel h2{margin:0}.v4-org-panel p{color:#aeb4c4}.v4-org-panel table{width:100%;border-collapse:collapse;font-size:12px}.v4-org-panel th,.v4-org-panel td{padding:10px;border-bottom:1px solid rgba(255,255,255,.08);text-align:left}.v4-org-panel input,.v4-org-panel select{width:100%;box-sizing:border-box;border:1px solid rgba(255,255,255,.14);background:rgba(0,0,0,.24);color:#fff;border-radius:12px;padding:9px;font-weight:800}.v4-org-panel button{border:0;border-radius:12px;padding:10px 12px;font-weight:900;cursor:pointer;background:#cf1022;color:#fff}.v4-org-panel .ghost{background:rgba(255,255,255,.1)}.v4-client-picker{max-height:170px;overflow:auto;border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:8px;background:rgba(0,0,0,.18)}.v4-client-picker label{display:flex!important;gap:8px;align-items:flex-start;padding:8px;border-radius:10px;color:#fff;font-size:12px}.v4-client-picker label:hover{background:rgba(255,255,255,.06)}.v4-client-picker input{width:auto!important}.v4-client-meta{display:block;color:#aeb4c4;font-size:11px;margin-top:2px}.v4-org-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;align-items:end}.v4-org-client-span{grid-column:1 / -1}@media(max-width:840px){.v4-org-grid{grid-template-columns:1fr}.v4-org-client-span{grid-column:auto}}
    `;
    document.head.appendChild(style);
  }

  function toast(message) {
    const el = document.createElement('div');
    el.className = 'v4-rbac-denied';
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, 2500);
  }

  function showBadge() {
    const current = user();
    if (!current || document.querySelector('[data-v4-rbac-badge]')) return;
    const badge = document.createElement('div');
    badge.className = 'v4-rbac-badge';
    badge.dataset.v4RbacBadge = 'true';
    badge.innerHTML = `${current.avatar_url ? `<img src="${escapeHtml(current.avatar_url)}" alt="" />` : '<span>🔐</span>'}<span>${escapeHtml(current.name || current.email)}<small>${escapeHtml(roleLabel(current.role))} • ${escapeHtml(current.email)}</small></span>`;
    document.body.appendChild(badge);
  }

  function moduleFromElement(el) {
    if (el?.dataset?.tab) return el.dataset.tab;
    if (el?.dataset?.nav === 'global') return 'global';
    if (el?.dataset?.nav === 'settings') return 'settings';
    return null;
  }

  function filterDom() {
    const current = user();
    if (!current || !window.V4_RBAC) return;
    document.querySelectorAll('[data-tab]').forEach(function (button) {
      const moduleId = button.dataset.tab;
      button.classList.toggle('v4-rbac-hidden', !window.V4_RBAC.canAccessModule(current, moduleId));
    });
    document.querySelectorAll('[data-nav="global"]').forEach(function (button) {
      button.classList.toggle('v4-rbac-hidden', !window.V4_RBAC.canAccessModule(current, 'global'));
    });
    document.querySelectorAll('[data-nav="settings"]').forEach(function (button) {
      button.classList.toggle('v4-rbac-hidden', !window.V4_RBAC.canAccessModule(current, 'settings'));
    });
    document.querySelectorAll('[data-client]').forEach(function (button) {
      button.classList.toggle('v4-rbac-hidden', !window.V4_RBAC.canAccessClient(current, button.dataset.client));
    });
    document.querySelectorAll('[data-action], [data-save-row], [data-delete-row], [data-delete-client]').forEach(function (el) {
      const action = window.V4_RBAC.actionForElement(el);
      if (action) el.classList.toggle('v4-rbac-hidden', !window.V4_RBAC.canDo(current, action));
    });
    showBadge();
  }

  function ensureSafeCurrentTab() {
    const current = user();
    if (!current || !window.V4_RBAC) return;
    const active = document.querySelector('.tab-btn.active[data-tab]');
    if (active && !window.V4_RBAC.canAccessModule(current, active.dataset.tab)) {
      const firstAllowed = Array.from(document.querySelectorAll('.tab-btn[data-tab]')).find((button) => window.V4_RBAC.canAccessModule(current, button.dataset.tab));
      firstAllowed?.click();
    }
  }

  function intercept() {
    document.addEventListener('click', function (event) {
      const current = user();
      if (!current || !window.V4_RBAC) return;
      const nav = event.target.closest('[data-nav], [data-tab], [data-client]');
      if (nav) {
        const moduleId = moduleFromElement(nav);
        if (moduleId && !window.V4_RBAC.canAccessModule(current, moduleId)) {
          event.preventDefault();
          event.stopImmediatePropagation();
          toast('Acesso negado para este módulo.');
          return;
        }
        if (nav.dataset.client && !window.V4_RBAC.canAccessClient(current, nav.dataset.client)) {
          event.preventDefault();
          event.stopImmediatePropagation();
          toast('Cliente fora do seu escopo de acesso.');
          return;
        }
      }
      const actionEl = event.target.closest('[data-action], [data-save-row], [data-delete-row], [data-delete-client]');
      if (actionEl) {
        const action = window.V4_RBAC.actionForElement(actionEl);
        if (action && !window.V4_RBAC.canDo(current, action)) {
          event.preventDefault();
          event.stopImmediatePropagation();
          toast('Ação bloqueada para o cargo ' + roleLabel(current.role) + '.');
        }
      }
    }, true);

    document.addEventListener('submit', function (event) {
      const current = user();
      const form = event.target.closest('form[data-submit]');
      if (!current || !form || !window.V4_RBAC) return;
      const action = window.V4_RBAC.actionForElement(form);
      if (action && !window.V4_RBAC.canDo(current, action)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        toast('Você não tem permissão para salvar esta alteração.');
      }
    }, true);
  }

  function renderClientPicker(clients) {
    if (!clients.length) return '<div class="v4-client-picker"><span class="v4-client-meta">Carregando clientes do Supabase/Drive...</span></div>';
    return `<div class="v4-client-picker" data-v4-client-picker><label><input type="checkbox" value="*" data-v4-client-check /> <span><strong>Todos os clientes</strong><span class="v4-client-meta">Acesso global da carteira</span></span></label>${clients.map((client) => `<label><input type="checkbox" value="${escapeHtml(client.id)}" data-v4-client-check /> <span><strong>${escapeHtml(client.name)}</strong><span class="v4-client-meta">${escapeHtml(client.source)} • ${escapeHtml(client.growthpackSources)} fontes GrowthPack/Drive</span></span></label>`).join('')}</div>`;
  }

  function orgPanelTemplate(clients) {
    const current = user();
    const users = window.V4_RBAC?.storedUsers?.() || [];
    const roleOptions = Object.entries(window.V4_RBAC?.roles || {}).map(([key, label]) => `<option value="${escapeHtml(key)}">${escapeHtml(label)}</option>`).join('');
    return `<section class="v4-org-panel" data-v4-org-panel><header><div><h2>Organização e acessos</h2><p>Clientes puxados do Supabase via Drive Live. Depois entram também clientes vindos do eKyte.</p></div><button class="ghost" data-v4-org-close>Fechar</button></header><div style="padding:18px"><p><strong>Usuário atual:</strong> ${escapeHtml(current?.name || '-')} • ${escapeHtml(roleLabel(current?.role))}</p><table><thead><tr><th>Nome</th><th>E-mail</th><th>Cargo</th><th>Clientes</th></tr></thead><tbody>${users.map((u) => `<tr><td>${escapeHtml(u.name || '-')}</td><td>${escapeHtml(u.email)}</td><td>${escapeHtml(roleLabel(u.role))}</td><td>${escapeHtml((u.clientIds || []).join(', ') || '-')}</td></tr>`).join('')}</tbody></table><h3>Adicionar/alterar acesso</h3><form data-v4-rbac-form><div class="v4-org-grid"><label>Nome<input name="name" placeholder="Nome" /></label><label>E-mail<input name="email" placeholder="email@dominio.com" required /></label><label>Cargo<select name="role">${roleOptions}</select></label><div class="v4-org-client-span"><strong>Clientes reais do Supabase/Drive</strong>${renderClientPicker(clients)}</div><button type="submit">Salvar acesso</button><button type="button" class="ghost" data-v4-refresh-clients>Recarregar clientes</button></div></form><p style="font-size:12px;color:#aeb4c4">Primeira versão salva permissões locais usando IDs reais vindos do Supabase. Próximo ciclo: persistir no Supabase com roles, permissions e user_client_access.</p></div></section>`;
  }

  async function mountOrgPanel(forceReload) {
    if (forceReload) document.querySelector('[data-v4-org-panel]')?.remove();
    if (document.querySelector('[data-v4-org-panel]')) return;
    const clients = await loadRealClients().catch(function (error) {
      log('rbac_clients_error', error.message);
      return [];
    });
    const wrap = document.createElement('div');
    wrap.innerHTML = orgPanelTemplate(clients);
    document.body.appendChild(wrap.firstElementChild);
    document.querySelector('[data-v4-org-close]')?.addEventListener('click', function () {
      document.querySelector('[data-v4-org-panel]')?.classList.remove('open');
    });
    document.querySelector('[data-v4-refresh-clients]')?.addEventListener('click', async function () {
      document.querySelector('[data-v4-org-panel]')?.remove();
      await mountOrgPanel(true);
      document.querySelector('[data-v4-org-panel]')?.classList.add('open');
    });
    document.querySelector('[data-v4-rbac-form]')?.addEventListener('submit', function (event) {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const selectedClients = Array.from(event.currentTarget.querySelectorAll('[data-v4-client-check]:checked')).map((input) => input.value);
      window.V4_RBAC.setUserRole(data.get('email'), data.get('role'), selectedClients, { name: data.get('name') });
      document.querySelector('[data-v4-org-panel]')?.remove();
      mountOrgPanel(true).then(function () {
        document.querySelector('[data-v4-org-panel]')?.classList.add('open');
        toast('Acesso atualizado com clientes reais do Supabase.');
      });
    });
  }

  function addOrgLauncher() {
    if (document.querySelector('[data-v4-org-launcher]')) return;
    const current = user();
    if (!window.V4_RBAC?.canDo(current, 'manage_users')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.v4OrgLauncher = 'true';
    button.textContent = 'Organização';
    button.style.cssText = 'position:fixed;left:18px;top:76px;z-index:999800;border:0;border-radius:999px;padding:10px 13px;background:#cf1022;color:#fff;font-weight:900;box-shadow:0 16px 42px rgba(0,0,0,.28);cursor:pointer';
    button.addEventListener('click', async function () {
      await mountOrgPanel(false);
      document.querySelector('[data-v4-org-panel]')?.classList.add('open');
    });
    document.body.appendChild(button);
  }

  function scheduleFilters() {
    window.setTimeout(function () {
      filterDom();
      ensureSafeCurrentTab();
      addOrgLauncher();
    }, 300);
  }

  function start() {
    ensureStyle();
    intercept();
    scheduleFilters();
    window.addEventListener('v4:rbac:user-ready', scheduleFilters);
    window.addEventListener('v4:growthpack:sources-ready', function () {
      document.querySelector('[data-v4-org-panel]')?.remove();
    });
    document.addEventListener('click', function () { window.setTimeout(filterDom, 80); }, true);
    const observer = new MutationObserver(function () { filterDom(); addOrgLauncher(); });
    observer.observe(document.body, { childList: true, subtree: true });
    log('rbac_ui', 'RBAC UI patch ativo com clientes Supabase.');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
