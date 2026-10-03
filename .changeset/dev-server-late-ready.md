---
'@lowdefy/server-dev': patch
---

fix(server-dev): Mark the dev server ready when it answers after a slow start or a restart

The dev server recorded itself as ready only when its first Vite process answered within 2 minutes. On a heavily loaded machine a first start can take longer, and a first process that exits at start (a plugin that fails to load) is only replaced by a later restart. In both cases the server stayed "starting" while it served requests, so `lowdefy_dev_start` kept reporting it as still starting and the agent dev hub stopped it as stalled after 5 minutes. Now the first answer from any Vite process, including one after the 2-minute warning or after a restart, marks the server ready. A process that never answers is still never marked ready.
