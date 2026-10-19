# _or

```
(values: any[]): boolean
```

The `_or` operator performs a logical `or` over an array of inputs, using javascript [truthy](https://developer.mozilla.org/en-US/docs/Glossary/Truthy) and [falsy](https://developer.mozilla.org/en-US/docs/Glossary/Falsy) rules.

It returns true if any of the values in the array are truthy (not `false`, `0`, `null`, `undefined`, or the empty string `""`). If all the values are falsy, it returns `false`.

> This operator can be used as a [`_build`](/_build) operator method.

#### Arguments

###### array
An array of values over which to perform a logical or.

#### Examples

###### `true` and `false` values:
```yaml
_or:
  - true
  - false
```
Returns: `true`

###### Array of `true` and `false` values:
```yaml
_or:
  - true
  - false
  - false
  - false
```
Returns: `true`

###### Falsy values values:
```yaml
_or:
  - null
  - 0
  - ''
```
Returns: `false`

###### Truthy values:
```yaml
_or:
  - false
  - "Hello"
```
Returns: `true`

```yaml
_or:
  - false
  - 99
```
Returns: `true`

```yaml
_or:
  - false
  - [1,2,3]
```
Returns: `true`
