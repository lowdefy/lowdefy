---
'@lowdefy/server-dev': patch
'lowdefy': minor
---

fix: Agent tools work on auth-enabled apps, in monorepos, and keep user data out of git.

**Agent request execution on auth-enabled apps (`@lowdefy/server-dev`)**

- `POST /lowdefy-docs/run-request` (and the `lowdefy_run_request` MCP tool) no longer fails with `Cannot read properties of undefined (reading 'secret')` on apps with authentication configured. Reads, and writes opted in via `cli.agentTools.allowWriteRequests`, now execute the same way app requests do. Calls without a session cookie run as an anonymous visitor.
- `.env` changes now restart the dev server with the updated values — previously changed variables kept their old values until a full dev server restart.

**State checkpoints are no longer committable (`@lowdefy/server-dev`)**

- State checkpoints are written to `.lowdefy/state-checkpoints/<name>/` instead of `checkpoints/<name>/` in the app directory. Checkpoints capture the signed-in user's data and recorded backend responses, so they now live in the conventionally gitignored `.lowdefy` folder — this also stops checkpoint writes from triggering rebuilds.

**`agent-setup` supports monorepos (`lowdefy` CLI)**

- `lowdefy agent-setup` now writes `.mcp.json`, the Claude Code skill, and agent instructions at the project root (nearest ancestor with `.git`) so coding agents launched from the repo root discover them. Generated instructions point at the app subdirectory (e.g. `cd apps/myapp && pnpm dev`).
- When the project root already has a `CLAUDE.md` and no `AGENTS.md`, the Lowdefy section is appended to `CLAUDE.md` instead of creating a competing instructions file.
- A new `--project-directory` option overrides root detection. Single-app repos are unchanged.

**Operator REPL (`@lowdefy/server-dev`)**

- `POST /lowdefy-docs/eval-operator` accepts `operator` as an alias for the `expression` body key, and returns a clear error naming the expected key when it is missing.
