---
'@lowdefy/ai-utils': patch
'@lowdefy/connection-ai-gateway': patch
'@lowdefy/connection-anthropic': patch
'@lowdefy/connection-google': patch
'@lowdefy/connection-openai': patch
---

**Behaviour change:** `GenerateText` and `GenerateObject` no longer accept a `system` role message in `messages` unless the request sets `allowSystemInMessages: true`.

A system message instructs the model as the app itself. The AI SDK 7 upgrade opted every request in whenever its `messages` contained one, so a message list built from user input (`_payload`, `_state`) could carry a system turn that the model would treat as the app's own instructions. Requests now opt in explicitly, and one without the opt-in fails with an error naming the property.

To migrate: put the system prompt in the `system` property. If the system message is written in your own config, add `allowSystemInMessages: true` to the request. Never set it for messages that come from a user.
