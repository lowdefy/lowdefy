---
name: lowdefy-filters
description: Use when adding filter controls to a list or table — filter state, building a query from it, clearing filters, and keeping filters in the url.
kind: recipe
lowdefyVersion: 5.5.1
---

# Filters

<!-- generated:reference:start -->
## Reference

What this skill covers, and the call that returns the live version from the running dev server. Read these before writing config - never write a type name or property from memory.

### Docs

`lowdefy_get_doc` by slug (or `GET /lowdefy-docs/content/{slug}`): `operators/_state`, `operators/_mql`, `input-blocks/selector`, `input-blocks/daterangeselector`.

### Blocks

`lowdefy_get_schema` with kind `blocks`, then `lowdefy_get_examples` for usage yaml: `Selector` (`@lowdefy/blocks-antd`), `TextInput` (`@lowdefy/blocks-antd`), `DateRangeSelector` (`@lowdefy/blocks-antd`).

### Operators

`lowdefy_get_schema` with kind `operators`: `_state` (`@lowdefy/operators-js`), `_if_none` (`@lowdefy/operators-js`), `_mql` (`@lowdefy/operators-mql`).

### Requests

`lowdefy_get_schema` with kind `requests`: `MongoDBFind` (`@lowdefy/connection-mongodb`).
<!-- generated:reference:end -->

## Recipe

Must cover: a `filters` object in state, `payload` built from `_state: filters`, dropping empty filters from the query, `_regex` search fields, date ranges to `$gte`/`$lte`, a clear button with `SetState`, and syncing filters to `urlQuery`.
