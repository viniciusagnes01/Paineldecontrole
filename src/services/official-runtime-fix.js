(function () {
  const STORAGE_KEY = 'v4-command-center-state-v6-crm-performance-losses';
  const VERSION = 'official-client-sources-20260519-02';

  const CLIENT_SOURCES = {
    alphaville: {
      spreadsheetId: '1CtfFiB0q2B72Cwb9VjTkv8gZHYtBv2keICwBNj7Z0ws',
      title: 'Alphaville Sacadas | GrowthPack V26 (Inside Sales)',
      crmGid: '833926654',
      crmSheetName: 'BASE_CRM',
      monthlySheetName: '1.0 Mensal',
      weeklySheetName: '2.0 Semanal',
      metaRawSheetName: 'bd Meta Ads',
      googleRawSheetName: 'bd Google Ads '
    },
    yousafer: {
      spreadsheetId: '1KLxctUK2ZGaM7jm1y2zj-StwLTgV6qP0PL1a-ZEnMmo',
      title: 'YouSafer | GrowthPack V26 (Inside Sales)',
      crmGid: '',
      crmSheetName: 'BASE_CRM',
      monthlySheetName: '1.0 Mensal',
      weeklySheetName: '2.0 Semanal',
      metaRawSheetName: 'bd Meta Ads',
      googleRawSheetName: 'bd Google Ads '
    },
    prime: {
      spreadsheetId: '1h6-xdgyekZrNLZ4luZU61S0hzh0Z-HLAZR7qCm8NQG8',
      title: 'Nova Atualizado Growth Pack 3.1 [Prime]',
      crmGid: '1986904416',
      crmSheetName: 'BASE_CRM',
      monthlySheetName: '5.0 Acompanhamento Mensal',
      weeklySheetName: '5.1 Acompanhamento Semanal',
      metaRawSheetName: 'bd Meta Ads',
      googleRawSheetName: 'bd Google Ads '
    },
    multimed: {
      spreadsheetId: '1h4obelICw7z1rbYNaEdkbrCH-qYUhFttzW3SopNxodg',
      title: 'MultiMed | GrowthPack V26 (Inside Sales)',
      crmGid: '',
      crmSheetName: 'BASE DO CRM',
      monthlySheetName: '1.0 Mensal',
      weeklySheetName: '2.0 Semanal',
      metaRawSheetName: 'bd Meta Ads',
      googleRawSheetName: 'bd Google Ads '
    },
    'treinando-online': {
      spreadsheetId: '1rnD4jIpKfX5DAQMETQhOG-ULg81iAglJoej_AY8ArvA',
      title: 'Treinando Onlinne | GrowthPack V26 (Inside Sales)',
      crmGid: '',
      crmSheetName: 'BASE_CRM',
      monthlySheetName: '1.0 Mensal',
      weeklySheetName: '2.0 Semanal',
      metaRawSheetName: 'bd Meta Ads',
      googleRawSheetName: 'bd Google Ads '
    },
    'seg-eletronic': {
      spreadsheetId: '1-CSmqLVLbfwVuVxkez4Q38fSTkVzyGOudUmj_GIxHAc',
      title: 'Seg Eletronic | GrowthPack V26 (Inside Sales)',
      crmGid: '1929982003',
      crmSheetName: 'BASE_CRM',
      monthlySheetName: '1.0 Mensal',
      weeklySheetName: '2.0 Semanal',
      metaRawSheetName: 'bd Meta Ads',
      googleRawSheetName: 'bd Google Ads '
    },
    'st1-internet': {
      spreadsheetId: '1BurqRDqYbWq8dPVxXiKjWH6WmfBNoe39AymwJM8LpFA',
      title: 'ST1 Internet | GrowthPack V26 (Inside Sales)',
      crmGid: '1699545222',
      crmSheetName: 'BASE_CRM',
      monthlySheetName: '1.0 Mensal',
      weeklySheetName: '2.0 Semanal',
      metaRawSheetName: 'bd Meta Ads',
      googleRawSheetName: 'bd Google Ads '
    }
  };

  function urlFor(id) {
    return id ? `https://docs.google.com/spreadsheets/d/${id}` : '';
  }

  function hydrateClient(client) {
    if (!client) return client;

    const source = CLIENT_SOURCES[client.id];

    if (!source) {
      client.growthPack = {
        ...(client.growthPack || {}),
        status: 'not_located',
        resultSource: false,
        sourceEvidenceRequired: true
      };

      client.crmSheet = {
        ...(client.crmSheet || {}),
        type: 'growthPackSpreadsheet',
        spreadsheetId: '',
        url: '',
        sheetName: '',
        gid: '',
        proxyUrl: '',
        status: 'GrowthPack nao localizado para este cliente'
      };

      client.performanceSheets = {
        ...(client.performanceSheets || {}),
        type: 'growthPackSpreadsheet',
        spreadsheetId: '',
        url: '',
        monthlySheetName: '',
        weeklySheetName: '',
        metaRawSheetName: '',
        googleRawSheetName: '',
        proxyUrl: '',
        status: 'GrowthPack nao localizado para este cliente'
      };

      return client;
    }

    client.growthPack = {
      status: 'located',
      type: 'google_spreadsheet',
      spreadsheetId: source.spreadsheetId,
      url: urlFor(source.spreadsheetId),
      title: source.title,
      crmSheetName: source.crmSheetName,
      crmGid: source.crmGid,
      resultSource: true,
      sourceEvidenceRequired: true
    };

    client.crmSheet = {
      ...(client.crmSheet || {}),
      type: 'growthPackSpreadsheet',
      spreadsheetId: source.spreadsheetId,
      url: urlFor(source.spreadsheetId),
      title: source.title,
      sheetName: source.crmSheetName,
      dashboardSheetName: 'DASH_CRM',
      gid: source.crmGid || '',
      proxyUrl: client.crmSheet?.proxyUrl || '',
      status: 'GrowthPack CRM oficial configurado',
      lastSync: client.crmSheet?.lastSync || ''
    };

    client.performanceSheets = {
      ...(client.performanceSheets || {}),
      type: 'growthPackSpreadsheet',
      spreadsheetId: source.spreadsheetId,
      url: urlFor(source.spreadsheetId),
      title: source.title,
      monthlySheetName: source.monthlySheetName,
      weeklySheetName: source.weeklySheetName,
      monthlyGid: '',
      weeklyGid: '',
      metaRawSheetName: source.metaRawSheetName,
      googleRawSheetName: source.googleRawSheetName,
      proxyUrl: client.performanceSheets?.proxyUrl || '',
      status: 'GrowthPack mídia oficial configurado',
      lastSync: client.performanceSheets?.lastSync || ''
    };

    return client;
  }

  function hydrateState(data) {
    if (!data || !Array.isArray(data.clients)) return data;

    data.clients.forEach(hydrateClient);

    data.settings = {
      ...(data.settings || {}),
      dataMode: 'official_drive_database',
      officialDataVersion: 8,
      runtimeFixVersion: VERSION,
      allowDemoData: false,
      refreshMode: 'Drive/API',
      requireClientScopedEvidence: true
    };

    return data;
  }

  try {
    hydrateState(window.V4_SEED);

    const raw = window.localStorage?.getItem(STORAGE_KEY);
    if (raw) {
      const stored = hydrateState(JSON.parse(raw));
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    }
  } catch (error) {
    window.localStorage?.removeItem(STORAGE_KEY);
    hydrateState(window.V4_SEED);
  }
})();
