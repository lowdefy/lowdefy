---
'@lowdefy/ai-utils': minor
'@lowdefy/blocks-antd-x': minor
'@lowdefy/connection-anthropic': minor
'@lowdefy/connection-openai': minor
'@lowdefy/connection-google': minor
'@lowdefy/connection-mcp': minor
'@lowdefy/api': minor
'@lowdefy/build': minor
'@lowdefy/server': minor
'@lowdefy/server-dev': minor
---

feat: Add AI agent support with multi-provider chat and tool use

**Agent Runtime (`@lowdefy/ai-utils`)**

- New shared agent runtime with `ToolLoopAgent` that handles multi-turn tool calling, streaming responses, and artifact cleaning
- `createAgentUIStreamResponse` converts agent output to a streaming HTTP response for the client
- `handleAgentChat` orchestrates the full agent lifecycle with configurable hooks
- Provider-agnostic design using the Vercel AI SDK — supports reasoning/thinking display and `providerOptions` passthrough

**AgentChat Block (`@lowdefy/blocks-antd-x`)**

- New `AgentChat` block built on Ant Design X components with real-time streaming display
- Sequential message part rendering with configurable reasoning/thinking display
- Event bridging for agent lifecycle events (onSuccess, onError, onFinish)

**Connection Plugins**

- `@lowdefy/connection-anthropic`: Anthropic connection with `AnthropicAgent` resolver supporting Claude models
- `@lowdefy/connection-openai`: OpenAI connection with `OpenAIAgent` resolver supporting GPT models
- `@lowdefy/connection-google`: Google AI connection with `GeminiAgent` resolver, including `thinkingConfig` and `safetySettings` sugar props

**MCP Integration (`@lowdefy/connection-mcp`, `@lowdefy/ai-utils`, `@lowdefy/build`)**

- New `Mcp` connection type for defining MCP server transport config (HTTP, SSE, stdio)
- Agents can reference MCP connections via `connectionId` or inline config with build-time validation
- Runtime MCP client creation with automatic tool discovery, merging, and cleanup
- Tool approval support via `confirm: true` on both endpoint tools and MCP sources

**Build Pipeline (`@lowdefy/build`)**

- `buildAgents` validates agent config with model and tool endpoint metadata
- `writeAgents` writes agent artifacts for server consumption
- Agent schema validation integrated into the build pipeline

**API (`@lowdefy/api`)**

- Agent route handler with `callAgent` for streaming agent responses
- `getAgentConfig` and `getAgentResolver` for runtime agent resolution

**Servers**

- Agent API route (`/api/agent/[...path]`) added to both production and development servers
- Server-side hooks for agent lifecycle callbacks (instructions, onFinish)
