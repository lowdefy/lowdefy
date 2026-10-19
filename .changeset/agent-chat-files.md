---
'@lowdefy/api': minor
'@lowdefy/ai-utils': minor
'@lowdefy/blocks-antd-x': minor
'@lowdefy/operators-js': minor
---

feat(api): Tool endpoints read the files attached in an agent chat with `_agent: files`

An `AgentChat` file uploaded through `uploadPolicyRequestId` now keeps its storage key on its message part, as `providerMetadata: { lowdefy: { key } }`, so saved conversations and `onFinish` hooks hold it beside the signed link. `_agent: files` gives a tool endpoint, and the endpoints it calls with `CallApi`, the files of every message the chat request carried, as `[{ key, filename, mediaType }]`; it is `[]` under a `CallAgent` step. The model gets a line naming each file before it (`Attached file: screenshot.png`), so it can pass the name to a tool, and the storage key is not sent to the model. The saved messages are unchanged. The files come from the person's own chat request, so a tool should look a file up by name in `_agent: files` and check that the key is one the caller may read before reading it.
