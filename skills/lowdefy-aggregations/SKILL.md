---
name: lowdefy-aggregations
description: Use when a page or endpoint needs grouped, counted, joined or reshaped data from MongoDB — an aggregation pipeline behind a request, its payload filters, and the shape the page reads back.
kind: reference
lowdefyVersion: 5.5.1
---

# Aggregation requests

<!-- generated:reference:start -->
## Reference

What this skill covers, and the call that returns the live version from the running dev server. Read these before writing config - never write a type name or property from memory.

### Docs

`lowdefy_get_doc` by slug (or `GET /lowdefy-docs/content/{slug}`): `concepts/connections-and-requests`, `connections/mongodb`, `operators/_request`.

### Operators

`lowdefy_get_schema` with kind `operators`: `_request` (`@lowdefy/operators-js`), `_payload` (`@lowdefy/operators-js`).

### Connections

`lowdefy_get_schema` with kind `connections`: `MongoDBCollection` (`@lowdefy/connection-mongodb`).

### Requests

`lowdefy_get_schema` with kind `requests`: `MongoDBAggregation` (`@lowdefy/connection-mongodb`).
<!-- generated:reference:end -->

## Recipe

Must cover: when to aggregate instead of find, driving `$match` from `payload`, `$lookup` for joins, `$facet` for rows-plus-count, projecting only what the page reads, and where an aggregation belongs (request vs. Api endpoint).
