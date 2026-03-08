---
'@lowdefy/build': minor
'@lowdefy/client': minor
'@lowdefy/engine': minor
---

Unify style/styles into single `style` property with `--` prefixed CSS slot keys.

The confusing `style` vs `styles` (plural) distinction is replaced by a single `style` property. CSS slot keys use `--` prefix (e.g., `--element`, `--header`, `--body`) to distinguish from plain CSS properties. Using `styles` (plural) now throws a `ConfigError` with migration guidance.
