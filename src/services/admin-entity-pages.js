(function () {
  const TABLES = {
    profiles: 'organization_profiles',
    squads: 'organization_squads',
    clients: 'organization_client_profiles'
  };

  let clientsCache = [];
  let sourcesCache = [];
  let clientProfilesCache = [];
  let usersCache = [];
  let squadsCache = [];
  let currentClientId = null;

  function ui() {
    return window.V4_UI || {
      escape: (v) => String(v ?? '').replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c])),
      initials: (v) => String(v || 'V4').split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase(),
      log: function () {}
    };
  }

  function e(value) { return ui().escape(value); }
  function main() { return document.getElementById('main'); }
  function sb() { try { return window.V4_DRIVE_LIVE?.ensureClient?.() || null; } catch (_error) { return null; } }
  function currentUser() { return window.V4_RBAC?.getCurrentUser?.() || window.V4_AUTH?.getCurrentUser?.() || {}; }
  function roleLabel(role) {
    return window.V4_RBAC?.roles?.[role] || window.V4_ROLES?.[role]?.label || role || 'Sem cargo';
  }

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

  function usersList(remote) {
    const map = new Map();
    (window.V4_RBAC?.storedUsers?.() || []).forEach((user) => map.set(String(user.email || '').toLowerCase(), user));
    (remote || []).forEach((user) => {
      const key = String(user.email || '').toLowerCase();
      map.set(key, { ...map.get(key), ...user, clientIds: user.client_ids || user.clientIds || map.get(key)?.clientIds || [], squads: user.squad_ids || user.squads || map.get(key)?.squads || [] });
    });
    return Array.from(map.values()).filter((user) => user.email);
  }

  async function loadAdminData() {
    await loadClients();
    usersCache = usersList(await select(TABLES.profiles));
    squadsCache = window.V4_RBAC?.storedSquads?.() || window.V4_SQUADS || [];
    return { users: usersCache, squads: squadsCache, clients: clientsCache };
  }

  function clientName(id) { if (id === '*') return 'Todos'; return clientsCache.find((client) => client.id === id)?.name || id; }
  function squadName(id) { return squadsCache.find((squad) => squad.id === id)?.name || id; }
  function sourcesForClient(clientId) { return sourcesCache.filter((source) => source.client_id === clientId); }
  function integrationsForClient(clientId) {
    const names = sourcesForClient(clientId).map((source) => source.source_name || source.sheet_name || 'Fonte');
    const base = ['GrowthPack / Google Sheets'];
    if (names.some((name) => /meta|facebook|instagram/i.test(name))) base.push('Meta Ads');
    if (names.some((name) => /google ads/i.test(name))) base.push('Google Ads');
    if (names.some((name) => /crm|funil|kommo|moskit/i.test(name))) base.push('CRM');
    return Array.from(new Set(base.concat(names.filter(Boolean)))).slice(0, 8);
  }

  function avatar(url, label, className) {
    return url ? '<img class="' + (className || 'v4-admin-avatar') + '" src="' + e(url) + '" alt="" />' : '<span class="' + (className || 'v4-admin-avatar') + '">' + e(ui().initials(label)) + '</span>';
  }

  function roleOptions(selected) {
    const source = window.V4_RBAC?.roles || Object.fromEntries(Object.entries(window.V4_ROLES || {}).map(([key, value]) => [key, value.label || key]));
    return Object.entries(source).map(([key, label]) => '<option value="' + e(key) + '" ' + (key === selected ? 'selected' : '') + '>' + e(label) + '</option>').join('');
  }

  function pickerRows(name, items, selected, allLabel, subtitleFn) {
    selected = selected || [];
    const all = allLabel ? '<label><input type="checkbox" name="' + e(name) + '" value="*" ' + (selected.includes('*') ? 'checked' : '') + ' /><span><strong>' + e(allLabel) + '</strong><small>Acesso global</small></span></label>' : '';
    return '<div class="v4-admin-picker">' + all + items.map((item) => '<label><input type="checkbox" name="' + e(name) + '" value="' + e(item.value) + '" ' + (selected.includes(item.value) ? 'checked' : '') + ' /><span><strong>' + e(item.label) + '</strong><small>' + e(subtitleFn ? subtitleFn(item) : item.subtitle || '') + '</small></span></label>').join('') + '</div>';
  }

  function clientPicker(name, selected) {
    return pickerRows(name, clientsCache.map((client) => ({ value: client.id, label: client.name, subtitle: String(client.count || 0) + ' fontes GrowthPack/Drive' })), selected, 'Todos os clientes');
  }

  function squadPicker(name, selected) {
    return pickerRows(name, squadsCache.map((squad) => ({ value: squad.id, label: squad.name, subtitle: squad.headEmail || 'Sem head definido' })), selected, null);
  }

  function userPicker(name, selected) {
    return pickerRows(name, usersCache.map((user) => ({ value: user.email, label: user.name || user.email, subtitle: roleLabel(user.role) })), selected, null);
  }

  function photoField(name, label, value) {
    return '<div class="v4-field-12 v4-media-field"><div class="v4-media-preview">' + avatar(value, label, 'v4-admin-avatar v4-admin-avatar-lg') + '</div><label class="v4-media-controls"><strong>' + e(label) + '</strong><input name="' + e(name) + '" value="' + e(value || '') + '" placeholder="URL da imagem ou escolha um arquivo" /><div class="v4-media-upload-row"><input type="file" accept="image/*" data-v4-file-for="' + e(name) + '" /><button class="v4-admin-btn" type="button" data-v4-clear-photo>Remover foto</button></div><small class="v4-admin-muted">Escolha arquivo para pré-visualizar ou cole uma URL pública. O valor fica salvo na ficha.</small></label></div>';
  }

  function shell({ eyebrow, title, description, actions, body }) {
    const user = currentUser();
    return '<div class="page v4-admin-page"><section class="v4-admin-hero"><article class="v4-admin-card"><p class="v4-admin-eyebrow">' + e(eyebrow || 'Admin') + '</p><h1>' + e(title) + '</h1><p>' + e(description || '') + '</p><div class="v4-admin-toolbar">' + (actions || '') + '</div></article><article class="v4-admin-card v4-session-card">' + avatar(user.avatar_url, user.name || user.email) + '<div><p class="v4-admin-eyebrow">Sessão atual</p><h3>' + e(user.name || user.email || 'Usuário') + '</h3><p>' + e(roleLabel(user.role)) + ' • ' + e(user.email || '-') + '</p></div></article></section>' + body + '</div>';
  }

  function modal(title, subtitle, formHtml, kind) {
    return '<div class="v4-admin-modal" data-admin-modal="' + e(kind) + '"><div class="v4-admin-modal-backdrop" data-v4-close-modal></div><aside class="v4-admin-modal-panel"><div class="v4-admin-modal-head"><div><p class="v4-admin-eyebrow">Ficha de cadastro</p><h2>' + e(title) + '</h2><small>' + e(subtitle || '') + '</small></div><button class="v4-admin-modal-close" type="button" data-v4-close-modal>Fechar</button></div>' + formHtml + '</aside></div>';
  }

  function renderOverview() {
    const actions = '<button class="v4-admin-btn primary" data-v4-admin-page="users">Usuários</button><button class="v4-admin-btn" data-v4-admin-page="squads">Squads</button><button class="v4-admin-btn" data-v4-admin-page="clients">Clientes</button>';
    const body = '<section class="v4-admin-grid"><article class="v4-admin-kpi v4-admin-span-4"><small>Usuários</small><strong>' + e(usersCache.length) + '</strong></article><article class="v4-admin-kpi v4-admin-span-4"><small>Squads</small><strong>' + e(squadsCache.length) + '</strong></article><article class="v4-admin-kpi v4-admin-span-4"><small>Clientes</small><strong>' + e(clientsCache.length) + '</strong></article></section><section class="v4-admin-grid"><article class="v4-admin-card v4-admin-span-4"><h3>Usuários</h3><p>Pessoas, cargos, fotos, permissões, squads e escopo.</p><button class="v4-admin-btn primary" data-v4-admin-page="users">Abrir usuários</button></article><article class="v4-admin-card v4-admin-span-4"><h3>Squads</h3><p>Equipes com foto, head, membros e clientes.</p><button class="v4-admin-btn primary" data-v4-admin-page="squads">Abrir squads</button></article><article class="v4-admin-card v4-admin-span-4"><h3>Clientes</h3><p>Ficha do cliente com logo, dados, fontes e integrações.</p><button class="v4-admin-btn primary" data-v4-admin-page="clients">Abrir clientes</button></article></section>';
    main().innerHTML = shell({ eyebrow: 'Organização', title: 'Administração por entidade', description: 'Usuários, squads e clientes têm páginas próprias. As fichas abrem em modal para manter a tela limpa.', actions, body });
  }

  function userForm(user) {
    user = user || {};
    const clientIds = user.clientIds || user.client_ids || [];
    const squadIds = user.squads || user.squad_ids || [];
    return '<form class="v4-admin-form" data-admin-user-form>' + photoField('avatar_url', 'Foto do usuário', user.avatar_url || '') + '<label class="v4-field-6">Nome<input name="name" value="' + e(user.name || '') + '" placeholder="Nome completo" /></label><label class="v4-field-6">E-mail<input name="email" type="email" required value="' + e(user.email || '') + '" placeholder="email@dominio.com" /></label><label class="v4-field-6">Cargo<select name="role">' + roleOptions(user.role || 'GP_ACCOUNT') + '</select></label><label class="v4-field-6">Telefone<input name="phone" value="' + e(user.phone || '') + '" placeholder="(00) 00000-0000" /></label><label class="v4-field-12">Bio / responsabilidade<textarea name="bio" placeholder="Responsabilidades, observações e contexto">' + e(user.bio || '') + '</textarea></label><div class="v4-field-6"><strong>Squads vinculados</strong>' + squadPicker('squadIds', squadIds) + '</div><div class="v4-field-6"><strong>Clientes liberados</strong>' + clientPicker('clientIds', clientIds) + '</div><div class="v4-field-12 v4-admin-form-actions"><button class="v4-admin-btn primary" type="submit">Salvar usuário</button><button class="v4-admin-btn" type="button" data-v4-close-modal>Cancelar</button></div><p class="v4-admin-muted v4-field-12" data-admin-user-status></p></form>';
  }

  function renderUsers() {
    const rows = usersCache.map((user) => {
      const ids = user.clientIds || user.client_ids || [];
      const sids = user.squads || user.squad_ids || [];
      return '<tr><td><div class="v4-admin-row-user">' + avatar(user.avatar_url, user.name || user.email) + '<span><strong>' + e(user.name || '-') + '</strong><br><small class="v4-admin-muted">' + e(user.email) + '</small></span></div></td><td>' + e(roleLabel(user.role)) + '</td><td>' + e(ids.includes('*') ? 'Todos' : ids.map(clientName).join(', ') || '-') + '</td><td>' + e(sids.map(squadName).join(', ') || '-') + '</td><td><button class="v4-admin-btn" data-v4-open-user="' + e(user.email) + '">Editar</button></td></tr>';
    }).join('');
    const body = '<section class="v4-admin-grid"><article class="v4-admin-card v4-admin-span-12"><div class="v4-admin-card-head"><div><h2>Usuários</h2><p>Ficha individual de cada pessoa conectada ao sistema.</p></div><button class="v4-admin-btn primary" data-v4-open-user="__new">Adicionar usuário</button></div><div class="v4-admin-table-wrap"><table class="v4-admin-table"><thead><tr><th>Usuário</th><th>Cargo</th><th>Clientes</th><th>Squads</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div></article></section>';
    main().innerHTML = shell({ eyebrow: 'Usuários', title: 'Gestão de usuários', description: 'Lista limpa em tela cheia. Clique em adicionar ou editar para abrir a ficha.', actions: '<button class="v4-admin-btn" data-v4-admin-page="overview">Voltar</button><button class="v4-admin-btn" data-v4-admin-page="squads">Squads</button><button class="v4-admin-btn" data-v4-admin-page="clients">Clientes</button>', body });
  }

  function squadForm(squad) {
    squad = squad || {};
    const heads = usersCache.filter((user) => ['SUPER_ADMIN', 'DIRETOR_OPERACAO', 'HEAD_GROWTH'].includes(user.role));
    const headOptions = heads.map((user) => '<option value="' + e(user.email) + '" ' + (user.email === squad.headEmail ? 'selected' : '') + '>' + e(user.name || user.email) + '</option>').join('');
    return '<form class="v4-admin-form" data-admin-squad-form>' + photoField('photo_url', 'Foto / logo do squad', squad.photo_url || '') + '<label class="v4-field-6">Nome<input name="name" required value="' + e(squad.name || '') + '" placeholder="Squad Growth" /></label><label class="v4-field-6">ID opcional<input name="id" value="' + e(squad.id || '') + '" placeholder="auto" /></label><label class="v4-field-12">Head<select name="headEmail"><option value="">Sem head definido</option>' + headOptions + '</select></label><label class="v4-field-12">Descrição<textarea name="description" placeholder="Objetivo, escopo e responsabilidades do squad">' + e(squad.description || '') + '</textarea></label><div class="v4-field-6"><strong>Membros do squad</strong>' + userPicker('memberEmails', squad.memberEmails || []) + '</div><div class="v4-field-6"><strong>Clientes do squad</strong>' + clientPicker('squadClientIds', squad.clientIds || []) + '</div><div class="v4-field-12 v4-admin-form-actions"><button class="v4-admin-btn primary" type="submit">Salvar squad</button><button class="v4-admin-btn" type="button" data-v4-close-modal>Cancelar</button></div><p class="v4-admin-muted v4-field-12" data-admin-squad-status></p></form>';
  }

  function renderSquads() {
    const rows = squadsCache.map((squad) => '<tr><td><div class="v4-admin-row-user">' + avatar(squad.photo_url, squad.name) + '<span><strong>' + e(squad.name) + '</strong><br><small class="v4-admin-muted">' + e(squad.id) + '</small></span></div></td><td>' + e(squad.headEmail || '-') + '</td><td>' + e((squad.memberEmails || []).join(', ') || '-') + '</td><td>' + (squad.clientIds || []).map((id) => '<span class="v4-admin-pill">' + e(clientName(id)) + '</span>').join('') + '</td><td><button class="v4-admin-btn" data-v4-open-squad="' + e(squad.id) + '">Editar</button></td></tr>').join('');
    const body = '<section class="v4-admin-grid"><article class="v4-admin-card v4-admin-span-12"><div class="v4-admin-card-head"><div><h2>Squads</h2><p>Cada equipe tem identidade visual, head, membros e carteira vinculada.</p></div><button class="v4-admin-btn primary" data-v4-open-squad="__new">Adicionar squad</button></div><div class="v4-admin-table-wrap"><table class="v4-admin-table"><thead><tr><th>Squad</th><th>Head</th><th>Membros</th><th>Clientes</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div></article></section>';
    main().innerHTML = shell({ eyebrow: 'Squads', title: 'Gestão de squads', description: 'Lista principal em cima. A ficha abre em modal para não poluir a tela.', actions: '<button class="v4-admin-btn" data-v4-admin-page="overview">Voltar</button><button class="v4-admin-btn" data-v4-admin-page="users">Usuários</button><button class="v4-admin-btn" data-v4-admin-page="clients">Clientes</button>', body });
  }

  function clientForm(client) {
    client = client || {};
    return '<form class="v4-admin-form" data-admin-client-form data-client-id="' + e(client.id || '') + '">' + photoField('photo_url', 'Logo / foto do cliente', client.photo_url || '') + '<label class="v4-field-6">Nome do cliente<input name="name" value="' + e(client.name || '') + '" /></label><label class="v4-field-6">ID / Grupo<input name="group_id" value="' + e(client.groupId || '') + '" /></label><label class="v4-field-6">Segmento<input name="segment" value="' + e(client.segment || '') + '" placeholder="Segmento de atuação" /></label><label class="v4-field-6">Responsável<input name="owner" value="' + e(client.owner || '') + '" placeholder="Responsável interno" /></label><label class="v4-field-12">Observações<textarea name="notes" placeholder="Informações gerais do cliente">' + e(client.notes || '') + '</textarea></label><div class="v4-field-12 v4-admin-form-actions"><button class="v4-admin-btn primary" type="submit">Salvar dados do cliente</button><button class="v4-admin-btn" type="button" data-v4-close-modal>Cancelar</button></div><p class="v4-admin-muted v4-field-12" data-admin-client-status></p></form>';
  }

  function renderClients() {
    const selected = clientsCache.find((client) => client.id === currentClientId) || clientsCache[0];
    currentClientId = selected?.id || null;
    const cards = clientsCache.map((client) => '<button class="v4-admin-list-item ' + (client.id === currentClientId ? 'active' : '') + '" data-admin-client-id="' + e(client.id) + '">' + avatar(client.photo_url, client.name) + '<span><strong>' + e(client.name) + '</strong><br><small class="v4-admin-muted">' + e(client.count) + ' fontes • ' + e(client.groupId || 'sem grupo') + '</small></span></button>').join('');
    const sources = selected ? sourcesForClient(selected.id) : [];
    const integrations = selected ? integrationsForClient(selected.id) : [];
    const detail = selected ? '<article class="v4-admin-card"><div class="v4-admin-card-head"><div><h2>' + e(selected.name) + '</h2><p>' + e(selected.segment || 'Cliente sincronizado via Supabase/Drive') + '</p></div><div class="v4-admin-toolbar"><button class="v4-admin-btn primary" data-v4-open-client="' + e(selected.id) + '">Editar ficha</button><button class="v4-admin-btn" type="button" data-client="' + e(selected.id) + '">Abrir operação</button></div></div><div class="v4-admin-detail-grid"><div><small>Grupo</small><strong>' + e(selected.groupId || '-') + '</strong></div><div><small>Responsável</small><strong>' + e(selected.owner || '-') + '</strong></div><div><small>Fontes</small><strong>' + e(sources.length) + '</strong></div></div></article><section class="v4-admin-grid"><article class="v4-admin-card v4-admin-span-6"><h3>Integrações do cliente</h3>' + integrations.map((name) => '<span class="v4-admin-pill">' + e(name) + '</span>').join('') + '</article><article class="v4-admin-card v4-admin-span-6"><h3>Fontes GrowthPack/Drive</h3><p>' + e(sources.length) + ' fontes cadastradas.</p>' + sources.slice(0, 12).map((source) => '<span class="v4-admin-pill">' + e(source.source_name || source.sheet_name || 'Fonte') + '</span>').join('') + '</article></section>' : '<section class="v4-admin-card"><h3>Nenhum cliente encontrado</h3><p>Sincronize clientes pelo Supabase/Drive.</p></section>';
    const body = '<section class="v4-admin-grid"><article class="v4-admin-card v4-admin-span-12"><div class="v4-admin-card-head"><div><h2>Clientes</h2><p>Selecione um cliente para ver resumo, integrações e fontes. A edição abre em modal.</p></div>' + (selected ? '<button class="v4-admin-btn primary" data-v4-open-client="' + e(selected.id) + '">Editar cliente</button>' : '') + '</div><div class="v4-admin-split-list"><aside class="v4-admin-list">' + cards + '</aside><div class="v4-admin-detail">' + detail + '</div></div></article></section>';
    main().innerHTML = shell({ eyebrow: 'Clientes', title: 'Gestão de clientes', description: 'Clientes em lista limpa. A ficha de dados abre por botão.', actions: '<button class="v4-admin-btn" data-v4-admin-page="overview">Voltar</button><button class="v4-admin-btn" data-v4-admin-page="users">Usuários</button><button class="v4-admin-btn" data-v4-admin-page="squads">Squads</button>', body });
  }

  function openModal(kind, itemId) {
    closeModal();
    let html = '';
    if (kind === 'user') {
      const user = itemId === '__new' ? {} : usersCache.find((item) => String(item.email).toLowerCase() === String(itemId).toLowerCase()) || {};
      html = modal(user.email ? 'Editar usuário' : 'Adicionar usuário', 'Dados gerais, foto, cargo, squads e clientes.', userForm(user), 'user');
    }
    if (kind === 'squad') {
      const squad = itemId === '__new' ? {} : squadsCache.find((item) => item.id === itemId) || {};
      html = modal(squad.id ? 'Editar squad' : 'Adicionar squad', 'Head, membros, identidade visual e carteira vinculada.', squadForm(squad), 'squad');
    }
    if (kind === 'client') {
      const client = clientsCache.find((item) => item.id === itemId) || {};
      html = modal('Editar cliente', 'Dados gerais, logo, segmento e responsável.', clientForm(client), 'client');
    }
    document.body.insertAdjacentHTML('beforeend', html);
    bindModalForms();
  }

  function closeModal() {
    document.querySelectorAll('[data-admin-modal]').forEach((modalNode) => modalNode.remove());
  }

  function bindPhotoInputs(root) {
    root.querySelectorAll('[data-v4-file-for]').forEach((input) => {
      input.addEventListener('change', () => {
        const file = input.files && input.files[0];
        if (!file) return;
        const target = root.querySelector('input[name="' + input.dataset.v4FileFor + '"]');
        const reader = new FileReader();
        reader.onload = () => {
          if (target) target.value = String(reader.result || '');
          const preview = root.querySelector('.v4-media-preview');
          if (preview) preview.innerHTML = '<img class="v4-admin-avatar v4-admin-avatar-lg" src="' + e(reader.result || '') + '" alt="" />';
        };
        reader.readAsDataURL(file);
      });
    });
    root.querySelectorAll('[data-v4-clear-photo]').forEach((button) => button.addEventListener('click', () => {
      const media = button.closest('.v4-media-field');
      const text = media?.querySelector('input[type="text"], input:not([type])');
      if (text) text.value = '';
      const preview = media?.querySelector('.v4-media-preview');
      if (preview) preview.innerHTML = avatar('', 'V4', 'v4-admin-avatar v4-admin-avatar-lg');
    }));
  }

  function bindModalForms() {
    const modalNode = document.querySelector('[data-admin-modal]');
    if (!modalNode) return;
    bindPhotoInputs(modalNode);

    const userFormNode = modalNode.querySelector('[data-admin-user-form]');
    userFormNode?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const data = new FormData(userFormNode);
      const clientIds = Array.from(userFormNode.querySelectorAll('input[name="clientIds"]:checked')).map((input) => input.value);
      const squadIds = Array.from(userFormNode.querySelectorAll('input[name="squadIds"]:checked')).map((input) => input.value);
      const profile = { email: String(data.get('email') || '').trim().toLowerCase(), name: String(data.get('name') || '').trim(), role: String(data.get('role') || 'GP_ACCOUNT'), phone: String(data.get('phone') || '').trim(), avatar_url: String(data.get('avatar_url') || '').trim(), bio: String(data.get('bio') || '').trim(), client_ids: clientIds, squad_ids: squadIds, updated_at: new Date().toISOString() };
      window.V4_RBAC?.setUserRole?.(profile.email, profile.role, clientIds, { name: profile.name, avatar_url: profile.avatar_url, bio: profile.bio, phone: profile.phone, squads: squadIds });
      const saved = await upsert(TABLES.profiles, profile, 'email');
      const status = userFormNode.querySelector('[data-admin-user-status]');
      if (status) status.textContent = saved.ok ? 'Usuário salvo no Supabase.' : 'Usuário salvo localmente. Supabase pendente: ' + saved.reason;
      setTimeout(async () => { closeModal(); await loadAdminData(); renderUsers(); }, 650);
    });

    const squadFormNode = modalNode.querySelector('[data-admin-squad-form]');
    squadFormNode?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const data = new FormData(squadFormNode);
      const clientIds = Array.from(squadFormNode.querySelectorAll('input[name="squadClientIds"]:checked')).map((input) => input.value);
      const memberEmails = Array.from(squadFormNode.querySelectorAll('input[name="memberEmails"]:checked')).map((input) => input.value);
      const squad = window.V4_RBAC?.upsertSquad?.({ id: String(data.get('id') || '').trim() || undefined, name: String(data.get('name') || '').trim(), headEmail: String(data.get('headEmail') || '').trim(), clientIds, memberEmails, photo_url: String(data.get('photo_url') || '').trim(), description: String(data.get('description') || '').trim(), active: true }) || { id: String(data.get('id') || '').trim() || String(data.get('name') || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'), name: String(data.get('name') || '').trim(), headEmail: String(data.get('headEmail') || '').trim(), clientIds, memberEmails, photo_url: String(data.get('photo_url') || '').trim(), description: String(data.get('description') || '').trim(), active: true };
      const saved = await upsert(TABLES.squads, { id: squad.id, name: squad.name, head_email: squad.headEmail, client_ids: squad.clientIds, member_emails: memberEmails, photo_url: squad.photo_url, description: squad.description, active: true, updated_at: new Date().toISOString() }, 'id');
      const status = squadFormNode.querySelector('[data-admin-squad-status]');
      if (status) status.textContent = saved.ok ? 'Squad salvo no Supabase.' : 'Squad salvo localmente. Supabase pendente: ' + saved.reason;
      setTimeout(async () => { closeModal(); await loadAdminData(); renderSquads(); }, 650);
    });

    const clientFormNode = modalNode.querySelector('[data-admin-client-form]');
    clientFormNode?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const data = new FormData(clientFormNode);
      const clientId = clientFormNode.dataset.clientId || currentClientId;
      const payload = { client_id: clientId, name: String(data.get('name') || '').trim(), group_id: String(data.get('group_id') || '').trim(), segment: String(data.get('segment') || '').trim(), owner: String(data.get('owner') || '').trim(), notes: String(data.get('notes') || '').trim(), photo_url: String(data.get('photo_url') || '').trim(), updated_at: new Date().toISOString() };
      const saved = await upsert(TABLES.clients, payload, 'client_id');
      const status = clientFormNode.querySelector('[data-admin-client-status]');
      if (status) status.textContent = saved.ok ? 'Cliente salvo no Supabase.' : 'Cliente salvo localmente. Supabase pendente: ' + saved.reason;
      setTimeout(async () => { closeModal(); await loadAdminData(); renderClients(); }, 650);
    });
  }

  async function render(page) {
    const target = main();
    if (!target) return;
    target.innerHTML = '<div class="page v4-admin-page"><section class="v4-admin-card"><h2>Carregando...</h2><p>Preparando página de gestão.</p></section></div>';
    await loadAdminData();
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
      const nav = event.target.closest('[data-v4-admin-page]');
      if (nav) { event.preventDefault(); render(nav.dataset.v4AdminPage || 'overview'); return; }
      const user = event.target.closest('[data-v4-open-user]');
      if (user) { event.preventDefault(); openModal('user', user.dataset.v4OpenUser); return; }
      const squad = event.target.closest('[data-v4-open-squad]');
      if (squad) { event.preventDefault(); openModal('squad', squad.dataset.v4OpenSquad); return; }
      const client = event.target.closest('[data-v4-open-client]');
      if (client) { event.preventDefault(); openModal('client', client.dataset.v4OpenClient); return; }
      if (event.target.closest('[data-v4-close-modal]')) { event.preventDefault(); closeModal(); return; }
      const clientSelect = event.target.closest('[data-admin-client-id]');
      if (clientSelect) { event.preventDefault(); currentClientId = clientSelect.dataset.adminClientId; renderClients(); }
    }, true);
    document.addEventListener('keydown', function (event) { if (event.key === 'Escape') closeModal(); });
  }

  function start() {
    bindGlobal();
    window.V4_ADMIN_PAGES = { render, renderUsers, renderSquads, renderClients, loadClients };
    window.V4_ORGANIZATION_PAGE = { render, loadRealClients: loadClients };
    ui().log('admin_entity_pages', 'Paginas separadas com fichas em modal carregadas.');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
