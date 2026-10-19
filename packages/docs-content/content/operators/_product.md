# _product

```
(values: any[]): number
```

The `_product` operator takes the product of the values given as input. If a value is not a number, the value is skipped.

> This operator can be used as a [`_build`](/_build) operator method.

#### Arguments

###### array
An array of values to multiply.

#### Examples

###### Two numbers:
```yaml
_product:
  - 3
  - 4
```
Returns: `12`

###### Array of numbers:
```yaml
_product:
  - 1
  - 2
  - 3
  - 4
```
Returns: `24`

###### Non-numbers are skipped:
```yaml
_product:
  - 1
  - null
  - 3
  - "four"
  - 5
```
Returns: `15`
