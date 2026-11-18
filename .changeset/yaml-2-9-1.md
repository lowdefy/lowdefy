---
'@lowdefy/blocks-diff': patch
'@lowdefy/build': patch
'@lowdefy/docs': patch
'@lowdefy/node-utils': patch
'@lowdefy/operators-yaml': patch
'@lowdefy/server-dev': patch
'lowdefy': patch
---

fix(deps): Update yaml to 2.9.1

Limits recursive merge-key aliases, which a crafted YAML file could use to make parsing very slow.
