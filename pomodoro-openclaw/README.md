# Pomodoro Dashboard + OpenClaw Controller

Local-first Pomodoro productivity dashboard controllable via [OpenClaw](https://github.com/openclaw/openclaw).

- React 19 + Vite 6 frontend (dark theme, three-column layout)
- Node/Express 4 + better-sqlite3 + WebSocket backend
- OpenClaw skill that maps natural language to REST calls
- Command log shows every action's source: **Manual** vs **OpenClaw**

## Quick Start

### Requirements
- Node 22+
- pnpm 9+ (or npm)

### Setup
```bash
pnpm install
cp .env.example .env
pnpm dev
```

Open http://localhost:5173. The API runs on http://localhost:3001.

If you're on a Node version that needs a native rebuild for better-sqlite3:
```bash
cd server && npm rebuild better-sqlite3
```

## Architecture

```
pomodoro-openclaw/
├── client/           React 19 + Vite + Tailwind v4 + Zustand
│   ├── components/   TimerCard, TaskPanel, SessionLog, CommandLog, Header
│   ├── hooks/        useWebSocket, usePomodoro, useBootstrap
│   ├── store/        timerStore, taskStore, sessionStore (Zustand)
│   └── lib/          api.ts (axios), types.ts, cn.ts, format.ts
├── server/           Express 4 + better-sqlite3 + ws
│   ├── db/           SQLite schema + connection
│   ├── routes/       timer, tasks, sessions, status, settings
│   ├── services/     TimerEngine (singleton), CommandLog (ring buffer)
│   └── ws/           WebSocket server with broadcast + heartbeat
└── openclaw-skill/   SKILL.md
```

## OpenClaw Integration

### Install the skill
```bash
mkdir -p ~/.openclaw/workspace/skills/pomodoro-controller
cp openclaw-skill/SKILL.md ~/.openclaw/workspace/skills/pomodoro-controller/SKILL.md
```

### Configure env
Add to `~/.openclaw/openclaw.json` or your shell:
```json
{
  "env": {
    "POMODORO_API_URL": "http://localhost:3001",
    "POMODORO_API_TOKEN": "dev-token-local"
  }
}
```

### Use from OpenClaw
Once the dashboard is running and the skill is loaded:
- "Start a 25-minute focus session for task review"
- "Take a short break"
- "How many pomodoros have I done today?"
- "Create a task called fix the auth bug with 3 pomodoros"
- "What am I working on?"

## API Reference

All endpoints require `Authorization: Bearer ${POMODORO_API_TOKEN}`. All responses are `{ ok: true, data }` or `{ ok: false, error }`.

| Method | Path | Description |
|---|---|---|
| GET | `/healthz` | Liveness probe (no auth) |
| POST | `/api/timer/start` | Start/restart timer; body `{phase?, taskId?, source?}` |
| POST | `/api/timer/pause` | Pause running timer |
| POST | `/api/timer/resume` | Resume paused timer |
| POST | `/api/timer/reset` | Reset to idle |
| POST | `/api/timer/skip` | End current phase, advance |
| GET | `/api/timer/state` | Current TimerState |
| GET | `/api/tasks` | List tasks |
| POST | `/api/tasks` | Create; body `{name, estimate?, tags?}` |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |
| POST | `/api/tasks/:id/select` | Set as active task |
| GET | `/api/sessions` | Query `?limit&date` |
| GET | `/api/sessions/today-stats` | Today's aggregate |
| GET | `/api/status` | Combined snapshot |
| GET | `/api/settings` | Read settings |
| PUT | `/api/settings` | Body `{key, value}` |

### WebSocket
Connect: `ws://localhost:3001?token=${POMODORO_API_TOKEN}`

Events: `timer:tick`, `timer:started`, `timer:paused`, `timer:resumed`, `timer:completed`, `timer:skipped`, `timer:reset`, `timer:state`, `task:selected`, `command:logged`.

Payload: `{ event: string, data: ... }`.

## Development

- `pnpm dev` — run both client (5173) and server (3001) concurrently
- `pnpm build` — typecheck both workspaces and produce production builds
- `pnpm typecheck` — just typecheck both sides

### Extending
Ideas:
- Add Tailscale Serve so OpenClaw on another device can control your desktop timer
- Webhook relay: server POSTs to an OpenClaw webhook on session completion → phone notification
- Keyboard shortcuts (Space=start/pause, S=skip, R=reset)
- Weekly stats chart
- Multi-device sync via Turso/libSQL

## License
MIT (or your choice).
