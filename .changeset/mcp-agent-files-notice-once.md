---
'lowdefy': minor
---

feat(cli): `lowdefy mcp` passes each agent-instructions notice on once per session

The dev server's build status reports notices about Lowdefy's agent instructions under `agentFiles` on every read. `lowdefy mcp` now passes each notice to the agent once per session for each app, and again only when its text changes; later `lowdefy_build_status` results in that session leave `agentFiles` out, so the notice does not repeat after every edit. The rest of the result is unchanged, no other tool's result is touched, and `GET /lowdefy-docs/build-status` still reports the notices on every read. The AI agent docs describe the notices.
