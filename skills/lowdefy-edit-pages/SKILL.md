---
name: lowdefy-edit-pages
description: Use when building a create/edit form page — loading the record into state, validating, saving with a request, and navigating back with feedback.
kind: recipe
lowdefyVersion: 5.5.1
---

# Edit pages

<!-- generated:reference:start -->
## Reference

What this skill covers, and the call that returns the live version from the running dev server. Read these before writing config - never write a type name or property from memory.

### Docs

`lowdefy_get_doc` by slug (or `GET /lowdefy-docs/content/{slug}`): `actions/request`, `actions/validate`, `actions/setstate`, `actions/reset`.

### Blocks

`lowdefy_get_schema` with kind `blocks`, then `lowdefy_get_examples` for usage yaml: `Button` (`@lowdefy/blocks-antd`), `Card` (`@lowdefy/blocks-antd`).

### Actions

`lowdefy_get_schema` with kind `actions`: `Request` (`@lowdefy/actions-core`), `Validate` (`@lowdefy/actions-core`), `SetState` (`@lowdefy/actions-core`), `Reset` (`@lowdefy/actions-core`), `Link` (`@lowdefy/actions-core`).

### Requests

`lowdefy_get_schema` with kind `requests`: `MongoDBFindOne` (`@lowdefy/connection-mongodb`), `MongoDBUpdateOne` (`@lowdefy/connection-mongodb`).
<!-- generated:reference:end -->

## Recipe

Must cover: load with `onInitAsync` then `SetState` from `_request`, block ids equal to field paths, `Validate` before the save `Request`, `$set` from `_state`, a `DisplayMessage` on success, `Link` back with `urlQuery`, and the create vs. edit switch on `_url_query`.
