---
'@lowdefy/server-dev': minor
---

`lowdefy_run_request` and `POST /lowdefy-docs/run-request` now accept a `user` param, and run the request as that caller. Without it a request runs as a roleless anonymous caller, so a tenant-walled or role-gated request silently returns empty rows; passing `user: { roles: ['admin'] }` (merged over the default headless user, exactly as the other headless agent tools merge it) runs it as that identity instead. An explicit `user` also wins over the ambient `auth.dev.mockUser`. Impersonation does not unlock writes — the `cli.agentTools.allowWriteRequests` gate is unchanged.
