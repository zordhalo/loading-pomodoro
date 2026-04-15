import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { timerEngine } from '../services/TimerEngine.js';
import { ok } from '../util/respond.js';
import { logCommand } from '../util/commandTap.js';
import type { TimerPhase, Source } from '../types.js';

const router = Router();

router.use(auth);

router.post('/start', (req, res) => {
  const { phase, taskId, source } = req.body as {
    phase?: TimerPhase;
    taskId?: string;
    source?: Source;
  };
  const state = timerEngine.start({ phase, taskId, source });
  logCommand(req, 'timer:start', { phase, taskId, source });
  ok(res, state);
});

router.post('/pause', (req, res) => {
  const { source } = req.body as { source?: Source };
  const state = timerEngine.pause(source);
  logCommand(req, 'timer:pause', { source });
  ok(res, state);
});

router.post('/resume', (req, res) => {
  const { source } = req.body as { source?: Source };
  const state = timerEngine.resume(source);
  logCommand(req, 'timer:resume', { source });
  ok(res, state);
});

router.post('/reset', (req, res) => {
  const { source } = req.body as { source?: Source };
  const state = timerEngine.reset(source);
  logCommand(req, 'timer:reset', { source });
  ok(res, state);
});

router.post('/skip', (req, res) => {
  const { source } = req.body as { source?: Source };
  const state = timerEngine.skip(source);
  logCommand(req, 'timer:skip', { source });
  ok(res, state);
});

router.get('/state', (_req, res) => {
  ok(res, timerEngine.getState());
});

export default router;
