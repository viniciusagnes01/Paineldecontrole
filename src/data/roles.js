(function () {
  window.V4_ROLES = Object.freeze({
    SUPER_ADMIN: {
      label: 'Super Admin',
      level: 100,
      scope: 'all',
      modules: ['*'],
      actions: ['*'],
      sensitiveData: ['*'],
      blocked: []
    },
    DIRETOR_OPERACAO: {
      label: 'Diretor de Operação',
      level: 90,
      scope: 'all',
      modules: ['cockpit', 'clients', 'growthpack', 'crm', 'media', 'ekyte', 'action-plan', 'fca', 'base-comunicacao', 'account-planning', 'g4-finance', 'squads', 'agents', 'automations', 'admin-read'],
      actions: ['view', 'comment', 'approve', 'create_task', 'edit_action_plan', 'request_fca', 'draft_followup', 'sync_crm', 'sync_media', 'view_finance'],
      blocked: ['tokens:view', 'tokens:edit', 'system:reset', 'endpoint:edit']
    },
    HEAD_GROWTH: {
      label: 'Head Growth',
      level: 80,
      scope: 'squad_clients',
      modules: ['cockpit', 'clients', 'growthpack', 'crm', 'media', 'ekyte', 'action-plan', 'fca', 'base-comunicacao', 'account-planning', 'squads', 'agents'],
      actions: ['view', 'comment', 'approve', 'create_task', 'edit_action_plan', 'request_fca', 'draft_followup', 'sync_crm', 'sync_media'],
      blocked: ['tokens:view', 'tokens:edit', 'system:reset', 'client:delete', 'endpoint:edit', 'export:all']
    },
    GP_ACCOUNT: {
      label: 'GP / Account',
      level: 60,
      scope: 'assigned_clients',
      modules: ['control', 'overview', 'action-plan', 'tasks', 'crm', 'communication', 'fca', 'account-planning', 'reports'],
      actions: ['view', 'comment', 'create_task', 'edit_action_plan', 'draft_followup', 'request_fca', 'sync_crm'],
      blocked: ['tokens:view', 'tokens:edit', 'system:reset', 'client:delete', 'endpoint:edit', 'export:all', 'budget:change']
    },
    GESTOR_TRAFEGO: {
      label: 'Gestor de Tráfego',
      level: 55,
      scope: 'assigned_clients',
      modules: ['control', 'overview', 'media', 'reports', 'tasks'],
      actions: ['view', 'comment', 'sync_media', 'create_task'],
      blocked: ['tokens:view', 'tokens:edit', 'margin:view', 'system:reset', 'client:delete', 'endpoint:edit', 'export:all']
    },
    COPY_CRIATIVO: {
      label: 'Copy / Criativo / LP',
      level: 45,
      scope: 'assigned_clients',
      modules: ['overview', 'media', 'tasks', 'action-plan'],
      actions: ['view', 'comment', 'create_task'],
      blocked: ['revenue:view', 'margin:view', 'tokens:view', 'tokens:edit', 'system:reset', 'client:delete', 'export:all']
    },
    CRM_COMERCIAL: {
      label: 'CRM / Comercial',
      level: 50,
      scope: 'assigned_clients',
      modules: ['control', 'overview', 'crm', 'tasks', 'reports'],
      actions: ['view', 'comment', 'sync_crm', 'create_task'],
      blocked: ['tokens:view', 'tokens:edit', 'margin:view', 'media_budget:view', 'system:reset', 'client:delete', 'export:all']
    },
    FINANCEIRO: {
      label: 'Financeiro',
      level: 70,
      scope: 'assigned_clients',
      modules: ['cockpit', 'clients', 'g4-finance', 'reports'],
      actions: ['view', 'view_finance', 'comment', 'export_finance'],
      blocked: ['tokens:view', 'tokens:edit', 'system:reset', 'client:delete', 'endpoint:edit']
    },
    CLIENTE_SPONSOR: {
      label: 'Cliente Sponsor',
      level: 20,
      scope: 'own_client',
      modules: ['overview', 'results', 'goals', 'action-plan', 'pending-client', 'reports'],
      actions: ['view', 'approve', 'comment'],
      blocked: ['internal_tasks:view', 'tokens:view', 'tokens:edit', 'margin:view', 'internal_comments:view', 'playbooks:view', 'export_all']
    },
    CLIENTE_OPERACIONAL: {
      label: 'Cliente Operacional',
      level: 10,
      scope: 'own_client',
      modules: ['overview', 'results', 'pending-client'],
      actions: ['view', 'comment'],
      blocked: ['internal_tasks:view', 'tokens:view', 'tokens:edit', 'margin:view', 'internal_comments:view', 'playbooks:view', 'export_all']
    }
  });

  if (window.V4_BOOT_LOG) window.V4_BOOT_LOG('rbac_roles', 'Matriz de roles carregada.');
})();
