import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../..', '.env') });

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';

// Initialize DB first
import './db/index.js';

import timerRouter from './routes/timer.js';
import tasksRouter from './routes/tasks.js';
import sessionsRouter from './routes/sessions.js';
import statusRouter from './routes/status.js';
import settingsRouter from './routes/settings.js';
import { attach } from './ws/index.js';

const app = express();

app.use(cors({ origin: true }));
app.use(express.json());

// Health check
app.get('/healthz', (_req, res) => {
  res.json({ ok: true });
});

// Routes
app.use('/api/timer', timerRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/status', statusRouter);
app.use('/api/settings', settingsRouter);

const httpServer = createServer(app);
attach(httpServer);

const PORT = process.env['PORT'] ?? 3001;
httpServer.listen(PORT, () => {
  console.log(`[server] Listening on http://localhost:${PORT}`);
  console.log(`[server] NODE_ENV=${process.env['NODE_ENV'] ?? 'development'}`);
});
