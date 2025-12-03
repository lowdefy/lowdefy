<TITLE>
_math
<TITLE>

<METADATA>
env: Shared
<METADATA>

<DESCRIPTION>
The `_math` operator provides access to JavaScript Math methods and constants. It includes functions for rounding, trigonometry, logarithms, and common mathematical operations.

Available methods include:
- Basic: abs, ceil, floor, round, trunc, sign
- Trigonometry: sin, cos, tan, asin, acos, atan, sinh, cosh, tanh
- Logarithms: log, log10, log2, log1p
- Powers/Roots: sqrt, cbrt, pow, exp, expm1
- Utilities: max, min, random, hypot
- Constants: PI, E, LN10, LN2, LOG10E, LOG2E, SQRT1_2, SQRT2
<DESCRIPTION>

<USAGE>
```
_math.methodName: params

###### Single argument methods
abs, ceil, floor, round, trunc, sign, sqrt, cbrt, 
exp, expm1, log, log10, log1p, log2, 
sin, cos, tan, asin, acos, atan, sinh, cosh, tanh, asinh, acosh, atanh

###### Named argument methods
- pow: { base, exponent }
- atan2: { x, y }
- imul: { a, b }

###### Spread argument methods (array input)
- max: Returns largest value
- min: Returns smallest value
- hypot: Returns hypotenuse

###### No argument methods
- random: Returns random number between 0 and 1

###### Constants (properties)
PI, E, LN10, LN2, LOG10E, LOG2E, SQRT1_2, SQRT2
```
<USAGE>

<SCHEMA>
```yaml
# Single argument
_math.methodName: number

# Named arguments
_math.pow:
  base: number
  exponent: number

# Array argument
_math.max:
  - number1
  - number2
  - number3

# No arguments
_math.random:

# Constant
_math.PI:
```
<SCHEMA>

<EXAMPLES>
### Round a number:
```yaml
_math.round:
  _state: calculated_value
```

Returns: Rounded integer

### Get absolute value:
```yaml
_math.abs:
  _subtract:
    - _state: target
    - _state: actual
```

Returns: Absolute difference

### Calculate power:
```yaml
_math.pow:
  base: 2
  exponent: 10
```

Returns: `1024`

### Find maximum value:
```yaml
_math.max:
  - _state: offer1.price
  - _state: offer2.price
  - _state: offer3.price
```

Returns: Highest price among offers

### Find minimum value:
```yaml
_math.min:
  - _state: option1.delivery_days
  - _state: option2.delivery_days
  - _state: option3.delivery_days
```

Returns: Fastest delivery option

### Floor for pagination:
```yaml
_math.floor:
  _divide:
    - _state: total_items
    - _state: items_per_page
```

Returns: Number of full pages

### Ceiling for required containers:
```yaml
_math.ceil:
  _divide:
    - _state: total_units
    - 12
```

Returns: Number of boxes needed (12 units per box)

### Get PI constant:
```yaml
_product:
  - 2
  - _math.PI:
  - _state: radius
```

Returns: Circumference of circle

### Calculate square root:
```yaml
_math.sqrt:
  _sum:
    - _math.pow:
        base:
          _state: side_a
        exponent: 2
    - _math.pow:
        base:
          _state: side_b
        exponent: 2
```

Returns: Hypotenuse using Pythagorean theorem

### Generate random number:
```yaml
_math.floor:
  _product:
    - _math.random:
    - 100
```

Returns: Random integer between 0 and 99
<EXAMPLES>
