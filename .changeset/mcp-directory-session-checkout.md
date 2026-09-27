---
'lowdefy': patch
'@lowdefy/docs': patch
---

`lowdefy mcp` now acts only on apps in the checkout the agent session started in and in the git worktrees of that repository. Starting a dev server runs the app's `package.json` dev script, and the tools are approved once, for that checkout. A `directory` anywhere else is refused with a message naming the session's checkout; when the agent client supports MCP elicitation, `lowdefy mcp` asks you first instead, and your answer holds for the session. The monorepo's `scripts/dev.mjs` now honours the port the Lowdefy hub assigns (`LOWDEFY_DEV_PORT`), like `lowdefy dev`.
