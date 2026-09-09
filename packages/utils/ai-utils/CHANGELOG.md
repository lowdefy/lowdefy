# @lowdefy/ai-utils

## 6.0.0

### Minor Changes

- b496a77: feat: AI in API routines — one-shot LLM requests and CallAgent steps

  **One-shot LLM request types (`@lowdefy/connection-anthropic`, `@lowdefy/connection-openai`, `@lowdefy/connection-google`, `@lowdefy/connection-ai-gateway`)**

  All AI provider connections now provide `GenerateText` and `GenerateObject` request types — single model calls usable as API routine steps and page requests. The type names are shared across providers, so switching providers only means changing the `connectionId`.

  - `GenerateText` generates text from a prompt and returns `{ text, reasoningText, finishReason, usage }`.
  - `GenerateObject` generates structured data matching a JSON Schema and returns `{ object, finishReason, usage }` — ideal for classify, extract, and routing decisions inside routines.

  ```yaml
  routine:
    - id: classify
      type: GenerateObject
      connectionId: claude
      properties:
        model: claude-haiku-4-5
        prompt:
          _payload: ticket_text
        schema:
          type: object
          properties:
            category: { type: string }
  ```

  **CallAgent routine step (`@lowdefy/api`, `@lowdefy/build`, `@lowdefy/ai-utils`)**

  API endpoint routines can now run an agent to completion with the new `CallAgent` step. The agent runs headlessly — no chat UI, no streaming — looping through its tools until done, and stores `{ text, finishReason, usage, toolCalls, toolResults }` in `_step`.

  ```yaml
  routine:
    - id: research
      type: CallAgent
      properties:
        agentId: research_agent
        prompt: Summarize yesterday's signups and flag anomalies.
  ```

  - Tools marked `confirm: true` auto-execute in headless runs (the build emits a warning — there is no client to approve them).
  - Agent server hooks still fire; `onFinish` `dataParts` are ignored since there is no stream.
  - Agent tool and hook endpoint calls now count toward the endpoint call depth cap of 10, so recursive agent/endpoint configurations terminate with an error.
  - The build validates that a static `agentId` on a `CallAgent` step references an existing agent.

### Patch Changes

- 11662bc: fix(ai): a failed agent turn no longer poisons the conversation. The chat client pushes the assistant message on the stream's `start` chunk, so a request that failed after that left an assistant message with no parts in the history; every later send then failed UIMessage validation, and the error toast dumped the whole conversation as JSON. AgentChat now drops empty assistant shells on error, the agent handler ignores empty messages and redacts validation errors, and a validation failure is logged like any other stream fault.
- 8396857: fix(ai-utils): Give the assistant message an id so persisted transcripts render correctly.

  `handleAgentChat` passed no `generateMessageId` to the AI SDK, so the assistant message delivered to
  the stream-level `onFinish` arrived with an empty id. An `onFinish` hook that saves the conversation
  therefore stored every assistant message under the same id, and reloading that conversation collapsed
  the transcript: `AgentChat` keys its bubbles by message id and looks each bubble's parts up by that id,
  so every assistant bubble rendered the last reply. User messages were unaffected, and a live turn
  looked correct because the client generates its own id while streaming — the damage only appeared once
  the conversation was reopened. Both stream paths (with and without `prune`) now pass the SDK's
  `generateId`.

- Updated dependencies [37c8c14]
- Updated dependencies [6446ae6]
- Updated dependencies [c9bea1c]
  - @lowdefy/errors@6.0.0
  - @lowdefy/helpers@6.0.0

## 5.6.0

### Patch Changes

- 3ead269: feat(helpers): Reject prototype-pollution key names in dot paths and key maps.

  `__proto__`, `constructor`, `prototype`, `__defineGetter__`, `__defineSetter__`,
  `__lookupGetter__` and `__lookupSetter__` are no longer accepted as path segments or as keys
  in maps built from user-supplied values.

  Previously these names were silently _filtered_ on write, which was worse than rejecting
  them: `SetState: { 'a.__proto__.b': 1 }` quietly wrote to `a.b` instead — a different
  location than the one you asked for. Reads could also walk up the prototype chain.

  What you will see now:

  - `:set_state` and the `SetState` action raise a config error naming the offending key and
    pointing at the line in your YAML.
  - Data-reading operators (`_state`, `_get`, `_user`, `_payload`, ...) return their default
    instead of a value.
  - A module entry id, an agent or endpoint id, or a `LOWDEFY_SECRET_*` environment variable
    using one of these names now fails at build or boot with a message naming it, instead of
    silently vanishing.

  Apps that do not use these names are unaffected. If you have a form field, state key, or API
  response property named `constructor`, rename it.

  Deep merges of configuration are hardened the same way, but skip reserved keys rather than
  raising — a reserved name arriving inside a merged _value_ is dropped so a single poisoned
  field can't abort an otherwise valid merge.

  `@lowdefy/helpers` also now exports `isReserved(key)`, so plugin and connection authors can
  test a key against this policy directly instead of catching a `ReservedKeyError`.

- Updated dependencies [3ead269]
- Updated dependencies [79bbd84]
- Updated dependencies [824f4be]
- Updated dependencies [824f4be]
- Updated dependencies [3ead269]
- Updated dependencies [1a6223f]
- Updated dependencies [3ead269]
  - @lowdefy/helpers@5.6.0
  - @lowdefy/errors@5.6.0

## 5.5.1

### Patch Changes

- @lowdefy/errors@5.5.1
- @lowdefy/helpers@5.5.1

## 5.5.0

### Patch Changes

- @lowdefy/errors@5.5.0
- @lowdefy/helpers@5.5.0

## 5.4.0

### Minor Changes

- ff7ed66: feat(agents): persist full conversations, auto-mint conversation ids, and generate titles.

  - **onFinish messages (fix):** the agent `onFinish` hook payload `messages` previously contained only the request input, so a `save-conversation` hook persisted the user's turns but never the assistant reply. `handleAgentChat` now captures the final UI message list (input plus the generated assistant message, including tool parts) from the stream's `onFinish` on both the default and prune paths, falling back to the input only when the stream errors or aborts. This repairs server-side conversation persistence.
  - **generateTitle:** new AISDKAgent `generateTitle` boolean option. When `true`, the first turn generates a short title from the first user message with a one-shot `generateText` call that runs concurrently with the response and emits a `data-chat-title` data part, firing the `AgentChat` block's `onTitleGenerated` event. Off by default; failures are non-fatal.
  - **conversationId minting:** when no `conversationId` property is set, `AgentChat` now mints a stable session id at mount and uses it for every request, so a turn sent before the app assigns an id (e.g. clicking a welcome prompt) no longer posts with an undefined id. The effective id is surfaced once per conversation, on its first user message, via a new `onConversationStart` event. App-supplied `conversationId` values remain authoritative.

- f11addd: feat: Extend i18n coverage to Lowdefy agents.

  Builds on the i18n / locale support from
  `feat-i18n-locale-support.md`. End-user-visible strings in the agent
  runtime and the `AgentChat` block now localize automatically when
  `config.i18n` is configured.

  **Agent runtime errors.** HTTP 4xx/5xx responses from the agent
  endpoint (`Only POST requests are supported.`, `Invalid agent path`,
  `Agent "X" does not exist.`, `Agent type "Y" can not be found.`,
  `Endpoint execution failed`, etc.) translate per request via the
  `Accept-Language` header against `agent.runtime.*` builtin keys.

  **AgentChat block UI.** Framework-rendered strings in the chat UI go
  through `methods.translate` against new `agent.*` builtin keys:

  - `agent.sender.placeholder` — `'Type a message...'`
  - `agent.toolApproval.{approve,reject}` — `'Approve'` / `'Reject'`
  - `agent.message.{copy,feedback,regenerate,delete}` — message actions
  - `agent.toolResult.{completed,completedNoData,empty,emptyList,showMore,showLess}` — tool result captions

  Override per locale via `config.i18n.messages.{locale}` — same
  mechanism as any other built-in message.

  **antd X locale wiring.** The app shell now uses
  `@ant-design/x@2.7.x`'s `XProvider` at the root (drop-in superset of
  antd's `ConfigProvider`) with a merged antd + antd-X locale pack.
  antd X ships only `en_US` and `zh_CN` packs; other locales fall back
  to `en_US` for X-native strings (`'New chat'`, `'Stop loading'`,
  `'Like'`/`'Dislike'`, bubble edit `'OK'`/`'Cancel'`). Apps can
  override these in unsupported locales via the new `agent.antdx.*`
  reference keys.

  **Plugin-author surface.** Agent hook endpoints (`onStart`,
  `onStepStart`, `onToolCallStart`, `onToolCallFinish`, `onStepFinish`,
  `onFinish`) now receive `locale: <activeCode>` in their payload, so
  hook routines can branch on the user's locale.

  **System prompt translation.** `agent.properties.instructions` passes
  through the operator parser at request time — `_t:` works there for
  locale-aware system prompts.

  ```yaml
  agents:
    - id: assistant
      type: AISDKAgent
      connectionId: anthropic
      properties:
        agent:
          model: claude-sonnet-4
          instructions:
            _t: agent.systemPrompt
  ```

  **What stays English** (explicit choices):

  - Built-in tool descriptions used in the model prompt (English-trained
    models perform best with English tool descriptions).
  - Build-time agent validation errors (developer diagnostics).
  - Console warnings (ops diagnostics).
  - The `[File truncated — showing first NKB...]` notice in the
    `read-file` built-in tool (model-facing).
  - Model-streamed natural-language output (owned by the model).

### Patch Changes

- Updated dependencies [25225ab]
- Updated dependencies [f11addd]
- Updated dependencies [0108f38]
- Updated dependencies [302e330]
  - @lowdefy/helpers@5.4.0
  - @lowdefy/errors@5.4.0

## 5.3.0

### Minor Changes

- 6955341: feat: Add AI agent support with multi-provider chat and tool use

  **Agent Runtime (`@lowdefy/ai-utils`)**

  - `handleAgentChat` orchestrates the full agent lifecycle: tool merging, MCP client lifecycle, hook callbacks, and stream composition
  - `ToolLoopAgent` handles multi-turn tool calling, streaming responses, and artifact cleaning
  - `createAgentUIStreamResponse` converts agent output to a streaming HTTP response for the client
  - `buildAgentTools` merges endpoint tools, MCP tools, and sub-agent tools into AI SDK tool objects
  - `buildPrepareStep` enables dynamic tool phasing per step
  - `buildUpdatePageStateTool` provides a built-in tool for the agent to write to page state via the AgentChat block
  - File system agent tools: `listFiles`, `readFile`, `searchFiles`, `statFile`, `resolvePath` for sandboxed access to agent-scoped file directories
  - `pruneMessages` for context compaction
  - `experimental_repairToolCall` integration
  - Sub-agent support — agents can be exposed as tools to other agents
  - Reserved tool name collision detection (e.g. `update-page-state`)
  - Server-side hooks (`instructions`, `onStart`, `onStepStart`, `onToolCallStart`, `onToolCallFinish`, `onStepFinish`, `onFinish`) callable as Lowdefy endpoints
  - Provider-agnostic design using the Vercel AI SDK — supports reasoning/thinking display, `providerOptions` passthrough, and source citation streaming via `sendSources`
  - Strip `data:` URL prefix from file attachments before AI SDK processing

  **AgentChat Block (`@lowdefy/blocks-antd-x`)**

  - New `AgentChat` composite block built on Ant Design X with real-time streaming display
  - Sequential message part rendering with configurable reasoning/thinking display
  - Tool approval UI for endpoint and MCP tools marked `confirm: true`
  - File attachment support (configurable accept types and max size) with S3 upload integration
  - Drawer display mode with a `FloatButton` trigger for embedding chat on any page
  - Source citation rendering for `source-url` and `source-document` parts
  - Mermaid diagrams, LaTeX, and syntax-highlighted code blocks (with copy + language label) — toggled via `renderMermaid` and `codeHighlighter`
  - Copy, feedback, regenerate, and delete message actions
  - Suggestions and `Sender.Header` / `Sender.Switch` UI affordances
  - Configurable roles, avatars, and names per message role
  - Event bridging for agent lifecycle events (`onSuccess`, `onError`, `onFinish`, `onFeedback`)
  - `sharedState` two-way binding lets the agent read and write page state via the `update-page-state` tool

  **`AgentConversations` Block (`@lowdefy/blocks-antd-x`)**

  - New standalone conversations sidebar block, extracted from AgentChat for independent placement

  **Connection Plugins**

  - `@lowdefy/connection-anthropic`: Anthropic connection with `AnthropicAgent` resolver supporting Claude models
  - `@lowdefy/connection-openai`: OpenAI connection with `OpenAIAgent` resolver supporting GPT models
  - `@lowdefy/connection-google`: Google AI connection with `GeminiAgent` resolver, including `thinkingConfig` and `safetySettings` sugar props
  - `@lowdefy/connection-ai-gateway`: Vercel AI Gateway connection with `AIGatewayAgent` resolver for routing to multiple providers through a single endpoint

  **MCP Integration (`@lowdefy/connection-mcp`, `@lowdefy/ai-utils`, `@lowdefy/build`)**

  - New `Mcp` connection type for HTTP, SSE, and stdio transport config
  - Agents can reference MCP connections via `connectionId` or inline config with build-time validation
  - Runtime MCP client creation with automatic tool discovery, merging, and cleanup
  - Tool approval support via `confirm: true` on both endpoint tools and MCP sources

  **Build Pipeline (`@lowdefy/build`)**

  - `buildAgents` validates agent config (model, tools, sub-agents, MCP) and normalizes tool definitions
  - `writeAgents` writes agent artifacts for server consumption
  - Sub-agent circular reference detection
  - Tool object format with `confirm` support
  - MCP `connectionId` normalization (inline config vs reference)
  - Lazy module variable resolution for agent properties referenced from modules
  - Agent schema validation integrated into the build pipeline
  - `copyAgentFileSystems` emits an `agentFileSystems.json` manifest so the production server can include each agent's `fileSystem.basePath` directory in Next.js file tracing — agents that read files now work on Vercel and standalone (`output: 'standalone'`) deployments without manual `next.config.js` configuration

  **API (`@lowdefy/api`)**

  - Agent route handler (`callAgent`) for streaming agent responses
  - Endpoint tool execution context with operator evaluation
  - Sub-agent resolver methods for agents-as-tools
  - MCP `connectionId` resolution at request time
  - `getAgentConfig` and `getAgentResolver` helpers for runtime agent resolution

  **Servers (`@lowdefy/server`, `@lowdefy/server-dev`)**

  - Agent API route (`/api/agent/[...path]`) added to both production and development servers
  - `urlQuery` validation
  - 10 MB request body limit for file attachments
  - Server-side hooks for agent lifecycle callbacks (`instructions`, `onFinish`)

### Patch Changes

- @lowdefy/errors@5.3.0
- @lowdefy/helpers@5.3.0
