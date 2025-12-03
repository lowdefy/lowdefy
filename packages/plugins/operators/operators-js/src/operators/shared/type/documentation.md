<TITLE>
_type
<TITLE>

<METADATA>
env: Shared
<METADATA>

<DESCRIPTION>
The `_type` operator tests whether a value is of a specific JavaScript type. It returns `true` if the value matches the specified type, `false` otherwise.

Available type tests:
- `string`: Test for string type
- `array`: Test for array type
- `date`: Test for Date object
- `object`: Test for plain object (not array, not date)
- `boolean`: Test for boolean type
- `number`: Test for number type
- `integer`: Test for integer (whole number)
- `null`: Test for null
- `undefined`: Test for undefined
- `none`: Test for null or undefined
- `primitive`: Test for primitive types (string, number, boolean, null, undefined)
<DESCRIPTION>

<USAGE>
```
(params: string | object): boolean

###### String shorthand
Type name to test against value at current location in state.

###### Object params
- type: The type name to test (required)
- on: The value to test (optional, defaults to state at current location)
- key: State key to get value from (optional)
```
<USAGE>

<SCHEMA>
```yaml
# String shorthand
_type: typeName

# Object syntax
_type:
  type: string
  on: value      # Value to test
  key: string    # Or state key to get value
```
<SCHEMA>

<EXAMPLES>
### Check if string:
```yaml
_type:
  type: string
  on:
    _state: user_input
```

Returns: `true` if user_input is a string

### Check if array:
```yaml
_type:
  type: array
  on:
    _state: selected_items
```

Returns: `true` if selected_items is an array

### Check if number:
```yaml
_type:
  type: number
  on:
    _state: quantity
```

Returns: `true` if quantity is a number

### Check if integer:
```yaml
_type:
  type: integer
  on:
    _state: count
```

Returns: `true` if count is a whole number

### Check if null:
```yaml
_type:
  type: null
  on:
    _state: optional_field
```

Returns: `true` if field is null

### Check if none (null or undefined):
```yaml
_type:
  type: none
  on:
    _state: optional_value
```

Returns: `true` if value is null or undefined

### Check if object:
```yaml
_type:
  type: object
  on:
    _state: config
```

Returns: `true` if config is a plain object

### Check if date:
```yaml
_type:
  type: date
  on:
    _state: start_date
```

Returns: `true` if start_date is a Date object

### Conditional rendering based on type:
```yaml
id: display_value
type: Title
properties:
  content:
    _if:
      test:
        _type:
          type: array
          on:
            _state: data
      then:
        _array.join:
          on:
            _state: data
          separator: ', '
      else:
        _state: data
```

Displays array as comma-separated or value as-is

### Validate input type:
```yaml
_and:
  - _type:
      type: string
      on:
        _state: email
  - _not:
      _type:
        type: none
        on:
          _state: email
```

Returns: `true` if email is a non-empty string
<EXAMPLES>
