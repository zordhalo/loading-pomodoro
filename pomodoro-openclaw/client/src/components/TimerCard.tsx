import { Play, Pause, SkipForward, RotateCcw } from 'lucide-react';
import { TimerState, TimerPhase } from '../lib/types';
import { formatDuration } from '../lib/format';
import { Button } from './ui/Button';

interface TimerCardProps {
  state: TimerState;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onSkip: () => void;
}

const RING_RADIUS = 80;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function phaseStrokeColor(phase: TimerPhase): string {
  switch (phase) {
    case 'focus':
      return 'var(--primary)';
    case 'short_break':
      return 'var(--break-color)';
    case 'long_break':
      return 'var(--long-break-color)';
    default:
      return 'var(--text-faint)';
  }
}

function phaseLabel(phase: TimerPhase): string {
  switch (phase) {
    case 'focus':
      return 'Focus';
    case 'short_break':
      return 'Short Break';
    case 'long_break':
      return 'Long Break';
    default:
      return 'Ready';
  }
}

export function TimerCard({ state, onStart, onPause, onResume, onReset, onSkip }: TimerCardProps) {
  const { phase, status, secondsRemaining, totalSeconds, cycleCount, currentTaskName } = state;

  const progress =
    totalSeconds > 0 ? secondsRemaining / totalSeconds : 1;
  const strokeOffset = RING_CIRCUMFERENCE * (1 - progress);
  const strokeColor = phaseStrokeColor(phase);

  return (
    <div className="flex flex-col items-center gap-6 py-8 px-4">
      {/* Ring */}
      <div className="relative">
        <svg
          viewBox="0 0 200 200"
          width="240"
          height="240"
          aria-label={`Timer: ${formatDuration(secondsRemaining)} remaining`}
          role="img"
        >
          {/* Background track */}
          <circle
            cx="100"
            cy="100"
            r={RING_RADIUS}
            fill="none"
            stroke="var(--surface-3)"
            strokeWidth="8"
          />
          {/* Progress arc */}
          <circle
            cx="100"
            cy="100"
            r={RING_RADIUS}
            fill="none"
            stroke={strokeColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={strokeOffset}
            transform="rotate(-90 100 100)"
            style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease' }}
          />
        </svg>

        {/* Center content overlay */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-1"
          aria-hidden="true"
        >
          <span
            className="uppercase tracking-widest"
            style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.12em' }}
          >
            {phaseLabel(phase)}
          </span>
          <span
            className="tabular-nums"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 52,
              fontWeight: 600,
              color: 'var(--text)',
              lineHeight: 1,
            }}
          >
            {formatDuration(secondsRemaining)}
          </span>
          <span
            className="text-center max-w-[140px] truncate"
            style={{ fontSize: 13, color: 'var(--text-muted)' }}
            title={currentTaskName ?? undefined}
          >
            {currentTaskName ?? 'No task selected'}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {status === 'stopped' && (
          <Button variant="primary" size="md" onClick={onStart}>
            <Play size={15} />
            Start Focus
          </Button>
        )}

        {status === 'running' && (
          <>
            <Button variant="ghost" size="md" onClick={onPause} aria-label="Pause">
              <Pause size={14} />
              Pause
            </Button>
            <Button variant="ghost" size="md" onClick={onSkip} aria-label="Skip">
              <SkipForward size={14} />
              Skip
            </Button>
            <Button variant="ghost" size="md" onClick={onReset} aria-label="Reset">
              <RotateCcw size={14} />
              Reset
            </Button>
          </>
        )}

        {status === 'paused' && (
          <>
            <Button variant="primary" size="md" onClick={onResume} aria-label="Resume">
              <Play size={15} />
              Resume
            </Button>
            <Button variant="ghost" size="md" onClick={onSkip} aria-label="Skip">
              <SkipForward size={14} />
              Skip
            </Button>
            <Button variant="ghost" size="md" onClick={onReset} aria-label="Reset">
              <RotateCcw size={14} />
              Reset
            </Button>
          </>
        )}
      </div>

      {/* Cycle counter */}
      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
        🍅 &times; {cycleCount}
      </div>
    </div>
  );
}
