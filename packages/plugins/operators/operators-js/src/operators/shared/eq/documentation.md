<TITLE>
_eq
<TITLE>

<METADATA>
env: Shared
<METADATA>

<DESCRIPTION>
The `_eq` operator performs a strict equality comparison (`===`) between two values. It takes an array of exactly 2 values and returns `true` if they are strictly equal, `false` otherwise.

Strict equality means both value and type must match. For example, `1` is not equal to `'1'` because one is a number and the other is a string.
<DESCRIPTION>

<USAGE>
```
(values: [any, any]): boolean

###### values

An array containing exactly two values to compare for strict equality.
```
<USAGE>

<SCHEMA>
```yaml
_eq:
  - value1
  - value2
```
<SCHEMA>

<EXAMPLES>
### Compare two strings:
```yaml
_eq:
  - active
  - active
```

Returns: `true`

### Compare state value to string:
```yaml
_eq:
  - _state: status
  - approved
```

Returns: `true` if status equals 'approved'

### Check if selection is null:
```yaml
_eq:
  - _state: selected_item
  - null
```

Returns: `true` if no item is selected

### Compare numbers:
```yaml
_eq:
  - _state: quantity
  - 0
```

Returns: `true` if quantity is exactly 0

### Compare user role:
```yaml
_eq:
  - _user: role
  - admin
```

Returns: `true` if user has admin role

### Conditional button disabled state:
```yaml
id: submit_button
type: Button
properties:
  disabled:
    _eq:
      - _state: form.status
      - submitted
```

Button is disabled when form status is 'submitted'

### Check request response status:
```yaml
_eq:
  - _request: save_data.status
  - success
```

Returns: `true` if save operation was successful
<EXAMPLES>
