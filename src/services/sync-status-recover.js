(function () {
  const DEBUG_KEY = 'v4-growthpack-debug-log';

  function readLogs() {
    try { return JSON.parse(localStorage.getItem(DEBUG_KEY) || '[]'); }
    catch { return []; }
  }

  function unique(list) {
    return Array.from(new Set(list.filter(Boolean)));
  }

  function clientFromMessage(message) {
    const text = String(message || '').trim();
    if (!text) return '';
    const known = ['alphaville', 'prime', 'multimed', 'seg-eletronic', 'espaco-master', 'st1-internet', 'yousafer', 'treinando-online'];
    return known.find((clientId) => text.includes(clientId)) || text.split(':')[0].split(' ')[0].trim();
  }

  function setStatus(label, status) {
    const el = document.querySelector('[data-real-sync-status]');
    if (!el) return false;
    el.dataset.status = status;
    el.textContent = label;
    el.title = label;
    return true;
  }

  function renderDetails(summary) {
    const panel = document.querySelector('[data-v4-debug-panel]');
    if (!panel || !summary) return;
    let details = panel.querySelector('[data-v4-sync-summary]');
    if (!details) {
      details = document.createElement('div');
      details.dataset.v4SyncSummary = 'true';
      details.style.cssText = 'margin-bottom:8px;padding:8px;border-radius:10px;background:rgba(255,255,255,.08);line-height:1.45;';
      panel.prepend(details);
    }
    details.innerHTML = `
      <strong>Último resultado:</strong> ${summary.label}<br>
      ${summary.warningClients.length ? `<span>Com aviso: ${summary.warningClients.join(', ')}</span><br>` : ''}
      ${summary.errorClients.length ? `<span>Com falha: ${summary.errorClients.join(', ')}</span><br>` : ''}
      ${summary.okClients.length ? `<span>OK: ${summary.okClients.join(', ')}</span>` : ''}
    `;
  }

  function latestSummary() {
    const logs = readLogs();
    if (!logs.length) return null;

    const saved = logs.find((item) => item.type === 'state_saved');
    const errors = logs.filter((item) => item.type === 'sync_error').slice(0, 12);
    const warnings = logs.filter((item) => item.type === 'sync_warn' || item.type === 'crm_warning').slice(0, 12);
    const oks = logs.filter((item) => item.type === 'sync_ok').slice(0, 12);

    if (!saved && !errors.length && !warnings.length && !oks.length) return null;

    const errorClients = unique(errors.map((item) => clientFromMessage(item.message)));
    const warningClients = unique(warnings.map((item) => clientFromMessage(item.message)));
    const okClients = unique(oks.map((item) => clientFromMessage(item.message)));
    const okTotal = okClients.length + warningClients.length;

    if (errorClients.length) {
      return { status: 'error', label: `${okTotal} ok, ${warningClients.length} aviso(s), ${errorClients.length} falha(s): ${errorClients.join(', ')}`, okClients, warningClients, errorClients };
    }
    if (warningClients.length) {
      return { status: 'warn', label: `${okTotal} ok, ${warningClients.length} aviso(s): ${warningClients.join(', ')}`, okClients, warningClients, errorClients };
    }
    if (okClients.length) {
      return { status: 'ok', label: `${okClients.length} ok via Apps Script`, okClients, warningClients, errorClients };
    }
    return { status: 'ok', label: 'Estado salvo após sincronização', okClients, warningClients, errorClients };
  }

  function recover() {
    const summary = latestSummary();
    if (!summary) return;
    setStatus(summary.label, summary.status);
    renderDetails(summary);
  }

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(recover, 500);
    setTimeout(recover, 1500);
    setTimeout(recover, 3000);
  });

  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-v4-debug-toggle]')) setTimeout(recover, 50);
  });

  window.V4_SYNC_STATUS_RECOVER = { recover, latestSummary };
})();
