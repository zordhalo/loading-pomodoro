import { useEffect } from 'react';
import * as api from '../lib/api';
import { useTimerStore } from '../store/timerStore';
import { useTaskStore } from '../store/taskStore';
import { useSessionStore } from '../store/sessionStore';

/**
 * One-shot bootstrap on app mount.
 * Fetches status (timer + todayStats + activeTask), tasks, and recent sessions in parallel.
 * Commands start empty and are populated via WebSocket events.
 */
export function useBootstrap(): void {
  useEffect(() => {
    const { setTimerState } = useTimerStore.getState();
    const { setTasks, selectTask } = useTaskStore.getState();
    const { setSessions, setTodayStats } = useSessionStore.getState();

    void Promise.allSettled([
      api.status.get().then((payload) => {
        setTimerState(payload.timer);
        setTodayStats(payload.todayStats);
        // If the timer has an active task, mark it as selected in the task store
        if (payload.timer.currentTaskId) {
          selectTask(payload.timer.currentTaskId);
        }
      }),
      api.tasks.list().then((taskList) => {
        setTasks(taskList);
      }),
      api.sessions.list({ limit: 50 }).then((sessionList) => {
        setSessions(sessionList);
      }),
    ]);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
