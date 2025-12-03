<TITLE>
_json
<TITLE>

<METADATA>
env: Shared
<METADATA>

<DESCRIPTION>
The `_json` operator provides JSON serialization and deserialization methods. It can convert JavaScript objects to JSON strings and parse JSON strings back to objects.

Available methods:
- `stringify`: Convert an object/value to a JSON string
- `parse`: Parse a JSON string to an object/value

The stringify method includes support for Date serialization as ISO strings and pretty-printing with 2-space indentation by default.
<DESCRIPTION>

<USAGE>
```
_json.stringify: params
_json.parse: string

###### stringify
Converts a value to a JSON string.
- on: The value to stringify
- options: (optional) Serialization options
  - space: Number of spaces for indentation
  - isoStringDates: Whether to convert dates to ISO strings

###### parse
Parses a JSON string to a value.
- Takes a JSON string as input
- 'undefined' string returns undefined
```
<USAGE>

<SCHEMA>
```yaml
# Stringify object to JSON
_json.stringify:
  on: value
  options:
    space: number
    isoStringDates: boolean

# Parse JSON string
_json.parse: jsonString
```
<SCHEMA>

<EXAMPLES>
### Stringify object to JSON:
```yaml
_json.stringify:
  on:
    name: Product A
    price: 99.99
    active: true
```

Returns:
```json
{
  "name": "Product A",
  "price": 99.99,
  "active": true
}
```

### Parse JSON string:
```yaml
_json.parse: '{"name": "Product A", "price": 99.99}'
```

Returns: `{ name: 'Product A', price: 99.99 }`

### Stringify state for debugging:
```yaml
_json.stringify:
  on:
    _state: form_data
```

Returns: JSON representation of form data

### Stringify with custom formatting:
```yaml
_json.stringify:
  on:
    _state: config
  options:
    space: 4
```

Returns: JSON string with 4-space indentation

### Parse API response:
```yaml
_json.parse:
  _request: api_response.body
```

Returns: Parsed object from API response body

### Store complex data as string:
```yaml
id: save_settings
type: SetState
params:
  settings_json:
    _json.stringify:
      on:
        _state: user_preferences
```

Stores preferences as JSON string

### Round-trip serialization:
```yaml
_json.parse:
  _json.stringify:
    on:
      _state: original_data
```

Creates a deep copy of the data
<EXAMPLES>
