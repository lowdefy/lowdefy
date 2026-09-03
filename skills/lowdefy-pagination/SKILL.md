---
name: lowdefy-pagination
description: Use when a list is too long for one request — page and size in state, `skip`/`limit` in the query, a total count, and the `Pagination` block.
kind: recipe
lowdefyVersion: 5.5.1
---

# Pagination

<!-- generated:reference:start -->
## Reference

What this skill covers, and the call that returns the live version from the running dev server. Read these before writing config - never write a type name or property from memory.

### Docs

`lowdefy_get_doc` by slug (or `GET /lowdefy-docs/content/{slug}`): `input-blocks/pagination`, `operators/_request`.

### Blocks

`lowdefy_get_schema` with kind `blocks`, then `lowdefy_get_examples` for usage yaml: `Pagination` (`@lowdefy/blocks-antd`).

### Operators

`lowdefy_get_schema` with kind `operators`: `_request` (`@lowdefy/operators-js`), `_state` (`@lowdefy/operators-js`), `_product` (`@lowdefy/operators-js`).

### Requests

`lowdefy_get_schema` with kind `requests`: `MongoDBFind` (`@lowdefy/connection-mongodb`), `MongoDBAggregation` (`@lowdefy/connection-mongodb`).
<!-- generated:reference:end -->

## Recipe

Must cover: `page`/`pageSize` in state, `skip: (page - 1) * pageSize` via `_product`, `$facet` for rows and total in one request, `Pagination` `onChange` re-running the request, and resetting to page 1 when filters change.
