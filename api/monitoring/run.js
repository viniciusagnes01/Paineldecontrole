const { json, runMonitoring, sendEvolutionAlert, alertText } = require('../_v4-monitoring');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return json(res, 405, { ok: false, message: 'Method not allowed' });
  }

  try {
    const clientId = req.query?.clientId || req.body?.clientId || '';
    const notify = String(req.query?.notify || req.body?.notify || '') === '1';
    const result = await runMonitoring({ clientId });

    const alerts = [];
    if (notify && result.incidents.length) {
      for (const incident of result.incidents) {
        const alertResult = await sendEvolutionAlert({ incident, text: alertText(incident) });
        alerts.push({ clientId: incident.clientId, type: incident.type, sent: alertResult.ok, result: alertResult });
      }
    }

    return json(res, 200, {
      ...result,
      notify,
      alertsSent: alerts.filter((item) => item.sent).length,
      alerts
    });
  } catch (error) {
    return json(res, 500, {
      ok: false,
      message: error.message,
      checkedAt: new Date().toISOString()
    });
  }
};
