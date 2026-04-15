import { useEffect, useRef, useState } from 'react';
import { useTimerStore } from '../store/timerStore';
import { useTaskStore } from '../store/taskStore';
import { useSessionStore } from '../store/sessionStore';
import type { TimerState, CommandEntry } from '../lib/types';

// ── Derive WS URL from VITE_API_URL ───────────────────────────────────────────

function buildWsUrl(): string {
  const apiUrl = import.meta.env['VITE_API_URL'] ?? 'http://localhost:3001';
  const token = import.meta.env['VITE_API_TOKEN'] ?? 'dev-token-local';

  // Replace http(s) with ws(s)
  const wsBase = apiUrl.replace(/^http/, 'ws');
  return `${wsBase}?token=${encodeURIComponent(token)}`;
}

// ── Type guards ───────────────────────────────────────────────────────────────

function isTimerState(data: unknown): data is TimerState {
  if (typeof data !== 'object' || data === null) return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d['phase'] === 'string' &&
    typeof d['status'] === 'string' &&
    typeof d['secondsRemaining'] === 'number'
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export interface WsEvent {
  event: string;
  data: unknown;
}

export function useWebSocket(): { connected: boolean; lastEvent: WsEvent | null } {
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<WsEvent | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backoffRef = useRef<number>(1000);
  const unmountedRef = useRef(false);

  const { setTimerState, patchTick } = useTimerStore.getState();
  const { selectTask } = useTaskStore.getState();
  const { addCommand } = useSessionStore.getState();

  useEffect(() => {
    unmountedRef.current = false;

    function connect() {
      if (unmountedRef.current) return;

      const url = buildWsUrl();
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.addEventListener('open', () => {
        if (unmountedRef.current) {
          ws.close();
          return;
        }
        setConnected(true);
        backoffRef.current = 1000; // reset backoff on successful connection
      });

      ws.addEventListener('message', (event) => {
        let parsed: { event: string; data: unknown };
        try {
          parsed = JSON.parse(event.data as string) as { event: string; data: unknown };
        } catch {
          return;
        }

        const { event: evtName, data } = parsed;
        setLastEvent({ event: evtName, data });

        switch (evtName) {
          case 'timer:tick': {
            const d = data as { secondsRemaining?: number };
            if (typeof d?.secondsRemaining === 'number') {
              patchTick(d.secondsRemaining);
            }
            break;
          }

          case 'timer:started':
          case 'timer:paused':
          case 'timer:resumed':
          case 'timer:skipped':
          case 'timer:reset':
          case 'timer:state': {
            if (isTimerState(data)) {
              setTimerState(data);
            }
            break;
          }

          case 'timer:completed': {
            // Leave state to the subsequent timer:state event from the server.
            // Optionally update if a full state is included in the payload.
            if (isTimerState(data)) {
              setTimerState(data);
            }
            break;
          }

          case 'task:selected': {
            const d = data as { task?: { id?: string } };
            if (d?.task?.id) {
              selectTask(d.task.id);
            }
            break;
          }

          case 'command:logged': {
            // data is a CommandEntry from the server
            const entry = data as CommandEntry;
            if (entry && typeof entry.id === 'string') {
              addCommand(entry);
            }
            break;
          }

          default:
            break;
        }
      });

      ws.addEventListener('close', () => {
        setConnected(false);
        wsRef.current = null;

        if (unmountedRef.current) return;

        // Exponential backoff capped at 30s
        const delay = backoffRef.current;
        backoffRef.current = Math.min(backoffRef.current * 2, 30_000);

        reconnectTimerRef.current = setTimeout(() => {
          connect();
        }, delay);
      });

      ws.addEventListener('error', () => {
        // The close event will fire after error and trigger reconnect
      });
    }

    connect();

    return () => {
      unmountedRef.current = true;
      if (reconnectTimerRef.current !== null) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { connected, lastEvent };
}
