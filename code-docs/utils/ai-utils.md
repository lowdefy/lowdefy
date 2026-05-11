---
title: '@lowdefy/ai-utils'
updated: 2026-05-05
package: '@lowdefy/ai-utils'
---

# @lowdefy/ai-utils

Shared agent runtime that sits between provider-specific resolvers and the Vercel AI SDK.

## Purpose

This package provides the core orchestration for Lowdefy's agent system:

- `handleAgentChat` — The main entry point called by all agent resolvers
- Tool building — Merges endpoint, MCP, sub-agent, fileSystem, and built-in `update-page-state` tools
- Step preparation — Dynamic per-step config overrides
- Message pruning — Context optimization by stripping old reasoning/tool calls
- Reserved tool name guard — Rejects user tools that collide with built-ins (e.g. `update-page-state`)

## Key Exports

```javascript
import {
  handleAgentChat, // Core orchestration function
  AISDKAgent, // Base agent wrapper
  AISDKAgentSchema, // JSON Schema for agent properties
  buildAgentTools, // Tool merging function
} from '@lowdefy/ai-utils';
```

## Key Modules

### handleAgentChat.js

The main entry point called by all agent resolvers (ClaudeAgent, OpenAIAgent, GeminiAgent, AIGatewayAgent).

**Parameters:**

```javascript
{
  connection,           // AI SDK provider instance
  properties: {
    agent,              // Full agent config (tools, mcp, hooks, properties)
    messages            // UIMessage[] from client
  },
  context: {
    agentContext,        // { pageId, userId, conversationId, urlQuery, sharedState }
    callEndpoint,        // Execute API endpoint as tool
    evaluateOperators,
    getEndpointConfig,
    getAgentConfig,      // For sub-agent references
    getConnectionForAgent,
    resolveMcpSources
  }
}
```

**Orchestration sequence:**

1. Build tools via `buildAgentTools()`
2. Prepare instructions (with optional `pageContext` prepend)
3. Create `ToolLoopAgent` with model, tools, stop conditions
4. Stream via `createUIMessageStream` — merges agent output into SSE stream
5. Execute `onFinish` hooks (awaited for dataParts)
6. Close MCP clients

**Returns:** `{ response }` — a Web Response stream.

### buildAgentTools.js

Merges five tool sources into a single `tools` object:

1. **Endpoint tools** (`agent.tools[]`) — Loads config via `getEndpointConfig`, creates AI SDK `tool()` with `callEndpoint` as execute. Optional `needsApproval: true` for `confirm: true` tools.

2. **MCP tools** (`agent.mcp[]`) — Creates transport (stdio or HTTP), creates MCP client, retrieves tools via `client.tools()`. Warns on name conflicts with endpoint tools.

3. **Sub-agent tools** (`agent.agents[]`) — Recursively builds tools for sub-agents (depth limit 5), creates nested ToolLoopAgent, wraps with `toModelOutput` to extract text.

4. **FileSystem tools** (`agent.properties.fileSystem`) — `read-file` (512KB max), `list-files` (with glob), `search-files` (case-insensitive, 200 match limit), `stat-file`. All scoped to basePath.

5. **Built-in `update-page-state` tool** — Added when the AgentChat block declares `sharedState`. Built via `buildUpdatePageStateTool` and exposed as a tool the agent can call to write back to page state. See [Page state integration](#page-state-integration-sharedstate).

Before merging, user-defined tool names are validated against `RESERVED_PLATFORM_TOOL_NAMES` (currently `update-page-state`). A collision is a hard error — collisions silently overriding the platform tool would corrupt state-write semantics.

**Returns:** `{ tools, mcpClients }`

### buildPrepareStep.js

Builds a `prepareStep` callback from agent config rules. Rules match by:

- `steps: [1, 3, 5]` — Specific step numbers
- `from: 2, to: 4` — Range (inclusive)

First matching rule wins. Can override: `activeTools`, `toolChoice`, `maxOutputTokens`, `temperature`.

### AISDKAgentSchema.js

JSON Schema defining all agent properties: `model`, `instructions`, `maxSteps`, `temperature`, `topP`, `topK`, `frequencyPenalty`, `presencePenalty`, `seed`, `stopSequences`, `toolChoice`, `activeTools`, `stopOnToolCall`, `pageContext`, `repairToolCall`, `prepareStep`, `prune`, `fileSystem`, `providerOptions`.

### fileSystem/

File system tool implementations, all scoped to a basePath:

| Module           | Purpose                                            | Limits                |
| ---------------- | -------------------------------------------------- | --------------------- |
| `resolvePath.js` | Normalizes path, validates no escape from basePath | —                     |
| `readFile.js`    | Reads file content as UTF-8                        | 512KB max, truncates  |
| `listFiles.js`   | Lists directory with optional glob filtering       | —                     |
| `searchFiles.js` | Case-insensitive text search                       | 200 matches, 1MB/file |
| `statFile.js`    | Returns file metadata (size, type, dates)          | —                     |

### buildUpdatePageStateTool.js

Factory that constructs the `update-page-state` tool from the active `sharedState` snapshot. The tool accepts a partial state patch and is wired so the AgentChat block applies the patch to page state on the client. The factory binds against the keys present in `sharedState` so that the tool's parameter schema (and the agent's awareness of writeable keys) is restricted to what the block exposed.

### reservedToolNames.js

Exports `RESERVED_PLATFORM_TOOL_NAMES` and a guard used by `buildAgentTools` to reject user tools that collide with platform built-ins. Currently reserved: `update-page-state`. Collisions throw at build/runtime — they're never silently shadowed.

## Page state integration (`sharedState`)

Agents can read and write a slice of page state declared by the AgentChat block:

- The block exposes a `sharedState` object (formerly `pageState`) — operator-evaluated each render and shipped with each chat request.
- `callAgent` forwards `sharedState` into the runtime's `agentContext.sharedState`.
- `handleAgentChat` builds the `update-page-state` tool for that snapshot and includes the state as a `pageContext`-style block in instructions so the agent sees current values.
- When the agent calls `update-page-state`, the streamed result is delivered back to the AgentChat block, which writes the patch to page state via the `update-page-state` event (allowlisted to the originally-declared keys).

Sharp edges:

- The block's allowlist is `Object.keys(sharedState)` at request time — adding keys mid-conversation requires a fresh render.
- Patches not intersecting the allowlist are dropped on the client.
- The reserved-name guard prevents user tools from impersonating the built-in.

## Dependencies

- `ai` (Vercel AI SDK v6) — `ToolLoopAgent`, `UIMessageStream`, `tool()`, `jsonSchema`
- `@modelcontextprotocol/sdk` — MCP client and transport
- `@lowdefy/helpers` — `serializer`, `type` checks

## Design Decisions

- **Provider-agnostic**: All provider-specific config is handled by resolver plugins. ai-utils only works with AI SDK abstractions.
- **Tool sources are additive**: Endpoint, MCP, sub-agent, and fileSystem tools merge into one flat object. Name conflicts warn, don't error.
- **Hooks call endpoints**: No custom hook infrastructure — hooks call existing API endpoints with cleaned payloads.
- **onFinish is special**: Only hook that's awaited because it can write dataParts to the stream (e.g., title generation, suggestions).
- **FileSystem uses path traversal prevention**: `resolvePath` ensures all paths resolve within basePath.
- **Message pruning between validation and execution**: Allows optimizing context before the AI SDK processes it.

## Integration Points

- **Called by**: ClaudeAgent, OpenAIAgent, GeminiAgent, AIGatewayAgent resolvers
- **Calls**: `context.callEndpoint`, `context.getEndpointConfig`, `context.getAgentConfig`, `context.getConnectionForAgent`, `context.resolveMcpSources`

## Key Files

| File                              | Purpose                                                  |
| --------------------------------- | -------------------------------------------------------- |
| `src/handleAgentChat.js`          | Core orchestration                                       |
| `src/buildAgentTools.js`          | Tool building and merging (includes reserved-name check) |
| `src/buildPrepareStep.js`         | Dynamic step configuration                               |
| `src/buildUpdatePageStateTool.js` | Factory for the built-in `update-page-state` tool        |
| `src/reservedToolNames.js`        | `RESERVED_PLATFORM_TOOL_NAMES` and collision guard       |
| `src/AISDKAgent.js`               | Base agent class                                         |
| `src/AISDKAgentSchema.js`         | Agent properties schema                                  |
| `src/fileSystem/resolvePath.js`   | Path safety validation                                   |
