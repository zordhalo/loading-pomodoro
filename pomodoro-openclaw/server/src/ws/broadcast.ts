import { EventEmitter } from 'events';
import type { WebSocketServer, WebSocket } from 'ws';

const clients = new Set<WebSocket>();
let wss: WebSocketServer | null = null;

export const commandBus = new EventEmitter();

export function setServer(server: WebSocketServer): void {
  wss = server;
  server.on('connection', (ws: WebSocket) => {
    clients.add(ws);
    ws.on('close', () => {
      clients.delete(ws);
    });
  });
}

export function broadcast(event: string, data: unknown): void {
  const msg = JSON.stringify({ event, data });
  for (const client of clients) {
    if (client.readyState === 1 /* OPEN */) {
      client.send(msg);
    }
  }
}

// Suppress unused wss lint if needed
void wss;
