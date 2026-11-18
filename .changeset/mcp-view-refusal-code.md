---
'@lowdefy/server': patch
'@lowdefy/server-dev': patch
'@lowdefy/server-e2e': patch
---

fix: A write refused to a read-only MCP App view session now answers with its `code`, `view_write_required`, beside `name` and `message`, so a view can ask the person to reconnect with write access. Only that code is sent: any other code an expected error carries stays on the server. The dev server, which serves no views, refuses a view session on every `/api` route.
