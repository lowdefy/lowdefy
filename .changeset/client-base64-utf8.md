---
'@lowdefy/operators-js': patch
'@lowdefy/docs': patch
'@lowdefy/docs-content': patch
---

fix(operators-js): `_base64` in the browser encodes and decodes UTF-8 text

`_base64.encode` and `_base64.decode` in the browser now read and write the UTF-8 bytes of a string, like the server and `_build` versions. Before, the browser used Latin-1: text with an accented letter encoded to a different value than on the server, decoding server-encoded text gave garbled characters, and text such as emoji or Chinese threw an `Invalid character` error. `_base64.decode` in the browser also accepts base64url and unpadded input, as the server does. Other characters outside the base64 alphabet still throw in the browser, where the server ignores them.

ASCII text encodes and decodes as before. Non-ASCII text that an earlier version encoded in the browser is Latin-1, not UTF-8, so `_base64.decode` in the browser now throws an error for it instead of returning the original text. Re-encode stored values like these. Base64 of bytes that are not UTF-8 text, such as binary files, also throws in the browser, where the server replaces the invalid bytes with U+FFFD.
