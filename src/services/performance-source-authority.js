(function () {
  const STORAGE_KEY = 'v4-command-center-state-v6-crm-performance-losses';

  const AUTHORITATIVE_SOURCES = {
    'st1-internet': {
      growthPack: {
        spreadsheetId: '1BurqRDqYbWq8dPVxXiKjWH6WmfBNoe39AymwJM8LpFA',
        spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/1BurqRDqYbWq8dPVxXiKjWH6WmfBNoe39AymwJM8LpFA/edit',
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
        analyticsGid: '1624663946'
      },
      performanceSheets: {
        type: 'growthPackSpreadsheet',
        spreadsheetId: '1BurqRDqYbWq8dPVxXiKjWH6WmfBNoe39AymwJM8LpFA',
        url: 'https://docs.google.com/spreadsheets/d/1BurqRDqYbWq8dPVxXiKjWH6WmfBNoe39AymwJM8LpFA/edit',
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
        status: 'Fonte oficial ST1 configurada por GID - mensal/semanal/diario',
        lastSync: ''
      }
    }
  };

  function has2030(snapshot) {
    const periods = [
      ...(snapshot?.monthly?.periods || []),
      ...(snapshot?.weekly?.periods || [])
    ];
    return periods.some((period) => /2030/.test(String(period?.label || '') + String(period?.start || '') + String(period?.end || '') + String(period?.year || '')));
  }

  function isBadSnapshot(snapshot) {
    if (!snapshot) return false;
    const source = String(snapshot.source || '').toLowerCase();
    const urls = [snapshot?.monthly?.sourceUrl, snapshot?.weekly?.sourceUrl].filter(Boolean).join(' ');
    return source.includes('fallback') || urls.includes('/api/growthpack/') || has2030(snapshot);
  }

  function applyToState(state) {
    if (!state || !Array.isArray(state.clients)) return state;

    Object.entries(AUTHORITATIVE_SOURCES).forEach(([clientId, config]) => {
      const client = state.clients.find((item) => item && item.id === clientId);
      if (!client) return;

      client.growthPack = {
        ...(client.growthPack || {}),
        ...config.growthPack,
        status: client.growthPack?.status || 'located',
        sourceKind: 'authoritative_growthpack_sheet'
      };

      client.performanceSheets = {
        ...(client.performanceSheets || {}),
        ...config.performanceSheets
      };

      if (state.performanceSnapshots && isBadSnapshot(state.performanceSnapshots[clientId])) {
        delete state.performanceSnapshots[clientId];
      }
    });

    return state;
  }

  function applyToLocalStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const state = applyToState(JSON.parse(raw));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn('[V4] Falha ao aplicar autoridade de fonte no localStorage.', error);
    }
  }

  try {
    applyToState(window.V4_SEED);
    applyToLocalStorage();

    if (typeof window.V4_APPLY_GROWTHPACK_DATA === 'function') {
      const originalApplyGrowthPackData = window.V4_APPLY_GROWTHPACK_DATA;
      window.V4_APPLY_GROWTHPACK_DATA = function patchedApplyGrowthPackData(target) {
        const state = originalApplyGrowthPackData(target);
        return applyToState(state);
      };
    }
  } catch (error) {
    console.warn('[V4] Falha ao aplicar autoridade de fonte de performance.', error);
  }

  window.V4_PERFORMANCE_SOURCE_AUTHORITY = { applyToState, sources: AUTHORITATIVE_SOURCES };
})();
