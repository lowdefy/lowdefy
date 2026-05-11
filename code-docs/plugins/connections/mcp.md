---
title: '@lowdefy/connection-mcp'
updated: 2026-04-14
package: '@lowdefy/connection-mcp'
---

# @lowdefy/connection-mcp

MCP (Model Context Protocol) connection type for defining MCP server transport configuration.

## Purpose

Provides the `Mcp` connection type — a configuration container for MCP server transport settings. Unlike AI provider connections, Mcp connections don't provide agent resolvers. They store transport config that agents reference via their `mcp` property.

## Connection: Mcp

Not a provider connection — stores transport configuration only. The `create()` function returns the raw connection properties (passthrough).

Used by `callAgent` in `@lowdefy/api` to resolve `mcpSource.connectionId` references into inline config at runtime.

**Properties vary by transport type:**

**HTTP transport:**

- `url` — MCP server URL
- `headers` — HTTP headers (e.g., Authorization)

**stdio transport:**

- `command` — Command to execute
- `args` — Command arguments
- `env` — Environment variables

**Schema:** `src/connections/Mcp/schema.js`

## No Agent Resolvers

MCP is a tool source, not an agent provider. Agents reference MCP connections to discover and use tools, but the agent resolver comes from the AI provider connection (Anthropic, OpenAI, Google).

## Exports

- `connections` — `{ Mcp: { schema, create } }`
- `types` — Type registry for plugin system

## Key Files

| File                            | Purpose                          |
| ------------------------------- | -------------------------------- |
| `src/connections/Mcp/Mcp.js`    | Connection factory (passthrough) |
| `src/connections/Mcp/schema.js` | Transport config schema          |
