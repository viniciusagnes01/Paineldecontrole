(function () {
  const STORAGE_KEY = 'v4-command-center-state-v6-crm-performance-losses';
  const CLIENT_ID = 'st1-internet';
  const SHEET_ID = '1BurqRDqYbWq8dPVxXiKjWH6WmfBNoe39AymwJM8LpFA';
  const MONTHLY_GID = '1253486000';
  const WEEKLY_GID = '85034568';
  const TYPE_KEY = 'v4-st1-media-type';
  const MONTH_KEY = 'v4-st1-media-month';
  const WEEK_KEY = 'v4-st1-media-week';
  const SOURCE_KEY = 'v4-st1-media-source';
  let loading = false;

  function readState() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; } }
  function writeState(state) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {} }
  function activeClientId() { return document.querySelector('[data-client].active')?.dataset?.client || ''; }
  function isAdsScreen() { return /Midia & Ads|Mídia & Ads/i.test(document.body?.innerText || ''); }
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
    for (let i = 0; i < s.length; i += 1) {
      const ch = s[i], nx = s[i + 1];
      if (ch === '"' && q && nx === '"') { cell += '"'; i += 1; }
      else if (ch === '"') q = !q;
      else if (ch === ',' && !q) { row.push(cell); cell = ''; }
      else if ((ch === '\n' || ch === '\r') && !q) { if (ch === '\r' && nx === '\n') i += 1; row.push(cell); if (row.some(x => String(x).trim())) rows.push(row); row = []; cell = ''; }
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
    if (/INVESTIMENTO REALIZADO|INVESTIMENTO \(\$\)/.test(n)) return 'investment';
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
  function hasRealData(p) {
    const m = p.metrics || {};
    return !/2030/.test([p.label, p.year, p.start, p.end].join(' ')) && Boolean(num(m.investment) || num(m.impressions) || num(m.clicks) || num(m.leads));
  }
  function parseRows(rows, mode, keepEmpty) {
    const max = rows.reduce((a, r) => Math.max(a, r.length), 0), periods = [];
    for (let col = 1; col < max; col += 1) {
      const start = mode === 'weekly' ? rows[2]?.[col] : rows[1]?.[col];
      const end = mode === 'weekly' ? rows[3]?.[col] : rows[2]?.[col];
      const year = rows[0]?.[col], month = mode === 'weekly' ? rows[1]?.[col] : rows[3]?.[col];
      if (!(start || end || year || month)) continue;
      const d = parseDate(start);
      const p = { type: mode, label: mode === 'weekly' ? `${start || 'Semana'} -> ${end || ''}` : (d ? `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}` : `${month || 'Mes'} ${year || ''}`), start, end, year, month, sortDate: d?.getTime() || col, metrics: {}, sources: { meta: {}, google: {} }, hasRealData: false };
      let sec = 'budget';
      rows.forEach(r => { const label = r[0]; if (!label) return; sec = section(label, sec); const k = key(label, sec); if (sec === 'meta' || sec === 'google') set(p.sources[sec], k, r[col]); else if (sec === 'budget' || sec === 'total') set(p.metrics, k, r[col]); });
      derive(p.metrics); derive(p.sources.meta); derive(p.sources.google); p.hasRealData = hasRealData(p); periods.push(p);
    }
    return periods.sort((a,b) => a.sortDate - b.sortDate).filter(p => keepEmpty || p.hasRealData);
  }
  async function loadOfficial() {
    if (loading) return null; loading = true;
    try {
      const monthly = parseRows(parseCsv(await getCsv(MONTHLY_GID)), 'monthly', false);
      let weekly = [];
      try { weekly = parseRows(parseCsv(await getCsv(WEEKLY_GID)), 'weekly', true); } catch {}
      const snapshot = { generatedAt: new Date().toISOString(), source: 'st1-force-loader', monthly: { periods: monthly, current: monthly[monthly.length - 1] || null }, weekly: { periods: weekly, current: weekly.find(p => p.hasRealData) || weekly[0] || null } };
      const state = readState(); state.performanceSnapshots = state.performanceSnapshots || {}; state.performanceSnapshots[CLIENT_ID] = snapshot;
      const client = (state.clients || []).find(c => c.id === CLIENT_ID); if (client) client.performanceSheets = { ...(client.performanceSheets || {}), status: 'ST1 midia oficial carregada por GID', lastSync: new Date().toLocaleString('pt-BR') };
      writeState(state); return snapshot;
    } finally { loading = false; }
  }
  function snapshot() { return readState().performanceSnapshots?.[CLIENT_ID] || null; }
  function periodType() { return sessionStorage.getItem(TYPE_KEY) || 'monthly'; }
  function source() { return sessionStorage.getItem(SOURCE_KEY) || 'total'; }
  function labelSource(s) { return s === 'meta' ? 'Meta Ads' : s === 'google' ? 'Google Ads' : 'Total midia'; }
  function periodsFor(snap) { return periodType() === 'weekly' ? (snap?.weekly?.periods || []) : (snap?.monthly?.periods || []); }
  function period(snap) { const ps = periodsFor(snap); const key = periodType() === 'weekly' ? WEEK_KEY : MONTH_KEY; const stored = sessionStorage.getItem(key); return ps.find(p => p.label === stored) || ps[ps.length - 1] || null; }
  function metrics(p, s) { return s === 'meta' ? p?.sources?.meta || {} : s === 'google' ? p?.sources?.google || {} : p?.metrics || {}; }
  function card(title, value, sub) { const el = [...document.querySelectorAll('.metric-card')].find(c => (c.querySelector('.metric-top span:first-child,.metric-title')?.textContent || '').trim().toLowerCase() === title.toLowerCase()); if (!el) return; const v = el.querySelector('.metric-value'), d = el.querySelector('.metric-delta,.metric-subtitle'); if (v) v.textContent = value; if (d) d.textContent = sub; }
  function cleanupDuplicateFilters() { document.querySelectorAll('[data-media-period-filter], [data-st1-media-filter]').forEach(el => el.remove()); }
  function renderToolbar(snap, p, s) {
    cleanupDuplicateFilters();
    const title = [...document.querySelectorAll('h2')].find(h => /Midia & Ads|Mídia & Ads/i.test(h.textContent || ''));
    if (!title) return;
    const ps = periodsFor(snap);
    let box = document.querySelector('[data-st1-media-toolbar]');
    if (!box) { box = document.createElement('div'); box.dataset.st1MediaToolbar = 'true'; box.className = 'glass-card'; title.insertAdjacentElement('afterend', box); }
    box.style.cssText = 'display:grid;grid-template-columns:repeat(3,minmax(160px,1fr));gap:10px;margin:12px 0 14px;padding:12px 14px;border-radius:16px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.12);';
    box.innerHTML = `<label style="display:grid;gap:5px;color:#aeb3c2;font-weight:900;font-size:12px">Periodo<select data-st1-type style="width:100%;background:#111827;color:white;border:1px solid rgba(255,255,255,.18);border-radius:12px;padding:9px 10px;font-weight:900"><option value="monthly" ${periodType()==='monthly'?'selected':''}>Mensal</option><option value="weekly" ${periodType()==='weekly'?'selected':''}>Semanal</option></select></label><label style="display:grid;gap:5px;color:#aeb3c2;font-weight:900;font-size:12px">Data<select data-st1-date style="width:100%;background:#111827;color:white;border:1px solid rgba(255,255,255,.18);border-radius:12px;padding:9px 10px;font-weight:900">${ps.length ? ps.map(x => `<option value="${esc(x.label)}" ${x.label === p?.label ? 'selected' : ''}>${esc(x.label)}${x.hasRealData === false ? ' - sem dados' : ''}</option>`).join('') : '<option>Sem periodos</option>'}</select></label><label style="display:grid;gap:5px;color:#aeb3c2;font-weight:900;font-size:12px">Origem<select data-st1-source style="width:100%;background:#111827;color:white;border:1px solid rgba(255,255,255,.18);border-radius:12px;padding:9px 10px;font-weight:900">${['total','meta','google'].map(x => `<option value="${x}" ${x===s?'selected':''}>${labelSource(x)}</option>`).join('')}</select></label><small style="grid-column:1/-1;color:#aeb3c2;font-weight:800">Fonte oficial: ${periodType()==='weekly' ? '2.0 Semanal' : '1,0 Mensal'} • DASH_CRM fora do fluxo</small>`;
    box.querySelector('[data-st1-type]').onchange = e => { sessionStorage.setItem(TYPE_KEY, e.target.value); render(); };
    box.querySelector('[data-st1-date]').onchange = e => { sessionStorage.setItem(periodType() === 'weekly' ? WEEK_KEY : MONTH_KEY, e.target.value); render(); };
    box.querySelector('[data-st1-source]').onchange = e => { sessionStorage.setItem(SOURCE_KEY, e.target.value); render(); };
  }
  function renderTables(snap, p, s, m) {
    const monthCard = [...document.querySelectorAll('h3')].find(h => /Mensal.*histórico/i.test(h.textContent || ''))?.closest('article');
    if (monthCard) {
      const current = periodType() === 'monthly' ? p : snap?.monthly?.current;
      const mm = periodType() === 'monthly' ? m : (current ? metrics(current, s) : {});
      const sum = monthCard.querySelector('.mini-summary'); if (sum) sum.innerHTML = current ? `<span class="badge ok">Atual</span><strong>${esc(current.label)} • ${labelSource(s)}</strong><small class="muted">Investimento ${money(mm.investment)} • Leads ${number(mm.leads)}</small>` : '<span class="badge warn">Sem dados</span><strong>Mensal indisponivel</strong>';
      const tb = monthCard.querySelector('tbody'); if (tb) tb.innerHTML = current ? `<tr><td>${esc(current.label)}</td><td>${money(mm.investment)}</td><td>${number(mm.impressions)}</td><td>${number(mm.clicks)}</td><td>${number(mm.leads)}</td><td>${money(mm.cpl)}</td><td>${pct(mm.ctr)}</td><td>${pct(s === 'total' ? mm.pacing : 0)}</td></tr>` : '<tr><td colspan="8">Sem dados mensais.</td></tr>';
    }
    const weekCard = [...document.querySelectorAll('h3')].find(h => /Semanal.*histórico/i.test(h.textContent || ''))?.closest('article');
    if (weekCard) {
      const current = periodType() === 'weekly' ? p : (snap?.weekly?.current || null);
      const wm = periodType() === 'weekly' ? m : (current ? metrics(current, s) : {});
      const sum = weekCard.querySelector('.mini-summary'); if (sum) sum.innerHTML = current ? `<span class="badge ${current.hasRealData ? 'ok' : 'warn'}">${current.hasRealData ? 'Atual' : 'Sem dados'}</span><strong>${esc(current.label)} • ${labelSource(s)}</strong><small class="muted">${current.hasRealData ? `Investimento ${money(wm.investment)} • Leads ${number(wm.leads)}` : 'Aba semanal possui #N/A ou zero'}</small>` : '<span class="badge warn">Sem dados</span><strong>Semanal indisponivel</strong>';
      const tb = weekCard.querySelector('tbody'); if (tb) tb.innerHTML = current ? `<tr><td>${esc(current.label)}</td><td>${money(wm.investment)}</td><td>${number(wm.impressions)}</td><td>${number(wm.clicks)}</td><td>${number(wm.leads)}</td><td>${money(wm.cpl)}</td><td>${pct(wm.ctr)}</td><td>${pct(s === 'total' ? wm.pacing : 0)}</td></tr>` : '<tr><td colspan="8">Sem dados semanais.</td></tr>';
    }
  }
  function render(snap = snapshot()) {
    if (activeClientId() !== CLIENT_ID || !isAdsScreen()) return;
    if (!snap?.monthly?.periods?.length) return;
    const p = period(snap), s = source(), m = metrics(p, s);
    renderToolbar(snap, p, s);
    if (!p) return;
    card('Investimento mensal', money(m.investment), `${labelSource(s)} • ${p.label}`); card('Impressões', number(m.impressions), `${number(m.clicks)} cliques`); card('Leads de mídia', number(m.leads), `CPL ${money(m.cpl)}`); card('CTR', pct(m.ctr), `CPC ${money(m.cpc)}`); card('Pacing', pct(s === 'total' ? m.pacing : 0), `Planejado ${money(s === 'total' ? m.plannedMedia : 0)}`);
    renderTables(snap, p, s, m);
  }
  async function ensure() { if (activeClientId() !== CLIENT_ID || !isAdsScreen()) return; let snap = snapshot(); if (!snap?.monthly?.periods?.length || snap.source !== 'st1-force-loader') snap = await loadOfficial(); render(snap); }
  document.addEventListener('click', () => { setTimeout(ensure, 120); setTimeout(ensure, 800); });
  const mo = new MutationObserver(() => { clearTimeout(window.__st1ForceTimer); window.__st1ForceTimer = setTimeout(ensure, 160); });
  if (document.body) mo.observe(document.body, { childList: true, subtree: true });
  setTimeout(ensure, 500); setTimeout(ensure, 1500);
  window.V4_ST1_MEDIA_FORCE_LOADER = { loadOfficial, render, ensure };
})();
