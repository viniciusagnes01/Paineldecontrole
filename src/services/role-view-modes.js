(function () {
  function bootLog(type, message) {
    if (window.V4_BOOT_LOG) window.V4_BOOT_LOG(type, message);
  }

  function removeRoleViewBlocks() {
    document.querySelectorAll('[data-v4-role-toolbar], [data-v4-role-panel]').forEach(function (node) {
      node.remove();
    });

    document.querySelectorAll('.glass-card, article, section, div').forEach(function (node) {
      const text = String(node.textContent || '').replace(/\s+/g, ' ').trim();
      const isRoleToolbar = /Modo de gest[aã]o/i.test(text) && /GP detalhista|Coordenador|COO/i.test(text);
      const isGpHero = /Vis[aã]o GP detalhista/i.test(text) || /Execu[cç][aã]o detalhada por cliente/i.test(text);
      const isCoordinatorHero = /Vis[aã]o Coordenador/i.test(text) || /Central de opera[cç][aã]o e exce[cç][oõ]es/i.test(text);
      const isCooHero = /Vis[aã]o COO/i.test(text) || /Resumo executivo da carteira/i.test(text);

      if (isRoleToolbar || isGpHero || isCoordinatorHero || isCooHero) {
        const removable = node.closest('[data-v4-role-toolbar], [data-v4-role-panel], .glass-card, article, section') || node;
        removable.remove();
      }
    });

    document.body.classList.remove('v4-mode-gp', 'v4-mode-coordinator', 'v4-mode-coo');
  }

  function start() {
    removeRoleViewBlocks();
    document.addEventListener('click', function () {
      setTimeout(removeRoleViewBlocks, 50);
      setTimeout(removeRoleViewBlocks, 300);
    }, true);

    const observer = new MutationObserver(function () {
      clearTimeout(window.__v4RoleViewCleanupTimer);
      window.__v4RoleViewCleanupTimer = setTimeout(removeRoleViewBlocks, 60);
    });

    if (document.body) observer.observe(document.body, { childList: true, subtree: true });
    bootLog('role_view_modes', 'Modo de gestao removido globalmente.');
  }

  window.V4_ROLE_VIEW_MODES = {
    applyRoleView: removeRoleViewBlocks,
    setMode: removeRoleViewBlocks,
    mode: function () { return 'disabled'; },
    sanitizeState: function () { return true; },
    disabled: true
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
