---
'@lowdefy/build': minor
'@lowdefy/api': minor
'@lowdefy/server-dev': minor
'@lowdefy/docs': patch
---

feat(api,build): Run a routine scoped to an organization with `runAs: { organizationId }`.

Under `auth.organizations.policy: tenant`, a caller-less run (a schedule, a detached call, a
webhook, an auth hook) has no organization, so every walled step failed closed and the only way
out was `tenant: none` on each step with the organization clause hand-written into every filter
and document — the wall off, correctness resting on the author.

`runAs: { organizationId }` on an `Api` endpoint or on a single request step makes the tenant wall
run scoped to that organization instead: filters are injected and writes are stamped exactly as
for a signed-in member, through the same code path. An endpoint-level `runAs` scopes every walled
step of the run and is honoured over every transport (page call, cron, detached, webhook,
`CallApi`); a step-level `runAs` overrides it for that step and can read a previous step's result
with `_step`. Only the wall's scope moves — `context.user`, authorization, roles and `_user` still
describe the real caller.

The build refuses an `organizationId` that reads `_payload` or `_state` anywhere in its value
(the caller controls both, so any caller could name another organization), a malformed `runAs`,
`runAs` on a non-request step, and `runAs` together with `tenant: none` on the same step. A
`runAs` value that evaluates to anything but a non-empty string is a `ConfigError` at the step.

The dev server records every step that ran under a `runAs` scope as a `RunAsScope` notice: the
error bar shows `scoped runs (N)` beside `unscoped reads (N)`, and `lowdefy_build_status` lists
them under `tenantNotices`.
