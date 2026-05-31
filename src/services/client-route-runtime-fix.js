(function () {
  function ensureCss() {
    var id = 'v4-client-route-runtime-fix-css';
    var href = 'src/services/client-route-runtime-fix.css?v=client-route-fix-20260531-01';
    var existing = document.getElementById(id);
    if (existing) {
      if (existing.href.indexOf('client-route-fix-20260531-01') === -1) existing.href = href;
      return;
    }
    var link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }

  function isClientRoute() {
    return Boolean(document.querySelector('#main .client-hero'));
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
    ensureCss();
    var main = document.getElementById('main');
    if (!main) return;
    if (isClientRoute()) main.classList.add('v4-client-page-active');
    else main.classList.remove('v4-client-page-active');
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
    if (window.V4_BOOT_LOG) window.V4_BOOT_LOG('client_route_fix', 'Correcao especifica da rota de cliente carregada.');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
