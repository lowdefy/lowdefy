# lowdefySchema — Key Takeaways for MCP Bridge

**File:** `packages/build/src/lowdefySchema.js`

## What It Does

JSON Schema (draft-07) defining the valid structure of `lowdefy.yaml`. Validated at build time by `testSchema`.

## Top-Level Properties

```
Required: lowdefy (version string)
Optional: name, version, license, app, auth, cli, config, plugins,
          global, connections, api, menus, pages
```

## Key Definitions for MCP

### Block Definition (lines 359-523)

A block has: `id`, `type`, `field`, `properties`, `layout`, `skeleton`, `style`, `visible`, `loading`, `blocks`, `requests`, `required`, `validate`, `events`, `areas`.

The `mcp` property does NOT exist yet. To add per-block MCP config, extend the block definition:

```javascript
mcp: {
  type: 'object',
  properties: {
    exclude: { type: 'boolean' },
    toolName: { type: 'string' },
    description: { type: 'string' },
  },
}
```

### Request Definition (lines 764-808)

Required: `id`, `type`, `connectionId`. Optional: `payload` (object), `properties` (object).

The request `payload` is what gets evaluated client-side with WebParser. The `properties` are evaluated server-side with ServerParser.

### Connection Definition (lines 559-590)

Required: `id`, `type`. Optional: `properties` (object).

### Events (lines 437-489)

Events are objects where keys are event names and values are either:
- An array of actions (simple form)
- An object with `try`/`catch` arrays and optional `debounce` (structured form)

### Action Definition (lines 7-41)

Required: `id`, `type`. Optional: `async`, `messages`, `params`, `skip`.

The `skip` and `params` fields have no type constraint (they can be anything, including operator expressions).

## Schema Extension for MCP

Add to the top-level properties (after `pages`):

```javascript
mcp: {
  type: 'object',
  properties: {
    enabled: { type: 'boolean' },
    transport: { type: 'string', enum: ['stdio', 'streamable-http'] },
    port: { type: 'number' },
    session: {
      type: 'object',
      properties: {
        store: {
          type: 'object',
          required: ['type'],
          properties: {
            type: { type: 'string' },  // 'filesystem', 'mongodb', etc.
            properties: { type: 'object' },
          },
        },
      },
    },
    auth: { type: 'object' },
    tools: { type: 'object' },
    resources: { type: 'object' },
  },
}
```

## Important Pattern

The schema uses `additionalProperties: false` at most levels. Any new property MUST be added to the schema or the build will reject it. This is why the schema extension is mandatory — you can't just add `mcp:` to lowdefy.yaml without updating the schema first.
