---
name: lowdefy-lists
description: Use when repeating blocks over an array in state — `List` and `ControlledList`, `$` index placeholders in block ids, `_index`, and adding/removing items.
kind: reference
lowdefyVersion: 5.5.1
---

# List blocks

<!-- generated:reference:start -->
## Reference

What this skill covers, and the call that returns the live version from the running dev server. Read these before writing config - never write a type name or property from memory.

### Docs

`lowdefy_get_doc` by slug (or `GET /lowdefy-docs/content/{slug}`): `concepts/lists`, `list-blocks/list`, `list-blocks/controlledlist`, `operators/_index`.

### Blocks

`lowdefy_get_schema` with kind `blocks`, then `lowdefy_get_examples` for usage yaml: `List` (`@lowdefy/blocks-basic`), `ControlledList` (`@lowdefy/blocks-antd`).

### Operators

`lowdefy_get_schema` with kind `operators`: `_index` (`@lowdefy/operators-js`).
<!-- generated:reference:end -->

## Recipe

Must cover: the list value in state, `$` placeholders in child ids, `_index` in child operators, `ControlledList` add/remove, `pushItem`/`removeItem` methods with `CallMethod`, and why hidden list items keep their values.
