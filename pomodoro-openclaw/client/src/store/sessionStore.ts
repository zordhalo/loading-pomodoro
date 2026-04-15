import { create } from 'zustand';
import type { Session, CommandEntry } from '../lib/types';

export interface TodayStats {
  focusCount: number;
  focusMinutes: number;
  breakCount: number;
  tasksWorked: number;
}

interface SessionStore {
  sessions: Session[];
  todayStats: TodayStats;
  commands: CommandEntry[];

  setSessions: (sessions: Session[]) => void;
  addSession: (session: Session) => void;

  setTodayStats: (stats: TodayStats) => void;

  setCommands: (commands: CommandEntry[]) => void;
  addCommand: (entry: CommandEntry) => void;
}

const defaultStats: TodayStats = {
  focusCount: 0,
  focusMinutes: 0,
  breakCount: 0,
  tasksWorked: 0,
};

export const useSessionStore = create<SessionStore>((set) => ({
  sessions: [],
  todayStats: defaultStats,
  commands: [],

  setSessions: (sessions) => set({ sessions }),

  addSession: (session) =>
    set((prev) => ({
      sessions: [session, ...prev.sessions].slice(0, 50),
    })),

  setTodayStats: (stats) => set({ todayStats: stats }),

  setCommands: (commands) => set({ commands }),

  addCommand: (entry) =>
    set((prev) => ({
      commands: [entry, ...prev.commands].slice(0, 20),
    })),
}));
