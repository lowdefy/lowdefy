---
name: lowdefy-aggrid-tables
description: Use when building a data table with AgGrid — column definitions, cell renderers, row click to a detail page, selection, and editable grids that write back to state.
kind: reference
lowdefyVersion: 5.5.1
---

# AgGrid tables

<!-- generated:reference:start -->
## Reference

What this skill covers, and the call that returns the live version from the running dev server. Read these before writing config - never write a type name or property from memory.

### Docs

`lowdefy_get_doc` by slug (or `GET /lowdefy-docs/content/{slug}`): `display-blocks/aggrid`.

### Blocks

`lowdefy_get_schema` with kind `blocks`, then `lowdefy_get_examples` for usage yaml: `AgGridLowdefy` (`@lowdefy/blocks-aggrid`), `AgGridLowdefyInput` (`@lowdefy/blocks-aggrid`).
<!-- generated:reference:end -->

## Recipe

Must cover: `rowData` from a request, `columnDefs` with `valueFormatter` and `cellRenderer`, `onRowClick` to a detail page, the Lowdefy theme, `AgGridLowdefyInput` for editable rows, and pagination/quick filter.
