---
'@lowdefy/build': minor
'@lowdefy/node-utils': minor
'lowdefy': patch
'@lowdefy/docs': patch
---

feat(build): archetypes declare `props:`; one module lockfile helper set; migration files are schema-validated

Archetypes declare their props under `props:` (the same key components use); `properties:` still works for one release with a deprecation warning. The module lockfile helpers live in `@lowdefy/node-utils` so the build and the CLI share one implementation. `migrations/*.yaml` files are schema-validated, so a mistyped key such as `routines:` is a located config error instead of silently producing an empty routine.
