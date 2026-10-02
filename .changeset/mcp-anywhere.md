---
'lowdefy': minor
'@lowdefy/server-dev': patch
'@lowdefy/docs': patch
'@lowdefy/docs-content': patch
---

`lowdefy mcp` now works in every project and worktree you open an agent session in, and one session can run the dev servers of several projects.

- **Register once for every project.** `lowdefy agent-setup --user` adds the `lowdefy` MCP server to Claude Code's user scope, so every session has the Lowdefy tools — in a repository nobody set up, in a directory above several projects, anywhere. It needs no app. Without Claude Code on your `PATH` it prints the entry for your agent client.
- **No more sessions without tools in a fresh worktree.** `agent-setup` now writes `npx --prefer-offline --yes lowdefy@<version> mcp`, pinned to your app's Lowdefy version, instead of a path into `node_modules`. A worktree nobody has installed yet still starts the server: npx serves the pinned version from the shared npm cache, offline, in under a second. Rerun `lowdefy agent-setup` to switch a project over.
- **Agents install what is missing.** When an app lists `lowdefy` in its `package.json` but its dependencies are not installed, `lowdefy_dev_start` answers with the install command and where to run it (for example `pnpm install` at the workspace root), instead of running a dev script that cannot start.
- **Trust a repository once.** Approving an app outside the session's checkout now offers **Always allow this repository**, which covers all of its git worktrees in every later session. `lowdefy hub trust [directory]`, `lowdefy hub untrust [directory]` and `lowdefy hub trusted` manage the list from the terminal, for clients that cannot ask.
- **The MCP server is renamed `lowdefy`** (was `lowdefy-docs`), so its tools are `mcp__lowdefy__*`. Rerunning `lowdefy agent-setup` renames it in `.mcp.json`, swaps the approval in `.claude/settings.json`, and updates the name in the skill and `AGENTS.md` section it wrote; `agent-setup --user` removes an old `lowdefy-docs` user registration. The dev server's `/lowdefy-docs` routes are unchanged.
- **Mixed Lowdefy versions.** When `lowdefy mcp` connects to a dev server with tools it does not know, it adds them to the session's tool list and tells the client to list again, so a newer app's tools reach a session started by an older pin.
