---
'@lowdefy/ai-utils': patch
'@lowdefy/helpers': patch
---

fix(ai-utils): Show an error when an agent's timeout stops a chat turn

When an agent's own `timeout` (`totalMs`, `stepMs`, `chunkMs` or a number) stopped a chat turn, the reply stopped mid-sentence and looked complete: the AI SDK ends a timed-out stream cleanly, so no error reached the chat, nothing was logged, and the `onFinish` hooks got the cut-off reply with `isAborted: false` and `finishReason: 'stop'`. An app that saves answers in `onFinish` stored the fragment as a real answer.

The chat now ends with an error saying the answer took too long (translation key `agent.runtime.timedOut`), which fires `AgentChat`'s `onError`, and the server logs the stop with the agent and conversation ids and the step count. The `onFinish` payload carries `isAborted: true`, the new `abortReason` (`timeout`, or `client` when the caller's request stopped the turn) and a `finishReason` of `error` for a timeout and `other` for a client stop. A chat turn still runs to its end when its client goes away, so it reports only `timeout`, and a client that goes away is shown no error.
