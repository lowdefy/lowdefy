---
'@lowdefy/blocks-antd-x': patch
---

fix: AgentChat sends under the current conversationId after a conversation switch

`useChat` was called without an `id`, so the AI SDK created its Chat instance once per mount and captured that transport — the transport rebuilt when the `conversationId` property changed was silently ignored. Every send in a page session therefore posted under the mount-time conversationId: selecting a saved conversation and continuing it persisted the whole restored transcript under the stale id, creating a duplicate conversation document (without the original's data parts).

`useChat` is now keyed by `id: effectiveConversationId`, so changing the conversation swaps the Chat instance and adopts the rebuilt transport. The existing clear-on-id-change and external-message-sync behaviour is unchanged.
