# _if

```
(arguments: {test: boolean, then: any, else: any}): any
```

The `_if` operator returns the `then` argument if it's `test` argument is `true`, and it's `else` argument if it is `false`. Generally other operators are used to evaluate the `test` argument.

> This operator can be used as a [`_build`](/_build) operator method.

#### Arguments

###### object
  - `test: boolean`: The boolean result of a test.
  - `then: any`: The value to return if the test is `true`.
  - `else: any`: The value to return if the test is `false`.

#### Examples

###### Return a value based on a user input:
```yaml
_if:
  test:
    _eq:
      - _state: text_input
      - The password
  then: The user entered the password
  else: Access denied
```
Returns: `"The user entered the password"` if the text input's value is `"The password"`, else `"Access denied"`
