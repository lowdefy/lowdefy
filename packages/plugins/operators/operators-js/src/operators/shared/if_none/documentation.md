<TITLE>
_if_none
<TITLE>

<METADATA>
env: Shared
<METADATA>

<DESCRIPTION>
The `_if_none` operator returns a fallback value if the first value is `null` or `undefined`. It takes an array of exactly 2 values: if the first value is "none" (null or undefined), it returns the second value; otherwise, it returns the first value.

This is useful for providing default values when data might not exist.
<DESCRIPTION>

<USAGE>
```
(values: [any, any]): any

###### values

An array containing exactly two values:
- First element: The value to check
- Second element: The fallback value if first is null/undefined
```
<USAGE>

<SCHEMA>
```yaml
_if_none:
  - valueToCheck
  - fallbackValue
```
<SCHEMA>

<EXAMPLES>
### Provide default text:
```yaml
_if_none:
  - _state: user.display_name
  - Anonymous User
```

Returns: User's display name or 'Anonymous User' if not set

### Default number value:
```yaml
_if_none:
  - _state: settings.page_size
  - 10
```

Returns: Page size setting or 10 as default

### Fallback for request data:
```yaml
_if_none:
  - _request: profile_data.avatar_url
  - /images/default-avatar.png
```

Returns: User's avatar URL or default image path

### Default array value:
```yaml
_if_none:
  - _state: selected_tags
  - []
```

Returns: Selected tags array or empty array

### Nested fallback chain:
```yaml
_if_none:
  - _state: primary_contact
  - _if_none:
      - _state: secondary_contact
      - No contact available
```

Returns: Primary contact, or secondary if primary is null, or message if both are null

### Default for calculations:
```yaml
_divide:
  - _state: total_amount
  - _if_none:
      - _state: item_count
      - 1
```

Safely divides by item count, defaulting to 1 to avoid division issues

### Default object properties:
```yaml
_if_none:
  - _get:
      from:
        _request: settings
      key: theme.colors
  - primary: '#001528'
    secondary: '#52c41a'
```

Returns: Theme colors from settings or default color scheme
<EXAMPLES>
