<TITLE>
_not
<TITLE>

<METADATA>
env: Shared
<METADATA>

<DESCRIPTION>
The `_not` operator performs a logical NOT operation on its input. It returns `true` for falsy values and `false` for truthy values.

JavaScript falsy values include: `false`, `0`, `null`, `undefined`, `NaN`, and empty string `""`. All other values are considered truthy.
<DESCRIPTION>

<USAGE>
```
(value: any): boolean

###### value

Any value to negate. Falsy values return true, truthy values return false.
```
<USAGE>

<SCHEMA>
```yaml
_not: value
```
<SCHEMA>

<EXAMPLES>
### Negate a boolean:
```yaml
_not: true
```

Returns: `false`

### Check if array is empty:
```yaml
_not:
  _array.length:
    _state: items
```

Returns: `true` if items array is empty (length is 0)

### Invert visibility condition:
```yaml
id: guest_content
type: Box
visible:
  _not:
    _user: id
```

Box visible only for guests (not logged in)

### Check if not approved:
```yaml
_not:
  _eq:
    - _state: status
    - approved
```

Returns: `true` if status is anything other than 'approved'

### Show when no selection:
```yaml
id: placeholder_text
type: Title
visible:
  _not:
    _state: selected_category
properties:
  content: Please select a category
```

Placeholder shown when nothing selected

### Disable when conditions not met:
```yaml
id: submit_button
type: Button
properties:
  disabled:
    _not:
      _and:
        - _state: terms_accepted
        - _state: form_valid
```

Button disabled unless both conditions are true

### Check if request failed:
```yaml
_not:
  _request: save_data.success
```

Returns: `true` if save operation failed
<EXAMPLES>
