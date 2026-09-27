---
'@lowdefy/build': major
'@lowdefy/operators-js': minor
'@lowdefy/docs': patch
'@lowdefy/docs-content': patch
---

feat(build)!: `_operator` with a name chosen at runtime lists the operators it may call.

**Breaking:** an `_operator` whose `name` is read at runtime (from state, a request, a payload or `__args`) now fails the build unless it lists the operators it may call in `operators`:

```yaml
_operator:
  name:
    _state: aggregation
  operators:
    - _sum
    - _product
  params:
    _state: values
```

The build bundles exactly the listed operators with the page (or the server), so the call works on a direct page load in production as it does in development, and `_operator` refuses any name not in the list. A listed operator allows all its methods; a listed method (`_number.round`) allows only that method. A literal `name`, and the literal branches an `_if` or `_switch` returns, need no list.
