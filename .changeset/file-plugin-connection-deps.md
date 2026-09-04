---
'lowdefy': patch
---

An app whose only file plugin is a connection now gets its `package.json` dependencies installed into the server. The CLI's file-plugin directory list had drifted from the build's and omitted `plugins/connections`, so those dependencies were silently skipped.
