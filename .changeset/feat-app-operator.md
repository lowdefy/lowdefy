---
'@lowdefy/api': minor
'@lowdefy/build': minor
'@lowdefy/client': minor
'@lowdefy/operators': minor
'@lowdefy/operators-js': minor
'@lowdefy/server': minor
---

feat: Add `_app` operator and structured app metadata.

The `_app` operator reads the app's declared metadata — `slug`, `name`,
`version`, `description`, `license`, `lowdefyVersion`, `gitSha`. It
resolves both at build time and at runtime (client and server) with
identical values, including inside `modules-mongodb` request filters and
inside `_js` functions via a bound `lowdefyApp(p)` callable. For
build-time positions nested inside another `_build.*` operator (e.g. a
`_build.object.fromEntries` map key), use the `_build.app` form so it
resolves in time.

A referenced `slug` is mandatory: `_app: slug` (or `_build.app: slug`)
fails the build when `slug` is not declared, guarding against a `null`
slug silently scoping namespaced data. The object form with an explicit
`default` is the opt-out. Other fields return `null` when unset, and an
app that never references `slug` need not declare it.

The root `lowdefy.yaml` schema gains two new optional fields:

- `slug` — a kebab-case identifier (`^[a-z][a-z0-9]*(-[a-z0-9]+)*$`),
  validated at build time. Build fails with a clear error if invalid.
- `description` — a free-form string.

Root metadata fields (`slug`, `name`, `description`, `version`,
`license`, `lowdefy`) accept literals and `_build.*` operators only;
`_ref`, `_var`, and static `_` operators are no longer resolved in these
positions and fail the build with a clear error naming the field. Use
`_build.env` for a deploy-time slug or name.

`gitSha` resolves through a fallback chain: `LOWDEFY_GIT_SHA` env var
when set non-empty → `git rev-parse HEAD` → `null`. This lets apps
deployed without `.git` (Docker, Vercel, Netlify, Render, hermetic
PaaS sandboxes) pin the SHA explicitly by mapping their platform's
commit env var via shell expansion in the build command.

Build emits a new `appMeta.json` artifact alongside `app.json`. The
existing `app.git_sha` field is removed; consumers (internal telemetry)
read `gitSha` from `appMeta` instead.

See the `_app` operator reference for the full key set and examples.
