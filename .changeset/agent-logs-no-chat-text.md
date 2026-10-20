---
'@lowdefy/ai-utils': patch
'@lowdefy/api': patch
---

fix(ai-utils, api): Agent and endpoint logs leave chat text out

Agent and endpoint logs no longer write chat text. A failed agent turn, a failed title or a failed hook now logs the error's name, code and message (cut to 500 characters), the agent id, the conversation id and the step count. An AI SDK error whose message embeds the conversation or a tool's input, such as a `TypeValidationError`, is logged by name alone. The `debug_endpoint` log for an API call names the call by its ids and no longer writes its payload, so an agent chat's save-thread call no longer writes the whole thread there. Routine step debug logs, such as `:set_state` and `:return`, still write the values they evaluate.
