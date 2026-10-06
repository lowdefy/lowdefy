---
'@lowdefy/blocks-antd-x': patch
'@lowdefy/client': patch
---

AgentChat message links to app paths navigate as a `url` target, so the server matches the page and the client no longer guesses it from the path. `lowdefy._internal.components.lookupPath` is removed.
