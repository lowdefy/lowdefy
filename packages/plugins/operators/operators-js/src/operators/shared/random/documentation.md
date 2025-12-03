<TITLE>
_random
<TITLE>

<METADATA>
env: Shared
<METADATA>

<DESCRIPTION>
The `_random` operator generates random values of different types: strings, integers, or floating-point numbers.

Available types:
- `string`: Generates a random alphanumeric string
- `integer`: Generates a random integer within a range
- `float`: Generates a random floating-point number within a range

For integers and floats, both minimum and maximum values are inclusive.
<DESCRIPTION>

<USAGE>
```
(params: string | object): string | number

###### String shorthand
Pass type directly as string: 'string', 'integer', or 'float'

###### Object params
- type: 'string' | 'integer' | 'float'
- length: (for string) Character count, default 8
- min: (for integer/float) Minimum value, default 0
- max: (for integer/float) Maximum value, default min+100 for integer, min+1 for float
```
<USAGE>

<SCHEMA>
```yaml
# String shorthand
_random: string
_random: integer
_random: float

# Object with options
_random:
  type: string
  length: number

_random:
  type: integer
  min: number
  max: number

_random:
  type: float
  min: number
  max: number
```
<SCHEMA>

<EXAMPLES>
### Generate random string (default 8 chars):
```yaml
_random: string
```

Returns: `'x7k2m9p1'` (example)

### Generate random string with specific length:
```yaml
_random:
  type: string
  length: 16
```

Returns: `'a3b7c9d2e8f4g1h5'` (example)

### Generate random integer (default 0-100):
```yaml
_random: integer
```

Returns: `42` (example, between 0 and 100)

### Generate random integer in range:
```yaml
_random:
  type: integer
  min: 1
  max: 6
```

Returns: Random dice roll (1-6)

### Generate random float:
```yaml
_random: float
```

Returns: `0.7342...` (example, between 0 and 1)

### Generate random float in range:
```yaml
_random:
  type: float
  min: 0
  max: 100
```

Returns: Random percentage value

### Generate temporary ID:
```yaml
id: new_item
type: SetState
params:
  temp_id:
    _string.concat:
      - 'TEMP-'
      - _random:
          type: string
          length: 12
```

Creates temporary ID like 'TEMP-a3b7c9d2e8f4'

### Random selection from array:
```yaml
_get:
  from:
    _state: available_options
  key:
    _random:
      type: integer
      min: 0
      max:
        _subtract:
          - _array.length:
              _state: available_options
          - 1
```

Selects random item from options array

### Generate random order number:
```yaml
_string.concat:
  - 'ORD-'
  - _random:
      type: integer
      min: 100000
      max: 999999
```

Returns: Order number like 'ORD-548721'
<EXAMPLES>
