(function () {
  let isRendering = false;
  const CLIENTS_OPEN_KEY = 'v4-sidebar-clients-open';
  const SQUADS_OPEN_KEY = 'v4-sidebar-squads-open';

  function log(type, message) {
    if (window.V4_BOOT_LOG) window.V4_BOOT_LOG(type, message);
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, function (char) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char];
    });
  }

  function roleLabel(role) {
    return window.V4_RBAC?.roles?.[role] || role || 'Sem cargo';
  }

  function currentUser() {
    return window.V4_RBAC?.getCurrentUser?.() || null;
  }

  function isOpen(key) {
    return sessionStorage.getItem(key) === '1';
  }

  function setOpen(key, value) {
    sessionStorage.setItem(key, value ? '1' : '0');
  }

  function initials(value) {
    return String(value || 'V4').split(/\s+/).filter(Boolean).map(function (part) { return part[0]; }).join('').slice(0, 2).toUpperCase() || 'V4';
  }

  function nativeActiveNav(name) {
    return Boolean(document.querySelector('[data-nav="' + name + '"].active'));
  }

  function collectClients() {
    return Array.from(document.querySelectorAll('#sidebar > .client-list [data-client]')).map(function (btn) {
      return {
        id: btn.dataset.client,
        active: btn.classList.contains('active'),
        color: btn.style.getPropertyValue('--client-color') || '#cf1022',
        initials: btn.querySelector('.client-avatar')?.textContent?.trim() || 'CL',
        name: btn.querySelector('.client-name')?.textContent?.trim() || btn.dataset.client,
        meta: btn.querySelector('.client-meta')?.textContent?.trim() || ''
      };
    });
  }

  function getSquads() {
    return window.V4_RBAC?.storedSquads?.() || [];
  }

  function ensureStyle() {
    let style = document.getElementById('v4-sidebar-polish-style');
    if (!style) {
      style = document.createElement('style');
      style.id = 'v4-sidebar-polish-style';
      document.head.appendChild(style);
    }

    style.textContent = `
      #sidebar.sidebar{height:100vh;overflow:hidden!important;background:radial-gradient(circle at 12% 2%,rgba(207,16,34,.34),transparent 34%),linear-gradient(180deg,#050507 0%,#120408 55%,#050507 100%)!important;padding:14px 12px!important;border-right:1px solid rgba(255,255,255,.08);box-shadow:inset -1px 0 0 rgba(207,16,34,.25)}
      #sidebar .brand-block,#sidebar>.nav-stack,#sidebar>.sidebar-card,#sidebar>.sidebar-section-title,#sidebar>.client-list{display:none!important}.v4-rbac-badge,[data-v4-org-launcher]{display:none!important}
      .v4-kommo-sidebar{height:calc(100vh - 28px);display:flex;flex-direction:column;color:#fff;min-width:0}
      .v4-sidebar-top{flex:0 0 auto;padding:2px 0 12px;border-bottom:1px solid rgba(255,255,255,.08)}
      .v4-sidebar-brand{display:flex;align-items:center;justify-content:space-between;gap:12px}.v4-sidebar-brand strong{font-size:19px;line-height:1;font-weight:1000;letter-spacing:-.05em}.v4-sidebar-brand small{display:block;margin-top:2px;color:#a6a8b2;font-size:10px;font-weight:900;letter-spacing:.16em;text-transform:uppercase}.v4-sidebar-brand-badge{width:36px;height:36px;border-radius:14px;display:grid;place-items:center;background:linear-gradient(135deg,#ef1831,#8b0613);box-shadow:0 14px 34px rgba(207,16,34,.42);font-weight:1000}
      .v4-sidebar-scroll{flex:1 1 auto;overflow-y:auto;overflow-x:hidden;padding:12px 0 10px;scrollbar-width:thin}.v4-sidebar-scroll::-webkit-scrollbar{width:7px}.v4-sidebar-scroll::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#cf1022,#5b0710);border-radius:999px}
      .v4-sidebar-footer{flex:0 0 auto;padding-top:10px;border-top:1px solid rgba(255,255,255,.10);background:linear-gradient(180deg,rgba(5,5,7,0),rgba(5,5,7,.98) 22%)}
      .v4-user-footer-card{display:flex;align-items:center;gap:10px;width:100%;border:1px solid rgba(255,255,255,.12);border-radius:18px;background:linear-gradient(145deg,rgba(255,255,255,.075),rgba(255,255,255,.035));padding:10px;color:#fff;text-align:left;cursor:pointer;box-shadow:0 14px 38px rgba(0,0,0,.28)}.v4-user-footer-card:hover{background:linear-gradient(145deg,rgba(207,16,34,.20),rgba(255,255,255,.055))}.v4-user-footer-card img,.v4-user-footer-avatar{width:38px;height:38px;border-radius:14px;object-fit:cover;display:grid;place-items:center;background:linear-gradient(135deg,#cf1022,#5b0710);font-weight:1000;flex:0 0 auto}.v4-user-footer-info{min-width:0;flex:1}.v4-user-footer-info strong{display:block;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.v4-user-footer-info small{display:block;color:#aeb1bd;font-size:10px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px}.v4-user-footer-actions{display:flex;gap:8px;margin-top:8px}.v4-user-footer-actions button{border:0;border-radius:13px;padding:9px 10px;color:#fff;font-weight:950;cursor:pointer;background:rgba(255,255,255,.08)}.v4-user-footer-actions .danger{color:#ffbec6}.v4-user-footer-actions .primary{background:linear-gradient(135deg,#e5112b,#9c0718);flex:1}
      .v4-section{display:flex;flex-direction:column;gap:5px;margin-bottom:12px}.v4-label{margin:8px 2px 5px;color:#9a9da8;font-size:10px;font-weight:1000;letter-spacing:.14em;text-transform:uppercase}.v4-item{width:100%;display:flex;align-items:center;gap:10px;min-height:40px;padding:10px 11px;border:0;border-radius:12px;background:transparent;color:#fff;font:850 13px Inter,system-ui,sans-serif;cursor:pointer;text-align:left;transition:background .18s ease,transform .18s ease,box-shadow .18s ease}.v4-item:hover{background:rgba(255,255,255,.075);transform:translateX(1px)}.v4-item.active{background:linear-gradient(135deg,rgba(207,16,34,.95),rgba(122,6,16,.82));box-shadow:0 14px 28px rgba(207,16,34,.22)}.v4-item .ico{width:22px;height:22px;display:grid;place-items:center;flex:0 0 auto}.v4-item .chev{margin-left:auto;color:#b9bbc6}.v4-item span.text{min-width:0}.v4-item strong{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.v4-item small{display:block;color:#9fa2ad;font-size:10px;font-weight:750;line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.v4-counter{margin-left:auto;min-width:21px;height:21px;border-radius:999px;background:#cf1022;color:#fff;display:grid;place-items:center;font-size:10px;font-weight:1000}.v4-panel{display:none;padding:7px 0 8px}.v4-panel.open{display:block}.v4-avatar{width:34px;height:34px;border-radius:12px;display:grid;place-items:center;background:var(--client-color,#cf1022);font-weight:1000;color:#fff;flex:0 0 auto}.v4-subitem{min-height:56px;border-radius:15px;margin-bottom:7px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.07)}.v4-subitem.active{background:linear-gradient(135deg,rgba(207,16,34,.34),rgba(255,255,255,.05));border-color:rgba(207,16,34,.40)}.v4-all{background:rgba(255,255,255,.075);border:1px solid rgba(255,255,255,.09);margin-bottom:8px}
    `;
  }

  function userFooterHtml(user) {
    const name = user?.name || user?.email || 'Usuário';
    const avatar = user?.avatar_url
      ? '<img src="' + escapeHtml(user.avatar_url) + '" alt="" />'
      : '<span class="v4-user-footer-avatar">' + escapeHtml(initials(name)) + '</span>';

    return '<div class="v4-sidebar-footer">' +
      '<button type="button" class="v4-user-footer-card" data-v4-user-profile>' + avatar + '<span class="v4-user-footer-info"><strong>' + escapeHtml(name) + '</strong><small>' + escapeHtml(roleLabel(user?.role)) + ' • ' + escapeHtml(user?.email || '-') + '</small></span><span class="chev">›</span></button>' +
      '<div class="v4-user-footer-actions"><button type="button" class="primary" data-v4-user-profile>Usuário</button><button type="button" class="danger" data-v4-sidebar-signout>Sair</button></div>' +
      '</div>';
  }

  function renderSquads(clients) {
    const squads = getSquads();
    if (!squads.length) return '';
    const open = isOpen(SQUADS_OPEN_KEY);
    return '<div class="v4-section"><div class="v4-label">Equipes</div>' +
      '<button class="v4-item ' + (open ? 'active' : '') + '" type="button" data-v4-squad-toggle><span class="ico">▦</span><span class="text"><strong>Squads</strong><small>Selecionar equipe</small></span><span class="v4-counter">' + escapeHtml(squads.length) + '</span><span class="chev">' + (open ? '⌃' : '⌄') + '</span></button>' +
      '<div class="v4-panel ' + (open ? 'open' : '') + '">' +
      '<button class="v4-item v4-all" type="button" data-v4-open-organization><span class="ico">◎</span><span class="text"><strong>Geral / Todos os squads</strong><small>Gerenciar equipes</small></span></button>' +
      squads.slice(0, 12).map(function (squad) {
        const firstClient = (squad.clientIds || []).find(function (id) { return clients.some(function (client) { return client.id === id; }); });
        return '<button class="v4-item v4-subitem" type="button" ' + (firstClient ? 'data-client="' + escapeHtml(firstClient) + '"' : 'data-v4-open-organization') + '><span class="v4-avatar">' + escapeHtml(initials(squad.name)) + '</span><span class="text"><strong>' + escapeHtml(squad.name) + '</strong><small>' + escapeHtml(squad.headEmail || 'Sem head definido') + '</small></span><span class="v4-counter">' + escapeHtml((squad.clientIds || []).length) + '</span></button>';
      }).join('') + '</div></div>';
  }

  function renderClients(clients) {
    const open = isOpen(CLIENTS_OPEN_KEY);
    const activeClient = clients.find(function (client) { return client.active; });
    const label = activeClient ? activeClient.name : 'Geral / Todos';
    return '<div class="v4-section"><div class="v4-label">Carteira</div>' +
      '<button class="v4-item ' + (open ? 'active' : '') + '" type="button" data-v4-client-toggle><span class="ico">◈</span><span class="text"><strong>Clientes</strong><small>' + escapeHtml(label) + '</small></span><span class="v4-counter">' + escapeHtml(clients.length) + '</span><span class="chev">' + (open ? '⌃' : '⌄') + '</span></button>' +
      '<div class="v4-panel ' + (open ? 'open' : '') + '">' +
      '<button class="v4-item v4-all" type="button" data-nav="global"><span class="ico">⌂</span><span class="text"><strong>Geral / Todos</strong><small>Visão consolidada</small></span></button>' +
      clients.map(function (client) {
        return '<button class="v4-item v4-subitem ' + (client.active ? 'active' : '') + '" type="button" data-client="' + escapeHtml(client.id) + '"><span class="v4-avatar" style="--client-color:' + escapeHtml(client.color) + '">' + escapeHtml(client.initials) + '</span><span class="text"><strong>' + escapeHtml(client.name) + '</strong><small>' + escapeHtml(client.meta || 'Cliente ativo') + '</small></span></button>';
      }).join('') + '</div></div>';
  }

  function menuHtml(user, clients) {
    return '<div class="v4-kommo-sidebar" data-v4-kommo-sidebar>' +
      '<div class="v4-sidebar-top"><div class="v4-sidebar-brand"><span><strong>Painel de Comando</strong><small>V4 Company</small></span><span class="v4-sidebar-brand-badge">V4</span></div></div>' +
      '<div class="v4-sidebar-scroll">' +
        '<div class="v4-section"><div class="v4-label">Principal</div>' +
          '<button class="v4-item ' + (nativeActiveNav('global') ? 'active' : '') + '" type="button" data-nav="global"><span class="ico">⌂</span><span>Início</span></button>' +
          '<button class="v4-item" type="button" data-v4-open-organization><span class="ico">◎</span><span>Organização</span><span class="chev">›</span></button>' +
          '<button class="v4-item ' + (nativeActiveNav('settings') ? 'active' : '') + '" type="button" data-nav="settings"><span class="ico">⚙</span><span>Configurações</span></button>' +
        '</div>' + renderSquads(clients) + renderClients(clients) +
        '<div class="v4-section"><div class="v4-label">Sistema</div><button class="v4-item" type="button"><span class="ico">♡</span><span>Status do sistema</span><span class="v4-counter">' + escapeHtml(clients.length) + '</span></button></div>' +
      '</div>' + userFooterHtml(user) + '</div>';
  }

  function renderSidebar() {
    if (isRendering) return;
    const sidebar = document.getElementById('sidebar');
    const user = currentUser();
    if (!sidebar || !user) return;

    isRendering = true;
    try {
      const clients = collectClients();
      const old = sidebar.querySelector('[data-v4-kommo-sidebar]');
      const html = menuHtml(user, clients);
      if (old) old.outerHTML = html;
      else sidebar.insertAdjacentHTML('afterbegin', html);
    } finally {
      isRendering = false;
    }
  }

  function openUserPage() {
    if (window.V4_ORGANIZATION_PAGE?.render) window.V4_ORGANIZATION_PAGE.render('users');
    else document.querySelector('[data-v4-org-launcher]')?.click();
  }

  async function signOut() {
    try {
      const client = window.V4_DRIVE_LIVE?.ensureClient?.();
      if (client?.auth?.signOut) await client.auth.signOut();
    } catch (_error) {}
    window.location.href = window.location.origin + window.location.pathname;
  }

  function bindActions() {
    document.addEventListener('click', function (event) {
      const toggleSquads = event.target.closest('[data-v4-squad-toggle]');
      if (toggleSquads) {
        event.preventDefault();
        event.stopPropagation();
        setOpen(SQUADS_OPEN_KEY, !isOpen(SQUADS_OPEN_KEY));
        renderSidebar();
        return;
      }

      const toggleClients = event.target.closest('[data-v4-client-toggle]');
      if (toggleClients) {
        event.preventDefault();
        event.stopPropagation();
        setOpen(CLIENTS_OPEN_KEY, !isOpen(CLIENTS_OPEN_KEY));
        renderSidebar();
        return;
      }

      if (event.target.closest('[data-v4-user-profile]')) {
        event.preventDefault();
        event.stopPropagation();
        openUserPage();
        return;
      }

      if (event.target.closest('[data-v4-open-organization]')) {
        event.preventDefault();
        event.stopPropagation();
        openUserPage();
        return;
      }

      if (event.target.closest('[data-client]')) {
        setOpen(CLIENTS_OPEN_KEY, true);
        setTimeout(renderSidebar, 160);
      }

      if (event.target.closest('[data-nav="global"]')) {
        setOpen(CLIENTS_OPEN_KEY, false);
        setTimeout(renderSidebar, 160);
      }

      if (event.target.closest('[data-v4-sidebar-signout]')) {
        event.preventDefault();
        signOut();
      }
    }, true);
  }

  function start() {
    ensureStyle();
    bindActions();
    renderSidebar();
    window.addEventListener('v4:rbac:user-ready', renderSidebar);
    window.addEventListener('v4:growthpack:sources-ready', renderSidebar);
    window.addEventListener('v4:rbac:squads-updated', renderSidebar);
    document.addEventListener('click', function () { setTimeout(renderSidebar, 120); }, true);
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
      const observer = new MutationObserver(function () { setTimeout(renderSidebar, 80); });
      observer.observe(sidebar, { childList: true, subtree: false });
    }
    log('sidebar_polish', 'Sidebar com topo simples e usuario fixo no rodape.');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
