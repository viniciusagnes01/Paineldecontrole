(function () {
  function currentUser() {
    return window.V4_AUTH?.getCurrentUser?.() || window.V4_CURRENT_USER || { role: 'SUPER_ADMIN', clientIds: ['*'] };
  }

  function getClientIdFromPage() {
    const activeClientButton = document.querySelector('[data-client].active');
    return activeClientButton?.getAttribute('data-client') || null;
  }

  function moduleFromTab(tabId) {
    return window.V4_PERMISSIONS?.TAB_TO_MODULE?.[tabId] || tabId;
  }

  function applyTabPermissions(root) {
    const scope = root || document;
    const user = currentUser();
    const clientId = getClientIdFromPage();
    scope.querySelectorAll('[data-tab]').forEach(function (button) {
      const tabId = button.getAttribute('data-tab');
      const moduleId = moduleFromTab(tabId);
      const allowed = window.V4_PERMISSIONS?.canAccessModule?.(user, moduleId, clientId) !== false;
      button.hidden = !allowed;
      button.setAttribute('aria-hidden', allowed ? 'false' : 'true');
      if (!allowed) button.setAttribute('data-rbac-blocked', 'true');
    });
  }

  function protectSensitiveActions(event) {
    const target = event.target.closest('[data-action]');
    if (!target || !window.V4_PERMISSIONS) return;
    const action = target.getAttribute('data-action');
    const clientId = target.getAttribute('data-client-id') || getClientIdFromPage();
    const sensitiveMap = {
      'sync-all-clients': 'sync_all',
      'sync-performance-client': 'sync_media',
      'sync-crm-client': 'sync_crm',
      'delete-client': 'client:delete',
      'reset-system': 'system:reset',
      'edit-endpoint': 'endpoint:edit',
      'export-all': 'export:all'
    };
    const permission = sensitiveMap[action];
    if (!permission) return;
    try {
      window.V4_PERMISSIONS.requirePermission(permission, { clientId, entity: 'runtime_action', action });
      window.V4_AUDIT_LOG?.record?.('action_allowed', { clientId, entity: 'runtime_action', meta: { action, permission } });
    } catch (error) {
      event.preventDefault();
      event.stopPropagation();
      alert(error.message || 'Acesso negado para esta ação.');
    }
  }

  function start() {
    applyTabPermissions(document);
    document.addEventListener('click', protectSensitiveActions, true);
    const observer = new MutationObserver(function (mutations) {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach(function (node) {
          if (node.nodeType === 1) applyTabPermissions(node);
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    window.V4_RBAC_RUNTIME = { applyTabPermissions, protectSensitiveActions };
    window.V4_BOOT_LOG?.('rbac_runtime', 'Bridge RBAC aplicado em abas e ações sensíveis.');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
