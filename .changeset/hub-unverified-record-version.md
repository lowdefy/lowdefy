---
'lowdefy': patch
'@lowdefy/node-utils': patch
---

fix: Say when a dev server stays "starting" because the hub runs another Lowdefy version

A dev server hub on an older Lowdefy version than the dev server it started can fail to read the server's instance record, and then reports the server as starting for as long as it runs, while the server answers every request. The refused tool call now names both versions and how to match them, so the agent restarts `lowdefy mcp` instead of waiting.
