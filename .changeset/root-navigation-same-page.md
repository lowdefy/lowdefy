---
'@lowdefy/server': patch
'@lowdefy/server-e2e': patch
---

A navigation to the app root keeps the shown home page matched on the root, as a first load there does, so a later query change or home link on it needs no fetch. The network-failure fallback full-loads the path with its query string.
