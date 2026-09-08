# _ne

```
([value1: any, value2: any]): boolean
```

The `_ne` operator tests if two values are not equal. It takes an array of two values to test.

> The `_ne` won't do a deep comparison.

> This operator can be used as a [`_build`](/_build) operator method.

#### Arguments

###### array
An array of two values to compare.

#### Examples

###### Two non-equal strings:

```yaml
_ne:
  - "Hello"
  - "Hello you"
```
Returns: `true`

###### Two equal strings:

```yaml
_ne:
  - "Hello"
  - "Hello"
```
Returns: `false`

###### Two numbers:
```yaml
_ne:
  - _sum:
      - 3
      - 4
  - 8
```
Returns: `true`

###### Arrays are not compared deeply:
```yaml
_ne:
  - [1,2,3]
  - [1,2,3]
```
Returns: `true`

###### Values from "getter" operators are copies and not equal:
```yaml
_ne:
  - _state: my_object
  - _state: my_object
```
Returns: `true`
