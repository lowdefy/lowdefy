---
'@lowdefy/blocks-antd-x': patch
---

fix: AgentChat no longer replays events for restored conversation history

Loading a saved conversation into `AgentChat` (via `properties.messages` or the `setMessages` method) fired `onToolCall`, `onToolResult`, `onUserMessage`, and `onTitleGenerated` for every historical message — re-running side effects like state updates or requests that had already happened. Restored history is now recognized and those events are suppressed; only genuinely new activity triggers them.

Also, `onToolCall` now waits for the tool input to finish streaming before firing, so the event never carries a truncated input object.
