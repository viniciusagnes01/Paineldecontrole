(function () {
  const BLOCK_TITLES = [
    /alertas\s+e\s+pontos\s+de\s+aten[cç][aã]o/i,
    /eventos\s+recentes/i,
    /resumo\s+de\s+campanhas/i
  ];

  const BUTTON_TEXTS = [
    /sincronizar\s+todos/i,
    /atualizar$/i,
    /debug/i,
    /limpar\s+cache/i,
    /drive\s+live/i
  ];

  function textOf(node) {
    return String(node?.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function removeCardsByHeading() {
    document.querySelectorAll('h1, h2, h3, h4').forEach(function (heading) {
      const text = textOf(heading);
      if (!BLOCK_TITLES.some(function (pattern) { return pattern.test(text); })) return;
      const card = heading.closest('article, section, .glass-card, .v4-admin-card');
      if (card) card.remove();
    });
  }

  function removeDeadButtons() {
    document.querySelectorAll('button, a.btn, .btn').forEach(function (button) {
      const text = textOf(button);
      const action = button.getAttribute('data-action') || '';
      const isDeadAction = ['sync-all-clients', 'refresh'].includes(action);
      const isDeadText = BUTTON_TEXTS.some(function (pattern) { return pattern.test(text); });
      if (isDeadAction || isDeadText) button.remove();
    });
  }

  function markCleanLayout() {
    document.documentElement.classList.add('v4-final-clean');
    document.body.classList.add('v4-final-clean');
    document.querySelectorAll('.metric-grid, .dashboard-grid, .tab-rail, .tabs, .tab-bar').forEach(function (node) {
      node.setAttribute('data-v4-fluid', 'true');
    });
  }

  function prune() {
    removeCardsByHeading();
    removeDeadButtons();
    markCleanLayout();
  }

  function start() {
    prune();
    document.addEventListener('click', function () {
      setTimeout(prune, 30);
      setTimeout(prune, 180);
    }, true);
    window.addEventListener('v4:growthpack:sources-ready', prune);
    window.addEventListener('v4:rbac:user-ready', prune);
    const observer = new MutationObserver(function () {
      clearTimeout(window.__v4FinalProductPruneTimer);
      window.__v4FinalProductPruneTimer = setTimeout(prune, 40);
    });
    if (document.body) observer.observe(document.body, { childList: true, subtree: true });
    if (window.V4_BOOT_LOG) window.V4_BOOT_LOG('final_product_prune', 'Blocos sem uso removidos da UI final.');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
