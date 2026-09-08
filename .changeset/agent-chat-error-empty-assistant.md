---
'@lowdefy/ai-utils': patch
'@lowdefy/blocks-antd-x': patch
---

fix(ai): a failed agent turn no longer poisons the conversation. The chat client pushes the assistant message on the stream's `start` chunk, so a request that failed after that left an assistant message with no parts in the history; every later send then failed UIMessage validation, and the error toast dumped the whole conversation as JSON. AgentChat now drops empty assistant shells on error, the agent handler ignores empty messages and redacts validation errors, and a validation failure is logged like any other stream fault.
