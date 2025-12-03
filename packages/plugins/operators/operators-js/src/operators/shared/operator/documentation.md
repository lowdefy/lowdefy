<TITLE>
_operator
<TITLE>

<METADATA>
env: Shared
<METADATA>

<DESCRIPTION>
The `_operator` operator dynamically invokes another operator by name. This is useful when you need to determine which operator to use at runtime based on data or configuration.

The operator name and optional method name are specified as a string in the `name` parameter, and any arguments are passed via the `params` parameter.

Note: `_operator` cannot call itself (to prevent infinite loops) and cannot call experimental operators.
<DESCRIPTION>

<USAGE>
```
(params: object): any

###### params

An object with the following properties:
- `name`: The operator name as string (e.g., '_sum', '_string.concat', '_array.filter')
- `params`: The parameters to pass to the operator
```
<USAGE>

<SCHEMA>
```yaml
_operator:
  name: string       # Operator name (e.g., '_sum', '_string.toUpperCase')
  params: any        # Parameters for the operator
```
<SCHEMA>

<EXAMPLES>
### Dynamic operator call:
```yaml
_operator:
  name: _sum
  params:
    - 10
    - 20
    - 30
```

Returns: `60`

### Call string method dynamically:
```yaml
_operator:
  name: _string.toUpperCase
  params:
    _state: user_input
```

Returns: Uppercased string

### Dynamic math operation:
```yaml
_operator:
  name:
    _string.concat:
      - _math.
      - _state: selected_operation
  params:
    _state: value
```

Calls math method based on selected operation (e.g., 'floor', 'ceil')

### Configurable data transformation:
```yaml
_operator:
  name:
    _state: transform_config.operator
  params:
    _state: transform_config.params
```

Applies transformation based on configuration

### Dynamic array method:
```yaml
_operator:
  name:
    _if:
      test:
        _state: sort_enabled
      then: _array.sort
      else: _array.reverse
  params:
    on:
      _state: items
```

Either sorts or reverses array based on setting

### Call date method by name:
```yaml
_operator:
  name:
    _string.concat:
      - _date.get
      - _state: date_part
  params:
    _state: target_date
```

Gets date part (Year, Month, Day, etc.) based on selection

### Conditional formatting:
```yaml
_operator:
  name:
    _switch:
      branches:
        - if:
            _eq:
              - _state: format_type
              - currency
          then: _intl.numberFormat
        - if:
            _eq:
              - _state: format_type
              - date
          then: _intl.dateTimeFormat
      default: _string.toString
  params:
    on:
      _state: value_to_format
```

Formats value based on type selection
<EXAMPLES>
