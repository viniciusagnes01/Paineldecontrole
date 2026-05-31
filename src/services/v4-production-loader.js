(function () {
  function log(type, message) {
    if (window.V4_BOOT_LOG) window.V4_BOOT_LOG(type, message);
  }

  function css(id, href) {
    if (document.getElementById(id)) return Promise.resolve();
    return new Promise(function (resolve, reject) {
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = resolve;
      link.onerror = reject;
      document.head.appendChild(link);
    });
  }

  function js(selector, src, key) {
    if (document.querySelector(selector)) return Promise.resolve();
    return new Promise(function (resolve, reject) {
      const script = document.createElement('script');
      script.src = src;
      script.defer = true;
      if (key) script.dataset[key] = 'true';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async function boot() {
    try {
      await css('v4-ui-system-css', 'src/services/v4-ui-system.css?v=v4-ui-system-20260530-03');
      await css('v4-admin-entity-pages-css', 'src/services/admin-entity-pages.css?v=admin-entity-pages-20260530-02');
      await css('v4-production-ux-css', 'src/services/v4-production-ux.css?v=v4-production-ux-20260530-01');
      await js('script[data-v4-ui-helpers]', 'src/services/v4-ui-helpers.js?v=v4-ui-helpers-20260530-01', 'v4UiHelpers');
      await Promise.all([
        js('script[data-v4-auth-redirect-fix]', 'src/services/auth-redirect-fix.js?v=auth-redirect-fix-20260530-01', 'v4AuthRedirectFix'),
        js('script[data-v4-drive-auto-sync]', 'src/services/drive-live-auto-sync.js?v=drive-live-auto-sync-20260530-01', 'v4DriveAutoSync'),
        js('script[data-v4-rbac-core]', 'src/services/rbac-core.js?v=rbac-core-20260530-03', 'v4RbacCore')
      ]);
      await js('script[data-v4-admin-entity-pages]', 'src/services/admin-entity-pages.js?v=admin-entity-pages-20260530-03', 'v4AdminEntityPages');
      await js('script[data-v4-sidebar-polish]', 'src/services/sidebar-organization-polish.js?v=sidebar-polish-20260530-04', 'v4SidebarPolish');
      await js('script[data-v4-admin-media-upload]', 'src/services/admin-media-upload.js?v=admin-media-upload-20260530-01', 'v4AdminMediaUpload');
      log('production_loader', 'UX final, admin separado, sidebar e upload carregados.');
    } catch (error) {
      log('production_loader_error', error.message || String(error));
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
