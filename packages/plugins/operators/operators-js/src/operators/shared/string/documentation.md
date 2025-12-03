<TITLE>
_string
<TITLE>

<METADATA>
env: Shared
<METADATA>

<DESCRIPTION>
The `_string` operator provides access to JavaScript String methods. It allows you to manipulate strings with operations like concatenation, searching, replacing, splitting, and case conversion.

If `null` or `undefined` is passed as the string, it will be treated as an empty string `''`.

Available methods include:
- Manipulation: concat, replace, slice, split, substring, trim, trimStart, trimEnd, repeat, padStart, padEnd
- Case: toLowerCase, toUpperCase
- Search: charAt, includes, indexOf, lastIndexOf, startsWith, endsWith, match, search
- Info: length
<DESCRIPTION>

<USAGE>
```
_string.methodName: params

###### Single argument methods
toLowerCase, toUpperCase, trim, trimStart, trimEnd, length

###### Named argument methods
- charAt: { on, index }
- concat: array of strings
- endsWith: { on, searchString, length }
- includes: { on, searchString, position }
- indexOf: { on, searchValue, fromIndex }
- lastIndexOf: { on, searchValue, fromIndex }
- match: { on, regex, regexFlags }
- normalize: { on, form }
- padEnd: { on, targetLength, padString }
- padStart: { on, targetLength, padString }
- repeat: { on, count }
- replace: { on, regex, newSubstr, regexFlags }
- search: { on, regex, regexFlags }
- slice: { on, start, end }
- split: { on, separator }
- startsWith: { on, searchString, position }
- substring: { on, start, end }
```
<USAGE>

<SCHEMA>
```yaml
# Single argument methods
_string.methodName: string

# Named argument methods
_string.methodName:
  on: string
  # method-specific args

# Concat (array of strings)
_string.concat:
  - string1
  - string2
  - string3
```
<SCHEMA>

<EXAMPLES>
### Convert to uppercase:
```yaml
_string.toUpperCase:
  _state: code
```

Returns: Uppercase version of code

### Convert to lowercase:
```yaml
_string.toLowerCase:
  _state: email
```

Returns: Lowercase email for consistency

### Concatenate strings:
```yaml
_string.concat:
  - _state: first_name
  - ' '
  - _state: last_name
```

Returns: Full name like 'John Smith'

### Trim whitespace:
```yaml
_string.trim:
  _state: user_input
```

Returns: Input with leading/trailing whitespace removed

### Check if includes substring:
```yaml
_string.includes:
  on:
    _state: description
  searchString: 'urgent'
```

Returns: `true` if description contains 'urgent'

### Replace text:
```yaml
_string.replace:
  on:
    _state: template
  regex: '{{name}}'
  newSubstr:
    _state: user.name
```

Returns: Template with {{name}} replaced

### Split into array:
```yaml
_string.split:
  on:
    _state: tags
  separator: ','
```

Returns: Array of individual tags

### Get string length:
```yaml
_string.length:
  _state: password
```

Returns: Number of characters in password

### Pad start for formatting:
```yaml
_string.padStart:
  on:
    _state: order_number
  targetLength: 6
  padString: '0'
```

Returns: '000042' (padded to 6 digits)

### Check if starts with prefix:
```yaml
_string.startsWith:
  on:
    _state: product_code
  searchString: 'PRD-'
```

Returns: `true` if product code starts with 'PRD-'

### Extract substring:
```yaml
_string.substring:
  on:
    _state: full_id
  start: 0
  end: 8
```

Returns: First 8 characters of ID

### Build URL path:
```yaml
_string.concat:
  - /api/v1/
  - _state: resource_type
  - /
  - _state: resource_id
```

Returns: Full API path like '/api/v1/users/123'
<EXAMPLES>
