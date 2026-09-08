---
'@lowdefy/connection-mongodb': patch
---

fix(connection-mongodb): the tenant wall's write guard rejects the tenant field only where it names a document path. It recursed into the values of `$set` / `$push` / insert documents, so any stored data that happened to carry a key named after the tenant field — a chat transcript holding a tool result with `organization_id`, a snapshot of another document — failed the whole write with "Tenant field can not be set in an update". Only a top-level key of an update operator's argument (or of an insert / replacement document) can move a row across the wall, and that is now the only thing the guard scans; filters keep their deep scan, where nesting is operator structure rather than data.
