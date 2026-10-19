---
'@lowdefy/api': patch
---

fix: A UserError raised in an endpoint routine is logged once, as a warning.

- A Dynamic block whose content fails its policy check in a `ValidateDynamic` step, or whose routine ends with `:reject`, is logged once, as the warning its step already writes. It is no longer logged again at error level when the fallback renders. A payload the Dynamic block's endpoint refuses is logged once as a warning.
- A nested `CallApi` whose payload the target endpoint's `payloadSchema` refuses is logged as a warning where it happens. Before, the routine returned it without logging it.
