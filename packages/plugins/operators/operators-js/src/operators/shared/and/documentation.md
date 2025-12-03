<TITLE>
_and
<TITLE>

<METADATA>
env: Shared
<METADATA>

<DESCRIPTION>
The `_and` operator performs a logical `and` over an array of inputs, using JavaScript [truthy](https://developer.mozilla.org/en-US/docs/Glossary/Truthy) and [falsy](https://developer.mozilla.org/en-US/docs/Glossary/Falsy) rules.

It only returns `true` if all the values in the array are truthy (not `false`, `0`, `null`, `undefined`, `NaN`, or the empty string `""`). Otherwise, it returns `false`.
<DESCRIPTION>

<USAGE>
```
(values: any[]): boolean

###### values

An array of values over which to perform a logical and.
```
<USAGE>

<SCHEMA>
```yaml
_and:
  - value1
  - value2
  - value3
```
<SCHEMA>

<EXAMPLES>
### Two true values:
```yaml
_and:
  - true
  - true
```

Returns: `true`

### Array of true and false values:
```yaml
_and:
  - true
  - true
  - true
  - false
```

Returns: `false`

### Check if two boolean inputs are true:
```yaml
_and:
  - _state: confirm_accept_terms
  - _state: confirm_accept_privacy_policy
```

Returns: `true` if both inputs are `true`

### Validate multiple form conditions:
```yaml
_and:
  - _state: form_valid
  - _not:
      _state: is_submitting
  - _gt:
      - _array.length:
          _state: selected_items
      - 0
```

Returns: `true` if form is valid, not currently submitting, and has items selected

### Enable submit button conditionally:
```yaml
id: submit_button
type: Button
properties:
  disabled:
    _not:
      _and:
        - _state: terms_accepted
        - _state: email_valid
        - _state: password_valid
```

Button enabled when all conditions are met

### Check user permissions:
```yaml
_and:
  - _eq:
      - _user: role
      - admin
  - _array.includes:
      on:
        _user: permissions
      value: edit
  - _not:
      _state: record.locked
```

Returns: `true` if user is admin with edit permission and record is not locked

### Validate date range:
```yaml
_and:
  - _lte:
      - _state: start_date
      - _state: end_date
  - _gte:
      - _state: start_date
      - _date.now:
```

Returns: `true` if start date is before end date and not in the past
<EXAMPLES>
