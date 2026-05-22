const { json, runMonitoring } = require('../_v4-monitoring');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return json(res, 405, { ok: false, message: 'Method not allowed' });
  }

  try {
    const clientId = req.query?.clientId || req.body?.clientId || '';
    const result = await runMonitoring({ clientId });
    return json(res, 200, result);
  } catch (error) {
    return json(res, 500, {
      ok: false,
      message: error.message,
      checkedAt: new Date().toISOString()
    });
  }
};
