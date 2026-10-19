---
'@lowdefy/blocks-native': minor
'@lowdefy/build': patch
---

feat: Native `AgentChat` starts a chat about a record from a seed

The `newChat` method takes `{ sharedState, welcome, input, tag, title }` as its args, so a record page can open a chat about its record: the welcome is laid over the block's `welcome` while the chat is empty, the composer holds the input to edit or send, and the shared state is merged under `sharedState` for that conversation. With `threads`, the thread is saved with the seed's tag in place of `threads.tag` and keeps the seed's title as its name. A new `seed` property takes the same object for a chat that mounts with no thread resumed.

```yaml
- id: start_task_chat
  type: CallMethod
  params:
    blockId: task_chat
    method: newChat
    args:
      - sharedState:
          task:
            key: ACME-12
        welcome:
          title: ACME-12 Fix the menu
        input: What is left on ACME-12?
        tag: ACME-12
        title: ACME-12 Fix the menu
```
