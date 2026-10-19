---
'@lowdefy/server-dev': minor
'lowdefy': minor
---

A journey can set `timeout`: how long each step may wait, in milliseconds (a whole number from 1 to 60000, default 5000). Raise it on a slow machine or CI runner instead of padding the journey with `wait: { ms }` steps. Page opens get at least 15 seconds, or the journey's `timeout` when that is longer. Journey files, `POST /lowdefy-docs/journey` and the `lowdefy_run_journey` tool all accept it.
