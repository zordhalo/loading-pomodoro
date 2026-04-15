import { WebSocketServer } from 'ws';
import type { IncomingMessage } from 'http';
import type { Server } from 'http';
import type { WebSocket } from 'ws';
import { timerEngine } from '../services/TimerEngine.js';
import { setServer, broadcast, commandBus } from './broadcast.js';

let warnedOnce = false;

export const wss = new WebSocketServer({ noServer: true });

setServer(wss);

// Ping/pong heartbeat tracking
const alive = new WeakMap<WebSocket, boolean>();

function noop(): void {}

function heartbeat(this: WebSocket): void {
  alive.set(this, true);
}

const pingInterval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (alive.get(ws) === false) {
      ws.terminate();
      return;
    }
    alive.set(ws, false);
    ws.ping(noop);
  });
}, 30_000);

wss.on('close', () => clearInterval(pingInterval));

wss.on('connection', (ws: WebSocket) => {
  alive.set(ws, true);
  ws.on('pong', heartbeat.bind(ws));

  // Send current state immediately
  ws.send(JSON.stringify({ event: 'timer:state', data: timerEngine.getState() }));
});

// Subscribe to TimerEngine events
timerEngine.on('tick', (data: unknown) => broadcast('timer:tick', data));
timerEngine.on('stateChange', (data: unknown) => broadcast('timer:stateChange', data));
timerEngine.on('started', (data: unknown) => broadcast('timer:started', data));
timerEngine.on('paused', (data: unknown) => broadcast('timer:paused', data));
timerEngine.on('resumed', (data: unknown) => broadcast('timer:resumed', data));
timerEngine.on('completed', (data: unknown) => broadcast('timer:completed', data));
timerEngine.on('skipped', (data: unknown) => broadcast('timer:skipped', data));
timerEngine.on('reset', (data: unknown) => broadcast('timer:reset', data));
timerEngine.on('task:selected', (data: unknown) => broadcast('task:selected', data));

// Subscribe to commandBus
commandBus.on('command:logged', (data: unknown) => broadcast('command:logged', data));

export function attach(httpServer: Server): void {
  httpServer.on('upgrade', (req: IncomingMessage, socket, head) => {
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
    const token = url.searchParams.get('token') ?? '';
    const envToken = process.env.POMODORO_API_TOKEN;

    if (process.env.NODE_ENV === 'development' && !envToken) {
      if (!warnedOnce) {
        console.warn('[ws] POMODORO_API_TOKEN not set — skipping auth in development mode');
        warnedOnce = true;
      }
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
      });
      return;
    }

    if (!envToken || token !== envToken) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  });
}
