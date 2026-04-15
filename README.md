# loading-pomodoro

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-%23FE5196?logo=conventionalcommits&logoColor=white)](https://www.conventionalcommits.org)
[![Keep a Changelog](https://img.shields.io/badge/changelog-Keep%20a%20Changelog-%23E05735)](./CHANGELOG.md)

> Loading-doors Pomodoro web app, fully controllable by [OpenClaw](https://github.com/openclaw/openclaw).

A local-first Pomodoro productivity dashboard with a REST + WebSocket control surface and an OpenClaw skill. Every action is tagged with its source (**Manual** vs **OpenClaw**) so the UI shows, in real time, who did what.

The app lives in [`pomodoro-openclaw/`](./pomodoro-openclaw) as a pnpm workspace.

---

## Table of Contents

- [Highlights](#highlights)
- [Screenshots / Layout](#screenshots--layout)
- [Requirements](#requirements)
- [Quick Start](#quick-start)
- [Usage](#usage)
  - [From the browser](#from-the-browser)
  - [From `curl`](#from-curl)
  - [From OpenClaw (natural language)](#from-openclaw-natural-language)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [WebSocket Events](#websocket-events)
- [OpenClaw Integration](#openclaw-integration)
- [Development](#development)
- [Project Layout](#project-layout)
- [Conventions](#conventions)
  - [Commit Messages (Conventional Commits)](#commit-messages-conventional-commits)
  - [Branch Naming](#branch-naming)
  - [Versioning (SemVer)](#versioning-semver)
  - [Changelog (Keep a Changelog)](#changelog-keep-a-changelog)
  - [Code Style](#code-style)
- [Contributing](#contributing)
- [Roadmap](#roadmap)
- [FAQ](#faq)
- [License](#license)

---

## Highlights

- **Three-column dashboard** — Tasks · Timer · Logs. Dark-mode-first, Linear-meets-terminal aesthetic.
- **Circular timer ring** with per-phase color (teal focus · green short break · purple long break).
- **OpenClaw-native** — a drop-in skill lets you say "start a 25-minute focus session for code review" from any OpenClaw channel.
- **Source-aware command log** — every action carries a `source: "manual" | "openclaw"` tag and is visible live.
- **Local-first, no cloud** — SQLite on disk, no external services, no telemetry.
- **Bearer-auth protected** — REST and WebSocket both require a token.
- **Typed end-to-end** — strict TypeScript on both sides, shared interfaces.

## Screenshots / Layout

```
┌────────────────────────────────────────────────────────────────────────────┐
│ 🍅 Pomodoro · OpenClaw      4 🍅 · 1h 40m focus · 2 tasks     ● Connected  │
├──────────────┬──────────────────────────────────┬──────────────────────────┤
│              │                                  │                          │
│   Tasks      │            FOCUS                 │   Today                  │
│              │         ╭─────────╮              │   ── FOCUS  review  25m  │
│  + Add       │        ╱           ╲             │   ── BREAK   —       5m  │
│              │       │   24:37    │             │                          │
│  ▸ review    │        ╲           ╱             │   Commands               │
│    auth bug  │         ╰─────────╯              │   [OpenClaw] start       │
│                          review                 │   [Manual]   pause       │
│              │    [Pause] [Skip] [Reset]        │                          │
│              │         🍅 × 3                   │                          │
└──────────────┴──────────────────────────────────┴──────────────────────────┘
```

## Requirements

- **Node.js 22+**
- **pnpm 9+** (npm works too, but the monorepo uses pnpm workspaces)
- A POSIX shell for the setup snippets (macOS, Linux, WSL)

## Quick Start

```bash
git clone https://github.com/zordhalo/loading-pomodoro.git
cd loading-pomodoro/pomodoro-openclaw
cp .env.example .env
pnpm install
pnpm dev
```

Then open **http://localhost:5173**. The API runs on **http://localhost:3001**.

If `better-sqlite3` needs a native rebuild for your Node version:

```bash
cd pomodoro-openclaw/server && npm rebuild better-sqlite3
```

## Usage

### From the browser

1. Add a task with the **+ Add** button in the left panel.
2. Click the task to select it (it becomes the active task).
3. Press **Start Focus** in the center panel.
4. Watch the ring count down. On completion the session is persisted and auto-advances to a break (configurable).
5. The right panels show today's sessions and a live command log.

### From `curl`

Start a focus session as if OpenClaw did it:

```bash
curl -X POST http://localhost:3001/api/timer/start \
  -H "Authorization: Bearer dev-token-local" \
  -H "Content-Type: application/json" \
  -d '{"phase":"focus","source":"openclaw"}'
```

Check current status:

```bash
curl http://localhost:3001/api/status \
  -H "Authorization: Bearer dev-token-local"
```

Create a task:

```bash
curl -X POST http://localhost:3001/api/tasks \
  -H "Authorization: Bearer dev-token-local" \
  -H "Content-Type: application/json" \
  -d '{"name":"ship the release","estimate":3}'
```

### From OpenClaw (natural language)

Once the skill is installed (see [OpenClaw Integration](#openclaw-integration)), from any connected channel:

- *"Start a 25-minute focus session for code review"*
- *"Take a short break"*
- *"Pause my timer"*
- *"Skip this break"*
- *"What am I working on?"*
- *"How many pomodoros have I done today?"*
- *"Create a task called fix the auth bug with 3 pomodoros"*
- *"List my tasks"*

## Architecture

```
┌──────────────┐   REST + WS    ┌──────────────────────┐
│   Browser    │ ◀────────────▶ │   Express server     │
│  React 19    │                │   TimerEngine 🔁     │
└──────────────┘                │   CommandLog 🧾      │
                                │   WebSocket hub 📡   │
                                └──────────┬───────────┘
                                           │
                                           ▼
                                    ┌──────────────┐
                                    │  SQLite DB   │
                                    │ tasks /      │
                                    │ sessions /   │
                                    │ settings     │
                                    └──────────────┘

        ┌──────────────┐   REST + WS    ┌──────────────────────┐
        │  OpenClaw    │ ◀────────────▶ │ (same Express server)│
        │ skill.md +   │                │                      │
        │ NL intent    │                │                      │
        └──────────────┘                └──────────────────────┘
```

- **Server** owns the truth. `TimerEngine` is a single authoritative state machine; tick events flow to every connected WS client.
- **Client** is a thin view over the server: Zustand stores, optimistic actions, WS-driven reconciliation.
- **OpenClaw** is just another REST client. Its actions pass `source: "openclaw"`, which the UI visibly distinguishes.

## Tech Stack

| Layer       | Tech                                                                |
|-------------|---------------------------------------------------------------------|
| Frontend    | React 19 · Vite 6 · TypeScript 5.6 · Tailwind CSS v4 · Zustand 5    |
|             | Lucide React (icons) · date-fns · clsx + tailwind-merge             |
| Backend     | Node 22 · Express 4 · better-sqlite3 · ws · TypeScript (ESM)        |
| Persistence | SQLite (local file, WAL mode)                                        |
| Transport   | REST (JSON) · WebSocket (`ws://`) with token auth                   |
| Packaging   | pnpm workspaces · concurrently                                      |
| Agent       | OpenClaw SKILL.md (natural-language → REST calls)                   |

## Configuration

`.env` at the workspace root (copied from `.env.example`):

| Variable              | Default                  | Meaning                                                              |
|-----------------------|--------------------------|----------------------------------------------------------------------|
| `POMODORO_API_TOKEN`  | `dev-token-local`        | Bearer token required on every REST call and WS handshake.          |
| `POMODORO_API_URL`    | `http://localhost:3001`  | Base URL; consumed by the OpenClaw skill.                           |
| `NODE_ENV`            | `development`            | In `development`, missing token auto-skips auth with a warning.     |
| `PORT`                | `3001`                   | Server port.                                                        |

Client-side overrides (Vite env):

| Variable          | Default                  | Meaning                                   |
|-------------------|--------------------------|-------------------------------------------|
| `VITE_API_URL`    | `http://localhost:3001`  | Base URL for axios + WebSocket.           |
| `VITE_API_TOKEN`  | `dev-token-local`        | Token injected into every request.        |

## API Reference

All endpoints require `Authorization: Bearer ${POMODORO_API_TOKEN}`. Responses are uniformly:

```json
{ "ok": true,  "data": ... }
{ "ok": false, "error": "message" }
```

| Method | Path                         | Body / Query                                    | Description                              |
|--------|------------------------------|-------------------------------------------------|------------------------------------------|
| GET    | `/healthz`                   | —                                               | Liveness probe (no auth)                 |
| POST   | `/api/timer/start`           | `{phase?, taskId?, source?}`                    | Start/restart timer                      |
| POST   | `/api/timer/pause`           | `{source?}`                                     | Pause                                    |
| POST   | `/api/timer/resume`          | `{source?}`                                     | Resume                                   |
| POST   | `/api/timer/reset`           | `{source?}`                                     | Reset to idle                            |
| POST   | `/api/timer/skip`            | `{source?}`                                     | End current phase immediately            |
| GET    | `/api/timer/state`           | —                                               | Current `TimerState`                     |
| GET    | `/api/tasks`                 | —                                               | List tasks                               |
| POST   | `/api/tasks`                 | `{name, estimate?, tags?}`                      | Create                                   |
| PUT    | `/api/tasks/:id`             | `{name?, estimate?, tags?}`                     | Update                                   |
| DELETE | `/api/tasks/:id`             | —                                               | Delete                                   |
| POST   | `/api/tasks/:id/select`      | —                                               | Set as active task on the timer          |
| GET    | `/api/sessions`              | `?limit=50&date=YYYY-MM-DD`                     | List sessions                            |
| GET    | `/api/sessions/today-stats`  | —                                               | `{focusCount, focusMinutes, breakCount, tasksWorked}` |
| GET    | `/api/status`                | —                                               | Combined snapshot                        |
| GET    | `/api/settings`              | —                                               | Read all settings                        |
| PUT    | `/api/settings`              | `{key, value}`                                  | Update one setting                       |

## WebSocket Events

Connect: `ws://localhost:3001?token=${POMODORO_API_TOKEN}`

Every message is `{"event": string, "data": ...}`.

| Event             | Payload                                    | When                                   |
|-------------------|--------------------------------------------|----------------------------------------|
| `timer:tick`      | `{secondsRemaining}`                       | Every 1s while running                 |
| `timer:started`   | `TimerState`                               | After start                            |
| `timer:paused`    | `TimerState`                               | After pause                            |
| `timer:resumed`   | `TimerState`                               | After resume                           |
| `timer:skipped`   | `TimerState`                               | After skip                             |
| `timer:reset`     | `TimerState`                               | After reset                            |
| `timer:completed` | `{phase, sessionId}`                       | On natural countdown completion        |
| `timer:state`     | `TimerState`                               | Initial snapshot on connection         |
| `task:selected`   | `{task}`                                   | After select                           |
| `command:logged`  | `CommandEntry`                             | Every logged action                    |

The server sends heartbeat pings every 30 s; dead sockets are terminated. The client auto-reconnects with exponential backoff (1 s → 30 s cap).

## OpenClaw Integration

### 1. Install the skill

```bash
mkdir -p ~/.openclaw/workspace/skills/pomodoro-controller
cp pomodoro-openclaw/openclaw-skill/SKILL.md \
   ~/.openclaw/workspace/skills/pomodoro-controller/SKILL.md
```

### 2. Configure env

Either export in your shell:

```bash
export POMODORO_API_URL=http://localhost:3001
export POMODORO_API_TOKEN=dev-token-local
```

…or add to `~/.openclaw/openclaw.json`:

```json
{
  "env": {
    "POMODORO_API_URL": "http://localhost:3001",
    "POMODORO_API_TOKEN": "dev-token-local"
  }
}
```

### 3. Start the stack and the OpenClaw gateway

```bash
cd pomodoro-openclaw && pnpm dev          # one terminal
openclaw gateway                          # another terminal
```

### 4. Use it

From any OpenClaw-connected channel (WhatsApp, Telegram, Slack, …):

> "Start a 25-minute focus session for code review"

The action appears in the dashboard's command log tagged **OpenClaw**. When the session completes, OpenClaw proactively pings you (via its subscription to `timer:completed`).

The full intent-by-intent reference lives in [`pomodoro-openclaw/openclaw-skill/SKILL.md`](./pomodoro-openclaw/openclaw-skill/SKILL.md).

## Development

All commands run from `pomodoro-openclaw/`.

| Command           | What it does                                               |
|-------------------|------------------------------------------------------------|
| `pnpm dev`        | Run client (5173) + server (3001) concurrently with watch  |
| `pnpm build`      | Typecheck both workspaces, produce production bundles      |
| `pnpm typecheck`  | Typecheck only                                             |

Per-workspace:

```bash
pnpm --filter server dev          # server only
pnpm --filter client dev          # client only
pnpm --filter server typecheck    # just server typecheck
```

## Project Layout

```
loading-pomodoro/
├── README.md                 ← you are here
├── CONTRIBUTING.md           ← contributor guide + commit conventions
├── CHANGELOG.md              ← Keep a Changelog format
├── LICENSE                   ← MIT
├── .editorconfig             ← shared editor settings
├── pomodoro-openclaw-swarm.md ← original agent-swarm build spec
└── pomodoro-openclaw/
    ├── client/               React 19 + Vite + Tailwind v4 + Zustand
    │   └── src/
    │       ├── components/   TimerCard, TaskPanel, SessionLog, CommandLog, Header, ui/
    │       ├── hooks/        useWebSocket, usePomodoro, useBootstrap
    │       ├── store/        timerStore, taskStore, sessionStore (Zustand)
    │       └── lib/          api.ts (axios), types.ts, cn.ts, format.ts
    ├── server/               Express 4 + better-sqlite3 + ws
    │   └── src/
    │       ├── db/           SQLite connection + schema.sql
    │       ├── routes/       timer, tasks, sessions, status, settings
    │       ├── services/     TimerEngine (singleton), CommandLog (ring buffer)
    │       ├── ws/           WebSocket server + broadcast + heartbeat
    │       ├── middleware/   auth (Bearer)
    │       └── util/         respond, commandTap
    ├── openclaw-skill/
    │   └── SKILL.md
    ├── package.json          (workspace root)
    ├── pnpm-workspace.yaml
    ├── .env.example
    └── README.md             project-specific quick ref
```

## Conventions

### Commit Messages (Conventional Commits)

This repo follows [Conventional Commits 1.0.0](https://www.conventionalcommits.org/). Every commit message is:

```
<type>(<optional scope>): <description>

[optional body]

[optional footer(s)]
```

Allowed types:

| Type       | When to use                                                    |
|------------|----------------------------------------------------------------|
| `feat`     | New user-facing feature                                        |
| `fix`      | Bug fix                                                        |
| `docs`     | Documentation only                                             |
| `style`    | Formatting/whitespace (no code change)                         |
| `refactor` | Restructuring without behavior change                          |
| `perf`     | Performance improvement                                        |
| `test`     | Adding or updating tests                                       |
| `build`    | Build system / dependencies                                    |
| `ci`       | CI config                                                      |
| `chore`    | Routine maintenance (housekeeping, deps bump, etc.)            |
| `revert`   | Reverting a previous commit                                    |

Scopes used in this repo: `client`, `server`, `skill`, `deps`, `ci`, `docs`.

Breaking changes: append `!` after type/scope **and** include a `BREAKING CHANGE:` footer.

**Examples**

```
feat(server): add /api/settings PUT endpoint
fix(client): prevent WS reconnect storm on HMR
docs: add API reference table
refactor(server)!: rename TimerPhase 'break' to 'short_break'

BREAKING CHANGE: WS consumers must update event names.
```

### Branch Naming

```
<type>/<short-slug>
```

Examples: `feat/tailscale-serve`, `fix/ws-reconnect-leak`, `docs/api-examples`.

### Versioning (SemVer)

The project follows [Semantic Versioning 2.0.0](https://semver.org):

- **MAJOR** — incompatible API changes
- **MINOR** — backwards-compatible feature additions
- **PATCH** — backwards-compatible bug fixes

Pre-release tags: `-alpha.N`, `-beta.N`, `-rc.N`.

### Changelog (Keep a Changelog)

See [`CHANGELOG.md`](./CHANGELOG.md). Follows [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/). Sections: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`. Unreleased changes sit under `## [Unreleased]` until a tagged release.

### Code Style

- TypeScript strict mode on both sides — no implicit `any`.
- ESM modules throughout (server has `"type": "module"`).
- SQL: parameterized queries only, never string interpolation.
- React: hooks-first, no class components; components receive data via props (stores are consumed via hooks at the top of the tree).
- Imports: std → external → internal, blank line between groups.
- Filenames: `PascalCase.tsx` for components, `camelCase.ts` for everything else.
- `.editorconfig` pins 2-space indent and LF line endings; honor it.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full guide (dev setup, commit format, PR checklist). The short version:

1. Fork, branch off `main` (`feat/…`, `fix/…`).
2. Make changes; run `pnpm typecheck` and smoke-test the endpoint(s) you touched.
3. Commit with [Conventional Commits](#commit-messages-conventional-commits).
4. Update [`CHANGELOG.md`](./CHANGELOG.md) under `## [Unreleased]`.
5. Open a PR; fill in the description (what/why/how-tested).

## Roadmap

- [ ] Tailscale Serve — expose the API so OpenClaw on another device can drive it
- [ ] Webhook relay — server POSTs to an OpenClaw webhook on `timer:completed`
- [ ] Keyboard shortcuts (Space = start/pause, S = skip, R = reset)
- [ ] Sound themes (soft tick / clock / silent)
- [ ] Weekly stats view (Chart.js)
- [ ] Turso/libSQL for cross-device session history
- [ ] Electron/Tauri wrapper for a native desktop build
- [ ] Tests (Vitest for client, node:test for server)

## FAQ

**Why local-first?**
Pomodoro data is personal cadence data. Keeping it on disk (SQLite, WAL mode) means no sign-up, no cloud, no surprise outages — and OpenClaw still works because the skill calls the local API.

**Why not use Redis / Postgres?**
Overkill for a single-user desktop dashboard. SQLite handles concurrent reads fine; writes are single-threaded in the timer engine.

**Does it work offline?**
Yes — everything runs on `localhost`. Only the OpenClaw side may need connectivity depending on the channel you're driving it from (WhatsApp, Telegram, etc.).

**Can I change the default 25/5/15 minutes?**
`PUT /api/settings { "key": "focus_duration", "value": "1800" }` (seconds). UI settings panel is on the roadmap.

**The timer drifts by a second when my laptop sleeps.**
Expected — the tick loop pauses with the event loop. On resume, state is reconciled from the server on WS reconnect.

## License

[MIT](./LICENSE) © zordhalo
