<TITLE>_if_none</TITLE>
<METADATA>env: Shared</METADATA>
<DESCRIPTION>The `_if_none` operator replaces the input value with an alternative if the value is of a "none-type" like `null` or `undefined`.</DESCRIPTION>
<USAGE>([value: any, replacement: any]): any
###### array
- First value: The value to test.
- Second value: The replacement.</USAGE>
<EXAMPLES>###### The value is not replaced if it is not of a none-type:
```yaml
_if_none:
  - Value
  - Replacement
```
Returns: `Value`

###### The value is replaced if it is of a none-type:

```yaml
_if_none:
  - null
  - 'Replacement'
```

Returns: `"Replacement"`

```yaml
_if_none:
  - _state: does_not_exist # Value in state that does not exist
  - 'Replacement'
```

Returns: `"Replacement"`

```yaml
_if_none:
  - _request: still_loading # _request returns null if the request is loading
  - []
```

Returns: `[]`</EXAMPLES>
