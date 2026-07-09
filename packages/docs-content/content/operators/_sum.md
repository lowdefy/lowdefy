# _sum

```
(values: any[]): number
```

The `_sum` operator takes the sum of the values given as input. If a value is not a number, the value is skipped.

> This operator can be used as a [`_build`](/_build) operator method.

#### Arguments

#### array
An array of values to add.

#### Examples

###### Two numbers:
```yaml
_sum:
  - 3
  - 4
```
Returns: `7`

###### Array of numbers:
```yaml
_sum:
  - 1
  - 2
  - 3
  - 4
```
Returns: `10`

###### Non-numbers are skipped:
```yaml
_sum:
  - 1
  - null
  - 3
  - "four"
  - 5
```
Returns: `9`
