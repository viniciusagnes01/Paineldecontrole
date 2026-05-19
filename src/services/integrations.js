(function () {
  const OFFICIAL_CLIENTS = [
    {
      id: 'alphaville',
      name: 'Alphaville',
      aliases: ['ALPHAVILLE', 'ALPHAVILLE SACADAS'],
      groupId: '120363257134796140',
      driveFolderId: '1lG21qv4S7LCWhHe7gBw73NPlDSJ4m-yi',
      growthPackSpreadsheetId: '1CtfFiB0q2B72Cwb9VjTkv8gZHYtBv2keICwBNj7Z0ws',
      growthPackCrmGid: '833926654'
    },
    {
      id: 'yousafer',
      name: 'YouSafer',
      aliases: ['YOUSAFER', 'YOU SAFER'],
      groupId: '120363299569409896',
      driveFolderId: '1Iz2nt_MwESsFCeAZD6z9IjQ8fz45iRmY',
      growthPackSpreadsheetId: '1KLxctUK2ZGaM7jm1y2zj-StwLTgV6qP0PL1a-ZEnMmo',
      growthPackCrmGid: ''
    },
    {
      id: 'prime',
      name: 'Prime Mecânica',
      aliases: ['PRIME', 'PRIME MECANICA', 'PRIME MECÂNICA'],
      groupId: '120363418609215409',
      driveFolderId: '1ynLKciynIzr7gVtgiq3fy5IoTranCFAn',
      growthPackSpreadsheetId: '1h6-xdgyekZrNLZ4luZU61S0hzh0Z-HLAZR7qCm8NQG8',
      growthPackCrmGid: '1986904416'
    },
    {
      id: 'multimed',
      name: 'MultiMed',
      aliases: ['MULTIMED'],
      groupId: '120363423606250960',
      driveFolderId: '1H5kekxtbt-67S4K_ZB9ip_Qag6h9GupB',
      growthPackSpreadsheetId: '1h4obelICw7z1rbYNaEdkbrCH-qYUhFttzW3SopNxodg',
      growthPackCrmGid: ''
    },
    {
      id: 'treinando-online',
      name: 'Treinando Online',
      aliases: ['TREINANDO ONLINE', 'TREINANDO ONLINNE'],
      groupId: '120363421384631664',
      driveFolderId: '14sOPVe-9YiZrmQbKPLmEIg0CHrFlALq2',
      growthPackSpreadsheetId: '1rnD4jIpKfX5DAQMETQhOG-ULg81iAglJoej_AY8ArvA',
      growthPackCrmGid: ''
    },
    {
      id: 'seg-eletronic',
      name: 'Seg Eletronic',
      aliases: ['SEG ELETRONIC', 'SEG ELETRONIC LTDA'],
      groupId: '120363427075801557',
      driveFolderId: '1naqEp5-RMWz7XEvsl50T5jpG2ecNDMDW',
      growthPackSpreadsheetId: '1-CSmqLVLbfwVuVxkez4Q38fSTkVzyGOudUmj_GIxHAc',
      growthPackCrmGid: '1929982003'
    },
    {
      id: 'espaco-master',
      name: 'Espaço Master',
      aliases: ['ESPAÇO MASTER', 'ESPACO MASTER'],
      groupId: '120363424198629431',
      driveFolderId: '1tQgluKulSRjbMB6p0iZbUQ4x6UsDeiCC',
      growthPackSpreadsheetId: '',
      growthPackCrmGid: ''
    },
    {
      id: 'st1-internet',
      name: 'ST1 Internet',
      aliases: ['ST1 INTERNET', 'ST1'],
      groupId: '120363403300629023',
      driveFolderId: '1IOElrGUmuVZ37Rqr443lGHdKiJIuVMxw',
      growthPackSpreadsheetId: '1BurqRDqYbWq8dPVxXiKjWH6WmfBNoe39AymwJM8LpFA',
      growthPackCrmGid: '1699545222'
    },
    {
      id: 'sindihoteleiros-cuidar-on',
      name: 'SindiHoteleiros (Cuidar On)',
      aliases: ['SINDIHOTELEIROS', 'SINDICATO HOTELEIROS', 'CUIDAR ON'],
      groupId: '120363372501205454',
      driveFolderId: '17q8l0y5OhxL5qBtbv3RzyDUUVSL9nAPy',
      growthPackSpreadsheetId: '',
      growthPackCrmGid: ''
    }
  ];

  const FCA_SOURCE = {
    type: 'google_spreadsheet',
    spreadsheetId: '1ET6cmm3SHCO_DnxJwMTLrDFpQ-pMOcSUm56hY5ZnGmk',
    url: 'https://docs.google.com/spreadsheets/d/1ET6cmm3SHCO_DnxJwMTLrDFpQ-pMOcSUm56hY5ZnGmk',
    sheetName: '[Cockpit] [Overview]',
    gid: '744728561',
    matchMode: 'exact_alias_only'
  };

  const ENDPOINTS = {
    ekyte: '/api/ekyte',
    ekyteTasks: '/api/ekyte/tasks',
    ekyteProjects: '/api/ekyte/projects',
    ekyteActionPlan: '/api/ekyte/action-plan',
    googleDrive: '/api/google-drive',
    crmSheets: '/api/sheets/crm',
    performanceSheets: '/api/sheets/performance',
    fca: '/api/fca',
    metaAds: '/api/meta-ads',
    googleAds: '/api/google-ads',
    semrush: '/api/semrush',
    lossReport: '/api/crm/loss-report'
  };

  const CERTAINTY_RULES = Object.freeze({
    allowOnlyOfficialClients: true,
    allowCrossClientSearch: false,
    requireClientIdOrGroupId: true,
    requireSourceEvidence: true,
    blockUnknownClient: true,
    blockUnmappedEkyteData: true,
    blockUnmappedAdAccountData: true,
    acceptedClientKeys: [
      'clientId',
      'groupId',
      'driveFolderId',
      'growthPackSpreadsheetId',
      'ekyteClientId',
      'ekyteProjectId'
    ]
  });

  function normalize(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toUpperCase();
  }

  function getOfficialClients() {
    const runtimeClients = Array.isArray(window.V4_OFFICIAL_ACTIVE_CLIENTS)
      ? window.V4_OFFICIAL_ACTIVE_CLIENTS
      : [];

    if (!runtimeClients.length) return OFFICIAL_CLIENTS;

    return OFFICIAL_CLIENTS.map((client) => {
      const runtime = runtimeClients.find((item) => item.id === client.id || item.groupId === client.groupId);
      return {
        ...client,
        ...(runtime || {}),
        aliases: client.aliases,
        growthPackSpreadsheetId:
          client.growthPackSpreadsheetId ||
          runtime?.growthPack?.spreadsheetId ||
          runtime?.crmSheet?.spreadsheetId ||
          '',
        growthPackCrmGid:
          client.growthPackCrmGid ||
          runtime?.growthPack?.crmGid ||
          runtime?.crmSheet?.gid ||
          ''
      };
    });
  }

  function findClient(input = {}) {
    const clients = getOfficialClients();
    const raw = typeof input === 'string' ? { clientId: input, groupId: input, name: input } : input;

    return clients.find((client) => {
      if (raw.clientId && client.id === raw.clientId) return true;
      if (raw.groupId && client.groupId === String(raw.groupId)) return true;
      if (raw.driveFolderId && client.driveFolderId === raw.driveFolderId) return true;
      if (raw.growthPackSpreadsheetId && client.growthPackSpreadsheetId === raw.growthPackSpreadsheetId) return true;

      const name = normalize(raw.name || raw.clientName || raw.customer || raw.customerName || '');
      if (!name) return false;

      return [client.name, ...(client.aliases || [])].map(normalize).includes(name);
    }) || null;
  }

  function assertOfficialClient(input) {
    const client = findClient(input);

    if (!client) {
      return {
        ok: false,
        error: 'CLIENT_NOT_FOUND_IN_OFFICIAL_SCOPE',
        message: 'Cliente bloqueado: não está na base oficial ativa do Vinicius.'
      };
    }

    return { ok: true, client };
  }

  function getClientSources(input) {
    const resolved = assertOfficialClient(input);
    if (!resolved.ok) return resolved;

    const { client } = resolved;
    const sources = {
      client,
      knowledgeBase: {
        enabled: Boolean(client.driveFolderId),
        type: 'google_drive_folder',
        folderId: client.driveFolderId,
        url: `https://drive.google.com/drive/folders/${client.driveFolderId}`,
        certainty: 'groupId_to_driveFolderId'
      },
      growthPackCrm: {
        enabled: Boolean(client.growthPackSpreadsheetId),
        type: 'google_spreadsheet',
        spreadsheetId: client.growthPackSpreadsheetId,
        gid: client.growthPackCrmGid || '',
        sheetName: 'BASE_CRM',
        url: client.growthPackSpreadsheetId
          ? `https://docs.google.com/spreadsheets/d/${client.growthPackSpreadsheetId}`
          : '',
        certainty: client.growthPackSpreadsheetId ? 'client_registry_growthpack_id' : 'not_located'
      },
      growthPackPerformance: {
        enabled: Boolean(client.growthPackSpreadsheetId),
        type: 'google_spreadsheet',
        spreadsheetId: client.growthPackSpreadsheetId,
        monthlySheetName: '1.0 Mensal',
        weeklySheetName: '2.0 Semanal',
        metaRawSheetName: 'bd Meta Ads',
        googleRawSheetName: 'bd Google Ads ',
        certainty: client.growthPackSpreadsheetId ? 'client_registry_growthpack_id' : 'not_located'
      },
      fca: {
        enabled: true,
        ...FCA_SOURCE,
        allowedAliases: client.aliases,
        certainty: 'exact_alias_match_required'
      },
      ekyte: {
        enabled: false,
        endpoint: ENDPOINTS.ekyte,
        tasksEndpoint: ENDPOINTS.ekyteTasks,
        projectsEndpoint: ENDPOINTS.ekyteProjects,
        actionPlanEndpoint: ENDPOINTS.ekyteActionPlan,
        tokenLocation: 'server_or_n8n_only',
        allowedIn: ['tasks', 'actionPlan', 'central', 'fca_actions'],
        blockedIn: ['revenue', 'sales', 'mql', 'sql', 'roas', 'cpl', 'cac', 'media_spend'],
        requiredMapping: [
          'clientId',
          'groupId',
          'ekyteProjectId',
          'ekyteClientId',
          'exactClientAlias'
        ],
        certainty: 'disabled_until_exact_ekyte_mapping_exists'
      }
    };

    return { ok: true, client, sources };
  }

  function isOfficialClientName(value) {
    const name = normalize(value);
    if (!name) return false;

    return getOfficialClients().some((client) => {
      const aliases = [client.name, ...(client.aliases || [])].map(normalize);
      return aliases.includes(name);
    });
  }

  function detectClientFromExternalItem(item = {}) {
    return findClient({
      clientId: item.clientId,
      groupId: item.groupId,
      driveFolderId: item.driveFolderId,
      growthPackSpreadsheetId: item.growthPackSpreadsheetId,
      name:
        item.clientName ||
        item.customerName ||
        item.customer ||
        item.company ||
        item.projectName ||
        item.workspaceName ||
        item.accountName
    });
  }

  function isExternalItemAllowedForClient(item, clientInput) {
    const resolved = assertOfficialClient(clientInput);
    if (!resolved.ok) return false;

    const expected = resolved.client;
    const detected = detectClientFromExternalItem(item);

    if (!detected) return false;
    if (detected.id !== expected.id) return false;

    return true;
  }

  function filterExternalItemsForClient(items = [], clientInput) {
    return items.filter((item) => isExternalItemAllowedForClient(item, clientInput));
  }

  function mapEkyteTask(task = {}, clientInput) {
    const resolved = assertOfficialClient(clientInput);
    if (!resolved.ok) return null;

    if (!isExternalItemAllowedForClient(task, resolved.client)) return null;

    return {
      id: task.id || task.taskId || `ekyte-${Date.now()}`,
      clientId: resolved.client.id,
      title: task.title || task.name || 'Task sem título',
      status: task.status || task.phase || 'Sem status',
      owner: task.owner || task.assignee || task.responsible || 'Não informado',
      type: task.type || task.category || 'Ekyte',
      priority: task.priority || 'Não informado',
      start: task.start || task.startDate || task.createdAt || '',
      end: task.end || task.dueDate || task.deadline || '',
      progress: Number(task.progress || 0),
      source: 'ekyte',
      sourceEvidence: task.url || task.link || '',
      certainty: 'official_client_match'
    };
  }

  async function fetchJson(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP ${response.status} ao consultar ${url}`);
    }

    return response.json();
  }

  async function syncEkyteForClient(clientInput) {
    const resolved = assertOfficialClient(clientInput);
    if (!resolved.ok) return resolved;

    const { client } = resolved;

    const url = `${ENDPOINTS.ekyteTasks}?clientId=${encodeURIComponent(client.id)}&groupId=${encodeURIComponent(client.groupId)}`;

    try {
      const data = await fetchJson(url);
      const rawItems = Array.isArray(data) ? data : data.tasks || data.items || [];
      const tasks = rawItems.map((task) => mapEkyteTask(task, client)).filter(Boolean);

      return {
        ok: true,
        client,
        source: 'ekyte',
        endpoint: ENDPOINTS.ekyteTasks,
        tasks,
        blockedItems: rawItems.length - tasks.length,
        certainty: 'server_filtered_and_front_revalidated'
      };
    } catch (error) {
      return {
        ok: false,
        client,
        source: 'ekyte',
        error: error.message,
        message: 'Ekyte não sincronizado. Use N8N/backend com token seguro e retorno já filtrado por cliente oficial.'
      };
    }
  }

  async function syncAll(clientInput) {
    const resolved = getClientSources(clientInput);
    if (!resolved.ok) return resolved;

    const { client, sources } = resolved;

    return {
      ok: true,
      client,
      sources,
      source: 'official-integration-registry',
      message: 'Integrações resolvidas apenas por vínculo oficial do cliente. Fontes sem vínculo determinístico ficam bloqueadas.',
      certaintyRules: CERTAINTY_RULES
    };
  }

  window.V4_INTEGRATIONS = {
    version: 'official-integrations-20260519-01',
    endpoints: ENDPOINTS,
    certaintyRules: CERTAINTY_RULES,
    officialClients: getOfficialClients,
    findClient,
    assertOfficialClient,
    getClientSources,
    isOfficialClientName,
    detectClientFromExternalItem,
    isExternalItemAllowedForClient,
    filterExternalItemsForClient,
    mapEkyteTask,
    syncEkyteForClient,
    syncAll,
    notes: [
      'Nunca usar dado de cliente sem clientId, groupId, driveFolderId, growthPackSpreadsheetId ou alias exato validado.',
      'Google Drive é base de conhecimento por pasta oficial do cliente.',
      'GrowthPack / BASE_CRM é fonte de resultado, vendas, MQL, SQL, funil e receita.',
      'FCA usa Cockpit Overview apenas com match exato de alias oficial.',
      'Ekyte entra somente em Tasks, Plano de Ação, Painel Central e FCA operacional.',
      'Ekyte não entra em receita, vendas, MQL, SQL, CAC, CPL, ROAS ou mídia paga.',
      'Token do Ekyte deve ficar somente em N8N/backend/proxy, nunca no GitHub Pages.'
    ]
  };
})();
