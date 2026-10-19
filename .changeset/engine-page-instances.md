---
'@lowdefy/engine': minor
'@lowdefy/operators': patch
'@lowdefy/client': patch
---

The engine keeps one context per set of path values for a page with placeholders (10 kept per page), builds page links with the shared page path builder, remembers which page each path belongs to (`rememberPath`, `lookupPath`) and gives actions `getPathParams`.
