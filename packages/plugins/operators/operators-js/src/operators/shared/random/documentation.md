<TITLE>_random</TITLE>
<METADATA>env: Shared</METADATA>
<DESCRIPTION>The `_random` operator returns a random string or number. The types it accepts are `string`, `integer`, or `float`.</DESCRIPTION>
<USAGE>(type: string): string | number
(arguments: {
  type: string,
  length?: number,
  max?: number,
  min?: number
}): string | number
###### string
The type to generate. One of `string`, `integer`, or `float`.

###### object

- `type: string`: **Required** - The type to generate. One of `string`, `integer`, or `float`.
- `length: string`: The length of the string to generate if type is `string`. Default is `8`.
- `max: number`: The maximum possible number if type is one of `integer` or `float`. Default is `100` if `integer` or `1` if `float`.
- `min: number`: The minimum possible number if type is one of `integer` or `float`. Default is `0`.</USAGE>
  <EXAMPLES>###### Random string:

```yaml
_random: string
```

Returns: Random string of length 8.

```yaml
_random:
  type: string
```

Returns: Random string of length 8.

###### Random integer:

```yaml
_random: integer
```

Returns: Random integer between 0 and 100 inclusive.

```yaml
_random:
  type: integer
```

Returns: Random integer between 0 and 100 inclusive.

###### Random float:

```yaml
_random: float
```

Returns: Random float between 0 and 1 inclusive.

```yaml
_random:
  type: float
```

Returns: Random float between 0 and 1 inclusive.

###### Random string of length 12:

```yaml
_random:
  type: string
  length: 12
```

Returns: Random string of length 12.

###### Random integer between 1 and 6 (Dice roll):

```yaml
_random:
  type: integer
  min: 1
  max: 6
```

Returns: Random integer between 1 and 6 inclusive.

###### Random float between 34.2 and 42.89:

```yaml
_random:
  type: float
  min: 34.2
  max: 42.89
```

Returns: Random float between 34.2 and 42.89 inclusive.</EXAMPLES>
