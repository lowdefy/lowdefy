# _boolean

```
(value: any): boolean
```

The `_boolean` operator coerces the input to a boolean using javascript [truthy](https://developer.mozilla.org/en-US/docs/Glossary/Truthy) and [falsy](https://developer.mozilla.org/en-US/docs/Glossary/Falsy) rules. It is equivalent to a double negation (`_not` of `_not`), or the javascript `!!value` expression.

> This operator can be used as a [`_build`](/_build) operator method.

#### Arguments

###### any

#### Examples

###### Coerce a truthy value to `true`:
```yaml
_boolean: 100
```
Returns: `true`

###### Coerce a falsy value to `false`:
```yaml
_boolean: null
```
Returns: `false`

###### Coerce an empty string to `false`:
```yaml
_boolean: ''
```
Returns: `false`
