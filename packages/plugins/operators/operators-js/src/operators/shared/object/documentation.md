<TITLE>
_object
<TITLE>

<METADATA>
env: Shared
<METADATA>

<DESCRIPTION>
The `_object` operator provides access to JavaScript Object methods. It allows you to manipulate objects, merge them, and convert between object and array representations.

Available methods:
- `assign`: Merge multiple objects into one
- `defineProperty`: Define or modify a property on an object
- `entries`: Convert object to array of [key, value] pairs
- `fromEntries`: Convert array of [key, value] pairs to object
- `keys`: Get array of object keys
- `values`: Get array of object values
- `hasOwnProperty`: Check if object has a specific property

If `null` or `undefined` is passed, it will be treated as an empty object `{}` (or empty array `[]` for fromEntries).
<DESCRIPTION>

<USAGE>
```
_object.methodName: params

###### assign
Merges objects. Takes array of objects to merge.

###### defineProperty
Defines or modifies a property.
- on: Target object
- key: Property name
- descriptor: Property descriptor object

###### entries
Returns array of [key, value] pairs from object.

###### fromEntries
Creates object from array of [key, value] pairs.

###### keys
Returns array of object's own property names.

###### values
Returns array of object's own property values.

###### hasOwnProperty
Checks if property exists on object.
- on: Target object
- prop: Property name to check
```
<USAGE>

<SCHEMA>
```yaml
# Merge objects
_object.assign:
  - object1
  - object2
  - object3

# Define property
_object.defineProperty:
  on: object
  key: string
  descriptor:
    value: any
    enumerable: boolean
    configurable: boolean

# Convert to entries
_object.entries: object

# Create from entries
_object.fromEntries:
  - - key1
    - value1
  - - key2
    - value2

# Get keys
_object.keys: object

# Get values
_object.values: object

# Check property
_object.hasOwnProperty:
  on: object
  prop: string
```
<SCHEMA>

<EXAMPLES>
### Merge objects:
```yaml
_object.assign:
  - name: Default Product
    price: 0
  - _state: product_overrides
```

Returns: Merged object with defaults and overrides

### Get object keys:
```yaml
_object.keys:
  _state: form_data
```

Returns: Array of field names like `['name', 'email', 'phone']`

### Get object values:
```yaml
_object.values:
  _state: category_counts
```

Returns: Array of count values

### Convert object to entries for mapping:
```yaml
_array.map:
  on:
    _object.entries:
      _state: permissions
  callback:
    _function:
      key:
        __args: '0.0'
      enabled:
        __args: '0.1'
```

Returns: Array of permission objects with key and enabled status

### Create object from entries:
```yaml
_object.fromEntries:
  - - status
    - active
  - - priority
    - high
  - - assigned_to
    - _user: id
```

Returns: `{ status: 'active', priority: 'high', assigned_to: 'user123' }`

### Check if property exists:
```yaml
_object.hasOwnProperty:
  on:
    _state: config
  prop: advanced_settings
```

Returns: `true` if config has advanced_settings property

### Merge multiple data sources:
```yaml
_object.assign:
  - _request: default_settings
  - _request: user_preferences
  - _state: form_values
```

Returns: Combined settings with form values taking precedence

### Dynamic object creation:
```yaml
_object.fromEntries:
  _array.map:
    on:
      _state: selected_fields
    callback:
      _function:
        - __args: '0.id'
        - __args: '0.value'
```

Creates object from selected field IDs and values
<EXAMPLES>
