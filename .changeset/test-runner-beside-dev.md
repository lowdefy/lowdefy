---
'lowdefy': minor
'@lowdefy/server-dev': minor
'@lowdefy/logger': patch
---

feat(cli): `lowdefy test` and `lowdefy snapshot` run beside a `lowdefy dev` session

The runners boot their server into `.lowdefy/test` on a high random port instead of taking over `.lowdefy/dev` and port 3000, and drive an already running development server when one is serving the app. `lowdefy snapshot` gains `--url` to target a running server directly. A server the runner starts carries its own write allowance, so an app with an endpoint request test no longer has to commit `cli.agentTools.allowWriteRequests: true` and leave the write gate open for every development session.

Request tests are isolated from each other: every collection the run has seeded is cleared before each test, so a test without `seed` never reads what the previous one wrote, and `{ _oid: '<hex>' }` in fixtures and seeds becomes a real MongoDB `ObjectId`, matching what the agent seeding tool inserts. Expectations gain `expect: { contains: [...] }` for asserting that a response array includes given items without pinning its length. A failed in-memory MongoDB connection no longer leaks a `mongod` process.

All human CLI output now goes to stderr, so `lowdefy check --json` prints only the report object even on CI, and `lowdefy check` re-prepares its server directory when the Lowdefy version or the app's plugin set changed instead of validating against a stale install. The agent `lowdefy_check` tool returns a readable report instead of throwing when the check child produces no output.
