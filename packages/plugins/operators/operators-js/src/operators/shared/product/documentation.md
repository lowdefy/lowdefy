<TITLE>_product</TITLE>
<METADATA>env: Shared</METADATA>
<DESCRIPTION>The `_product` operator takes the product of the values given as input. If a value is not a number, the value is skipped.</DESCRIPTION>
<USAGE>(values: any[]): number
###### array
An array of values to multiply.</USAGE>
<EXAMPLES>###### Two numbers:
```yaml
_product:
  - 3
  - 4
```
Returns: `12`

###### Array of numbers:

```yaml
_product:
  - 1
  - 2
  - 3
  - 4
```

Returns: `24`

###### Non-numbers are skipped:

```yaml
_product:
  - 1
  - null
  - 3
  - 'four'
  - 5
```

Returns: `15`</EXAMPLES>
