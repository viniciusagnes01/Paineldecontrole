(function () {
  const STORAGE_KEY = 'v4-command-center-state-v6-crm-performance-losses';

  const nowPtBr = () => new Date().toLocaleString('pt-BR');

  const CLIENTS = {
    'st1-internet': {
      id: 'st1-internet',
      name: 'ST1 Internet',
      initials: 'ST',
      groupId: '120363403300629023',
      segment: 'Internet / telecom / provedor de internet',
      crm: 'Kommo',
      responsible: 'Vinicius Agnes',
      status: 'Growth Pack V26 - fonte oficial Google Sheets',
      health: 72,
      color: '#1b78ff',
      accent: '#70c0ff',
      mascot: 'ST',
      growthPack: {
        version: 'GrowthPack V26 (Inside Sales)',
        planningStatus: 'Relatório mensal; planejamento rodando',
        sourceKind: 'google-sheets-official',
        spreadsheetId: '1BurqRDqYbWq8dPVxXiKjWH6WmfBNoe39AymwJM8LpFA',
        spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/1BurqRDqYbWq8dPVxXiKjWH6WmfBNoe39AymwJM8LpFA/edit',
        monthlySheetName: '1,0 Mensal',
        monthlyGid: '1253486000',
        weeklySheetName: '2.0 Semanal',
        weeklyGid: '85034568',
        dailySheetName: '3.0 Diario',
        dailyGid: '2073034759',
        crmSheetName: 'BASE_CRM',
        crmGid: '1699545222',
        metaRawSheetName: 'bd Meta Ads',
        metaRawGid: '662103333',
        googleRawSheetName: 'bd Google Ads ',
        googleRawGid: '2106399394',
        analyticsSheetName: 'bd Analytics',
        analyticsGid: '1624663946'
      },
      communicationBase: {
        objective: 'Centralizar mensagens, aprovações, riscos, pendências, promessas, contexto do cliente, Ekyte e histórico social para automação N8N + Evolution + IA.',
        groupJid: '120363403300629023@g.us',
        niche: 'Provedor de internet',
        driveKeywords: 'ST1 Internet, internet, telecom',
        driveFolderId: '1IOElrGUmuVZ37Rqr443lGHdKiJIuVMxw',
        driveFolderUrl: 'https://drive.google.com/drive/folders/1IOElrGUmuVZ37Rqr443lGHdKiJIuVMxw',
        approvalKey: 'ST1INTERNET',
        tone: 'Profissional, consultivo, objetivo e próximo.',
        safetyRule: 'Cliente recebe somente a resposta final aprovada; análise, risco e prioridade ficam internos.',
        approvalRule: 'Prioridade >= 3 exige aprovação humana antes do envio.'
      },
      ekyteConfig: {
        idWorkspaceEkyte: '127063',
        idProjetoEkyte: '273637',
        idTipoTarefaEkyte: '55820',
        idTaskModeloEkyte: '8851196',
        executorIdEkyte: '782e3f64-e027-4eff-8d6c-716cf76c1532',
        statusAutomacao: 'preparada'
      },
      metrics: {
        revenue: 0,
        revenueTarget: 160000,
        leads: 0,
        cpl: 0,
        roas: 0,
        investment: 0,
        mql: 0,
        sql: 0,
        opportunities: 0,
        sales: 0,
        ticket: 0,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        conversion: 0,
        dataSource: 'pending-real-sync'
      },
      goals: { revenue: 160000, leads: 1500, mqlRate: 0, cac: 0, roas: 0 },
      lps: [
        { id: 'lp-st1-fibra', name: 'LP - Internet Fibra / Provedor', url: '', status: 'Pendente', speed: 0, conversion: 0 }
      ],
      reportFallback: {
        period: '',
        learnings: [
          'Sincronizar mídia somente pelas abas oficiais 1,0 Mensal e 2.0 Semanal.',
          'Usar bd Meta Ads e bd Google Ads apenas como camada de auditoria/drill-down.',
          'Não usar DASH_CRM no painel.'
        ]
      }
    },
    prime: {
      id: 'prime',
      name: 'Prime Mecânica',
      initials: 'PM',
      groupId: '120363418609215409',
      segment: 'Oficina mecânica / veículos pesados / serviços automotivos',
      crm: 'Kommo',
      responsible: 'Vinicius Agnes',
      status: 'Growth Pack V26 - fonte oficial Google Sheets',
      health: 68,
      color: '#b70d1c',
      accent: '#ff4354',
      mascot: 'PM',
      growthPack: {
        version: 'GrowthPack V26 (Inside Sales) + Growth Pack 3.1 [Prime]',
        planningStatus: 'Execução do Growth Pack',
        sourceKind: 'google-sheets-official',
        spreadsheetId: '1BOTJF5ymnYHZ69mhyvCUZZWqyGOEf2boeRFza3L5awI',
        spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/1BOTJF5ymnYHZ69mhyvCUZZWqyGOEf2boeRFza3L5awI/edit',
        leadSpreadsheetId: '1h6-xdgyekZrNLZ4luZU61S0hzh0Z-HLAZR7qCm8NQG8',
        leadSpreadsheetUrl: 'https://docs.google.com/spreadsheets/d/1h6-xdgyekZrNLZ4luZU61S0hzh0Z-HLAZR7qCm8NQG8/edit',
        monthlySheetName: '1.0 Mensal',
        weeklySheetName: '2.0 Semanal',
        crmSheetName: 'BASE_CRM',
        crmGid: '1986904416',
        metaRawSheetName: 'bd Meta Ads',
        googleRawSheetName: 'bd Google Ads '
      },
      communicationBase: {
        objective: 'Centralizar mensagens, aprovações, riscos, pendências, promessas, contexto do cliente, Ekyte e histórico social para automação N8N + Evolution + IA.',
        groupJid: '120363418609215409@g.us',
        niche: 'Oficina mecânica',
        driveKeywords: 'Prime Mecânica, oficina, freios, automotivo',
        driveFolderId: '1ynLKciynIzr7gVtgiq3fy5IoTranCFAn',
        driveFolderUrl: 'https://drive.google.com/drive/folders/1ynLKciynIzr7gVtgiq3fy5IoTranCFAn',
        approvalKey: 'PRIME',
        tone: 'Profissional, consultivo, objetivo e próximo.',
        safetyRule: 'Cliente recebe somente a resposta final aprovada; análise, risco e prioridade ficam internos.',
        approvalRule: 'Prioridade >= 3 exige aprovação humana antes do envio.'
      },
      ekyteConfig: {
        idWorkspaceEkyte: '106839',
        idProjetoEkyte: '291839',
        idTipoTarefaEkyte: '55820',
        idTaskModeloEkyte: '8851196',
        executorIdEkyte: '782e3f64-e027-4eff-8d6c-716cf76c1532',
        statusAutomacao: 'preparada'
      },
      metrics: {
        revenue: 0,
        revenueTarget: 120000,
        leads: 0,
        cpl: 0,
        roas: 0,
        investment: 0,
        mql: 0,
        sql: 0,
        opportunities: 0,
        sales: 0,
        ticket: 0,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        conversion: 0,
        dataSource: 'pending-real-sync'
      },
      goals: { revenue: 120000, leads: 600, mqlRate: 0, cac: 0, roas: 0 },
      lps: [
        { id: 'lp-prime-veiculos-pesados', name: 'LP - Veículos Pesados / Frota', url: '', status: 'Pendente', speed: 0, conversion: 0 }
      ],
      reportFallback: {
        period: '',
        learnings: [
          'Sincronizar mídia e CRM apenas pelas fontes oficiais configuradas.',
          'Não usar endpoints /api/growthpack inexistentes.',
          'Não usar DASH_CRM no painel.'
        ]
      }
    }
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function upsertById(list, item) {
    const arr = Array.isArray(list) ? list : [];
    const index = arr.findIndex((row) => row.id === item.id);
    if (index >= 0) arr[index] = { ...arr[index], ...item };
    else arr.push(item);
    return arr;
  }

  function removeGenerated(rows, clientId, source) {
    return (rows || []).filter((row) => !(row.clientId === clientId && row.source === source));
  }

  function cleanDashCrm(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    Object.keys(obj).forEach((key) => {
      const value = obj[key];
      if (String(value || '').trim().toUpperCase() === 'DASH_CRM' || key === 'dashboardSheetName' || key === 'dashboardGid' || key === 'dashCrm') {
        delete obj[key];
      } else if (value && typeof value === 'object') {
        cleanDashCrm(value);
      }
    });
    return obj;
  }

  function buildTasks(client) {
    const tasks = [];
    const learnings = client.reportFallback?.learnings || [];
    learnings.forEach((text, index) => {
      tasks.push({
        id: `gp-${client.id}-learning-${index + 1}`,
        clientId: client.id,
        source: 'growthpack-report',
        title: text,
        status: index < 1 ? 'Em execução' : 'Backlog',
        owner: client.responsible,
        type: index < 1 ? 'Integração / saneamento' : 'Plano de ação',
        priority: index < 1 ? 'Alta' : 'Média',
        start: '2026-05-19',
        end: '2026-05-31',
        progress: index < 1 ? 45 : 10,
        link: client.growthPack?.spreadsheetUrl || ''
      });
    });
    tasks.push({
      id: `gp-${client.id}-sync-growthpack`,
      clientId: client.id,
      source: 'growthpack-report',
      title: `Sincronizar ${client.growthPack.version} com BASE_CRM, ${client.growthPack.monthlySheetName || 'Mensal'} e ${client.growthPack.weeklySheetName || 'Semanal'}`,
      status: 'Em execução',
      owner: 'N8N / Backend',
      type: 'Integração Growth Pack',
      priority: 'Alta',
      start: '2026-05-19',
      end: '2026-05-31',
      progress: 60,
      link: client.growthPack?.spreadsheetUrl || ''
    });
    return tasks;
  }

  function buildActionPlan(task) {
    return {
      id: `ap-${task.id}`,
      clientId: task.clientId,
      source: 'growthpack-report',
      what: task.title,
      why: task.priority === 'Alta' ? 'Impacta leitura de qualidade, oportunidade, vendas e próximos passos.' : 'Apoia execução do Growth Pack.',
      where: task.type,
      when: task.end || 'Semana atual',
      who: task.owner,
      how: task.link ? `Acompanhar na fonte oficial: ${task.link}` : 'Acompanhar na rotina V4.',
      status: task.status
    };
  }

  function removeLegacySnapshots(state, clientId) {
    if (state.performanceSnapshots?.[clientId]?.source === 'relatorio-mensal-abril-fallback') delete state.performanceSnapshots[clientId];
    if (state.crmSnapshots?.[clientId]?.source === 'growthpack-fallback') delete state.crmSnapshots[clientId];
  }

  function applyClient(state, client) {
    const baseClient = {
      id: client.id,
      name: client.name,
      initials: client.initials,
      groupId: client.groupId,
      segment: client.segment,
      crm: client.crm,
      responsible: client.responsible,
      status: client.status,
      health: client.health,
      color: client.color,
      accent: client.accent,
      mascot: client.mascot,
      metrics: client.metrics,
      goals: client.goals,
      lps: client.lps,
      growthPack: client.growthPack,
      reportFallback: client.reportFallback,
      communicationBase: client.communicationBase,
      ekyteConfig: client.ekyteConfig,
      crmSheet: {
        type: 'googleSheetsCsv',
        spreadsheetId: client.growthPack.leadSpreadsheetId || client.growthPack.spreadsheetId,
        url: client.growthPack.leadSpreadsheetUrl || client.growthPack.spreadsheetUrl,
        sheetName: client.growthPack.crmSheetName || 'BASE_CRM',
        gid: client.growthPack.crmGid || '',
        status: 'Configurado - Google Sheets oficial',
        lastSync: `Fonte configurada em ${nowPtBr()}`
      },
      performanceSheets: {
        type: 'googleSheetsCsv',
        spreadsheetId: client.growthPack.spreadsheetId,
        url: client.growthPack.spreadsheetUrl,
        monthlySheetName: client.growthPack.monthlySheetName || '1.0 Mensal',
        weeklySheetName: client.growthPack.weeklySheetName || '2.0 Semanal',
        monthlyGid: client.growthPack.monthlyGid || '',
        weeklyGid: client.growthPack.weeklyGid || '',
        metaRawSheetName: client.growthPack.metaRawSheetName || 'bd Meta Ads',
        metaRawGid: client.growthPack.metaRawGid || '',
        googleRawSheetName: client.growthPack.googleRawSheetName || 'bd Google Ads ',
        googleRawGid: client.growthPack.googleRawGid || '',
        analyticsSheetName: client.growthPack.analyticsSheetName || 'bd Analytics',
        analyticsGid: client.growthPack.analyticsGid || '',
        status: 'Configurado - Google Sheets oficial',
        lastSync: `Fonte configurada em ${nowPtBr()}`
      }
    };

    state.clients = upsertById(state.clients, baseClient);
    state.tasks = removeGenerated(state.tasks, client.id, 'growthpack-report');
    state.actionPlan = removeGenerated(state.actionPlan, client.id, 'growthpack-report');
    const tasks = buildTasks(client);
    state.tasks.push(...tasks);
    state.actionPlan.push(...tasks.map(buildActionPlan));
    state.performanceSnapshots = state.performanceSnapshots || {};
    state.crmSnapshots = state.crmSnapshots || {};
    removeLegacySnapshots(state, client.id);
  }

  function applyGrowthPackData(target) {
    const state = cleanDashCrm(target || {});
    state.clients = state.clients || [];
    state.tasks = state.tasks || [];
    state.actionPlan = state.actionPlan || [];
    state.integrations = state.integrations || [];
    Object.values(CLIENTS).forEach((client) => applyClient(state, client));
    state.integrations = upsertById(state.integrations, {
      id: 'growthpack',
      name: 'Growth Pack Dinâmico',
      type: 'Dados / CRM / Mídia',
      status: 'Configurado sem proxy legado',
      sync: 'Google Sheets oficial + Apps Script público',
      lastUpdate: nowPtBr()
    });
    state.events = state.events || [];
    state.events.unshift({ id: `ev-growthpack-${Date.now()}`, type: 'sync', text: 'Growth Pack saneado: sem DASH_CRM e sem /api/growthpack legado', time: 'agora' });
    return state;
  }

  window.V4_GROWTHPACK_CLIENTS = CLIENTS;
  window.V4_APPLY_GROWTHPACK_DATA = applyGrowthPackData;

  if (window.V4_SEED) applyGrowthPackData(window.V4_SEED);

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const state = applyGrowthPackData(JSON.parse(stored));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  } catch (error) {
    console.warn('[GrowthPack] Não foi possível hidratar localStorage', error);
  }
})();
