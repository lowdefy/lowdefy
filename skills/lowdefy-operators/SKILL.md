---
name: lowdefy-operators
description: Use when writing operator expressions — the core operators, argument shapes, nesting, where operators are evaluated, and the mistakes the build now catches.
kind: reference
lowdefyVersion: 5.5.1
---

# Operators

<!-- generated:reference:start -->
## Reference

What this skill covers, and the call that returns the live version from the running dev server. Read these before writing config - never write a type name or property from memory.

### Docs

`lowdefy_get_doc` by slug (or `GET /lowdefy-docs/content/{slug}`): `concepts/operators`, `operators/_if`, `operators/_get`, `operators/_state`, `operators/_eq`, `operators/_and`, `operators/_or`, `operators/_not`, `operators/_switch`, `operators/_array`, `operators/_object`, `operators/_string`.

### Operators

`lowdefy_get_schema` with kind `operators`: `_if` (`@lowdefy/operators-js`), `_get` (`@lowdefy/operators-js`), `_state` (`@lowdefy/operators-js`), `_eq` (`@lowdefy/operators-js`), `_and` (`@lowdefy/operators-js`), `_or` (`@lowdefy/operators-js`), `_not` (`@lowdefy/operators-js`), `_switch` (`@lowdefy/operators-js`), `_array` (`@lowdefy/operators-js`), `_object` (`@lowdefy/operators-js`), `_string` (`@lowdefy/operators-js`).
<!-- generated:reference:end -->

## Recipe

Must cover: operators are evaluated where they sit (page vs. request vs. routine), an unknown operator is a build error, `_get` vs. `_state` dot paths, `_if` shapes, method-style operators (`_array.map`), and `lowdefy_eval_operator` to test an expression.
