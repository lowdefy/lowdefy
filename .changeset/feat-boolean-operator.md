---
'@lowdefy/operators-js': minor
---

feat: Add `_boolean` operator.

A new operator `_boolean` coerces any value to its boolean truthiness,
equivalent to the `_not` of `_not` pattern or the JavaScript `!!value`
expression. It works on the client, server, and at build time, and
joins the existing type-cast operator family (`_number`, `_string`,
`_array`, `_object`).

See the `_boolean` operator reference for examples.
