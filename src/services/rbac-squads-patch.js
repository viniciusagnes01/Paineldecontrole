(function () {
  function log(type, message) {
    if (window.V4_BOOT_LOG) window.V4_BOOT_LOG(type, message);
  }

  function user() {
    return window.V4_RBAC?.getCurrentUser?.() || null;
  }

  function roleLabel(role) {
    return window.V4_RBAC?.roles?.[role] || role || 'Sem cargo';
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, function (char) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char];
    });
  }

  async function loadRealClients() {
    const auto = window.V4_DRIVE_LIVE_AUTO_SYNC?.snapshot?.();
    if (auto?.clients?.length) {
      return auto.clients.map(function (client) {
        return {
          id: client.client_id || client.id,
          name: client.client_name || client.name,
          source: 'Supabase/Drive',
          count: client.growthpack_sources_count || client.active_drive_sources_count || 0
        };
      }).filter(function (client) { return client.id && client.name; });
    }
    if (window.V4_DRIVE_LIVE?.panelClients) {
      const payload = await window.V4_DRIVE_LIVE.panelClients();
      return (payload.data || []).map(function (client) {
        return {
          id: client.client_id || client.id,
          name: client.client_name || client.name,
          source: 'Supabase/Drive',
          count: client.growthpack_sources_count || client.active_drive_sources_count || 0
        };
      }).filter(function (client) { return client.id && client.name; });
    }
    return [];
  }

  function clientName(clientId, clients) {
    if (clientId === '*') return 'Todos os clientes';
    return clients.find(function (client) { return client.id === clientId; })?.name || clientId;
  }

  function picker(clients, selected) {
    selected = selected || [];
    return '<div class="v4-client-picker" data-v4-squad-client-picker>' + clients.map(function (client) {
      const checked = selected.includes(client.id) ? 'checked' : '';
      return '<label><input type="checkbox" value="' + escapeHtml(client.id) + '" data-v4-squad-client-check ' + checked + ' /> <span><strong>' + escapeHtml(client.name) + '</strong><span class="v4-client-meta">' + escapeHtml(client.source) + ' • ' + escapeHtml(client.count) + ' fontes</span></span></label>';
    }).join('') + '</div>';
  }

  function renderSquads(clients) {
    const current = user();
    const canManage = window.V4_RBAC?.canManageSquads?.(current);
    const squads = window.V4_RBAC?.storedSquads?.() || [];
    const users = window.V4_RBAC?.storedUsers?.() || [];
    const headOptions = users
      .filter(function (u) { return ['SUPER_ADMIN', 'DIRETOR_OPERACAO', 'HEAD_GROWTH'].includes(u.role); })
      .map(function (u) { return '<option value="' + escapeHtml(u.email) + '">' + escapeHtml(u.name || u.email) + ' • ' + escapeHtml(roleLabel(u.role)) + '</option>'; })
      .join('');

    return '<section data-v4-squads-section style="margin-top:22px;border-top:1px solid rgba(255,255,255,.12);padding-top:18px">' +
      '<h3>Squads / equipes</h3>' +
      '<p style="font-size:13px;color:#aeb4c4">Heads, Diretores e Super Admins podem organizar clientes reais do Supabase/Drive dentro de cada squad. Isso alimenta o escopo de acesso por equipe.</p>' +
      '<table><thead><tr><th>Squad</th><th>Head</th><th>Clientes vinculados</th></tr></thead><tbody>' +
      squads.map(function (squad) {
        const names = (squad.clientIds || []).map(function (id) { return clientName(id, clients); }).join(', ') || '-';
        return '<tr><td>' + escapeHtml(squad.name) + '<br><small class="v4-client-meta">' + escapeHtml(squad.id) + '</small></td><td>' + escapeHtml(squad.headEmail || '-') + '</td><td>' + escapeHtml(names) + '</td></tr>';
      }).join('') +
      '</tbody></table>' +
      (canManage ? '<h3>Adicionar/editar squad</h3><form data-v4-squad-form><div class="v4-org-grid"><label>Nome do squad<input name="name" placeholder="Ex.: Squad Alphaville" required /></label><label>Head responsável<select name="headEmail"><option value="">Sem head definido</option>' + headOptions + '</select></label><label>ID opcional<input name="id" placeholder="auto" /></label><div class="v4-org-client-span"><strong>Clientes do squad</strong>' + picker(clients, []) + '</div><button type="submit">Salvar squad</button></div></form>' : '<p class="v4-client-meta">Seu cargo não permite alterar squads.</p>') +
      '</section>';
  }

  async function inject(attempt) {
    attempt = attempt || 0;
    const panel = document.querySelector('[data-v4-org-panel]');
    if (!panel || !window.V4_RBAC) {
      if (attempt < 80) setTimeout(function () { inject(attempt + 1); }, 250);
      return;
    }
    if (panel.querySelector('[data-v4-squads-section]')) return;
    const clients = await loadRealClients().catch(function () { return []; });
    panel.querySelector('div[style*="padding"]')?.insertAdjacentHTML('beforeend', renderSquads(clients));
    const form = panel.querySelector('[data-v4-squad-form]');
    form?.addEventListener('submit', function (event) {
      event.preventDefault();
      const current = user();
      if (!window.V4_RBAC.canManageSquads(current)) {
        alert('Apenas Head Growth, Diretor de Operação ou Super Admin podem editar squads.');
        return;
      }
      const data = new FormData(form);
      const selectedClients = Array.from(form.querySelectorAll('[data-v4-squad-client-check]:checked')).map(function (input) { return input.value; });
      window.V4_RBAC.upsertSquad({
        id: String(data.get('id') || '').trim() || undefined,
        name: String(data.get('name') || '').trim(),
        headEmail: String(data.get('headEmail') || '').trim(),
        clientIds: selectedClients,
        active: true
      });
      panel.querySelector('[data-v4-squads-section]')?.remove();
      inject(0);
      alert('Squad atualizado com clientes reais do Supabase/Drive.');
    });
    log('rbac_squads', 'Seção de squads aplicada na Organização.');
  }

  function start() {
    document.addEventListener('click', function (event) {
      if (event.target.closest('[data-v4-org-launcher]')) setTimeout(function () { inject(0); }, 500);
      if (event.target.closest('[data-v4-refresh-clients]')) setTimeout(function () { inject(0); }, 800);
    }, true);
    const observer = new MutationObserver(function () { inject(0); });
    observer.observe(document.body, { childList: true, subtree: true });
    inject(0);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
