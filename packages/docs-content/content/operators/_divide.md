# _divide

```
([numerator: number, denominator: number]): number
```

The `_divide` operator divides two numbers. It takes an array of two numbers as input and returns the first number divided by the second. Dividing by zero will throw an error.

> This operator can be used as a [`_build`](/_build) operator method.

#### Arguments

###### array
An array of two numbers.

#### Examples

###### Divide two numbers:
```yaml
_divide:
  - 12
  - 4
```
Returns: `3`

###### Cannot divide by zero:
```yaml
_divide:
  - 1
  - 0
```
Returns: `null` and throws a operator error.
