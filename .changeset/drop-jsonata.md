---
'@lowdefy/build': major
'@lowdefy/shell': major
'@lowdefy/codemods': minor
---

feat!: Remove the _jsonata operator

`@lowdefy/operators-jsonata` and its `_jsonata` operator are no longer published or installed by default, on the web or in the native shell. JSONata 2 evaluates expressions asynchronously, and Lowdefy operators run synchronously, so the operator could not move off JSONata 1.8. Use `_js` instead.

An app that still uses `_jsonata` builds, in dev and prod, with a warning at the config location of each use:

```
Operator type "_jsonata" was used but is not defined. Did you mean "_json"?
```

The `_json` suggestion is a near-spelling match, not a replacement. At runtime the `_jsonata` object is not evaluated: Lowdefy leaves an unknown operator in place as plain data, so the property receives the `{ _jsonata: … }` object instead of a result. Treat the warning as a broken expression.

To migrate an app, run `lowdefy upgrade`. Its Lowdefy 8 step, `remove-jsonata`, rewrites each `_jsonata` use (object, positional and `_jsonata.evaluate` forms, on client and server) to `_js` with equivalent JavaScript, passing `on` and `bindings` through `args`. It handles JSONata's sequence results, where a path that matches one item returns that item rather than a one-item list, removes `@lowdefy/operators-jsonata` from `plugins`, reports what it cannot translate confidently, and finishes with a build. To migrate by hand:

1. Search the config for `_jsonata` and remove `@lowdefy/operators-jsonata` from `plugins` if it is listed.
2. Rewrite each use to the object form of `_js`, passing the `on` data (and `bindings`, merged over it) in `args`:

   ```yaml
   # Before
   _jsonata:
     on:
       _request: get_orders
     expr: $sum(total)
   # After
   _js:
     fn: |
       return (args.orders ?? []).reduce((sum, order) => sum + (order?.total ?? 0), 0);
     args:
       orders:
         _request: get_orders
   ```

3. Check results that come from a path over an array (`users.name`, `items[$ > 3]`): `_jsonata` returned the bare value when one item matched and nothing when none did. Return the array where the config expects a list.
4. Run `lowdefy build` and check its output for the `_jsonata` warning, which does not fail the build.
