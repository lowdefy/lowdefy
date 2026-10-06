---
'@lowdefy/api': minor
'@lowdefy/ai-utils': minor
'@lowdefy/helpers': minor
'@lowdefy/client': minor
'@lowdefy/server': minor
'@lowdefy/server-dev': minor
'@lowdefy/blocks-antd-x': minor
'@lowdefy/connection-ai-gateway': minor
'@lowdefy/connection-anthropic': minor
'@lowdefy/connection-openai': minor
---

feat(agent): agent calls carry the page's path parameters

`AgentChat` sends the page's `pathParams` with each call next to `urlQuery`, the agent route accepts them, and the page-context option adds a `pathParams` line to the agent's instructions when the page has any. A record id moved from the query into the page path is still known to the agent. Links in agent messages are resolved to their page and path values through the engine's path memory.
