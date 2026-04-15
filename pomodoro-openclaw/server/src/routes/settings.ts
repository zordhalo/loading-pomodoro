import { Router } from 'express';
import { getAllSettings, setSetting } from '../db/index.js';
import { timerEngine } from '../services/TimerEngine.js';
import { ok, fail } from '../util/respond.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.use(auth);

router.get('/', (_req, res) => {
  ok(res, getAllSettings());
});

router.put('/', (req, res) => {
  const { key, value } = req.body as { key?: string; value?: string };

  if (!key || value === undefined) {
    fail(res, 'key and value are required');
    return;
  }

  setSetting(key, String(value));
  timerEngine.applySettings();
  ok(res, getAllSettings());
});

export default router;
