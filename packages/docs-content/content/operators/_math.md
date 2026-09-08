# _math

The `_math` operator can be used to run javascript [`Math`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math) methods.

The `_math` operator can take arguments in the following forms:

###### No Arguments
```text
(void): number
```

Some methods like `_math.PI` take no arguments:
```yaml
_math.PI: null
```
Returns: `pi`

###### Single argument
```text
(x: number): number
```

Some methods like `_math.round` take a single argument:
```yaml
_math.round: 3.14
```
Returns: `3`

###### Named arguments
```text
({x: number, y: number}): number
([x: number, y: number]): number
```

Some methods like `_math.pow` take an object with named arguments:
```yaml
_math.pow:
  base: 2
  exponent: 3
```
Returns: `8`

These methods also accept their arguments as an array:
```yaml
_math.pow:
  - 2
  - 3
```
Returns: `8`

###### Array arguments
```text
(values: number[]): number
```

Some methods like `_math.max` take an array of values as arguments:
```
_math.max:
  - 42
  - 99
  - 0
```
Returns: `99`

> This operator can be used as a [`_build`](/_build) operator method.

# Operator methods:

## _math.abs

```
(x: number): number
```

The `_math.abs` method returns the [absolute value](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/abs) of a number.

## _math.acos

```
(x: number): number
```

The `_math.acos` method returns the [arccosine](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/acos) (in radians) of a number.

## _math.acosh

```
(x: number): number
```

The `_math.acosh` method returns the [hyperbolic arc-cosine](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/acosh) of a number.

## _math.asin

```
(x: number): number
```

The `_math.asin` method returns the [arcsine](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/asin) (in radians) of a number.

## _math.atan

```
(x: number): number
```

The `_math.atan` method returns the [arctangent](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/atan) (in radians) of a number.

## _math.atan2

```
({x: number, y: number}): number
([x: number, y: number]): number
```

The `_math.atan2` method returns the [angle in the plane (in radians) between the positive x-axis and the ray from (0,0) to the point (x,y)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/atan2).

## _math.atanh

```
(x: number): number
```

The `_math.atanh` method returns the [hyperbolic arctangent](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/atanh) of a number.

## _math.cbrt

```
(x: number): number
```

The `_math.cbrt` method returns the returns the [cube root](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/cbrt) of a number.

## _math.ceil

```
(x: number): number
```

The `_math.ceil` method [rounds a number up](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/ceil) to the next largest integer.

## _math.clz32

```
(x: number): number
```

The `_math.clz32` method returns the [number of leading zero bits in the 32-bit binary representation of a number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/clz32).

## _math.cos

```
(x: number): number
```

The `_math.cos` method returns the [cosine](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/cos) of the specified angle, which must be specified in radians

## _math.cosh

```
(x: number): number
```

The `_math.cosh` method returns the [hyperbolic cosine](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/cosh) of a number.

## _math.exp

```
(x: number): number
```

The `_math.exp` method returns [`e` (Euler's number) to the power `x`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/exp).

## _math.expm1

```
(x: number): number
```

The `_math.expm1` method returns [`e` (Euler's number) to the power `x` minus `1`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/expm1).

## _math.floor

```
(x: number): number
```

The `_math.floor` method returns the [largest integer less than or equal to a given number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/floor).

## _math.fround

```
(x: number): number
```

The `_math.fround` method returns the [nearest 32-bit single precision float representation of a number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/fround).

## _math.hypot

```
(values: number[]): number
```

The `_math.hypot` method returns the [square root of the sum of squares of its arguments](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/hypot).

## _math.imul

```
({a: number, b: number}): number
([a: number, b: number]): number
```

The `_math.imul` method returns the [result of the C-like 32-bit multiplication of the two parameters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/imul).

## _math.log

```
(x: number): number
```

The `_math.log` method returns the [natural logarithm](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/log) (base `e`) of a number.

## _math.log10

```
(x: number): number
```

The `_math.log10` method returns the [base `10` logarithm](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/log10) of a number.

## _math.log1p

```
(x: number): number
```

The `_math.log1p` method returns the [natural logarithm (base e) of `1 + a number`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/log1p).

## _math.log2

```
(x: number): number
```

The `_math.log2` method returns the [base `2` logarithm](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/log2) of a number.

## _math.max

```
(values: number[]): number
```

The `_math.max` method returns the [largest of the numbers](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/max) given as input parameters.

## _math.min

```
(values: number[]): number
```

The `_math.min` method returns the [smallest of the numbers](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/max) given as input parameters.

## _math.mod

```
({dividend: number, divisor: number}): number
([dividend: number, divisor: number]): number
```

The `_math.mod` method returns the remainder of the `dividend` divided by the `divisor` (the [modulo operation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Remainder)).

## _math.pow

```
({base: number, exponent: number}): number
([base: number, exponent: number]): number
```

The `_math.pow` method returns the [`base` to the `exponent` power](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/pow).

## _math.random

```
(void): number
```

The `_math.random` method returns a floating-point, [pseudo-random number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random) in the range `0` to less than `1`.

## _math.round

```
(x: number): number
```

The `_math.round` method returns the value of a number [rounded to the nearest integer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/round).

## _math.sign

```
(x: number): number
```

The `_math.sign` method returns either a [positive or negative 1 (`+/- 1`)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/sign), indicating the sign of a number passed into the argument.

## _math.sin

```
(x: number): number
```

The `_math.sin` method returns the [sine](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/sin) of a number.

## _math.sinh

```
(x: number): number
```

The `_math.sinh` method returns the [hyperbolic sine](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/sinh) of a number.

## _math.sqrt

```
(x: number): number
```

The `_math.sqrt` method returns the [square root](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/sqrt) of a number.

## _math.tan

```
(x: number): number
```

The `_math.tan` method returns the [tangent](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/tan) of a number.

## _math.trunc

```
(x: number): number
```

The `_math.trunc` method returns the [integer part](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/trunc) of a number by removing any fractional digits.

## _math.E

```
(void): number
```

The `_math.E` method returns [Euler's number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/E), the base of natural logarithms, `e`, which is approximately 2.718.

## _math.LN10

```
(void): number
```

The `_math.LN10` method returns the [natural logarithm of `10`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/LN10), which is approximately 2.302.

## _math.LN2

```
(void): number
```

The `_math.LN2` method returns the [natural logarithm of `2`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/LN2), which is approximately 0.693.

## _math.LOG10E

```
(void): number
```

The `_math.LOG10E` method returns the [base `10` logarithm of `e`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/LOG10E), which is approximately 0.434.

## _math.LOG2E

```
(void): number
```

The `_math.LOG2E` method returns the [base `2` logarithm of `e`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/LOG2E), which is approximately 1.442.

## _math.PI

```
(void): number
```

The `_math.PI` method returns the constant [`pi`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/PI), the ratio of the circumference of a circle to its diameter, which is approximately 3.14159.

## _math.SQRT1_2

```
(void): number
```

The `_math.SQRT1_2` method returns the [square root of `1/2`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/SQRT1_2), which is approximately 0.707.

## _math.SQRT2

```
(void): number
```

The `_math.SQRT2` method returns the [square root of `2`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/SQRT2), which is approximately 1.414.
