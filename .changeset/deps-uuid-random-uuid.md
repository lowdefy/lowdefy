---
'lowdefy': patch
'@lowdefy/server': patch
'@lowdefy/server-dev': patch
'@lowdefy/server-e2e': patch
---

chore(deps): Replace uuid with crypto.randomUUID in the CLI and servers

The CLI's app id and the servers' request ids now come from `randomUUID` in `node:crypto`, which gives the same version 4 UUID that `uuid` did. `uuid` is no longer a dependency of `lowdefy`, `@lowdefy/server`, `@lowdefy/server-dev` or `@lowdefy/server-e2e`. `@lowdefy/operators-uuid` keeps it for the `_uuid` operator's v1, v3 and v5.

The usage logger's machine id is made in the browser, where `crypto.randomUUID` exists only on HTTPS or localhost. An app served over plain HTTP on any other host has no `crypto.randomUUID` (issue #1932, the reason the browser moved to `uuid` in the first place), so the machine id is built from `crypto.getRandomValues`, which works on every origin, and keeps the same version 4 format.
