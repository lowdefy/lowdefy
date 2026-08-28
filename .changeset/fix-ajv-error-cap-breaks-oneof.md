---
'@lowdefy/ajv': patch
---

fix: Stop the validation error cap from failing valid `oneOf` data.

The error cap added for CodeQL `js/resource-exhaustion-from-deep-object-traversal`
made the generated validator `return false` once it had collected
`MAX_VALIDATION_ERRORS` errors. Ajv only decides a `oneOf`/`anyOf` after trying
every branch, and each branch that rejects the data pushes one error per entry it
rejects — so on a long enough array the earlier branches spent the whole budget
and the validator gave up before reaching the branch that matched.

For a `oneOf` of differently-typed arrays — the shape every selector's `options`
property uses (a list of primitives, or a list of `{ label, value }` pairs) — that
meant any list longer than about six entries was rejected regardless of what it
held. Blocks whose options are built server-side and reach the validator as a
literal array, rather than as an operator the client evaluates, failed
validation outright.

The cap now truncates the retained error array instead of abandoning the walk.
Error counting is untouched, so validity is still decided by Ajv, `.errors` stays
bounded at `MAX_VALIDATION_ERRORS`, and retained memory stays bounded.
