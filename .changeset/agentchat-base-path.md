---
'@lowdefy/blocks-antd-x': patch
---

AgentChat: send requests under the app's basePath

The chat transport posted to `/api/agent/...` without the app's `basePath`, so an app served under a subpath got 404s. It now prefixes the block's `basePath`, like every other client request.
