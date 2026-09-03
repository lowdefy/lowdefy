---
'@lowdefy/api': patch
'@lowdefy/build': patch
'@lowdefy/server': patch
'@lowdefy/server-dev': patch
'@lowdefy/connection-mongodb': patch
---

fix: close secret and scope leaks, make routines cancellable

`explain: true` no longer returns resolved secret values: any string in the traced request properties or effective query that matches a secret is replaced with `[redacted secret]`, including secrets interpolated into headers, and its note now names the request type and distinguishes a request that never reached the driver from a request type that reports no effective query. MongoDB driver errors are matched by class rather than by name, so duplicate-key errors from `insertMany` and `bulkWrite` are mapped instead of leaking the raw driver message, and a change-log write failure names the log collection.

An endpoint-level `runAs` is evaluated with an empty payload, an empty or null `organizationId` is a build error, `_state` is allowed in a step-level `runAs` (with a clearer message at endpoint level), and a step counts as a request step when it names a connection. Fixture seeding validates documents against `collections.fields` and stores document keys such as `_secret` verbatim instead of evaluating them, and publishes `fixture_seeded` even when seeding fails part-way.

Endpoint routines honour the request's abort signal: a caller that disconnects or a platform timeout stops the routine at the next step or `:while`/`:for` iteration, and `:while` logs its condition after the break test. Background, detached, scheduled and webhook runs are unaffected.
