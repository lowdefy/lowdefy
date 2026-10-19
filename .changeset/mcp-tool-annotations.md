---
'@lowdefy/api': minor
'@lowdefy/build': minor
---

feat(build): MCP tools can declare annotations

An `mcp.endpoints` entry takes an optional `annotations` object with the MCP tool annotations: `title`, `readOnlyHint`, `destructiveHint`, `idempotentHint` and `openWorldHint`. They are validated at build time and sent with the tool in `tools/list`, so clients such as Claude can show a readable tool name and skip the confirmation prompt for read-only tools.

```yaml
mcp:
  endpoints:
    - id: search-customers
      scope: mcp:read
      annotations:
        title: Search customers
        readOnlyHint: true
```

Annotations are declared, never derived from `scope`: an `mcp:read` tool can still write.
