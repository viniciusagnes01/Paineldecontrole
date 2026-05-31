(function () {
  let isRendering = false;

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

  function canManageOrganization(user) {
    return Boolean(window.V4_RBAC?.canDo?.(user, 'manage_users') || window.V4_RBAC?.canDo?.(user, 'manage_squads'));
  }

  function ensureStyle() {
    if (document.getElementById('v4-sidebar-polish-style')) return;
    const style = document.createElement('style');
    style.id = 'v4-sidebar-polish-style';
    style.textContent = `
      #sidebar.sidebar{height:100vh;overflow-y:auto;overflow-x:hidden;scrollbar-width:thin;background:linear-gradient(180deg,#12354a 0%,#10283a 44%,#220711 100%)!important;padding:14px 12px!important;border-right:1px solid rgba(255,255,255,.08)}
      #sidebar.sidebar::-webkit-scrollbar{width:8px}#sidebar.sidebar::-webkit-scrollbar-thumb{background:rgba(255,255,255,.18);border-radius:999px}
      #sidebar .brand-block,#sidebar>.nav-stack,#sidebar>.sidebar-card,#sidebar>.sidebar-section-title,#sidebar>.client-list{display:none!important}.v4-rbac-badge,[data-v4-org-launcher]{display:none!important}
      .v4-kommo-sidebar{display:flex;flex-direction:column;gap:12px;min-height:calc(100vh - 28px)}
      .v4-kommo-top{position:sticky;top:0;z-index:50;padding:0 0 10px;background:linear-gradient(180deg,rgba(18,53,74,.98),rgba(18,53,74,.86) 72%,rgba(18,53,74,0));backdrop-filter:blur(12px)}
      .v4-kommo-logo{display:flex;align-items:center;justify-content:space-between;margin:2px 2px 12px;color:#fff;font-weight:1000;font-size:18px;letter-spacing:-.02em}.v4-kommo-logo small{display:block;color:#96a9bb;font-size:10px;font-weight:850;letter-spacing:.08em;text-transform:uppercase}.v4-kommo-logo-badge{display:grid;place-items:center;width:34px;height:34px;border-radius:12px;background:#cf1022;box-shadow:0 10px 28px rgba(207,16,34,.32)}
      .v4-sidebar-user-card{padding:12px;border-radius:20px;background:linear-gradient(145deg,rgba(18,24,36,.96),rgba(72,10,22,.94));border:1px solid rgba(255,255,255,.13);box-shadow:0 18px 46px rgba(0,0,0,.30)}
      .v4-sidebar-user-main{display:flex;gap:10px;align-items:center;min-width:0}.v4-sidebar-user-main img,.v4-sidebar-user-avatar{width:42px;height:42px;border-radius:15px;object-fit:cover;display:grid;place-items:center;background:#cf1022;color:#fff;font-weight:950;flex:0 0 auto}.v4-sidebar-user-info{min-width:0;line-height:1.1}.v4-sidebar-user-info strong{display:block;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#fff}.v4-sidebar-user-info small{display:block;color:#c7cbd6;font-weight:800;font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:3px}.v4-sidebar-user-email{color:#8f96aa!important}
      .v4-sidebar-quick-meta{margin-top:10px;display:grid;grid-template-columns:1fr 1fr;gap:8px}.v4-sidebar-quick-meta span{padding:8px;border-radius:12px;background:rgba(255,255,255,.07);font-size:10px;color:#c7cbd6;font-weight:850}.v4-sidebar-quick-meta strong{display:block;color:#fff;font-size:13px;margin-top:2px}.v4-sidebar-user-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}.v4-sidebar-user-actions button{border:0;border-radius:14px;padding:10px 9px;font-weight:950;cursor:pointer;color:#fff;background:rgba(255,255,255,.10);box-shadow:inset 0 0 0 1px rgba(255,255,255,.08)}.v4-sidebar-user-actions button.primary{background:linear-gradient(135deg,#cf1022,#98091a)}.v4-sidebar-user-actions button.danger{background:rgba(255,255,255,.08);color:#ffb8c0}.v4-sidebar-user-actions button:disabled{opacity:.45;cursor:not-allowed}
      .v4-kommo-section{display:flex;flex-direction:column;gap:4px}.v4-kommo-label{margin:10px 2px 5px;color:#91a4b8;font-size:10px;font-weight:1000;letter-spacing:.11em;text-transform:uppercase}.v4-kommo-item{width:100%;display:flex;align-items:center;gap:10px;min-height:38px;padding:9px 10px;border:0;border-radius:8px;background:transparent;color:#fff;font:800 13px Inter,system-ui,sans-serif;cursor:pointer;text-align:left}.v4-kommo-item:hover{background:rgba(255,255,255,.08)}.v4-kommo-item.active,.v4-kommo-item[data-active="true"]{background:#285b94}.v4-kommo-item .ico{width:22px;height:22px;display:grid;place-items:center;flex:0 0 auto}.v4-kommo-item .chev{margin-left:auto;color:#a9bdd0}.v4-kommo-item small{display:block;color:#9fb0c3;font-size:10px;font-weight:750;line-height:1.1}.v4-kommo-item strong{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.v4-kommo-counter{margin-left:auto;min-width:20px;height:20px;border-radius:999px;background:#cf1022;color:#fff;display:grid;place-items:center;font-size:10px;font-weight:1000}
      .v4-kommo-fixed{border-top:1px solid rgba(255,255,255,.10);padding-top:10px;margin-top:auto}.v4-kommo-pinned .v4-kommo-item{min-height:34px;padding:7px 10px}.v4-kommo-pinned .ico{border-radius:999px;font-size:13px;color:#fff}.v4-kommo-clients{padding-bottom:20px}.v4-kommo-client{min-height:58px;border-radius:14px;margin-bottom:6px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06)}.v4-kommo-client.active{background:rgba(57,89,151,.42);border-color:rgba(255,255,255,.18)}.v4-kommo-avatar{width:34px;height:34px;border-radius:12px;display:grid;place-items:center;background:var(--client-color,#cf1022);font-weight:1000;color:#fff;flex:0 0 auto}.v4-kommo-squad{background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.06);border-radius:12px;margin-bottom:6px}.v4-kommo-squad .v4-kommo-item{min-height:48px}.v4-kommo-divider{height:1px;background:rgba(255,255,255,.10);margin:8px 0}
    `;
    document.head.appendChild(style);
  }

  function initials(nameOrEmail) {
    return String(nameOrEmail || 'V4').split(/\s+/).filter(Boolean).map(function (part) { return part[0]; }).join('').slice(0, 2).toUpperCase() || 'V4';
  }

  function sidebarUserHtml(user) {
    const name = user?.name || user?.email || 'Usuário';
    const avatar = user?.avatar_url
      ? '<img src="' + escapeHtml(user.avatar_url) + '" alt="" />'
      : '<span class="v4-sidebar-user-avatar">' + escapeHtml(initials(name)) + '</span>';
    const canOrg = canManageOrganization(user);
    const scope = (user?.clientIds || []).includes('*') ? 'Todos' : ((user?.clientIds || []).length ? (user.clientIds.length + ' clientes') : 'Squad');
    return '<div class="v4-sidebar-user-card" data-v4-sidebar-user-card>' +
      '<div class="v4-sidebar-user-main">' + avatar + '<div class="v4-sidebar-user-info"><strong>' + escapeHtml(name) + '</strong><small>' + escapeHtml(roleLabel(user?.role)) + '</small><small class="v4-sidebar-user-email">' + escapeHtml(user?.email || '-') + '</small></div></div>' +
      '<div class="v4-sidebar-quick-meta"><span>Cargo<strong>' + escapeHtml(roleLabel(user?.role)) + '</strong></span><span>Escopo<strong>' + escapeHtml(scope) + '</strong></span></div>' +
      '<div class="v4-sidebar-user-actions"><button class="primary" type="button" data-v4-open-organization ' + (canOrg ? '' : 'disabled') + '>Organização</button><button class="danger" type="button" data-v4-sidebar-signout>Sair</button></div>' +
      '</div>';
  }

  function nativeActiveNav(name) {
    return Boolean(document.querySelector('[data-nav="' + name + '"].active'));
  }

  function nativeActiveTab(name) {
    return Boolean(document.querySelector('[data-tab="' + name + '"].active'));
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

  function renderSquads(clients) {
    const squads = window.V4_RBAC?.storedSquads?.() || [];
    if (!squads.length) return '';
    return '<div class="v4-kommo-section"><div class="v4-kommo-label">Squads</div>' + squads.slice(0, 6).map(function (squad) {
      const count = (squad.clientIds || []).length;
      const firstClient = (squad.clientIds || []).find(function (id) { return clients.some(function (client) { return client.id === id; }); });
      return '<div class="v4-kommo-squad"><button class="v4-kommo-item" type="button" ' + (firstClient ? 'data-client="' + escapeHtml(firstClient) + '"' : 'data-v4-open-organization') + '><span class="ico">▦</span><span><strong>' + escapeHtml(squad.name) + '</strong><small>' + escapeHtml(squad.headEmail || 'Sem head definido') + '</small></span><span class="v4-kommo-counter">' + escapeHtml(count) + '</span></button></div>';
    }).join('') + '</div>';
  }

  function renderClientList(clients) {
    return '<div class="v4-kommo-section v4-kommo-clients"><div class="v4-kommo-label">Clientes monitorados</div>' +
      clients.map(function (client) {
        return '<button class="v4-kommo-item v4-kommo-client ' + (client.active ? 'active' : '') + '" type="button" data-client="' + escapeHtml(client.id) + '"><span class="v4-kommo-avatar" style="--client-color:' + escapeHtml(client.color) + '">' + escapeHtml(client.initials) + '</span><span><strong>' + escapeHtml(client.name) + '</strong><small>' + escapeHtml(client.meta || 'Cliente ativo') + '</small></span></button>';
      }).join('') + '</div>';
  }

  function kommoMenuHtml(user, clients) {
    const auto = window.V4_DRIVE_LIVE_AUTO_SYNC?.snapshot?.();
    const sourcesCount = auto?.sources?.length || 0;
    const clientsCount = clients.length || auto?.clients?.length || 0;
    return '<div class="v4-kommo-sidebar" data-v4-kommo-sidebar>' +
      '<div class="v4-kommo-top"><div class="v4-kommo-logo"><span><strong>V4 Command</strong><small>Center</small></span><span class="v4-kommo-logo-badge">V4</span></div>' + sidebarUserHtml(user) + '</div>' +
      '<div class="v4-kommo-section"><div class="v4-kommo-label">Principal</div>' +
      '<button class="v4-kommo-item ' + (nativeActiveNav('global') ? 'active' : '') + '" type="button" data-nav="global"><span class="ico">⌂</span><span>Início</span></button>' +
      '<button class="v4-kommo-item" type="button" data-v4-open-organization><span class="ico">◎</span><span>Organização</span><span class="chev">›</span></button>' +
      '<button class="v4-kommo-item ' + (nativeActiveNav('settings') ? 'active' : '') + '" type="button" data-nav="settings"><span class="ico">⚙</span><span>Configurações</span></button>' +
      '</div>' +
      '<div class="v4-kommo-section"><div class="v4-kommo-label">Operação</div>' +
      '<button class="v4-kommo-item ' + (nativeActiveTab('control') ? 'active' : '') + '" type="button" data-tab="control"><span class="ico">◷</span><span>Painel de Controle</span></button>' +
      '<button class="v4-kommo-item ' + (nativeActiveTab('crm') ? 'active' : '') + '" type="button" data-tab="crm"><span class="ico">▱</span><span>CRM & Funil</span><span class="chev">⌄</span></button>' +
      '<button class="v4-kommo-item ' + (nativeActiveTab('ads') ? 'active' : '') + '" type="button" data-tab="ads"><span class="ico">◉</span><span>Mídia & Ads</span></button>' +
      '<button class="v4-kommo-item ' + (nativeActiveTab('tasks') ? 'active' : '') + '" type="button" data-tab="tasks"><span class="ico">☑</span><span>Tarefas / eKyte</span></button>' +
      '<button class="v4-kommo-item ' + (nativeActiveTab('action') ? 'active' : '') + '" type="button" data-tab="action"><span class="ico">✦</span><span>Plano de ação / FCA</span></button>' +
      '<button class="v4-kommo-item ' + (nativeActiveTab('goals') ? 'active' : '') + '" type="button" data-tab="goals"><span class="ico">◆</span><span>Metas</span></button>' +
      '</div>' +
      '<div class="v4-kommo-section v4-kommo-pinned"><div class="v4-kommo-label">Integrações fixadas</div>' +
      '<button class="v4-kommo-item" type="button" data-tab="central"><span class="ico" style="background:#1a73e8">G</span><span>Google Drive / Sheets</span><span class="v4-kommo-counter">' + escapeHtml(sourcesCount) + '</span></button>' +
      '<button class="v4-kommo-item" type="button" data-tab="ads"><span class="ico" style="background:#1877f2">f</span><span>Facebook / Instagram</span></button>' +
      '<button class="v4-kommo-item" type="button" data-tab="central"><span class="ico" style="background:#25d366">W</span><span>WhatsApp Business</span></button>' +
      '<button class="v4-kommo-item" type="button" data-tab="tasks"><span class="ico" style="background:#ff8a00">E</span><span>eKyte</span></button>' +
      '</div>' +
      renderSquads(clients) +
      '<div class="v4-kommo-fixed"><div class="v4-kommo-section"><button class="v4-kommo-item" type="button" data-nav="settings"><span class="ico">⚙</span><span>Configurações</span></button><button class="v4-kommo-item" type="button" data-v4-open-organization><span class="ico">?</span><span>Ajuda / Acessos</span><span class="chev">›</span></button><button class="v4-kommo-item" type="button"><span class="ico">♡</span><span>Status do sistema</span><span class="v4-kommo-counter">' + escapeHtml(clientsCount) + '</span></button></div></div>' +
      renderClientList(clients) +
      '</div>';
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
      const html = kommoMenuHtml(user, clients);
      if (old) old.outerHTML = html;
      else sidebar.insertAdjacentHTML('afterbegin', html);
    } finally {
      isRendering = false;
    }
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
      const openOrg = event.target.closest('[data-v4-open-organization]');
      if (openOrg) {
        event.preventDefault();
        const launcher = document.querySelector('[data-v4-org-launcher]');
        if (launcher) launcher.click();
        else alert('Organização ainda está carregando. Tente novamente em alguns segundos.');
      }

      const logout = event.target.closest('[data-v4-sidebar-signout]');
      if (logout) {
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
    log('sidebar_polish', 'Sidebar estilo Kommo aplicada ao V4 Command Center.');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
