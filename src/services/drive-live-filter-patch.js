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
    loadScriptOnce(
      'script[data-v4-sidebar-polish]',
      'src/services/sidebar-organization-polish.js?v=sidebar-polish-20260530-02',
      'v4SidebarPolish'
    );
    loadScriptOnce(
      'script[data-v4-sidebar-fixed-layout]',
      'src/services/sidebar-fixed-layout.js?v=sidebar-fixed-layout-20260530-01',
      'v4SidebarFixedLayout'
    );
    loadScriptOnce(
      'script[data-v4-organization-page]',
      'src/services/organization-page.js?v=organization-page-20260530-01',
      'v4OrganizationPage'
    );
  }

  loadAuthRedirectFix();
  loadAutoSync();
  loadRbac();

  bootLog('drive_live_filter_patch', 'Carregador modular ativo com sidebar fixa e pagina de organizacao.');
})();
