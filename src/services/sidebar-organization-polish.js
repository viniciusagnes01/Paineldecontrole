(function () {
  const CLIENTS_OPEN_KEY = 'v4-sidebar-clients-open';
  const SQUADS_OPEN_KEY = 'v4-sidebar-squads-open';
  let rendering = false;

  function ui() {
    return window.V4_UI || {
      escape: (value) => String(value ?? ''),
      initials: (value) => String(value || 'V4').slice(0, 2).toUpperCase(),
      storage: {
        sessionGet: (key, fallback) => sessionStorage.getItem(key) === '1' || fallback,
        sessionSet: (key, value) => sessionStorage.setItem(key, value ? '1' : '0')
      },
      log: function () {}
    };
  }

  function roleLabel(role) {
    return window.V4_RBAC?.roles?.[role] || role || 'Sem cargo';
  }

  function currentUser() {
    return window.V4_RBAC?.getCurrentUser?.() || null;
  }

  function isOpen(key) {
    return ui().storage.sessionGet(key, false) === true;
  }

  function setOpen(key, value) {
    ui().storage.sessionSet(key, Boolean(value));
  }

  function collectClients() {
    return ui().qsa ? ui().qsa('#sidebar > .client-list [data-client]').map(parseClientButton) : Array.from(document.querySelectorAll('#sidebar > .client-list [data-client]')).map(parseClientButton);
  }

  function parseClientButton(button) {
    return {
      id: button.dataset.client,
      active: button.classList.contains('active'),
      color: button.style.getPropertyValue('--client-color') || '#cf1022',
      initials: button.querySelector('.client-avatar')?.textContent?.trim() || 'CL',
      name: button.querySelector('.client-name')?.textContent?.trim() || button.dataset.client,
      meta: button.querySelector('.client-meta')?.textContent?.trim() || ''
    };
  }

  function squads() {
    return window.V4_RBAC?.storedSquads?.() || [];
  }

  function activeNav(name) {
    return Boolean(document.querySelector('[data-nav="' + name + '"].active'));
  }

  function navButton({ active, attrs, icon, label, sublabel, counter, chevron, extraClass }) {
    const e = ui().escape;
    return '<button class="v4-nav-item ' + (active ? 'active ' : '') + (extraClass || '') + '" type="button" ' + (attrs || '') + '>' +
      '<span class="v4-nav-icon">' + e(icon || '') + '</span>' +
      '<span class="v4-nav-text"><strong>' + e(label || '') + '</strong>' + (sublabel ? '<small>' + e(sublabel) + '</small>' : '') + '</span>' +
      (counter != null ? '<span class="v4-counter">' + e(counter) + '</span>' : '') +
      (chevron ? '<span class="v4-chevron">' + e(chevron) + '</span>' : '') +
      '</button>';
  }

  function section(label, inner) {
    return '<section class="v4-nav-section"><div class="v4-nav-label">' + ui().escape(label) + '</div>' + inner + '</section>';
  }

  function renderSquads(clients) {
    const items = squads();
    if (!items.length) return '';
    const open = isOpen(SQUADS_OPEN_KEY);
    const content = navButton({
      active: open,
      attrs: 'data-v4-squad-toggle',
      icon: '▦',
      label: 'Squads',
      sublabel: 'Selecionar equipe',
      counter: items.length,
      chevron: open ? '⌃' : '⌄'
    }) + '<div class="v4-nav-panel ' + (open ? 'open' : '') + '">' +
      navButton({ attrs: 'data-v4-open-organization', icon: '◎', label: 'Geral / Todos os squads', sublabel: 'Gerenciar equipes', extraClass: 'v4-all' }) +
      items.slice(0, 12).map(function (squad) {
        const firstClient = (squad.clientIds || []).find((id) => clients.some((client) => client.id === id));
        return navButton({
          attrs: firstClient ? 'data-client="' + ui().escape(firstClient) + '"' : 'data-v4-open-organization',
          icon: ui().initials(squad.name),
          label: squad.name,
          sublabel: squad.headEmail || 'Sem head definido',
          counter: (squad.clientIds || []).length,
          extraClass: 'v4-nav-subitem'
        });
      }).join('') + '</div>';
    return section('Equipes', content);
  }

  function renderClients(clients) {
    const open = isOpen(CLIENTS_OPEN_KEY);
    const active = clients.find((client) => client.active);
    const content = navButton({
      active: open,
      attrs: 'data-v4-client-toggle',
      icon: '◈',
      label: 'Clientes',
      sublabel: active ? active.name : 'Geral / Todos',
      counter: clients.length,
      chevron: open ? '⌃' : '⌄'
    }) + '<div class="v4-nav-panel ' + (open ? 'open' : '') + '">' +
      navButton({ attrs: 'data-nav="global"', icon: '⌂', label: 'Geral / Todos', sublabel: 'Visão consolidada', extraClass: 'v4-all' }) +
      clients.map(function (client) {
        return '<button class="v4-nav-item v4-nav-subitem ' + (client.active ? 'active' : '') + '" type="button" data-client="' + ui().escape(client.id) + '">' +
          '<span class="v4-nav-avatar" style="--client-color:' + ui().escape(client.color) + '">' + ui().escape(client.initials) + '</span>' +
          '<span class="v4-nav-text"><strong>' + ui().escape(client.name) + '</strong><small>' + ui().escape(client.meta || 'Cliente ativo') + '</small></span>' +
          '</button>';
      }).join('') + '</div>';
    return section('Carteira', content);
  }

  function renderFooter(user) {
    const e = ui().escape;
    const name = user?.name || user?.email || 'Usuário';
    const avatar = user?.avatar_url
      ? '<img src="' + e(user.avatar_url) + '" alt="" />'
      : '<span class="v4-user-footer-avatar">' + e(ui().initials(name)) + '</span>';
    return '<footer class="v4-sidebar-footer">' +
      '<button type="button" class="v4-user-footer-card" data-v4-user-profile>' + avatar +
      '<span class="v4-user-footer-info"><strong>' + e(name) + '</strong><small>' + e(roleLabel(user?.role)) + ' • ' + e(user?.email || '-') + '</small></span><span class="v4-chevron">›</span></button>' +
      '<div class="v4-user-footer-actions"><button type="button" class="primary" data-v4-user-profile>Usuário</button><button type="button" class="danger" data-v4-sidebar-signout>Sair</button></div>' +
      '</footer>';
  }

  function template(user, clients) {
    return '<nav class="v4-sidebar-shell" data-v4-sidebar-shell>' +
      '<header class="v4-sidebar-top"><div class="v4-sidebar-brand"><span><strong>Painel de Comando</strong><small>V4 Company</small></span><span class="v4-sidebar-brand-badge">V4</span></div></header>' +
      '<div class="v4-sidebar-scroll">' +
        section('Principal',
          navButton({ active: activeNav('global'), attrs: 'data-nav="global"', icon: '⌂', label: 'Início' }) +
          navButton({ attrs: 'data-v4-open-organization', icon: '◎', label: 'Organização', chevron: '›' }) +
          navButton({ active: activeNav('settings'), attrs: 'data-nav="settings"', icon: '⚙', label: 'Configurações' })
        ) + renderSquads(clients) + renderClients(clients) +
        section('Sistema', navButton({ icon: '♡', label: 'Status do sistema', counter: clients.length })) +
      '</div>' + renderFooter(user) + '</nav>';
  }

  function render() {
    if (rendering) return;
    const sidebar = document.getElementById('sidebar');
    const user = currentUser();
    if (!sidebar || !user) return;
    rendering = true;
    try {
      const old = sidebar.querySelector('[data-v4-sidebar-shell]');
      const html = template(user, collectClients());
      if (old) old.outerHTML = html;
      else sidebar.insertAdjacentHTML('afterbegin', html);
    } finally {
      rendering = false;
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

  function bind() {
    if (window.__v4SidebarBound) return;
    window.__v4SidebarBound = true;
    document.addEventListener('click', function (event) {
      if (event.target.closest('[data-v4-squad-toggle]')) {
        event.preventDefault();
        setOpen(SQUADS_OPEN_KEY, !isOpen(SQUADS_OPEN_KEY));
        render();
        return;
      }
      if (event.target.closest('[data-v4-client-toggle]')) {
        event.preventDefault();
        setOpen(CLIENTS_OPEN_KEY, !isOpen(CLIENTS_OPEN_KEY));
        render();
        return;
      }
      if (event.target.closest('[data-v4-user-profile], [data-v4-open-organization]')) {
        event.preventDefault();
        openUserPage();
        return;
      }
      if (event.target.closest('[data-v4-sidebar-signout]')) {
        event.preventDefault();
        signOut();
        return;
      }
      if (event.target.closest('[data-client]')) {
        setOpen(CLIENTS_OPEN_KEY, true);
        setTimeout(render, 120);
      }
      if (event.target.closest('[data-nav="global"]')) {
        setOpen(CLIENTS_OPEN_KEY, false);
        setTimeout(render, 120);
      }
    }, true);
  }

  function start() {
    bind();
    render();
    window.addEventListener('v4:rbac:user-ready', render);
    window.addEventListener('v4:growthpack:sources-ready', render);
    window.addEventListener('v4:rbac:squads-updated', render);
    document.addEventListener('click', function () { setTimeout(render, 90); }, true);
    ui().log('sidebar', 'Sidebar consolidada carregada.');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
