---
'@lowdefy/api': patch
'@lowdefy/ai-utils': patch
---

fix: Expected outcomes are no longer logged as server errors.

- A Dynamic block whose content fails its policy check in a `ValidateDynamic` step, or whose routine ends with `:reject`, is logged once, as the warning its step already writes. It is no longer logged again at error level when the fallback renders. A payload the Dynamic block's endpoint refuses is logged once as a warning.
- An agent `onFinish` hook endpoint that refuses the finish payload with its `payloadSchema` is logged as a warning, not an error.
