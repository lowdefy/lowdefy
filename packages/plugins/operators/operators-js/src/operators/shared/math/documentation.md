<TITLE>_math</TITLE>
<METADATA>env: Shared</METADATA>
<DESCRIPTION>The `_math` operator can be used to run javascript [`Math`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math) methods.

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

Returns: `99`</DESCRIPTION>
<USAGE>The `_math` operator can be used to run javascript [`Math`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math) methods.

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

Returns: `99`</USAGE>
<EXAMPLES></EXAMPLES>
