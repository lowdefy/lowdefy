---
'@lowdefy/build': minor
'@lowdefy/block-utils': minor
'@lowdefy/client': minor
'@lowdefy/errors': patch
'lowdefy': minor
'@lowdefy/docs': patch
---

feat: skills shrink to an index; the plugin API version is load-bearing

A skill's Reference is now an index (the doc slugs and type names it covers, and the one `lowdefy_get_*` call that returns each live from your dev server) instead of a copy of schemas that goes stale on the next release; the generator still validates every slug and type, and hand-written Recipes are preserved byte-for-byte. Each skill declares `kind: recipe | reference` and the framework version it was generated from; `lowdefy agent-setup` stamps that version, names any installed skill that has fallen behind, and takes `--force-skills` to overwrite.

Block, operator, action and connection packages declare `"lowdefy": { "pluginApiVersion": 1 }` in `package.json`; the build compares it and fails with a located error (`plugin-api-version`) naming the migration doc on a mismatch (a missing declaration is a warning for one release). Plugin hazards carry `kind` (`bug` or `semantics`), `retiredBy` for a bug, and a `see` slug, validated for blocks, operators and requests alike. In development, reaching for a block method that does not exist throws an error naming the block and listing the methods it does have, instead of a bare `TypeError`.
