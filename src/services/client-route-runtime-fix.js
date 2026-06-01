(function () {
  function addCss(id, href) {
    var existing = document.getElementById(id);
    if (existing) {
      existing.href = href;
      return;
    }
    var link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }

  function addJs(selector, src, dataKey) {
    if (document.querySelector(selector)) return;
    var script = document.createElement('script');
    script.src = src;
    script.defer = true;
    if (dataKey) script.dataset[dataKey] = 'true';
    document.head.appendChild(script);
  }

  function removeTechnicalButtons() {
    document.querySelectorAll('#main button').forEach(function (button) {
      var action = String(button.getAttribute('data-action') || '').toLowerCase();
      var text = String(button.textContent || '').toLowerCase();
      if (action.indexOf('sync') >= 0 || action === 'refresh' || action.indexOf('cache') >= 0 || text.indexOf('sincronizar') >= 0 || text.indexOf('debug') >= 0 || text.indexOf('limpar cache') >= 0) {
        button.remove();
      }
    });
  }

  function activate() {
    addCss('v4-client-route-runtime-fix-css', 'src/services/client-route-runtime-fix.css?v=client-route-fix-20260531-02');
    addCss('v4-command-redesign-css', 'src/services/v4-command-redesign.css?v=v4-redesign-20260531-01');
    addJs('script[data-v4-command-redesign]', 'src/services/v4-command-redesign.js?v=v4-redesign-20260531-01', 'v4CommandRedesign');
    removeTechnicalButtons();
  }

  function start() {
    activate();
    setTimeout(activate, 50);
    setTimeout(activate, 300);
    setTimeout(activate, 1200);
    setTimeout(activate, 2400);
    var observer = new MutationObserver(function () {
      clearTimeout(window.__v4ClientRouteFixTimer);
      window.__v4ClientRouteFixTimer = setTimeout(activate, 30);
    });
    if (document.body) observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', activate);
    if (window.V4_BOOT_LOG) window.V4_BOOT_LOG('v4_redesign_bootstrap', 'Novo V4 Command Redesign inicializado pelo runtime fix.');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();