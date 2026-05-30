(function () {
  const BLOCKS = [
    { key: 'crm_funil', label: 'CRM & Funil', aliases: ['BASE_CRM', 'BASE DO CRM', 'DASH_CRM'], preferred: ['BASE_CRM', 'BASE DO CRM', 'DASH_CRM'], description: 'Base do CRM, funil, etapas e oportunidades.' },
    { key: 'fca', label: 'FCA', aliases: ['BASE_CRM', 'BASE DO CRM', 'DASH_CRM', 'Chart1 Distribuição Percentual', '[Chart1] Distribuição Percentual dos Motivos de Perda'], preferred: ['[Chart1] Distribuição Percentual dos Motivos de Perda', 'Chart1 Distribuição Percentual', 'DASH_CRM', 'BASE_CRM', 'BASE DO CRM'], description: 'FCA continua priorizando a planilha oficial e pode apoiar com CRM/motivos de perda.' },
    { key: 'leads_lp', label: 'Leads / LPs', aliases: ['bd Leads LP'], preferred: ['bd Leads LP'], description: 'Leads vindos de landing pages.' },
    { key: 'meta_ads', label: 'Meta Ads', aliases: ['bd Meta Ads'], preferred: ['bd Meta Ads'], description: 'Base bruta de Meta Ads.' },
    { key: 'google_ads', label: 'Google Ads', aliases: ['bd Google Ads'], preferred: ['bd Google Ads'], description: 'Base bruta de Google Ads.' },
    { key: 'analytics', label: 'Analytics', aliases: ['bd Analytics'], preferred: ['bd Analytics'], description: 'Dados de analytics e comportamento.' },
    { key: 'performance_mensal', label: 'Performance Mensal', aliases: ['1.0 Mensal', '1,0 Mensal'], preferred: ['1.0 Mensal', '1,0 Mensal'], description: 'Visão mensal da GrowthPack.' },
    { key: 'performance_semanal', label: 'Performance Semanal', aliases: ['2.0 Semanal'], preferred: ['2.0 Semanal'], description: 'Visão semanal da GrowthPack.' },
    { key: 'performance_diaria', label: 'Performance Diária', aliases: ['3.0 Diario', '3.0 Diário'], preferred: ['3.0 Diario', '3.0 Diário'], description: 'Visão diária da GrowthPack.' },
    { key: 'projecoes', label: 'Projeções', aliases: ['3.0 Projeção Cenários', '3.0 Projecao Cenarios'], preferred: ['3.0 Projeção Cenários', '3.0 Projecao Cenarios'], description: 'Cenários e projeções.' },
    { key: 'dre_financeiro', label: 'Financeiro / DRE', aliases: ['DRE projetado', 'Config DRE', 'CAC | MC | Breakeven', '💵 DRE projetado', '⚙️ Config DRE'], preferred: ['💵 DRE projetado', 'DRE projetado', 'CAC | MC | Breakeven', '⚙️ Config DRE', 'Config DRE'], description: 'DRE, CAC, margem e breakeven.' },
    { key: 'produtos', label: 'Produtos', aliases: ['PRODUTOS'], preferred: ['PRODUTOS'], description: 'Produtos/serviços cadastrados.' },
    { key: 'config_tecnica', label: 'Config Técnica', aliases: ['API_CONFIG', 'API_STATUS', 'Acessos e Senhas'], preferred: ['API_STATUS', 'API_CONFIG', 'Acessos e Senhas'], description: 'Status técnico, configuração e acessos.' }
  ];

  const BLOCK_BY_KEY = BLOCKS.reduce((acc, block) => {
    acc[block.key] = block;
    return acc;
  }, {});

  function normalize(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[💵⚙️\[\]()/|_-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function sourceName(source) {
    return String(source?.sheet_name || source?.source_name || source?.name || '').trim();
  }

  function matchesAlias(source, alias) {
    const src = normalize(sourceName(source));
    const ali = normalize(alias);
    return src === ali || src.includes(ali) || ali.includes(src);
  }

  function blockKeysForSource(source) {
    return BLOCKS.filter((block) => block.aliases.some((alias) => matchesAlias(source, alias))).map((block) => block.key);
  }

  function enrichSource(source) {
    const blockKeys = blockKeysForSource(source);
    return {
      ...source,
      block_keys: blockKeys,
      block_labels: blockKeys.map((key) => BLOCK_BY_KEY[key]?.label).filter(Boolean)
    };
  }

  function sourceMatchesBlock(source, blockKey) {
    if (!blockKey) return true;
    const block = BLOCK_BY_KEY[blockKey];
    if (!block) return false;
    return block.aliases.some((alias) => matchesAlias(source, alias));
  }

  function sourceMatchesSearch(source, search) {
    if (!search) return true;
    const haystack = normalize([
      source.client_name,
      source.source_name,
      source.sheet_name,
      source.spreadsheet_id,
      source.gid,
      (source.block_labels || []).join(' ')
    ].join(' '));
    return normalize(search).split(' ').filter(Boolean).every((token) => haystack.includes(token));
  }

  function defaultSort(a, b) {
    return String(a.client_name || '').localeCompare(String(b.client_name || ''), 'pt-BR') || String(sourceName(a)).localeCompare(String(sourceName(b)), 'pt-BR');
  }

  function sortSourcesForBlock(sources, blockKey) {
    if (!blockKey || !BLOCK_BY_KEY[blockKey]) return sources.slice().sort(defaultSort);
    const preferred = BLOCK_BY_KEY[blockKey].preferred || [];
    return sources.slice().sort((a, b) => {
      const aIndex = preferred.findIndex((alias) => matchesAlias(a, alias));
      const bIndex = preferred.findIndex((alias) => matchesAlias(b, alias));
      const aa = aIndex === -1 ? 999 : aIndex;
      const bb = bIndex === -1 ? 999 : bIndex;
      if (aa !== bb) return aa - bb;
      return defaultSort(a, b);
    });
  }

  function filterSources(sources, filters = {}) {
    return sortSourcesForBlock((sources || [])
      .map(enrichSource)
      .filter((source) => !filters.clientId || source.client_id === filters.clientId)
      .filter((source) => sourceMatchesBlock(source, filters.blockKey))
      .filter((source) => sourceMatchesSearch(source, filters.search)), filters.blockKey);
  }

  async function loadSources(filters = {}) {
    if (!window.V4_DRIVE_LIVE) throw new Error('Drive Live não carregado.');
    const payload = await window.V4_DRIVE_LIVE.panelSources(filters.clientId || '');
    const filtered = filterSources(payload.data || [], filters);
    return {
      ok: true,
      data: filtered,
      raw_count: (payload.data || []).length,
      filtered_count: filtered.length,
      filters
    };
  }

  async function readSource(sourceId, options = {}) {
    if (!window.V4_DRIVE_LIVE) throw new Error('Drive Live não carregado.');
    return window.V4_DRIVE_LIVE.readSource(sourceId, options);
  }

  async function readBlock(clientId, blockKey, options = {}) {
    const payload = await loadSources({ clientId, blockKey, search: options.search || '' });
    const source = payload.data[0];
    if (!source) throw new Error(`Nenhuma fonte encontrada para o bloco ${blockKey} neste cliente.`);
    const data = await readSource(source.source_id, options);
    return { ...data, source, block: BLOCK_BY_KEY[blockKey] || null };
  }

  async function readFcaSupport(clientId, options = {}) {
    return readBlock(clientId, 'fca', options);
  }

  function autoLoadFilterPatch() {
    if (document.querySelector('script[data-drive-live-filter-patch]')) return;
    const script = document.createElement('script');
    script.src = 'src/services/drive-live-filter-patch.js?v=drive-live-filter-patch-20260530-02';
    script.dataset.driveLiveFilterPatch = 'true';
    script.defer = true;
    script.onload = () => window.V4_BOOT_LOG && window.V4_BOOT_LOG('growthpack_blocks', 'Patch de filtros Drive Live carregado.');
    script.onerror = () => window.V4_BOOT_LOG && window.V4_BOOT_LOG('growthpack_blocks_error', 'Falha ao carregar patch de filtros Drive Live.');
    document.head.appendChild(script);
  }

  window.V4_GROWTHPACK_BLOCK_ROUTER = {
    blocks: BLOCKS,
    blockByKey: BLOCK_BY_KEY,
    normalize,
    enrichSource,
    filterSources,
    loadSources,
    readSource,
    readBlock,
    readFcaSupport,
    storesRowsInSupabase: false
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', autoLoadFilterPatch);
  else autoLoadFilterPatch();

  if (window.V4_BOOT_LOG) window.V4_BOOT_LOG('growthpack_blocks', 'Roteador de blocos GrowthPack carregado.');
})();
