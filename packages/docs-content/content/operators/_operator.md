# _operator

```
(arguments: {name: string, params: any, operators?: string[]}): any
```

The `_operator` operator evaluates an operator with the given params. This is useful if the operator needs to be chosen dynamically. The `_operator` cannot evaluate itself.

> This operator can be used as a [`_build`](/_build) operator method.

#### Arguments

###### object
  - `name: string`: The name of the operator to evaluate, such as `_sum` or `_number.round`. Names written in `name`, including the names an `_if` returns from `then` and `else` and a `_switch` returns from its branches, are loaded with the page.
  - `params: any`: The params to give to the operator.
  - `operators: string[]`: The operators the call may evaluate. Required when `name` is read at runtime, from state, a request or a payload: the build fails without it, loads exactly these operators with the page (or the server), and `_operator` refuses any other name. A listed operator (`_number`) allows all its methods; a listed method (`_number.round`) allows only that method.

#### Examples

###### Get a value from `urlQuery` if specified, else use the value in `state`:
```yaml
_operator:
  name:
    _if:
      test:
        _eq:
          - _state: location_selector
          - url_query
      then: _url_query
      else: _state
  params:
    key: field_to_get
```
Returns: Value from `urlQuery` if `location_selector == url_query`, else the value from `state`.

###### Apply an aggregation chosen by the user:
```yaml
_operator:
  name:
    _state: aggregation # _sum or _product
  operators:
    - _sum
    - _product
  params:
    _state: values
```
Returns: The sum or product of `values`. Any other name in `aggregation` is refused.
