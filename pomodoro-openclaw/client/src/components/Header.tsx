interface TodayStats {
  focusCount: number;
  focusMinutes: number;
  breakCount: number;
  tasksWorked: number;
}

interface HeaderProps {
  todayStats: TodayStats;
  connected: boolean;
}

export function Header({ todayStats, connected }: HeaderProps) {
  const { focusCount, focusMinutes, tasksWorked } = todayStats;
  const hours = Math.floor(focusMinutes / 60);
  const mins = focusMinutes % 60;
  const durationLabel = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  return (
    <header
      className="sticky top-0 z-50 h-14 flex items-center px-4 gap-4"
      style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {/* Logo + Title */}
      <div className="flex items-center gap-2.5 shrink-0">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Tomato body */}
          <circle cx="12" cy="14" r="8" fill="var(--primary)" />
          {/* Leaf */}
          <path
            d="M12 6 C10 4, 7 4, 8 7 C9 8, 11 7.5, 12 6Z"
            fill="var(--break-color)"
          />
          <path
            d="M12 6 C14 4, 17 4, 16 7 C15 8, 13 7.5, 12 6Z"
            fill="var(--break-color)"
          />
          {/* Stem */}
          <line
            x1="12"
            y1="6"
            x2="12"
            y2="4"
            stroke="var(--break-color)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          {/* Shine */}
          <circle cx="9.5" cy="11.5" r="1.5" fill="white" opacity="0.2" />
        </svg>

        <div className="flex items-baseline gap-1.5">
          <span style={{ color: 'var(--text)', fontWeight: 600, fontSize: 16 }}>Pomodoro</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>OpenClaw</span>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Stats pill */}
      {focusCount > 0 && (
        <div
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
          style={{
            background: 'var(--surface-3)',
            color: 'var(--text-muted)',
            border: '1px solid var(--border)',
          }}
        >
          <span>🍅 {focusCount}</span>
          <span style={{ color: 'var(--text-faint)' }}>·</span>
          <span>{durationLabel} focus</span>
          <span style={{ color: 'var(--text-faint)' }}>·</span>
          <span>{tasksWorked} tasks</span>
        </div>
      )}

      {/* Connection indicator */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span
          className="inline-block rounded-full"
          style={{
            width: 8,
            height: 8,
            background: connected ? '#4ade80' : 'var(--error)',
            boxShadow: connected ? '0 0 6px #4ade8088' : '0 0 6px var(--error)88',
          }}
        />
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {connected ? 'Connected' : 'Offline'}
        </span>
      </div>
    </header>
  );
}
