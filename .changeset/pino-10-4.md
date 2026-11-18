---
'@lowdefy/logger': patch
'@lowdefy/server-dev': patch
---

fix(deps): Update pino to 10.4.0

Escapes child binding keys, logs objects with an own `__proto__` key instead of crashing, and honours per-target level filters on a single-target transport.
