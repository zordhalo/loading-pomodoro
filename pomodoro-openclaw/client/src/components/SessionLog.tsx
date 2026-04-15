import { Session } from '../lib/types';
import { Badge } from './ui/Badge';
import { formatTime } from '../lib/format';

interface SessionLogProps {
  sessions: Session[];
}

function formatSessionDuration(seconds: number): string {
  const m = Math.round(seconds / 60);
  return `${m}m`;
}

export function SessionLog({ sessions }: SessionLogProps) {
  return (
    <div className="flex flex-col h-full min-h-0">
      <h2 className="text-sm font-semibold mb-3 shrink-0" style={{ color: 'var(--text)' }}>
        Today
      </h2>

      <div className="flex-1 overflow-y-auto min-h-0">
        {sessions.length === 0 ? (
          <p className="py-6 text-center" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            No sessions yet today.
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center gap-2 px-2 py-2 rounded-md"
                style={{ background: 'var(--surface-2)' }}
              >
                {/* Type badge */}
                <Badge
                  variant={
                    session.type === 'focus'
                      ? 'focus'
                      : session.type === 'short_break'
                      ? 'break'
                      : 'longBreak'
                  }
                >
                  {session.type === 'focus'
                    ? 'Focus'
                    : session.type === 'short_break'
                    ? 'Break'
                    : 'Long'}
                </Badge>

                {/* Task name */}
                <span
                  className="flex-1 truncate text-xs"
                  style={{ color: 'var(--text-muted)' }}
                  title={session.task_name ?? undefined}
                >
                  {session.task_name ?? 'No task'}
                </span>

                {/* Duration */}
                <span
                  className="shrink-0 text-xs tabular-nums"
                  style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
                >
                  {formatSessionDuration(session.duration_sec)}
                </span>

                {/* Time */}
                <span
                  className="shrink-0 text-xs tabular-nums"
                  style={{ color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}
                >
                  {formatTime(session.started_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
