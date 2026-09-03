---
name: lowdefy-charts
description: Use when rendering a chart from request data with EChart — mapping rows to series, axes, tooltips, responsive sizing and empty/loading states.
kind: reference
lowdefyVersion: 5.5.1
---

# Charts

<!-- generated:reference:start -->
## Reference

What this skill covers, and the call that returns the live version from the running dev server. Read these before writing config - never write a type name or property from memory.

### Docs

`lowdefy_get_doc` by slug (or `GET /lowdefy-docs/content/{slug}`): `display-blocks/echart`.

### Blocks

`lowdefy_get_schema` with kind `blocks`, then `lowdefy_get_examples` for usage yaml: `EChart` (`@lowdefy/blocks-echarts`).

### Operators

`lowdefy_get_schema` with kind `operators`: `_array` (`@lowdefy/operators-js`), `_get` (`@lowdefy/operators-js`).
<!-- generated:reference:end -->

## Recipe

Must cover: `option` built from `_request` data, mapping rows to `xAxis.data` and `series[].data` with `_array.map`, `height`, `onClick` events with the clicked datum, and an empty state when the request returns no rows.
