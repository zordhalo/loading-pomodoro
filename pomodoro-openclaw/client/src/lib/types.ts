// Kept in sync with server/src/types.ts

export type TimerPhase = 'idle' | 'focus' | 'short_break' | 'long_break';
export type TimerStatus = 'stopped' | 'running' | 'paused';
export type Source = 'manual' | 'openclaw';

export interface TimerState {
  phase: TimerPhase;
  status: TimerStatus;
  secondsRemaining: number;
  totalSeconds: number;
  cycleCount: number;
  currentTaskId: string | null;
  currentTaskName: string | null;
  startedAt: string | null;
  lastSource: Source;
}

export interface Task {
  id: string;
  name: string;
  estimate: number;
  completed: number;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  task_id: string | null;
  task_name: string | null;
  type: 'focus' | 'short_break' | 'long_break';
  duration_sec: number;
  interrupted: boolean;
  source: Source;
  started_at: string;
  ended_at: string;
}

export interface CommandEntry {
  id: string;
  timestamp: string;
  source: Source;
  action: string;
  payload: Record<string, unknown>;
  status: 'ok' | 'error';
  note?: string;
}
