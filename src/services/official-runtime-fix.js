(function () {
  const STORAGE_KEY = 'v4-command-center-state-v6-crm-performance-losses';
  const VERSION = 'crm-sheets-map-20260519-01';

  const SHEETS = {
    alphaville: ['1CtfFiB0q2B72Cwb9VjTkv8gZHYtBv2keICwBNj7Z0ws', 'Alphaville Sacadas | GrowthPack V26 (Inside Sales)', '833926654'],
    yousafer: ['1KLxctUK2ZGaM7jm1y2zj-StwLTgV6qP0PL1a-ZEnMmo', 'YouSafer | GrowthPack V26 (Inside Sales)', ''],
    prime: ['1h6-xdgyekZrNLZ4luZU61S0hzh0Z-HLAZR7qCm8NQG8', 'Nova Atualizado Growth Pack 3.1 [Prime]', '1986904416'],
    multimed: ['1h4obelICw7z1rbYNaEdkbrCH-qYUhFttzW3SopNxodg', 'MultiMed | GrowthPack V26 (Inside Sales)', ''],
    'treinando-online': ['1rnD4jIpKfX5DAQMETQhOG-ULg81iAglJoej_AY8ArvA', 'Treinando Onlinne | GrowthPack V26 (Inside Sales)', ''],
    'seg-eletronic': ['1-CSmqLVLbfwVuVxkez4Q38fSTkVzyGOudUmj_GIxHAc', 'Seg Eletronic | GrowthPack V26 (Inside Sales)', '1929982003'],
    'st1-internet': ['1BurqRDqYbWq8dPVxXiKjWH6WmfBNoe39AymwJM8LpFA', 'ST1 Internet | GrowthPack V26 (Inside Sales)', '1699545222']
  };

  function url(id) {
    return id ? `https://docs.google.com/spreadsheets/d/${id}` : '';
  }

  function hydrateClient(client) {
    if (!client || !SHEETS[client.id]) return client;
    const [spreadsheetId, title, gid] = SHEETS[client.id];
    client.growthPack = {
      status: 'located',
      type: 'google_spreadsheet',
      spreadsheetId,
      url: url(spreadsheetId),
      title,
      crmSheetName: 'BASE_CRM',
      crmGid: gid,
      resultSource: true,
      sourceEvidenceRequired: true
    };
    client.crmSheet = {
      ...(client.crmSheet || {}),
      type: 'growthPackSpreadsheet',
      spreadsheetId,
      url: url(spreadsheetId),
      title,
      sheetName: 'BASE_CRM',
      dashboardSheetName: 'DASH_CRM',
      gid,
      proxyUrl: client.crmSheet?.proxyUrl || '',
      status: 'GrowthPack CRM oficial configurado',
      lastSync: client.crmSheet?.lastSync || ''
    };
    client.performanceSheets = {
      ...(client.performanceSheets || {}),
      type: 'growthPackSpreadsheet',
      spreadsheetId,
      url: url(spreadsheetId),
      title,
      monthlySheetName: '1.0 Mensal',
      weeklySheetName: '2.0 Semanal',
      monthlyGid: client.performanceSheets?.monthlyGid || '',
      weeklyGid: client.performanceSheets?.weeklyGid || '',
      metaRawSheetName: 'bd Meta Ads',
      googleRawSheetName: 'bd Google Ads ',
      proxyUrl: client.performanceSheets?.proxyUrl || '',
      status: 'GrowthPack oficial configurado',
      lastSync: client.performanceSheets?.lastSync || ''
    };
    return client;
  }

  function hydrateState(data) {
    if (!data || !Array.isArray(data.clients)) return data;
    data.clients.forEach(hydrateClient);
    data.settings = { ...(data.settings || {}), dataMode: 'official_drive_database', officialDataVersion: 7, runtimeFixVersion: VERSION, allowDemoData: false, refreshMode: 'Drive/API' };
    return data;
  }

  try {
    hydrateState(window.V4_SEED);
    const raw = window.localStorage?.getItem(STORAGE_KEY);
    if (raw) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(hydrateState(JSON.parse(raw))));
  } catch (error) {
    window.localStorage?.removeItem(STORAGE_KEY);
    hydrateState(window.V4_SEED);
  }
})();
