---
'@lowdefy/blocks-antd-x': minor
---

AgentConversations: mark a conversation row as loading

- **`loadingKey: string`.** Mirrors `activeKey`: the row with that key shows a spinner in place of its icon and is marked `aria-busy`. Set it on `onSelect` while the app reads the conversation's transcript and clear it when the read completes, so the list shows that the selected conversation is still loading rather than only the chat column.
- **`items[].loading: boolean`.** The same indicator per item, for rows loading on their own (for example while a title is being generated).

Closes #2397.
