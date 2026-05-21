(function () {
  const STORAGE_KEY = 'v4-command-center-state-v6-crm-performance-losses';

  const ACTION_PLAN_SOURCES = {
    alphaville: [
      { title: 'Check-in Alphaville - 13/05/2026', type: 'Slides', status: 'Fallback check-in', url: 'https://docs.google.com/presentation/d/1jgtkJk-Qa1KJupbCj8KLjTdmkvnZEokewFhdfStUzsM' },
      { title: 'Diagnostico e planejamento de marketing e vendas', type: 'Slides', status: 'Planejamento', url: 'https://docs.google.com/presentation/d/1VXKR_EiLiopxEgKZRcfTwnOpuHen-rBEKbY-HrI3Kuc' }
    ],
    yousafer: [
      { title: 'Base de comunicacao YouSafer', type: 'Sheets', status: 'Base Drive', url: 'https://docs.google.com/spreadsheets/d/1Z2CMNonRYWmcX5umZkahdQ4FAEBQZDXj_QKfUWylXAU' },
      { title: 'Relatorio Mensal YouSafer - Abril', type: 'Drive file', status: 'Fallback relatorio', url: 'https://drive.google.com/file/d/1Lf_qYdm4roW1yX4JyxZt2BGSgALH41TJ' }
    ],
    prime: [
      { title: 'Base de comunicacao Prime', type: 'Drive file', status: 'Base Drive', url: 'https://drive.google.com/file/d/13Wih2KnUuqUN52jWELLK9Li6vg8KUXv6' },
      { title: 'Relatorio Mensal Prime Mecanica - Abril', type: 'Drive file', status: 'Fallback relatorio', url: 'https://drive.google.com/file/d/1LyLqHsqUgFxAv23m4xX6DCB8qcXay3bR' }
    ],
    multimed: [
      { title: 'Check-in MultiMed - 13/05/2026', type: 'Slides', status: 'Fallback check-in', url: 'https://docs.google.com/presentation/d/12ZNHE0HZaGYuoibm4cv3PvUTBQykw5hCmdPVaSuVu7g' },
      { title: 'Fluxo CRM MultiMed Kommo Autolac', type: 'Drive file', status: 'Plano operacional', url: 'https://drive.google.com/file/d/1WCDL_YiA3isenyVD8QN_m-azGUBlwPhH' }
    ],
    'treinando-online': [
      { title: 'Check-in Treinando Online - 15/05/2026', type: 'Slides', status: 'Fallback check-in', url: 'https://docs.google.com/presentation/d/1ATNGPakiQzOVZmWv80t7JcWM5q7WL6vPXjkdkWkTn-w' },
      { title: 'Plano de Acao Comercial - Gemini', type: 'Docs', status: 'Plano localizado', url: 'https://docs.google.com/document/d/1dr5qsykB8yT74au3agXDC_5wEK5xf1I7U56smlCbjPg' }
    ],
    'seg-eletronic': [
      { title: 'Check-in Seg Eletronic - 14/05/2026', type: 'Slides', status: 'Fallback check-in', url: 'https://docs.google.com/presentation/d/1_r2rZ9Ds_O_q1bFBdGrMKqc1jkA7t2DUUGBBBJYQWKk' },
      { title: 'Relatorio Mensal Seg Eletronic - Abril', type: 'Drive file', status: 'Fallback relatorio', url: 'https://drive.google.com/file/d/1y5RdUkxS834uMB6OoSvnQ_BJifufGTJA' }
    ],
    'espaco-master': [
      { title: 'Espaco Master - Plano de Acao', type: 'Slides', status: 'Plano localizado', url: 'https://docs.google.com/presentation/d/1idQsZXLpaku4sgPX8y2AJN8c62KhMRI_MEbMtYsFKY8' },
      { title: 'Espaco Master - Plano de Acao Tatico', type: 'Docs', status: 'Plano localizado', url: 'https://docs.google.com/document/d/1mpM7ui8Abp2TnWvTbAiNn2AOelKEPBeIPo7IEsth0hU' }
    ],
    'st1-internet': [
      { title: 'ST1 Internet - Plano de Acao', type: 'Docs', status: 'Plano localizado', url: 'https://docs.google.com/document/d/1rW8VQcfdSNhsVb4etyQqmJSsBCPXiEzx1pkLGDVk5FA' },
      { title: 'ST1 Internet - Plano de Acao', type: 'Slides', status: 'Plano localizado', url: 'https://docs.google.com/presentation/d/1lR9ykv1OxsVQp41IfpH6g_3D1Usz1Ev07kfDnqmJihc' }
    ],
    'sindihoteleiros-cuidar-on': [
      { title: 'Base de comunicacao SindiHoteleiros', type: 'Drive file', status: 'Base Drive', url: 'https://drive.google.com/file/d/1Hqwzj_OULGIinyK9U78QMHX81w_GkHoo' },
      { title: 'Formulario de Saude dos Clientes', type: 'Sheets', status: 'Fallback diagnostico', url: 'https://docs.google.com/spreadsheets/d/1AkmYE6EU2zUoX1PnyU5dv7EctqchCogbl2oH_0vOhHo' }
    ]
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function buildActionPlanSeed(client, source) {
    return {
      id: `drive-ap-${client.id}`,
      clientId: client.id,
      source: 'drive-action-plan',
      what: source?.status === 'Plano localizado' ? 'Revisar plano de acao do Drive' : 'Validar plano de acao para check-in quarter',
      why: 'Concentrar decisoes, pendencias e proximos passos antes da reuniao de check-in quarter.',
      where: source?.title || 'Pasta Drive do cliente',
      when: 'Check-in quarter',
      who: client.responsible || 'V4 / Account',
      how: source?.url ? `Abrir fonte oficial: ${source.url}` : 'Abrir a pasta Drive do cliente e localizar o plano atualizado.',
      status: source?.status || 'Pendente'
    };
  }

  function upsertById(list, item) {
    const rows = Array.isArray(list) ? list : [];
    const index = rows.findIndex((row) => row.id === item.id);
    if (index >= 0) rows[index] = { ...rows[index], ...item };
    else rows.push(item);
    return rows;
  }

  function applyActionPlanSources(state) {
    if (!state || !Array.isArray(state.clients)) return state;
    state.actionPlan = state.actionPlan || [];
    state.clients.forEach((client) => {
      const sources = clone(ACTION_PLAN_SOURCES[client.id] || []);
      client.actionPlanSources = sources;
      if (sources.length) state.actionPlan = upsertById(state.actionPlan, buildActionPlanSeed(client, sources[0]));
    });
    return state;
  }

  function hydrateLocalStorage() {
    try {
      const raw = window.localStorage?.getItem(STORAGE_KEY);
      if (!raw) return;
      const state = applyActionPlanSources(JSON.parse(raw));
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      window.localStorage?.removeItem(STORAGE_KEY);
    }
  }

  window.V4_ACTION_PLAN_SOURCES = ACTION_PLAN_SOURCES;
  window.V4_APPLY_ACTION_PLAN_SOURCES = applyActionPlanSources;

  applyActionPlanSources(window.V4_SEED);
  hydrateLocalStorage();
})();
