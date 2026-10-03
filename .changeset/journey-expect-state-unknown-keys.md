---
'lowdefy': patch
'@lowdefy/server-dev': patch
'@lowdefy/node-utils': patch
---

A journey's `expect: { state }` step now refuses keys other than `path`, `equals` and `from`, as `fill`, `select` and the other targets already do. A typo such as `form: shape` used to pass silently, so the runner never refused the placeholder.
