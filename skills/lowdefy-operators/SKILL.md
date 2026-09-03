---
name: lowdefy-operators
description: Use when writing operator expressions — the core operators, argument shapes, nesting, where operators are evaluated, and the mistakes the build now catches.
---

# Operators

<!-- generated:reference:start -->
## Reference

Generated from `@lowdefy/docs-content` and the plugin schemas at release time — do not edit by hand. The running dev server has the live versions: `lowdefy_get_doc` for a doc page, `lowdefy_get_schema` for a type, `lowdefy_get_examples` for block yaml.

### Docs

#### Operators

`/lowdefy-docs/content/concepts/operators`

Operators are functions, that can be used to express logic. They are the reason why Lowdefy apps are not completely static, but can react to data and inputs. Operators can be used in `blocks`, `actions`, `requests`, and `connections`. See the specific documentation for more details.

#### _if

`/lowdefy-docs/content/operators/_if`

The `_if` operator returns the `then` argument if it's `test` argument is `true`, and it's `else` argument if it is `false`. Generally other operators are used to evaluate the `test` argument.

#### _get

`/lowdefy-docs/content/operators/_get`

The `_get` operator gets a value from the object or array specified in `from`. If the `key` is not found, the provided `default`, or `null` if not specified, are returned.

#### _state

`/lowdefy-docs/content/operators/_state`

If used in a block, the `_state` operator gets a value from the [`state`](/page-and-app-state) object. The `state` is a data object specific to the page it is in. The value of `input` blocks are available in `state`, with their `blockId` as key.

#### _eq

`/lowdefy-docs/content/operators/_eq`

The `_eq` operator tests if two values are equal. It takes an array of two values to test.

#### _and

`/lowdefy-docs/content/operators/_and`

The `_and` operator performs a logical `and` over an array of inputs, using javascript [truthy](https://developer.mozilla.org/en-US/docs/Glossary/Truthy) and [falsy](https://developer.mozilla.org/en-US/docs/Glossary/Falsy) rules.

#### _or

`/lowdefy-docs/content/operators/_or`

The `_or` operator performs a logical `or` over an array of inputs, using javascript [truthy](https://developer.mozilla.org/en-US/docs/Glossary/Truthy) and [falsy](https://developer.mozilla.org/en-US/docs/Glossary/Falsy) rules.

#### _not

`/lowdefy-docs/content/operators/_not`

The `_not` operator returns the logical negation of the input. If the value is not a boolean, it will be converted to a boolean using javascript [truthy](https://developer.mozilla.org/en-US/docs/Glossary/Truthy) and [falsy](https://developer.mozilla.org/en-US/docs/Glossary/Falsy) rules.

#### _switch

`/lowdefy-docs/content/operators/_switch`

The `_switch` operator evaluates an array of conditions and returns the `then` argument of the first item for which the `if` argument evaluates to `true`. If no condition evaluates to `true`, the value of the `default` argument is returned.

#### _array

`/lowdefy-docs/content/operators/_array`

The `_array` operator can be used to run javascript [`Array`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) methods.

#### _object

`/lowdefy-docs/content/operators/_object`

The `_object` operator can be used to run javascript [`Object`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object) methods.

#### _string

`/lowdefy-docs/content/operators/_string`

The `_string` operator can be used to run javascript [`String`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) methods.

### Operators

Live schema: `lowdefy_get_schema` with kind `operators`.

#### _if

Provided by `@lowdefy/operators-js`.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `test` | boolean | yes |  | Boolean condition to evaluate. |
| `then` | any |  |  | Value returned when test is true. |
| `else` | any |  |  | Value returned when test is false. |

#### _get

Provided by `@lowdefy/operators-js`.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `from` | any | yes |  | Object or array to get value from. |
| `key` | string |  |  | Dot-notation path to the value. |
| `default` | any |  |  | Default value if key does not exist. |
| `all` | boolean |  |  | Return all matching values. |

#### _state

Provided by `@lowdefy/operators-js`.

**Form 1** — string: Dot-notation path to value in state.

**Form 2** — integer: Index to access in state.

**Form 3** — `true`: Return all state.

**Form 4** — object

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `key` | string \\| integer |  |  |  |
| `default` | any |  |  | Default value if key does not exist. |
| `all` | boolean |  |  | Return all state. |

#### _eq

Provided by `@lowdefy/operators-js`.

Accepts array: Array of two values to compare for strict equality.

#### _and

Provided by `@lowdefy/operators-js`.

Accepts array: Array of values. Returns true if all values are truthy.

#### _or

Provided by `@lowdefy/operators-js`.

Accepts array: Array of values. Returns true if any value is truthy.

#### _not

Provided by `@lowdefy/operators-js`.

Accepts boolean: Boolean value to negate.

#### _switch

Provided by `@lowdefy/operators-js`.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `branches` | array | yes |  | Array of conditional branches. |
| `default` | any |  |  | Value returned when no branch matches. |

#### _array

Provided by `@lowdefy/operators-js`.

Accepts any: Array method params. Accepts array positional args or object with named args depending on method.

#### _object

Provided by `@lowdefy/operators-js`.

Accepts any: Object method params. Accepts array positional args or object with named args depending on method.

#### _string

Provided by `@lowdefy/operators-js`.

Accepts any: String method params. Accepts array positional args or object with named args depending on method. The "format" method takes a template string with {0}/{1} positional placeholders (array form) or {name} placeholders (object form: { template, on }).
<!-- generated:reference:end -->

## Recipe

Must cover: operators are evaluated where they sit (page vs. request vs. routine), an unknown operator is a build error, `_get` vs. `_state` dot paths, `_if` shapes, method-style operators (`_array.map`), and `lowdefy_eval_operator` to test an expression.
