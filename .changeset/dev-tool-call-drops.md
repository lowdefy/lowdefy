---
'lowdefy': patch
'@lowdefy/server-dev': patch
---

fix: Long and interrupted dev tool calls through `lowdefy mcp` now always answer

- A dev tool call that runs longer than 5 minutes, such as a journey with a long wait, now returns its result. Node's fetch ended a response that stayed silent for 5 minutes, and the call then hung until the agent's own timeout. The dev server now keeps a tool call's event stream alive while the tool runs.
- A dev tool call whose dev server stops or drops the connection mid-call now fails within seconds, saying so, instead of waiting out the 10-minute tool call timeout. The agent can check `lowdefy_dev_status` and try again.
