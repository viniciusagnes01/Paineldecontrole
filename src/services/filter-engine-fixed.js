// Motor de filtro reparado e melhorado
(function () {
  const STORAGE_KEY = 'v4-command-center-state-v6-crm-performance-losses';
  const FILTER_STORAGE_PREFIX = 'v4-crm-panel-filters';
  const SOURCES = ['Geral', 'Meta Ads', 'Google Ads', 'Orgânico'];

  // ==================== LEITURA/ESCRITA ====================
  function readState() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch (error) {
      console.warn('[Filter Engine] Erro ao ler state:', error);
      return {};
    }
  }

  function writeState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn('[Filter Engine] Erro ao salvar state:', error);
    }
  }

  // ==================== HELPER FUNCTIONS ====================
  function currentClientId() {
    return document.querySelector('.client-btn.active')?.dataset?.client || null;
  }

  function currentClientName() {
    const active = document.querySelector('.client-btn.active');
    return active?.querySelector('.client-name')?.textContent?.trim() || 'Cliente';
  }

  function parseDateInput(value, endOfDay = false) {
    const raw = String(value || '').trim();
    if (!raw) return null;
    const parts = raw.split('-').map(Number);
    if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    if (endOfDay) {
      date.setHours(23, 59, 59, 999);
    } else {
      date.setHours(0, 0, 0, 0);
    }
    return date;
  }

  function toDateInput(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function fmtNumber(value) {
    return Number(value || 0).toLocaleString('pt-BR');
  }

  function fmtCurrency(value) {
    return Number(value || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  function pct(value) {
    return `${Number(value || 0).toFixed(1).replace('.', ',')}%`;
  }

  function escapeHtml(value) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    };
    return String(value ?? '').replace(/[&<>'"]/g, (char) => map[char]);
  }

  // ==================== SNAPSHOT BUILDING ====================
  function emptySnapshot(label) {
    return {
      label,
      value: 0,
      lead: 0,
      mql: 0,
      sql: 0,
      opportunity: 0,
      purchase: 0,
      lost: 0,
      meta: 0,
      google: 0
    };
  }

  function addToSnapshot(target, record) {
    target.value += Number(record.value || 0);
    target.lead += Number(record.lead || 0);
    target.mql += Number(record.mql || 0);
    target.sql += Number(record.sql || 0);
    target.opportunity += Number(record.opportunity || 0);
    target.purchase += Number(record.purchase || 0);
    target.lost += Number(record.lost || 0);
    target.meta += Number(record.meta || 0);
    target.google += Number(record.google || 0);
  }

  function calculateRates(snapshot) {
    return {
      leadToMql: snapshot.lead ? (snapshot.mql / snapshot.lead) * 100 : 0,
      mqlToSql: snapshot.mql ? (snapshot.sql / snapshot.mql) * 100 : 0,
      sqlToOpportunity: snapshot.sql ? (snapshot.opportunity / snapshot.sql) * 100 : 0,
      opportunityToSale: snapshot.opportunity ? (snapshot.purchase / snapshot.opportunity) * 100 : 0,
      saleRate: snapshot.lead ? (snapshot.purchase / snapshot.lead) * 100 : 0,
      lossRate: snapshot.lead ? (snapshot.lost / snapshot.lead) * 100 : 0,
      ticket: snapshot.purchase ? snapshot.value / snapshot.purchase : 0
    };
  }

  // ==================== FILTER APPLICATION ====================
  function buildFilteredSnapshot(snapshot, filters) {
    if (!snapshot?.rawRecords || !Array.isArray(snapshot.rawRecords)) {
      console.warn('[Filter Engine] Snapshot sem rawRecords', snapshot);
      return snapshot || { rows: 0, totals: emptySnapshot('Geral'), rates: calculateRates(emptySnapshot('Geral')), sourceFunnels: {} };
    }

    const startDate = parseDateInput(filters.start, false);
    const endDate = parseDateInput(filters.end, true);
    const rawRecords = snapshot.rawRecords;

    // Filtrar por data
    const filteredRecords = rawRecords.filter((record) => {
      const ts = Number(record.timestamp || 0);
      if (!ts || ts === 0) return false;
      if (startDate && ts < startDate.getTime()) return false;
      if (endDate && ts > endDate.getTime()) return false;
      return true;
    });

    // Agregar por fonte
    const bySource = {
      Geral: emptySnapshot('Geral'),
      'Meta Ads': emptySnapshot('Meta Ads'),
      'Google Ads': emptySnapshot('Google Ads'),
      'Orgânico': emptySnapshot('Orgânico')
    };

    filteredRecords.forEach((record) => {
      addToSnapshot(bySource.Geral, record);
      const source = record.source || 'Orgânico';
      if (bySource[source]) {
        addToSnapshot(bySource[source], record);
      }
    });

    // Calcular taxas
    const sourceFunnels = {};
    SOURCES.forEach((source) => {
      sourceFunnels[source] = {
        ...bySource[source],
        rates: calculateRates(bySource[source])
      };
    });

    return {
      ...snapshot,
      rows: filteredRecords.length,
      filteredRecords,
      totals: bySource.Geral,
      rates: calculateRates(bySource.Geral),
      sourceFunnels,
      activeDateRange: { ...filters }
    };
  }

  // ==================== DATE LIMITS ====================
  function getDateLimits(snapshot) {
    if (snapshot?.dateRange?.min && snapshot?.dateRange?.max) {
      return snapshot.dateRange;
    }

    if (!snapshot?.rawRecords || !Array.isArray(snapshot.rawRecords)) {
      const today = new Date().toISOString().split('T')[0];
      return { min: today, max: today };
    }

    const times = snapshot.rawRecords
      .map((record) => Number(record.timestamp || 0))
      .filter(Boolean)
      .sort((a, b) => a - b);

    if (times.length === 0) {
      const today = new Date().toISOString().split('T')[0];
      return { min: today, max: today };
    }

    return {
      min: toDateInput(times[0]),
      max: toDateInput(times[times.length - 1])
    };
  }

  // ==================== SAVED FILTERS ====================
  function getSavedFilters(clientId, snapshot) {
    const limits = getDateLimits(snapshot);
    let saved = {};

    try {
      const sessionKey = `${FILTER_STORAGE_PREFIX}-${clientId}`;
      const stored = sessionStorage.getItem(sessionKey);
      if (stored) {
        saved = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('[Filter Engine] Erro ao carregar filtros salvos:', error);
    }

    return {
      source: saved.source || 'Geral',
      start: saved.start || limits.min || '',
      end: saved.end || limits.max || ''
    };
  }

  function saveFilters(clientId, filters) {
    try {
      const sessionKey = `${FILTER_STORAGE_PREFIX}-${clientId}`;
      sessionStorage.setItem(sessionKey, JSON.stringify(filters));
    } catch (error) {
      console.warn('[Filter Engine] Erro ao salvar filtros:', error);
    }
  }

  // ==================== RENDERING ====================
  function renderFilterPanel(clientId, snapshot, filters, filtered) {
    const sourceData = filtered?.sourceFunnels?.[filters.source] || filtered?.sourceFunnels?.Geral || emptySnapshot('Geral');
    const limits = getDateLimits(snapshot);
    const hasRaw = Boolean(snapshot?.rawRecords?.length);

    return `
      <article class="glass-card span-12 crm-filter-panel" data-crm-filter-panel="true">
        <div class="crm-filter-layout">
          <div class="crm-filter-copy">
            <p class="eyebrow">Filtro do relatório CRM</p>
            <h2>${escapeHtml(currentClientName())} • período + origem</h2>
            <p class="muted">Escolha um intervalo e uma origem. O funil abaixo recalcula apenas os dados daquele período e canal.</p>
          </div>
          <form class="crm-filter-controls" data-crm-filter-form="true">
            <label>
              Data inicial
              <input
                type="date"
                name="start"
                value="${escapeHtml(filters.start)}"
                min="${escapeHtml(limits.min || '')}"
                max="${escapeHtml(limits.max || '')}"
              />
            </label>
            <label>
              Data final
              <input
                type="date"
                name="end"
                value="${escapeHtml(filters.end)}"
                min="${escapeHtml(limits.min || '')}"
                max="${escapeHtml(limits.max || '')}"
              />
            </label>
            <label>
              Origem
              <select name="source">
                ${SOURCES.map((source) => `
                  <option value="${escapeHtml(source)}" ${source === filters.source ? 'selected' : ''}>
                    ${escapeHtml(source)}
                  </option>
                `).join('')}
              </select>
            </label>
            <button class="btn primary" type="submit">Aplicar filtro</button>
            <button class="btn ghost" type="button" data-crm-filter-reset="true">Período completo</button>
          </form>
        </div>

        ${!hasRaw ? '<div class="empty" style="padding: 2rem; text-align: center;">📊 Sincronize o CRM para ativar filtros por data. Aguardando primeira sincronização...</div>' : ''}

        <div class="source-filter-grid crm-filter-summary">
          <div class="insight-card">
            <span class="badge client">Origem</span>
            <strong>${escapeHtml(filters.source)}</strong>
            <p class="muted">${fmtNumber(filtered?.rows || 0)} linhas no período.</p>
          </div>
          <div class="insight-card">
            <span class="badge ok">Receita</span>
            <strong>${fmtCurrency(sourceData.value)}</strong>
            <p class="muted">Soma de Valor.</p>
          </div>
          <div class="insight-card">
            <span class="badge client">Leads</span>
            <strong>${fmtNumber(sourceData.lead)}</strong>
            <p class="muted">MQL ${fmtNumber(sourceData.mql)} • SQL ${fmtNumber(sourceData.sql)}</p>
          </div>
          <div class="insight-card">
            <span class="badge ok">Vendas</span>
            <strong>${fmtNumber(sourceData.purchase)}</strong>
            <p class="muted">Ticket ${fmtCurrency(sourceData.rates?.ticket || 0)}</p>
          </div>
          <div class="insight-card">
            <span class="badge bad">Perdidos</span>
            <strong>${fmtNumber(sourceData.lost)}</strong>
            <p class="muted">Perda ${pct(sourceData.rates?.lossRate || 0)}</p>
          </div>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Origem</th>
                <th>Leads</th>
                <th>MQL</th>
                <th>SQL</th>
                <th>Oport.</th>
                <th>Vendas</th>
                <th>Receita</th>
                <th>Taxa venda</th>
              </tr>
            </thead>
            <tbody>
              ${SOURCES.filter((source) => source !== 'Geral')
        .map((source) => {
          const row = filtered?.sourceFunnels?.[source] || emptySnapshot(source);
          return `
                <tr>
                  <td>${escapeHtml(source)}</td>
                  <td>${fmtNumber(row.lead)}</td>
                  <td>${fmtNumber(row.mql)}</td>
                  <td>${fmtNumber(row.sql)}</td>
                  <td>${fmtNumber(row.opportunity)}</td>
                  <td>${fmtNumber(row.purchase)}</td>
                  <td>${fmtCurrency(row.value)}</td>
                  <td>${pct(row.rates?.saleRate || 0)}</td>
                </tr>
              `;
        })
        .join('')}
            </tbody>
          </table>
        </div>
      </article>
    `;
  }

  function updateFunnelDisplay(sourceData) {
    const funnel = document.querySelector('.funnel');
    if (!funnel || !sourceData) return;

    const valuesByLabel = {
      'Leads': { value: sourceData.lead, sub: fmtCurrency(sourceData.value || 0) },
      'MQLs': { value: sourceData.mql, sub: 'Qualificados' },
      'Oportunidades': { value: sourceData.opportunity, sub: 'Comercial' },
      'Vendas': { value: sourceData.purchase, sub: fmtCurrency(sourceData.rates?.ticket || 0) }
    };

    funnel.querySelectorAll('.funnel-step').forEach((step) => {
      const label = step.querySelector('small')?.textContent?.trim();
      const data = valuesByLabel[label];
      if (!data) return;

      const strong = step.querySelector('strong');
      const muted = step.querySelector('.muted');
      if (strong) strong.textContent = fmtNumber(data.value);
      if (muted) muted.textContent = data.sub;
    });
  }

  // ==================== MAIN APPLICATION LOGIC ====================
  function applyFilters() {
    const clientId = currentClientId();
    if (!clientId) return;

    const state = readState();
    const snapshot = state.crmSnapshots?.[clientId];

    if (!snapshot) {
      console.warn('[Filter Engine] Sem snapshot para cliente:', clientId);
      const panel = document.querySelector('[data-crm-filter-panel]');
      if (panel) panel.remove();
      return;
    }

    const filters = getSavedFilters(clientId, snapshot);
    const filtered = buildFilteredSnapshot(snapshot, filters);
    const sourceData = filtered?.sourceFunnels?.[filters.source] || filtered?.sourceFunnels?.Geral;

    // Atualizar state
    state.crmSnapshots[clientId] = {
      ...snapshot,
      ...filtered,
      rawRecords: snapshot.rawRecords,
      sourceLabels: snapshot.sourceLabels,
      dateRange: snapshot.dateRange
    };
    writeState(state);

    // Renderizar painel
    const panelContainer = document.querySelector('[data-crm-filter-panel]');
    const newPanel = renderFilterPanel(clientId, snapshot, filters, filtered);

    if (!panelContainer) {
      // Encontrar o melhor lugar para inserir (antes do funil)
      const funnelArticle = Array.from(document.querySelectorAll('.glass-card')).find(
        (card) => card.querySelector('.funnel') !== null
      );
      if (funnelArticle) {
        funnelArticle.insertAdjacentHTML('beforebegin', newPanel);
      } else {
        // Último recurso: inserir no final do dashboard-grid
        const grid = document.querySelector('.dashboard-grid');
        if (grid) grid.insertAdjacentHTML('afterbegin', newPanel);
      }
    } else {
      panelContainer.outerHTML = newPanel;
    }

    // Atualizar valores do funil
    updateFunnelDisplay(sourceData);
  }

  // ==================== EVENT LISTENERS ====================
  document.addEventListener('submit', (event) => {
    const form = event.target.closest('[data-crm-filter-form]');
    if (!form) return;

    event.preventDefault();
    const clientId = currentClientId();
    if (!clientId) return;

    const formData = new FormData(form);
    const filters = {
      start: formData.get('start') || '',
      end: formData.get('end') || '',
      source: formData.get('source') || 'Geral'
    };

    saveFilters(clientId, filters);
    applyFilters();
  });

  document.addEventListener('click', (event) => {
    const resetBtn = event.target.closest('[data-crm-filter-reset]');
    if (!resetBtn) return;

    const clientId = currentClientId();
    const state = readState();
    const snapshot = state.crmSnapshots?.[clientId];

    if (!clientId || !snapshot) return;

    const limits = getDateLimits(snapshot);
    const filters = {
      source: 'Geral',
      start: limits.min || '',
      end: limits.max || ''
    };

    saveFilters(clientId, filters);
    applyFilters();
  });

  // ==================== AUTO-REFRESH ====================
  function scheduleRefresh() {
    window.requestAnimationFrame(applyFilters);
  }

  document.addEventListener('DOMContentLoaded', () => {
    const main = document.getElementById('main') || document.body;
    const observer = new MutationObserver(scheduleRefresh);
    observer.observe(main, { childList: true, subtree: true });

    applyFilters();
    setTimeout(applyFilters, 700);
    setTimeout(applyFilters, 1800);
  });

  // Exportar para uso global
  window.V4_FILTER_ENGINE = {
    applyFilters,
    getSavedFilters,
    saveFilters,
    buildFilteredSnapshot,
    getDateLimits
  };
})();
