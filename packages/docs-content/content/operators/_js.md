# _js

> This operator is experimental and may change in future versions.

```
(function: string): any
(function: { fn: string, args?: object }): any
(function: { fn: './path/to/module.js#exportName', args?: object }): any
```

The `_js` operator enables the use of custom JavaScript logic within Lowdefy configuration where operators are evaluated. The purpose of this operator is to facilitate quick implementation of fast, synchronous functions. Like other operators, these functions are evaluated during page render, thus slow functions can impact app performance.
For more advanced logic, or when the use of external dependencies is necessary, instead develop a [custom plugin](/plugins-introduction).

#### Bodies are checked at build
Every `_js` body is parsed and name-checked when the app builds, so a typo is a build error rather than a `ReferenceError` at the user's click. A body may only reference its own declarations, the parameters of the prototype it runs with, and the JavaScript standard library:

  - A reference to any other name is a **build error** - for example `unlinked` in `const unlinkedRec = state('rec'); return unlinked.stamp;`.
  - A declaration that is never used (a `const`, `let`, or `function` the body never reads) is a **build warning**.
  - A body that does not parse is a **build error** naming the line of the syntax error.

Which prototype a body gets depends on where it sits in the config. Bodies inside `blocks`, `events`, and other page config run on the client; bodies inside `requests`, `api`, and `connections` run on the server, where browser globals such as `document` and `window` do not exist and are reported as undefined.

| Client bodies | Server bodies |
|---------------|---------------|
| `actions`, `args`, `event`, `input`, `location`, `lowdefyApp`, `lowdefyGlobal`, `request`, `state`, `urlQuery`, `user` | `args`, `item`, `lowdefyApp`, `payload`, `secret`, `state`, `step`, `user` |

If a body must reference a name the check cannot see (for example a global injected by a custom script), suppress the check with `~ignoreBuildChecks: [js-lint]` on the operator or any parent object. See [Lowdefy Schema](/lowdefy-schema) for how `~ignoreBuildChecks` cascades.

#### JavaScript modules
Instead of a function body, `fn` can name an exported function in a real JavaScript file. A `fn` string that starts with `./` or `../` is a module reference and must have the shape `<relative path to a .js file>#<exportName>` (or `#default`):

```yaml
rows:
  _js:
    fn: ./lib/answer-detail.js#buildRows
    args:
      docs:
        _request: get_docs
```

```js
// lib/answer-detail.js
import { esc } from './esc.js';

export function buildRows({ args }) {
  return args.docs.map((doc) => `<li>${esc(doc.title)}</li>`).join('');
}
```

The file is an ordinary ES module: it can `import` shared helpers, be unit-tested with your test runner, be linted by your own ESLint setup, and your editor's go-to-definition works on it. Only the object form supports module references - a string-form `_js` is always source text.

**Path resolution.** The path resolves relative to the **config file that contains the `_js` node**, the way every JavaScript toolchain resolves an import - so a config file can be moved together with its `lib/` directory. This deliberately differs from `_ref`, whose paths resolve from the config root. The module must live inside the config directory.

**Same prototype.** The exported function is called exactly like an inline body: one destructured object with the client prototype (`{ actions, args, event, input, location, lowdefyApp, lowdefyGlobal, request, state, urlQuery, user }`) or the server prototype (`{ args, item, lowdefyApp, payload, secret, state, step, user }`), depending on where the `_js` sits in the config. `args` carries the resolved `args` values.

**Checked at build.** The build reports a missing file, a file that does not parse, a missing export (listing the exports it found, with a "Did you mean" hint) and a malformed reference as errors under the `js-modules` check. A module that re-exports with `export * from` must be referenced through an explicitly named export so the build can verify it.

**How it runs.** The client-side module is bundled by Vite together with the app, and in `lowdefy dev` an edit to the file hot-reloads in the browser without a restart. A server-side module is imported directly by the server; in `lowdefy dev` an edit restarts the dev server. `lowdefy build` copies every referenced module, together with the files it imports with relative paths, into the server directory, so the built server runs without the config directory present. Packages a module imports by name must be dependencies the server can resolve.

**Tailwind.** Class strings inside a referenced module are not scanned for Tailwind candidates - the scan sees config strings only. Put Tailwind classes in block `properties` or `class` in the config.

#### Using Lowdefy operators in JavaScript
Certain Lowdefy operators can be used inside of the JavaScript function block. These operators are available as functions and will take their standard arguments.

###### Client JavaScript function prototype:
_Function parameters passed to the operator method._
```js
function ({ actions, args, event, input, location, lowdefyApp, lowdefyGlobal, request, state, urlQuery, user }) {
  // Your JavaScript code here
};
```

The function arguments available to the JavaScript function are:
  - `actions: function`: Implements the [_actions](/_actions) operator.
  - `args: object`: Pre-resolved values passed via the object form of `_js` (see below). `undefined` when the string form is used.
  - `event: function`: Implements the [_event](/_event) operator.
  - `input: function`: Implements the [_input](/_input) operator.
  - `location: function`: Implements the [_location](/_location) operator.
  - `lowdefyApp: function`: Implements the [_app](/_app) operator.
  - `lowdefyGlobal: function`: Implements the [_global](/_global) operator.
  - `request: function`: Implements the [_request](/_request) operator.
  - `state: function`: Implements the [_state](/_state) operator.
  - `urlQuery: function`: Implements the [_url_query](/_url_query) operator.
  - `user: function`: Implements the [_user](/_user) operator.

###### Server JavaScript function prototype:
_Function parameters passed to the operator method._
```js
function ({ args, item, lowdefyApp, payload, secret, state, step, user }) {
  // Your JavaScript code here
};
```

The function arguments available to the JavaScript function are
  - `args: object`: Pre-resolved values passed via the object form of `_js` (see below). `undefined` when the string form is used.
  - `item: function`: Implements the [_item](/_item) operator.
  - `lowdefyApp: function`: Implements the [_app](/_app) operator.
  - `payload: function`: Implements the [_payload](/_payload) operator.
  - `secret: function`: Implements the [_secret](/_secret) operator.
  - `state: function`: Implements the [_state](/_state) operator.
  - `step: function`: Implements the [_step](/_step) operator.
  - `user: function`: Implements the [_user](/_user) operator.

#### Passing pre-computed values with `args`
The object form of `_js` accepts an `args` object whose values are resolved by the parser **before** the JavaScript function runs. This lets you compute values using any Lowdefy operator (`_state`, `_request`, `_user`, etc.) and consume them inside the function without calling operator methods from JavaScript.

#### Arguments

###### string
The JavaScript function body, including the function return statement, excluding the function prototype.

###### object
An object with the following properties:
  - `fn: string`: The JavaScript function body (same as the string form), or a module reference `./path/to/module.js#exportName` naming an exported function in a JavaScript file (see "JavaScript modules" above).
  - `args: object`: (optional) Values to inject into the function. Each value is evaluated as a normal Lowdefy expression and made available inside `fn` on the `args` object.

#### Examples

###### Perform a calculation:
```js
_js: |
  let x = state('input_1');
  let y = state('input_2');
  return x + y;
```

###### Create custom logic based on data from a request:
```js
_js: |
  const products = request('get_products').data?.products ?? [];
  const laptopsWithRatingGreaterThan4 = products.filter(product =>
      product.category === "laptops" && product.rating > 4
  );
  if (laptopsWithRatingGreaterThan4.length > 3) {
      return true;
  }
  return false;
```

###### Chain array methods on request data:
```js
_js: |
  const products = request('get_products').data?.products ?? [];
  const totalPriceOfPhones = products
      .filter(product => product.category === "smartphones")
      .reduce((acc, product) => acc + product.price, 0);
  return totalPriceOfPhones;
```

###### Pass pre-computed values with `args`:
```yaml
_js:
  fn: |
    const { products, target } = args;
    return products
        .filter(p => p.category === target)
        .reduce((a, p) => a + p.price, 0);
  args:
    products:
      _request: get_products.data.products
    target: smartphones
```

###### Reference an exported function in a JavaScript module:
```yaml
_js:
  fn: ./lib/pricing.js#totalForCategory
  args:
    products:
      _request: get_products.data.products
    target: smartphones
```
```js
// lib/pricing.js
export function totalForCategory({ args }) {
  return args.products
    .filter((p) => p.category === args.target)
    .reduce((a, p) => a + p.price, 0);
}
```
