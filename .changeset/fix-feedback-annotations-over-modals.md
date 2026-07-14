---
'@lowdefy/server-dev': patch
'lowdefy': patch
---

fix(server-dev): Annotations now work over open modals, plus an annotate hint on dev server startup.

- The annotation overlay is now rendered into the document body, so its comment box stays clickable and typeable even when a modal is open on the page.
- The dev server prints a startup reminder that pressing Cmd/Ctrl+/ opens annotation mode for copying feedback to your coding agent.
- `lowdefy agent-setup` now enables the `lowdefy-docs` MCP server in the committed `.claude/settings.json`, so everyone on the project has it approved without a prompt.
