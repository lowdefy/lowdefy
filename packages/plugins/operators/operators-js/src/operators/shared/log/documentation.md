<TITLE>
_log
<TITLE>

<METADATA>
env: Shared
<METADATA>

<DESCRIPTION>
The `_log` operator logs its input to the browser console and returns the same value unchanged. This is useful for debugging operators and inspecting values during development.

The operator uses `console.log()` to output the value, which can be viewed in the browser's developer tools console.
<DESCRIPTION>

<USAGE>
```
(value: any): any

###### value

Any value to log. The value is logged to the console and then returned unchanged.
```
<USAGE>

<SCHEMA>
```yaml
_log: value
```
<SCHEMA>

<EXAMPLES>
### Log a simple value:
```yaml
_log: 'Debug message'
```

Logs: `'Debug message'` to console, returns: `'Debug message'`

### Log state value:
```yaml
_log:
  _state: user.profile
```

Logs the user profile object to console and returns it

### Debug operator chain:
```yaml
_sum:
  - _log:
      _state: first_value
  - _log:
      _state: second_value
```

Logs both values before summing them

### Debug array operations:
```yaml
_array.filter:
  on:
    _log:
      _state: items
  callback:
    _function:
      __args: '0.active'
```

Logs items array before filtering

### Log conditional result:
```yaml
_log:
  _if:
    test:
      _state: is_admin
    then: Administrator
    else: Regular User
```

Logs the result of the conditional

### Debug request data:
```yaml
_log:
  _request: fetch_data
```

Logs request response to inspect data structure

### Log within complex expression:
```yaml
id: display_total
type: Title
properties:
  content:
    _string.concat:
      - 'Total: '
      - _log:
          _intl.numberFormat:
            on:
              _state: total
            options:
              style: currency
              currency: USD
            locale: en-US
```

Logs formatted total before display
<EXAMPLES>
