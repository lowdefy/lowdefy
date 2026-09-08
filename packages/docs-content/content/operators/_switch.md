# _switch

```
(arguments: {branches: {if: boolean, then: any}[], default: any}): any
```

The `_switch` operator evaluates an array of conditions and returns the `then` argument of the first item for which the `if` argument evaluates to `true`. If no condition evaluates to `true`, the value of the `default` argument is returned.

> This operator can be used as a [`_build`](/_build) operator method.

#### Arguments

###### object
  - `branches:`
      `if: boolean`: The boolean result of a test.
      `then: any`: The value to return if the test is `true`.
  - `default: any`: The value to return if all the `if` tests are `false`.

#### Examples

###### Return a value based on a series of conditions:
```yaml
_switch:
  branches:
    - if:
        _eq:
          - x
          - y
      then: A
    - if:
        _eq:
          - x
          - z
      then: B
  default: C
```
Returns: `"C"` since both of the `if` tests are `false`.
