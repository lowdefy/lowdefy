---
'@lowdefy/server': patch
'@lowdefy/server-e2e': patch
---

fix: When a page navigation fails on the network, the full-page load it falls back to keeps the URL query string.
