(function () {
  const CLIENT_ID = 'st1-internet';
  const SPREADSHEET_ID = '1BurqRDqYbWq8dPVxXiKjWH6WmfBNoe39AymwJM8LpFA';
  const SPREADSHEET_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}`;

  const ST1_PERFORMANCE_SHEETS = Object.freeze({
    type: 'growthPackSpreadsheet',
    spreadsheetId: SPREADSHEET_ID,
    url: SPREADSHEET_URL,
    title: 'ST1 Internet | GrowthPack V26 (Inside Sales)',
    monthlySheetName: '1,0 Mensal',
    monthlyGid: '1253486000',
    weeklySheetName: '2.0 Semanal',
    weeklyGid: '85034568',
    dailySheetName: '3.0 Diario',
    dailyGid: '2073034759',
    metaRawSheetName: 'bd Meta Ads',
    metaRawGid: '662103333',
    googleRawSheetName: 'bd Google Ads ',
    googleRawGid: '2106399394',
    analyticsSheetName: 'bd Analytics',
    analyticsGid: '1624663946',
    status: 'GrowthPack midia configurado - mensal, semanal, diario Meta e diario Google',
    lastSync: ''
  });

  function applyToState(state) {
    if (!state || !Array.isArray(state.clients)) return state;
    const client = state.clients.find((item) => item.id === CLIENT_ID);
    if (!client) return state;
    client.performanceSheets = { ...(client.performanceSheets || {}), ...ST1_PERFORMANCE_SHEETS };
    client.integrations = client.integrations || {};
    client.integrations.media = {
      ...(client.integrations.media || {}),
      monthly: `${SPREADSHEET_URL}/edit#gid=1253486000`,
      weekly: `${SPREADSHEET_URL}/edit#gid=85034568`,
      metaDaily: `${SPREADSHEET_URL}/edit#gid=662103333`,
      googleDaily: `${SPREADSHEET_URL}/edit#gid=2106399394`,
      analytics: `${SPREADSHEET_URL}/edit#gid=1624663946`
    };
    return state;
  }

  try {
    window.V4_ST1_PERFORMANCE_SHEETS = ST1_PERFORMANCE_SHEETS;
    applyToState(window.V4_SEED);

    const storageKey = 'v4-command-center-state-v6-crm-performance-losses';
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const state = applyToState(JSON.parse(raw));
      localStorage.setItem(storageKey, JSON.stringify(state));
    }
  } catch (error) {
    console.warn('[V4] Falha ao aplicar configuração de mídia da ST1 Internet.', error);
  }
})();
