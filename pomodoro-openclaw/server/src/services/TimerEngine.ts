import { EventEmitter } from 'events';
import { randomBytes } from 'crypto';
import { db, getSetting } from '../db/index.js';
import type { TimerPhase, TimerStatus, TimerState, Source } from '../types.js';

function genId(): string {
  return randomBytes(8).toString('hex');
}

function getDuration(phase: TimerPhase): number {
  if (phase === 'focus') return parseInt(getSetting('focus_duration') ?? '1500', 10);
  if (phase === 'short_break') return parseInt(getSetting('short_break_duration') ?? '300', 10);
  if (phase === 'long_break') return parseInt(getSetting('long_break_duration') ?? '900', 10);
  return 0;
}

function getLongBreakInterval(): number {
  return parseInt(getSetting('long_break_interval') ?? '4', 10);
}

function isAutoAdvance(): boolean {
  return getSetting('auto_advance') === 'true';
}

class TimerEngine extends EventEmitter {
  private state: TimerState = {
    phase: 'idle',
    status: 'stopped',
    secondsRemaining: 0,
    totalSeconds: 0,
    cycleCount: 0,
    currentTaskId: null,
    currentTaskName: null,
    startedAt: null,
    lastSource: 'manual',
  };

  private ticker: ReturnType<typeof setInterval> | null = null;
  private sessionStartedAt: string | null = null;

  private clearTicker(): void {
    if (this.ticker !== null) {
      clearInterval(this.ticker);
      this.ticker = null;
    }
  }

  private startTicker(): void {
    this.clearTicker();
    this.ticker = setInterval(() => {
      this.state.secondsRemaining = Math.max(0, this.state.secondsRemaining - 1);
      this.emit('tick', { secondsRemaining: this.state.secondsRemaining });
      if (this.state.secondsRemaining === 0) {
        this.clearTicker();
        this.onComplete();
      }
    }, 1000);
  }

  getState(): TimerState {
    return { ...this.state };
  }

  start(opts: { phase?: TimerPhase; taskId?: string; source?: Source } = {}): TimerState {
    this.clearTicker();

    const source: Source = opts.source ?? 'manual';
    const phase: TimerPhase =
      opts.phase ?? (this.state.phase === 'idle' ? 'focus' : this.state.phase);

    const duration = getDuration(phase);
    const now = new Date().toISOString();

    // Look up task name if taskId provided
    let taskName: string | null = this.state.currentTaskName;
    let taskId: string | null = this.state.currentTaskId;
    if (opts.taskId !== undefined) {
      taskId = opts.taskId;
      const row = db.prepare('SELECT name FROM tasks WHERE id = ?').get(opts.taskId) as
        | { name: string }
        | undefined;
      taskName = row?.name ?? null;
    }

    this.state = {
      ...this.state,
      phase,
      status: 'running',
      secondsRemaining: duration,
      totalSeconds: duration,
      currentTaskId: taskId,
      currentTaskName: taskName,
      startedAt: now,
      lastSource: source,
    };

    this.sessionStartedAt = now;
    this.startTicker();

    this.emit('stateChange', this.getState());
    this.emit('started', this.getState());
    return this.getState();
  }

  pause(source: Source = 'manual'): TimerState {
    if (this.state.status !== 'running') return this.getState();
    this.clearTicker();
    this.state.status = 'paused';
    this.state.lastSource = source;
    this.emit('stateChange', this.getState());
    this.emit('paused', this.getState());
    return this.getState();
  }

  resume(source: Source = 'manual'): TimerState {
    if (this.state.status !== 'paused') return this.getState();
    this.state.status = 'running';
    this.state.lastSource = source;
    this.startTicker();
    this.emit('stateChange', this.getState());
    this.emit('resumed', this.getState());
    return this.getState();
  }

  reset(source: Source = 'manual'): TimerState {
    this.clearTicker();
    this.state = {
      phase: 'idle',
      status: 'stopped',
      secondsRemaining: 0,
      totalSeconds: 0,
      cycleCount: this.state.cycleCount,
      currentTaskId: this.state.currentTaskId,
      currentTaskName: this.state.currentTaskName,
      startedAt: null,
      lastSource: source,
    };
    this.sessionStartedAt = null;
    this.emit('stateChange', this.getState());
    this.emit('reset', this.getState());
    return this.getState();
  }

  skip(source: Source = 'manual'): TimerState {
    this.clearTicker();
    const wasRunningOrPaused =
      this.state.status === 'running' || this.state.status === 'paused';
    const interrupted = wasRunningOrPaused && this.state.secondsRemaining > 0;

    if (this.state.phase !== 'idle') {
      this.saveSession(interrupted);
    }

    const prevPhase = this.state.phase;
    this.advancePhase(prevPhase, source);

    this.emit('stateChange', this.getState());
    this.emit('skipped', this.getState());
    return this.getState();
  }

  selectTask(taskId: string, source: Source = 'manual'): TimerState {
    const row = db.prepare('SELECT name FROM tasks WHERE id = ?').get(taskId) as
      | { name: string }
      | undefined;
    if (!row) return this.getState();

    this.state.currentTaskId = taskId;
    this.state.currentTaskName = row.name;
    this.state.lastSource = source;

    this.emit('stateChange', this.getState());
    this.emit('task:selected', { taskId, taskName: row.name });
    return this.getState();
  }

  applySettings(): void {
    // Called after settings update — if timer is stopped/idle, update duration to new values
    if (this.state.status === 'stopped' && this.state.phase !== 'idle') {
      const duration = getDuration(this.state.phase);
      this.state.secondsRemaining = duration;
      this.state.totalSeconds = duration;
      this.emit('stateChange', this.getState());
    }
  }

  private saveSession(interrupted: boolean): void {
    if (this.state.phase === 'idle') return;

    const startedAt = this.sessionStartedAt ?? new Date().toISOString();
    const endedAt = new Date().toISOString();
    const durationSec = this.state.totalSeconds - this.state.secondsRemaining;

    if (durationSec <= 0) return; // Nothing to save

    const sessionId = genId();

    db.prepare(
      `INSERT INTO sessions (id, task_id, task_name, type, duration_sec, interrupted, source, started_at, ended_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      sessionId,
      this.state.currentTaskId,
      this.state.currentTaskName,
      this.state.phase,
      durationSec,
      interrupted ? 1 : 0,
      this.state.lastSource,
      startedAt,
      endedAt,
    );

    // Increment task.completed if focus session and task set
    if (this.state.phase === 'focus' && this.state.currentTaskId) {
      db.prepare('UPDATE tasks SET completed = completed + 1 WHERE id = ?').run(
        this.state.currentTaskId,
      );
    }

    this.lastSessionId = sessionId;
  }

  private lastSessionId: string | null = null;

  private onComplete(): void {
    const completedPhase = this.state.phase;
    this.saveSession(false);

    const sessionId = this.lastSessionId;
    this.emit('completed', { phase: completedPhase, sessionId });

    if (isAutoAdvance()) {
      this.advancePhase(completedPhase, this.state.lastSource);
      this.emit('stateChange', this.getState());
    } else {
      this.state.status = 'stopped';
      this.emit('stateChange', this.getState());
    }
  }

  private advancePhase(fromPhase: TimerPhase, source: Source): void {
    let nextPhase: TimerPhase;

    if (fromPhase === 'focus') {
      // Increment cycle count
      this.state.cycleCount += 1;
      const interval = getLongBreakInterval();
      nextPhase = this.state.cycleCount % interval === 0 ? 'long_break' : 'short_break';
    } else {
      // break → focus
      nextPhase = 'focus';
    }

    const duration = getDuration(nextPhase);
    this.state.phase = nextPhase;
    this.state.status = 'running';
    this.state.secondsRemaining = duration;
    this.state.totalSeconds = duration;
    this.state.startedAt = new Date().toISOString();
    this.state.lastSource = source;
    this.sessionStartedAt = this.state.startedAt;

    this.startTicker();
  }
}

export const timerEngine = new TimerEngine();
