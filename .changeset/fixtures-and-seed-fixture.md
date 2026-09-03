---
'@lowdefy/node-utils': minor
'lowdefy': minor
'@lowdefy/server-dev': minor
'@lowdefy/api': minor
'@lowdefy/docs': patch
---

Add fixtures: `fixtures/<name>.yaml` files in an app hold reusable seed data keyed by `connectionId` — the same key a request test's `seed:` uses — with `~d` dates. A request test loads any number of them with `fixtures: [base, org-a]`; before each test the runner drops every collection named by the fixtures and by `seed:` once, inserts the fixtures in list order, then inserts `seed:`, and every fixture connection is redirected at the in-memory MongoDB like a seeded one. The dev MCP gains `lowdefy_seed_fixture` (`POST /lowdefy-docs/seed-fixture`, `{ name, reset }`) which loads a fixture into the dev database through the connection layer — a `databaseUri` behind `_secret`/`_env` resolves and a connection without `write: true` refuses — behind the existing `cli.agentTools.allowWriteRequests` opt-in; `reset: true` empties the fixture's collections first, documents are never tenant-stamped, and every seed is logged as `agent_seed_fixture` and pushed as a `fixture_seeded` event. `readFixture` is exported from `@lowdefy/node-utils` and `callConnectionRequest` (run a synthetic request against a connection) from `@lowdefy/api`.
