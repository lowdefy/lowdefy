---
name: lowdefy-data-schema
description: Use when designing the document shape for a collection — ids, embedded vs. referenced data, enums, stamps, versioning — before writing pages against it.
kind: recipe
lowdefyVersion: 5.5.1
---

# Data schema

<!-- generated:reference:start -->
## Reference

What this skill covers, and the call that returns the live version from the running dev server. Read these before writing config - never write a type name or property from memory.

### Docs

`lowdefy_get_doc` by slug (or `GET /lowdefy-docs/content/{slug}`): `connections/mongodb`, `operators/_type`.

### Operators

`lowdefy_get_schema` with kind `operators`: `_type` (`@lowdefy/operators-js`).

### Requests

`lowdefy_get_schema` with kind `requests`: `MongoDBInsertOne` (`@lowdefy/connection-mongodb`), `MongoDBVersionedUpdateOne` (`@lowdefy/connection-mongodb`).
<!-- generated:reference:end -->

## Recipe

Must cover: `_id` conventions, embedding vs. referencing, naming, required fields enforced in requests, `MongoDBVersionedUpdateOne` for history, and writing a `schema.yaml` beside the collection that pages and endpoints reference.
