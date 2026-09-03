---
'@lowdefy/operators-js': major
'@lowdefy/engine': major
---

`required` now fails on empty strings and empty arrays.

A field with `required` fails validation when its value is empty, where empty means `null`, `undefined`, `''` or `[]`. `0`, `false` and `{}` are values and still pass. Previously only `null` and `undefined` failed, so a cleared `TextInput` (`''`), a reset `Selector` (`''`) or an untouched multi-select (`[]`) passed `required` silently.

Migration: a form field that deliberately accepts an empty string or an empty array must drop `required` and use an explicit `validate` test instead, for example:

```yaml
- id: notes
  type: TextInput
  validate:
    - message: Notes must be a string.
      pass:
        _type:
          type: string
          key: notes
```

The `_type` operator gains an `empty` test — `_type: empty` is `true` for `null`, `undefined`, `''` and `[]`, and `false` for `0`, `false` and `{}`. It can be used anywhere operators run, including `visible`, `skip` and `_if`. The implicit `required` validation is now `pass: { _not: { _type: empty } }`.
