(function () {
  const STORAGE_KEY = 'v4-command-center-state-v6-crm-performance-losses';
  const CONFIG_KEY = 'v4-command-center-ekyte-config';
  const TOKEN_KEY = 'v4-ekyte-access-token';

  const DEFAULT_CONFIG = {
    companyId: '7773',
    mode: 'proxy',
    proxyUrl: '/api/ekyte',
    apiBaseUrl: '',
    timeoutMs: 25000,
    tokenStorageKey: TOKEN_KEY,
    includeCampaignMonitoring: false,
    includeSocialMonitoring: false
  };

  const RELEVANT_TASK_TYPES = {
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

  const RELEVANT_KEYWORDS = [
    'campanha', 'google ads', 'meta ads', 'facebook ads', 'midia', 'mídia',
    'crm', 'funil', 'mql', 'sql', 'venda', 'lead', 'lp', 'landing',
    'pixel', 'convers', 'tag', 'utm', 'tracking', 'trackeamento',
    'power bi', 'dashboard', 'relatorio', 'relatório', 'playbook',
    'plano de acao', 'plano de ação', 'criativo', 'copy', 'social media'
  ];

  function getConfig() {
    try {
      return { ...DEFAULT_CONFIG, ...(JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}')) };
    } catch (error) {
      return { ...DEFAULT_CONFIG };
    }
  }

  function saveConfig(config) {
    const next = { ...getConfig(), ...(config || {}) };
    localStorage.setItem(CONFIG_KEY, JSON.stringify(next));
    return next;
  }

  function setToken(token) {
    const value = String(token || '').trim();
    if (!value) {
      localStorage.removeItem(getConfig().tokenStorageKey || TOKEN_KEY);
      return false;
    }
    localStorage.setItem(getConfig().tokenStorageKey || TOKEN_KEY, value);
    return true;
  }

  function readState() {
    const seed = window.V4_SEED || {};
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || JSON.stringify(seed));
    } catch (error) {
      return JSON.parse(JSON.stringify(seed));
    }
  }

  function writeState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function buildUrl(resource, params) {
    const config = getConfig();
    const companyId = String(params?.companyId || config.companyId || '').trim();
    const query = new URLSearchParams({ companyId, resource });

    if (config.mode === 'direct') {
      if (!config.apiBaseUrl) throw new Error('Configure apiBaseUrl para modo direct. Prefira proxy/N8N para nao expor token.');
      return `${config.apiBaseUrl.replace(/\/$/, '')}/${resource}?${query.toString()}`;
    }

    const proxy = String(config.proxyUrl || '/api/ekyte').replace(/\/$/, '');
    return `${proxy}/${resource}?${query.toString()}`;
  }

  async function request(resource, params) {
    const config = getConfig();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Number(config.timeoutMs || 25000));
    const headers = {
      Accept: 'application/json',
      'X-V4-Source': 'v4-command-center',
      'X-Ekyte-Company-Id': String(params?.companyId || config.companyId || '')
    };

    if (config.mode === 'direct') {
      const token = localStorage.getItem(config.tokenStorageKey || TOKEN_KEY);
      if (!token) throw new Error('Token eKyte ausente. Use proxy/N8N ou salve o token apenas para teste local.');
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(buildUrl(resource, params), { headers, signal: controller.signal });
      const text = await response.text();
      let body = null;
      try {
        body = text ? JSON.parse(text) : null;
      } catch (error) {
        body = text;
      }
      if (!response.ok) {
        const message = body?.message || body?.error || `Erro HTTP ${response.status}`;
        throw new Error(message);
      }
      return body;
    } finally {
      clearTimeout(timer);
    }
  }

  function unwrapRows(payload) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.tasks)) return payload.tasks;
    if (Array.isArray(payload?.result)) return payload.result;
    if (Array.isArray(payload?.rows)) return payload.rows;
    return [];
  }

  function pick(row, keys, fallback) {
    for (const key of keys) {
      if (row && row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') return row[key];
    }
    return fallback;
  }

  function normalizeStatus(value) {
    const text = String(value || '').toLowerCase();
    if (/(done|feito|conclu|finaliz|aprovad)/.test(text)) return 'Concluído';
    if (/(valid|review|revis|aprov)/.test(text)) return 'Validação';
    if (/(doing|execu|andamento|progress|desenvolv)/.test(text)) return 'Em execução';
    return 'Backlog';
  }

  function normalizeProgress(status, row) {
    const explicit = Number(pick(row, ['progress', 'progresso', 'percentual', '%'], NaN));
    if (Number.isFinite(explicit)) return Math.max(0, Math.min(100, explicit));
    if (status === 'Concluído') return 100;
    if (status === 'Validação') return 75;
    if (status === 'Em execução') return 45;
    return 10;
  }

  function taskType(row) {
    const raw = String(pick(row, ['tipo_tarefa', 'tipo', 'TIPO DE TAREFA', 'taskTypeId', 'typeId', 'type'], '')).trim();
    return RELEVANT_TASK_TYPES[raw] || raw || 'eKyte';
  }

  function hasRelevantScope(row, typeLabel) {
    const config = getConfig();
    const title = String(pick(row, ['title', 'titulo', 'TITULO', 'name', 'nome', 'taskName'], '')).toLowerCase();
    const description = String(pick(row, ['description', 'descricao', 'DESCRICAO', 'observacao', 'notes'], '')).toLowerCase();
    const typeId = String(pick(row, ['tipo_tarefa', 'tipo', 'TIPO DE TAREFA', 'taskTypeId', 'typeId'], '')).trim();

    if (RELEVANT_TASK_TYPES[typeId]) return true;
    if (RELEVANT_KEYWORDS.some((keyword) => title.includes(keyword) || description.includes(keyword))) return true;
    if (config.includeCampaignMonitoring && /monitoramento de campanhas/.test(title)) return true;
    if (config.includeSocialMonitoring && /monitoramento de redes sociais/.test(title)) return true;
    return Boolean(typeLabel && /campanha|crm|dashboard|power bi|relatorio|tracking|auditoria|social/i.test(typeLabel));
  }

  function normalizeTask(row, state, fallbackClientId) {
    const title = String(pick(row, ['title', 'titulo', 'TITULO', 'name', 'nome', 'taskName'], 'Task eKyte')).trim();
    const type = taskType(row);
    if (!hasRelevantScope(row, type)) return null;

    const externalId = String(pick(row, ['id', 'taskId', 'id_task', 'ID', 'codigo', 'SEQUENCIAL'], title)).trim();
    const status = normalizeStatus(pick(row, ['status', 'fase', 'Fase atual', 'stage', 'situacao'], 'Backlog'));
    const clientId = resolveClientId(row, state, fallbackClientId);

    return {
      id: `ekyte-${clientId}-${externalId}`.replace(/[^a-zA-Z0-9_-]/g, '-'),
      clientId,
      source: 'ekyte',
      externalId,
      title,
      status,
      owner: String(pick(row, ['owner', 'executor', 'responsavel', 'EMAIL EXECUTOR', 'emailExecutor', 'assignee'], 'V4')).trim(),
      type,
      priority: String(pick(row, ['priority', 'prioridade', 'PRIORIDADE'], 'Média')).trim() || 'Média',
      start: normalizeDate(pick(row, ['start', 'inicio', 'DATA INICIO', 'startDate', 'createdAt'], '')),
      end: normalizeDate(pick(row, ['end', 'entrega', 'DATA ENTREGA', 'dueDate', 'deadline'], '')),
      progress: normalizeProgress(status, row),
      link: String(pick(row, ['link', 'url', 'taskUrl'], externalId ? `https://app.ekyte.com/#/tasks/list/${externalId}/edit` : '')).trim(),
      updatedAt: new Date().toISOString()
    };
  }

  function normalizeActionPlan(task) {
    return {
      id: `ap-${task.id}`,
      clientId: task.clientId,
      source: 'ekyte',
      what: task.title,
      why: 'Demanda operacional vinda do eKyte.',
      where: task.type,
      when: task.end || task.start || 'Semana atual',
      who: task.owner,
      how: task.link ? `Executar e acompanhar no eKyte: ${task.link}` : 'Executar e atualizar no eKyte.',
      status: task.status
    };
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

  function normalizeText(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function resolveClientId(row, state, fallbackClientId) {
    const raw = normalizeText(pick(row, ['client', 'cliente', 'CLIENTE', 'project', 'projeto', 'companyName', 'customer'], ''));
    if (raw) {
      const match = (state.clients || []).find((client) => {
        const name = normalizeText(client.name);
        return raw.includes(name) || name.includes(raw);
      });
      if (match) return match.id;
    }
    return fallbackClientId || state.clients?.[0]?.id || 'global';
  }

  function mergeTasksIntoState(state, tasks, targetClientId) {
    state.tasks = state.tasks || [];
    state.actionPlan = state.actionPlan || [];
    state.events = state.events || [];

    const shouldKeep = (item) => {
      if (item.source !== 'ekyte') return true;
      if (!targetClientId) return false;
      return item.clientId !== targetClientId;
    };

    state.tasks = state.tasks.filter(shouldKeep);
    state.actionPlan = state.actionPlan.filter(shouldKeep);
    state.tasks.push(...tasks);
    state.actionPlan.push(...tasks.map(normalizeActionPlan));

    const ekyte = (state.integrations || []).find((item) => item.id === 'ekyte');
    if (ekyte) {
      ekyte.status = 'Sincronizado';
      ekyte.sync = 'N8N/API';
      ekyte.lastUpdate = new Date().toLocaleString('pt-BR');
    }

    state.events.unshift({
      id: `ev-ekyte-${Date.now()}`,
      type: 'sync',
      text: `eKyte sincronizado: ${tasks.length} tasks operacionais`,
      time: 'agora'
    });

    writeState(state);
    return state;
  }

  async function sync(options = {}) {
    const state = readState();
    const raw = await request('tasks', options);
    const rows = unwrapRows(raw);
    const tasks = rows
      .map((row) => normalizeTask(row, state, options.clientId))
      .filter(Boolean);

    mergeTasksIntoState(state, tasks, options.clientId);
    return { ok: true, source: 'ekyte', synced: tasks.length, totalReceived: rows.length };
  }

  async function syncAll() {
    return sync({});
  }

  window.V4_EKYTE = {
    getConfig,
    saveConfig,
    setToken,
    sync,
    syncAll,
    normalizeTask,
    relevantTaskTypes: RELEVANT_TASK_TYPES,
    relevantKeywords: RELEVANT_KEYWORDS
  };
})();
