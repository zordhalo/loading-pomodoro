import type { Request } from 'express';
import { randomBytes } from 'crypto';
import type { CommandEntry, Source } from '../types.js';
import { commandLog } from '../services/CommandLog.js';
import { commandBus } from '../ws/broadcast.js';

export function logCommand(
  req: Request,
  action: string,
  payload: Record<string, unknown>,
  status: 'ok' | 'error' = 'ok',
  note?: string,
): CommandEntry {
  const source: Source =
    (req.body?.source as Source) ?? (req.query['source'] as Source) ?? 'manual';

  const entry: CommandEntry = {
    id: randomBytes(8).toString('hex'),
    timestamp: new Date().toISOString(),
    source,
    action,
    payload,
    status,
    note,
  };

  commandLog.push(entry);
  commandBus.emit('command:logged', entry);
  return entry;
}
