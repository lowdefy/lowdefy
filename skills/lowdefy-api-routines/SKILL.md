---
name: lowdefy-api-routines
description: Use when writing server-side logic as an Api endpoint routine — control flow steps, requests inside a routine, payload schemas, calling it from the page with CallAPI, and exposing it as an MCP tool.
---

# Api endpoint routines

<!-- generated:reference:start -->
## Reference

Generated from `@lowdefy/docs-content` and the plugin schemas at release time — do not edit by hand. The running dev server has the live versions: `lowdefy_get_doc` for a doc page, `lowdefy_get_schema` for a type, `lowdefy_get_examples` for block yaml.

### Docs

#### :if

`/lowdefy-docs/content/controls/if`

The `:if` control executes different routines based on a boolean condition. It evaluates the condition and runs the `:then` branch if true, or the optional `:else` branch if false. Generally other operators are used to evaluate the test.

#### :for

`/lowdefy-docs/content/controls/for`

The `:for` control iterates over an array, executing a routine for each item sequentially. The routine defined by the `:do` key is executed for each item within the array defined by the `:in` key. This routine is executed sequentially for each item in the array. The value of the current array item can be accessed using the [`_item`](/_item) operator with the item key set by the `:for` key. This operator is only available within the `:for` and [`:parallel_for`](/:parallel_for) controls.

#### :try

`/lowdefy-docs/content/controls/try`

If one control in the routine chain defined in the `:try` key fails by throwing an error, the steps in the list following the failed control will not be executed. To handle any errors thrown by a routine element, a routine can be provided using `catch` key. The routine defined using the `:finally` key will be run regardless of whether or not the routine throws an error. A [`:reject`](/:reject) inside the `:try` routine is __not__ caught. `:reject` is the routine's own reply — it stops the routine, returns a `"reject"` status to the caller, and flows past every enclosing `:catch`. `:finally` still runs. Use [`:throw`](/:throw) for failures a `:catch` should handle.

#### :return

`/lowdefy-docs/content/controls/return`

The `:return` control immediately ends the execution of an API endpoint routine and returns a successful response with the specified data. Any routine steps after a `:return` are not executed. The control accepts any value type (objects, arrays, strings, numbers, null) and marks the API call as successful. When used within conditional controls like [`:if`](/:if) or [`:switch`](/:switch), it provides a way to exit early with a success status and return data to the client.

#### :reject

`/lowdefy-docs/content/controls/reject`

The `:reject` control is used to return a user-friendly error to the client when validation fails or business rules are violated. Unlike [`:throw`](/:throw), which indicates a system error, `:reject` represents an expected failure condition that should be communicated to the user. The control immediately stops routine execution and returns with a `"reject"` status. Importantly, `:reject` does not trigger `:catch` blocks in [`:try`](/:try) statements: the reject flows past every enclosing `:try`, so a `:catch` in an outer `:try` never runs either, while `:finally` still runs. This makes `:reject` ideal for handling validation and business logic errors separately from system errors. Choose [`:throw`](/:throw) when a step failed and the routine may recover; choose `:reject` when the routine decided the request cannot be fulfilled.

#### :set_state

`/lowdefy-docs/content/controls/set_state`

The `:set_state` control sets values in the server-side state object during API endpoint execution. It accepts an object where each key-value pair is saved to the state, making data available throughout the routine via the `_state` operator. This server state is isolated to the current API call and does not persist between calls or affect client state. The control supports nested paths using dot notation and can store any data type. A dot is always a separator unless it is escaped with `\.`, which makes it a literal character in the key — `a\.b` sets the key `a.b`; inside a double-quoted YAML string the escape must be written `\\.`. On an unescaped path each segment is tried as a plain key of the state first, and a plain key that is present always wins: with `a` already in state, `a.b` writes `b` inside `a`, and it does so even when `a` holds a string or number, replacing that value with an object. A literal dotted key is only written where the plain key is absent, and once a key matches there is no retry with a longer join — the value is written inside the key that matched, with missing intermediate objects created as needed. Reserved key names such as `__proto__` and `constructor` are rejected as a config error. Values are evaluated before being set, allowing dynamic state updates based on previous operations.

#### CallAPI

`/lowdefy-docs/content/actions/callapi`

The `CallAPI` action invokes a server-side API endpoint defined in your Lowdefy application's configuration. It sends an optional payload to the API and returns the response data, making it a way to execute server-side logic and orchestrate database operations from your Lowdefy pages.

#### _api

`/lowdefy-docs/content/operators/_api`

The `_api` operator returns the response object from an API endpoint that has been called using the [`CallAPI`](/CallAPI) action. This operator is only available on the client side (in pages) and provides access to the full API response object including the response data, loading state, success status, and any errors. If the API endpoint has not yet been called or is still executing, the returned value is `null`. Dot notation is supported for accessing nested properties. A dot is always a separator unless it is escaped with `\.`, which makes it a literal character in the key — `a\.b` reads the key `a.b`; inside a double-quoted YAML string the escape must be written `\\.`. On an unescaped path each segment is tried as a plain key first, and a plain key that is present always wins: a nested `a.b.c` shadows a literal `a.b` key, and a present `a` blocks the literal key even when it holds a string or number rather than an object. A literal dotted key is only reached where the plain key is absent, so escape it to address one reliably. The leading segment of an `_api` path is the endpoint id and is matched exactly, so the rule above applies to the part of the path after it.

#### _step

`/lowdefy-docs/content/operators/_step`

The `_step` operator returns the response value from a previously executed step in an API routine. This operator is only available within API routines and allows later steps to access data from earlier steps. If the step has not yet been executed or is still executing, the returned value is `null`. Dot notation and array indexes are supported for accessing nested properties. A dot is always a separator unless it is escaped with `\.`, which makes it a literal character in the key — `a\.b` reads the key `a.b`; inside a double-quoted YAML string the escape must be written `\\.`. On an unescaped path each segment is tried as a plain key first, and a plain key that is present always wins: a nested `a.b.c` shadows a literal `a.b` key, and a present `a` blocks the literal key even when it holds a string or number rather than an object. A literal dotted key is only reached where the plain key is absent, so escape it to address one reliably.

### Operators

Live schema: `lowdefy_get_schema` with kind `operators`.

#### _api

Provided by `@lowdefy/operators-js`.

Accepts string: Dot-notation path to API response data. First segment is the endpoint name, remaining segments access nested properties.

#### _step

Provided by `@lowdefy/operators-js`.

**Form 1** — string: Dot-notation path to value in steps object.

**Form 2** — integer: Index to access in steps object.

**Form 3** — `true`: Return all steps data.

**Form 4** — object

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `key` | string \\| integer |  |  |  |
| `default` | any |  |  | Default value if key does not exist. |
| `all` | boolean |  |  | Return all steps data. |

#### _payload

Provided by `@lowdefy/operators-js`.

**Form 1** — string: Dot-notation path to value in payload object.

**Form 2** — integer: Index to access in payload object.

**Form 3** — `true`: Return all payload data.

**Form 4** — object

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `key` | string \\| integer |  |  |  |
| `default` | any |  |  | Default value if key does not exist. |
| `all` | boolean |  |  | Return all payload data. |

### Actions

Live schema: `lowdefy_get_schema` with kind `actions`.

#### CallAPI

Provided by `@lowdefy/actions-core`.

Parameters passed to the callAPI method.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `endpointId` | string | yes |  |  |
| `payload` | object |  |  |  |
| `holdValue` | boolean |  |  |  |
<!-- generated:reference:end -->

## Recipe

Must cover: endpoint shape (`id`, `type: Api`, `routine`), a request step reading `_payload`, `_step` to chain results, `:return` vs `:reject`, `payloadSchema` (enforced on every caller), calling with `CallAPI` and reading `_api`, and the `mcp.endpoints` exposure rules.
