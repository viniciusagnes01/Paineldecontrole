(function () {
  window.V4_SQUADS = window.V4_SQUADS || [
    {
      id: 'black-ops',
      name: 'BLACK OPS',
      description: 'Carteira executiva, riscos, governança e visão geral da operação.',
      headEmail: 'vinicius.agnes@v4company.com',
      clientIds: ['*'],
      modules: ['*'],
      active: true
    },
    {
      id: 'growth',
      name: 'Growth',
      description: 'Operação de Growth, plano de ação, follow-up, FCA e Account Planning.',
      headEmail: 'vinicius.agnes@v4company.com',
      clientIds: [],
      modules: ['control', 'overview', 'action-plan', 'tasks', 'crm', 'fca', 'account-planning'],
      active: true
    },
    {
      id: 'operacao',
      name: 'Operação',
      description: 'Execução operacional, eKyte, tarefas, check-ins e comunicação.',
      headEmail: '',
      clientIds: [],
      modules: ['overview', 'tasks', 'action-plan', 'communication'],
      active: true
    },
    {
      id: 'performance',
      name: 'Performance',
      description: 'Mídia, campanhas, criativos, pixels, pacing e resultados.',
      headEmail: '',
      clientIds: [],
      modules: ['overview', 'media', 'reports'],
      active: true
    }
  ];

  window.V4_SQUAD_ACCESS = window.V4_SQUAD_ACCESS || {
    '*': ['black-ops']
  };

  if (window.V4_BOOT_LOG) window.V4_BOOT_LOG('rbac_squads', 'Squads base carregados.');
})();
