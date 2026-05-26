(function () {
  const STORAGE_KEY = 'v4-command-center-state-v6-crm-performance-losses';
  const ST1_ID = 'st1-internet';
  const ST1_SHEET_ID = '1BurqRDqYbWq8dPVxXiKjWH6WmfBNoe39AymwJM8LpFA';

  const ST1_MEDIA_SOURCE = {
    type: 'googleSheetsCsv',
    spreadsheetId: ST1_SHEET_ID,
    url: `https://docs.google.com/spreadsheets/d/${ST1_SHEET_ID}/edit`,
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
    proxyUrl: '',
    monthlyProxyUrl: '',
    weeklyProxyUrl: '',
    fallbackSnapshot: null,
    syncBlocked: false,
    syncBlockedReason: '',
    status: 'Mídia oficial: 1,0 Mensal + 2.0 Semanal + bd Meta/Google Ads',
    lastSync: ''
  };

  function isDashCrmValue(value) {
    return String(value || '').trim().toUpperCase() === 'DASH_CRM';
  }

  function cleanObject(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    Object.keys(obj).forEach((key) => {
      const value = obj[key];
      if (isDashCrmValue(value)) {
        delete obj[key];
      } else if (value && typeof value === 'object') {
        cleanObject(value);
      }
    });
    return obj;
  }

  function periodHasMedia(period) {
    const m = period?.metrics || {};
    return Number(m.investment || 0) > 0 || Number(m.impressions || 0) > 0 || Number(m.clicks || 0) > 0 || Number(m.leads || 0) > 0;
  }

  function sanitizeMediaSnapshot(snapshot) {
    if (!snapshot) return null;
    const monthlyPeriods = (snapshot.monthly?.periods || []).filter(periodHasMedia);
    const weeklyPeriods = (snapshot.weekly?.periods || []).filter(periodHasMedia);
    return {
      ...snapshot,
      source: 'media_only_growthpack_sheets',
      monthly: {
        ...(snapshot.monthly || {}),
        periods: monthlyPeriods,
        current: monthlyPeriods[monthlyPeriods.length - 1] || null
      },
      weekly: {
        ...(snapshot.weekly || {}),
        periods: weeklyPeriods,
        current: weeklyPeriods[weeklyPeriods.length - 1] || null
      }
    };
  }

  function apply(state) {
    if (!state || typeof state !== 'object') return state;
    cleanObject(state);
    state.clients = Array.isArray(state.clients) ? state.clients : [];
    state.clients.forEach((client) => {
      if (client.crmSheet) {
        delete client.crmSheet.dashboardSheetName;
        delete client.crmSheet.dashboardGid;
        delete client.crmSheet.dashCrm;
      }
      if (client.id === ST1_ID) {
        client.performanceSheets = { ...(client.performanceSheets || {}), ...ST1_MEDIA_SOURCE };
        client.growthPack = {
          ...(client.growthPack || {}),
          spreadsheetId: ST1_SHEET_ID,
          spreadsheetUrl: ST1_MEDIA_SOURCE.url,
          monthlySheetName: '1,0 Mensal',
          monthlyGid: '1253486000',
          weeklySheetName: '2.0 Semanal',
          weeklyGid: '85034568',
          metaRawSheetName: 'bd Meta Ads',
          googleRawSheetName: 'bd Google Ads '
        };
      }
    });
    if (state.performanceSnapshots?.[ST1_ID]) {
      state.performanceSnapshots[ST1_ID] = sanitizeMediaSnapshot(state.performanceSnapshots[ST1_ID]);
    }
    return state;
  }

  try {
    apply(window.V4_SEED);
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) localStorage.setItem(STORAGE_KEY, JSON.stringify(apply(JSON.parse(raw))));
  } catch (error) {
    console.warn('[V4] Falha ao remover DASH_CRM/fixar mídia.', error);
  }

  window.V4_REMOVE_DASH_CRM_AND_FIX_MEDIA = { apply, ST1_MEDIA_SOURCE };
})();
