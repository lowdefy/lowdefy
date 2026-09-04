---
name: lowdefy-enums
description: Use when a field takes one of a fixed set of values — defining the enum once, rendering selectors from it, and mapping values to labels and colours.
kind: recipe
lowdefyVersion: 5.5.1
---

# Enums

<!-- generated:reference:start -->
## Reference

What this skill covers, and the call that returns the live version from the running dev server. Read these before writing config - never write a type name or property from memory.

### Docs

`lowdefy_get_doc` by slug (or `GET /lowdefy-docs/content/{slug}`): `input-blocks/selector`, `input-blocks/radioselector`, `operators/_switch`, `operators/_get`.

### Blocks

`lowdefy_get_schema` with kind `blocks`, then `lowdefy_get_examples` for usage yaml: `Selector` (`@lowdefy/blocks-antd`), `RadioSelector` (`@lowdefy/blocks-antd`), `Tag` (`@lowdefy/blocks-antd`).

### Operators

`lowdefy_get_schema` with kind `operators`: `_switch` (`@lowdefy/operators-js`), `_get` (`@lowdefy/operators-js`).
<!-- generated:reference:end -->

## Recipe

Must cover: one `enums/<name>.yaml` file loaded with `_ref`, `options` with `{ value, label }`, `_get` on a lookup object for labels, `_switch` for colours, and validating a saved value is in the enum.
