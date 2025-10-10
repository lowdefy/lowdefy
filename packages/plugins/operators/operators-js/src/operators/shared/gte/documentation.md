<TITLE>_gte</TITLE>
<METADATA>env: Shared</METADATA>
<DESCRIPTION>The `_gte` operator tests if the first value is greater than or equal to the second equal. It takes an array of two values to test.

> The `_gte` operator tests using the javascript greater than or equal operator. You can find a description of the algorithm used to compare two values [here](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Less_than).</DESCRIPTION>
> <USAGE>([value1: any, value2: any]): boolean

###### array

An array of two values to compare.</USAGE>
<EXAMPLES>###### Two numbers:

```yaml
_gte:
  - 4
  - 3
```

Returns: `true`

```yaml
_gte:
  - 1
  - 1
```

Returns: `true`

```yaml
_gte:
  - _sum:
      - 3
      - 4
  - 8
```

Returns: `false`

###### Two strings:

```yaml
_gte:
  - 'a'
  - 'b'
```

Returns: `false`</EXAMPLES>
