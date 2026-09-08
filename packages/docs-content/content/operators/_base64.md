# _base64

The `_base64` operator converts strings to and from [base64](https://en.wikipedia.org/wiki/Base64) format.

> This operator can be used as a [`_build`](/_build) operator method.

# Operator methods:

## _base64.decode

```
(value: string): string
```

The `_base64.decode` method decodes base64 encoded content into an ASCII string.

#### Arguments

###### string
The string to decode.

#### Examples

###### Decode a base64 string:
```yaml
_base64.decode: SGVsbG8=
```
Returns: `"Hello"`.

## _base64.encode

```
(value: string): string
```

The `_base64.encode` method base64 encodes a ASCII string.

#### Arguments

###### string
The string to encode.

#### Examples

###### Encode a string as base64:
```yaml
_base64.encode: Hello
```
Returns: `"SGVsbG8="`.
