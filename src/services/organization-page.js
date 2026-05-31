(function () {
  const SUPABASE_TABLES = {
    profiles: 'organization_profiles',
    squads: 'organization_squads',
    userClients: 'organization_user_clients'
  };

  let cachedClients = [];

  function log(type, message) {
    if (window.V4_BOOT_LOG) window.V4_BOOT_LOG(type, message);
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, function (char) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char];
    });
  }

  function roleLabel(role) {
    return window.V4_RBAC?.roles?.[role] || role || 'Sem cargo';
  }

  function currentUser() {
    return window.V4_RBAC?.getCurrentUser?.() || null;
  }

  function supabaseClient() {
    try {
      return window.V4_DRIVE_LIVE?.ensureClient?.() || null;
    } catch (_error) {
      return null;
    }
  }

  async function loadRealClients() {
    const auto = window.V4_DRIVE_LIVE_AUTO_SYNC?.snapshot?.();
    if (auto?.clients?.length) {
      cachedClients = auto.clients.map(function (client) {
        return {
          id: client.client_id || client.id,
          name: client.client_name || client.name,
          source: 'Supabase/Drive',
          count: client.growthpack_sources_count || client.active_drive_sources_count || 0
        };
      }).filter(function (client) { return client.id && client.name; });
      return cachedClients;
    }

    if (window.V4_DRIVE_LIVE?.panelClients) {
      const payload = await window.V4_DRIVE_LIVE.panelClients();
      cachedClients = (payload.data || []).map(function (client) {
        return {
          id: client.client_id || client.id,
          name: client.client_name || client.name,
          source: 'Supabase/Drive',
          count: client.growthpack_sources_count || client.active_drive_sources_count || 0
        };
      }).filter(function (client) { return client.id && client.name; });
      return cachedClients;
    }

    return cachedClients;
  }

  function clientName(id) {
    if (id === '*') return 'Todos os clientes';
    return cachedClients.find(function (client) { return client.id === id; })?.name || id;
  }

  async function loadSupabaseProfiles() {
    const client = supabaseClient();
    if (!client?.from) return null;
    try {
      const response = await client.from(SUPABASE_TABLES.profiles).select('*').order('name', { ascending: true });
      if (response.error) throw response.error;
      return response.data || [];
    } catch (error) {
      log('organization_supabase_profiles_fallback', error.message);
      return null;
    }
  }

  async function saveProfileSupabase(profile) {
    const client = supabaseClient();
    if (!client?.from) return { ok: false, reason: 'supabase_unavailable' };
    try {
      const response = await client.from(SUPABASE_TABLES.profiles).upsert(profile, { onConflict: 'email' }).select().single();
      if (response.error) throw response.error;
      return { ok: true, data: response.data };
    } catch (error) {
      log('organization_supabase_profile_save_fallback', error.message);
      return { ok: false, reason: error.message };
    }
  }

  async function saveSquadSupabase(squad) {
    const client = supabaseClient();
    if (!client?.from) return { ok: false, reason: 'supabase_unavailable' };
    try {
      const response = await client.from(SUPABASE_TABLES.squads).upsert(squad, { onConflict: 'id' }).select().single();
      if (response.error) throw response.error;
      return { ok: true, data: response.data };
    } catch (error) {
      log('organization_supabase_squad_save_fallback', error.message);
      return { ok: false, reason: error.message };
    }
  }

  function roleOptions(selected) {
    return Object.entries(window.V4_RBAC?.roles || {}).map(function ([key, label]) {
      return '<option value="' + escapeHtml(key) + '" ' + (key === selected ? 'selected' : '') + '>' + escapeHtml(label) + '</option>';
    }).join('');
  }

  function usersList(profiles) {
    const localUsers = window.V4_RBAC?.storedUsers?.() || [];
    const byEmail = new Map();
    localUsers.forEach(function (user) { byEmail.set(String(user.email || '').toLowerCase(), user); });
    (profiles || []).forEach(function (profile) {
      byEmail.set(String(profile.email || '').toLowerCase(), {
        ...byEmail.get(String(profile.email || '').toLowerCase()),
        ...profile,
        role: profile.role || byEmail.get(String(profile.email || '').toLowerCase())?.role
      });
    });
    return Array.from(byEmail.values()).filter(function (user) { return user.email; });
  }

  function clientPicker(name, selected, attr) {
    selected = selected || [];
    return '<div class="org-client-picker">' +
      '<label><input type="checkbox" name="' + escapeHtml(name) + '" value="*" ' + (selected.includes('*') ? 'checked' : '') + ' ' + (attr || '') + ' /> <span><strong>Todos os clientes</strong><small>Acesso global da carteira</small></span></label>' +
      cachedClients.map(function (client) {
        return '<label><input type="checkbox" name="' + escapeHtml(name) + '" value="' + escapeHtml(client.id) + '" ' + (selected.includes(client.id) ? 'checked' : '') + ' ' + (attr || '') + ' /> <span><strong>' + escapeHtml(client.name) + '</strong><small>' + escapeHtml(client.source) + ' • ' + escapeHtml(client.count) + ' fontes</small></span></label>';
      }).join('') +
      '</div>';
  }

  function ensureStyle() {
    if (document.getElementById('v4-organization-page-style')) return;
    const style = document.createElement('style');
    style.id = 'v4-organization-page-style';
    style.textContent = `
      .org-page{display:flex;flex-direction:column;gap:18px;padding:22px}.org-hero{display:grid;grid-template-columns:1.2fr .8fr;gap:18px;align-items:stretch}.org-card{border:1px solid rgba(255,255,255,.11);background:rgba(255,255,255,.045);border-radius:24px;padding:20px;box-shadow:0 22px 70px rgba(0,0,0,.22)}.org-card h2,.org-card h3{margin:0 0 8px}.org-card p{color:#aeb4c4}.org-tabs{display:flex;gap:8px;flex-wrap:wrap}.org-tab{border:0;border-radius:999px;padding:11px 14px;background:rgba(255,255,255,.08);color:#fff;font-weight:900;cursor:pointer}.org-tab.active{background:#cf1022}.org-grid{display:grid;grid-template-columns:repeat(12,1fr);gap:16px}.org-span-4{grid-column:span 4}.org-span-5{grid-column:span 5}.org-span-7{grid-column:span 7}.org-span-8{grid-column:span 8}.org-span-12{grid-column:span 12}.org-form{display:grid;grid-template-columns:repeat(12,1fr);gap:12px}.org-form label{display:flex;flex-direction:column;gap:6px;color:#dfe3ed;font-weight:850}.org-form input,.org-form select,.org-form textarea{width:100%;box-sizing:border-box;border:1px solid rgba(255,255,255,.13);background:rgba(0,0,0,.22);color:#fff;border-radius:14px;padding:11px;font-weight:800}.org-form textarea{min-height:84px;resize:vertical}.org-form .field-3{grid-column:span 3}.org-form .field-4{grid-column:span 4}.org-form .field-6{grid-column:span 6}.org-form .field-8{grid-column:span 8}.org-form .field-12{grid-column:span 12}.org-btn{border:0;border-radius:14px;padding:12px 16px;font-weight:950;cursor:pointer;background:#cf1022;color:#fff}.org-btn.ghost{background:rgba(255,255,255,.09)}.org-table{width:100%;border-collapse:collapse;font-size:13px}.org-table th,.org-table td{padding:12px;border-bottom:1px solid rgba(255,255,255,.08);text-align:left}.org-avatar{width:44px;height:44px;border-radius:16px;object-fit:cover;background:#cf1022;display:grid;place-items:center;font-weight:950;color:#fff}.org-user-row{display:flex;align-items:center;gap:10px}.org-client-picker{max-height:230px;overflow:auto;border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:8px;background:rgba(0,0,0,.18)}.org-client-picker label{display:flex!important;gap:8px;align-items:flex-start;padding:8px;border-radius:12px}.org-client-picker label:hover{background:rgba(255,255,255,.06)}.org-client-picker input{width:auto!important;margin-top:3px}.org-client-picker small{display:block;color:#9ea6b8;margin-top:2px}.org-muted{color:#aeb4c4}.org-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.org-kpi{padding:14px;border-radius:18px;background:rgba(255,255,255,.06)}.org-kpi small{display:block;color:#aeb4c4}.org-kpi strong{font-size:24px}.org-status{font-size:12px;color:#aeb4c4}.org-pill{display:inline-flex;border-radius:999px;padding:5px 8px;background:rgba(255,255,255,.08);font-size:11px;font-weight:900;margin:2px}@media(max-width:900px){.org-hero,.org-grid,.org-form,.org-kpis{grid-template-columns:1fr}.org-span-4,.org-span-5,.org-span-7,.org-span-8,.org-span-12,.org-form .field-3,.org-form .field-4,.org-form .field-6,.org-form .field-8,.org-form .field-12{grid-column:auto}}
    `;
    document.head.appendChild(style);
  }

  function profileCard(user) {
    const avatar = user?.avatar_url ? '<img class="org-avatar" src="' + escapeHtml(user.avatar_url) + '" alt="" />' : '<span class="org-avatar">' + escapeHtml(String(user?.name || user?.email || 'V4').slice(0, 2).toUpperCase()) + '</span>';
    return '<div class="org-card"><div class="org-user-row">' + avatar + '<div><h3>' + escapeHtml(user?.name || 'Usuário') + '</h3><p style="margin:0">' + escapeHtml(user?.email || '-') + ' • ' + escapeHtml(roleLabel(user?.role)) + '</p></div></div><div class="org-kpis" style="margin-top:16px"><div class="org-kpi"><small>Cargo</small><strong>' + escapeHtml(roleLabel(user?.role)) + '</strong></div><div class="org-kpi"><small>Escopo</small><strong>' + escapeHtml((user?.clientIds || []).includes('*') ? 'Todos' : ((user?.clientIds || []).length || 'Squad')) + '</strong></div><div class="org-kpi"><small>Clientes</small><strong>' + escapeHtml(cachedClients.length) + '</strong></div><div class="org-kpi"><small>Squads</small><strong>' + escapeHtml((window.V4_RBAC?.storedSquads?.() || []).length) + '</strong></div></div></div>';
  }

  function renderUsersTab(profiles) {
    const users = usersList(profiles);
    return '<div class="org-grid"><section class="org-card org-span-7"><h3>Usuários cadastrados</h3><p>Gestão de usuários, cargos, foto/perfil e escopo de clientes.</p><table class="org-table"><thead><tr><th>Usuário</th><th>Cargo</th><th>Clientes</th></tr></thead><tbody>' + users.map(function (user) {
      const photo = user.avatar_url ? '<img class="org-avatar" src="' + escapeHtml(user.avatar_url) + '" />' : '<span class="org-avatar">' + escapeHtml(String(user.name || user.email).slice(0, 2).toUpperCase()) + '</span>';
      return '<tr><td><div class="org-user-row">' + photo + '<span><strong>' + escapeHtml(user.name || '-') + '</strong><br><small class="org-muted">' + escapeHtml(user.email) + '</small></span></div></td><td>' + escapeHtml(roleLabel(user.role)) + '</td><td>' + escapeHtml((user.clientIds || user.client_ids || []).includes('*') ? 'Todos' : ((user.clientIds || user.client_ids || []).map(clientName).join(', ') || '-')) + '</td></tr>';
    }).join('') + '</tbody></table></section><section class="org-card org-span-5"><h3>Adicionar/alterar usuário</h3><form class="org-form" data-org-user-form><label class="field-6">Nome<input name="name" placeholder="Nome completo" /></label><label class="field-6">E-mail<input name="email" type="email" placeholder="email@dominio.com" required /></label><label class="field-6">Cargo<select name="role">' + roleOptions('GP_ACCOUNT') + '</select></label><label class="field-6">URL da foto<input name="avatar_url" placeholder="https://..." /></label><label class="field-12">Bio / observação<textarea name="bio" placeholder="Informações gerais do usuário, responsabilidades e observações"></textarea></label><div class="field-12"><strong>Clientes liberados</strong>' + clientPicker('clientIds', []) + '</div><div class="field-12"><button class="org-btn" type="submit">Salvar usuário</button> <button class="org-btn ghost" type="button" data-org-sync-supabase>Sincronizar Supabase</button></div><p class="field-12 org-status" data-org-user-status></p></form></section></div>';
  }

  function renderSquadsTab() {
    const squads = window.V4_RBAC?.storedSquads?.() || [];
    const headOptions = usersList([]).filter(function (u) { return ['SUPER_ADMIN', 'DIRETOR_OPERACAO', 'HEAD_GROWTH'].includes(u.role); }).map(function (u) { return '<option value="' + escapeHtml(u.email) + '">' + escapeHtml(u.name || u.email) + '</option>'; }).join('');
    return '<div class="org-grid"><section class="org-card org-span-7"><h3>Squads e clientes</h3><p>Head pra cima pode definir quais clientes entram em cada squad.</p><table class="org-table"><thead><tr><th>Squad</th><th>Head</th><th>Clientes</th></tr></thead><tbody>' + squads.map(function (squad) {
      return '<tr><td><strong>' + escapeHtml(squad.name) + '</strong><br><small class="org-muted">' + escapeHtml(squad.id) + '</small></td><td>' + escapeHtml(squad.headEmail || '-') + '</td><td>' + (squad.clientIds || []).map(function (id) { return '<span class="org-pill">' + escapeHtml(clientName(id)) + '</span>'; }).join('') + '</td></tr>';
    }).join('') + '</tbody></table></section><section class="org-card org-span-5"><h3>Criar/editar squad</h3><form class="org-form" data-org-squad-form><label class="field-6">Nome do squad<input name="name" placeholder="Ex.: Squad Growth 01" required /></label><label class="field-6">ID opcional<input name="id" placeholder="auto" /></label><label class="field-12">Head responsável<select name="headEmail"><option value="">Sem head definido</option>' + headOptions + '</select></label><div class="field-12"><strong>Clientes do squad</strong>' + clientPicker('squadClientIds', [], 'data-org-squad-client') + '</div><div class="field-12"><button class="org-btn" type="submit">Salvar squad</button></div><p class="field-12 org-status" data-org-squad-status></p></form></section></div>';
  }

  function renderMatrizTab() {
    const roles = Object.entries(window.V4_RBAC?.roles || {});
    const perms = window.V4_RBAC?.permissions || {};
    return '<section class="org-card"><h3>Matriz MODO V4 ON</h3><p>Matriz geral de cargos, módulos e ações liberadas. Essa matriz alimenta a visibilidade do painel.</p><table class="org-table"><thead><tr><th>Cargo</th><th>Escopo</th><th>Módulos</th><th>Ações</th></tr></thead><tbody>' + roles.map(function ([key, label]) {
      const p = perms[key] || {};
      return '<tr><td><strong>' + escapeHtml(label) + '</strong><br><small class="org-muted">' + escapeHtml(key) + '</small></td><td>' + escapeHtml(p.scope || '-') + '</td><td>' + (p.modules || []).map(function (m) { return '<span class="org-pill">' + escapeHtml(m) + '</span>'; }).join('') + '</td><td>' + (p.actions || []).map(function (a) { return '<span class="org-pill">' + escapeHtml(a) + '</span>'; }).join('') + '</td></tr>';
    }).join('') + '</tbody></table></section>';
  }

  function pageShell(activeTab, profiles) {
    const user = currentUser();
    const body = activeTab === 'squads' ? renderSquadsTab() : activeTab === 'matriz' ? renderMatrizTab() : renderUsersTab(profiles);
    return '<div class="page org-page" data-org-page><section class="org-hero"><div class="org-card"><p class="eyebrow">Organização</p><h1>Usuários, squads e acessos</h1><p>Gestão interna do V4 Command Center ligada ao Supabase, clientes do Drive/GrowthPack e matriz MODO V4 ON.</p><div class="org-tabs"><button class="org-tab ' + (activeTab === 'users' ? 'active' : '') + '" data-org-tab="users">Usuários</button><button class="org-tab ' + (activeTab === 'squads' ? 'active' : '') + '" data-org-tab="squads">Squads</button><button class="org-tab ' + (activeTab === 'matriz' ? 'active' : '') + '" data-org-tab="matriz">Matriz MODO V4 ON</button></div></div>' + profileCard(user) + '</section>' + body + '</div>';
  }

  async function render(activeTab) {
    activeTab = activeTab || sessionStorage.getItem('v4-org-active-tab') || 'users';
    sessionStorage.setItem('v4-org-active-tab', activeTab);
    ensureStyle();
    const main = document.getElementById('main');
    if (!main) return;
    main.innerHTML = '<div class="page org-page"><section class="org-card"><h2>Carregando Organização...</h2><p>Buscando usuários, clientes e matriz de acesso.</p></section></div>';
    await loadRealClients();
    const profiles = await loadSupabaseProfiles();
    main.innerHTML = pageShell(activeTab, profiles);
    bindForms();
    document.querySelectorAll('[data-v4-org-panel]').forEach(function (node) { node.remove(); });
  }

  function bindForms() {
    document.querySelectorAll('[data-org-tab]').forEach(function (button) {
      button.addEventListener('click', function () { render(button.dataset.orgTab); });
    });

    document.querySelector('[data-org-user-form]')?.addEventListener('submit', async function (event) {
      event.preventDefault();
      const form = event.currentTarget;
      const data = new FormData(form);
      const clientIds = Array.from(form.querySelectorAll('input[name="clientIds"]:checked')).map(function (input) { return input.value; });
      const profile = {
        email: String(data.get('email') || '').trim().toLowerCase(),
        name: String(data.get('name') || '').trim(),
        role: String(data.get('role') || 'GP_ACCOUNT'),
        avatar_url: String(data.get('avatar_url') || '').trim(),
        bio: String(data.get('bio') || '').trim(),
        client_ids: clientIds,
        updated_at: new Date().toISOString()
      };
      window.V4_RBAC?.setUserRole?.(profile.email, profile.role, clientIds, { name: profile.name, avatar_url: profile.avatar_url, bio: profile.bio });
      const saved = await saveProfileSupabase(profile);
      const status = form.querySelector('[data-org-user-status]');
      if (status) status.textContent = saved.ok ? 'Usuário salvo no Supabase e no painel.' : 'Usuário salvo localmente. Supabase pendente: ' + saved.reason;
      setTimeout(function () { render('users'); }, 700);
    });

    document.querySelector('[data-org-squad-form]')?.addEventListener('submit', async function (event) {
      event.preventDefault();
      const form = event.currentTarget;
      const data = new FormData(form);
      const clientIds = Array.from(form.querySelectorAll('input[name="squadClientIds"]:checked')).map(function (input) { return input.value; });
      const squad = window.V4_RBAC?.upsertSquad?.({
        id: String(data.get('id') || '').trim() || undefined,
        name: String(data.get('name') || '').trim(),
        headEmail: String(data.get('headEmail') || '').trim(),
        clientIds: clientIds,
        active: true
      });
      const saved = await saveSquadSupabase({
        id: squad.id,
        name: squad.name,
        head_email: squad.headEmail,
        client_ids: squad.clientIds,
        active: true,
        updated_at: new Date().toISOString()
      });
      const status = form.querySelector('[data-org-squad-status]');
      if (status) status.textContent = saved.ok ? 'Squad salvo no Supabase e no painel.' : 'Squad salvo localmente. Supabase pendente: ' + saved.reason;
      setTimeout(function () { render('squads'); }, 700);
    });
  }

  function interceptClicks() {
    document.addEventListener('click', function (event) {
      const target = event.target.closest('[data-v4-open-organization], [data-v4-org-launcher]');
      if (!target) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      render('users');
    }, true);
  }

  function start() {
    ensureStyle();
    interceptClicks();
    window.V4_ORGANIZATION_PAGE = { render, loadRealClients, saveProfileSupabase, saveSquadSupabase };
    log('organization_page', 'Página de Organização carregada.');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
