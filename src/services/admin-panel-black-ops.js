// Sistema de painel administrativo BLACK OPS
(function () {
  const ADMIN_CLIENT_ID = 'black-ops';

  // Função para interceptar renderização da sidebar
  function enhanceSidebar() {
    const clientList = document.querySelector('.client-list');
    if (!clientList) return;

    // Remover BLACK OPS se já existir
    const existing = clientList.querySelector('[data-client="black-ops"]');
    if (existing) existing.remove();

    // Adicionar BLACK OPS no topo com styling especial
    const blackOpsBtn = document.createElement('button');
    blackOpsBtn.className = 'client-btn admin-client-btn';
    blackOpsBtn.dataset.client = 'black-ops';
    blackOpsBtn.style.cssText = `
      --client-color: #1a1a2e;
      margin-bottom: 12px;
      border: 2px solid rgba(255, 215, 0, 0.4);
      background: linear-gradient(135deg, rgba(26, 26, 46, 0.6) 0%, rgba(22, 33, 62, 0.8) 100%);
    `;

    blackOpsBtn.innerHTML = `
      <span class="client-avatar" style="background: linear-gradient(135deg, #ffd700, #ff8c00); font-weight: bold; color: #000;">☠</span>
      <span>
        <span class="client-name">BLACK OPS</span>
        <span class="client-meta">Painel administrativo geral</span>
      </span>
    `;

    blackOpsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.client-btn').forEach(btn => btn.classList.remove('active'));
      blackOpsBtn.classList.add('active');
      // Disparar evento customizado para app.js atualizar a rota
      document.dispatchEvent(new CustomEvent('v4:client-changed', {
        detail: { clientId: 'black-ops' }
      }));
    });

    clientList.insertBefore(blackOpsBtn, clientList.firstChild);
  }

  // Observar mudanças na sidebar
  document.addEventListener('DOMContentLoaded', () => {
    enhanceSidebar();
    const observer = new MutationObserver(() => {
      requestAnimationFrame(enhanceSidebar);
    });
    observer.observe(document.querySelector('.sidebar') || document.body, {
      childList: true,
      subtree: true
    });
  });

  // Exportar funções
  window.V4_ADMIN = {
    ADMIN_CLIENT_ID,
    enhanceSidebar
  };
})();
