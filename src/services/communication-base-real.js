// Base de comunicação real por cliente. Usa backend seguro quando disponível e fallback verificado sem tokens no front-end.
(function () {
  const STORAGE_KEY = 'v4-command-center-state-v6-crm-performance-losses';
  const nowPtBr = () => new Date().toLocaleString('pt-BR');

  const VERIFIED_BASES = Object.freeze({
    'espaco-master': {
      clientId: 'espaco-master',
      clientName: 'Espaço Master',
      source: {
        kind: 'google-drive-xlsx',
        driveFileId: '1GU8tVEzA9sSMToJDlhnzp0rTQqWQb_1E',
        fileName: 'BASE_COMUNICACAO_Espaco_Master.xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        generatedAt: '2026-05-19 13:11:32',
        modifiedTime: '2026-05-19T13:21:16.000Z'
      },
      config: {
        cliente: 'Espaço Master',
        approvalKey: 'ESPACOMASTER',
        grupoWhatsappId: '120363424198629431',
        grupoWhatsappJid: '120363424198629431@g.us',
        nicho: 'Residencial sênior',
        palavrasChaveDrive: 'Espaço Master, idosos, residencial sênior',
        pastaDriveId: '1tQgluKulSRjbMB6p0iZbUQ4x6UsDeiCC',
        pastaDriveUrl: 'https://drive.google.com/drive/folders/1tQgluKulSRjbMB6p0iZbUQ4x6UsDeiCC',
        statusAutomacao: 'preparada'
      },
      ekyteConfig: {
        idWorkspaceEkyte: '131114',
        idProjetoEkyte: '276870',
        idTipoTarefaEkyte: '55820',
        idTaskModeloEkyte: '8851196',
        executorIdEkyte: '782e3f64-e027-4eff-8d6c-716cf76c1532',
        linkTaskModelo: 'https://app.ekyte.com/#/tasks/list/8851196.0/edit'
      },
      dashboard: { mensagensRegistradas: 0, alertasPendentes: 0, aprovacoesAguardando: 0, pendenciasAbertas: 0, promessasEmAberto: 0, riscosAtivos: 0, prioridadeMedia: 0, ultimaMensagem: '', socialDemandas: 9 },
      socialMediaHistorico: [
        { mes: 'Abril', accountSubiuDemanda: 'Sim', prePauta: 'Finalizada', pauta: 'Finalizada', designer: 'Finalizada', linkDemanda: 'https://app.ekyte.com/#/tasks/list/8884849/edit', situacao: '' },
        { mes: 'Maio', accountSubiuDemanda: 'Sim', prePauta: 'Finalizada', pauta: 'Finalizada', designer: 'Demanda no quadro (Gabriel)', linkDemanda: 'https://app.ekyte.com/#/tasks/list/8851831/edit', situacao: 'Faltam só 2 criativos', proximaDataPostagemSemCriativo: '2026-05-26' },
        { mes: 'Junho', accountSubiuDemanda: 'Sim', prePauta: 'Finalizada', linkDemanda: 'https://app.ekyte.com/#/tasks/list/9223570/edit', situacao: '' }
      ],
      tableStatus: { mensagens: { rows: 0, status: 'somente_cabecalho' }, aprovacoes: { rows: 0, status: 'somente_cabecalho' }, pendencias: { rows: 0, status: 'somente_cabecalho' }, promessas: { rows: 0, status: 'somente_cabecalho' }, riscos: { rows: 0, status: 'somente_cabecalho' }, resumosIa: { rows: 0, status: 'somente_cabecalho' }, socialMediaHistorico: { rows: 9, status: 'com_dados' } }
    },
    'st1-internet': {
      clientId: 'st1-internet',
      clientName: 'ST1 Internet',
      source: {
        kind: 'google-drive-xlsx',
        driveFileId: '1b2WIFOrC5cCP0npwqAXynnyt8Zd9zDxp',
        fileName: 'BASE_COMUNICACAO_ST1_Internet.xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        generatedAt: '2026-05-19 13:11:32',
        modifiedTime: '2026-05-19T13:21:17.000Z'
      },
      config: {
        cliente: 'ST1 Internet',
        approvalKey: 'ST1INTERNET',
        grupoWhatsappId: '120363403300629023',
        grupoWhatsappJid: '120363403300629023@g.us',
        nicho: 'Provedor de internet',
        palavrasChaveDrive: 'ST1 Internet, internet, telecom',
        pastaDriveId: '1IOElrGUmuVZ37Rqr443lGHdKiJIuVMxw',
        pastaDriveUrl: 'https://drive.google.com/drive/folders/1IOElrGUmuVZ37Rqr443lGHdKiJIuVMxw',
        statusAutomacao: 'preparada'
      },
      ekyteConfig: {
        idWorkspaceEkyte: '127063',
        idProjetoEkyte: '273637',
        idTipoTarefaEkyte: '55820',
        idTaskModeloEkyte: '8851196',
        executorIdEkyte: '782e3f64-e027-4eff-8d6c-716cf76c1532',
        linkTaskModelo: 'https://app.ekyte.com/#/tasks/list/8851196.0/edit'
      },
      dashboard: { mensagensRegistradas: 0, alertasPendentes: 0, aprovacoesAguardando: 0, pendenciasAbertas: 0, promessasEmAberto: 0, riscosAtivos: 0, prioridadeMedia: 0, ultimaMensagem: '', socialDemandas: 0 },
      socialMediaHistorico: [],
      tableStatus: { mensagens: { rows: 0, status: 'somente_cabecalho' }, aprovacoes: { rows: 0, status: 'somente_cabecalho' }, pendencias: { rows: 0, status: 'somente_cabecalho' }, promessas: { rows: 0, status: 'somente_cabecalho' }, riscos: { rows: 0, status: 'somente_cabecalho' }, resumosIa: { rows: 0, status: 'somente_cabecalho' }, socialMediaHistorico: { rows: 1, status: 'sem_historico_encontrado' } }
    }
  });

  function safeArray(value) { return Array.isArray(value) ? value : []; }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }

  function removeGenerated(rows, clientId) {
    return safeArray(rows).filter((row) => !(row.clientId === clientId && row.source === 'communication-base-real'));
  }

  function buildCommunicationTasks(base) {
    return safeArray(base.socialMediaHistorico)
      .filter((row) => row.linkDemanda || row.situacao || row.proximaDataPostagemSemCriativo)
      .map((row, index) => ({
        id: `comm-${base.clientId}-${String(row.mes || index + 1).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-')}`,
        clientId: base.clientId,
        source: 'communication-base-real',
        title: `Social Media ${base.clientName} - ${row.mes}`,
        status: row.situacao ? 'Em execução' : 'Backlog',
        owner: String(row.designer || '').includes('Gabriel') ? 'Gabriel' : 'V4',
        type: 'Social Media / eKyte',
        priority: row.proximaDataPostagemSemCriativo ? 'Alta' : 'Média',
        start: base.source.generatedAt.slice(0, 10),
        end: row.proximaDataPostagemSemCriativo || '',
        progress: row.situacao ? 70 : 35,
        link: row.linkDemanda || ''
      }));
  }

  function buildActionPlan(task) {
    return { id: `ap-${task.id}`, clientId: task.clientId, source: 'communication-base-real', what: task.title, why: 'Item encontrado na base real de comunicação do cliente.', where: task.type, when: task.end || 'Próximo ciclo', who: task.owner, how: task.link ? `Acompanhar no eKyte: ${task.link}` : 'Acompanhar pela base de comunicação.', status: task.status };
  }

  function normalizeBackendPayload(clientId, payload) {
    const fallback = VERIFIED_BASES[clientId];
    const data = payload?.snapshot || payload;
    if (!fallback || !data || data.clientId !== clientId) throw new Error('Payload de comunicação inválido.');
    const source = typeof data.source === 'object' && data.source !== null ? data.source : { kind: data.source || fallback.source.kind };
    return { ...fallback, source: { ...fallback.source, ...source, driveFileId: data.fileId || source.driveFileId || fallback.source.driveFileId, loadedAt: data.loadedAt || source.loadedAt || '' }, dashboard: { ...fallback.dashboard, ...(data.dashboard || {}) }, config: { ...fallback.config, ...(data.config || {}) }, ekyteConfig: { ...fallback.ekyteConfig, ...(data.ekyte || data.ekyteConfig || {}) }, socialMediaHistorico: safeArray(data.socialMediaHistorico).length ? data.socialMediaHistorico : fallback.socialMediaHistorico, tableStatus: data.tableStatus || fallback.tableStatus, communication: data.communication || {} };
  }

  function applyBaseToState(state, baseInput, options = {}) {
    const base = clone(baseInput);
    const target = state || {};
    target.clients = target.clients || [];
    target.tasks = removeGenerated(target.tasks, base.clientId);
    target.actionPlan = removeGenerated(target.actionPlan, base.clientId);
    target.communicationSnapshots = target.communicationSnapshots || {};
    target.integrations = target.integrations || [];
    target.events = target.events || [];

    const client = target.clients.find((item) => item.id === base.clientId);
    if (client) {
      client.groupId = base.config.grupoWhatsappId;
      client.segment = base.config.nicho;
      client.driveFolderId = base.config.pastaDriveId;
      client.driveUrl = base.config.pastaDriveUrl;
      client.communicationBase = { type: 'google-drive-xlsx-proxy', status: options.fromBackend ? 'Sincronizada pelo backend/N8N' : 'Base real verificada no Drive', sourceFileId: base.source.driveFileId, sourceFileName: base.source.fileName, sourceMimeType: base.source.mimeType, generatedAt: base.source.generatedAt, modifiedTime: base.source.modifiedTime, lastSync: nowPtBr(), groupJid: base.config.grupoWhatsappJid, driveFolderId: base.config.pastaDriveId, driveFolderUrl: base.config.pastaDriveUrl, approvalKey: base.config.approvalKey, niche: base.config.nicho, keywords: base.config.palavrasChaveDrive, tabs: base.tableStatus };
      client.ekyteConfig = { ...(client.ekyteConfig || {}), ...base.ekyteConfig, statusAutomacao: base.config.statusAutomacao };
      client.status = 'Base real de comunicação vinculada';
    }

    const tasks = buildCommunicationTasks(base);
    target.tasks.push(...tasks);
    target.actionPlan.push(...tasks.map(buildActionPlan));
    target.communicationSnapshots[base.clientId] = { source: base.source, generatedAt: nowPtBr(), fromBackend: Boolean(options.fromBackend), dashboard: base.dashboard, config: base.config, ekyteConfig: base.ekyteConfig, socialMediaHistorico: base.socialMediaHistorico, tableStatus: base.tableStatus, latestMessages: [] };
    target.integrations = target.integrations.filter((item) => item.id !== 'communication-base-real');
    target.integrations.push({ id: 'communication-base-real', name: 'Base de Comunicação Real', type: 'Google Drive XLSX + Backend/N8N', status: 'Configurado', sync: 'Manual / sob demanda', lastUpdate: nowPtBr() });
    target.events.unshift({ id: `ev-comm-${base.clientId}-${Date.now()}`, type: 'sync', text: `${base.clientName}: base real de comunicação ${options.fromBackend ? 'sincronizada' : 'verificada'} (${base.source.fileName})`, time: 'agora' });
    return target;
  }

  async function fetchBaseFromProxy(clientId) {
    let payload;
    if (window.V4_RUNTIME_API?.loadCommunicationBase) payload = await window.V4_RUNTIME_API.loadCommunicationBase(clientId, { force: true });
    else {
      const response = await fetch(`/api/communication-base/${encodeURIComponent(clientId)}?force=true`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Proxy retornou ${response.status}`);
      payload = await response.json();
    }
    return normalizeBackendPayload(clientId, payload);
  }

  async function syncClientBase(clientId, state, options = {}) {
    const fallback = VERIFIED_BASES[clientId];
    if (!fallback) return { ok: false, clientId, source: 'communication-base', message: 'Cliente sem base de comunicação mapeada.' };
    let base = fallback;
    let fromBackend = false;
    let backendError = '';
    if (options.fetchRemote !== false) {
      try { base = await fetchBaseFromProxy(clientId); fromBackend = true; } catch (error) { backendError = error.message; }
    }
    applyBaseToState(state || window.V4_SEED || {}, base, { fromBackend });
    return { ok: true, clientId, source: fromBackend ? 'backend-proxy' : 'verified-drive-bootstrap', fromBackend, backendError, message: fromBackend ? 'Base sincronizada pelo backend/N8N.' : 'Backend indisponível; usando base real verificada do Drive.' };
  }

  async function syncAllBases(state, options = {}) {
    const results = [];
    for (const clientId of Object.keys(VERIFIED_BASES)) results.push(await syncClientBase(clientId, state || window.V4_SEED || {}, options));
    return { ok: results.every((item) => item.ok), source: 'communication-base', results };
  }

  function hydrateLocalStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const state = raw ? JSON.parse(raw) : (window.V4_SEED || null);
      if (!state) return;
      Object.values(VERIFIED_BASES).forEach((base) => applyBaseToState(state, base, { fromBackend: false }));
      if (raw) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) { console.warn('[CommunicationBase] Não foi possível hidratar localStorage', error); }
  }

  if (window.V4_SEED) Object.values(VERIFIED_BASES).forEach((base) => applyBaseToState(window.V4_SEED, base, { fromBackend: false }));
  hydrateLocalStorage();

  window.V4_COMMUNICATION_BASE = { bases: VERIFIED_BASES, applyBaseToState, syncClientBase, syncAllBases, clientIds: Object.keys(VERIFIED_BASES) };
})();
