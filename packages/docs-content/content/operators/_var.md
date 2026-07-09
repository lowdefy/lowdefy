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

> For module-level variables (passed by the app developer in `lowdefy.yaml` `modules[].vars`), use [`_module.var`](/_module) instead. `_module.var` works at any depth within module files without threading vars through each `_ref`.

#### Arguments

###### string
If the `_var` operator is called with a string argument, the value of the key in the `vars` object is returned. If the value is not found, `null` is returned. Dot notation is supported.

###### object
  - `key: string`: The value of the key in the `vars` object is returned. If the value is not found, `null`, or the specified default value is returned. Dot notation is supported.
  - `default: any`: A value to return if the `key` is not found in `vars`. By default, `null` is returned if a value is not found.

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
            descriptionTextColor: '#546358'
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
extraStyle:
  color:
    _var:
      key: descriptionTextColor
      default: '#333333'
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
        extraStyle:
          color: '#546358'
  - id: age
    type: NumberInput
    properties:
      label:
        title: Age
        extra: Your age.
        span: 8
        colon: false
        extraStyle:
          color: '#333333'
```
