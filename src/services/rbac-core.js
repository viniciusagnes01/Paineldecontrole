(function () {
  const ROLE_LABELS = {
    SUPER_ADMIN: 'Super Admin',
    DIRETOR_OPERACAO: 'Diretor de Operação',
    HEAD_GROWTH: 'Head Growth',
    GP_ACCOUNT: 'GP / Account',
    GESTOR_TRAFEGO: 'Gestor de Tráfego',
    COPY_CRIATIVO: 'Copy / Criativo',
    CRM_COMERCIAL: 'CRM / Comercial',
    FINANCEIRO: 'Financeiro',
    CLIENTE_SPONSOR: 'Cliente Sponsor',
    CLIENTE_OPERACIONAL: 'Cliente Operacional'
  };

  const PERMISSIONS = {
    SUPER_ADMIN: {
      scope: 'all_clients',
      modules: ['global', 'settings', 'control', 'overview', 'action', 'tasks', 'central', 'ads', 'crm', 'competitors', 'goals', 'status', 'client-config', 'organization'],
      actions: ['view', 'sync_all', 'sync_crm', 'sync_performance', 'refresh', 'create_client', 'edit_client', 'delete_client', 'create_task', 'edit_task', 'edit_action_plan', 'edit_goals', 'edit_campaigns', 'edit_lps', 'edit_competitors', 'export_all', 'reset', 'manage_users', 'manage_permissions', 'manage_integrations'],
      sensitive: ['tokens', 'technical_config', 'finance', 'all_clients', 'audit']
    },
    DIRETOR_OPERACAO: {
      scope: 'all_clients',
      modules: ['global', 'control', 'overview', 'action', 'tasks', 'central', 'ads', 'crm', 'goals', 'status'],
      actions: ['view', 'refresh', 'sync_crm', 'sync_performance', 'edit_action_plan', 'edit_goals'],
      sensitive: ['finance', 'all_clients']
    },
    HEAD_GROWTH: {
      scope: 'squad_clients',
      modules: ['global', 'control', 'overview', 'action', 'tasks', 'central', 'ads', 'crm', 'goals', 'status'],
      actions: ['view', 'refresh', 'sync_crm', 'sync_performance', 'create_task', 'edit_task', 'edit_action_plan', 'edit_goals'],
      sensitive: ['performance', 'operation']
    },
    GP_ACCOUNT: {
      scope: 'assigned_clients',
      modules: ['control', 'overview', 'action', 'tasks', 'central', 'crm', 'goals', 'status'],
      actions: ['view', 'refresh', 'sync_crm', 'create_task', 'edit_task', 'edit_action_plan', 'edit_goals'],
      blocked: ['settings', 'client-config', 'competitors', 'manage_integrations', 'delete_client', 'export_all', 'reset']
    },
    GESTOR_TRAFEGO: {
      scope: 'assigned_clients',
      modules: ['control', 'overview', 'tasks', 'central', 'ads', 'crm', 'goals', 'status'],
      actions: ['view', 'refresh', 'sync_performance', 'edit_campaigns'],
      blocked: ['client-config', 'settings', 'delete_client', 'export_all', 'reset']
    },
    COPY_CRIATIVO: {
      scope: 'assigned_clients',
      modules: ['control', 'overview', 'action', 'tasks', 'central', 'status'],
      actions: ['view', 'refresh', 'create_task', 'edit_task', 'edit_action_plan', 'edit_lps'],
      blocked: ['ads', 'crm', 'goals', 'client-config', 'settings', 'finance']
    },
    CRM_COMERCIAL: {
      scope: 'assigned_clients',
      modules: ['control', 'overview', 'action', 'tasks', 'central', 'crm', 'goals', 'status'],
      actions: ['view', 'refresh', 'sync_crm', 'create_task', 'edit_task'],
      blocked: ['ads', 'competitors', 'client-config', 'settings', 'finance']
    },
    FINANCEIRO: {
      scope: 'all_clients',
      modules: ['global', 'control', 'overview', 'goals', 'status'],
      actions: ['view', 'refresh', 'edit_goals'],
      sensitive: ['finance']
    },
    CLIENTE_SPONSOR: {
      scope: 'assigned_clients',
      modules: ['control', 'overview', 'action', 'tasks', 'goals', 'status'],
      actions: ['view', 'refresh'],
      blocked: ['central', 'ads', 'crm', 'competitors', 'client-config', 'settings']
    },
    CLIENTE_OPERACIONAL: {
      scope: 'assigned_clients',
      modules: ['tasks', 'action', 'status'],
      actions: ['view', 'refresh'],
      blocked: ['global', 'central', 'ads', 'crm', 'competitors', 'goals', 'client-config', 'settings']
    }
  };

  const ACTION_MAP = {
    refresh: 'refresh',
    'sync-all-clients': 'sync_all',
    'sync-crm-client': 'sync_crm',
    'sync-performance-client': 'sync_performance',
    'reset-demo': 'reset',
    'export-json': 'export_all'
  };

  const COLLECTION_ACTIONS = {
    lps: 'edit_lps',
    pixels: 'manage_integrations',
    competitors: 'edit_competitors',
    campaigns: 'edit_campaigns',
    creatives: 'edit_campaigns',
    tasks: 'edit_task',
    actionPlan: 'edit_action_plan'
  };

  const DEFAULT_USERS = [
    {
      id: 'user-vinicius',
      name: 'Vinicius Agnes',
      email: 'vinicius.agnes@v4company.com',
      role: 'SUPER_ADMIN',
      level: 'owner',
      squads: ['black-ops', 'growth', 'ops'],
      clientIds: ['*'],
      active: true
    }
  ];

  function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
  }

  function storedUsers() {
    try {
      const saved = JSON.parse(localStorage.getItem('v4-rbac-users') || '[]');
      const merged = [...DEFAULT_USERS];
      saved.forEach((user) => {
        const index = merged.findIndex((item) => normalizeEmail(item.email) === normalizeEmail(user.email));
        if (index >= 0) merged[index] = { ...merged[index], ...user };
        else merged.push(user);
      });
      return merged;
    } catch (_error) {
      return DEFAULT_USERS.slice();
    }
  }

  function saveUsers(users) {
    const custom = (users || []).filter((user) => !DEFAULT_USERS.some((base) => normalizeEmail(base.email) === normalizeEmail(user.email)) || user.role !== DEFAULT_USERS.find((base) => normalizeEmail(base.email) === normalizeEmail(user.email))?.role);
    localStorage.setItem('v4-rbac-users', JSON.stringify(custom));
  }

  async function getSession() {
    if (!window.V4_DRIVE_LIVE || typeof window.V4_DRIVE_LIVE.getSession !== 'function') return null;
    return window.V4_DRIVE_LIVE.getSession().catch(() => null);
  }

  function userFromSession(session) {
    const email = normalizeEmail(session?.user?.email);
    const metadata = session?.user?.user_metadata || {};
    const saved = storedUsers().find((user) => normalizeEmail(user.email) === email);
    if (saved) {
      return {
        ...saved,
        name: saved.name || metadata.full_name || metadata.name || email,
        avatar_url: metadata.avatar_url || metadata.picture || saved.avatar_url || null,
        provider: session?.user?.app_metadata?.provider || saved.provider || 'email'
      };
    }
    const isInternal = email.endsWith('@v4company.com');
    return {
      id: session?.user?.id || 'anonymous',
      name: metadata.full_name || metadata.name || email || 'Usuário',
      email,
      avatar_url: metadata.avatar_url || metadata.picture || null,
      provider: session?.user?.app_metadata?.provider || 'email',
      role: isInternal ? 'GP_ACCOUNT' : 'CLIENTE_SPONSOR',
      level: 'default',
      squads: [],
      clientIds: [],
      active: true
    };
  }

  let currentUser = null;

  async function refreshCurrentUser() {
    const session = await getSession();
    currentUser = userFromSession(session);
    window.dispatchEvent(new CustomEvent('v4:rbac:user-ready', { detail: currentUser }));
    return currentUser;
  }

  function permissionsFor(role) {
    return PERMISSIONS[role] || PERMISSIONS.CLIENTE_SPONSOR;
  }

  function canAccessModule(user, moduleId) {
    const permissions = permissionsFor(user?.role);
    return Boolean(permissions.modules.includes(moduleId));
  }

  function canDo(user, action) {
    if (!action) return true;
    const permissions = permissionsFor(user?.role);
    return Boolean(permissions.actions.includes(action));
  }

  function canAccessClient(user, clientId) {
    if (!clientId) return true;
    const permissions = permissionsFor(user?.role);
    if (permissions.scope === 'all_clients') return true;
    if ((user?.clientIds || []).includes('*')) return true;
    return (user?.clientIds || []).includes(clientId);
  }

  function allowedModules(user) {
    return permissionsFor(user?.role).modules.slice();
  }

  function actionForElement(el) {
    const action = el?.dataset?.action;
    if (action && ACTION_MAP[action]) return ACTION_MAP[action];
    const collection = el?.dataset?.collection;
    if (collection && COLLECTION_ACTIONS[collection]) return COLLECTION_ACTIONS[collection];
    if (el?.dataset?.deleteClient) return 'delete_client';
    if (el?.dataset?.saveRow) return COLLECTION_ACTIONS[el.dataset.collection] || 'edit_task';
    if (el?.dataset?.deleteRow) return COLLECTION_ACTIONS[el.dataset.collection] || 'edit_task';
    if (el?.matches?.('form[data-submit="add-client"]')) return 'create_client';
    if (el?.matches?.('form[data-submit="save-client-profile"]')) return 'edit_client';
    if (el?.matches?.('form[data-submit="save-goals"]')) return 'edit_goals';
    if (el?.matches?.('form[data-submit="add-row"]')) return COLLECTION_ACTIONS[el.dataset.collection] || 'edit_task';
    return null;
  }

  function requireAction(action) {
    if (!canDo(currentUser, action)) {
      throw new Error('Acesso negado para esta ação.');
    }
    return true;
  }

  function setUserRole(email, role, clientIds, extra) {
    const users = storedUsers();
    const normalized = normalizeEmail(email);
    let user = users.find((item) => normalizeEmail(item.email) === normalized);
    if (!user) {
      user = { id: 'user-' + normalized.replace(/[^a-z0-9]+/g, '-'), email: normalized, name: normalized, active: true, squads: [], clientIds: [] };
      users.push(user);
    }
    Object.assign(user, extra || {}, { role, clientIds: Array.isArray(clientIds) ? clientIds : (clientIds ? String(clientIds).split(',').map((id) => id.trim()).filter(Boolean) : user.clientIds || []) });
    saveUsers(users);
    return user;
  }

  window.V4_RBAC = {
    roles: ROLE_LABELS,
    permissions: PERMISSIONS,
    defaultUsers: DEFAULT_USERS,
    storedUsers,
    saveUsers,
    refreshCurrentUser,
    getCurrentUser: () => currentUser,
    userFromSession,
    permissionsFor,
    canAccessModule,
    canAccessClient,
    canDo,
    allowedModules,
    actionForElement,
    requireAction,
    setUserRole,
    storesRowsInSupabase: false
  };

  refreshCurrentUser();
})();
