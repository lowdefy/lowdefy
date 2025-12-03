<TITLE>
_regex
<TITLE>

<METADATA>
env: Shared
<METADATA>

<DESCRIPTION>
The `_regex` operator tests a string against a regular expression pattern. It returns `true` if the pattern matches the string, `false` otherwise.

If the test string is `null` or `undefined`, it returns `false`. The pattern is converted to a JavaScript RegExp object.
<DESCRIPTION>

<USAGE>
```
(params: string | object): boolean

###### String shorthand
A regex pattern string to test against the value at the current location in state.

###### Object params
- pattern: The regex pattern string (required)
- on: The string to test (optional, defaults to state at current location)
- key: State key to get test string from (optional)
- flags: Regex flags (optional, default 'gm')
```
<USAGE>

<SCHEMA>
```yaml
# Pattern shorthand (tests state at current location)
_regex: patternString

# Full object syntax
_regex:
  pattern: string
  on: string         # String to test
  key: string        # Or state key to get string
  flags: string      # Regex flags (default: 'gm')
```
<SCHEMA>

<EXAMPLES>
### Validate email format:
```yaml
_regex:
  pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
  on:
    _state: email
```

Returns: `true` if valid email format

### Validate phone number:
```yaml
_regex:
  pattern: '^\+?[1-9]\d{9,14}$'
  on:
    _state: phone
```

Returns: `true` if valid international phone format

### Check for alphanumeric:
```yaml
_regex:
  pattern: '^[a-zA-Z0-9]+$'
  on:
    _state: username
```

Returns: `true` if username is alphanumeric only

### Validate URL format:
```yaml
_regex:
  pattern: '^https?:\/\/.+'
  on:
    _state: website_url
```

Returns: `true` if starts with http:// or https://

### Check for numeric string:
```yaml
_regex:
  pattern: '^\d+$'
  on:
    _state: postal_code
```

Returns: `true` if only digits

### Validate password strength:
```yaml
_regex:
  pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$'
  on:
    _state: password
```

Returns: `true` if password has lowercase, uppercase, digit, special char, and 8+ chars

### Check for whitespace:
```yaml
_not:
  _regex:
    pattern: '^\s*$'
    on:
      _state: input_field
```

Returns: `true` if field is not empty or whitespace only

### Form field validation:
```yaml
id: email
type: TextInput
properties:
  label: Email Address
validate:
  - message: Please enter a valid email address
    status: error
    pass:
      _or:
        - _regex:
            pattern: '^[^\s@]+@[^\s@]+\.[^\s@]+$'
            on:
              _state: email
        - _eq:
            - _state: email
            - null
```

Validates email with custom error message
<EXAMPLES>
