---
'@lowdefy/build': minor
'@lowdefy/operators': minor
'@lowdefy/operators-js': minor
'@lowdefy/operators-uuid': minor
'@lowdefy/operators-moment': minor
'@lowdefy/operators-diff': minor
'@lowdefy/operators-change-case': minor
'@lowdefy/operators-jsonata': minor
'@lowdefy/operators-mql': minor
'@lowdefy/operators-nunjucks': minor
'@lowdefy/operators-yaml': minor
---

**BREAKING CHANGE:** Add build-time operator evaluation for static definitions.

All operators must now explicitly declare a `dynamic` property (true or false). The server will fail to start if any operator is missing this property. Static operators are evaluated at build time with partial evaluation - dynamic branches are preserved while static branches are computed.

**Key Changes:**

- All 73 operators updated with explicit `dynamic: true` or `dynamic: false`
- BuildParser validates operators at server startup and throws Plugin Error if missing
- New evaluateStaticOperators function with performance optimizations
- Partial evaluation: dynamic operators stop only their specific branch
- Performance optimizations: operator registry (O(1) lookups), quick scan, parallel processing

**Migration Guide:**

- If you have custom operators, add explicit `dynamic` property to each operator function
- For operators with methods, add `dynamic` property to each method in the meta object
- Mark operators that access runtime context as `dynamic: true` (e.g., \_state, \_request, \_user)
- Mark non-deterministic operators as `dynamic: true` (e.g., \_random, \_uuid, \_date.now)
- Mark pure/static operators as `dynamic: false` (e.g., \_if, \_and, \_math.add)
