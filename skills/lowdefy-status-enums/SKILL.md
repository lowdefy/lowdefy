---
name: lowdefy-status-enums
description: Use when a record moves through statuses — the status enum, allowed transitions, tag colours, filtering by status and guarding writes.
kind: recipe
lowdefyVersion: 5.5.1
---

# Status enums

<!-- generated:reference:start -->
## Reference

What this skill covers, and the call that returns the live version from the running dev server. Read these before writing config - never write a type name or property from memory.

### Docs

`lowdefy_get_doc` by slug (or `GET /lowdefy-docs/content/{slug}`): `display-blocks/tag`, `input-blocks/selector`, `operators/_switch`.

### Blocks

`lowdefy_get_schema` with kind `blocks`, then `lowdefy_get_examples` for usage yaml: `Tag` (`@lowdefy/blocks-antd`), `Selector` (`@lowdefy/blocks-antd`), `Steps` (`@lowdefy/blocks-antd`).

### Operators

`lowdefy_get_schema` with kind `operators`: `_switch` (`@lowdefy/operators-js`).
<!-- generated:reference:end -->

## Recipe

Must cover: `enums/status.yaml` with `value`, `label`, `color`, `next`, `Tag` colour by `_switch`, a transition button per allowed `next`, guarding the transition in the request `$match`, and `Steps` for progress.
