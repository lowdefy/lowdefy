---
name: lowdefy-status-fields
description: Use when showing a boolean or status value at a glance — tags, badges, switches, statistics, and consistent colour mapping.
kind: recipe
lowdefyVersion: 5.5.1
---

# Status fields

<!-- generated:reference:start -->
## Reference

What this skill covers, and the call that returns the live version from the running dev server. Read these before writing config - never write a type name or property from memory.

### Docs

`lowdefy_get_doc` by slug (or `GET /lowdefy-docs/content/{slug}`): `display-blocks/tag`, `display-blocks/statistic`, `input-blocks/switch`.

### Blocks

`lowdefy_get_schema` with kind `blocks`, then `lowdefy_get_examples` for usage yaml: `Tag` (`@lowdefy/blocks-antd`), `Badge` (`@lowdefy/blocks-antd`), `Statistic` (`@lowdefy/blocks-antd`), `Switch` (`@lowdefy/blocks-antd`).

### Operators

`lowdefy_get_schema` with kind `operators`: `_if` (`@lowdefy/operators-js`), `_switch` (`@lowdefy/operators-js`).
<!-- generated:reference:end -->

## Recipe

Must cover: `Tag` for enum values, `Badge` for counts, `Switch` for booleans (read-only with `disabled`), `Statistic` for numbers, and a shared colour mapping loaded with `_ref`.
