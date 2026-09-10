---
'@lowdefy/blocks-antd-x': minor
---

AgentChat: stop the stream on a conversation switch, re-sync same-shaped transcripts, and add a `loading` property

- **A `conversationId` change stops an in-flight reply.** The block cleared its messages on a switch but left the stream running, so a reply still streaming into the conversation being left kept appending — into the one being opened. `stop()` now runs before the clear.
- **External messages re-sync when the conversation changes.** The `messages` sync skipped `setMessages` when the array had the same length and last id as before, and that memo did not reset on a switch. Every assistant message an older onFinish hook persisted carries id `''`, so any two same-length transcripts collided and the switch showed an empty chat. The conversation id is now part of the comparison.
- **`loading: boolean`.** While true, a skeleton replaces the message area, suggestions are hidden and the composer is disabled — for apps that read a conversation's transcript from their own store on select, so nothing can be sent into a conversation whose history has not synced yet.
