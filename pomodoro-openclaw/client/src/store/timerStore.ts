import { create } from 'zustand';
import type { TimerState } from '../lib/types';

const initial: TimerState = {
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

interface TimerStore {
  state: TimerState;
  setTimerState: (s: TimerState) => void;
  patchTick: (secondsRemaining: number) => void;
}

export const useTimerStore = create<TimerStore>((set) => ({
  state: initial,
  setTimerState: (s) => set({ state: s }),
  patchTick: (secondsRemaining) =>
    set((prev) => ({ state: { ...prev.state, secondsRemaining } })),
}));
