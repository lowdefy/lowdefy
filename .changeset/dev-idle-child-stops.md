---
'@lowdefy/server-dev': patch
'lowdefy': patch
---

An idle dev server now stops its Vite web server after 3 minutes with no use and no open tab, freeing several hundred megabytes, and starts it again on the next page request, tool call or journey. Status reads and reconnecting streams get a quick "idle" answer instead of waking it, and edits made meanwhile are built but wait for that request. `lowdefy_dev_status` reports such a server as `idle`.
