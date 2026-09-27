# _operator

```
(arguments: {operator: string, params: any): any
```

The `_operator` operator evaluates an operator with the given params. This is useful if the operator needs to be chosen dynamically. The `_operator` cannot evaluate itself.

> This operator can be used as a [`_build`](/_build) operator method.

#### Arguments

###### object
  - `name: string`: The name of the operator to evaluate, such as `_sum` or `_number.round`. Names written in `name`, including the names an `_if` returns from `then` and `else`, are loaded with the page. A name read at runtime, from state or a request, must be an operator the page also uses elsewhere in its config.
  - `params: any`: The params to give to the operator.

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
