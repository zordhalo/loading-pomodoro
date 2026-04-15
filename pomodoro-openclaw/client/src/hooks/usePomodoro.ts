import { useCallback } from 'react';
import { useTimerStore } from '../store/timerStore';
import { useTaskStore, useActiveTask } from '../store/taskStore';
import { useSessionStore } from '../store/sessionStore';
import * as api from '../lib/api';
import type { TimerState, Task, Session, CommandEntry } from '../lib/types';
import type { TodayStats } from '../store/sessionStore';

interface PomodoroActions {
  start: (phase?: string, taskId?: string) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  reset: () => Promise<void>;
  skip: () => Promise<void>;
  addTask: (name: string, estimate: number) => Promise<void>;
  updateTask: (id: string, patch: Partial<Pick<Task, 'name' | 'estimate' | 'tags'>>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  selectTask: (id: string) => Promise<void>;
}

interface PomodoroHook {
  timer: TimerState;
  tasks: Task[];
  selectedTaskId: string | null;
  activeTask: Task | null;
  sessions: Session[];
  todayStats: TodayStats;
  commands: CommandEntry[];
  actions: PomodoroActions;
}

export function usePomodoro(): PomodoroHook {
  const timerState = useTimerStore((s) => s.state);
  const setTimerState = useTimerStore((s) => s.setTimerState);

  const tasks = useTaskStore((s) => s.tasks);
  const selectedTaskId = useTaskStore((s) => s.selectedTaskId);
  const { addTask: storeAddTask, updateTask: storeUpdateTask, removeTask, selectTask: storeSelectTask } = useTaskStore.getState();

  const activeTask = useActiveTask();

  const sessions = useSessionStore((s) => s.sessions);
  const todayStats = useSessionStore((s) => s.todayStats);
  const commands = useSessionStore((s) => s.commands);
  const { addCommand } = useSessionStore.getState();

  // ── Error helper ─────────────────────────────────────────────────────────────

  const pushError = useCallback(
    (action: string, err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      const entry: CommandEntry = {
        id: `err-${Date.now()}`,
        timestamp: new Date().toISOString(),
        source: 'manual',
        action,
        payload: {},
        status: 'error',
        note: message,
      };
      addCommand(entry);
    },
    [addCommand],
  );

  // ── Timer actions ─────────────────────────────────────────────────────────────

  const start = useCallback(
    async (phase?: string, taskId?: string) => {
      try {
        const state = await api.timer.start({ phase, taskId, source: 'manual' });
        setTimerState(state);
      } catch (err) {
        pushError('start', err);
      }
    },
    [setTimerState, pushError],
  );

  const pause = useCallback(async () => {
    try {
      const state = await api.timer.pause('manual');
      setTimerState(state);
    } catch (err) {
      pushError('pause', err);
    }
  }, [setTimerState, pushError]);

  const resume = useCallback(async () => {
    try {
      const state = await api.timer.resume('manual');
      setTimerState(state);
    } catch (err) {
      pushError('resume', err);
    }
  }, [setTimerState, pushError]);

  const reset = useCallback(async () => {
    try {
      const state = await api.timer.reset('manual');
      setTimerState(state);
    } catch (err) {
      pushError('reset', err);
    }
  }, [setTimerState, pushError]);

  const skip = useCallback(async () => {
    try {
      const state = await api.timer.skip('manual');
      setTimerState(state);
    } catch (err) {
      pushError('skip', err);
    }
  }, [setTimerState, pushError]);

  // ── Task actions ──────────────────────────────────────────────────────────────

  const addTask = useCallback(
    async (name: string, estimate: number) => {
      try {
        const task = await api.tasks.create({ name, estimate });
        storeAddTask(task);
      } catch (err) {
        pushError('addTask', err);
      }
    },
    [storeAddTask, pushError],
  );

  const updateTask = useCallback(
    async (id: string, patch: Partial<Pick<Task, 'name' | 'estimate' | 'tags'>>) => {
      try {
        const updated = await api.tasks.update(id, patch);
        storeUpdateTask(id, updated);
      } catch (err) {
        pushError('updateTask', err);
      }
    },
    [storeUpdateTask, pushError],
  );

  const deleteTask = useCallback(
    async (id: string) => {
      try {
        await api.tasks.remove(id);
        removeTask(id);
      } catch (err) {
        pushError('deleteTask', err);
      }
    },
    [removeTask, pushError],
  );

  const selectTask = useCallback(
    async (id: string) => {
      try {
        // Server links task to timer and returns new TimerState
        const timerStateFromServer = await api.tasks.select(id);
        setTimerState(timerStateFromServer);
        storeSelectTask(id);
      } catch (err) {
        pushError('selectTask', err);
      }
    },
    [setTimerState, storeSelectTask, pushError],
  );

  return {
    timer: timerState,
    tasks,
    selectedTaskId,
    activeTask,
    sessions,
    todayStats,
    commands,
    actions: {
      start,
      pause,
      resume,
      reset,
      skip,
      addTask,
      updateTask,
      deleteTask,
      selectTask,
    },
  };
}
