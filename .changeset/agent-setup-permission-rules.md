---
'lowdefy': patch
---

fix(cli): `lowdefy agent-setup` carries tool approvals over when it renames the `lowdefy-docs` MCP server

- Tool permission rules that name the old server (`mcp__lowdefy-docs__lowdefy_get_schema`, or `mcp__lowdefy-docs` for all its tools) in `permissions.allow`, `ask` and `deny` of `.claude/settings.json` and `.claude/settings.local.json` become `mcp__lowdefy__…`. Before, only `enabledMcpjsonServers` and `disabledMcpjsonServers` were renamed, so after the rename every agent was asked again for each Lowdefy tool it had been allowed to use.
- When `agent-setup` changes the command of the Lowdefy entry in `.mcp.json`, for example from a `node …/node_modules/lowdefy/dist/index.js mcp` entry an earlier version wrote, it now names the old and new command and why the pinned `npx` form replaces it. Other servers in `.mcp.json` are left as they are, as before.
