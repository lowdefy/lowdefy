# @lowdefy/blocks-antd-x

## 5.6.0

### Minor Changes

- 3d59f5f: feat: AgentChat keeps a message's thumbs rating selected

  The feedback control was write-only: it reported a rating and immediately forgot it, so the thumb un-highlighted on the next render and a rated message looked unrated. On a streaming chat that is the very next chunk.

  `Actions.Feedback` is now given a `value`, held per message id for the life of the chat. Being controlled, it takes on that component's selected behaviour: the chosen thumb stays highlighted and the opposite one is hidden, and clicking the selected thumb again clears the rating and brings both back. A rating can therefore be changed, but not submitted twice by accident.

  Note for apps already handling `onFeedback`: clearing a rating fires it with `rating: 'default'`. That value was unreachable before, because the control was never given one — so a handler that treats anything other than `like` as a dislike will now record a rejection for a rating the user has just withdrawn. Branch on the three values explicitly.

  The block still persists nothing itself — storing a rating belongs to whatever stores the conversation — but it can now be told what was stored. The new `feedbackValues` property takes a map of message id to `like` or `dislike`, so a restored conversation comes back with its ratings showing instead of looking untouched. Without it, a reload or a conversation switch shows every message unrated even where the app recorded the rating, which reads as a lost write rather than a display gap.

  A rating clicked during the visit takes precedence over the supplied one, so the thumb still responds immediately, and a rating the user has just withdrawn is not re-lit by a value fetched before the withdrawal. Ratings clicked in a conversation are dropped when `conversationId` changes: they are keyed by message id, and the incoming conversation supplies its own.

- 3d59f5f: feat: AgentChat reports link clicks and routes in-app links client-side

  Links in an agent's answer were rendered as plain anchors, so following a citation was a full browser navigation: the conversation was left behind, and an app had no way to do anything else with the click.

  Markdown links now render through the app's `Link` component when the href is an in-app path, making them client-side routes rather than reloads. Links with a scheme open in a new tab, so the conversation stays on screen.

  A new `onLinkClick` event reports the click with `href` and `text`. Wiring it suppresses the default navigation for plain left clicks, so an app can show the target in place — a guide in a modal, a record in a drawer — instead of navigating. Apps that do not wire it are unaffected. Modified and non-primary clicks (new tab, middle click) are never intercepted.

### Patch Changes

- 5b590c7: feat(blocks-antd-x): AgentChat attachments accept clipboard paste and drag-and-drop.

  With `sender.attachments.enabled`, files could only be attached through the paperclip's
  native picker — a pasted screenshot or a file dragged onto the composer went nowhere.
  The composer now takes files from all three routes through one intake: the `accept` list
  and `maxSize` cap apply to each, and pasted clipboard images (which every browser names
  `image.png`) get a unique `pasted-<timestamp>` name so two pastes don't collide in the
  attached list. A dashed outline marks the composer while a file drag is over it.

- 7d97d03: fix: AgentChat sends under the current conversationId after a conversation switch

  `useChat` was called without an `id`, so the AI SDK created its Chat instance once per mount and captured that transport — the transport rebuilt when the `conversationId` property changed was silently ignored. Every send in a page session therefore posted under the mount-time conversationId: selecting a saved conversation and continuing it persisted the whole restored transcript under the stale id, creating a duplicate conversation document (without the original's data parts).

  `useChat` is now keyed by `id: effectiveConversationId`, so changing the conversation swaps the Chat instance and adopts the rebuilt transport. The existing clear-on-id-change and external-message-sync behaviour is unchanged.

- Updated dependencies [3ead269]
- Updated dependencies [79bbd84]
- Updated dependencies [824f4be]
- Updated dependencies [824f4be]
- Updated dependencies [3ead269]
- Updated dependencies [1a6223f]
- Updated dependencies [3ead269]
  - @lowdefy/helpers@5.6.0
  - @lowdefy/block-utils@5.6.0

## 5.5.1

### Patch Changes

- @lowdefy/block-utils@5.5.1
- @lowdefy/helpers@5.5.1

## 5.5.0

### Patch Changes

- b368e15: fix: AgentChat no longer replays events for restored conversation history

  Loading a saved conversation into `AgentChat` (via `properties.messages` or the `setMessages` method) fired `onToolCall`, `onToolResult`, `onUserMessage`, and `onTitleGenerated` for every historical message — re-running side effects like state updates or requests that had already happened. Restored history is now recognized and those events are suppressed; only genuinely new activity triggers them.

  Also, `onToolCall` now waits for the tool input to finish streaming before firing, so the event never carries a truncated input object.

  - @lowdefy/block-utils@5.5.0
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
  - @lowdefy/helpers@5.4.0
  - @lowdefy/block-utils@5.4.0

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

- @lowdefy/block-utils@5.3.0
- @lowdefy/helpers@5.3.0
