<TITLE>
_state
<TITLE>

<METADATA>
env: Shared
<METADATA>

<DESCRIPTION>
The `_state` operator retrieves values from the page state. State contains all the input values from blocks on the current page, as well as any values set using `SetState` actions.

The operator uses dot notation to access nested values and supports default values when keys don't exist.
<DESCRIPTION>

<USAGE>
```
(key: string | object): any

###### key (string)

A dot-notation path string to get a value from state.

###### key (object)

An object with the following properties:
- `key`: The dot-notation path string
- `default`: A default value to return if the key is not found
- `all`: If true, returns the entire state object (ignores key)
```
<USAGE>

<SCHEMA>
```yaml
# String shorthand - get value by key
_state: keyPath

# Object syntax with default
_state:
  key: keyPath
  default: defaultValue

# Get entire state
_state:
  all: true
```
<SCHEMA>

<EXAMPLES>
### Get simple value:
```yaml
_state: username
```

Returns: Value of username field

### Get nested value:
```yaml
_state: user.profile.email
```

Returns: Nested email value from user.profile

### Get with default value:
```yaml
_state:
  key: settings.theme
  default: light
```

Returns: Theme setting or 'light' if not set

### Get array element:
```yaml
_state: items.0.name
```

Returns: Name of first item in array

### Use in block properties:
```yaml
id: greeting
type: Title
properties:
  content:
    _string.concat:
      - 'Hello, '
      - _state: user.name
      - '!'
```

Displays personalized greeting

### Conditional based on state:
```yaml
id: edit_section
type: Box
visible:
  _eq:
    - _state: mode
    - edit
```

Box visible only in edit mode

### Use in request parameters:
```yaml
id: fetch_details
type: Request
params:
  id:
    _state: selected_id
  include_related:
    _state: show_related
```

Passes state values to request

### Calculate from state:
```yaml
_product:
  - _state: quantity
  - _state: unit_price
```

Returns: Calculated total from state values

### Get entire state object:
```yaml
_state:
  all: true
```

Returns: Complete state object for debugging or bulk operations

### Dynamic key access:
```yaml
_state:
  _string.concat:
    - field_
    - _state: selected_field_id
```

Accesses dynamically named field
<EXAMPLES>
