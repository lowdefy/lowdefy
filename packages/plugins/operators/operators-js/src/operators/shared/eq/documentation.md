<TITLE>_eq</TITLE>
<METADATA>env: Shared</METADATA>
<DESCRIPTION>The `_eq` operator tests if two values are equal. It takes an array of two values to test.

> The `_eq` operator tests for strict equality, and won't do a deep comparison.</DESCRIPTION>
> <USAGE>([value1: any, value2: any]): boolean

###### array

An array of two values to compare.</USAGE>
<EXAMPLES>###### Two strings:

```yaml
_eq:
  - 'Hello'
  - 'Hello'
```

Returns: `true`

###### Two numbers:

```yaml
_eq:
  - _sum:
      - 3
      - 4
  - 8
```

Returns: `false`

###### Arrays are not compared deeply:

```yaml
_eq:
  - [1, 2, 3]
  - [1, 2, 3]
```

Returns: `false`

###### Values from "getter" operators are copies and not equal:

```yaml
_eq:
  - _state: my_object
  - _state: my_object
```

Returns: `false`</EXAMPLES>
