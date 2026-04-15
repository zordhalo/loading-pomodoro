import { Router } from 'express';
import { db } from '../db/index.js';
import { timerEngine } from '../services/TimerEngine.js';
import { ok } from '../util/respond.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.use(auth);

router.get('/', (_req, res) => {
  const state = timerEngine.getState();

  // Today stats
  const stats = db
    .prepare(
      `SELECT
        SUM(CASE WHEN type = 'focus' THEN 1 ELSE 0 END) AS focusCount,
        SUM(CASE WHEN type = 'focus' THEN duration_sec ELSE 0 END) AS focusSeconds,
        SUM(CASE WHEN type IN ('short_break','long_break') THEN 1 ELSE 0 END) AS breakCount,
        COUNT(DISTINCT CASE WHEN type = 'focus' THEN task_id ELSE NULL END) AS tasksWorked
       FROM sessions
       WHERE date(ended_at, 'localtime') = date('now', 'localtime')`,
    )
    .get() as {
    focusCount: number | null;
    focusSeconds: number | null;
    breakCount: number | null;
    tasksWorked: number | null;
  };

  const todayStats = {
    focusCount: stats.focusCount ?? 0,
    focusMinutes: Math.floor((stats.focusSeconds ?? 0) / 60),
    breakCount: stats.breakCount ?? 0,
    tasksWorked: stats.tasksWorked ?? 0,
  };

  // Active task lookup
  let activeTask = null;
  if (state.currentTaskId) {
    activeTask =
      (db.prepare('SELECT * FROM tasks WHERE id = ?').get(state.currentTaskId) as Record<
        string,
        unknown
      >) ?? null;
  }

  ok(res, {
    timer: state,
    todayStats,
    activeTask,
    version: '0.1.0',
  });
});

export default router;
