(function () {
  const STORAGE_KEY = 'v4-command-center-state-v6-crm-performance-losses';
  const CONFIG_KEY = 'v4-command-center-ekyte-config';
  const TOKEN_KEY = 'v4-ekyte-access-token';

  const BINDINGS = {
    alphaville: { name: 'Alphaville', companyId: '7773', workspaceId: 126365, projectId: 291862 },
    yousafer: { name: 'YouSafer', companyId: '7773', workspaceId: 72535, projectId: 291857 },
    prime: { name: 'Prime', companyId: '7773', workspaceId: 106839, projectId: 291839 },
    multimed: { name: 'MultiMed', companyId: '7773', workspaceId: 124293, projectId: 287299 },
    'seg-eletronic': { name: 'Seg Eletronic', companyId: '7773', workspaceId: 125773, projectId: 273483 },
    'espaco-master': { name: 'Espaco Master', companyId: '7773', workspaceId: 131114, projectId: 276870 },
    'st1-internet': { name: 'ST1 Internet', companyId: '7773', workspaceId: 127063, projectId: 273637 },
    'sindihoteleiros-cuidar-on': { name: 'SindiHoteleiros', companyId: '7773', workspaceId: 87694, projectId: 165830 },
    'sindi-hoteleiros': { name: 'SindiHoteleiros', companyId: '7773', workspaceId: 87694, projectId: 165830 },
    sindihoteleiros: { name: 'SindiHoteleiros', companyId: '7773', workspaceId: 87694, projectId: 165830 }
  };

  const RELEVANT_TYPES = {
    '42': 'Analise / Auditoria',
    '13899': 'Diagnostico / Planejamento',
    '13900': 'Auditoria de midia',
    '13901': 'Configuracao / Tracking',
    '13903': 'Google Meu Negocio',
    '13905': 'Persona / Oferta',
    '13906': 'Processo de vendas / CRM',
    '13908': 'CRM avancado',
    '13909': 'Relatorio',
    '13911': 'Social Media',
    '13915': 'Campanhas',
    '13917': 'Dashboard / Power BI'
  };

  const KEYWORDS = [
    'campanha', 'google ads', 'meta ads', 'facebook ads', 'midia', 'mídia', 'crm', 'funil',
    'mql', 'sql', 'venda', 'lead', 'lp', 'landing', 'pixel', 'convers', 'tag', 'utm',
    'tracking', 'trackeamento', 'power bi', 'dashboard', 'relatorio', 'relatório',
    'playbook', 'plano de acao', 'plano de ação', 'criativo', 'copy', 'social media'
  ];

  function readState() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || JSON.stringify(window.V4_SEED || {})); }
    catch { return JSON.parse(JSON.stringify(window.V4_SEED || {})); }
  }

  function writeState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function getConfig() {
    try { return { companyId: '7773', mode: 'proxy', proxyUrl: '/api/ekyte', timeoutMs: 25000, tokenStorageKey: TOKEN_KEY, ...JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}') }; }
    catch { return { companyId: '7773', mode: 'proxy', proxyUrl: '/api/ekyte', timeoutMs: 25000, tokenStorageKey: TOKEN_KEY }; }
  }

  function getBinding(clientId) {
    return BINDINGS[clientId] || null;
  }

  function decorateClient(client) {
    const binding = getBinding(client?.id);
    if (!binding) return client;
    client.idWorkspaceEkyte = binding.workspaceId;
    client.idProjetoEkyte = binding.projectId;
    client.ekyte = {
      ...(client.ekyte || {}),
      companyId: binding.companyId,
      workspaceId: binding.workspaceId,
      projectId: binding.projectId,
      taskScope: 'project',
      status: 'Projeto eKyte vinculado'
    };
    client.integrations = {
      ...(client.integrations || {}),
      ekyte: {
        companyId: binding.companyId,
        workspaceId: binding.workspaceId,
        projectId: binding.projectId,
        status: 'Vinculado por cliente/projeto'
      }
    };
    return client;
  }

  function decorateState(state) {
    if (!state || !Array.isArray(state.clients)) return state;
    state.clients.forEach(decorateClient);
    state.settings = { ...(state.settings || {}), ekyteTaskScope: 'client_project', ekyteBindingsVersion: '20260530-02' };
    return state;
  }

  function pick(row, keys, fallback) {
    for (const key of keys) if (row?.[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') return row[key];
    return fallback;
  }

  function normalizeDate(value) {
    if (!value) return '';
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    const text = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
    const br = text.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (br) return `${br[3]}-${br[2]}-${br[1]}`;
    return text.slice(0, 10);
  }

  function normalizeStatus(value) {
    const text = String(value || '').toLowerCase();
    if (/(done|feito|conclu|finaliz|aprovad)/.test(text)) return 'Concluído';
    if (/(valid|review|revis|aprov)/.test(text)) return 'Validação';
    if (/(doing|execu|andamento|progress|desenvolv)/.test(text)) return 'Em execução';
    return 'Backlog';
  }

  function taskType(row) {
    const raw = String(pick(row, ['tipo_tarefa', 'tipo', 'TIPO DE TAREFA', 'taskTypeId', 'typeId', 'type'], '')).trim();
    return RELEVANT_TYPES[raw] || raw || 'eKyte';
  }

  function hasRelevantScope(row, type) {
    const title = String(pick(row, ['title', 'titulo', 'TITULO', 'name', 'nome', 'taskName'], '')).toLowerCase();
    const description = String(pick(row, ['description', 'descricao', 'DESCRICAO', 'observacao', 'notes'], '')).toLowerCase();
    const typeId = String(pick(row, ['tipo_tarefa', 'tipo', 'TIPO DE TAREFA', 'taskTypeId', 'typeId'], '')).trim();
    if (RELEVANT_TYPES[typeId]) return true;
    if (KEYWORDS.some((keyword) => title.includes(keyword) || description.includes(keyword))) return true;
    return Boolean(type && /campanha|crm|dashboard|power bi|relatorio|tracking|auditoria|social/i.test(type));
  }

  function progressFrom(status, row) {
    const explicit = Number(pick(row, ['progress', 'progresso', 'percentual', '%'], NaN));
    if (Number.isFinite(explicit)) return Math.max(0, Math.min(100, explicit));
    if (status === 'Concluído') return 100;
    if (status === 'Validação') return 75;
    if (status === 'Em execução') return 45;
    return 10;
  }

  function unwrap(payload) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.tasks)) return payload.tasks;
    if (Array.isArray(payload?.result)) return payload.result;
    if (Array.isArray(payload?.rows)) return payload.rows;
    return [];
  }

  function normalizeTask(row, clientId, binding) {
    const title = String(pick(row, ['title', 'titulo', 'TITULO', 'name', 'nome', 'taskName'], 'Task eKyte')).trim();
    const type = taskType(row);
    if (!hasRelevantScope(row, type)) return null;
    const externalId = String(pick(row, ['id', 'taskId', 'id_task', 'ID', 'codigo', 'SEQUENCIAL'], title)).trim();
    const status = normalizeStatus(pick(row, ['status', 'fase', 'Fase atual', 'stage', 'situacao'], 'Backlog'));
    return {
      id: `ekyte-${clientId}-${externalId}`.replace(/[^a-zA-Z0-9_-]/g, '-'),
      clientId,
      source: 'ekyte',
      externalId,
      workspaceId: binding.workspaceId,
      projectId: binding.projectId,
      title,
      status,
      owner: String(pick(row, ['owner', 'executor', 'responsavel', 'EMAIL EXECUTOR', 'emailExecutor', 'assignee'], 'V4')).trim(),
      type,
      priority: String(pick(row, ['priority', 'prioridade', 'PRIORIDADE'], 'Média')).trim() || 'Média',
      start: normalizeDate(pick(row, ['start', 'inicio', 'DATA INICIO', 'startDate', 'createdAt'], '')),
      end: normalizeDate(pick(row, ['end', 'entrega', 'DATA ENTREGA', 'dueDate', 'deadline'], '')),
      progress: progressFrom(status, row),
      link: String(pick(row, ['link', 'url', 'taskUrl'], externalId ? `https://app.ekyte.com/#/tasks/list/${externalId}/edit` : '')).trim(),
      updatedAt: new Date().toISOString()
    };
  }

  function actionPlan(task) {
    return {
      id: `ap-${task.id}`,
      clientId: task.clientId,
      source: 'ekyte',
      externalId: task.externalId,
      workspaceId: task.workspaceId,
      projectId: task.projectId,
      what: task.title,
      why: 'Demanda operacional vinda do eKyte.',
      where: task.type,
      when: task.end || task.start || 'Semana atual',
      who: task.owner,
      how: task.link ? `Executar e acompanhar no eKyte: ${task.link}` : 'Executar e atualizar no eKyte.',
      status: task.status
    };
  }

  function apiUrl(resource, binding, options = {}) {
    const config = getConfig();
    const query = new URLSearchParams({
      companyId: String(binding.companyId || config.companyId || '7773'),
      resource,
      clientId: options.clientId,
      workspaceId: String(binding.workspaceId),
      idWorkspaceEkyte: String(binding.workspaceId),
      projectId: String(binding.projectId),
      idProjetoEkyte: String(binding.projectId),
      taskScope: 'project'
    });
    if (config.mode === 'direct') {
      if (!config.apiBaseUrl) throw new Error('Configure apiBaseUrl para modo direct. Prefira proxy/N8N para nao expor token.');
      return `${config.apiBaseUrl.replace(/\/$/, '')}/${resource}?${query.toString()}`;
    }
    return `${String(config.proxyUrl || '/api/ekyte').replace(/\/$/, '')}/${resource}?${query.toString()}`;
  }

  async function requestTasks(clientId) {
    const config = getConfig();
    const binding = getBinding(clientId);
    if (!binding) throw new Error(`Cliente sem vínculo eKyte: ${clientId}`);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Number(config.timeoutMs || 25000));
    const headers = {
      Accept: 'application/json',
      'X-V4-Source': 'v4-command-center',
      'X-V4-Client-Id': clientId,
      'X-Ekyte-Company-Id': String(binding.companyId || config.companyId || '7773'),
      'X-Ekyte-Workspace-Id': String(binding.workspaceId),
      'X-Ekyte-Project-Id': String(binding.projectId)
    };
    if (config.mode === 'direct') {
      const token = localStorage.getItem(config.tokenStorageKey || TOKEN_KEY);
      if (!token) throw new Error('Token eKyte ausente. Use proxy/N8N ou salve o token apenas para teste local.');
      headers.Authorization = `Bearer ${token}`;
    }
    try {
      const response = await fetch(apiUrl('tasks', binding, { clientId }), { headers, signal: controller.signal });
      const text = await response.text();
      let body = null;
      try { body = text ? JSON.parse(text) : null; } catch { body = text; }
      if (!response.ok) throw new Error(body?.message || body?.error || `Erro HTTP ${response.status}`);
      return unwrap(body).map((row) => normalizeTask(row, clientId, binding)).filter(Boolean);
    } finally {
      clearTimeout(timer);
    }
  }

  function mergeTasks(clientId, tasks) {
    const state = decorateState(readState());
    state.tasks = (state.tasks || []).filter((task) => task.source !== 'ekyte' || task.clientId !== clientId);
    state.actionPlan = (state.actionPlan || []).filter((item) => item.source !== 'ekyte' || item.clientId !== clientId);
    state.events = state.events || [];
    state.tasks.push(...tasks);
    state.actionPlan.push(...tasks.map(actionPlan));
    state.events.unshift({ id: `ev-ekyte-${Date.now()}`, type: 'sync', text: `eKyte sincronizado: ${tasks.length} tasks (${clientId})`, time: 'agora' });
    writeState(state);
  }

  async function sync(options = {}) {
    const clientId = options.clientId;
    if (!clientId) return syncAll();
    const binding = getBinding(clientId);
    if (!binding) throw new Error(`Cliente sem vínculo eKyte: ${clientId}`);
    const tasks = await requestTasks(clientId);
    mergeTasks(clientId, tasks);
    return { ok: true, source: 'ekyte', mode: 'client_project', clientId, workspaceId: binding.workspaceId, projectId: binding.projectId, synced: tasks.length, totalReceived: tasks.length };
  }

  async function syncAll() {
    const state = decorateState(readState());
    const clientIds = (state.clients || []).map((client) => client.id).filter((id) => getBinding(id));
    const results = [];
    for (const clientId of clientIds) results.push(await sync({ clientId }));
    return { ok: true, source: 'ekyte', mode: 'client_project_loop', synced: results.reduce((sum, item) => sum + Number(item.synced || 0), 0), totalReceived: results.reduce((sum, item) => sum + Number(item.totalReceived || 0), 0), results };
  }

  function apply() {
    try {
      if (window.V4_SEED) decorateState(window.V4_SEED);
      if (Array.isArray(window.V4_OFFICIAL_ACTIVE_CLIENTS)) window.V4_OFFICIAL_ACTIVE_CLIENTS.forEach(decorateClient);
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) localStorage.setItem(STORAGE_KEY, JSON.stringify(decorateState(JSON.parse(raw))));
      window.V4_EKYTE_CLIENT_BINDINGS = BINDINGS;
      window.V4_EKYTE_PROJECT_SYNC = { sync, syncAll, bindings: BINDINGS, decorateState };
      if (window.V4_EKYTE) {
        window.V4_EKYTE.sync = sync;
        window.V4_EKYTE.syncAll = syncAll;
        window.V4_EKYTE.getClientBinding = getBinding;
      }
    } catch (error) {
      console.warn('[EkyteProjectBindings]', error);
    }
  }

  apply();
  document.addEventListener('DOMContentLoaded', apply);
  setTimeout(apply, 500);
})();
