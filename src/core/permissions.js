(function () {
  const TAB_TO_MODULE = Object.freeze({
    control: 'control',
    overview: 'overview',
    action: 'action-plan',
    tasks: 'tasks',
    central: 'growthpack',
    ads: 'media',
    crm: 'crm',
    competitors: 'reports',
    goals: 'goals',
    status: 'reports',
    'client-config': 'admin'
  });

  function currentUser() {
    return window.V4_AUTH?.getCurrentUser?.() || window.V4_CURRENT_USER || { role: 'SUPER_ADMIN', clientIds: ['*'], squads: ['black-ops'] };
  }

  function roleOf(user) {
    const roleId = user?.role || 'SUPER_ADMIN';
    return window.V4_ROLES?.[roleId] || window.V4_ROLES?.SUPER_ADMIN || { modules: ['*'], actions: ['*'], blocked: [], scope: 'all' };
  }

  function listIncludes(list, value) {
    return Array.isArray(list) && (list.includes('*') || list.includes(value));
  }

  function canAccessClient(user, clientId) {
    const role = roleOf(user);
    if (!clientId) return true;
    if (role.scope === 'all' || listIncludes(user?.clientIds, '*')) return true;
    if (listIncludes(user?.clientIds, clientId)) return true;
    const squads = window.V4_SQUADS || [];
    const userSquads = Array.isArray(user?.squads) ? user.squads : [];
    return squads.some((squad) => userSquads.includes(squad.id) && (listIncludes(squad.clientIds, '*') || listIncludes(squad.clientIds, clientId)));
  }

  function canAccessModule(user, moduleId, clientId) {
    const role = roleOf(user);
    if (!canAccessClient(user, clientId)) return false;
    if (listIncludes(role.modules, '*')) return true;
    return listIncludes(role.modules, moduleId) || listIncludes(role.modules, TAB_TO_MODULE[moduleId]);
  }

  function can(user, action, context) {
    const role = roleOf(user);
    const ctx = context || {};
    if (listIncludes(role.blocked, action)) return false;
    if (!canAccessClient(user, ctx.clientId)) return false;
    if (ctx.moduleId && !canAccessModule(user, ctx.moduleId, ctx.clientId)) return false;
    if (listIncludes(role.actions, '*')) return true;
    return listIncludes(role.actions, action);
  }

  function requirePermission(action, context) {
    const user = currentUser();
    if (!can(user, action, context)) {
      const error = new Error('Acesso negado para esta acao.');
      error.code = 'V4_ACCESS_DENIED';
      error.action = action;
      error.context = context || {};
      if (window.V4_AUDIT_LOG) window.V4_AUDIT_LOG.record('access_denied', { action, context: context || {} });
      throw error;
    }
    return true;
  }

  function filterTabs(tabs, user, clientId) {
    return (tabs || []).filter((tab) => canAccessModule(user || currentUser(), TAB_TO_MODULE[tab.id] || tab.id, clientId));
  }

  window.V4_PERMISSIONS = { TAB_TO_MODULE, can, canAccessClient, canAccessModule, requirePermission, filterTabs };
  window.can = can;
  window.canAccessModule = canAccessModule;
  window.requirePermission = requirePermission;

  if (window.V4_BOOT_LOG) window.V4_BOOT_LOG('permissions', 'Helpers RBAC carregados.');
})();
