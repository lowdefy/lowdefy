---
title: '@lowdefy/blocks-antd-x'
updated: 2026-04-14
package: '@lowdefy/blocks-antd-x'
---

# @lowdefy/blocks-antd-x

AI-focused blocks built on Ant Design X components.

## Purpose

Provides `AgentChat` (a production-grade chat UI) and `AgentConversations` (a standalone conversation list sidebar) for Lowdefy's agent system.

## Blocks

### AgentChat

**Category:** display

Composite chat block that integrates the AI SDK's `useChat` hook with Ant Design X's Bubble, Sender, and ThoughtChain components.

**Key Properties:**

- `agentId` — Required. Which agent to call.
- `conversationId` — Conversation identifier for multi-turn persistence
- `messages` — Load existing messages (external state)
- `urlQuery` — Query params passed to agent API
- `welcome` — Welcome screen: `title`, `description`, `prompts[]`
- `messageDisplay` — Rendering: `showThoughtChain`, `reasoningDisplay`, `toolResultDisplay`
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
- `menu` — Context menu actions per conversation
- `creation` — "New Chat" button config
- `groupable` — Enable collapsible groups
- `width` — Panel width

**Events:** `onSelect`, `onNew`, `onMenuClick`

## Architecture

### Transport

`createLowdefyChatTransport()` creates a `DefaultChatTransport` (from AI SDK) that POSTs to `/api/agent/{pageId}/{agentId}?conversationId=...`. A new transport is created when `conversationId` changes.

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
