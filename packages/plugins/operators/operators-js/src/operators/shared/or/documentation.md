<TITLE>
_or
<TITLE>

<METADATA>
env: Shared
<METADATA>

<DESCRIPTION>
The `_or` operator performs a logical `or` over an array of inputs, using JavaScript [truthy](https://developer.mozilla.org/en-US/docs/Glossary/Truthy) and [falsy](https://developer.mozilla.org/en-US/docs/Glossary/Falsy) rules.

It returns `true` if any value in the array is truthy (not `false`, `0`, `null`, `undefined`, `NaN`, or empty string `""`). It returns `false` only if all values are falsy.
<DESCRIPTION>

<USAGE>
```
(values: any[]): boolean

###### values

An array of values over which to perform a logical or.
```
<USAGE>

<SCHEMA>
```yaml
_or:
  - value1
  - value2
  - value3
```
<SCHEMA>

<EXAMPLES>
### Check if any value is true:
```yaml
_or:
  - false
  - true
  - false
```

Returns: `true`

### Check multiple conditions:
```yaml
_or:
  - _eq:
      - _state: status
      - approved
  - _eq:
      - _state: status
      - completed
```

Returns: `true` if status is either 'approved' or 'completed'

### Multiple user roles check:
```yaml
_or:
  - _eq:
      - _user: role
      - admin
  - _eq:
      - _user: role
      - manager
  - _eq:
      - _user: role
      - supervisor
```

Returns: `true` if user has any management role

### Show element for multiple statuses:
```yaml
id: action_panel
type: Box
visible:
  _or:
    - _eq:
        - _state: order.status
        - pending
    - _eq:
        - _state: order.status
        - processing
```

Panel visible when order is pending or processing

### Validate at least one field filled:
```yaml
_or:
  - _state: contact.email
  - _state: contact.phone
  - _state: contact.address
```

Returns: `true` if any contact method provided

### Multiple permission check:
```yaml
_or:
  - _array.includes:
      on:
        _user: permissions
      value: edit
  - _array.includes:
      on:
        _user: permissions
      value: admin
```

Returns: `true` if user can edit or is admin

### Check any error exists:
```yaml
_or:
  - _state: errors.name
  - _state: errors.email
  - _state: errors.password
```

Returns: `true` if any validation error exists
<EXAMPLES>
