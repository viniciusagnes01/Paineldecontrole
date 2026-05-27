(function () {
  const STORAGE_KEY = 'v4-command-center-state-v6-crm-performance-losses';
  const CLIENT_ID = 'st1-internet';
  const SHEET_ID = '1BurqRDqYbWq8dPVxXiKjWH6WmfBNoe39AymwJM8LpFA';
  const MONTHLY_GID = '1253486000';
  const WEEKLY_GID = '85034568';
  const MONTH_KEY = 'v4-st1-media-month';
  const SOURCE_KEY = 'v4-st1-media-source';
  let loading = false;

  function readState() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; } }
  function writeState(state) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {} }
  function activeClientId() { return document.querySelector('[data-client].active')?.dataset?.client || ''; }
  function isAdsScreen() { return /Mídia & Ads/i.test(document.body?.innerText || ''); }
  function norm(v) { return String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toUpperCase(); }
  function esc(v) { return String(v ?? '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c])); }
  function num(v) {
    if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
    const raw = String(v || '').trim();
    if (!raw || raw === '-' || /^#N\/?A$/i.test(raw)) return 0;
    let s = raw.replace(/R\$/g, '').replace(/\$/g, '').replace(/%/g, '').replace(/\s/g, '').replace(/[^0-9,.-]/g, '');
    if (!s || s === '-' || s === ',' || s === '.') return 0;
    const c = s.lastIndexOf(','), d = s.lastIndexOf('.');
    if (c >= 0 && d >= 0) s = c > d ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
    else if (c >= 0) s = s.replace(',', '.');
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  }
  function money(v) { return num(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
  function number(v) { return num(v).toLocaleString('pt-BR'); }
  function pct(v) { return `${num(v).toFixed(1).replace('.', ',')}%`; }
  function parseDate(v) {
    const m = String(v || '').trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (!m) return null;
    return new Date(Number(m[3].length === 2 ? `20${m[3]}` : m[3]), Number(m[2]) - 1, Number(m[1]));
  }
  function parseCsv(text) {
    const rows = []; let row = [], cell = '', q = false; const s = String(text || '').replace(/^\uFEFF/, '');
    for (let i = 0; i < s.length; i++) {
      const ch = s[i], nx = s[i + 1];
      if (ch === '"' && q && nx === '"') { cell += '"'; i++; }
      else if (ch === '"') q = !q;
      else if (ch === ',' && !q) { row.push(cell); cell = ''; }
      else if ((ch === '\n' || ch === '\r') && !q) { if (ch === '\r' && nx === '\n') i++; row.push(cell); if (row.some(x => String(x).trim())) rows.push(row); row = []; cell = ''; }
      else cell += ch;
    }
    row.push(cell); if (row.some(x => String(x).trim())) rows.push(row); return rows;
  }
  async function getCsv(gid) {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}&cacheBust=${Date.now()}`;
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.text();
  }
  function section(label, current) {
    const n = norm(label);
    if (/INDICADORES V4/.test(n)) return 'total';
    if (/INVESTIMENTO META/.test(n)) return 'meta';
    if (/INVESTIMENTO GOOGLE/.test(n)) return 'google';
    return current;
  }
  function key(label, sec) {
    const n = norm(label);
    if (/PLANO DE MIDIA/.test(n)) return 'plannedMedia';
    if (/INVESTIMENTO REALIZADO/.test(n)) return 'investment';
    if (/PREVISTO/.test(n)) return 'plannedUntilYesterday';
    if (/PACING/.test(n)) return 'pacing';
    if (sec === 'meta' && /INVESTIMENTO META/.test(n)) return 'investment';
    if (sec === 'google' && /INVESTIMENTO GOOGLE/.test(n)) return 'investment';
    if (/^IMPRESS/.test(n)) return 'impressions';
    if (/CLIQUES NO LINK|^CLIQUES?$/.test(n)) return 'clicks';
    if (/^LEADS$|^RESULTADO$|CONVERSOES|CONVERSÕES/.test(n)) return 'leads';
    if (/CUSTO POR RESULTADO|CUSTO POR CONVERS|CUSTO POR LEAD|^CPL/.test(n)) return 'cpl';
    if (/CUSTO POR CLIQUE|CPC/.test(n)) return 'cpc';
    if (/^CTR/.test(n)) return 'ctr';
    if (/ROAS/.test(n)) return 'roas';
    if (/TAXA DE CONVERS/.test(n)) return 'conversion';
    return '';
  }
  function set(obj, k, v) { if (!k) return; const n = num(v); if (n || obj[k] == null) obj[k] = n; }
  function derive(m) {
    const inv = num(m.investment), leads = num(m.leads), clicks = num(m.clicks), impr = num(m.impressions);
    if (!m.cpl && leads) m.cpl = inv / leads;
    if (!m.cpc && clicks) m.cpc = inv / clicks;
    if (!m.ctr && impr) m.ctr = clicks / impr * 100;
  }
  function hasData(p) { const m = p.metrics || {}; return !/2030/.test([p.label, p.year, p.start, p.end].join(' ')) && (num(m.investment) || num(m.impressions) || num(m.clicks) || num(m.leads)); }
  function parseRows(rows, mode) {
    const max = rows.reduce((a, r) => Math.max(a, r.length), 0), periods = [];
    for (let col = 1; col < max; col++) {
      const start = mode === 'weekly' ? rows[2]?.[col] : rows[1]?.[col];
      const end = mode === 'weekly' ? rows[3]?.[col] : rows[2]?.[col];
      const year = rows[0]?.[col], month = mode === 'weekly' ? rows[1]?.[col] : rows[3]?.[col];
      if (!(start || end || year || month)) continue;
      const d = parseDate(start);
      const p = { label: mode === 'weekly' ? `${start || 'Semana'} → ${end || ''}` : (d ? `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}` : `${month || 'Mês'} ${year || ''}`), start, end, year, month, sortDate: d?.getTime() || col, metrics: {}, sources: { meta: {}, google: {} } };
      let sec = 'budget';
      rows.forEach(r => { const label = r[0]; if (!label) return; sec = section(label, sec); const k = key(label, sec); if (sec === 'meta' || sec === 'google') set(p.sources[sec], k, r[col]); else if (sec === 'budget' || sec === 'total') set(p.metrics, k, r[col]); });
      derive(p.metrics); derive(p.sources.meta); derive(p.sources.google); periods.push(p);
    }
    return periods.sort((a,b) => a.sortDate - b.sortDate).filter(hasData);
  }
  async function loadOfficial() {
    if (loading) return null; loading = true;
    try {
      const monthly = parseRows(parseCsv(await getCsv(MONTHLY_GID)), 'monthly');
      let weekly = [];
      try { weekly = parseRows(parseCsv(await getCsv(WEEKLY_GID)), 'weekly'); } catch {}
      const snapshot = { generatedAt: new Date().toISOString(), source: 'st1-force-loader', monthly: { periods: monthly, current: monthly[monthly.length - 1] || null }, weekly: { periods: weekly, current: weekly[weekly.length - 1] || null } };
      const state = readState(); state.performanceSnapshots = state.performanceSnapshots || {}; state.performanceSnapshots[CLIENT_ID] = snapshot;
      const client = (state.clients || []).find(c => c.id === CLIENT_ID); if (client) { client.performanceSheets = { ...(client.performanceSheets || {}), status: 'ST1 mídia oficial carregada por GID', lastSync: new Date().toLocaleString('pt-BR') }; }
      writeState(state); return snapshot;
    } finally { loading = false; }
  }
  function snapshot() { return readState().performanceSnapshots?.[CLIENT_ID] || null; }
  function source() { return sessionStorage.getItem(SOURCE_KEY) || 'total'; }
  function labelSource(s) { return s === 'meta' ? 'Meta Ads' : s === 'google' ? 'Google Ads' : 'Total mídia'; }
  function period(snap) { const ps = snap?.monthly?.periods || []; const stored = sessionStorage.getItem(MONTH_KEY); return ps.find(p => p.label === stored) || ps[ps.length - 1] || null; }
  function metrics(p, s) { return s === 'meta' ? p?.sources?.meta || {} : s === 'google' ? p?.sources?.google || {} : p?.metrics || {}; }
  function card(title, value, sub) { const el = [...document.querySelectorAll('.metric-card')].find(c => (c.querySelector('.metric-top span:first-child,.metric-title')?.textContent || '').trim().toLowerCase() === title.toLowerCase()); if (!el) return; const v = el.querySelector('.metric-value'), d = el.querySelector('.metric-delta,.metric-subtitle'); if (v) v.textContent = value; if (d) d.textContent = sub; }
  function render(snap = snapshot()) {
    if (activeClientId() !== CLIENT_ID || !isAdsScreen()) return;
    const p = period(snap), ps = snap?.monthly?.periods || [], s = source();
    const title = [...document.querySelectorAll('h2')].find(h => /Mídia & Ads/i.test(h.textContent || ''));
    if (title) {
      let box = document.querySelector('[data-st1-media-filter]');
      if (!box) { box = document.createElement('div'); box.dataset.st1MediaFilter = 'true'; box.style.cssText = 'display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:12px 0;padding:10px 12px;border:1px solid rgba(255,255,255,.14);border-radius:14px;background:rgba(255,255,255,.05);font-weight:800;'; title.insertAdjacentElement('afterend', box); }
      box.innerHTML = `<span style="color:#aeb3c2">Data</span><select data-st1-month style="background:#111827;color:white;border:1px solid rgba(255,255,255,.2);border-radius:999px;padding:8px 12px;font-weight:900">${ps.length ? ps.map(x => `<option value="${esc(x.label)}" ${x.label === p?.label ? 'selected' : ''}>${esc(x.label)}</option>`).join('') : '<option>Carregando...</option>'}</select><span style="color:#aeb3c2">Origem</span><select data-st1-source style="background:#111827;color:white;border:1px solid rgba(255,255,255,.2);border-radius:999px;padding:8px 12px;font-weight:900">${['total','meta','google'].map(x => `<option value="${x}" ${x===s?'selected':''}>${labelSource(x)}</option>`).join('')}</select><span style="color:#aeb3c2">ST1 oficial: 1,0 Mensal</span>`;
      box.querySelector('[data-st1-month]').onchange = e => { sessionStorage.setItem(MONTH_KEY, e.target.value); render(); };
      box.querySelector('[data-st1-source]').onchange = e => { sessionStorage.setItem(SOURCE_KEY, e.target.value); render(); };
    }
    if (!p) return;
    const m = metrics(p, s);
    card('Investimento mensal', money(m.investment), `${labelSource(s)} • ${p.label}`); card('Impressões', number(m.impressions), `${number(m.clicks)} cliques`); card('Leads de mídia', number(m.leads), `CPL ${money(m.cpl)}`); card('CTR', pct(m.ctr), `CPC ${money(m.cpc)}`); card('Pacing', pct(s === 'total' ? m.pacing : 0), `Planejado ${money(s === 'total' ? m.plannedMedia : 0)}`);
    const monthCard = [...document.querySelectorAll('h3')].find(h => /Mensal.*histórico/i.test(h.textContent || ''))?.closest('article');
    if (monthCard) { const sum = monthCard.querySelector('.mini-summary'); if (sum) sum.innerHTML = `<span class="badge ok">Atual</span><strong>${esc(p.label)} • ${labelSource(s)}</strong><small class="muted">Investimento ${money(m.investment)} • Leads ${number(m.leads)}</small>`; const tb = monthCard.querySelector('tbody'); if (tb) tb.innerHTML = `<tr><td>${esc(p.label)}</td><td>${money(m.investment)}</td><td>${number(m.impressions)}</td><td>${number(m.clicks)}</td><td>${number(m.leads)}</td><td>${money(m.cpl)}</td><td>${pct(m.ctr)}</td><td>${pct(s === 'total' ? m.pacing : 0)}</td></tr>`; }
    const weekCard = [...document.querySelectorAll('h3')].find(h => /Semanal.*histórico/i.test(h.textContent || ''))?.closest('article');
    if (weekCard) { const tb = weekCard.querySelector('tbody'); if (tb) tb.innerHTML = '<tr><td colspan="8">Sem dados semanais reais na aba 2.0 Semanal.</td></tr>'; }
  }
  async function ensure() { if (activeClientId() !== CLIENT_ID || !isAdsScreen()) return; let snap = snapshot(); if (!snap?.monthly?.periods?.length) snap = await loadOfficial(); render(snap); }
  document.addEventListener('click', () => { setTimeout(ensure, 150); setTimeout(ensure, 900); });
  const mo = new MutationObserver(() => { clearTimeout(window.__st1ForceTimer); window.__st1ForceTimer = setTimeout(ensure, 200); });
  if (document.body) mo.observe(document.body, { childList: true, subtree: true });
  setTimeout(ensure, 500); setTimeout(ensure, 1500);
  window.V4_ST1_MEDIA_FORCE_LOADER = { loadOfficial, render, ensure };
})();
