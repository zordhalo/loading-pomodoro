import { create } from 'zustand';
import type { Task } from '../lib/types';

interface TaskStore {
  tasks: Task[];
  selectedTaskId: string | null;
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  removeTask: (id: string) => void;
  selectTask: (id: string | null) => void;
}

export const useTaskStore = create<TaskStore>((set) => ({
  tasks: [],
  selectedTaskId: null,

  setTasks: (tasks) => set({ tasks }),

  addTask: (task) => set((prev) => ({ tasks: [...prev.tasks, task] })),

  updateTask: (id, patch) =>
    set((prev) => ({
      tasks: prev.tasks.map((t) =>
        t.id === id ? { ...t, ...patch, updated_at: new Date().toISOString() } : t,
      ),
    })),

  removeTask: (id) =>
    set((prev) => ({
      tasks: prev.tasks.filter((t) => t.id !== id),
      selectedTaskId: prev.selectedTaskId === id ? null : prev.selectedTaskId,
    })),

  selectTask: (id) => set({ selectedTaskId: id }),
}));

/** Returns the currently selected task object, or null. */
export function useActiveTask(): Task | null {
  return useTaskStore((s) => s.tasks.find((t) => t.id === s.selectedTaskId) ?? null);
}
