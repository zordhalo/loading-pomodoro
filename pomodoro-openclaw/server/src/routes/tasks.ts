import { Router } from 'express';
import { db } from '../db/index.js';
import { timerEngine } from '../services/TimerEngine.js';
import { ok, fail } from '../util/respond.js';
import { logCommand } from '../util/commandTap.js';
import { auth } from '../middleware/auth.js';
import type { Task, Source } from '../types.js';

const router = Router();

router.use(auth);

function parseTask(row: Record<string, unknown>): Task {
  return {
    id: row['id'] as string,
    name: row['name'] as string,
    estimate: row['estimate'] as number,
    completed: row['completed'] as number,
    tags: (() => {
      try {
        return JSON.parse(row['tags'] as string) as string[];
      } catch {
        return [];
      }
    })(),
    created_at: row['created_at'] as string,
    updated_at: row['updated_at'] as string,
  };
}

router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all() as Array<
    Record<string, unknown>
  >;
  ok(res, rows.map(parseTask));
});

router.post('/', (req, res) => {
  const { name, estimate = 1, tags = [] } = req.body as {
    name?: string;
    estimate?: number;
    tags?: string[];
  };

  if (!name || typeof name !== 'string') {
    fail(res, 'name is required');
    return;
  }

  const tagsJson = JSON.stringify(tags);
  const row = db
    .prepare(
      `INSERT INTO tasks (name, estimate, tags) VALUES (?, ?, ?)
       RETURNING *`,
    )
    .get(name, estimate, tagsJson) as Record<string, unknown>;

  logCommand(req, 'task:create', { name, estimate, tags });
  ok(res, parseTask(row));
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, estimate, tags } = req.body as {
    name?: string;
    estimate?: number;
    tags?: string[];
  };

  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as
    | Record<string, unknown>
    | undefined;
  if (!existing) {
    fail(res, 'task not found', 404);
    return;
  }

  const updates: string[] = ['updated_at = datetime(\'now\')'];
  const params: unknown[] = [];

  if (name !== undefined) {
    updates.push('name = ?');
    params.push(name);
  }
  if (estimate !== undefined) {
    updates.push('estimate = ?');
    params.push(estimate);
  }
  if (tags !== undefined) {
    updates.push('tags = ?');
    params.push(JSON.stringify(tags));
  }

  params.push(id);
  db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Record<
    string,
    unknown
  >;
  ok(res, parseTask(updated));
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  if (result.changes === 0) {
    fail(res, 'task not found', 404);
    return;
  }
  ok(res, { deleted: true });
});

router.post('/:id/select', (req, res) => {
  const { id } = req.params;
  const { source } = req.body as { source?: Source };

  const state = timerEngine.selectTask(id, source);
  if (state.currentTaskId !== id) {
    fail(res, 'task not found', 404);
    return;
  }

  logCommand(req, 'task:select', { taskId: id, source });
  ok(res, state);
});

export default router;
