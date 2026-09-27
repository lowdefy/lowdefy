---
'@lowdefy/server-e2e': patch
---

fix(server-e2e): Declare `lightningcss`, which the e2e server's Vite config imports. It was dropped from the package's dependencies, so a standalone install could not load the Vite config.
