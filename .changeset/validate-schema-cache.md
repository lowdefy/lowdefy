---
'@lowdefy/api': patch
---

fix: A `ValidateSchema` step compiles its schema once and reuses it, instead of compiling it again on every call. Validators are cached by schema content, so a schema built by operators still gets checked as it is on each call.
