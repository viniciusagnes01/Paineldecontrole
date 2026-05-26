(function () {
  const STORAGE_KEY = 'v4-command-center-state-v6-crm-performance-losses';
  const PERIOD_KEY_PREFIX = 'v4-media-month-filter-';

  function readState() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch { return {}; }
  }

  function saveState(state) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }

  function getActiveClientId() {
    return document.querySelector('[data-client].active')?.dataset?.client || '';
  }

  function toNumber(value) {
    const number = Number(value || 0);
    return Number.isFinite(number) ? number : 0;
  }

  function hasActualMetrics(period) {
    const m = period?.metrics || {};
    return toNumber(m.investment) > 0 || toNumber(m.leads) > 0 || toNumber(m.clicks) > 0 || toNumber(m.impressions) > 0;
  }

  function isFuture2030(period) {
    const text = [period?.label, period?.start, period?.end, period?.year].join(' ');
    return /2030/.test(text);
  }

  function sanitizeBlock(block) {
    if (!block) return { current: null, periods: [], totals: {} };
    const periods = (block.periods || []).filter((period) => hasActualMetrics(period) && !isFuture2030(period));
    return {
      ...block,
      periods,
      current: periods[periods.length - 1] || null
    };
  }

  function sanitizeSnapshot(snapshot) {
    if (!snapshot) return null;
    return {
      ...snapshot,
      monthly: sanitizeBlock(snapshot.monthly),
      weekly: sanitizeBlock(snapshot.weekly)
    };
  }

  function sanitizeClientPerformance(clientId) {
    if (!clientId) return null;
    const state = readState();
    const snapshot = state.performanceSnapshots?.[clientId];
    if (!snapshot) return null;
    const clean = sanitizeSnapshot(snapshot);
    state.performanceSnapshots[clientId] = clean;
    saveState(state);
    return clean;
  }

  function fmtCurrency(value) {
    return toNumber(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function fmtNumber(value) {
    return toNumber(value).toLocaleString('pt-BR');
  }

  function pct(value) {
    return `${toNumber(value).toFixed(1).replace('.', ',')}%`;
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  }

  function getSelectedMonthlyPeriod(clientId, snapshot) {
    const periods = snapshot?.monthly?.periods || [];
    if (!periods.length) return null;
    const stored = sessionStorage.getItem(PERIOD_KEY_PREFIX + clientId);
    return periods.find((period) => period.label === stored) || periods[periods.length - 1];
  }

  function setMetricCard(title, value, subtitle) {
    const cards = Array.from(document.querySelectorAll('.metric-card'));
    const card = cards.find((item) => {
      const label = item.querySelector('.metric-top span:first-child')?.textContent?.trim().toLowerCase();
      return label === title.toLowerCase();
    });
    if (!card) return;
    const valueEl = card.querySelector('.metric-value');
    const deltaEl = card.querySelector('.metric-delta');
    if (valueEl) valueEl.textContent = value;
    if (deltaEl) deltaEl.textContent = subtitle || '';
  }

  function renderFilter(clientId, snapshot, selected) {
    const periods = snapshot?.monthly?.periods || [];
    if (!clientId || !periods.length) return;

    const title = Array.from(document.querySelectorAll('h2')).find((el) => /Mídia & Ads/i.test(el.textContent || ''));
    if (!title) return;

    let box = document.querySelector('[data-media-period-filter]');
    if (!box) {
      box = document.createElement('div');
      box.dataset.mediaPeriodFilter = 'true';
      box.style.cssText = 'display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:12px 0 4px;padding:10px 12px;border:1px solid rgba(255,255,255,.12);border-radius:14px;background:rgba(255,255,255,.04);font-weight:800;';
      title.parentElement?.insertBefore(box, title.nextSibling);
    }

    box.innerHTML = `
      <span style="color:#aeb3c2">Filtro mensal</span>
      <select data-media-period-select style="background:#111827;color:white;border:1px solid rgba(255,255,255,.18);border-radius:999px;padding:8px 12px;font-weight:900;outline:none;">
        ${periods.map((period) => `<option value="${escapeHtml(period.label)}" ${period.label === selected?.label ? 'selected' : ''}>${escapeHtml(period.label)}</option>`).join('')}
      </select>
      <span style="color:#aeb3c2">Cards e histórico usando somente a planilha mensal oficial.</span>
    `;

    const select = box.querySelector('[data-media-period-select]');
    select.onchange = function () {
      sessionStorage.setItem(PERIOD_KEY_PREFIX + clientId, select.value);
      patchMediaScreen();
    };
  }

  function patchMonthlyTable(snapshot, selected) {
    const monthlyTitle = Array.from(document.querySelectorAll('h3')).find((el) => /Mensal.*histórico consolidado/i.test(el.textContent || ''));
    if (!monthlyTitle || !selected) return;

    const article = monthlyTitle.closest('article');
    if (!article) return;
    const m = selected.metrics || {};
    const summary = article.querySelector('.mini-summary');
    if (summary) {
      summary.innerHTML = `<span class="badge ok">Atual</span><strong>${escapeHtml(selected.label)}</strong><small class="muted">Investimento ${fmtCurrency(m.investment)} • Leads ${fmtNumber(m.leads)}</small>`;
    }
  }

  function patchMediaScreen() {
    const clientId = getActiveClientId();
    if (!clientId) return;

    const snapshot = sanitizeClientPerformance(clientId);
    if (!snapshot?.monthly?.periods?.length) return;

    const selected = getSelectedMonthlyPeriod(clientId, snapshot);
    if (!selected) return;

    const m = selected.metrics || {};
    renderFilter(clientId, snapshot, selected);

    setMetricCard('Investimento mensal', fmtCurrency(m.investment), `Período ${selected.label}`);
    setMetricCard('Impressões', fmtNumber(m.impressions), `${fmtNumber(m.clicks)} cliques`);
    setMetricCard('Leads de mídia', fmtNumber(m.leads), `CPL ${fmtCurrency(m.cpl)}`);
    setMetricCard('CTR', pct(m.ctr), `CPC ${fmtCurrency(m.cpc)}`);
    setMetricCard('Pacing', pct(m.pacing), `Planejado ${fmtCurrency(m.plannedMedia)}`);

    patchMonthlyTable(snapshot, selected);
  }

  async function runCorrectMediaSync(clientId) {
    if (!clientId || !window.V4_REAL_DATA_SYNC?.runSync) return false;
    await window.V4_REAL_DATA_SYNC.runSync(clientId);
    return true;
  }

  document.addEventListener('click', function (event) {
    const actionButton = event.target.closest('[data-action="sync-performance-client"]');
    if (!actionButton) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const clientId = actionButton.dataset.clientId || getActiveClientId();
    runCorrectMediaSync(clientId);
  }, true);

  document.addEventListener('click', function () {
    setTimeout(patchMediaScreen, 120);
    setTimeout(patchMediaScreen, 600);
  });

  document.addEventListener('change', function (event) {
    if (event.target.closest('[data-media-period-select]')) setTimeout(patchMediaScreen, 30);
  });

  const observer = new MutationObserver(() => {
    clearTimeout(window.__v4MediaPatchTimer);
    window.__v4MediaPatchTimer = setTimeout(patchMediaScreen, 80);
  });

  if (document.body) observer.observe(document.body, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', () => setTimeout(patchMediaScreen, 300));
  setTimeout(patchMediaScreen, 800);

  window.V4_MEDIA_ADS_RUNTIME_FIX = { patchMediaScreen, sanitizeClientPerformance, runCorrectMediaSync };
})();
