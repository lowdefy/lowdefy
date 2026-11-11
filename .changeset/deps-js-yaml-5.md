---
'@lowdefy/e2e-utils': major
---

fix(deps)!: Update js-yaml to 5.5.0

`@lowdefy/e2e-utils` now reads your `e2e/mocks.yaml` with js-yaml 5. By default js-yaml 5 no longer merges `<<` keys, loads unquoted dates as strings and throws on an empty file. Lowdefy turns merge keys and dates back on and treats an empty file as having no mocks, so almost every mocks file loads exactly as before:

- `<<: *anchor` merge keys still merge.
- Unquoted dates and date-times (`2026-01-15`, `2026-01-15T10:00:00Z`) still load as dates, so a mocked request still returns a `Date`.
- An empty mocks file, or one with only comments, still has no mocks.
- `yes`, `no`, `on` and `off` are still strings, as they were with js-yaml 4.

What changes, and how to tell whether your mocks file is affected:

- **The YAML 1.1 tags `!!binary`, `!!set`, `!!omap` and `!!pairs` are no longer supported.** A mocks file that uses one fails to load with `unknown ... tag`. Write the value as a plain string, list or mapping instead.
- **A mapping key that is a list or a mapping fails to load** with `object-based map does not support complex keys`. js-yaml 4 turned `? [a, b]` into the key `"a,b"`. Write the key as a string.
- **Binary numbers are strings.** `0b101` used to load as `5` and now loads as the string `"0b101"`. Write the number in decimal. `+.5` now loads as the number `0.5`.
- **A mocks file with more than one YAML document** (separated by `---`) still fails, now with `Mocks file "<path>" has 2 YAML documents. Put all mocks in one document.`

```yaml
# Before: fails to load with js-yaml 5
requests:
  - requestId: fetch_flags
    response:
      flags: !!set { beta, admin }
      mask: 0b101

# After
requests:
  - requestId: fetch_flags
    response:
      flags:
        - beta
        - admin
      mask: 5
```

The setup command (`npx @lowdefy/e2e-utils`) reads and rewrites the app's `pnpm-workspace.yaml` to allow dependency build scripts. An empty `pnpm-workspace.yaml`, or one with only comments, is still treated as an empty config.
