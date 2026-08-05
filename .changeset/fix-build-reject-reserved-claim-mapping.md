---
'@lowdefy/build': patch
---

fix(build): Reject reserved names as jwt auth strategy `claimMapping` field names.

At request time the jwt strategy assigns each `claimMapping` field name as a literal key onto a
freshly built `user` or `attributes` object (`plugin-better-auth` `strategies/jwt.js:117,121`). A
reserved name such as `__proto__` or `constructor` — including as a segment of the dotted
`attributes.` form, e.g. `attributes.__proto__` — re-parents that object instead of setting a claim.
A throw from that assignment would surface as an unlocated 500 on every authenticated request, so the
build now rejects the field name where its `configKey` is available: `validateJwtStrategy` splits each
`claimMapping` field on `.` and rejects it if any segment is reserved.

The documented nested-attribute form, a `claimMapping` field of `attributes.a.b` storing the literal
key `'a.b'`, is unaffected — `a.b` is not reserved.

Apps using a reserved name (or dot-path segment) as a jwt strategy `claimMapping` field will now fail
the build. Rename the field.
