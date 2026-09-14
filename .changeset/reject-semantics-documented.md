---
'@lowdefy/docs': patch
'@lowdefy/docs-content': patch
'@lowdefy/build': patch
---

Document `:reject` vs `:throw` semantics in API routines: `:reject` is a reply, not an exception; `:try`/`:catch` never catches it, while `:finally` still runs. Use `:throw` for failures a `:catch` should handle. The `:try`, `:reject` and `:throw` docs pages and the API concepts page now state the rule, and the routine control types carry a `description` for tools to quote.
