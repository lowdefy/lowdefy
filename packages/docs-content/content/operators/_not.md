# _not

```
(value: any): boolean
```

The `_not` operator returns the logical negation of the input. If the value is not a boolean, it will be converted to a boolean using javascript [truthy](https://developer.mozilla.org/en-US/docs/Glossary/Truthy) and [falsy](https://developer.mozilla.org/en-US/docs/Glossary/Falsy) rules.

> This operator can be used as a [`_build`](/_build) operator method.

#### Arguments

###### any

#### Examples

###### Not `true` is `false`:
```yaml
_not: true
```
Returns: `false`

###### Return `true` for a falsy value:
```yaml
_not: null
```
Returns: `true`

###### Return `false` for a truthy value:
```yaml
_not: 100
```
Returns: `false`
