# Lowdefy Agents Evaluation: AI SDK & Ant Design X

Evaluation of current Lowdefy agent implementation against Vercel AI SDK v6 and Ant Design X v2.4 documentation.

**Date:** 2026-04-09
**AI SDK version:** `ai@6.0.116`, `@ai-sdk/react@3.0.118`
**Ant Design X version:** `@ant-design/x@2.4.0`, `@ant-design/x-markdown@2.4.0`

---

## Overall Assessment

The implementation is architecturally sound and uses current, non-deprecated APIs from both libraries. The code is well-organized with clear separation between server-side agent handling (`ai-utils`), the React UI layer (`blocks-antd-x`), and provider-specific wrappers (`connection-anthropic`). The hook system and event architecture are solid.

The main gaps are unused Ant Design X components that would improve UX, missing `abortSignal` passthrough (a correctness fix), and AI SDK features (`prepareStep`, structured output) that would enable more sophisticated agent workflows.

---

## AI SDK Usage

### What's Done Well

| Area                                                  | Status  | Notes                                                                                                                                                                                    |
| ----------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ToolLoopAgent`                                       | Correct | Proper use of the agent abstraction with all supported params                                                                                                                            |
| `createUIMessageStream` + `createAgentUIStream`       | Correct | The more-control pattern (vs `createAgentUIStreamResponse`) is appropriate since post-stream hook writes are needed                                                                      |
| `createUIMessageStreamResponse`                       | Correct | Returns proper Web Response                                                                                                                                                              |
| `stepCountIs` / `hasToolCall`                         | Correct | Stop conditions properly composed                                                                                                                                                        |
| `tool()` with `inputSchema` + `jsonSchema()`          | Correct | Not using deprecated `parameters`                                                                                                                                                        |
| `useChat` with custom transport                       | Correct | Using `DefaultChatTransport` (not deprecated `api` option)                                                                                                                               |
| `sendMessage` (not `handleSubmit`)                    | Correct | Using current API                                                                                                                                                                        |
| `addToolApprovalResponse`                             | Correct | Proper approval flow                                                                                                                                                                     |
| `lastAssistantMessageIsCompleteWithApprovalResponses` | Correct | Auto-send after approvals                                                                                                                                                                |
| `toModelOutput` on sub-agent tools                    | Correct | Controls what parent model sees vs UI                                                                                                                                                    |
| `status` states (`streaming`/`submitted`/`idle`)      | Correct | Proper status handling                                                                                                                                                                   |
| `experimental_throttle: 50`                           | Correct | Prevents excessive re-renders                                                                                                                                                            |
| Sub-agents use `generate()` not `stream()`            | Correct | Per AI SDK docs: "Streaming adds complexity. The basic pattern (no streaming) is simpler to implement and debug. Only add streaming when you need to show real-time progress in the UI." |

### Issues & Improvements

#### 1. Missing `abortSignal` passthrough in endpoint tool execution

**File:** `packages/utils/ai-utils/src/buildAgentTools.js:52-53`
**Severity:** Correctness fix

The endpoint tool `execute` function doesn't receive or pass `abortSignal`. When a user stops generation, endpoint tool calls continue running server-side.

```javascript
// Current
execute: async (input) => {
  const result = await context.callEndpoint(endpointId, { payload: input });

// Should be
execute: async (input, { abortSignal }) => {
  const result = await context.callEndpoint(endpointId, { payload: input, abortSignal });
```

#### 2. No `prepareStep` usage — could enable dynamic tool phasing

The AI SDK's `prepareStep` callback enables per-step configuration changes (switching models, phasing tools, trimming context). This could be exposed in YAML config for multi-phase agent workflows:

```yaml
agents:
  - id: research_bot
    properties:
      prepareStep:
        # Phase 1: search only
        - steps: [1, 2]
          activeTools: [search]
          toolChoice: required
        # Phase 2: summarize
        - steps: [3]
          activeTools: [summarize]
```

**Use cases:**

- Force tool use in early steps, allow free text in later steps
- Switch to a cheaper/faster model for simple follow-up steps
- Trim message context when conversations get long

#### 3. No structured output support

The AI SDK replaced `generateObject` with `generateText` + `Output.object()`. Lowdefy agents currently only produce free-form text. Adding `output` config could enable agents that return structured data:

```yaml
agents:
  - id: classifier
    properties:
      output:
        type: object
        schema:
          type: object
          properties:
            category: { type: string }
            confidence: { type: number }
```

Result would be available on `result.output` in hooks and events.

#### 4. No `experimental_repairToolCall` usage

When the model generates invalid tool input, this callback lets you fix it rather than failing. Useful for production robustness — the model occasionally produces JSON that doesn't match the schema, and this gives a chance to repair before erroring.

#### 5. `onFinish` hook receives stale messages

**File:** `packages/utils/ai-utils/src/handleAgentChat.js:154`

**Architectural limitation:** The onFinish hook payload sends the original `messages` (pre-agent-run), not the updated messages including the agent's response. The stream-level `onFinish` in `createUIMessageStream` resolves after the agent stream completes, but accumulated UIMessages are managed by `useChat` on the client side — the server doesn't have access to the final message list.

**Recommended workaround:** Use the client-side `onMessageComplete` event for post-completion actions that need the full conversation (e.g., saving messages to a database). The `onMessageComplete` event provides the complete message list including the agent's response.

---

## Ant Design X Usage

### What's Done Well

| Component                    | Status  | Notes                                                                                |
| ---------------------------- | ------- | ------------------------------------------------------------------------------------ |
| `Bubble.List`                | Correct | Role-based rendering with `ai`/`user` roles, autoScroll, proper `loading` state      |
| `Sender`                     | Correct | With `Sender.Switch`, speech support, file attachments                               |
| `ThoughtChain`               | Correct | Tool calls with status (`loading`/`success`/`error`), collapsible, `blink` animation |
| `Think`                      | Correct | For reasoning/thinking display with `defaultExpanded: false`                         |
| `Markdown` (x-markdown)      | Correct | Streaming-aware with `{ hasNextChunk: true }`                                        |
| `CodeHighlighter`            | Correct | Syntax highlighting in code blocks                                                   |
| `Mermaid`                    | Correct | Diagram rendering in code blocks                                                     |
| `FileCard` / `FileCard.List` | Correct | File attachments with type detection                                                 |
| `Sources`                    | Correct | Citation display with inline/expanded options                                        |
| `Actions` / `Actions.Copy`   | Correct | Message actions (copy, feedback, regenerate, delete)                                 |
| `Welcome`                    | Correct | Welcome screen with prompts                                                          |
| `Prompts`                    | Correct | Quick-start suggestions and follow-up suggestions                                    |
| `Conversations`              | Correct | Sidebar with menu, creation button                                                   |

### Issues & Improvements

#### 1. Not using `Bubble` streaming prop

**File:** `packages/plugins/blocks/blocks-antd-x/src/blocks/AgentChat/MessageList.js`

The `Bubble.List` role config doesn't set `streaming: true` on the role for the active streaming message. The `Markdown` component inside `MessageBubble` handles its own streaming, but the `Bubble` component's `streaming` prop prevents premature `onTypingComplete` events and enables proper typing animation behavior. Currently typing animation isn't used at all.

```javascript
// Could add to ai role config:
ai: {
  placement: 'start',
  // ...existing config
  typing: isStreaming ? { effect: 'fade-in', step: 6, interval: 50 } : false,
  streaming: isStreaming,
}
```

#### 2. Not using `Bubble.editable` for message editing

**File:** `packages/plugins/blocks/blocks-antd-x/src/blocks/AgentChat/MessageList.js:107-108`

There's a TODO about message editing. Ant Design X v2 added an `editable` prop to Bubble which handles edit state per-bubble. The `handleEditMessage` function in `AgentChat.js` is ready but the UI doesn't trigger it. This is a known gap.

The `editable` prop supports `onEditConfirm` and `onEditCancel` callbacks.

#### 3. Not using `Suggestion` component for autocomplete

Follow-up suggestions are rendered using `Prompts` (static display below messages). The `Suggestion` component provides autocomplete dropdown behavior integrated with the Sender input:

```javascript
<Suggestion items={activeSuggestions} onSelect={(value) => sendMessage({ text: value })}>
  {({ onTrigger, onKeyDown }) => (
    <Sender
      ref={senderRef}
      onKeyDown={onKeyDown}
      onFocus={() => onTrigger()}
      // ...existing props
    />
  )}
</Suggestion>
```

This would give a more dynamic interaction compared to static suggestion chips.

#### 4. Not using `Actions.Feedback` sub-component

**File:** `packages/plugins/blocks/blocks-antd-x/src/blocks/AgentChat/MessageBubble.js:155-165`

The feedback actions use manual `LikeOutlined`/`DislikeOutlined` icons with custom `onItemClick` handlers. `Actions.Feedback` is a dedicated sub-component with:

- Built-in toggle state (`like`/`dislike`/`default`)
- `value` / `onChange` props
- Visual highlight of active selection

Currently feedback state isn't visually preserved — clicking "like" fires an event but the button doesn't stay highlighted.

#### 5. Not using `Actions.Audio` for text-to-speech

`Actions.Audio` provides built-in audio playback with `loading`/`error`/`running`/`default` states. Could be added to bubble actions for TTS of agent responses.

#### 6. Not using `Conversations.groupable`

**File:** `packages/plugins/blocks/blocks-antd-x/src/blocks/AgentChat/ConversationSidebar.js`

The sidebar uses flat conversation lists. Ant Design X supports `groupable` for organizing conversations by date/category with collapsible groups:

```javascript
<Conversations
  items={items}
  groupable={{
    label: (group) => group,
    collapsible: true,
  }}
/>
```

Conversations with a `group` field would be automatically grouped.

#### 7. Not using `Attachments` component for file upload

**File:** `packages/plugins/blocks/blocks-antd-x/src/blocks/AgentChat/AgentChat.js:473-489`

File upload uses a raw `<input type="file">` and manual `FileCard.List`. The `Attachments` component provides:

- Drag-and-drop zones with visual placeholders
- Upload progress indicators
- `maxCount` limits (v2.0.0+)
- Proper placeholder UI for both inline and drop states
- Extends antd Upload — automatic integration with file list management
- `getDropContainer` for custom drop zones
- `overflow` modes (`wrap`, `scrollX`, `scrollY`)

#### 8. Not using `Sender.Header` for expandable input panels

`Sender.Header` provides a collapsible panel above the input. Useful for:

- Showing system context or instructions
- Settings panels (model selection, temperature)
- Preview panels for attached files
- Additional input modes

Props: `children`, `title`, `open`, `closable`, `forceRender`, `onOpenChange`

#### 9. Not using `Sender.slotConfig` for structured input

Slot-based structured input allows combining text + dropdown + tag inputs in the sender:

```javascript
slotConfig={[
  { type: 'text', key: 'query' },
  { type: 'select', key: 'model', options: [...] },
  { type: 'tag', key: 'tools', options: [...] },
]}
```

Could be useful for agent tool selection or parameter input.

#### 10. ConversationSidebar hardcoded width

**File:** `packages/plugins/blocks/blocks-antd-x/src/blocks/AgentChat/ConversationSidebar.js:48`

The sidebar uses a hardcoded `width: 250` inline style. Should be configurable via YAML properties.

#### 11. Not using `XProvider` for unified theming

`XProvider` extends Ant Design's `ConfigProvider` for centralized design token configuration across all `@ant-design/x` components. Each component has its own token map (Bubble, Conversations, Prompts, Sender, ThoughtChain, etc.).

#### 12. Not using `notification` for browser-level alerts

The `notification` API wraps the Web Notifications API with `permission`, `requestPermission()`, `open(config)`. Also provides `useNotification()` hook. Could notify users when long-running agent tasks complete in background tabs.

---

## Prioritized Feature Additions

### High Value

| Feature                               | Library      | Effort | Impact                        | Notes                                      |
| ------------------------------------- | ------------ | ------ | ----------------------------- | ------------------------------------------ |
| `abortSignal` in tool execution       | AI SDK       | Low    | Correctness                   | Endpoint tools should respect cancellation |
| `Bubble.editable` for message editing | Ant Design X | Low    | Complete existing edit flow   | TODO already in code                       |
| `Actions.Feedback` with toggle state  | Ant Design X | Low    | Visual feedback preservation  | Drop-in replacement                        |
| `Attachments` component (drag-drop)   | Ant Design X | Medium | Much better file upload UX    | Replace raw input + FileCard.List          |
| Typing animations on messages         | Ant Design X | Low    | Polished streaming appearance | `Bubble.streaming` + `typing` props        |
| `prepareStep` for tool phasing        | AI SDK       | Medium | Multi-phase agent workflows   | New YAML config surface                    |

### Medium Value

| Feature                               | Library      | Effort | Impact                               | Notes                               |
| ------------------------------------- | ------------ | ------ | ------------------------------------ | ----------------------------------- |
| Structured output (`Output.object()`) | AI SDK       | Medium | Agents that return structured data   | New `output` config property        |
| `Suggestion` autocomplete             | Ant Design X | Medium | Type-ahead suggestions in input      | Wraps existing Sender               |
| `Conversations.groupable`             | Ant Design X | Low    | Organized conversation sidebar       | Add groupable config                |
| `experimental_repairToolCall`         | AI SDK       | Low    | Better error recovery                | Repair invalid tool inputs          |
| `Sender.Header` context panel         | Ant Design X | Low    | Additional input context             | Collapsible panel above input       |
| `notification` for background alerts  | Ant Design X | Low    | Browser notifications for long tasks | useNotification hook                |
| Configurable sidebar width            | Ant Design X | Low    | Customization                        | Replace hardcoded 250px             |
| `onFinish` hook with final messages   | AI SDK       | Medium | Accurate post-completion hooks       | Needs stream-level message tracking |

### Lower Priority / Exploratory

| Feature                                   | Library      | Effort | Notes                                  |
| ----------------------------------------- | ------------ | ------ | -------------------------------------- |
| `Folder` component for file browsing      | Ant Design X | Medium | File tree in agent responses           |
| `DirectChatTransport` for SSR/testing     | AI SDK       | Low    | Skip HTTP for server-side rendering    |
| `XProvider` for unified theming           | Ant Design X | Low    | Centralized design token configuration |
| `Sender.slotConfig` structured input      | Ant Design X | Medium | Advanced input patterns                |
| DevTools integration (`@ai-sdk/devtools`) | AI SDK       | Low    | Development debugging only             |
| `Actions.Audio` for TTS                   | Ant Design X | Medium | Text-to-speech on messages             |

---

## Ant Design X Components — Full Inventory

Components available in `@ant-design/x@2.4.0` and their usage status in Lowdefy:

| Component                          | Purpose                      | Used | Notes                                         |
| ---------------------------------- | ---------------------------- | ---- | --------------------------------------------- |
| `Bubble` / `Bubble.List`           | Chat message display         | Yes  | Missing `streaming`/`typing`/`editable` props |
| `Bubble.System`                    | System messages              | No   | Could display system notices                  |
| `Bubble.Divider`                   | Message separators           | No   | Step separators use custom divider logic      |
| `Sender`                           | Message input                | Yes  | Missing `Sender.Header`, `slotConfig`         |
| `Sender.Switch`                    | Toggle switches in sender    | Yes  |                                               |
| `Sender.Header`                    | Expandable panel above input | No   |                                               |
| `ThoughtChain`                     | Agent debugging/tracing      | Yes  |                                               |
| `Think`                            | Deep thinking display        | Yes  |                                               |
| `Conversations`                    | Conversation list sidebar    | Yes  | Missing `groupable`                           |
| `Prompts`                          | Prompt suggestions           | Yes  |                                               |
| `Suggestion`                       | Input autocomplete           | No   |                                               |
| `Attachments`                      | File upload with drag-drop   | No   | Using raw input instead                       |
| `Welcome`                          | Welcome/onboarding screen    | Yes  |                                               |
| `Actions`                          | Action buttons               | Yes  | Missing `Actions.Feedback`, `Actions.Audio`   |
| `Actions.Copy`                     | Copy to clipboard            | Yes  |                                               |
| `Actions.Feedback`                 | Like/dislike with state      | No   | Using manual icons                            |
| `Actions.Audio`                    | Audio playback               | No   |                                               |
| `FileCard` / `FileCard.List`       | File display                 | Yes  |                                               |
| `Sources`                          | Citation display             | Yes  |                                               |
| `CodeHighlighter`                  | Syntax highlighting          | Yes  |                                               |
| `Mermaid`                          | Diagram rendering            | Yes  |                                               |
| `Folder`                           | File tree browser            | No   |                                               |
| `XProvider`                        | Global configuration         | No   |                                               |
| `notification` / `useNotification` | Browser notifications        | No   |                                               |

---

## AI SDK Features — Full Inventory

Features available in `ai@6.0.116` and their usage status in Lowdefy:

| Feature                                               | Used | Notes                                |
| ----------------------------------------------------- | ---- | ------------------------------------ |
| `ToolLoopAgent`                                       | Yes  |                                      |
| `createAgentUIStream`                                 | Yes  |                                      |
| `createUIMessageStream`                               | Yes  |                                      |
| `createUIMessageStreamResponse`                       | Yes  |                                      |
| `stepCountIs`                                         | Yes  |                                      |
| `hasToolCall`                                         | Yes  |                                      |
| `tool()`                                              | Yes  |                                      |
| `jsonSchema()`                                        | Yes  |                                      |
| `DefaultChatTransport`                                | Yes  | Extended as `LowdefyChatTransport`   |
| `useChat`                                             | Yes  |                                      |
| `sendMessage`                                         | Yes  |                                      |
| `addToolApprovalResponse`                             | Yes  |                                      |
| `lastAssistantMessageIsCompleteWithApprovalResponses` | Yes  |                                      |
| `toModelOutput`                                       | Yes  | On sub-agent tools                   |
| `createMCPClient`                                     | Yes  |                                      |
| `prepareStep`                                         | No   | Dynamic per-step configuration       |
| `Output.object()` / `Output.array()`                  | No   | Structured output                    |
| `experimental_repairToolCall`                         | No   | Invalid tool call recovery           |
| `DirectChatTransport`                                 | No   | Skip HTTP for SSR/testing            |
| `TextStreamChatTransport`                             | No   | Plain text streams                   |
| `readUIMessageStream`                                 | No   | Reading sub-agent streams            |
| `isToolUIPart`                                        | No   | Generic tool part detection          |
| `InferAgentUIMessage`                                 | No   | TypeScript only — type-safe messages |
| Generator `execute` (preliminary results)             | No   | Tool progress updates                |
| `needsApproval` as async function                     | No   | Dynamic approval based on input      |
| `inputExamples` on tools                              | No   | Anthropic-only — improve tool use    |
| `experimental_context`                                | No   | Arbitrary context passed to tools    |
| `@ai-sdk/devtools`                                    | No   | Development debugging                |
