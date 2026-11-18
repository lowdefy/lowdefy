---
'lowdefy': patch
---

fix(deps): Update commander to 15.1.0

Commander 15 is ESM only and needs Node 22.12 (the CLI already needs Node 24). The CLI's options parse the same way: its only option with both a positive and a negative form, `journeys coverage --group` / `--no-group`, declares the positive form first, which leaves the default unset in both versions. Error messages now name excess command arguments.
