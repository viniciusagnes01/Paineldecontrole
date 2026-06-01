(function () {
  function normalizeUser(user) {
    const base = user || {};
    const role = base.role || 'SUPER_ADMIN';
    const roleConfig = window.V4_ROLES && window.V4_ROLES[role] ? window.V4_ROLES[role] : null;
    return {
      id: base.id || 'current-user',
      name: base.name || 'Usuario V4',
      email: base.email || '',
      role,
      level: Number(base.level || roleConfig?.level || 100),
      active: base.active !== false,
      squads: Array.isArray(base.squads) ? base.squads : ['black-ops'],
      clientIds: Array.isArray(base.clientIds) ? base.clientIds : ['*'],
      avatar_url: base.avatar_url || base.avatarUrl || ''
    };
  }

  function getCurrentUser() {
    return normalizeUser(window.V4_CURRENT_USER || window.V4_SUPABASE_USER || null);
  }

  function setCurrentUser(user) {
    window.V4_CURRENT_USER = normalizeUser(user);
    return window.V4_CURRENT_USER;
  }

  window.V4_AUTH = { normalizeUser, getCurrentUser, setCurrentUser };
  window.V4_CURRENT_USER = getCurrentUser();

  if (window.V4_BOOT_LOG) window.V4_BOOT_LOG('auth', 'Facade em memoria de autenticacao carregada.');
})();
