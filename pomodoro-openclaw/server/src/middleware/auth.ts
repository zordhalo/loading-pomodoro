import type { Request, Response, NextFunction } from 'express';

let warnedOnce = false;

export function auth(req: Request, res: Response, next: NextFunction): void {
  const envToken = process.env.POMODORO_API_TOKEN;

  if (process.env.NODE_ENV === 'development' && !envToken) {
    if (!warnedOnce) {
      console.warn('[auth] POMODORO_API_TOKEN not set — skipping auth in development mode');
      warnedOnce = true;
    }
    next();
    return;
  }

  const header = req.headers['authorization'] ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';

  if (!envToken || token !== envToken) {
    res.status(401).json({ ok: false, error: 'unauthorized' });
    return;
  }

  next();
}
