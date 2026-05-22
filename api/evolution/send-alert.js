const { json, sendEvolutionAlert } = require('../_v4-monitoring');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return json(res, 405, { ok: false, message: 'Method not allowed' });
  }

  try {
    const body = req.body || {};
    const text = body.text || '';
    const phone = body.phone || '';

    if (!text) {
      return json(res, 400, { ok: false, message: 'Campo text é obrigatório.' });
    }

    const result = await sendEvolutionAlert({ text, phone });
    return json(res, result.ok ? 200 : 202, result);
  } catch (error) {
    return json(res, 500, { ok: false, message: error.message });
  }
};
