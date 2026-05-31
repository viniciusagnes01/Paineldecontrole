(function () {
  const TABLES = {
    profiles: 'organization_profiles',
    squads: 'organization_squads',
    clients: 'organization_client_profiles'
  };

  let clientsCache = [];
  let sourcesCache = [];
  let clientProfilesCache = [];
  let currentClientId = null;

  function ui() {
    return window.V4_UI || { escape: (v) => String(v ?? ''), initials: (v) => String(v || 'V4').slice(0, 2).toUpperCase(), log: function () {} };
  }

  function e(value) { return ui().escape(value); }
  function main() { return document.getElementById('main'); }
  function sb() { try { return window.V4_DRIVE_LIVE?.ensureClient?.() || null; } catch (_error) { return null; } }
  function roleLabel(role) { return window.V4_RBAC?.roles?.[role] || role || 'Sem cargo'; }
  function currentUser() { return window.V4_RBAC?.getCurrentUser?.() || {}; }

  async function select(table) {
    const client = sb();
    if (!client?.from) return null;
    try {
      const response = await client.from(table).select('*');
      if (response.error) throw response.error;
      return response.data || [];
    } catch (error) {
      ui().log('admin_pages_select_fallback', table + ': ' + error.message);
      return null;
    }
  }

  async function upsert(table, payload, conflict) {
    const client = sb();
    if (!client?.from) return { ok: false, reason: 'supabase_unavailable' };
    try {
      const response = await client.from(table).upsert(payload, conflict ? { onConflict: conflict } : undefined).select().single();
      if (response.error) throw response.error;
      return { ok: true, data: response.data };
    } catch (error) {
      return { ok: false, reason: error.message };
    }
  }

  async function loadClients() {
    const auto = window.V4_DRIVE_LIVE_AUTO_SYNC?.snapshot?.();
    if (auto?.clients?.length) clientsCache = auto.clients.map(normalizeClient).filter((client) => client.id && client.name);
    else if (window.V4_DRIVE_LIVE?.panelClients) {
      const payload = await window.V4_DRIVE_LIVE.panelClients();
      clientsCache = (payload.data || []).map(normalizeClient).filter((client) => client.id && client.name);
    }

    if (window.V4_DRIVE_LIVE?.panelSources) {
      try {
        const payload = await window.V4_DRIVE_LIVE.panelSources('');
        sourcesCache = payload.data || [];
      } catch (_error) { sourcesCache = []; }
    }

    clientProfilesCache = await select(TABLES.clients) || [];
    clientsCache = clientsCache.map((client) => {
      const profile = clientProfileFor(client.id);
      return { ...client, ...profile, id: client.id, name: profile.name || client.name, groupId: profile.groupId || client.groupId };
    });
    if (!currentClientId && clientsCache[0]) currentClientId = clientsCache[0].id;
    return clientsCache;
  }

  function normalizeClient(client) {
    return {
      id: client.client_id || client.id,
      name: client.client_name || client.name,
      groupId: client.group_id || client.kommo_group_id || client.external_id || '',
      photo_url: client.photo_url || client.logo_url || '',
      source: 'Supabase/Drive',
      count: client.growthpack_sources_count || client.active_drive_sources_count || 0,
      raw: client
    };
  }

  function clientProfileFor(clientId) {
    const profile = clientProfilesCache.find((item) => item.client_id === clientId || item.id === clientId) || {};
    return {
      name: profile.name || '',
      groupId: profile.group_id || profile.groupId || '',
      photo_url: profile.photo_url || profile.logo_url || '',
      notes: profile.notes || '',
      segment: profile.segment || '',
      owner: profile.owner || ''
    };
  }

  function sourcesForClient(clientId) { return sourcesCache.filter((source) => source.client_id === clientId); }

  function integrationsForClient(clientId) {
    const names = sourcesForClient(clientId).map((source) => source.source_name || source.sheet_name || 'Fonte');
    const base = ['GrowthPack / Google Sheets'];
    if (names.some((name) => /meta|facebook|instagram/i.test(name))) base.push('Meta Ads');
    if (names.some((name) => /google ads/i.test(name))) base.push('Google Ads');
    if (names.some((name) => /crm|funil|kommo|moskit/i.test(name))) base.push('CRM');
    return Array.from(new Set(base));
  }

  function usersList(remote) {
    const map = new Map();
    (window.V4_RBAC?.storedUsers?.() || []).forEach((user) => map.set(String(user.email || '').toLowerCase(), user));
    (remote || []).forEach((user) => {
      const key = String(user.email || '').toLowerCase();
      map.set(key, { ...map.get(key), ...user, clientIds: user.client_ids || user.clientIds || map.get(key)?.clientIds || [], squads: user.squad_ids || user.squads || map.get(key)?.squads || [] });
    });
    return Array.from(map.values()).filter((user) => user.email);
  }

  function roleOptions(selected) {
    return Object.entries(window.V4_RBAC?.roles || {}).map(([key, label]) => '<option value="' + e(key) + '" ' + (key === selected ? 'selected' : '') + '>' + e(label) + '</option>').join('');
  }

  function clientName(id) { if (id === '*') return 'Todos'; return clientsCache.find((client) => client.id === id)?.name || id; }
  function squadName(id) { return (window.V4_RBAC?.storedSquads?.() || []).find((squad) => squad.id === id)?.name || id; }

  function avatar(url, label, className) {
    return url ? '<img class="' + (className || 'v4-admin-avatar') + '" src="' + e(url) + '" alt="" />' : '<span class="' + (className || 'v4-admin-avatar') + '">' + e(ui().initials(label)) + '</span>';
  }

  function photoField(name, label, value) {
    return '<div class="v4-field-12 v4-media-field"><div class="v4-media-preview">' + avatar(value, label, 'v4-admin-avatar v4-admin-avatar-lg') + '</div><label class="v4-media-controls">' + e(label) + '<input name="' + e(name) + '" value="' + e(value || '') + '" placeholder="Cole a URL da imagem/logo" /><small class="v4-admin-muted">Use uma URL pública de imagem. A URL fica salva no Supabase.</small></label></div>';
  }

  function clientPicker(name, selected) {
    selected = selected || [];
    return '<div class="v4-admin-picker"><label><input type="checkbox" name="' + e(name) + '" value="*" ' + (selected.includes('*') ? 'checked' : '') + ' /><span><strong>Todos os clientes</strong><small>Acesso global</small></span></label>' +
      clientsCache.map((client) => '<label><input type="checkbox" name="' + e(name) + '" value="' + e(client.id) + '" ' + (selected.includes(client.id) ? 'checked' : '') + ' /><span><strong>' + e(client.name) + '</strong><small>' + e(client.count) + ' fontes GrowthPack/Drive</small></span></label>').join('') + '</div>';
  }

  function squadPicker(name, selected) {
    selected = selected || [];
    const squads = window.V4_RBAC?.storedSquads?.() || [];
    return '<div class="v4-admin-picker">' + squads.map((squad) => '<label><input type="checkbox" name="' + e(name) + '" value="' + e(squad.id) + '" ' + (selected.includes(squad.id) ? 'checked' : '') + ' /><span><strong>' + e(squad.name) + '</strong><small>' + e(squad.headEmail || 'Sem head definido') + '</small></span></label>').join('') + '</div>';
  }

  function userPicker(name, selected, users) {
    selected = selected || [];
    return '<div class="v4-admin-picker">' + users.map((user) => '<label><input type="checkbox" name="' + e(name) + '" value="' + e(user.email) + '" ' + (selected.includes(user.email) ? 'checked' : '') + ' /><span><strong>' + e(user.name || user.email) + '</strong><small>' + e(roleLabel(user.role)) + '</small></span></label>').join('') + '</div>';
  }

  function shell({ eyebrow, title, description, actions, body }) {
    const user = currentUser();
    return '<div class="page v4-admin-page"><section class="v4-admin-hero"><article class="v4-admin-card"><p class="v4-admin-eyebrow">' + e(eyebrow || 'Admin') + '</p><h1>' + e(title) + '</h1><p>' + e(description || '') + '</p><div class="v4-admin-toolbar">' + (actions || '') + '</div></article><article class="v4-admin-card v4-session-card">' + avatar(user.avatar_url, user.name || user.email) + '<div><p class="v4-admin-eyebrow">Sessão atual</p><h3>' + e(user.name || user.email || 'Usuário') + '</h3><p>' + e(roleLabel(user.role)) + ' • ' + e(user.email || '-') + '</p></div></article></section>' + body + '</div>';
  }

  async function renderOverview() {
    await loadClients();
    const users = usersList(await select(TABLES.profiles));
    const squads = window.V4_RBAC?.storedSquads?.() || [];
    const actions = '<button class="v4-admin-btn primary" data-v4-admin-page="users">Usuários</button><button class="v4-admin-btn" data-v4-admin-page="squads">Squads</button><button class="v4-admin-btn" data-v4-admin-page="clients">Clientes</button>';
    const body = '<section class="v4-admin-grid"><article class="v4-admin-kpi v4-admin-span-4"><small>Usuários</small><strong>' + e(users.length) + '</strong></article><article class="v4-admin-kpi v4-admin-span-4"><small>Squads</small><strong>' + e(squads.length) + '</strong></article><article class="v4-admin-kpi v4-admin-span-4"><small>Clientes</small><strong>' + e(clientsCache.length) + '</strong></article></section><section class="v4-admin-grid"><article class="v4-admin-card v4-admin-span-4"><h3>Usuários</h3><p>Pessoas, cargos, fotos, permissões, squads e escopo.</p><button class="v4-admin-btn primary" data-v4-admin-page="users">Abrir usuários</button></article><article class="v4-admin-card v4-admin-span-4"><h3>Squads</h3><p>Equipes com foto, head, membros e clientes.</p><button class="v4-admin-btn primary" data-v4-admin-page="squads">Abrir squads</button></article><article class="v4-admin-card v4-admin-span-4"><h3>Clientes</h3><p>Ficha do cliente com logo, dados, fontes e integrações.</p><button class="v4-admin-btn primary" data-v4-admin-page="clients">Abrir clientes</button></article></section>';
    main().innerHTML = shell({ eyebrow: 'Organização', title: 'Administração por entidade', description: 'Usuários, squads e clientes têm páginas próprias. A operação de cada cliente fica separada da configuração.', actions, body });
  }

  async function renderUsers() {
    await loadClients();
    const users = usersList(await select(TABLES.profiles));
    const rows = users.map((user) => {
      const ids = user.clientIds || user.client_ids || [];
      const sids = user.squads || user.squad_ids || [];
      return '<tr><td><div class="v4-admin-row-user">' + avatar(user.avatar_url, user.name || user.email) + '<span><strong>' + e(user.name || '-') + '</strong><br><small class="v4-admin-muted">' + e(user.email) + '</small></span></div></td><td>' + e(roleLabel(user.role)) + '</td><td>' + e(ids.includes('*') ? 'Todos' : ids.map(clientName).join(', ') || '-') + '</td><td>' + e(sids.map(squadName).join(', ') || '-') + '</td><td><button class="v4-admin-btn" data-v4-fill-user="' + e(user.email) + '">Editar</button></td></tr>';
    }).join('');
    const body = '<section class="v4-admin-grid"><article class="v4-admin-card v4-admin-span-7"><h2>Usuários</h2><p>Ficha individual de cada pessoa conectada ao sistema.</p><div class="v4-admin-table-wrap"><table class="v4-admin-table"><thead><tr><th>Usuário</th><th>Cargo</th><th>Clientes</th><th>Squads</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div></article><article class="v4-admin-card v4-admin-span-5"><h2>Ficha do usuário</h2><form class="v4-admin-form" data-admin-user-form>' + photoField('avatar_url', 'Foto do usuário', '') + '<label class="v4-field-6">Nome<input name="name" placeholder="Nome completo" /></label><label class="v4-field-6">E-mail<input name="email" type="email" required placeholder="email@dominio.com" /></label><label class="v4-field-6">Cargo<select name="role">' + roleOptions('GP_ACCOUNT') + '</select></label><label class="v4-field-6">Telefone<input name="phone" placeholder="(00) 00000-0000" /></label><label class="v4-field-12">Bio / responsabilidade<textarea name="bio" placeholder="Responsabilidades, observações e contexto"></textarea></label><div class="v4-field-12"><strong>Squads vinculados</strong>' + squadPicker('squadIds', []) + '</div><div class="v4-field-12"><strong>Clientes liberados</strong>' + clientPicker('clientIds', []) + '</div><div class="v4-field-12"><button class="v4-admin-btn primary" type="submit">Salvar usuário</button></div><p class="v4-admin-muted v4-field-12" data-admin-user-status></p></form></article></section>';
    main().innerHTML = shell({ eyebrow: 'Usuários', title: 'Gestão de usuários', description: 'Cada usuário tem foto, dados gerais, cargo, squads e clientes vinculados.', actions: '<button class="v4-admin-btn" data-v4-admin-page="overview">Voltar</button><button class="v4-admin-btn" data-v4-admin-page="squads">Squads</button><button class="v4-admin-btn" data-v4-admin-page="clients">Clientes</button>', body });
    bindUserForm(users);
  }

  function bindUserForm(users) {
    const form = document.querySelector('[data-admin-user-form]');
    document.querySelectorAll('[data-v4-fill-user]').forEach((btn) => btn.addEventListener('click', () => {
      const user = users.find((item) => String(item.email).toLowerCase() === String(btn.dataset.v4FillUser).toLowerCase());
      if (!user || !form) return;
      form.name.value = user.name || '';
      form.email.value = user.email || '';
      form.role.value = user.role || 'GP_ACCOUNT';
      form.phone.value = user.phone || '';
      form.bio.value = user.bio || '';
      form.avatar_url.value = user.avatar_url || '';
      form.querySelector('.v4-media-preview').innerHTML = avatar(user.avatar_url, user.name || user.email, 'v4-admin-avatar v4-admin-avatar-lg');
      const ids = user.clientIds || user.client_ids || [];
      const sids = user.squads || user.squad_ids || [];
      form.querySelectorAll('input[name="clientIds"]').forEach((input) => { input.checked = ids.includes(input.value); });
      form.querySelectorAll('input[name="squadIds"]').forEach((input) => { input.checked = sids.includes(input.value); });
    }));
    form?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const clientIds = Array.from(form.querySelectorAll('input[name="clientIds"]:checked')).map((input) => input.value);
      const squadIds = Array.from(form.querySelectorAll('input[name="squadIds"]:checked')).map((input) => input.value);
      const profile = { email: String(data.get('email') || '').trim().toLowerCase(), name: String(data.get('name') || '').trim(), role: String(data.get('role') || 'GP_ACCOUNT'), phone: String(data.get('phone') || '').trim(), avatar_url: String(data.get('avatar_url') || '').trim(), bio: String(data.get('bio') || '').trim(), client_ids: clientIds, squad_ids: squadIds, updated_at: new Date().toISOString() };
      window.V4_RBAC?.setUserRole?.(profile.email, profile.role, clientIds, { name: profile.name, avatar_url: profile.avatar_url, bio: profile.bio, phone: profile.phone, squads: squadIds });
      const saved = await upsert(TABLES.profiles, profile, 'email');
      const status = form.querySelector('[data-admin-user-status]');
      if (status) status.textContent = saved.ok ? 'Usuário salvo no Supabase.' : 'Usuário salvo localmente. Supabase pendente: ' + saved.reason;
      setTimeout(() => renderUsers(), 700);
    });
  }

  async function renderSquads() {
    await loadClients();
    const remoteUsers = usersList(await select(TABLES.profiles));
    const squads = window.V4_RBAC?.storedSquads?.() || [];
    const headOptions = remoteUsers.filter((user) => ['SUPER_ADMIN', 'DIRETOR_OPERACAO', 'HEAD_GROWTH'].includes(user.role)).map((user) => '<option value="' + e(user.email) + '">' + e(user.name || user.email) + '</option>').join('');
    const rows = squads.map((squad) => '<tr><td><div class="v4-admin-row-user">' + avatar(squad.photo_url, squad.name) + '<span><strong>' + e(squad.name) + '</strong><br><small class="v4-admin-muted">' + e(squad.id) + '</small></span></div></td><td>' + e(squad.headEmail || '-') + '</td><td>' + e((squad.memberEmails || []).join(', ') || '-') + '</td><td>' + (squad.clientIds || []).map((id) => '<span class="v4-admin-pill">' + e(clientName(id)) + '</span>').join('') + '</td><td><button class="v4-admin-btn" data-v4-fill-squad="' + e(squad.id) + '">Editar</button></td></tr>').join('');
    const body = '<section class="v4-admin-grid"><article class="v4-admin-card v4-admin-span-7"><h2>Squads</h2><p>Cada equipe tem identidade visual, head, membros e carteira vinculada.</p><div class="v4-admin-table-wrap"><table class="v4-admin-table"><thead><tr><th>Squad</th><th>Head</th><th>Membros</th><th>Clientes</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div></article><article class="v4-admin-card v4-admin-span-5"><h2>Ficha do squad</h2><form class="v4-admin-form" data-admin-squad-form>' + photoField('photo_url', 'Foto / logo do squad', '') + '<label class="v4-field-6">Nome<input name="name" required placeholder="Squad Growth 01" /></label><label class="v4-field-6">ID opcional<input name="id" placeholder="auto" /></label><label class="v4-field-12">Head<select name="headEmail"><option value="">Sem head definido</option>' + headOptions + '</select></label><label class="v4-field-12">Descrição<textarea name="description" placeholder="Objetivo, escopo e responsabilidades do squad"></textarea></label><div class="v4-field-12"><strong>Membros do squad</strong>' + userPicker('memberEmails', [], remoteUsers) + '</div><div class="v4-field-12"><strong>Clientes do squad</strong>' + clientPicker('squadClientIds', []) + '</div><div class="v4-field-12"><button class="v4-admin-btn primary" type="submit">Salvar squad</button></div><p class="v4-admin-muted v4-field-12" data-admin-squad-status></p></form></article></section>';
    main().innerHTML = shell({ eyebrow: 'Squads', title: 'Gestão de squads', description: 'Times com identidade, membros, head e clientes vinculados.', actions: '<button class="v4-admin-btn" data-v4-admin-page="overview">Voltar</button><button class="v4-admin-btn" data-v4-admin-page="users">Usuários</button><button class="v4-admin-btn" data-v4-admin-page="clients">Clientes</button>', body });
    bindSquadForm(squads);
  }

  function bindSquadForm(squads) {
    const form = document.querySelector('[data-admin-squad-form]');
    document.querySelectorAll('[data-v4-fill-squad]').forEach((btn) => btn.addEventListener('click', () => {
      const squad = squads.find((item) => item.id === btn.dataset.v4FillSquad);
      if (!squad || !form) return;
      form.name.value = squad.name || '';
      form.id.value = squad.id || '';
      form.headEmail.value = squad.headEmail || '';
      form.description.value = squad.description || '';
      form.photo_url.value = squad.photo_url || '';
      form.querySelector('.v4-media-preview').innerHTML = avatar(squad.photo_url, squad.name, 'v4-admin-avatar v4-admin-avatar-lg');
      form.querySelectorAll('input[name="squadClientIds"]').forEach((input) => { input.checked = (squad.clientIds || []).includes(input.value); });
      form.querySelectorAll('input[name="memberEmails"]').forEach((input) => { input.checked = (squad.memberEmails || []).includes(input.value); });
    }));
    form?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const clientIds = Array.from(form.querySelectorAll('input[name="squadClientIds"]:checked')).map((input) => input.value);
      const memberEmails = Array.from(form.querySelectorAll('input[name="memberEmails"]:checked')).map((input) => input.value);
      const squad = window.V4_RBAC?.upsertSquad?.({ id: String(data.get('id') || '').trim() || undefined, name: String(data.get('name') || '').trim(), headEmail: String(data.get('headEmail') || '').trim(), clientIds, memberEmails, photo_url: String(data.get('photo_url') || '').trim(), description: String(data.get('description') || '').trim(), active: true });
      const saved = await upsert(TABLES.squads, { id: squad.id, name: squad.name, head_email: squad.headEmail, client_ids: squad.clientIds, member_emails: memberEmails, photo_url: squad.photo_url, description: squad.description, active: true, updated_at: new Date().toISOString() }, 'id');
      const status = form.querySelector('[data-admin-squad-status]');
      if (status) status.textContent = saved.ok ? 'Squad salvo no Supabase.' : 'Squad salvo localmente. Supabase pendente: ' + saved.reason;
      setTimeout(() => renderSquads(), 700);
    });
  }

  async function renderClients() {
    await loadClients();
    const selected = clientsCache.find((client) => client.id === currentClientId) || clientsCache[0];
    currentClientId = selected?.id || null;
    const list = clientsCache.map((client) => '<button class="v4-admin-list-item ' + (client.id === currentClientId ? 'active' : '') + '" data-admin-client-id="' + e(client.id) + '">' + avatar(client.photo_url, client.name) + '<span><strong>' + e(client.name) + '</strong><br><small class="v4-admin-muted">' + e(client.count) + ' fontes • ' + e(client.groupId || 'sem grupo') + '</small></span></button>').join('');
    const sources = selected ? sourcesForClient(selected.id) : [];
    const integrations = selected ? integrationsForClient(selected.id) : [];
    const detail = selected ? '<article class="v4-admin-card"><h2>Ficha do cliente</h2><form class="v4-admin-form" data-admin-client-form>' + photoField('photo_url', 'Logo / foto do cliente', selected.photo_url || '') + '<label class="v4-field-6">Nome do cliente<input name="name" value="' + e(selected.name) + '" /></label><label class="v4-field-6">ID / Grupo<input name="group_id" value="' + e(selected.groupId) + '" /></label><label class="v4-field-6">Segmento<input name="segment" value="' + e(selected.segment || '') + '" placeholder="Segmento de atuação" /></label><label class="v4-field-6">Responsável<input name="owner" value="' + e(selected.owner || '') + '" placeholder="Responsável interno" /></label><label class="v4-field-12">Observações<textarea name="notes" placeholder="Informações gerais do cliente">' + e(selected.notes || '') + '</textarea></label><div class="v4-field-12"><button class="v4-admin-btn primary" type="submit">Salvar dados do cliente</button> <button class="v4-admin-btn" type="button" data-client="' + e(selected.id) + '">Abrir operação</button></div><p class="v4-admin-muted v4-field-12" data-admin-client-status></p></form></article><section class="v4-admin-grid"><article class="v4-admin-card v4-admin-span-6"><h3>Integrações do cliente</h3>' + integrations.map((name) => '<span class="v4-admin-pill">' + e(name) + '</span>').join('') + '</article><article class="v4-admin-card v4-admin-span-6"><h3>Fontes GrowthPack/Drive</h3><p>' + e(sources.length) + ' fontes cadastradas.</p>' + sources.slice(0, 12).map((source) => '<span class="v4-admin-pill">' + e(source.source_name || source.sheet_name || 'Fonte') + '</span>').join('') + '</article></section>' : '<section class="v4-admin-card"><h3>Nenhum cliente encontrado</h3><p>Sincronize clientes pelo Supabase/Drive.</p></section>';
    const body = '<section class="v4-admin-split-list"><aside class="v4-admin-list">' + list + '</aside><div>' + detail + '</div></section>';
    main().innerHTML = shell({ eyebrow: 'Clientes', title: 'Gestão de clientes', description: 'Cada cliente tem ficha própria com logo, dados, fontes e integrações.', actions: '<button class="v4-admin-btn" data-v4-admin-page="overview">Voltar</button><button class="v4-admin-btn" data-v4-admin-page="users">Usuários</button><button class="v4-admin-btn" data-v4-admin-page="squads">Squads</button>', body });
    bindClientsPage();
  }

  function bindClientsPage() {
    document.querySelectorAll('[data-admin-client-id]').forEach((button) => button.addEventListener('click', () => { currentClientId = button.dataset.adminClientId; renderClients(); }));
    const form = document.querySelector('[data-admin-client-form]');
    form?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const payload = { client_id: currentClientId, name: String(data.get('name') || '').trim(), group_id: String(data.get('group_id') || '').trim(), segment: String(data.get('segment') || '').trim(), owner: String(data.get('owner') || '').trim(), notes: String(data.get('notes') || '').trim(), photo_url: String(data.get('photo_url') || '').trim(), updated_at: new Date().toISOString() };
      const saved = await upsert(TABLES.clients, payload, 'client_id');
      const status = form.querySelector('[data-admin-client-status]');
      if (status) status.textContent = saved.ok ? 'Cliente salvo no Supabase.' : 'Cliente salvo localmente. Supabase pendente: ' + saved.reason;
      setTimeout(() => renderClients(), 700);
    });
  }

  async function render(page) {
    const target = main();
    if (!target) return;
    target.innerHTML = '<div class="page v4-admin-page"><section class="v4-admin-card"><h2>Carregando...</h2><p>Preparando página de gestão.</p></section></div>';
    const route = page || 'overview';
    if (route === 'users') return renderUsers();
    if (route === 'squads') return renderSquads();
    if (route === 'clients') return renderClients();
    return renderOverview();
  }

  function bindGlobal() {
    if (window.__v4AdminPagesBound) return;
    window.__v4AdminPagesBound = true;
    document.addEventListener('click', function (event) {
      const button = event.target.closest('[data-v4-admin-page]');
      if (!button) return;
      event.preventDefault();
      render(button.dataset.v4AdminPage || 'overview');
    }, true);
  }

  function start() {
    bindGlobal();
    window.V4_ADMIN_PAGES = { render, renderUsers, renderSquads, renderClients, loadClients };
    window.V4_ORGANIZATION_PAGE = { render, loadRealClients: loadClients };
    ui().log('admin_entity_pages', 'Paginas separadas com fotos por URL e Supabase carregadas.');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
