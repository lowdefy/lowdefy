---
'@lowdefy/build': minor
---

feat(build): Write key map entries in the short shape

`keyMap.json` stores each entry as `{ s, p, r?, l?, i? }`: the node's own config path segment and its parent's id, its ref id only where it differs from its parent's, its line and its `~ignoreBuildChecks` value. Full paths and refs are rebuilt from the parent chain when an error is located or the dev server's find-config tool scans the map, so what developers see is unchanged, and the key map is several times smaller on large apps. No entry field starts with `~`, so `keyMap.json` reads the same with plain `JSON.parse`.
