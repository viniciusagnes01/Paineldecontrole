(function () {
  const CLIENT_ID = 'alphaville';

  const SOURCES = Object.freeze({
    driveFolderId: '1lG21qv4S7LCWhHe7gBw73NPlDSJ4m-yi',
    driveUrl: 'https://drive.google.com/drive/folders/1lG21qv4S7LCWhHe7gBw73NPlDSJ4m-yi',
    growthPackSpreadsheetId: '1CtfFiB0q2B72Cwb9VjTkv8gZHYtBv2keICwBNj7Z0ws',
    growthPackUrl: 'https://docs.google.com/spreadsheets/d/1CtfFiB0q2B72Cwb9VjTkv8gZHYtBv2keICwBNj7Z0ws',
    growthPackCrmGid: '833926654',
    leadUpdateSpreadsheetId: '12LkM4ip_uS74DNtxFdIpPMAGyBrAPmAH8Pz0WsHT9GI',
    leadUpdateUrl: 'https://docs.google.com/spreadsheets/d/12LkM4ip_uS74DNtxFdIpPMAGyBrAPmAH8Pz0WsHT9GI',
    monthlyReportAprilId: '1_UDzNAOXLpy2zgwW4p5lOhxfp1M2T_ZL',
    monthlyReportAprilUrl: 'https://drive.google.com/file/d/1_UDzNAOXLpy2zgwW4p5lOhxfp1M2T_ZL',
    monthlyReportMarchId: '1U4xFvx6q-JOKH8DHeufk61KH0THdAorn',
    monthlyReportMarchUrl: 'https://drive.google.com/file/d/1U4xFvx6q-JOKH8DHeufk61KH0THdAorn',
    checkinMay13Id: '1jgtkJk-Qa1KJupbCj8KLjTdmkvnZEokewFhdfStUzsM',
    checkinMay13Url: 'https://docs.google.com/presentation/d/1jgtkJk-Qa1KJupbCj8KLjTdmkvnZEokewFhdfStUzsM',
    checkinApr29Id: '1GTC2DW_Bha8IWqcfJGAfw7nLVFpIn2ZyOFds67eWBSc',
    checkinApr29Url: 'https://docs.google.com/presentation/d/1GTC2DW_Bha8IWqcfJGAfw7nLVFpIn2ZyOFds67eWBSc',
    diagnosisId: '1VXKR_EiLiopxEgKZRcfTwnOpuHen-rBEKbY-HrI3Kuc',
    diagnosisUrl: 'https://docs.google.com/presentation/d/1VXKR_EiLiopxEgKZRcfTwnOpuHen-rBEKbY-HrI3Kuc',
    latestGeminiCheckinId: '1fn4Ne9H0LUzogOIooKTXmCfCYssMhdhqDp5RjMM-RAU',
    latestGeminiCheckinUrl: 'https://docs.google.com/document/d/1fn4Ne9H0LUzogOIooKTXmCfCYssMhdhqDp5RjMM-RAU'
  });

  const CRM_FALLBACK = Object.freeze({
    generatedAt: '2026-05-19T21:00:58.898Z',
    sourceLabel: 'Alphaville Sacadas | GrowthPack V26 (Inside Sales) + Atualizacao de Leads',
    rows: 1372,
    totals: {
      label: 'Geral',
      value: 0,
      lead: 1372,
      mql: 0,
      sql: 0,
      opportunity: 0,
      purchase: 0,
      lost: 0,
      meta: 0,
      google: 0
    },
    rates: {
      leadToMql: 0,
      mqlToSql: 0,
      sqlToOpportunity: 0,
      opportunityToSale: 0,
      saleRate: 0,
      lossRate: 0,
      ticket: 0
    },
    sourceLabels: ['Geral', 'Meta Ads', 'Google Ads', 'Organico'],
    sourceFunnels: {
      Geral: { label: 'Geral', lead: 1372, mql: 0, sql: 0, opportunity: 0, purchase: 0, lost: 0, meta: 0, google: 0, value: 0, rates: { leadToMql: 0, mqlToSql: 0, sqlToOpportunity: 0, opportunityToSale: 0, saleRate: 0, lossRate: 0, ticket: 0 } },
      'Meta Ads': { label: 'Meta Ads', lead: 0, mql: 0, sql: 0, opportunity: 0, purchase: 0, lost: 0, meta: 0, google: 0, value: 0, rates: { leadToMql: 0, mqlToSql: 0, sqlToOpportunity: 0, opportunityToSale: 0, saleRate: 0, lossRate: 0, ticket: 0 } },
      'Google Ads': { label: 'Google Ads', lead: 0, mql: 0, sql: 0, opportunity: 0, purchase: 0, lost: 0, meta: 0, google: 0, value: 0, rates: { leadToMql: 0, mqlToSql: 0, sqlToOpportunity: 0, opportunityToSale: 0, saleRate: 0, lossRate: 0, ticket: 0 } },
      Organico: { label: 'Organico', lead: 0, mql: 0, sql: 0, opportunity: 0, purchase: 0, lost: 0, meta: 0, google: 0, value: 0, rates: { leadToMql: 0, mqlToSql: 0, sqlToOpportunity: 0, opportunityToSale: 0, saleRate: 0, lossRate: 0, ticket: 0 } }
    },
    byMonth: [
      { label: '08/2024', lead: 1372, mql: 0, sql: 0, opportunity: 0, purchase: 0, lost: 0, value: 0 }
    ],
    byWeek: [],
    lossReasons: [
      { label: 'O produto nao se encaixa a necessidade', lead: 0, lost: 0, value: 0 },
      { label: 'Orcamento insuficiente', lead: 0, lost: 0, value: 0 }
    ],
    owners: [
      { label: 'Alphaville fechamento de sacada', lead: 1372, mql: 0, sql: 0, opportunity: 0, purchase: 0, lost: 0, value: 0, lossRate: 0, saleRate: 0 }
    ],
    sources: [
      { label: 'GrowthPack BASE_CRM', lead: 1372, value: 0 },
      { label: 'Atualizacao de Leads', lead: 0, value: 0 }
    ],
    lossBySource: [],
    ownerReasonMatrix: [],
    latest: [
      { date: '29/08/2024', leadId: '6874148', name: 'Lead #6874148', value: 0, owner: 'Alphaville fechamento de sacada', source: 'GrowthPack BASE_CRM', lossReason: '', flags: { lead: 1, mql: 0, sql: 0, opportunity: 0, purchase: 0, lost: 0, meta: 0, google: 0 }, timestamp: 1724893200000 },
      { date: '29/08/2024', leadId: '6975544', name: 'Lead #6975544', value: 0, owner: 'Alphaville fechamento de sacada', source: 'GrowthPack BASE_CRM', lossReason: 'O produto nao se encaixa a necessidade', flags: { lead: 1, mql: 0, sql: 0, opportunity: 0, purchase: 0, lost: 0, meta: 0, google: 0 }, timestamp: 1724893200000 },
      { date: '02/03/2026', leadId: 'lead-update-thais', name: 'thais - Itapema', value: 7000, owner: 'Atualizacao de Leads', source: 'Instagram', lossReason: '', flags: { lead: 1, mql: 0, sql: 0, opportunity: 0, purchase: 0, lost: 0, meta: 0, google: 0 }, timestamp: 1772413200000 },
      { date: '02/03/2026', leadId: 'lead-update-vitor', name: 'vitor - Camboriu', value: 6450, owner: 'Atualizacao de Leads', source: 'Instagram', lossReason: '', flags: { lead: 1, mql: 0, sql: 0, opportunity: 1, purchase: 0, lost: 0, meta: 0, google: 0 }, timestamp: 1772413200000 },
      { date: '02/03/2026', leadId: 'lead-update-janaina', name: 'janaina - Balneario Picarras', value: 3255, owner: 'Atualizacao de Leads', source: 'Instagram', lossReason: 'Perda', flags: { lead: 1, mql: 0, sql: 0, opportunity: 0, purchase: 0, lost: 1, meta: 0, google: 0 }, timestamp: 1772413200000 }
    ],
    lostLatest: [
      { date: '02/03/2026', leadId: 'lead-update-janaina', name: 'janaina - Balneario Picarras', value: 3255, owner: 'Atualizacao de Leads', source: 'Instagram', lossReason: 'Perda', flags: { lead: 1, mql: 0, sql: 0, opportunity: 0, purchase: 0, lost: 1, meta: 0, google: 0 }, timestamp: 1772413200000 }
    ],
    caveat: 'Fallback interno. Os totais completos devem ser recalculados assim que a BASE_CRM estiver publica ou via proxy N8N.'
  });

  const PERFORMANCE_FALLBACK = Object.freeze({
    generatedAt: '2026-05-19T21:00:58.898Z',
    monthly: {
      sourceUrl: SOURCES.monthlyReportAprilUrl,
      current: {
        index: 1,
        mode: 'monthly',
        year: '2026',
        month: 'Abril',
        start: '01/04/2026',
        end: '30/04/2026',
        label: 'Abril/2026 - relatorio mensal',
        sortDate: 1743476400000,
        metrics: {
          plannedMedia: 3000,
          investment: 0,
          leads: 1372,
          mql: 0,
          sql: 0,
          opportunities: 0,
          sales: 0,
          revenue: 0,
          cpl: 0,
          roas: 0,
          pacing: 0
        },
        raw: { plannedMedia: 'Budget Mensal R$ 3.000,00', source: 'Relatorio Mensal Alphaville - Mes Abril' }
      },
      periods: [],
      totals: { plannedMedia: 3000, investment: 0, leads: 1372, mql: 0, sql: 0, opportunities: 0, sales: 0, revenue: 0, cpl: 0, roas: 0, pacing: 0 }
    },
    weekly: {
      sourceUrl: SOURCES.checkinMay13Url,
      current: {
        index: 1,
        mode: 'weekly',
        year: '2026',
        month: 'Maio',
        start: '13/05/2026',
        end: '13/05/2026',
        label: 'Check-in 13/05/2026',
        sortDate: 1747105200000,
        metrics: { plannedMedia: 3000, investment: 0, leads: 0, mql: 0, sql: 0, opportunities: 0, sales: 0, revenue: 0, cpl: 0, roas: 0, pacing: 0 },
        raw: { source: 'Check-in Alphaville Fechamento de Sacadas - 13/05/2026' }
      },
      periods: [],
      totals: { plannedMedia: 3000, investment: 0, leads: 0, mql: 0, sql: 0, opportunities: 0, sales: 0, revenue: 0, cpl: 0, roas: 0, pacing: 0 }
    },
    caveat: 'Apenas budget e fontes de referencia foram confirmados no relatorio/check-in. Investimento realizado, CPL, ROAS e vendas devem vir do GrowthPack ou proxy N8N.'
  });

  const TASKS = Object.freeze([
    { id: 'alphaville-int-crm', title: 'Conectar BASE_CRM do GrowthPack Alphaville', status: 'Em execucao', owner: 'V4 / Dados', type: 'GrowthPack', priority: 'Alta', start: '2026-05-19', end: '2026-05-20', progress: 75, clientId: CLIENT_ID, source: 'growthpack', sourceEvidence: SOURCES.growthPackUrl },
    { id: 'alphaville-int-leads-update', title: 'Consolidar Atualizacao de Leads no funil', status: 'Backlog', owner: 'V4 / Operacao', type: 'CRM', priority: 'Alta', start: '2026-05-19', end: '2026-05-22', progress: 35, clientId: CLIENT_ID, source: 'google_sheets', sourceEvidence: SOURCES.leadUpdateUrl },
    { id: 'alphaville-int-media', title: 'Ativar proxy N8N para midia Meta/Google', status: 'Backlog', owner: 'V4 / Tech', type: 'Midia', priority: 'Alta', start: '2026-05-19', end: '2026-05-23', progress: 20, clientId: CLIENT_ID, source: 'report/checkin', sourceEvidence: SOURCES.monthlyReportAprilUrl },
    { id: 'alphaville-int-report', title: 'Usar Relatorio Mensal Abril como fallback executivo', status: 'Concluido', owner: 'Vinicius Agnes', type: 'Relatorio', priority: 'Media', start: '2026-05-19', end: '2026-05-19', progress: 100, clientId: CLIENT_ID, source: 'monthly_report', sourceEvidence: SOURCES.monthlyReportAprilUrl },
    { id: 'alphaville-int-diagnosis', title: 'Vincular diagnostico e planejamento de marketing e vendas', status: 'Concluido', owner: 'V4 / Estrategia', type: 'Planejamento', priority: 'Media', start: '2026-05-19', end: '2026-05-19', progress: 100, clientId: CLIENT_ID, source: 'diagnosis', sourceEvidence: SOURCES.diagnosisUrl }
  ]);

  const ACTION_PLAN = Object.freeze([
    { id: 'alphaville-ap-01', clientId: CLIENT_ID, what: 'Publicar ou proxiar GrowthPack Alphaville', why: 'Sem CSV publico/proxy, o navegador pode bloquear a sincronizacao dinamica.', where: 'N8N / Google Sheets', when: 'Agora', who: 'V4 Tech', how: 'Criar endpoints /api/growthpack/alphaville/crm e /api/growthpack/alphaville/performance/* com token no servidor.', status: 'Em execucao' },
    { id: 'alphaville-ap-02', clientId: CLIENT_ID, what: 'Unificar Atualizacao de Leads com BASE_CRM', why: 'A planilha de atualizacao possui cidade, orcamento, preco, canal, fase do funil e motivo de perda.', where: 'CRM & Funil', when: 'Semana atual', who: 'V4 Operacao', how: 'Normalizar campos Data, Nome, Cidade, Orcamento, Preco, Canal, Fase do funil e Motivo de perda.', status: 'Backlog' },
    { id: 'alphaville-ap-03', clientId: CLIENT_ID, what: 'Manter Relatorio Abril como fallback', why: 'O relatorio mensal confirma Budget Mensal de R$ 3.000,00 e serve como fonte executiva ate conectar midia.', where: 'Midia & Ads', when: 'Agora', who: 'Vinicius Agnes', how: 'Usar fallback somente para informacao confirmada e nao inventar investimento realizado.', status: 'Concluido' },
    { id: 'alphaville-ap-04', clientId: CLIENT_ID, what: 'Revisar diagnostico e planejamento', why: 'Documento de diagnostico orienta mensagens, oferta, funil e vendas.', where: 'Visao Geral / Plano de Acao', when: 'Proxima reuniao', who: 'V4 Estrategia', how: 'Transformar diagnostico em tarefas e hipoteses de campanha.', status: 'Concluido' }
  ]);

  function upsertById(collection, items) {
    if (!Array.isArray(collection)) return items.slice();
    const output = collection.filter((item) => !items.some((next) => next.id === item.id));
    return output.concat(items.map((item) => ({ ...item })));
  }

  function patchClient(seed) {
    if (!seed || !Array.isArray(seed.clients)) return;
    const client = seed.clients.find((item) => item.id === CLIENT_ID);
    if (!client) return;

    client.name = 'Alphaville';
    client.segment = 'Fechamento de sacadas / vidros / guarda-corpo';
    client.crm = 'GrowthPack / BASE_CRM';
    client.status = 'Integracoes Alphaville vinculadas';
    client.health = Math.max(Number(client.health || 0), 78);
    client.driveFolderId = SOURCES.driveFolderId;
    client.driveUrl = SOURCES.driveUrl;
    client.metrics = {
      ...(client.metrics || {}),
      revenue: 0,
      revenueTarget: 0,
      leads: 1372,
      mql: 0,
      sql: 0,
      opportunities: 0,
      sales: 0,
      ticket: 0,
      investment: 0,
      plannedMedia: 3000,
      cpl: 0,
      roas: 0,
      dataSource: 'alphaville-growthpack-fallback'
    };
    client.goals = { ...(client.goals || {}), revenue: 0, leads: 1372, mqlRate: 0, cac: 0, roas: 0 };
    client.crmSheet = {
      type: 'growthPackSpreadsheet',
      spreadsheetId: SOURCES.growthPackSpreadsheetId,
      url: SOURCES.growthPackUrl,
      title: 'Alphaville Sacadas | GrowthPack V26 (Inside Sales)',
      sheetName: 'BASE_CRM',
      dashboardSheetName: 'DASH_CRM',
      gid: SOURCES.growthPackCrmGid,
      proxyUrl: '/api/growthpack/alphaville/crm',
      status: 'GrowthPack + fallback interno Alphaville',
      lastSync: 'Fallback carregado. Dinamico via proxy N8N quando disponivel.',
      fallbackSnapshot: CRM_FALLBACK
    };
    client.performanceSheets = {
      type: 'growthPackAndReportFallback',
      spreadsheetId: SOURCES.growthPackSpreadsheetId,
      url: SOURCES.growthPackUrl,
      title: 'Alphaville - GrowthPack + Relatorios/Check-ins',
      monthlySheetName: '1.0 Mensal',
      weeklySheetName: '2.0 Semanal',
      monthlyGid: '',
      weeklyGid: '',
      metaRawSheetName: 'bd Meta Ads',
      googleRawSheetName: 'bd Google Ads ',
      monthlyProxyUrl: '/api/growthpack/alphaville/performance/monthly',
      weeklyProxyUrl: '/api/growthpack/alphaville/performance/weekly',
      proxyUrl: '',
      status: 'GrowthPack + relatorio/check-in fallback',
      lastSync: 'Fallback carregado. Dinamico via proxy N8N quando disponivel.',
      fallbackSnapshot: PERFORMANCE_FALLBACK
    };
    client.knowledgeBase = {
      ...(client.knowledgeBase || {}),
      type: 'google_drive_folder',
      folderId: SOURCES.driveFolderId,
      url: SOURCES.driveUrl,
      status: 'official_active',
      sourceOfTruth: true
    };
    client.integrations = {
      growthPack: { status: 'linked', spreadsheetId: SOURCES.growthPackSpreadsheetId, gid: SOURCES.growthPackCrmGid, url: SOURCES.growthPackUrl },
      leadUpdate: { status: 'linked', spreadsheetId: SOURCES.leadUpdateSpreadsheetId, url: SOURCES.leadUpdateUrl },
      monthlyReports: [
        { label: 'Abril/2026', id: SOURCES.monthlyReportAprilId, url: SOURCES.monthlyReportAprilUrl },
        { label: 'Marco/2026', id: SOURCES.monthlyReportMarchId, url: SOURCES.monthlyReportMarchUrl }
      ],
      checkins: [
        { label: '13/05/2026', id: SOURCES.checkinMay13Id, url: SOURCES.checkinMay13Url },
        { label: '29/04/2026', id: SOURCES.checkinApr29Id, url: SOURCES.checkinApr29Url }
      ],
      diagnosis: { status: 'linked', id: SOURCES.diagnosisId, url: SOURCES.diagnosisUrl }
    };

    seed.crmSnapshots = { ...(seed.crmSnapshots || {}), [CLIENT_ID]: CRM_FALLBACK };
    seed.performanceSnapshots = { ...(seed.performanceSnapshots || {}), [CLIENT_ID]: PERFORMANCE_FALLBACK };
    seed.tasks = upsertById(seed.tasks || [], TASKS);
    seed.actionPlan = upsertById(seed.actionPlan || [], ACTION_PLAN);
    seed.campaigns = upsertById(seed.campaigns || [], [
      { id: 'alphaville-campaign-meta', clientId: CLIENT_ID, name: 'Meta Ads - Fechamento de Sacadas', channel: 'Meta Ads', investment: 0, leads: 0, cpl: 0, roas: 0, status: 'Aguardando proxy/fonte dinamica' },
      { id: 'alphaville-campaign-google', clientId: CLIENT_ID, name: 'Google Ads - Fechamento de Sacadas', channel: 'Google Ads', investment: 0, leads: 0, cpl: 0, roas: 0, status: 'Aguardando proxy/fonte dinamica' }
    ]);
    seed.alerts = upsertById(seed.alerts || [], [
      { id: 'alphaville-integrations-linked', level: 'ok', text: 'Alphaville com GrowthPack, Drive, relatorios e check-ins vinculados', detail: 'Fallback interno ativo ate o proxy N8N liberar dados dinamicos no front.' },
      { id: 'alphaville-media-needs-proxy', level: 'warning', text: 'Midia Alphaville precisa de proxy N8N para sincronizacao 100% dinamica', detail: 'Relatorio Abril confirma Budget Mensal R$ 3.000,00; demais metricas devem vir do GrowthPack/proxy.' }
    ]);
    seed.events = [
      { id: 'alphaville-integrations-loaded', type: 'sync', text: 'Integracoes Alphaville carregadas: GrowthPack, leads, relatorios, check-ins e diagnostico.', time: 'agora' },
      ...(seed.events || []).filter((event) => event.id !== 'alphaville-integrations-loaded')
    ];
  }

  window.V4_ALPHAVILLE_INTEGRATIONS = { sources: SOURCES, crmFallback: CRM_FALLBACK, performanceFallback: PERFORMANCE_FALLBACK, tasks: TASKS, actionPlan: ACTION_PLAN };
  patchClient(window.V4_SEED);
})();
