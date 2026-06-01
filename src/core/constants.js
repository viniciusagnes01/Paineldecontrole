(function () {
  window.V4_CONSTANTS = Object.freeze({
    STORAGE_KEY: 'v4-command-center-state-v6-crm-performance-losses',
    APP_NAME: 'V4 Command Center',
    APP_VERSION: '6.1-rbac-base',
    API_PREFIX: '/api',
    DEFAULT_ROLE: 'GP_ACCOUNT',
    SOURCE_STATUS: Object.freeze({
      LIVE: 'live',
      FALLBACK: 'fallback',
      PENDING: 'pending',
      NOT_LOCATED: 'not_located',
      ERROR: 'error',
      BLOCKED: 'blocked'
    }),
    SENSITIVE_ACTIONS: Object.freeze([
      'tokens:view',
      'tokens:edit',
      'system:reset',
      'client:delete',
      'endpoint:edit',
      'export:all',
      'budget:change',
      'fca:close',
      'message:send_sensitive'
    ])
  });

  if (window.V4_BOOT_LOG) window.V4_BOOT_LOG('core_constants', 'Constantes centrais carregadas.');
})();
