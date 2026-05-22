import express from 'express';

export const growthPackRouter = express.Router();

const message = 'Endpoint preparado. Conecte as rotas reais de BASE_CRM, 1.0 Mensal e 2.0 Semanal no N8N/backend.';

growthPackRouter.get('/:clientId/summary', (req, res) => {
  res.json({ ok: true, clientId: req.params.clientId, source: 'growthpack-proxy-placeholder', message });
});

growthPackRouter.get('/:clientId/crm', (req, res) => {
  res.json({ ok: true, clientId: req.params.clientId, source: 'growthpack-proxy-placeholder', rows: [], message });
});

growthPackRouter.get('/:clientId/performance', (req, res) => {
  res.json({ ok: true, clientId: req.params.clientId, source: 'growthpack-proxy-placeholder', monthly: null, weekly: null, message });
});
