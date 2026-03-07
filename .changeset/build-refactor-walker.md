---
'@lowdefy/build': minor
'@lowdefy/operators': minor
'@lowdefy/helpers': patch
---

feat: Single-pass async walker for ref resolution

**Single-Pass Walker (`@lowdefy/build`)**

- New `walker` module replaces the multi-pass JSON round-trip architecture in `buildRefs` with a single async tree walk
- Resolves `_ref` markers, evaluates `_build.*` operators, and tags `~r` provenance in one pass instead of 5+ `serializer.copy` calls per ref
- Wired into both `buildRefs` (production) and `buildPageJit` (dev server)
- Added `isPageContentPath` for semantic shallow build matching, replacing brittle path-index checks
- Deleted redundant code replaced by walker: `getRefsFromFile`, `populateRefs`, `createRefReviver`, and the `evaluateStaticOperators` wrapper

**In-Place Operator Evaluation (`@lowdefy/operators`)**

- New `evaluateOperators` function walks a tree in-place and evaluates operator nodes, avoiding JSON serialization round-trips
- Used by the walker module to evaluate `_build.*` operators inline during ref resolution

**Serializer Fix (`@lowdefy/helpers`)**

- Added `skipMarkers` option to `serializer.serializeToString` to exclude internal markers (`~k`, `~r`, `~l`, `~arr`) from serialized output
