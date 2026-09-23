---
'@lowdefy/blocks-antd-x': patch
---

fix(blocks-antd-x): AgentChat's `sendMessage`, `regenerate`, `stop` and `clearError` methods act on the conversation on screen after a switch.

The block registers its CallMethod handlers once, when it mounts, and they held on to the functions of the chat that was open then. Since a `conversationId` change gives the block a new chat, those methods kept driving the first one: `sendMessage` posted under the old conversation id and streamed its reply somewhere nothing displayed, `regenerate` worked on the old transcript, and `stop` and `clearError` did nothing to the visible chat. They now always use the current chat.
