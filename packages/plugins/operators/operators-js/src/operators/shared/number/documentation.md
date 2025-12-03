<TITLE>
_number
<TITLE>

<METADATA>
env: Shared
<METADATA>

<DESCRIPTION>
The `_number` operator provides access to JavaScript Number methods and properties. It includes functions for parsing, checking, and formatting numbers.

Available methods:
- Parsing: parseFloat, parseInt
- Checking: isFinite, isInteger, isNaN, isSafeInteger
- Formatting: toExponential, toFixed, toLocaleString, toPrecision, toString

Available constants:
- EPSILON, MAX_SAFE_INTEGER, MAX_VALUE, MIN_SAFE_INTEGER, MIN_VALUE
- NaN, NEGATIVE_INFINITY, POSITIVE_INFINITY
<DESCRIPTION>

<USAGE>
```
_number.methodName: params

###### Parsing methods
- parseFloat: Parses string to float
- parseInt: { on, radix } - Parses string to integer

###### Check methods
- isFinite: Returns true if finite number
- isInteger: Returns true if integer
- isNaN: Returns true if NaN
- isSafeInteger: Returns true if safe integer

###### Format methods
- toExponential: { on, fractionDigits }
- toFixed: { on, digits }
- toLocaleString: { on, locales }
- toPrecision: { on, precision }
- toString: { on, radix }

###### Constants
EPSILON, MAX_SAFE_INTEGER, MAX_VALUE, MIN_SAFE_INTEGER, 
MIN_VALUE, NaN, NEGATIVE_INFINITY, POSITIVE_INFINITY
```
<USAGE>

<SCHEMA>
```yaml
# Single argument
_number.methodName: value

# Named arguments
_number.parseInt:
  on: string
  radix: number

_number.toFixed:
  on: number
  digits: number

# Constants
_number.MAX_SAFE_INTEGER:
```
<SCHEMA>

<EXAMPLES>
### Parse string to float:
```yaml
_number.parseFloat: '123.45'
```

Returns: `123.45`

### Parse integer with radix:
```yaml
_number.parseInt:
  on: '1010'
  radix: 2
```

Returns: `10` (binary to decimal)

### Check if value is finite:
```yaml
_number.isFinite:
  _divide:
    - _state: value
    - _state: divisor
```

Returns: `true` if result is a finite number

### Check if integer:
```yaml
_number.isInteger:
  _state: quantity
```

Returns: `true` if quantity is a whole number

### Format to fixed decimals:
```yaml
_number.toFixed:
  on:
    _state: price
  digits: 2
```

Returns: `'99.99'` (string with 2 decimal places)

### Format with locale:
```yaml
_number.toLocaleString:
  on:
    _state: population
  locales: en-US
```

Returns: `'1,234,567'` (with thousands separator)

### Convert to precision:
```yaml
_number.toPrecision:
  on: 123.456
  precision: 4
```

Returns: `'123.5'`

### Convert to binary string:
```yaml
_number.toString:
  on: 255
  radix: 2
```

Returns: `'11111111'`

### Check for safe integer:
```yaml
_number.isSafeInteger:
  _state: large_number
```

Returns: `true` if within safe integer range

### Get maximum safe integer:
```yaml
_lte:
  - _state: record_id
  - _number.MAX_SAFE_INTEGER:
```

Returns: `true` if ID is within safe range
<EXAMPLES>
