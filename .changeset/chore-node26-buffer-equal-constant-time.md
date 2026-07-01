---
---

chore: Patch `buffer-equal-constant-time` so the JWT dependency chain loads on Node 26.

`buffer-equal-constant-time@1.0.1` (transitive via `jwa` → `jws` → `google-auth-library`, used by the
Google Sheets connection) reads `require('buffer').SlowBuffer` at module load. `SlowBuffer` was removed
in Node 26, so the reference is `undefined` and every consumer crashes with
`TypeError: Cannot read properties of undefined (reading 'prototype')`. The package is unmaintained
(latest is 1.0.1, from 2016), so added a pnpm patch that falls back to `Buffer` when `SlowBuffer` is
absent. The fallback is only touched by the package's legacy `install`/`restore` helpers, so behaviour
is unchanged on older Node versions.
