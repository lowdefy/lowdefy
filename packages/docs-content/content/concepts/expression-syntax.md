# Expression Syntax

Expression syntax is a compact, readable way to write logic that would otherwise be a
deeply nested tree of [operators](/operators). A scalar written as a single `${ … }` is
compiled, at build time, into ordinary operators — so everything you can check about
operators (unknown operators, `_state` references, contracts) is checked about your
expression too. There is no runtime cost: an expression is just a shorter way to write
operators you could have written by hand.

```yaml
# These two are identical after build:
visible: "${ state.answer.source == 'ai' && len(state.evidence_ids) > 0 }"

visible:
  _and:
    - _eq:
        - _state: answer.source
        - ai
    - _gt:
        - _array.length:
            _state: evidence_ids
        - 0
```

> Because `:` and `?` are YAML indicators, wrap an expression in quotes whenever it
> contains them (as you would any YAML scalar). Quoting every `${ … }` is the safe habit.

## When to reach for it

Use an expression for a **condition or a small read** — `visible`, `skip`, a `??`
default, a message chosen by a comparison. For real computation (mapping a request into
rows, date math) use a [`_js`](/_js) module; for markup use the `Template` block.

## Grammar

- **Literals:** numbers (`1`, `-2.5`), strings (`'ai'` or `"ai"`), `true`, `false`, `null`.
- **Roots** (a read from a scope): `state.`, `request.`, `payload.`, `user.`, `event.`,
  `actions.`, `step.`, `item.`, `global.`, `url_query.`, and `var.` (an `_ref` variable).
  Member and index access are part of the path: `state.a.b`, `state.list[0].name`,
  `state['odd.key']`.
- **Comparison:** `==`, `!=`, `<`, `<=`, `>`, `>=`. Comparisons are strict (no type
  coercion) and non-associative — chain with `&&`, not `a == b == c`.
- **Boolean:** `&&`, `||`, `!`. Unlike JavaScript, `&&` and `||` return `true`/`false`,
  not one of their operands — use `??` for a value fallback.
- **Nullish:** `a ?? b` gives `a` unless it is `null`/`undefined`, then `b`. It may not
  be mixed with `&&`/`||` without parentheses: write `(a ?? b) && c`.
- **Ternary:** `condition ? a : b`. The condition must be a boolean expression (a
  comparison or `&&`/`||`/`!`); write `state.name != null ? a : b`, not `state.name ? a : b`.
- **Length:** `x.length` or `len(x)` — the number of items in an array.
- **Functions:** `len(array)`, `has(array, value)` (does the array contain the value),
  `lower(string)` (lower-cased, null-safe).

## Operator mapping

| Expression | Compiles to |
|---|---|
| `state.a.b` | `{ _state: a.b }` |
| `var.name` | `{ _var: name }` |
| `a == b` / `a != b` | `{ _eq: [a, b] }` / `{ _ne: [a, b] }` |
| `a > b` / `>=` / `<` / `<=` | `{ _gt: [a, b] }` / `_gte` / `_lt` / `_lte` |
| `a && b` / `a \|\| b` | `{ _and: [a, b] }` / `{ _or: [a, b] }` |
| `!a` | `{ _not: a }` |
| `a ?? b` | `{ _if_none: [a, b] }` |
| `c ? a : b` | `{ _if: { test: c, then: a, else: b } }` |
| `len(x)` / `x.length` | `{ _array.length: x }` |
| `has(x, v)` | `{ _array.includes: [x, v] }` |
| `lower(s)` | `{ _string.toLowerCase: s }` |

## Escaping and boundaries

- A scalar is an expression only when the **whole** value is a single `${ … }`: the
  `${` is the first non-space character and the `}` that closes it is the last. Every
  other string is the literal it has always been — `"${HOME}/data"`, `"${a} ${b}"` and
  `"text ${x}"` are values, not code, so existing config keeps working. There is no
  interpolation; use `_nunjucks` or `_string.format` for that.
- To write a literal string that *is* a single `${ … }`, double the dollar:
  `"$${ not code }"` becomes the literal `${ not code }`.
- Expressions are **never** compiled in a [`_js`](/_js) body or a
  [`_nunjucks`](/_nunjucks) template — those own their own `${ }` and `{{ }}`. Only the
  body is exempt: `_js.args` and `_nunjucks.on` are ordinary config and do compile.
- Expression syntax is available in YAML config only.

## Errors

A mistake in an expression fails the build with the file, line and column of the
expression and the offending source, for example:

```
pages/home.yaml:12:18
[ConfigError] Expression error: unknown identifier "stat"; expected a root
(state, request, payload, …) … in ${ stat.answer == 'ai' }.
```
