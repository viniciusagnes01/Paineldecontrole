(function () {
  const DEBUG_KEY = 'v4-growthpack-debug-log';

  function readLogs() {
    try { return JSON.parse(localStorage.getItem(DEBUG_KEY) || '[]'); }
    catch { return []; }
  }

  function setStatus(label, status) {
    const el = document.querySelector('[data-real-sync-status]');
    if (!el) return false;
    el.dataset.status = status;
    el.textContent = label;
    return true;
  }

  function latestSummary() {
    const logs = readLogs();
    if (!logs.length) return null;

    const saved = logs.find((item) => item.type === 'state_saved');
    const errors = logs.filter((item) => item.type === 'sync_error').slice(0, 8);
    const warnings = logs.filter((item) => item.type === 'sync_warn' || item.type === 'crm_warning').slice(0, 8);
    const oks = logs.filter((item) => item.type === 'sync_ok').slice(0, 8);

    if (!saved && !errors.length && !warnings.length && !oks.length) return null;

    const okCount = oks.length;
    const warnClients = warnings.map((item) => String(item.message || '').split(':')[0].replace(' sincronizado com aviso', '').trim()).filter(Boolean);
    const errorClients = errors.map((item) => String(item.message || '').split(':')[0].trim()).filter(Boolean);

    if (errorClients.length) {
      return { status: 'error', label: `${okCount} ok, ${warnClients.length} aviso(s), ${errorClients.length} falha(s): ${errorClients.join(', ')}` };
    }
    if (warnClients.length) {
      return { status: 'warn', label: `${okCount + warnClients.length} ok, ${warnClients.length} aviso(s): ${warnClients.join(', ')}` };
    }
    if (okCount) {
      return { status: 'ok', label: `${okCount} ok via Apps Script` };
    }
    return { status: 'ok', label: 'Estado salvo após sincronização' };
  }

  function recover() {
    const summary = latestSummary();
    if (!summary) return;
    setStatus(summary.label, summary.status);
  }

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(recover, 500);
    setTimeout(recover, 1500);
    setTimeout(recover, 3000);
  });

  window.V4_SYNC_STATUS_RECOVER = { recover };
})();
