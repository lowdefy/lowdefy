---
'@lowdefy/server-dev': minor
'lowdefy': minor
---

feat(server-dev): The dev server checks Lowdefy's agent instructions and reports what it finds apart from build warnings

The dev server reads the `lowdefy-agent-rules` block that `lowdefy agent-setup` writes into `AGENTS.md` or `CLAUDE.md`, and reports a notice when the block comes from a different Lowdefy minor version than the app runs, when the block is in `AGENTS.md` but the root `CLAUDE.md` does not import it with `@AGENTS.md`, or when the block is missing from a project whose `.mcp.json` names the `lowdefy` server. Notices appear in build status's new `agentFiles` field (`lowdefy_build_status` and `GET /lowdefy-docs/build-status`), never among the build's warnings, and are checked again on every read, so a fix shows at once. The dev server also logs them once when it starts. `lowdefy mcp` passes each notice to the agent once per session for each app, and again only when its text changes, so it does not repeat after every edit; `GET /lowdefy-docs/build-status` reports them on every read. Each notice tells the agent to pass the fix to the developer rather than run agent-setup itself. The check only reads files, and apps on `lowdefy: local` get no version or missing-block notice.
