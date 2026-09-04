# _var

```
(key: string): any
(arguments: {
  key: string,
  default?: any,
}): any
```

The `_var` operator gets a value from the `vars` object, specified by a [`_ref`](/ref) operator when referencing a file.

> The `_var` operator is a build time operator: it is evaluated when the app configuration is being built. This means it is not evaluated dynamically as the app is running, and can be used anywhere in the configuration as long as the resulting configuration files are valid YAML.

> The string form `_var: key` requires the var to be supplied by the `_ref` that loads the file. To read a var that may not be supplied, write the object form with a `default`: `_var: { key: key, default: null }`.

> For module-level variables (passed by the app developer in `lowdefy.yaml` `modules[].vars`), use [`_module.var`](/_module) instead. `_module.var` works at any depth within module files without threading vars through each `_ref`.

#### Arguments

###### string
If the `_var` operator is called with a string argument, the value of the key in the `vars` object is returned. The string form **requires** the var: if the `_ref` that loaded the file did not supply the key, the build fails with an error naming the var, the file that reads it, and the `_ref` that should have supplied it. Use the object form with a `default` to make a var optional. A var supplied as `null` counts as supplied and does not fail the build. Dot notation is supported. A dot is always a separator unless it is escaped with `\.`, which makes it a literal character in the key — `a\.b` reads the key `a.b`; inside a double-quoted YAML string the escape must be written `\\.`. On an unescaped path each segment is tried as a plain key first, and a plain key that is present always wins: a nested `a.b.c` shadows a literal `a.b` key, and a present `a` blocks the literal key even when it holds a string or number rather than an object. A literal dotted key is only reached where the plain key is absent, so escape it to address one reliably. Reserved key names such as `__proto__` and `constructor` are rejected as a config error, failing the build.

###### object
  - `key: string`: The value of the key in the `vars` object is returned. If the value is not found, the `default` value is returned. Dot notation is supported. A dot is always a separator unless it is escaped with `\.`, which makes it a literal character in the key — `a\.b` reads the key `a.b`; inside a double-quoted YAML string the escape must be written `\\.`. On an unescaped path each segment is tried as a plain key first, and a plain key that is present always wins: a nested `a.b.c` shadows a literal `a.b` key, and a present `a` blocks the literal key even when it holds a string or number rather than an object. A literal dotted key is only reached where the plain key is absent, so escape it to address one reliably. Reserved key names such as `__proto__` and `constructor` are rejected as a config error, failing the build.
  - `default: any`: A value to return if the `key` is not found in `vars`. Writing a `default` is what makes a var optional — including `default: null`, which returns `null` for an unsupplied var. Without a `default` key the object form behaves like the string form and the build fails when the var is not supplied.

#### Examples

###### Using a standardized input label template:
```yaml
blocks:
  - id: name
    type: TextInput
    properties:
      label:
        _ref:
          path: label.yaml
          vars:
            title: Name
            description: Your name and surname.
            labelAlign: right
  - id: age
    type: NumberInput
    properties:
      label:
        _ref:
          path: label.yaml
          vars:
            title: Age
            description: Your age.
```
```yaml
# label.yaml
title:
  _var: title
extra:
  _var: description
span: 8
colon: false
align:
  _var:
    key: labelAlign
    default: left
```
Returns:
```yaml
blocks:
  - id: name
    type: TextInput
    properties:
      label:
        title: Name
        extra: Your name and surname.
        span: 8
        colon: false
        align: right
  - id: age
    type: NumberInput
    properties:
      label:
        title: Age
        extra: Your age.
        span: 8
        colon: false
        align: left
```
