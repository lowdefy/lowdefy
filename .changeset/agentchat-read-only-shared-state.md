---
'@lowdefy/blocks-antd-x': minor
'@lowdefy/ai-utils': minor
'@lowdefy/api': minor
'@lowdefy/server': minor
'@lowdefy/server-dev': minor
'@lowdefy/helpers': minor
---

AgentChat: send `sharedState` as read-only context

- **`sharedStateReadOnly: boolean`** (default `false`). When `true`, the block still sends `sharedState` with each turn (to `_payload`, and to the agent's context block with `pageContext: true`), but the server does not register the `update-page-state` tool, so the model is never offered a write to page state. Use it to give an agent context such as the current time or the record on screen when some of those values are also bound to inputs the agent should not change. Without it, an app that wanted context but no writes had to list every other tool in the agent's `activeTools`.
