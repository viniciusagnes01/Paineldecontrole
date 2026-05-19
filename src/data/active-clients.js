(function () {
  const OFFICIAL_ACTIVE_CLIENTS = Object.freeze([
    {
      id: 'alphaville',
      name: 'Alphaville',
      initials: 'AL',
      groupId: '120363257134796140',
      driveFolderId: '1lG21qv4S7LCWhHe7gBw73NPlDSJ4m-yi',
      driveUrl: 'https://drive.google.com/drive/folders/1lG21qv4S7LCWhHe7gBw73NPlDSJ4m-yi'
    },
    {
      id: 'yousafer',
      name: 'YouSafer',
      initials: 'YS',
      groupId: '120363299569409896',
      driveFolderId: '1Iz2nt_MwESsFCeAZD6z9IjQ8fz45iRmY',
      driveUrl: 'https://drive.google.com/drive/folders/1Iz2nt_MwESsFCeAZD6z9IjQ8fz45iRmY'
    },
    {
      id: 'prime',
      name: 'Prime',
      initials: 'PR',
      groupId: '120363418609215409',
      driveFolderId: '1ynLKciynIzr7gVtgiq3fy5IoTranCFAn',
      driveUrl: 'https://drive.google.com/drive/folders/1ynLKciynIzr7gVtgiq3fy5IoTranCFAn'
    },
    {
      id: 'multimed',
      name: 'MultiMed',
      initials: 'MM',
      groupId: '120363423606250960',
      driveFolderId: '1H5kekxtbt-67S4K_ZB9ip_Qag6h9GupB',
      driveUrl: 'https://drive.google.com/drive/folders/1H5kekxtbt-67S4K_ZB9ip_Qag6h9GupB'
    },
    {
      id: 'treinando-online',
      name: 'Treinando Online',
      initials: 'TO',
      groupId: '120363421384631664',
      driveFolderId: '14sOPVe-9YiZrmQbKPLmEIg0CHrFlALq2',
      driveUrl: 'https://drive.google.com/drive/folders/14sOPVe-9YiZrmQbKPLmEIg0CHrFlALq2'
    },
    {
      id: 'seg-eletronic',
      name: 'Seg Eletronic',
      initials: 'SE',
      groupId: '120363427075801557',
      driveFolderId: '1naqEp5-RMWz7XEvsl50T5jpG2ecNDMDW',
      driveUrl: 'https://drive.google.com/drive/folders/1naqEp5-RMWz7XEvsl50T5jpG2ecNDMDW'
    },
    {
      id: 'espaco-master',
      name: 'Espaco Master',
      initials: 'EM',
      groupId: '120363424198629431',
      driveFolderId: '1tQgluKulSRjbMB6p0iZbUQ4x6UsDeiCC',
      driveUrl: 'https://drive.google.com/drive/folders/1tQgluKulSRjbMB6p0iZbUQ4x6UsDeiCC'
    },
    {
      id: 'st1-internet',
      name: 'ST1 Internet',
      initials: 'ST',
      groupId: '120363403300629023',
      driveFolderId: '1IOElrGUmuVZ37Rqr443lGHdKiJIuVMxw',
      driveUrl: 'https://drive.google.com/drive/folders/1IOElrGUmuVZ37Rqr443lGHdKiJIuVMxw'
    },
    {
      id: 'sindihoteleiros-cuidar-on',
      name: 'SindiHoteleiros (Cuidar On)',
      initials: 'SH',
      groupId: '120363372501205454',
      driveFolderId: '17q8l0y5OhxL5qBtbv3RzyDUUVSL9nAPy',
      driveUrl: 'https://drive.google.com/drive/folders/17q8l0y5OhxL5qBtbv3RzyDUUVSL9nAPy'
    }
  ]);

  const GUARDRAILS = Object.freeze({
    dataMode: 'official_drive_database',
    allowDemoData: false,
    allowCrossClientSearch: false,
    requireGroupId: true,
    requireDriveFolderId: true,
    requireSourceEvidence: true,
    unknownClientBehavior: 'block_response',
    notFoundBehavior: 'say_not_found_in_client_drive',
    activeClientCount: OFFICIAL_ACTIVE_CLIENTS.length
  });

  const UI_BY_CLIENT = Object.freeze({
    alphaville: { color: '#c91524', accent: '#ff3045' },
    yousafer: { color: '#0f898b', accent: '#21d2cc' },
    prime: { color: '#b70d1c', accent: '#ff4354' },
    multimed: { color: '#136cd8', accent: '#5ea2ff' },
    'treinando-online': { color: '#f05a28', accent: '#ffad42' },
    'seg-eletronic': { color: '#d21620', accent: '#ff5360' },
    'espaco-master': { color: '#8f2bd6', accent: '#c47cff' },
    'st1-internet': { color: '#1b78ff', accent: '#70c0ff' },
    'sindihoteleiros-cuidar-on': { color: '#607d8b', accent: '#a1bbc6' }
  });

  function emptyMetrics() {
    return {
      revenue: 0,
      revenueTarget: 0,
      leads: 0,
      cpl: 0,
      roas: 0,
      investment: 0,
      mql: 0,
      sql: 0,
      opportunities: 0,
      sales: 0,
      ticket: 0,
      ctr: 0,
      conversion: 0,
      dataSource: 'drive-not-synced'
    };
  }

  function emptyGoals() {
    return { revenue: 0, leads: 0, mqlRate: 0, cac: 0, roas: 0 };
  }

  function emptyCrmSheet() {
    return {
      type: 'googleDriveFolder',
      spreadsheetId: '',
      url: '',
      sheetName: '',
      dashboardSheetName: '',
      gid: '',
      proxyUrl: '',
      status: 'Aguardando leitura da pasta Drive oficial',
      lastSync: ''
    };
  }

  function emptyPerformanceSheets() {
    return {
      type: 'googleDriveFolder',
      spreadsheetId: '',
      url: '',
      monthlySheetName: '',
      weeklySheetName: '',
      monthlyGid: '',
      weeklyGid: '',
      metaRawSheetName: '',
      googleRawSheetName: '',
      proxyUrl: '',
      status: 'Aguardando leitura da pasta Drive oficial',
      lastSync: ''
    };
  }

  function toOfficialClient(client) {
    const ui = UI_BY_CLIENT[client.id] || { color: '#cf1022', accent: '#ff3048' };

    return {
      id: client.id,
      name: client.name,
      initials: client.initials,
      groupId: client.groupId,
      driveFolderId: client.driveFolderId,
      driveUrl: client.driveUrl,
      segment: 'Nao informado na base oficial',
      crm: 'Nao informado na base oficial',
      responsible: 'Vinicius Agnes',
      status: 'Base Drive vinculada',
      health: 0,
      color: ui.color,
      accent: ui.accent,
      mascot: client.initials,
      metrics: emptyMetrics(),
      goals: emptyGoals(),
      lps: [],
      crmSheet: emptyCrmSheet(),
      performanceSheets: emptyPerformanceSheets(),
      knowledgeBase: {
        type: 'google_drive_folder',
        folderId: client.driveFolderId,
        url: client.driveUrl,
        status: 'official_active',
        scopeLocked: true,
        sourceOfTruth: true
      },
      dataPolicy: {
        clientScopedOnly: true,
        allowDemoData: false,
        allowCrossClientSearch: false,
        requireEvidence: true
      }
    };
  }

  function applyOfficialDatabase(seed) {
    if (!seed) return;

    seed.settings = {
      ...(seed.settings || {}),
      dataMode: GUARDRAILS.dataMode,
      allowDemoData: false,
      period: 'Base oficial ativa - Google Drive por cliente',
      refreshMode: 'Drive/API',
      workspace: 'V4 Company',
      operator: 'Vinicius Agnes'
    };

    seed.clients = OFFICIAL_ACTIVE_CLIENTS.map(toOfficialClient);

    ['pixels', 'competitors', 'campaigns', 'creatives', 'tasks', 'actionPlan'].forEach((collection) => {
      seed[collection] = [];
    });

    seed.crmSnapshots = {};
    seed.performanceSnapshots = {};
    seed.events = [
      {
        id: 'official-drive-db-enabled',
        type: 'sync',
        text: 'Base oficial habilitada: dados por cliente devem vir apenas da pasta Drive vinculada ao groupId.',
        time: 'agora'
      }
    ];
    seed.alerts = [
      {
        id: 'official-client-scope',
        level: 'ok',
        text: 'Escopo travado nos clientes ativos enviados',
        detail: `${OFFICIAL_ACTIVE_CLIENTS.length} clientes oficiais carregados por groupId e driveFolderId.`
      },
      {
        id: 'demo-data-disabled',
        level: 'warning',
        text: 'Dados demonstrativos desativados',
        detail: 'O painel nao deve exibir metricas de cliente sem evidencia da pasta Drive oficial.'
      }
    ];
  }

  function findOfficialClientByGroupId(groupId) {
    return OFFICIAL_ACTIVE_CLIENTS.find((client) => client.groupId === String(groupId || '').trim()) || null;
  }

  function findOfficialClientById(clientId) {
    return OFFICIAL_ACTIVE_CLIENTS.find((client) => client.id === String(clientId || '').trim()) || null;
  }

  function resolveOfficialClientContext(input) {
    const groupId = typeof input === 'string' ? input : input?.groupId;
    const clientId = typeof input === 'string' ? '' : input?.clientId;
    const client = groupId ? findOfficialClientByGroupId(groupId) : findOfficialClientById(clientId);

    if (!client) {
      return {
        ok: false,
        error: 'CLIENT_NOT_FOUND_IN_OFFICIAL_DATABASE',
        message: 'Cliente nao encontrado na base oficial de clientes ativos.',
        guardrails: GUARDRAILS
      };
    }

    return {
      ok: true,
      client,
      groupId: client.groupId,
      driveFolderId: client.driveFolderId,
      driveUrl: client.driveUrl,
      scopeStatus: 'locked',
      guardrails: GUARDRAILS
    };
  }

  window.V4_OFFICIAL_ACTIVE_CLIENTS = OFFICIAL_ACTIVE_CLIENTS;
  window.V4_DATA_GUARDRAILS = GUARDRAILS;
  window.V4_FIND_CLIENT_BY_GROUP_ID = findOfficialClientByGroupId;
  window.V4_RESOLVE_CLIENT_CONTEXT = resolveOfficialClientContext;

  applyOfficialDatabase(window.V4_SEED);
})();
