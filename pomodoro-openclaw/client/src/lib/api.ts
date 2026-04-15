import axios from 'axios';
import type { TimerState, Task, Session, Source } from './types';
import type { TodayStats } from '../store/sessionStore';

// ── Axios instance ─────────────────────────────────────────────────────────────

const baseURL = import.meta.env['VITE_API_URL'] ?? 'http://localhost:3001';
const token = import.meta.env['VITE_API_TOKEN'] ?? 'dev-token-local';

const instance = axios.create({
  baseURL,
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});

// ── Generic unwrap helper ──────────────────────────────────────────────────────

type ApiResponse<T> = { ok: true; data: T } | { ok: false; error: string };

async function request<T>(
  method: 'get' | 'post' | 'put' | 'delete',
  url: string,
  body?: unknown,
  params?: Record<string, unknown>,
): Promise<T> {
  const response = await instance.request<ApiResponse<T>>({
    method,
    url,
    data: body,
    params,
  });
  const payload = response.data;
  if (!payload.ok) {
    throw new Error(payload.error);
  }
  return payload.data;
}

// ── Timer endpoints ────────────────────────────────────────────────────────────

export const timer = {
  start: (body?: { phase?: string; taskId?: string; source?: Source }): Promise<TimerState> =>
    request('post', '/timer/start', { source: 'manual' as Source, ...body }),

  pause: (source: Source = 'manual'): Promise<TimerState> =>
    request('post', '/timer/pause', { source }),

  resume: (source: Source = 'manual'): Promise<TimerState> =>
    request('post', '/timer/resume', { source }),

  reset: (source: Source = 'manual'): Promise<TimerState> =>
    request('post', '/timer/reset', { source }),

  skip: (source: Source = 'manual'): Promise<TimerState> =>
    request('post', '/timer/skip', { source }),

  state: (): Promise<TimerState> => request('get', '/timer/state'),
};

// ── Task endpoints ─────────────────────────────────────────────────────────────

export const tasks = {
  list: (): Promise<Task[]> => request('get', '/tasks'),

  create: (body: { name: string; estimate?: number; tags?: string[] }): Promise<Task> =>
    request('post', '/tasks', body),

  update: (
    id: string,
    patch: Partial<Pick<Task, 'name' | 'estimate' | 'tags'>>,
  ): Promise<Task> => request('put', `/tasks/${id}`, patch),

  remove: (id: string): Promise<void> => request('delete', `/tasks/${id}`),

  /** Returns updated TimerState (server links task to active timer session). */
  select: (id: string): Promise<TimerState> =>
    request('post', `/tasks/${id}/select`, { source: 'manual' as Source }),
};

// ── Session endpoints ──────────────────────────────────────────────────────────

export const sessions = {
  list: (params?: { limit?: number; date?: string }): Promise<Session[]> =>
    request('get', '/sessions', undefined, params as Record<string, unknown>),

  todayStats: (): Promise<TodayStats> => request('get', '/sessions/today-stats'),
};

// ── Status endpoint ────────────────────────────────────────────────────────────

export interface StatusPayload {
  timer: TimerState;
  todayStats: TodayStats;
  activeTask: Task | null;
  version: string;
}

export const status = {
  get: (): Promise<StatusPayload> => request('get', '/status'),
};

// ── Settings endpoints ─────────────────────────────────────────────────────────

export const settings = {
  get: (): Promise<Record<string, string>> => request('get', '/settings'),

  set: (key: string, value: string): Promise<Record<string, string>> =>
    request('put', '/settings', { key, value }),
};
