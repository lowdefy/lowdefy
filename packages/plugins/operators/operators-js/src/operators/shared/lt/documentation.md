<TITLE>_lt</TITLE>
<METADATA>env: Shared</METADATA>
<DESCRIPTION>The `_lt` operator tests if the first value is less than the second equal. It takes an array of two values to test.

> The `_lt` operator tests using the javascript less than operator. You can find a description of the algorithm used to compare two values [here](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Less_than).</DESCRIPTION>
> <USAGE>([value1: any, value2: any]): boolean

###### array

An array of two values to compare.</USAGE>
<EXAMPLES>###### Two numbers:

```yaml
_lt:
  - 4
  - 3
```

Returns: `false`

```yaml
_lt:
  - 1
  - 1
```

Returns: `false`

```yaml
_lt:
  - _sum:
      - 3
      - 4
  - 8
```

Returns: `true`

###### Two strings:

```yaml
_lt:
  - 'a'
  - 'b'
```

Returns: `true`</EXAMPLES>
