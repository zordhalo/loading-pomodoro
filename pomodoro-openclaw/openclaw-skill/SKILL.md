# Skill: pomodoro-controller

## Purpose

This skill lets OpenClaw manage the user's Pomodoro dashboard — starting focus sessions and breaks, pausing, skipping, and resetting the timer, managing tasks, and reporting productivity stats — all by calling the locally-running REST API and listening to WebSocket events. Every OpenClaw-initiated action is tagged with `source: "openclaw"` in the request body so it appears in the dashboard's command log with a distinct badge, making it easy to distinguish AI-driven actions from manual ones.

---

## Configuration

The skill reads two environment variables at runtime:

| Variable | Default | Description |
|---|---|---|
| `POMODORO_API_URL` | `http://localhost:3001` | Base URL of the dashboard REST API. Change this if you run the server on a non-default port or host. |
| `POMODORO_API_TOKEN` | `dev-token-local` | Bearer token sent with every request. **Must match** the `POMODORO_API_TOKEN` set in the dashboard server's environment. |

Set these in your shell or in `~/.openclaw/openclaw.json` before starting the gateway (see Installation).

---

## Commands and Intents

### 1. Start Focus Session (with optional task)

**Natural language triggers**
- "Start a focus session for fixing the auth bug"
- "Start a 25-minute pomodoro"
- "Begin focus on code review"
- "Pomodoro go — working on refactoring"
- "Focus session, task: write tests"

**Flow**

If a task name is provided:
1. `GET /api/tasks` — search the returned array for a case-insensitive substring match on `name`.
2. If no match found: `POST /api/tasks` to create the task with `estimate: 1`.
3. `POST /api/tasks/:id/select` to set it as the active task.
4. `POST /api/timer/start` with `phase: "focus"`.

If no task name is provided, skip steps 1–3.

```bash
# Step 1 — search existing tasks
curl -s \
  -H "Authorization: Bearer ${POMODORO_API_TOKEN}" \
  "${POMODORO_API_URL}/api/tasks"

# Step 2 — create task if no match (example)
curl -s -X POST \
  -H "Authorization: Bearer ${POMODORO_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"name": "fixing the auth bug", "estimate": 1}' \
  "${POMODORO_API_URL}/api/tasks"

# Step 3 — select task
curl -s -X POST \
  -H "Authorization: Bearer ${POMODORO_API_TOKEN}" \
  "${POMODORO_API_URL}/api/tasks/task_abc/select"

# Step 4 — start focus timer
curl -s -X POST \
  -H "Authorization: Bearer ${POMODORO_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"phase": "focus", "source": "openclaw"}' \
  "${POMODORO_API_URL}/api/timer/start"
```

**Response parsing**
- Step 2: extract `data.id` from `{ ok: true, data: { id, name, ... } }`.
- Step 4: confirm `ok === true`.

**User-facing reply**
> "Focus session started for **{task}**. 25 minutes on the clock. I'll ping you when it's done."

---

### 2. Start Short Break

**Natural language triggers**
- "Take a short break"
- "5-minute break"
- "Start a break"
- "Short break, please"

**HTTP call**

```bash
curl -s -X POST \
  -H "Authorization: Bearer ${POMODORO_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"phase": "short_break", "source": "openclaw"}' \
  "${POMODORO_API_URL}/api/timer/start"
```

**Response parsing** — confirm `ok === true`.

**User-facing reply**
> "Short break started. 5 minutes — step away from the screen."

---

### 3. Start Long Break

**Natural language triggers**
- "Take a long break"
- "15-minute break"
- "Start a long break"
- "I need a longer rest"

**HTTP call**

```bash
curl -s -X POST \
  -H "Authorization: Bearer ${POMODORO_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"phase": "long_break", "source": "openclaw"}' \
  "${POMODORO_API_URL}/api/timer/start"
```

**Response parsing** — confirm `ok === true`.

**User-facing reply**
> "Long break started. 15 minutes — you've earned it."

---

### 4. Pause Timer

**Natural language triggers**
- "Pause the timer"
- "Hold on, pause"
- "Freeze the pomodoro"
- "Put the timer on hold"

**HTTP call**

```bash
curl -s -X POST \
  -H "Authorization: Bearer ${POMODORO_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"source": "openclaw"}' \
  "${POMODORO_API_URL}/api/timer/pause"
```

**Response parsing** — confirm `ok === true`.

**User-facing reply**
> "Timer paused. Say 'resume' when you're ready to continue."

---

### 5. Resume Timer

**Natural language triggers**
- "Resume the timer"
- "Continue the session"
- "Unpause"
- "Keep going"
- "Resume my pomodoro"

**HTTP call**

```bash
curl -s -X POST \
  -H "Authorization: Bearer ${POMODORO_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"source": "openclaw"}' \
  "${POMODORO_API_URL}/api/timer/resume"
```

**Response parsing** — confirm `ok === true`.

**User-facing reply**
> "Timer resumed. Back to it."

---

### 6. Skip Current Phase

**Natural language triggers**
- "Skip this phase"
- "Skip the break"
- "Skip to the next pomodoro"
- "Move on"

**HTTP call**

```bash
curl -s -X POST \
  -H "Authorization: Bearer ${POMODORO_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"source": "openclaw"}' \
  "${POMODORO_API_URL}/api/timer/skip"
```

**Response parsing** — confirm `ok === true`; optionally read `data.nextPhase` to tell the user what comes next.

**User-facing reply**
> "Phase skipped. Moving on to **{nextPhase}**."

---

### 7. Reset Timer

**Natural language triggers**
- "Reset the timer"
- "Start over"
- "Cancel the current session"
- "Reset the pomodoro"

**HTTP call**

```bash
curl -s -X POST \
  -H "Authorization: Bearer ${POMODORO_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"source": "openclaw"}' \
  "${POMODORO_API_URL}/api/timer/reset"
```

**Response parsing** — confirm `ok === true`.

**User-facing reply**
> "Timer reset. Whenever you're ready, say 'start a focus session'."

---

### 8. Get Current Status

**Natural language triggers**
- "What's the timer at?"
- "How much time is left?"
- "What are you tracking right now?"
- "Status"
- "Show me the current session"

**HTTP call**

```bash
curl -s \
  -H "Authorization: Bearer ${POMODORO_API_TOKEN}" \
  "${POMODORO_API_URL}/api/status"
```

**Response parsing**

Expected shape:
```json
{
  "ok": true,
  "data": {
    "phase": "focus",
    "remaining": 1234,
    "running": true,
    "currentTask": { "name": "fixing the auth bug" },
    "focusCount": 3
  }
}
```

- `phase` — one of `"focus"`, `"short_break"`, `"long_break"`, `"idle"`.
- `remaining` — seconds remaining; format as `mm:ss`.
- `currentTask.name` — active task name, or `"none"` if absent.
- `focusCount` — number of completed focus sessions today.

**User-facing reply**
> "{phase} · {mm:ss} remaining · task: {name} · today: {focusCount} 🍅"

---

### 9. Get Today's Stats

**Natural language triggers**
- "How did I do today?"
- "Today's stats"
- "Show my productivity for today"
- "How many pomodoros have I done?"

**HTTP call**

```bash
curl -s \
  -H "Authorization: Bearer ${POMODORO_API_TOKEN}" \
  "${POMODORO_API_URL}/api/sessions/today-stats"
```

**Response parsing**

Expected shape:
```json
{
  "ok": true,
  "data": {
    "focusSessions": 6,
    "totalFocusSeconds": 9000,
    "tasksWorked": 3
  }
}
```

Convert `totalFocusSeconds` to hours and minutes: `Math.floor(s / 3600)h` + `Math.floor((s % 3600) / 60)m`.

**User-facing reply**
> "Today: 6 🍅 · 2h 30m of focus · 3 tasks worked."

---

### 10. Create a Task

**Natural language triggers**
- "Create a task called write documentation"
- "Add a task: deploy to staging with 3 pomodoros"
- "New task: fix login bug"
- "Make a task for the code review, estimate 2 sessions"

**Parsing**

Extract `name` from the user utterance. If the user says "with N pomodoros" or "estimate N", parse that as `estimate`; otherwise default to `1`.

**HTTP call**

```bash
curl -s -X POST \
  -H "Authorization: Bearer ${POMODORO_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"name": "write documentation", "estimate": 2}' \
  "${POMODORO_API_URL}/api/tasks"
```

**Response parsing** — extract `data.id` and `data.name` from `{ ok: true, data: { id, name, estimate, ... } }`.

**User-facing reply**
> "Task **{name}** created with an estimate of {estimate} 🍅. Say 'start a focus session for {name}' to begin."

---

### 11. List Tasks

**Natural language triggers**
- "List my tasks"
- "What tasks do I have?"
- "Show me the task list"
- "What's on my to-do list?"

**HTTP call**

```bash
curl -s \
  -H "Authorization: Bearer ${POMODORO_API_TOKEN}" \
  "${POMODORO_API_URL}/api/tasks"
```

**Response parsing**

Expected shape: `{ ok: true, data: [ { id, name, completed, estimate, active }, ... ] }`.

Display the first 10 tasks. Mark the active task with `(active)`.

**User-facing reply**
```
Your tasks:
- fixing the auth bug (1/2 🍅) (active)
- write documentation (0/2 🍅)
- deploy to staging (0/3 🍅)
```

If the list is empty:
> "No tasks yet — want me to create one?"

---

### 12. Select a Task

**Natural language triggers**
- "Switch to the write documentation task"
- "Select fixing the auth bug"
- "Work on deploy to staging"
- "Set my active task to code review"

**Flow**

1. `GET /api/tasks` — find the best case-insensitive substring match for the user's task name.
2. If no match: inform the user and offer to create the task.
3. If match found: `POST /api/tasks/:id/select`.

**HTTP call**

```bash
# Step 1 — list tasks (same as intent 11)
curl -s \
  -H "Authorization: Bearer ${POMODORO_API_TOKEN}" \
  "${POMODORO_API_URL}/api/tasks"

# Step 2 — select matched task
curl -s -X POST \
  -H "Authorization: Bearer ${POMODORO_API_TOKEN}" \
  "${POMODORO_API_URL}/api/tasks/task_abc/select"
```

**Response parsing** — confirm `ok === true` from the select call.

**User-facing reply**
> "Now focused on **{name}**. Start a session when ready."

---

## WebSocket Integration

OpenClaw can subscribe to real-time timer events by opening a WebSocket connection to the dashboard:

```
ws://localhost:3001?token=${POMODORO_API_TOKEN}
```

Each incoming message is JSON with the shape `{ event: string, data: object }`.

### Connecting

```js
const ws = new WebSocket(
  `ws://localhost:3001?token=${process.env.POMODORO_API_TOKEN}`
);

ws.on("message", (raw) => {
  const { event, data } = JSON.parse(raw);
  handleEvent(event, data);
});
```

### Key Events

| Event | When it fires | Recommended action |
|---|---|---|
| `timer:completed` | Timer reaches zero for any phase | Proactively notify the user (see below) |
| `timer:tick` | Every second while timer is running | Only consume if displaying a live countdown — otherwise ignore (high volume) |
| `timer:started` | Timer begins (any source) | Confirm state change if not initiated by OpenClaw |
| `timer:paused` | Timer paused (any source) | Confirm state change if not initiated by OpenClaw |
| `timer:resumed` | Timer resumed (any source) | Confirm state change if not initiated by OpenClaw |
| `command:logged` | Any command written to the log | Optional — useful for debugging integrations |

### Avoiding Echo Notifications

Each event's `data` object includes a `lastSource` field. Skip user-facing notifications when `data.lastSource === "openclaw"` — this prevents OpenClaw from double-notifying the user about actions it just took.

```js
function handleEvent(event, data) {
  if (data.lastSource === "openclaw") return; // skip echo

  if (event === "timer:completed") {
    const isBreak = data.phase?.includes("break");
    if (isBreak) {
      notify("Break over! Ready to start your next focus session?");
    } else {
      notify("Focus session complete! Time for a break. Say 'take a short break' when you're ready.");
    }
  }

  if (event === "timer:started" && data.phase === "focus") {
    notify(`Focus session started externally for task: ${data.task ?? "none"}.`);
  }
}
```

### Reconnection with Exponential Backoff

The dashboard may restart or be unavailable briefly. Use exponential backoff to reconnect:

```js
let delay = 1000; // ms
const MAX_DELAY = 30000;

function connect() {
  const ws = new WebSocket(`ws://localhost:3001?token=${process.env.POMODORO_API_TOKEN}`);

  ws.on("open", () => { delay = 1000; }); // reset on success

  ws.on("close", () => {
    setTimeout(() => {
      delay = Math.min(delay * 2, MAX_DELAY);
      connect();
    }, delay);
  });

  ws.on("message", (raw) => {
    const { event, data } = JSON.parse(raw);
    handleEvent(event, data);
  });
}

connect();
```

Backoff sequence: 1s, 2s, 4s, 8s, 16s, 30s (capped), 30s, ...

---

## Installation

```bash
# 1. Copy the skill into your OpenClaw workspace
mkdir -p ~/.openclaw/workspace/skills/pomodoro-controller
cp /path/to/pomodoro-openclaw/openclaw-skill/SKILL.md \
   ~/.openclaw/workspace/skills/pomodoro-controller/SKILL.md

# 2. Set environment variables in your shell
export POMODORO_API_URL=http://localhost:3001
export POMODORO_API_TOKEN=dev-token-local

# 3. Start the Pomodoro dashboard
cd /path/to/pomodoro-openclaw && pnpm dev

# 4. Restart the OpenClaw gateway to load the new skill
openclaw gateway

# 5. Test it from any connected channel:
#    "Start a 25-minute focus session for code review"
```

Alternative: configure via `~/.openclaw/openclaw.json` so the vars persist without shell exports:

```json
{
  "env": {
    "POMODORO_API_URL": "http://localhost:3001",
    "POMODORO_API_TOKEN": "dev-token-local"
  }
}
```

---

## Error Handling

### Network unreachable (ECONNREFUSED)

```
I can't reach your Pomodoro dashboard. Make sure it's running — try `pnpm dev` in the project directory.
```

### 401 Unauthorized

```
Auth failed. Check that POMODORO_API_TOKEN matches the token set in your dashboard server's environment.
```

### 400 Bad Request

Surface the server's `error` string directly:
```
The dashboard returned an error: "{error}". Please check your request and try again.
```

### Timer already running when user requests a new phase

Before starting a new phase, call `GET /api/status`. If `data.running === true` and `data.phase !== "idle"`, describe the current state and ask for clarification:

```
The timer is already running — {phase} with {mm:ss} left on task "{name}".
What would you like to do?
  - "skip" to move to the next phase
  - "reset" to stop and clear
  - "switch task" to change the active task without restarting
```

### Empty task list

```
No tasks yet — want me to create one? Just say "create a task called <name>".
```

### Task not found during selection

```
I couldn't find a task matching "{query}". Here are your current tasks: [list].
Want me to create a new task called "{query}"?
```

---

## Example End-to-End Session

```
User: "Start a 25-minute focus session for fixing the auth bug"

OpenClaw:
  1. GET /api/tasks
     → No task name matches "fixing the auth bug" (case-insensitive substring search)
  2. POST /api/tasks { "name": "fixing the auth bug", "estimate": 1 }
     → { ok: true, data: { id: "task_abc", name: "fixing the auth bug" } }
  3. POST /api/tasks/task_abc/select
     → { ok: true }
  4. POST /api/timer/start { "phase": "focus", "source": "openclaw" }
     → { ok: true }

OpenClaw → "Focus session started for **fixing the auth bug**. 25 minutes on the clock.
            I'll ping you when it's done."

--- 25 minutes pass ---

[WebSocket emits: { event: "timer:completed", data: { phase: "focus", lastSource: "openclaw" } }]
Note: lastSource is "openclaw" here only if the timer was started by OpenClaw.
For a timer that completed naturally (not triggered via API), lastSource will differ.

OpenClaw → "Focus session complete! Time for a 5-minute break.
            Say 'take a short break' when you're ready, or 'start another focus session' to keep going."

---

User: "How did I do today?"

OpenClaw:
  1. GET /api/sessions/today-stats
     → { ok: true, data: { focusSessions: 4, totalFocusSeconds: 6000, tasksWorked: 2 } }

OpenClaw → "Today: 4 🍅 · 1h 40m of focus · 2 tasks worked. Keep it up!"
```
