(function () {
  function bootLog(type, message) {
    if (window.V4_BOOT_LOG) window.V4_BOOT_LOG(type, message);
  }

  function loadScriptOnce(selector, src, datasetKey) {
    if (document.querySelector(selector)) return;
    const script = document.createElement('script');
    script.src = src;
    script.defer = true;
    script.dataset[datasetKey] = 'true';
    document.head.appendChild(script);
  }

  function loadAuthRedirectFix() {
    loadScriptOnce(
      'script[data-v4-auth-redirect-fix]',
      'src/services/auth-redirect-fix.js?v=auth-redirect-fix-20260530-01',
      'v4AuthRedirectFix'
    );
  }

  function loadAutoSync() {
    loadScriptOnce(
      'script[data-v4-drive-auto-sync]',
      'src/services/drive-live-auto-sync.js?v=drive-live-auto-sync-20260530-01',
      'v4DriveAutoSync'
    );
  }

  function loadRbac() {
    loadScriptOnce(
      'script[data-v4-rbac-core]',
      'src/services/rbac-core.js?v=rbac-core-20260530-02',
      'v4RbacCore'
    );
    loadScriptOnce(
      'script[data-v4-rbac-ui]',
      'src/services/rbac-ui-patch.js?v=rbac-ui-20260530-02',
      'v4RbacUi'
    );
    loadScriptOnce(
      'script[data-v4-rbac-squads]',
      'src/services/rbac-squads-patch.js?v=rbac-squads-20260530-01',
      'v4RbacSquads'
    );
  }

  loadAuthRedirectFix();
  loadAutoSync();
  loadRbac();

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, function (char) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char];
    });
  }
})();
