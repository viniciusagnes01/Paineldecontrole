window.V4_INTEGRATIONS = {
  async syncAll() {
    return {
      ok: true,
      source: 'demo-local',
      message: 'Estrutura preparada para sincronizar via N8N/API sem expor tokens no front-end.'
    };
  },
  endpoints: {
    metaAds: '/api/meta-ads',
    googleAds: '/api/google-ads',
    linkedinAds: '/api/linkedin-ads',
    semrush: '/api/semrush',
    ekyte: '/api/ekyte',
    moskit: '/api/moskit',
    kommo: '/api/kommo',
    evolution: '/api/evolution',
    drive: '/api/google-drive',
    crmSheets: '/api/sheets/crm',
    performanceSheets: '/api/sheets/performance',
    lossReport: '/api/crm/loss-report'
  },
  notes: [
    'Use N8N ou backend para guardar tokens.',
    'O front-end deve receber somente dados tratados.',
    'Todos os CRUDs atuais salvam em localStorage para protótipo sem custo.'
  ]
};
