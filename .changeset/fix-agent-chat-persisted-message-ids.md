---
'@lowdefy/ai-utils': patch
---

fix(ai-utils): Give the assistant message an id so persisted transcripts render correctly.

`handleAgentChat` passed no `generateMessageId` to the AI SDK, so the assistant message delivered to
the stream-level `onFinish` arrived with an empty id. An `onFinish` hook that saves the conversation
therefore stored every assistant message under the same id, and reloading that conversation collapsed
the transcript: `AgentChat` keys its bubbles by message id and looks each bubble's parts up by that id,
so every assistant bubble rendered the last reply. User messages were unaffected, and a live turn
looked correct because the client generates its own id while streaming — the damage only appeared once
the conversation was reopened. Both stream paths (with and without `prune`) now pass the SDK's
`generateId`.
