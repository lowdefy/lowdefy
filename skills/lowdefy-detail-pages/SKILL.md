---
name: lowdefy-detail-pages
description: Use when building a page that shows one record — reading the id from urlQuery, fetching it, a not-found state, a loading skeleton and links to edit.
kind: recipe
lowdefyVersion: 5.5.1
---

# Detail pages

<!-- generated:reference:start -->
## Reference

What this skill covers, and the call that returns the live version from the running dev server. Read these before writing config - never write a type name or property from memory.

### Docs

`lowdefy_get_doc` by slug (or `GET /lowdefy-docs/content/{slug}`): `operators/_url_query`, `operators/_request`, `actions/link`, `container-blocks/descriptions`.

### Blocks

`lowdefy_get_schema` with kind `blocks`, then `lowdefy_get_examples` for usage yaml: `Descriptions` (`@lowdefy/blocks-antd`), `Card` (`@lowdefy/blocks-antd`), `Result` (`@lowdefy/blocks-antd`).

### Operators

`lowdefy_get_schema` with kind `operators`: `_url_query` (`@lowdefy/operators-js`), `_request` (`@lowdefy/operators-js`).

### Actions

`lowdefy_get_schema` with kind `actions`: `Link` (`@lowdefy/actions-core`).

### Requests

`lowdefy_get_schema` with kind `requests`: `MongoDBFindOne` (`@lowdefy/connection-mongodb`).
<!-- generated:reference:end -->

## Recipe

Must cover: `_url_query: id` into `payload`, `onInitAsync` request, `Descriptions` items from `_request`, a `Result` not-found state when the request returns `null`, skeleton while loading, and an edit `Link` carrying `urlQuery`.
