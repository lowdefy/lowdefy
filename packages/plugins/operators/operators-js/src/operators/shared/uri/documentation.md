<TITLE>_uri</TITLE>
<METADATA>env: Shared</METADATA>
<DESCRIPTION>The `_uri` operator [encodes and decodes](https://en.wikipedia.org/wiki/Percent-encoding) Uniform Resource Identifiers (URI). It encodes characters that are not in the limited US-ASCII characters legal within a URI.</DESCRIPTION>
<USAGE>decode(value: string): string
encode(value: string): string
###### decode
The `_uri.decode` method decodes a string that has been uri-encoded. It uses [`decodeURIComponent`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent).
###### string
The string to decode.
###### encode
The `_uri.encode` uri-encodes a string. It uses [`encodeURIComponent`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent).
###### string
The string to encode.</USAGE>
<EXAMPLES>###### Decode a base64 string:
```yaml
_uri.decode: http%3A%2F%2Fusername%3Apassword%40www.example.com%3A80%2Fpath%2Fto%2Ffile.php%3Ffoo%3D316%26bar%3Dthis%2Bhas%2Bspaces%23anchor
```
Returns: `"http://username:password@www.example.com:80/path/to/file.php?foo=316&bar=this+has+spaces#anchor"`.

###### Encode a string as base64:

```yaml
_uri.encode: http://username:password@www.example.com:80/path/to/file.php?foo=316&bar=this+has+spaces#anchor
```

Returns: `"http%3A%2F%2Fusername%3Apassword%40www.example.com%3A80%2Fpath%2Fto%2Ffile.php%3Ffoo%3D316%26bar%3Dthis%2Bhas%2Bspaces%23anchor"`.</EXAMPLES>
