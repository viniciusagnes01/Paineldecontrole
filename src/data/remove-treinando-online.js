(function () {
  const REMOVED_CLIENT_ID = 'treinando-online';
  const STORAGE_KEY = 'v4-command-center-state-v6-crm-performance-losses';

  function filterClients(list) {
    return Array.isArray(list) ? list.filter((client) => client && client.id !== REMOVED_CLIENT_ID) : list;
  }

  function filterObjectByClientId(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    const copy = { ...obj };
    delete copy[REMOVED_CLIENT_ID];
    return copy;
  }

  function cleanState(state) {
    if (!state || typeof state !== 'object') return state;
    state.clients = filterClients(state.clients);
    state.crmSnapshots = filterObjectByClientId(state.crmSnapshots);
    state.performanceSnapshots = filterObjectByClientId(state.performanceSnapshots);
    state.mediaSnapshots = filterObjectByClientId(state.mediaSnapshots);
    if (state.settings) {
      state.settings = {
        ...state.settings,
        activeClientCount: Array.isArray(state.clients) ? state.clients.length : state.settings.activeClientCount
      };
    }
    return state;
  }

  try {
    window.V4_SEED = cleanState(window.V4_SEED || {});

    if (Array.isArray(window.V4_OFFICIAL_ACTIVE_CLIENTS)) {
      const officialClients = filterClients(window.V4_OFFICIAL_ACTIVE_CLIENTS);
      window.V4_OFFICIAL_ACTIVE_CLIENTS = officialClients;
      window.V4_FIND_CLIENT_BY_GROUP_ID = function (groupId) {
        return officialClients.find((client) => client.groupId === String(groupId || '').trim()) || null;
      };
      window.V4_RESOLVE_CLIENT_CONTEXT = function (input) {
        const groupId = typeof input === 'string' ? input : input?.groupId;
        const clientId = typeof input === 'string' ? '' : input?.clientId;
        const client = groupId
          ? officialClients.find((item) => item.groupId === String(groupId || '').trim())
          : officialClients.find((item) => item.id === String(clientId || '').trim());
        if (!client) {
          return {
            ok: false,
            error: 'CLIENT_NOT_FOUND_IN_OFFICIAL_DATABASE',
            message: 'Cliente não encontrado na base oficial de clientes ativos.',
            guardrails: window.V4_DATA_GUARDRAILS || {}
          };
        }
        return {
          ok: true,
          client,
          groupId: client.groupId,
          driveFolderId: client.driveFolderId,
          driveUrl: client.driveUrl,
          growthPack: client.growthPack,
          growthPackSpreadsheetId: client.growthPack?.spreadsheetId || '',
          growthPackCrmGid: client.growthPack?.crmGid || '',
          scopeStatus: 'locked',
          guardrails: window.V4_DATA_GUARDRAILS || {}
        };
      };
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanState(JSON.parse(raw))));
    }
  } catch (error) {
    console.warn('[V4] Falha ao remover Treinando Online da base ativa.', error);
  }
})();
