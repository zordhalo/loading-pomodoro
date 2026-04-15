# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-04-15

### Added
- Initial pomodoro-openclaw monorepo (pnpm workspaces: `client` + `server`).
- **Server** — Node 22 + Express 4 + better-sqlite3 + ws (TypeScript, ESM).
  - `TimerEngine` singleton with start / pause / resume / reset / skip, tick loop, auto-advance, session persistence, cycle counting.
  - REST routes: `/api/timer/*`, `/api/tasks/*`, `/api/sessions/*`, `/api/status`, `/api/settings`.
  - Bearer-token auth middleware on all `/api/*` routes (dev-mode bypass when `POMODORO_API_TOKEN` unset).
  - WebSocket server on the same port with `?token=` handshake auth, heartbeat, and full event broadcasting.
  - In-memory `CommandLog` ring buffer (max 100) with source tagging.
  - SQLite schema: `tasks`, `sessions`, `settings` with sane defaults.
- **Client** — React 19 + Vite 6 + Tailwind v4 + Zustand 5.
  - Three-column responsive layout: Tasks · Timer · Logs.
  - `TimerCard` with SVG circular progress ring and per-phase colors.
  - `TaskPanel` with inline add/edit/delete, estimate selector, select-active.
  - `SessionLog` and source-badged `CommandLog`.
  - Zustand stores (`timerStore`, `taskStore`, `sessionStore`), typed axios client, WebSocket hook with exponential-backoff reconnect, `usePomodoro` + `useBootstrap` hooks.
- **OpenClaw skill** (`openclaw-skill/SKILL.md`) covering 12 intents, WS integration (with echo suppression via `lastSource`), installation, and error handling.
- Conventional project metadata: `README.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, `LICENSE`, `.editorconfig`.

### Fixed
- Corrected `dotenv` path in `server/src/index.ts` (was resolving one directory too high).
- Added auth middleware to `status.ts`, `tasks.ts`, `sessions.ts`, `settings.ts` (previously only `timer.ts` enforced auth).

[Unreleased]: https://github.com/zordhalo/loading-pomodoro/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/zordhalo/loading-pomodoro/releases/tag/v0.1.0
