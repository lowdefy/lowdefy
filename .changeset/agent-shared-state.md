---
'@lowdefy/api': minor
'@lowdefy/operators-js': minor
'@lowdefy/docs-content': patch
---

feat(api): `_agent: sharedState` gives an agent's tool endpoint the chat's shared state

A tool endpoint an agent calls can now read the shared state the `AgentChat` block sent with the message, for example the page or browser details an app puts there, with `_agent: sharedState`. The tool reads it from the chat instead of from its input, which the model writes. It is `null` for an agent run by a `CallAgent` step.
