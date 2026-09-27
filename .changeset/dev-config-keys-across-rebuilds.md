---
'@lowdefy/build': patch
'@lowdefy/server-dev': patch
---

fix(server-dev): Keep error locations right across config rebuilds in dev

The dev server rebuilds config without restarting. A page loaded, or a request started,
before a rebuild reported errors with the earlier build's config keys, and since every
build numbered its keys from 1, such an error could name a different block, action or
endpoint of the new build. Each dev build now gives its keys a fresh prefix, so a key from
an earlier build never matches a node of the current one. A page build that was still
running when the config rebuilt no longer writes its key and ref maps over the new ones.
