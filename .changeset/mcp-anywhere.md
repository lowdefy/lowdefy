---
'lowdefy': minor
'@lowdefy/server-dev': patch
'@lowdefy/docs': patch
'@lowdefy/docs-content': patch
---

`lowdefy mcp` now works in every project and worktree you open an agent session in, and one session can run the dev servers of several projects.

- **Register once for every project.** `lowdefy agent-setup --user` adds the `lowdefy` MCP server to Claude Code's user scope, so every session has the Lowdefy tools — in a repository nobody set up, in a directory above several projects, anywhere. It needs no app, and needs a published Lowdefy version that has `lowdefy mcp` (until Lowdefy 7 is released, `npx lowdefy@experimental agent-setup --user`). On Windows it registers `cmd /c npx ...`. A rerun whose add fails keeps your existing registration. Without Claude Code on your `PATH` it prints the entry for your agent client.
- **No more sessions without tools in a fresh worktree.** `agent-setup` now writes `npx --prefer-offline --yes lowdefy@<version> mcp`, pinned to your app's Lowdefy version, instead of a path into `node_modules`. A worktree nobody has installed yet still starts the server: npx serves the pinned version from the shared npm cache, offline, in under a second. Rerun `lowdefy agent-setup` to switch a project over. It first runs the pinned version through npx and refuses one npm cannot serve, so a committed entry never leaves teammates without tools.
- **Agents install what is missing.** When an app lists `lowdefy` in its `package.json` but its dependencies are not installed, `lowdefy_dev_start` answers with the install command and where to run it (for example `pnpm install` at the workspace root), instead of running a dev script that cannot start.
- **Trust a repository once.** Approving an app outside the session's checkout now offers **Always allow this repository**, which covers all of its git worktrees in every later session. Trust is per git repository and only comes from you: the question, or `lowdefy hub trust [directory]`, which runs only in an interactive terminal so an agent cannot run it. `lowdefy hub untrust [directory]` and `lowdefy hub trusted` manage the list.
- **The MCP server is renamed `lowdefy`** (was `lowdefy-docs`), so its tools are `mcp__lowdefy__*`. Rerunning `lowdefy agent-setup` renames it in `.mcp.json`, swaps the approval in `.claude/settings.json`, and updates the name in the skill and `AGENTS.md` section it wrote; `agent-setup --user` removes an old `lowdefy-docs` user registration. The dev server's `/lowdefy-docs` routes are unchanged.
- **Mixed Lowdefy versions.** When `lowdefy mcp` connects to a dev server, it adds the tools it does not know to the session's tool list, and shared tools follow the newest comparable server: a dev server on a newer Lowdefy version replaces their descriptions and schemas. Versions are compared only when both are releases or share a major, so an experimental build is never overridden by an older release line. The client is told to list the tools again.
