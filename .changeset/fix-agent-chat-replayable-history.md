---
'@lowdefy/blocks-antd-x': patch
---

fix(blocks-antd-x): AgentChat drops an unanswered tool call before it can poison the conversation.

A reply cut off mid-stream, by a closed tab, a dropped connection or a serverless duration limit, leaves its tool call at `input-available` with no result. UIMessage validation rejects the whole history for one such part, so every later send failed before it reached the model, a history persisted in that state failed on every load, and nothing said so. The block now filters those parts, and any message left with nothing but a step marker, wherever messages enter its list: the `messages` property, the `setMessages` method, and immediately before every send or regenerate. Approval states are kept, since a pending approval is still answerable on resume, and so is a call a client-side tool is still answering, or a call in a reply that is still streaming.
