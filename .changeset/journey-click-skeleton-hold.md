---
'@lowdefy/blocks-antd': patch
'@lowdefy/server-dev': patch
---

fix(server-dev): A journey click waits for a table to clear its held loading skeleton

A table that has loaded keeps its skeleton on screen for up to 300 ms so it never flickers, and a pointer press ends that hold at once. A journey click that arrived during the hold landed on a skeleton row that was replaced before the button came up, so no click fired. A held skeleton now counts in `window.__lowdefySkeletonHolds`, and page readiness and journey clicks wait for it to clear, as they already wait for lazy blocks to load.
