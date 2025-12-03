<TITLE>
_uri
<TITLE>

<METADATA>
env: Shared
<METADATA>

<DESCRIPTION>
The `_uri` operator provides URL encoding and decoding functions. It wraps JavaScript's `encodeURIComponent` and `decodeURIComponent` functions.

Available methods:
- `encode`: Encodes special characters for use in URL components
- `decode`: Decodes URL-encoded strings back to original form
<DESCRIPTION>

<USAGE>
```
_uri.encode: string
_uri.decode: string

###### encode
Encodes a string for safe use in URLs. Converts special characters to percent-encoded format.

###### decode
Decodes a percent-encoded string back to its original form.
```
<USAGE>

<SCHEMA>
```yaml
# Encode string
_uri.encode: string

# Decode string
_uri.decode: string
```
<SCHEMA>

<EXAMPLES>
### Encode URL parameter:
```yaml
_uri.encode: 'hello world'
```

Returns: `'hello%20world'`

### Decode URL parameter:
```yaml
_uri.decode: 'hello%20world'
```

Returns: `'hello world'`

### Encode search query:
```yaml
_uri.encode:
  _state: search_term
```

Returns: URL-safe search term

### Build URL with encoded parameter:
```yaml
_string.concat:
  - 'https://api.example.com/search?q='
  - _uri.encode:
      _state: search_query
```

Returns: `'https://api.example.com/search?q=test%20query'`

### Encode special characters:
```yaml
_uri.encode: 'price=$100&discount=20%'
```

Returns: `'price%3D%24100%26discount%3D20%25'`

### Decode query parameter:
```yaml
_uri.decode:
  _state: encoded_message
```

Returns: Decoded message from URL parameter

### Build dynamic URL:
```yaml
_string.concat:
  - '/products/'
  - _uri.encode:
      _state: category
  - '/'
  - _uri.encode:
      _state: product_name
```

Returns: URL-safe path like `/products/electronics/TV%2032%22`

### Encode for API request:
```yaml
id: fetch_data
type: Request
params:
  endpoint:
    _string.concat:
      - /api/data?filter=
      - _uri.encode:
          _json.stringify:
            on:
              _state: filter_config
```

Encodes JSON filter for API query string
<EXAMPLES>
