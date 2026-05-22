import express from 'express';
import { loadCommunicationBase } from '../services/communication-base.js';
import { CLIENTS } from '../config/clients.js';

export const communicationBaseRouter = express.Router();

communicationBaseRouter.get('/clients', (_req, res) => {
  res.json({ ok: true, clients: Object.values(CLIENTS) });
});

communicationBaseRouter.get('/:clientId', async (req, res, next) => {
  try {
    const force = req.query.force === 'true' || req.query.force === '1';
    const snapshot = await loadCommunicationBase(req.params.clientId, { force });
    res.json(snapshot);
  } catch (error) {
    next(error);
  }
});

communicationBaseRouter.post('/:clientId/sync', async (req, res, next) => {
  try {
    const snapshot = await loadCommunicationBase(req.params.clientId, { force: true });
    res.json({ ok: true, syncedAt: new Date().toISOString(), snapshot });
  } catch (error) {
    next(error);
  }
});
