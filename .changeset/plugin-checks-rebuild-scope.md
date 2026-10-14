---
'@lowdefy/build': patch
'@lowdefy/node-utils': minor
'lowdefy': patch
'@lowdefy/server-dev': patch
---

fix: plugin checks build again only when it checks something, and report where they counted

- `lowdefy build` and `lowdefy dev` build a second time only when a plugin that was missing owns a block, action or operator type, or now ships `./checks`. A fresh install of an app whose only extra plugins are connections no longer builds twice.
- An unknown `~ignoreBuildChecks` slug is a warning while some plugin's rules are not installed, and an error once every rule is known. Before, dev builds never reported it.
- A plugin check on an operator with no `~k` of its own reports the line it was counted at.
- Plugin checks load their packages in parallel, and dev builds load every plugin's rules only when a node names a plugin slug. The checked config nodes are released after the checks.
