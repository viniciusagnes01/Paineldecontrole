// Configuracao oficial eKyte por cliente
(function () {
  const STORAGE_KEY = 'v4-command-center-state-v6-crm-performance-losses';

  window.V4_EKYTE_CLIENTS = [
    {
      id: 'alphaville',
      name: 'Alphaville',
      idWorkspaceEkyte: 126365,
      idProjetoEkyte: 291862,
      idTipoTarefaEkyte: 55820,
      idTaskModeloEkyte: 8851196,
      executorIdEkyte: '782e3f64-e027-4eff-8d6c-716cf76c1532',
      groupId: '120363257134796140',
      nicho: 'Fechamento de sacadas',
      palavrasChaveDrive: ['Alphaville', 'fechamento de sacadas', 'sacadas'],
      pastaIconeFolderId: '1lG21qv4S7LCWhHe7gBw73NPlDSJ4m-yi',
      planilhaOficial: 'https://docs.google.com/spreadsheets/d/1CtfFiB0q2B72Cwb9VjTkv8gZHYtBv2keICwBNj7Z0ws/edit?gid=833926654',
      ekyte: { companyId: '7773', workspaceId: 126365, projectId: 291862, taskScope: 'project' }
    },
    {
      id: 'yousafer',
      name: 'YouSafer',
      idWorkspaceEkyte: 72535,
      idProjetoEkyte: 291857,
      idTipoTarefaEkyte: 55820,
      idTaskModeloEkyte: 8851196,
      executorIdEkyte: '782e3f64-e027-4eff-8d6c-716cf76c1532',
      groupId: '120363299569409896',
      nicho: 'SVA de saúde para provedores',
      palavrasChaveDrive: ['YouSafer', 'SVA', 'provedores', 'Abramulti'],
      pastaIconeFolderId: '1Iz2nt_MwESsFCeAZD6z9IjQ8fz45iRmY',
      planilhaOficial: 'https://docs.google.com/spreadsheets/d/1KLxctUK2ZGaM7jm1y2zj-StwLTgV6qP0PL1a-ZEnMmo/edit?gid=316084875',
      ekyte: { companyId: '7773', workspaceId: 72535, projectId: 291857, taskScope: 'project' }
    },
    {
      id: 'prime',
      name: 'Prime',
      idWorkspaceEkyte: 106839,
      idProjetoEkyte: 291839,
      idTipoTarefaEkyte: 55820,
      idTaskModeloEkyte: 8851196,
      executorIdEkyte: '782e3f64-e027-4eff-8d6c-716cf76c1532',
      groupId: '120363418609215409',
      nicho: 'Oficina mecânica',
      palavrasChaveDrive: ['Prime Mecânica', 'oficina', 'freios', 'automotivo'],
      pastaIconeFolderId: '1ynLKciynIzr7gVtgiq3fy5IoTranCFAn',
      planilhaOficial: 'https://docs.google.com/spreadsheets/d/1h6-xdgyekZrNLZ4luZU61S0hzh0Z-HLAZR7qCm8NQG8/edit?gid=1986904416',
      ekyte: { companyId: '7773', workspaceId: 106839, projectId: 291839, taskScope: 'project' }
    },
    {
      id: 'multimed',
      name: 'MultiMed',
      idWorkspaceEkyte: 124293,
      idProjetoEkyte: 287299,
      idTipoTarefaEkyte: 55820,
      idTaskModeloEkyte: 8851196,
      executorIdEkyte: '782e3f64-e027-4eff-8d6c-716cf76c1532',
      groupId: '120363423606250960',
      nicho: 'Laboratório e exames',
      palavrasChaveDrive: ['MultiMed', 'exames', 'laboratório', 'saúde'],
      pastaIconeFolderId: '1H5kekxtbt-67S4K_ZB9ip_Qag6h9GupB',
      planilhaOficial: 'https://docs.google.com/spreadsheets/d/1h4obelICw7z1rbYNaEdkbrCH-qYUhFttzW3SopNxodg/edit',
      ekyte: { companyId: '7773', workspaceId: 124293, projectId: 287299, taskScope: 'project' }
    },
    {
      id: 'seg-eletronic',
      name: 'Seg Eletronic',
      idWorkspaceEkyte: 125773,
      idProjetoEkyte: 273483,
      idTipoTarefaEkyte: 55820,
      idTaskModeloEkyte: 8851196,
      executorIdEkyte: '782e3f64-e027-4eff-8d6c-716cf76c1532',
      groupId: '120363427075801557',
      nicho: 'Segurança eletrônica',
      palavrasChaveDrive: ['Seg Eletronic', 'câmera', 'segurança', 'diagnóstico'],
      pastaIconeFolderId: '1naqEp5-RMWz7XEvsl50T5jpG2ecNDMDW',
      planilhaOficial: 'https://docs.google.com/spreadsheets/d/1-CSmqLVLbfwVuVxkez4Q38fSTkVzyGOudUmj_GIxHAc/edit?gid=1929982003',
      ekyte: { companyId: '7773', workspaceId: 125773, projectId: 273483, taskScope: 'project' }
    },
    {
      id: 'espaco-master',
      name: 'Espaço Master',
      idWorkspaceEkyte: 131114,
      idProjetoEkyte: 276870,
      idTipoTarefaEkyte: 55820,
      idTaskModeloEkyte: 8851196,
      executorIdEkyte: '782e3f64-e027-4eff-8d6c-716cf76c1532',
      groupId: '120363424198629431',
      nicho: 'Residencial sênior',
      palavrasChaveDrive: ['Espaço Master', 'idosos', 'residencial sênior'],
      pastaIconeFolderId: '1tQgluKulSRjbMB6p0iZbUQ4x6UsDeiCC',
      planilhaOficial: 'https://docs.google.com/spreadsheets/d/19-VWUfoJD27KxlFEn8uvoDVTKkahT7CSLlVoZD5-VUQ/edit?gid=1733941213',
      ekyte: { companyId: '7773', workspaceId: 131114, projectId: 276870, taskScope: 'project' }
    },
    {
      id: 'st1-internet',
      name: 'ST1 Internet',
      idWorkspaceEkyte: 127063,
      idProjetoEkyte: 273637,
      idTipoTarefaEkyte: 55820,
      idTaskModeloEkyte: 8851196,
      executorIdEkyte: '782e3f64-e027-4eff-8d6c-716cf76c1532',
      groupId: '120363403300629023',
      nicho: 'Provedor de internet',
      palavrasChaveDrive: ['ST1 Internet', 'internet', 'telecom'],
      pastaIconeFolderId: '1IOElrGUmuVZ37Rqr443lGHdKiJIuVMxw',
      planilhaOficial: 'https://docs.google.com/spreadsheets/d/1BurqRDqYbWq8dPVxXiKjWH6WmfBNoe39AymwJM8LpFA/edit?gid=1699545222',
      ekyte: { companyId: '7773', workspaceId: 127063, projectId: 273637, taskScope: 'project' }
    },
    {
      id: 'sindihoteleiros-cuidar-on',
      aliases: ['sindi-hoteleiros', 'sindihoteleiros'],
      name: 'SindiHoteleiros',
      idWorkspaceEkyte: 87694,
      idProjetoEkyte: 165830,
      idTipoTarefaEkyte: 55820,
      idTaskModeloEkyte: 8851196,
      executorIdEkyte: '782e3f64-e027-4eff-8d6c-716cf76c1532',
      groupId: '120363372501205454',
      nicho: 'Sindicato + benefício de saúde',
      palavrasChaveDrive: ['SindiHoteleiros', 'Cuidar On', 'hotéis', 'saúde'],
      pastaIconeFolderId: '17q8l0y5OhxL5qBtbv3RzyDUUVSL9nAPy',
      planilhaOficial: '',
      ekyte: { companyId: '7773', workspaceId: 87694, projectId: 165830, taskScope: 'project' }
    }
  ];

  window.V4_EKYTE_CLIENT_BINDINGS = window.V4_EKYTE_CLIENTS.reduce((acc, client) => {
    acc[client.id] = client;
    (client.aliases || []).forEach((alias) => { acc[alias] = client; });
    return acc;
  }, {});

  window.V4_DRIVE_BRANDING_CONFIG = {
    alphaville: { folderId: '1lG21qv4S7LCWhHe7gBw73NPlDSJ4m-yi', imagemPrincipal: 'logo' },
    yousafer: { folderId: '1Iz2nt_MwESsFCeAZD6z9IjQ8fz45iRmY', imagemPrincipal: 'logo' },
    prime: { folderId: '1ynLKciynIzr7gVtgiq3fy5IoTranCFAn', imagemPrincipal: 'logo' },
    multimed: { folderId: '1H5kekxtbt-67S4K_ZB9ip_Qag6h9GupB', imagemPrincipal: 'logo' },
    'seg-eletronic': { folderId: '1naqEp5-RMWz7XEvsl50T5jpG2ecNDMDW', imagemPrincipal: 'logo' },
    'espaco-master': { folderId: '1tQgluKulSRjbMB6p0iZbUQ4x6UsDeiCC', imagemPrincipal: 'logo' },
    'st1-internet': { folderId: '1IOElrGUmuVZ37Rqr443lGHdKiJIuVMxw', imagemPrincipal: 'logo' },
    'sindihoteleiros-cuidar-on': { folderId: '17q8l0y5OhxL5qBtbv3RzyDUUVSL9nAPy', imagemPrincipal: 'logo' }
  };

  function getEkyteConfig(clientId) {
    return window.V4_EKYTE_CLIENT_BINDINGS?.[clientId] || null;
  }

  function getDriveBrandingConfig(clientId) {
    return window.V4_DRIVE_BRANDING_CONFIG?.[clientId] || null;
  }

  function decorateClient(client) {
    const binding = getEkyteConfig(client?.id);
    if (!binding) return client;
    client.ekyte = {
      ...(client.ekyte || {}),
      companyId: binding.ekyte.companyId,
      workspaceId: binding.idWorkspaceEkyte,
      projectId: binding.idProjetoEkyte,
      taskScope: 'project',
      status: 'Projeto eKyte vinculado'
    };
    client.idWorkspaceEkyte = binding.idWorkspaceEkyte;
    client.idProjetoEkyte = binding.idProjetoEkyte;
    client.integrations = {
      ...(client.integrations || {}),
      ekyte: {
        companyId: binding.ekyte.companyId,
        workspaceId: binding.idWorkspaceEkyte,
        projectId: binding.idProjetoEkyte,
        status: 'Vinculado por cliente/projeto'
      }
    };
    return client;
  }

  function decorateState(state) {
    if (!state || !Array.isArray(state.clients)) return state;
    state.clients.forEach(decorateClient);
    state.settings = {
      ...(state.settings || {}),
      ekyteTaskScope: 'client_project',
      ekyteBindingsVersion: '20260530-01'
    };
    return state;
  }

  try {
    if (window.V4_SEED) decorateState(window.V4_SEED);
    if (Array.isArray(window.V4_OFFICIAL_ACTIVE_CLIENTS)) window.V4_OFFICIAL_ACTIVE_CLIENTS.forEach(decorateClient);
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) localStorage.setItem(STORAGE_KEY, JSON.stringify(decorateState(JSON.parse(raw))));
  } catch (error) {
    console.warn('[EkyteClientConfig]', error);
  }

  window.getEkyteConfig = getEkyteConfig;
  window.getDriveBrandingConfig = getDriveBrandingConfig;
})();
