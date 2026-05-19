(function () {
  const STORAGE_KEY = 'v4-command-center-state-v6-crm-performance-losses';
  const VERSION = 'official-growthpack-crm-runtime-20260518-01';

  const GROWTHPACK_BY_CLIENT_ID = {
    'alphaville': {
      spreadsheetId: '1CtfFiB0q2B72Cwb9VjTkv8gZHYtBv2keICwBNj7Z0ws',
      title: 'Alphaville Sacadas | GrowthPack V26 (Inside Sales)'
    },
    'yousafer': {
      spreadsheetId: '1KLxctUK2ZGaM7jm1y2zj-StwLTgV6qP0PL1a-ZEnMmo',
      title: 'YouSafer | GrowthPack V26 (Inside Sales)'
    },
    'prime': {
      spreadsheetId: '1BOTJF5ymnYHZ69mhyvCUZZWqyGOEf2boeRFza3L5awI',
      title: 'Prime | GrowthPack V26 (Inside Sales)'
    },
    'multimed': {
      spreadsheetId: '1h4obelICw7z1rbYNaEdkbrCH-qYUhFttzW3SopNxodg',
      title: 'MultiMed | GrowthPack V26 (Inside Sales)'
    },
    'treinando-online': {
      spreadsheetId: '1rnD4jIpKfX5DAQMETQhOG-ULg81iAglJoej_AY8ArvA',
      title: 'Treinando Onlinne  | GrowthPack V26 (Inside Sales)'
    },
    'seg-eletronic': {
      spreadsheetId: '1-CSmqLVLbfwVuVxkez4Q38fSTkVzyGOudUmj_GIxHAc',
      title: 'Seg Eletronic| GrowthPack V26 (Inside Sales)'
    },
    'st1-internet': {
      spreadsheetId: '1BurqRDqYbWq8dPVxXiKjWH6WmfBNoe39AymwJM8LpFA',
      title: 'ST1 Internet  | GrowthPack V26 (Inside Sales)'
    }
  };

  function urlFor(spreadsheetId) {
    return spreadsheetId ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}` : '';
  }

  function hydrateClient(client) {
    if (!client) return client;
    const growth = client.growthPack?.spreadsheetId ? client.growthPack : GROWTHPACK_BY_CLIENT_ID[client.id];
    if (!growth?.spreadsheetId) return client;

    client.growthPack = {
      status: 'located',
      type: 'google_spreadsheet',
      spreadsheetId: growth.spreadsheetId,
      url: urlFor(growth.spreadsheetId),
      title: growth.title || client.growthPack?.title || '',
      resultSource: true,
      sourceEvidenceRequired: true
    };

    client.crmSheet = {
      ...(client.crmSheet || {}),
      type: 'growthPackSpreadsheet',
      spreadsheetId: growth.spreadsheetId,
      url: urlFor(growth.spreadsheetId),
      title: growth.title || client.growthPack.title || '',
      sheetName: 'BASE_CRM',
      dashboardSheetName: 'DASH_CRM',
      gid: '',
      proxyUrl: client.crmSheet?.proxyUrl || '',
      status: 'Configurado automaticamente via GrowthPack',
      lastSync: client.crmSheet?.lastSync || ''
    };

    client.performanceSheets = {
      ...(client.performanceSheets || {}),
      type: 'growthPackSpreadsheet',
      spreadsheetId: growth.spreadsheetId,
      url: urlFor(growth.spreadsheetId),
      title: growth.title || client.growthPack.title || '',
      monthlySheetName: '1.0 Mensal',
      weeklySheetName: '2.0 Semanal',
      monthlyGid: '',
      weeklyGid: '',
      metaRawSheetName: 'bd Meta Ads',
      googleRawSheetName: 'bd Google Ads ',
      proxyUrl: client.performanceSheets?.proxyUrl || '',
      status: 'Configurado automaticamente via GrowthPack',
      lastSync: client.performanceSheets?.lastSync || ''
    };

    client.metrics = {
      ...(client.metrics || {}),
      revenue: 0,
      revenueTarget: client.metrics?.revenueTarget || 0,
      leads: 0,
      cpl: 0,
      roas: 0,
      investment: 0,
      mql: 0,
      sql: 0,
      opportunities: 0,
      sales: 0,
      ticket: 0,
      dataSource: 'growthpack-ready'
    };

    return client;
  }

  function hydrateStateLikeObject(data) {
    if (!data || !Array.isArray(data.clients)) return data;
    data.clients.forEach(hydrateClient);
    data.settings = {
      ...(data.settings || {}),
      dataMode: 'official_drive_database',
      runtimeFixVersion: VERSION,
      allowDemoData: false,
      refreshMode: 'Drive/API'
    };
    return data;
  }

  try {
    hydrateStateLikeObject(window.V4_SEED);

    const raw = window.localStorage?.getItem(STORAGE_KEY);
    if (raw) {
      const stored = hydrateStateLikeObject(JSON.parse(raw));
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    }
  } catch (error) {
    window.localStorage?.removeItem(STORAGE_KEY);
    hydrateStateLikeObject(window.V4_SEED);
  }
})();
