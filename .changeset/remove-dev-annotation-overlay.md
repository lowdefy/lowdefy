---
'@lowdefy/server-dev': minor
'lowdefy': patch
'@lowdefy/docs-content': patch
---

feat(server-dev): Remove the in-page annotation overlay

The dev server no longer has the Cmd/Ctrl+/ annotation overlay or its `POST /lowdefy-feedback` route. Point a coding agent at the page instead: it can take screenshots and read live state through the dev server's MCP tools. Option/Alt+click to open a block's yaml in VS Code stays. The dev server's start-up notice now names Option/Alt+click for it, where it said Cmd/Ctrl+click. `lowdefy agent-setup` no longer writes the visual feedback section into AGENTS.md and the skill.
