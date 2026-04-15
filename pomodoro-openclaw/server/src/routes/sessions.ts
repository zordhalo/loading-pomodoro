import { Router } from 'express';
import { db } from '../db/index.js';
import { ok } from '../util/respond.js';
import { auth } from '../middleware/auth.js';
import type { Session, Source } from '../types.js';

const router = Router();

router.use(auth);

function parseSession(row: Record<string, unknown>): Session {
  return {
    id: row['id'] as string,
    task_id: (row['task_id'] as string | null) ?? null,
    task_name: (row['task_name'] as string | null) ?? null,
    type: row['type'] as Session['type'],
    duration_sec: row['duration_sec'] as number,
    interrupted: row['interrupted'] === 1 || row['interrupted'] === true,
    source: row['source'] as Source,
    started_at: row['started_at'] as string,
    ended_at: row['ended_at'] as string,
  };
}

router.get('/', (req, res) => {
  const limit = parseInt((req.query['limit'] as string) ?? '50', 10);
  const date = req.query['date'] as string | undefined;

  let query: string;
  let params: unknown[];

  if (date) {
    query = `SELECT * FROM sessions WHERE ended_at LIKE ? ORDER BY ended_at DESC LIMIT ?`;
    params = [`${date}%`, limit];
  } else {
    query = `SELECT * FROM sessions ORDER BY ended_at DESC LIMIT ?`;
    params = [limit];
  }

  const rows = db.prepare(query).all(...params) as Array<Record<string, unknown>>;
  ok(res, rows.map(parseSession));
});

router.get('/today-stats', (_req, res) => {
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

  ok(res, {
    focusCount: stats.focusCount ?? 0,
    focusMinutes: Math.floor((stats.focusSeconds ?? 0) / 60),
    breakCount: stats.breakCount ?? 0,
    tasksWorked: stats.tasksWorked ?? 0,
  });
});

export default router;
