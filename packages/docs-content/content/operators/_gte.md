# _gte

```
([value1: any, value2: any]): boolean
```

The `_gte` operator tests if the first value is greater than or equal to the second equal. It takes an array of two values to test.

> The `_gte` operator tests using the javascript greater than or equal operator. You can find a description of the algorithm used to compare two values [here](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Less_than).

> This operator can be used as a [`_build`](/_build) operator method.

#### Arguments

###### array
An array of two values to compare.

#### Examples

###### Two numbers:
```yaml
_gte:
  - 4
  - 3
```
Returns: `true`

```yaml
_gte:
  - 1
  - 1
```
Returns: `true`

```yaml
_gte:
  - _sum:
      - 3
      - 4
  - 8
```
Returns: `false`

###### Two strings:
```yaml
_gte:
  - "a"
  - "b"
```
Returns: `false`
