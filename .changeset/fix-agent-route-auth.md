---
'@lowdefy/build': patch
'@lowdefy/api': patch
---

fix: Anonymous calls to protected agents are rejected.

The `/api/agent` route ran agents without checking the session: on an app with `auth.api.protected: true`, a session-less caller could still execute any agent — tool calls failed endpoint auth, but the model call ran on the app's provider account. Agents now follow the `auth.api` config exactly like endpoints: `public`, `protected`, and `roles` patterns match agent ids, and unauthorized calls fail with the same error as an unknown agent id.

Note for apps using wildcard patterns in `auth.api.public` or `auth.api.roles`: those patterns now also match agent ids.
