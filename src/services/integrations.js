window.V4_INTEGRATIONS = {
  async syncAll() {
    const results = [];

    if (window.V4_EKYTE?.syncAll) {
      try {
        results.push(await window.V4_EKYTE.syncAll());
      } catch (error) {
        results.push({ ok: false, source: 'ekyte', message: error.message });
      }
    }

    if (window.V4_GROWTHPACK?.syncAll) {
      try {
        results.push(await window.V4_GROWTHPACK.syncAll());
      } catch (error) {
        results.push({ ok: false, source: 'growthpack', message: error.message });
      }
    }

    return {
      ok: results.every((item) => item.ok !== false),
      source: 'n8n-api',
      message: 'Sincronizacao preparada para backend/N8N. Tokens nao devem ficar no front-end.',
      results
    };
  },
  endpoints: {
    metaAds: '/api/meta-ads',
    googleAds: '/api/google-ads',
    linkedinAds: '/api/linkedin-ads',
    semrush: '/api/semrush',
    ekyte: '/api/ekyte',
    ekyteTasks: '/api/ekyte/tasks',
    ekyteProjects: '/api/ekyte/projects',
    moskit: '/api/moskit',
    kommo: '/api/kommo',
    evolution: '/api/evolution',
    drive: '/api/google-drive',
    crmSheets: '/api/sheets/crm',
    performanceSheets: '/api/sheets/performance',
    lossReport: '/api/crm/loss-report',
    growthPack: '/api/growthpack',
    growthPackSt1: '/api/growthpack/st1-internet/summary',
    growthPackPrime: '/api/growthpack/prime/summary'
  },
  growthPack: {
    clients: ['st1-internet', 'prime'],
    mode: 'proxy',
    proxyUrl: '/api/growthpack',
    sources: ['BASE_CRM', '1.0 Mensal', '2.0 Semanal', 'bd Meta Ads', 'bd Google Ads', 'relatorio-mensal-abril'],
    fallbackUntilProxyIsReady: true
  },
  ekyte: {
    companyId: '7773',
    mode: 'proxy',
    proxyUrl: '/api/ekyte',
    resources: ['tasks', 'projects'],
    syncStrategy: 'execution-only',
    useCases: [
      'tasks',
      'gantt',
      'actionPlan',
      'deadlines',
      'owners',
      'status'
    ],
    ignoredUseCases: [
      'social-listening',
      'campaign-monitoring-as-source-of-truth'
    ]
  },
  notes: [
    'Use N8N ou backend para guardar tokens.',
    'O front-end deve receber somente dados tratados.',
    'eKyte entra como fonte operacional: tasks, Gantt, responsaveis, prazos, status e plano de acao.',
    'Metrica de midia continua vindo de Google Sheets/Meta/Google; eKyte nao substitui a fonte de performance.',
    'Todos os CRUDs atuais salvam em localStorage para prototipo sem custo.'
  ]
};
