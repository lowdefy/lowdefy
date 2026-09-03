---
'@lowdefy/errors': minor
'@lowdefy/build': minor
'@lowdefy/server-dev': minor
'@lowdefy/docs': patch
---

feat(build): one check slug per rule, `~ignoreBuildChecks` takes only an array, and the schema is live

The grab-bag slugs `types`, `tenant`, `migrations` and the unused `expression` are replaced by targeted slugs (`block-types`, `operator-types`, `connection-types`, `tenant-run-as`, `tenant-authored`, `migration-files`, `migration-routine`, `collections-undeclared`, 48 in all), so suppressing an unknown block type no longer also suppresses an unknown connection type or a tenant wall audit. The `~ignoreBuildChecks: true` form is removed: it disabled checks you had never heard of with no audit trail; name the slugs instead. An unknown slug gets a "did you mean", and the whole catalogue with descriptions is served over the dev-server docs endpoint and MCP (`lowdefy_get_schema` with `kind: "checks"`), so an agent can discover a legal slug without triggering an error. Framework code that emits an unknown slug fails loudly instead of shipping an unsuppressible check.

The schema gains a `page` definition, so `state`, `subscriptions` and `~snapshotIgnore` are no longer advertised on every nested block; typed shapes for `auth.dev.users` entries and `component.props` prop definitions, so `role: admin` or `{ typ: 'string' }` is a build error rather than a silently ignored value; `config.experimental`; and descriptions on the collections, page-state, component and endpoint-schema keys. Schema messages that list the legal forms of a key (collection fields, connection `tenant`) surface instead of a misleading "must be string" from the first branch. 837 lines of `~ignoreBuildChecks` JSON schema that the validator never saw (the key is stripped before validation) are deleted.
