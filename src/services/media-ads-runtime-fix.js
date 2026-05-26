(function () {
  const STORAGE_KEY = 'v4-command-center-state-v6-crm-performance-losses';
  const PERIOD_KEY_PREFIX = 'v4-media-month-filter-';
  const SOURCE_KEY_PREFIX = 'v4-media-source-filter-';

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
    return /2030/.test([period?.label, period?.start, period?.end, period?.year].join(' '));
  }

  function sanitizeBlock(block) {
    if (!block) return { current: null, periods: [], totals: {} };
    const periods = (block.periods || []).filter((period) => hasActualMetrics(period) && !isFuture2030(period));
    return { ...block, periods, current: periods[periods.length - 1] || null };
  }

  function sanitizeSnapshot(snapshot) {
    if (!snapshot) return null;
    return { ...snapshot, monthly: sanitizeBlock(snapshot.monthly), weekly: sanitizeBlock(snapshot.weekly) };
  }

  function sanitizeClientPerformance(clientId) {
    const state = readState();
    const snapshot = state.performanceSnapshots?.[clientId];
    if (!snapshot) return null;
    const clean = sanitizeSnapshot(snapshot);
    state.performanceSnapshots[clientId] = clean;
    saveState(state);
    return clean;
  }

  function fmtCurrency(value) { return toNumber(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
  function fmtNumber(value) { return toNumber(value).toLocaleString('pt-BR'); }
  function pct(value) { return `${toNumber(value).toFixed(1).replace('.', ',')}%`; }
  function escapeHtml(value) { return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char])); }

  function selectedSource(clientId) {
    return sessionStorage.getItem(SOURCE_KEY_PREFIX + clientId) || 'total';
  }

  function selectedPeriod(clientId, snapshot) {
    const periods = snapshot?.monthly?.periods || [];
    if (!periods.length) return null;
    const stored = sessionStorage.getItem(PERIOD_KEY_PREFIX + clientId);
    return periods.find((period) => period.label === stored) || periods[periods.length - 1];
  }

  function metricsFor(period, source) {
    if (!period) return {};
    if (source === 'meta') return period.sources?.meta || {};
    if (source === 'google') return period.sources?.google || {};
    return period.metrics || {};
  }

  function setMetricCard(title, value, subtitle) {
    const cards = Array.from(document.querySelectorAll('.metric-card'));
    const card = cards.find((item) => {
      const label = item.querySelector('.metric-top span:first-child, .metric-card__top span:first-child, .metric-title')?.textContent?.trim().toLowerCase();
      return label === title.toLowerCase();
    });
    if (!card) return;
    const valueEl = card.querySelector('.metric-value');
    const deltaEl = card.querySelector('.metric-delta, .metric-subtitle');
    if (valueEl) valueEl.textContent = value;
    if (deltaEl) deltaEl.textContent = subtitle || '';
  }

  function sourceLabel(source) {
    return source === 'meta' ? 'Meta Ads' : source === 'google' ? 'Google Ads' : 'Total mídia';
  }

  function renderFilters(clientId, snapshot, period, source) {
    const periods = snapshot?.monthly?.periods || [];
    const title = Array.from(document.querySelectorAll('h2')).find((el) => /Mídia & Ads/i.test(el.textContent || ''));
    if (!title || !periods.length) return;
    let box = document.querySelector('[data-media-period-filter]');
    if (!box) {
      box = document.createElement('div');
      box.dataset.mediaPeriodFilter = 'true';
      box.style.cssText = 'display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:12px 0 14px;padding:10px 12px;border:1px solid rgba(255,255,255,.12);border-radius:14px;background:rgba(255,255,255,.04);font-weight:800;';
      title.parentElement?.insertBefore(box, title.nextSibling);
    }
    box.innerHTML = `
      <span style="color:#aeb3c2">Data</span>
      <select data-media-period-select style="background:#111827;color:white;border:1px solid rgba(255,255,255,.18);border-radius:999px;padding:8px 12px;font-weight:900;outline:none;">
        ${periods.map((item) => `<option value="${escapeHtml(item.label)}" ${item.label === period?.label ? 'selected' : ''}>${escapeHtml(item.label)}</option>`).join('')}
      </select>
      <span style="color:#aeb3c2">Origem</span>
      <select data-media-source-select style="background:#111827;color:white;border:1px solid rgba(255,255,255,.18);border-radius:999px;padding:8px 12px;font-weight:900;outline:none;">
        ${['total', 'meta', 'google'].map((item) => `<option value="${item}" ${item === source ? 'selected' : ''}>${sourceLabel(item)}</option>`).join('')}
      </select>
      <span style="color:#aeb3c2">Fonte oficial: 1,0 Mensal. DASH_CRM fora do fluxo.</span>
    `;
    box.querySelector('[data-media-period-select]').onchange = function () {
      sessionStorage.setItem(PERIOD_KEY_PREFIX + clientId, this.value);
      patchMediaScreen();
    };
    box.querySelector('[data-media-source-select]').onchange = function () {
      sessionStorage.setItem(SOURCE_KEY_PREFIX + clientId, this.value);
      patchMediaScreen();
    };
  }

  function patchMonthlyTable(period, source) {
    const monthlyTitle = Array.from(document.querySelectorAll('h3')).find((el) => /Mensal.*histórico consolidado/i.test(el.textContent || ''));
    if (!monthlyTitle || !period) return;
    const article = monthlyTitle.closest('article');
    if (!article) return;
    const m = metricsFor(period, source);
    const summary = article.querySelector('.mini-summary');
    if (summary) summary.innerHTML = `<span class="badge ok">Atual</span><strong>${escapeHtml(period.label)} • ${sourceLabel(source)}</strong><small class="muted">Investimento ${fmtCurrency(m.investment)} • Leads ${fmtNumber(m.leads)}</small>`;
    const tbody = article.querySelector('tbody');
    if (tbody) tbody.innerHTML = `<tr><td>${escapeHtml(period.label)}</td><td>${fmtCurrency(m.investment)}</td><td>${fmtNumber(m.impressions)}</td><td>${fmtNumber(m.clicks)}</td><td>${fmtNumber(m.leads)}</td><td>${fmtCurrency(m.cpl)}</td><td>${pct(m.ctr)}</td><td>${pct(m.pacing)}</td></tr>`;
  }

  function patchWeeklyTable(snapshot) {
    const weeklyTitle = Array.from(document.querySelectorAll('h3')).find((el) => /Semanal.*histórico consolidado/i.test(el.textContent || ''));
    if (!weeklyTitle) return;
    const article = weeklyTitle.closest('article');
    if (!article) return;
    const periods = snapshot?.weekly?.periods || [];
    const current = periods[periods.length - 1] || null;
    const summary = article.querySelector('.mini-summary');
    if (summary) summary.innerHTML = current ? `<span class="badge ok">Atual</span><strong>${escapeHtml(current.label)}</strong><small class="muted">Investimento ${fmtCurrency(current.metrics?.investment)} • Leads ${fmtNumber(current.metrics?.leads)}</small>` : '<span class="badge warn">Sem dados reais</span><strong>Aguardando mídia semanal</strong>';
    const tbody = article.querySelector('tbody');
    if (tbody) tbody.innerHTML = periods.length ? periods.slice(-8).reverse().map((period) => `<tr><td>${escapeHtml(period.label)}</td><td>${fmtCurrency(period.metrics?.investment)}</td><td>${fmtNumber(period.metrics?.impressions)}</td><td>${fmtNumber(period.metrics?.clicks)}</td><td>${fmtNumber(period.metrics?.leads)}</td><td>${fmtCurrency(period.metrics?.cpl)}</td><td>${pct(period.metrics?.ctr)}</td><td>${pct(period.metrics?.pacing)}</td></tr>`).join('') : '<tr><td colspan="8">Sem dados semanais reais na aba 2.0 Semanal.</td></tr>';
  }

  function patchMediaScreen() {
    const clientId = getActiveClientId();
    if (!clientId) return;
    const snapshot = sanitizeClientPerformance(clientId);
    if (!snapshot?.monthly?.periods?.length) return;
    const period = selectedPeriod(clientId, snapshot);
    const source = selectedSource(clientId);
    const m = metricsFor(period, source);
    renderFilters(clientId, snapshot, period, source);
    setMetricCard('Investimento mensal', fmtCurrency(m.investment), `${sourceLabel(source)} • ${period.label}`);
    setMetricCard('Impressões', fmtNumber(m.impressions), `${fmtNumber(m.clicks)} cliques`);
    setMetricCard('Leads de mídia', fmtNumber(m.leads), `CPL ${fmtCurrency(m.cpl)}`);
    setMetricCard('CTR', pct(m.ctr), `CPC ${fmtCurrency(m.cpc)}`);
    setMetricCard('Pacing', pct(source === 'total' ? m.pacing : 0), `Planejado ${fmtCurrency(source === 'total' ? m.plannedMedia : 0)}`);
    patchMonthlyTable(period, source);
    patchWeeklyTable(snapshot);
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
    runCorrectMediaSync(actionButton.dataset.clientId || getActiveClientId());
  }, true);

  document.addEventListener('click', function () { setTimeout(patchMediaScreen, 150); setTimeout(patchMediaScreen, 700); });
  document.addEventListener('change', function (event) { if (event.target.closest('[data-media-period-select], [data-media-source-select]')) setTimeout(patchMediaScreen, 30); });
  const observer = new MutationObserver(() => { clearTimeout(window.__v4MediaPatchTimer); window.__v4MediaPatchTimer = setTimeout(patchMediaScreen, 120); });
  if (document.body) observer.observe(document.body, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', () => setTimeout(patchMediaScreen, 400));
  setTimeout(patchMediaScreen, 900);
  window.V4_MEDIA_ADS_RUNTIME_FIX = { patchMediaScreen, sanitizeClientPerformance, runCorrectMediaSync };
})();
