---
'@lowdefy/server-dev': patch
'lowdefy': patch
---

fix(server-dev): MCP instructions follow the test level rules

The dev MCP server's instructions told agents to verify every change with a journey, and `lowdefy_run_tests` told them to widen to the edge tier before calling a change done, after the rules `lowdefy agent-setup` writes had stopped saying both. Called with no arguments, `lowdefy_run_tests` runs the full suite, so agents that followed it ran every journey for one change, and several agents building one change each did so on the same machine. The instructions now send logic to `lowdefy_run_endpoint` and keep `lowdefy_run_journey` for what only a browser shows, once the change is done. `lowdefy_run_tests` asks for the journeys of the pages a change touches and keeps the full suite for when a person asks. When several agents share a change, the agent that merges their work runs the journeys and `lowdefy_check` once, after the last merge.
