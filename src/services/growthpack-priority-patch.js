(function () {
  const STORAGE_KEY = 'v4-command-center-state-v6-crm-performance-losses';
  const GP = {
    alphaville: ['1CtfFiB0q2B72Cwb9VjTkv8gZHYtBv2keICwBNj7Z0ws', 'Alphaville Sacadas | GrowthPack V26 (Inside Sales)', 'BASE_CRM', '833926654'],
    yousafer: ['1KLxctUK2ZGaM7jm1y2zj-StwLTgV6qP0PL1a-ZEnMmo', 'YouSafer | GrowthPack V26 (Inside Sales)', '', '', '662103333', '2106399394', 'BASE_CRM nao localizada'],
    prime: ['1h6-xdgyekZrNLZ4luZU61S0hzh0Z-HLAZR7qCm8NQG8', 'Nova Atualizado Growth Pack 3.1 [Prime]', 'BASE_CRM', '1986904416', '501111945', '867200802'],
    multimed: ['1h4obelICw7z1rbYNaEdkbrCH-qYUhFttzW3SopNxodg', 'MultiMed | GrowthPack V26 (Inside Sales)', 'BASE DO CRM', ''],
    'treinando-online': ['1rnD4jIpKfX5DAQMETQhOG-ULg81iAglJoej_AY8ArvA', 'Treinando Onlinne | GrowthPack V26 (Inside Sales)', 'BASE_CRM', ''],
    'seg-eletronic': ['1-CSmqLVLbfwVuVxkez4Q38fSTkVzyGOudUmj_GIxHAc', 'Seg Eletronic | GrowthPack V26 (Inside Sales)', 'BASE_CRM', '1929982003'],
    'espaco-master': ['19-VWUfoJD27KxlFEn8uvoDVTKkahT7CSLlVoZD5-VUQ', 'ESPAÇO MASTER _ GrowthPack V26 (Inside Sales) - Google Sheets', 'BASE_CRM', '1733941213', '1736919533', '234259698', 'Google Sheets nativo validado; API_CONFIG e API_STATUS criadas'],
    'st1-internet': ['1BurqRDqYbWq8dPVxXiKjWH6WmfBNoe39AymwJM8LpFA', 'ST1 Internet | GrowthPack V26 (Inside Sales)', 'BASE_CRM', '1699545222'],
    'sindihoteleiros-cuidar-on': ['', 'GrowthPack nao localizada', '', '', '', '', 'GrowthPack especifica nao localizada', 'not_located']
  };

  const BRAND = {
    alphaville: ['#c91524', '#ff3045'],
    yousafer: ['#0f898b', '#21d2cc'],
    prime: ['#b70d1c', '#ff4354'],
    multimed: ['#136cd8', '#5ea2ff'],
    'treinando-online': ['#f05a28', '#ffad42'],
    'seg-eletronic': ['#d21620', '#ff5360'],
    'espaco-master': ['#8f2bd6', '#c47cff'],
    'st1-internet': ['#1b78ff', '#70c0ff'],
    'sindihoteleiros-cuidar-on': ['#607d8b', '#a1bbc6']
  };

  function sheetUrl(id, gid) {
    if (!id) return '';
    const base = `https://docs.google.com/spreadsheets/d/${id}`;
    return gid ? `${base}/edit#gid=${gid}` : base;
  }

  function driveUrl(id) {
    return id ? `https://drive.google.com/file/d/${id}` : '';
  }

  function applyBrand(client) {
    const brand = BRAND[client.id];
    if (!brand) return client;
    client.color = brand[0];
    client.accent = brand[1];
    client.identity = {
      ...(client.identity || {}),
      color: brand[0],
      accent: brand[1],
      source: 'client_identity_base'
    };
    return client;
  }

  function applyClient(client) {
    const gp = GP[client.id];
    applyBrand(client);
    if (!gp) return client;
    const [id, title, crmSheetName, crmGid, metaGid, googleGid, note, type = 'google_spreadsheet'] = gp;
    const isMissing = type === 'not_located' || !id;
    const isXlsx = type === 'drive_xlsx';
    const baseUrl = isXlsx ? driveUrl(id) : sheetUrl(id);
    const crmUrl = isMissing ? '' : isXlsx ? baseUrl : sheetUrl(id, crmGid);
    const metaUrl = isMissing ? '' : isXlsx ? baseUrl : sheetUrl(id, metaGid);
    const googleUrl = isMissing ? '' : isXlsx ? baseUrl : sheetUrl(id, googleGid);

    client.growthPack = {
      status: isMissing ? 'not_located' : 'located',
      type,
      spreadsheetId: id,
      url: baseUrl,
      title,
      crmSheetName: crmSheetName || '',
      crmGid: crmGid || '',
      resultSource: !isMissing,
      sourceEvidenceRequired: true,
      sourcePriority: 'growthpack_first',
      note: note || ''
    };

    client.integrations = {
      ...(client.integrations || {}),
      media: { meta: metaUrl, google: googleUrl },
      crm: crmUrl,
      sourcePriority: 'growthpack_first'
    };

    client.crmSheet = {
      ...(client.crmSheet || {}),
      type: isXlsx ? 'driveXlsxGrowthPack' : 'growthPackSpreadsheet',
      spreadsheetId: id,
      url: crmUrl,
      title,
      sheetName: crmSheetName || '',
      dashboardSheetName: 'DASH_CRM',
      gid: crmGid || '',
      proxyUrl: client.crmSheet?.proxyUrl || '',
      status: isMissing ? 'GrowthPack nao localizada' : !crmSheetName ? 'BASE_CRM nao localizada na GrowthPack' : isXlsx ? 'GrowthPack XLSX vinculada - requer API/Apps Script' : 'GrowthPack CRM vinculada',
      lastSync: client.crmSheet?.lastSync || '',
      note: note || ''
    };

    client.performanceSheets = {
      ...(client.performanceSheets || {}),
      type: isXlsx ? 'driveXlsxGrowthPack' : 'growthPackSpreadsheet',
      spreadsheetId: id,
      url: baseUrl,
      title,
      monthlySheetName: client.performanceSheets?.monthlySheetName || '1.0 Mensal',
      weeklySheetName: client.performanceSheets?.weeklySheetName || '2.0 Semanal',
      metaRawSheetName: 'bd Meta Ads',
      googleRawSheetName: 'bd Google Ads',
      metaRawUrl: metaUrl,
      googleRawUrl: googleUrl,
      proxyUrl: client.performanceSheets?.proxyUrl || '',
      status: isMissing ? 'GrowthPack midia nao localizada' : 'GrowthPack midia vinculada',
      lastSync: client.performanceSheets?.lastSync || ''
    };

    client.status = isMissing ? 'GrowthPack nao localizada' : isXlsx ? 'GrowthPack XLSX vinculada - requer API/Apps Script' : 'GrowthPack vinculada como fonte primaria';
    client.sourcePriority = {
      primary: 'growthpack',
      secondary: 'communication_base_evolution',
      media: isMissing ? [] : ['bd Meta Ads', 'bd Google Ads'],
      crm: crmSheetName ? [crmSheetName] : [],
      communication: ['BASE_COMUNICACAO', 'Evolution', 'WhatsApp']
    };
    client.dataPolicy = {
      ...(client.dataPolicy || {}),
      primarySource: 'growthpack',
      secondarySource: 'communication_base_evolution',
      resultSource: isMissing ? 'growthpack_not_found' : 'growthpack',
      allowDemoData: false,
      requireEvidence: true
    };
    return client;
  }

  function applyState(state) {
    if (!state || !Array.isArray(state.clients)) return state;
    state.clients.forEach(applyClient);
    state.settings = {
      ...(state.settings || {}),
      dataSourcePolicy: 'growthpack_first',
      primaryDataSource: 'Growth Pack',
      secondaryDataSource: 'Base de Comunicacao / Evolution',
      allowDemoData: false,
      requireClientScopedEvidence: true,
      colorSource: 'client_identity_base',
      growthPackPriorityPatch: '20260522-03'
    };
    return state;
  }

  function applyCssBranding() {
    document.querySelectorAll('.client-btn').forEach((button) => {
      const brand = BRAND[button.dataset.client];
      if (!brand) return;
      button.style.setProperty('--client-color', brand[0]);
      button.style.setProperty('--client-accent', brand[1]);
    });
    const active = document.querySelector('.client-btn.active')?.dataset?.client;
    const brand = BRAND[active];
    if (!brand) return;
    document.documentElement.style.setProperty('--red', brand[0]);
    document.documentElement.style.setProperty('--red-2', brand[1]);
  }

  try {
    if (window.V4_SEED) applyState(window.V4_SEED);
    if (Array.isArray(window.V4_OFFICIAL_ACTIVE_CLIENTS)) window.V4_OFFICIAL_ACTIVE_CLIENTS.forEach(applyClient);
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) localStorage.setItem(STORAGE_KEY, JSON.stringify(applyState(JSON.parse(raw))));
  } catch (error) {
    console.warn('[GrowthPackPriorityPatch]', error);
  }

  document.addEventListener('DOMContentLoaded', () => {
    applyCssBranding();
    const observer = new MutationObserver(() => requestAnimationFrame(applyCssBranding));
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });
  });

  window.V4_GROWTHPACK_PRIORITY_PATCH = { sources: GP, brand: BRAND, applyState, applyClient };
})();
