# 🦞 Pomodoro Dashboard + OpenClaw Controller — Agent Swarm Build Prompt

> Paste this entire prompt into Claude Code to spawn a full agent team that builds the project from scratch to full functionality.

---

## Prerequisites (Run Before Starting)

```bash
# Enable Agent Teams (required)
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1

# Confirm Claude Code version >= 2.1.32
claude --version

# Ensure you're in your project root
mkdir -p ~/pomodoro-openclaw && cd ~/pomodoro-openclaw
```

---

## The Master Prompt

Paste the following into Claude Code as a single message:

---

```
You are the team lead for building a full-stack Pomodoro Dashboard with OpenClaw control integration.

This is a complete greenfield project. Your job is to:
1. Set up the project scaffold
2. Spawn a team of specialist agents
3. Coordinate parallel development of all layers
4. Verify integration between layers
5. Deliver a fully working, production-ready application

---

## PROJECT OVERVIEW

Build a Pomodoro productivity dashboard that is fully controllable via OpenClaw (the personal AI assistant at https://github.com/openclaw/openclaw).

### What we're building

A local-first Pomodoro dashboard with:
- A React + Vite frontend (dark-themed, minimal, high-quality UI)
- A Node.js / Express control API (REST + WebSocket)
- A SQLite database (via better-sqlite3) for session persistence
- An OpenClaw skill (`pomodoro-controller`) that lets OpenClaw start timers, switch tasks, and receive session events
- A command log panel that visibly shows whether actions came from "Manual" or "OpenClaw"

### Core feature set

**Timer engine:**
- Focus mode (25 min default, configurable)
- Short break (5 min default)
- Long break (15 min default, every 4 cycles)
- Start, pause, resume, reset, skip controls
- Auto-advance to break after focus completes (configurable toggle)
- Audio tick and completion sounds (Web Audio API, no external files)

**Task management:**
- Create, edit, delete tasks
- Assign estimated pomodoro count per task
- Select active task for current session
- Track completed pomodoros per task
- Tag tasks (optional, but include the field)

**Session history:**
- Log every completed or interrupted session
- Store: task name, type (focus/short_break/long_break), duration, interrupted flag, source (manual/openclaw), timestamp
- Today's summary: pomodoros completed, focus time, tasks worked

**OpenClaw control surface:**
- REST endpoints at `POST /api/timer/start`, `/pause`, `/resume`, `/reset`, `/skip`
- `POST /api/task/select` — switch active task
- `POST /api/task/create` — create a task from OpenClaw
- `GET /api/status` — current timer state, active task, today's stats
- WebSocket at `ws://localhost:3001` for real-time event push to OpenClaw
- Bearer token auth (`POMODORO_API_TOKEN` env var, default `dev-token-local`)

**Command log:**
- Real-time feed showing last 20 actions
- Each entry: timestamp, source badge (Manual / OpenClaw), action, payload summary
- Color-coded: Manual = neutral, OpenClaw = teal accent

**OpenClaw skill (`pomodoro-controller`):**
- Skill file at `openclaw-skill/SKILL.md`
- Lets OpenClaw understand commands like:
  - "Start a 25-minute focus block for [task]"
  - "Take a short break"
  - "What's my focus status?"
  - "Create a task called [name]"
  - "Skip this break"
- Calls the local REST API
- Reports back session completions via webhook or polling

---

## TECH STACK

```
pomodoro-openclaw/
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── components/      # TimerCard, TaskPanel, SessionLog, CommandLog
│   │   ├── hooks/           # useTimer, useTasks, useWebSocket, useCommandLog
│   │   ├── store/           # Zustand store (timerStore, taskStore, sessionStore)
│   │   ├── lib/             # api.ts (axios), ws.ts (WebSocket client), audio.ts
│   │   └── App.tsx
│   ├── index.html
│   └── vite.config.ts
│
├── server/                  # Node.js Express API
│   ├── src/
│   │   ├── db/              # SQLite schema + seed (better-sqlite3)
│   │   ├── routes/          # timer.ts, tasks.ts, sessions.ts, status.ts
│   │   ├── services/        # TimerEngine.ts (core timer logic, singleton)
│   │   ├── ws/              # WebSocket broadcast (ws library)
│   │   └── index.ts         # Express app entry
│   └── tsconfig.json
│
├── openclaw-skill/
│   └── SKILL.md             # OpenClaw skill definition
│
├── package.json             # Root workspace (pnpm workspaces)
├── pnpm-workspace.yaml
├── .env.example
└── README.md
```

**Versions to use:**
- Node 22+
- React 19 + Vite 6
- TypeScript 5.4+
- Zustand 5
- Express 5
- better-sqlite3 9
- ws (WebSocket server) 8
- axios 1.7
- Tailwind CSS v4 (via `@tailwindcss/vite`)
- Lucide React (icons)
- date-fns (time formatting)
- clsx + tailwind-merge

---

## DESIGN SYSTEM

Use a dark-mode-first theme. The dashboard should feel like a focused productivity tool — think Linear meets a terminal aesthetic.

**Color palette (CSS variables):**
```css
:root {
  --bg: #0f0f0f;
  --surface: #161616;
  --surface-2: #1e1e1e;
  --surface-3: #262626;
  --border: rgba(255,255,255,0.08);
  --text: #e8e8e8;
  --text-muted: #6b6b6b;
  --text-faint: #404040;
  --primary: #4f98a3;          /* teal — OpenClaw's brand color, used for focus mode */
  --primary-hover: #3d8290;
  --break-color: #6daa45;      /* green — short break */
  --long-break-color: #a86fdf; /* purple — long break */
  --manual-badge: #4a4a4a;
  --openclaw-badge: #1a3d42;
  --openclaw-badge-text: #4f98a3;
  --error: #d16363;
  --warning: #e8af34;
}
```

**Typography:**
- Body: `Inter` (Google Fonts, 300–700)
- Monospace (timer digits): `JetBrains Mono` (Google Fonts, 400–700)
- Timer display: 96px, monospace, tabular-nums
- Headings: 14–18px, body font, semibold
- Body text: 14px
- Labels/metadata: 12px

**Layout:**
- Single-page dashboard, no routing
- Three-column layout on desktop (≥1200px): Tasks | Timer | Session Log
- Two-column on tablet (≥768px): Timer + Log | Tasks
- Single-column on mobile
- Sticky header with: logo, today's stats bar, theme toggle (dark only — no light mode needed for this project), status indicator (Gateway connection dot)

**Component aesthetic:**
- Rounded corners: 8px for cards, 6px for buttons, 4px for badges
- Subtle border: `1px solid var(--border)`
- Card shadow: `0 1px 3px rgba(0,0,0,0.4)`
- Timer card is the visual hero: full-width in center column, large circular progress ring using SVG, mode label above (FOCUS / SHORT BREAK / LONG BREAK), task name below
- Active state on timer ring changes color based on mode (teal/green/purple)
- Buttons: icon + label, compact, no unnecessary spacing
- Transition: 150ms ease for all interactive elements

---

## DATA MODEL

**SQLite schema (server/src/db/schema.sql):**

```sql
CREATE TABLE IF NOT EXISTS tasks (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  name        TEXT NOT NULL,
  estimate    INTEGER NOT NULL DEFAULT 1,
  completed   INTEGER NOT NULL DEFAULT 0,
  tags        TEXT DEFAULT '[]',
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  id           TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  task_id      TEXT REFERENCES tasks(id) ON DELETE SET NULL,
  task_name    TEXT,
  type         TEXT NOT NULL CHECK(type IN ('focus','short_break','long_break')),
  duration_sec INTEGER NOT NULL,
  interrupted  INTEGER NOT NULL DEFAULT 0,
  source       TEXT NOT NULL DEFAULT 'manual' CHECK(source IN ('manual','openclaw')),
  started_at   TEXT NOT NULL,
  ended_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT OR IGNORE INTO settings VALUES
  ('focus_duration', '1500'),
  ('short_break_duration', '300'),
  ('long_break_duration', '900'),
  ('auto_advance', 'true'),
  ('long_break_interval', '4');
```

**Timer state (in-memory on server, broadcast via WS):**
```typescript
interface TimerState {
  phase: 'idle' | 'focus' | 'short_break' | 'long_break';
  status: 'stopped' | 'running' | 'paused';
  secondsRemaining: number;
  totalSeconds: number;
  cycleCount: number;           // focus sessions completed this streak
  currentTaskId: string | null;
  currentTaskName: string | null;
  startedAt: string | null;
  lastSource: 'manual' | 'openclaw';
}
```

**Command log entry:**
```typescript
interface CommandEntry {
  id: string;
  timestamp: string;
  source: 'manual' | 'openclaw';
  action: string;
  payload: Record<string, unknown>;
  status: 'ok' | 'error';
  note?: string;
}
```

---

## API CONTRACT

All endpoints return `{ ok: true, data: ... }` or `{ ok: false, error: string }`.

**Auth:** `Authorization: Bearer <token>` header. Default token: `dev-token-local`. Skip auth check if `NODE_ENV=development` and no `POMODORO_API_TOKEN` is set, but log a warning.

**Timer endpoints:**
```
POST /api/timer/start
  body: { phase?: 'focus'|'short_break'|'long_break', taskId?: string, source?: 'manual'|'openclaw' }
  → starts or restarts timer in given phase

POST /api/timer/pause
  body: { source?: string }

POST /api/timer/resume
  body: { source?: string }

POST /api/timer/reset
  body: { source?: string }

POST /api/timer/skip
  body: { source?: string }
  → ends current phase immediately, advances to next phase

GET /api/timer/state
  → returns current TimerState
```

**Task endpoints:**
```
GET  /api/tasks
POST /api/tasks           body: { name, estimate?, tags? }
PUT  /api/tasks/:id       body: { name?, estimate?, tags? }
DELETE /api/tasks/:id
POST /api/tasks/:id/select   → sets as active task on timer
```

**Session endpoints:**
```
GET /api/sessions?limit=50&date=2026-04-15
GET /api/sessions/today-stats
  → { focusCount, focusMinutes, breakCount, tasksWorked }
```

**Status endpoint:**
```
GET /api/status
  → { timer: TimerState, todayStats: {...}, activeTask: Task | null, version: string }
```

**Settings endpoint:**
```
GET  /api/settings
PUT  /api/settings   body: { key: string, value: string }
```

**WebSocket events (server → client):**
```json
{ "event": "timer:tick",      "data": { "secondsRemaining": 1234 } }
{ "event": "timer:started",   "data": TimerState }
{ "event": "timer:paused",    "data": TimerState }
{ "event": "timer:resumed",   "data": TimerState }
{ "event": "timer:completed", "data": { "phase": "focus", "sessionId": "..." } }
{ "event": "timer:skipped",   "data": TimerState }
{ "event": "task:selected",   "data": { "task": Task } }
{ "event": "command:logged",  "data": CommandEntry }
```

---

## OPENCLAW SKILL

The skill file at `openclaw-skill/SKILL.md` should instruct OpenClaw to:

1. Understand natural language Pomodoro commands
2. Map them to REST API calls
3. Parse the `GET /api/status` response to answer "what are you working on?" style questions
4. Subscribe to WebSocket events (or poll status) to notify user when a session completes
5. Use the `lastSource` field to confirm "Timer started by OpenClaw"

**Example intents to handle in the skill:**
- `"Start a focus session for [task name]"` → create task if needed, select it, POST /api/timer/start
- `"Start a 25-minute focus block"` → POST /api/timer/start { phase: 'focus', source: 'openclaw' }
- `"Pause my timer"` → POST /api/timer/pause
- `"Take a short break"` → POST /api/timer/start { phase: 'short_break', source: 'openclaw' }
- `"Skip this break"` → POST /api/timer/skip
- `"What am I working on?"` → GET /api/status
- `"How many pomodoros have I done today?"` → GET /api/sessions/today-stats
- `"Create a task called [name] with [N] pomodoros"` → POST /api/tasks

The skill should also document:
- How to configure the `POMODORO_API_URL` env var (default: http://localhost:3001)
- How to set `POMODORO_API_TOKEN`
- How to use webhook mode (OpenClaw listens for WS events and relays to the user's chat channel)

---

## WHAT FULL FUNCTIONALITY MEANS

The build is done when:

- [ ] `pnpm install` at root installs all workspaces
- [ ] `pnpm dev` starts both client (port 5173) and server (port 3001) concurrently
- [ ] Timer counts down in real time via WebSocket ticks, no polling
- [ ] Start/pause/resume/reset/skip all work from the UI
- [ ] Creating a task and selecting it shows it in the timer card
- [ ] Completing a focus session logs it to the SQLite database and updates today's stats
- [ ] `curl -X POST http://localhost:3001/api/timer/start -H "Authorization: Bearer dev-token-local" -H "Content-Type: application/json" -d '{"phase":"focus","source":"openclaw"}'` starts the timer and shows "OpenClaw" in the command log
- [ ] WebSocket client in the browser reconnects automatically if server restarts
- [ ] The `openclaw-skill/SKILL.md` file is complete and can be dropped into `~/.openclaw/workspace/skills/pomodoro-controller/SKILL.md`
- [ ] `README.md` explains setup, dev start, and how to connect OpenClaw

---

## YOUR TASK AS TEAM LEAD

### Step 1 — Scaffold the project

Before spawning teammates, do this yourself:

1. Initialize the pnpm workspace:
```bash
mkdir -p pomodoro-openclaw/client pomodoro-openclaw/server pomodoro-openclaw/openclaw-skill
cd pomodoro-openclaw
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'client'
  - 'server'
EOF
cat > package.json << 'EOF'
{
  "name": "pomodoro-openclaw",
  "private": true,
  "scripts": {
    "dev": "concurrently \"pnpm --filter server dev\" \"pnpm --filter client dev\"",
    "build": "pnpm --filter server build && pnpm --filter client build"
  },
  "devDependencies": {
    "concurrently": "^9.0.0"
  }
}
EOF
```

2. Create the `.env.example`:
```
POMODORO_API_TOKEN=dev-token-local
POMODORO_API_URL=http://localhost:3001
NODE_ENV=development
PORT=3001
```

3. Copy `.env.example` to `.env`

4. Create `server/package.json`, `server/tsconfig.json`, `client/package.json`, and `client/vite.config.ts` with the correct dependencies and config.

5. Create the SQLite schema file at `server/src/db/schema.sql`.

6. Verify the scaffolding looks right with `ls -la` in each directory.

Only after scaffolding is verified, proceed to spawn the team.

---

### Step 2 — Create the agent team

```javascript
Teammate({ operation: "spawnTeam", team_name: "pomodoro-build", description: "Building Pomodoro Dashboard with OpenClaw control" })
```

---

### Step 3 — Create the task list with dependencies

Create these tasks in order:

1. **Server: DB + Timer Engine** — Implement SQLite initialization, schema migration runner, and the core `TimerEngine` singleton (start, pause, resume, reset, skip, tick loop, session save on complete, settings read)
2. **Server: REST Routes** — Implement all REST endpoints (timer, tasks, sessions, status, settings) with auth middleware
3. **Server: WebSocket** — Implement WebSocket server, broadcast all timer events, add reconnect-friendly ping/pong keepalive
4. **Client: Design System + Layout** — Set up Tailwind v4, CSS variables, base layout (three columns), sticky header with today stats, theme variables
5. **Client: Timer Components** — Build TimerCard with SVG circular progress ring, mode color switching, countdown display in JetBrains Mono, control buttons
6. **Client: Task Panel** — Build TaskPanel with task list, add/edit/delete, select active task button, estimated vs completed pomodoro display
7. **Client: Session Log + Command Log** — Build SessionHistory list and CommandLog feed with source badges
8. **Client: Zustand Store + API Layer** — Build `timerStore`, `taskStore`, `sessionStore` with Zustand; `api.ts` with axios; WebSocket client hook with auto-reconnect
9. **OpenClaw Skill** — Write complete `openclaw-skill/SKILL.md` with all intents, API call patterns, env var docs, and webhook integration notes
10. **Integration + README** — Wire client to server, verify all API calls work end-to-end, fix any type mismatches, write README.md with setup guide

Set dependencies:
- Task 2 blocked by Task 1
- Task 3 blocked by Task 1
- Task 5 blocked by Task 4
- Task 6 blocked by Task 4
- Task 7 blocked by Task 4
- Task 8 blocked by Tasks 2 and 3 (server must be complete for API types)
- Task 10 blocked by Tasks 3, 7, and 8 (full stack must be done)
- Task 9 has no blockers (can run in parallel)

---

### Step 4 — Spawn the team

Spawn these teammates in a single message (all run_in_background: true):

**backend-engineer** — handles Tasks 1, 2, 3
```
Spawn a teammate named "backend-engineer" as general-purpose.

Your mission: Build the entire Node.js/Express backend for the Pomodoro dashboard.

Work through the task list in order:

TASK 1: Server DB + Timer Engine
- Initialize better-sqlite3 at server/src/db/index.ts
- Run schema.sql on startup (CREATE TABLE IF NOT EXISTS)
- Seed default settings rows
- Build TimerEngine at server/src/services/TimerEngine.ts as a singleton class
  - State: TimerState (as defined in the project spec)
  - Methods: start(phase, taskId?, source?), pause(source?), resume(source?), reset(source?), skip(source?)
  - Internal: setInterval tick loop (1-second ticks), auto-complete at 0, auto-advance to break if setting enabled
  - On complete: save session to SQLite, emit 'completed' event
  - On any state change: emit 'stateChange' event (used by WS broadcaster)
  - EventEmitter-based (extends EventEmitter)
- Build CommandLog service: in-memory ring buffer, max 100 entries, push(entry), getRecent(n)

TASK 2: REST Routes (blocked by Task 1)
- Implement all REST endpoints per the API contract in the spec
- Auth middleware: check Bearer token from Authorization header against POMODORO_API_TOKEN env var
- All routes use the TimerEngine singleton
- Tasks CRUD: full create, read, update, delete with SQLite
- Sessions: read-only (TimerEngine writes them), filter by date, today-stats aggregation
- Settings: read/write from SQLite settings table, update TimerEngine durations on write

TASK 3: WebSocket (blocked by Task 1)
- Use the 'ws' library
- Listen on same port as Express via server.on('upgrade', ...)
- Auth: check token on connection via URL param ?token=... or first message
- Broadcast TimerState on every tick and state change
- Broadcast CommandEntry on every command
- Ping/pong keepalive every 30 seconds, terminate dead connections
- Export a broadcast(event, data) function used by TimerEngine listener

After all three tasks, send your findings and any type export paths to team-lead.
```

**frontend-engineer** — handles Tasks 4, 5, 6, 7
```
Spawn a teammate named "frontend-engineer" as general-purpose.

Your mission: Build the entire React frontend for the Pomodoro dashboard.

Work through the task list in order. Tasks 5, 6, 7 are blocked until Task 4 completes.

TASK 4: Design System + Layout
- Set up Tailwind CSS v4 via @tailwindcss/vite plugin in vite.config.ts
- Add CSS variables (as defined in the design system spec) to client/src/index.css
- Load Inter and JetBrains Mono from Google Fonts in index.html
- Build the base App.tsx layout: sticky header + three-column main
- Header: SVG lobster/timer logo (simple inline SVG), app title "Pomodoro", today's stats bar (N pomodoros • Nh Nm focus), green dot "Connected" / red dot "Offline" for WS status
- Three-column grid: left=tasks (280px), center=timer (flex-1), right=logs (280px)
- Responsive: collapse to single column at 768px

TASK 5: Timer Components (blocked by Task 4)
- TimerCard component in client/src/components/TimerCard.tsx
- SVG circular progress ring: radius 80, stroke-width 8, animated strokeDashoffset
- Ring color transitions: teal for focus, green for short_break, purple for long_break
- Center display: countdown in JetBrains Mono at 96px using tabular-nums
- Mode label above (FOCUS / SHORT BREAK / LONG BREAK) in uppercase, 12px, muted
- Active task name below timer in 14px
- Control buttons row: Start/Pause, Resume, Reset, Skip — use Lucide React icons
- Cycle counter: shows "🍅 x N" below buttons
- Animate the ring smoothly using CSS transitions on strokeDashoffset

TASK 6: Task Panel (blocked by Task 4)
- TaskPanel component in client/src/components/TaskPanel.tsx
- Header with title "Tasks" and "+ Add Task" button
- Inline form to add task: name input, estimate selector (1–8 pomodoros), add button
- Task list: each row shows name, est/completed (e.g., "2/4 🍅"), select button, delete button
- Selected task highlighted with primary color border
- Edit task inline on click (name + estimate)
- Empty state: friendly message with arrow pointing to add button

TASK 7: Session Log + Command Log (blocked by Task 4)
- SessionLog component: compact list of today's sessions, each showing type badge (FOCUS/BREAK), task name, duration, time
- CommandLog component: shows last 20 commands with source badge — gray "Manual" or teal "OpenClaw" — action name, timestamp
- Both panels scroll independently with overflow-y-auto
- CommandLog shows oldest-to-newest in reverse order (newest at top)

Mark each task complete as you finish it. Send a summary of all component file paths to team-lead when done.
```

**state-integration-engineer** — handles Task 8
```
Spawn a teammate named "state-integration-engineer" as general-purpose.

Your mission: Build the Zustand store, API client, and WebSocket hook that connect the React frontend to the Express backend.

Wait for the task list — your task (Task 8) is blocked by Tasks 2 and 3. Poll TaskList every 60 seconds until it unblocks. When it unblocks:

Build client/src/store/timerStore.ts
  - Zustand store with TimerState shape matching the server's TimerState interface
  - Actions: setTimerState(state), logCommand(entry)
  - Selector: useTimerStore

Build client/src/store/taskStore.ts
  - Tasks array, selectedTaskId
  - Actions: setTasks, addTask, updateTask, removeTask, selectTask
  - Derives activeTask from selectedTaskId

Build client/src/store/sessionStore.ts
  - todayStats: { focusCount, focusMinutes, breakCount, tasksWorked }
  - sessions: Session[]
  - Actions: setTodayStats, setSessions, addSession

Build client/src/lib/api.ts
  - axios instance with baseURL from VITE_API_URL (default: http://localhost:3001)
  - Auth: attach Bearer token from VITE_API_TOKEN (default: dev-token-local)
  - Typed request functions for every endpoint in the API contract
  - Error normalization (always return { ok, data } or throw with message)

Build client/src/hooks/useWebSocket.ts
  - Connect to ws://localhost:3001?token=...
  - Parse incoming JSON events and dispatch to correct Zustand store
  - Auto-reconnect with exponential backoff (1s, 2s, 4s, 8s, max 30s)
  - Expose: { connected, lastEvent }

Build client/src/hooks/usePomodoro.ts
  - Combines timerStore + taskStore + sessionStore
  - Exposes actions: startTimer(phase?, taskId?), pauseTimer(), resumeTimer(), resetTimer(), skipTimer(), selectTask(taskId)
  - Each action calls the API with source='manual' and optimistically updates local state
  - On WS event, override local state with server truth

Wire useWebSocket into App.tsx (call once, store in context or singleton).
Fetch initial state on mount (GET /api/status) and populate all stores.
Fetch tasks on mount (GET /api/tasks).
Fetch today's sessions on mount.

Mark Task 8 complete and send team-lead the list of all files created.
```

**openclaw-skill-writer** — handles Task 9
```
Spawn a teammate named "openclaw-skill-writer" as general-purpose.

Your mission: Write the complete OpenClaw skill file for controlling the Pomodoro dashboard.

This task has no dependencies — start immediately.

Create the file at openclaw-skill/SKILL.md.

The skill must follow OpenClaw's skill format (SKILL.md files are Markdown files that define how the AI agent should behave for a specific capability).

The skill file should contain:

# Skill: pomodoro-controller
## Purpose
One paragraph describing what this skill does.

## Configuration
- POMODORO_API_URL (default: http://localhost:3001)
- POMODORO_API_TOKEN (default: dev-token-local)

## Commands and Intents

For each intent below, provide:
- Natural language trigger examples
- The exact HTTP call to make (method, endpoint, headers, body)
- What to say back to the user

Intents to cover:
1. Start focus session — optionally with task name
   - If task name given: search tasks by name, create if not found, select it, then start
   - POST /api/timer/start { phase: "focus", taskId: "...", source: "openclaw" }
2. Start short break — POST /api/timer/start { phase: "short_break", source: "openclaw" }
3. Start long break — POST /api/timer/start { phase: "long_break", source: "openclaw" }
4. Pause timer — POST /api/timer/pause { source: "openclaw" }
5. Resume timer — POST /api/timer/resume { source: "openclaw" }
6. Skip current phase — POST /api/timer/skip { source: "openclaw" }
7. Reset timer — POST /api/timer/reset { source: "openclaw" }
8. Get current status — GET /api/status → parse and summarize for user
9. Get today's stats — GET /api/sessions/today-stats → report N pomodoros, Nh Nm of focus
10. Create a task — POST /api/tasks { name, estimate }
11. List tasks — GET /api/tasks → format as a list
12. Select a task — search by name, then POST /api/tasks/:id/select

## WebSocket Integration
Explain how OpenClaw can connect to ws://localhost:3001?token=... to receive real-time events:
- timer:completed → notify user "✅ Focus session complete! Time for a break."
- timer:tick → update any status message if showing live countdown
- command:logged → log to OpenClaw's session for debugging

## Installation
Instructions for:
1. Copying skill to ~/.openclaw/workspace/skills/pomodoro-controller/SKILL.md
2. Setting env vars in openclaw.json or shell
3. Restarting OpenClaw gateway (openclaw gateway)
4. Testing with: "Start a focus session for my pomodoro project"

## Error Handling
- If server is unreachable: tell user to run `pnpm dev` in the project directory
- If auth fails (401): tell user to check POMODORO_API_TOKEN
- If timer already running: describe current state and ask what to do

Mark Task 9 complete and send team-lead the skill file path.
```

---

### Step 5 — Spawn integration teammate (waits for all layers)

After spawning the above four teammates, also spawn:

**integration-lead** — handles Task 10
```
Spawn a teammate named "integration-lead" as general-purpose.

Your mission: Final integration, wiring, and README.

Your task (Task 10) is blocked by Tasks 3, 7, and 8. Poll TaskList every 60 seconds until it unblocks.

When it unblocks, do the following:

1. Wire all React components together in App.tsx:
   - Import and render TimerCard, TaskPanel, SessionLog, CommandLog
   - Pass store selectors as props
   - Call usePomodoro hook actions for all timer controls
   - Call API actions for task CRUD operations
   - Show today's stats in the header

2. Verify TypeScript types are consistent across client and server:
   - Check that TimerState, Task, Session, CommandEntry interfaces match
   - Create a shared types file if needed (or duplicate with comments)

3. Run the TypeScript compiler in each workspace and fix all type errors:
   ```bash
   cd server && npx tsc --noEmit
   cd client && npx tsc --noEmit
   ```

4. Start the dev server and verify:
   - Server starts on port 3001 with no errors
   - Client starts on port 5173 with no errors
   - WebSocket connects successfully
   - Timer starts when you click Start
   - Timer state updates via WS tick every second
   - Session is saved to SQLite when timer completes

5. Verify the OpenClaw integration manually:
   ```bash
   # Start a timer from the command line (simulating OpenClaw)
   curl -X POST http://localhost:3001/api/timer/start \
     -H "Authorization: Bearer dev-token-local" \
     -H "Content-Type: application/json" \
     -d '{"phase":"focus","source":"openclaw"}'

   # Check status
   curl http://localhost:3001/api/status \
     -H "Authorization: Bearer dev-token-local"

   # Verify command log shows "OpenClaw" source
   curl http://localhost:3001/api/sessions/today-stats \
     -H "Authorization: Bearer dev-token-local"
   ```

6. Write README.md:
   ```markdown
   # Pomodoro Dashboard + OpenClaw Controller

   A Pomodoro productivity dashboard controllable via [OpenClaw](https://github.com/openclaw/openclaw).

   ## Quick Start

   ### Requirements
   - Node 22+
   - pnpm 9+

   ### Setup
   ```bash
   pnpm install
   cp .env.example .env
   pnpm dev
   ```
   Open http://localhost:5173

   ### OpenClaw Integration

   #### Install the skill
   ```bash
   mkdir -p ~/.openclaw/workspace/skills/pomodoro-controller
   cp openclaw-skill/SKILL.md ~/.openclaw/workspace/skills/pomodoro-controller/SKILL.md
   ```

   #### Configure environment
   Add to ~/.openclaw/openclaw.json or export in your shell:
   ```json
   {
     "env": {
       "POMODORO_API_URL": "http://localhost:3001",
       "POMODORO_API_TOKEN": "dev-token-local"
     }
   }
   ```

   #### Use from OpenClaw
   Once the skill is installed and the dashboard is running:
   - "Start a 25-minute focus session for task review"
   - "Take a short break"
   - "How many pomodoros have I done today?"
   - "Create a task called fix the auth bug with 3 pomodoros"

   ## Architecture
   [Brief description of client/server/skill layers]

   ## API Reference
   [Table of all endpoints]

   ## Development
   [How to extend, add features, run tests]
   ```

7. Fix any remaining issues. Mark Task 10 complete and send team-lead a final status summary.
```

---

### Step 6 — Monitor and steer

While teammates are working:
- Check in every 3–4 minutes with `TaskList()` to see progress
- If a teammate appears stuck, message them directly with `Teammate({ operation: "write", target_agent_id: "...", value: "..." })`
- If backend-engineer finishes Tasks 1–3, unblock Task 8 manually if auto-unblock hasn't fired
- Watch for shutdown notifications from idle teammates

### Step 7 — Finalize

When all tasks are complete:
1. Request shutdown for all teammates in order
2. Wait for approvals
3. Run `Teammate({ operation: "cleanup" })`
4. Do a final verification: `ls -la pomodoro-openclaw/` and confirm all files exist
5. Report back to the user with a summary of what was built and how to run it

---

## QUALITY GATES

Before marking any task complete:

**Backend tasks:**
- TypeScript compiles with `npx tsc --noEmit`
- All endpoints return proper `{ ok, data }` or `{ ok, error }` shapes
- TimerEngine correctly handles all state transitions without crashing
- SQLite operations use parameterized queries (no string interpolation)

**Frontend tasks:**
- TypeScript compiles with `npx tsc --noEmit`  
- No `any` types without a comment explaining why
- All components handle loading and error states
- No console.error in the happy path

**Integration:**
- `curl` commands in the spec all work and return expected shapes
- WS events are received in browser DevTools Network tab
- Timer counts down in real time (1 second ticks)
- Session appears in SQLite after timer completes

---

Begin now. Start with the project scaffold, then spawn the team.
```

---

## Post-Build: Connecting to OpenClaw

Once the build is complete, connect the skill:

```bash
# 1. Copy skill to OpenClaw workspace
mkdir -p ~/.openclaw/workspace/skills/pomodoro-controller
cp ~/pomodoro-openclaw/openclaw-skill/SKILL.md \
   ~/.openclaw/workspace/skills/pomodoro-controller/SKILL.md

# 2. Set environment variables
export POMODORO_API_URL=http://localhost:3001
export POMODORO_API_TOKEN=dev-token-local

# 3. Start the dashboard
cd ~/pomodoro-openclaw && pnpm dev

# 4. Restart OpenClaw gateway to load new skill
openclaw gateway

# 5. Test from any connected channel (WhatsApp, Telegram, Slack, etc.)
# → "Start a 25-minute focus session for code review"
# → "What am I working on?"
# → "Take a short break"
```

---

## Extending the Project

After the base build, you can ask Claude Code to:

- **Add Tailscale support** — expose the API via Tailscale Serve so OpenClaw on another device can control your desktop timer
- **Add webhook relay** — when a focus session completes, have the server POST to an OpenClaw webhook URL, which delivers a message to your phone
- **Add keyboard shortcuts** — Space to start/pause, S to skip, R to reset
- **Add sound themes** — multiple tick sound options (soft, clock, none)
- **Add weekly stats view** — chart of pomodoros per day over the last 7 days using Chart.js
- **Add multi-device sync** — replace SQLite with Turso (libSQL) for cross-device session history
