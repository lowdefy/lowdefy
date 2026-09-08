---
'@lowdefy/build': minor
'@lowdefy/server-dev': patch
---

feat(build): Deferred-content records — one registry for all module deferral.

Module deferral (component bodies, menu links, var defaults, entry
vars/connections) moves from fragile in-tree markers onto a build-level record
registry with demand-driven, wait-graph-guarded resolution. Entry order no
longer matters for mutually-embedding modules, cycle errors name the actual
value chain (e.g. `a:consumerVars.x → b:vars.y.default → a:consumerVars.x`),
and the entry state machine, `~deferredModuleRef`/`~deferredFrom` markers, and
per-context resolve chains are deleted. A new `deferredRecords.json` build
artifact carries record bodies for JIT; the dev server hydrates the registry
from it.

User-visible changes:
- New config errors: `~deferred` is a reserved key; `_module.var` in manifest
  headers or component/menu ids errors (export names are module-static); `_var`
  inside an operator-generated `components:` section errors (var-free operator
  composition keeps working).
- Module ref errors now list available component/menu ids and distinguish a
  missing export from an empty one.
- Lazy semantics: a broken var default or a cyclic menu that nothing consumes
  no longer fails the build — errors surface at consumption.

Also includes the buildRefs cleanups: single marker-preserving clone
(`cloneWithMarkers`), no redundant clones or duplicate `lowdefy.yaml`
re-resolution in the app pass, `validateModuleSecrets` walks instead of
cloning, and a shared `expectTerminates` test guard.
