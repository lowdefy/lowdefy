<TITLE>
_ne
<TITLE>

<METADATA>
env: Shared
<METADATA>

<DESCRIPTION>
The `_ne` operator performs a strict inequality comparison (`!==`) between two values. It takes an array of exactly 2 values and returns `true` if they are not strictly equal, `false` otherwise.

Strict inequality means either the value or type must be different. For example, `1` is not equal to `'1'` because they have different types.
<DESCRIPTION>

<USAGE>
```
(values: [any, any]): boolean

###### values

An array containing exactly two values to compare for strict inequality.
```
<USAGE>

<SCHEMA>
```yaml
_ne:
  - value1
  - value2
```
<SCHEMA>

<EXAMPLES>
### Compare two strings:
```yaml
_ne:
  - pending
  - approved
```

Returns: `true`

### Check if status has changed:
```yaml
_ne:
  - _state: current_status
  - _state: original_status
```

Returns: `true` if status was modified

### Check if value is not null:
```yaml
_ne:
  - _state: selected_item
  - null
```

Returns: `true` if an item is selected

### Show edit button when not submitted:
```yaml
id: edit_button
type: Button
visible:
  _ne:
    - _state: form.status
    - submitted
properties:
  title: Edit Form
```

Button visible when form is not submitted

### Check if user is not the owner:
```yaml
_ne:
  - _user: id
  - _state: record.owner_id
```

Returns: `true` if current user is not the owner

### Validate different passwords:
```yaml
_ne:
  - _state: new_password
  - _state: current_password
```

Returns: `true` if new password is different

### Check if quantity changed:
```yaml
_ne:
  - _state: item.quantity
  - _state: item.original_quantity
```

Returns: `true` if quantity was modified
<EXAMPLES>
