(function () {
  function officialClients() {
    return (window.V4_OFFICIAL_ACTIVE_CLIENTS || []).map((client) => ({
      id: client.id,
      name: client.name,
      groupId: client.groupId,
      driveFolderId: client.driveFolderId || '',
      driveUrl: client.driveUrl || '',
      growthPackStatus: client.growthPack?.status || 'not_located',
      spreadsheetId: client.growthPack?.spreadsheetId || '',
      crmGid: client.growthPack?.crmGid || ''
    }));
  }

  function locatedGrowthPackClients() {
    return officialClients().filter((client) => client.growthPackStatus === 'located' && client.spreadsheetId);
  }

  function buildGrowthPackEndpoints() {
    return Object.fromEntries(locatedGrowthPackClients().map((client) => [
      client.id,
      {
        summary: `/api/growthpack/${client.id}/summary`,
        crm: `/api/growthpack/${client.id}/crm`,
        performance: `/api/growthpack/${client.id}/performance`,
        drive: `/api/google-drive/folders/${client.driveFolderId}`
      }
    ]));
  }

  window.V4_INTEGRATIONS = {
    officialClients,
    locatedGrowthPackClients,
    buildGrowthPackEndpoints,
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
        officialClientCount: officialClients().length,
        growthPackClientCount: locatedGrowthPackClients().length,
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
      growthPackSummary: '/api/growthpack/:clientId/summary',
      growthPackCrm: '/api/growthpack/:clientId/crm',
      growthPackPerformance: '/api/growthpack/:clientId/performance'
    },
    growthPack: {
      get clients() {
        return locatedGrowthPackClients().map((client) => client.id);
      },
      get clientEndpoints() {
        return buildGrowthPackEndpoints();
      },
      mode: 'proxy',
      proxyUrl: '/api/growthpack',
      sources: ['BASE_CRM', '1.0 Mensal', '2.0 Semanal', 'bd Meta Ads', 'bd Google Ads', 'documentos Drive por cliente'],
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
      'Growth Pack roda por cliente oficial e respeita pasta Drive, groupId e planilha vinculada.',
      'eKyte entra como fonte operacional: tasks, Gantt, responsaveis, prazos, status e plano de acao.',
      'Metrica de midia continua vindo de Google Sheets/Meta/Google; eKyte nao substitui a fonte de performance.',
      'Todos os CRUDs atuais salvam em localStorage para prototipo sem custo.'
    ]
  };
})();
