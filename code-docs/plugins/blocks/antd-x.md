---
title: '@lowdefy/blocks-antd-x'
updated: 2026-10-13
package: '@lowdefy/blocks-antd-x'
---

# @lowdefy/blocks-antd-x

AI-focused blocks built on Ant Design X components.

## Purpose

Provides `AgentChat` (a production-grade chat UI) and `AgentConversations` (a standalone conversation list sidebar) for Lowdefy's agent system, and `IntentInput` (a text input that becomes what the user means).

## Blocks

### AgentChat

**Category:** display

Composite chat block that integrates the AI SDK's `useChat` hook with Ant Design X's Bubble, Sender, and ThoughtChain components.

**Key Properties:**

- `agentId` — Required. Which agent to call.
- `conversationId` — Conversation identifier for multi-turn persistence
- `messages` — Load existing messages (external state)
- `urlQuery` — Query params passed to agent API
- `sharedState` — Object slice of page state the agent may read and write back via the built-in `update-page-state` tool. See [Shared State](#shared-state) below.
- `welcome` — Welcome screen: `title`, `description`, `prompts[]`
- `messageDisplay` — Rendering: `showThoughtChain`, `reasoningDisplay`, `toolResultDisplay`, `thinkingMessages`, `thinkingMessageDelay`, `thinkingMessageRotationInterval`
- `sender` — Input area: `placeholder`, `submitType`, `allowSpeech`, `attachments`, `header`, `switches[]`, `suggestions[]`
- `display` — `"drawer"` or default inline
- `roles` — Per-role config: `variant`, `shape`, `avatar`, `name`
- `renderMermaid` — Enable mermaid diagram rendering
- `codeHighlighter` — Enable syntax highlighting

**Events (15+):**

- `onBeforeSend` — Blocking. Validation, file uploads, rate limiting. `success: false` cancels.
- `onMessageComplete` — Assistant message finished. Payload includes `finishReason`, `parts`, `messages`.
- `onToolCall` / `onToolResult` — Tool lifecycle
- `onError` — Connection/execution errors
- `onFeedback` — User rating (copy, like, dislike)
- `onUserMessage`, `onStop`, `onRegenerate`, `onEditMessage`, `onDeleteMessage`
- `onSuggestionClick`, `onSwitchChange`, `onTitleGenerated`, `onDataPart`

**Methods (via CallMethod):**

- `regenerate`, `setMessages`, `sendMessage`, `clearMessages`, `deleteMessage`, `stop`, `clearError`, `scrollToBottom`

### AgentConversations

**Category:** display

Standalone conversation list sidebar, decoupled from AgentChat.

**Properties:**

- `items` — Conversation list (from state/requests)
- `activeKey` — Currently selected conversation
- `loadingKey` / `items[].loading` — Row(s) showing a spinner in the icon slot (antd-x Conversations has no loading state, so the block swaps the item's `icon` and adds `aria-busy`/`data-loading`)
- `menu` — Context menu actions per conversation
- `creation` — "New Chat" button config
- `groupable` — Enable collapsible groups
- `width` — Panel width

**Events:** `onSelect`, `onNew`, `onMenuClick`

### IntentInput

**Category:** input-container (value `{ text, intent, mode }`, one slot per intent)

A text box that grows to show the slot for the intent the text means. Like `AgentChat`, it holds no AI config: it fires `onClassify` (debounced) and takes the answer back through `answer`, in the shape of a `Decide` choice answer, so any classifier fits (a `Decide` request, a keyword `_js`).

- `answerScores` turns the answer into a score per intent. Options that are not intents drop out (a `none` escape option), and the provider's calibrated `confidence` is the chosen intent's score, with the other intents scaled to keep their ratio to it (mixed scales could rank a rival above the model's choice).
- `nextIntentState` is the anti-flicker state machine. The shown intent changes only when a challenger leads two answers in a row or reaches `confidence.switch`; the block re-runs a round with unchanged scores after a pause, so a challenger that keeps the lead while the user stops typing also wins. A round runs each time the latest `onClassify` finishes (the `triggerEvent` promise resolves), not when the scores change, so a repeated answer still counts and a superseded one does not; typing restarts the pause timer. It also derives the mode: `idle`, `preview` (slot faded), `choose` (the two leading intents are within 0.15 and neither is committed) or `committed` (slot solid).
- The last non-null answer is held in a ref, so a request that goes null while loading does not reset the shown slot.
- A choice the user picks is pinned until the scores commit to a different intent on their own.
- The height morph is a `ResizeObserver` on the inner content driving a CSS height transition; slots enter with a keyframe. Exit animations are not implemented.

## Architecture

### Transport

`createLowdefyChatTransport()` creates a `DefaultChatTransport` (from AI SDK) that POSTs to `/api/agent/{pageId}/{agentId}?conversationId=...` with `{ messages, urlQuery, sharedState }` in the body. `sharedState` is read from a ref at send time so the freshest evaluated value is sent without re-creating the transport. A new transport is created when `pageId`, `agentId`, `conversationId`, or `urlQuery` changes.

### Shared State

When `properties.sharedState` is a non-empty object, two things happen:

1. The transport sends the object on every turn and the server injects it into the agent's `<context>` block and builds an `update-page-state` tool describing its top-level keys. With `properties.sharedStateReadOnly: true` the transport also sends `sharedStateReadOnly: true` and the server builds no tool.
2. The block registers an internal `__updatePageState` event wired to `SetState` with `params: { _event: true }` at mount:

   ```js
   methods.registerEvent({
     name: '__updatePageState',
     actions: [{ id: 'setState', type: 'SetState', params: { _event: true } }],
   });
   ```

When the model calls `update-page-state`, the block's `onToolCall` handler:

- Filters `updates` against the keys in `sharedStateRef.current` -- unknown keys are collected into `ignored` and dropped (defence against hallucinated writes).
- Fires `methods.triggerEvent({ name: '__updatePageState', event: writable })` to run the `SetState` action with the filtered updates.
- Returns `addToolOutput({ output: { ok: true, written, ignored } })` so the model sees what took effect.

See `code-docs/architecture/agent-system.md#shared-state` for the full end-to-end flow.

### Thinking Indicator

The loading assistant bubble shows typing dots by default. Three `messageDisplay` props let you layer a rotating label on top:

- `thinkingMessages` -- string, or array of strings to rotate through. Leave unset for dots only.
- `thinkingMessageDelay` -- ms of continuous loading before the first label shows (default 3000, clamped to 500 ms min so near-instant responses don't flash a label).
- `thinkingMessageRotationInterval` -- ms between rotations when `thinkingMessages` is an array of 2+ (default 8000).

The indicator stays visible on hidden-tool turns (tool calls that don't surface in the ThoughtChain) so the user still sees activity.

### State Management

The `useChat` hook from `@ai-sdk/react` manages messages, status, and streaming. External messages (from props) sync when count or last ID changes, preventing infinite re-render loops. Messages clear when `conversationId` changes.

### Event Bridging

`useAgentEvents` converts AI SDK message updates to Lowdefy block events by tracking seen message/tool IDs. This prevents duplicate event firing during re-renders.

## Dependencies

- `@ant-design/x` — Bubble, Sender, ThoughtChain, Conversations
- `@ai-sdk/react` — `useChat`, `DefaultChatTransport`
- `react-markdown`, `remark-gfm`, `remark-math`, `rehype-katex` — Markdown/LaTeX
- `mermaid` — Diagram rendering (lazy-loaded)
- `react-syntax-highlighter` — Code highlighting (lazy-loaded)

## Design Decisions

- **Transport factory pattern**: New transport per conversation change resets chat state cleanly.
- **Event deduplication**: Tracks seen IDs to prevent duplicates during re-renders.
- **Lazy-loaded rendering**: Mermaid and syntax highlighter dynamically imported to minimize bundle.
- **Conversation separation**: AgentConversations is standalone so developers can place it independently or omit it entirely.

## Key Files

| File                                                  | Purpose                       |
| ----------------------------------------------------- | ----------------------------- |
| `src/blocks/AgentChat/AgentChat.js`                   | Main component                |
| `src/blocks/AgentChat/LowdefyChatTransport.js`        | Transport factory             |
| `src/blocks/AgentChat/useAgentEvents.js`              | Event bridging                |
| `src/blocks/AgentChat/MessageBubble.js`               | Message rendering             |
| `src/blocks/AgentChat/MessageList.js`                 | Message list with auto-scroll |
| `src/blocks/AgentChat/ToolApproval.js`                | Tool confirmation UI          |
| `src/blocks/AgentChat/WelcomeScreen.js`               | Welcome screen                |
| `src/blocks/AgentChat/DrawerWrapper.js`               | Drawer mode wrapper           |
| `src/blocks/AgentConversations/AgentConversations.js` | Conversation list             |
| `src/blocks/IntentInput/IntentInput.js`               | Intent input component        |
| `src/blocks/IntentInput/nextIntentState.js`           | Anti-flicker state machine    |
| `src/blocks/IntentInput/answerScores.js`              | Decide answer to scores       |
