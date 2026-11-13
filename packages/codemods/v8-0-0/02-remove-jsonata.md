# Migration: Replace `_jsonata` with `_js`

## Context

**Lowdefy 8 removes the `_jsonata` operator and its package, `@lowdefy/operators-jsonata`.** The
package is no longer published or installed by default. JSONata 2 evaluates expressions
asynchronously, and Lowdefy operators run synchronously, so the operator could not move to the
supported JSONata release. `_js` does the same work in plain JavaScript.

An app that still uses `_jsonata` **builds without an error.** The Lowdefy 8 build logs a warning
at the config location of each use:

```
Operator type "_jsonata" was used but is not defined. Did you mean "_json"?
```

The `_json` suggestion is a near-spelling match, not a replacement; ignore it. At runtime the
`_jsonata` object is not evaluated: Lowdefy leaves an unknown operator in place as plain data, so
the block property, request property or action param receives the object
`{ _jsonata: { on: …, expr: … } }` instead of the result. Pages render wrong values and requests
send wrong data, with no error. Treat every `_jsonata` warning as a broken expression.

This migration finds every `_jsonata` use and rewrites it to `_js` with JavaScript that returns the
same value. An app that never used `_jsonata` has nothing to change; step 1 finds nothing.

## The Forms of `_jsonata`

`_jsonata` ran on the client (pages, events, action params) and on the server (requests,
connections, endpoints, API routines). It had no build-time form (`_build.jsonata` never existed).
It took the same arguments in three spellings:

```yaml
# Object form
_jsonata:
  on: <data>
  expr: <JSONata expression string>
  bindings: <object, optional>

# Positional form: [on, expr, bindings]
_jsonata:
  - <data>
  - <expression>
  - <bindings, optional>

# Method form, same as the object or positional form
_jsonata.evaluate:
  on: <data>
  expr: <expression>
```

How it evaluated, which the JavaScript must reproduce:

- `on: null` (or `on` missing) evaluated against `{}`.
- `bindings`, when it was an object, was **shallow-merged over `on`**: `{ ...on, ...bindings }`.
  Binding keys were read as plain fields (`price * taxRate`), not as `$` variables, and a binding
  replaced a field of `on` with the same name.
- A result that JSONata returned as a _sequence_ (an array built by a path that maps over an array,
  such as `users.name`) was converted to a plain array. JSONata collapses sequences first, so a
  path that matches **one** value returns that value, not a one-item array, and a path that matches
  **nothing** returns `undefined`. See [Sequences and single matches](#sequences-and-single-matches).
- Errors in the expression threw `JSONata evaluation error.` Errors in `_js` throw
  `_js function execution error.`

## What to Do

Skip `node_modules/`, `.lowdefy/`, `.git/` and build output folders in every step.

### 1. Find every use

```
grep -rnE '_jsonata|operators-jsonata|\bjsonata\b' \
  --include='*.yaml' --include='*.yml' --include='*.njk' --include='*.json' --include='*.js' \
  --include='*.mjs' --exclude-dir=node_modules --exclude-dir=.lowdefy .
```

Look in YAML and JSON config, Nunjucks templates (`.njk`, `.yaml.njk`, which may not parse as
YAML), files pulled in with `_ref`, module config, and local plugin code. Note for each use which
form it takes and whether it runs on the client or the server (a request, endpoint or connection
is server; anything on a page is client).

`_jsonata` can also be named as data rather than called:

- `_operator` with `name: _jsonata`, and `_jsonata` in an `_operator` `operators:` list;
- `_jsonata` in a Dynamic block policy's `operators` list (`properties.types.operators`);
- `@lowdefy/operators-jsonata` in `plugins` in `lowdefy.yaml`, or in a `package.json`.

### 2. Remove the package

If `@lowdefy/operators-jsonata` is listed in `plugins` (in `lowdefy.yaml` or a file it `_ref`s),
remove the entry. It was a default package, so most apps never listed it. Remove it from
`dependencies` in any `package.json` in the app too, with the package manager
(`pnpm remove @lowdefy/operators-jsonata`) rather than by editing a lock file.

A local plugin that imports the `jsonata` npm package directly is not affected by this removal if
it declares `jsonata` as its own dependency. Leave it and list it in the report.

### 3. Rewrite each use to `_js`

Use the object form of `_js`. Pass the data in `args`, whose values Lowdefy evaluates before the
function runs, exactly as it evaluated `on` and `bindings`, so `_state`, `_request`, `_payload`,
`_step` and the rest carry over unchanged:

```yaml
# Before
_jsonata:
  on: <data>
  expr: <expression>
  bindings: <bindings>
# After
_js:
  fn: |
    const data = { ...(args.on ?? {}), ...args.bindings };
    return <the expression in JavaScript, reading data>;
  args:
    on: <data>
    bindings: <bindings>
```

Simplify where it is safe: with no `bindings`, drop the merge (`const data = args.on ?? {};`);
when `on` is an object literal, pass its fields as `args` directly and read `args.<field>`. Keep
the `on` and `bindings` values exactly as they were, operators included. Convert the positional
and method forms the same way.

Write the JavaScript by hand, one expression at a time, from the rules below. Keep the YAML
indentation and quoting around the block intact. `_js` reads the clock or randomness as the
expression did: the build sees `Date.now()`, `new Date()` and `Math.random()` in the function and
re-evaluates it on every pass, as `_jsonata` did for `$now()`, `$millis()` and `$random()`.

#### Paths and missing values

JSONata never throws on a missing field; the path yields nothing. Use optional chaining and keep
`undefined` as the result where JSONata gave nothing.

| JSONata                                 | JavaScript                                                   |
| --------------------------------------- | ------------------------------------------------------------ |
| `user.address.city`                     | `data.user?.address?.city`                                   |
| `$` (the input)                         | `data`                                                       |
| `$$` (the root input)                   | `data`                                                       |
| `users.name`                            | `(data.users ?? []).map((u) => u?.name)` + sequence rule     |
| `orders.items.price`                    | `.flatMap` through each level, dropping `undefined` values   |
| `items[0]`, `items[-1]`                 | `data.items?.[0]`, `data.items?.at(-1)`                      |
| `items[$ > 3]`                          | `(data.items ?? []).filter((x) => x > 3)` + sequence rule    |
| `users[age > 20].name`                  | `.filter((u) => u.age > 20).map((u) => u.name)` + sequence   |
| `[users.name]`, `users.name[]`          | always an array: no sequence rule                            |
| `orders.{ "id": id }`                   | `.map((o) => ({ id: o.id }))` + sequence rule                |
| `{ "a": x, "b": y }`                    | `({ a: data.x, b: data.y })`                                 |
| `items{ category: $sum(v) }` (group by) | build the object in a loop, keyed by `category`, summing `v` |
| `[1..5]`                                | `Array.from({ length: 5 }, (_, i) => i + 1)`                 |

Mapping over an array skips items where the field is missing; filter out `undefined` after `map`.
Nested arrays along a path are flattened into one list (`o.i.p` over two levels gives one flat
list), so use `flatMap` at each array level.

#### Operators

| JSONata                     | JavaScript                                                                                                                       |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `a & b` (concatenate)       | `` `${a ?? ''}${b ?? ''}` ``: a missing operand is an empty string                                                               |
| `a + b`, `-`, `*`, `/`, `%` | the same, but JSONata gives `undefined` when an operand is missing; JavaScript gives `NaN`. Guard where the input can be missing |
| `=`, `!=`                   | `===`, `!==`                                                                                                                     |
| `and`, `or`                 | `&&`, `\|\|`, with the truthiness rule of `$boolean` below                                                                       |
| `x in [1, 2]`               | `[1, 2].includes(x)`                                                                                                             |
| `c ? a : b`                 | `c ? a : b`                                                                                                                      |
| `$v := expr; …`             | `const v = …;`                                                                                                                   |
| `function($x) { … }`        | `(x) => …`                                                                                                                       |
| `/re/i`                     | `/re/i`                                                                                                                          |
| `a ~> $f(b)`                | `f(a, b)`                                                                                                                        |

#### Functions

| JSONata                                      | JavaScript                                                                                                                                                            |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `$sum(xs)`                                   | `xs.reduce((s, x) => s + x, 0)`                                                                                                                                       |
| `$count(xs)`                                 | `xs.length` (a single value counts 1, nothing counts 0)                                                                                                               |
| `$max(xs)`, `$min(xs)`                       | `Math.max(...xs)`, `Math.min(...xs)`; JSONata returns `undefined` for an empty list                                                                                   |
| `$average(xs)`                               | sum divided by length; `undefined` for an empty list                                                                                                                  |
| `$string(x)`                                 | `String(x)` for primitives, `JSON.stringify(x)` for objects and arrays                                                                                                |
| `$number(x)`                                 | `Number(x)`                                                                                                                                                           |
| `$uppercase`, `$lowercase`                   | `.toUpperCase()`, `.toLowerCase()`                                                                                                                                    |
| `$length(s)`                                 | `s.length`                                                                                                                                                            |
| `$substring(s, start, len)`                  | `s.slice(start, len === undefined ? undefined : start + len)` for `start >= 0`; for a negative `start`, count from the end: `s.slice(s.length + start).slice(0, len)` |
| `$substringBefore/After(s, c)`               | `s.split(c)[0]`, `s.slice(s.indexOf(c) + c.length)` (whole string when `c` is not found)                                                                              |
| `$contains(s, p)`                            | `s.includes(p)` or `p.test(s)` for a regex                                                                                                                            |
| `$split(s, sep)`, `$join(xs, sep)`           | `s.split(sep)`, `xs.join(sep ?? '')`                                                                                                                                  |
| `$replace(s, p, r)`                          | `s.replaceAll(p, r)`: JSONata replaces **every** match. With a regex, add the `g` flag                                                                                |
| `$trim(s)`                                   | `s.trim().replace(/\s+/g, ' ')`: JSONata also collapses inner whitespace                                                                                              |
| `$keys(o)`, `$lookup(o, k)`                  | `Object.keys(o)`, `o[k]`                                                                                                                                              |
| `$merge([a, b])`                             | `Object.assign({}, a, b)`                                                                                                                                             |
| `$exists(x)`                                 | `x !== undefined`                                                                                                                                                     |
| `$boolean(x)`, `$not(x)`                     | JSONata truthiness: `0`, `''`, `[]`, `{}` and an array of only falsy values are false. JavaScript treats `[]` and `{}` as true. Write the test explicitly             |
| `$round(x, n)`                               | JSONata rounds half to even (`$round(2.5)` is `2`, `$round(3.5)` is `4`); `Math.round` rounds half up. Where the difference matters, write a half-to-even helper      |
| `$floor`, `$ceil`, `$abs`, `$sqrt`, `$power` | `Math.floor`, `Math.ceil`, `Math.abs`, `Math.sqrt`, `Math.pow`                                                                                                        |
| `$sort(xs)`, `$sort(xs, fn)`                 | `[...xs].sort(…)` with an explicit comparator                                                                                                                         |
| `$reverse(xs)`, `$distinct(xs)`              | `[...xs].reverse()`, `[...new Set(xs)]` (objects: deduplicate by a key)                                                                                               |
| `$append(a, b)`                              | `[].concat(a ?? [], b ?? [])`                                                                                                                                         |
| `$map`, `$filter`, `$reduce`                 | `.map`, `.filter`, `.reduce`                                                                                                                                          |
| `$each(o, fn)`, `$spread(o)`                 | `Object.entries(o).map(…)`, `Object.entries(o).map(([k, v]) => ({ [k]: v }))`                                                                                         |
| `$now()`, `$millis()`                        | `new Date().toISOString()`, `Date.now()`                                                                                                                              |
| `$fromMillis(ms)`, `$toMillis(s)`            | `new Date(ms).toISOString()`, `Date.parse(s)`                                                                                                                         |
| `$random()`                                  | `Math.random()`                                                                                                                                                       |
| `$type(x)`                                   | `typeof`, with `Array.isArray` and `x === null` checks                                                                                                                |

Picture-string functions (`$formatNumber`, `$formatInteger`, `$formatBase`, `$fromMillis` with a
picture, `$parseInteger`) have no one-line equivalent. Translate them with `Intl.NumberFormat` or
an existing Lowdefy operator (`_intl`, `_dayjs`, passed in through `args`) only when the picture
is simple, and list each one in the report.

#### Sequences and single matches

A path that maps over or filters an array (`users.name`, `items[$ > 3]`, `orders.{ … }`) returned:

| Matches     | `_jsonata` returned          |
| ----------- | ---------------------------- |
| none        | `undefined`                  |
| one         | the value itself, not a list |
| two or more | a plain array                |

`[ … ]` around the expression, or `[]` after a path step (`users.name[]`), forced an array in
every case. An array stored in the input and read by name (`items` where `items: [1]`) was returned
as it is.

For each path result, decide what the config that consumes it needs:

- **It expects a list** (a List block, a Selector's `options`, `_array` methods, a request that
  inserts many documents). Return the array from `map`/`filter` as it is. The one-match case used
  to give a bare value here, so this fixes a latent bug; note it in the report.
- **It expects one value** (the expression picks one item, such as `users[id = 5].name`). Return
  `.find(…)` or `[0]` of the filtered list.
- **It cannot be told from the config.** Keep the exact behaviour with a helper:

  ```js
  function sequence(values) {
    const found = values.filter((value) => value !== undefined);
    if (found.length === 0) return undefined;
    if (found.length === 1) return found[0];
    return found;
  }
  return sequence((data.users ?? []).map((user) => user?.name));
  ```

  and list the use in the report so the author can simplify it.

#### Names held as data

- `_operator` with `name: _jsonata`: `_js` takes different params, so rewrite the call to a
  direct `_js` where the name is a literal. Where the name is chosen at runtime, leave it and list
  it in the report. In `_operator` `operators:` lists and Dynamic block policy `operators` lists,
  replace `_jsonata` with `_js` only where the config now calls `_js` through them; otherwise
  remove the entry.

### 4. Report what needs a human

Do not change data. Produce a report with:

1. **Expressions not translated.** Each `_jsonata` use left as it is (file and line, the
   expression) and why: picture-string formatting, `%` parent or `@`/`#` binding steps, a regex
   or function definition that does not translate cleanly, or an expression too long to check by
   reading. Each still logs the build warning and passes through unevaluated at runtime.
2. **Behaviour changes.** Each translation where the result can differ from JSONata for some
   input: a sequence result now always an array (or always one value), `$round` now rounding half
   up, `$boolean` truthiness of empty arrays and objects, arithmetic on a missing value now giving
   `NaN`.
3. **Uses kept exact with the `sequence` helper**, for the author to simplify.
4. **Expressions read from data.** A `_jsonata` whose `expr` came from `_state`, `_request`,
   `_payload` or another runtime source cannot be translated here; the expression text is data.
   List it; the feature needs redesign (a fixed set of `_js` functions chosen by name, or a custom
   operator plugin that bundles a JSONata 1.x evaluator).
5. **Local plugins that import `jsonata`** directly, unchanged.
6. **Totals:** files changed, uses rewritten (client and server), uses left for review, and
   whether `@lowdefy/operators-jsonata` was removed from `plugins` or `package.json`.

## Examples

### Before

```yaml
pages:
  - id: orders
    type: Box
    blocks:
      - id: summary
        type: Paragraph
        properties:
          content:
            _jsonata:
              on:
                user:
                  _user: true
                orders:
                  _request: get_orders
              expr: |
                user.name & " has spent " & $string($sum(orders.total))
      - id: order_list
        type: List
        properties:
          data:
            _jsonata:
              - _request: get_orders
              - $[status = "open"].{ "id": _id, "label": "Order " & number }
      - id: total_with_tax
        type: Paragraph
        properties:
          content:
            _jsonata:
              on:
                price:
                  _state: price
              expr: price * taxRate
              bindings:
                taxRate: 1.15
```

### After

```yaml
pages:
  - id: orders
    type: Box
    blocks:
      - id: summary
        type: Paragraph
        properties:
          content:
            _js:
              fn: |
                const { user, orders } = args;
                const total = (orders ?? []).reduce((sum, order) => sum + (order?.total ?? 0), 0);
                return `${user?.name ?? ''} has spent ${total}`;
              args:
                user:
                  _user: true
                orders:
                  _request: get_orders
      - id: order_list
        type: List
        properties:
          data:
            _js:
              fn: |
                return (args.orders ?? [])
                  .filter((order) => order.status === 'open')
                  .map((order) => ({ id: order._id, label: `Order ${order.number ?? ''}` }));
              args:
                orders:
                  _request: get_orders
      - id: total_with_tax
        type: Paragraph
        properties:
          content:
            _js:
              fn: |
                return args.price * args.taxRate;
              args:
                price:
                  _state: price
                taxRate: 1.15
```

In the report: `order_list` under behaviour changes, because one open order used to give a bare
object and now gives a one-item list, which is what a List block needs. `total_with_tax` gives
`NaN` instead of nothing while `price` is unset; it is listed under behaviour changes too.

## Verification

1. No `_jsonata` remains, apart from uses listed in the report as not translated:

   ```
   grep -rnE '_jsonata|operators-jsonata' \
     --include='*.yaml' --include='*.yml' --include='*.njk' --include='*.json' --include='*.js' \
     --exclude-dir=node_modules --exclude-dir=.lowdefy .
   ```

2. Run `lowdefy build`. It must log no `Operator type "_jsonata" was used but is not defined.`
   warning. This warning does not fail the build, so read the build output for it rather than
   relying on the exit code.

   `lowdefy upgrade` sets `lowdefy:` in `lowdefy.yaml` to the new version only after the last step
   of this phase, so until then `lowdefy build` builds with the app's Lowdefy 7 version, where
   `_jsonata` still exists and logs nothing. The grep in step 1 is the check until then.

3. Where the app has a dev server running, open the pages that used `_jsonata` and compare the
   rendered values with the Lowdefy 7 app, especially lists that can have one item.
