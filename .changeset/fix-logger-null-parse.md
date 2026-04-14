---
'@lowdefy/logger': patch
---

fix(logger): Handle non-object JSON values in stdout line handler.

`JSON.parse` can return `null` for literal `"null"` input, crashing the CLI log handler. Non-object parsed values are now treated as plain text lines.
