---
'@lowdefy/build': minor
'@lowdefy/operators-js': minor
---

feat(\_js): Pass pre-computed values into `_js` via an `args` object.

The `_js` operator now accepts an object form `{ fn, args }` alongside the existing string form. Values in `args` are resolved by the parser — using any Lowdefy operator (`_state`, `_request`, `_user`, nested `_js`, etc.) — before the JavaScript function runs, and are injected as the `args` object inside the function body.

```yaml
_js:
  fn: |
    const { products, target } = args;
    return products
      .filter((p) => p.category === target)
      .reduce((a, p) => a + p.price, 0);
  args:
    products:
      _request: get_products.data.products
    target: smartphones
```

This lets you precompute or normalize values in YAML and keep the JavaScript body focused on computation, rather than mixing operator lookups into the function. The string form continues to work unchanged, and identical `fn` bodies still share a single compiled function at build time — only `args` varies per call.
