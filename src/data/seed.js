window.V4_SEED = {
  version: 6,
  settings: {
    period: '21/05/24 a 27/05/2024',
    nextSync: '02:45',
    refreshMode: 'N8N/API',
    workspace: 'V4 Company',
    operator: 'Vinicius Agnes'
  },
  integrations: [
    { id: 'meta-ads', name: 'Meta Ads', type: 'Mídia', status: 'Ativo', sync: 'N8N', lastUpdate: 'há 8 min' },
    { id: 'google-ads', name: 'Google Ads', type: 'Mídia', status: 'Ativo', sync: 'N8N', lastUpdate: 'há 9 min' },
    { id: 'linkedin-ads', name: 'LinkedIn Ads', type: 'Mídia', status: 'Aguardando token', sync: 'API', lastUpdate: 'pendente' },
    { id: 'moskit', name: 'Moskit CRM', type: 'CRM', status: 'Ativo', sync: 'Webhook', lastUpdate: 'há 6 min' },
    { id: 'kommo', name: 'Kommo CRM', type: 'CRM', status: 'Ativo', sync: 'Webhook', lastUpdate: 'há 6 min' },
    { id: 'semrush', name: 'SEMrush', type: 'Concorrência', status: 'Preparado', sync: 'API', lastUpdate: 'manual' },
    { id: 'ekyte', name: 'eKyte', type: 'Projetos', status: 'Preparado', sync: 'API', lastUpdate: 'manual' },
    { id: 'evolution', name: 'Evolution API', type: 'WhatsApp', status: 'Ativo', sync: 'Webhook', lastUpdate: 'há 2 min' },
    { id: 'drive', name: 'Google Drive/Sheets', type: 'Dados', status: 'Ativo', sync: 'API', lastUpdate: 'há 12 min' }
  ],
  clients: [
    {
      id: 'alphaville', name: 'Alphaville', initials: 'AL', groupId: '120363257134796140', segment: 'Imobiliário / serviços premium', crm: 'Kommo', responsible: 'Vinicius Agnes', status: 'Operação ativa', health: 78, color: '#c91524', accent: '#ff3045', mascot: 'AL',
      metrics: { revenue: 214800, revenueTarget: 320000, leads: 1132, cpl: 31.48, roas: 4.8, investment: 35640, mql: 94, sql: 52, opportunities: 38, sales: 18, ticket: 11933, ctr: 2.8, conversion: 8.3 },
      goals: { revenue: 320000, leads: 1400, mqlRate: 10, cac: 900, roas: 4.5 },
      lps: [
        { id: 'lp-al-01', name: 'LP - Captação Alphaville', url: 'https://cliente.com/alphaville', status: 'Ativo', speed: 87, conversion: 6.4 },
        { id: 'lp-al-02', name: 'LP - Consulta Premium', url: 'https://cliente.com/consulta', status: 'Ativo', speed: 82, conversion: 5.1 }
      ]
    },
    {
      id: 'yousafer', name: 'YouSafer', initials: 'YS', groupId: '120363299569409896', segment: 'Saúde corporativa / benefícios', crm: 'Moskit', responsible: 'Vinicius Agnes', status: 'Operação ativa', health: 74, color: '#0f898b', accent: '#21d2cc', mascot: 'YS',
      metrics: { revenue: 163430, revenueTarget: 250000, leads: 1482, cpl: 27.68, roas: 4.32, investment: 37820, mql: 82, sql: 47, opportunities: 31, sales: 15, ticket: 10895, ctr: 3.1, conversion: 5.5 },
      goals: { revenue: 250000, leads: 1700, mqlRate: 8.5, cac: 850, roas: 4.2 },
      lps: [
        { id: 'lp-ys-01', name: 'LP - Assistência Médica Empresarial', url: 'https://cliente.com/assistencia', status: 'Ativo', speed: 91, conversion: 7.1 },
        { id: 'lp-ys-02', name: 'LP - Telemedicina', url: 'https://cliente.com/telemedicina', status: 'Ativo', speed: 88, conversion: 6.4 },
        { id: 'lp-ys-03', name: 'LP - Benefícios Corporativos', url: 'https://cliente.com/beneficios', status: 'Atenção', speed: 61, conversion: 3.8 }
      ]
    },
    {
      id: 'prime', name: 'Prime', initials: 'PR', groupId: '120363418609215409', segment: 'Educação / consultoria', crm: 'Kommo', responsible: 'Vinicius Agnes', status: 'Operação ativa', health: 81, color: '#b70d1c', accent: '#ff4354', mascot: 'PR',
      metrics: { revenue: 184900, revenueTarget: 260000, leads: 976, cpl: 34.1, roas: 5.05, investment: 36613, mql: 88, sql: 49, opportunities: 33, sales: 17, ticket: 10876, ctr: 2.5, conversion: 9.0 },
      goals: { revenue: 260000, leads: 1200, mqlRate: 9.5, cac: 950, roas: 4.8 },
      lps: [ { id: 'lp-pr-01', name: 'LP - Diagnóstico Prime', url: 'https://cliente.com/prime', status: 'Ativo', speed: 86, conversion: 5.9 } ]
    },
    {
      id: 'multimed', name: 'MultiMed', initials: 'MM', groupId: '120363423606250960', segment: 'Saúde / clínica', crm: 'Kommo', responsible: 'Vinicius Agnes', status: 'Setup avançado', health: 69, color: '#136cd8', accent: '#5ea2ff', mascot: 'MM',
      metrics: { revenue: 118200, revenueTarget: 210000, leads: 721, cpl: 42.66, roas: 3.65, investment: 32380, mql: 56, sql: 28, opportunities: 21, sales: 11, ticket: 10745, ctr: 2.1, conversion: 7.7 },
      goals: { revenue: 210000, leads: 900, mqlRate: 9, cac: 1000, roas: 4 },
      lps: [ { id: 'lp-mm-01', name: 'LP - Consulta MultiMed', url: 'https://cliente.com/multimed', status: 'Ativo', speed: 80, conversion: 5.2 } ]
    },
    {
      id: 'treinando-online', name: 'Treinando Online', initials: 'TO', groupId: '120363421384631664', segment: 'Cursos e infoproduto', crm: 'Kommo', responsible: 'Vinicius Agnes', status: 'Operação ativa', health: 83, color: '#f05a28', accent: '#ffad42', mascot: 'TO',
      metrics: { revenue: 267500, revenueTarget: 350000, leads: 2110, cpl: 18.4, roas: 6.1, investment: 43852, mql: 184, sql: 91, opportunities: 64, sales: 38, ticket: 7039, ctr: 3.4, conversion: 8.7 },
      goals: { revenue: 350000, leads: 2400, mqlRate: 10, cac: 750, roas: 5.5 },
      lps: [ { id: 'lp-to-01', name: 'LP - Curso Gestor de Tráfego', url: 'https://cliente.com/curso', status: 'Ativo', speed: 89, conversion: 8.9 }, { id: 'lp-to-02', name: 'LP - Mentoria', url: 'https://cliente.com/mentoria', status: 'Ativo', speed: 92, conversion: 9.1 } ]
    },
    {
      id: 'seg-eletronic', name: 'Seg Eletronic', initials: 'SE', groupId: '120363427075801557', segment: 'Segurança eletrônica', crm: 'Kommo', responsible: 'Vinicius Agnes', status: 'Operação ativa', health: 72, color: '#d21620', accent: '#ff5360', mascot: 'SE',
      metrics: { revenue: 101700, revenueTarget: 180000, leads: 635, cpl: 46.12, roas: 3.2, investment: 31781, mql: 42, sql: 25, opportunities: 18, sales: 8, ticket: 12712, ctr: 1.9, conversion: 6.6 },
      goals: { revenue: 180000, leads: 850, mqlRate: 8.5, cac: 1050, roas: 3.8 },
      lps: [ { id: 'lp-se-01', name: 'LP - Segurança Empresarial', url: 'https://cliente.com/seg', status: 'Atenção', speed: 67, conversion: 3.7 } ]
    },
    {
      id: 'espaco-master', name: 'Espaço Master', initials: 'EM', groupId: '120363424198629431', segment: 'Educação / espaço profissional', crm: 'Kommo', responsible: 'Vinicius Agnes', status: 'Operação ativa', health: 77, color: '#8f2bd6', accent: '#c47cff', mascot: 'EM',
      metrics: { revenue: 149300, revenueTarget: 230000, leads: 998, cpl: 29.94, roas: 4.01, investment: 37232, mql: 74, sql: 39, opportunities: 29, sales: 13, ticket: 11484, ctr: 2.7, conversion: 7.4 },
      goals: { revenue: 230000, leads: 1200, mqlRate: 9, cac: 900, roas: 4.3 },
      lps: [ { id: 'lp-em-01', name: 'LP - Espaço Master', url: 'https://cliente.com/espaco', status: 'Ativo', speed: 84, conversion: 5.4 } ]
    },
    {
      id: 'st1-internet', name: 'ST1 Internet', initials: 'ST', groupId: '120363403300629023', segment: 'Internet / telecom', crm: 'Kommo', responsible: 'Vinicius Agnes', status: 'Monitoramento', health: 70, color: '#1b78ff', accent: '#70c0ff', mascot: 'ST',
      crmSheet: {
        type: 'googleSheetsCsv',
        spreadsheetId: '1BurqRDqYbWq8dPVxXiKjWH6WmfBNoe39AymwJM8LpFA',
        url: 'https://docs.google.com/spreadsheets/d/1BurqRDqYbWq8dPVxXiKjWH6WmfBNoe39AymwJM8LpFA/edit?gid=1699545222#gid=1699545222',
        sheetName: 'BASE_CRM',
        dashboardSheetName: 'DASH_CRM',
        gid: '1699545222',
        proxyUrl: '',
        status: 'Configurado',
        lastSync: 'Aguardando primeira sincronização'
      },
      performanceSheets: {
        type: 'googleSheetsCsv',
        spreadsheetId: '1BurqRDqYbWq8dPVxXiKjWH6WmfBNoe39AymwJM8LpFA',
        url: 'https://docs.google.com/spreadsheets/d/1BurqRDqYbWq8dPVxXiKjWH6WmfBNoe39AymwJM8LpFA/edit',
        monthlySheetName: '1.0 Mensal',
        weeklySheetName: '2.0 Semanal',
        monthlyGid: '1980055319',
        weeklyGid: '85034568',
        metaRawSheetName: 'bd Meta Ads',
        googleRawSheetName: 'bd Google Ads ',
        proxyUrl: '',
        status: 'Configurado',
        lastSync: 'Aguardando primeira sincronização'
      },
      metrics: { revenue: 93400, revenueTarget: 160000, leads: 772, cpl: 23.1, roas: 3.7, investment: 25243, mql: 51, sql: 26, opportunities: 20, sales: 9, ticket: 10378, ctr: 2.9, conversion: 6.6 },
      goals: { revenue: 160000, leads: 1000, mqlRate: 8, cac: 850, roas: 4 },
      lps: [ { id: 'lp-st-01', name: 'LP - Internet Fibra', url: 'https://cliente.com/fibra', status: 'Ativo', speed: 81, conversion: 5.0 } ]
    },
    {
      id: 'sindihoteleiros', name: 'SindiHoteleiros', initials: 'SH', groupId: '120363372501205454', segment: 'Sindicato / institucional', crm: 'Kommo', responsible: 'Vinicius Agnes', status: 'Setup inicial', health: 65, color: '#607d8b', accent: '#a1bbc6', mascot: 'SH',
      metrics: { revenue: 74400, revenueTarget: 140000, leads: 482, cpl: 39.9, roas: 2.9, investment: 25655, mql: 33, sql: 18, opportunities: 12, sales: 5, ticket: 14880, ctr: 1.7, conversion: 6.8 },
      goals: { revenue: 140000, leads: 700, mqlRate: 8, cac: 1200, roas: 3.5 },
      lps: [ { id: 'lp-sh-01', name: 'LP - Associados', url: 'https://cliente.com/sindi', status: 'Atenção', speed: 69, conversion: 3.5 } ]
    }
  ],
  pixels: [
    { id: 'px-1', clientId: 'yousafer', name: 'Meta Pixel', platform: 'Meta', status: 'Ativo', events: 7, lastEvent: 'Lead há 4 min' },
    { id: 'px-2', clientId: 'yousafer', name: 'Google Ads Conversion', platform: 'Google', status: 'Ativo', events: 5, lastEvent: 'Form Submit há 11 min' },
    { id: 'px-3', clientId: 'treinando-online', name: 'Meta Pixel Curso', platform: 'Meta', status: 'Ativo', events: 9, lastEvent: 'Purchase há 8 min' },
    { id: 'px-4', clientId: 'alphaville', name: 'GTM Principal', platform: 'Google Tag Manager', status: 'Ativo', events: 6, lastEvent: 'Lead há 12 min' }
  ],
  competitors: [
    { id: 'co-1', clientId: 'yousafer', name: 'Alice Saúde', domain: 'alice.com.br', traffic: 182000, keywords: 11400, authority: 44, paidKeywords: 612, gap: 'Telemedicina empresarial', status: 'Monitorando' },
    { id: 'co-2', clientId: 'yousafer', name: 'Conexa Saúde', domain: 'conexasaude.com.br', traffic: 94000, keywords: 7900, authority: 39, paidKeywords: 410, gap: 'Convênio saúde PJ', status: 'Monitorando' },
    { id: 'co-3', clientId: 'treinando-online', name: 'Concorrente Curso A', domain: 'cursoa.com.br', traffic: 156000, keywords: 12800, authority: 42, paidKeywords: 800, gap: 'Gestor de tráfego iniciante', status: 'Monitorando' }
  ],
  campaigns: [
    { id: 'ca-1', clientId: 'yousafer', name: '[YS] Search - Telemedicina', channel: 'Google Ads', investment: 8450, leads: 187, cpl: 45.19, roas: 3.12, status: 'Atenção' },
    { id: 'ca-2', clientId: 'yousafer', name: '[YS] Meta - Benefícios', channel: 'Meta Ads', investment: 12320, leads: 512, cpl: 24.06, roas: 4.81, status: 'Ativo' },
    { id: 'ca-3', clientId: 'yousafer', name: '[YS] Remarketing', channel: 'Meta Ads', investment: 7840, leads: 324, cpl: 24.2, roas: 5.21, status: 'Ativo' },
    { id: 'ca-4', clientId: 'treinando-online', name: '[TO] Curso Gestor de Tráfego', channel: 'Meta Ads', investment: 15420, leads: 916, cpl: 16.83, roas: 6.8, status: 'Ativo' },
    { id: 'ca-5', clientId: 'alphaville', name: '[AL] Captação Premium', channel: 'Google Ads', investment: 11080, leads: 211, cpl: 52.51, roas: 4.2, status: 'Ativo' }
  ],
  creatives: [
    { id: 'cr-1', clientId: 'yousafer', name: 'Vídeo - Dor RH', format: 'Reels', ctr: 3.4, cpl: 22.9, status: 'Campeão' },
    { id: 'cr-2', clientId: 'yousafer', name: 'Imagem - Benefícios PJ', format: 'Feed', ctr: 2.1, cpl: 31.4, status: 'Teste' },
    { id: 'cr-3', clientId: 'treinando-online', name: 'Criativo Curso VSL', format: 'Stories', ctr: 4.2, cpl: 14.2, status: 'Campeão' }
  ],
  tasks: [
    { id: 'tk-1', clientId: 'yousafer', title: 'Subir assets reais do mascote/logo', status: 'Backlog', owner: 'Design', type: 'Design', priority: 'Alta', start: '2026-05-16', end: '2026-05-18', progress: 20 },
    { id: 'tk-2', clientId: 'yousafer', title: 'Mapear campos obrigatórios do CRM Moskit', status: 'Backlog', owner: 'Ops', type: 'Dados', priority: 'Alta', start: '2026-05-17', end: '2026-05-20', progress: 10 },
    { id: 'tk-3', clientId: 'yousafer', title: 'Conectar fonte de mídia paga via N8N', status: 'Em execução', owner: 'Dados', type: 'API', priority: 'Alta', start: '2026-05-18', end: '2026-05-23', progress: 45 },
    { id: 'tk-4', clientId: 'yousafer', title: 'Validar metas do mês', status: 'Validação', owner: 'Vinicius Agnes', type: 'Gestão', priority: 'Média', start: '2026-05-20', end: '2026-05-24', progress: 70 },
    { id: 'tk-5', clientId: 'yousafer', title: 'Criar estrutura base do cliente', status: 'Concluído', owner: 'V4', type: 'Setup', priority: 'Alta', start: '2026-05-15', end: '2026-05-16', progress: 100 }
  ],
  actionPlan: [
    { id: 'ap-1', clientId: 'yousafer', what: 'Revisar segmentação das campanhas', why: 'Aumentar a qualidade dos leads e taxa Lead -> MQL', where: 'Meta e Google Ads', when: 'Semana atual', who: 'Gestor de Tráfego', how: 'Separar grupos por intenção e ajustar públicos', status: 'Em execução' },
    { id: 'ap-2', clientId: 'yousafer', what: 'Implementar filtro de qualificação no WhatsApp', why: 'Evitar entrada de lead sem perfil', where: 'Evolution + CRM', when: 'Próximos 7 dias', who: 'Ops + Comercial', how: 'Criar perguntas de orçamento, urgência e perfil', status: 'Backlog' },
    { id: 'ap-3', clientId: 'yousafer', what: 'Auditar eventos de conversão', why: 'Garantir rastreabilidade ponta a ponta', where: 'GTM / Pixel / CRM', when: '48h', who: 'Dados', how: 'Testar eventos Lead, MQL, SQL e Venda', status: 'Validação' }
  ],
  events: [
    { id: 'ev-1', type: 'sync', text: 'Integração com Moskit sincronizada', time: 'há 8 min' },
    { id: 'ev-2', type: 'lead', text: 'Novo lead capturado via LP - Telemedicina', time: 'há 12 min' },
    { id: 'ev-3', type: 'sale', text: 'Venda registrada: R$ 10.895,00', time: 'há 24 min' },
    { id: 'ev-4', type: 'alert', text: 'Campanha [YS] Search com CPL acima da meta', time: 'há 1 h' },
    { id: 'ev-5', type: 'lp', text: 'LP - Benefícios Corporativos publicada', time: 'há 2 h' }
  ],
  alerts: [
    { id: 'al-1', level: 'ok', text: 'Todos os sistemas críticos operando', detail: 'Última verificação: há 5 min' },
    { id: 'al-2', level: 'warning', text: '2 campanhas com CTR abaixo do ideal', detail: 'Verifique Search e Remarketing' },
    { id: 'al-3', level: 'warning', text: 'CPL acima da meta em 1 campanha', detail: 'Campanha [YS] Search | CPL atual: R$ 45,19' },
    { id: 'al-4', level: 'ok', text: 'Integrações funcionando corretamente', detail: 'N8N, CRM, Evolution e Drive ativos' }
  ]
};
