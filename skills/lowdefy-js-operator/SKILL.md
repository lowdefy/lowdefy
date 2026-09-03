---
name: lowdefy-js-operator
description: Use when an operator expression gets too deep and a `_js` body is the clearer choice — the client and server prototypes, string vs. `{ fn, args }` form, build-time linting, and when to use an operator instead.
kind: reference
lowdefyVersion: 5.5.1
---

# The _js operator

<!-- generated:reference:start -->
## Reference

What this skill covers, and the call that returns the live version from the running dev server. Read these before writing config - never write a type name or property from memory.

### Docs

`lowdefy_get_doc` by slug (or `GET /lowdefy-docs/content/{slug}`): `operators/_js`, `plugins/plugins-operators`.

### Operators

`lowdefy_get_schema` with kind `operators`: `_js` (`@lowdefy/operators-js`).
<!-- generated:reference:end -->

## Recipe

`_js` is the escape hatch: a synchronous JavaScript function body evaluated wherever operators
are evaluated. Reach for it when an operator expression would need three levels of `_if` and
`_get` to say what one `filter().map()` says. Do not reach for it to fetch data, touch the DOM,
or import anything — it cannot.

**Superseded by:** `lowdefy_eval_operator` runs a `_js` body against the page's real state
before you save it; `lowdefy_build_status` reports the lint findings. Task 34 (`_js` modules)
will retire the "shared helper" part of this recipe — when it lands, shrink this section.

### 1. The two forms

```yaml
# String form: the body only, with its own return.
total:
  _js: |
    const items = state('cart.items') ?? [];
    return items.reduce((sum, item) => sum + item.qty * item.price, 0);

# Object form: pre-resolved args, so operators do the reading and JS does the logic.
total:
  _js:
    fn: |
      return args.items.reduce((sum, item) => sum + item.qty * item.price, 0);
    args:
      items:
        _if_none:
          - _state: cart.items
          - []
```

Prefer the object form. Its `args` are evaluated by the parser with ordinary operators, so the
body is pure — it never calls `state()` or `request()` — and `lowdefy_eval_operator` can test it
with a literal `args`. The string form is fine for a two-line calculation.

### 2. Where a body runs, and what it can see

The same `_js` key runs with a different **prototype** depending on where it sits:

| Where the operator sits                              | Prototype | Functions available on the parameter object                                                                                   |
| ---------------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Block properties, `visible`, `validate`, action params | client    | `actions`, `args`, `event`, `input`, `location`, `lowdefyApp`, `lowdefyGlobal`, `request`, `state`, `urlQuery`, `user`          |
| Request `properties`, connection `properties`, `Api` routine steps | server    | `args`, `item`, `lowdefyApp`, `payload`, `secret`, `state`, `step`, `user`                                                    |

Each function implements the operator of the same name: `state('cart.items')` is
`_state: cart.items`; `request('list_orders')` is `_request: list_orders`; `payload('id')` is
`_payload: id`. Two consequences worth remembering:

- On the server `state()` is the empty object a request sees — a request body that reads
  `state('filters')` gets `undefined`. Send the value through `payload` and read `payload(...)`.
- There is no `_js` at build time. `_ref`, `_var` and other build operators cannot be combined
  with it; a `_js` in `lowdefy.yaml` that tries to compute a menu at build is a runtime value.

The body is a plain function body: it must `return`. It runs synchronously on every render of
the block that owns it, so a body that loops over a 10 000-row response inside a `List` child
runs 10 000 × rows times. Compute once in a parent block or in the request instead.

### 3. Bodies are hashed into generated modules

The build does not ship your string. `packages/build/src/build/buildJs/jsMapParser.js` replaces
every body with a SHA-1 hash and writes the bodies into two generated modules — one for the
client bundle, one for the server — keyed by that hash. The runtime `_js` operator receives the
hash and looks the function up. What follows from this:

- **Identical bodies share one function.** The same text in ten blocks is compiled once; a
  one-character difference is a new function. Keep shared helpers in one `_ref` template with
  `_var` for the parts that differ, so the hash stays identical.
- **Bodies are not data.** `_js` inside a value that only exists at runtime (a body assembled
  with `_string.concat`, a body stored in a database) is never hashed and never runs — the
  operator sees a hash that no module contains. A `_js` body must be a literal string in config.
- **Errors carry the config location.** A body that throws is reported at the block/request that
  owns it, with the body's line number, in `lowdefy_build_status` for lint and in the browser
  console at runtime. Multi-line bodies with `|` keep their lines; folded `>` scalars do not.

### 4. Bodies are linted at build

Since task 17 every body is parsed and name-checked while the js map is built (`js-lint` check):

- A reference to a name that is neither declared in the body, nor a parameter of the prototype
  the body runs with, nor JavaScript's standard library (`Array`, `Math`, `JSON`, `Date`,
  `Intl`, ...) is a **build error**. A server body that reaches for `document` or `window`
  is reported with a hint that it runs on the server; a client body calling `payload()` is the
  mirror image.
- A declared-but-unused `const`, `let` or `function` is a **build warning**.
- A body that does not parse is a **build error** naming the line.
- A body shared by several blocks is reported at every site.

Fix the body, do not suppress the check. `~ignoreBuildChecks: [js-lint]` exists for a body that
legitimately uses a global the linter does not know (a browser API on the client), and nothing
else.

### 5. When to reach for an operator instead

Use an operator when one exists for the whole job — it is declarative, the build can validate
it, `lowdefy_find_config` can trace it, and it needs no lint:

| Reaching for `_js` to…                          | Use instead                                                    |
| ----------------------------------------------- | -------------------------------------------------------------- |
| pick a field or default                         | `_get` with `default`, `_if_none`                              |
| branch on a value                               | `_if`, `_switch`                                               |
| map/filter/find/sort an array                   | `_array.map`, `_array.filter`, `_array.find`, `_array.sort`    |
| format a date                                   | `_dayjs.format`, `_intl.dateTimeFormat`                        |
| format a number or currency                     | `_intl.numberFormat`                                           |
| build a string                                  | `_string.concat`, `_nunjucks`                                  |
| query or reshape objects                        | `_mql.aggregate`, `_jsonata`                                   |
| test a type or emptiness                        | `_type` (`empty`, `none`, `array`, ...)                        |

Use `_js` when the logic is genuinely imperative — a reduce with two accumulators, a lookup that
builds an index then joins, a calculation with intermediate variables — and would take more
YAML to express than lines of JavaScript. Keep bodies under ~20 lines; longer than that belongs
in a request (`MongoDBAggregation`), an `Api` routine step, or a custom operator plugin.

### 6. Verify

1. `lowdefy_build_status` — no `js-lint` errors or unused-variable warnings.
2. `lowdefy_eval_operator` with the `_js` object form and literal `args` for the empty, typical
   and edge inputs; on the server side, `lowdefy_run_request` for a request whose properties
   use `_js`.
3. `lowdefy_inspect_state` after interacting, to confirm the computed value landed where the
   page reads it.

### Checklist

- Object form with `args` resolved by operators; body is pure and returns.
- Body is a literal string in config, written with `|`, under ~20 lines.
- Client body never reads `payload`/`secret`; server body never reads `state`, `document`,
  `window`.
- No `_js` where a single operator does the job (table above).
- `js-lint` clean; `~ignoreBuildChecks: [js-lint]` only for a known-global false positive.
