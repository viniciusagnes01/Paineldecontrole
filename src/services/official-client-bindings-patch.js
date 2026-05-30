(function () {
  const STORE = 'v4-command-center-state-v6-crm-performance-losses';
  const EKYTE = {
    alphaville: [126365, 291862],
    yousafer: [72535, 291857],
    prime: [106839, 291839],
    multimed: [124293, 287299],
    'seg-eletronic': [125773, 273483],
    'espaco-master': [131114, 276870],
    'st1-internet': [127063, 273637],
    'sindihoteleiros-cuidar-on': [87694, 165830]
  };
  const YS_ID = '1KLxctUK2ZGaM7jm1y2zj-StwLTgV6qP0PL1a-ZEnMmo';
  const YS_URL = `https://docs.google.com/spreadsheets/d/${YS_ID}`;

  function patchClient(client) {
    if (!client || !client.id) return;
    const ids = EKYTE[client.id];
    if (ids) {
      client.idWorkspaceEkyte = ids[0];
      client.idProjetoEkyte = ids[1];
      client.ekyte = { ...(client.ekyte || {}), companyId: '7773', workspaceId: ids[0], projectId: ids[1], taskScope: 'project', status: 'Projeto eKyte vinculado' };
      client.integrations = { ...(client.integrations || {}), ekyte: { companyId: '7773', workspaceId: ids[0], projectId: ids[1], status: 'Vinculado por cliente/projeto' } };
    }
    if (client.id !== 'yousafer') return;
    client.growthPack = { ...(client.growthPack || {}), status: 'located', type: 'google_spreadsheet', spreadsheetId: YS_ID, url: YS_URL, title: 'YouSafer | GrowthPack V26 (Inside Sales)', crmSheetName: 'BASE_CRM', crmGid: '316084875', resultSource: true, sourceEvidenceRequired: true };
    client.crmSheet = { ...(client.crmSheet || {}), type: 'growthPackSpreadsheet', spreadsheetId: YS_ID, url: YS_URL, title: 'YouSafer | GrowthPack V26 (Inside Sales)', sheetName: 'BASE_CRM', dashboardSheetName: '', gid: '316084875', proxyUrl: '', status: 'GrowthPack CRM YouSafer vinculado - BASE_CRM', lastSync: '' };
    client.performanceSheets = { ...(client.performanceSheets || {}), type: 'growthPackSpreadsheet', spreadsheetId: YS_ID, url: YS_URL, title: 'YouSafer | GrowthPack V26 (Inside Sales)', monthlySheetName: '1.0 Mensal', monthlyGid: '1980055319', weeklySheetName: '2.0 Semanal', weeklyGid: '85034568', metaRawSheetName: 'bd Meta Ads', metaRawGid: '662103333', googleRawSheetName: 'bd Google Ads ', googleRawGid: '2106399394', analyticsSheetName: 'bd Analytics', analyticsGid: '1624663946', proxyUrl: '', status: 'GrowthPack YouSafer vinculado - mensal/semanal/midia', lastSync: '' };
    client.integrations = { ...(client.integrations || {}), media: { meta: `${YS_URL}/edit#gid=662103333`, google: `${YS_URL}/edit#gid=2106399394` }, crm: `${YS_URL}/edit#gid=316084875`, ekyte: client.integrations?.ekyte };
  }

  function patchState(state) {
    if (Array.isArray(state?.clients)) state.clients.forEach(patchClient);
    state.settings = { ...(state.settings || {}), officialDataVersion: 10, yousaferGrowthPackVersion: '20260530-02', ekyteBindingsVersion: '20260530-02' };
    return state;
  }

  function run() {
    try {
      if (Array.isArray(window.V4_OFFICIAL_ACTIVE_CLIENTS)) window.V4_OFFICIAL_ACTIVE_CLIENTS.forEach(patchClient);
      if (window.V4_SEED) patchState(window.V4_SEED);
      const raw = localStorage.getItem(STORE);
      if (raw) localStorage.setItem(STORE, JSON.stringify(patchState(JSON.parse(raw))));
      window.V4_YOUSAFER_GROWTHPACK = { spreadsheetId: YS_ID, crmGid: '316084875', monthlyGid: '1980055319', weeklyGid: '85034568' };
    } catch (error) { console.warn('[OfficialClientBindingsPatch]', error); }
  }

  run();
  document.addEventListener('DOMContentLoaded', run);
  setTimeout(run, 300);
})();
