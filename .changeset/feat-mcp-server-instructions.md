---
'@lowdefy/api': minor
'@lowdefy/build': minor
'@lowdefy/docs': patch
'@lowdefy/docs-content': patch
---

feat: Set MCP server instructions with `mcp.instructions`.

The app's `mcp` block takes an optional `instructions` string, sent to MCP clients in the `initialize` result. Clients such as Claude Code place it in the model's system prompt, so it suits a short note on how the app's tools fit together. Clients may truncate long instructions, so keep it to a few lines.
