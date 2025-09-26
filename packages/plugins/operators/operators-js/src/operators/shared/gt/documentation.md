<TITLE>_gt</TITLE>
<METADATA>env: Shared</METADATA>
<DESCRIPTION>The `_gt` operator tests if the first value is greater than the second equal. It takes an array of two values to test.

> The `_gt` operator tests using the javascript greater than operator. You can find a description of the algorithm used to compare two values [here](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Less_than).</DESCRIPTION>
> <USAGE>([value1: any, value2: any]): boolean

###### array

An array of two values to compare.</USAGE>
<EXAMPLES>###### Two numbers:

```yaml
_gt:
  - 4
  - 3
```

Returns: `true`

```yaml
_gt:
  - 1
  - 1
```

Returns: `false`

```yaml
_gt:
  - _sum:
      - 3
      - 4
  - 8
```

Returns: `false`

###### Two strings:

```yaml
_gt:
  - 'a'
  - 'b'
```

Returns: `false`</EXAMPLES>
