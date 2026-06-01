(function () {
  const AUDIT_KEY = 'v4-command-center-audit-log-v1';

  function read() {
    try {
      return JSON.parse(localStorage.getItem(AUDIT_KEY) || '[]');
    } catch (_error) {
      return [];
    }
  }

  function write(rows) {
    try {
      localStorage.setItem(AUDIT_KEY, JSON.stringify((rows || []).slice(0, 500)));
    } catch (_error) {
      // Audit local nunca deve quebrar o painel.
    }
  }

  function currentUser() {
    return window.V4_AUTH?.getCurrentUser?.() || window.V4_CURRENT_USER || {};
  }

  function record(action, payload) {
    const user = currentUser();
    const entry = {
      id: 'audit-' + Date.now() + '-' + Math.random().toString(16).slice(2, 8),
      createdAt: new Date().toISOString(),
      userId: user.id || user.email || 'anonymous',
      userEmail: user.email || '',
      userRole: user.role || '',
      clientId: payload?.clientId || payload?.context?.clientId || null,
      action,
      entity: payload?.entity || null,
      before: payload?.before || null,
      after: payload?.after || null,
      meta: payload?.meta || payload || {}
    };
    const rows = read();
    rows.unshift(entry);
    write(rows);
    return entry;
  }

  function clear() {
    write([]);
  }

  window.V4_AUDIT_LOG = { AUDIT_KEY, read, record, clear };
  if (window.V4_BOOT_LOG) window.V4_BOOT_LOG('audit_log', 'Audit log local carregado.');
})();
