<TITLE>_base64</TITLE>
<METADATA>env: Server</METADATA>
<DESCRIPTION>The `_base64` operator converts strings to and from [base64](https://en.wikipedia.org/wiki/Base64) format.</DESCRIPTION>
<USAGE>decode: (value: string): string
encode: (value: string): string</USAGE>
<EXAMPLES>###### Decode a base64 string:
```yaml
_base64.decode: SGVsbG8=
```
Returns: `"Hello"`.

###### Encode a string as base64:

```yaml
_base64.encode: Hello
```

Returns: `"SGVsbG8="`.</EXAMPLES>
