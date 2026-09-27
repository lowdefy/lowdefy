---
'@lowdefy/ajv': patch
'@lowdefy/api': patch
---

fix: Schema validation no longer grows server memory or fails on a schema with an `$id`.

- The shared ajv instance kept every schema object it compiled. A `ValidateSchema` step compiled a fresh copy of its schema on every call, and an endpoint's `payloadSchema` was compiled again whenever its config file was read again, so the server's memory grew for its whole life.
- A second copy of a schema with an `$id` failed with `schema with key or id ... already exists`: a `ValidateSchema` step with such a schema worked once and then failed on every call, and so did a `payloadSchema` after a dev rebuild or a config cache eviction.
