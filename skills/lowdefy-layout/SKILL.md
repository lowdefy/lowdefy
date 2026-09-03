---
name: lowdefy-layout
description: Use when arranging blocks on a page — the grid layout system, `layout.size` and `span`, `Box` and `Flex` containers, alignment, gutters and responsive breakpoints.
kind: reference
lowdefyVersion: 5.5.1
---

# Layout

<!-- generated:reference:start -->
## Reference

What this skill covers, and the call that returns the live version from the running dev server. Read these before writing config - never write a type name or property from memory.

### Docs

`lowdefy_get_doc` by slug (or `GET /lowdefy-docs/content/{slug}`): `concepts/layout-overview`, `container-blocks/box`, `container-blocks/flex`.

### Blocks

`lowdefy_get_schema` with kind `blocks`, then `lowdefy_get_examples` for usage yaml: `Box` (`@lowdefy/blocks-basic`), `Flex` (`@lowdefy/blocks-antd`), `Card` (`@lowdefy/blocks-antd`).
<!-- generated:reference:end -->

## Recipe

Must cover: `layout.span` (24-column grid) and `layout.size`, `blocks` vs. `areas`, `Flex` for one-dimensional rows, `Box` as the neutral container, `contentGutter`, responsive `span` objects, and avoiding nested grids for simple rows.
