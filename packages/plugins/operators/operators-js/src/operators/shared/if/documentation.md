<TITLE>
_if
<TITLE>

<METADATA>
env: Shared
<METADATA>

<DESCRIPTION>
The `_if` operator performs conditional evaluation. It takes a `test` condition and returns the `then` value if the test is `true`, or the `else` value if the test is `false`.

The `test` parameter must be a boolean (`true` or `false`). If a non-boolean value is provided, an error will be thrown. Use comparison operators like `_eq`, `_gt`, `_not`, etc. to create boolean conditions.
<DESCRIPTION>

<USAGE>
```
(params: object): any

###### params

An object with the following properties:
- `test`: A boolean condition (must be true or false)
- `then`: Value to return if test is true
- `else`: Value to return if test is false
```
<USAGE>

<SCHEMA>
```yaml
_if:
  test: boolean
  then: any
  else: any
```
<SCHEMA>

<EXAMPLES>
### Simple conditional text:
```yaml
_if:
  test:
    _eq:
      - _state: status
      - active
  then: Active
  else: Inactive
```

Returns: 'Active' if status is 'active', otherwise 'Inactive'

### Conditional button color:
```yaml
id: status_button
type: Button
properties:
  title: Submit
  color:
    _if:
      test:
        _state: form_valid
      then: '#52c41a'
      else: '#ff4d4f'
```

Button is green when form is valid, red otherwise

### Dynamic label based on count:
```yaml
_if:
  test:
    _eq:
      - _array.length:
          _state: items
      - 1
  then: 1 item
  else:
    _string.concat:
      - _array.length:
          _state: items
      - ' items'
```

Returns: '1 item' or 'X items' based on count

### Nested conditional for multiple states:
```yaml
_if:
  test:
    _eq:
      - _state: stage
      - draft
  then: Draft - Not Submitted
  else:
    _if:
      test:
        _eq:
          - _state: stage
          - review
      then: Under Review
      else: Completed
```

Returns different text based on stage value

### Conditional visibility:
```yaml
id: admin_panel
type: Box
visible:
  _if:
    test:
      _eq:
        - _user: role
        - admin
    then: true
    else: false
```

Panel only visible to admin users

### Conditional request parameter:
```yaml
id: fetch_data
type: Request
params:
  filter:
    status:
      _if:
        test:
          _state: show_archived
        then: archived
        else: active
```

Fetches archived or active data based on toggle

### Conditional formatting:
```yaml
_if:
  test:
    _lt:
      - _state: balance
      - 0
  then:
    _string.concat:
      - '-$'
      - _math.abs:
          _state: balance
  else:
    _string.concat:
      - '$'
      - _state: balance
```

Formats balance with appropriate sign
<EXAMPLES>
