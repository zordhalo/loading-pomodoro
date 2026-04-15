# Contributing

Thanks for your interest! This repo follows a small set of conventions to keep history, releases, and reviews predictable.

## Dev Setup

```bash
git clone https://github.com/zordhalo/loading-pomodoro.git
cd loading-pomodoro/pomodoro-openclaw
cp .env.example .env
pnpm install
pnpm dev
```

See the main [README](./README.md) for architecture and API reference.

## Workflow

1. **Fork** and create a feature branch off `main`:
   ```bash
   git switch -c feat/my-change
   ```
   Branch name must start with a Conventional Commits type: `feat/…`, `fix/…`, `docs/…`, `refactor/…`, `chore/…`, etc.

2. **Make focused changes.** One logical change per PR; don't mix unrelated refactors with fixes.

3. **Verify**:
   ```bash
   cd pomodoro-openclaw
   pnpm typecheck
   pnpm build
   ```
   Smoke-test endpoints you touched with `curl` (see README → API Reference for examples).

4. **Commit** using [Conventional Commits](#commit-messages).

5. **Update** [`CHANGELOG.md`](./CHANGELOG.md) under the `## [Unreleased]` heading.

6. **Open a PR** against `main`. Fill in the template: what, why, how you tested.

## Commit Messages

This project uses [Conventional Commits 1.0.0](https://www.conventionalcommits.org/). Format:

```
<type>(<optional scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

| Type       | Use for                                          |
|------------|--------------------------------------------------|
| `feat`     | New user-facing feature                          |
| `fix`      | Bug fix                                          |
| `docs`     | Docs only                                        |
| `style`    | Formatting/whitespace                            |
| `refactor` | Behavior-neutral code restructure                |
| `perf`     | Performance                                      |
| `test`     | Tests                                            |
| `build`    | Build system / deps                              |
| `ci`       | CI config                                        |
| `chore`    | Maintenance                                      |
| `revert`   | Revert an earlier commit                         |

### Scopes

Pick one when it sharpens meaning: `client`, `server`, `skill`, `deps`, `ci`, `docs`.

### Breaking changes

Append `!` after the type/scope and add a `BREAKING CHANGE:` footer describing the migration.

```
refactor(server)!: rename TimerPhase 'break' to 'short_break'

BREAKING CHANGE: WS consumers must update event names and state fields.
```

### Examples

```
feat(client): add keyboard shortcut for start/pause
fix(server): prevent TimerEngine tick leak after reset
docs: document VITE_API_TOKEN env var
chore(deps): bump zustand to 5.0.2
```

## Code Style

- **TypeScript strict** on both sides — no implicit `any`, no unused silencing.
- **ESM only** on the server (`"type": "module"`).
- **Parameterized SQL only.** Never interpolate values into query strings.
- **React**: functional components + hooks; components accept data via props and stay dumb; stores (`zustand`) are read at the app root via `usePomodoro`.
- **Imports**: std → external → internal, separated by blank lines.
- **Filenames**: `PascalCase.tsx` for components, `camelCase.ts` for everything else.
- **Indentation**: 2 spaces, LF endings (see `.editorconfig`).
- **No dead code.** If you remove a feature, delete its code and docs — don't leave `// removed` comments.

## Pull Request Checklist

- [ ] Branch name follows `<type>/<slug>`
- [ ] `pnpm typecheck` passes in both workspaces
- [ ] `pnpm build` succeeds
- [ ] Relevant endpoints smoke-tested (paste `curl` output in PR if non-trivial)
- [ ] `CHANGELOG.md` updated under `## [Unreleased]`
- [ ] Commit messages are Conventional
- [ ] No secrets, no `.env` committed
- [ ] Documentation updated (README / SKILL.md) if user-visible behavior changed

## Reporting Bugs

Open an issue with:
- Steps to reproduce
- Expected vs actual behavior
- Node version, OS, browser (if client-side)
- Relevant log snippets (server log is at `/tmp/pom-server.log` when run via the smoke-test recipe)

## Security Issues

Please do **not** open a public issue for security vulnerabilities. Email the maintainer or use a private channel. See the README for contact.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).
