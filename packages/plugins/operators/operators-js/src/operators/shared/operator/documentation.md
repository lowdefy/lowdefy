<TITLE>_operator</TITLE>
<METADATA>env: Shared</METADATA>
<DESCRIPTION>The `_operator` operator evaluates an operator with the given params. This is useful if the operator needs to be chosen dynamically. The `_operator` cannot evaluate itself.</DESCRIPTION>
<USAGE>(arguments: {operator: string, params: any): any
###### object
  - `operator: string`: The name of the operator to evaluate.
  - `params: any`: The params to give to the operator.</USAGE>
<EXAMPLES>###### Get a value from `urlQuery` if specified, else use the value in `state`:
```yaml
_operator:
  operator:
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
Returns: Value from `urlQuery` if `location_selector == url_query`, else the value from `state`.</EXAMPLES>
