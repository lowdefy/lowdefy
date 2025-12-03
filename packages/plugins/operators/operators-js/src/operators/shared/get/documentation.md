<TITLE>
_get
<TITLE>

<METADATA>
env: Shared
<METADATA>

<DESCRIPTION>
The `_get` operator retrieves a value from an object or array using a dot-notation path. It provides a safe way to access nested properties with an optional default value if the path doesn't exist.

If `from` is `null`, it returns the default value (or `null` if no default is specified).
<DESCRIPTION>

<USAGE>
```
(params: object): any

###### params

An object with the following properties:
- `from`: The source object or array to get the value from.
- `key`: A dot-notation path string to the desired value.
- `default`: (optional) Value to return if the key is not found.
```
<USAGE>

<SCHEMA>
```yaml
_get:
  from: object | array
  key: string       # dot-notation path
  default: any      # optional default value
```
<SCHEMA>

<EXAMPLES>
### Get nested property:
```yaml
_get:
  from:
    _state: user
  key: profile.name
```

Returns: The user's profile name

### Access array element by index:
```yaml
_get:
  from:
    _request: products
  key: '0.name'
```

Returns: Name of the first product

### Provide default value:
```yaml
_get:
  from:
    _state: settings
  key: theme.color
  default: '#000000'
```

Returns: Theme color or '#000000' if not set

### Access deeply nested data:
```yaml
_get:
  from:
    _request: order_details
  key: customer.address.city
  default: Unknown
```

Returns: Customer's city or 'Unknown'

### Get value from request response:
```yaml
_get:
  from:
    _request: search_results.0
  key: total_count.0.total
  default: 0
```

Returns: Total count from search results or 0

### Access array within nested object:
```yaml
_get:
  from:
    _state: form_data
  key: items.2.quantity
  default: 1
```

Returns: Quantity of third item or 1

### Dynamic key access:
```yaml
_get:
  from:
    _state: translations
  key:
    _string.concat:
      - labels.
      - _state: selected_language
      - .title
  default: No translation
```

Returns: Translation for selected language
<EXAMPLES>
