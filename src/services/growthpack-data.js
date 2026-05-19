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
      status: 'Growth Pack V26 - monitoramento dinâmico',
      health: 72,
      color: '#1b78ff',
      accent: '#70c0ff',
      mascot: 'ST',
      growthPack: {
        version: 'GrowthPack V26 (Inside Sales)',
        planningStatus: 'Relatório mensal; planejamento rodando',
        sourceKind: 'dynamic-growthpack',
        spreadsheetId: '1BurqRDqYbWq8dPVxXiKjWH6WmfBNoe39AymwJM8LpFA',
        spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/1BurqRDqYbWq8dPVxXiKjWH6WmfBNoe39AymwJM8LpFA/edit',
        monthlySheetName: '1.0 Mensal',
        weeklySheetName: '2.0 Semanal',
        crmSheetName: 'BASE_CRM',
        crmGid: '1699545222',
        monthlyGid: '1980055319',
        weeklyGid: '85034568',
        metaRawSheetName: 'bd Meta Ads',
        googleRawSheetName: 'bd Google Ads '
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
        revenue: 13201,
        revenueTarget: 160000,
        leads: 736,
        cpl: 15.60,
        roas: 1.15,
        investment: 11483.95,
        mql: 391,
        sql: 215,
        opportunities: 142,
        sales: 129,
        ticket: 102.33,
        impressions: 589301,
        clicks: 7122,
        ctr: 1.20,
        conversion: 17.53,
        dataSource: 'relatorio-mensal-abril-fallback'
      },
      goals: { revenue: 160000, leads: 1500, mqlRate: 53.12, cac: 80.87, roas: 1.15 },
      lps: [
        { id: 'lp-st1-fibra', name: 'LP - Internet Fibra / Provedor', url: 'https://cliente.com/fibra', status: 'Ativo', speed: 81, conversion: 5.0 }
      ],
      reportFallback: {
        period: 'Abril/2026',
        leadGoal: 1500,
        goalProgress: 45.20,
        ltv: 27.6,
        ltvRevenue: 236170.11,
        allFunnelRevenue: 68786,
        allFunnelSales: 675,
        allFunnelLeads: 3136,
        meta: { leads: 492, investment: 5535.80, sales: 55, cpl: 11.25, cpa: 100.65, roas: 0.97, roi: 0.63, capturedValue: 7826 },
        google: { leads: 244, investment: 5948.15, sales: 74, cpl: 24.37, cpa: 80.38, roas: 1.32, roi: 0.85, capturedValue: 5375 },
        learnings: [
          'Organizar orçamento pelos grupos de anúncio que geram leads mais baratos.',
          'Comunicar semanalmente quantos leads viraram oportunidades.',
          'Negativar canais e palavras-chave sem relação com o serviço.',
          'Validar qualidade de MQL dos leads de Meta e Google para otimizações.'
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
      status: 'Growth Pack V26 - monitoramento dinâmico',
      health: 68,
      color: '#b70d1c',
      accent: '#ff4354',
      mascot: 'PM',
      growthPack: {
        version: 'GrowthPack V26 (Inside Sales) + Growth Pack 3.1 [Prime]',
        planningStatus: 'Execução do Growth Pack; abril usado como fallback de check-in/relatório',
        sourceKind: 'dynamic-growthpack',
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
        leads: 179,
        cpl: 17.14,
        roas: 0,
        investment: 3069.07,
        mql: 16,
        sql: 0,
        opportunities: 2,
        sales: 0,
        ticket: 0,
        impressions: 299275,
        clicks: 2330,
        ctr: 0.77,
        conversion: 7.68,
        dataSource: 'relatorio-mensal-abril-fallback'
      },
      goals: { revenue: 120000, leads: 600, mqlRate: 8.93, cac: 1534.53, roas: 1 },
      lps: [
        { id: 'lp-prime-veiculos-pesados', name: 'LP - Veículos Pesados / Frota', url: 'https://cliente.com/prime-mecanica', status: 'Ativo', speed: 78, conversion: 4.2 }
      ],
      reportFallback: {
        period: 'Abril/2026',
        meta: { leads: 130, investment: 1537.85, sales: 0, cpl: 11.82, cpa: 0, roas: 0, roi: 0, capturedValue: 0 },
        google: { leads: 49, investment: 1531.22, sales: 0, cpl: 31.24, cpa: 0, roas: 0, roi: 0, capturedValue: 0 },
        organic: { followers: 26 },
        winningCreatives: [
          { label: 'Criativo vencedor 1', leads: 56, cpl: 7.09 },
          { label: 'Criativo vencedor 2', leads: 39, cpl: 9.33 },
          { label: 'Criativo vencedor 3', leads: 37, cpl: 9.95 }
        ],
        learnings: [
          'Fast Traffic foi otimizado mantendo criativos vencedores nos 4 grupos de anúncios ativos.',
          'Validar se os leads estão dentro de MQL e se vendas acompanham o crescimento.',
          'Produzir novos vídeos inspirados nos criativos vencedores para evitar desgaste.',
          'Se ROAS evoluir, escalar com Remarketing e Públicos Semelhantes.',
          'Google: LP de Festas de 15 anos + otimização/negativação de palavras-chave.'
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

  function buildTasks(client) {
    const tasks = [];
    const learnings = client.reportFallback?.learnings || [];
    learnings.forEach((text, index) => {
      tasks.push({
        id: `gp-${client.id}-learning-${index + 1}`,
        clientId: client.id,
        source: 'growthpack-report',
        title: text,
        status: index < 2 ? 'Em execução' : 'Backlog',
        owner: client.responsible,
        type: index < 2 ? 'Otimização / validação' : 'Plano de ação',
        priority: index < 2 ? 'Alta' : 'Média',
        start: '2026-05-19',
        end: '2026-05-31',
        progress: index < 2 ? 45 : 10,
        link: client.growthPack?.spreadsheetUrl || ''
      });
    });
    tasks.push({
      id: `gp-${client.id}-sync-growthpack`,
      clientId: client.id,
      source: 'growthpack-report',
      title: `Sincronizar ${client.growthPack.version} com BASE_CRM, 1.0 Mensal e 2.0 Semanal`,
      status: 'Em execução',
      owner: 'N8N / Backend',
      type: 'Integração Growth Pack',
      priority: 'Alta',
      start: '2026-05-19',
      end: '2026-05-22',
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
        dashboardSheetName: 'DASH_CRM',
        gid: client.growthPack.crmGid || '',
        proxyUrl: `/api/growthpack/${client.id}/crm`,
        status: 'Configurado - Growth Pack',
        lastSync: `Fonte preparada em ${nowPtBr()}`
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
        googleRawSheetName: client.growthPack.googleRawSheetName || 'bd Google Ads ',
        proxyUrl: `/api/growthpack/${client.id}/performance`,
        status: 'Configurado - Growth Pack',
        lastSync: `Fallback Abril/2026 aplicado em ${nowPtBr()}`
      }
    };

    state.clients = upsertById(state.clients, baseClient);
    state.tasks = removeGenerated(state.tasks, client.id, 'growthpack-report');
    state.actionPlan = removeGenerated(state.actionPlan, client.id, 'growthpack-report');
    const tasks = buildTasks(client);
    state.tasks.push(...tasks);
    state.actionPlan.push(...tasks.map(buildActionPlan));

    state.performanceSnapshots = state.performanceSnapshots || {};
    state.performanceSnapshots[client.id] = {
      source: 'relatorio-mensal-abril-fallback',
      generatedAt: nowPtBr(),
      monthly: {
        current: {
          label: client.reportFallback?.period || 'Abril/2026',
          metrics: {
            investment: client.metrics.investment,
            impressions: client.metrics.impressions,
            clicks: client.metrics.clicks,
            leads: client.metrics.leads,
            cpl: client.metrics.cpl,
            ctr: client.metrics.ctr,
            roas: client.metrics.roas,
            revenue: client.metrics.revenue,
            sales: client.metrics.sales,
            mql: client.metrics.mql,
            sql: client.metrics.sql,
            opportunities: client.metrics.opportunities
          }
        },
        periods: [{
          label: client.reportFallback?.period || 'Abril/2026',
          metrics: {
            investment: client.metrics.investment,
            impressions: client.metrics.impressions,
            clicks: client.metrics.clicks,
            leads: client.metrics.leads,
            cpl: client.metrics.cpl,
            ctr: client.metrics.ctr,
            roas: client.metrics.roas,
            revenue: client.metrics.revenue,
            sales: client.metrics.sales
          }
        }]
      },
      weekly: { current: null, periods: [] },
      channels: {
        meta: client.reportFallback?.meta || {},
        google: client.reportFallback?.google || {},
        organic: client.reportFallback?.organic || {}
      },
      learnings: client.reportFallback?.learnings || [],
      winningCreatives: client.reportFallback?.winningCreatives || []
    };

    state.crmSnapshots = state.crmSnapshots || {};
    state.crmSnapshots[client.id] = {
      source: 'growthpack-fallback',
      generatedAt: nowPtBr(),
      rows: client.metrics.leads,
      totals: {
        lead: client.metrics.leads,
        mql: client.metrics.mql,
        sql: client.metrics.sql,
        opportunity: client.metrics.opportunities,
        purchase: client.metrics.sales,
        lost: 0,
        value: client.metrics.revenue,
        meta: client.reportFallback?.meta?.leads || 0,
        google: client.reportFallback?.google?.leads || 0
      },
      rates: {
        leadToMql: client.metrics.leads ? client.metrics.mql / client.metrics.leads * 100 : 0,
        mqlToSql: client.metrics.mql ? client.metrics.sql / client.metrics.mql * 100 : 0,
        sqlToOpportunity: client.metrics.sql ? client.metrics.opportunities / client.metrics.sql * 100 : 0,
        opportunityToSale: client.metrics.opportunities ? client.metrics.sales / client.metrics.opportunities * 100 : 0,
        saleRate: client.metrics.leads ? client.metrics.sales / client.metrics.leads * 100 : 0,
        lossRate: 0,
        ticket: client.metrics.ticket || 0
      },
      sources: [
        { label: 'Meta Ads', lead: client.reportFallback?.meta?.leads || 0 },
        { label: 'Google Ads', lead: client.reportFallback?.google?.leads || 0 },
        { label: 'Orgânico / demais', lead: Math.max(0, client.metrics.leads - (client.reportFallback?.meta?.leads || 0) - (client.reportFallback?.google?.leads || 0)) }
      ],
      latest: []
    };
  }

  function applyGrowthPackData(target) {
    const state = target || {};
    state.clients = state.clients || [];
    state.tasks = state.tasks || [];
    state.actionPlan = state.actionPlan || [];
    state.integrations = state.integrations || [];
    Object.values(CLIENTS).forEach((client) => applyClient(state, client));
    state.integrations = upsertById(state.integrations, {
      id: 'growthpack',
      name: 'Growth Pack Dinâmico',
      type: 'Dados / CRM / Mídia',
      status: 'Configurado',
      sync: 'Google Sheets + N8N',
      lastUpdate: nowPtBr()
    });
    state.events = state.events || [];
    state.events.unshift({ id: `ev-growthpack-${Date.now()}`, type: 'sync', text: 'Growth Pack ST1 Internet e Prime Mecânica preparado com fallback Abril/2026', time: 'agora' });
    return state;
  }

  window.V4_GROWTHPACK_CLIENTS = CLIENTS;
  window.V4_APPLY_GROWTHPACK_DATA = applyGrowthPackData;

  if (window.V4_SEED) {
    applyGrowthPackData(window.V4_SEED);
  }

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
