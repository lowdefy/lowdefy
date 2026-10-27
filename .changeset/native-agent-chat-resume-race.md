---
'@lowdefy/blocks-native': patch
---

fix: A native `AgentChat` chat started with `newChat` while the last thread is still resuming is no longer replaced by that thread when `get-active-thread` answers. Starting or opening a chat cancels the pending resume.
