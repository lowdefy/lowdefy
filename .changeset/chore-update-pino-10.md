---
'@lowdefy/logger': patch
'@lowdefy/build': patch
'@lowdefy/server': patch
'@lowdefy/server-dev': patch
'@lowdefy/server-e2e': patch
---

chore: Update pino from 8.16.2 to 10.3.1.

No behavior change — the log output format, levels, and configuration are unchanged. The pino 9 and 10 majors only drop support for Node.js versions below 20, and Lowdefy already requires Node.js 22 or newer.
