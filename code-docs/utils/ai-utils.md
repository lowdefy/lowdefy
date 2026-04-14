---
title: '@lowdefy/ai-utils'
updated: 2026-04-14
package: '@lowdefy/ai-utils'
---

# @lowdefy/ai-utils

Shared agent runtime that sits between provider-specific resolvers and the Vercel AI SDK.

## Purpose

This package provides the core orchestration for Lowdefy's agent system:

- `handleAgentChat` — The main entry point called by all agent resolvers
- Tool building — Merges endpoint, MCP, sub-agent, and fileSystem tools
- Step preparation — Dynamic per-step config overrides
- Message pruning — Context optimization by stripping old reasoning/tool calls

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

The main entry point called by all agent resolvers (ClaudeAgent, OpenAIAgent, GeminiAgent).

**Parameters:**

```javascript
{
  connection,           // AI SDK provider instance
  properties: {
    agent,              // Full agent config (tools, mcp, hooks, properties)
    messages            // UIMessage[] from client
  },
  context: {
    agentContext,        // { pageId, userId, conversationId, urlQuery }
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

Merges four tool sources into a single `tools` object:

1. **Endpoint tools** (`agent.tools[]`) — Loads config via `getEndpointConfig`, creates AI SDK `tool()` with `callEndpoint` as execute. Optional `needsApproval: true` for `confirm: true` tools.

2. **MCP tools** (`agent.mcp[]`) — Creates transport (stdio or HTTP), creates MCP client, retrieves tools via `client.tools()`. Warns on name conflicts with endpoint tools.

3. **Sub-agent tools** (`agent.agents[]`) — Recursively builds tools for sub-agents (depth limit 5), creates nested ToolLoopAgent, wraps with `toModelOutput` to extract text.

4. **FileSystem tools** (`agent.properties.fileSystem`) — `read-file` (512KB max), `list-files` (with glob), `search-files` (case-insensitive, 200 match limit), `stat-file`. All scoped to basePath.

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

- **Called by**: ClaudeAgent, OpenAIAgent, GeminiAgent resolvers
- **Calls**: `context.callEndpoint`, `context.getEndpointConfig`, `context.getAgentConfig`, `context.getConnectionForAgent`, `context.resolveMcpSources`

## Key Files

| File                            | Purpose                    |
| ------------------------------- | -------------------------- |
| `src/handleAgentChat.js`        | Core orchestration         |
| `src/buildAgentTools.js`        | Tool building and merging  |
| `src/buildPrepareStep.js`       | Dynamic step configuration |
| `src/AISDKAgent.js`             | Base agent class           |
| `src/AISDKAgentSchema.js`       | Agent properties schema    |
| `src/fileSystem/resolvePath.js` | Path safety validation     |
