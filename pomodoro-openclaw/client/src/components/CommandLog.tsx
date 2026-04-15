import { CommandEntry } from '../lib/types';
import { Badge } from './ui/Badge';
import { formatTime } from '../lib/format';

interface CommandLogProps {
  entries: CommandEntry[];
}

function summarizePayload(payload: Record<string, unknown>): string {
  const keys = Object.keys(payload);
  if (keys.length === 0) return '';
  return keys
    .slice(0, 3)
    .map((k) => {
      const v = payload[k];
      const display =
        typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'
          ? String(v)
          : JSON.stringify(v);
      return `${k}: ${display}`;
    })
    .join(', ');
}

const MAX_ENTRIES = 20;

export function CommandLog({ entries }: CommandLogProps) {
  const visible = entries.slice(0, MAX_ENTRIES);

  return (
    <div className="flex flex-col h-full min-h-0">
      <h2 className="text-sm font-semibold mb-3 shrink-0" style={{ color: 'var(--text)' }}>
        Commands
      </h2>

      <div className="flex-1 overflow-y-auto min-h-0">
        {visible.length === 0 ? (
          <p className="py-6 text-center" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            No commands yet.
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {visible.map((entry) => {
              const summary = summarizePayload(entry.payload);
              return (
                <div
                  key={entry.id}
                  className="flex items-start gap-2 px-2 py-2 rounded-md"
                  style={{ background: 'var(--surface-2)' }}
                >
                  {/* Source badge */}
                  <Badge variant={entry.source === 'openclaw' ? 'openclaw' : 'manual'}>
                    {entry.source === 'openclaw' ? 'OpenClaw' : 'Manual'}
                  </Badge>

                  {/* Action + payload */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-xs truncate"
                      style={{ color: 'var(--text)', lineHeight: 1.4 }}
                    >
                      {entry.action}
                    </p>
                    {summary && (
                      <p
                        className="text-xs truncate"
                        style={{ color: 'var(--text-muted)', fontSize: 11, lineHeight: 1.4 }}
                      >
                        {summary}
                      </p>
                    )}
                  </div>

                  {/* Timestamp */}
                  <span
                    className="shrink-0 text-xs tabular-nums mt-0.5"
                    style={{ color: 'var(--text-faint)', fontFamily: 'var(--font-mono)', fontSize: 11 }}
                  >
                    {formatTime(entry.timestamp)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
