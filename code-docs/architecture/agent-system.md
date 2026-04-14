---
title: Agent System
updated: 2026-04-14
packages:
  [
    '@lowdefy/ai-utils',
    '@lowdefy/api',
    '@lowdefy/build',
    '@lowdefy/blocks-antd-x',
    '@lowdefy/connection-anthropic',
    '@lowdefy/connection-openai',
    '@lowdefy/connection-google',
    '@lowdefy/connection-mcp',
  ]
---

# Agent System

## Overview

The agent system adds AI chat capabilities to Lowdefy apps. Agents are config-driven (YAML) and follow the same `type` + `connectionId` + `properties` pattern used by requests. A top-level `agents:` key in the Lowdefy config defines one or more agents, each specifying a model, system instructions, tools, and streaming behavior. The system integrates the Vercel AI SDK v6 for multi-provider model access, streaming, and tool execution.

A minimal agent config:

```yaml
agents:
  - id: support_agent
    type: ClaudeAgent
    connectionId: anthropic
    properties:
      model: claude-sonnet-4-20250514
      instructions: You are a helpful support agent.
    tools:
      - search_knowledge_base
```

## Four-Layer Architecture

The agent system separates concerns into four layers, each configured independently:

1. **Connection** -- AI SDK provider (Anthropic, OpenAI, Google) or config container (Mcp). Holds credentials and creates the provider instance. Configured under `connections:` just like database connections.

2. **Agent** -- The orchestration unit. References a connection, specifies model/instructions/tools/hooks, and controls the tool loop (max steps, stop conditions, pruning). Configured under the top-level `agents:` key. At runtime, a `ToolLoopAgent` from the AI SDK manages the multi-step model interaction.

3. **Tool** -- API endpoints with `description` + `payloadSchema` that make them callable by models. Endpoints own their tool metadata; agents simply reference endpoint IDs. MCP servers, sub-agents, and file system access provide additional tool sources.

4. **Block** -- `AgentChat` and `AgentConversations` UI components. Pure rendering, no AI config. The block connects to the agent API route via a transport layer and renders the streaming conversation.

This separation means the same endpoint can serve a page button, another endpoint, or an agent tool without duplication. The same agent can power different UIs.

## Request Flow (Chat Message to Streaming Response)

### Client Side

1. User types a message in `AgentChat`. The `handleSend` function fires `onBeforeSend` for validation, then calls `sendMessage()` on the `useChat` hook.
2. `useChat` uses a `DefaultChatTransport` that POSTs to `/api/agent/{pageId}/{agentId}?conversationId=...` with `{ messages, urlQuery }` in the body.

### Server Side

3. The Next.js catch-all route (`pages/api/agent/[...path].js`) extracts `pageId` and `agentId` from URL segments, validates the request body, and calls `callAgent()`. See `packages/servers/server/pages/api/agent/[...path].js`.

4. `callAgent` (`packages/api/src/routes/agent/callAgent.js`) orchestrates the server-side flow:

   - Loads agent config from `agents/{agentId}.json` via `getAgentConfig`
   - Evaluates operators in agent properties (`_user`, `_secret`, `_payload`) with `agentContext` as payload
   - Loads connection config, creates the provider instance (e.g., Anthropic SDK client)
   - Resolves MCP connection references to inline transport config
   - Looks up the agent type resolver from the plugin registry via `getAgentResolver`
   - Builds a `resolverContext` with `callEndpoint`, `getEndpointConfig`, `getAgentConfig`, `getConnectionForAgent`, and `resolveMcpSources` -- these are the capabilities available to the agent runtime
   - Calls `agentType.resolver()` with the connection, properties, and context

5. The agent resolver (e.g., `ClaudeAgent`) maps provider-specific properties into `providerOptions` and delegates to `handleAgentChat()`.

6. `handleAgentChat` (`packages/utils/ai-utils/src/handleAgentChat.js`) is the shared runtime:
   - Calls `buildAgentTools` to merge endpoint, MCP, sub-agent, and file system tools
   - Creates a `ToolLoopAgent` with model, instructions, tools, stop conditions, and hook callbacks
   - Opens a `createUIMessageStream`, runs the agent inside the stream's execute function
   - If `prune` config is set, decomposes the stream creation to insert `pruneMessages` between UI-to-model conversion and agent execution
   - After the agent stream completes, calls `onFinish` hooks (awaited) and writes any returned `dataParts` to the stream
   - Cleans up MCP clients

### Back to Client

7. The response streams as SSE events back through Next.js to the browser.
8. The `useChat` hook updates messages reactively. `useAgentEvents` watches message changes and fires Lowdefy events (`onMessageComplete`, `onToolCall`, `onToolResult`, `onUserMessage`, `onTitleGenerated`, `onDataPart`).

## Build Pipeline

Three build steps handle agent configuration:

### buildAgents

`packages/build/src/build/buildAgents.js`

Validates and normalizes agent configs in a two-pass approach:

**First pass** (per agent):

- Checks for duplicate agent IDs
- Validates `connectionId` references an existing connection
- Validates `model` is defined in properties
- Normalizes shorthand: tool strings become `{ endpointId }` objects, MCP strings become `{ connectionId }` objects, sub-agent strings become `{ agentId }` objects
- Validates each tool endpoint exists and has both `description` and `payloadSchema`
- Validates MCP sources: connection references exist, stdio sources have `command`, HTTP sources have `url`
- Validates hook endpoints exist
- Validates fileSystem `basePath` exists on disk
- Renames `id` to `agentId` (internal format: `agent:{agentId}`)
- Counts server operators for type resolution

**Second pass** (cross-references):

- Validates sub-agent references point to existing agents
- Checks for name collisions between sub-agent IDs and endpoint tool IDs
- Warns when sub-agents have `confirm: true` tools (unsupported in sub-agent context)

**Cycle detection**: Uses DFS with an in-stack set to detect circular sub-agent references. Throws `ConfigError` if a cycle is found.

### writeAgents

`packages/build/src/build/writeAgents.js`

Serializes each agent config to `agents/{agentId}.json` using `serializer.serializeToString`, which preserves `~k` markers for error tracing at runtime.

### writeAgentImports

`packages/build/src/build/writePluginImports/writeAgentImports.js`

Generates `plugins/agents.js` -- an import registry that maps agent type names to their resolver modules. This allows the server to look up agent types dynamically.

### copyAgentFileSystems

`packages/build/src/build/copyAgentFileSystems.js`

When the config directory differs from the server directory (production builds), copies each unique `fileSystem.basePath` directory to the server output. Uses a `Set` to avoid copying the same path twice when multiple agents share a base directory.

## Tool System

`buildAgentTools` (`packages/utils/ai-utils/src/buildAgentTools.js`) merges four tool sources into a single `tools` object for the AI SDK.

### Endpoint Tools

Configured as `agent.tools[]`, each referencing an API endpoint ID. At runtime:

- Loads endpoint config via `context.getEndpointConfig()`
- Creates an AI SDK `tool()` with the endpoint's `description` and `payloadSchema`
- Cleans build artifact markers (`~k`, `~r`, `~l`) from the schema before passing to the AI SDK
- Executes via `context.callEndpoint()`, which runs the endpoint's full routine (auth, operators, requests)
- Optional `confirm: true` sets `needsApproval` on the tool for client-side approval UI

### MCP Tools

Configured as `agent.mcp[]`, each source specifying either an HTTP URL or stdio command. MCP connections can be referenced by `connectionId` -- `callAgent` resolves these to inline config before the agent runs. At runtime:

- Creates MCP clients via `createMCPClient` from `@ai-sdk/mcp`
- Supports `http` (default) and `stdio` transports
- Retrieves tools via `client.tools()` and merges them into the tools object
- Warns and skips on name conflicts with endpoint tools
- Optional `confirm: true` adds `needsApproval` to all tools from that source
- Unreachable servers are warned, not fatal

### Sub-Agent Tools

Configured as `agent.agents[]`, each referencing another agent ID. At runtime:

- Loads the sub-agent's config and connection
- Recursively calls `buildAgentTools` with `depth + 1` (max depth: 5)
- Creates a nested `ToolLoopAgent` with the sub-agent's own tools and instructions
- Wraps it as a tool with `description` (defaults to "Delegate task to the {agentId} agent") and `inputSchema` (defaults to `{ task: string }`)
- Uses `toModelOutput` to extract the text response for the parent agent
- Cleans up sub-agent MCP clients after execution

### FileSystem Tools

Configured via `agent.properties.fileSystem` with a `basePath`. Automatically adds four tools:

| Tool           | Purpose                           | Limits                            |
| -------------- | --------------------------------- | --------------------------------- |
| `read-file`    | Read file contents                | 512KB max, truncates with notice  |
| `list-files`   | List directory with optional glob | No inherent limit                 |
| `search-files` | Case-insensitive text search      | 200 match limit, skips files >1MB |
| `stat-file`    | File metadata (size, type, date)  | None                              |

All tools use `resolvePath()` (`packages/utils/ai-utils/src/fileSystem/resolvePath.js`) which normalizes the requested path against the base directory and throws if the resolved path escapes the base, preventing path traversal attacks.

## Hook System

Hooks are server-side lifecycle callbacks that call API endpoints. Configured under `agent.hooks`:

```yaml
hooks:
  onStart: [log_agent_start]
  onFinish: [generate_title, save_conversation]
```

### Fire-and-Forget Hooks

These hooks dispatch endpoint calls without awaiting results:

| YAML Key           | AI SDK Callback                 | Fires When                   |
| ------------------ | ------------------------------- | ---------------------------- |
| `onStart`          | `experimental_onStart`          | Agent begins processing      |
| `onStepStart`      | `experimental_onStepStart`      | Each tool loop step starts   |
| `onToolCallStart`  | `experimental_onToolCallStart`  | Model initiates a tool call  |
| `onToolCallFinish` | `experimental_onToolCallFinish` | Tool execution completes     |
| `onStepFinish`     | `onStepFinish`                  | Each tool loop step finishes |

Hook payloads are cleaned of non-serializable fields (`abortSignal`, functions, `messages`) via `cleanHookEvent`.

### Awaited Hook: onFinish

`onFinish` is handled at the stream level, not through the AI SDK callback. After the agent stream completes:

- Sends a payload with `messages`, `finishReason`, `usage` (accumulated across all steps), and `agentContext` (pageId, userId, conversationId, urlQuery)
- **Awaits** each endpoint call sequentially
- If an endpoint returns `{ dataParts: [...] }`, each data part is written to the response stream
- This enables patterns like title generation: the hook endpoint calls an LLM, returns `[{ type: 'data-chat-title', data: { title } }]`, and the client receives the title as a stream event

## Agent Resolvers

Each provider plugin exports an agent type that maps provider-specific config to `providerOptions` before delegating to `handleAgentChat`.

### ClaudeAgent (`@lowdefy/connection-anthropic`)

`packages/plugins/connections/connection-anthropic/src/connections/Anthropic/ClaudeAgent/ClaudeAgent.js`

Maps `thinking` and `effort` properties into `providerOptions.anthropic`:

```yaml
properties:
  model: claude-sonnet-4-20250514
  thinking: { type: enabled, budgetTokens: 10000 }
  effort: high
```

### OpenAIAgent (`@lowdefy/connection-openai`)

`packages/plugins/connections/connection-openai/src/connections/OpenAI/OpenAIAgent/OpenAIAgent.js`

Maps `reasoningEffort` and `reasoningSummary` into `providerOptions.openai`:

```yaml
properties:
  model: o3-mini
  reasoningEffort: medium
  reasoningSummary: auto
```

### GeminiAgent (`@lowdefy/connection-google`)

`packages/plugins/connections/connection-google/src/connections/Google/GeminiAgent/GeminiAgent.js`

Maps `thinkingConfig` and `safetySettings` into `providerOptions.google`:

```yaml
properties:
  model: gemini-2.5-pro
  thinkingConfig: { thinkingBudget: 5000 }
```

### AISDKAgent (generic, `@lowdefy/ai-utils`)

`packages/utils/ai-utils/src/AISDKAgent.js`

Passes through to `handleAgentChat` with no provider-specific mapping. Useful for providers that need no special options.

## Dynamic Step Configuration

`prepareStep` rules (`packages/utils/ai-utils/src/buildPrepareStep.js`) allow per-step config overrides during the tool loop:

```yaml
prepareStep:
  - steps: [1]
    toolChoice: required
    activeTools: [search_knowledge_base]
  - from: 2
    toolChoice: auto
    temperature: 0.3
```

Rules are evaluated in order. The first matching rule wins. Each rule can match by:

- `steps: [1, 3, 5]` -- explicit step numbers
- `from: 2, to: 4` -- inclusive range (omit `to` for open-ended)

Overridable properties: `activeTools`, `toolChoice`, `maxOutputTokens`, `temperature`.

## Message Pruning

The `prune` config removes older reasoning and tool-call parts to manage context window size. When enabled, `handleAgentChat` decomposes the standard `createAgentUIStream` flow to insert `pruneMessages` from the AI SDK between UI-to-model message conversion and agent execution.

```yaml
prune:
  reasoning: before-last-message
  toolCalls: all
  emptyMessages: remove
```

### Reasoning Pruning

- `all` -- removes all reasoning parts from all messages
- `before-last-message` -- keeps reasoning only in the last assistant message
- `none` -- keeps all reasoning

### Tool Call Pruning

Global string or per-tool array:

```yaml
# Global
prune:
  toolCalls: before-last-message

# Per-tool
prune:
  toolCalls:
    - type: all
      tools: [search_files]
    - type: before-last-message
```

## AgentChat Block

`packages/plugins/blocks/blocks-antd-x/src/blocks/AgentChat/AgentChat.js`

A composite block built on Ant Design X components that provides the full chat UI.

### Transport

`LowdefyChatTransport.js` creates a `DefaultChatTransport` from the AI SDK, configured to POST to `/api/agent/{pageId}/{agentId}`. The `conversationId` is passed as a query parameter, `urlQuery` in the body.

### State Management

The `useChat` hook from `@ai-sdk/react` manages messages, streaming status, and error state. External messages can be synced in via the `messages` property (for loading saved conversations). Messages are cleared automatically when `conversationId` changes.

### Events

`useAgentEvents` (`packages/plugins/blocks/blocks-antd-x/src/blocks/AgentChat/useAgentEvents.js`) bridges AI SDK state changes to Lowdefy's event system using refs to track which events have already fired:

- `onBeforeSend` -- before message is sent (can cancel)
- `onUserMessage` -- when a user message appears
- `onMessageComplete` -- when streaming finishes (includes `finishReason`, full message parts)
- `onToolCall` -- when a tool call is initiated
- `onToolResult` -- when a tool call completes
- `onError` -- on streaming/transport errors
- `onStop` -- when user stops generation
- `onRegenerate` -- when user regenerates a response
- `onEditMessage` -- when user edits a message (truncates history and resends)
- `onDeleteMessage` -- when user deletes a message
- `onFeedback` -- when user gives thumbs up/down
- `onSuggestionClick` -- when user clicks a suggestion chip
- `onSwitchChange` -- when user toggles a sender switch
- `onTitleGenerated` -- when a `data-chat-title` part arrives (from `onFinish` hook)
- `onDataPart` -- when any data part arrives from the stream

### Methods

Registered via `methods.registerMethod` for use with `CallMethod` actions:

`regenerate`, `setMessages`, `sendMessage`, `clearMessages`, `deleteMessage`, `stop`, `clearError`, `scrollToBottom`

### Features

- **File attachments**: Optional, with direct data URL encoding or S3 upload via a policy request
- **Drawer mode**: `display: drawer` wraps the chat in an Ant Design drawer
- **Welcome screen**: Configurable prompts shown when the conversation is empty
- **Tool approval UI**: `ToolApproval` component rendered for tools with `needsApproval`
- **Suggestions**: Static config or dynamic from `data-suggestions` data parts
- **Sender switches**: Toggle controls in the sender footer, state available in `onBeforeSend`
- **Message display**: Configurable roles, avatars, copy/feedback actions, reasoning display, markdown with mermaid/LaTeX/code highlighting

## AgentConversations Block

`packages/plugins/blocks/blocks-antd-x/src/blocks/AgentConversations/AgentConversations.js`

A standalone block for conversation list management, decoupled from the chat UI:

- `items` -- conversation list (from state or requests)
- `activeKey` -- currently selected conversation
- `menu` -- context menu items per conversation
- `creation` -- "New Chat" button config
- `groupable` -- group conversations with collapsible sections

Events: `onSelect`, `onNew`, `onMenuClick`

Developers wire their own persistence. The block renders the list; the app config connects it to `AgentChat` via shared state (typically `conversationId`).

## Key Files

| File                                                                                                     | Purpose                                                                    |
| -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `packages/utils/ai-utils/src/handleAgentChat.js`                                                         | Core orchestration: builds tools, creates ToolLoopAgent, manages streaming |
| `packages/utils/ai-utils/src/buildAgentTools.js`                                                         | Merges endpoint, MCP, sub-agent, and fileSystem tools                      |
| `packages/utils/ai-utils/src/buildPrepareStep.js`                                                        | Builds step-matching function for dynamic per-step config                  |
| `packages/utils/ai-utils/src/AISDKAgentSchema.js`                                                        | JSON Schema for agent properties validation                                |
| `packages/utils/ai-utils/src/AISDKAgent.js`                                                              | Generic agent resolver (no provider-specific mapping)                      |
| `packages/utils/ai-utils/src/fileSystem/resolvePath.js`                                                  | Path traversal prevention for fileSystem tools                             |
| `packages/utils/ai-utils/src/fileSystem/readFile.js`                                                     | File reading with 512KB truncation                                         |
| `packages/utils/ai-utils/src/fileSystem/searchFiles.js`                                                  | Case-insensitive search with 200 match limit                               |
| `packages/api/src/routes/agent/callAgent.js`                                                             | API route handler: loads config, resolves connections, calls resolver      |
| `packages/api/src/routes/agent/getAgentConfig.js`                                                        | Reads agent JSON from build artifacts                                      |
| `packages/api/src/routes/agent/getAgentResolver.js`                                                      | Looks up agent type from plugin registry                                   |
| `packages/build/src/build/buildAgents.js`                                                                | Build-time validation, normalization, cycle detection                      |
| `packages/build/src/build/writeAgents.js`                                                                | Serializes agent configs to JSON artifacts                                 |
| `packages/build/src/build/writePluginImports/writeAgentImports.js`                                       | Generates agent type import registry                                       |
| `packages/build/src/build/copyAgentFileSystems.js`                                                       | Copies fileSystem directories to server output                             |
| `packages/servers/server/pages/api/agent/[...path].js`                                                   | Next.js API route, SSE streaming                                           |
| `packages/plugins/blocks/blocks-antd-x/src/blocks/AgentChat/AgentChat.js`                                | Chat block component                                                       |
| `packages/plugins/blocks/blocks-antd-x/src/blocks/AgentChat/LowdefyChatTransport.js`                     | DefaultChatTransport factory                                               |
| `packages/plugins/blocks/blocks-antd-x/src/blocks/AgentChat/useAgentEvents.js`                           | AI SDK to Lowdefy event bridging                                           |
| `packages/plugins/blocks/blocks-antd-x/src/blocks/AgentConversations/AgentConversations.js`              | Conversation list block                                                    |
| `packages/plugins/connections/connection-anthropic/src/connections/Anthropic/ClaudeAgent/ClaudeAgent.js` | Anthropic resolver                                                         |
| `packages/plugins/connections/connection-openai/src/connections/OpenAI/OpenAIAgent/OpenAIAgent.js`       | OpenAI resolver                                                            |
| `packages/plugins/connections/connection-google/src/connections/Google/GeminiAgent/GeminiAgent.js`       | Google resolver                                                            |
| `packages/plugins/connections/connection-mcp/src/connections/Mcp/Mcp.js`                                 | MCP config-container connection                                            |

## Decision Trace

**Why ToolLoopAgent over a manual loop?** The AI SDK's `ToolLoopAgent` handles the tool call loop, step tracking, streaming protocol, and message format conversion. Lowdefy provides tools and configuration; the SDK manages the execution cycle. This avoids reimplementing retry logic, streaming protocol details, and multi-step orchestration.

**Why endpoints as tools?** Endpoints already have authentication, connection management, operator evaluation, and composable routines. Adding `description` and `payloadSchema` to endpoint config makes them callable by models with no new infrastructure. The same endpoint serves page buttons, other endpoints, and agent tools.

**Why separate AgentConversations from AgentChat?** Conversation management (persistence, search, grouping) varies widely across apps. Decoupling lets developers wire their own storage backend and UI layout. The two blocks connect through shared state, typically a `conversationId` in Lowdefy state.

**Why hooks call endpoints?** Hooks follow the same composable pattern as the rest of Lowdefy's server-side architecture. A hook endpoint can write to a database, call an external API, or generate a chat title -- all using existing connection and request infrastructure. No special hook execution engine needed.

**Why MCP connections are config containers?** Unlike provider connections that create SDK clients, MCP connections just store transport config (URL, command, headers). The actual MCP client is created at runtime by `buildAgentTools` because MCP clients are stateful (they maintain a session) and must be created fresh per request and cleaned up after.

**Why clean build artifact markers before passing schemas to the AI SDK?** Build artifacts contain serializer markers (`~k`, `~r`, `~l`, `~arr`) as non-enumerable properties and wrapper objects. The AI SDK's `jsonSchema()` function expects clean JSON Schema. `cleanBuildArtifact()` strips these markers via `JSON.stringify`/`JSON.parse` with a key filter.
