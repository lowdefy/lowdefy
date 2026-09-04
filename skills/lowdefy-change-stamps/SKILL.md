---
name: lowdefy-change-stamps
description: Use when records need created/updated audit fields — who changed what and when — written consistently from a page action or an Api routine.
kind: recipe
lowdefyVersion: 5.5.1
---

# Change stamps

<!-- generated:reference:start -->
## Reference

What this skill covers, and the call that returns the live version from the running dev server. Read these before writing config - never write a type name or property from memory.

### Docs

`lowdefy_get_doc` by slug (or `GET /lowdefy-docs/content/{slug}`): `operators/_date`, `operators/_user`, `operators/_dayjs`.

### Operators

`lowdefy_get_schema` with kind `operators`: `_date` (`@lowdefy/operators-js`), `_user` (`@lowdefy/operators-js`).

### Requests

`lowdefy_get_schema` with kind `requests`: `MongoDBInsertOne` (`@lowdefy/connection-mongodb`), `MongoDBUpdateOne` (`@lowdefy/connection-mongodb`).
<!-- generated:reference:end -->

## Recipe

Must cover: the `created`/`updated` `{ at, by }` shape, setting `created` only with `$setOnInsert`, stamping server-side in the request (never trusting client dates), which `_user` fields to store, and MongoDB `_date: now` versus the driver `Date`.
