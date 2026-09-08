# _uri

The `_uri` operator [encodes and decodes](https://en.wikipedia.org/wiki/Percent-encoding) Uniform Resource Identifiers (URI). It encodes characters that are not in the limited US-ASCII characters legal within a URI.

> This operator can be used as a [`_build`](/_build) operator method.

# Operator methods:

## _uri.decode

```
(value: string): string
```

The `_uri.decode` method decodes a string that has been uri-encoded. It uses [`decodeURIComponent`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent).

#### Arguments

###### string
The string to decode.

#### Examples

###### Decode a base64 string:
```yaml
_uri.decode: http%3A%2F%2Fusername%3Apassword%40www.example.com%3A80%2Fpath%2Fto%2Ffile.php%3Ffoo%3D316%26bar%3Dthis%2Bhas%2Bspaces%23anchor
```
Returns: `"http://username:password@www.example.com:80/path/to/file.php?foo=316&bar=this+has+spaces#anchor"`.

## _uri.encode

```
(value: string): string
```

The `_uri.encode` uri-encodes a string. It uses [`encodeURIComponent`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent).

#### Arguments

###### string
The string to encode.

#### Examples

###### Encode a string as base64:
```yaml
_uri.encode: http://username:password@www.example.com:80/path/to/file.php?foo=316&bar=this+has+spaces#anchor
```
Returns: `"http%3A%2F%2Fusername%3Apassword%40www.example.com%3A80%2Fpath%2Fto%2Ffile.php%3Ffoo%3D316%26bar%3Dthis%2Bhas%2Bspaces%23anchor"`.
