---
'@lowdefy/build': patch
---

fix(build): resolve module page resolver/transformer paths against the module root in JIT dev builds.

A module page backed by a `resolver:` (or `transformer:`) declares its path relative to the module
(e.g. `resolvers/makeActionPages.js`). The full build rebases this against the module root in the ref
walker, but the JIT dev path (`buildPageJit`) rebuilt the page refDef directly from the un-rebased
authored `_ref` and called `getRefContent` without going through the walker — so the relative path was
resolved against the app config dir, producing a `ConfigError` (`Error importing resolvers/...`) when a
module page was rebuilt on request. `buildPageJit` now applies the same module-root rebasing to
`path`/`resolver`/`transformer` before resolving content. File-based module pages were unaffected.
