---
'@lowdefy/helpers': patch
---

fix(helpers): Prevent makeReplacer from mutating original object marker enumerability.

makeReplacer used Object.defineProperty to make ~k, ~r, ~l enumerable for JSON.stringify, but operated on the original object reference instead of a copy. This permanently mutated the original, causing internal markers to leak to plugin components via Object.entries/Object.keys.
