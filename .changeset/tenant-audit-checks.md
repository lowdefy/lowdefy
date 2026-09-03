---
'@lowdefy/build': minor
'@lowdefy/errors': minor
'@lowdefy/server-dev': patch
'@lowdefy/docs': patch
---

feat(build): Audit the tenant wall at build and under `lowdefy check`.

Five rules now read every request and routine step on a walled connection (check slug `tenant`,
suppressed at a node with `~ignoreBuildChecks: [tenant]`):

- **F1** — a scoped request or step that sets the connection's tenant field itself fails
  `lowdefy build`: the wall injects the field and refuses an authored value at runtime, so the
  clause can only break the request.
- **F2** — a `tenant: none` site whose properties never mention the tenant field reads every
  organization's rows (`lowdefy check`).
- **F3** — a `tenant: none` site that takes its tenant value from `_payload` or `_state` lets any
  caller name any organization (`lowdefy check`).
- **F4** — a `tenant: none` insert or upsert whose document carries no tenant field writes a row
  no walled read will ever return (`lowdefy check`).
- **R1** — one warning per `tenant: none` request and step: the inventory of where the wall is
  off (`lowdefy check`).

Every message names the site, the connection, the field and the fix. The rules read literal config
only — a filter or document composed by an operator is skipped rather than guessed at, and the
runtime wall stays the contract.

Internally the build's `context.tenantConnectionIds` Set is replaced by a `tenantConnections` Map
carrying each walled connection's type and tenant field; the `tenantCollections.json` build
artifact and the dev server's JIT page build restore follow the rename.
