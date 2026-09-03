---
'@lowdefy/api': minor
'@lowdefy/build': minor
'@lowdefy/server': minor
'@lowdefy/server-dev': minor
'@lowdefy/docs': patch
---

feat: one structured wide event per unit of server work, and a process-start marker

Servers write `request_completed`, `step_completed`, `endpoint_completed` and `agent_tool_completed`, each with a `*_failed` twin, carrying the request id, page and block, the ids of the unit, its `config_key`, `duration_ms` and success, plus the error name, message and hint on failure. Resolve `config_key` through the build's `keyMap.json` at the line's `git_sha` to get the exact file and line; no file read happens on the request path. Failures log at `info` and successes at `debug` by default; `logger.events: all` raises successes to `info`, `logger.events.sample_rate` keeps a fraction of them (sampled per request, so a kept request is complete), and `logger.events.identity: true` adds `user.id` and the tenant value, which are off by default. Each server process writes one `process_started` line with the app version, git sha, Lowdefy version and Node version (one per cold start on serverless; group queries by `git_sha`), and a `migrations_checked` line when the migration preflight first resolves. The old `debug_start_call_api`/`debug_end_call_api` pair and the MCP `mcp_tool_call` line are replaced by these events.
