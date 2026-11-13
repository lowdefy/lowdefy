---
'@lowdefy/server-dev': patch
---

chore(server-dev): Remove the `/api/dev-tools` route

The route returned the app's config directory for the Lowdefy VS Code extension, which has been removed. Nothing else called it.
