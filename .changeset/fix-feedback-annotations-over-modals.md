---
'@lowdefy/server-dev': patch
'lowdefy': patch
---

fix(server-dev): Annotations now work over open modals, plus an annotate hint on dev server startup.

- The annotation overlay is now rendered into the document body, so its comment box stays clickable and typeable even when a modal is open on the page.
- On startup the dev server now reports that the agent docs & MCP endpoint is live (with the `lowdefy agent-setup` command to connect an agent), followed by a notice box explaining the Cmd/Ctrl+/ annotation shortcut.
- `lowdefy agent-setup` now enables the `lowdefy-docs` MCP server in the committed `.claude/settings.json`, so everyone on the project has it approved without a prompt.
