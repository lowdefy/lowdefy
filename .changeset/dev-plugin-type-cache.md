---
'@lowdefy/server-dev': patch
---

The dev server keeps each plugin's type and message lists between config rebuilds, so a page or config edit no longer re-imports every plugin. A local plugin change, a `.env` change, a root `lowdefy.yaml` change and a `lowdefy_restart` read them afresh.
