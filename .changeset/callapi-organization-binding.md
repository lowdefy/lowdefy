---
'@lowdefy/api': minor
'@lowdefy/build': minor
'@lowdefy/docs-content': patch
---

feat: `CallApi` can run its target in one organization, as a named stand-in caller.

A `CallApi` step in a trusted system run (a scheduled run, an auth hook, a webhook whose `verify` request passed, or a detached run from one) can name `organization` and, optionally, `caller: { id, name }`. The target runs as a system run bound to that organization: under the `tenant` organizations policy every walled request inside it, and in the endpoints it calls, is filtered and stamped with the organization, with the wall on. `_user` inside it is `{ id, name, organization_id, system: true }` when `caller` is named (no roles), or null otherwise, so routines and change logs that stamp writes with the caller run unchanged. A detached call carries the binding.

The step is refused in a signed-in caller's routine, a strategy caller's, or a webhook with no passing verifier, and a bound run can not name a different organization or caller. A `caller` without `organization`, or a static value of the wrong shape, is a build error.
