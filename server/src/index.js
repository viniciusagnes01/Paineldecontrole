import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import pino from 'pino';
import { communicationBaseRouter } from './routes/communication-base.routes.js';
import { growthPackRouter } from './routes/growthpack.routes.js';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
const app = express();
const port = Number(process.env.PORT || 5174);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../../..');

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || true }));
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'v4-command-center-runtime', now: new Date().toISOString() });
});

app.use('/api/communication-base', communicationBaseRouter);
app.use('/api/growthpack', growthPackRouter);

app.use(express.static(projectRoot));

app.use((req, res) => {
  res.status(404).json({ ok: false, message: `Rota nao encontrada: ${req.method} ${req.path}` });
});

app.use((error, _req, res, _next) => {
  const status = Number(error.statusCode || 500);
  logger.error({ error }, 'Erro na API');
  res.status(status).json({ ok: false, message: error.message || 'Erro interno' });
});

app.listen(port, () => {
  logger.info(`V4 Command Center Runtime rodando em http://localhost:${port}`);
});
