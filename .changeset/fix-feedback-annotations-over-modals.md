---
'@lowdefy/server-dev': patch
'lowdefy': patch
---

fix(server-dev): Annotations now work over open modals, plus an annotate hint on dev server startup.

- The annotation overlay is now rendered into the document body, so its comment box stays clickable and typeable even when a modal is open on the page.
- On startup the dev server now prints a notice box for coding agents: the docs & MCP endpoint URL with the `lowdefy agent-setup` command to connect an agent, and the Cmd/Ctrl+/ annotation shortcut.
- `lowdefy agent-setup` now enables the `lowdefy-docs` MCP server in the committed `.claude/settings.json`, so everyone on the project has it approved without a prompt.
