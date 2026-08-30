---
'@lowdefy/build': minor
'@lowdefy/errors': minor
'@lowdefy/server-dev': patch
'@lowdefy/docs': patch
---

feat(build): Add the app-level `collections:` declaration and `build/collections.json`.

An optional root `collections` object declares, per collection, its `tenant` (`shared` or a tenant
field name, normalised to `{ field }`), `fields` (a type name, a `[type]` array shorthand, or an
object with `type`, `enum`, `items`, `required` - all normalised to JSON Schema fragments),
`relations` (`"<collection>.<field>"`, checked against the target's declared fields) and `indexes`
(validated and passed through; declaring an index does not create it). The build joins every
connection whose `properties.collection` is a literal string to its collection with its `read`,
`write` and `tenant` flags and always writes `build/collections.json`, as `{}` when nothing is
declared.

A connection whose `tenant` disagrees with its collection's `tenant` is a build error. A collection
declared `tenant: shared` is now the first source for the `tenant-lookup` check, so a scoped pipeline
joining it fails the build even when no shared connection for it exists; the connection-derived path
stays as the fallback. Three check-only rules under the new `collections` slug report undeclared,
operator-named and untenanted connections under `lowdefy check`.
