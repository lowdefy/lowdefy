---
'@lowdefy/api': patch
---

fix: A webhook endpoint sends its response as plain JSON. A date in the `:return` value now arrives as an ISO string instead of `{ "~d": 1767323045000 }`, and an error as its message fields instead of `{ "~e": ... }`.
