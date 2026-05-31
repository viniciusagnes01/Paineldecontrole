(function () {
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
      #sidebar.sidebar{height:100vh;overflow-y:auto;overflow-x:hidden;scrollbar-width:thin;}
      #sidebar.sidebar::-webkit-scrollbar{width:8px}
      #sidebar.sidebar::-webkit-scrollbar-thumb{background:rgba(255,255,255,.18);border-radius:999px}
      #sidebar .brand-block{margin-top:8px;}
      .v4-sidebar-user-card{position:sticky;top:0;z-index:30;margin:-2px 0 12px;padding:12px;border-radius:22px;background:linear-gradient(145deg,rgba(22,24,34,.98),rgba(70,8,18,.94));border:1px solid rgba(255,255,255,.14);box-shadow:0 18px 46px rgba(0,0,0,.34);backdrop-filter:blur(18px)}
      .v4-sidebar-user-main{display:flex;gap:10px;align-items:center;min-width:0}.v4-sidebar-user-main img,.v4-sidebar-user-avatar{width:42px;height:42px;border-radius:16px;object-fit:cover;display:grid;place-items:center;background:#cf1022;color:#fff;font-weight:950;flex:0 0 auto}.v4-sidebar-user-info{min-width:0;line-height:1.1}.v4-sidebar-user-info strong{display:block;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.v4-sidebar-user-info small{display:block;color:#c7cbd6;font-weight:800;font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:3px}.v4-sidebar-user-email{display:block;color:#8f96aa!important;font-size:10px!important;margin-top:3px}
      .v4-sidebar-user-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}.v4-sidebar-user-actions button{border:0;border-radius:14px;padding:10px 9px;font-weight:950;cursor:pointer;color:#fff;background:rgba(255,255,255,.10);box-shadow:inset 0 0 0 1px rgba(255,255,255,.08)}.v4-sidebar-user-actions button.primary{background:linear-gradient(135deg,#cf1022,#98091a)}.v4-sidebar-user-actions button.danger{background:rgba(255,255,255,.08);color:#ffb8c0}.v4-sidebar-user-actions button:disabled{opacity:.45;cursor:not-allowed}
      .v4-sidebar-section-label{margin:14px 0 8px;color:#aeb4c4;font-size:10px;font-weight:950;letter-spacing:.12em;text-transform:uppercase}.v4-sidebar-user-card + .brand-block{display:none}.v4-rbac-badge{display:none!important}[data-v4-org-launcher]{display:none!important}.sidebar-section-title{position:sticky;top:136px;z-index:18;background:linear-gradient(180deg,rgba(43,6,14,.96),rgba(43,6,14,.72));backdrop-filter:blur(12px);padding:10px 0 8px;margin-top:12px}.client-list{padding-bottom:28px}.client-btn{min-height:72px}.nav-stack{gap:10px}.nav-stack .nav-btn{border-radius:18px}.sidebar-card{border-radius:20px}.v4-sidebar-quick-meta{margin-top:10px;display:grid;grid-template-columns:1fr 1fr;gap:8px}.v4-sidebar-quick-meta span{padding:8px;border-radius:12px;background:rgba(255,255,255,.07);font-size:10px;color:#c7cbd6;font-weight:850}.v4-sidebar-quick-meta strong{display:block;color:#fff;font-size:13px;margin-top:2px}
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
    return '<div class="v4-sidebar-user-card" data-v4-sidebar-user-card>' +
      '<div class="v4-sidebar-user-main">' + avatar + '<div class="v4-sidebar-user-info"><strong>' + escapeHtml(name) + '</strong><small>' + escapeHtml(roleLabel(user?.role)) + '</small><small class="v4-sidebar-user-email">' + escapeHtml(user?.email || '-') + '</small></div></div>' +
      '<div class="v4-sidebar-quick-meta"><span>Cargo<strong>' + escapeHtml(roleLabel(user?.role)) + '</strong></span><span>Escopo<strong>' + escapeHtml((user?.clientIds || []).includes('*') ? 'Todos' : (user?.clientIds || []).length || 'Squad') + '</strong></span></div>' +
      '<div class="v4-sidebar-user-actions"><button class="primary" type="button" data-v4-open-organization ' + (canOrg ? '' : 'disabled') + '>Organização</button><button class="danger" type="button" data-v4-sidebar-signout>Sair</button></div>' +
      '</div>';
  }

  function insertUserCard() {
    const sidebar = document.getElementById('sidebar');
    const user = currentUser();
    if (!sidebar || !user) return;
    const old = sidebar.querySelector('[data-v4-sidebar-user-card]');
    const html = sidebarUserHtml(user);
    if (old) {
      old.outerHTML = html;
      return;
    }
    sidebar.insertAdjacentHTML('afterbegin', html);
  }

  async function signOut() {
    try {
      const client = window.V4_DRIVE_LIVE?.ensureClient?.();
      if (client?.auth?.signOut) await client.auth.signOut();
    } catch (_error) {}
    try {
      localStorage.removeItem('supabase.auth.token');
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
    insertUserCard();
    window.addEventListener('v4:rbac:user-ready', insertUserCard);
    const observer = new MutationObserver(function () { insertUserCard(); });
    const sidebar = document.getElementById('sidebar');
    if (sidebar) observer.observe(sidebar, { childList: true, subtree: false });
    log('sidebar_polish', 'Lateral organizada com usuário fixo.');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
