---
'@lowdefy/operators-js': patch
---

fix(operators-js): `_base64` in the browser encodes and decodes UTF-8 text

`_base64.encode` and `_base64.decode` in the browser now read and write the UTF-8 bytes of a string, as they do on the server and in `_build`. Before, the browser used Latin-1, so text with an accented letter encoded to a different value than on the server, decoding server-encoded text gave garbled characters, and text with other characters, such as emoji or Chinese, threw an `Invalid character` error.
