import type { Response } from 'express';

export function ok(res: Response, data: unknown): void {
  res.json({ ok: true, data });
}

export function fail(res: Response, error: string, code = 400): void {
  res.status(code).json({ ok: false, error });
}
