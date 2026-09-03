---
'@lowdefy/build': major
---

An unknown operator is now a build error instead of a warning.

Previously, using an operator name the app does not have (a typo, or a plugin that was never installed) logged a warning and left the object in place. At runtime the parsers returned it unchanged, so `{ _stat: 'x' }` rendered on the page as the literal `{"_stat":"x"}` — a silent wrong result. It now fails the build with the same message and suggestion:

```
Operator type "_stat" was used but is not defined. Did you mean "_state"?
```

Type errors are also now collected rather than fail-fast, so a build reports every unknown type — blocks, actions, operators, requests, connections, steps, auth, agents, websockets and notifications — in one run instead of one per build.

Migration: fix the operator name, or install and register the plugin that provides it. If the key is intentionally not an operator and only looks like one (a single key starting with an underscore), suppress the check on that node with `~ignoreBuildChecks: [types]`; the suppression cascades, so it can also be declared on the containing block or page.

The dev server's per-page JIT check now matches, and its type errors carry `checkSlug: 'types'` so `~ignoreBuildChecks: [types]` suppresses them too — it previously did not.
